# TaskBoardApp
TaskBoardApp is a microservices-based backend application built with FastAPI.
The system is designed as a set of independent services responsible for authentication, user profiles, and task boards.

The project supports:

- Local development using Docker Compose

- Local Kubernetes deployment using Minikube + Helm

### Project Concept

TaskBoardApp is conceptually similar to Kanban-style tools such as Trello.
The application allows users to:

- create and manage boards

- organize tasks into columns (e.g. To Do, In Progress, Done)

- track task status and workflow progression



## Project Structure
```
.
├── .github/
|   ├── workflows/
|       ├──ci.yaml
├── services/
|   ├── auth-service/
|   │   ├── app/
|   │   └── tests/              # pytest suites live next to each service
|   ├── profile-service/
|   │   └── tests/
|   ├── board-service/
|   │   └── tests/
├── k8s/
│   ├── auth-service/
│   ├── profile-service/
│   └── board-service/
├── pylintrc
├── docker-compose.yml
└── README.md
```

## Tech Stack

### Backend

**FastAPI** - High-performance Python web framework used to build REST APIs.
Provides automatic OpenAPI/Swagger documentation, request validation, and async support.

**Pydantic** - Used for data validation and settings management.
PostgreSQL

**uv** - 
Fast Python package and environment manager written in Rust.
Used as a modern replacement for pip, pip-tools, and virtualenv.

### Databases

**PostgreSQL** - 
Relational database used by each microservice independently.
Ensures data isolation between services and simplifies scaling.

**SQLAlchemy / Alembic** - 
ORM for database interaction and schema migrations.
Docker & Docker Compose

### Containerization

**Docker** -
Used to containerize each microservice and its dependencies.

 **Docker Compose** -
Simplifies local development by running all services, databases, and RabbitMQ with a single command.

### Orchestration

**Kubernetes** (Minikube) -
Local Kubernetes cluster for simulating production-like deployments.

**Helm** -
Package manager for Kubernetes used to:

- deploy services consistently

- manage environment-specific configuration

- simplify upgrades and rollbacks

### Messaging

**RabbitMQ** -
Message broker used for asynchronous communication between microservices.
Enables event-driven architecture and decouples services.

### Testing

- **pytest** — each microservice exposes its own `services/<name>/tests` package. CI runs the suites with coverage; locally you can mirror this via `uv sync --group dev && uv run pytest` (see [Running Tests Locally](#running-tests-locally)).
- **Frontend lint/build** — the SPA reuses the same commands as CI: `npm run lint` and `npm run build`. Add `npm run test` once component/integration tests land. Instructions live in the [Frontend checks](#frontend-checks) section.
- **Security scanning** — CI also executes `pip-audit` per service. You can reproduce it manually as documented in [Security Scanning](#security-scanning).

### CI/CD

**GitHub Actions** (or GitLab CI)
Automated CI/CD pipelines for:

- running tests on each push and pull request
- building Docker images
- linting and code quality checks

- Pre-commit hooks
Enforce code style and formatting before commits.

**Typical CI pipeline stages:**

1. Install dependencies
2. Lint
3. Run tests (pytest)
4. Build Docker images
5. Push to registry
6. (Optional) Deploy to Kubernetes

## Architecture Overview

Auth Service — user registration and authentication

Profile Service — user profile management

Board Service — task boards and tasks management

PostgreSQL — separate database per service

RabbitMQ — message broker for inter-service communication

## Usefull Links
- [Helm Documentation](https://helm.sh/docs/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Minikube Documentation](https://minikube.sigs.k8s.io/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)

## Contributing
Contributors should follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification for creating commit messages.

## How to Start the Project 


### Run Locally with Docker
#### Requirements
- Docker Desktop

- Docker Compose (v2)

#### Verify installation:
```
docker version
docker compose version
```



### Start the Application:
1. From the project **root** (where docker-compose.yml is):


`docker compose up -d --build  `

This command will:

- build all Docker images

- start all services and databases

- expose APIs on localhost


2. Open FastAPI docs:

- http://localhost:8001/docs - auth service

- http://localhost:8002/docs - profile service

- http://localhost:8003/docs - board service


### One-command local launcher (backend + frontend)

On Windows, run both backend services and the frontend dev server with:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/start-local.ps1
```

Optional flags:

- `-SkipFrontendInstall` — avoid running `npm install` if `node_modules/` already exists.

What the script does:

1. Executes `docker compose up -d --build` from the repo root.
2. Enters `frontend/`, installs deps if needed, then starts `npm run dev`.

Stop the frontend with `Ctrl+C` and bring services down later via `docker compose down`.


### API Documentation
FastAPI Swagger UI (Auth service):
```
http://localhost:8001/docs
```

Register user:

**POST** /api/v1/auth/register


Example body:

```
{
  "username": "natali",
  "email": "natali@gmail.com",
  "password": "password123"
}
```

Login:

**POST** /api/v1/auth/login


Example body:
````
{
  "email": "natali@gmail.com",
  "password": "password123"
}

````

### Connect to PostgreSQL (Auth Service)
Check if the user was created:
```
docker exec -it fastapiproject-auth_db-1 psql -U authuser -d authdb
\dt
SELECT * FROM users;
```

### Stop Containers
```
docker compose down
```
## Running Tests Locally

Each backend service keeps its own virtual environment requirements. We rely on **uv** to install dev dependencies and run pytest. To execute the suites locally:

1. Pick a service (auth/profile/board) and navigate into it, e.g.
   ```bash
   cd services/board_service
   ```
2. Install dependencies (including dev extras used in CI):
   ```bash
   uv sync --group dev
   ```
3. Run pytest:
   ```bash
   uv run pytest
   ```
   - The board service additionally collects coverage in CI. If you want identical output locally:
     ```bash
     uv run pytest --cov=app --cov-report=term-missing
     ```

### Frontend checks

From `frontend/` run the same commands used in GitHub Actions:

```bash
npm ci          # first time only
npm run lint
npm run build
```

## Security Scanning

Continuous Integration runs **pip-audit** for each backend service (see `.github/workflows/ci.yml`). You can reproduce it locally as follows:

```bash
cd services/<service_name>
uv export --format requirements-txt --output-file requirements.txt
pip install pip-audit
pip-audit -r requirements.txt
```

This reports vulnerable dependencies before they get deployed. Feel free to run it pre-commit, especially when touching dependency files.

## Run Locally with Kubernetes (Minikube)
⚠️ Kubernetes setup is intended for local development and testing only.

### Requirements

#### Install the following tools locally:

- Docker Desktop
- kubectl
- Minikube
- Helm
- (optional) PostgreSQL client (psql)

Verify installation:
```
 docker version
 kubectl version --client
 minikube version
 helm version
```
### Kubernetes Startup
#### Start Minikube
`minikube start`
#### Deploy services using Helm

- cd k8s
- helm dependency update
- helm install k8s-test .

####  Verify deployment
```
kubectl get nodes
kubectl get pods
kubectl get svc
```

### Check API locally
- `kubectl port-forward pod/<pod name> 8001:8000 `
- `kubectl port-forward pod/<pod name> 8002:8000 `
- `kubectl port-forward pod/<pod name> 8003:8000 `


#### Additional useful commands:
```
helm list
kubectl describe pod <pod-name>
```

#### Troubleshooting
```
kubectl logs <pod-name>
```

### Frontend + Ingress (Minikube)

This project uses a global NGINX Ingress to expose backend services.

When running the project locally with **Minikube**, the Ingress controller
is exposed via a `LoadBalancer` service.

⚠️ Minikube does not provide a real cloud LoadBalancer.
To make Ingress accessible on `http://localhost`, you must run:

```bash
minikube tunnel
```
Keep this command running in a separate terminal while using the frontend.

Without minikube tunnel, the frontend will not be able to reach the backend
through Ingress.

**Example requests**
```commandline
POST http://localhost/auth/api/v1/auth/login
GET http://localhost/profile/api/v1/profile/me
POST http://localhost/board/api/v1/boards
```
### Important: API path prefixes ⚠️

All backend services are exposed behind Ingress path prefixes.

This means that every frontend request MUST include the correct prefix.
Requests without the prefix will return 404 Not Found.

The prefix is defined by:

the Ingress path (/auth, /profile, /board)

API versioning inside the service (/api/v1/...)

Use exact paths as shown in Swagger UI.

****
### 📌 Note

This project was created as an **internship / educational project** to practice backend development, containerization, and Kubernetes fundamentals.