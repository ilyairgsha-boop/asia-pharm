-- Создание профиля для существующего пользователя-администратора
-- Замените 'ваш@email.com' на ваш реальный email

-- Вариант 1: Если вы знаете свой USER ID
-- INSERT INTO profiles (id, email, name, is_admin, is_wholesaler, loyalty_points, loyalty_tier, monthly_total)
-- VALUES (
--   'ВАШ-USER-ID-ЗДЕСЬ',
--   'ваш@email.com',
--   'Администратор',
--   true,
--   false,
--   0,
--   'basic',
--   0
-- );

-- Вариант 2: Автоматически найти USER ID по email (РЕКОМЕНДУЕТСЯ)
DO $$
DECLARE
  user_uuid UUID;
  user_email TEXT := 'ваш@email.com'; -- ЗАМЕНИТЕ НА ВАШ EMAIL!
BEGIN
  -- Найти ID пользователя по email
  SELECT id INTO user_uuid
  FROM auth.users
  WHERE email = user_email;

  -- Если пользователь найден
  IF user_uuid IS NOT NULL THEN
    -- Создать профиль (или обновить если уже есть)
    INSERT INTO profiles (id, email, name, is_admin, is_wholesaler, loyalty_points, loyalty_tier, monthly_total)
    VALUES (
      user_uuid,
      user_email,
      'Администратор',
      true,
      false,
      0,
      'basic',
      0
    )
    ON CONFLICT (id) DO UPDATE SET
      is_admin = true,
      name = COALESCE(profiles.name, 'Администратор');

    RAISE NOTICE 'Профиль создан/обновлён для пользователя: %', user_email;
  ELSE
    RAISE EXCEPTION 'Пользователь с email % не найден!', user_email;
  END IF;
END $$;
