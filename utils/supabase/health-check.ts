import { createClient } from './client';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    connection: boolean;
    database: boolean;
    tables: {
      products: boolean;
      orders: boolean;
      profiles: boolean;
      promo_codes: boolean;
    };
  };
  errors: string[];
  timestamp: string;
}

export async function performHealthCheck(): Promise<HealthCheckResult> {
  const supabase = createClient();
  const errors: string[] = [];
  const checks = {
    connection: false,
    database: false,
    tables: {
      products: false,
      orders: false,
      profiles: false,
      promo_codes: false,
    },
  };

  try {
    // Check 1: Basic connection test
    const { error: connError } = await supabase.from('products').select('id').limit(1);
    checks.connection = !connError;
    
    if (connError) {
      errors.push(`Connection error: ${connError.message}`);
    } else {
      checks.database = true;
    }

    // Check 2: Test each table
    const tables = ['products', 'orders', 'profiles', 'promo_codes'] as const;
    
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('id').limit(1);
        checks.tables[table] = !error;
        
        if (error) {
          errors.push(`Table ${table}: ${error.message}`);
        }
      } catch (err: any) {
        checks.tables[table] = false;
        errors.push(`Table ${table}: ${err.message || 'Unknown error'}`);
      }
    }
  } catch (err: any) {
    errors.push(`Health check failed: ${err.message || 'Unknown error'}`);
  }

  // Determine overall status
  let status: 'healthy' | 'degraded' | 'unhealthy';
  
  if (errors.length === 0 && checks.connection && checks.database) {
    status = 'healthy';
  } else if (checks.connection) {
    status = 'degraded';
  } else {
    status = 'unhealthy';
  }

  return {
    status,
    checks,
    errors,
    timestamp: new Date().toISOString(),
  };
}

export function logHealthCheckResults(results: HealthCheckResult) {
  const emoji = {
    healthy: '✅',
    degraded: '⚠️',
    unhealthy: '❌',
  };

  console.group(`${emoji[results.status]} Supabase Health Check - ${results.status.toUpperCase()}`);
  console.log('Timestamp:', results.timestamp);
  console.log('Connection:', results.checks.connection ? '✅' : '❌');
  console.log('Database:', results.checks.database ? '✅' : '❌');
  console.log('Tables:');
  Object.entries(results.checks.tables).forEach(([table, healthy]) => {
    console.log(`  - ${table}:`, healthy ? '✅' : '❌');
  });
  
  if (results.errors.length > 0) {
    console.error('Errors:', results.errors);
  }
  
  console.groupEnd();
}
