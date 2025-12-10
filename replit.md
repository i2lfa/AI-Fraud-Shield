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
- **Schema**: Defined in `shared/schema.ts` using Zod for validation (includes pgTable definitions)
- **Migrations**: Drizzle Kit for database migrations (`npm run db:push`)
- **Database Connection**: `server/db.ts` creates Drizzle connection pool
- **Storage Interface**: `server/storage.ts` defines `IStorage` interface
- **Database Storage**: `server/db-storage.ts` implements `DbStorage` class for persistent PostgreSQL storage
- **Auto-Seeding**: Database is automatically seeded with test users on first run
- **Fallback**: Falls back to in-memory storage if DATABASE_URL is not set

### Database Tables
- **auth_users**: User authentication (id, username, email, password, role, baseline settings)
- **user_baselines**: User behavioral baselines for fraud detection
- **event_logs**: Login event history with risk scores
- **login_attempts**: Detailed login attempt records with fingerprinting data
- **security_rules**: Configurable risk thresholds
- **otp_sessions**: One-time password sessions for 2FA challenges

### Key Design Patterns
- **Shared Types**: Schema definitions in `shared/` directory used by both client and server
- **Path Aliases**: `@/` for client source, `@shared/` for shared code
- **Component Architecture**: Reusable UI components with consistent styling through CVA (class-variance-authority)
- **Dark Mode First**: Theme system with light/dark mode toggle, defaulting to dark

### Application Pages
- **Dashboard**: Overview stats, risk distribution charts, recent events (admin only)
- **Event Logs**: Paginated, filterable log table with search
- **Risk Simulator**: Interactive tool to test risk calculations with various parameters
- **User Profiles**: List of monitored users with risk history
- **User Detail**: Individual user baseline data and login history
- **Behavior Analysis**: Detailed drift analysis comparing current vs baseline
- **Security Rules**: Configurable thresholds for risk decisions
- **Admin Panel**: Admin security dashboard with login attempts, hidden fraud rules, analytics, fingerprints, and AI Model tab
- **User Dashboard**: User-facing dashboard with account status (no fraud data visible)
- **Real Login** (`/real-login`): Production-grade login with silent ML-based fraud detection
- **Real Home** (`/real-home`): User home after successful real-login

### Machine Learning Model
- **Location**: `server/ml-model.ts`
- **Algorithm**: Isolation Forest-inspired anomaly detection
- **Features**: Typing dynamics, device fingerprint, geo analysis, velocity scoring, time analysis, bot detection
- **Training**: Auto-retrains after 50 new samples; initialized with 70 seed samples
- **Metrics**: Accuracy, Precision, Recall, F1 Score tracked in model state
- **Integration**: ML score weighted at 30% of total risk score in real-login flow
- **Admin Controls**: Retrain and Export buttons in AI Model Dashboard tab

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

## Authentication

### Login Endpoints
- `/login` - Standard login with OTP verification for high-risk attempts
- `/real-login` - Production login with silent ML-based fraud detection (no risk data exposed)

### Test Accounts
- **Admin**: username: `admin`, password: `admin123`, email: `abdulmalikfaa@gmail.com`, role: `admin`
- **User**: username: `john`, password: `password123`, email: `alphapp9@gmail.com`, role: `user`

### OTP System
- OTP codes printed to server console: `[OTP] Generated code XXXXXX`
- Required when risk score triggers "challenge" decision
- **Future Enhancement**: To send OTPs via email, set up Resend or SendGrid integration. User emails are configured and ready.

## API Endpoints

### Authentication
- `POST /api/auth/login` - Standard login
- `POST /api/auth/real-login` - Production login with ML scoring
- `POST /api/auth/verify-otp` - OTP verification
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Current user info

### Admin Only
- `GET /api/admin/login-attempts` - All login attempts with full fraud data
- `GET /api/admin/model/status` - ML model status and metrics
- `POST /api/admin/model/retrain` - Force model retrain
- `GET /api/admin/model/export` - Export model as JSON
- `GET /api/admin/partners` - List all partners
- `POST /api/admin/partners` - Register new partner (returns credentials once)
- `PATCH /api/admin/partners/:id` - Update partner settings
- `POST /api/admin/partners/:id/rotate-secret` - Rotate partner credentials

## Partner API (Fraud Detection as a Service)

The system functions as an independent "Fraud Detection as a Service" API for partner companies who maintain their own separate user systems. Partners send login behavior data, we return fraud risk analysis.

### Partner Authentication
Partners authenticate via HTTP Basic Auth:
```
Authorization: Basic base64(client_id:client_secret)
```

### Partner Endpoints
- `POST /partner/api/analyze` - Analyze login behavior, returns risk score and decision
- `GET /partner/api/verify` - Verify partner API credentials
- `GET /partner/api/stats` - Get partner-specific analytics

### Partner Analyze Request
```json
{
  "userIdentifier": "user@example.com",
  "fingerprint": {
    "userAgent": "Mozilla/5.0...",
    "screenResolution": "1920x1080",
    "timezone": "America/New_York"
  },
  "typingMetrics": {
    "avgKeyDownTime": 80,
    "avgKeyUpTime": 40,
    "typingSpeed": 45
  },
  "ipAddress": "192.168.1.1"
}
```

### Partner Analyze Response
```json
{
  "sessionId": "sess_abc123",
  "riskScore": 35,
  "riskLevel": "low",
  "decision": "allow",
  "confidence": 80,
  "factors": {
    "deviceRisk": 5,
    "behaviorRisk": 10,
    "geoRisk": 15,
    "velocityRisk": 5
  },
  "recommendation": "Allow the login to proceed."
}
```

### Database Tables (Partner)
- **partners**: Partner company records (id, name, clientId, clientSecretHash, webhookUrl, isActive, rateLimitPerMinute, totalRequests, blockedRequests)
- **login_attempts.partnerId**: Foreign key linking attempts to partners

### Partner Portal Page
- Path: `/partners` (admin only)
- Manage partner registrations and API credentials
- View analytics per partner (requests, blocked, etc.)
- Rotate secrets and activate/deactivate partners