/**
 * Тестовый скрипт для проверки Edge Function
 * 
 * Использование:
 * 1. Откройте консоль браузера (F12)
 * 2. Скопируйте и вставьте весь этот файл
 * 3. Запустите: await testEdgeFunction()
 */

async function testEdgeFunction() {
  const projectId = 'boybkoyidxwrgsayifrd';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveWJrb3lpZHh3cmdzYXlpZnJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NDI3ODEsImV4cCI6MjA3NzQxODc4MX0.1R7AMGegpzlJL45AaeT2BJHQi4-Oswe1tMcAYXK8e2Y';
  const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-a75b5353`;
  
  console.log('🧪 Тестирование Edge Function...');
  console.log('📍 URL:', baseUrl);
  console.log('');

  // Test 1: Health check
  console.log('--- Test 1: Health Check ---');
  try {
    const response = await fetch(baseUrl, {
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'apikey': anonKey,
        'Content-Type': 'application/json',
      }
    });
    
    console.log('Status:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Успех!');
      console.log('Версия API:', data.version);
      console.log('Доступные маршруты:', data.routes);
      console.log('Окружение:', data.env);
    } else {
      console.error('❌ Ошибка:', response.status);
      const text = await response.text();
      console.error('Ответ:', text);
    }
  } catch (error) {
    console.error('❌ Исключение:', error.message);
  }
  console.log('');

  // Test 2: Database connection
  console.log('--- Test 2: Database Connection ---');
  try {
    const response = await fetch(`${baseUrl}/test/db`, {
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'apikey': anonKey,
        'Content-Type': 'application/json',
      }
    });
    
    console.log('Status:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ База данных доступна!');
      console.log('Количество товаров:', data.productCount);
    } else {
      console.error('❌ Ошибка:', response.status);
      const text = await response.text();
      console.error('Ответ:', text);
    }
  } catch (error) {
    console.error('❌ Исключение:', error.message);
  }
  console.log('');

  // Test 3: Public endpoint (categories - should work without auth)
  console.log('--- Test 3: Public Endpoint (Categories) ---');
  try {
    const response = await fetch(`${baseUrl}/categories`, {
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'apikey': anonKey,
        'Content-Type': 'application/json',
      }
    });
    
    console.log('Status:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Публичный endpoint работает!');
      console.log('Количество категорий:', data?.length || 'N/A');
    } else {
      console.error('❌ Ошибка:', response.status);
      const text = await response.text();
      console.error('Ответ:', text);
    }
  } catch (error) {
    console.error('❌ Исключение:', error.message);
  }
  console.log('');

  console.log('🎯 ИТОГО:');
  console.log('Если все 3 теста прошли успешно - Edge Function работает!');
  console.log('Если есть ошибки - смотрите файл URGENT_FIX_REQUIRED.md');
}

// Экспортируем функцию в глобальную область
window.testEdgeFunction = testEdgeFunction;

console.log('✅ Тестовый скрипт загружен!');
console.log('Запустите: await testEdgeFunction()');
