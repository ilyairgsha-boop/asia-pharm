import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { email, password, name } = (await req.json()) as RegisterRequest;

    console.log('🔵 Registration request:', { email, name });

    // Validate input
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUser?.users?.some((u) => u.email === email);

    if (userExists) {
      throw new Error('User with this email already exists');
    }

    // Create user with admin API - automatically confirmed
    const { data: newUser, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // AUTO-CONFIRM EMAIL!
      user_metadata: {
        name: name || '',
      },
    });

    if (signUpError) {
      console.error('❌ SignUp error:', signUpError);
      throw signUpError;
    }

    if (!newUser?.user) {
      throw new Error('Failed to create user');
    }

    console.log('✅ User created:', newUser.user.id);

    // Create profile in database
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: newUser.user.id,
        email: newUser.user.email!,
        name: name || '',
        is_admin: false,
        is_wholesaler: false,
        loyalty_points: 0,
        total_spent: 0,
      });

    if (profileError) {
      console.error('⚠️ Profile creation error:', profileError);
      // Don't throw - user is already created
    } else {
      console.log('✅ Profile created');
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: newUser.user.id,
          email: newUser.user.email,
          email_confirmed: true,
        },
        message: 'Registration successful',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('❌ Registration error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Registration failed',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});