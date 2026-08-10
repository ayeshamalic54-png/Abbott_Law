# Abbott Law College Management System - Design Guidelines

## Design Approach: Enterprise Design System

**Selected System**: Material Design adapted through Shadcn/ui components
**Justification**: This institutional management platform handles complex data workflows across 7 user roles (admin, accountant, receptionist, teacher, library staff, student, university). Material Design's established patterns for data-heavy interfaces, clear information hierarchy, and extensive component library make it ideal for this utility-focused application where efficiency and learnability are paramount.

## Core Design Principles

1. **Information Clarity Over Aesthetics**: Every design decision prioritizes data comprehension and workflow efficiency
2. **Consistent Patterns**: Repeated interactions across modules reduce cognitive load for multi-role users
3. **Scannable Layouts**: Dense information organized with clear visual hierarchy
4. **Functional Density**: Maximize screen real estate for data while maintaining readability

---

## Typography System

**Hierarchy**:
- **Page Titles**: `text-3xl font-semibold` - Clear section identification
- **Section Headers**: `text-2xl font-medium` - Module and card headers
- **Subsection Headers**: `text-xl font-medium` - Table headers, form sections
- **Body Text**: `text-base` - Default for all content, forms, tables
- **Supporting Text**: `text-sm text-muted-foreground` - Helper text, metadata, timestamps
- **Data Labels**: `text-sm font-medium` - Form labels, table column headers
- **Micro Text**: `text-xs text-muted-foreground` - Status badges, footnotes

**Font Usage**:
- Primary content: Inter (already configured)
- Headings: Poppins for distinction
- Tabular data: Use monospace (Fira Code) for numerical columns requiring alignment

---

## Layout & Spacing System

**Spacing Scale**: Use Tailwind units consistently across the application:
- **Micro spacing** (buttons, badges): `px-2`, `py-1`, `gap-1`
- **Component spacing** (form fields, cards): `p-4`, `gap-4`, `space-y-4`
- **Section spacing** (page sections, major divisions): `p-6`, `gap-6`, `space-y-6`
- **Page spacing** (main content margins): `p-8`, `gap-8`

**Grid Layouts**:
- **Dashboard Cards**: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
- **Data Tables**: Full-width with `max-w-7xl mx-auto` container
- **Forms**: `max-w-2xl` for single-column forms, `grid grid-cols-2 gap-4` for multi-column
- **Detail Views**: Two-column `grid grid-cols-3 gap-6` - 2 columns for data, 1 for actions/metadata

---

## Component Library Guidelines

### Navigation & Layout
- **Sidebar**: Persistent left navigation (already implemented) with role-based menu items
- **Top Bar**: Page title, breadcrumbs, user profile, notifications
- **Page Container**: `max-w-7xl mx-auto px-4 py-6`

### Data Display Components
- **Tables**: Shadcn Table component with:
  - Sticky headers for long lists
  - Hover states on rows
  - Action buttons in rightmost column
  - Pagination for >20 rows
  - Search/filter bar above table

- **Cards**: Use for dashboard metrics and entity summaries
  - Header: Title + optional action button
  - Body: Key metrics or preview data
  - Footer: View details link or status indicator

- **Stats Cards**: 
  - Large number: `text-4xl font-bold`
  - Label below: `text-sm text-muted-foreground`
  - Optional trend indicator with color (green/red)

### Forms
- **Input Fields**: Full Shadcn form components with:
  - Label above input (not floating)
  - Helper text below when needed
  - Inline validation messages
  - Required field indicator (`*`)

- **Layout**: Group related fields with `space-y-4`
- **Actions**: Primary action (right), Cancel (left) at form bottom
- **Multi-step Forms**: Use Tabs component for clear step indication

### Data Visualization
- **Charts** (Recharts library):
  - Bar charts for comparisons (attendance, grades)
  - Line charts for trends (fee collection over time)
  - Pie charts for distributions (student demographics)
  - Consistent color palette from theme variables

### Status Indicators
- **Badges**: Use for statuses (Active/Inactive, Paid/Pending, Present/Absent)
  - Success: `bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`
  - Warning: `bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`
  - Danger: `bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`
  - Info: `bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`

### Modals & Dialogs
- Use Shadcn Dialog for:
  - Quick forms (add/edit)
  - Confirmations (delete actions)
  - Detail views (student profile preview)
- Max width: `max-w-2xl` for forms, `max-w-4xl` for data-heavy views

---

## Dashboard Design Patterns

**Admin Dashboard**:
- Top row: 4 metric cards (students, staff, revenue, expenses) - `grid-cols-4`
- Middle: 2 charts side-by-side - attendance trends + fee collection
- Bottom: Recent activities table

**Role-Specific Dashboards**:
- Teacher: Class schedule + student list + recent attendance
- Accountant: Fee collection summary + pending payments + expense overview
- Student: Personal schedule + grades + fee status + borrowed books

**Responsive Behavior**:
- Desktop (lg): 3-4 columns
- Tablet (md): 2 columns
- Mobile: Single column stack

---

## Animations: Minimal & Purposeful

- **Page Transitions**: None (instant navigation for speed)
- **Modals**: Fade in/scale up (Shadcn default)
- **Dropdowns**: Slide down (Radix default)
- **Loading States**: Skeleton screens or subtle spinner for data fetching
- **Hover**: Subtle background color change on interactive elements

---

## Key Design Patterns

1. **List-Detail Pattern**: Click table row → Opens detail modal/page
2. **Bulk Actions**: Checkboxes in tables + action bar at top
3. **Search-Filter-Sort**: Unified bar above all data tables
4. **Breadcrumb Navigation**: Show hierarchy (Dashboard > Students > Student Details)
5. **Inline Editing**: Click-to-edit for simple field updates in tables
6. **Action Confirmation**: Always confirm destructive actions (delete, deactivate)

---

## Accessibility Requirements

- All form inputs have associated labels
- Focus indicators visible on all interactive elements
- Color is never the only indicator (use icons + text)
- Tables have proper header structure
- Modals trap focus and support ESC to close
- Minimum touch target: 44px × 44px for mobile