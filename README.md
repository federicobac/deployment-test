# Deployment Test

A full-stack application consisting of a React frontend, a .NET 10 Web API, and an Nginx reverse proxy. The application runs locally using Docker Compose and is deployed to Fly.io.

## Architecture

The application consists of three services:

- **Nginx:** Acts as the reverse proxy and entry point for incoming requests.
- **Frontend:** A React application running with Bun.
- **Backend:** A .NET 10 Web API.

### Request flow

```text
                  Browser
                     |
                     v
               Nginx :8080
                /       \
               /         \
              v           v
        Frontend        Backend
        React/Bun       .NET API
         :3000           :4000
```

Nginx forwards requests according to their URL:

| Request | Destination |
|---|---|
| `/` | React frontend |
| `/api/` | .NET API |
| `/healthz` | Nginx health-check endpoint |

The frontend communicates with the backend using the relative URL `/api/`. This allows both services to communicate through the same public origin without requiring a separate API address in the frontend.

## Project structure

```text
deployment-test/
│
├── client/
│   ├── Dockerfile
│   └── src/
│       └── App.tsx
│
├── server/
│   ├── API/
│   │   └── Program.cs
│   ├── Service/
│   ├── Infra/
│   └── Dockerfile
│
├── nginx/
│   └── default.conf.template
│
├── Dockerfile
├── compose.yaml
├── compose.fly.yaml
├── fly.toml
├── fly.nginx.toml
└── .dockerignore
```

## Docker Compose

The repository contains two Compose configurations for different environments.

### Local development — `compose.yaml`

Builds all three services from the local source code.

- Nginx uses the root `Dockerfile`.
- The frontend is built from `client/`.
- The backend is built from `server/`.
- Nginx communicates with the other services using their Docker Compose service names (`web` and `api`).
- Only Nginx publishes a port to the host machine: `localhost:8080`.

Start the application:

```powershell
docker compose up -d --build
```

Check the running containers:

```powershell
docker compose ps
```

Stop the application:

```powershell
docker compose down
```

### Fly.io deployment — `compose.fly.yaml`

Uses prebuilt Docker Hub images for the frontend and backend, while building Nginx from the repository.

- Frontend: `federicobac/deployment-test-web:latest`
- Backend: `federicobac/deployment-test-api:latest`
- Nginx: built using the root `Dockerfile`.

The Fly.io configuration uses `127.0.0.1` for the frontend and backend addresses because the containers share a network namespace within the Fly Machine.

## Nginx configuration

The Nginx configuration is located in:

```text
nginx/default.conf.template
```

The root `Dockerfile` uses the official Nginx Alpine image and copies this template into the Nginx templates directory.

Environment variables define the upstream addresses:

- `WEB_HOST`: Frontend address.
- `API_HOST`: Backend address.

Nginx forwards frontend requests to port `3000` and API requests to port `4000`. It also exposes `/healthz`, which returns `200 OK` for Fly.io health checks.

## Fly.io deployment

The reverse-proxy application is deployed as a separate Fly.io app:

**Application:** `deployment-test-proxy`

**Public URL:** https://deployment-test-proxy.fly.dev/

The deployment configuration is:

```text
fly.nginx.toml
```

It references `compose.fly.yaml` and configures:

- Application name: `deployment-test-proxy`
- Primary region: `arn`
- Internal HTTP port: `8080`
- Health-check endpoint: `/healthz`
- Shared CPU: 1 CPU
- Memory: 512 MB

Deploy from the repository root:

```powershell
fly deploy --config fly.nginx.toml
```

Check deployment status:

```powershell
fly status --app deployment-test-proxy
```

View application logs:

```powershell
fly logs --app deployment-test-proxy
```

## Technologies

- React
- Bun
- .NET 10
- Docker
- Docker Compose
- Nginx
- Docker Hub
- Fly.io

## Current deployment

The application is deployed and accessible at:

**https://deployment-test-proxy.fly.dev/**

The frontend displays the response from the .NET API:

```json
{
  "message": "Hello from the .NET API!",
  "application": "Deployment Exercise",
  "status": "Running"
}
```

This confirms that the frontend, Nginx reverse proxy, and backend API are communicating successfully.
