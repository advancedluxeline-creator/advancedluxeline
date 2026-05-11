// ============================================================
// Crystal View Admin Dashboard — Google Sheets Edition
// Data → Google Sheets via Apps Script
// Images → Google Drive (paste share link)
// ============================================================
import './style.css';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxJ44sxBzp_BqqVrJGu6zVkiQ0kPPUGR8cCuY8zdjkPfgDiISEAN6eSpQULBjNwE1nf/exec';

const DEFAULT_SETTINGS = {
  guest_house_name: 'ADVANCED LUXE LINE LTD',
  whatsapp_number: '25078893043',
  address: 'ADVANCED LUXE LINE LTD, NM 34 St, Musanze',
  admin_email: 'guesthouse@gmail.com',
  admin_password: 'guest123',
};

// ---- DOM ----
const loginSection    = document.getElementById('loginSection');
const adminDashboard  = document.getElementById('adminDashboard');
const loginForm       = document.getElementById('loginForm');
const logoutBtn       = document.getElementById('logoutBtn');
const listContainer   = document.getElementById('listContainer');
const addNewBtn       = document.getElementById('addNewBtn');
const formModal       = document.getElementById('formModal');
const closeModalBtn   = document.querySelector('.close-modal');
const dynamicForm     = document.getElementById('dynamicForm');
const formFields      = document.getElementById('formFields');
const modalTitle      = document.getElementById('modalTitle');
const currentTabName  = document.getElementById('currentTabName');
const saveBtn         = document.getElementById('saveBtn');

let currentTab = 'rooms';
let editId = null;
let cachedSettings = null;

// ============================================================
// GOOGLE DRIVE URL HELPER
// ============================================================
function driveUrl(raw) {
  if (!raw) return '';
  if (!raw.includes('drive.google.com') && !raw.includes('docs.google.com')) return raw;
  const match = raw.match(/[-\w]{25,}/);
  if (!match) return raw;
  return `https://lh3.googleusercontent.com/d/${match[0]}`;
}

// ============================================================
// FETCH / SAVE DATA VIA GOOGLE SHEETS
// ============================================================
async function fetchTab(tab) {
  const res = await fetch(`${SCRIPT_URL}?action=read&tab=${tab}`);
  if (!res.ok) throw new Error('Failed to read from Google Sheets');
  return res.json();
}

async function sendAction(action, tab, data) {
  const params = new URLSearchParams({
    action,
    tab,
    data: JSON.stringify(data),
  });
  const res = await fetch(`${SCRIPT_URL}?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to save to Google Sheets');
  return res.json();
}

async function deleteRow(tab, id) {
  const params = new URLSearchParams({ action: 'delete', tab, id });
  const res = await fetch(`${SCRIPT_URL}?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to delete');
  return res.json();
}

// ============================================================
// AUTH
// ============================================================
async function checkAuth() {
  if (localStorage.getItem('cv_admin_logged') === 'true') {
    showDashboard();
  } else {
    showLogin();
  }
}

function showLogin() {
  loginSection.style.display = 'flex';
  adminDashboard.style.display = 'none';
}

function showDashboard() {
  loginSection.style.display = 'none';
  adminDashboard.style.display = 'block';
  
  // Force admin logo name
  const adminLogo = adminDashboard.querySelector('.logo');
  if (adminLogo) {
    adminLogo.innerHTML = 'ADVANCED LUXE LINE <span style="font-weight: 300; opacity: 0.5; font-style: normal;">| Dashboard</span>';
  }

  loadSection(currentTab);
}

loginForm.onsubmit = async (e) => {
  e.preventDefault();
  const email    = document.getElementById('adminEmail').value.trim().toLowerCase();
  const password = document.getElementById('adminPassword').value;
  const btn      = loginForm.querySelector('button');
  btn.textContent = '🔄 Checking...';
  btn.disabled    = true;

  try {
    // Try to get password from Google Sheets settings
    const rows = await fetchTab('settings');
    const s = {};
    rows.forEach(r => { if (r.key) s[r.key] = r.value; });
    cachedSettings = s;
    const correctEmail    = (s.admin_email    || DEFAULT_SETTINGS.admin_email).toLowerCase();
    const correctPassword =  s.admin_password || DEFAULT_SETTINGS.admin_password;
    if (email === correctEmail && password === correctPassword) {
      localStorage.setItem('cv_admin_logged', 'true');
      showDashboard();
    } else {
      showLoginError('❌ Incorrect email or password.');
    }
  } catch {
    // Fallback to defaults if Google Sheets is unreachable
    if (email === DEFAULT_SETTINGS.admin_email.toLowerCase() && password === DEFAULT_SETTINGS.admin_password) {
      localStorage.setItem('cv_admin_logged', 'true');
      showDashboard();
    } else {
      showLoginError('❌ Could not connect. Try: ' + DEFAULT_SETTINGS.admin_email + ' / ' + DEFAULT_SETTINGS.admin_password);
    }
  } finally {
    btn.textContent = '🔑 Login';
    btn.disabled    = false;
  }
};

function showLoginError(msg) {
  let err = document.getElementById('loginError');
  if (!err) {
    err = document.createElement('p');
    err.id = 'loginError';
    err.style.cssText = 'color:#ff6b6b;margin-top:1rem;font-size:0.9rem;';
    loginForm.appendChild(err);
  }
  err.textContent = msg;
}

logoutBtn.onclick = () => {
  localStorage.removeItem('cv_admin_logged');
  location.reload();
};

// ============================================================
// SIDEBAR NAVIGATION
// ============================================================
document.querySelectorAll('.sidebar-btn').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentTab = btn.dataset.tab;
    currentTabName.textContent = 'Manage ' + currentTab.charAt(0).toUpperCase() + currentTab.slice(1);
    addNewBtn.style.display = currentTab === 'settings' ? 'none' : 'block';
    loadSection(currentTab);
  };
});

// ============================================================
// LOAD & RENDER SECTIONS
// ============================================================
async function loadSection(tab) {
  if (tab === 'settings') { renderSettings(); return; }

  listContainer.innerHTML = `<div style="text-align:center;padding:3rem;opacity:0.5;"><p style="font-size:2rem;">⏳</p><p>Loading from Google Sheets...</p></div>`;

  try {
    const data = await fetchTab(tab);
    if (data.length === 0) {
      listContainer.innerHTML = `
        <div style="text-align:center;padding:4rem;opacity:0.4;">
          <p style="font-size:3rem;">📭</p>
          <p style="margin-top:1rem;">No ${tab} yet. Click <strong>+ Add New</strong> to get started.</p>
        </div>`;
      return;
    }
    listContainer.innerHTML = data.map(item => `
      <div class="admin-card" style="display:flex;justify-content:space-between;align-items:center;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:1.5rem;margin-bottom:1rem;">
        <div style="display:flex;align-items:center;gap:1.5rem;">
          ${getItemThumb(item, tab)}
          <div>
            <h3 style="color:var(--accent);margin-bottom:0.3rem;">${item.name || item.title || 'Untitled'}</h3>
            <p style="opacity:0.5;font-size:0.9rem;">
              ${item.price ? Number(item.price).toLocaleString() + ' RWF' : ''} 
              ${item.price_usd ? ' / $' + item.price_usd : ''}
              ${item.price || item.price_usd ? ' / night' : (item.date || item.subtitle || '')}
            </p>
          </div>
        </div>
        <div style="display:flex;gap:0.75rem;">
          <button onclick="window.editItem('${item.id}')" style="padding:0.6rem 1.2rem;border-radius:10px;border:1px solid var(--accent);background:transparent;color:var(--accent);cursor:pointer;font-weight:600;">Edit</button>
          <button onclick="window.deleteItem('${item.id}')" style="padding:0.6rem 1.2rem;border-radius:10px;border:none;background:#ff4d4d22;color:#ff4d4d;cursor:pointer;font-weight:600;">Delete</button>
        </div>
      </div>`).join('');
  } catch (err) {
    listContainer.innerHTML = `
      <div style="text-align:center;padding:3rem;color:#ff6b6b;">
        <p style="font-size:2rem;">⚠️</p>
        <p style="margin-top:0.5rem;">Could not connect to Google Sheets.</p>
        <p style="opacity:0.5;font-size:0.85rem;margin-top:0.5rem;">Make sure your Apps Script is deployed with <strong>"Anyone"</strong> access.</p>
      </div>`;
  }
}

function getItemThumb(item, tab) {
  let rawSrc = '';
  if (tab === 'rooms'  && item.image_urls) rawSrc = item.image_urls.split(',')[0].trim();
  else if (tab === 'events' && item.image)  rawSrc = item.image;
  else if (tab === 'hero'   && item.image)  rawSrc = item.image;
  const src = driveUrl(rawSrc);
  if (!src) return `<div style="width:60px;height:60px;border-radius:10px;background:rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:center;font-size:1.5rem;">${tab==='rooms'?'🛏️':tab==='events'?'🎉':'🖼️'}</div>`;
  return `<img src="${src}" style="width:60px;height:60px;border-radius:10px;object-fit:cover;border:1px solid rgba(255,255,255,0.1);">`;
}

// ============================================================
// SETTINGS
// ============================================================
async function renderSettings() {
  listContainer.innerHTML = `<div style="text-align:center;padding:2rem;opacity:0.5;">⏳ Loading settings...</div>`;
  let s = { ...DEFAULT_SETTINGS };
  try {
    const rows = await fetchTab('settings');
    rows.forEach(r => { if (r.key) s[r.key] = r.value; });
  } catch { /* use defaults */ }

  // Force rebranded name if it's still default in settings
  if (s.guest_house_name && s.guest_house_name.toLowerCase().includes('crystal view')) {
    s.guest_house_name = 'ADVANCED LUXE LINE LTD';
  }

  listContainer.innerHTML = `
    <form id="settingsForm" style="max-width:600px;display:grid;gap:1.5rem;">
      <h3 style="color:var(--accent);">📍 Business Information</h3>
      <div class="form-group"><label>Guest House Name</label><input type="text" class="form-control" name="guest_house_name" value="${s.guest_house_name || ''}"></div>
      <div class="form-group"><label>WhatsApp Number (with country code)</label><input type="text" class="form-control" name="whatsapp_number" value="${s.whatsapp_number || ''}"></div>
      <div class="form-group"><label>Physical Address</label><input type="text" class="form-control" name="address" value="${s.address || ''}"></div>
      <div class="form-group"><label>Business Email Address</label><input type="email" class="form-control" name="email" value="${s.email || ''}"></div>

      <h3 style="color:var(--accent);margin-top:1rem;">🔐 Admin Login Credentials</h3>
      <div class="form-group"><label>Admin Email</label><input type="email" class="form-control" name="admin_email" value="${s.admin_email || DEFAULT_SETTINGS.admin_email}"></div>
      <div class="form-group"><label>Admin Password</label><input type="text" class="form-control" name="admin_password" value="${s.admin_password || DEFAULT_SETTINGS.admin_password}"></div>

      <button type="submit" class="btn-primary" style="margin-top:0.5rem;">💾 Save All Settings</button>
      <p id="settingsSaved" style="color:#4caf50;display:none;text-align:center;">✅ Settings saved to Google Sheets!</p>
      <p id="settingsError" style="color:#ff6b6b;display:none;text-align:center;"></p>
    </form>`;

  document.getElementById('settingsForm').onsubmit = async (e) => {
    e.preventDefault();
    const payload = {};
    new FormData(e.target).forEach((v, k) => payload[k] = v);
    const btn = e.target.querySelector('button');
    btn.textContent = '⏳ Saving...';
    btn.disabled = true;
    try {
      // Save each setting as a key/value row
      for (const [key, value] of Object.entries(payload)) {
        await sendAction('upsert', 'settings', { key, value });
      }
      document.getElementById('settingsSaved').style.display = 'block';
      setTimeout(() => { document.getElementById('settingsSaved').style.display = 'none'; }, 3000);
    } catch {
      document.getElementById('settingsError').textContent = '❌ Could not save. Check your Google Apps Script.';
      document.getElementById('settingsError').style.display = 'block';
    } finally {
      btn.textContent = '💾 Save All Settings';
      btn.disabled = false;
    }
  };
}

// ============================================================
// MODAL — Add / Edit
// ============================================================
addNewBtn.onclick   = () => openModal(null);
closeModalBtn.onclick = () => formModal.classList.remove('active');
formModal.onclick   = (e) => { if (e.target === formModal) formModal.classList.remove('active'); };

async function openModal(id) {
  editId = id;
  let item = null;
  if (id) {
    try {
      const data = await fetchTab(currentTab);
      item = data.find(i => String(i.id) === String(id)) || null;
    } catch { /* ignore */ }
  }
  modalTitle.textContent = id ? `Edit ${currentTab}` : `Add New ${currentTab}`;
  formFields.innerHTML = buildFormFields(item);
  formModal.classList.add('active');
}

function buildFormFields(item) {
  const driveHint = `
    <p style="font-size:0.78rem;opacity:0.5;margin-top:0.4rem;">
      📂 Upload your photo to <a href="https://drive.google.com" target="_blank" style="color:var(--accent);">Google Drive</a>, 
      right-click → Share → "Anyone with the link" → Copy link → Paste here.
    </p>`;

  if (currentTab === 'rooms') {
    const existingImgs = item?.image_urls ? item.image_urls.split(',').map(u => u.trim()).filter(Boolean) : [];
    return `
      <div class="form-group"><label>Room Name</label><input type="text" class="form-control" name="name" value="${item?.name || ''}" required placeholder="e.g. Deluxe Suite"></div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
        <div class="form-group"><label>Price (RWF)</label><input type="number" class="form-control" name="price" value="${item?.price || ''}" required placeholder="e.g. 35000"></div>
        <div class="form-group"><label>Price (USD $)</label><input type="number" class="form-control" name="price_usd" value="${item?.price_usd || ''}" required placeholder="e.g. 35"></div>
      </div>
      <div class="form-group"><label>Description</label><textarea class="form-control" name="description" rows="3" placeholder="Describe this room...">${item?.description || ''}</textarea></div>
      <div class="form-group">
        <label>Room Photos — Google Drive Links</label>
        <div id="imageLinksContainer">
          ${existingImgs.length > 0
            ? existingImgs.map(url => imageLinkRow(url)).join('')
            : imageLinkRow('')}
        </div>
        <button type="button" onclick="window.addImageLinkRow()" style="margin-top:0.5rem;padding:0.4rem 1rem;background:rgba(255,255,255,0.05);border:1px dashed rgba(255,255,255,0.2);border-radius:8px;color:var(--accent);cursor:pointer;font-size:0.85rem;">+ Add Another Photo</button>
        ${driveHint}
      </div>
      <div class="form-group"><label>Included Features (comma separated)</label><input type="text" class="form-control" name="features" value="${item?.features || ''}" placeholder="WiFi, TV, Hot Shower, Breakfast"></div>`;
  }
  if (currentTab === 'events') {
    return `
      <div class="form-group"><label>Event Title</label><input type="text" class="form-control" name="title" value="${item?.title || ''}" required placeholder="e.g. Wedding Package"></div>
      <div class="form-group"><label>Date / Info</label><input type="text" class="form-control" name="date" value="${item?.date || ''}" placeholder="e.g. Every Weekend"></div>
      <div class="form-group"><label>Description</label><textarea class="form-control" name="description" rows="3" placeholder="Describe this event...">${item?.description || ''}</textarea></div>
      <div class="form-group">
        <label>Event Photo — Google Drive Link</label>
        <input type="url" class="form-control image-link-input" name="image" value="${item?.image || ''}" placeholder="https://drive.google.com/file/d/...">
        <div id="imgPreview-event" style="margin-top:0.5rem;"></div>
        ${driveHint}
      </div>`;
  }
  if (currentTab === 'hero') {
    return `
      <div class="form-group"><label>Slide Title</label><input type="text" class="form-control" name="title" value="${item?.title || ''}" required placeholder="e.g. Your Luxury Escape"></div>
      <div class="form-group"><label>Subtitle</label><input type="text" class="form-control" name="subtitle" value="${item?.subtitle || ''}" placeholder="e.g. Book your stay today"></div>
      <div class="form-group">
        <label>Background Image — Google Drive Link</label>
        <input type="url" class="form-control image-link-input" name="image" value="${item?.image || ''}" placeholder="https://drive.google.com/file/d/...">
        <div id="imgPreview-hero" style="margin-top:0.5rem;"></div>
        ${driveHint}
      </div>`;
  }
  return '';
}

function imageLinkRow(value) {
  return `<div style="display:flex;gap:0.5rem;margin-bottom:0.5rem;align-items:center;">
    <input type="url" class="form-control image-link-input" name="image_url_item" value="${value}" placeholder="https://drive.google.com/file/d/..." style="flex:1;">
    <button type="button" onclick="this.parentElement.remove()" style="padding:0.4rem 0.8rem;background:#ff4d4d22;color:#ff4d4d;border:none;border-radius:8px;cursor:pointer;">✕</button>
  </div>`;
}

window.addImageLinkRow = () => {
  document.getElementById('imageLinksContainer').insertAdjacentHTML('beforeend', imageLinkRow(''));
};

// Live image preview for single-image fields
document.addEventListener('input', (e) => {
  if (!e.target.classList.contains('image-link-input') || e.target.name === 'image_url_item') return;
  const tab = currentTab === 'events' ? 'event' : 'hero';
  const preview = document.getElementById(`imgPreview-${tab}`);
  if (!preview) return;
  const url = driveUrl(e.target.value.trim());
  preview.innerHTML = url
    ? `<img src="${url}" style="width:100%;max-height:160px;object-fit:cover;border-radius:10px;border:1px solid rgba(255,255,255,0.1);">`
    : '';
});

// ============================================================
// SAVE (add / update)
// ============================================================
dynamicForm.onsubmit = async (e) => {
  e.preventDefault();
  const fd = new FormData(dynamicForm);
  const item = { id: editId || Date.now().toString() };
  fd.forEach((v, k) => { if (k !== 'image_url_item') item[k] = v; });

  // Collect multiple image links for rooms
  if (currentTab === 'rooms') {
    const links = Array.from(document.querySelectorAll('[name="image_url_item"]'))
      .map(inp => inp.value.trim())
      .filter(Boolean);
    item.image_urls = links.join(',');
  }

  if (saveBtn) { saveBtn.textContent = '⏳ Saving...'; saveBtn.disabled = true; }

  try {
    const action = editId ? 'update' : 'add';
    await sendAction(action, currentTab, item);
    formModal.classList.remove('active');
    showToast('✅ Saved to Google Sheets!');
    loadSection(currentTab);
  } catch (err) {
    showToast('❌ Save failed: ' + err.message);
  } finally {
    if (saveBtn) { saveBtn.textContent = 'Save Changes'; saveBtn.disabled = false; }
  }
};

// ============================================================
// DELETE & EDIT
// ============================================================
window.editItem = (id) => openModal(id);
window.deleteItem = async (id) => {
  if (!confirm('Are you sure you want to delete this item?')) return;
  try {
    await deleteRow(currentTab, id);
    showToast('🗑️ Item deleted.');
    loadSection(currentTab);
  } catch {
    showToast('❌ Delete failed. Check your Apps Script.');
  }
};

// ============================================================
// TOAST
// ============================================================
function showToast(msg) {
  let toast = document.getElementById('adminToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'adminToast';
    toast.style.cssText = 'position:fixed;bottom:2rem;right:2rem;background:var(--accent);color:#000;padding:1rem 2rem;border-radius:12px;font-weight:700;z-index:9999;transition:opacity 0.4s;';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  setTimeout(() => { toast.style.opacity = '0'; }, 3000);
}

// ============================================================
// START
// ============================================================
checkAuth();
