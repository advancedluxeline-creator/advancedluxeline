// ============================================================
// Crystal View — Main Website (Google Sheets Powered)
// Reads live data from Google Sheets via Apps Script.
// Falls back to localStorage cache when offline.
// ============================================================
import './style.css';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxJ44sxBzp_BqqVrJGu6zVkiQ0kPPUGR8cCuY8zdjkPfgDiISEAN6eSpQULBjNwE1nf/exec';

const CACHE = {
  rooms: 'cv_cache_rooms',
  events: 'cv_cache_events',
  hero: 'cv_cache_hero',
  settings: 'cv_cache_settings',
};

const DEFAULT_SETTINGS = {
  guest_house_name: 'ADVANCED LUXE LINE LTD',
  whatsapp_number: '25078893043',
  address: 'Kigali, Rwanda',
  email: 'advancedluxeline6@gmail.com',
};

// DOM
const roomsGrid      = document.getElementById('roomsGrid');
const eventsGrid     = document.getElementById('eventsGrid');
const heroContainer  = document.getElementById('heroContainer');
const footerContact  = document.getElementById('footerContact');
const bookingModal   = document.getElementById('bookingModal');
const closeBooking   = document.querySelector('.close-booking');
const openBookingBtn = document.getElementById('openBookingBtn');
const roomSelect     = document.getElementById('roomSelect');
const checkIn        = document.getElementById('checkIn');
const checkOut       = document.getElementById('checkOut');
const daysInput      = document.getElementById('days');

// ============================================================
// FETCH FROM GOOGLE SHEETS
// ============================================================
async function fetchTab(tab) {
  try {
    const res = await fetch(`${SCRIPT_URL}?action=read&tab=${tab}`);
    if (!res.ok) throw new Error('Network error');
    const data = await res.json();
    // Save to cache
    localStorage.setItem(CACHE[tab], JSON.stringify(data));
    return data;
  } catch (err) {
    // Return cached version if fetch fails
    const cached = localStorage.getItem(CACHE[tab]);
    return cached ? JSON.parse(cached) : [];
  }
}

async function fetchSettings() {
  try {
    const res = await fetch(`${SCRIPT_URL}?action=read&tab=settings`);
    if (!res.ok) throw new Error();
    const rows = await res.json();
    // Settings sheet has key/value columns
    const s = {};
    rows.forEach(row => { if (row.key) s[row.key] = row.value; });
    localStorage.setItem(CACHE.settings, JSON.stringify(s));
    return s;
  } catch (err) {
    const cached = localStorage.getItem(CACHE.settings);
    return cached ? JSON.parse(cached) : { ...DEFAULT_SETTINGS };
  }
}

// ============================================================
// CONVERT GOOGLE DRIVE SHARE LINK → DIRECT IMAGE URL
// ============================================================
function driveUrl(raw) {
  if (!raw) return '';
  // Already a direct URL or non-Drive URL
  if (!raw.includes('drive.google.com') && !raw.includes('docs.google.com')) return raw;
  // Extract file ID
  const match = raw.match(/[-\w]{25,}/);
  if (!match) return raw;
  return `https://lh3.googleusercontent.com/d/${match[0]}`;
}

// ============================================================
// HERO SLIDER
// ============================================================
async function initHero() {
  const slides = await fetchTab('hero');
  if (!slides || slides.length === 0) {
    heroContainer.innerHTML = `
      <div class="hero-slide active" style="background:linear-gradient(135deg,#1a1a1a,#0d0d0d);">
        <div class="hero-content">
          <h1>Welcome to ADVANCED LUXE LINE</h1>
          <p>Your premium escape awaits.</p>
          <div class="hero-btns"><a href="#rooms" class="btn">Explore Rooms</a></div>
        </div>
      </div>`;
    return;
  }
  heroContainer.innerHTML = slides.map((s, i) => `
    <div class="hero-slide ${i === 0 ? 'active' : ''}" style="background:linear-gradient(rgba(0,0,0,0.55),rgba(0,0,0,0.55)),url('${driveUrl(s.image)}') center/cover no-repeat;">
      <div class="hero-content">
        <h1>${s.title || ''}</h1>
        <p>${s.subtitle || ''}</p>
        <div class="hero-btns"><a href="#rooms" class="btn">Explore Rooms</a></div>
      </div>
    </div>`).join('');
  if (slides.length > 1) {
    let cur = 0;
    const els = heroContainer.querySelectorAll('.hero-slide');
    setInterval(() => {
      els[cur].classList.remove('active');
      cur = (cur + 1) % els.length;
      els[cur].classList.add('active');
    }, 5000);
  }
}

// ============================================================
// ROOMS
// ============================================================
async function initRooms() {
  roomsGrid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;opacity:0.4;"><p style="font-size:2rem;">⏳</p><p>Loading rooms...</p></div>`;
  const rooms = await fetchTab('rooms');
  if (!rooms || rooms.length === 0) {
    roomsGrid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:4rem;opacity:0.4;"><p style="font-size:3rem;">🛏️</p><p>No rooms added yet.</p></div>`;
    return;
  }
  roomsGrid.innerHTML = rooms.map(room => {
    // image_urls is a comma-separated list of Drive links
    const images = room.image_urls
      ? room.image_urls.split(',').map(u => driveUrl(u.trim())).filter(Boolean)
      : [];
    const mainImg = images[0] || '';
    const features = room.features
      ? room.features.split(',').map(f => f.trim()).filter(Boolean)
      : [];
    const rname = room.name || 'Luxury Room';

    return `
      <div class="room-card animate-reveal">
        <div class="room-gallery">
          ${mainImg
            ? `<img src="${mainImg}" alt="${rname}" class="room-img" id="rimg-${room.id}">`
            : `<div style="width:100%;height:220px;background:rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:center;font-size:4rem;border-radius:16px 16px 0 0;">🛏️</div>`}
          ${images.length > 1 ? `
            <div class="room-thumbnails">
              ${images.map((img, idx) => `<img src="${img}" class="room-thumb ${idx === 0 ? 'active' : ''}" onclick="window.switchRoomImg(this,'rimg-${room.id}')">`).join('')}
            </div>` : ''}
        </div>
        <div class="room-info">
          <h3>${rname}</h3>
          <p class="price">
            ${Number(room.price).toLocaleString()} RWF ${room.price_usd ? `/ $${room.price_usd}` : ''}
            <span style="font-size:0.8rem;opacity:0.6;">/ night</span>
          </p>
          ${room.description ? `<p style="opacity:0.7;font-size:0.9rem;margin-bottom:1.5rem;">${room.description}</p>` : ''}
          
          ${features.length > 0 ? `
            <div class="amenities-title"><span>✨</span> Included for Free</div>
            <ul class="features">${features.map(f => `<li>${f}</li>`).join('')}</ul>
          ` : ''}
          
          <button class="btn book-btn" data-room="${room.name}" style="width:100%; margin-top:0.5rem;">BOOK NOW</button>
        </div>
      </div>`;
  }).join('');
  roomsGrid.querySelectorAll('.book-btn').forEach(btn => {
    btn.onclick = () => {
      if (roomSelect) roomSelect.value = btn.dataset.room;
      bookingModal.classList.add('active');
    };
  });
  populateRoomSelect(rooms);
  setupObserver();
}

window.switchRoomImg = (thumb, targetId) => {
  const mainImg = document.getElementById(targetId);
  if (mainImg) mainImg.src = thumb.src;
  thumb.closest('.room-thumbnails').querySelectorAll('.room-thumb').forEach(t => t.classList.remove('active'));
  thumb.classList.add('active');
};

// ============================================================
// EVENTS
// ============================================================
async function initEvents() {
  eventsGrid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;opacity:0.4;"><p style="font-size:2rem;">⏳</p><p>Loading events...</p></div>`;
  const events = await fetchTab('events');
  if (!events || events.length === 0) {
    eventsGrid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:4rem;opacity:0.4;"><p style="font-size:3rem;">🎉</p><p>No events added yet.</p></div>`;
    return;
  }
  eventsGrid.innerHTML = events.map(ev => {
    const title = ev.title || '';
    const desc  = ev.description || '';
    const text  = (title + ' ' + desc).toLowerCase();
    
    let badge = '';
    if (text.includes('promo'))    badge = '<span class="promo-badge">PROMO</span>';
    else if (text.includes('discount')) badge = '<span class="promo-badge">OFFER</span>';
    else if (text.includes('live'))     badge = '<span class="promo-badge" style="background:#ff4d4d;color:#fff;">LIVE</span>';
    else if (text.includes('sauna') || text.includes('massage')) badge = '<span class="promo-badge" style="background:#4caf50;color:#fff;">SPA</span>';

    return `
      <div class="event-card animate-reveal">
        ${badge}
        ${ev.image
          ? `<img src="${driveUrl(ev.image)}" alt="${title}" style="width:100%;height:100%;object-fit:cover;">`
          : `<div style="width:100%;height:100%;background:rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:center;font-size:4rem;">✨</div>`}
        <div class="event-overlay">
          <span class="event-date">${ev.date || ''}</span>
          <h3 style="margin-bottom:0.5rem; color:#fff;">${title}</h3>
          <p style="opacity:0.6; font-size:0.85rem;">${desc}</p>
        </div>
      </div>`;
  }).join('');
  setupObserver();
}

// ============================================================
// FOOTER & SETTINGS
// ============================================================
async function initFooter() {
  const s = await fetchSettings();
  let name = s.guest_house_name || DEFAULT_SETTINGS.guest_house_name;
  
  // Force rebranding if the backend still has the old name
  if (name.toLowerCase().includes('crystal view') || name.toLowerCase().includes('advanced luxe line')) {
    name = 'ADVANCED LUXE LINE';
  }

  document.title = name;
  const siteName = document.getElementById('siteName');
  if (siteName) siteName.textContent = 'ADVANCED'; // Keep logo split
  const footerName = document.getElementById('footerName');
  if (footerName) footerName.textContent = 'ADVANCED';

  if (footerContact) {
    footerContact.innerHTML = `
      <h4>Find Us</h4>
      <div class="contact-card">
        <div class="contact-item">
          <div class="contact-icon">📍</div>
          <div class="contact-text">
            <strong>Location</strong>
            <span>${addr}</span>
          </div>
        </div>
        <div class="contact-item">
          <div class="contact-icon">📞</div>
          <div class="contact-text">
            <strong>Phone</strong>
            <a href="tel:+${wa}">${s.whatsapp_number || wa}</a>
          </div>
        </div>
        <div class="contact-item">
          <div class="contact-icon">✉️</div>
          <div class="contact-text">
            <strong>Email</strong>
            <a href="mailto:${s.email || DEFAULT_SETTINGS.email}">${s.email || DEFAULT_SETTINGS.email}</a>
          </div>
        </div>
        <div class="contact-item">
          <div class="contact-icon">💬</div>
          <div class="contact-text">
            <strong>WhatsApp</strong>
            <a href="https://wa.me/${wa}" target="_blank" class="wa-link">Chat with us live</a>
          </div>
        </div>
      </div>`;
  }

  const waForm = document.getElementById('whatsappForm');
  if (waForm) {
    waForm.onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(waForm);
      const checkin  = fd.get('checkIn');
      const checkout = fd.get('checkOut');
      const nights = checkin && checkout
        ? Math.max(1, Math.round((new Date(checkout) - new Date(checkin)) / 86400000))
        : parseInt(fd.get('days')) || 1;
      
      const guests = fd.get('guests') || '1';
      const roomOpt = roomSelect.options[roomSelect.selectedIndex];
      const priceRWF = parseInt(roomOpt.dataset.price) || 0;
      const priceUSD = parseInt(roomOpt.dataset.priceUsd) || 0;
      const totalRWF = priceRWF * nights;
      const totalUSD = priceUSD * nights;

      const msg = `🏨 *New Booking Request*
*Name:* ${fd.get('fullName')}
*Phone:* ${fd.get('phone')}
*Room:* ${fd.get('roomSelect')}
*Guests:* ${guests}
*Check-in:* ${checkin || '-'}
*Check-out:* ${checkout || '-'}
*Nights:* ${nights}
*Total Amount:* ${totalRWF.toLocaleString()} RWF ${totalUSD ? `/ $${totalUSD.toLocaleString()}` : ''}

*Requests:* ${fd.get('message') || 'None'}`;
      
      window.open(`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`, '_blank');
      bookingModal.classList.remove('active');
    };
  }
}

// ============================================================
// ROOM SELECT DROPDOWN
// ============================================================
function populateRoomSelect(rooms) {
  if (!roomSelect) return;
  roomSelect.innerHTML = '<option value="">-- Choose a Room --</option>';
  (rooms || []).forEach(room => {
    const opt = document.createElement('option');
    opt.value = room.name;
    opt.dataset.price = room.price;
    opt.dataset.priceUsd = room.price_usd || 0;
    opt.textContent = `${room.name} — ${Number(room.price).toLocaleString()} RWF ${room.price_usd ? `/ $${room.price_usd}` : ''} / night`;
    roomSelect.appendChild(opt);
  });
  if (!rooms || rooms.length === 0) {
    const opt = document.createElement('option');
    opt.value = 'General Inquiry';
    opt.textContent = 'General Inquiry';
    roomSelect.appendChild(opt);
  }
}

// ============================================================
// MODAL OPEN / CLOSE
// ============================================================
if (closeBooking)   closeBooking.onclick   = () => bookingModal.classList.remove('active');
if (bookingModal)   bookingModal.onclick   = (e) => { if (e.target === bookingModal) bookingModal.classList.remove('active'); };
if (openBookingBtn) openBookingBtn.onclick = () => bookingModal.classList.add('active');

if (checkIn && checkOut) {
  const calcDays = () => {
    if (checkIn.value && checkOut.value) {
      const diff = Math.round((new Date(checkOut.value) - new Date(checkIn.value)) / 86400000);
      if (daysInput) daysInput.value = diff > 0 ? diff : '';
    }
  };
  checkIn.addEventListener('change', calcDays);
  checkOut.addEventListener('change', calcDays);
}

// ============================================================
// ANIMATION OBSERVER
// ============================================================
function setupObserver() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.1 });
  document.querySelectorAll('.animate-reveal').forEach(el => observer.observe(el));
}

// ============================================================
// INIT — Load everything in parallel for speed
// ============================================================
Promise.all([initHero(), initRooms(), initEvents(), initFooter()]);
