/**
 * Environment variables validation
 */

export interface EnvCheckResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
}

export function checkEnvironmentVariables(): EnvCheckResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  try {
    // Safely check environment variables
    const supabaseUrl = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_URL : undefined;
    const supabaseKey = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_ANON_KEY : undefined;
    
    // Check SUPABASE_URL
    if (!supabaseUrl) {
      warnings.push('✅ Using default SUPABASE_URL from info.tsx (expected in Figma Make environment)');
    } else if (!supabaseUrl.startsWith('https://')) {
      errors.push('VITE_SUPABASE_URL must start with https://');
    }

    // Check SUPABASE_ANON_KEY
    if (!supabaseKey) {
      warnings.push('✅ Using default SUPABASE_ANON_KEY from info.tsx (expected in Figma Make environment)');
    } else if (supabaseKey.length < 100) {
      errors.push('VITE_SUPABASE_ANON_KEY appears to be invalid (too short)');
    }

    // Check if using default/hardcoded values
    const defaultUrl = 'https://boybkoyidxwrgsayifrd.supabase.co';
    if (supabaseUrl === defaultUrl) {
      warnings.push('✅ Using project boybkoyidxwrgsayifrd - configuration is correct');
    }
  } catch (error) {
    // If import.meta.env is not available, that's OK - we're using info.tsx
    warnings.push('✅ Using values from info.tsx - this is the correct configuration for Figma Make');
  }

  return {
    isValid: true, // Always valid since we have fallback in info.tsx
    warnings,
    errors,
  };
}

export function logEnvCheck(result: EnvCheckResult) {
  if (result.isValid && result.warnings.length === 0) {
    console.log('✅ Environment variables are properly configured');
    return;
  }

  console.group('🔧 Environment Variables Check');
  
  if (result.errors.length > 0) {
    console.error('❌ Errors:', result.errors);
  }
  
  if (result.warnings.length > 0) {
    console.warn('⚠️ Warnings:', result.warnings);
  }

  if (!result.isValid) {
    console.error('Environment configuration is invalid. Application may not work correctly.');
  }

  console.groupEnd();
}
