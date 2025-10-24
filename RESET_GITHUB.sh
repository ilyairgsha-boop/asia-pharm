#!/bin/bash

# 🔄 Скрипт полной очистки и перезапуска Git репозитория
# Используйте ТОЛЬКО если хотите начать с чистой истории!

set -e

echo "⚠️  ВНИМАНИЕ! Этот скрипт удалит всю историю Git!"
echo "Вы потеряете все коммиты и сможете восстановить только из бэкапа."
echo ""
read -p "Вы уверены? Введите 'yes' для продолжения: " confirm

if [ "$confirm" != "yes" ]; then
    echo "Отменено."
    exit 0
fi

echo ""
echo "🔄 Начинаем очистку..."
echo ""

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 1. Создаем бэкап (на всякий случай)
BACKUP_DIR="../asia-pharm-backup-$(date +%Y%m%d_%H%M%S)"
print_info "Создание бэкапа в $BACKUP_DIR..."
mkdir -p "$BACKUP_DIR"
cp -r . "$BACKUP_DIR/" 2>/dev/null || true
print_success "Бэкап создан"

# 2. Удаляем .git директорию
print_info "Удаление .git директории..."
rm -rf .git
print_success ".git удален"

# 3. Удаляем node_modules и lock файлы
print_info "Удаление node_modules и lock файлов..."
rm -rf node_modules
rm -f package-lock.json yarn.lock pnpm-lock.yaml
print_success "node_modules и lock файлы удалены"

# 4. Удаляем .supabase
print_info "Удаление .supabase..."
rm -rf .supabase
print_success ".supabase удален"

# 5. Создаем .gitignore если его нет
if [ ! -f ".gitignore" ]; then
    print_info "Создание .gitignore..."
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Production
dist/
build/

# Environment variables
.env
.env.local
.env.development
.env.test
.env.production

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*
.pnpm-debug.log*

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo
*.swn
*.bak

# Supabase local
.supabase/

# Vercel
.vercel/

# TypeScript
*.tsbuildinfo

# Temporary files
*.tmp
*.temp
.cache/
EOF
    print_success ".gitignore создан"
fi

# 6. Инициализируем новый репозиторий
print_info "Инициализация нового Git репозитория..."
git init
print_success "Git инициализирован"

# 7. Добавляем все файлы
print_info "Добавление файлов..."
git add .
print_success "Файлы добавлены"

# 8. Первый коммит
print_info "Создание первого коммита..."
git commit -m "Initial commit: Asia-Pharm e-commerce platform

Features:
- Multi-language support (RU, EN, CN, VI)
- 3 separate stores (China, Thailand, Vietnam)
- Loyalty program with auto cashback
- Promo codes system
- Wholesale prices in CNY
- Smart order numbering (DDMMNN)
- Admin panel with full management
- Supabase backend with Edge Functions
- Responsive design with Tailwind CSS v4"

print_success "Первый коммит создан"

# 9. Подключаем remote
REPO_URL="https://github.com/ilyairgsha-boop/asia-pharm.git"
print_info "Подключение к $REPO_URL..."
git remote add origin $REPO_URL
print_success "Remote подключен"

# 10. Спрашиваем о push
echo ""
echo "========================================="
print_success "Репозиторий готов к отправке!"
echo ""
print_info "Следующая команда перезапишет весь GitHub репозиторий:"
echo "  git push -u origin main --force"
echo ""
read -p "Выполнить push сейчас? (yes/no): " do_push

if [ "$do_push" == "yes" ]; then
    print_info "Отправка на GitHub..."
    git push -u origin main --force
    print_success "Успешно отправлено на GitHub!"
else
    print_info "Push отменен. Выполните вручную:"
    echo "  git push -u origin main --force"
fi

echo ""
echo "========================================="
print_success "Готово!"
echo ""
print_info "Что дальше:"
echo "1. Проверьте GitHub: https://github.com/ilyairgsha-boop/asia-pharm"
echo "2. Установите зависимости: npm install"
echo "3. Следуйте DEPLOY.md для деплоя на Supabase"
echo ""
print_info "Бэкап сохранен в: $BACKUP_DIR"
echo ""
