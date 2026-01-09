# FSDH Staff Portal

Frontend React application for FSDH staff to manage custody operations. This is a single-page application (SPA) that provides staff with operational tools for instruction approval, reconciliation management, client administration, and system monitoring.

## Features

- 🔐 **Secure Authentication** - JWT-based auth with MFA support
- 📊 **Operational Dashboard** - Real-time KPIs and metrics
- ✅ **Instruction Approval** - Maker-checker workflow for instruction approval/rejection
- 🔄 **Reconciliation Management** - View and resolve reconciliation breaks
- ⚠️ **Exception Handling** - Manage and resolve exceptions
- 👥 **Client Management** - View and manage client accounts
- 👤 **User Management** - Admin-only user administration
- 📈 **Reports** - Generate operational reports
- 🔍 **Audit Logs** - View system audit trail
- ⚙️ **Settings** - System configuration

## Technology Stack

- **React 18+** - UI library
- **Vite** - Build tool and dev server
- **Material-UI (MUI)** - Component library
- **React Router** - Navigation
- **Axios** - HTTP client
- **Lucide React** - Icons
- **Formik + Yup** - Form handling and validation

## Prerequisites

- Node.js v18 or higher
- npm or yarn
- Custody Core Solution backend running

## Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Configure environment**:
Create a `.env` file:
```
VITE_CORE_API=http://localhost:3000
VITE_ENABLE_MOCKS=false
```

3. **Start development server**:
```bash
npm run dev
```

The app will be available at `http://localhost:5174`

## Role-Based Access

The portal supports role-based access control:

- **Admin** - Full access to all features
- **Checker** - Can approve/reject instructions
- **Maker** - Can create and submit instructions
- **Viewer** - Read-only access

Menu items are filtered based on user role.

## Project Structure

```
staff-portal/
├── src/
│   ├── components/          # Reusable components
│   │   └── Layout/         # Main layout with navigation
│   ├── contexts/           # React contexts (Auth)
│   ├── pages/              # Page components
│   │   ├── Auth/           # Login, MFA
│   │   ├── Dashboard/      # Operational dashboard
│   │   ├── Instructions/   # Instruction management & approval
│   │   ├── Reconciliations/# Reconciliation management
│   │   ├── Exceptions/      # Exception handling
│   │   ├── Clients/         # Client management
│   │   ├── Users/           # User management (admin only)
│   │   ├── Reports/         # Reports generation
│   │   ├── Audit/           # Audit log viewer
│   │   └── Settings/        # System settings
│   ├── services/           # API service wrappers
│   ├── theme.js            # MUI theme
│   ├── App.jsx             # Main app component
│   └── main.jsx            # Entry point
├── package.json
├── vite.config.js
└── README.md
```

## API Integration

The portal integrates with the Custody Core Solution backend via REST APIs:

- **Authentication**: `/api/auth/*`
- **Instructions**: `/api/trades/instructions/*`
- **Reconciliations**: `/api/reconciliations/*`
- **Exceptions**: `/api/exceptions/*`
- **Clients**: `/api/clients/*`
- **Users**: `/api/users/*`
- **Reports**: `/api/reports/*`
- **Audit**: `/api/audit/*`

## Development

The staff portal runs on port 5174 (different from the client portal which runs on 5173) to allow both portals to run simultaneously during development.

## Deployment

The staff portal can be deployed to Vercel, Netlify, or any static hosting service. Make sure to set the `VITE_CORE_API` environment variable to point to your deployed backend API Gateway.
