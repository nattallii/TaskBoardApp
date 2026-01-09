## How to Start the Project (Docker)

1. From the project root (where docker-compose.yml is):

Build and start everything

`docker compose up -d --build  `

2️. Open FastAPI docs
http://localhost:8001/docs


3 Auth API
Register user
POST /api/v1/auth/register


Example body:

```
{
  "username": "natali",
  "email": "natali@gmail.com",
  "password": "password123"
}
```

4. Login
POST /api/v1/auth/login


Example body:
````
{
  "email": "natali@gmail.com",
  "password": "password123"
}

````

### Connect to Postgres
check if user creates

`docker exec -it fastapiproject-auth_db-1 psql -U authuser -d authdb`

`\dt`

`SELECT * FROM users;`


## Stop Containers
`docker compose down`

## Local Kubernetes setup хз чи працює

### Requirements

#### Install the following tools locally:

- Docker Desktop
- kubectl
- Minikube
- Helm
- (optional) PostgreSQL client (psql)

Verify installation:

- docker version
- kubectl version --client
- minikube version
- helm version

## startup
- minikube start
- helm upgrade auth ./k8s/auth-service --install
- helm upgrade profile ./k8s/profile-service --install
- helm upgrade board ./k8s/board-service --install
- kubectl get nodes

## 🐞 Troubleshooting
- kubectl logs -l app=auth
- kubectl logs -l app=profile
- kubectl logs -l app=board
