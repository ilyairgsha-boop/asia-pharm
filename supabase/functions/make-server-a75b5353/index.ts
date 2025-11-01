// Asia-Pharm Server - Edge Function Entry Point
// Version: 2.0 - Minimal Working Version

import { Hono } from 'npm:hono';
import { logger } from 'npm:hono/logger';
import { cors } from 'npm:hono/cors';
import { createClient } from 'npm:@supabase/supabase-js';
import * as kv from './kv_store.tsx';

console.log('🚀 Starting Asia-Pharm Edge Function...');
console.log('📦 Supabase URL:', Deno.env.get('SUPABASE_URL'));
console.log('🔑 Anon Key exists:', !!Deno.env.get('SUPABASE_ANON_KEY'));
console.log('🔐 Service Role Key exists:', !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));

const app = new Hono();

// CORS middleware - MUST be first
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'apikey', 'x-client-info'],
  exposeHeaders: ['Content-Length', 'X-JSON'],
  maxAge: 86400,
  credentials: false,
}));

app.use('*', logger(console.log));

// Handle OPTIONS preflight
app.options('*', (c) => {
  return c.text('', 204);
});

// Supabase clients
const getSupabaseAdmin = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
};

const getSupabaseClient = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!
  );
};

// Auth middleware
const requireAdmin = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) {
    console.error('❌ No Authorization header');
    return c.json({ error: 'Unauthorized - No token provided' }, 401);
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    console.error('❌ Invalid Authorization header format');
    return c.json({ error: 'Unauthorized - Invalid token format' }, 401);
  }

  const supabase = getSupabaseAdmin();
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error) {
    console.error('❌ Error verifying token:', error);
    return c.json({ error: 'Unauthorized - Invalid token', details: error.message }, 401);
  }

  if (!user) {
    console.error('❌ No user found for token');
    return c.json({ error: 'Unauthorized - User not found' }, 401);
  }

  console.log(`✅ User authenticated: ${user.id} (${user.email})`);
  c.set('user', user);
  
  // Check admin status from profiles table
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle();
  
  if (profileError) {
    console.error('❌ Error checking admin status:', profileError);
    return c.json({ error: 'Failed to verify admin status', details: profileError.message }, 500);
  }
  
  if (!profile) {
    console.error('❌ Profile not found for user:', user.id);
    return c.json({ error: 'Admin access required - Profile not found' }, 403);
  }
  
  if (!profile.is_admin) {
    console.error('❌ User is not admin:', user.email);
    return c.json({ error: 'Admin access required' }, 403);
  }
  
  console.log(`✅ Admin access granted: ${user.email}`);
  await next();
};

// Health check - MUST be first route
app.get('/', (c) => {
  console.log('✅ Health check endpoint called');
  console.log('Headers:', Object.fromEntries(c.req.raw.headers.entries()));
  return c.json({ 
    status: 'OK', 
    message: 'Asia-Pharm Store API v2.0',
    timestamp: new Date().toISOString(),
    env: {
      hasSupabaseUrl: !!Deno.env.get('SUPABASE_URL'),
      hasAnonKey: !!Deno.env.get('SUPABASE_ANON_KEY'),
      hasServiceKey: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
    }
  });
});

// Test database connection
app.get('/test/db', async (c) => {
  try {
    console.log('🧪 Testing database connection...');
    const supabase = getSupabaseClient();
    const { data, error, count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Database error:', error);
      return c.json({ 
        success: false, 
        error: error.message,
        details: error 
      }, 500);
    }
    
    console.log('✅ Database connection successful, product count:', count);
    return c.json({ 
      success: true, 
      productCount: count,
      message: 'Database connection successful'
    });
  } catch (error: any) {
    console.error('❌ Database test exception:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// User registration endpoint
app.post('/signup', async (c) => {
  try {
    console.log('👤 User registration request received');
    const body = await c.req.json();
    const { email, password, name, language } = body;

    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    const supabase = getSupabaseAdmin();

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for development
      user_metadata: {
        name: name || '',
        language: language || 'ru',
      },
    });

    if (authError) {
      console.error('❌ Auth error:', authError);
      return c.json({ error: authError.message }, 400);
    }

    // Create user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        name: name || '',
        is_admin: false,
        is_wholesaler: false,
        loyalty_points: 0,
        total_spent: 0,
      });

    if (profileError) {
      console.error('❌ Profile creation error:', profileError);
      // Don't fail if profile creation fails - user is already created
    }

    console.log('✅ User registered successfully:', email);
    return c.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: name || '',
      },
    });
  } catch (error: any) {
    console.error('❌ Registration exception:', error);
    return c.json({ error: error.message || 'Registration failed' }, 500);
  }
});

// Get categories endpoint
app.get('/categories', async (c) => {
  try {
    console.log('📂 Fetching categories from database...');
    const supabase = getSupabaseClient();
    
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });
    
    if (error) {
      console.error('❌ Error fetching categories:', error);
      return c.json({ error: 'Failed to fetch categories', details: error.message }, 500);
    }
    
    console.log(`✅ Fetched ${categories?.length || 0} categories from database`);
    return c.json({ categories: categories || [] });
  } catch (error: any) {
    console.error('❌ Exception fetching categories:', error);
    return c.json({ error: 'Failed to fetch categories', details: String(error) }, 500);
  }
});

// Get all products - PUBLIC endpoint
app.get('/products', async (c) => {
  try {
    console.log('📦 Fetching products from database...');
    const supabase = getSupabaseClient();
    
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('in_stock', true)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching products:', error);
      return c.json({ error: 'Failed to fetch products', details: error.message }, 500);
    }
    
    // Map products from DB format to frontend format
    const mappedProducts = (products || []).map((dbProduct: any) => {
      const frontendData: any = { ...dbProduct };
      
      // Map snake_case to camelCase
      if ('short_description' in frontendData) {
        frontendData.shortDescription = frontendData.short_description || '';
      }
      if ('short_description_en' in frontendData) {
        frontendData.shortDescription_en = frontendData.short_description_en || '';
      }
      if ('short_description_zh' in frontendData) {
        frontendData.shortDescription_zh = frontendData.short_description_zh || '';
      }
      if ('short_description_vi' in frontendData) {
        frontendData.shortDescription_vi = frontendData.short_description_vi || '';
      }
      
      // Map disease_categories
      if ('disease_categories' in frontendData) {
        const categories = frontendData.disease_categories;
        if (Array.isArray(categories)) {
          frontendData.diseaseCategories = categories;
        } else if (typeof categories === 'string') {
          try {
            frontendData.diseaseCategories = JSON.parse(categories);
          } catch {
            frontendData.diseaseCategories = [categories];
          }
        } else {
          frontendData.diseaseCategories = [];
        }
      } else if (!frontendData.diseaseCategories && frontendData.disease) {
        frontendData.diseaseCategories = [frontendData.disease];
      } else if (!frontendData.diseaseCategories) {
        frontendData.diseaseCategories = [];
      }
      
      return frontendData;
    });
    
    console.log(`✅ Fetched ${mappedProducts.length} products from database`);
    return c.json({ products: mappedProducts });
  } catch (error: any) {
    console.error('❌ Exception fetching products:', error);
    return c.json({ error: 'Failed to fetch products', details: String(error) }, 500);
  }
});

// ============================================================================
// Google Translate API Endpoints
// ============================================================================

// Get Google Translate API key
app.get('/api/translate/key', requireAdmin, async (c) => {
  try {
    const apiKey = await kv.get('google_translate_api_key');
    return c.json({ 
      success: true, 
      hasKey: !!apiKey,
      keyPreview: apiKey ? `${apiKey.substring(0, 10)}...` : null
    });
  } catch (error) {
    console.error('❌ Error getting Google Translate API key:', error);
    return c.json({ error: 'Failed to get API key', details: String(error) }, 500);
  }
});

// Set Google Translate API key
app.post('/api/translate/key', requireAdmin, async (c) => {
  try {
    const { apiKey } = await c.req.json();
    
    if (!apiKey || typeof apiKey !== 'string') {
      return c.json({ error: 'API key is required' }, 400);
    }
    
    // Validate API key by making a test request
    const testUrl = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}&q=test&target=en`;
    const testResponse = await fetch(testUrl, { method: 'POST' });
    
    if (!testResponse.ok) {
      return c.json({ error: 'Invalid API key' }, 400);
    }
    
    await kv.set('google_translate_api_key', apiKey);
    
    console.log('✅ Google Translate API key saved successfully');
    return c.json({ success: true });
  } catch (error) {
    console.error('❌ Error saving Google Translate API key:', error);
    return c.json({ error: 'Failed to save API key', details: String(error) }, 500);
  }
});

// Delete Google Translate API key
app.delete('/api/translate/key', requireAdmin, async (c) => {
  try {
    await kv.del('google_translate_api_key');
    console.log('✅ Google Translate API key deleted successfully');
    return c.json({ success: true });
  } catch (error) {
    console.error('❌ Error deleting Google Translate API key:', error);
    return c.json({ error: 'Failed to delete API key', details: String(error) }, 500);
  }
});

// Translate text
app.post('/api/translate/text', requireAdmin, async (c) => {
  try {
    const { text, targetLanguage, sourceLanguage } = await c.req.json();
    
    if (!text || !targetLanguage) {
      return c.json({ error: 'Text and target language are required' }, 400);
    }
    
    const apiKey = await kv.get('google_translate_api_key');
    if (!apiKey) {
      return c.json({ error: 'Google Translate API key not configured' }, 400);
    }
    
    // Map language codes
    const langMap: Record<string, string> = {
      'ru': 'ru',
      'en': 'en',
      'zh': 'zh-CN',
      'vi': 'vi'
    };
    
    const params = new URLSearchParams({
      key: apiKey,
      q: text,
      target: langMap[targetLanguage] || targetLanguage,
      format: 'text',
    });
    
    if (sourceLanguage) {
      params.append('source', langMap[sourceLanguage] || sourceLanguage);
    }
    
    const response = await fetch(`https://translation.googleapis.com/language/translate/v2?${params.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Google Translate API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.data?.translations?.[0]) {
      throw new Error('Invalid response from Google Translate API');
    }
    
    return c.json({
      success: true,
      translatedText: data.data.translations[0].translatedText,
      detectedSourceLanguage: data.data.translations[0].detectedSourceLanguage,
    });
  } catch (error) {
    console.error('❌ Error translating text:', error);
    return c.json({ error: 'Translation failed', details: String(error) }, 500);
  }
});

// Translate batch
app.post('/api/translate/batch', requireAdmin, async (c) => {
  try {
    const { texts, targetLanguage, sourceLanguage } = await c.req.json();
    
    if (!texts || !Array.isArray(texts) || !targetLanguage) {
      return c.json({ error: 'Texts array and target language are required' }, 400);
    }
    
    const apiKey = await kv.get('google_translate_api_key');
    if (!apiKey) {
      return c.json({ error: 'Google Translate API key not configured' }, 400);
    }
    
    // Map language codes
    const langMap: Record<string, string> = {
      'ru': 'ru',
      'en': 'en',
      'zh': 'zh-CN',
      'vi': 'vi'
    };
    
    const params = new URLSearchParams({
      key: apiKey,
      target: langMap[targetLanguage] || targetLanguage,
      format: 'text',
    });
    
    if (sourceLanguage) {
      params.append('source', langMap[sourceLanguage] || sourceLanguage);
    }
    
    // Add all texts as separate 'q' parameters
    texts.forEach((text: string) => {
      params.append('q', text);
    });
    
    const response = await fetch(`https://translation.googleapis.com/language/translate/v2?${params.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Google Translate API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.data?.translations) {
      throw new Error('Invalid response from Google Translate API');
    }
    
    return c.json({
      success: true,
      translations: data.data.translations.map((t: any) => ({
        translatedText: t.translatedText,
        detectedSourceLanguage: t.detectedSourceLanguage,
      })),
    });
  } catch (error) {
    console.error('❌ Error in batch translation:', error);
    return c.json({ error: 'Batch translation failed', details: String(error) }, 500);
  }
});

// ============================================================================
// KV Store API Endpoints
// ============================================================================

// Get value from KV store (Admin only)
app.get('/api/kv/get', requireAdmin, async (c) => {
  try {
    const key = c.req.query('key');
    
    if (!key) {
      return c.json({ error: 'Key parameter is required' }, 400);
    }
    
    const value = await kv.get(key);
    
    return c.json({ 
      success: true, 
      key,
      value,
      hasValue: value !== null && value !== undefined
    });
  } catch (error) {
    console.error('❌ Error getting value from KV store:', error);
    return c.json({ error: 'Failed to get value from KV store', details: String(error) }, 500);
  }
});

// Set value in KV store (Admin only)
app.post('/api/kv/set', requireAdmin, async (c) => {
  try {
    const { key, value } = await c.req.json();
    
    if (!key) {
      return c.json({ error: 'Key is required' }, 400);
    }
    
    if (value === undefined) {
      return c.json({ error: 'Value is required' }, 400);
    }
    
    await kv.set(key, value);
    
    console.log(`✅ KV store updated: ${key}`);
    
    return c.json({ 
      success: true,
      message: `Successfully saved ${key} to KV store`
    });
  } catch (error) {
    console.error('❌ Error setting value in KV store:', error);
    return c.json({ error: 'Failed to set value in KV store', details: String(error) }, 500);
  }
});

// Delete value from KV store (Admin only)
app.delete('/api/kv/delete', requireAdmin, async (c) => {
  try {
    const key = c.req.query('key');
    
    if (!key) {
      return c.json({ error: 'Key parameter is required' }, 400);
    }
    
    await kv.del(key);
    
    console.log(`✅ KV store key deleted: ${key}`);
    
    return c.json({ 
      success: true,
      message: `Successfully deleted ${key} from KV store`
    });
  } catch (error) {
    console.error('❌ Error deleting value from KV store:', error);
    return c.json({ error: 'Failed to delete value from KV store', details: String(error) }, 500);
  }
});

// ============================================================================
// OneSignal Push Notifications API Endpoints
// ============================================================================

// Send push notification (Public endpoint - uses KV store for credentials)
app.post('/api/push/send', async (c) => {
  try {
    console.log('📬 Push notification request received');
    const { title, message, url, icon, image, data, userIds, segments, tags, language, store } = await c.req.json();

    // Get OneSignal credentials from KV store
    const settings = await kv.get('oneSignalSettings');

    if (!settings) {
      console.error('❌ OneSignal settings not found in KV store');
      return c.json({ code: 500, message: 'OneSignal not configured. Please configure OneSignal in admin settings.' }, 500);
    }

    const settingsObj = typeof settings === 'string' ? JSON.parse(settings) : settings;
    
    if (!settingsObj.enabled || !settingsObj.appId || !settingsObj.apiKey) {
      console.error('❌ OneSignal not enabled or credentials missing:', {
        enabled: settingsObj.enabled,
        hasAppId: !!settingsObj.appId,
        hasApiKey: !!settingsObj.apiKey,
      });
      return c.json({ 
        code: 400, 
        message: 'OneSignal not enabled or not configured. Please enable and configure OneSignal in admin settings.' 
      }, 400);
    }

    // Build OneSignal notification payload
    const payload: any = {
      app_id: settingsObj.appId,
      headings: { en: title },
      contents: { en: message },
    };

    if (url) {
      payload.url = url;
    }
    if (icon) {
      payload.chrome_web_icon = icon;
      payload.firefox_icon = icon;
    }
    if (image) {
      payload.chrome_web_image = image;
    }
    if (data) {
      payload.data = data;
    }

    // Targeting
    if (userIds && userIds.length > 0) {
      payload.include_player_ids = userIds;
    } else if (segments && segments.length > 0) {
      payload.included_segments = segments;
    } else {
      payload.included_segments = ['All'];
    }

    // Filters
    const filters: any[] = [];
    if (language) {
      filters.push({ field: 'language', relation: '=', value: language });
    }
    if (store) {
      filters.push({ field: 'tag', key: 'store', relation: '=', value: store });
    }
    if (filters.length > 0) {
      payload.filters = filters;
    }

    console.log('📤 Sending notification via OneSignal API:', {
      title,
      messagePreview: message.substring(0, 50),
      targeting: { userIds, segments, language, store }
    });

    // Send notification to OneSignal
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${settingsObj.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ OneSignal API error:', result);
      return c.json({ error: 'OneSignal API error', details: result }, response.status);
    }

    console.log('✅ Notification sent successfully:', {
      id: result.id,
      recipients: result.recipients,
    });

    return c.json({
      success: true,
      id: result.id,
      recipients: result.recipients,
    });

  } catch (error: any) {
    console.error('❌ Error in send-push-notification:', error);
    return c.json({ error: error.message || 'Failed to send notification' }, 500);
  }
});

// 404 handler
app.notFound((c) => {
  console.log('❌ 404 Not Found:', c.req.url);
  return c.json({ error: 'Not Found', path: c.req.url }, 404);
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

console.log('✅ Edge Function initialized, starting server...');
Deno.serve(app.fetch);
