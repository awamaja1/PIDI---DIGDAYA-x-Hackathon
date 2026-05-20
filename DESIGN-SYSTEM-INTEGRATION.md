# Design System Integration Guide

> Dokumentasi lengkap bagaimana design system Garuda-Link diterapkan di berbagai project dan cara menggunakannya.

## Overview

**Design System** adalah source of truth untuk UI/UX consistency di seluruh Garuda-Link project. Dibangun dengan skill `ui-ux-pro-max` dan tersimpan di `design-system/`.

### Struktur Design System

```
design-system/
├── MASTER.md                 # Global design rules (colors, typography, spacing)
├── exampleproject/
│   ├── MASTER.md             # Project-specific master rules
│   └── pages/
│       ├── dashboard.md      # Dashboard page overrides
│       └── [page-name].md    # Page-specific deviations
├── garuda-admin/             # Admin dashboard project
│   ├── MASTER.md
│   └── pages/
│       ├── governance.md
│       └── tokens.md
└── integration-guide.md       # (This file)
```

---

## Part 1: Understanding the Design System Hierarchy

### 1.1 Master File (MASTER.md)

Global design rules yang berlaku untuk seluruh project. Berisi:

- **Color Palette**: Hex codes + CSS variable mappings
- **Typography**: Font families, weights, sizes, line heights
- **Spacing System**: Token-based spacing (xs, sm, md, lg, xl)
- **Component Rules**: Button styles, card layouts, form inputs
- **Responsive Breakpoints**: Mobile, tablet, desktop
- **Effects**: Shadows, borders, animations

**Location:** `design-system/[project-name]/MASTER.md`

**Example (Garuda Fintech):**
```markdown
## Color Palette

| Role | Hex | CSS Variable | Purpose |
|------|-----|--------------|---------|
| Primary | #F59E0B | --color-primary | CTAs, highlights |
| Secondary | #FBBF24 | --color-secondary | Supporting elements |
| CTA/Accent | #8B5CF6 | --color-cta | Action buttons |
| Background | #0F172A | --color-background | Page backgrounds |
| Text | #F8FAFC | --color-text | Body text |
```

### 1.2 Page Overrides (pages/[page-name].md)

Page-specific deviations dari Master file. **Only override when necessary.**

**When to create a page override:**
- Special color scheme for specific page
- Custom typography rules
- Unique component variants
- Localized spacing requirements

**Example:** `design-system/garuda-admin/pages/governance.md`
```markdown
# Governance Dashboard Page

> Overrides from MASTER.md for governance.md page

## Color Overrides
- Primary button: #10B981 (Green for approval actions)
- Status indicators: Custom palette (approved, pending, rejected)

## Typography Overrides
- Data table heading: Fira Code, 12px (smaller for density)

## Spacing Overrides
- Card padding: 12px (reduced from 16px for dashboard density)
```

**Retrieval Logic (Priority Order):**
1. Check `design-system/[project]/pages/[page-name].md` → if exists, use it
2. Fall back to `design-system/[project]/MASTER.md` → use global rules

---

## Part 2: How to Generate a Design System

Use the `ui-ux-pro-max` skill to auto-generate design systems.

### 2.1 Generate and Persist

```bash
cd .github/skills/ui-ux-pro-max
python3 scripts/search.py "fintech tokenization governance" --design-system --persist -p "Garuda Admin"
```

**Output:**
```
✓ Design system generated: design-system/garuda-admin/MASTER.md
✓ Ready for page overrides: design-system/garuda-admin/pages/
```

### 2.2 Generate with Page Overrides

```bash
python3 scripts/search.py "fintech dashboard analytics" --design-system --persist -p "Garuda Admin" --page "governance"
```

**Output:**
```
✓ Master saved: design-system/garuda-admin/MASTER.md
✓ Page override: design-system/garuda-admin/pages/governance.md
```

### 2.3 Generate Multiple Pages

```bash
# Generate master + multiple page-specific systems
python3 scripts/search.py "fintech dashboard" --design-system --persist -p "Garuda Admin" --page "governance"
python3 scripts/search.py "fintech audit trail" --design-system --persist -p "Garuda Admin" --page "audit"
python3 scripts/search.py "fintech token issuance" --design-system --persist -p "Garuda Admin" --page "tokenize"
```

---

## Part 3: Implementing Design System in Code

### 3.1 CSS Variable Approach (Recommended for Web)

**Step 1:** Create `public/design-system.css` or `src/styles/design-system.css`

```css
/* design-system-tokens.css */
/* Auto-generated from design-system/garuda-admin/MASTER.md */

:root {
  /* Color Palette */
  --color-primary: #F59E0B;
  --color-secondary: #FBBF24;
  --color-cta: #8B5CF6;
  --color-background: #0F172A;
  --color-text: #F8FAFC;
  --color-success: #10B981;
  --color-error: #EF4444;
  --color-warning: #F97316;
  --color-info: #3B82F6;

  /* Typography */
  --font-heading: "Fira Code", monospace;
  --font-body: "Fira Sans", sans-serif;
  --font-size-xs: 12px;
  --font-size-sm: 14px;
  --font-size-md: 16px;
  --font-size-lg: 20px;
  --font-size-xl: 24px;
  --font-weight-light: 300;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-bold: 700;

  /* Spacing System */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;

  /* Shadows & Effects */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.2);
  --border-radius-sm: 4px;
  --border-radius-md: 8px;
  --border-radius-lg: 12px;
}

/* Responsive Breakpoints */
@media (max-width: 640px) {
  :root {
    --font-size-lg: 18px;
    --space-lg: 20px;
  }
}

@media (min-width: 1024px) {
  :root {
    --font-size-lg: 22px;
  }
}
```

**Step 2:** Use in HTML/CSS

```html
<!-- src/public/admin-dashboard.html -->
<div class="dashboard-card">
  <h1 class="dashboard-title">Governance Summary</h1>
  <button class="btn btn-primary">Approve Release</button>
</div>

<style>
  .dashboard-card {
    background-color: var(--color-background);
    color: var(--color-text);
    padding: var(--space-lg);
    border-radius: var(--border-radius-md);
    box-shadow: var(--shadow-md);
  }

  .dashboard-title {
    font-family: var(--font-heading);
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    margin-bottom: var(--space-md);
  }

  .btn {
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--border-radius-sm);
    border: none;
    cursor: pointer;
    font-family: var(--font-body);
    transition: all 0.3s ease;
  }

  .btn-primary {
    background-color: var(--color-primary);
    color: var(--color-background);
  }

  .btn-primary:hover {
    opacity: 0.9;
    box-shadow: var(--shadow-lg);
  }
</style>
```

### 3.2 Tailwind CSS Approach (Alternative)

**Step 1:** Update `tailwind.config.js` with design tokens

```js
// backend-api/tailwind.config.js (if using Tailwind)
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#F59E0B',
        secondary: '#FBBF24',
        'cta-accent': '#8B5CF6',
        background: '#0F172A',
        text: '#F8FAFC',
      },
      fontFamily: {
        heading: ['Fira Code', 'monospace'],
        body: ['Fira Sans', 'sans-serif'],
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
      },
      fontSize: {
        xs: '12px',
        sm: '14px',
        md: '16px',
        lg: '20px',
        xl: '24px',
      },
    },
  },
};
```

**Step 2:** Use in components

```html
<div class="bg-background text-text p-lg rounded-md shadow-md">
  <h1 class="font-heading text-xl font-bold">Governance</h1>
  <button class="bg-primary text-background px-md py-sm rounded hover:shadow-lg">
    Approve
  </button>
</div>
```

### 3.3 Component Approach (React/Vue)

**Step 1:** Create design system component library

```jsx
// backend-api/src/components/design-system/Button.jsx
import styles from './Button.module.css';

export const Button = ({ variant = 'primary', children, ...props }) => {
  return (
    <button 
      className={`${styles.btn} ${styles[`btn-${variant}`]}`}
      {...props}
    >
      {children}
    </button>
  );
};

// Usage:
// <Button variant="primary">Approve Release</Button>
// <Button variant="secondary">Cancel</Button>
```

```css
/* Button.module.css */
.btn {
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--border-radius-sm);
  border: none;
  cursor: pointer;
  font-family: var(--font-body);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  transition: all 0.3s ease;
}

.btn-primary {
  background-color: var(--color-primary);
  color: var(--color-background);
}

.btn-primary:hover {
  opacity: 0.9;
  box-shadow: var(--shadow-lg);
}

.btn-secondary {
  background-color: var(--color-secondary);
  color: var(--color-background);
}

.btn-secondary:hover {
  opacity: 0.85;
}
```

---

## Part 4: Integration Examples

### 4.1 Backend-API Admin Dashboard

```
backend-api/
├── src/
│   ├── public/
│   │   ├── admin-dashboard.html
│   │   └── css/
│   │       ├── design-system-tokens.css   # Design system variables
│   │       └── admin-dashboard.css         # Page-specific styles
│   └── api/
│       └── routes/
│           └── admin.js                   # Admin endpoints
└── design-system/
    ├── MASTER.md                          # Global rules
    └── pages/
        └── admin-dashboard.md             # Page overrides
```

**Steps:**
1. Create `backend-api/public/css/design-system-tokens.css` with color/font/spacing vars
2. Create `backend-api/src/public/admin-dashboard.html` using the tokens
3. If needed, create `design-system/garuda-admin/pages/admin-dashboard.md` for overrides

### 4.2 AI-Engine Web Interface (if added)

Similar structure but for Python/Flask web interface.

### 4.3 Frontend Project (Future)

When building a separate frontend (React/Next.js/Vue):

```
frontend/
├── src/
│   ├── styles/
│   │   └── design-system.css       # Import design variables
│   ├── components/
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   └── [other components]
│   └── pages/
│       └── [pages]
└── design-system/
    ├── MASTER.md
    └── pages/
        ├── home.md
        ├── governance.md
        └── tokenize.md
```

---

## Part 5: Maintenance & Updates

### 5.1 When to Update Design System

- Brand color change → Update `MASTER.md` color palette
- New page added → Create `pages/[new-page].md` with overrides
- Component behavior changes → Document in relevant page override
- Typography changes → Update font variables

### 5.2 Version Control

```bash
# After design system changes
git add design-system/
git commit -m "design: update colors and typography for [reason]"
```

### 5.3 Documentation Strategy

For each project using design system:

1. **README section:** How to use design system
2. **CONTRIBUTING.md:** Design system rules for contributors
3. **Component library docs:** If building reusable components

---

## Part 6: Command Reference

### Generate Design System

```bash
# Basic generation + persist
cd .github/skills/ui-ux-pro-max
python3 scripts/search.py "fintech tokenization" --design-system --persist -p "ProjectName"

# With page-specific override
python3 scripts/search.py "fintech governance" --design-system --persist -p "ProjectName" --page "governance"

# Multiple pages
python3 scripts/search.py "fintech dashboard" --design-system --persist -p "ProjectName" --page "dashboard"
python3 scripts/search.py "fintech audit" --design-system --persist -p "ProjectName" --page "audit"
```

### Search for Specific Styles

```bash
# Search color palettes
python3 scripts/search.py "fintech dark mode" --domain color

# Search typography
python3 scripts/search.py "fintech dashboard" --domain typography

# Search component patterns
python3 scripts/search.py "approval button" --domain style
```

---

## Checklist: Integrating Design System to a Project

- [ ] Review `design-system/[project]/MASTER.md`
- [ ] Identify page-specific needs
- [ ] Create `pages/[page-name].md` overrides (if needed)
- [ ] Create CSS file with design system variables
- [ ] Implement components/layouts using tokens
- [ ] Test responsive breakpoints
- [ ] Document integration in project README
- [ ] Commit to git with `design:` prefix

---

## Example: Complete Admin Dashboard Integration

**Scenario:** Build admin dashboard for governance using design system

### Step 1: Generate Design System

```bash
python3 scripts/search.py "fintech admin governance dashboard analytics" --design-system --persist -p "Garuda Admin"
```

Creates: `design-system/garuda-admin/MASTER.md`

### Step 2: Create Page Override (Optional)

```bash
python3 scripts/search.py "dark mode high contrast data table" --design-system --persist -p "Garuda Admin" --page "governance"
```

Creates: `design-system/garuda-admin/pages/governance.md`

### Step 3: Implement in Code

```bash
# Create CSS file
touch backend-api/src/public/css/design-system-tokens.css

# Copy tokens from design-system/garuda-admin/MASTER.md to CSS file
# Implement dashboard HTML/components using tokens
# Link CSS in HTML: <link rel="stylesheet" href="/css/design-system-tokens.css">
```

### Step 4: Verify

```bash
# Start backend-api and view admin dashboard
npm run dev

# Check http://localhost:3000/admin-dashboard
# Verify colors, spacing, typography match design system
```

### Step 5: Commit

```bash
git add design-system/garuda-admin design-system/garuda-admin/pages backend-api/src/public/css backend-api/src/public/admin-dashboard.html
git commit -m "feat(admin): integrate design system for governance dashboard

- Design system: fintech admin + governance overrides
- CSS tokens: colors, typography, spacing
- Dashboard: governance summary, approval workflow
- Responsive: mobile-first design"
```

---

## Resources

- **Skill:** `.github/skills/ui-ux-pro-max/`
- **Reference Project:** `design-system/exampleproject/MASTER.md`
- **Config:** `.github/skills/ui-ux-pro-max/data/`
- **Scripts:** `.github/skills/ui-ux-pro-max/scripts/`

---

**Last Updated:** 2026-05-20  
**Maintained by:** Garuda-Link Design System Team
