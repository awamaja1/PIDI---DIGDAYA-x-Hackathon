# Backend-API Design System Integration

> Documentation of how Garuda-Link Design System is implemented in the backend-api project  
> Last Updated: 2026-05-20

---

## Overview

Backend-API implements the Garuda-Link Design System for its **Admin Dashboard** UI. The design system provides:

- **Unified visual identity** across all admin interfaces
- **CSS custom properties** (variables) for colors, typography, spacing
- **Responsive design** for mobile, tablet, and desktop
- **Accessibility** support (high contrast, reduced motion)
- **Component patterns** (buttons, cards, tables, forms, badges, alerts)

---

## File Structure

```
backend-api/
├── public/
│   ├── css/
│   │   └── design-system-tokens.css     # Design system variables + component styles
│   ├── admin-governance.html            # Example: Governance dashboard
│   └── [other HTML files]
├── src/
│   ├── api/
│   │   └── routes/
│   │       └── admin.js                 # Admin API endpoints (future)
│   └── [server code]
└── package.json

design-system/
├── garuda-admin/
│   ├── MASTER.md                        # Global design rules
│   └── pages/
│       └── governance.md                # Page-specific overrides
└── exampleproject/
    ├── MASTER.md
    └── pages/
```

---

## Design System Files

### 1. Global Design Rules
**Location:** `design-system/garuda-admin/MASTER.md`

Defines all design tokens:
- **Colors:** Primary, secondary, accent, background, surface, text, status colors
- **Typography:** Font families (Fira Code, Fira Sans), sizes, weights
- **Spacing:** System tokens (xs, sm, md, lg, xl, 2xl)
- **Borders & Shadows:** Radius values, shadow elevations
- **Component Rules:** Buttons, cards, tables, forms, badges

**When to use:** Building any admin UI component from scratch

### 2. Page-Specific Overrides
**Location:** `design-system/garuda-admin/pages/governance.md`

Governance dashboard-specific deviations:
- **Color overrides:** Status colors (approved, pending, rejected, released)
- **Typography changes:** Compact table font sizes, bold headers
- **Spacing:** Reduced padding for dashboard density
- **Component variants:** Approval button (green), rejection button (red)

**When to use:** Building governance-specific pages or components

---

## CSS Implementation

### File: `backend-api/public/css/design-system-tokens.css`

This CSS file implements the design system and includes:

#### 1. **Root Variables (CSS Custom Properties)**
```css
:root {
  /* Colors */
  --color-primary: #F59E0B;
  --color-accent: #8B5CF6;
  --color-background: #0F172A;
  --color-surface: #1E293B;
  --color-text: #F8FAFC;
  
  /* Status colors (governance) */
  --status-approved: #059669;
  --status-pending: #D97706;
  --status-rejected: #DC2626;
  
  /* Typography */
  --font-heading: "Fira Code", monospace;
  --font-body: "Fira Sans", sans-serif;
  --font-size-md: 16px;
  --font-size-lg: 20px;
  
  /* Spacing */
  --space-md: 16px;
  --space-lg: 24px;
  
  /* Effects */
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.3);
  --radius-md: 8px;
  
  /* Transitions */
  --transition-default: 300ms ease-in-out;
}
```

**Usage in HTML/CSS:**
```css
.card {
  background-color: var(--color-surface);
  padding: var(--space-lg);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}
```

#### 2. **Component Styles**
Pre-built CSS classes for common UI patterns:
- `.btn`, `.btn-primary`, `.btn-approve`, `.btn-reject`
- `.card`, `.card-header`, `.card-body`, `.card-footer`
- `.badge`, `.badge-success`, `.badge-warning`, `.status-approved`
- `.alert`, `.alert-success`, `.alert-warning`
- `table`, `thead`, `tbody` (data tables)
- Form inputs, labels, focus states

#### 3. **Utility Classes**
Helper classes for quick styling:
- `.container`, `.flex`, `.flex-between`, `.flex-center`
- `.gap-md`, `.gap-lg`
- `.mt-md`, `.mb-md`, `.p-md`, `.p-lg`
- `.text-center`, `.text-muted`, `.text-primary`
- `.grid`, `.grid-2-col`, `.grid-3-col`

#### 4. **Responsive Design**
Media query breakpoints:
- **Mobile:** < 640px
- **Tablet:** 641px - 1023px
- **Desktop:** ≥ 1024px

#### 5. **Accessibility**
Support for user preferences:
- High contrast mode (`prefers-contrast: more`)
- Reduced motion (`prefers-reduced-motion: reduce`)

---

## HTML Example: Governance Dashboard

**File:** `backend-api/public/admin-governance.html`

This is a **fully functional example** showing how to use design system tokens and components:

### Structure

1. **Header:** Brand name, page title, breadcrumb navigation
2. **Summary Cards:** Key metrics (Total, Approved, Pending, Rejected)
3. **Controls:** Search, filter, action buttons
4. **Alert:** Warning message for pending reviews
5. **Release Grid:** 2-column grid of release cards
6. **Release Cards:** Individual release info with status, actions, timeline

### Key Features

#### Status Indicators
```html
<span class="badge status-approved">Approved</span>
<span class="badge status-pending">Pending Review</span>
<span class="badge status-rejected">Rejected</span>
```

#### Action Buttons
```html
<button class="btn btn-approve">✓ Approve</button>
<button class="btn btn-reject">✗ Reject</button>
<button class="btn btn-secondary">Cancel</button>
```

#### Timeline/Progress
```html
<div class="timeline-item">
  <div class="timeline-marker approved">✓</div>
  <div class="timeline-content">
    <strong>Governance Approved</strong>
    <small>May 18, 2026 at 16:45 UTC</small>
  </div>
</div>
```

#### Data Table
```html
<table class="governance-table">
  <thead>
    <tr>
      <th>Column 1</th>
      <th>Column 2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Data</td>
      <td>Data</td>
    </tr>
  </tbody>
</table>
```

---

## How to Use Design System in New Pages

### Step 1: Create HTML File

```html
<!-- backend-api/public/admin-[page-name].html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Garuda Admin - [Page Name]</title>
  
  <!-- Import design system CSS -->
  <link rel="stylesheet" href="/css/design-system-tokens.css">
  
  <!-- Page-specific styles (optional) -->
  <style>
    /* Use design system variables */
    .custom-section {
      background-color: var(--color-surface);
      padding: var(--space-lg);
      margin-bottom: var(--space-xl);
    }
  </style>
</head>
<body>
  <header>
    <h1>Page Title</h1>
  </header>
  
  <main class="container">
    <!-- Use design system components -->
    <div class="alert alert-info">
      Information message
    </div>
    
    <button class="btn btn-primary">Action</button>
  </main>
</body>
</html>
```

### Step 2: Use Design System Variables

**Colors:**
```css
background-color: var(--color-primary);      /* Primary accent */
background-color: var(--color-surface);      /* Panel background */
color: var(--color-text);                    /* Text color */
border-color: var(--color-border);           /* Borders */
background-color: var(--status-approved);    /* Status colors */
```

**Typography:**
```css
font-family: var(--font-heading);            /* Fira Code for headings */
font-family: var(--font-body);               /* Fira Sans for body */
font-size: var(--font-size-lg);              /* Predefined sizes */
font-weight: var(--font-weight-bold);        /* Predefined weights */
```

**Spacing:**
```css
padding: var(--space-md);                    /* 16px */
margin-bottom: var(--space-lg);              /* 24px */
gap: var(--space-xl);                        /* 32px */
```

**Effects:**
```css
box-shadow: var(--shadow-md);                /* Subtle shadow */
border-radius: var(--radius-md);             /* 8px corners */
transition: all var(--transition-default);   /* Smooth animations */
```

### Step 3: Check Page Overrides (Optional)

If your page has special requirements:

1. Check `design-system/garuda-admin/pages/[page-name].md`
2. If it exists, apply the overrides to your CSS
3. If not, use MASTER.md rules as-is

**Example:** For governance pages, use:
```css
.governance-card {
  padding: var(--space-md);  /* Override from Master's 24px */
}

.governance-table {
  font-size: var(--font-size-xs);  /* Compact tables */
}

.btn-approve {
  background-color: var(--status-approved);  /* Green approval button */
}
```

---

## Testing & Verification

### 1. Visual Testing
- Open `admin-governance.html` in browser
- Check colors match design system (gold, purple, dark theme)
- Verify spacing is consistent
- Test responsive design (resize window or use mobile view)

### 2. Accessibility Testing
- Zoom to 200%: Check readability and layout
- Use browser DevTools color contrast checker
- Test keyboard navigation (Tab through buttons)
- Enable "Reduced Motion" in OS settings and verify animations disabled

### 3. Link to Live Dashboard

If you have a local backend-api server running:

```bash
# Terminal 1: Start backend-api
cd backend-api
npm run dev  # Listens on http://localhost:3000

# Terminal 2: Open in browser
open http://localhost:3000/admin-governance.html
```

---

## Maintenance & Updates

### When Design System Changes

1. **Color update:** Modify `:root` CSS variables
2. **New status color:** Add to `--status-*` variables
3. **Typography change:** Update `--font-size-*` or `--font-weight-*`
4. **New component pattern:** Add CSS class to `design-system-tokens.css`

### Version Control

```bash
# After making changes
git add design-system/garuda-admin/
git add backend-api/public/css/design-system-tokens.css
git add backend-api/public/admin-*.html

git commit -m "design: update design system tokens and governance dashboard

- Add status color overrides for governance
- Implement governance-specific page overrides
- Create admin-governance.html example
- Add CSS utilities for dashboard layouts"
```

---

## Troubleshooting

### Issue: Colors not applying

**Solution:** Ensure CSS is loaded:
```html
<link rel="stylesheet" href="/css/design-system-tokens.css">
```

### Issue: Responsive design not working

**Solution:** Add viewport meta tag:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

### Issue: Font not displaying correctly

**Solution:** Check font import at top of `design-system-tokens.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=Fira+Code:...');
```

---

## Resources

| Resource | Location | Purpose |
|----------|----------|---------|
| Global rules | `design-system/garuda-admin/MASTER.md` | Design system reference |
| Page overrides | `design-system/garuda-admin/pages/*.md` | Page-specific customizations |
| CSS tokens | `backend-api/public/css/design-system-tokens.css` | Implemented variables + components |
| HTML example | `backend-api/public/admin-governance.html` | Live example dashboard |
| Integration guide | `DESIGN-SYSTEM-INTEGRATION.md` | How to use design system across projects |

---

## Next Steps

1. **Create more pages** using `admin-governance.html` as template
2. **Build component library** (React/Vue components) wrapping design tokens
3. **Document API** endpoints for admin features
4. **Set up deployment** for admin dashboard to staging environment
5. **Gather feedback** from governance team on visual design

---

**Maintainer:** Design System Team  
**Last Updated:** 2026-05-20  
**Status:** ✅ Persisted & Ready for Use
