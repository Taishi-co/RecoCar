export class GetUsersDto {
  role?: string
  status?: string
}

export class UpdateUserStatusDto {
  status: 'active' | 'disabled'
}
