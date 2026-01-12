# Observability Dashboard

A full-stack observability dashboard for monitoring services, viewing logs in real-time, and tracking metrics.

## Features

- **Service Health Monitoring** - Real-time health status of configured services with automatic checks
- **Live Log Streaming** - WebSocket-powered log tailing with filtering and search capabilities
- **Metrics Dashboard** - Visual metrics and endpoint statistics with charts
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

## Prerequisites

- Node.js 18+
- PostgreSQL database
- Access to service log files

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

3. Create a `.env` file in the root directory:
```env
DASHBOARD_PORT=5100
LOG_DIR=/path/to/your/logs
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
AUTH_TOKEN=your-secret-token
```

4. Configure services to monitor in `server/config/services.js`

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

## Project Structure

```
observability-dashboard/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── context/        # React context (Auth)
│   │   ├── hooks/          # Custom hooks
│   │   ├── pages/          # Page components
│   │   └── utils/          # Utility functions
│   └── ...
├── server/                 # Express backend
│   ├── config/             # Service configuration
│   ├── db/                 # Database connection
│   ├── routes/             # API routes
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

## WebSocket Events

- `/logs` - Real-time log streaming
- `/health` - Real-time health status updates

## License

MIT
