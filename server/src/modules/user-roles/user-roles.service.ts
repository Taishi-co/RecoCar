import { Injectable, ConflictException, NotFoundException } from '@nestjs/common'
import { CreateRoleDto, SwitchRoleDto } from './dto/user-roles.dto'
import { getSupabaseClient } from '@/storage/database/supabase-client'

@Injectable()
export class UserRolesService {
  async getUserRoles(userId: string) {
    console.log('[UserRolesService] 获取用户角色 - userId:', userId)

    const client = getSupabaseClient()

    const { data: roles, error } = await client
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      throw new NotFoundException(`查询失败: ${error.message}`)
    }

    // 如果没有角色记录，获取用户的默认角色并创建一条记录
    if (!roles || roles.length === 0) {
      console.log('[UserRolesService] 用户没有角色记录，获取默认角色')

      const { data: user, error: userError } = await client
        .from('users')
        .select('role')
        .eq('id', userId)
        .maybeSingle()

      if (userError || !user) {
        throw new NotFoundException('用户不存在')
      }

      // 创建默认角色记录
      const { data: newRole, error: insertError } = await client
        .from('user_roles')
        .insert({
          user_id: userId,
          role: user.role,
          is_active: true,
          status: 'active'
        })
        .select()
        .single()

      if (insertError) {
        throw new ConflictException(`创建默认角色失败: ${insertError.message}`)
      }

      console.log('[UserRolesService] 创建默认角色记录成功:', newRole)

      return {
        code: 200,
        message: '查询成功',
        data: [newRole]
      }
    }

    return {
      code: 200,
      message: '查询成功',
      data: roles || []
    }
  }

  async createRole(createRoleDto: CreateRoleDto) {
    const { userId, role } = createRoleDto
    console.log('[UserRolesService] 创建用户角色 - userId:', userId, 'role:', role)

    const client = getSupabaseClient()

    // 检查用户是否已拥有该角色
    const { data: existingRole, error: checkError } = await client
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('role', role)
      .eq('status', 'active')
      .maybeSingle()

    if (checkError) {
      throw new ConflictException(`查询失败: ${checkError.message}`)
    }

    if (existingRole) {
      throw new ConflictException('您已经拥有该角色，无需重复创建')
    }

    // 获取用户的当前所有角色
    const { data: allRoles, error: allRolesError } = await client
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')

    if (allRolesError) {
      throw new ConflictException(`查询失败: ${allRolesError.message}`)
    }

    // 如果这是用户的第一个角色，自动激活
    const isFirstRole = !allRoles || allRoles.length === 0

    // 创建新角色
    const { data: newRole, error: insertError } = await client
      .from('user_roles')
      .insert({
        user_id: userId,
        role,
        is_active: isFirstRole,
        status: 'active'
      })
      .select()
      .single()

    if (insertError) {
      throw new ConflictException(`创建角色失败: ${insertError.message}`)
    }

    // 如果是第一个角色，更新用户的默认角色
    if (isFirstRole) {
      await client
        .from('users')
        .update({ role })
        .eq('id', userId)
    }

    return {
      code: 200,
      message: '角色创建成功',
      data: newRole
    }
  }

  async switchRole(switchRoleDto: SwitchRoleDto) {
    const { userId, roleId } = switchRoleDto
    console.log('[UserRolesService] 切换用户角色 - userId:', userId, 'roleId:', roleId)

    const client = getSupabaseClient()

    // 查询要激活的角色
    const { data: targetRole, error: targetError } = await client
      .from('user_roles')
      .select('*')
      .eq('id', roleId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (targetError || !targetRole) {
      throw new NotFoundException('角色不存在或已被禁用')
    }

    // 将该用户的所有角色设置为未激活
    await client
      .from('user_roles')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('status', 'active')

    // 激活目标角色
    const { data: updatedRole, error: updateError } = await client
      .from('user_roles')
      .update({ is_active: true })
      .eq('id', roleId)
      .select()
      .single()

    if (updateError) {
      throw new ConflictException(`切换角色失败: ${updateError.message}`)
    }

    // 更新用户的默认角色
    await client
      .from('users')
      .update({ role: targetRole.role })
      .eq('id', userId)

    // 获取更新后的用户完整信息
    const { data: user, error: userError } = await client
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError) {
      throw new ConflictException(`查询用户信息失败: ${userError.message}`)
    }

    // 查询用户的所有角色
    const { data: allRoles, error: rolesError } = await client
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')

    if (rolesError) {
      console.error('[UserRolesService] 查询所有角色失败:', rolesError)
    }

    console.log('[UserRolesService] 角色切换成功 - 新角色:', targetRole.role, '用户ID:', user.id)

    // 返回完整的用户信息和角色列表，方便前端更新 storage
    return {
      code: 200,
      message: '角色切换成功',
      data: {
        id: user.id,
        username: user.username,
        phone: user.phone,
        name: user.name,
        role: targetRole.role, // 当前激活的角色
        avatar_url: user.avatar_url,
        wechat_payment_qr: user.wechat_payment_qr,
        credit_score: user.credit_score,
        created_at: user.created_at,
        roles: allRoles?.map(r => r.role) || [], // 用户拥有的所有角色
        switchTime: new Date().toISOString() // 角色切换时间
      }
    }
  }

  async getActiveRole(userId: string) {
    console.log('[UserRolesService] 获取当前激活角色 - userId:', userId)

    const client = getSupabaseClient()

    const { data: activeRole, error } = await client
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .eq('status', 'active')
      .single()

    if (error || !activeRole) {
      // 如果没有激活的角色，返回用户的默认角色
      const { data: user, error: userError } = await client
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()

      if (userError || !user) {
        throw new NotFoundException('用户不存在')
      }

      // 检查用户是否有该角色的记录
      const { data: roleRecord, error: roleError } = await client
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('role', user.role)
        .eq('status', 'active')
        .maybeSingle()

      if (roleError) {
        throw new ConflictException(`查询失败: ${roleError.message}`)
      }

      // 如果没有记录，创建一个
      if (!roleRecord) {
        const { data: newRole, error: insertError } = await client
          .from('user_roles')
          .insert({
            user_id: userId,
            role: user.role,
            is_active: true,
            status: 'active'
          })
          .select()
          .single()

        if (insertError) {
          throw new ConflictException(`创建角色记录失败: ${insertError.message}`)
        }

        return {
          code: 200,
          message: '查询成功',
          data: newRole
        }
      }

      // 如果有记录，激活它
      await client
        .from('user_roles')
        .update({ is_active: true })
        .eq('id', roleRecord.id)

      return {
        code: 200,
        message: '查询成功',
        data: { ...roleRecord, is_active: true }
      }
    }

    return {
      code: 200,
      message: '查询成功',
      data: activeRole
    }
  }
}
