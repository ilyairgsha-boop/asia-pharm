import { Hono } from 'npm:hono';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js';
import * as kv from './kv_store.tsx';

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

// Helper function to calculate loyalty points
function calculateLoyaltyPoints(subtotal: number, monthlyTotal: number): number {
  // monthlyTotal includes this order
  const cashbackRate = monthlyTotal >= 10000 ? 0.10 : 0.05;
  // Points calculated only on subtotal (no shipping)
  return Math.floor(subtotal * cashbackRate);
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

// Helper function to get monthly total for user
async function getUserMonthlyTotal(userId: string): Promise<number> {
  try {
    console.log(`📊 Calculating monthly total for user: ${userId}`);
    
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    
    console.log(`📅 Current month key: ${monthKey}`);
    
    // Get all user orders for current month
    const userOrders = await kv.getByPrefix(`user_order:${userId}:`);
    console.log(`📦 Found ${userOrders.length} user orders`);
    
    let monthlyTotal = 0;
    
    for (const userOrder of userOrders) {
      const orderId = userOrder.value;
      const order = await kv.get(`order:${orderId}`);
      
      if (order) {
        const orderDate = new Date(order.createdAt || order.orderDate);
        const orderMonth = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
        
        console.log(`📦 Order ${orderId}: month=${orderMonth}, status=${order.status}`);
        
        if (orderMonth === monthKey && order.status === 'delivered') {
          const orderTotal = order.subtotal || order.totalPrice || 0;
          monthlyTotal += orderTotal;
          console.log(`✅ Added ${orderTotal} to monthly total`);
        }
      }
    }
    
    console.log(`💰 Final monthly total: ${monthlyTotal}`);
    return monthlyTotal;
  } catch (error) {
    console.error('Error calculating monthly total:', error);
    return 0;
  }
}

// Helper function to send order emails
async function sendOrderEmail(email: string, order: any, type: 'new' | 'status_update' | 'tracking') {
  try {
    let subject = '';
    let message = '';
    const orderNum = order.orderNumber || order.id.slice(0, 6);

    switch (type) {
      case 'new':
        subject = `Подтверждение заказа #${orderNum}`;
        message = `
          <h2>Спасибо за ваш заказ!</h2>
          <p>Номер заказа: ${orderNum}</p>
          <p>Сумма: ${order.totalPrice.toLocaleString()} ₽</p>
          <p>Статус: В обработке</p>
          <p>Мы скоро обработаем ваш заказ.</p>
        `;
        break;
      case 'status_update':
        subject = `Обновление статуса заказа #${orderNum}`;
        message = `
          <h2>Статус вашего заказа обновлен</h2>
          <p>Номер заказа: ${orderNum}</p>
          <p>Новый статус: ${order.status}</p>
        `;
        break;
      case 'tracking':
        subject = `Ваш заказ отправлен #${orderNum}`;
        message = `
          <h2>Ваш заказ отправлен!</h2>
          <p>Номер заказа: ${orderNum}</p>
          <p>Трек-номер: ${order.trackingNumber}</p>
          <p>Вы можете отследить посылку по этому номеру.</p>
        `;
        break;
    }

    // Simple email sending using Supabase (if configured)
    // Note: In production, you would use a proper email service like SendGrid, AWS SES, etc.
    console.log(`📧 Email notification: ${type} for ${email} (order ${orderNum})`);
    console.log(`Subject: ${subject}`);
    
    // For demonstration purposes only - in production, integrate with an email service
    // Example with a hypothetical email API:
    // await fetch('https://api.emailservice.com/send', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer API_KEY' },
    //   body: JSON.stringify({ to: email, from: 'info@asia-pharm.ru', subject, html: message })
    // });

    return { success: true };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error };
  }
}

// Routes

// Health check
app.get('/make-server-a75b5353/', (c) => {
  return c.json({ status: 'OK', message: 'Asia-Pharm Store API' });
});

// Sign up
app.post('/make-server-a75b5353/signup', async (c) => {
  try {
    const { email, password, name } = await c.req.json();
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

    return c.json({ success: true, user: data.user });
  } catch (error) {
    console.error('❌ Signup exception:', error);
    return c.json({ error: 'Registration failed', details: String(error) }, 500);
  }
});

// Get all products
app.get('/make-server-a75b5353/products', async (c) => {
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
    
    console.log(`✅ Fetched ${products?.length || 0} products`);
    return c.json({ products: products || [] });
  } catch (error) {
    console.error('❌ Exception fetching products:', error);
    return c.json({ error: 'Failed to fetch products', details: String(error) }, 500);
  }
});

// Create product (admin only)
app.post('/make-server-a75b5353/products', requireAdmin, async (c) => {
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
    
    const supabase = getSupabaseAdmin();
    
    console.log('🗄️ Attempting to insert into products table...');
    
    const { data: product, error } = await supabase
      .from('products')
      .insert([productData])
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
    return c.json({ success: true, product });
  } catch (error) {
    console.error('❌ Exception creating product:', error);
    console.error('❌ Exception type:', typeof error);
    console.error('❌ Exception stack:', error instanceof Error ? error.stack : 'N/A');
    return c.json({ error: 'Failed to create product', details: String(error) }, 500);
  }
});

// Update product (admin only)
app.put('/make-server-a75b5353/products/:id', requireAdmin, async (c) => {
  try {
    const productId = c.req.param('id');
    const productData = await c.req.json();
    const supabase = getSupabaseAdmin();
    
    console.log(`📝 Updating product ${productId} with data:`, JSON.stringify(productData, null, 2));

    // Remove id from productData if it exists (can't update id)
    const { id, ...updateData } = productData;
    
    console.log(`📝 Update data after removing id:`, JSON.stringify(updateData, null, 2));

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
    return c.json({ success: true, product });
  } catch (error) {
    console.error('❌ Exception updating product:', error);
    console.error('❌ Exception stack:', error instanceof Error ? error.stack : 'N/A');
    return c.json({ error: 'Failed to update product', details: String(error) }, 500);
  }
});

// Delete product (admin only)
app.delete('/make-server-a75b5353/products/:id', requireAdmin, async (c) => {
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
    const { items, store, shippingInfo, subtotal, shippingCost, promoCode, promoDiscount, loyaltyPointsUsed, totalPrice } = await c.req.json();
    
    const orderId = crypto.randomUUID();
    const orderNumber = await generateOrderNumber();
    
    const order = {
      id: orderId,
      orderNumber,
      userId: user.id,
      userEmail: user.email,
      items,
      store,
      shippingInfo,
      subtotal: subtotal || totalPrice,
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
      await sendOrderEmail(user.email, order, 'new');
    } catch (emailError) {
      console.error('Email send error:', emailError);
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
        
        const monthlyTotal = await getUserMonthlyTotal(order.userId);
        const newMonthlyTotal = monthlyTotal + (order.subtotal || order.totalPrice || 0);
        const points = calculateLoyaltyPoints(order.subtotal || order.totalPrice || 0, newMonthlyTotal);
        
        console.log(`💎 Calculated ${points} loyalty points (monthly total: ${newMonthlyTotal})`);
        
        if (points > 0) {
          await updateUserLoyalty(order.userId, points, 'earned', `Начислено за заказ #${order.orderNumber || order.id.slice(0, 6)}`);
          console.log(`✅ Awarded ${points} loyalty points to user ${order.userId} for order ${order.orderNumber}`);
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
    
    // Calculate monthly total
    const monthlyTotal = await getUserMonthlyTotal(user.id);
    const tier = monthlyTotal >= 10000 ? 'premium' : 'basic';
    
    return c.json({
      points: loyaltyData.points,
      totalEarned: loyaltyData.totalEarned,
      totalSpent: loyaltyData.totalSpent,
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
    
    // Calculate monthly total
    const monthlyTotal = await getUserMonthlyTotal(user.id);
    const tier = monthlyTotal >= 10000 ? 'premium' : 'basic';
    
    return c.json({
      points: loyaltyData.points,
      totalEarned: loyaltyData.totalEarned,
      totalSpent: loyaltyData.totalSpent,
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
        description_zh: '含草药提取物的��热贴膏，缓解关节疼痛',
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
        name: 'Тайски�� зеленый бальзам',
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
        name: '��айское масло для массажа',
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
      
      // ТОВАРЫ ИЗ ВЬЕТ��АМА
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
        usage_zh: '将少��擦在胸部、背部、太阳穴',
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

// Auto-translate text using LibreTranslate (free, open-source)
app.post('/make-server-a75b5353/translate', requireAdmin, async (c) => {
  try {
    const { text, targetLang } = await c.req.json();
    
    if (!text || !targetLang) {
      console.error('❌ Missing text or targetLang');
      return c.json({ error: 'Text and target language required' }, 400);
    }

    console.log(`🌐 Translating to ${targetLang}: "${text.substring(0, 50)}..."`);

    // Using LibreTranslate (free API)
    // For production, you can use Google Translate API with your own key
    const translateUrl = 'https://libretranslate.com/translate';
    
    try {
      // Create abort controller with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(translateUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: 'ru', // Source language is Russian
          target: targetLang, // en, zh, vi
          format: 'text',
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Translation API error:', errorText);
        // Return a fallback translation
        return c.json({ 
          translatedText: `[AUTO] ${text}`,
          warning: 'Translation service unavailable, using fallback'
        });
      }

      const data = await response.json();
      
      if (data.translatedText) {
        console.log(`✅ Translation successful: "${data.translatedText.substring(0, 50)}..."`);
        return c.json({ translatedText: data.translatedText });
      } else {
        console.error('❌ No translatedText in response:', data);
        return c.json({ 
          translatedText: `[AUTO] ${text}`,
          warning: 'Translation failed, using fallback'
        });
      }
    } catch (fetchError) {
      console.error('❌ Translation fetch error:', fetchError);
      // Return original text with prefix as fallback
      return c.json({ 
        translatedText: `[AUTO] ${text}`,
        warning: 'Translation service timeout or error'
      });
    }
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
// Settings Endpoints
// ============================================

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

Deno.serve(app.fetch);