// Asia-Pharm Server - Edge Function Entry Point
// Version: 2.0.8-PREFIXED - Routes with Supabase prefix
// Build: 2024-11-01 23:00:00 UTC
// Fix: All routes start with /make-server-a75b5353 because Supabase includes it in path!

import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';

console.log('🚀 Starting Asia-Pharm Edge Function v2.0.8...');
console.log('📦 Supabase URL:', Deno.env.get('SUPABASE_URL'));

// Create app
const app = new Hono();

// CORS middleware - MUST include 'apikey' header!
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'apikey', 'x-client-info'],
  exposeHeaders: ['Content-Length', 'X-JSON'],
  maxAge: 86400,
  credentials: false,
}));

// OPTIONS handler
app.options('*', (c) => {
  console.log('✅ OPTIONS request:', c.req.url);
  return c.text('', 204);
});

// Health check route - WITH PREFIX!
app.get('/make-server-a75b5353/', (c) => {
  console.log('✅ Health check called!');
  console.log('📍 Request URL:', c.req.url);
  console.log('📍 Request Path:', new URL(c.req.url).pathname);
  return c.json({ 
    status: 'OK',
    message: 'Asia-Pharm API v2.0.8 - Prefixed Routing',
    version: '2.0.8-PREFIXED',
    timestamp: new Date().toISOString(),
    path: new URL(c.req.url).pathname,
    fullUrl: c.req.url,
    note: 'Supabase includes function name in path!'
  });
});

// Health check without trailing slash
app.get('/make-server-a75b5353', (c) => {
  console.log('✅ Health check (no slash) called!');
  return c.json({ 
    status: 'OK',
    message: 'Asia-Pharm API v2.0.8 - No trailing slash',
    version: '2.0.8-PREFIXED',
    timestamp: new Date().toISOString()
  });
});

// Test route
app.get('/make-server-a75b5353/test', (c) => {
  console.log('✅ Test route called!');
  return c.json({ 
    message: 'Test route works!',
    path: new URL(c.req.url).pathname 
  });
});

// Test API route for push notifications
app.post('/make-server-a75b5353/api/push/send', (c) => {
  console.log('✅ Push notification test endpoint called!');
  return c.json({ 
    success: true,
    message: 'This is a test endpoint - full implementation coming soon',
    path: new URL(c.req.url).pathname 
  });
});

// Test API route
app.get('/make-server-a75b5353/api/test', (c) => {
  console.log('✅ API test route called!');
  return c.json({ 
    message: 'API test route works!',
    path: new URL(c.req.url).pathname 
  });
});

// Catch-all for debugging
app.all('*', (c) => {
  const path = new URL(c.req.url).pathname;
  console.log('❌ Unmatched route:', path);
  console.log('📍 Full URL:', c.req.url);
  return c.json({ 
    error: 'Not Found',
    path: path,
    url: c.req.url,
    hint: 'Available routes: /make-server-a75b5353/, /make-server-a75b5353/test, /make-server-a75b5353/api/test, /make-server-a75b5353/api/push/send',
    receivedPath: path
  }, 404);
});

console.log('✅ Edge Function initialized with prefixed routing!');
Deno.serve(app.fetch);
