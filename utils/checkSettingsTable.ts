/**
 * Utility to check and create settings table if needed
 */

import { supabase } from './supabase/client';

export async function checkAndCreateSettingsTable() {
  console.log('🔍 [SETTINGS] Checking settings table...');
  
  try {
    // Try to query the table
    const { data, error } = await supabase
      .from('settings')
      .select('key')
      .limit(1);
    
    if (error) {
      console.error('❌ [SETTINGS] Error accessing settings table:', error.message);
      console.error('❌ [SETTINGS] Error code:', error.code);
      
      // Check if it's a "relation does not exist" error
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.warn('⚠️ [SETTINGS] Table "settings" does not exist!');
        console.warn('⚠️ [SETTINGS] Please create it in Supabase SQL Editor:');
        console.warn(`
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
GRANT ALL ON settings TO authenticated;
GRANT ALL ON settings TO anon;

-- Insert default OneSignal settings
INSERT INTO settings (key, value) VALUES (
  'oneSignal',
  '{"enabled":false,"appId":"","restApiKey":"","autoSubscribe":false,"welcomeNotification":true,"orderNotifications":true,"marketingNotifications":false}'::jsonb
) ON CONFLICT (key) DO NOTHING;
        `);
        return false;
      }
      
      // Check if it's RLS error
      if (error.code === '42501' || error.message.includes('permission denied')) {
        console.error('❌ [SETTINGS] RLS is blocking access!');
        console.error('❌ [SETTINGS] Run: ALTER TABLE settings DISABLE ROW LEVEL SECURITY;');
        return false;
      }
      
      return false;
    }
    
    console.log('✅ [SETTINGS] Table exists and is accessible');
    
    // Check if OneSignal settings exist
    const { data: oneSignalData, error: oneSignalError } = await supabase
      .from('settings')
      .select('key')
      .eq('key', 'oneSignal')
      .maybeSingle();
    
    if (oneSignalError) {
      console.warn('⚠️ [SETTINGS] Error checking OneSignal settings:', oneSignalError.message);
    } else if (!oneSignalData) {
      console.warn('⚠️ [SETTINGS] OneSignal settings not found in database');
      console.warn('💡 [SETTINGS] Please configure in Admin Panel or run SQL:');
      console.warn(`INSERT INTO settings (key, value) VALUES ('oneSignal', '{"enabled":false,"appId":"","restApiKey":""}'::jsonb);`);
    } else {
      console.log('✅ [SETTINGS] OneSignal settings exist in database');
    }
    
    return true;
  } catch (error: any) {
    console.error('❌ [SETTINGS] Failed to check table:', error?.message);
    return false;
  }
}

export async function checkOneSignalSettings() {
  console.log('🔍 [ONESIGNAL] Checking OneSignal settings in database...');
  
  try {
    // Use maybeSingle() instead of single() to avoid 406 error
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'oneSignal')
      .maybeSingle();
    
    if (error) {
      console.error('❌ [ONESIGNAL] Database error:', error.message);
      console.error('❌ [ONESIGNAL] Error code:', error.code);
      console.error('❌ [ONESIGNAL] Error details:', error.details);
      return null;
    }
    
    if (!data) {
      console.warn('⚠️ [ONESIGNAL] No OneSignal settings found in database');
      console.warn('💡 [ONESIGNAL] Please configure in Admin Panel -> OneSignal Settings');
      console.warn('💡 [ONESIGNAL] Or run: INSERT INTO settings (key, value) VALUES (\'oneSignal\', \'{"enabled":false}\'::jsonb);');
      return null;
    }
    
    if (data.value) {
      console.log('✅ [ONESIGNAL] Settings found in database');
      const settings = data.value as any;
      console.log('📋 [ONESIGNAL] Settings preview:', {
        enabled: settings?.enabled,
        hasAppId: !!settings?.appId,
        hasRestApiKey: !!settings?.restApiKey,
        appIdPreview: settings?.appId?.substring(0, 20) + '...' || 'not set'
      });
      return settings;
    }
    
    console.warn('⚠️ [ONESIGNAL] Settings record exists but value is empty');
    return null;
  } catch (error: any) {
    console.error('❌ [ONESIGNAL] Failed to check settings:', error?.message);
    console.error('❌ [ONESIGNAL] Stack:', error?.stack);
    return null;
  }
}
