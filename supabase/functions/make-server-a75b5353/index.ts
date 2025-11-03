// Asia-Pharm Server - Edge Function Entry Point
// Version: 2.2.5-TEST-TO-ME - Send test notifications to current user + fix "All" segment
// Build: 2024-11-03 15:30:00 UTC
// All routes prefixed with /make-server-a75b5353

import { Hono } from 'npm:hono';
import { logger } from 'npm:hono/logger';
import { cors } from 'npm:hono/cors';
import { createClient } from 'npm:@supabase/supabase-js';
import * as kv from './kv_store.tsx';

console.log('🚀 Starting Asia-Pharm Edge Function v2.2.5-TEST-TO-ME...');
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

// Auth middleware
const requireAdmin = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.split(' ')[1];
  const supabase = getSupabaseAdmin();
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.is_admin) {
    return c.json({ error: 'Admin access required' }, 403);
  }

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
    message: 'Asia-Pharm API v2.2.5 - Test to Me + All Segment',
    version: '2.2.5-TEST-TO-ME',
    timestamp: new Date().toISOString(),
    routes: {
      email: ['/make-server-a75b5353/api/email/order-status', '/make-server-a75b5353/api/email/broadcast', '/make-server-a75b5353/api/email/subscribers-count'],
      push: ['/make-server-a75b5353/api/push/send', '/make-server-a75b5353/api/push/stats'],
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

// Send order status email
app.post('/make-server-a75b5353/api/email/order-status', requireAdmin, async (c) => {
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
      trackingNumber: order.tracking_number,
      trackingUrl: order.tracking_url
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
    
    // First check if column exists - language is optional
    const { data: subscribers, error } = await supabase
      .from('profiles')
      .select('id, email, name, subscribed_to_newsletter')
      .eq('subscribed_to_newsletter', true);
    
    if (error) {
      console.error('❌ Error fetching subscribers:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      
      // If column doesn't exist, return helpful error
      if (error.code === '42703' || error.message.toLowerCase().includes('column') || error.message.toLowerCase().includes('does not exist')) {
        console.error('💥 Column subscribed_to_newsletter does NOT exist!');
        return c.json({ 
          error: 'Database not configured',
          details: 'Column subscribed_to_newsletter does not exist. Run SUBSCRIPTIONS_FIX.sql in Supabase Dashboard.',
          hint: 'ALTER TABLE profiles ADD COLUMN subscribed_to_newsletter BOOLEAN DEFAULT FALSE;',
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
    const { title, message, url, icon, image, data, userIds, segments, tags, language, store } = body;

    console.log('📥 Request body:', JSON.stringify(body, null, 2));

    if (!title || !message) {
      return c.json({ error: 'Title and message required' }, 400);
    }

    console.log('🔍 Loading OneSignal settings from KV store...');
    const settings = await kv.get('oneSignalSettings');
    console.log('OneSignal settings:', settings ? 'Found' : 'Not found');
    
    // Support both old (apiKey) and new (restApiKey) format
    const apiKey = settings?.restApiKey || settings?.apiKey;

    if (!settings || !settings.appId || !apiKey) {
      console.error('❌ OneSignal not configured in KV store');
      console.error('Settings object:', settings);
      return c.json({ 
        error: 'OneSignal not configured',
        details: 'Save OneSignal settings in Admin Panel first',
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

    // Add targeting - priority: userIds > tags > segments (default to All)
    if (userIds && userIds.length > 0) {
      notificationData.include_player_ids = userIds;
      console.log('🎯 Targeting specific users:', userIds.length);
    } else if (tags && Object.keys(tags).length > 0) {
      const filters: any[] = [];
      Object.entries(tags).forEach(([key, value]) => {
        filters.push({ field: 'tag', key, relation: '=', value });
      });
      notificationData.filters = filters;
      console.log('🎯 Targeting by tags:', tags);
    } else {
      // Default to "All" segment which includes all subscribed users including test users
      const targetSegments = segments && segments.length > 0 ? segments : ['All'];
      notificationData.included_segments = targetSegments;
      console.log('🎯 Targeting segments:', targetSegments);
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

    console.log('🔍 Loading OneSignal settings from KV store...');
    const settings = await kv.get('oneSignalSettings');
    console.log('OneSignal settings:', settings ? 'Found' : 'Not found');
    
    // Support both old (apiKey) and new (restApiKey) format
    const apiKey = settings?.restApiKey || settings?.apiKey;

    if (!settings || !settings.appId || !apiKey) {
      console.error('❌ OneSignal not configured in KV store');
      console.error('Settings object:', settings);
      return c.json({ 
        error: 'OneSignal not configured', 
        players: 0,
        details: 'Save OneSignal settings in Admin Panel first',
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
    // Try to get from KV store
    const kvSettings = await kv.get('oneSignalSettings');
    
    // Check which key is available
    const apiKey = kvSettings?.restApiKey || kvSettings?.apiKey;
    const keyType = kvSettings?.restApiKey ? 'restApiKey (new)' : kvSettings?.apiKey ? 'apiKey (old)' : 'none';
    
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
      kvStore: {
        exists: !!kvSettings,
        configured: !!(kvSettings?.appId && apiKey),
        keyType: keyType,
        hasAppId: !!kvSettings?.appId,
        hasApiKey: !!apiKey,
        enabled: kvSettings?.enabled || false,
        // Show partial key for verification
        appIdPrefix: kvSettings?.appId ? kvSettings.appId.substring(0, 8) + '...' : null,
        apiKeyPrefix: apiKey ? apiKey.substring(0, 15) + '...' : null,
        apiKeySuffix: apiKey ? '...' + apiKey.substring(apiKey.length - 5) : null,
        isUserAuthKey: apiKey ? apiKey.startsWith('os_v2_org_') : false,
        keyAnalysis: keyAnalysis,
        warning: keyWarning,
        fullKey: apiKey, // FOR DEBUG ONLY - REMOVE IN PRODUCTION!
      },
      note: keyWarning || 'Both apiKey and restApiKey are supported. Save settings in Admin Panel if not configured.',
      help: {
        wrongKey: keyWarning ? true : false,
        solution: keyWarning ? 'Go to OneSignal Dashboard → Settings → Keys & IDs → Copy REST API KEY (NOT User Auth Key)' : null,
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

console.log('✅ Edge Function v2.2.5-TEST-TO-ME initialized!');
Deno.serve(app.fetch);
