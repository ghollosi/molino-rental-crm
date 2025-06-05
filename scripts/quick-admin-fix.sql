-- Quick admin user creation/update for production
-- Run this in Supabase SQL Editor

-- First, check if admin user exists
DO $$
BEGIN
  -- Try to update existing admin user
  UPDATE "User" 
  SET 
    password = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- admin123
    "isActive" = true,
    role = 'ADMIN',
    "updatedAt" = NOW()
  WHERE email = 'admin@molino.com';
  
  -- If no rows updated, create new admin user
  IF NOT FOUND THEN
    INSERT INTO "User" (
      id,
      email,
      password,
      "firstName",
      "lastName",
      role,
      language,
      "isActive",
      "createdAt",
      "updatedAt"
    ) VALUES (
      'cuid_admin_' || gen_random_uuid()::text,
      'admin@molino.com',
      '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- admin123
      'Admin',
      'User',
      'ADMIN',
      'HU',
      true,
      NOW(),
      NOW()
    );
  END IF;
END $$;

-- Verify the admin user
SELECT id, email, role, "isActive", "firstName", "lastName" 
FROM "User" 
WHERE email = 'admin@molino.com';