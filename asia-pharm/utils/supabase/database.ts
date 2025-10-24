import { createClient } from './client';

const supabase = createClient();

// ==================== PRODUCTS ====================

export async function fetchProducts(store?: string) {
  try {
    let query = supabase
      .from('products')
      .select('*')
      .eq('in_stock', true);
    
    if (store) {
      query = query.eq('store', store);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return { success: true, products: data || [] };
  } catch (error) {
    console.error('Error fetching products:', error);
    return { success: false, products: [] };
  }
}

export async function createProduct(productData: any) {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, product: data };
  } catch (error: any) {
    console.error('Error creating product:', error);
    return { success: false, error: error.message };
  }
}

export async function updateProduct(id: string, productData: any) {
  try {
    const { data, error } = await supabase
      .from('products')
      .update(productData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, product: data };
  } catch (error: any) {
    console.error('Error updating product:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteProduct(id: string) {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return { success: false, error: error.message };
  }
}

// ==================== ORDERS ====================

export async function fetchUserOrders(userId: string) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return { success: true, orders: data || [] };
  } catch (error) {
    console.error('Error fetching orders:', error);
    return { success: false, orders: [] };
  }
}

export async function fetchAllOrders() {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return { success: true, orders: data || [] };
  } catch (error) {
    console.error('Error fetching all orders:', error);
    return { success: false, orders: [] };
  }
}

export async function createOrder(orderData: any) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, order: data };
  } catch (error: any) {
    console.error('Error creating order:', error);
    return { success: false, error: error.message };
  }
}

export async function updateOrderStatus(orderId: string, status: string) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, order: data };
  } catch (error: any) {
    console.error('Error updating order status:', error);
    return { success: false, error: error.message };
  }
}

export async function updateOrderTracking(orderId: string, trackingNumber: string) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ 
        tracking_number: trackingNumber,
        status: 'shipped'
      })
      .eq('id', orderId)
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, order: data };
  } catch (error: any) {
    console.error('Error updating tracking:', error);
    return { success: false, error: error.message };
  }
}

// ==================== PROMO CODES ====================

export async function fetchPromoCodes() {
  try {
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return { success: true, promoCodes: data || [] };
  } catch (error) {
    console.error('Error fetching promo codes:', error);
    return { success: false, promoCodes: [] };
  }
}

export async function validatePromoCode(code: string) {
  try {
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('active', true)
      .single();
    
    if (error || !data) {
      return { success: false, error: 'Invalid promo code' };
    }
    
    // Check expiry
    if (data.expiry_date) {
      const expiryDate = new Date(data.expiry_date);
      if (expiryDate < new Date()) {
        return { success: false, error: 'Promo code has expired' };
      }
    }
    
    // Check usage limit
    if (data.usage_limit && data.times_used >= data.usage_limit) {
      return { success: false, error: 'Promo code usage limit reached' };
    }
    
    return { success: true, promoCode: data };
  } catch (error: any) {
    console.error('Error validating promo code:', error);
    return { success: false, error: error.message };
  }
}

export async function createPromoCode(promoCodeData: any) {
  try {
    const { data, error } = await supabase
      .from('promo_codes')
      .insert([{ ...promoCodeData, code: promoCodeData.code.toUpperCase() }])
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, promoCode: data };
  } catch (error: any) {
    console.error('Error creating promo code:', error);
    return { success: false, error: error.message };
  }
}

export async function updatePromoCode(id: string, promoCodeData: any) {
  try {
    const { data, error } = await supabase
      .from('promo_codes')
      .update({ ...promoCodeData, code: promoCodeData.code.toUpperCase() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, promoCode: data };
  } catch (error: any) {
    console.error('Error updating promo code:', error);
    return { success: false, error: error.message };
  }
}

export async function deletePromoCode(id: string) {
  try {
    const { error } = await supabase
      .from('promo_codes')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting promo code:', error);
    return { success: false, error: error.message };
  }
}

// ==================== LOYALTY ====================

export async function fetchLoyaltyInfo(userId: string) {
  try {
    // Fetch user profile with loyalty info - use maybeSingle to avoid error when profile doesn't exist
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('loyalty_points, loyalty_tier, monthly_total')
      .eq('id', userId)
      .maybeSingle();
    
    // Don't throw if profile doesn't exist, just use defaults
    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError;
    }
    
    // Fetch loyalty transactions
    const { data: transactions, error: transError } = await supabase
      .from('loyalty_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    // Don't throw if transactions table doesn't exist or is empty
    
    return {
      success: true,
      points: profile?.loyalty_points || 0,
      tier: profile?.loyalty_tier || 'basic',
      monthlyTotal: profile?.monthly_total || 0,
      history: transactions || []
    };
  } catch (error) {
    console.error('Error fetching loyalty info:', error);
    return {
      success: false,
      points: 0,
      tier: 'basic',
      monthlyTotal: 0,
      history: []
    };
  }
}

export async function useLoyaltyPoints(userId: string, points: number, orderId: string) {
  try {
    // Deduct points from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('loyalty_points')
      .eq('id', userId)
      .single();
    
    if (profileError) throw profileError;
    
    if ((profile?.loyalty_points || 0) < points) {
      return { success: false, error: 'Insufficient loyalty points' };
    }
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ loyalty_points: (profile?.loyalty_points || 0) - points })
      .eq('id', userId);
    
    if (updateError) throw updateError;
    
    // Create transaction record
    const { error: transError } = await supabase
      .from('loyalty_transactions')
      .insert([{
        user_id: userId,
        order_id: orderId,
        type: 'spent',
        points: -points,
        description: `Used for order`
      }]);
    
    if (transError) throw transError;
    
    return { success: true };
  } catch (error: any) {
    console.error('Error using loyalty points:', error);
    return { success: false, error: error.message };
  }
}

// ==================== USERS ====================

export async function fetchAllUsers() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return { success: true, users: data || [] };
  } catch (error) {
    console.error('Error fetching users:', error);
    return { success: false, users: [] };
  }
}

export async function updateUserRole(userId: string, isAdmin: boolean) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_admin: isAdmin })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, user: data };
  } catch (error: any) {
    console.error('Error updating user role:', error);
    return { success: false, error: error.message };
  }
}

// ==================== ANALYTICS ====================

export async function fetchAnalytics() {
  try {
    // Get total orders
    const { count: totalOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });
    
    // Get total revenue
    const { data: orders } = await supabase
      .from('orders')
      .select('total_price, status');
    
    const totalRevenue = orders
      ?.filter(o => ['paid', 'processing', 'shipped', 'delivered'].includes(o.status))
      .reduce((sum, o) => sum + Number(o.total_price), 0) || 0;
    
    // Get total users
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    // Get active promo codes
    const { count: activePromoCodes } = await supabase
      .from('promo_codes')
      .select('*', { count: 'exact', head: true })
      .eq('active', true);
    
    return {
      success: true,
      stats: {
        totalOrders: totalOrders || 0,
        totalRevenue,
        totalUsers: totalUsers || 0,
        activePromoCodes: activePromoCodes || 0
      }
    };
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return {
      success: false,
      stats: {
        totalOrders: 0,
        totalRevenue: 0,
        totalUsers: 0,
        activePromoCodes: 0
      }
    };
  }
}

// ==================== SETTINGS ====================

export async function fetchSettings() {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*');
    
    if (error) throw error;
    
    const settings: Record<string, string> = {};
    data?.forEach(setting => {
      settings[setting.key] = setting.value;
    });
    
    return { success: true, settings };
  } catch (error) {
    console.error('Error fetching settings:', error);
    return { success: false, settings: {} };
  }
}

export async function updateSetting(key: string, value: string) {
  try {
    const { error } = await supabase
      .from('settings')
      .upsert({ key, value });
    
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Error updating setting:', error);
    return { success: false, error: error.message };
  }
}