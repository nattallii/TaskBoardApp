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
|   ├── profile-service/
|   ├── board-service/
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

**pytest** -
Primary testing framework for unit and integration tests.



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

- helm upgrade auth ./k8s/auth-service --install
- helm upgrade profile ./k8s/profile-service --install
- helm upgrade board ./k8s/board-service --install
####  Verify deployment
```
kubectl get nodes
kubectl get pods
kubectl get svc
```
#### Additional useful commands:
```
helm list
kubectl describe pod <pod-name>
```

#### Troubleshooting
```
kubectl logs <pod-name>
```

****
### 📌 Note

This project was created as an **internship / educational project** to practice backend development, containerization, and Kubernetes fundamentals.