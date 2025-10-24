#!/bin/bash

# 🚀 Быстрый запуск локального dev сервера
# Asia-Pharm E-commerce

set -e

# Цвета
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🌿 Asia-Pharm - Локальный запуск"
echo "================================="
echo ""

# Проверка Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен!"
    echo "Установите: https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node --version)${NC}"

# Проверка npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm не установлен!"
    exit 1
fi

echo -e "${GREEN}✅ npm $(npm --version)${NC}"
echo ""

# Проверка node_modules
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Установка зависимостей...${NC}"
    npm install
    echo -e "${GREEN}✅ Зависимости установлены${NC}"
    echo ""
else
    echo -e "${GREEN}✅ Зависимости уже установлены${NC}"
    echo ""
fi

# Запуск dev сервера
echo -e "${YELLOW}🚀 Запуск dev сервера...${NC}"
echo ""
echo "Сервер будет доступен по адресу:"
echo "  http://localhost:5173"
echo ""
echo "Нажмите Ctrl+C для остановки"
echo ""

npm run dev
