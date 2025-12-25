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