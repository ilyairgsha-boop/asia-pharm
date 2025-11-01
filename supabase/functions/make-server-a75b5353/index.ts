// Asia-Pharm Server - Edge Function Entry Point
// Version: 2.0.6-MINIMAL-TEST
// Build: 2024-11-01 22:00:00 UTC
// Testing minimal Hono setup with nested router

import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';

console.log('🚀 Starting MINIMAL Asia-Pharm Edge Function...');
console.log('📦 Supabase URL:', Deno.env.get('SUPABASE_URL'));

// Create API router
const api = new Hono();

// CORS middleware
api.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
}));

// Health check route
api.get('/', (c) => {
  console.log('✅ Health check called!');
  return c.json({ 
    status: 'OK',
    message: 'MINIMAL TEST VERSION WORKING!',
    version: '2.0.6-MINIMAL-TEST',
    timestamp: new Date().toISOString()
  });
});

// Test route
api.get('/test', (c) => {
  return c.json({ message: 'Test route works!' });
});

// Create main app
const app = new Hono();

// Mount API on /make-server-a75b5353
app.route('/make-server-a75b5353', api);

// Root handler for debugging
app.get('/', (c) => {
  console.log('⚠️ Root path called (should not happen)');
  return c.json({ 
    error: 'Wrong path',
    hint: 'Use /make-server-a75b5353/'
  });
});

console.log('✅ MINIMAL Edge Function initialized!');
Deno.serve(app.fetch);
