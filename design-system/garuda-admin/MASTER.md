# Garuda Admin Design System - Master

> Global design rules untuk Garuda-Link Admin Dashboard  
> Generated: 2026-05-20  
> Category: Fintech / Governance / Admin

---

## Global Rules

### Color Palette

| Role | Hex | CSS Variable | Purpose |
|------|-----|--------------|---------|
| Primary | `#F59E0B` | `--color-primary` | CTAs, highlights, active states |
| Secondary | `#FBBF24` | `--color-secondary` | Supporting elements, inactive states |
| Accent/CTA | `#8B5CF6` | `--color-accent` | Approval buttons, confirmations |
| Background | `#0F172A` | `--color-background` | Page background |
| Surface | `#1E293B` | `--color-surface` | Cards, panels, modals |
| Border | `#334155` | `--color-border` | Dividers, form borders |
| Text | `#F8FAFC` | `--color-text` | Body text |
| Text Muted | `#94A3B8` | `--color-text-muted` | Labels, hints, disabled text |
| Success | `#10B981` | `--color-success` | Approval, active, completed |
| Warning | `#F97316` | `--color-warning` | Pending, caution, review |
| Error | `#EF4444` | `--color-error` | Reject, fail, errors |
| Info | `#3B82F6` | `--color-info` | Information, notifications |

**Color Notes:** Gold trust + Purple tech, Dark fintech theme with high contrast for accessibility

### Typography

- **Heading Font:** Fira Code
- **Body Font:** Fira Sans
- **Mood:** Dashboard, data, analytics, technical, precise, high-contrast
- **Import:** [Google Fonts](https://fonts.google.com/share?selection.family=Fira+Code:wght@400;500;600;700|Fira+Sans:wght@300;400;500;600;700)

**CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap');
```

### Font Sizes & Weights

| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `--font-size-xs` | 12px | 400 | Data, small text, labels |
| `--font-size-sm` | 14px | 400/500 | Form labels, small headings |
| `--font-size-md` | 16px | 400/500 | Body text, buttons |
| `--font-size-lg` | 20px | 600 | Section headings |
| `--font-size-xl` | 24px | 700 | Page titles |
| `--font-size-2xl` | 32px | 700 | Main header |

### Spacing System

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | 4px | Tight gaps, icon spacing |
| `--space-sm` | 8px | Form field gaps, inline spacing |
| `--space-md` | 16px | Standard padding, component margins |
| `--space-lg` | 24px | Section padding, card spacing |
| `--space-xl` | 32px | Large gaps, layout margins |
| `--space-2xl` | 48px | Page section spacing |

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 4px | Small buttons, small inputs |
| `--radius-md` | 8px | Cards, standard inputs, modals |
| `--radius-lg` | 12px | Large panels, hero sections |

### Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | 0 1px 2px rgba(0,0,0,0.2) | Subtle depth, hover states |
| `--shadow-md` | 0 4px 6px rgba(0,0,0,0.3) | Cards, dropdowns |
| `--shadow-lg` | 0 10px 25px rgba(0,0,0,0.4) | Modals, elevated panels |
| `--shadow-xl` | 0 20px 40px rgba(0,0,0,0.5) | Floating actions, overlays |

### Responsive Breakpoints

| Device | Width | Variable |
|--------|-------|----------|
| Mobile | < 640px | `--bp-mobile` |
| Tablet | 640px - 1024px | `--bp-tablet` |
| Desktop | ≥ 1024px | `--bp-desktop` |

---

## Component Rules

### Buttons

**Primary Button (Approval):**
- Background: `--color-accent` (#8B5CF6)
- Text: `--color-background` (#0F172A)
- Padding: `--space-sm` `--space-md`
- Font: `--font-body`, `--font-size-md`, `--font-weight-medium`
- Radius: `--radius-sm`
- Hover: Opacity 0.85, shadow elevation

**Secondary Button (Cancel):**
- Background: `--color-surface` (#1E293B)
- Text: `--color-text` (#F8FAFC)
- Border: 1px `--color-border` (#334155)
- Padding: `--space-sm` `--space-md`
- Hover: Border color → `--color-primary` (#F59E0B)

**Danger Button (Reject):**
- Background: `--color-error` (#EF4444)
- Text: White
- Padding: `--space-sm` `--space-md`
- Hover: Darker shade, increased shadow

### Cards

- Background: `--color-surface` (#1E293B)
- Padding: `--space-lg` (24px)
- Border-radius: `--radius-md` (8px)
- Border: 1px solid `--color-border` (#334155)
- Box-shadow: `--shadow-md`
- Header: `--color-text` (body font), bold

### Data Tables

- Header background: `--color-background` (#0F172A)
- Header text: `--color-primary` (#F59E0B), bold
- Row padding: `--space-md` (16px)
- Row borders: 1px solid `--color-border` (#334155)
- Alternating rows: Subtle `--color-surface` highlight
- Font: `--font-body`, `--font-size-sm` (14px)

### Status Indicators

- **Approved:** `--color-success` (#10B981)
- **Pending:** `--color-warning` (#F97316)
- **Rejected:** `--color-error` (#EF4444)
- **Info:** `--color-info` (#3B82F6)

---

## Effects & Interactions

### Transitions
- Default duration: 300ms
- Easing: `ease-in-out`
- Hover: Smooth opacity + shadow changes

### Focus States
- Outline: 2px solid `--color-accent` (#8B5CF6)
- Outline-offset: 2px
- Applied to: Buttons, inputs, links

### Disabled State
- Opacity: 0.5
- Cursor: `not-allowed`
- Hover: No changes

---

## Layout Patterns

### Page Structure
```
Header (with logo, title)
└─ Navigation breadcrumb
└─ Main content area
    ├─ Filters/Controls (top)
    └─ Data grid or card grid
└─ Footer (optional)
```

### Grid Columns
- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 3 columns or more

### Card Spacing
- Horizontal gap: `--space-lg` (24px)
- Vertical gap: `--space-lg` (24px)
- Responsive: Reduce to `--space-md` on mobile

---

## Anti-Patterns (Avoid)

❌ Don't use light colors on light backgrounds  
❌ Don't mix multiple accent colors (stick to primary + accent)  
❌ Don't use more than 2 font families  
❌ Don't forget focus states on interactive elements  
❌ Don't ignore accessibility (color contrast, touch targets)  
❌ Don't use padding < `--space-sm` for touch buttons  

---

**References:**
- Figma: [Garuda Admin Fintech Designs]
- Accessibility: WCAG 2.1 AA compliance
- Brand: Garuda-Link Fintech Identity

**Last Updated:** 2026-05-20
