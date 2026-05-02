## App Expectations

## Objective

Build a simple banking web application using only HTML, CSS, and vanilla JavaScript with no backend.
The app should support role-based admin operations with localStorage persistence.

## Core Requirements

1. Login flow with demo credentials and role mapping.
2. Dashboard with welcome, balances, and transaction visibility.
3. localStorage persistence for users, auth, pending queue, and session.
4. Request-first workflow for deposit, withdraw, and transfer.
5. Approval flow for pending requests.
6. Session-based logout that clears only active session keys.
7. Role-based restrictions:
	- admin: create requests, approve, freeze, delete users
	- manager: approve/reject pending requests only
	- viewer: read-only access

## UX Expectations

1. Clean modern interface.
2. Centered login form and card-style dashboard.
3. Clear feedback messages for success and error states.
4. Mobile-friendly layout.

## Technical Expectations

1. No frameworks and no backend.
2. Event handling through addEventListener.
3. Beginner-friendly code organization.
4. Data storage through localStorage only.
5. Permission checks before all critical actions.
6. All balance updates must happen only during approved transaction execution.

## Extended Expectations

1. Transaction history support.
2. Validation for invalid, negative, or overdraft amounts.
3. Account freeze/unfreeze controls.
4. Role-based UI state (show/hide/disable controls per role).
5. Backend-style transaction states: PENDING, APPROVED, REJECTED.

## Acceptance Checklist

- [x] User can login with demo credentials.
- [x] Invalid credentials are rejected.
- [x] User reaches dashboard after login.
- [x] Users, auth users, and pending transactions initialize in localStorage.
- [x] Deposit request enters pending queue.
- [x] Withdraw request enters pending queue and blocks overdraft at execution time.
- [x] Transfer request validates recipient, freeze state, and balance.
- [x] Admin and manager can approve/reject pending requests.
- [x] Approved requests are executed through a single business-logic function.
- [x] Admin can delete users, freeze accounts, and purge history.
- [x] Viewer has read-only access to allowed sections.
- [x] Logout returns user to login screen.

## DevOps Expectations

- Application should run successfully using Node.js server.
- CI/CD pipeline should validate runtime execution via /health endpoint.
- System should detect failures before merging branches.
- Docker build should succeed without errors.
- Test scripts should confirm server is running and responsive.
