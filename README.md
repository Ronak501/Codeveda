# Codeveda Full-Stack Environment Setup (Windows)

This workspace is now initialized with Git and ready for full-stack development.

## 1) Verify tools already installed

Run:

```powershell
node -v
npm -v
yarn -v
git --version
```

Detected in this machine:
- Node.js: v22.15.1
- npm: 11.12.1
- Yarn: 1.22.22
- Git: 2.46.2

## 2) Install/repair VS Code command line (`code`)

If `code --version` fails in PowerShell:
1. Open VS Code.
2. Press `Ctrl+Shift+P`.
3. Run: `Shell Command: Install 'code' command in PATH` (if shown).
4. Restart terminal and run:

```powershell
code --version
```

Alternative (Windows): ensure this path is in your user PATH:

```text
C:\Users\<YOUR_USER>\AppData\Local\Programs\Microsoft VS Code\bin
```

## 3) Install a database (choose one)

Detected on this machine:
- `winget`: not available in current terminal
- `choco`: available
- `scoop`: available

### Option A: MongoDB (NoSQL)
Install (choose one package manager):

```powershell
# Chocolatey
choco install mongodb -y

# Scoop
scoop install mongodb

# Winget (if available in your environment)
winget install --id MongoDB.Server --source winget
```

Verify:

```powershell
mongod --version
mongosh --version
```

### Option B: PostgreSQL (SQL)
Install:

```powershell
# Chocolatey
choco install postgresql -y

# Winget (if available)
winget install --id PostgreSQL.PostgreSQL --source winget
```

Verify:

```powershell
psql --version
```

### Option C: MySQL (SQL)
Install:

```powershell
# Chocolatey
choco install mysql -y

# Winget (if available)
winget install --id Oracle.MySQL --source winget
```

Verify:

```powershell
mysql --version
```

## 4) GitHub repository setup

### Create and commit locally

```powershell
git status
git add .
git commit -m "chore: initialize full-stack setup workspace"
```

If commit fails due to missing identity:

```powershell
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

### Connect to GitHub remote

After creating an empty GitHub repo (web UI), run:

```powershell
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO>.git
git push -u origin main
```

If you use GitHub CLI:

```powershell
gh repo create <YOUR_REPO> --public --source . --remote origin --push
```

## 5) Basic Git commands to practice

```powershell
git status
git log --oneline --graph --decorate --all
git checkout -b feature/my-change
git add .
git commit -m "feat: add <something>"
git push -u origin feature/my-change
git checkout main
git pull
```

## 6) Basic terminal commands (PowerShell)

```powershell
Get-Location                # show current folder
Get-ChildItem               # list files/folders (ls)
Set-Location .\folderName   # move into folder (cd)
Set-Location ..             # move up one folder
New-Item notes.txt          # create file
New-Item src -ItemType Directory  # create folder
Remove-Item notes.txt       # delete file
Get-Content README.md       # read file
Clear-Host                  # clear terminal
```

## 7) Suggested next full-stack step

Create frontend + backend folders and initialize both Node projects:

```powershell
New-Item frontend -ItemType Directory
New-Item backend -ItemType Directory
Set-Location backend
npm init -y
Set-Location ..\frontend
npm create vite@latest .
```

Then commit:

```powershell
Set-Location ..
git add .
git commit -m "chore: scaffold frontend and backend"
```

## 8) Run the full project (Task 2 + Task 3)

Install dependencies (already done in this workspace):

```powershell
npm install
```

Start server:

```powershell
npm start
```

Open in browser:

```text
http://localhost:3000
```

## 9) REST API endpoints (Users resource)

Base URL:

```text
http://localhost:3000/api
```

Endpoints:
- `GET /health` -> health check
- `GET /users` -> get all users
- `GET /users/:id` -> get user by id
- `POST /users` -> create user
- `PUT /users/:id` -> update user
- `DELETE /users/:id` -> delete user

Sample JSON body for create/update:

```json
{
	"name": "Jane Doe",
	"email": "jane@example.com"
}
```

Status codes used:
- `200` success for read/update/delete
- `201` created
- `400` invalid payload or ID
- `404` resource/route not found
- `409` duplicate email
- `500` internal server error

## 10) Test in Postman or Thunder Client

1. Create request: `POST http://localhost:3000/api/users`
2. Add JSON body and send.
3. Copy returned `id`.
4. Call `GET http://localhost:3000/api/users/{id}`.
5. Call `PUT http://localhost:3000/api/users/{id}` with updated body.
6. Call `DELETE http://localhost:3000/api/users/{id}`.
7. Test error case: `GET http://localhost:3000/api/users/99999`.

## 11) Frontend details

Frontend files:
- `public/index.html` -> page layout
- `public/styles.css` -> responsive styling
- `public/app.js` -> Fetch API calls to backend and dynamic rendering

Features implemented:
- List users from API
- Create user
- Edit user
- Delete user
- Error and success messages
- Responsive layout for desktop/mobile

## 12) Advanced Full-Stack Tasks (React + Auth + MongoDB)

This repository now includes:
- React frontend in `client/`
- Express backend with JWT authentication
- MongoDB integration with Mongoose models and indexes

### Backend auth and authorization

Implemented endpoints:
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Token strategy:
- JWT token is set in an HTTP-only cookie named `token`
- API also returns token in response body for optional client usage

Role-based protection:
- `GET /api/users` -> admin only
- `PUT /api/users/:id/role` -> admin only
- `DELETE /api/products/:id` -> admin only
- Product update -> owner or admin

### MongoDB models and validation

Models:
- `models/User.js`
- `models/Product.js`

Validation examples:
- Email format validation
- Password minimum length
- Product price/stock non-negative
- Name/category length constraints

Indexes:
- `User.email` unique index
- `User.role + createdAt` index
- `Product.category + price` index
- `Product.name` text index (with description)

### Configure environment

Create `.env` from `.env.example` and set real values.

Required keys:
- `PORT`
- `MONGO_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `CLIENT_ORIGIN`

### Run backend

```powershell
npm install
npm run dev
```

### Run React frontend

```powershell
npm --prefix client install
npm run client:dev
```

Frontend URL:
- `http://localhost:5173`

Backend URL:
- `http://localhost:3000`

### Product API (secured)

- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/products`
- `PUT /api/products/:id`
- `DELETE /api/products/:id` (admin)

Sample product payload:

```json
{
	"name": "Mechanical Keyboard",
	"description": "Compact 75% layout",
	"category": "Electronics",
	"price": 149.99,
	"stock": 20
}
```

## 13) Full-Stack Application Deliverable (MERN)

This repo now delivers a complete MERN-style app with:
- React frontend (`client/`)
- Express backend (`server.js` + `routes/`)
- MongoDB database (`models/` + Mongoose)
- JWT authentication + role-based authorization
- Socket.io realtime chat and notifications
- Apollo GraphQL API with auth-aware queries and mutations
- Container deployment support (`docker-compose.yml`)

### Authentication and role access

- Signup/Login with bcrypt password hashing
- JWT issued and persisted in HTTP-only cookie
- Role checks:
	- Admin-only user listing and role updates
	- Admin-only product deletion
	- Product update restricted to owner/admin

### Performance optimization implemented

- Mongoose indexes on user/product models
- Paginated product listing (`page`, `limit`)
- Text-search product listing (`search`)
- API compression via `compression`
- Security headers via `helmet`
- API and auth rate limiting via `express-rate-limit`
- Lean queries and capped page sizes for reduced response overhead

### Realtime communication

Socket.io is available at the same backend origin and is authenticated with the JWT cookie. It supports:
- Private user-to-user chat messages
- User-specific notifications
- Live notification updates when products or messages are created

Client panels:
- `client/src/features/RealtimePanel.jsx`

### GraphQL API

GraphQL is mounted at `/graphql` and uses the same JWT auth context as REST.

Available GraphQL operations include:
- `me`
- `products(page, limit, search, category)`
- `product(id)`
- `notifications(limit)`
- `conversations(withUserId)`
- `signup`
- `login`
- `createProduct`
- `updateProduct`
- `deleteProduct`
- `markNotificationRead`
- `sendMessage`

Client panel:
- `client/src/features/GraphQLPanel.jsx`

### Updated product list API (optimized)

`GET /api/products?page=1&limit=8&search=keyboard`

Response shape:

```json
{
	"items": [],
	"pagination": {
		"page": 1,
		"limit": 8,
		"total": 0,
		"totalPages": 1
	}
}
```

### Local development run

Backend:

```powershell
npm install
npm run dev
```

Frontend:

```powershell
npm --prefix client install
npm run client:dev
```

### Deploy both frontend and backend with Docker

Build and run all services (MongoDB + backend + frontend):

```powershell
npm run docker:up
```

Stop services:

```powershell
npm run docker:down
```

Service URLs:
- Frontend: `http://localhost:8080`
- Backend API: `http://localhost:3000/api`
- MongoDB: `mongodb://localhost:27017`

Files added for deployment:
- `Dockerfile` (backend)
- `client/Dockerfile` (frontend)
- `client/nginx.conf` (SPA + API proxy)
- `docker-compose.yml` (full stack orchestration)
- `.dockerignore`
