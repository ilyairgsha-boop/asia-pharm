-- Asia Farm Initial Database Schema
-- Migration: 20250123_initial_schema
-- Description: Creates all tables, functions, triggers, and policies for Asia Farm

-- ============================================
-- 1. Enable required extensions
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 2. User Profiles Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Loyalty Program
  loyalty_points INTEGER DEFAULT 0,
  loyalty_tier TEXT DEFAULT 'basic' CHECK (loyalty_tier IN ('basic', 'premium')),
  monthly_total DECIMAL(10,2) DEFAULT 0,
  last_tier_calculation DATE DEFAULT CURRENT_DATE,
  
  -- Roles
  is_admin BOOLEAN DEFAULT FALSE,
  is_wholesaler BOOLEAN DEFAULT FALSE
);

-- RLS Policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- ============================================
-- 3. Products Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Basic Information
  name TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_zh TEXT NOT NULL,
  name_vi TEXT NOT NULL,
  
  price DECIMAL(10,2) NOT NULL,
  wholesale_price DECIMAL(10,2),
  store TEXT NOT NULL CHECK (store IN ('china', 'thailand', 'vietnam')),
  weight DECIMAL(6,3) DEFAULT 0.1,
  
  -- Categorization
  category TEXT NOT NULL CHECK (category IN ('ointments', 'patches', 'elixirs', 'capsules', 'teas', 'oils', 'drops', 'samples', 'other')),
  disease TEXT NOT NULL CHECK (disease IN ('cold', 'digestive', 'skin', 'joints', 'headache', 'heart', 'liver', 'kidneys', 'oncology', 'nervous', 'womensHealth', 'mensHealth', 'forChildren', 'vision', 'eyes', 'hemorrhoids')),
  
  -- Descriptions
  description TEXT,
  description_en TEXT,
  description_zh TEXT,
  description_vi TEXT,
  
  -- Composition
  composition TEXT,
  composition_en TEXT,
  composition_zh TEXT,
  composition_vi TEXT,
  
  -- Usage Instructions
  usage TEXT,
  usage_en TEXT,
  usage_zh TEXT,
  usage_vi TEXT,
  
  -- Additional
  image TEXT,
  in_stock BOOLEAN DEFAULT TRUE,
  is_popular BOOLEAN DEFAULT FALSE,
  is_new BOOLEAN DEFAULT FALSE,
  is_sample BOOLEAN DEFAULT FALSE
);

-- RLS for products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view products"
  ON public.products FOR SELECT
  USING (TRUE);

CREATE POLICY "Only admins can create products"
  ON public.products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Only admins can update products"
  ON public.products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Only admins can delete products"
  ON public.products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- ============================================
-- 4. Orders Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Order number in format DDMMNN
  order_number TEXT UNIQUE NOT NULL,
  
  -- Relations
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  store TEXT NOT NULL CHECK (store IN ('china', 'thailand', 'vietnam')),
  
  -- Items (JSON)
  items JSONB NOT NULL,
  
  -- Amounts
  subtotal DECIMAL(10,2) NOT NULL,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  promo_discount DECIMAL(10,2) DEFAULT 0,
  loyalty_points_used INTEGER DEFAULT 0,
  total_price DECIMAL(10,2) NOT NULL,
  
  -- Delivery Information
  delivery_method TEXT NOT NULL,
  shipping_info JSONB NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'awaiting_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')),
  
  -- Tracking
  tracking_number TEXT,
  
  -- Promo code
  promo_code TEXT,
  
  -- Email notifications
  emails_sent JSONB DEFAULT '[]'::JSONB
);

-- RLS for orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders"
  ON public.orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Admins can update orders"
  ON public.orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- ============================================
-- 5. Promo Codes Table
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

-- RLS for promo_codes
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can check promo codes"
  ON public.promo_codes FOR SELECT
  USING (active = TRUE);

CREATE POLICY "Only admins manage promo codes"
  ON public.promo_codes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- ============================================
-- 6. Loyalty Transactions Table
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

-- RLS for loyalty_transactions
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their transactions"
  ON public.loyalty_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create transactions"
  ON public.loyalty_transactions FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Admins can view all transactions"
  ON public.loyalty_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- ============================================
-- 7. Pages Table (for editable content)
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

-- RLS for pages
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read pages"
  ON public.pages FOR SELECT
  USING (TRUE);

CREATE POLICY "Only admins can edit pages"
  ON public.pages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- ============================================
-- 8. Settings Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Initial Settings
INSERT INTO public.settings (key, value, description) VALUES
  ('telegram_link', 'https://t.me/asiafarm_support', 'Telegram support link'),
  ('whatsapp_link', 'https://wa.me/YOUR_PHONE_NUMBER', 'WhatsApp support link'),
  ('email_from', 'info@asia-pharm.ru', 'Email sender address'),
  ('free_shipping_threshold', '8000', 'Free shipping threshold in RUB'),
  ('loyalty_tier1_threshold', '10000', 'Premium tier threshold in RUB'),
  ('loyalty_tier1_percent', '5', 'Basic tier cashback percent'),
  ('loyalty_tier2_percent', '10', 'Premium tier cashback percent')
ON CONFLICT (key) DO NOTHING;

-- RLS for settings
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read settings"
  ON public.settings FOR SELECT
  USING (TRUE);

CREATE POLICY "Only admins can change settings"
  ON public.settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- ============================================
-- 9. KV Store Table (for Edge Functions)
-- ============================================

CREATE TABLE IF NOT EXISTS public.kv_store_a75b5353 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for kv_store
ALTER TABLE public.kv_store_a75b5353 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service can work with KV store"
  ON public.kv_store_a75b5353 FOR ALL
  USING (TRUE);

-- ============================================
-- 10. Functions and Triggers
-- ============================================

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
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

-- Function to generate order number in format DDMMNN
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  today_date TEXT;
  today_count INTEGER;
  order_num TEXT;
BEGIN
  -- Get current date in format DDMM
  today_date := TO_CHAR(CURRENT_DATE, 'DDMM');
  
  -- Count orders for today
  SELECT COUNT(*) INTO today_count
  FROM public.orders
  WHERE order_number LIKE today_date || '%';
  
  -- Format order number
  order_num := today_date || LPAD((today_count + 1)::TEXT, 2, '0');
  
  RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate order number
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

-- Function to calculate loyalty points after order delivery
CREATE OR REPLACE FUNCTION calculate_loyalty_points()
RETURNS TRIGGER AS $$
DECLARE
  points_earned INTEGER;
  cashback_percent INTEGER;
  user_monthly_total DECIMAL(10,2);
BEGIN
  -- Check if order is delivered
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    
    -- Get user monthly total
    SELECT monthly_total INTO user_monthly_total
    FROM public.profiles
    WHERE id = NEW.user_id;
    
    -- Determine cashback percent
    IF user_monthly_total >= 10000 THEN
      cashback_percent := 10;
    ELSE
      cashback_percent := 5;
    END IF;
    
    -- Calculate points (only on subtotal, not shipping)
    points_earned := FLOOR(NEW.subtotal * cashback_percent / 100);
    
    -- Award points
    UPDATE public.profiles
    SET loyalty_points = loyalty_points + points_earned
    WHERE id = NEW.user_id;
    
    -- Record transaction
    INSERT INTO public.loyalty_transactions (user_id, order_id, type, points, description)
    VALUES (
      NEW.user_id,
      NEW.id,
      'earned',
      points_earned,
      'Cashback for order #' || NEW.order_number
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_loyalty_points_trigger
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION calculate_loyalty_points();

-- Function to update monthly total and tier
CREATE OR REPLACE FUNCTION update_monthly_total()
RETURNS TRIGGER AS $$
DECLARE
  current_month_start DATE;
  month_total DECIMAL(10,2);
  new_tier TEXT;
BEGIN
  -- Start of current month
  current_month_start := DATE_TRUNC('month', CURRENT_DATE)::DATE;
  
  -- Check if need to reset monthly counter
  UPDATE public.profiles
  SET monthly_total = 0, last_tier_calculation = CURRENT_DATE
  WHERE id = NEW.user_id 
    AND last_tier_calculation < current_month_start;
  
  -- Calculate sum of orders for current month
  SELECT COALESCE(SUM(total_price), 0) INTO month_total
  FROM public.orders
  WHERE user_id = NEW.user_id
    AND created_at >= current_month_start
    AND status IN ('paid', 'processing', 'shipped', 'delivered');
  
  -- Determine tier
  IF month_total >= 10000 THEN
    new_tier := 'premium';
  ELSE
    new_tier := 'basic';
  END IF;
  
  -- Update profile
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
-- 11. Performance Indexes
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
-- Migration Complete
-- ============================================
