// Asia-Pharm Server - Edge Function Entry Point
// Version: 2.0.7-FIXED - Direct routing without nesting
// Build: 2024-11-01 22:30:00 UTC
// Fix: Routes defined directly on app, not nested

import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';

console.log('🚀 Starting Asia-Pharm Edge Function v2.0.7...');
console.log('📦 Supabase URL:', Deno.env.get('SUPABASE_URL'));

// Create app directly - NO NESTING!
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

// Health check route at ROOT /
app.get('/', (c) => {
  console.log('✅ Health check called at ROOT!');
  console.log('📍 Request URL:', c.req.url);
  console.log('📍 Request Path:', new URL(c.req.url).pathname);
  return c.json({ 
    status: 'OK',
    message: 'Asia-Pharm API v2.0.7 - Direct Routing',
    version: '2.0.7-FIXED',
    timestamp: new Date().toISOString(),
    path: new URL(c.req.url).pathname,
    fullUrl: c.req.url
  });
});

// Test route
app.get('/test', (c) => {
  console.log('✅ Test route called!');
  return c.json({ 
    message: 'Test route works!',
    path: new URL(c.req.url).pathname 
  });
});

// Test API route
app.get('/api/test', (c) => {
  console.log('✅ API test route called!');
  return c.json({ 
    message: 'API test route works!',
    path: new URL(c.req.url).pathname 
  });
});

// 404 handler
app.notFound((c) => {
  console.log('❌ 404 Not Found:', c.req.url);
  console.log('📍 Path:', new URL(c.req.url).pathname);
  return c.json({ 
    error: 'Not Found',
    path: new URL(c.req.url).pathname,
    url: c.req.url,
    hint: 'Available routes: /, /test, /api/test'
  }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('❌ Server error:', err);
  return c.json({ 
    error: 'Internal Server Error', 
    message: err.message,
    stack: err.stack 
  }, 500);
});

console.log('✅ Edge Function initialized with direct routing!');
Deno.serve(app.fetch);
