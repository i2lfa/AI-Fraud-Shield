# AI Fraud Shield

## Overview

AI Fraud Shield is a real-time fraud detection and security monitoring platform. It analyzes user login behavior to detect anomalies and prevent unauthorized access by computing risk scores based on multiple behavioral and contextual factors:

- **Device drift** - Changes in user device from baseline
- **Geo-location drift** - Login from unusual regions
- **Typing behavior deviation** - Speed/keystroke pattern changes
- **Login time anomaly** - Activity outside typical login windows
- **Login attempts frequency** - Too many authentication attempts

The system computes a Risk Score (0-100) and triggers decisions: Allow, Alert, Challenge, or Block.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom dark theme and CSS variables for theming
- **Charts**: Recharts for data visualization (risk timelines, distribution graphs)
- **Build Tool**: Vite with React plugin

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Design**: RESTful JSON API under `/api` prefix
- **Build**: esbuild for production bundling with selective dependency bundling

### Data Storage
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema**: Defined in `shared/schema.ts` using Zod for validation
- **Migrations**: Drizzle Kit for database migrations (`drizzle-kit push`)
- **In-Memory Fallback**: Storage interface in `server/storage.ts` with sample data generation

### Key Design Patterns
- **Shared Types**: Schema definitions in `shared/` directory used by both client and server
- **Path Aliases**: `@/` for client source, `@shared/` for shared code
- **Component Architecture**: Reusable UI components with consistent styling through CVA (class-variance-authority)
- **Dark Mode First**: Theme system with light/dark mode toggle, defaulting to dark

### Application Pages
- **Dashboard**: Overview stats, risk distribution charts, recent events
- **Event Logs**: Paginated, filterable log table with search
- **Risk Simulator**: Interactive tool to test risk calculations with various parameters
- **User Profiles**: List of monitored users with risk history
- **User Detail**: Individual user baseline data and login history
- **Behavior Analysis**: Detailed drift analysis comparing current vs baseline
- **Security Rules**: Configurable thresholds for risk decisions

## External Dependencies

### Database
- **PostgreSQL**: Primary database via `DATABASE_URL` environment variable
- **connect-pg-simple**: Session storage for Express sessions

### UI Libraries
- **Radix UI**: Complete primitive component set (dialogs, dropdowns, sliders, etc.)
- **Recharts**: Charting library for dashboards
- **embla-carousel-react**: Carousel component
- **react-day-picker**: Date picker component
- **vaul**: Drawer component
- **cmdk**: Command palette component

### Development Tools
- **Replit Plugins**: Runtime error overlay, cartographer, dev banner (development only)
- **Google Fonts**: Inter (primary), JetBrains Mono (monospace)