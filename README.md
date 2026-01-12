# Observability Dashboard

A full-stack observability dashboard for monitoring services, viewing logs in real-time, and tracking metrics. Supports multiple environments (DEV, STAGING, HOTFIX, PROD) with both local and AWS service monitoring.

## Features

- **Multi-Environment Support** - Switch between DEV, STAGING, HOTFIX, and PROD environments
- **Service Health Monitoring** - Real-time health status for both local and AWS API Gateway services
- **Live Log Streaming** - WebSocket-powered log tailing with filtering and search capabilities
- **Metrics Dashboard** - Visual metrics and endpoint statistics with charts
- **Multi-Database Support** - Connect to different PostgreSQL databases per environment
- **Authentication** - Token-based authentication for secure access

## Tech Stack

### Frontend
- React 18
- Vite
- Tailwind CSS
- Recharts (for data visualization)
- Socket.IO Client (real-time updates)
- React Router

### Backend
- Node.js / Express
- Socket.IO (WebSocket server)
- PostgreSQL (via pg)
- Tail (log file monitoring)
- Axios (AWS health checks)

## Prerequisites

- Node.js 18+
- PostgreSQL database
- Access to service log files (for local monitoring)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/junnyea/observability-dashboard.git
cd observability-dashboard
```

2. Install dependencies:
```bash
npm run install:all
```

3. Create a `.env` file from the example:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
```env
NODE_ENV=DEV
DASHBOARD_PORT=5100
AUTH_TOKEN=your-secret-token

# Development Database
DB_HOST=192.168.50.90
DB_PORT=5432
DB_DATABASE=bulwark
DB_USER=postgres
DB_PASSWORD=postgres

# Production Database (optional)
DB_HOST_PROD=your-prod-host.rds.amazonaws.com
DB_DATABASE_PROD=bulwark_prod
DB_USER_PROD=prod_user
DB_PASSWORD_PROD=your-secure-password
```

## Usage

### Development

Run the backend server:
```bash
npm run dev
```

Run the frontend (in a separate terminal):
```bash
cd client
npm run dev
```

### Production

Build the frontend:
```bash
npm run build:client
```

Start the server:
```bash
npm start
```

The dashboard will be available at `http://localhost:5100`

## Environment Configuration

The dashboard supports 4 environments:

| Environment | Description | Service Checks |
|-------------|-------------|----------------|
| **DEV** | Local development | Local ports + AWS |
| **STAGING** | Staging/QA | AWS only |
| **HOTFIX** | Hotfix testing | Local + AWS |
| **PROD** | Production | AWS only |

### AWS Service URLs

AWS API Gateway endpoints are pre-configured in `server/config/environments.js`:

- **tenant-svc**: Tenant management service
- **checkin-svc**: Check-in service
- **config-svc**: Configuration service

## Project Structure

```
observability-dashboard/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard/      # Dashboard components
│   │   │   ├── Environment/    # Environment switcher
│   │   │   ├── Layout/         # Layout components
│   │   │   ├── Logs/           # Log viewer components
│   │   │   └── Metrics/        # Metrics components
│   │   ├── context/        # React context (Auth)
│   │   ├── hooks/          # Custom hooks
│   │   ├── pages/          # Page components
│   │   └── utils/          # Utility functions
│   └── ...
├── server/                 # Express backend
│   ├── config/
│   │   ├── environments.js # Environment configuration
│   │   └── services.js     # Service configuration
│   ├── db/                 # Database connection
│   ├── routes/
│   │   ├── environment.js  # Environment API
│   │   ├── health.js       # Health API
│   │   ├── logs.js         # Logs API
│   │   └── metrics.js      # Metrics API
│   ├── services/           # Business logic
│   ├── sockets/            # WebSocket handlers
│   └── index.js            # Server entry point
└── scripts/                # Utility scripts
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Server health check |
| `POST /api/auth/login` | Authenticate user |
| `GET /api/health` | Service health statuses |
| `GET /api/metrics` | Service metrics |
| `GET /api/logs` | Historical logs |
| `GET /api/info` | Dashboard info |
| `GET /api/environment` | Get current environment |
| `POST /api/environment/switch` | Switch environment |
| `GET /api/environment/database` | Database connection status |
| `GET /api/environment/database/all` | All environments DB status |

## WebSocket Events

- `/logs` - Real-time log streaming
- `/health` - Real-time health status updates

## License

MIT
