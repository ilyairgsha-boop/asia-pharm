# 📝 История изменений

## 2025-01-23 - Полная реструктуризация документации

### ✅ Что было сделано

#### 🗑️ Удалены старые файлы документации (28 файлов)
- Удалены все устаревшие MD файлы с дублирующейся информацией
- Удалены старые workflow файлы

#### 📝 Создана новая документация

**Основные файлы:**
- ✅ **SETUP.md** - Единая полная инструкция по развертыванию (30+ страниц)
- ✅ **README.md** - Обновленный README с актуальной информацией
- ✅ **START.md** - Краткая стартовая страница
- ✅ **.env.example** - Пример переменных окружения

#### 🔧 Обновлены конфигурации

**Обновлен Supabase Project ID** с `datoomsnmfuodecpbmpn` на `hohhzspiylssmgdivajk`:
- ✅ `supabase/config.toml`
- ✅ `.github/workflows/deploy.yml`
- ✅ `scripts/create-admin.sh`
- ✅ `scripts/deploy-functions.sh`
- ✅ `scripts/setup.sh`
- ✅ `CREATE_ADMIN.sql`
- ✅ `.env.example`

**Обновлен GitHub Repository** с `ilyairgsha-boop/asia-farm` на `ilyairgsha-boop/asia-pharm`:
- ✅ Все ссылки в документации
- ✅ GitHub Actions workflows
- ✅ README.md

**Обновлен брендинг** с "Asia Farm" на "Asia Pharm":
- ✅ Все упоминания в документации
- ✅ CREATE_ADMIN.sql (email по умолчанию)
- ✅ Конфигурационные файлы

### 📊 Статистика

**Было**:
- 28 файлов документации (много дублирующейся информации)
- Устаревшие данные проекта
- Сложная навигация

**Стало**:
- 3 основных файла документации (четкая структура)
- Актуальные данные проекта
- Простая навигация: START.md → SETUP.md

### 🎯 Что теперь нужно сделать

1. **Откройте [START.md](./START.md)**
2. **Следуйте ссылке на [SETUP.md](./SETUP.md)**
3. **Выполните 5 шагов развертывания (25-30 минут)**

### 📋 Новая структура документации

```
📄 START.md              ← Начните здесь (краткая страница)
    ↓
📖 SETUP.md              ← Полная инструкция (все 5 шагов)
    ↓
📘 README.md             ← Информация о проекте
    ↓
📑 CREATE_ADMIN.sql      ← SQL для создания админа
📑 INIT_DEMO_DATA.sql    ← Демо-данные
📑 .env.example          ← Пример переменных окружения
```

### 🔗 Актуальные данные проекта

**Supabase**:
- Project ID: `hohhzspiylssmgdivajk`
- URL: https://hohhzspiylssmgdivajk.supabase.co

**GitHub**:
- Repository: https://github.com/ilyairgsha-boop/asia-pharm

**Vercel**:
- URL после развертывания: https://asia-pharm.vercel.app

---

**Дата обновления**: 2025-01-23  
**Версия**: 2.0  
**Статус**: ✅ Готово к развертыванию
