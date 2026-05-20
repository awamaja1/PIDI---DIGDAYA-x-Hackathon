# Design System - Panduan Penggunaan dari Setup hingga Web Access

> Step-by-step guide untuk menggunakan design system Garuda Admin dari Docker hingga akses di browser

---

## 📋 Prerequisites (Pastikan Sudah Ada)

```bash
# 1. Docker & Docker Compose installed
docker --version       # Docker version 29.0.1+
docker-compose --version  # v2.40.3+

# 2. Garuda-Link project sudah di-clone/dibuka
cd "d:\Work\Project\PIDI - DIGDAYA x Hackathon"

# 3. File konfigurasi staging
ls docker-compose.staging.yml
ls .env.staging
```

---

## 🚀 Langkah 1: Start Docker Compose Staging Stack

### A. Buka Terminal dan Jalankan

```powershell
# Terminal 1: Start semua services (backend-api, ai-engine, besu)
docker-compose -f docker-compose.staging.yml up -d --build

# Output yang diharapkan:
# [+] Running 4/4
# ✔ Network pidi-digdayaxhackathon_garuda-staging  Created
# ✔ Container garuda-link-besu-staging             Started
# ✔ Container garuda-link-backend-api-staging      Started
# ✔ Container garuda-link-ai-engine-staging        Started
```

### B. Verify Services Healthy

```powershell
# Tunggu ~30-40 detik, lalu check status
Start-Sleep -Seconds 40
docker-compose -f docker-compose.staging.yml ps

# Output yang diharapkan:
# NAME                              STATUS
# garuda-link-backend-api-staging   Up 35 seconds (healthy) ✅
# garuda-link-ai-engine-staging     Up 34 seconds (health: starting)
# garuda-link-besu-staging          Up 36 seconds (health: starting)
```

**Penting:** Backend-API harus `healthy` sebelum akses dashboard.  
Containers lain bisa `health: starting` karena startup lebih panjang.

---

## 🌐 Langkah 2: Akses Dashboard di Browser

Backend-API server sudah berjalan di container. File static (HTML + CSS) di-serve dari container.

### A. Buka Browser

Pilih salah satu:
- **Chrome** (recommended)
- **Firefox**
- **Edge**
- **Safari**

### B. Masukkan URL

Ketik URL berikut di address bar:

```
http://localhost:3000/admin-governance.html
```

Atau bisa copy-paste:
```
localhost:3000/admin-governance.html
```

**File ini di-serve dari Docker container backend-api, bukan dari host local.**

### C. Expected Output (Dashboard Governance)

Anda akan melihat governance dashboard dengan:

```
┌─────────────────────────────────────────────────┐
│  🏛️ Garuda Admin - Governance Dashboard        │
│  Home / Governance / Release Management         │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐│
│  │ Total  │  │Approved│  │Pending │  │Rejected││
│  │  24    │  │  18    │  │  4     │  │  2     ││
│  └────────┘  └────────┘  └────────┘  └────────┘│
│                                                  │
│  [Search] [Filter] [+ New Release]              │
│                                                  │
│  ⚠️ 4 Releases Pending Review                    │
│                                                  │
│  ┌──────────────────┐  ┌──────────────────┐    │
│  │ Release v2.3.0   │  │ Release v2.2.5   │    │
│  │ [Pending Review] │  │ [✓ Approved]     │    │
│  │                  │  │                  │    │
│  │ Tokens: 1.5M     │  │ Tokens: 1.2M     │    │
│  │ Value: Rp 2.25B  │  │ Value: Rp 1.80B  │    │
│  │                  │  │                  │    │
│  │[✓Approve][✗Reject]│ │[View Details]    │    │
│  │                  │  │                  │    │
│  │Timeline:         │  │Timeline:         │    │
│  │✓ Submitted       │  │✓ Submitted       │    │
│  │⏱ Awaiting Vote   │  │✓ Governance Vote │    │
│  │                  │  │✓ Released        │    │
│  └──────────────────┘  └──────────────────┘    │
│                                                  │
│  [More cards below...]                           │
│                                                  │
└─────────────────────────────────────────────────┘
```

**Jika halaman tidak muncul:** See [Troubleshooting](#-langkah-7-troubleshooting) section.

---

## 🎨 Langkah 3: Interaksi dengan Dashboard

### A. Jelajahi Interface

1. **Summary Cards** (Atas)
   - Tampilkan 4 metrik utama
   - Total releases, Approved, Pending, Rejected
   - Warna-warna dari design system (gold, purple, green, red)

2. **Search & Filter** (Tengah atas)
   - Ketik keyword di search box
   - Klik Filter untuk advanced search
   - Klik "+ New Release" untuk create baru

3. **Alert Section** (Tengah)
   - Warning message untuk pending items
   - Warna warning orange (#F97316)

4. **Release Cards** (Bawah)
   - 2 kolom grid layout
   - Setiap card punya:
     - Release info (version, tokens, value)
     - Status badge (warna-coded)
     - Action buttons (Approve/Reject)
     - Timeline of status changes

### B. Test Interaksi

```
1. Hover over cards → Lihat shadow effect berubah
2. Klik "Approve" button → Warna berubah, cursor change
3. Klik "Reject" button → Red color, visual feedback
4. Resize browser → Lihat responsive layout berubah:
   - Desktop (1024px+): 2 kolom
   - Tablet (640-1024px): 2 kolom
   - Mobile (<640px): 1 kolom
```

---

## 🔍 Langkah 4: Inspect Design System Implementation

### A. Buka Developer Tools

**Di browser:**
```
Press: F12 (atau Ctrl+Shift+I)
```

### B. Tab Elements

1. Klik tab **Elements** atau **Inspector**
2. Hover over elemen di page
3. Lihat HTML structure:

```html
<div class="summary-card primary">
  <div class="summary-label">Total Releases</div>
  <div class="summary-value">24</div>
</div>

<!-- Lihat class name: summary-card, primary -->
```

### C. Tab Styles (CSS)

1. Pilih elemen (e.g., button)
2. Lihat CSS rules di panel kanan

```css
.btn-approve {
  background-color: var(--status-approved);
  /* yang mana = #059669 */
  color: white;
  padding: var(--space-sm) var(--space-lg);
  /* var(--space-sm) = 8px, var(--space-lg) = 24px */
}
```

3. Lihat computed values menggunakan design token variables

### D. Tab Console (Opsional)

```javascript
// Cek CSS variables yang tersedia
getComputedStyle(document.documentElement).getPropertyValue('--color-primary');
// Output: "#F59E0B"

getComputedStyle(document.documentElement).getPropertyValue('--space-lg');
// Output: "24px"
```

---

## 📁 Langkah 5: Memahami File Structure

Setelah akses dashboard, buka text editor dan lihat:

```
d:\Work\Project\PIDI - DIGDAYA x Hackathon\
├── design-system/
│   └── garuda-admin/
│       ├── MASTER.md              ← Global rules
│       └── pages/
│           └── governance.md      ← Page overrides
├── backend-api/
│   ├── public/
│   │   ├── css/
│   │   │   └── design-system-tokens.css  ← CSS implementation
│   │   └── admin-governance.html         ← Dashboard kita buka
│   └── [server files]
└── [project files]
```

**Buka file-file ini di text editor untuk lihat implementasi:**

1. **MASTER.md** → Definisi design tokens (colors, fonts, spacing)
2. **governance.md** → Governance-specific overrides
3. **design-system-tokens.css** → Implementasi CSS dari tokens
4. **admin-governance.html** → HTML yang menggunakan CSS tokens

---

## 🛠️ Langkah 6: Membuat Halaman Baru (Contoh Praktis)

Setelah memahami sistem, bikin halaman baru menggunakan template yang sama:

### A. Duplicate Template

```bash
# Di host machine, duplicate file
cp backend-api/public/admin-governance.html backend-api/public/admin-audit.html
```

### B. Edit File Baru

Buka `backend-api/public/admin-audit.html` di text editor:

1. Ubah title:
```html
<title>Garuda Admin - Audit Trail</title>
```

2. Ubah header h1:
```html
<h1>🔍 Garuda Admin - Audit Trail</h1>
```

3. Ubah breadcrumb:
```html
<nav class="breadcrumb">
  <a href="/admin">Home</a> / <span>Governance</span> / <span>Audit Trail</span>
</nav>
```

4. Ubah content cards sesuai kebutuhan

### C. Akses di Browser

Setelah save file, page otomatis di-serve dari Docker container:

```
http://localhost:3000/admin-audit.html
```

**TANPA perlu rebuild Docker**, karena folder `backend-api/public/` di-mount ke container!

---

## 📊 Langkah 7: Test Responsive Design

### A. Desktop View
```
Browser width: 1440px atau lebih
Expected: 2 kolom cards
```

### B. Tablet View
```
1. Di DevTools, tekan Ctrl+Shift+M (Toggle device toolbar)
2. Pilih "iPad" atau custom 800px
Expected: 2 kolom cards (masih besar)
```

### C. Mobile View
```
1. Pilih "iPhone 12" atau custom 390px
2. Expected: 1 kolom cards, full width
3. Scroll down untuk lihat seluruh content
```

---

## ✅ Langkah 8: Troubleshooting

### Problem: Page tidak muncul / 404 error

### ✅ DO's

```
✅ Selalu gunakan design system variables (var(--color-xxx))
✅ Lihat MASTER.md sebelum buat styling baru
✅ Gunakan pre-built component classes (.btn, .card, .badge)
✅ Test di multiple screen sizes (Desktop, Tablet, Mobile)
✅ Commit changes dengan pesan descriptive
```

### ❌ DON'Ts

```
❌ Jangan hardcode warna (e.g., #F59E0B), gunakan var(--color-primary)
❌ Jangan buat custom spacing, gunakan var(--space-xxx)
❌ Jangan lupa alt text untuk images (accessibility)
❌ Jangan ignore focus states (keyboard navigation)
❌ Jangan paste-paste tanpa understand design system
```

---

## 🚀 Quick Reference Commands

```bash
# Terminal 1: Start server
cd backend-api
npm run dev
# → Server listens on http://localhost:3000

# Terminal 2: Edit files
# Buka text editor, edit HTML/CSS
# Save file → Browser akan auto-reload (jika pakai live reload)
# Manual reload: Press F5

# View governance dashboard
# Browser: http://localhost:3000/admin-governance.html

# Create new page
# Copy admin-governance.html → admin-[page-name].html
# Edit sesuai kebutuhan
# View: http://localhost:3000/admin-[page-name].html

# Inspect CSS
# F12 → Elements tab → Hover over elemen → Lihat CSS rules

# Test responsive
# F12 → Ctrl+Shift+M → Pilih device → Resize browser
```

---

## 📚 Further Learning

Setelah memahami basic usage:

1. **Baca dokumentasi lengkap:**
   - `DESIGN-SYSTEM-INTEGRATION.md` → Architecture & patterns
   - `backend-api/DESIGN-SYSTEM-IMPLEMENTATION.md` → Implementation details

2. **Explore MASTER.md:**
   - Lihat semua design tokens yang tersedia
   - Pahami color palette logic
   - Understand spacing system

3. **Customize halaman:**
   - Buat component baru dengan design tokens
   - Override styles jika perlu (dengan hati-hati)
   - Test accessibility (keyboard nav, color contrast)

4. **Deploy:**
   - Integrated dengan staging environment (docker-compose)
   - Test di multiple browsers

---

## 📞 Summary Quick Access

| Kebutuhan | Command/URL |
|-----------|-------------|
| Start server | `cd backend-api && npm run dev` |
| Access dashboard | `http://localhost:3000/admin-governance.html` |
| View design rules | `design-system/garuda-admin/MASTER.md` |
| View CSS tokens | `backend-api/public/css/design-system-tokens.css` |
| Edit HTML | `backend-api/public/admin-governance.html` |
| Inspect in browser | `F12` → Elements tab |
| Test responsive | `F12` → Ctrl+Shift+M |
| Create new page | Copy `admin-governance.html` → Edit → Save |

---

**Status:** Ready to use immediately 🎉  
**Time to first view:** ~2 minutes (if Node already installed)  
**Time to understand:** ~30 minutes (read this guide + explore files)  
**Time to customize:** ~15 minutes per new page  

Sekarang, langsung ke step 1 dan mulai! 🚀
