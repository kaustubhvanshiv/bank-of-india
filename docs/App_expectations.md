## App Expectations

## Objective

Build a simple banking web application using only HTML, CSS, and vanilla JavaScript with no backend.

## Core Requirements

1. Login flow with hardcoded credentials.
2. Dashboard with welcome, balance, and action controls.
3. Balance persistence in localStorage.
4. Deposit and withdraw functionality.
5. Overdraft prevention for withdraw and transfer actions.
6. Session-based logout that does not reset account balance.

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

## Extended Expectations

1. Transaction history support.
2. Validation for invalid or negative amounts.
3. Additional banking actions to improve usability.

## Acceptance Checklist

- [ ] User can login with demo credentials.
- [ ] Invalid credentials are rejected.
- [ ] User reaches dashboard after login.
- [ ] Balance initializes to Rs. 10,000 when absent.
- [ ] Deposit updates balance and history.
- [ ] Withdraw updates balance and blocks overdraft.
- [ ] Transfer action validates recipient and balance.
- [ ] Interest action applies correctly.
- [ ] Undo action reverses last transaction safely.
- [ ] Logout returns user to login screen.
