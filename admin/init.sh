#!/bin/bash

echo "🚀 初始化管理后台项目..."
echo ""

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误：请在 admin 目录下运行此脚本"
    exit 1
fi

# 检查 pnpm 是否安装
if ! command -v pnpm &> /dev/null; then
    echo "❌ 错误：pnpm 未安装，请先安装 pnpm"
    echo "   安装命令: npm install -g pnpm"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖..."
pnpm install

if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败"
    exit 1
fi

echo ""
echo "✅ 依赖安装完成！"
echo ""
echo "📝 快速开始："
echo "   开发环境: pnpm dev"
echo "   构建: pnpm build"
echo "   预览: pnpm preview"
echo ""
echo "🌐 访问地址: http://localhost:5173"
echo ""
echo "🔑 默认登录信息："
echo "   用户名: admin"
echo "   密码: admin123"
echo ""
