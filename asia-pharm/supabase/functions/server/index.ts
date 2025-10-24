import { Hono } from 'npm:hono';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js';
import * as kv from './kv_store.ts';

const app = new Hono();

// ✅ ИСПРАВЛЕНО: Custom CORS middleware - set headers explicitly
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

// ✅ ИСПРАВЛЕНО: Helper function to send order emails (stub for now)
async function sendOrderEmail(email: string, order: any, type: 'new' | 'status_update' | 'tracking') {
  try {
    console.log(`📧 Email notification: ${type} for ${email} (order ${order.orderNumber || order.id})`);
    // TODO: Implement email sending when email service is configured
    // For now, just log the email that would be sent
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

// Get user loyalty info
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

// Translation endpoint (for admin panel)
app.post('/make-server-a75b5353/translate', requireAdmin, async (c) => {
  try {
    const { text, targetLang } = await c.req.json();
    
    if (!text || !targetLang) {
      return c.json({ error: 'Text and target language are required' }, 400);
    }

    // Use Google Translate API (if configured)
    // For now, return mock translation
    return c.json({ 
      translatedText: `[AUTO-${targetLang.toUpperCase()}] ${text}`,
      warning: 'Using mock translation - configure Google Translate API for production'
    });
  } catch (error) {
    console.error('❌ Translation error:', error);
    return c.json({ error: 'Translation failed', details: String(error) }, 500);
  }
});

Deno.serve(app.fetch);