# Abbott Law College Management System

## Overview

This is a comprehensive college management system for Abbott Law College, Mansehra (affiliated with Hazara University). The platform handles institutional operations across multiple domains including student admissions, fee management, attendance tracking, library management, payroll, and academic records. The system supports 7 distinct user roles (admin, accountant, receptionist, teacher, library staff, student, university) with role-based access control and dashboards.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack React Query for server state and data fetching
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom theme configuration and CSS variables for theming
- **Form Handling**: React Hook Form with Zod validation schemas

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Session Management**: Express-session with cookie-based authentication
- **API Design**: RESTful JSON API endpoints under `/api/*` prefix

### Database Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL (configured for Neon serverless PostgreSQL)
- **Schema Location**: `shared/schema.ts` - shared between frontend and backend
- **Migrations**: Drizzle Kit for schema migrations stored in `/migrations`

### Authentication & Authorization
- **Method**: Session-based authentication with HTTP-only cookies
- **Password Hashing**: bcrypt for secure password storage
- **Role-Based Access**: 7 user roles with distinct permissions and dashboard views

### Project Structure
```
├── client/src/          # React frontend application
│   ├── components/      # Reusable UI components
│   ├── pages/           # Page components organized by feature
│   ├── hooks/           # Custom React hooks (useAuth, etc.)
│   └── lib/             # Utilities and query client setup
├── server/              # Express backend
│   ├── routes.ts        # API route definitions
│   ├── db.ts            # Database connection
│   └── index.ts         # Server entry point
├── shared/              # Shared code between frontend/backend
│   └── schema.ts        # Drizzle schema definitions
└── migrations/          # Database migration files
```

### Key Design Patterns
- **Monorepo Structure**: Single repository with client/server/shared directories
- **Path Aliases**: `@/` for client source, `@shared/` for shared code
- **Type Safety**: Shared Zod schemas for runtime validation and TypeScript types
- **Component Architecture**: Feature-based page organization with reusable UI primitives

## External Dependencies

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL database via `@neondatabase/serverless`
- **Connection**: WebSocket-based connection for serverless environments

### UI Framework
- **Radix UI**: Full suite of accessible, unstyled primitives (dialog, dropdown, tabs, etc.)
- **Shadcn/ui**: Pre-configured component library with New York style variant
- **Lucide React**: Icon library

### Development Tools
- **Vite**: Frontend build tool with HMR
- **Drizzle Kit**: Database migration and push tooling
- **TSX**: TypeScript execution for server development

### Replit-Specific
- **@replit/vite-plugin-runtime-error-modal**: Error overlay for development
- **@replit/vite-plugin-cartographer**: Development tooling
- **connect-pg-simple**: PostgreSQL session store (when sessions need persistence)