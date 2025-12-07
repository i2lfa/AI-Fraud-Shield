# AI Fraud Shield - Design Guidelines

## Design Approach
**System**: Custom dark-themed dashboard inspired by modern security platforms (Vercel, Linear, Datadog) with enterprise-grade data visualization capabilities.

## Typography
- **Primary Font**: Inter (Google Fonts) - excellent for data-heavy interfaces
- **Mono Font**: JetBrains Mono - for timestamps, IDs, technical data
- **Scale**:
  - Headers: text-2xl to text-4xl, font-semibold
  - Body: text-sm to text-base, font-normal
  - Data/Metrics: text-xs to text-sm, font-medium
  - Labels: text-xs, font-medium, uppercase tracking-wide

## Layout System
- **Spacing Units**: Tailwind 2, 4, 6, 8, 12, 16 for consistency
- **Container**: max-w-7xl for main content, full-width for dashboard
- **Grid System**: 12-column responsive grid for dashboard layouts
- **Card Padding**: p-6 standard, p-8 for emphasis areas

## Core Components

### Navigation
- **Sidebar**: Fixed left navigation (w-64), collapsible to icons on mobile
- **Top Bar**: Sticky header with breadcrumbs, user profile, notifications
- **Nav Items**: Icon + label, active state with accent border-l-2

### Dashboard Cards
- **Risk Score Cards**: Large metric display (text-4xl) with trend indicators, sparklines, and color-coded severity
- **Status Badges**: Rounded-full px-3 py-1, uppercase text-xs with severity colors
- **Event Cards**: Compact rows with icon, timestamp, user, risk score, decision badge

### Data Visualization
- **Charts**: Recharts with custom dark theme colors
- **Risk Timeline**: Line chart showing score over time with threshold zones
- **Geographic Map**: Dot-based world map with cluster indicators
- **Distribution Graphs**: Bar/pie charts for device types, risk categories

### Tables (Event Logs)
- **Header**: Sticky with sort indicators, filter dropdowns
- **Rows**: Hover state, alternating subtle bg for readability
- **Cells**: Monospace for IDs/timestamps, badges for status, color-coded risk scores
- **Pagination**: Bottom-aligned with page size selector

### Interactive Elements
- **Risk Simulator**: Card-based input panel with sliders (range inputs), real-time output display
- **Rules Configuration**: Toggle switches, numeric inputs with +/- buttons, threshold sliders
- **Breakdown Panel**: Collapsible accordion showing per-factor scores with progress bars

### Forms & Inputs
- **Input Fields**: Dark bg with lighter border, focus ring in accent color
- **Sliders**: Custom styled range with value display, threshold markers
- **Dropdowns**: Dark themed with search capability for filters
- **Buttons**: Primary (accent), Secondary (outline), Danger (red), all with subtle hover lift

## Color Strategy
While specific colors are defined elsewhere, establish these semantic categories:
- **Severity Levels**: Critical, High, Medium, Low, Safe (5-tier system)
- **Status Types**: Active, Blocked, Challenged, Alerted, Allowed
- **Data Categories**: Device, Geo, Typing, Time, Attempts
- **UI States**: Default, Hover, Active, Disabled, Focus

## Page-Specific Layouts

### Dashboard (Landing)
- **Hero Stats Row**: 4-column grid of key metrics (total events, high-risk %, blocked, avg response time)
- **Main Grid**: 2-column layout - Risk Distribution Chart | Geographic Map
- **Secondary Row**: Device Stats | Top Risky Users table
- **Live Feed**: Right sidebar with real-time event stream

### Behavior Analysis Panel
- **Header**: User info card with avatar, last login, baseline status
- **Breakdown Grid**: 5 cards showing each drift factor with score, gauge, explanation
- **Decision Card**: Large central card with final score, decision badge, timestamp
- **History Timeline**: Bottom section showing recent attempts

### Baseline Profile Page
- **Profile Header**: User details, risk rating badge, baseline vs. current comparison
- **Stats Grid**: 2x2 grid - Primary Device | Primary Region | Avg Typing Speed | Login Window
- **Risk History Chart**: Full-width line chart with time selector (24h, 7d, 30d, All)
- **Recent Events Table**: Paginated list of login attempts

### Event Logs (SIEM)
- **Filter Bar**: Multi-select dropdowns for User, Device, Geo, Risk Level, Decision, Date Range
- **Main Table**: Full-width sortable table with sticky header, 10 columns
- **Export Actions**: Top-right buttons for CSV/JSON export

### Risk Simulator
- **Input Panel**: Left sidebar (w-1/3) with labeled sliders and dropdowns
- **Output Panel**: Right section (w-2/3) showing live risk score (large), breakdown cards, decision
- **Reset Button**: Prominent button to restore defaults

### Rules Configuration
- **Threshold Sliders**: 4 horizontal sliders for Block/Challenge/Alert/Allow with numeric inputs
- **Rule Cards**: Each action type in its own card with description, current value, toggle
- **Save Bar**: Sticky bottom bar with Save/Cancel buttons

## Animations
- **Minimal Use**: Fade-in for charts (duration-300), subtle hover transitions (duration-150)
- **Real-time Updates**: Pulse effect on new event entries
- **No**: Page transitions, complex scroll animations, loading spinners beyond simple spinner

## Accessibility
- High contrast ratios for dark theme (WCAG AAA for critical data)
- Keyboard navigation for all interactive elements
- ARIA labels for icon-only buttons
- Focus indicators with 2px visible outline

## Icons
- **Library**: Heroicons (outline for navigation, solid for emphasis)
- **Size**: w-5 h-5 standard, w-6 h-6 for emphasis, w-4 h-4 for inline

This design system creates a professional, data-dense security dashboard with clear information hierarchy, efficient scanning patterns, and immediate risk comprehension.