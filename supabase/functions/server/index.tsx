// Asia-Pharm Server - Edge Function
// Version: 2.0
import { Hono } from 'npm:hono';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js';
import * as kv from './kv_store.tsx';
import { generateOrderEmailHTML, generateOrderEmailText, generateWelcomeEmailHTML } from './email-templates.tsx';

const app = new Hono();

// Custom CORS middleware - set headers explicitly
app.use('*', async (c, next) => {
  // Set CORS headers for all requests
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey, x-client-info');
  c.header('Access-Control-Expose-Headers', 'Content-Length, X-JSON');
  c.header('Access-Control-Max-Age', '86400');
  
  // Handle preflight OPTIONS request
  if (c.req.method === 'OPTIONS') {
    c.status(200);
    return c.body(null);
  }
  
  await next();
});

app.use('*', logger(console.log));

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
const requireAuth = async (c: any, next: any) => {
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

  c.set('user', user);
  await next();
};

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

// Helper function to generate order number in format DDMM + sequence
async function generateOrderNumber(): Promise<string> {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `${day}${month}`;
  
  // Get current sequence number
  const seqKey = `order_sequence:${prefix}`;
  let sequence = await kv.get(seqKey);
  
  if (!sequence) {
    sequence = 1;
  } else {
    sequence = sequence + 1;
  }
  
  await kv.set(seqKey, sequence);
  
  // Format: DDMM + 2-digit sequence (e.g., 201001, 201002)
  const orderNumber = `${prefix}${String(sequence).padStart(2, '0')}`;
  return orderNumber;
}

// Helper function to calculate loyalty points with tiered system
function calculateLoyaltyPoints(subtotal: number, totalLifetime: number): number {
  // New loyalty tiers based on lifetime total:
  // 3% for all
  // 5% when total >= 50,000
  // 7% when total >= 100,000
  // 10% when total >= 200,000
  
  let points = 0;
  const previousTotal = totalLifetime - subtotal;
  
  // Tier thresholds
  const tier1 = 50000;   // 3% -> 5%
  const tier2 = 100000;  // 5% -> 7%
  const tier3 = 200000;  // 7% -> 10%
  
  // Calculate points with progressive tiers
  let remaining = subtotal;
  let currentTotal = previousTotal;
  
  while (remaining > 0) {
    let rate = 0.03; // Default 3%
    let nextThreshold = tier1;
    
    if (currentTotal >= tier3) {
      rate = 0.10;
      nextThreshold = Infinity;
    } else if (currentTotal >= tier2) {
      rate = 0.07;
      nextThreshold = tier3;
    } else if (currentTotal >= tier1) {
      rate = 0.05;
      nextThreshold = tier2;
    } else {
      rate = 0.03;
      nextThreshold = tier1;
    }
    
    // Calculate amount at current rate
    const amountAtRate = Math.min(remaining, nextThreshold - currentTotal);
    points += Math.floor(amountAtRate * rate);
    
    remaining -= amountAtRate;
    currentTotal += amountAtRate;
  }
  
  return points;
}

// Helper function to update user loyalty points
async function updateUserLoyalty(userId: string, points: number, type: 'earned' | 'spent', description: string) {
  try {
    // Get current user loyalty data
    const userLoyaltyKey = `user_loyalty:${userId}`;
    let loyaltyData = await kv.get(userLoyaltyKey);
    
    if (!loyaltyData) {
      loyaltyData = {
        userId,
        points: 0,
        totalEarned: 0,
        totalSpent: 0,
        history: []
      };
    }
    
    // Update points
    if (type === 'earned') {
      loyaltyData.points += points;
      loyaltyData.totalEarned += points;
    } else {
      loyaltyData.points -= points;
      loyaltyData.totalSpent += points;
    }
    
    // Add to history
    loyaltyData.history.unshift({
      id: crypto.randomUUID(),
      points,
      type,
      description,
      createdAt: new Date().toISOString()
    });
    
    // Keep only last 100 history items
    if (loyaltyData.history.length > 100) {
      loyaltyData.history = loyaltyData.history.slice(0, 100);
    }
    
    await kv.set(userLoyaltyKey, loyaltyData);
    return loyaltyData;
  } catch (error) {
    console.error('Error updating user loyalty:', error);
    throw error;
  }
}

// Helper function to get user's LIFETIME order total (NEW LOYALTY SYSTEM)
async function getUserLifetimeTotal(userId: string): Promise<number> {
  try {
    console.log(`📊 Calculating LIFETIME total for user: ${userId}`);
    
    // Get all user orders
    const userOrders = await kv.getByPrefix(`user_order:${userId}:`);
    console.log(`📦 Found ${userOrders.length} user orders`);
    
    let lifetimeTotal = 0;
    
    for (const userOrder of userOrders) {
      const orderId = userOrder.value;
      const order = await kv.get(`order:${orderId}`);
      
      if (order && order.status === 'delivered') {
        const orderTotal = order.subtotal || order.totalPrice || 0;
        lifetimeTotal += orderTotal;
        console.log(`✅ Added ${orderTotal} ₽ to lifetime total (Order #${order.orderNumber || orderId.slice(0, 6)})`);
      }
    }
    
    console.log(`💎 FINAL LIFETIME TOTAL: ${lifetimeTotal} ₽`);
    return lifetimeTotal;
  } catch (error) {
    console.error('❌ Error calculating lifetime total:', error);
    return 0;
  }
}

// DEPRECATED: Old monthly function - redirects to lifetime
async function getUserMonthlyTotal(userId: string): Promise<number> {
  console.log('⚠️ getUserMonthlyTotal is deprecated, using getUserLifetimeTotal instead');
  return getUserLifetimeTotal(userId);
}

// Helper function to send welcome email after registration
async function sendWelcomeEmail(email: string, userData: any) {
  try {
    const emailSettings = await kv.get('setting:email');
    
    // Check if email is explicitly disabled (but allow if settings don't exist)
    if (emailSettings && emailSettings.enabled === false) {
      console.log('📧 Email sending is disabled in settings');
      return { success: false, message: 'Email disabled' };
    }

    const language = userData.language || 'ru';
    const welcomeHTML = generateWelcomeEmailHTML(userData, language);
    
    const subjects = {
      ru: 'Добро пожаловать на сайт Азия Фарм!',
      en: 'Welcome to Asia Pharm!',
      zh: '欢迎来到亚洲药房！',
      vi: 'Chào mừng đến với Asia Pharm!'
    };

    console.log(`📧 Sending welcome email to ${email} (language: ${language})`);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: emailSettings?.from || 'Asia Pharm <info@asia-pharm.com>',
        to: [email],
        subject: subjects[language] || subjects.ru,
        html: welcomeHTML,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Welcome email sent successfully:', data.id);
      return { success: true, emailId: data.id };
    } else {
      const error = await response.text();
      console.error('❌ Failed to send welcome email:', error);
      return { success: false, error };
    }
  } catch (error) {
    console.error('❌ Exception sending welcome email:', error);
    return { success: false, error: String(error) };
  }
}

// Helper function to send order emails with professional HTML template
async function sendOrderEmail(email: string, order: any, type: 'new' | 'status_update' | 'tracking') {
  try {
    // Get email settings from KV store
    const emailSettings = await kv.get('setting:email');
    
    // Get payment settings for QR code
    const paymentSettings = await kv.get('setting:payment');
    
    // Check if email notifications are enabled
    if (!emailSettings) {
      console.log('⚠️ Email settings not configured, skipping email notification');
      return { success: false, reason: 'Email settings not configured' };
    }

    // Check if this type of notification is enabled
    const notificationTypeMap = {
      'new': 'sendOrderConfirmation',
      'status_update': 'sendShippingNotification',
      'tracking': 'sendShippingNotification',
    };
    
    const notificationType = notificationTypeMap[type];
    if (notificationType && !emailSettings[notificationType]) {
      console.log(`⚠️ ${type} email notifications are disabled`);
      return { success: false, reason: 'Notification type disabled' };
    }

    const orderNum = order.orderNumber || order.id.slice(0, 6);

    // Map type to status - use order.status directly when available
    let status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' = 'pending';
    
    if (type === 'new') {
      status = 'pending';
    } else if (type === 'tracking') {
      status = 'shipped';
    } else if (type === 'status_update') {
      // Use the actual order status for status updates
      const orderStatus = order.status?.toLowerCase();
      if (orderStatus === 'delivered' || orderStatus === 'доставлен') {
        status = 'delivered';
      } else if (orderStatus === 'shipped' || orderStatus === 'отправлен') {
        status = 'shipped';
      } else if (orderStatus === 'cancelled' || orderStatus === 'отменен') {
        status = 'cancelled';
      } else if (orderStatus === 'processing' || orderStatus === 'в обработке') {
        status = 'processing';
      } else {
        status = 'processing'; // default for status_update
      }
    }

    // Calculate loyalty points correctly based on user's lifetime total
    let calculatedLoyaltyPoints = 0;
    if (order.userId && (status === 'pending' || status === 'processing')) {
      try {
        // Get all user orders for lifetime total
        const userOrderKeys = await kv.getByPrefix(`user_order:${order.userId}:`);
        let lifetimeTotal = 0;
        
        for (const key of userOrderKeys) {
          const orderId = key.value;
          const userOrder = await kv.get(`order:${orderId}`);
          if (userOrder && userOrder.status !== 'cancelled') {
            lifetimeTotal += (userOrder.subtotalWithoutSamples || userOrder.subtotal || 0);
          }
        }
        
        // Use the calculateLoyaltyPoints function with lifetime total
        calculatedLoyaltyPoints = calculateLoyaltyPoints(
          order.subtotalWithoutSamples || order.subtotal || 0,
          lifetimeTotal
        );
      } catch (error) {
        console.error('❌ Error calculating loyalty points:', error);
        // Fallback to 3% if calculation fails
        calculatedLoyaltyPoints = Math.floor((order.subtotalWithoutSamples || order.subtotal || 0) * 0.03);
      }
    }
    
    // Prepare email data
    const emailData = {
      orderId: orderNum,
      orderDate: order.createdAt || new Date().toISOString(),
      customerName: order.customerName || order.shippingAddress?.fullName || 'Клиент',
      status: status,
      items: order.items?.map((item: any) => ({
        id: item.id || item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.image,
        total: item.quantity * item.price
      })) || [],
      deliveryMethod: order.deliveryMethod || order.shippingInfo?.deliveryMethod || 'Не указан',
      deliveryCost: order.shippingCost || 0,
      totalAmount: order.totalPrice || 0,
      shippingAddress: {
        fullName: order.shippingAddress?.fullName || order.customerName || '',
        address: order.shippingAddress?.address || ''
      },
      paymentMethod: order.paymentMethod,
      promoCode: order.promoCode,
      promoDiscount: order.promoDiscount || 0,
      loyaltyPointsUsed: order.loyaltyPointsUsed || 0,
      loyaltyPointsEarned: order.loyaltyPointsEarned || calculatedLoyaltyPoints,
      currentLoyaltyBalance: order.currentLoyaltyBalance || 0,
      trackingNumber: order.trackingNumber,
      trackingUrl: order.trackingNumber ? `https://asia-pharm.com/orders?track=${order.trackingNumber}` : undefined,
      paymentDetails: {
        cardNumber: paymentSettings?.cardNumber || '2202 2004 3395 7386',
        contractNumber: paymentSettings?.contractNumber || '505 518 5408',
        qrCodeUrl: paymentSettings?.qrCodeUrl || null
      }
    };

    // Get user language (default to Russian)
    const language = order.language || 'ru';

    // Generate HTML and text versions
    const htmlMessage = generateOrderEmailHTML(emailData, language);
    const textMessage = generateOrderEmailText(emailData, language);

    // Prepare subject based on status
    const subjects = {
      ru: {
        pending: `Заказ #${orderNum} принят - Азия Фарм`,
        processing: `Заказ #${orderNum} оплачен - Азия Фарм`,
        shipped: `Заказ #${orderNum} отправлен - Азия Фарм`,
        delivered: `Заказ #${orderNum} доставлен - Азия Фарм`,
        cancelled: `Заказ #${orderNum} отменен - Азия Фарм`
      },
      en: {
        pending: `Order #${orderNum} received - Asia Pharm`,
        processing: `Order #${orderNum} paid - Asia Pharm`,
        shipped: `Order #${orderNum} shipped - Asia Pharm`,
        delivered: `Order #${orderNum} delivered - Asia Pharm`,
        cancelled: `Order #${orderNum} cancelled - Asia Pharm`
      },
      zh: {
        pending: `订单 #${orderNum} 已收到 - 亚洲药房`,
        processing: `订单 #${orderNum} 已付款 - 亚洲药房`,
        shipped: `订单 #${orderNum} 已发货 - 亚洲药房`,
        delivered: `订单 #${orderNum} 已送达 - 亚洲药房`,
        cancelled: `订单 #${orderNum} 已取消 - 亚洲药房`
      },
      vi: {
        pending: `Đơn hàng #${orderNum} đã nhận - Asia Pharm`,
        processing: `Đơn hàng #${orderNum} đã thanh toán - Asia Pharm`,
        shipped: `Đơn hàng #${orderNum} đã gửi - Asia Pharm`,
        delivered: `Đơn hàng #${orderNum} đã giao - Asia Pharm`,
        cancelled: `Đơn hàng #${orderNum} đã hủy - Asia Pharm`
      }
    };

    const subject = subjects[language as keyof typeof subjects]?.[status] || subjects.ru[status];

    console.log(`📧 Sending ${type} email to ${email} (order ${orderNum}, status: ${status})`);

    // Send email using Resend API
    try {
      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      
      if (!resendApiKey) {
        console.error('❌ RESEND_API_KEY not configured in environment variables');
        console.log('📨 Email Details (not sent):');
        console.log(`   To: ${email}`);
        console.log(`   Subject: ${subject}`);
        return { success: false, reason: 'RESEND_API_KEY not configured' };
      }

      // Prepare from email - Resend requires format: "Name <email@domain.com>"
      const fromEmailAddress = emailSettings.smtpUser || 'info@asia-pharm.com';
      const fromName = emailSettings.fromName || 'Азия Фарм';
      const fromEmail = `${fromName} <${fromEmailAddress}>`;
      
      console.log(`📨 Sending via Resend API:`);
      console.log(`   To: ${email}`);
      console.log(`   From: ${fromEmail}`);
      console.log(`   Subject: ${subject}`);
      console.log(`   Language: ${language}`);
      console.log(`   Status: ${status}`);
      
      // Send email via Resend REST API
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [email],
          subject: subject,
          html: htmlMessage,
          text: textMessage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error(`❌ Resend API error (${response.status}):`, errorData);
        return { success: false, error: `Resend API returned ${response.status}` };
      }

      const result = await response.json();
      console.log('✅ Email sent successfully via Resend:', result.id);
      return { success: true, emailId: result.id };
      
    } catch (sendError) {
      console.error('❌ Failed to send email:', sendError);
      return { success: false, error: sendError };
    }
  } catch (error) {
    console.error('❌ Email error:', error);
    return { success: false, error };
  }
}

// Routes

// Health check
app.get('/', (c) => {
  return c.json({ status: 'OK', message: 'Asia-Pharm Store API' });
});

// ============================================
// PUBLIC ENDPOINTS (NO AUTH REQUIRED)
// MUST BE DEFINED BEFORE ALL OTHER ROUTES
// ============================================

// Get chat settings (public - no auth required)
app.get('/public/settings/chat', async (c) => {
  try {
    console.log('📋 [PUBLIC] Fetching chat settings - NO AUTH REQUIRED');
    console.log('📋 Headers:', {
      authorization: c.req.header('authorization'),
      apikey: c.req.header('apikey'),
    });
    
    const value = await kv.get('setting:chat');
    
    if (!value) {
      // Return default settings if not configured
      console.log('📋 Returning default chat settings');
      return c.json({ 
        value: {
          enabled: true,
          telegram: '@asiapharm',
          whatsapp: '+79001234567',
        }
      });
    }
    
    console.log('✅ Chat settings found and returned');
    return c.json({ value });
  } catch (error) {
    console.error('❌ Error fetching chat settings:', error);
    // Return defaults on error
    return c.json({ 
      value: {
        enabled: true,
        telegram: '@asiapharm',
        whatsapp: '+79001234567',
      }
    });
  }
});

// Get payment settings (public - no auth required)
app.get('/payment-settings', async (c) => {
  try {
    console.log('📋 [PUBLIC] Fetching payment settings for display - NO AUTH REQUIRED');
    console.log('📋 Headers:', {
      authorization: c.req.header('authorization'),
      apikey: c.req.header('apikey'),
    });
    
    const value = await kv.get('setting:payment');
    
    if (value === null || value === undefined) {
      console.log('⚠️ Payment settings not found in DB, returning defaults');
      return c.json({ 
        value: {
          cardNumber: "2202 2004 3395 7386",
          contractNumber: "505 518 5408",
          qrCodeUrl: null
        }
      });
    }
    
    console.log('✅ Payment settings loaded for public view');
    return c.json({ value });
  } catch (error) {
    console.error('❌ Error fetching payment settings:', error);
    // Return defaults on error
    return c.json({ 
      value: {
        cardNumber: "2202 2004 3395 7386",
        contractNumber: "505 518 5408",
        qrCodeUrl: null
      }
    });
  }
});

// ============================================
// AUTHENTICATED ENDPOINTS
// ============================================

// Sign up
app.post('/signup', async (c) => {
  try {
    const { email, password, name, language } = await c.req.json();
    const supabase = getSupabaseAdmin();

    console.log(`👤 Creating user account for: ${email}`);

    // Create user in auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      email_confirm: true, // Auto-confirm email
    });

    if (error) {
      console.error('❌ Signup auth error:', error);
      return c.json({ error: error.message }, 400);
    }

    console.log(`✅ Auth user created: ${data.user.id}`);

    // Create profile in database
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{
        id: data.user.id,
        email: email,
        name: name,
        is_admin: false,
        is_wholesaler: false,
        loyalty_points: 0,
        loyalty_tier: 'basic',
        monthly_total: 0,
      }]);

    if (profileError) {
      console.error('❌ Profile creation error:', profileError);
      // Try to check if profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single();
      
      if (existingProfile) {
        console.log('ℹ️ Profile already exists for user');
      } else {
        console.error('⚠️ Failed to create profile, but user auth was created');
      }
    } else {
      console.log(`✅ Profile created successfully for user: ${data.user.id}`);
    }

    // Send welcome email
    try {
      await sendWelcomeEmail(email, {
        name: name,
        email: email,
        password: password,
        language: language || 'ru'
      });
      console.log('✅ Welcome email sent');
    } catch (emailError) {
      console.error('⚠️ Failed to send welcome email:', emailError);
      // Don't fail registration if email fails
    }

    return c.json({ success: true, user: data.user });
  } catch (error) {
    console.error('❌ Signup exception:', error);
    return c.json({ error: 'Registration failed', details: String(error) }, 500);
  }
});

// Get all products
app.get('/products', async (c) => {
  try {
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
    const mappedProducts = (products || []).map(mapProductFromDb);
    
    console.log(`✅ Fetched ${mappedProducts.length} products`);
    return c.json({ products: mappedProducts });
  } catch (error) {
    console.error('❌ Exception fetching products:', error);
    return c.json({ error: 'Failed to fetch products', details: String(error) }, 500);
  }
});

// Helper function to map DB format to frontend fields
const mapProductFromDb = (dbProduct: any) => {
  const frontendData: any = { ...dbProduct };
  
  // Map snake_case to camelCase for shortDescription fields
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
  
  // Map snake_case to camelCase for diseaseCategories
  if ('disease_categories' in frontendData) {
    // Ensure diseaseCategories is always an array
    const categories = frontendData.disease_categories;
    if (Array.isArray(categories)) {
      frontendData.diseaseCategories = categories;
    } else if (typeof categories === 'string') {
      // Handle case where it might be a JSON string
      try {
        frontendData.diseaseCategories = JSON.parse(categories);
      } catch {
        frontendData.diseaseCategories = [categories];
      }
    } else {
      frontendData.diseaseCategories = [];
    }
  } else if (!frontendData.diseaseCategories && frontendData.disease) {
    // Fallback: if diseaseCategories is missing, use disease field
    frontendData.diseaseCategories = [frontendData.disease];
  } else if (!frontendData.diseaseCategories) {
    // Ensure diseaseCategories always exists
    frontendData.diseaseCategories = [];
  }
  
  return frontendData;
};

// Helper function to map frontend fields to DB format
const mapProductToDb = (productData: any) => {
  const dbData: any = { ...productData };
  
  // Map camelCase to snake_case for shortDescription fields
  if ('shortDescription' in dbData) {
    dbData.short_description = dbData.shortDescription;
    delete dbData.shortDescription;
  }
  if ('shortDescription_en' in dbData) {
    dbData.short_description_en = dbData.shortDescription_en;
    delete dbData.shortDescription_en;
  }
  if ('shortDescription_zh' in dbData) {
    dbData.short_description_zh = dbData.shortDescription_zh;
    delete dbData.shortDescription_zh;
  }
  if ('shortDescription_vi' in dbData) {
    dbData.short_description_vi = dbData.shortDescription_vi;
    delete dbData.shortDescription_vi;
  }
  
  // Map camelCase to snake_case for diseaseCategories
  if ('diseaseCategories' in dbData) {
    dbData.disease_categories = dbData.diseaseCategories;
    delete dbData.diseaseCategories;
  }
  
  return dbData;
};

// Create product (admin only)
app.post('/products', requireAdmin, async (c) => {
  try {
    const productData = await c.req.json();
    
    console.log('📦 Creating product with data:', JSON.stringify(productData, null, 2));
    console.log('🔐 SUPABASE_URL:', Deno.env.get('SUPABASE_URL'));
    console.log('🔑 SERVICE_ROLE_KEY exists:', !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
    
    // Validate required fields
    const requiredFields = ['name', 'name_en', 'name_zh', 'name_vi', 'price', 'category', 'disease', 'store'];
    const missingFields = requiredFields.filter(field => !productData[field]);
    
    if (missingFields.length > 0) {
      console.error('❌ Missing required fields:', missingFields);
      return c.json({ 
        error: 'Missing required fields', 
        details: `Required fields: ${missingFields.join(', ')}` 
      }, 400);
    }
    
    // Map fields to DB format
    const dbData = mapProductToDb(productData);
    
    const supabase = getSupabaseAdmin();
    
    console.log('🗄️ Attempting to insert into products table...');
    
    const { data: product, error } = await supabase
      .from('products')
      .insert([dbData])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error creating product in DB:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error hint:', error.hint);
      return c.json({ 
        error: 'Failed to create product', 
        details: error.message,
        hint: error.hint,
        code: error.code 
      }, 500);
    }
    
    console.log('✅ Product created successfully:', product.id);
    // Map product back to frontend format
    const mappedProduct = mapProductFromDb(product);
    return c.json({ success: true, product: mappedProduct });
  } catch (error) {
    console.error('❌ Exception creating product:', error);
    console.error('❌ Exception type:', typeof error);
    console.error('❌ Exception stack:', error instanceof Error ? error.stack : 'N/A');
    return c.json({ error: 'Failed to create product', details: String(error) }, 500);
  }
});

// Update product (admin only)
app.put('/products/:id', requireAdmin, async (c) => {
  try {
    const productId = c.req.param('id');
    const productData = await c.req.json();
    const supabase = getSupabaseAdmin();
    
    console.log(`📝 Updating product ${productId} with data:`, JSON.stringify(productData, null, 2));

    // Remove id from productData if it exists (can't update id)
    const { id, ...dataWithoutId } = productData;
    
    // Map fields to DB format
    const updateData = mapProductToDb(dataWithoutId);
    
    console.log(`📝 Update data after mapping:`, JSON.stringify(updateData, null, 2));

    const { data: product, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', productId)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error updating product in DB:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      return c.json({ 
        error: 'Failed to update product', 
        details: error.message,
        code: error.code,
        hint: error.hint 
      }, 500);
    }
    
    console.log('✅ Product updated successfully:', product.id);
    // Map product back to frontend format
    const mappedProduct = mapProductFromDb(product);
    return c.json({ success: true, product: mappedProduct });
  } catch (error) {
    console.error('❌ Exception updating product:', error);
    console.error('❌ Exception stack:', error instanceof Error ? error.stack : 'N/A');
    return c.json({ error: 'Failed to update product', details: String(error) }, 500);
  }
});

// Delete product (admin only)
app.delete('/products/:id', requireAdmin, async (c) => {
  try {
    const productId = c.req.param('id');
    const supabase = getSupabaseAdmin();
    
    console.log(`🗑️ Deleting product ${productId}`);
    
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);
    
    if (error) {
      console.error('❌ Error deleting product from DB:', error);
      return c.json({ error: 'Failed to delete product', details: error.message }, 500);
    }
    
    console.log('✅ Product deleted successfully');
    return c.json({ success: true });
  } catch (error) {
    console.error('❌ Exception deleting product:', error);
    return c.json({ error: 'Failed to delete product', details: String(error) }, 500);
  }
});

// ============================================
// User Management Endpoints
// ============================================

// Get all users (admin only)
app.get('/make-server-a75b5353/admin/users', requireAdmin, async (c) => {
  try {
    const supabase = getSupabaseAdmin();
    
    console.log('👥 Fetching all users...');
    
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, name, is_admin, is_wholesaler, created_at')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching users:', error);
      return c.json({ error: 'Failed to fetch users', details: error.message }, 500);
    }
    
    // Map to frontend format
    const users = profiles.map(p => ({
      id: p.id,
      email: p.email,
      name: p.name,
      isAdmin: p.is_admin,
      isWholesaler: p.is_wholesaler,
      createdAt: p.created_at,
    }));
    
    console.log(`✅ Fetched ${users.length} users`);
    return c.json({ users });
  } catch (error) {
    console.error('❌ Exception fetching users:', error);
    return c.json({ error: 'Failed to fetch users', details: String(error) }, 500);
  }
});

// Update user wholesaler status (admin only)
app.put('/make-server-a75b5353/admin/users/:id/wholesaler', requireAdmin, async (c) => {
  try {
    const userId = c.req.param('id');
    const { isWholesaler } = await c.req.json();
    const supabase = getSupabaseAdmin();
    
    console.log(`👤 Updating wholesaler status for user ${userId} to ${isWholesaler}`);
    
    const { error } = await supabase
      .from('profiles')
      .update({ is_wholesaler: isWholesaler })
      .eq('id', userId);
    
    if (error) {
      console.error('❌ Error updating wholesaler status:', error);
      return c.json({ error: 'Failed to update user', details: error.message }, 500);
    }
    
    console.log('✅ Wholesaler status updated successfully');
    return c.json({ success: true });
  } catch (error) {
    console.error('❌ Exception updating wholesaler status:', error);
    return c.json({ error: 'Failed to update user', details: String(error) }, 500);
  }
});

// Create order
app.post('/make-server-a75b5353/orders', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const { items, store, shippingInfo, subtotal, subtotalWithoutSamples, shippingCost, promoCode, promoDiscount, loyaltyPointsUsed, totalPrice, language } = await c.req.json();
    
    const orderId = crypto.randomUUID();
    const orderNumber = await generateOrderNumber();
    
    const order = {
      id: orderId,
      orderNumber,
      userId: user.id,
      userEmail: user.email,
      customerName: shippingInfo?.fullName || user.name || 'Клиент',
      language: language || 'ru', // Save user's language preference for emails
      items,
      store,
      shippingInfo,
      shippingAddress: {
        fullName: shippingInfo?.fullName || user.name || '',
        address: [shippingInfo?.region, shippingInfo?.city, shippingInfo?.address].filter(Boolean).join(', ')
      },
      deliveryMethod: shippingInfo?.deliveryMethod || 'Не указан',
      subtotal: subtotal || totalPrice,
      subtotalWithoutSamples: subtotalWithoutSamples || subtotal || totalPrice,
      shippingCost: shippingCost || 0,
      promoCode: promoCode || null,
      promoDiscount: promoDiscount || 0,
      loyaltyPointsUsed: loyaltyPointsUsed || 0,
      totalPrice,
      status: 'pending',
      createdAt: new Date().toISOString(),
      orderDate: new Date().toISOString(),
    };

    await kv.set(`order:${orderId}`, order);
    await kv.set(`user_order:${user.id}:${orderId}`, orderId);
    
    // If loyalty points were used, deduct them
    if (loyaltyPointsUsed && loyaltyPointsUsed > 0) {
      await updateUserLoyalty(user.id, loyaltyPointsUsed, 'spent', `Использовано при заказе #${orderNumber}`);
    }

    // Send email notification
    try {
      console.log(`📧 Attempting to send order confirmation email to ${user.email} for order #${orderNumber}`);
      const emailResult = await sendOrderEmail(user.email, order, 'new');
      console.log('📧 Email result:', emailResult);
    } catch (emailError) {
      console.error('❌ Email send error:', emailError);
    }

    return c.json({ success: true, orderId, orderNumber, order });
  } catch (error) {
    console.error('Error creating order:', error);
    return c.json({ error: 'Failed to create order' }, 500);
  }
});

// Get user's orders
app.get('/make-server-a75b5353/orders', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const userOrders = await kv.getByPrefix(`user_order:${user.id}:`);
    
    const orders = [];
    for (const userOrder of userOrders) {
      const orderId = userOrder.value;
      const order = await kv.get(`order:${orderId}`);
      if (order) {
        orders.push(order);
      }
    }

    orders.sort((a, b) => new Date(b.createdAt || b.orderDate).getTime() - new Date(a.createdAt || a.orderDate).getTime());
    return c.json({ orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return c.json({ error: 'Failed to fetch orders' }, 500);
  }
});

// Get all orders (admin only)
app.get('/make-server-a75b5353/admin/orders', requireAdmin, async (c) => {
  try {
    const orders = await kv.getByPrefix('order:');
    const orderList = orders.map(o => o.value);
    orderList.sort((a, b) => new Date(b.createdAt || b.orderDate).getTime() - new Date(a.createdAt || a.orderDate).getTime());
    
    return c.json({ orders: orderList });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return c.json({ error: 'Failed to fetch orders' }, 500);
  }
});

// Update order status (admin only)
app.put('/make-server-a75b5353/admin/orders/:id/status', requireAdmin, async (c) => {
  try {
    const orderId = c.req.param('id');
    const { status } = await c.req.json();

    console.log(`📝 Updating order ${orderId} to status: ${status}`);

    const order = await kv.get(`order:${orderId}`);
    if (!order) {
      console.error(`❌ Order not found: ${orderId}`);
      return c.json({ error: 'Order not found' }, 404);
    }

    const oldStatus = order.status;
    order.status = status;
    await kv.set(`order:${orderId}`, order);
    
    console.log(`✅ Order status updated from ${oldStatus} to ${status}`);
    
    // If order status changed to 'delivered', award loyalty points
    if (status === 'delivered' && oldStatus !== 'delivered') {
      try {
        console.log(`🎁 Awarding loyalty points for order ${orderId}`);
        
        // Get LIFETIME total (not monthly) for new loyalty system
        const lifetimeTotal = await getUserLifetimeTotal(order.userId);
        const orderAmount = order.subtotal || order.totalPrice || 0;
        const newLifetimeTotal = lifetimeTotal + orderAmount;
        
        // Calculate points with progressive tiers based on LIFETIME total
        const points = calculateLoyaltyPoints(orderAmount, newLifetimeTotal);
        
        console.log(`💎 Calculated ${points} loyalty points`);
        console.log(`   Previous lifetime: ${lifetimeTotal} ₽`);
        console.log(`   Order amount: ${orderAmount} ₽`);
        console.log(`   New lifetime: ${newLifetimeTotal} ₽`);
        
        if (points > 0) {
          await updateUserLoyalty(order.userId, points, 'earned', `Начислено за заказ #${order.orderNumber || order.id.slice(0, 6)}`);
          console.log(`✅ Awarded ${points} loyalty points to user ${order.userId} for order #${order.orderNumber}`);
        }
      } catch (loyaltyError) {
        console.error('❌ Error awarding loyalty points:', loyaltyError);
        // Don't fail the whole operation, just log the error
      }
    }

    // Send email notification
    try {
      await sendOrderEmail(order.userEmail, order, 'status_update');
    } catch (emailError) {
      console.error('❌ Email send error:', emailError);
      // Don't fail the whole operation, just log the error
    }

    console.log(`✅ Order status update complete for ${orderId}`);
    return c.json({ success: true, order });
  } catch (error) {
    console.error('❌ Exception updating order status:', error);
    console.error('❌ Error details:', error instanceof Error ? error.message : String(error));
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'N/A');
    return c.json({ error: 'Failed to update order status', details: String(error) }, 500);
  }
});

// Send tracking number (admin only)
app.put('/make-server-a75b5353/admin/orders/:id/tracking', requireAdmin, async (c) => {
  try {
    const orderId = c.req.param('id');
    const { trackingNumber } = await c.req.json();

    const order = await kv.get(`order:${orderId}`);
    if (!order) {
      return c.json({ error: 'Order not found' }, 404);
    }

    order.trackingNumber = trackingNumber;
    order.status = 'shipped';
    await kv.set(`order:${orderId}`, order);

    // Send email notification with tracking number
    try {
      await sendOrderEmail(order.userEmail, order, 'tracking');
    } catch (emailError) {
      console.error('Email send error:', emailError);
    }

    return c.json({ success: true, order });
  } catch (error) {
    console.error('Error sending tracking number:', error);
    return c.json({ error: 'Failed to send tracking number' }, 500);
  }
});

// Get user loyalty info (both /loyalty and /loyalty/info for compatibility)
app.get('/make-server-a75b5353/loyalty', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const userLoyaltyKey = `user_loyalty:${user.id}`;
    let loyaltyData = await kv.get(userLoyaltyKey);
    
    if (!loyaltyData) {
      loyaltyData = {
        userId: user.id,
        points: 0,
        totalEarned: 0,
        totalSpent: 0,
        history: []
      };
    }
    
    // Calculate lifetime total for new progressive system
    const lifetimeTotal = await getUserLifetimeTotal(user.id);
    
    // Determine tier based on lifetime total
    let tier: 'basic' | 'silver' | 'gold' | 'platinum' = 'basic';
    if (lifetimeTotal >= 200000) {
      tier = 'platinum'; // 10%
    } else if (lifetimeTotal >= 100000) {
      tier = 'gold'; // 7%
    } else if (lifetimeTotal >= 50000) {
      tier = 'silver'; // 5%
    } else {
      tier = 'basic'; // 3%
    }
    
    // Also calculate monthly total for backward compatibility
    const monthlyTotal = await getUserMonthlyTotal(user.id);
    
    return c.json({
      points: loyaltyData.points,
      totalEarned: loyaltyData.totalEarned,
      totalSpent: loyaltyData.totalSpent,
      lifetimeTotal,
      monthlyTotal,
      tier,
      history: loyaltyData.history || []
    });
  } catch (error) {
    console.error('Error fetching loyalty info:', error);
    return c.json({ error: 'Failed to fetch loyalty info' }, 500);
  }
});

app.get('/make-server-a75b5353/loyalty/info', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const userLoyaltyKey = `user_loyalty:${user.id}`;
    let loyaltyData = await kv.get(userLoyaltyKey);
    
    if (!loyaltyData) {
      loyaltyData = {
        userId: user.id,
        points: 0,
        totalEarned: 0,
        totalSpent: 0,
        history: []
      };
    }
    
    // Calculate lifetime total for new progressive system
    const lifetimeTotal = await getUserLifetimeTotal(user.id);
    
    // Determine tier based on lifetime total
    let tier: 'basic' | 'silver' | 'gold' | 'platinum' = 'basic';
    if (lifetimeTotal >= 200000) {
      tier = 'platinum'; // 10%
    } else if (lifetimeTotal >= 100000) {
      tier = 'gold'; // 7%
    } else if (lifetimeTotal >= 50000) {
      tier = 'silver'; // 5%
    } else {
      tier = 'basic'; // 3%
    }
    
    // Also calculate monthly total for backward compatibility
    const monthlyTotal = await getUserMonthlyTotal(user.id);
    
    return c.json({
      points: loyaltyData.points,
      totalEarned: loyaltyData.totalEarned,
      totalSpent: loyaltyData.totalSpent,
      lifetimeTotal,
      monthlyTotal,
      tier,
      history: loyaltyData.history || []
    });
  } catch (error) {
    console.error('Error fetching loyalty info:', error);
    return c.json({ error: 'Failed to fetch loyalty info' }, 500);
  }
});

// Promo codes - Get all (admin only)
app.get('/make-server-a75b5353/promo-codes', requireAdmin, async (c) => {
  try {
    const promoCodes = await kv.getByPrefix('promo:');
    return c.json({ promoCodes: promoCodes.map(p => p.value) });
  } catch (error) {
    console.error('Error fetching promo codes:', error);
    return c.json({ error: 'Failed to fetch promo codes' }, 500);
  }
});

// Validate promo code
app.get('/make-server-a75b5353/promo-codes/validate', requireAuth, async (c) => {
  try {
    const code = c.req.query('code');
    if (!code) {
      return c.json({ error: 'Promo code required' }, 400);
    }
    
    const promoCode = await kv.get(`promo:${code.toUpperCase()}`);
    
    if (!promoCode) {
      return c.json({ error: 'Invalid promo code' }, 404);
    }
    
    // Check if active
    if (!promoCode.active) {
      return c.json({ error: 'Promo code is not active' }, 400);
    }
    
    // Check expiry
    if (promoCode.expiryDate && new Date(promoCode.expiryDate) < new Date()) {
      return c.json({ error: 'Promo code has expired' }, 400);
    }
    
    // Check usage limit
    if (promoCode.usageLimit && promoCode.timesUsed >= promoCode.usageLimit) {
      return c.json({ error: 'Promo code usage limit reached' }, 400);
    }
    
    return c.json(promoCode);
  } catch (error) {
    console.error('Error validating promo code:', error);
    return c.json({ error: 'Failed to validate promo code' }, 500);
  }
});

// Create promo code (admin only)
app.post('/make-server-a75b5353/promo-codes', requireAdmin, async (c) => {
  try {
    const promoData = await c.req.json();
    const code = promoData.code.toUpperCase();
    
    const promoCode = {
      code,
      discount_type: promoData.discount_type,
      discount_value: promoData.discount_value,
      expiryDate: promoData.expiryDate || null,
      usageLimit: promoData.usageLimit || null,
      timesUsed: 0,
      active: promoData.active !== undefined ? promoData.active : true,
      createdAt: new Date().toISOString()
    };
    
    await kv.set(`promo:${code}`, promoCode);
    return c.json({ success: true, promoCode });
  } catch (error) {
    console.error('Error creating promo code:', error);
    return c.json({ error: 'Failed to create promo code' }, 500);
  }
});

// Update promo code (admin only)
app.put('/make-server-a75b5353/promo-codes/:code', requireAdmin, async (c) => {
  try {
    const code = c.req.param('code').toUpperCase();
    const promoData = await c.req.json();
    
    const existingPromo = await kv.get(`promo:${code}`);
    if (!existingPromo) {
      return c.json({ error: 'Promo code not found' }, 404);
    }
    
    const promoCode = {
      ...existingPromo,
      ...promoData,
      code,
    };
    
    await kv.set(`promo:${code}`, promoCode);
    return c.json({ success: true, promoCode });
  } catch (error) {
    console.error('Error updating promo code:', error);
    return c.json({ error: 'Failed to update promo code' }, 500);
  }
});

// Delete promo code (admin only)
app.delete('/make-server-a75b5353/promo-codes/:code', requireAdmin, async (c) => {
  try {
    const code = c.req.param('code').toUpperCase();
    await kv.del(`promo:${code}`);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting promo code:', error);
    return c.json({ error: 'Failed to delete promo code' }, 500);
  }
});

// Get all users (admin only)
app.get('/make-server-a75b5353/admin/users', requireAdmin, async (c) => {
  try {
    const supabase = getSupabaseAdmin();
    
    // Get users from profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (profilesError) {
      console.error('❌ Error fetching profiles from DB:', profilesError);
      return c.json({ error: 'Failed to fetch users', details: profilesError.message }, 500);
    }
    
    if (!profiles || profiles.length === 0) {
      console.log('⚠️ No profiles found in database');
      return c.json({ users: [] });
    }
    
    console.log(`✅ Found ${profiles.length} profiles`);
    
    const formattedUsers = profiles.map(profile => ({
      id: profile.id,
      email: profile.email,
      name: profile.name,
      isAdmin: profile.is_admin || false,
      isWholesaler: profile.is_wholesaler || false,
      createdAt: profile.created_at,
      loyaltyPoints: profile.loyalty_points || 0,
      loyaltyTier: profile.loyalty_tier || 'basic',
      monthlyTotal: profile.monthly_total || 0,
    }));
    
    return c.json({ users: formattedUsers });
  } catch (error) {
    console.error('❌ Exception fetching users:', error);
    return c.json({ error: 'Failed to fetch users', details: String(error) }, 500);
  }
});

// Update user role (admin only)
app.put('/make-server-a75b5353/admin/users/:id/role', requireAdmin, async (c) => {
  try {
    const userId = c.req.param('id');
    const { isWholesaler, isAdmin } = await c.req.json();
    
    const supabase = getSupabaseAdmin();
    
    console.log(`📝 Updating user ${userId} role: isAdmin=${isAdmin}, isWholesaler=${isWholesaler}`);
    
    // Update in profiles table
    const { error } = await supabase
      .from('profiles')
      .update({ 
        is_admin: isAdmin,
        is_wholesaler: isWholesaler 
      })
      .eq('id', userId);
    
    if (error) {
      console.error('❌ Error updating user role:', error);
      return c.json({ error: 'Failed to update user role', details: error.message }, 500);
    }
    
    console.log(`✅ User ${userId} role updated successfully`);
    return c.json({ success: true });
  } catch (error) {
    console.error('❌ Exception updating user role:', error);
    return c.json({ error: 'Failed to update user role', details: String(error) }, 500);
  }
});

// Update user wholesaler status (admin only) - legacy endpoint
app.put('/make-server-a75b5353/admin/users/:id/wholesaler', requireAdmin, async (c) => {
  try {
    const userId = c.req.param('id');
    const { isWholesaler } = await c.req.json();
    
    const supabase = getSupabaseAdmin();
    
    // Update in profiles table
    const { error } = await supabase
      .from('profiles')
      .update({ is_wholesaler: isWholesaler })
      .eq('id', userId);
    
    if (error) {
      console.error('Error updating user:', error);
      return c.json({ error: 'Failed to update user' }, 500);
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error updating user wholesaler status:', error);
    return c.json({ error: 'Failed to update wholesaler status' }, 500);
  }
});

// ============================================
// User Profile Settings Endpoints
// ============================================

// Get user settings
app.get('/make-server-a75b5353/user/settings', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const supabase = getSupabaseAdmin();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('subscribed_to_newsletter')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user settings:', error);
      return c.json({ subscribed: false });
    }

    return c.json({ subscribed: profile?.subscribed_to_newsletter || false });
  } catch (error) {
    console.error('Error in user settings:', error);
    return c.json({ error: 'Failed to fetch settings' }, 500);
  }
});

// Update user email
app.post('/make-server-a75b5353/user/update-email', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const supabase = getSupabaseAdmin();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { newEmail } = await c.req.json();

    if (!newEmail || !newEmail.includes('@')) {
      return c.json({ error: 'Invalid email' }, 400);
    }

    // Update email in auth.users
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { email: newEmail }
    );

    if (updateError) {
      console.error('Error updating email:', updateError);
      return c.json({ error: 'Failed to update email', message: updateError.message }, 500);
    }

    // Update email in profiles table
    await supabase
      .from('profiles')
      .update({ email: newEmail })
      .eq('id', user.id);

    console.log(`✅ Email updated for user ${user.id}: ${newEmail}`);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error updating user email:', error);
    return c.json({ error: 'Failed to update email' }, 500);
  }
});

// Toggle newsletter subscription
app.post('/make-server-a75b5353/user/toggle-subscription', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const supabase = getSupabaseAdmin();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { subscribed } = await c.req.json();

    const { error } = await supabase
      .from('profiles')
      .update({ subscribed_to_newsletter: subscribed })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating subscription:', error);
      return c.json({ error: 'Failed to update subscription' }, 500);
    }

    console.log(`✅ Subscription updated for user ${user.id}: ${subscribed}`);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error toggling subscription:', error);
    return c.json({ error: 'Failed to toggle subscription' }, 500);
  }
});

// Get newsletter subscribers count (admin only)
app.get('/make-server-a75b5353/newsletter/subscribers/count', requireAdmin, async (c) => {
  try {
    const supabase = getSupabaseAdmin();
    
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('subscribed_to_newsletter', true);
    
    if (error) {
      console.error('Error fetching subscribers count:', error);
      return c.json({ error: 'Failed to fetch subscribers count' }, 500);
    }
    
    console.log(`📊 Newsletter subscribers count: ${count}`);
    return c.json({ count: count || 0 });
  } catch (error) {
    console.error('Error in subscribers count:', error);
    return c.json({ error: 'Failed to fetch subscribers count' }, 500);
  }
});

// Send newsletter broadcast (admin only)
app.post('/make-server-a75b5353/newsletter/broadcast', requireAdmin, async (c) => {
  try {
    const { subject, htmlContent } = await c.req.json();
    
    if (!subject || !htmlContent) {
      return c.json({ error: 'Subject and HTML content are required' }, 400);
    }
    
    const supabase = getSupabaseAdmin();
    
    // Get all subscribed users with their email and language preference
    const { data: subscribers, error } = await supabase
      .from('profiles')
      .select('id, email, name, language')
      .eq('subscribed_to_newsletter', true);
    
    if (error) {
      console.error('Error fetching subscribers:', error);
      return c.json({ error: 'Failed to fetch subscribers', details: error.message }, 500);
    }
    
    if (!subscribers || subscribers.length === 0) {
      return c.json({ error: 'No subscribers found' }, 404);
    }
    
    console.log(`📧 Starting newsletter broadcast to ${subscribers.length} subscribers`);
    console.log(`⏱️ Estimated time: ${Math.ceil(subscribers.length * 0.6)} seconds (0.6s per email)`);
    
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      return c.json({ error: 'RESEND_API_KEY not configured' }, 500);
    }
    
    // Import email template function
    const { generateBroadcastEmailHTML } = await import('./email-templates.tsx');
    
    let sentCount = 0;
    let failedCount = 0;
    
    // Send emails with delay to avoid rate limiting
    for (let i = 0; i < subscribers.length; i++) {
      const subscriber = subscribers[i];
      try {
        const userLanguage = (subscriber.language || 'ru') as 'ru' | 'en' | 'zh' | 'vi';
        const unsubscribeUrl = 'https://asia-pharm.com/profile';
        
        // Generate full email with header and footer
        const fullHtml = generateBroadcastEmailHTML(
          subject,
          htmlContent,
          userLanguage,
          unsubscribeUrl
        );
        
        // Send email via Resend
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey}`
          },
          body: JSON.stringify({
            from: 'Asia Pharm <info@asia-pharm.com>',
            to: [subscriber.email],
            subject: subject,
            html: fullHtml
          })
        });
        
        if (response.ok) {
          sentCount++;
          console.log(`✅ [${i + 1}/${subscribers.length}] Email sent to ${subscriber.email}`);
        } else {
          failedCount++;
          const errorData = await response.text();
          console.error(`❌ [${i + 1}/${subscribers.length}] Failed to send to ${subscriber.email}:`, errorData);
          
          // If rate limited, wait longer before next attempt
          if (response.status === 429) {
            console.log('⏳ Rate limit hit, waiting 2 seconds before continuing...');
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
        
        // Delay to respect Resend rate limit (2 requests/second = 500ms minimum)
        // Using 600ms to be safe
        await new Promise(resolve => setTimeout(resolve, 600));
        
      } catch (emailError) {
        failedCount++;
        console.error(`❌ [${i + 1}/${subscribers.length}] Error sending to ${subscriber.email}:`, emailError);
      }
    }
    
    console.log(`📊 Broadcast complete: ${sentCount} sent, ${failedCount} failed`);
    
    return c.json({
      success: true,
      sent: sentCount,
      failed: failedCount,
      total: subscribers.length
    });
    
  } catch (error) {
    console.error('Error in newsletter broadcast:', error);
    return c.json({ error: 'Failed to send broadcast', details: String(error) }, 500);
  }
});

// Delete user account
app.delete('/make-server-a75b5353/user/delete-account', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const supabase = getSupabaseAdmin();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Delete user from auth.users (this will cascade delete from profiles due to FK constraint)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      return c.json({ error: 'Failed to delete account' }, 500);
    }

    console.log(`✅ Account deleted for user ${user.id}`);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting account:', error);
    return c.json({ error: 'Failed to delete account' }, 500);
  }
});

// Initialize with demo data
app.post('/make-server-a75b5353/init-demo-data', requireAdmin, async (c) => {
  try {
    const demoProducts = [
      // ТОВАРЫ ИЗ КИТАЯ
      {
        id: crypto.randomUUID(),
        name: 'Тигровый бальзам',
        name_en: 'Tiger Balm',
        name_zh: '虎标万金油',
        name_vi: 'Dầu con hổ',
        price: 599,
        wholesalePrice: 45,
        weight: 0.05,
        category: 'ointments',
        disease: 'joints',
        store: 'china',
        description: 'Традиционный китайский бальзам для снятия боли в мышцах и суставах',
        description_en: 'Traditional Chinese balm for muscle and joint pain relief',
        description_zh: '传统中国膏药，用于缓解肌肉和关节疼痛',
        description_vi: 'Dầu truyền thống Trung Quốc giảm đau cơ và khớp',
        composition: 'Ментол, камфора, масло гвоздики',
        composition_en: 'Menthol, camphor, clove oil',
        composition_zh: '薄荷醇、樟脑、丁香油',
        composition_vi: 'Bạc hà, long não, dầu đinh hương',
        usage: 'Наносить на больные участки 2-3 раза в день',
        usage_en: 'Apply to affected areas 2-3 times daily',
        usage_zh: '每天涂抹患处2-3次',
        usage_vi: 'Bôi vào vùng bị đau 2-3 lần mỗi ngày',
        image: 'https://images.unsplash.com/photo-1709813610121-e2a51545e212?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmFkaXRpb25hbCUyMG1lZGljaW5lJTIwb2ludG1lbnR8ZW58MXx8fHwxNzYwODk0NjE1fDA&ixlib=rb-4.1.0&q=80&w=1080',
        inStock: true,
      },
      {
        id: crypto.randomUUID(),
        name: 'Женьшеневые капсулы',
        name_en: 'Ginseng Capsules',
        name_zh: '人参胶囊',
        name_vi: 'Viên nang nhân sâm',
        price: 1200,
        wholesalePrice: 90,
        weight: 0.08,
        category: 'capsules',
        disease: 'nervous',
        store: 'china',
        description: 'Капсулы с экстрактом корня женьшеня для повышения энергии и укрепления иммунитета',
        description_en: 'Ginseng root extract capsules for energy and immunity boost',
        description_zh: '人参根提取物胶囊，增强能量和免疫力',
        description_vi: 'Viên nang chiết xuất rễ nhân sâm tăng cường năng lượng và miễn dịch',
        composition: 'Экстракт корня женьшеня, витамин С',
        composition_en: 'Ginseng root extract, vitamin C',
        composition_zh: '人参根提取物、维生素C',
        composition_vi: 'Chiết xuất rễ nhân sâm, vitamin C',
        usage: 'Принимать по 1-2 капсулы утром',
        usage_en: 'Take 1-2 capsules in the morning',
        usage_zh: '每天早上服用1-2粒',
        usage_vi: 'Uống 1-2 viên vào buổi sáng',
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZXJiYWwlMjBjYXBzdWxlc3xlbnwxfHx8fDE3NjA4OTQ2MTZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
        inStock: true,
      },
      {
        id: crypto.randomUUID(),
        name: 'Китайский лечебный пластырь для суставов',
        name_en: 'Chinese Joint Pain Relief Patch',
        name_zh: '中国关节止痛贴',
        name_vi: 'Miếng dán giảm đau khớp Trung Quốc',
        price: 850,
        wholesalePrice: 65,
        weight: 0.03,
        category: 'patches',
        disease: 'joints',
        store: 'china',
        description: 'Согревающий пластырь с травяными экстрактами для облегчения боли в суставах',
        description_en: 'Warming patch with herbal extracts for joint pain relief',
        description_zh: '含草药提取物的温热贴膏，缓解关节疼痛',
        description_vi: 'Miếng dán ấm với chiết xuất thảo dược giảm đau khớp',
        composition: 'Камфора, ментол, экстракт перца',
        composition_en: 'Camphor, menthol, pepper extract',
        composition_zh: '樟脑、薄荷醇、辣椒提取物',
        composition_vi: 'Long não, bạc hà, chiết xuất ớt',
        usage: 'Наклеить на болевую зону, носить 8-12 часов',
        usage_en: 'Apply to pain area, wear for 8-12 hours',
        usage_zh: '贴于疼痛区域，佩戴8-12小时',
        usage_vi: 'Dán vào vùng đau, đeo trong 8-12 giờ',
        image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGluZXNlJTIwbWVkaWNpbmUlMjBwYXRjaHxlbnwxfHx8fDE3NjA4OTQ2MTd8MA&ixlib=rb-4.1.0&q=80&w=1080',
        inStock: true,
      },
      {
        id: crypto.randomUUID(),
        name: 'Китайские капли для глаз',
        name_en: 'Chinese Eye Drops',
        name_zh: '中国眼药水',
        name_vi: 'Thuốc nhỏ mắt Trung Quốc',
        price: 550,
        wholesalePrice: 42,
        weight: 0.03,
        category: 'drops',
        disease: 'eyes',
        store: 'china',
        description: 'Глазные капли на основе хризантемы для снятия усталости и покраснения глаз',
        description_en: 'Chrysanthemum-based eye drops for relieving eye fatigue and redness',
        description_zh: '菊花眼药水，缓解眼睛疲劳和红血丝',
        description_vi: 'Thuốc nhỏ mắt từ cúc hoa giảm mỏi mắt và đỏ mắt',
        composition: 'Экстракт хризантемы, гиалуроновая кислота',
        composition_en: 'Chrysanthemum extract, hyaluronic acid',
        composition_zh: '菊花提取物、透明质酸',
        composition_vi: 'Chiết xuất hoa cúc, axit hyaluronic',
        usage: 'Закапывать по 1-2 капли в каждый глаз 3-4 раза в день',
        usage_en: 'Instill 1-2 drops in each eye 3-4 times daily',
        usage_zh: '每天滴1-2滴于每只眼睛，每天3-4次',
        usage_vi: 'Nhỏ 1-2 giọt vào mỗi mắt, 3-4 lần mỗi ngày',
        image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxleWUlMjBkcm9wc3xlbnwxfHx8fDE3NjA4OTQ2MTl8MA&ixlib=rb-4.1.0&q=80&w=1080',
        inStock: true,
      },
      
      // ТОВАРЫ ИЗ ТАИЛАНДА
      {
        id: crypto.randomUUID(),
        name: 'Травяной чай для пищеварения',
        name_en: 'Digestive Herbal Tea',
        name_zh: '消化草药茶',
        name_vi: 'Trà thảo dược tiêu hóa',
        price: 450,
        wholesalePrice: 35,
        weight: 0.1,
        category: 'teas',
        disease: 'digestive',
        store: 'thailand',
        description: 'Натуральный травяной чай для улучшения пищеварения',
        description_en: 'Natural herbal tea for digestive health',
        description_zh: '天然草药茶，改善消化',
        description_vi: 'Trà thảo dược tự nhiên tốt cho tiêu hóa',
        composition: 'Имбирь, мята, фенхель',
        composition_en: 'Ginger, mint, fennel',
        composition_zh: '生姜、薄荷、茴香',
        composition_vi: 'Gừng, bạc hà, thì là',
        usage: 'Заваривать 1 пакетик на 200мл кипятка, пить после еды',
        usage_en: 'Steep 1 bag in 200ml hot water, drink after meals',
        usage_zh: '用200毫升开水冲泡1袋，饭后饮用',
        usage_vi: 'Pha 1 túi với 200ml nước nóng, uống sau bữa ăn',
        image: 'https://images.unsplash.com/photo-1504382103100-db7e92322d39?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZXJiYWwlMjB0ZWF8ZW58MXx8fHwxNzYwODk0NjE2fDA&ixlib=rb-4.1.0&q=80&w=1080',
        inStock: true,
      },
      {
        id: crypto.randomUUID(),
        name: 'Тайский зеленый бальзам',
        name_en: 'Thai Green Balm',
        name_zh: '泰国绿色香膏',
        name_vi: 'Dầu xanh Thái Lan',
        price: 680,
        wholesalePrice: 52,
        weight: 0.05,
        category: 'ointments',
        disease: 'headache',
        store: 'thailand',
        description: 'Охлаждающий бальзам от головной боли и насморка',
        description_en: 'Cooling balm for headaches and nasal congestion',
        description_zh: '清凉香膏，缓解头痛和鼻塞',
        description_vi: 'Dầu mát giảm đau đầu và nghẹt mũi',
        composition: 'Эвкалипт, мята, ментол, камфора',
        composition_en: 'Eucalyptus, mint, menthol, camphor',
        composition_zh: '桉树、薄荷、薄荷醇、樟脑',
        composition_vi: 'Bạch đàn, bạc hà, menthol, long não',
        usage: 'Втирать в виски и переносицу при головной боли',
        usage_en: 'Rub on temples and bridge of nose for headaches',
        usage_zh: '头痛时擦在太阳穴和鼻梁上',
        usage_vi: 'Xoa lên thái dương và sống mũi khi đau đầu',
        image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0aGFpJTIwYmFsbXxlbnwxfHx8fDE3NjA4OTQ2MTd8MA&ixlib=rb-4.1.0&q=80&w=1080',
        inStock: true,
      },
      {
        id: crypto.randomUUID(),
        name: 'Тайское масло для массажа',
        name_en: 'Thai Massage Oil',
        name_zh: '泰式按摩油',
        name_vi: 'Dầu mát-xa Thái',
        price: 950,
        wholesalePrice: 72,
        weight: 0.15,
        category: 'oils',
        disease: 'joints',
        store: 'thailand',
        description: 'Натуральное масло с лемонграссом для традиционного тайского массажа',
        description_en: 'Natural oil with lemongrass for traditional Thai massage',
        description_zh: '含柠檬草的天然油，用于传统泰式按摩',
        description_vi: 'Dầu tự nhiên với sả cho mát-xa Thái truyền thống',
        composition: 'Масло кокоса, лемонграсс, имбирь, куркума',
        composition_en: 'Coconut oil, lemongrass, ginger, turmeric',
        composition_zh: '椰子油、柠檬草、生姜、姜黄',
        composition_vi: 'Dầu dừa, sả, gừng, nghệ',
        usage: 'Наносить массажными движениями на кожу',
        usage_en: 'Apply with massage movements to skin',
        usage_zh: '按摩涂抹于皮肤',
        usage_vi: 'Thoa và xoa bóp lên da',
        image: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXNzYWdlJTIwb2lsfGVufDF8fHx8MTc2MDg5NDYxN3ww&ixlib=rb-4.1.0&q=80&w=1080',
        inStock: true,
      },
      {
        id: crypto.randomUUID(),
        name: 'Тайские компрессионные травяные мешочки',
        name_en: 'Thai Herbal Compress Balls',
        name_zh: '泰式草药压缩球',
        name_vi: 'Túi thảo dược nén Thái',
        price: 890,
        wholesalePrice: 68,
        weight: 0.25,
        category: 'herbs',
        disease: 'joints',
        store: 'thailand',
        description: 'Горячие травяные компрессы для тайского массажа и снятия мышечного напряжения',
        description_en: 'Hot herbal compresses for Thai massage and muscle tension relief',
        description_zh: '热草药压缩包，用于泰式按摩和缓解肌肉紧张',
        description_vi: 'Túi nén thảo dược nóng cho mát-xa Thái và giảm căng cơ',
        composition: 'Лемонграсс, имбирь, куркума, кафир-лайм',
        composition_en: 'Lemongrass, ginger, turmeric, kaffir lime',
        composition_zh: '柠檬草、生姜、姜黄、卡菲尔酸橙',
        composition_vi: 'Sả, gừng, nghệ, chanh kaffir',
        usage: 'Распарить в горячей воде 5-10 минут, прикладывать к больным местам',
        usage_en: 'Steam in hot water for 5-10 minutes, apply to sore areas',
        usage_zh: '在热水中蒸5-10分钟，敷在疼痛部位',
        usage_vi: 'Hấp trong nước nóng 5-10 phút, đắp lên vùng đau',
        image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0aGFpJTIwaGVyYnN8ZW58MXx8fHwxNzYwODk0NjE5fDA&ixlib=rb-4.1.0&q=80&w=1080',
        inStock: true,
      },
      
      // ТОВАРЫ ИЗ ВЬЕТНАМА
      {
        id: crypto.randomUUID(),
        name: 'Лечебный пластырь',
        name_en: 'Healing Patch',
        name_zh: '治疗贴膏',
        name_vi: 'Miếng dán chữa bệnh',
        price: 750,
        wholesalePrice: 57,
        weight: 0.02,
        category: 'patches',
        disease: 'skin',
        store: 'vietnam',
        description: 'Пластырь с травяными экстрактами для заживления кожи',
        description_en: 'Herbal extract patch for skin healing',
        description_zh: '草药提取物贴膏，促进皮肤愈合',
        description_vi: 'Miếng dán chiết xuất thảo dược chữa lành da',
        composition: 'Экстракт алоэ, центелла азиатская',
        composition_en: 'Aloe extract, centella asiatica',
        composition_zh: '芦荟提取物、积雪草',
        composition_vi: 'Chiết xuất lô hội, rau má',
        usage: 'Наклеить на чистую сухую кожу, менять каждые 12 часов',
        usage_en: 'Apply to clean dry skin, change every 12 hours',
        usage_zh: '贴于清洁干燥的皮肤上，每12小时更换一次',
        usage_vi: 'Dán lên da sạch khô, thay sau mỗi 12 giờ',
        image: 'https://images.unsplash.com/photo-1609840534277-88833ef3ddeb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwcGF0Y2h8ZW58MXx8fHwxNzYwODk0NjE2fDA&ixlib=rb-4.1.0&q=80&w=1080',
        inStock: true,
      },
      {
        id: crypto.randomUUID(),
        name: 'Вьетнамский звездочный бальзам',
        name_en: 'Vietnamese Star Balm',
        name_zh: '越南星号膏',
        name_vi: 'Cao sao vàng Việt Nam',
        price: 320,
        wholesalePrice: 24,
        weight: 0.04,
        category: 'ointments',
        disease: 'cold',
        store: 'vietnam',
        description: 'Универсальный бальзам при простуде, головной боли, укусах насекомых',
        description_en: 'Universal balm for colds, headaches, insect bites',
        description_zh: '万能膏药，用于感冒、头痛、虫咬',
        description_vi: 'Cao đa năng cho cảm lạnh, đau đầu, côn trùng cắn',
        composition: 'Камфора, ментол, масло эвкалипта, мяты',
        composition_en: 'Camphor, menthol, eucalyptus oil, peppermint',
        composition_zh: '樟脑、薄荷醇、桉树油、薄荷',
        composition_vi: 'Long não, menthol, dầu bạch đàn, bạc hà',
        usage: 'Втирать небольшое количество в грудь, спину, виски',
        usage_en: 'Rub a small amount on chest, back, temples',
        usage_zh: '将少量擦在胸部、背部、太阳穴',
        usage_vi: 'Xoa một lượng nhỏ lên ngực, lưng, thái dương',
        image: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aWV0bmFtZXNlJTIwYmFsbXxlbnwxfHx8fDE3NjA4OTQ2MTh8MA&ixlib=rb-4.1.0&q=80&w=1080',
        inStock: true,
      },
      {
        id: crypto.randomUUID(),
        name: 'Капсулы из змеиного жира',
        name_en: 'Snake Fat Capsules',
        name_zh: '蛇油胶囊',
        name_vi: 'Viên nang mỡ rắn',
        price: 1100,
        wholesalePrice: 84,
        weight: 0.06,
        category: 'capsules',
        disease: 'joints',
        store: 'vietnam',
        description: 'Капсулы из змеиного жира для здоровья суставов и кожи',
        description_en: 'Snake fat capsules for joint and skin health',
        description_zh: '蛇油胶囊，有益关节和皮肤健康',
        description_vi: 'Viên nang mỡ rắn tốt cho khớp và da',
        composition: 'Жир змеи, витамин Е',
        composition_en: 'Snake fat, vitamin E',
        composition_zh: '蛇脂、维生素E',
        composition_vi: 'Mỡ rắn, vitamin E',
        usage: 'Принимать по 2 капсулы 2 раза в день',
        usage_en: 'Take 2 capsules twice daily',
        usage_zh: '每天两次，每次2粒',
        usage_vi: 'Uống 2 viên mỗi ngày 2 lần',
        image: 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZXJiYWwlMjBjYXBzdWxlfGVufDF8fHx8MTc2MDg5NDYxOHww&ixlib=rb-4.1.0&q=80&w=1080',
        inStock: true,
      },
      {
        id: crypto.randomUUID(),
        name: 'Вьетнамский ментоловый ингалятор',
        name_en: 'Vietnamese Menthol Inhaler',
        name_zh: '越南薄荷醇吸入器',
        name_vi: 'Que hít bạc hà Việt Nam',
        price: 280,
        wholesalePrice: 21,
        weight: 0.01,
        category: 'inhalers',
        disease: 'cold',
        store: 'vietnam',
        description: 'Карманный ингалятор с ментолом и эвкалиптом при заложенности носа',
        description_en: 'Pocket inhaler with menthol and eucalyptus for nasal congestion',
        description_zh: '薄荷和桉树便携式吸入器，用于鼻塞',
        description_vi: 'Que hít bỏ túi với bạc hà và bạch đàn cho nghẹt mũi',
        composition: 'Ментол, эвкалипт, масло мяты',
        composition_en: 'Menthol, eucalyptus, peppermint oil',
        composition_zh: '薄荷醇、桉树、薄荷油',
        composition_vi: 'Menthol, bạch đàn, dầu bạc hà',
        usage: 'Вдыхать через нос при необходимости',
        usage_en: 'Inhale through nose as needed',
        usage_zh: '需要时通过鼻子吸入',
        usage_vi: 'Hít qua mũi khi cần thiết',
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxtZW50aG9sJTIwaW5oYWxlcnxlbnwxfHx8fDE3NjA4OTQ2MjB8MA&ixlib=rb-4.1.0&q=80&w=1080',
        inStock: true,
      },
    ];

    for (const product of demoProducts) {
      await kv.set(`product:${product.id}`, product);
    }

    return c.json({ success: true, message: 'Demo data initialized', count: demoProducts.length });
  } catch (error) {
    console.error('Error initializing demo data:', error);
    return c.json({ error: 'Failed to initialize demo data' }, 500);
  }
});

// Create first admin user
app.post('/make-server-a75b5353/create-admin', async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }
    
    const supabase = getSupabaseAdmin();
    
    console.log(`👤 Creating admin user: ${email}`);
    
    // Create admin user
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { 
        name: name || 'Admin',
        isAdmin: true,
        isWholesaler: false
      },
      email_confirm: true,
    });

    if (error) {
      console.error('❌ Create admin auth error:', error);
      return c.json({ error: error.message }, 400);
    }

    console.log(`✅ Admin auth user created: ${data.user.id}`);

    // Create admin profile in database
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{
        id: data.user.id,
        email: email,
        name: name || 'Admin',
        is_admin: true,
        is_wholesaler: false,
        loyalty_points: 0,
        loyalty_tier: 'basic',
        monthly_total: 0,
      }]);

    if (profileError) {
      console.error('❌ Profile creation error:', profileError);
      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single();
      
      if (existingProfile) {
        console.log('ℹ️ Profile already exists, updating to admin');
        // Update existing profile to be admin
        await supabase
          .from('profiles')
          .update({ is_admin: true })
          .eq('id', data.user.id);
      } else {
        console.error('⚠️ Failed to create profile, but user auth was created');
        return c.json({ 
          error: 'Profile creation failed', 
          details: profileError.message 
        }, 500);
      }
    } else {
      console.log(`✅ Admin profile created for: ${data.user.id}`);
    }

    return c.json({ 
      success: true, 
      user: {
        id: data.user.id,
        email: data.user.email,
        isAdmin: true
      }
    });
  } catch (error) {
    console.error('❌ Create admin exception:', error);
    return c.json({ error: 'Failed to create admin user', details: String(error) }, 500);
  }
});

// Auto-translate text using Google Translate (unofficial API)
app.post('/make-server-a75b5353/translate', requireAdmin, async (c) => {
  try {
    const { text, targetLang } = await c.req.json();
    
    if (!text || !targetLang) {
      console.error('❌ Missing text or targetLang');
      return c.json({ error: 'Text and target language required' }, 400);
    }

    console.log(`🌐 Translating to ${targetLang}: "${text.substring(0, 50)}..."`);

    // Map our language codes to standard ISO codes
    const langMap: Record<string, string> = {
      'en': 'en',
      'zh': 'zh-CN',
      'vi': 'vi',
    };
    
    const targetLangCode = langMap[targetLang] || targetLang;

    // Method 1: Try Google Translate (free unofficial API)
    try {
      console.log(`🔄 Trying Google Translate API...`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      // Using unofficial Google Translate API
      const googleTranslateUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ru&tl=${targetLangCode}&dt=t&q=${encodeURIComponent(text)}`;
      
      const response = await fetch(googleTranslateUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        
        // Google Translate unofficial API returns array format: [[[translated_text, original_text, null, null, relevance]]]
        if (data && data[0] && Array.isArray(data[0])) {
          let translated = '';
          for (const segment of data[0]) {
            if (segment && segment[0]) {
              translated += segment[0];
            }
          }
          
          if (translated) {
            console.log(`✅ Google Translate successful: "${translated.substring(0, 50)}..."`);
            return c.json({ translatedText: translated });
          }
        }
      }
    } catch (googleError) {
      console.warn('⚠️ Google Translate API failed:', googleError);
    }

    // Method 2: Try MyMemory as fallback
    try {
      console.log(`🔄 Trying MyMemory API as fallback...`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ru|${targetLangCode}`;
      
      const response = await fetch(myMemoryUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        
        if (data.responseData && data.responseData.translatedText) {
          const translated = data.responseData.translatedText;
          console.log(`✅ MyMemory translation successful: "${translated.substring(0, 50)}..."`);
          return c.json({ translatedText: translated });
        }
      }
    } catch (myMemoryError) {
      console.warn('⚠️ MyMemory API failed:', myMemoryError);
    }

    // Fallback: Return original text
    console.warn('⚠️ All translation services failed, returning original text');
    return c.json({ 
      translatedText: text,
      warning: 'Translation service timeout or error'
    });
  } catch (error) {
    console.error('❌ Translation error:', error);
    return c.json({ error: 'Translation failed', details: String(error) }, 500);
  }
});

// ============================================
// Page Content Endpoints
// ============================================

// Get page content (public)
app.get('/make-server-a75b5353/pages/:pageName', async (c) => {
  try {
    const pageName = c.req.param('pageName');
    const lang = c.req.query('lang') || 'ru';
    
    console.log(`📄 Fetching page content: ${pageName} (${lang})`);
    
    // Try to get content from KV store
    const contentKey = `page:${pageName}:${lang}`;
    const content = await kv.get(contentKey);
    
    if (content) {
      console.log(`✅ Found content for ${pageName} in ${lang}`);
      return c.json({ content });
    }
    
    // Return empty if not found - frontend will use defaults
    console.log(`⚠️ No content found for ${pageName} in ${lang}, frontend will use defaults`);
    return c.json({ content: null });
  } catch (error) {
    console.error('❌ Error fetching page content:', error);
    return c.json({ error: 'Failed to fetch page content', details: String(error) }, 500);
  }
});

// Update page content (admin only)
app.post('/make-server-a75b5353/pages/:pageName', requireAdmin, async (c) => {
  try {
    const pageName = c.req.param('pageName');
    const { content, language } = await c.req.json();
    
    console.log(`📝 Updating page content: ${pageName} (${language})`);
    
    const contentKey = `page:${pageName}:${language}`;
    await kv.set(contentKey, content);
    
    console.log(`✅ Updated content for ${pageName} in ${language}`);
    return c.json({ success: true });
  } catch (error) {
    console.error('❌ Error updating page content:', error);
    return c.json({ error: 'Failed to update page content', details: String(error) }, 500);
  }
});

// ============================================
// Settings Endpoints (Admin Only)
// ============================================

// Get SEO settings (admin only)
app.get('/make-server-a75b5353/admin/settings/seo', requireAdmin, async (c) => {
  try {
    console.log('📋 Fetching SEO settings');
    
    const value = await kv.get('setting:seo');
    
    if (!value) {
      console.log('⚠️ SEO settings not found, returning defaults');
      return c.json({ value: null });
    }
    
    console.log('✅ SEO settings found');
    return c.json({ value });
  } catch (error) {
    console.error('❌ Error fetching SEO settings:', error);
    return c.json({ error: 'Failed to fetch SEO settings', details: String(error) }, 500);
  }
});

// Update SEO settings (admin only)
app.put('/make-server-a75b5353/admin/settings/seo', requireAdmin, async (c) => {
  try {
    const { value } = await c.req.json();
    
    console.log('📝 Updating SEO settings');
    
    await kv.set('setting:seo', value);
    
    console.log('✅ SEO settings updated successfully');
    return c.json({ success: true });
  } catch (error) {
    console.error('❌ Error updating SEO settings:', error);
    return c.json({ error: 'Failed to update SEO settings', details: String(error) }, 500);
  }
});

// Get all settings (admin only)
app.get('/make-server-a75b5353/admin/settings', requireAdmin, async (c) => {
  try {
    console.log('📋 Fetching all settings');
    
    const settingsData = await kv.getByPrefix('setting:');
    
    // Convert array of {key, value} to object
    const settings: Record<string, any> = {};
    for (const item of settingsData) {
      // Extract setting name from key (format: "setting:name")
      const settingName = item.key.replace('setting:', '');
      settings[settingName] = item.value;
    }
    
    console.log(`✅ Fetched ${Object.keys(settings).length} settings`);
    return c.json({ settings });
  } catch (error) {
    console.error('❌ Error fetching settings:', error);
    return c.json({ error: 'Failed to fetch settings', details: String(error) }, 500);
  }
});

// Get specific setting (admin only)
app.get('/make-server-a75b5353/admin/settings/:name', requireAdmin, async (c) => {
  try {
    const settingName = c.req.param('name');
    console.log(`📋 Fetching setting: ${settingName}`);
    
    const value = await kv.get(`setting:${settingName}`);
    
    if (value === null || value === undefined) {
      console.log(`⚠️ Setting not found: ${settingName}`);
      return c.json({ value: null });
    }
    
    console.log(`✅ Found setting: ${settingName}`);
    return c.json({ value });
  } catch (error) {
    console.error('❌ Error fetching setting:', error);
    return c.json({ error: 'Failed to fetch setting', details: String(error) }, 500);
  }
});

// Update setting (admin only)
app.put('/make-server-a75b5353/admin/settings/:name', requireAdmin, async (c) => {
  try {
    const settingName = c.req.param('name');
    const { value } = await c.req.json();
    
    console.log(`📝 Updating setting: ${settingName}`);
    
    await kv.set(`setting:${settingName}`, value);
    
    console.log(`✅ Updated setting: ${settingName}`);
    return c.json({ success: true });
  } catch (error) {
    console.error('❌ Error updating setting:', error);
    return c.json({ error: 'Failed to update setting', details: String(error) }, 500);
  }
});

// ============================================
// Category Management Endpoints
// ============================================

// Get categories (public endpoint for frontend, admin endpoint for management)
app.get('/make-server-a75b5353/admin/categories', async (c) => {
  try {
    console.log('📋 Fetching categories');
    
    let categories = await kv.get('categories');
    
    if (!categories) {
      console.log('ℹ️ No categories found, initializing default categories');
      
      // Default categories matching the existing structure
      categories = {
        topMenu: [
          {
            id: 'ointments',
            translations: {
              ru: 'Мази и бальзамы',
              en: 'Ointments and Balms',
              zh: '药膏和香膏',
              vi: 'Thuốc mỡ và dầu bôi'
            },
            order: 0
          },
          {
            id: 'patches',
            translations: {
              ru: 'Пластыри',
              en: 'Patches',
              zh: '贴膏',
              vi: 'Miếng dán'
            },
            order: 1
          },
          {
            id: 'elixirs',
            translations: {
              ru: 'Эликсиры',
              en: 'Elixirs',
              zh: '灵丹妙药',
              vi: 'Thuốc tiên'
            },
            order: 2
          },
          {
            id: 'capsules',
            translations: {
              ru: 'Капсулы и пилюли',
              en: 'Capsules and Pills',
              zh: '胶囊和丸剂',
              vi: 'Viên nang và viên thuốc'
            },
            order: 3
          },
          {
            id: 'teas',
            translations: {
              ru: 'Лечебные чаи',
              en: 'Herbal Teas',
              zh: '草药茶',
              vi: 'Trà thảo dược'
            },
            order: 4
          },
          {
            id: 'oils',
            translations: {
              ru: 'Масла',
              en: 'Oils',
              zh: '油',
              vi: 'Dầu'
            },
            order: 5
          },
          {
            id: 'drops',
            translations: {
              ru: 'Капли',
              en: 'Drops',
              zh: '滴剂',
              vi: 'Thuốc nhỏ'
            },
            order: 6
          },
          {
            id: 'samples',
            translations: {
              ru: 'Пробники',
              en: 'Samples',
              zh: '样品',
              vi: 'Mẫu thử'
            },
            order: 7
          },
          {
            id: 'other',
            translations: {
              ru: 'Другое',
              en: 'Other',
              zh: '其他',
              vi: 'Khác'
            },
            order: 8
          }
        ],
        sidebar: [
          {
            id: 'popular',
            translations: {
              ru: 'Популярные товары',
              en: 'Popular Products',
              zh: '热门产品',
              vi: 'Sản phẩm phổ biến'
            },
            icon: 'Star',
            order: 0
          },
          {
            id: 'cold',
            translations: {
              ru: 'Простуда',
              en: 'Cold',
              zh: '感冒',
              vi: 'Cảm lạnh'
            },
            icon: 'Thermometer',
            order: 1
          },
          {
            id: 'digestive',
            translations: {
              ru: 'ЖКТ',
              en: 'Digestive System',
              zh: '消化系统',
              vi: 'Hệ tiêu hóa'
            },
            icon: 'Activity',
            order: 2
          },
          {
            id: 'skin',
            translations: {
              ru: 'Болезни кожи',
              en: 'Skin Diseases',
              zh: '皮肤病',
              vi: 'Bệnh da'
            },
            icon: 'Droplet',
            order: 3
          },
          {
            id: 'joints',
            translations: {
              ru: 'Суставы',
              en: 'Joints',
              zh: '关节',
              vi: 'Khớp'
            },
            icon: 'Bone',
            order: 4
          },
          {
            id: 'headache',
            translations: {
              ru: 'Головная боль',
              en: 'Headache',
              zh: '头痛',
              vi: 'Đau đầu'
            },
            icon: 'Brain',
            order: 5
          },
          {
            id: 'heart',
            translations: {
              ru: 'Сердце и сосуды',
              en: 'Heart and Vessels',
              zh: '心脏和血管',
              vi: 'Tim mạch'
            },
            icon: 'Heart',
            order: 6
          },
          {
            id: 'liver',
            translations: {
              ru: 'Печень',
              en: 'Liver',
              zh: '肝脏',
              vi: 'Gan'
            },
            icon: 'Leaf',
            order: 7
          },
          {
            id: 'oncology',
            translations: {
              ru: 'Онкология',
              en: 'Oncology',
              zh: '肿瘤科',
              vi: 'Ung thư'
            },
            icon: 'Shield',
            order: 8
          },
          {
            id: 'kidneys',
            translations: {
              ru: 'Почки',
              en: 'Kidneys',
              zh: '肾脏',
              vi: 'Thận'
            },
            icon: 'Droplet',
            order: 9
          },
          {
            id: 'nervous',
            translations: {
              ru: 'Нервная система',
              en: 'Nervous System',
              zh: '神经系统',
              vi: 'Hệ thần kinh'
            },
            icon: 'Zap',
            order: 10
          },
          {
            id: 'womensHealth',
            translations: {
              ru: 'Женское здоровье',
              en: "Women's Health",
              zh: '女性健康',
              vi: 'Sức khỏe phụ nữ'
            },
            icon: 'User',
            order: 11
          },
          {
            id: 'mensHealth',
            translations: {
              ru: 'Мужское здоровье',
              en: "Men's Health",
              zh: '男性健康',
              vi: 'Sức khỏe nam giới'
            },
            icon: 'User',
            order: 12
          },
          {
            id: 'forChildren',
            translations: {
              ru: 'Для де��ей',
              en: 'For Children',
              zh: '儿童',
              vi: 'Cho trẻ em'
            },
            icon: 'Baby',
            order: 13
          },
          {
            id: 'vision',
            translations: {
              ru: 'Зрение',
              en: 'Vision',
              zh: '视力',
              vi: 'Thị lực'
            },
            icon: 'Eye',
            order: 14
          },
          {
            id: 'hemorrhoids',
            translations: {
              ru: 'Геморрой',
              en: 'Hemorrhoids',
              zh: '痔疮',
              vi: 'Trĩ'
            },
            icon: 'CircleDot',
            order: 15
          }
        ]
      };
      
      // Save default categories
      await kv.set('categories', categories);
      console.log('✅ Default categories initialized');
    }
    
    console.log('✅ Categories loaded');
    return c.json({ categories });
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    return c.json({ error: 'Failed to fetch categories', details: String(error) }, 500);
  }
});

// Public endpoint to get categories (no auth required)
app.get('/make-server-a75b5353/categories', async (c) => {
  try {
    console.log('📋 Fetching categories (public)');
    
    let categories = await kv.get('categories');
    
    if (!categories) {
      console.log('ℹ️ No categories found, initializing default categories');
      
      // Default categories with proper translations for all languages
      categories = {
        topMenu: [
          {
            id: 'ointments',
            translations: {
              ru: 'Мази и бальзамы',
              en: 'Ointments & Balms',
              zh: '药膏和香膏',
              vi: 'Thuốc mỡ và dầu bôi'
            },
            order: 0
          },
          {
            id: 'patches',
            translations: {
              ru: 'Пластыри',
              en: 'Patches',
              zh: '贴膏',
              vi: 'Miếng dán'
            },
            order: 1
          },
          {
            id: 'sprays',
            translations: {
              ru: 'Спреи',
              en: 'Sprays',
              zh: '喷剂',
              vi: 'Xịt'
            },
            order: 2
          },
          {
            id: 'teas',
            translations: {
              ru: 'Чай',
              en: 'Tea',
              zh: '茶',
              vi: 'Trà'
            },
            order: 3
          },
          {
            id: 'elixirs',
            translations: {
              ru: 'Эликсиры',
              en: 'Elixirs',
              zh: '药酒',
              vi: 'Thuốc bổ'
            },
            order: 4
          },
          {
            id: 'pills',
            translations: {
              ru: 'Пилюли',
              en: 'Pills',
              zh: '丸药',
              vi: 'Viên thuốc'
            },
            order: 5
          },
          {
            id: 'cosmetics',
            translations: {
              ru: 'Косметика',
              en: 'Cosmetics',
              zh: '化妆品',
              vi: 'Mỹ phẩm'
            },
            order: 6
          }
        ],
        sidebar: [
          {
            id: 'popular',
            translations: {
              ru: 'Популярные товары',
              en: 'Popular Products',
              zh: '热门产品',
              vi: 'Sản phẩm phổ biến'
            },
            icon: 'Sparkles',
            order: 0
          },
          {
            id: 'allProducts',
            translations: {
              ru: 'Все товары',
              en: 'All Products',
              zh: '所有产品',
              vi: 'Tất cả sản phẩm'
            },
            icon: 'Package',
            order: 1
          },
          {
            id: 'cold',
            translations: {
              ru: 'Простуда',
              en: 'Cold & Flu',
              zh: '感冒',
              vi: 'Cảm lạnh'
            },
            icon: 'Thermometer',
            order: 2
          },
          {
            id: 'digestive',
            translations: {
              ru: 'ЖКТ',
              en: 'Digestive System',
              zh: '消化系统',
              vi: 'Hệ tiêu hóa'
            },
            icon: 'Activity',
            order: 3
          },
          {
            id: 'skin',
            translations: {
              ru: 'Кожа',
              en: 'Skin',
              zh: '皮肤',
              vi: 'Da'
            },
            icon: 'Droplet',
            order: 4
          },
          {
            id: 'joints',
            translations: {
              ru: 'Суставы',
              en: 'Joints',
              zh: '关节',
              vi: 'Khớp'
            },
            icon: 'Bone',
            order: 5
          },
          {
            id: 'heart',
            translations: {
              ru: 'Сердце и сосуды',
              en: 'Heart & Vessels',
              zh: '心脏和血管',
              vi: 'Tim mạch'
            },
            icon: 'Heart',
            order: 6
          },
          {
            id: 'liverKidneys',
            translations: {
              ru: 'Печень и почки',
              en: 'Liver & Kidneys',
              zh: '肝肾',
              vi: 'Gan thận'
            },
            icon: 'Leaf',
            order: 7
          },
          {
            id: 'nervous',
            translations: {
              ru: 'Нервная система',
              en: 'Nervous System',
              zh: '神经系统',
              vi: 'Hệ thần kinh'
            },
            icon: 'Zap',
            order: 8
          },
          {
            id: 'womensHealth',
            translations: {
              ru: 'Женское здоровье',
              en: "Women's Health",
              zh: '女性健康',
              vi: 'Sức khỏe phụ nữ'
            },
            icon: 'User',
            order: 9
          },
          {
            id: 'mensHealth',
            translations: {
              ru: 'Мужское здоровье',
              en: "Men's Health",
              zh: '男性健康',
              vi: 'Sức khỏe nam giới'
            },
            icon: 'User',
            order: 10
          },
          {
            id: 'forChildren',
            translations: {
              ru: 'Для детей',
              en: 'For Children',
              zh: '儿童',
              vi: 'Cho trẻ em'
            },
            icon: 'Baby',
            order: 11
          },
          {
            id: 'vision',
            translations: {
              ru: 'Зрение',
              en: 'Vision',
              zh: '视力',
              vi: 'Thị lực'
            },
            icon: 'Eye',
            order: 12
          },
          {
            id: 'hemorrhoids',
            translations: {
              ru: 'Геморрой',
              en: 'Hemorrhoids',
              zh: '痔疮',
              vi: 'Trĩ'
            },
            icon: 'CircleDot',
            order: 13
          },
          {
            id: 'oncology',
            translations: {
              ru: 'Онкология',
              en: 'Oncology',
              zh: '肿瘤',
              vi: 'Ung thư'
            },
            icon: 'Shield',
            order: 14
          },
          {
            id: 'thyroid',
            translations: {
              ru: 'Щитовидная железа',
              en: 'Thyroid',
              zh: '甲状腺',
              vi: 'Tuyến giáp'
            },
            icon: 'Coffee',
            order: 15
          },
          {
            id: 'lungs',
            translations: {
              ru: 'Легкие',
              en: 'Lungs',
              zh: '肺',
              vi: 'Phổi'
            },
            icon: 'Wind',
            order: 16
          }
        ]
      };
      
      // Save default categories
      await kv.set('categories', categories);
      console.log('✅ Default categories initialized in public endpoint');
    }
    
    return c.json({ categories });
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    return c.json({ error: 'Failed to fetch categories', details: String(error) }, 500);
  }
});

// Update categories (admin only)
app.put('/make-server-a75b5353/admin/categories', requireAdmin, async (c) => {
  try {
    const { categories } = await c.req.json();
    
    console.log('📝 Updating categories');
    
    await kv.set('categories', categories);
    
    console.log('✅ Categories updated successfully');
    return c.json({ success: true });
  } catch (error) {
    console.error('❌ Error updating categories:', error);
    return c.json({ error: 'Failed to update categories', details: String(error) }, 500);
  }
});

// Force reset categories to defaults (admin only) - Complete wipe and recreation
app.post('/make-server-a75b5353/admin/categories/reset-all', requireAdmin, async (c) => {
  try {
    console.log('🔄 FORCE RESETTING ALL CATEGORIES - Complete wipe and recreation');
    
    // Delete existing categories completely
    await kv.del('categories');
    console.log('✅ Old categories deleted');
    
    // Create fresh default categories with proper translations
    const freshCategories = {
      topMenu: [
        {
          id: 'ointments',
          translations: {
            ru: 'Мази и бальзамы',
            en: 'Ointments & Balms',
            zh: '药膏和香膏',
            vi: 'Thuốc mỡ và dầu bôi'
          },
          order: 0
        },
        {
          id: 'patches',
          translations: {
            ru: 'Пластыри',
            en: 'Patches',
            zh: '贴膏',
            vi: 'Miếng dán'
          },
          order: 1
        },
        {
          id: 'sprays',
          translations: {
            ru: 'Спреи',
            en: 'Sprays',
            zh: '喷剂',
            vi: 'Xịt'
          },
          order: 2
        },
        {
          id: 'teas',
          translations: {
            ru: 'Чай',
            en: 'Tea',
            zh: '茶',
            vi: 'Trà'
          },
          order: 3
        },
        {
          id: 'elixirs',
          translations: {
            ru: 'Эликсиры',
            en: 'Elixirs',
            zh: '药酒',
            vi: 'Thuốc bổ'
          },
          order: 4
        },
        {
          id: 'pills',
          translations: {
            ru: 'Пилюли',
            en: 'Pills',
            zh: '丸药',
            vi: 'Viên thuốc'
          },
          order: 5
        },
        {
          id: 'cosmetics',
          translations: {
            ru: 'Косметика',
            en: 'Cosmetics',
            zh: '化妆品',
            vi: 'Mỹ phẩm'
          },
          order: 6
        }
      ],
      sidebar: [
        {
          id: 'popular',
          translations: {
            ru: 'Популярные товары',
            en: 'Popular Products',
            zh: '热门产品',
            vi: 'Sản phẩm phổ biến'
          },
          icon: 'Sparkles',
          order: 0
        },
        {
          id: 'allProducts',
          translations: {
            ru: 'Все товары',
            en: 'All Products',
            zh: '所有产品',
            vi: 'Tất cả sản phẩm'
          },
          icon: 'Package',
          order: 1
        },
        {
          id: 'cold',
          translations: {
            ru: 'Простуда',
            en: 'Cold & Flu',
            zh: '感冒',
            vi: 'Cảm lạnh'
          },
          icon: 'Thermometer',
          order: 2
        },
        {
          id: 'digestive',
          translations: {
            ru: 'ЖКТ',
            en: 'Digestive System',
            zh: '消化系统',
            vi: 'Hệ tiêu hóa'
          },
          icon: 'Activity',
          order: 3
        },
        {
          id: 'skin',
          translations: {
            ru: 'Кожа',
            en: 'Skin',
            zh: '皮肤',
            vi: 'Da'
          },
          icon: 'Droplet',
          order: 4
        },
        {
          id: 'joints',
          translations: {
            ru: 'Суставы',
            en: 'Joints',
            zh: '关节',
            vi: 'Khớp'
          },
          icon: 'Bone',
          order: 5
        },
        {
          id: 'heart',
          translations: {
            ru: 'Сердце и сосуды',
            en: 'Heart & Vessels',
            zh: '心脏和血管',
            vi: 'Tim mạch'
          },
          icon: 'Heart',
          order: 6
        },
        {
          id: 'liverKidneys',
          translations: {
            ru: 'Печень и почки',
            en: 'Liver & Kidneys',
            zh: '肝肾',
            vi: 'Gan thận'
          },
          icon: 'Leaf',
          order: 7
        },
        {
          id: 'nervous',
          translations: {
            ru: 'Нервная система',
            en: 'Nervous System',
            zh: '神经系统',
            vi: 'Hệ thần kinh'
          },
          icon: 'Zap',
          order: 8
        },
        {
          id: 'womensHealth',
          translations: {
            ru: 'Женское здоровье',
            en: "Women's Health",
            zh: '女性健康',
            vi: 'Sức khỏe phụ nữ'
          },
          icon: 'User',
          order: 9
        },
        {
          id: 'mensHealth',
          translations: {
            ru: 'Мужское здоровье',
            en: "Men's Health",
            zh: '男性健康',
            vi: 'Sức khỏe nam giới'
          },
          icon: 'User',
          order: 10
        },
        {
          id: 'forChildren',
          translations: {
            ru: 'Для детей',
            en: 'For Children',
            zh: '儿童',
            vi: 'Cho trẻ em'
          },
          icon: 'Baby',
          order: 11
        },
        {
          id: 'vision',
          translations: {
            ru: 'Зрение',
            en: 'Vision',
            zh: '视力',
            vi: 'Thị lực'
          },
          icon: 'Eye',
          order: 12
        },
        {
          id: 'hemorrhoids',
          translations: {
            ru: 'Геморрой',
            en: 'Hemorrhoids',
            zh: '痔疮',
            vi: 'Trĩ'
          },
          icon: 'CircleDot',
          order: 13
        },
        {
          id: 'oncology',
          translations: {
            ru: 'Онкология',
            en: 'Oncology',
            zh: '肿瘤',
            vi: 'Ung thư'
          },
          icon: 'Shield',
          order: 14
        },
        {
          id: 'thyroid',
          translations: {
            ru: 'Щитовидная железа',
            en: 'Thyroid',
            zh: '甲状腺',
            vi: 'Tuyến giáp'
          },
          icon: 'Coffee',
          order: 15
        },
        {
          id: 'lungs',
          translations: {
            ru: 'Легкие',
            en: 'Lungs',
            zh: '肺',
            vi: 'Phổi'
          },
          icon: 'Wind',
          order: 16
        }
      ]
    };
    
    // Save fresh categories
    await kv.set('categories', freshCategories);
    console.log('✅ Fresh categories created with proper translations');
    
    return c.json({ 
      success: true, 
      categories: freshCategories,
      message: 'Categories completely reset to defaults with proper translations' 
    });
  } catch (error) {
    console.error('❌ Error resetting categories:', error);
    return c.json({ error: 'Failed to reset categories', details: String(error) }, 500);
  }
});

// ============================================
// Settings Endpoints (continued)
// ============================================

// Update multiple settings at once (admin only)
app.post('/make-server-a75b5353/admin/settings', requireAdmin, async (c) => {
  try {
    const { settings } = await c.req.json();
    
    console.log(`📝 Updating ${Object.keys(settings).length} settings`);
    
    // Save each setting
    for (const [key, value] of Object.entries(settings)) {
      await kv.set(`setting:${key}`, value);
      console.log(`  ✓ Saved ${key}`);
    }
    
    console.log(`✅ All settings updated successfully`);
    return c.json({ success: true });
  } catch (error) {
    console.error('❌ Error updating settings:', error);
    return c.json({ error: 'Failed to update settings', details: String(error) }, 500);
  }
});

// ============================================
// Analytics Endpoint
// ============================================

// Get analytics data (admin only)
app.get('/make-server-a75b5353/admin/analytics', requireAdmin, async (c) => {
  try {
    console.log('📊 Fetching analytics data');
    
    // Get all orders
    const allOrders = await kv.getByPrefix('order:');
    const orders = allOrders.map(o => o.value);
    
    // Get all users
    const allUsers = await kv.getByPrefix('user:');
    const users = allUsers.map(u => u.value);
    
    // Today's date boundaries
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Yesterday's date boundaries
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Filter orders by date
    const todayOrders = orders.filter(o => {
      const orderDate = new Date(o.createdAt || o.orderDate);
      return orderDate >= today && orderDate < tomorrow;
    });
    
    const yesterdayOrders = orders.filter(o => {
      const orderDate = new Date(o.createdAt || o.orderDate);
      return orderDate >= yesterday && orderDate < today;
    });
    
    // Calculate revenue
    const revenueToday = todayOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
    const revenueYesterday = yesterdayOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
    
    // New customers today
    const newCustomersToday = users.filter(u => {
      const createdDate = new Date(u.createdAt || u.created_at);
      return createdDate >= today && createdDate < tomorrow;
    }).length;
    
    // Loyalty points issued today
    const loyaltyPointsToday = todayOrders.reduce((sum, o) => {
      // Rough estimate: 5% of order value as points
      return sum + Math.floor((o.totalPrice || 0) * 0.05);
    }, 0);
    
    // Store statistics
    const storeStats = {
      china: { orders: 0, revenue: 0 },
      thailand: { orders: 0, revenue: 0 },
      vietnam: { orders: 0, revenue: 0 },
    };
    
    todayOrders.forEach(order => {
      const store = order.store || 'china';
      if (storeStats[store as keyof typeof storeStats]) {
        storeStats[store as keyof typeof storeStats].orders += 1;
        storeStats[store as keyof typeof storeStats].revenue += order.totalPrice || 0;
      }
    });
    
    const analyticsData = {
      ordersToday: todayOrders.length,
      revenueToday,
      newCustomers: newCustomersToday,
      loyaltyPointsIssued: loyaltyPointsToday,
      ordersYesterday: yesterdayOrders.length,
      revenueYesterday,
      storeStats,
    };
    
    console.log(`✅ Analytics calculated: ${todayOrders.length} orders today, ${revenueToday} ₽ revenue`);
    return c.json(analyticsData);
  } catch (error) {
    console.error('❌ Error fetching analytics:', error);
    return c.json({ error: 'Failed to fetch analytics', details: String(error) }, 500);
  }
});

// ============================================
// WordPress Parser Endpoint
// ============================================

// Parse WordPress products (admin only)
app.post('/make-server-a75b5353/admin/parse-wordpress', requireAdmin, async (c) => {
  try {
    const { url } = await c.req.json();
    
    if (!url) {
      return c.json({ error: 'URL is required' }, 400);
    }
    
    console.log(`🔍 Parsing WordPress site: ${url}`);
    
    // Validate URL
    let inputUrl: URL;
    try {
      inputUrl = new URL(url);
    } catch (e) {
      return c.json({ 
        error: 'Invalid URL format',
        message: 'Введите корректный URL. Например: https://example.com'
      }, 400);
    }
    
    // Check if URL already contains WooCommerce API path with auth params
    let apiUrl: string;
    
    if (url.includes('/wp-json/wc/v3/products')) {
      // User provided full API URL with auth params
      apiUrl = url;
      console.log(`📡 Using provided API URL with authentication`);
    } else {
      // User provided just the site URL, construct API URL
      apiUrl = `${inputUrl.origin}/wp-json/wc/v3/products`;
      console.log(`📡 Constructed API URL: ${apiUrl}`);
    }
    
    console.log(`🔗 Fetching from: ${apiUrl.replace(/consumer_key=[^&]+/, 'consumer_key=***').replace(/consumer_secret=[^&]+/, 'consumer_secret=***')}`);
    
    try {
      const response = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'Asia-Pharm-Parser/1.0',
          'Accept': 'application/json',
        },
      });
      
      console.log(`📊 API Response Status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`⚠️ WooCommerce API Error (${response.status}):`, errorText);
        
        let errorMessage = 'Не удалось получить доступ к WooCommerce REST API.';
        
        if (response.status === 401) {
          errorMessage = 'Требуется авторизация. Добавьте API ключи в URL:\n' +
                        'https://ваш-сайт.com/wp-json/wc/v3/products?consumer_key=ck_xxx&consumer_secret=cs_xxx\n\n' +
                        'Создайте ��лючи в: WooCommerce → Настройки → REST API';
        } else if (response.status === 404) {
          errorMessage = 'WooCommerce REST API не найден. Убедитесь что:\n' +
                        '1. WooCommerce установлен и активен\n' +
                        '2. URL корректный\n' +
                        '3. Сайт доступен';
        } else if (response.status === 403) {
          errorMessage = 'Доступ запрещен. Проверьте права API ключей (должно быть минимум "Read")';
        }
        
        return c.json({ 
          error: 'WooCommerce API access denied', 
          message: errorMessage,
          status: response.status,
          details: errorText.substring(0, 200)
        }, 400);
      }
      
      const products = await response.json();
      
      // Check if response is actually an array of products
      if (!Array.isArray(products)) {
        console.error('❌ Response is not an array:', products);
        return c.json({
          error: 'Invalid API response',
          message: 'API не вернул список товаров. Проверьте URL и права доступа.',
        }, 400);
      }
      
      console.log(`✅ Found ${products.length} products`);
      
      // Parse and save products
      let savedCount = 0;
      for (const wpProduct of products) {
        try {
          // Convert WooCommerce product to our format
          const product = {
            id: crypto.randomUUID(),
            name: wpProduct.name || 'Unnamed Product',
            nameRu: wpProduct.name || '',
            nameEn: wpProduct.name || '',
            nameZh: wpProduct.name || '',
            nameVi: wpProduct.name || '',
            price: parseFloat(wpProduct.price) || 0,
            oldPrice: parseFloat(wpProduct.regular_price) || null,
            wholesalePrice: null,
            wholesalePriceYuan: null,
            image: wpProduct.images?.[0]?.src || '',
            images: wpProduct.images?.map((img: any) => img.src) || [],
            category: wpProduct.categories?.[0]?.name || 'Uncategorized',
            disease: '',
            description: wpProduct.description || '',
            descriptionRu: wpProduct.description || '',
            descriptionEn: wpProduct.description || '',
            descriptionZh: wpProduct.description || '',
            descriptionVi: wpProduct.description || '',
            stock: wpProduct.stock_quantity || 0,
            store: 'china', // Default store
            isSample: false,
            createdAt: new Date().toISOString(),
            wpId: wpProduct.id,
            wpPermalink: wpProduct.permalink,
          };
          
          await kv.set(`product:${product.id}`, product);
          savedCount++;
        } catch (productError) {
          console.error(`❌ Error saving product ${wpProduct.id}:`, productError);
        }
      }
      
      console.log(`✅ Parsing complete: ${savedCount} products saved`);
      
      return c.json({ 
        success: true, 
        message: `Успешно импортировано ${savedCount} товаров из ${products.length}`,
        productsFound: products.length,
        productsSaved: savedCount,
      });
      
    } catch (fetchError) {
      console.error('❌ Error fetching from WordPress:', fetchError);
      return c.json({ 
        error: 'Failed to fetch products from WordPress',
        message: 'Не удалось получить данные. Проверьте, что сайт доступен и WooCommerce REST API включен.',
        details: String(fetchError)
      }, 500);
    }
  } catch (error) {
    console.error('❌ Error parsing WordPress:', error);
    return c.json({ error: 'Failed to parse WordPress site', details: String(error) }, 500);
  }
});

// ============================================
// CSV Catalog Import/Export Endpoints
// ============================================

// Export catalog to CSV (admin only)
app.get('/make-server-a75b5353/admin/catalog/export', requireAdmin, async (c) => {
  try {
    console.log('📤 Exporting catalog to CSV');
    
    // Get all products from database
    const supabase = getSupabaseAdmin();
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching products:', error);
      return c.json({ error: 'Failed to fetch products', details: error.message }, 500);
    }
    
    console.log(`📦 Found ${products?.length || 0} products to export`);
    
    // CSV Headers
    const headers = [
      'id',
      'name_ru', 'name_en', 'name_zh', 'name_vi',
      'price_retail', 'price_wholesale',
      'weight',
      'category',
      'disease',
      'store',
      'image',
      'in_stock',
      'is_sample',
      'short_description_ru', 'short_description_en', 'short_description_zh', 'short_description_vi',
      'description_ru', 'description_en', 'description_zh', 'description_vi'
    ];
    
    // Escape CSV value (handle quotes, semicolons, newlines)
    const escapeCSV = (value: any): string => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      // If contains semicolon, quote, or newline, wrap in quotes and escape internal quotes
      if (str.includes(';') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    
    // Build CSV content with BOM for UTF-8 (for Excel)
    const BOM = '\uFEFF';
    let csvContent = BOM + headers.join(';') + '\n';
    
    if (products && products.length > 0) {
      products.forEach(product => {
        const row = [
          escapeCSV(product.id),
          escapeCSV(product.name || ''),
          escapeCSV(product.name_en || ''),
          escapeCSV(product.name_zh || ''),
          escapeCSV(product.name_vi || ''),
          escapeCSV(product.price || ''),
          escapeCSV(product.wholesale_price || ''),
          escapeCSV(product.weight || ''),
          escapeCSV(product.category || ''),
          escapeCSV(product.disease || ''),
          escapeCSV(product.store || ''),
          escapeCSV(product.image || ''),
          escapeCSV(product.in_stock !== false ? 'true' : 'false'),
          escapeCSV(product.is_sample === true ? 'true' : 'false'),
          escapeCSV(product.short_description || ''),
          escapeCSV(product.short_description_en || ''),
          escapeCSV(product.short_description_zh || ''),
          escapeCSV(product.short_description_vi || ''),
          escapeCSV(product.description || ''),
          escapeCSV(product.description_en || ''),
          escapeCSV(product.description_zh || ''),
          escapeCSV(product.description_vi || '')
        ];
        csvContent += row.join(';') + '\n';
      });
    }
    
    console.log('✅ CSV content generated');
    
    // Return as CSV file with CORS headers
    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="catalog_export_${new Date().toISOString().split('T')[0]}.csv"`,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('❌ Error exporting catalog:', error);
    return c.json({ error: 'Failed to export catalog', details: String(error) }, 500);
  }
});

// Import catalog from CSV (admin only)
app.post('/make-server-a75b5353/admin/catalog/import', requireAdmin, async (c) => {
  try {
    console.log('📥 Importing catalog from CSV');
    
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }
    
    const csvText = await file.text();
    // Remove BOM if present
    const cleanText = csvText.replace(/^\uFEFF/, '');
    const lines = cleanText.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return c.json({ error: 'CSV file is empty or invalid' }, 400);
    }
    
    // Parse CSV
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            current += '"';
            i++; // Skip next quote
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ';' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };
    
    const headers = parseCSVLine(lines[0]);
    console.log('📋 CSV Headers:', headers);
    
    let updated = 0;
    let created = 0;
    const errors: string[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = parseCSVLine(lines[i]);
        
        if (values.length < headers.length) {
          console.warn(`⚠️ Line ${i + 1}: Insufficient columns, skipping`);
          continue;
        }
        
        const product: any = {};
        headers.forEach((header, idx) => {
          product[header] = values[idx] || '';
        });
        
        // Build structured product object for database
        const supabase = getSupabaseAdmin();
        const isUpdate = !!product.id && product.id.trim() !== '';
        
        const dbProduct: any = {
          name: product.name_ru || '',
          name_en: product.name_en || '',
          name_zh: product.name_zh || '',
          name_vi: product.name_vi || '',
          price: parseFloat(product.price_retail) || 0,
          wholesale_price: parseFloat(product.price_wholesale) || null,
          weight: parseFloat(product.weight) || 0.1,
          category: product.category || 'other',
          disease: product.disease || 'other',
          store: product.store || 'china',
          image: product.image && product.image.trim() !== '' ? product.image.trim() : null,
          in_stock: product.in_stock !== 'false',
          is_sample: product.is_sample === 'true',
          short_description: product.short_description_ru || null,
          short_description_en: product.short_description_en || null,
          short_description_zh: product.short_description_zh || null,
          short_description_vi: product.short_description_vi || null,
          description: product.description_ru || null,
          description_en: product.description_en || null,
          description_zh: product.description_zh || null,
          description_vi: product.description_vi || null
        };
        
        if (isUpdate) {
          // Update existing product
          const { error: updateError } = await supabase
            .from('products')
            .update(dbProduct)
            .eq('id', product.id);
          
          if (updateError) {
            throw new Error(`Update failed: ${updateError.message}`);
          }
        } else {
          // Create new product
          const { error: insertError } = await supabase
            .from('products')
            .insert([dbProduct]);
          
          if (insertError) {
            throw new Error(`Insert failed: ${insertError.message}`);
          }
        }
        
        if (isUpdate) {
          updated++;
          console.log(`✅ Updated: ${product.id}`);
        } else {
          created++;
          console.log(`✅ Created new product`);
        }
      } catch (error) {
        const errorMsg = `Line ${i + 1}: ${String(error)}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }
    
    console.log(`✅ Import complete: ${updated} updated, ${created} created, ${errors.length} errors`);
    
    return c.json({
      success: true,
      updated,
      created,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('❌ Error importing catalog:', error);
    return c.json({ error: 'Failed to import catalog', details: String(error) }, 500);
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

Deno.serve(app.fetch);
