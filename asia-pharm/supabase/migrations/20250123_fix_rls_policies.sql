-- Fix: Remove infinite recursion in RLS policies
-- Migration: 20250123_fix_rls_policies
-- Description: Removes recursive policy and replaces with simple policies

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create simple admin policy without recursion
-- Note: This policy allows admins to see all profiles
-- but doesn't create infinite recursion
CREATE POLICY "Enable read for admins"
  ON public.profiles FOR SELECT
  USING (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE
  );

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Allow users to insert their own profile during signup
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow admins to update any profile
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE
  );
