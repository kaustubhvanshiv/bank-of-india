# 🚀 Bank Application with CI/CD Pipeline (Jenkins + Docker + Multibranch)

A beginner-friendly banking web app that demonstrates DevOps concepts through Jenkins CI/CD, multibranch pipelines, and containerized deployment using Docker.

---

## 🎯 DevOps Objective

This project showcases modern DevOps practices in an academic setting. Rather than manual testing and deployment, we use **automated CI/CD pipelines** to:

- **Validate code** automatically on every push
- **Detect bugs early** before they reach production
- **Ensure consistency** across development and deployment environments
- **Streamline workflows** through Jenkins multibranch pipelines
- **Demonstrate infrastructure as code** using Docker containers

By automating these processes, teams can focus on development while ensuring reliability and speed.

---

## 🔁 CI/CD Workflow

The pipeline follows this automated flow:

1. **Developer pushes code** → Commit to GitHub branch (main, dev, or feature/*)
2. **GitHub webhook triggered** → Sends event to Jenkins via ngrok tunnel
3. **Jenkins detects change** → Multibranch pipeline activated
4. **Pipeline stages execute**:
   - ✅ **Checkout**: Clone the latest code from Git
   - ✅ **Run Server**: Start the Node.js server in background
   - ✅ **Test**: Call `/health` endpoint to confirm app is running correctly
   - ✅ **Docker Build**: Create container image (main branch only)
5. **Pipeline success or failure** → Notification sent back to GitHub

**Note**: Pipeline ensures the application actually runs, not just code syntax validation

**Example**: A bug in a feature branch is caught immediately; once fixed, the pipeline passes automatically.

---

## 🌿 Branch Strategy

We follow a structured branching model:

| Branch | Purpose | Status |
|--------|---------|--------|
| `main` | Stable, production-ready code | Protected, reviewed |
| `dev` | Integration branch for testing | Stable features |
| `feature/*` | Individual feature development | Work in progress |

**Why Multibranch Pipeline?** Jenkins automatically creates separate pipelines for each branch, allowing parallel development without conflicts. Each branch builds and tests independently.

---

## 🤖 Jenkins Pipeline Overview

The Jenkins pipeline (defined in `Jenkinsfile`) executes the following stages:

```
Checkout → Run Server → Test → Docker Build → Notify
```

### Pipeline Stages:

- **Checkout**: Clones the repository at the commit SHA
- **Run Server**: Starts `server.js` in the background using Node.js
- **Test**: Calls `http://localhost:5000/health` endpoint to validate server runtime
  - If response is `"OK"` → Test passes, pipeline continues
  - If response is not `"OK"` or connection fails → Test fails, pipeline stops
- **Docker Build**: Creates a Docker image tagged with branch name (main branch only)
- **Notify**: Sends results back to GitHub (pass/fail status)

**Server Runtime Validation**: Jenkins runs actual server code and confirms the `/health` endpoint responds correctly, ensuring the application works in a real environment before containerization.

All stages are logged for audit trails and debugging.

---

## 🧪 Failure Demonstration

This project includes a **failure scenario** to demonstrate early bug detection:

1. **Intentional bug** introduced in a `feature/bug-demo` branch (e.g., syntax error or runtime issue)
2. **Developer pushes** the buggy code to GitHub
3. **Jenkins pipeline runs**:
   - Checkout stage succeeds
   - Run Server stage starts the Node.js application
   - Test stage calls `/health` endpoint
   - If the bug prevents the server from responding → Health check fails → **Pipeline fails**
4. **Pipeline fails** and GitHub is notified (red X on commit)
5. **Developer receives feedback** immediately and fixes the bug
6. **Retest**: New commit runs the pipeline again
7. **Pipeline succeeds** once the bug is fixed and server responds to health check (green checkmark)

**Learning Point**: Runtime validation catches errors faster than static analysis. By testing the actual running application, we ensure real-world functionality before containerization and deployment.

---

## � CI/CD Failure Simulation

To demonstrate how the pipeline catches failures:

1. **Enable failure mode**: Set `FORCE_ERROR = true` in `server.js` (line 6)
2. **Push to branch**: Commit and push to any feature branch
3. **Watch pipeline fail**: Jenkins detects broken health check → Pipeline fails
4. **Fix the error**: Change `FORCE_ERROR = false`
5. **Push again**: New commit re-runs pipeline → Pipeline passes

**Result**: GitHub shows red X on broken commit, green checkmark on fixed commit. Perfect for demonstrating automated quality gates!

---

## �🐳 Docker Usage

Docker ensures **consistent environments** across development, testing, and production:

### Our Docker Architecture:

- **Jenkins runs inside Docker**: Isolated CI/CD environment with predefined dependencies
- **Application runs via Nginx container**: Serves static files reliably without system-level dependencies
- **Benefits**:
  - No "works on my machine" problems
  - Easy to scale and replicate
  - Security through isolation
  - Simplified onboarding for new team members

### Quick Docker Commands:

```bash
# Build the application image
docker build -t bank-app .

# Run the application
docker run -d --name bank-app -p 8080:80 bank-app

# Access at http://localhost:8080
```

---

## 🌐 ngrok Integration

GitHub webhooks require **internet-accessible endpoints**. Since Jenkins runs on localhost, we use **ngrok** as a tunnel:

- **ngrok exposes localhost:8080** to a public HTTPS URL
- **GitHub webhook configured** to point to the ngrok URL
- **Jenkins receives events** in real-time from GitHub
- **Benefit**: Enables testing CI/CD pipeline without public server infrastructure

### Quick ngrok Setup:

```bash
ngrok http 8080
# Provides public URL like https://abc123.ngrok.io
```

Configure this URL in GitHub webhook settings: `Settings > Webhooks > Payload URL`

---

## 📋 Bank Application Features

The core banking application includes:

- ✅ Login with demo credentials
- ✅ Balance persistence in localStorage (default Rs. 10,000)
- ✅ Deposit and withdraw with validation
- ✅ Overdraft protection
- ✅ Transfer money to recipient
- ✅ Add 2% interest on account balance
- ✅ Undo last transaction
- ✅ Clear transaction history
- ✅ Recent transaction display (latest 5)
- ✅ Session-based logout (balance preserved)

---

## 🔐 Demo Credentials

Use these hardcoded credentials for testing:

- **Username**: `admin`
- **Password**: `admin123`

---

## 🏗️ Project Structure

```
.
├── index.html                        # Login page
├── home.html                         # Dashboard page
├── script.js                         # App logic and localStorage handling
├── style.css                         # UI styling and responsive layout
├── server.js                         # Node.js HTTP server for static files
├── Dockerfile                        # Nginx configuration for static hosting
├── Jenkinsfile                       # CI/CD pipeline definition
├── README.md                         # This file
├── docs/
│   ├── App_expectations.md          # Project requirements and acceptance criteria
│   └── current_status.md            # Implementation status and gaps
```

---

## 🚀 How to Run

### Option 1: Open Directly in Browser

1. Open `index.html` in your browser
2. Login using demo credentials
3. Interact with the application

### Option 2: Run with Node.js Server

```bash
# Install dependencies (if needed)
npm install

# Start the server
node server.js

# Open http://localhost:5000 in your browser
```

### Option 3: Run with Docker (Recommended)

```bash
# Build the Docker image
docker build -t bank-app .

# Run the container
docker run -d --name bank-app -p 8080:80 bank-app

# Open http://localhost:8080 in your browser
```

---

## 💾 localStorage Keys

| Key | Purpose |
|-----|---------|
| `isLoggedIn` | Session flag (true/false) |
| `loggedInUser` | Currently logged-in username |
| `bankBalance` | Current account balance |
| `transactionHistory` | Array of transaction objects |

---

## 👥 Team Contributions

| Team Member | Role |
|-------------|------|
| **Kaustubh** | CI/CD Pipeline, Jenkins Configuration |
| **Vansh** | Code Validation, Testing Strategy |
| **Satya** | Banking Application UI/UX |
| **Suchit** | Docker Configuration, Container Deployment |

---

## 💡 Key Learning

This project demonstrates:

1. **Automated pipelines reduce manual effort** and human error
2. **Early feedback enables rapid iteration** and faster bug fixes
3. **Containerization ensures reproducibility** across environments
4. **Multibranch strategies support team collaboration** without conflicts
5. **DevOps culture bridges development and operations** for shared responsibility

By combining Jenkins, Docker, GitHub, and ngrok, we've created a complete DevOps workflow in an academic setting—a foundation for understanding modern software delivery practices.

---

## 📝 Notes

- This is an **academic DevOps demonstration project**, not production-ready software
- Data persists in browser localStorage until cleared
- Jenkins requires Docker to be running
- ngrok URL changes on restart (update GitHub webhook accordingly)
