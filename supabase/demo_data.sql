-- Demo Data for Crystal View Guest House

-- Hero Slides
INSERT INTO hero_slides (image_url, title, subtitle) VALUES
('https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1920&q=80', 'Experience Pure Luxury', 'The most exclusive guest house in Kigali'),
('https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1920&q=80', 'Your Home Away From Home', 'Comfort and serenity at every corner'),
('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1920&q=80', 'Perfect for Every Occasion', 'From weddings to corporate events');

-- Rooms
INSERT INTO rooms (name, price, description, image_urls, features) VALUES
('Deluxe Panorama Room', 35000, 'A spacious room with a breathtaking 360-degree view of the city skyline.', ARRAY['https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'], ARRAY['King Size Bed', 'Panoramic Window', 'Smart TV', 'Luxury Bath']),
('Executive Garden Suite', 45000, 'Direct access to our private gardens, perfect for a peaceful retreat.', ARRAY['https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=800&q=80'], ARRAY['Garden Access', 'Mini Bar', 'Breakfast Included', 'Private Patio']),
('Standard Comfort Room', 20000, 'All the essentials for a comfortable stay at an affordable price.', ARRAY['https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80'], ARRAY['Free WiFi', 'Work Desk', 'En-suite Shower']);

-- Events
INSERT INTO events (title, date, description, image_url) VALUES
('Wedding Package 2026', 'All Season', 'Special discounts for full guest house bookings during wedding weekends.', 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80'),
('Sunday Brunch Buffet', 'Every Sunday', 'Join us for a delicious local and international buffet every Sunday morning.', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80');

-- Update Settings with Demo Info
UPDATE settings SET value = '123 Luxury Road, Kigali, Rwanda' WHERE key = 'address';
UPDATE settings SET value = '+250 780 123 456' WHERE key = 'whatsapp_number';
UPDATE settings SET value = 'Crystal View Boutique Hotel' WHERE key = 'guest_house_name';
