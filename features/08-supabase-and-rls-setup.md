# Feature 08: Supabase & RLS Setup

## Overview

All database tables, Row Level Security policies, triggers, and RPC functions needed to support the application. This is the foundational data layer — everything else depends on it.

## Tables

### `profiles`
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'pending' CHECK (role IN ('pending', 'user', 'manager', 'admin')),
  avatar_url TEXT
);
```

### `invite_links`
```sql
CREATE TABLE invite_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES profiles(id),
  label TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  use_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### `shift_types`
```sql
CREATE TABLE shift_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  is_bonus BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id)
);
```

### `default_schedules`
```sql
CREATE TABLE default_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  year INT NOT NULL,
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  day INT NOT NULL CHECK (day BETWEEN 1 AND 31),
  shift_type_id UUID REFERENCES shift_types(id),
  UNIQUE (user_id, year, month, day)
);
```

### `bonus_limits`
```sql
CREATE TABLE bonus_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_type_id UUID REFERENCES shift_types(id),
  year INT NOT NULL,
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  day INT NOT NULL CHECK (day BETWEEN 1 AND 31),
  max_slots INT NOT NULL DEFAULT 0,
  UNIQUE (shift_type_id, year, month, day)
);
```

### `shift_selections`
```sql
CREATE TABLE shift_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  year INT NOT NULL,
  month INT NOT NULL,
  day INT NOT NULL,
  shift_type_id UUID REFERENCES shift_types(id),
  is_bonus BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancellation_requested', 'cancelled')),
  requested_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, year, month, day)
);
```

### `cancellation_requests`
```sql
CREATE TABLE cancellation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_selection_id UUID REFERENCES shift_selections(id),
  requested_by UUID REFERENCES profiles(id),
  reviewed_by UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);
```

## Triggers

### Auto-admin on first user
```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM profiles) = 1 THEN
    NEW.role := 'admin';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profile_created
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

### Auto-create profile on auth signup
```sql
CREATE OR REPLACE FUNCTION handle_auth_user_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_auth_user_created();
```

## RLS Policies

### `profiles`
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- Users read own row
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
-- Admins read all
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
```

### `invite_links`
```sql
ALTER TABLE invite_links ENABLE ROW LEVEL SECURITY;
-- Anyone can read single row by id (for token validation)
CREATE POLICY "Anyone can validate invite token" ON invite_links FOR SELECT USING (true);
-- Admins/managers can insert
CREATE POLICY "Admins and managers can create invites" ON invite_links FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);
-- Creator or admin can update
CREATE POLICY "Creator or admin can update invites" ON invite_links FOR UPDATE USING (
  created_by = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
```

### `shift_types`
```sql
ALTER TABLE shift_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read shift types" ON shift_types FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage shift types" ON shift_types FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
```

### `default_schedules`
```sql
ALTER TABLE default_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own default schedules" ON default_schedules FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can manage all default schedules" ON default_schedules FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
```

### `bonus_limits`
```sql
ALTER TABLE bonus_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read bonus limits" ON bonus_limits FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage bonus limits" ON bonus_limits FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
```

### `shift_selections`
```sql
ALTER TABLE shift_selections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own shift selections" ON shift_selections FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Admins can manage all shift selections" ON shift_selections FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
```

### `cancellation_requests`
```sql
ALTER TABLE cancellation_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read/insert own cancellation requests" ON cancellation_requests FOR SELECT USING (requested_by = auth.uid());
CREATE POLICY "Users can create cancellation requests" ON cancellation_requests FOR INSERT WITH CHECK (requested_by = auth.uid());
CREATE POLICY "Managers and admins can read all cancellation requests" ON cancellation_requests FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('manager', 'admin'))
);
CREATE POLICY "Managers and admins can update cancellation requests" ON cancellation_requests FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('manager', 'admin'))
);
```

## RPC Functions (Optional but Recommended)

### Bonus shift selection with slot check
```sql
CREATE OR REPLACE FUNCTION select_bonus_shift(
  p_user_id UUID, p_year INT, p_month INT, p_day INT, p_shift_type_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_max_slots INT;
  v_current_count INT;
BEGIN
  SELECT max_slots INTO v_max_slots FROM bonus_limits
  WHERE shift_type_id = p_shift_type_id AND year = p_year AND month = p_month AND day = p_day;

  SELECT COUNT(*) INTO v_current_count FROM shift_selections
  WHERE shift_type_id = p_shift_type_id AND year = p_year AND month = p_month AND day = p_day
    AND is_bonus = true AND status = 'active';

  IF v_current_count >= v_max_slots THEN
    RETURN false;
  END IF;

  INSERT INTO shift_selections (user_id, year, month, day, shift_type_id, is_bonus, status)
  VALUES (p_user_id, p_year, p_month, p_day, p_shift_type_id, true, 'active')
  ON CONFLICT (user_id, year, month, day)
  DO UPDATE SET shift_type_id = p_shift_type_id, is_bonus = true, status = 'active', requested_at = now();

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Technical Notes

- All tables use UUID primary keys generated by PostgreSQL.
- `UNIQUE` constraints on `default_schedules` and `shift_selections` enable upsert via `ON CONFLICT`.
- The auto-admin trigger fires BEFORE INSERT so it can modify the `role` before the row is written.
- RLS policies use `auth.uid()` to identify the current user.
- The bonus shift RPC function uses `SECURITY DEFINER` to bypass RLS for the atomic check-and-insert.
