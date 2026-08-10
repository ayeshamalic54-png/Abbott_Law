# Abbott Law College Management System - Local Setup Guide

This guide explains how to run the Abbott Law College Management System on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** (optional, for cloning)

## Step 1: Clone or Download the Project

```bash
# Clone the repository (if using git)
git clone <your-repository-url>
cd abbott-law-college

# Or extract the downloaded zip file and navigate to the folder
```

## Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- `express` - Backend server
- `react` - Frontend framework
- `drizzle-orm` - Database ORM
- `@neondatabase/serverless` - Neon PostgreSQL driver
- `bcrypt` - Password hashing
- `dotenv` - Environment variable management
- `cross-env` - Cross-platform environment variables

## Step 3: Create Environment File

Create a `.env` file in the root directory with your database credentials:

```bash
# Create .env file
touch .env
```

Add the following content to `.env`:

```env
# Database Configuration (Neon PostgreSQL)
DATABASE_URL=postgresql://username:password@your-neon-host.neon.tech/database_name?sslmode=require

# Individual PostgreSQL settings (these override DATABASE_URL if set)
PGHOST=your-neon-host.neon.tech
PGDATABASE=your_database_name
PGUSER=your_username
PGPASSWORD=your_password
PGPORT=5432

# Session Secret (generate a random string)
SESSION_SECRET=your-super-secret-session-key-here-make-it-long-and-random

# Node Environment
NODE_ENV=development
```

### Getting Your Neon Database Credentials

1. Go to [Neon Console](https://console.neon.tech/)
2. Select your project
3. Go to "Connection Details"
4. Copy the connection string (DATABASE_URL)
5. Or copy individual credentials (host, database, user, password)

## Step 4: Push Database Schema

Initialize your database tables:

```bash
npm run db:push
```

This will create all the required tables in your Neon database.

## Step 5: Run the Development Server

```bash
npm run dev
```

The application will start on **http://localhost:5000**

## Step 6: Access the Application

Open your browser and go to:
```
http://localhost:5000
```

### Default Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Accountant | accountant | acc123 |
| Receptionist | receptionist | rec123 |
| Teacher | teacher | teacher123 |
| Library Staff | library | lib123 |
| Hazara University | hazara | hazara123 |
| Pakistan Bar Council | pbc | pbc123 |

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (backend + frontend) |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run db:push` | Push schema changes to database |
| `npm run check` | Run TypeScript type checking |

## Project Structure

```
abbott-law-college/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utilities
├── server/                 # Backend Express server
│   ├── index.ts            # Server entry point
│   ├── routes.ts           # API routes
│   ├── db.ts               # Database connection
│   └── storage.ts          # Data access layer
├── shared/                 # Shared code
│   └── schema.ts           # Database schema (Drizzle)
├── migrations/             # Database migrations
├── .env                    # Environment variables (create this)
├── package.json            # Dependencies
└── LOCAL_SETUP.md          # This file
```

## Troubleshooting

### Error: Cannot connect to database
- Verify your DATABASE_URL is correct in `.env`
- Ensure your Neon database is active
- Check if SSL mode is set to `require` in connection string

### Error: bcrypt installation fails
On Windows, you may need:
```bash
npm install --global windows-build-tools
```

Or use bcryptjs instead (already compatible).

### Error: Port 5000 already in use
Kill the process using port 5000:
```bash
# On Mac/Linux
lsof -ti:5000 | xargs kill -9

# On Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Error: Module not found
Reinstall dependencies:
```bash
rm -rf node_modules
rm package-lock.json
npm install
```

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| DATABASE_URL | Yes | Full PostgreSQL connection string |
| PGHOST | Optional | Database host (overrides DATABASE_URL) |
| PGDATABASE | Optional | Database name |
| PGUSER | Optional | Database username |
| PGPASSWORD | Optional | Database password |
| PGPORT | Optional | Database port (default: 5432) |
| SESSION_SECRET | Yes | Secret key for session encryption |
| NODE_ENV | Optional | Environment (development/production) |

## Support

For any issues or questions, please contact the development team.
