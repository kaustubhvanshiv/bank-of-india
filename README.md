## Bank Application (Vanilla JS)

A beginner-friendly banking web app built with HTML, CSS, and vanilla JavaScript.
It uses localStorage for persistence and does not require any backend.

## Features

- Login with demo credentials
- Balance persistence in localStorage (default Rs. 10,000)
- Deposit and withdraw actions with validation
- Overdraft protection
- Transfer money to recipient name
- Add 2% interest action
- Undo last transaction
- Clear transaction history
- Recent transaction history display (latest 5 shown)
- Logout with session clear only
- Docker support using Nginx for static hosting

## Demo Credentials

- Username: user123
- Password: pass123

## Project Structure

- index.html: Login page
- home.html: Dashboard page
- style.css: UI styling and responsive layout
- script.js: App logic and localStorage handling
- Dockerfile: Static hosting container using Nginx
- docs/App_expectations.md: Project requirements and acceptance checks
- docs/current_status.md: Current implementation status and gaps

## How to Run

### Option 1: Open directly

1. Open index.html in a browser.
2. Login using the demo credentials.

### Option 2: Run with Docker

1. Build image:

	docker build -t bank-app .

2. Run container:

	docker run -d --name bank-app -p 8080:80 bank-app

3. Open:

	http://localhost:8080

## localStorage Keys

- isLoggedIn: Session flag for login
- loggedInUser: Logged-in username
- bankBalance: Current account balance
- transactionHistory: Transaction objects

## Notes

- This is a frontend-only demo project.
- Data persists in browser localStorage until cleared.
