// Asia-Pharm Server - Edge Function Entry Point
// Version: 2.6.1-PATHS-FIXED - Fixed component paths in App.tsx
// Build: 2025-04-11 08:30:00 UTC
// All routes prefixed with /make-server-a75b5353

import { Hono } from 'npm:hono';
import { logger } from 'npm:hono/logger';
import { cors } from 'npm:hono/cors';
import { createClient } from 'npm:@supabase/supabase-js';
import * as kv from './kv_store.tsx';

console.log('🚀 Starting Asia-Pharm Edge Function v2.6.1-PATHS-FIXED...');
console.log('📦 Supabase URL:', Deno.env.get('SUPABASE_URL'));
console.log('🔑 Keys configured:', {
  anon: !!Deno.env.get('SUPABASE_ANON_KEY'),
  service: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
  resend: !!Deno.env.get('RESEND_API_KEY')
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

// ============================================================================
// Settings Helper - Read from settings table with fallback to KV store
// ============================================================================

interface OneSignalSettings {
  appId: string;
  restApiKey?: string;
  apiKey?: string;
  enabled: boolean;
}

/**
 * Get OneSignal settings from settings table (preferred) or KV store (fallback)
 * @returns OneSignal settings or null if not configured
 */
const getOneSignalSettings = async (): Promise<{ settings: OneSignalSettings | null; source: 'settings_table' | 'kv_store' | 'not_found' }> => {
  const supabase = getSupabaseAdmin();
  
  console.log('🔍 Attempting to load OneSignal settings from settings table...');
  
  // Try settings table first
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'oneSignal')
      .maybeSingle();
    
    if (!error && data?.value) {
      console.log('✅ Loaded OneSignal settings from settings table');
      const settings = data.value as OneSignalSettings;
      return { settings, source: 'settings_table' };
    }
    
    if (error) {
      console.warn('⚠️ Error reading from settings table:', error.message);
    } else {
      console.warn('⚠️ No OneSignal settings in settings table');
    }
  } catch (e) {
    console.warn('⚠️ Exception reading from settings table:', e);
  }
  
  // Fallback to KV store
  console.log('🔍 Fallback: Loading OneSignal settings from KV store...');
  try {
    const kvSettings = await kv.get('oneSignalSettings');
    if (kvSettings) {
      console.log('✅ Loaded OneSignal settings from KV store (fallback)');
      return { settings: kvSettings as OneSignalSettings, source: 'kv_store' };
    }
    console.warn('⚠️ No OneSignal settings in KV store');
  } catch (e) {
    console.warn('⚠️ Exception reading from KV store:', e);
  }
  
  console.error('❌ OneSignal settings not found in settings table or KV store');
  return { settings: null, source: 'not_found' };
};

// Auth middleware - require authenticated user (not necessarily admin)
const requireAuth = async (c: any, next: any) => {
  console.log('🔐 requireAuth middleware called');
  
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader) {
    console.error('❌ No Authorization header provided');
    return c.json({ 
      error: 'Unauthorized',
      details: 'No Authorization header'
    }, 401);
  }

  const token = authHeader.split(' ')[1];
  
  if (!token) {
    console.error('❌ Authorization header malformed');
    return c.json({ 
      error: 'Unauthorized',
      details: 'Malformed Authorization header'
    }, 401);
  }
  
  const supabaseWithToken = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    }
  );
  
  const { data: { user }, error } = await supabaseWithToken.auth.getUser();

  if (error || !user) {
    console.error('❌ Token verification failed');
    return c.json({ 
      error: 'Unauthorized',
      details: 'Invalid or expired token'
    }, 401);
  }
  
  console.log('✅ User authenticated:', user.id, user.email);
  c.set('user', user);
  await next();
};

// Auth middleware - require admin
const requireAdmin = async (c: any, next: any) => {
  console.log('🔐 requireAdmin middleware called');
  console.log('📍 Path:', c.req.path);
  console.log('📍 Method:', c.req.method);
  
  const authHeader = c.req.header('Authorization');
  console.log('🔑 Authorization header:', authHeader ? `Present (${authHeader.substring(0, 20)}...)` : 'MISSING ❌');
  
  if (!authHeader) {
    console.error('❌ No Authorization header provided');
    return c.json({ 
      error: 'Unauthorized',
      details: 'No Authorization header',
      hint: 'Include Authorization: Bearer <token> header'
    }, 401);
  }

  const token = authHeader.split(' ')[1];
  console.log('🎫 Token extracted:', token ? `Yes (${token.substring(0, 20)}...)` : 'NO ❌');
  
  if (!token) {
    console.error('❌ Authorization header malformed (no token after Bearer)');
    return c.json({ 
      error: 'Unauthorized',
      details: 'Malformed Authorization header',
      hint: 'Format: Authorization: Bearer <token>'
    }, 401);
  }
  
  // Create a client with the user's token to verify it
  // IMPORTANT: Use anon key + user token, NOT service role key
  console.log('🔍 Verifying token with Supabase...');
  const supabaseWithToken = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    {
      global: {
        headers: {
          Authorization: authHeader, // Pass the full "Bearer <token>" header
        },
      },
    }
  );
  
  const { data: { user }, error } = await supabaseWithToken.auth.getUser();

  if (error) {
    console.error('❌ Token verification error:', error.message);
    console.error('Error details:', error);
    return c.json({ 
      error: 'Unauthorized',
      details: 'Invalid or expired token',
      authError: error.message
    }, 401);
  }
  
  if (!user) {
    console.error('❌ No user found for token');
    return c.json({ 
      error: 'Unauthorized',
      details: 'No user found for provided token'
    }, 401);
  }
  
  console.log('✅ User authenticated:', user.id, user.email);
  console.log('🔍 Checking admin status in profiles table...');

  // Use admin client to check profile
  const supabase = getSupabaseAdmin();
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin, email, name')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    console.error('❌ Error fetching profile:', profileError.message);
    return c.json({ 
      error: 'Database error',
      details: profileError.message
    }, 500);
  }
  
  if (!profile) {
    console.error('❌ No profile found for user:', user.id);
    return c.json({ 
      error: 'Forbidden',
      details: 'No profile found. Please create a profile first.'
    }, 403);
  }
  
  console.log('👤 Profile found:', {
    email: profile.email,
    name: profile.name,
    is_admin: profile.is_admin
  });

  if (!profile.is_admin) {
    console.error('❌ User is not admin:', user.email);
    return c.json({ 
      error: 'Admin access required',
      details: 'Your account does not have admin privileges'
    }, 403);
  }
  
  console.log('✅ Admin access granted for:', user.email);
  c.set('user', user);
  await next();
};

// Create app
const app = new Hono();

// CORS middleware
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'apikey', 'x-client-info'],
  exposeHeaders: ['Content-Length', 'X-JSON'],
  maxAge: 86400,
  credentials: false,
}));

app.use('*', logger(console.log));

app.options('*', (c) => c.text('', 204));

// ============================================================================
// Health Check & Info
// ============================================================================

app.get('/make-server-a75b5353/', (c) => {
  console.log('✅ Health check called');
  const resendKey = Deno.env.get('RESEND_API_KEY');
  console.log('RESEND_API_KEY status:', resendKey ? `Set (${resendKey.substring(0, 10)}...)` : 'NOT SET');
  
  return c.json({ 
    status: 'OK',
    message: 'Asia-Pharm API v2.8.3 - Email with Loyalty Points Calculation',
    version: '2.8.3-EMAIL-LOYALTY-CALC',
    timestamp: new Date().toISOString(),
    routes: {
      email: ['/make-server-a75b5353/api/email/order-status', '/make-server-a75b5353/api/email/welcome', '/make-server-a75b5353/api/email/broadcast', '/make-server-a75b5353/api/email/subscribers-count'],
      push: ['/make-server-a75b5353/api/push/send', '/make-server-a75b5353/api/push/stats', '/make-server-a75b5353/api/push/auto-notify'],
      kv: ['/make-server-a75b5353/api/kv/*'],
      translate: ['/make-server-a75b5353/api/translate/*'],
      debug: ['/make-server-a75b5353/api/debug/db-check', '/make-server-a75b5353/api/debug/onesignal-check'],
    },
    env: {
      hasResendKey: !!resendKey,
      resendKeyPrefix: resendKey ? resendKey.substring(0, 10) + '...' : null,
    }
  });
});

app.get('/make-server-a75b5353', (c) => c.redirect('/make-server-a75b5353/'));

// ============================================================================
// Email API Endpoints  
// ============================================================================

// Send order status email (accessible by authenticated users for their own orders)
app.post('/make-server-a75b5353/api/email/order-status', requireAuth, async (c) => {
  try {
    console.log('📧 Order status email request');
    const { orderId, email, status } = await c.req.json();
    console.log('Request params:', { orderId, email, status });

    if (!orderId || !email || !status) {
      console.error('❌ Missing required fields:', { orderId, email, status });
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const supabase = getSupabaseAdmin();
    console.log('🔍 Fetching order from database...');
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('❌ Order not found:', orderError);
      return c.json({ error: 'Order not found', details: orderError?.message }, 404);
    }

    console.log('✅ Order found:', { id: order.id, email: order.email, order_number: order.order_number });

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('❌ RESEND_API_KEY not configured');
      return c.json({ error: 'Email service not configured' }, 500);
    }

    console.log('✅ Resend API key configured');
    console.log('📝 Generating email HTML...');

    const { generateOrderEmailHTML } = await import('./email-templates.tsx');
    const orderNumber = order.order_number || order.id.substring(0, 8);
    const language = order.language || 'ru';
    
    console.log('Email params:', { orderNumber, language, status });

    const subjects: any = {
      ru: {
        pending: `Заказ #${orderNumber} принят - Азия Фарм`,
        processing: `Заказ #${orderNumber} оплачен - Азия Фарм`,
        shipped: `Заказ #${orderNumber} отправлен - Азия Фарм`,
        delivered: `Заказ #${orderNumber} доставлен - Азия Фарм`,
        cancelled: `Заказ #${orderNumber} отменен - Азия Фарм`
      },
      en: {
        pending: `Order #${orderNumber} received - Asia Pharm`,
        processing: `Order #${orderNumber} paid - Asia Pharm`,
        shipped: `Order #${orderNumber} shipped - Asia Pharm`,
        delivered: `Order #${orderNumber} delivered - Asia Pharm`,
        cancelled: `Order #${orderNumber} cancelled - Asia Pharm`
      },
      zh: {
        pending: `订单 #${orderNumber} 已接收 - 亚洲药房`,
        processing: `订单 #${orderNumber} 已付款 - 亚洲药房`,
        shipped: `订单 #${orderNumber} 已发货 - 亚洲药房`,
        delivered: `订单 #${orderNumber} 已送达 - 亚洲药房`,
        cancelled: `订单 #${orderNumber} 已取消 - 亚洲药房`
      },
      vi: {
        pending: `Đơn hàng #${orderNumber} đã nhận - Asia Pharm`,
        processing: `Đơn hàng #${orderNumber} đã thanh toán - Asia Pharm`,
        shipped: `Đơn hàng #${orderNumber} đã gửi - Asia Pharm`,
        delivered: `Đơn hàng #${orderNumber} đã giao - Asia Pharm`,
        cancelled: `Đơn hàng #${orderNumber} đã hủy - Asia Pharm`
      }
    };

    const subject = subjects[language as keyof typeof subjects]?.[status] || subjects.ru[status];
    console.log('📬 Email subject:', subject);
    
    // Calculate loyalty points to earn based on order amount
    let loyaltyPointsEarned = 0;
    let currentLoyaltyBalance = 0;
    
    if (order.user_id) {
      // Get user's current loyalty balance
      const { data: profile } = await supabase
        .from('profiles')
        .select('loyalty_points')
        .eq('id', order.user_id)
        .single();
      
      currentLoyaltyBalance = profile?.loyalty_points || 0;
      
      // If order is delivered and points already earned, get actual amount from loyalty_history
      if (status === 'delivered' && order.loyalty_points_earned) {
        console.log('📊 Order is delivered and points earned - checking loyalty_history...');
        const { data: historyRecord } = await supabase
          .from('loyalty_history')
          .select('points')
          .eq('order_id', orderId)
          .eq('type', 'earned')
          .single();
        
        if (historyRecord) {
          loyaltyPointsEarned = historyRecord.points;
          console.log(`💎 Actual loyalty points earned from history: ${loyaltyPointsEarned}`);
        } else {
          console.warn('⚠️ No loyalty history found for delivered order');
        }
      } else {
        // Calculate expected points for pending/processing/shipped orders
        // Calculate subtotal without samples
        const subtotalWithoutSamples = (order.items || [])
          .filter((item: any) => !item.isSample)
          .reduce((sum: number, item: any) => sum + (item.price || 0) * (item.quantity || 0), 0);
        
        // Calculate amount eligible for cashback (subtract used loyalty points)
        const loyaltyPointsUsed = order.loyalty_points_used || 0;
        const amountForCashback = Math.max(0, subtotalWithoutSamples - loyaltyPointsUsed);
        
        if (amountForCashback > 0) {
          // Calculate user's loyalty tier based on lifetime spending
          const { data: ordersData } = await supabase
            .from('orders')
            .select('subtotal, total')
            .eq('user_id', order.user_id)
            .in('status', ['delivered', 'shipped', 'processing']);
          
          let lifetimeSpending = 0;
          if (ordersData && ordersData.length > 0) {
            lifetimeSpending = ordersData.reduce((sum: number, o: any) => {
              return sum + ((o.subtotal || o.total) || 0);
            }, 0);
          }
          
          // Determine tier
          let tier: 'basic' | 'silver' | 'gold' | 'platinum' = 'basic';
          if (lifetimeSpending >= 200000) {
            tier = 'platinum';
          } else if (lifetimeSpending >= 100000) {
            tier = 'gold';
          } else if (lifetimeSpending >= 50000) {
            tier = 'silver';
          }
          
          // Calculate cashback percentage based on tier
          const cashbackPercentage = 
            tier === 'platinum' ? 0.10 :
            tier === 'gold' ? 0.07 :
            tier === 'silver' ? 0.05 :
            0.03; // basic
          
          loyaltyPointsEarned = Math.floor(amountForCashback * cashbackPercentage);
          console.log(`💎 Calculated loyalty points to earn: ${loyaltyPointsEarned} (tier: ${tier}, cashback: ${cashbackPercentage * 100}%)`);
        }
      }
    }
    
    // Load payment settings from settings table
    console.log('🔍 Attempting to load payment settings from database...');
    const { data: paymentSettings, error: paymentError } = await supabase
      .from('settings')
      .select('*')
      .eq('key', 'payment')
      .single();
    
    if (paymentError) {
      console.error('❌ Error loading payment settings:', paymentError);
    }
    
    console.log('💳 Payment settings loaded:', !!paymentSettings);
    if (paymentSettings) {
      console.log('📦 Raw payment settings:', JSON.stringify(paymentSettings, null, 2));
    }
    
    let paymentDetails = undefined;
    if (paymentSettings && paymentSettings.value) {
      try {
        const settings = typeof paymentSettings.value === 'string' 
          ? JSON.parse(paymentSettings.value) 
          : paymentSettings.value;
        
        console.log('🔧 Parsed settings:', JSON.stringify(settings, null, 2));
        
        paymentDetails = {
          cardNumber: settings.cardNumber || '2202 2004 3395 7386',
          contractNumber: settings.contractNumber || '505 518 5408',
          qrCodeUrl: settings.qrCodeUrl || undefined
        };
        console.log('💳 Payment details prepared:', { 
          hasQrCode: !!paymentDetails.qrCodeUrl,
          qrCodeUrlLength: paymentDetails.qrCodeUrl ? paymentDetails.qrCodeUrl.length : 0,
          qrCodeUrlPreview: paymentDetails.qrCodeUrl ? paymentDetails.qrCodeUrl.substring(0, 50) + '...' : 'none',
          cardNumber: paymentDetails.cardNumber,
          contractNumber: paymentDetails.contractNumber
        });
      } catch (e) {
        console.error('❌ Error parsing payment settings:', e);
      }
    } else {
      console.warn('⚠️ No payment settings found in database');
    }
    
    // Transform order data to match OrderEmailData interface
    const orderEmailData = {
      orderId: orderNumber,
      orderDate: order.created_at,
      customerName: order.full_name || 'Клиент',
      status: status as 'pending' | 'processing' | 'shipped' | 'delivered',
      items: (order.items || []).map((item: any) => ({
        name: item.name || item.title || 'Товар',
        quantity: item.quantity || 1,
        price: item.price || 0,
        total: (item.price || 0) * (item.quantity || 1),
        image: item.image,
        id: item.id
      })),
      deliveryMethod: order.shipping_info?.deliveryMethod || 'russian_post',
      deliveryCost: order.shipping_cost || 0,
      totalAmount: order.total || 0,
      shippingAddress: {
        fullName: order.shipping_info?.fullName || order.full_name || '',
        address: order.shipping_info?.address || ''
      },
      paymentMethod: order.payment_method,
      promoCode: order.promo_code,
      promoDiscount: order.promo_discount,
      loyaltyPointsUsed: order.loyalty_points_used,
      loyaltyPointsEarned: loyaltyPointsEarned,
      currentLoyaltyBalance: currentLoyaltyBalance,
      trackingNumber: order.tracking_number,
      trackingUrl: order.tracking_url,
      paymentDetails: paymentDetails
    };
    
    console.log('📝 Order data prepared:', {
      orderId: orderEmailData.orderId,
      itemsCount: orderEmailData.items.length,
      hasItems: orderEmailData.items.length > 0,
      firstItem: orderEmailData.items[0]
    });
    
    const htmlMessage = generateOrderEmailHTML(orderEmailData, language as any);
    console.log('✅ HTML generated, length:', htmlMessage.length);

    console.log('📤 Sending to Resend API...');
    const emailPayload = {
      from: 'Азия Фарм <info@asia-pharm.com>',
      to: [email],
      subject: subject,
      html: htmlMessage
    };
    console.log('Email payload:', { from: emailPayload.from, to: emailPayload.to, subject: emailPayload.subject, htmlLength: htmlMessage.length });

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify(emailPayload)
    });

    console.log('Resend response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`❌ Resend API error (${response.status}):`, errorData);
      return c.json({ error: `Failed to send email: ${errorData}`, status: response.status }, 500);
    }

    const result = await response.json();
    console.log('✅ Order email sent successfully:', result.id);

    return c.json({ success: true, emailId: result.id });

  } catch (error: any) {
    console.error('❌ Error sending order email:', error);
    console.error('Error stack:', error.stack);
    return c.json({ error: error.message || 'Failed to send email', details: error.stack }, 500);
  }
});

// Send welcome email to new user
app.post('/make-server-a75b5353/api/email/welcome', async (c) => {
  try {
    console.log('📧 Welcome email request');
    const { email, name, language } = await c.req.json();
    console.log('Request params:', { email, name, language });

    if (!email) {
      console.error('❌ Missing email');
      return c.json({ error: 'Email is required' }, 400);
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('❌ RESEND_API_KEY not configured');
      return c.json({ error: 'Email service not configured' }, 500);
    }

    const { generateWelcomeEmailHTML } = await import('./email-templates.tsx');
    const userLanguage = language || 'ru';
    
    const subjects = {
      ru: 'Добро пожаловать на сайт Азия Фарм!',
      en: 'Welcome to Asia Pharm!',
      zh: '欢迎来到亚洲药房！',
      vi: 'Chào mừng đến với Asia Pharm!'
    };

    const subject = subjects[userLanguage as keyof typeof subjects] || subjects.ru;
    console.log('📬 Email subject:', subject);
    
    const htmlMessage = generateWelcomeEmailHTML({
      name: name || email,
      email: email,
      language: userLanguage
    }, userLanguage as any);
    
    console.log('✅ HTML generated, length:', htmlMessage.length);

    console.log('📤 Sending to Resend API...');
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: 'Азия Фарм <info@asia-pharm.com>',
        to: [email],
        subject: subject,
        html: htmlMessage
      })
    });

    console.log('Resend response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`❌ Resend API error (${response.status}):`, errorData);
      return c.json({ error: `Failed to send email: ${errorData}`, status: response.status }, 500);
    }

    const result = await response.json();
    console.log('✅ Welcome email sent successfully:', result.id);

    return c.json({ success: true, emailId: result.id });

  } catch (error: any) {
    console.error('❌ Error sending welcome email:', error);
    console.error('Error stack:', error.stack);
    return c.json({ error: error.message || 'Failed to send email', details: error.stack }, 500);
  }
});

// Send email broadcast
app.post('/make-server-a75b5353/api/email/broadcast', requireAdmin, async (c) => {
  try {
    console.log('📧 Email broadcast request');
    const { subject, htmlContent } = await c.req.json();

    if (!subject || !htmlContent) {
      return c.json({ error: 'Subject and content required' }, 400);
    }

    const supabase = getSupabaseAdmin();
    
    console.log('🔍 Querying profiles table for email subscribers...');
    
    // Query users with email notifications enabled
    const { data: subscribers, error } = await supabase
      .from('profiles')
      .select('id, email, name, email_notifications_enabled')
      .eq('email_notifications_enabled', true);
    
    if (error) {
      console.error('❌ Error fetching subscribers:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      
      // If column doesn't exist, return helpful error
      if (error.code === '42703' || error.message.toLowerCase().includes('column') || error.message.toLowerCase().includes('does not exist')) {
        console.error('💥 Column email_notifications_enabled does NOT exist!');
        return c.json({ 
          error: 'Database not configured',
          details: 'Column email_notifications_enabled does not exist. Run PROFILES_SUBSCRIPTIONS_UPDATE.sql in Supabase Dashboard.',
          hint: 'ALTER TABLE profiles ADD COLUMN email_notifications_enabled BOOLEAN DEFAULT TRUE;',
          debugUrl: '/make-server-a75b5353/api/debug/db-check'
        }, 500);
      }
      
      return c.json({ error: 'Failed to fetch subscribers', details: error.message, code: error.code }, 500);
    }
    
    console.log(`✅ Found ${subscribers?.length || 0} email subscribers`);
    
    if (!subscribers || subscribers.length === 0) {
      return c.json({ success: true, sent: 0, failed: 0, total: 0, message: 'No subscribers found' });
    }
    
    console.log(`📧 Broadcasting to ${subscribers.length} subscribers`);
    
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    console.log('RESEND_API_KEY status:', resendApiKey ? `Set (${resendApiKey.substring(0, 10)}...)` : 'NOT SET');
    
    if (!resendApiKey) {
      console.error('❌ RESEND_API_KEY not found in environment variables!');
      return c.json({ 
        error: 'RESEND_API_KEY not configured',
        hint: 'Add RESEND_API_KEY to Supabase Edge Function secrets'
      }, 500);
    }
    
    const { generateBroadcastEmailHTML } = await import('./email-templates.tsx');
    
    let sentCount = 0;
    let failedCount = 0;
    
    for (let i = 0; i < subscribers.length; i++) {
      const subscriber = subscribers[i];
      try {
        // Default to 'ru' if language not available
        const userLanguage = 'ru' as 'ru' | 'en' | 'zh' | 'vi';
        const unsubscribeUrl = 'https://asia-pharm.com/profile';
        
        const fullHtml = generateBroadcastEmailHTML(
          subject,
          htmlContent,
          userLanguage,
          unsubscribeUrl
        );
        
        console.log(`📤 [${i + 1}/${subscribers.length}] Sending to ${subscriber.email}...`);
        
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey}`
          },
          body: JSON.stringify({
            from: 'Азия Фарм <info@asia-pharm.com>',
            to: [subscriber.email],
            subject: subject,
            html: fullHtml
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          sentCount++;
          console.log(`✅ [${i + 1}/${subscribers.length}] Sent to ${subscriber.email}, ID: ${result.id}`);
        } else {
          failedCount++;
          const errorData = await response.text();
          console.error(`❌ [${i + 1}/${subscribers.length}] Failed: ${subscriber.email}`, errorData);
          
          if (response.status === 429) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 600));
        
      } catch (emailError) {
        failedCount++;
        console.error(`❌ Error sending to ${subscriber.email}:`, emailError);
      }
    }
    
    console.log(`📊 Broadcast complete: ${sentCount} sent, ${failedCount} failed`);
    
    return c.json({
      success: true,
      sent: sentCount,
      failed: failedCount,
      total: subscribers.length
    });
    
  } catch (error: any) {
    console.error('❌ Error in email broadcast:', error);
    return c.json({ error: error.message || 'Failed to send broadcast' }, 500);
  }
});

// Get email subscribers count
app.get('/make-server-a75b5353/api/email/subscribers-count', requireAdmin, async (c) => {
  try {
    const supabase = getSupabaseAdmin();
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('subscribed_to_newsletter', true);
    
    if (error) {
      console.error('❌ Error fetching subscribers count:', error);
      
      // If column doesn't exist
      if (error.code === '42703' || error.message.includes('column') || error.message.includes('does not exist')) {
        console.warn('⚠️ Column subscribed_to_newsletter does not exist - returning 0');
        return c.json({ count: 0, warning: 'Database column not configured' });
      }
      
      return c.json({ error: 'Failed to get count', details: error.message }, 500);
    }
    
    return c.json({ count: count || 0 });
  } catch (error: any) {
    console.error('❌ Error getting subscribers count:', error);
    return c.json({ error: 'Failed to get count', details: error.message }, 500);
  }
});

// ============================================================================
// Push Notifications API
// ============================================================================

// Send push notification
app.post('/make-server-a75b5353/api/push/send', requireAdmin, async (c) => {
  try {
    console.log('📱 Push notification request');
    const body = await c.req.json();
    const { title, message, url, icon, image, data, userIds, externalUserIds, segments, tags, language, store } = body;

    console.log('📥 Request body:', JSON.stringify(body, null, 2));
    console.log('📦 Parsed segments:', segments, 'Type:', typeof segments, 'IsArray:', Array.isArray(segments));

    if (!title || !message) {
      return c.json({ error: 'Title and message required' }, 400);
    }

    const { settings, source } = await getOneSignalSettings();
    console.log('OneSignal settings loaded from:', source);
    
    // Support both old (apiKey) and new (restApiKey) format
    const apiKey = settings?.restApiKey || settings?.apiKey;

    if (!settings || !settings.appId || !apiKey) {
      console.error('❌ OneSignal not configured');
      console.error('Settings object:', settings);
      console.error('Checked sources: settings table, KV store');
      return c.json({ 
        error: 'OneSignal not configured',
        details: 'Save OneSignal settings in Admin Panel first',
        hint: 'Go to Admin Panel → OneSignal Settings and save your App ID and REST API Key',
        debugUrl: '/make-server-a75b5353/api/debug/onesignal-check'
      }, 500);
    }
    
    // Check if this is a User Auth Key (starts with os_v2_org_)
    if (apiKey.startsWith('os_v2_org_')) {
      console.error('❌ WRONG API KEY TYPE!');
      console.error('You provided a USER AUTH KEY (os_v2_org_...), but we need REST API KEY');
      return c.json({ 
        error: 'Wrong OneSignal API Key Type',
        details: 'You are using a User Auth Key (os_v2_org_...). Please use REST API KEY instead.',
        hint: 'OneSignal Dashboard → Settings → Keys & IDs → REST API KEY (starts with Basic or just random string)',
        currentKeyType: 'User Auth Key (WRONG)',
        expectedKeyType: 'REST API Key'
      }, 500);
    }
    
    console.log('✅ OneSignal configured:', {
      hasAppId: !!settings.appId,
      hasApiKey: !!apiKey,
      apiKeyPrefix: apiKey.substring(0, 10) + '...',
      apiKeyStartsWithBasic: apiKey.startsWith('Basic'),
      apiKeyStartsWithOs: apiKey.startsWith('os_'),
      apiKeyLength: apiKey.length,
      enabled: settings.enabled,
      keySource: settings.restApiKey ? 'restApiKey' : 'apiKey',
    });

    const notificationData: any = {
      app_id: settings.appId,
      headings: { en: title },
      contents: { en: message },
    };

    // Add targeting - priority: externalUserIds (Supabase User IDs) > userIds > tags > get from DB > segments (fallback)
    // IMPORTANT: OneSignal SDK v16 requires External User IDs (Supabase User IDs) for reliable targeting
    if (externalUserIds && externalUserIds.length > 0) {
      notificationData.include_external_user_ids = externalUserIds;
      console.log('🎯 Targeting specific users via External User IDs (Supabase User IDs):', externalUserIds.length);
      console.log('📋 External User IDs:', JSON.stringify(externalUserIds));
    } else if (userIds && userIds.length > 0) {
      // Fallback to player IDs (less reliable with SDK v16)
      notificationData.include_player_ids = userIds;
      console.log('⚠️ Targeting via Player/Subscription IDs (fallback):', userIds.length);
      console.log('📋 Player/Subscription IDs:', JSON.stringify(userIds));
    } else if (tags && Object.keys(tags).length > 0) {
      const filters: any[] = [];
      Object.entries(tags).forEach(([key, value]) => {
        filters.push({ field: 'tag', key, relation: '=', value });
      });
      notificationData.filters = filters;
      console.log('🎯 Targeting by tags:', tags);
    } else {
      // Get all active External User IDs (Supabase User IDs) from database
      console.log('📊 Fetching active External User IDs (Supabase User IDs) from database...');
      const supabase = getSupabaseAdmin();
      const { data: subscriptions, error: subError } = await supabase
        .from('user_push_subscriptions')
        .select('user_id')
        .eq('is_active', true);
      
      if (subError) {
        console.error('❌ Error fetching subscriptions:', subError);
        // Fallback to segments if DB query fails
        const hasSegments = segments && Array.isArray(segments) && segments.length > 0;
        const targetSegments = hasSegments ? segments : ['All'];
        notificationData.included_segments = targetSegments;
        console.log('⚠️ Using segments as fallback:', targetSegments);
      } else {
        const externalUserIdsFromDB = subscriptions?.map(s => s.user_id).filter(Boolean) || [];
        console.log('📊 Found', externalUserIdsFromDB.length, 'active External User IDs in database');
        console.log('📋 External User IDs (Supabase):', JSON.stringify(externalUserIdsFromDB.slice(0, 3)), '...');
        
        if (externalUserIdsFromDB.length > 0) {
          // Use External User IDs (Supabase User IDs) from database
          notificationData.include_external_user_ids = externalUserIdsFromDB;
          console.log('🎯 Targeting', externalUserIdsFromDB.length, 'users via External User IDs');
          console.log('✅ Using External User IDs (Supabase User IDs) for reliable delivery');
        } else {
          console.warn('⚠️ No active subscriptions found in database');
          // Still try to send to segments as last resort
          const hasSegments = segments && Array.isArray(segments) && segments.length > 0;
          const targetSegments = hasSegments ? segments : ['All'];
          notificationData.included_segments = targetSegments;
          console.log('⚠️ Using segments as fallback (no DB subs):', targetSegments);
        }
      }
    }

    if (url) {
      notificationData.url = url;
    }

    if (icon) {
      notificationData.small_icon = icon;
      notificationData.large_icon = icon;
    }

    if (image) {
      notificationData.big_picture = image;
    }

    if (data) {
      notificationData.data = data;
    }

    // CRITICAL DEBUG: Log the EXACT key before formatting
    console.log('🔍 CRITICAL DEBUG - Raw API Key from KV:');
    console.log('FULL_RAW_KEY:', apiKey);
    console.log('Key length:', apiKey.length);
    console.log('First 20 chars:', apiKey.substring(0, 20));
    console.log('Last 20 chars:', apiKey.substring(apiKey.length - 20));
    console.log('Contains spaces:', apiKey.includes(' '));
    console.log('Starts with Basic:', apiKey.startsWith('Basic'));
    console.log('Starts with Basic (with space):', apiKey.startsWith('Basic '));
    
    // OneSignal REST API expects: Basic <REST_API_KEY>
    // The REST API key itself should NOT contain "Basic"
    // We need to add "Basic " prefix if not present
    let authHeader = apiKey;
    
    // If key already has "Basic " prefix, use as is
    if (apiKey.startsWith('Basic ')) {
      authHeader = apiKey;
      console.log('✅ Key already has "Basic " prefix, using as is');
    } 
    // If key is just "Basic" without space and key, add space
    else if (apiKey.startsWith('Basic') && !apiKey.startsWith('Basic ')) {
      authHeader = apiKey.replace('Basic', 'Basic ');
      console.log('⚠️ Key has "Basic" without space, fixing...');
    }
    // If key doesn't have "Basic" at all, add it
    else {
      authHeader = `Basic ${apiKey}`;
      console.log('✅ Adding "Basic " prefix to key');
    }
    
    console.log('🔑 FINAL Authorization header to send:');
    console.log('FULL_AUTH_HEADER:', authHeader);
    console.log('Header length:', authHeader.length);

    console.log('📤 Sending to OneSignal API...');
    console.log('App ID:', settings.appId);
    console.log('Notification data:', JSON.stringify(notificationData));
    console.log('🎯 Targeting:', {
      segments: notificationData.included_segments,
      userIds: notificationData.include_player_ids,
      filters: notificationData.filters,
    });
    
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(notificationData)
    });
    
    console.log('📥 OneSignal response status:', response.status);
    console.log('📥 OneSignal response headers:', JSON.stringify([...response.headers.entries()]));

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`❌ OneSignal API error (${response.status}):`, errorData);
      return c.json({ error: `Failed to send notification: ${errorData}` }, 500);
    }

    const result = await response.json();
    console.log('✅ OneSignal API Response:');
    console.log('FULL_RESPONSE:', JSON.stringify(result, null, 2));
    console.log('Response keys:', Object.keys(result));
    console.log('ID:', result.id);
    console.log('Recipients:', result.recipients);
    console.log('Errors:', result.errors);

    // Check for errors even with 200 status
    if (result.errors && result.errors.length > 0) {
      console.error('❌ OneSignal returned errors:', result.errors);
      return c.json({
        error: 'OneSignal API returned errors',
        details: result.errors,
        id: result.id || '',
        recipients: 0,
        success: false
      }, 500);
    }

    if (!result.id) {
      console.error('❌ OneSignal did not return notification ID');
      return c.json({
        error: 'No notification ID returned',
        details: 'OneSignal API did not return a notification ID. Check your API key and app configuration.',
        id: '',
        recipients: 0,
        success: false
      }, 500);
    }

    // OneSignal API doesn't return recipients count in initial response
    // We need to fetch notification details to get actual recipient count
    let recipientCount = result.recipients || 0;
    
    if (result.id) {
      console.log('📊 Fetching notification stats for ID:', result.id);
      try {
        // Wait a bit for OneSignal to process the notification
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const statsResponse = await fetch(`https://onesignal.com/api/v1/notifications/${result.id}?app_id=${settings.appId}`, {
          method: 'GET',
          headers: {
            'Authorization': authHeader
          }
        });
        
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          console.log('📊 Notification stats:');
          console.log('FULL_STATS:', JSON.stringify(statsData, null, 2));
          console.log('Successful:', statsData.successful);
          console.log('Failed:', statsData.failed);
          console.log('Errored:', statsData.errored);
          console.log('Converted:', statsData.converted);
          console.log('Remaining:', statsData.remaining);
          
          recipientCount = statsData.successful || statsData.recipients || 0;
          console.log('✅ Actual recipients:', recipientCount);
        } else {
          console.warn('⚠️ Could not fetch notification stats');
        }
      } catch (error) {
        console.warn('⚠️ Error fetching notification stats:', error);
      }
    }

    return c.json({ 
      success: true, 
      id: result.id,
      recipients: recipientCount,
      errors: result.errors
    });

  } catch (error: any) {
    console.error('❌ Error sending push:', error);
    console.error('❌ Error stack:', error.stack);
    return c.json({ 
      error: error.message || 'Failed to send notification',
      id: '',
      recipients: 0,
      success: false
    }, 500);
  }
});

// Get push notification stats
app.get('/make-server-a75b5353/api/push/stats', requireAdmin, async (c) => {
  try {
    console.log('📊 Push stats request');

    const { settings, source } = await getOneSignalSettings();
    console.log('OneSignal settings loaded from:', source);
    
    // Support both old (apiKey) and new (restApiKey) format
    const apiKey = settings?.restApiKey || settings?.apiKey;

    if (!settings || !settings.appId || !apiKey) {
      console.error('❌ OneSignal not configured');
      console.error('Settings object:', settings);
      console.error('Checked sources: settings table, KV store');
      return c.json({ 
        error: 'OneSignal not configured', 
        players: 0,
        details: 'Save OneSignal settings in Admin Panel first',
        hint: 'Go to Admin Panel → OneSignal Settings and save your App ID and REST API Key',
        debugUrl: '/make-server-a75b5353/api/debug/onesignal-check'
      });
    }
    
    // Check if this is a User Auth Key (starts with os_v2_org_)
    if (apiKey.startsWith('os_v2_org_')) {
      console.error('❌ WRONG API KEY TYPE! User Auth Key detected');
      return c.json({ 
        error: 'Wrong OneSignal API Key Type',
        players: 0,
        details: 'You are using a User Auth Key. Please use REST API KEY instead.',
        hint: 'OneSignal Dashboard → Settings → Keys & IDs → REST API KEY'
      });
    }
    
    console.log('✅ OneSignal configured, fetching stats from API...');

    // CRITICAL DEBUG: Log the EXACT key before formatting
    console.log('🔍 STATS DEBUG - Raw API Key from KV:');
    console.log('FULL_RAW_KEY:', apiKey);
    
    // OneSignal REST API expects: Basic <REST_API_KEY>
    let authHeader = apiKey;
    if (apiKey.startsWith('Basic ')) {
      authHeader = apiKey;
    } else if (apiKey.startsWith('Basic') && !apiKey.startsWith('Basic ')) {
      authHeader = apiKey.replace('Basic', 'Basic ');
    } else {
      authHeader = `Basic ${apiKey}`;
    }
    
    console.log('🔑 FINAL Stats Authorization header:');
    console.log('FULL_AUTH_HEADER:', authHeader);

    console.log('📤 Fetching OneSignal app stats...');
    console.log('App ID:', settings.appId);
    
    // Get app info from OneSignal
    const response = await fetch(`https://onesignal.com/api/v1/apps/${settings.appId}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader
      }
    });
    
    console.log('📥 OneSignal stats response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`❌ OneSignal API error (${response.status}):`, errorData);
      return c.json({ error: 'Failed to get stats', count: 0 });
    }

    const appData = await response.json();
    console.log('✅ OneSignal App Data:');
    console.log('FULL_APP_DATA:', JSON.stringify(appData, null, 2));
    console.log('App Data keys:', Object.keys(appData));
    
    const subscriberCount = appData.players || 0;
    console.log(`✅ OneSignal subscribers (players): ${subscriberCount}`);

    return c.json({ 
      success: true, 
      players: subscriberCount,
      count: subscriberCount,
      appId: settings.appId,
      appName: appData.name
    });

  } catch (error: any) {
    console.error('❌ Error getting push stats:', error);
    return c.json({ error: error.message || 'Failed to get stats', count: 0 });
  }
});

// ============================================================================
// KV Store API
// ============================================================================

app.get('/make-server-a75b5353/api/kv/get', requireAdmin, async (c) => {
  try {
    const key = c.req.query('key');
    if (!key) return c.json({ error: 'Key required' }, 400);
    
    const value = await kv.get(key);
    return c.json({ success: true, key, value, hasValue: value !== null });
  } catch (error) {
    console.error('❌ Error getting KV value:', error);
    return c.json({ error: 'Failed to get value' }, 500);
  }
});

app.post('/make-server-a75b5353/api/kv/set', requireAdmin, async (c) => {
  try {
    const { key, value } = await c.req.json();
    if (!key || value === undefined) {
      return c.json({ error: 'Key and value required' }, 400);
    }
    
    await kv.set(key, value);
    console.log(`✅ KV store updated: ${key}`);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('❌ Error setting KV value:', error);
    return c.json({ error: 'Failed to set value' }, 500);
  }
});

app.delete('/make-server-a75b5353/api/kv/delete', requireAdmin, async (c) => {
  try {
    const key = c.req.query('key');
    if (!key) return c.json({ error: 'Key required' }, 400);
    
    await kv.del(key);
    console.log(`✅ KV store key deleted: ${key}`);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('❌ Error deleting KV value:', error);
    return c.json({ error: 'Failed to delete value' }, 500);
  }
});

// ============================================================================
// Google Translate API
// ============================================================================

// Helper function to map language codes to Google Translate codes
const mapLanguageCode = (language: string): string => {
  const mapping: Record<string, string> = {
    'ru': 'ru',
    'en': 'en',
    'zh': 'zh-CN',  // Используем у��рощенный китайский
    'vi': 'vi',
    'auto': 'auto'
  };
  return mapping[language] || language;
};

// Helper function to map language codes for MyMemory API
const mapLanguageCodeForMyMemory = (language: string): string => {
  const mapping: Record<string, string> = {
    'ru': 'ru-RU',
    'en': 'en-US',
    'zh': 'zh-CN',
    'vi': 'vi-VN',
    'auto': 'auto'
  };
  return mapping[language] || language;
};

// Helper function to split text into chunks for MyMemory API (max 500 chars)
const splitTextIntoChunks = (text: string, maxLength: number = 450): string[] => {
  if (text.length <= maxLength) {
    return [text];
  }
  
  const chunks: string[] = [];
  let currentChunk = '';
  
  // Разбиваем по HTML тегам, чтобы не разрывать структуру
  const parts = text.split(/(<[^>]+>)/g);
  
  for (const part of parts) {
    if ((currentChunk + part).length <= maxLength) {
      currentChunk += part;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      currentChunk = part;
      
      // Если один тег больше лимита, разбиваем по пробелам
      if (part.length > maxLength) {
        const words = part.split(' ');
        currentChunk = '';
        for (const word of words) {
          if ((currentChunk + ' ' + word).length <= maxLength) {
            currentChunk += (currentChunk ? ' ' : '') + word;
          } else {
            if (currentChunk) chunks.push(currentChunk);
            currentChunk = word;
          }
        }
      }
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
};

app.get('/make-server-a75b5353/api/translate/key', requireAdmin, async (c) => {
  try {
    const apiKey = await kv.get('google_translate_api_key');
    return c.json({ 
      success: true, 
      hasKey: !!apiKey,
      keyPreview: apiKey ? `${apiKey.substring(0, 10)}...` : null
    });
  } catch (error) {
    return c.json({ error: 'Failed to get API key' }, 500);
  }
});

app.post('/make-server-a75b5353/api/translate/key', requireAdmin, async (c) => {
  try {
    const { apiKey } = await c.req.json();
    if (!apiKey) return c.json({ error: 'API key required' }, 400);
    
    await kv.set('google_translate_api_key', apiKey);
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to save API key' }, 500);
  }
});

app.delete('/make-server-a75b5353/api/translate/key', requireAdmin, async (c) => {
  try {
    await kv.del('google_translate_api_key');
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to delete API key' }, 500);
  }
});

// Translate text endpoint (alias for /text for backwards compatibility)
app.post('/make-server-a75b5353/api/translate', requireAdmin, async (c) => {
  try {
    const { text, targetLanguage, sourceLanguage } = await c.req.json();
    
    if (!text || !targetLanguage) {
      return c.json({ error: 'Text and target language are required' }, 400);
    }
    
    const requestId = Math.random().toString(36).substring(7);
    console.log(`\n🔵 [${requestId}] NEW TRANSLATION REQUEST`);
    console.log(`🌍 [${requestId}] From ${sourceLanguage || 'auto'} to ${targetLanguage}`);
    const textPreview = text.length > 100 ? text.substring(0, 100) + '...' : text;
    console.log(`📝 [${requestId}] Input text: "${textPreview}" (${text.length} chars)`);
    
    const sourceLangCode = mapLanguageCodeForMyMemory(sourceLanguage || 'auto');
    const targetLangCode = mapLanguageCodeForMyMemory(targetLanguage);
    const langPair = sourceLangCode === 'auto' ? targetLangCode : `${sourceLangCode}|${targetLangCode}`;
    
    console.log(`🔤 [${requestId}] Language pair: ${langPair}`);
    
    // MyMemory API имеет лимит 500 символов, разбиваем на части
    const chunks = splitTextIntoChunks(text, 450);
    console.log(`📦 [${requestId}] Split into ${chunks.length} chunk(s)`);
    
    const translatedChunks: string[] = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkPreview = chunk.length > 50 ? chunk.substring(0, 50) + '...' : chunk;
      console.log(`🔄 [${requestId}] Translating chunk ${i + 1}/${chunks.length}: "${chunkPreview}"`);
      
      const translateUrl = new URL('https://api.mymemory.translated.net/get');
      translateUrl.searchParams.set('q', chunk);
      translateUrl.searchParams.set('langpair', langPair);
      
      const urlPreview = translateUrl.toString().length > 150 ? translateUrl.toString().substring(0, 150) + '...' : translateUrl.toString();
      console.log(`🌐 [${requestId}] API URL: ${urlPreview}`);
      
      const response = await fetch(translateUrl.toString(), {
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) {
        console.error(`❌ [${requestId}] MyMemory API error: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error(`[${requestId}] Error details: ${errorText}`);
        throw new Error(`Translation failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Проверяем на ошибки в ответе
      if (data.responseStatus !== 200 && data.responseData?.translatedText?.includes('LIMIT EXCEEDED')) {
        console.error(`❌ [${requestId}] MyMemory API limit exceeded`);
        throw new Error('Translation limit exceeded. Please try with shorter text.');
      }
      
      if (!data || !data.responseData || !data.responseData.translatedText) {
        console.error(`❌ [${requestId}] Invalid response format:`, data);
        throw new Error('Invalid response format from MyMemory API');
      }
      
      const translatedChunk = data.responseData.translatedText;
      translatedChunks.push(translatedChunk);
      const resultPreview = translatedChunk.length > 50 ? translatedChunk.substring(0, 50) + '...' : translatedChunk;
      console.log(`✅ [${requestId}] Chunk ${i + 1}/${chunks.length} result: "${resultPreview}"`);
      
      // Небольшая задержка между запросами
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    const translatedText = translatedChunks.join('');
    const finalPreview = translatedText.length > 100 ? translatedText.substring(0, 100) + '...' : translatedText;
    console.log(`🎯 [${requestId}] FINAL OUTPUT: "${finalPreview}" (${translatedText.length} chars)\n`);
    
    return c.json({ 
      success: true, 
      translatedText,
      provider: 'MyMemory',
      chunks: chunks.length
    });
  } catch (error) {
    console.error('❌ Translation error:', error);
    return c.json({ 
      error: error instanceof Error ? error.message : 'Translation failed' 
    }, 500);
  }
});

// Translate text endpoint
app.post('/make-server-a75b5353/api/translate/text', requireAdmin, async (c) => {
  try {
    const { text, targetLanguage, sourceLanguage } = await c.req.json();
    
    if (!text || !targetLanguage) {
      return c.json({ error: 'Text and target language are required' }, 400);
    }
    
    console.log(`🌍 Translating from ${sourceLanguage || 'auto'} to ${targetLanguage}`);
    console.log(`📝 Text length: ${text.length} chars`);
    
    const sourceLangCode = mapLanguageCodeForMyMemory(sourceLanguage || 'auto');
    const targetLangCode = mapLanguageCodeForMyMemory(targetLanguage);
    const langPair = sourceLangCode === 'auto' ? targetLangCode : `${sourceLangCode}|${targetLangCode}`;
    
    // MyMemory API имеет лимит 500 символов, разбиваем на части
    const chunks = splitTextIntoChunks(text, 450);
    console.log(`📦 Split into ${chunks.length} chunk(s)`);
    
    const translatedChunks: string[] = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`🔄 Translating chunk ${i + 1}/${chunks.length} (${chunk.length} chars)...`);
      
      const translateUrl = new URL('https://api.mymemory.translated.net/get');
      translateUrl.searchParams.set('q', chunk);
      translateUrl.searchParams.set('langpair', langPair);
      
      const response = await fetch(translateUrl.toString(), {
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) {
        console.error(`❌ MyMemory API error: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error(`Error details: ${errorText}`);
        throw new Error(`Translation failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Проверяем на ошибки в ответе
      if (data.responseStatus !== 200 && data.responseData?.translatedText?.includes('LIMIT EXCEEDED')) {
        console.error('❌ MyMemory API limit exceeded');
        throw new Error('Translation limit exceeded. Please try with shorter text.');
      }
      
      if (!data || !data.responseData || !data.responseData.translatedText) {
        console.error('❌ Invalid response format:', data);
        throw new Error('Invalid response format from MyMemory API');
      }
      
      translatedChunks.push(data.responseData.translatedText);
      console.log(`✅ Chunk ${i + 1}/${chunks.length} translated`);
      
      // Небольшая задержка между запросами
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    const translatedText = translatedChunks.join('');
    console.log(`✅ Translation complete: ${translatedText.length} chars`);
    
    return c.json({ 
      success: true, 
      translatedText,
      provider: 'MyMemory',
      chunks: chunks.length
    });
  } catch (error) {
    console.error('❌ Translation error:', error);
    return c.json({ 
      error: error instanceof Error ? error.message : 'Translation failed' 
    }, 500);
  }
});

// Batch translate endpoint
app.post('/make-server-a75b5353/api/translate/batch', requireAdmin, async (c) => {
  try {
    const { texts, targetLanguage, sourceLanguage } = await c.req.json();
    
    if (!texts || !Array.isArray(texts) || !targetLanguage) {
      return c.json({ error: 'Texts array and target language are required' }, 400);
    }
    
    console.log(`🌍 Batch translating ${texts.length} texts from ${sourceLanguage || 'auto'} to ${targetLanguage}`);
    
    // Переводим каждый текст по отдельности с использованием MyMemory API
    const translations = await Promise.all(
      texts.map(async (text: string, index: number) => {
        try {
          const sourceLangCode = mapLanguageCodeForMyMemory(sourceLanguage || 'auto');
          const targetLangCode = mapLanguageCodeForMyMemory(targetLanguage);
          const langPair = sourceLangCode === 'auto' ? targetLangCode : `${sourceLangCode}|${targetLangCode}`;
          
          // Разбиваем текст на части если он длинный
          const chunks = splitTextIntoChunks(text, 450);
          const translatedChunks: string[] = [];
          
          for (const chunk of chunks) {
            const translateUrl = new URL('https://api.mymemory.translated.net/get');
            translateUrl.searchParams.set('q', chunk);
            translateUrl.searchParams.set('langpair', langPair);
            
            const response = await fetch(translateUrl.toString(), {
              headers: {
                'Accept': 'application/json',
              }
            });
            
            if (!response.ok) {
              console.error(`❌ Batch item ${index + 1} chunk failed: ${response.status}`);
              throw new Error(`Translation failed: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data || !data.responseData || !data.responseData.translatedText) {
              throw new Error('Invalid response format');
            }
            
            translatedChunks.push(data.responseData.translatedText);
            
            // Не��ольшая задержка между частями
            await new Promise(resolve => setTimeout(resolve, 200));
          }
          
          const translatedText = translatedChunks.join('');
          console.log(`✅ Batch item ${index + 1}/${texts.length} translated successfully (${chunks.length} chunks)`);
          
          // Добавляем задержку между текстами
          await new Promise(resolve => setTimeout(resolve, 300));
          
          return { translatedText };
        } catch (error) {
          console.error(`❌ Error translating batch item ${index + 1}:`, error);
          return { translatedText: text, error: true };
        }
      })
    );
    
    return c.json({ 
      success: true, 
      translations,
      provider: 'MyMemory'
    });
  } catch (error) {
    console.error('Batch translation error:', error);
    return c.json({ 
      error: error instanceof Error ? error.message : 'Batch translation failed' 
    }, 500);
  }
});

// ============================================================================
// Auto Push Notifications (called from database triggers)
// ============================================================================

// Notification templates (multi-language)
const PUSH_TEMPLATES: any = {
  order_pending: {
    ru: { title: '✅ Заказ успешно оформлен', message: (data: any) => `Заказ №${data.orderNumber} успешно оформлен. Ожидает оплаты.` },
    zh: { title: '✅ 订单已成功下单', message: (data: any) => `订单 №${data.orderNumber} 已成功下单。等待付款。` },
    en: { title: '✅ Order Successfully Placed', message: (data: any) => `Order №${data.orderNumber} successfully placed. Awaiting payment.` },
    vi: { title: '✅ Đơn hàng đã đặt thành công', message: (data: any) => `Đơn hàng №${data.orderNumber} đã đặt thành công. Đang chờ thanh toán.` },
  },
  order_processing: {
    ru: { title: '💳 Оплата заказа получена', message: (data: any) => `Оплата заказа №${data.orderNumber} получена. Заказ обрабатывается.` },
    zh: { title: '💳 已收到订单付款', message: (data: any) => `已收到订单 №${data.orderNumber} 的付款。订单正在处理中。` },
    en: { title: '💳 Order Payment Received', message: (data: any) => `Payment for order №${data.orderNumber} received. Processing order.` },
    vi: { title: '💳 Đã nhận thanh toán đơn hàng', message: (data: any) => `Đã nhận thanh toán cho đơn hàng №${data.orderNumber}. Đang xử lý đơn hàng.` },
  },
  order_shipped: {
    ru: { title: '🚚 Заказ отправлен', message: (data: any) => `Заказ №${data.orderNumber} отправлен. Нажмите ��ля отслеживания.` },
    zh: { title: '🚚 订单已发货', message: (data: any) => `订单 №${data.orderNumber} 已发货。点击跟踪。` },
    en: { title: '🚚 Order Shipped', message: (data: any) => `Order №${data.orderNumber} has been shipped. Click to track.` },
    vi: { title: '🚚 Đơn hàng đã gửi', message: (data: any) => `Đơn hàng №${data.orderNumber} đã được gửi. Nhấp để theo dõi.` },
  },
  order_delivered: {
    ru: { title: '📦 Заказ доставлен', message: (data: any) => `Заказ №${data.orderNumber} доставлен. Спасибо за покупку!` },
    zh: { title: '📦 订单已送达', message: (data: any) => `订单 №${data.orderNumber} 已送达。感谢您的购买！` },
    en: { title: '📦 Order Delivered', message: (data: any) => `Order №${data.orderNumber} has been delivered. Thank you for your purchase!` },
    vi: { title: '📦 Đơn hàng đã giao', message: (data: any) => `Đơn hàng №${data.orderNumber} đã được giao. Cảm ơn bạn đã mua hàng!` },
  },
  order_cancelled: {
    ru: { title: '❌ Заказ отменен', message: (data: any) => `Заказ №${data.orderNumber} отменен.` },
    zh: { title: '❌ 订单已取消', message: (data: any) => `订单 №${data.orderNumber} 已被取消。` },
    en: { title: '❌ Order Cancelled', message: (data: any) => `Order №${data.orderNumber} has been cancelled.` },
    vi: { title: '❌ Đơn hàng đã hủy', message: (data: any) => `Đơn hàng №${data.orderNumber} đã bị hủy.` },
  },
  welcome: {
    ru: { title: '🎉 Добро пожаловать!', message: 'Добро пожаловать в Asia Pharm! Вы будете получать уведомления о статусе заказов.' },
    zh: { title: '🎉 欢迎！', message: '欢迎来到Asia Pharm！您将收到有关订单状态的通知。' },
    en: { title: '🎉 Welcome!', message: 'Welcome to Asia Pharm! You will receive notifications about your order status.' },
    vi: { title: '🎉 Chào mừng!', message: 'Chào mừng đến với Asia Pharm! Bạn sẽ nhận được thông báo về trạng thái đơn hàng.' },
  },
  loyalty_earned: {
    ru: { title: '🎁 Баллы начислены', message: (data: any) => `Начислено баллов лояльности: ${data.points}` },
    zh: { title: '🎁 积分已获得', message: (data: any) => `已获得忠诚度积分: ${data.points}` },
    en: { title: '🎁 Points Earned', message: (data: any) => `Loyalty points earned: ${data.points}` },
    vi: { title: '🎁 Điểm đã nhận', message: (data: any) => `Điểm thưởng đã nhận: ${data.points}` },
  },
  loyalty_spent: {
    ru: { title: '💎 Баллы списаны', message: (data: any) => `Списано баллов лояльности: ${data.points}` },
    zh: { title: '💎 积分已使用', message: (data: any) => `已使用忠诚度积分: ${data.points}` },
    en: { title: '💎 Points Spent', message: (data: any) => `Loyalty points spent: ${data.points}` },
    vi: { title: '💎 Điểm đã dùng', message: (data: any) => `Điểm thưởng đã sử dụng: ${data.points}` },
  },
};

// Generate deep link URL with hash navigation
function generatePushUrl(type: string, data: any): string {
  const baseUrl = 'https://asia-pharm.ru'; // Production URL
  
  // Use hash navigation for SPA routing
  switch (type) {
    case 'order_pending':
      // Navigate to payment info page for this specific order
      return data.orderId ? `${baseUrl}/#payment-${data.orderId}` : `${baseUrl}/#profile`;
    
    case 'order_processing':
    case 'order_delivered':
    case 'order_cancelled':
      // Navigate to profile with specific order selected
      return data.orderId ? `${baseUrl}/#profile?order=${data.orderId}` : `${baseUrl}/#profile`;
    
    case 'order_shipped':
      // If trackingUrl exists (full link to tracking service), use it directly
      // Otherwise, navigate to profile with order selected
      if (data.trackingUrl && data.trackingUrl.startsWith('http')) {
        return data.trackingUrl;
      }
      return data.orderId ? `${baseUrl}/#profile?order=${data.orderId}` : `${baseUrl}/#profile`;
    
    case 'welcome':
      // Welcome notification - navigate to home page
      return baseUrl;
    
    case 'loyalty_earned':
    case 'loyalty_spent':
      // Loyalty notifications - navigate to profile loyalty tab
      return `${baseUrl}/#profile?tab=loyalty`;
    
    default:
      return baseUrl;
  }
}

/**
 * Auto Push Notification Endpoint
 * Called from database triggers (no auth required - uses internal calls)
 * 
 * POST /make-server-a75b5353/api/push/auto-notify
 * Body: {
 *   userId: string (Supabase User ID)
 *   type: 'order_pending' | 'order_processing' | 'order_shipped' | 'order_delivered' | 'order_cancelled' | 'welcome' | 'loyalty_earned' | 'loyalty_spent'
 *   orderId?: string
 *   orderNumber?: string
 *   trackingNumber?: string
 *   trackingUrl?: string
 *   points?: number
 * }
 */
app.post('/make-server-a75b5353/api/push/auto-notify', async (c) => {
  try {
    console.log('🔔 Auto push notification request');
    const body = await c.req.json();
    const { userId, type, orderId, orderNumber, trackingNumber, trackingUrl, points } = body;

    console.log('📥 Auto push data:', { userId, type, orderId, orderNumber, points });

    if (!userId || !type) {
      console.error('❌ Missing required fields:', { userId, type });
      return c.json({ error: 'userId and type required' }, 400);
    }

    if (!PUSH_TEMPLATES[type]) {
      console.error('❌ Unknown notification type:', type);
      return c.json({ error: 'Unknown notification type' }, 400);
    }
    
    // Validate orderNumber for order-related notifications
    if (type.startsWith('order_') && !orderNumber) {
      console.warn('⚠️ Order notification without orderNumber:', { type, orderId });
      // Continue anyway, use fallback
    }

    const supabase = getSupabaseAdmin();

    // ✅ Check if user has push notifications enabled (via External User ID)
    // We don't need to check player_ids - OneSignal will find all devices by External User ID
    console.log('🔍 Checking if user has push notifications enabled:', userId);
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('push_notifications_enabled, language')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('❌ Error fetching user profile:', profileError);
      return c.json({ error: 'Failed to fetch user profile', details: profileError.message }, 500);
    }

    if (!profile || !profile.push_notifications_enabled) {
      console.log('ℹ️ User has push notifications disabled:', userId);
      return c.json({ 
        success: false, 
        message: 'User has push notifications disabled',
        userId,
        type
      }, 200);
    }
    
    console.log('✅ User has push notifications enabled');

    // Get user's language
    const userLanguage = profile?.language || 'ru';
    console.log('🌐 User language:', userLanguage);

    // Get notification content
    const template = PUSH_TEMPLATES[type][userLanguage] || PUSH_TEMPLATES[type]['ru'];
    const title = template.title;
    
    // Prepare data for template - orderNumber is REQUIRED for order notifications
    // Do NOT use orderId as fallback to avoid sending duplicate notifications
    const templateData = {
      orderNumber: orderNumber || 'N/A',
      orderId,
      points
    };
    
    // Log detailed information about order notification
    if (type.startsWith('order_')) {
      console.log('📋 Order notification details:', {
        type,
        orderId,
        orderNumber,
        hasOrderNumber: !!orderNumber,
        orderNumberType: typeof orderNumber,
        orderNumberValue: orderNumber
      });
      
      if (!orderNumber) {
        console.error('❌ CRITICAL: orderNumber is MISSING for order notification!');
        console.error('❌ This will show "N/A" to the user instead of the actual order number.');
        console.error('❌ Please ensure orderNumber is passed in the request body.');
        console.error('❌ Received data:', { type, orderId, orderNumber, trackingNumber, trackingUrl, points });
      }
    }
    
    const message = typeof template.message === 'function' 
      ? template.message(templateData) 
      : template.message;
    
    // Use trackingNumber as trackingUrl if it's a URL
    const actualTrackingUrl = trackingUrl || (trackingNumber && trackingNumber.startsWith('http') ? trackingNumber : null);
    
    const url = generatePushUrl(type, { orderId, orderNumber, trackingUrl: actualTrackingUrl });

    console.log('📝 Push content:', { title, message, url, templateData, trackingNumber, actualTrackingUrl });

    // Get OneSignal settings
    const { settings, source } = await getOneSignalSettings();
    console.log('OneSignal settings loaded from:', source);
    
    const apiKey = settings?.restApiKey || settings?.apiKey;

    if (!settings || !settings.appId || !apiKey) {
      console.error('❌ OneSignal not configured');
      return c.json({ 
        error: 'OneSignal not configured',
        details: 'Configure OneSignal in Admin Panel'
      }, 500);
    }

    // Check for wrong key type
    if (apiKey.startsWith('os_v2_org_')) {
      console.error('❌ Wrong API key type detected');
      return c.json({ 
        error: 'Wrong OneSignal API Key Type',
        details: 'User Auth Key detected, need REST API Key'
      }, 500);
    }

    console.log('✅ OneSignal configured, sending push...');

    // ✅ IMPORTANT: Use External User ID (Supabase User ID) instead of Player IDs
    // After OneSignal.login(userId) implementation, all devices are linked via External ID
    // This ensures notifications reach ALL user's devices (browser, PWA, mobile)
    console.log('🎯 Using External User ID for targeting:', userId);

    // Prepare notification payload
    const notificationData: any = {
      app_id: settings.appId,
      include_external_user_ids: [userId], // ✅ Changed from include_player_ids to include_external_user_ids
      headings: { en: title },
      contents: { en: message },
      url: url,
      data: {
        type,
        orderId,
        orderNumber,
        trackingNumber,
        points,
      },
    };

    // Format auth header
    let authHeader = apiKey;
    if (apiKey.startsWith('Basic ')) {
      authHeader = apiKey;
    } else if (apiKey.startsWith('Basic') && !apiKey.startsWith('Basic ')) {
      authHeader = apiKey.replace('Basic', 'Basic ');
    } else {
      authHeader = `Basic ${apiKey}`;
    }

    console.log('📤 Sending to OneSignal API...');
    console.log('🔧 Notification payload:', {
      appId: settings.appId,
      externalUserId: userId, // ✅ Changed from playerIds to externalUserId
      title: notificationData.headings.en,
      message: notificationData.contents.en,
      url: notificationData.url,
      type: type
    });

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(notificationData)
    });

    console.log('📥 OneSignal response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`❌ OneSignal API error (${response.status}):`, errorData);
      return c.json({ 
        error: `Failed to send notification: ${errorData}`,
        status: response.status 
      }, 500);
    }

    const result = await response.json();
    console.log('✅ Push sent successfully:', {
      notificationId: result.id,
      recipients: result.recipients || 'N/A', // ✅ Changed - no longer using playerIds.length
      externalUserId: userId, // ✅ Added External User ID
      type,
      orderNumber,
      title,
      message
    });

    return c.json({ 
      success: true, 
      id: result.id,
      recipients: result.recipients || 'N/A',
      type,
      userId,
      orderNumber,
      message
    });

  } catch (error: any) {
    console.error('❌ Error in auto push:', error);
    console.error('Error stack:', error.stack);
    return c.json({ 
      error: error.message || 'Failed to send auto push',
      details: error.stack
    }, 500);
  }
});

// ============================================================================
// Error Handlers
// ============================================================================

app.notFound((c) => {
  const path = new URL(c.req.url).pathname;
  console.log('❌ 404:', path);
  return c.json({ 
    error: 'Not Found',
    path: path,
    hint: 'Check /make-server-a75b5353/ for available routes'
  }, 404);
});

// ============================================================================
// DEBUG ENDPOINTS - Remove after fixing
// ============================================================================

// Check database schema
app.get('/make-server-a75b5353/api/debug/db-check', requireAdmin, async (c) => {
  try {
    const supabase = getSupabaseAdmin();
    
    // Try to get one profile with all fields
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, name, subscribed, subscribed_to_newsletter')
      .limit(1);
    
    if (error) {
      return c.json({ 
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        message: 'Database query failed - check if columns exist'
      }, 500);
    }
    
    // Count subscribers
    const { count: pushCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('subscribed', true);
    
    const { count: emailCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('subscribed_to_newsletter', true);
    
    return c.json({
      success: true,
      message: 'Database is correctly configured',
      schema: {
        hasSubscribedColumn: true,
        hasSubscribedToNewsletterColumn: true,
      },
      stats: {
        pushSubscribers: pushCount || 0,
        emailSubscribers: emailCount || 0,
      },
      sampleData: data?.[0] || null,
    });
  } catch (error: any) {
    return c.json({ 
      error: error.message,
      stack: error.stack,
    }, 500);
  }
});

// Check OneSignal configuration
app.get('/make-server-a75b5353/api/debug/onesignal-check', requireAdmin, async (c) => {
  try {
    // Get settings using new unified function
    const { settings, source } = await getOneSignalSettings();
    
    // Also check KV store separately for debugging
    const kvSettings = await kv.get('oneSignalSettings');
    
    // Check settings table separately for debugging
    const supabase = getSupabaseAdmin();
    let settingsTableData = null;
    try {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'oneSignal')
        .maybeSingle();
      settingsTableData = data?.value;
    } catch (e) {
      console.warn('Error checking settings table:', e);
    }
    
    // Check which key is available
    const apiKey = settings?.restApiKey || settings?.apiKey;
    const keyType = settings?.restApiKey ? 'restApiKey (new)' : settings?.apiKey ? 'apiKey (old)' : 'none';
    
    // Detect if wrong key type
    let keyWarning = null;
    let keyAnalysis = {
      startsWithBasic: false,
      startsWithOs: false,
      length: 0,
      hasSpaces: false,
      format: 'unknown'
    };
    
    if (apiKey) {
      keyAnalysis = {
        startsWithBasic: apiKey.startsWith('Basic '),
        startsWithOs: apiKey.startsWith('os_'),
        length: apiKey.length,
        hasSpaces: apiKey.includes(' '),
        format: apiKey.startsWith('os_v2_org_') ? 'User Auth Key (WRONG!)' : 
                apiKey.startsWith('Basic ') ? 'REST API Key with Basic prefix' :
                apiKey.length > 30 ? 'REST API Key (correct format)' : 'Unknown/Invalid'
      };
      
      if (apiKey.startsWith('os_v2_org_')) {
        keyWarning = '⚠️ WRONG KEY TYPE! This is a User Auth Key (os_v2_org_...). You need REST API KEY!';
      }
    }
    
    return c.json({
      success: true,
      loadedFrom: source,
      currentSettings: {
        exists: !!settings,
        configured: !!(settings?.appId && apiKey),
        keyType: keyType,
        hasAppId: !!settings?.appId,
        hasApiKey: !!apiKey,
        enabled: settings?.enabled || false,
        // Show partial key for verification
        appIdPrefix: settings?.appId ? settings.appId.substring(0, 8) + '...' : null,
        apiKeyPrefix: apiKey ? apiKey.substring(0, 15) + '...' : null,
        apiKeySuffix: apiKey ? '...' + apiKey.substring(apiKey.length - 5) : null,
        isUserAuthKey: apiKey ? apiKey.startsWith('os_v2_org_') : false,
        keyAnalysis: keyAnalysis,
        warning: keyWarning,
        fullKey: apiKey, // FOR DEBUG ONLY - REMOVE IN PRODUCTION!
      },
      debug: {
        settingsTable: {
          exists: !!settingsTableData,
          data: settingsTableData ? {
            hasAppId: !!(settingsTableData as any)?.appId,
            hasRestApiKey: !!(settingsTableData as any)?.restApiKey,
            appIdPrefix: (settingsTableData as any)?.appId?.substring(0, 8) + '...' || null,
          } : null,
        },
        kvStore: {
          exists: !!kvSettings,
          data: kvSettings ? {
            hasAppId: !!kvSettings.appId,
            hasRestApiKey: !!kvSettings.restApiKey,
            hasApiKey: !!kvSettings.apiKey,
            appIdPrefix: kvSettings.appId?.substring(0, 8) + '...' || null,
          } : null,
        },
      },
      note: keyWarning || 'Settings loaded successfully. Save settings in Admin Panel if not configured.',
      help: {
        wrongKey: keyWarning ? true : false,
        solution: keyWarning ? 'Go to OneSignal Dashboard → Settings → Keys & IDs → Copy REST API KEY (NOT User Auth Key)' : null,
        migration: source === 'kv_store' ? 'Settings loaded from KV store. They will be migrated to settings table on next save.' : 
                   source === 'settings_table' ? 'Settings loaded from settings table (preferred).' :
                   'No settings found. Configure in Admin Panel → OneSignal Settings.'
      }
    });
  } catch (error: any) {
    return c.json({ 
      error: error.message,
      stack: error.stack,
    }, 500);
  }
});

app.onError((err, c) => {
  console.error('❌ Server error:', err);
  return c.json({ 
    error: 'Internal Server Error', 
    message: err.message 
  }, 500);
});

console.log('✅ Edge Function v2.2.9-SETTINGS-FIX initialized!');
console.log('📌 OneSignal settings will be loaded from settings table (preferred) or KV store (fallback)');
Deno.serve(app.fetch);
