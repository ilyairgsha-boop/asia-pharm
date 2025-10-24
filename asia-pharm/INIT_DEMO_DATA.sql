-- ============================================
-- Скрипт для инициализации демо-данных
-- ============================================
-- 
-- Этот скрипт добавляет тестовые товары и промокоды
-- для быстрого тестирования функционала магазина
--
-- ВНИМАНИЕ: Выполняйте только ПОСЛЕ создания администратора!
--
-- ============================================

-- ============================================
-- 1. Добавляем тестовые товары из КИТАЯ
-- ============================================

-- Тигровый бальзам
INSERT INTO public.products (
  name, name_en, name_zh, name_vi,
  price, weight, category, disease, store,
  description, description_en, description_zh, description_vi,
  composition, composition_en, composition_zh, composition_vi,
  usage, usage_en, usage_zh, usage_vi,
  image, in_stock, is_popular, is_sample
) VALUES (
  'Тигровый бальзам',
  'Tiger Balm',
  '虎标万金油',
  'Dầu con hổ',
  599.00, 0.05, 'ointments', 'joints', 'china',
  'Традиционный китайский бальзам для снятия боли в мышцах и суставах',
  'Traditional Chinese balm for muscle and joint pain relief',
  '传统中国膏药，用于缓解肌肉和关节疼痛',
  'Dầu truyền thống Trung Quốc giảm đau cơ và khớp',
  'Ментол, камфора, масло гвоздики',
  'Menthol, camphor, clove oil',
  '薄荷醇、樟脑、丁香油',
  'Bạc hà, long não, dầu đinh hương',
  'Наносить на больные участки 2-3 раза в день',
  'Apply to affected areas 2-3 times daily',
  '每天涂抹患处2-3次',
  'Bôi vào vùng bị đau 2-3 lần mỗi ngày',
  'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800',
  true, true, false
);

-- Женьшеневые капсулы
INSERT INTO public.products (
  name, name_en, name_zh, name_vi,
  price, weight, category, disease, store,
  description, description_en, description_zh, description_vi,
  composition, composition_en, composition_zh, composition_vi,
  usage, usage_en, usage_zh, usage_vi,
  image, in_stock, is_popular, is_sample
) VALUES (
  'Женьшеневые капсулы',
  'Ginseng Capsules',
  '人参胶囊',
  'Viên nang nhân sâm',
  1200.00, 0.08, 'capsules', 'nervous', 'china',
  'Капсулы с экстрактом корня женьшеня для повышения энергии и укрепления иммунитета',
  'Ginseng root extract capsules for energy and immunity boost',
  '人参根提取物胶囊，增强能量和免疫力',
  'Viên nang chiết xuất rễ nhân sâm tăng cường năng lượng và miễn dịch',
  'Экстракт корня женьшеня, витамин С',
  'Ginseng root extract, vitamin C',
  '人参根提取物、维生素C',
  'Chiết xuất rễ nhân sâm, vitamin C',
  'Принимать по 1-2 капсулы утром',
  'Take 1-2 capsules in the morning',
  '每天早上服用1-2粒',
  'Uống 1-2 viên vào buổi sáng',
  'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800',
  true, true, false
);

-- Китайский лечебный пластырь
INSERT INTO public.products (
  name, name_en, name_zh, name_vi,
  price, weight, category, disease, store,
  description, description_en, description_zh, description_vi,
  composition, composition_en, composition_zh, composition_vi,
  usage, usage_en, usage_zh, usage_vi,
  image, in_stock, is_popular, is_sample
) VALUES (
  'Китайский лечебный пластырь для суставов',
  'Chinese Joint Pain Relief Patch',
  '中国关节止痛贴',
  'Miếng dán giảm đau khớp Trung Quốc',
  850.00, 0.03, 'patches', 'joints', 'china',
  'Согревающий пластырь с травяными экстрактами для облегчения боли в суставах',
  'Warming patch with herbal extracts for joint pain relief',
  '含草药提取物的温热贴膏，缓解关节疼痛',
  'Miếng dán ấm với chiết xuất thảo dược giảm đau khớp',
  'Камфора, ментол, экстракт перца',
  'Camphor, menthol, pepper extract',
  '樟脑、薄荷醇、辣椒提取物',
  'Long não, bạc hà, chiết xuất ớt',
  'Наклеить на болевую зону, носить 8-12 часов',
  'Apply to pain area, wear for 8-12 hours',
  '贴于疼痛区域，佩戴8-12小时',
  'Dán vào vùng đau, đeo trong 8-12 giờ',
  'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800',
  true, false, false
);

-- Пробник: Мазь от геморроя
INSERT INTO public.products (
  name, name_en, name_zh, name_vi,
  price, weight, category, disease, store,
  description, description_en, description_zh, description_vi,
  composition, composition_en, composition_zh, composition_vi,
  usage, usage_en, usage_zh, usage_vi,
  image, in_stock, is_popular, is_sample
) VALUES (
  'Мазь от геморроя (Пробник)',
  'Hemorrhoid Ointment (Sample)',
  '痔疮软膏（样品）',
  'Thuốc mỡ trĩ (Mẫu thử)',
  250.00, 0.02, 'samples', 'hemorrhoids', 'china',
  'Пробник китайской мази от геморроя на основе мускуса',
  'Sample of Chinese hemorrhoid ointment based on musk',
  '基于麝香的中国痔疮软膏样品',
  'Mẫu thuốc mỡ trĩ Trung Quốc từ xạ hương',
  'Мускус, борнеол, каламин',
  'Musk, borneol, calamine',
  '麝香、冰片、炉甘石',
  'Xạ hương, long não, calamine',
  'Наносить тонким слоем 2-3 раза в день',
  'Apply a thin layer 2-3 times daily',
  '每天涂抹薄层2-3次',
  'Bôi một lớp mỏng 2-3 lần mỗi ngày',
  'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800',
  true, false, true
);

-- ============================================
-- 2. Добавляем тестовые товары из ТАИЛАНДА
-- ============================================

-- Травяной чай для пищеварения
INSERT INTO public.products (
  name, name_en, name_zh, name_vi,
  price, weight, category, disease, store,
  description, description_en, description_zh, description_vi,
  composition, composition_en, composition_zh, composition_vi,
  usage, usage_en, usage_zh, usage_vi,
  image, in_stock, is_popular, is_sample
) VALUES (
  'Травяной чай для пищеварения',
  'Digestive Herbal Tea',
  '消化草药茶',
  'Trà thảo dược tiêu hóa',
  450.00, 0.1, 'teas', 'digestive', 'thailand',
  'Тайский травяной чай для улучшения пищеварения',
  'Thai herbal tea for improved digestion',
  '泰国草药茶，改善消化',
  'Trà thảo dược Thái Lan cải thiện tiêu hóa',
  'Имбирь, лемонграсс, мята',
  'Ginger, lemongrass, mint',
  '姜、柠檬草、薄荷',
  'Gừng, sả, bạc hà',
  'Заваривать 1 пакетик на стакан кипятка, настаивать 5 минут',
  'Brew 1 bag per cup of boiling water, steep for 5 minutes',
  '每杯开水冲泡1包，浸泡5分钟',
  'Pha 1 túi với một cốc nước sôi, ngâm 5 phút',
  'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800',
  true, true, false
);

-- Тайский ингалятор
INSERT INTO public.products (
  name, name_en, name_zh, name_vi,
  price, weight, category, disease, store,
  description, description_en, description_zh, description_vi,
  composition, composition_en, composition_zh, composition_vi,
  usage, usage_en, usage_zh, usage_vi,
  image, in_stock, is_popular, is_sample
) VALUES (
  'Тайский ингалятор',
  'Thai Inhaler',
  '泰国吸入器',
  'Ống hít Thái Lan',
  350.00, 0.01, 'oils', 'cold', 'thailand',
  'Ингалятор с эфирными маслами для облегчения дыхания',
  'Essential oil inhaler for easier breathing',
  '精油吸入器，帮助呼吸',
  'Ống hít tinh dầu giúp thở dễ dàng hơn',
  'Масло эвкалипта, ментол, камфора',
  'Eucalyptus oil, menthol, camphor',
  '桉树油、薄荷醇、樟脑',
  'Dầu bạch đàn, bạc hà, long não',
  'Вдыхать по необходимости',
  'Inhale as needed',
  '根据需要吸入',
  'Hít khi cần thiết',
  'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800',
  true, true, false
);

-- ============================================
-- 3. Добавляем тестовые товары из ВЬЕТНАМА
-- ============================================

-- Вьетнамский бальзам "Золотая звезда"
INSERT INTO public.products (
  name, name_en, name_zh, name_vi,
  price, weight, category, disease, store,
  description, description_en, description_zh, description_vi,
  composition, composition_en, composition_zh, composition_vi,
  usage, usage_en, usage_zh, usage_vi,
  image, in_stock, is_popular, is_sample
) VALUES (
  'Вьетнамский бальзам "Золотая звезда"',
  'Vietnamese Golden Star Balm',
  '越南金星膏',
  'Cao Sao Vàng Việt Nam',
  399.00, 0.04, 'ointments', 'headache', 'vietnam',
  'Знаменитый вьетнамский бальзам от головной боли, насморка и укусов насекомых',
  'Famous Vietnamese balm for headaches, runny nose and insect bites',
  '著名的越南膏药，用于头痛、流鼻涕和虫咬',
  'Cao dán tiếng Việt nổi tiếng cho đau đầu, sổ mũi và côn trùng cắn',
  'Ментол, камфора, мятное масло, коричное масло',
  'Menthol, camphor, peppermint oil, cinnamon oil',
  '薄荷醇、樟脑、薄荷油、肉桂油',
  'Bạc hà, long não, dầu bạc hà, dầu quế',
  'Наносить на виски, крылья носа или место укуса',
  'Apply to temples, sides of nose or bite area',
  '涂抹于太阳穴、鼻翼或叮咬处',
  'Bôi vào thái dương, cánh mũi hoặc vùng bị cắn',
  'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800',
  true, true, false
);

-- Вьетнамские капсулы для печени
INSERT INTO public.products (
  name, name_en, name_zh, name_vi,
  price, weight, category, disease, store,
  description, description_en, description_zh, description_vi,
  composition, composition_en, composition_zh, composition_vi,
  usage, usage_en, usage_zh, usage_vi,
  image, in_stock, is_popular, is_sample
) VALUES (
  'Капсулы для здоровья печени',
  'Liver Health Capsules',
  '肝脏健康胶囊',
  'Viên nang sức khỏe gan',
  980.00, 0.07, 'capsules', 'liver', 'vietnam',
  'Вьетнамские капсулы с артишоком для поддержки функции печени',
  'Vietnamese artichoke capsules for liver function support',
  '越南朝鲜蓟胶囊，支持肝功能',
  'Viên nang atiso Việt Nam hỗ trợ chức năng gan',
  'Экстракт артишока, расторопша',
  'Artichoke extract, milk thistle',
  '朝鲜蓟提取物、奶蓟',
  'Chiết xuất atiso, cây kế sữa',
  'Принимать по 2 капсулы 2 раза в день после еды',
  'Take 2 capsules twice daily after meals',
  '每天饭后服用2粒，每天2次',
  'Uống 2 viên 2 lần mỗi ngày sau bữa ăn',
  'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800',
  true, false, false
);

-- ============================================
-- 4. Добавляем тестовые промокоды
-- ============================================

-- Приветственная скидка 10%
INSERT INTO public.promo_codes (code, discount_type, discount_value, active, usage_limit)
VALUES ('WELCOME10', 'percent', 10, true, 100);

-- Первая покупка - скидка 500 рублей
INSERT INTO public.promo_codes (code, discount_type, discount_value, active, usage_limit)
VALUES ('FIRST500', 'amount', 500, true, 50);

-- Большая скидка 15% (с ограничением по дате)
INSERT INTO public.promo_codes (code, discount_type, discount_value, expiry_date, active, usage_limit)
VALUES ('SALE15', 'percent', 15, (CURRENT_DATE + INTERVAL '30 days')::DATE, true, null);

-- Новогодняя акция 20%
INSERT INTO public.promo_codes (code, discount_type, discount_value, expiry_date, active, usage_limit)
VALUES ('NEWYEAR2025', 'percent', 20, '2025-01-10'::DATE, true, 200);

-- ============================================
-- Проверка добавленных данных
-- ============================================

-- Проверяем товары
SELECT 
  name, 
  price, 
  store, 
  category, 
  is_sample,
  in_stock
FROM public.products
ORDER BY store, category;

-- Проверяем промокоды
SELECT 
  code, 
  discount_type, 
  discount_value, 
  expiry_date,
  active,
  times_used,
  usage_limit
FROM public.promo_codes
ORDER BY created_at DESC;

-- ============================================
-- ГОТОВО!
-- ============================================
-- 
-- Демо-данные успешно добавлены:
-- ✅ 8 товаров (4 из Китая, 2 из Таиланда, 2 из Вьетнама)
-- ✅ 1 пробник (только для магазина Китай)
-- ✅ 4 промокода
--
-- Теперь можете протестировать функционал магазина!
-- ============================================
