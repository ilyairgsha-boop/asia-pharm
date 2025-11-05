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
        `);
        return false;
      }
      
      return false;
    }
    
    console.log('✅ [SETTINGS] Table exists and is accessible');
    return true;
  } catch (error: any) {
    console.error('❌ [SETTINGS] Failed to check table:', error?.message);
    return false;
  }
}

export async function checkOneSignalSettings() {
  console.log('🔍 [ONESIGNAL] Checking OneSignal settings in database...');
  
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'oneSignal')
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.warn('⚠️ [ONESIGNAL] No OneSignal settings found in database');
        console.warn('⚠️ [ONESIGNAL] Please configure in Admin Panel -> OneSignal Settings');
        return null;
      }
      
      console.error('❌ [ONESIGNAL] Error:', error.message);
      return null;
    }
    
    if (data && data.value) {
      console.log('✅ [ONESIGNAL] Settings found in database');
      const settings = data.value as any;
      console.log('📋 [ONESIGNAL] Settings preview:', {
        enabled: settings?.enabled,
        hasAppId: !!settings?.appId,
        hasRestApiKey: !!settings?.restApiKey,
      });
      return settings;
    }
    
    console.warn('⚠️ [ONESIGNAL] Settings record exists but value is empty');
    return null;
  } catch (error: any) {
    console.error('❌ [ONESIGNAL] Failed to check settings:', error?.message);
    return null;
  }
}
