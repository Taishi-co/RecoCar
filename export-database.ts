import { getSupabaseClient } from './server/src/storage/database/supabase-client';
import * as fs from 'fs';
import * as path from 'path';

// 需要导出的表
const TABLES = [
  'users',
  'demands',
  'vehicles',
  'orders',
  'cancellation_requests',
  'notifications',
  'platform_settings',
];

async function exportDatabase() {
  console.log('开始导出数据库...');

  const client = getSupabaseClient();
  const exportDir = path.join(process.cwd(), 'database-export');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  // 创建导出目录
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  // 导出表结构
  console.log('\n正在导出表结构...');
  let schemaSQL = '-- Database Schema\n-- Generated at: ' + new Date().toISOString() + '\n\n';

  for (const tableName of TABLES) {
    console.log(`  - 导出表结构: ${tableName}`);

    // 获取表结构
    const { data: columns, error } = await client
      .from(tableName)
      .select('*')
      .limit(1);

    if (error) {
      console.error(`    错误: ${error.message}`);
      continue;
    }

    if (!columns || columns.length === 0) {
      schemaSQL += `-- 表 ${tableName} 为空\n\n`;
      continue;
    }

    // 生成 CREATE TABLE 语句（简化版）
    const columnDefs = Object.keys(columns[0]).map(col => {
      return `  ${col} TEXT`;  // 简化类型定义
    }).join(',\n');

    schemaSQL += `CREATE TABLE IF NOT EXISTS ${tableName} (\n${columnDefs}\n);\n\n`;
  }

  const schemaFile = path.join(exportDir, `schema-${timestamp}.sql`);
  fs.writeFileSync(schemaFile, schemaSQL);
  console.log(`✓ 表结构已导出到: ${schemaFile}`);

  // 导出数据
  console.log('\n正在导出数据...');
  let dataJSON = {
    exported_at: new Date().toISOString(),
    tables: {}
  };

  for (const tableName of TABLES) {
    console.log(`  - 导出数据: ${tableName}`);

    const { data: rows, error } = await client
      .from(tableName)
      .select('*');

    if (error) {
      console.error(`    错误: ${error.message}`);
      continue;
    }

    dataJSON.tables[tableName] = rows || [];
    console.log(`    ✓ ${rows?.length || 0} 条记录`);
  }

  const dataFile = path.join(exportDir, `data-${timestamp}.json`);
  fs.writeFileSync(dataFile, JSON.stringify(dataJSON, null, 2));
  console.log(`\n✓ 数据已导出到: ${dataFile}`);

  // 生成统计信息
  console.log('\n数据库统计:');
  console.log('='.repeat(50));

  for (const tableName of TABLES) {
    const count = dataJSON.tables[tableName]?.length || 0;
    console.log(`  ${tableName.padEnd(30)} ${count} 条记录`);
  }

  console.log('\n='.repeat(50));
  console.log(`\n✓ 数据库导出完成！`);
  console.log(`导出目录: ${exportDir}`);
}

exportDatabase().catch(error => {
  console.error('导出失败:', error);
  process.exit(1);
});
