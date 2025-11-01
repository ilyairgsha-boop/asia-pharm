/**
 * Edge Function Finder - находит правильный URL для Edge Function
 * 
 * Использование в консоли:
 * import { findEdgeFunction } from './utils/supabase/edge-function-finder';
 * await findEdgeFunction();
 */

export async function findEdgeFunction() {
  const projectId = 'boybkoyidxwrgsayifrd';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveWJrb3lpZHh3cmdzYXlpZnJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NDI3ODEsImV4cCI6MjA3NzQxODc4MX0.1R7AMGegpzlJL45AaeT2BJHQi4-Oswe1tMcAYXK8e2Y';
  
  const possibleNames = [
    'make-server-a75b5353',
    'server',
    'asia-pharm-server',
    'api',
    'make-server',
  ];
  
  console.log('🔍 Поиск Edge Function...');
  console.log('');
  
  for (const name of possibleNames) {
    const url = `https://${projectId}.supabase.co/functions/v1/${name}`;
    
    try {
      console.log(`Пробую: ${name}...`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${anonKey}`,
          'apikey': anonKey,
          'Content-Type': 'application/json',
        },
      });
      
      console.log(`  Status: ${response.status}`);
      
      if (response.status === 200) {
        const data = await response.json();
        console.log('  ✅ НАЙДЕНА!');
        console.log('  Ответ:', data);
        console.log('');
        console.log('╔════════════════════════════════════════════╗');
        console.log('║  ✅ Edge Function найдена!                ║');
        console.log('╚════════════════════════════════════════════╝');
        console.log('');
        console.log(`Используйте имя: ${name}`);
        console.log(`Полный URL: ${url}`);
        console.log('');
        console.log('Обновите /utils/supabase/client.ts:');
        console.log(`  getServerUrl: (route) => \`https://${projectId}.supabase.co/functions/v1/${name}\${route}\``);
        return { name, url, data };
      } else if (response.status === 404) {
        console.log('  ❌ Не найдена (404)');
      } else {
        const text = await response.text();
        console.log(`  ⚠️ Неожиданный статус: ${text.substring(0, 100)}`);
      }
    } catch (error: any) {
      console.log(`  ❌ Ошибка: ${error.message}`);
    }
    
    console.log('');
  }
  
  console.log('❌ Edge Function не найдена ни под одним из известных имен');
  console.log('');
  console.log('Возможные причины:');
  console.log('1. Function не задеплоена');
  console.log('2. Function имеет другое имя');
  console.log('3. Проблема с проектом Supabase');
  console.log('');
  console.log('Проверьте в Supabase Dashboard:');
  console.log('https://supabase.com/dashboard/project/boybkoyidxwrgsayifrd/functions');
  
  return null;
}

// Глобальная функция для консоли
if (typeof window !== 'undefined') {
  (window as any).findEdgeFunction = findEdgeFunction;
}
