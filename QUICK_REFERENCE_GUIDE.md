# Banking System - Quick Reference Guide

## 🚀 What Changed

The banking system has been completely restructured for **proper banking security**. You can no longer directly modify balances. Everything now follows a **request-approval-execution workflow**.

---

## 👥 Three Roles

### 1️⃣ VIEWER (Customer) 👤
**You can:**
- Create account requests
- Request deposits/withdrawals/transfers
- View your own pending requests
- View dashboard

**You cannot:**
- Approve anything
- Modify balances
- Delete users
- See other users
- Manage accounts

**Demo Login:** viewer / viewer123

---

### 2️⃣ MANAGER (Operations Officer) ✅
**You can:**
- Review pending account requests
- Approve/reject account requests
- Review pending transaction requests
- Approve/reject transaction requests
- View dashboard

**You cannot:**
- Create requests
- Directly modify balances
- Delete users
- Manage accounts
- View audit logs

**Demo Login:** manager / manager123

---

### 3️⃣ ADMIN (Supervisor) 👨‍💼
**You can:**
- View all users
- View all transactions
- View audit logs
- Freeze/unfreeze accounts
- Delete users
- View dashboard

**You cannot:**
- Create requests
- Approve requests (that's manager's job)
- Modify balances directly
- Bypass approval workflow

**Demo Login:** admin / admin123

---

## 📊 Workflow

```
┌─────────────────────────────────────────────────┐
│                    THE WORKFLOW                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  STEP 1: VIEWER Creates Request                │
│  ↓                                              │
│  "I want to withdraw ₹500"                     │
│  (Request stored - balance NOT changed yet)    │
│                                                 │
│  STEP 2: MANAGER Reviews & Approves            │
│  ↓                                              │
│  "Request approved ✓"                          │
│  (System auto-executes immediately)            │
│                                                 │
│  STEP 3: SYSTEM EXECUTES                       │
│  ↓                                              │
│  Balance updated ✓                             │
│  Transaction recorded ✓                        │
│  Audit log created ✓                           │
│                                                 │
│  STEP 4: ADMIN MONITORS                        │
│  ↓                                              │
│  "All transactions recorded in audit logs"     │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 🎯 Key Rules

### Rule 1: NO DIRECT BALANCE CHANGES
```
❌ BEFORE: Viewer clicks button → balance changes instantly
✅ NOW:    Viewer creates request → manager approves → system executes
```

### Rule 2: ACCOUNT LIFECYCLE
```
Created → PENDING (waiting for approval)
       ↓
      APPROVED (active, can transact)
       ↓
      ACTIVE with balance ₹0.00
```

### Rule 3: FROZEN ACCOUNTS
```
Admin can freeze accounts to prevent any transactions
Frozen account status is recorded in audit logs
```

### Rule 4: COMPLETE AUDIT TRAIL
```
Every action is logged:
- Who did it
- What role they have
- What action they performed
- When it happened
- Additional details
```

---

## 📋 Account Request Workflow

```
VIEWER                          MANAGER
  │                               │
  ├─ Clicks "Request Account" ─→  │
  │                               │
  ├─ Enters username ────────────→ │
  │                               │
  │  (Request stored)             │
  │                               │
  │                         ← Sees pending request
  │                               │
  │                    ← Clicks "Approve"
  │                               │
  │         ← Account created!    │
  │                               │
ACCOUNT NOW ACTIVE
Balance: ₹0.00
Status: Active ✓
```

---

## 💰 Transaction Request Workflow

```
VIEWER                    MANAGER              SYSTEM
  │                          │                   │
  ├─ Requests ─────────────→  │                   │
  │  (deposit/withdraw/       │                   │
  │   transfer)               │                   │
  │                           │                   │
  │  (Request stored)         │                   │
  │                           │                   │
  │                    ← Sees request             │
  │                           │                   │
  │                ← Clicks "Approve" ───────→   │
  │                           │                   │
  │                           │       Validates:  │
  │                           │       - User exists
  │                           │       - Account active
  │                           │       - Not frozen
  │                           │       - Sufficient balance
  │                           │                   │
  │                           │      Executes! ✓ │
  │                           │                   │
  │←─── Balance Updated ─────────── Recorded ──┘
  │
TRANSACTION COMPLETE ✓
```

---

## 🔐 Security Features

✅ **Code-Level Permissions**
- Permissions checked BEFORE every operation
- Not just hidden in UI
- Cannot bypass with console tricks

✅ **No Direct Balance Modifications**
- Only the execution engine touches balances
- Everything else creates requests

✅ **Frozen Accounts**
- Admin can freeze accounts
- Frozen accounts cannot transact
- Recorded in audit log

✅ **Double Approval Prevention**
- Cannot approve same request twice
- Cannot execute non-approved transaction

✅ **Audit Trail**
- Every action logged
- Perfect for compliance
- Can trace any transaction

---

## 🚨 Common Scenarios

### Scenario 1: Viewer Account Not Found
```
Problem: "Your account was not found in the system"
Why: Your account hasn't been created/activated yet
Solution: 
1. Create account request
2. Wait for manager approval
3. Account becomes active
4. Then you can request transactions
```

### Scenario 2: Cannot Transact on Frozen Account
```
Problem: "Account is frozen"
Why: Admin froze your account
Solution: Contact admin to unfreeze
```

### Scenario 3: Insufficient Balance
```
Problem: "Insufficient balance"
Why: You tried to withdraw/transfer more than you have
Solution: Deposit more funds first
```

### Scenario 4: Invalid Transfer Recipient
```
Problem: "Recipient account does not exist"
Why: You typed a username that doesn't exist
Solution: Check the username and try again
```

---

## 📈 What Admins See

### Users Section
- List of all users
- Current balance
- Account status (Active/Frozen)
- Transaction count
- Freeze/Delete buttons

### Transactions Section
- All completed transactions
- Filters by user and type
- Amount and details
- Timestamp

### Audit Logs
- Every action in the system
- Who performed it
- What role they have
- When it happened
- Full details

### System Controls
- Currently disabled
- Reserved for future admin functions

---

## 🎓 Demo Workflow

### Step 1: Login as Viewer
```
Username: viewer
Password: viewer123
```

### Step 2: Create Account Request
```
Click: Request Account
Enter: newuser (any username)
Submit
```

### Step 3: Logout & Login as Manager
```
Username: manager
Password: manager123
```

### Step 4: Approve Request
```
Go to: Approvals
See: Pending account request
Click: Approve
```

### Step 5: Logout & Login as Admin
```
Username: admin
Password: admin123
```

### Step 6: Verify Account Created
```
Go to: Users
See: newuser with ✓ Active status
Balance: ₹0.00
```

---

## ❓ FAQ

**Q: Can I directly modify balance in browser console?**  
A: No. Even if you change it in localStorage, it won't persist through proper workflow operations.

**Q: What if I try to approve a request as a viewer?**  
A: System will throw "Access Denied - Permission required: APPROVE_ACCOUNT_REQUEST"

**Q: Can manager create account requests?**  
A: No. Only viewers can create requests.

**Q: What happens if transaction execution fails?**  
A: Approval is reverted, transaction stays pending, error is logged in audit trail.

**Q: Can I delete a user's request after submitting it?**  
A: No. Only admin can delete users (not requests). Requests must be approved/rejected.

**Q: Are all actions really audited?**  
A: Yes. Every login, logout, request, approval, execution, and error is logged with timestamp, actor, and role.

---

## 🏦 The Result

You now have a **banking system that works like a real bank**:

✅ Customers create requests  
✅ Bank (manager) approves them  
✅ System executes the transactions  
✅ Supervisor (admin) oversees everything  
✅ Every action is recorded  
✅ Nobody can cheat the system  

**This is proper banking security.** 🔒

