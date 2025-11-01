// Asia-Pharm Server - Edge Function Entry Point
// Version: 2.1.0-FULL - Complete API with all endpoints
// Build: 2024-11-01 23:30:00 UTC
// All routes prefixed with /make-server-a75b5353

import { Hono } from 'npm:hono';
import { logger } from 'npm:hono/logger';
import { cors } from 'npm:hono/cors';
import { createClient } from 'npm:@supabase/supabase-js';
import * as kv from './kv_store.tsx';

console.log('🚀 Starting Asia-Pharm Edge Function v2.1.0...');
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
  return c.json({ 
    status: 'OK',
    message: 'Asia-Pharm API v2.1.0 - Full Implementation',
    version: '2.1.0-FULL',
    timestamp: new Date().toISOString(),
    routes: {
      email: ['/make-server-a75b5353/api/email/order-status', '/make-server-a75b5353/api/email/broadcast'],
      push: ['/make-server-a75b5353/api/push/send', '/make-server-a75b5353/api/push/stats'],
      kv: ['/make-server-a75b5353/api/kv/*'],
      translate: ['/make-server-a75b5353/api/translate/*'],
    },
    env: {
      hasResendKey: !!Deno.env.get('RESEND_API_KEY'),
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

    if (!orderId || !email || !status) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const supabase = getSupabaseAdmin();
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('❌ Order not found:', orderError);
      return c.json({ error: 'Order not found' }, 404);
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('❌ RESEND_API_KEY not configured');
      return c.json({ error: 'Email service not configured' }, 500);
    }

    const { generateOrderEmailHTML } = await import('./email-templates.tsx');
    const orderNumber = order.order_number || order.id.substring(0, 8);
    const language = order.language || 'ru';

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
    const htmlMessage = generateOrderEmailHTML(order, status as any, language as any);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: 'Asia Pharm <onboarding@resend.dev>',
        to: [email],
        subject: subject,
        html: htmlMessage
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`❌ Resend API error (${response.status}):`, errorData);
      return c.json({ error: `Failed to send email: ${errorData}` }, 500);
    }

    const result = await response.json();
    console.log('✅ Order email sent:', result.id);

    return c.json({ success: true, emailId: result.id });

  } catch (error: any) {
    console.error('❌ Error sending order email:', error);
    return c.json({ error: error.message || 'Failed to send email' }, 500);
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
    const { data: subscribers, error } = await supabase
      .from('profiles')
      .select('id, email, name, language')
      .eq('subscribed_to_newsletter', true);
    
    if (error) {
      console.error('Error fetching subscribers:', error);
      return c.json({ error: 'Failed to fetch subscribers' }, 500);
    }
    
    if (!subscribers || subscribers.length === 0) {
      return c.json({ success: true, sent: 0, failed: 0, total: 0, message: 'No subscribers found' });
    }
    
    console.log(`📧 Broadcasting to ${subscribers.length} subscribers`);
    
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      return c.json({ error: 'RESEND_API_KEY not configured' }, 500);
    }
    
    const { generateBroadcastEmailHTML } = await import('./email-templates.tsx');
    
    let sentCount = 0;
    let failedCount = 0;
    
    for (let i = 0; i < subscribers.length; i++) {
      const subscriber = subscribers[i];
      try {
        const userLanguage = (subscriber.language || 'ru') as 'ru' | 'en' | 'zh' | 'vi';
        const unsubscribeUrl = 'https://asia-pharm.com/profile';
        
        const fullHtml = generateBroadcastEmailHTML(
          subject,
          htmlContent,
          userLanguage,
          unsubscribeUrl
        );
        
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey}`
          },
          body: JSON.stringify({
            from: 'Asia Pharm <onboarding@resend.dev>',
            to: [subscriber.email],
            subject: subject,
            html: fullHtml
          })
        });
        
        if (response.ok) {
          sentCount++;
          console.log(`✅ [${i + 1}/${subscribers.length}] Sent to ${subscriber.email}`);
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
      console.error('Error fetching subscribers count:', error);
      return c.json({ error: 'Failed to get count' }, 500);
    }
    
    return c.json({ count: count || 0 });
  } catch (error: any) {
    console.error('❌ Error getting subscribers count:', error);
    return c.json({ error: 'Failed to get count' }, 500);
  }
});

// ============================================================================
// Push Notifications API
// ============================================================================

// Send push notification
app.post('/make-server-a75b5353/api/push/send', requireAdmin, async (c) => {
  try {
    console.log('📱 Push notification request');
    const { title, message, url } = await c.req.json();

    if (!title || !message) {
      return c.json({ error: 'Title and message required' }, 400);
    }

    const settings = await kv.get('oneSignalSettings');

    if (!settings || !settings.appId || !settings.restApiKey) {
      console.error('❌ OneSignal not configured');
      return c.json({ error: 'OneSignal not configured' }, 500);
    }

    const notificationData: any = {
      app_id: settings.appId,
      included_segments: ['All'],
      headings: { en: title },
      contents: { en: message },
    };

    if (url) {
      notificationData.url = url;
    }

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${settings.restApiKey}`
      },
      body: JSON.stringify(notificationData)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`❌ OneSignal API error (${response.status}):`, errorData);
      return c.json({ error: `Failed to send notification: ${errorData}` }, 500);
    }

    const result = await response.json();
    console.log('✅ Push notification sent:', result.id);

    return c.json({ success: true, notificationId: result.id, recipients: result.recipients || 0 });

  } catch (error: any) {
    console.error('❌ Error sending push:', error);
    return c.json({ error: error.message || 'Failed to send notification' }, 500);
  }
});

// Get push notification stats
app.get('/make-server-a75b5353/api/push/stats', requireAdmin, async (c) => {
  try {
    console.log('📊 Push stats request');

    const settings = await kv.get('oneSignalSettings');

    if (!settings || !settings.appId || !settings.restApiKey) {
      console.error('❌ OneSignal not configured');
      return c.json({ error: 'OneSignal not configured', count: 0 });
    }

    // Get app info from OneSignal
    const response = await fetch(`https://onesignal.com/api/v1/apps/${settings.appId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${settings.restApiKey}`
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`❌ OneSignal API error (${response.status}):`, errorData);
      return c.json({ error: 'Failed to get stats', count: 0 });
    }

    const appData = await response.json();
    const subscriberCount = appData.players || 0;

    console.log(`✅ OneSignal subscribers: ${subscriberCount}`);

    return c.json({ 
      success: true, 
      count: subscriberCount,
      appId: settings.appId
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

app.onError((err, c) => {
  console.error('❌ Server error:', err);
  return c.json({ 
    error: 'Internal Server Error', 
    message: err.message 
  }, 500);
});

console.log('✅ Edge Function v2.1.0 initialized!');
Deno.serve(app.fetch);
