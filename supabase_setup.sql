-- Next Generation Disaster Audio Monitoring System (DCON 2025)
-- Supabase Schema Initialization Script

-- 1. Create units table (Raspberry Pi devices)
CREATE TABLE IF NOT EXISTS public.units (
    id text PRIMARY KEY,
    battery integer NOT NULL DEFAULT 100,
    signal_strength text NOT NULL CHECK (signal_strength IN ('Strong', 'Medium', 'Weak')),
    status text NOT NULL CHECK (status IN ('online', 'offline')),
    threshold float NOT NULL DEFAULT 0.8,
    latitude float NOT NULL,
    longitude float NOT NULL,
    last_seen timestamp with time zone DEFAULT now()
);

-- Enable RLS for units table
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated users
DROP POLICY IF EXISTS "Allow read access for authenticated users on units" ON public.units;
CREATE POLICY "Allow read access for authenticated users on units" 
ON public.units FOR SELECT TO authenticated USING (true);

-- Allow all access for authenticated users (for demo/config purposes)
DROP POLICY IF EXISTS "Allow all access for authenticated users on units" ON public.units;
CREATE POLICY "Allow all access for authenticated users on units" 
ON public.units FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- 2. Create incidents table (Detection events)
CREATE TABLE IF NOT EXISTS public.incidents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id text NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('SOS', '崩落音', '叫び声', '破砕音', '環境音')),
    confidence float NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved')),
    audio_url text,
    latitude float NOT NULL,
    longitude float NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for incidents table
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated users
DROP POLICY IF EXISTS "Allow read access for authenticated users on incidents" ON public.incidents;
CREATE POLICY "Allow read access for authenticated users on incidents" 
ON public.incidents FOR SELECT TO authenticated USING (true);

-- Allow insert/update for authenticated users (for dashboard management/demo)
DROP POLICY IF EXISTS "Allow insert/update for authenticated users on incidents" ON public.incidents;
CREATE POLICY "Allow insert/update for authenticated users on incidents" 
ON public.incidents FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- 3. Insert mock units for testing/demo
INSERT INTO public.units (id, battery, signal_strength, status, threshold, latitude, longitude)
VALUES
    ('unit-kyoto-01', 85, 'Strong', 'online', 0.85, 35.0116, 135.7681),
    ('unit-kyoto-02', 42, 'Medium', 'online', 0.80, 35.0000, 135.7500),
    ('unit-osaka-01', 90, 'Strong', 'online', 0.90, 34.6937, 135.5023),
    ('unit-kobe-01', 15, 'Weak', 'offline', 0.75, 34.6901, 135.1955)
ON CONFLICT (id) DO NOTHING;

-- 4. Enable Realtime subscriptions for Map and Feed components
-- Supabase requires tables to be explicitly added to the realtime publication
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE public.units;
ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;
