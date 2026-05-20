# Governance Dashboard - Page Overrides

> Overrides from `design-system/garuda-admin/MASTER.md` for governance.md page  
> Purpose: Enhanced visual hierarchy for approval workflow and token management

---

## Color Overrides

### Status Colors (Enhanced)

| Status | Color Hex | CSS Var | Purpose |
|--------|-----------|---------|---------|
| Approved | `#059669` | `--status-approved` | Release approved, locked tokens |
| Pending Review | `#D97706` | `--status-pending` | Awaiting governance action |
| Rejected | `#DC2626` | `--status-rejected` | Release rejected, recall initiated |
| In Progress | `--color-info` (#3B82F6) | `--status-in-progress` | Tokenization in progress |
| Released | `--color-accent` (#8B5CF6) | `--status-released` | Tokens released to market |

### Accent Colors

- **Approval Button:** `#10B981` (Green) — Override primary accent for approval actions
- **Reject Button:** `#DC2626` (Deep red) — Consistent with status color
- **Warning Alert:** `#F97316` (Orange) — Governance warnings, pending actions

---

## Typography Overrides

### Data Table (Density Increase)

**Override from MASTER:**
- Reduce font size: `--font-size-xs` (12px) for table body
- Reduce row padding: `--space-sm` (8px) instead of `--space-md` (16px)
- Header bold: `--font-weight-bold` (700)

**CSS:**
```css
.governance-table {
  font-size: var(--font-size-xs);
}

.governance-table tbody tr {
  padding: var(--space-sm) var(--space-md);
}

.governance-table thead {
  font-weight: var(--font-weight-bold);
  background-color: var(--color-background);
}
```

### Release Title

- Font: `--font-heading` (Fira Code)
- Size: `--font-size-xl` (24px)
- Weight: `--font-weight-bold` (700)
- Color: `--color-accent` (#8B5CF6)
- Margin-bottom: `--space-md` (16px)

---

## Spacing Overrides

### Card Padding (Compact)

**Override from MASTER (normally `--space-lg`):**
- Governance cards: `--space-md` (16px) — tighter for dashboard density
- Data cells: `--space-sm` (8px) horizontal, `--space-xs` (4px) vertical

**CSS:**
```css
.governance-card {
  padding: var(--space-md);  /* Override from 24px to 16px */
  margin-bottom: var(--space-md);
}
```

### Status Badge Spacing

- Padding: `--space-xs` (4px) horizontal, `2px` vertical
- Margin-right: `--space-sm` (8px)
- Border-radius: `--radius-sm` (4px)

---

## Component Overrides

### Governance Action Buttons

**Primary Action (Approve Release):**
```css
.btn-approve-release {
  background-color: #10B981;  /* Green override */
  color: white;
  padding: var(--space-sm) var(--space-lg);
  font-weight: var(--font-weight-bold);
  border-radius: var(--radius-md);
}

.btn-approve-release:hover {
  background-color: #059669;  /* Darker green */
  box-shadow: var(--shadow-lg);
}
```

**Danger Action (Reject/Recall):**
```css
.btn-reject-release {
  background-color: #DC2626;  /* Red override */
  color: white;
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-md);
}

.btn-reject-release:hover {
  background-color: #991B1B;  /* Darker red */
}
```

### Release Summary Card

- Background: `--color-surface` (#1E293B)
- Border: 2px solid `--color-accent` (#8B5CF6) — highlight active releases
- Padding: `--space-md` (16px) — override from `--space-lg`
- Box-shadow: `--shadow-md`

---

## Layout Overrides

### Release Grid

**Override: Compact 2-column on desktop**

```css
@media (min-width: 1024px) {
  .governance-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;  /* 2 columns instead of 3 */
    gap: var(--space-md);
  }
}

@media (max-width: 1024px) {
  .governance-grid {
    grid-template-columns: 1fr;  /* 1 column on tablet */
  }
}
```

### Approval Timeline

- Vertical layout with color-coded status markers
- Marker colors: Use status colors (`--status-approved`, `--status-pending`, `--status-rejected`)
- Line color: `--color-border` (#334155)
- Spacing between items: `--space-lg` (24px)

---

## Alert & Notification Styles

### Warning Alert (Pending Approval)

```css
.alert-warning {
  background-color: rgba(249, 115, 22, 0.1);  /* Orange + 10% opacity */
  border: 1px solid var(--color-warning);
  color: var(--color-text);
  padding: var(--space-md);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-lg);
}
```

### Success Alert (Approved)

```css
.alert-success {
  background-color: rgba(16, 185, 129, 0.1);  /* Green + 10% opacity */
  border: 1px solid var(--status-approved);
  color: var(--color-text);
  padding: var(--space-md);
  border-radius: var(--radius-md);
}
```

---

## Special Effects

### Approval Button Animation

```css
@keyframes pulse-approve {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(16, 185, 129, 0);
  }
}

.btn-approve-release:focus {
  animation: pulse-approve 2s infinite;
}
```

### Loading Skeleton (Data Loading)

```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-surface) 25%,
    rgba(255, 255, 255, 0.1) 50%,
    var(--color-surface) 75%
  );
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

---

## Responsive Adjustments

### Mobile (< 640px)

- Card padding: `--space-sm` (8px)
- Font sizes: Reduce by 1 step (e.g., `--font-size-sm` instead of `--font-size-md`)
- Button padding: `--space-xs` (4px) `--space-sm` (8px)
- Grid: 1 column only

### Tablet (640px - 1024px)

- Card padding: `--space-md` (16px)
- Font sizes: Standard from MASTER
- Button padding: `--space-sm` (8px) `--space-md` (16px)
- Grid: 2 columns

### Desktop (≥ 1024px)

- Card padding: `--space-md` (16px) — override from `--space-lg`
- Font sizes: Standard from MASTER
- Button padding: `--space-sm` (8px) `--space-lg` (24px)
- Grid: 2 columns (governance specific)

---

## Summary of Changes from Master

| Element | Master | Override | Reason |
|---------|--------|----------|--------|
| Card padding | 24px | 16px | Dashboard density |
| Table font | 16px | 12px | Data table compactness |
| Approve button | Purple | Green | Status clarity |
| Reject button | Red (Master error) | Deep red | Emphasis |
| Grid columns | 3 | 2 | Governance focus |
| Border | Normal | Accent | Highlight active |

---

**Applied to:** Governance Dashboard (Admin)  
**Last Updated:** 2026-05-20  
**Maintainer:** Design System Team
