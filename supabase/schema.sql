-- Rooms Table
CREATE TABLE rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  description TEXT,
  image_urls TEXT[], -- Array of image URLs
  features TEXT[] -- Array of features
);

-- Events Table
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  description TEXT,
  image_url TEXT
);

-- Hero Slides Table
CREATE TABLE hero_slides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  image_url TEXT NOT NULL,
  title TEXT,
  subtitle TEXT
);

-- Settings Table
CREATE TABLE settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL
);

-- Insert Default Settings
INSERT INTO settings (key, value) VALUES 
('whatsapp_number', '250780000000'),
('contact_email', 'info@crystalview.com'),
('address', 'Kigali, Rwanda'),
('guest_house_name', 'Crystal View Guest House');

-- Row Level Security (RLS)
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Allow Public Read
CREATE POLICY "Public Read Rooms" ON rooms FOR SELECT USING (true);
CREATE POLICY "Public Read Events" ON events FOR SELECT USING (true);
CREATE POLICY "Public Read Slides" ON hero_slides FOR SELECT USING (true);
CREATE POLICY "Public Read Settings" ON settings FOR SELECT USING (true);

-- Allow Authenticated (Admin) to modify everything
CREATE POLICY "Admin All Rooms" ON rooms FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin All Events" ON events FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin All Slides" ON hero_slides FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin All Settings" ON settings FOR ALL USING (auth.role() = 'authenticated');
