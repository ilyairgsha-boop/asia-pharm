// LocalStorage utilities for local development mode

export const LocalStorage = {
  // Orders
  getOrders: (): any[] => {
    try {
      return JSON.parse(localStorage.getItem('local_orders') || '[]');
    } catch {
      return [];
    }
  },

  saveOrder: (order: any) => {
    const orders = LocalStorage.getOrders();
    orders.push(order);
    localStorage.setItem('local_orders', JSON.stringify(orders));
  },

  updateOrder: (orderId: string, updates: Partial<any>) => {
    const orders = LocalStorage.getOrders();
    const index = orders.findIndex((o: any) => o.id === orderId);
    if (index !== -1) {
      orders[index] = { ...orders[index], ...updates };
      localStorage.setItem('local_orders', JSON.stringify(orders));
    }
  },

  getUserOrders: (userId: string): any[] => {
    return LocalStorage.getOrders().filter((o: any) => o.userId === userId);
  },

  // Promo Codes
  getPromoCodes: (): any[] => {
    try {
      return JSON.parse(localStorage.getItem('local_promo_codes') || '[]');
    } catch {
      return [];
    }
  },

  savePromoCode: (promoCode: any) => {
    const promoCodes = LocalStorage.getPromoCodes();
    promoCodes.push(promoCode);
    localStorage.setItem('local_promo_codes', JSON.stringify(promoCodes));
  },

  updatePromoCode: (id: string, updates: Partial<any>) => {
    const promoCodes = LocalStorage.getPromoCodes();
    const index = promoCodes.findIndex((p: any) => p.id === id);
    if (index !== -1) {
      promoCodes[index] = { ...promoCodes[index], ...updates };
      localStorage.setItem('local_promo_codes', JSON.stringify(promoCodes));
    }
  },

  deletePromoCode: (id: string) => {
    const promoCodes = LocalStorage.getPromoCodes().filter((p: any) => p.id !== id);
    localStorage.setItem('local_promo_codes', JSON.stringify(promoCodes));
  },

  validatePromoCode: (code: string): any | null => {
    const promoCodes = LocalStorage.getPromoCodes();
    const promoCode = promoCodes.find((p: any) => 
      p.code.toUpperCase() === code.toUpperCase() && p.active
    );

    if (!promoCode) return null;

    // Check expiry
    if (promoCode.expiryDate && new Date(promoCode.expiryDate) < new Date()) {
      return null;
    }

    // Check usage limit
    if (promoCode.usageLimit && promoCode.timesUsed >= promoCode.usageLimit) {
      return null;
    }

    return promoCode;
  },

  // Products (for admin to manage)
  getProducts: (): any[] => {
    try {
      return JSON.parse(localStorage.getItem('local_products') || '[]');
    } catch {
      return [];
    }
  },

  saveProduct: (product: any) => {
    const products = LocalStorage.getProducts();
    products.push(product);
    localStorage.setItem('local_products', JSON.stringify(products));
  },

  updateProduct: (id: string, updates: Partial<any>) => {
    const products = LocalStorage.getProducts();
    const index = products.findIndex((p: any) => p.id === id);
    if (index !== -1) {
      products[index] = { ...products[index], ...updates };
      localStorage.setItem('local_products', JSON.stringify(products));
    }
  },

  deleteProduct: (id: string) => {
    const products = LocalStorage.getProducts().filter((p: any) => p.id !== id);
    localStorage.setItem('local_products', JSON.stringify(products));
  },

  // Settings
  getSettings: (): Record<string, any> => {
    try {
      return JSON.parse(localStorage.getItem('local_settings') || '{}');
    } catch {
      return {};
    }
  },

  saveSetting: (key: string, value: any) => {
    const settings = LocalStorage.getSettings();
    settings[key] = value;
    localStorage.setItem('local_settings', JSON.stringify(settings));
  },

  // Analytics (mock data)
  getAnalytics: () => {
    const orders = LocalStorage.getOrders();
    const users = JSON.parse(localStorage.getItem('auth_users') || '[]');
    const promoCodes = LocalStorage.getPromoCodes();

    const totalRevenue = orders
      .filter((o: any) => ['paid', 'processing', 'shipped', 'delivered'].includes(o.status))
      .reduce((sum: number, o: any) => sum + (o.totalPrice || 0), 0);

    return {
      totalOrders: orders.length,
      totalRevenue,
      totalUsers: users.length,
      activePromoCodes: promoCodes.filter((p: any) => p.active).length,
    };
  },
};
