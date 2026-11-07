Deployment Test --- React, .NET API, Nginx and Fly.io
A multi-container deployment exercise demonstrating how to run a React
frontend and a .NET API behind an Nginx reverse proxy, first with Docker
Compose locally and then on Fly.io.
Table of contents
- Overview
- Architecture
- Repository structure
- How requests flow through the
  application
- Technologies
- Run locally
- How the Nginx reverse proxy
  works
- Docker images
- Fly.io deployment
- Configuration files
- Useful commands
- Verification performed
- Important notes
Overview
This repository contains a small full-stack application made up of three
services:
1. Frontend --- a React application running with Bun.
2. Backend --- a .NET 10 minimal API.
3. Reverse proxy --- Nginx, which provides one public entry point
   and routes requests to the correct service.
The application was first assembled and tested locally using Docker
Compose. The frontend and backend container images were then published
to Docker Hub. A separate Compose configuration and Fly.io configuration
were added to deploy the application to Fly.io.

The public application is:

https://deployment-test-proxy.fly.dev/

The frontend displays a message returned by the .NET API, proving that
the frontend-to-backend request works through Nginx in the deployed
environment.
Architecture
                         Browser
                            |
                            | HTTPS
                            v
                 Fly.io public application
                            |
                            v
                    Nginx reverse proxy
                       port 8080
                       /       \
                      /         \
             path "/"           path "/api/"
                 |                   |
                 v                   v
          React / Bun             .NET API
           port 3000              port 4000
Nginx is the entry point for incoming HTTP requests. The frontend and
backend are not exposed as separate public services in this
architecture.
Services and ports
  Service   Technology      Container port Purpose
  nginx   Nginx                     8080 Public entry point and request routing
web     Bun / React               3000 Serves the frontend
api     .NET 10                   4000 Provides API endpoints

Locally, only Nginx publishes a port to the host computer:
127.0.0.1:8080. The frontend and API ports are exposed to the other
containers but are not published directly to the host.
Repository structure
The main files and directories are:
deployment-test/
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
Directory and file responsibilities
- client/ contains the React frontend and its Docker build
  instructions.
- server/ contains the .NET API and the server-side project
  structure. The API is in server/API; Service and Infra are the
  other solution layers.
- nginx/default.conf.template is the Nginx configuration template.
  It is processed when the Nginx container starts.
- The root Dockerfile builds the Nginx image.
- compose.yaml defines the local development environment.
- compose.fly.yaml defines the Fly.io multi-container deployment
  services.
- fly.toml is the original Fly configuration for the earlier
  frontend deployment. It is kept separate and should not be
  overwritten by the reverse-proxy deployment configuration.
- fly.nginx.toml configures the new Fly.io application and points
  Fly to compose.fly.yaml.
- .dockerignore prevents unnecessary files from being sent to Docker
  during image builds.
How requests flow through the application
1. Loading the frontend
When a user opens:
https://deployment-test-proxy.fly.dev/
Fly.io sends the request to the Nginx service on port 8080. Nginx
matches the / location and forwards the request to the frontend
service on port 3000.
2. Calling the backend
The frontend calls the API using a relative URL:
fetch("/api/")
This is intentional. The browser sends the request to the same origin
that served the frontend. Nginx receives the /api/ request and
forwards it to the .NET API on port 4000.

The backend responds with JSON similar to:
{
  "message": "Hello from the .NET API!",
  "application": "Deployment Exercise",
  "status": "Running"
}
The frontend reads the response and displays the API message on the
page.

Using a relative URL means the frontend does not need a hard-coded API
hostname for local and deployed environments.
Technologies
- React --- frontend user interface.
- Bun --- JavaScript runtime and tooling used by the frontend.
- .NET 10 --- backend API.
- Docker --- packages the services into container images.
- Docker Compose --- defines and runs the multi-container
  application.
- Nginx --- reverse proxy between the browser and the application
  services.
- Docker Hub --- stores the prebuilt frontend and API images.
- Fly.io --- hosts the deployed application.
Run locally
Run these commands from the repository root.
1. Check the Compose configuration
docker compose config
This parses compose.yaml and displays the resolved configuration. It
helps catch YAML and Compose configuration errors before starting the
services.
2. Build the images
docker compose build
Compose builds the Nginx, frontend, and API images using their
respective Dockerfiles.
3. Start the application
docker compose up -d
The -d option runs the containers in the background.
4. Check the containers
docker compose ps
The nginx, web, and api services should be running.
5. Test the frontend through Nginx
Invoke-WebRequest http://localhost:8080/ -UseBasicParsing
The expected result is HTTP 200 OK and the frontend HTML.
6. Test the API through Nginx
Invoke-RestMethod http://localhost:8080/api/
The expected response contains:
- message: Hello from the .NET API!
- application: Deployment Exercise
- status: Running
7. Test the Nginx health endpoint
Invoke-WebRequest http://localhost:8080/healthz -UseBasicParsing
The expected response is HTTP 200 OK with the text OK.
8. Stop the local application
docker compose down
This stops and removes the containers and the default Compose network.
It does not delete the source code or built images.
How the Nginx reverse proxy works
The root Dockerfile uses the official lightweight Nginx Alpine image
and copies the configuration template into:
/etc/nginx/templates/default.conf.template
The official Nginx image processes templates in this directory when the
container starts. Environment variables are substituted into the
configuration.

The template uses two variables:
- WEB_HOST --- hostname or address of the frontend.
- API_HOST --- hostname or address of the backend.
API route
The configuration contains:
location /api/ {
    proxy_pass http://${API_HOST}:4000/;
}
Requests beginning with /api/ are sent to the backend. The trailing
slash in the proxy_pass URL means Nginx replaces the matching /api/
location prefix with / when forwarding the request.

For example:
Browser request:  /api/
Backend receives: /
Frontend route
The configuration contains:
location / {
    proxy_pass http://${WEB_HOST}:3000;
}
Requests that do not match the API or health-check route are forwarded
to the frontend.
Health endpoint
Nginx also provides:
/healthz
It responds directly with 200 OK and OK. Fly.io uses this endpoint
for its application health checks.
Forwarded headers
The proxy configuration forwards headers such as Host, X-Real-IP,
X-Forwarded-For, and X-Forwarded-Proto. These help the upstream
service identify the original request host, client address, and
protocol.
Docker images
The frontend and backend images were built and published to Docker Hub
so Fly.io can use prebuilt images instead of building every service from
source during deployment.

  Service    Docker Hub image
  Frontend   federicobac/deployment-test-web:latest
Backend    federicobac/deployment-test-api:latest

The Nginx image is built from the root Dockerfile as part of the
Fly.io Compose deployment.

To rebuild and publish the frontend image:
docker build -t federicobac/deployment-test-web:latest ./client
docker push federicobac/deployment-test-web:latest
To rebuild and publish the API image:
docker build -t federicobac/deployment-test-api:latest ./server
docker push federicobac/deployment-test-api:latest
A Docker Hub login is required before pushing:
docker login
Do not put Docker Hub passwords or access tokens in this repository.
Fly.io deployment
The reverse-proxy deployment uses a separate Fly.io app:
deployment-test-proxy
Its public URL is:
https://deployment-test-proxy.fly.dev/
Why there is a separate Fly Compose file
The local Compose file builds all three services from the source
repository. The Fly deployment Compose file uses a different approach:
- Nginx is built from the root Dockerfile.
- The frontend uses the prebuilt Docker Hub image.
- The backend uses the prebuilt Docker Hub image.
This keeps the local development configuration and cloud deployment
configuration separate.
Fly.io network configuration
In the Fly Compose deployment, the Nginx environment variables are set
to:
environment:
  API_HOST: "127.0.0.1"
  WEB_HOST: "127.0.0.1"
The services in a Fly Compose Machine share a network namespace.
Therefore, the Nginx container can reach the other containers through
the shared loopback interface, using their respective ports.

This differs from the local Docker Compose setup, where Nginx uses the
Compose service names:
environment:
  API_HOST: "api"
  WEB_HOST: "web"
Fly configuration
fly.nginx.toml selects the app, region, Compose file, public service
port, health check, and VM resources.

Important settings include:
- App: deployment-test-proxy
- Region: arn
- Compose file: compose.fly.yaml
- Internal HTTP port: 8080
- Health-check path: /healthz
- VM: shared CPU, one CPU, 512 MB memory
The fly.toml file is retained for the earlier deployment and is not
the configuration used for this reverse-proxy deployment.
Deploy
From the repository root:
fly deploy --config fly.nginx.toml
Fly validates the configuration, builds the Nginx image, pushes it to
the Fly registry, and provisions or updates the application's Machines.
Check deployment status
fly status --app deployment-test-proxy
The deployment was verified with two Machines in the arn region. Both
reported the started state and one passing health check.
Test the deployed application
Test the public frontend:
Invoke-WebRequest https://deployment-test-proxy.fly.dev/ -UseBasicParsing
Expected result: HTTP 200 OK.

Test the backend through the public Nginx route:
Invoke-RestMethod https://deployment-test-proxy.fly.dev/api/
Expected response:
message                  application         status
-------                  -----------         ------
Hello from the .NET API! Deployment Exercise Running
The frontend was also opened in a browser and displayed:
# My application is deployed on Fly.io!

## .NET API Connection

Message: Hello from the .NET API!
Application: Deployment Exercise
Status: Running
This verifies that the deployed frontend can call the deployed API
through Nginx.
Configuration files
There are two Compose files because local development and Fly.io
deployment have different requirements.

  File                 Purpose             Frontend and API
  compose.yaml       Local development   Built from local source
compose.fly.yaml   Fly.io deployment   Pulled from Docker Hub

There are also two Fly configuration files:

  File               Purpose
  fly.toml         Earlier Fly deployment configuration
fly.nginx.toml   Nginx reverse-proxy deployment

When working on the reverse-proxy deployment, use fly.nginx.toml
explicitly so that the earlier configuration is not accidentally
selected.
Useful commands
Run these from the repository root.
  Task                                Command
  Validate local Compose file         docker compose config

  Build local services                docker compose build

  Start local services                docker compose up -d

  List local containers               docker compose ps

  View local logs                     docker compose logs

  Follow local logs                   docker compose logs -f

  Stop local services                 docker compose down

  Validate Fly configuration          fly config validate --config fly.nginx.toml

  Deploy to Fly.io                    fly deploy --config fly.nginx.toml

  Check Fly app status                fly status --app deployment-test-proxy
View Fly logs                       fly logs --app deployment-test-proxy
Verification performed
The following checks were completed during the exercise:
Local environment
- Docker Compose configuration parsed successfully.
- All three images built successfully.
- All three containers started.
- Only Nginx published a host port.
- The frontend returned HTTP 200 OK through Nginx.
- The API returned the expected JSON through /api/.
- The Nginx /healthz endpoint returned 200 OK.
Cloud environment
- Frontend and API images were pushed to Docker Hub.
- The Fly.io app deployment-test-proxy was created.
- Fly configuration validation succeeded.
- Fly built and deployed the Nginx image.
- Two Fly Machines started in the arn region.
- Both Machines reported passing health checks.
- The public frontend returned HTTP 200 OK.
- The public /api/ route returned the expected .NET API JSON.
- The frontend displayed the API response in the browser.
Important notes
1. The health check is not a full end-to-end check. /healthz is
   answered directly by Nginx. The separate public frontend and API
   tests were therefore necessary to verify the complete request path.
2. depends_on controls startup order, not application readiness.
   It does not guarantee that the frontend or API is ready to accept
   requests when Nginx starts.
3. The Fly and local network addresses differ. Local Compose uses
   service DNS names (api and web); the Fly Compose configuration
   uses 127.0.0.1 because the containers share a network namespace.
4. Keep secrets out of Git. Never commit passwords, access tokens,
   or other credentials.
5. The Fly app may stop Machines when idle. The configuration
   enables automatic stopping and starting. Fly can start a stopped
   Machine when a request arrives, so the first request after idle may
   take longer.
Result
The exercise's main technical goal has been achieved: a React frontend
and a .NET API run behind an Nginx reverse proxy, using Docker Compose
locally and a separate Compose-based configuration on Fly.io.

The deployed application is available at:

https://deployment-test-proxy.fly.dev/
