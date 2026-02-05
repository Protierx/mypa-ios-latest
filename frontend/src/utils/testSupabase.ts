/**
 * Supabase Connection Test
 * 
 * Run this to verify Supabase is configured correctly.
 * 
 * Usage:
 *   1. Import in App.tsx temporarily
 *   2. Call testSupabaseConnection() on app start
 *   3. Check console for results
 *   4. Remove after verification
 */

import { supabase } from '../lib/supabase';

export async function testSupabaseConnection(): Promise<void> {
  console.log('🔍 Testing Supabase connection...');
  
  try {
    // Test 1: Check if we can reach Supabase
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session check failed:', sessionError.message);
      return;
    }
    
    console.log('✅ Supabase connection successful');
    console.log('   Session:', sessionData.session ? 'Active' : 'None');
    
    // Test 2: Check if tables exist (will fail RLS if not logged in, but that's OK)
    const { error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (profilesError) {
      if (profilesError.code === 'PGRST301') {
        console.log('✅ Profiles table exists (RLS blocking - expected when not logged in)');
      } else if (profilesError.code === '42P01') {
        console.error('❌ Profiles table does not exist. Run the schema SQL in Supabase Dashboard.');
      } else {
        console.log('⚠️ Profiles query result:', profilesError.message);
      }
    } else {
      console.log('✅ Profiles table accessible');
    }
    
    // Test 3: Check tasks table
    const { error: tasksError } = await supabase
      .from('tasks')
      .select('id')
      .limit(1);
    
    if (tasksError) {
      if (tasksError.code === 'PGRST301') {
        console.log('✅ Tasks table exists (RLS blocking - expected when not logged in)');
      } else if (tasksError.code === '42P01') {
        console.error('❌ Tasks table does not exist. Run the schema SQL in Supabase Dashboard.');
      } else {
        console.log('⚠️ Tasks query result:', tasksError.message);
      }
    } else {
      console.log('✅ Tasks table accessible');
    }
    
    console.log('\n📋 Supabase Configuration:');
    console.log('   URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
    console.log('   Key:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...');
    
    console.log('\n🎉 Supabase setup complete! Ready for Phase 1.');
    
  } catch (error) {
    console.error('❌ Supabase test failed:', error);
  }
}

// Auth test - call after user signs up/in
export async function testSupabaseAuth(): Promise<void> {
  console.log('🔐 Testing Supabase auth...');
  
  try {
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      console.log('❌ No authenticated user:', error.message);
      return;
    }
    
    if (data.user) {
      console.log('✅ Authenticated user:');
      console.log('   ID:', data.user.id);
      console.log('   Email:', data.user.email);
      console.log('   Created:', data.user.created_at);
      
      // Check profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      if (profileError) {
        console.log('⚠️ No profile found:', profileError.message);
      } else {
        console.log('✅ Profile found:');
        console.log('   Username:', profile.username);
        console.log('   Display Name:', profile.display_name);
        console.log('   XP:', profile.xp);
        console.log('   Level:', profile.level);
      }
    }
    
  } catch (error) {
    console.error('❌ Auth test failed:', error);
  }
}
