-- Скрипт для настройки базы данных Asia-Pharm.ru в Supabase
-- Выполните этот скрипт в SQL Editor вашего Supabase проекта

-- ============================================
-- 1. Таблица пользователей (расширение auth.users)
-- ============================================

-- Создаем таблицу профилей пользователей
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Программа лояльности
  loyalty_points INTEGER DEFAULT 0,
  loyalty_tier TEXT DEFAULT 'basic' CHECK (loyalty_tier IN ('basic', 'premium')),
  monthly_total DECIMAL(10,2) DEFAULT 0,
  last_tier_calculation DATE DEFAULT CURRENT_DATE,
  
  -- Роли
  is_admin BOOLEAN DEFAULT FALSE
);

-- RLS политики для profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Пользователи могут видеть свой профиль"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Пользователи могут обновлять свой профиль"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Админы видят все профили"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- ============================================
-- 2. Таблица товаров
-- ============================================

CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Основная информация
  name TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_zh TEXT NOT NULL,
  name_vi TEXT NOT NULL,
  
  price DECIMAL(10,2) NOT NULL,
  store TEXT NOT NULL CHECK (store IN ('china', 'thailand', 'vietnam')),
  weight DECIMAL(6,3) DEFAULT 0.1, -- вес в кг
  
  -- Категоризация
  category TEXT NOT NULL CHECK (category IN ('ointments', 'patches', 'elixirs', 'capsules', 'teas', 'oils', 'samples', 'other')),
  disease TEXT NOT NULL CHECK (disease IN ('cold', 'digestive', 'skin', 'joints', 'headache', 'heart', 'liver', 'kidneys', 'oncology', 'nervous', 'womensHealth', 'mensHealth', 'forChildren', 'vision', 'hemorrhoids')),
  
  -- Описания
  description TEXT,
  description_en TEXT,
  description_zh TEXT,
  description_vi TEXT,
  
  -- Состав
  composition TEXT,
  composition_en TEXT,
  composition_zh TEXT,
  composition_vi TEXT,
  
  -- Применение
  usage TEXT,
  usage_en TEXT,
  usage_zh TEXT,
  usage_vi TEXT,
  
  -- Дополнительно
  image TEXT,
  in_stock BOOLEAN DEFAULT TRUE,
  is_popular BOOLEAN DEFAULT FALSE,
  is_new BOOLEAN DEFAULT FALSE,
  is_sample BOOLEAN DEFAULT FALSE -- Пробник (только для магазина Китай)
);

-- RLS для products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Все могут видеть товары"
  ON public.products FOR SELECT
  USING (TRUE);

CREATE POLICY "Только админы могут создавать товары"
  ON public.products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Только админы могут обновлять товары"
  ON public.products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Только админы могут удалять товары"
  ON public.products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- ============================================
-- 3. Таблица заказов
-- ============================================

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Номер заказа в формате DDMMNN
  order_number TEXT UNIQUE NOT NULL,
  
  -- Связи
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  store TEXT NOT NULL CHECK (store IN ('china', 'thailand', 'vietnam')),
  
  -- Товары (JSON)
  items JSONB NOT NULL,
  
  -- Суммы
  subtotal DECIMAL(10,2) NOT NULL,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  promo_discount DECIMAL(10,2) DEFAULT 0,
  loyalty_points_used INTEGER DEFAULT 0,
  total_price DECIMAL(10,2) NOT NULL,
  
  -- Информация о доставке
  delivery_method TEXT NOT NULL,
  shipping_info JSONB NOT NULL,
  
  -- Статус
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'awaiting_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')),
  
  -- Трекинг
  tracking_number TEXT,
  
  -- Промокод
  promo_code TEXT,
  
  -- Email уведомления
  emails_sent JSONB DEFAULT '[]'::JSONB
);

-- RLS для orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Пользователи видят свои заказы"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Пользователи могут создавать заказы"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Админы видят все заказы"
  ON public.orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Админы могут обновлять заказы"
  ON public.orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- ============================================
-- 4. Таблица промокодов
-- ============================================

CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'amount')),
  discount_value DECIMAL(10,2) NOT NULL,
  
  expiry_date DATE,
  usage_limit INTEGER,
  times_used INTEGER DEFAULT 0,
  
  active BOOLEAN DEFAULT TRUE
);

-- RLS для promo_codes
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Все могут проверять промокоды"
  ON public.promo_codes FOR SELECT
  USING (active = TRUE);

CREATE POLICY "Только админы управляют промокодами"
  ON public.promo_codes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- ============================================
-- 5. Таблица транзакций лояльности
-- ============================================

CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  
  type TEXT NOT NULL CHECK (type IN ('earned', 'spent', 'expired')),
  points INTEGER NOT NULL,
  description TEXT
);

-- RLS для loyalty_transactions
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Пользователи видят свои транзакции"
  ON public.loyalty_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Система может создавать транзакции"
  ON public.loyalty_transactions FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Админы видят все транзакции"
  ON public.loyalty_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- ============================================
-- 6. Таблица редактируемых страниц
-- ============================================

CREATE TABLE IF NOT EXISTS public.pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  page_type TEXT NOT NULL CHECK (page_type IN ('privacy-policy', 'terms-of-service')),
  language TEXT NOT NULL CHECK (language IN ('ru', 'en', 'zh', 'vi')),
  content TEXT,
  
  UNIQUE(page_type, language)
);

-- RLS для pages
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Все могут читать страницы"
  ON public.pages FOR SELECT
  USING (TRUE);

CREATE POLICY "Только админы могут редактировать страницы"
  ON public.pages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- ============================================
-- 7. Таблица настроек сайта
-- ============================================

CREATE TABLE IF NOT EXISTS public.settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Начальные настройки
INSERT INTO public.settings (key, value, description) VALUES
  ('telegram_link', 'https://t.me/your_username', 'Ссылка на Telegram для чата'),
  ('whatsapp_link', 'https://wa.me/YOUR_PHONE_NUMBER', 'Ссылка на WhatsApp для чата'),
  ('email_from', 'info@asia-pharm.ru', 'Email отправителя'),
  ('free_shipping_threshold', '8000', 'Порог бесплатной доставки в рублях'),
  ('loyalty_tier1_threshold', '10000', 'Порог для премиум уровня лояльности'),
  ('loyalty_tier1_percent', '5', 'Процент кэшбэка базового уровня'),
  ('loyalty_tier2_percent', '10', 'Процент кэшбэка премиум уровня')
ON CONFLICT (key) DO NOTHING;

-- RLS для settings
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Все могут читать настройки"
  ON public.settings FOR SELECT
  USING (TRUE);

CREATE POLICY "Только админы могут изменять настройки"
  ON public.settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- ============================================
-- 8. Таблица KV Store (для Edge Functions)
-- ============================================

CREATE TABLE IF NOT EXISTS public.kv_store_a75b5353 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS для kv_store
ALTER TABLE public.kv_store_a75b5353 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Сервис может работать с KV store"
  ON public.kv_store_a75b5353 FOR ALL
  USING (TRUE);

-- ============================================
-- 9. Функции и триггеры
-- ============================================

-- Функция для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггеры для обновления updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON public.pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Функция для генерации номера заказа в формате DDMMNN
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  today_date TEXT;
  today_count INTEGER;
  order_num TEXT;
BEGIN
  -- Получаем текущую дату в формате DDMM
  today_date := TO_CHAR(CURRENT_DATE, 'DDMM');
  
  -- Считаем количество заказов за сегодня
  SELECT COUNT(*) INTO today_count
  FROM public.orders
  WHERE order_number LIKE today_date || '%';
  
  -- Формируем номер заказа
  order_num := today_date || LPAD((today_count + 1)::TEXT, 2, '0');
  
  RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматической генерации номера заказа
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number_trigger
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();

-- Функция для расчета кэшбэка после выполнения заказа
CREATE OR REPLACE FUNCTION calculate_loyalty_points()
RETURNS TRIGGER AS $$
DECLARE
  points_earned INTEGER;
  cashback_percent INTEGER;
  user_monthly_total DECIMAL(10,2);
BEGIN
  -- Проверяем что заказ выполнен
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    
    -- Получаем месячную сумму пользователя
    SELECT monthly_total INTO user_monthly_total
    FROM public.profiles
    WHERE id = NEW.user_id;
    
    -- Определяем процент кэшбэка
    IF user_monthly_total >= 10000 THEN
      cashback_percent := 10;
    ELSE
      cashback_percent := 5;
    END IF;
    
    -- Рассчитываем баллы (только с суммы товаров, без доставки)
    points_earned := FLOOR(NEW.subtotal * cashback_percent / 100);
    
    -- Начисляем баллы
    UPDATE public.profiles
    SET loyalty_points = loyalty_points + points_earned
    WHERE id = NEW.user_id;
    
    -- Записываем транзакцию
    INSERT INTO public.loyalty_transactions (user_id, order_id, type, points, description)
    VALUES (
      NEW.user_id,
      NEW.id,
      'earned',
      points_earned,
      'Кэшбэк за заказ №' || NEW.order_number
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_loyalty_points_trigger
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION calculate_loyalty_points();

-- Функция для обновления месячной суммы и уровня
CREATE OR REPLACE FUNCTION update_monthly_total()
RETURNS TRIGGER AS $$
DECLARE
  current_month_start DATE;
  month_total DECIMAL(10,2);
  new_tier TEXT;
BEGIN
  -- Начало текущего месяца
  current_month_start := DATE_TRUNC('month', CURRENT_DATE)::DATE;
  
  -- Проверяем нужно ли сбросить месячный счетчик
  UPDATE public.profiles
  SET monthly_total = 0, last_tier_calculation = CURRENT_DATE
  WHERE id = NEW.user_id 
    AND last_tier_calculation < current_month_start;
  
  -- Рассчитываем сумму заказов за текущий месяц
  SELECT COALESCE(SUM(total_price), 0) INTO month_total
  FROM public.orders
  WHERE user_id = NEW.user_id
    AND created_at >= current_month_start
    AND status IN ('paid', 'processing', 'shipped', 'delivered');
  
  -- Определяем уровень
  IF month_total >= 10000 THEN
    new_tier := 'premium';
  ELSE
    new_tier := 'basic';
  END IF;
  
  -- Обновляем профиль
  UPDATE public.profiles
  SET 
    monthly_total = month_total,
    loyalty_tier = new_tier
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_monthly_total_trigger
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION update_monthly_total();

-- ============================================
-- 10. Индексы для производительности
-- ============================================

CREATE INDEX IF NOT EXISTS idx_products_store ON public.products(store);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_disease ON public.products(disease);
CREATE INDEX IF NOT EXISTS idx_products_popular ON public.products(is_popular) WHERE is_popular = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_new ON public.products(is_new) WHERE is_new = TRUE;

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);

CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user_id ON public.loyalty_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_created_at ON public.loyalty_transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON public.promo_codes(code) WHERE active = TRUE;

-- ============================================
-- ГОТОВО!
-- ============================================

-- После выполнения этого скрипта:
-- 1. Создайте первого админа через SQL:
--    UPDATE public.profiles SET is_admin = TRUE WHERE email = 'your-email@example.com';
-- 
-- 2. Или используйте скрипт из файла MAKE_ADMIN_SQL.md
