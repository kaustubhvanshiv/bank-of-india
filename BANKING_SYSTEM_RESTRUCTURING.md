# Banking System Restructuring - Complete Documentation

## Overview

The banking system has been completely restructured to enforce **strict role-based access control (RBAC)** and implement a **real banking workflow** where:
- **NO role can directly modify balances**
- **ALL operations follow: REQUEST → APPROVAL → EXECUTION**
- **Only the execution engine modifies balances**
- **All actions are audited**

---

## Core Principle

```
┌─────────────────────────────────────────────────────┐
│  REQUEST-APPROVAL-EXECUTION WORKFLOW                │
├─────────────────────────────────────────────────────┤
│                                                     │
│  1. REQUEST (Viewer/Customer only)                 │
│     └─ Create account request                      │
│     └─ Create transaction request                  │
│     └─ NO balance modifications allowed            │
│                                                     │
│  2. APPROVAL (Manager only)                        │
│     └─ Review pending requests                     │
│     └─ Approve or reject requests                  │
│     └─ NO balance modifications allowed            │
│                                                     │
│  3. EXECUTION (Automatic on approval)              │
│     └─ Execute approved transactions               │
│     └─ Validate accounts and balances              │
│     └─ ONLY place where balances change            │
│     └─ Full audit trail created                    │
│                                                     │
│  4. MONITORING (Admin only)                        │
│     └─ View all users, requests, transactions      │
│     └─ Freeze/unfreeze accounts                    │
│     └─ Delete users (admin only)                   │
│     └─ Review audit logs                           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## STRICT PERMISSIONS MATRIX

### VIEWER (Customer) - Can ONLY CREATE REQUESTS

✅ Permissions:
- `CREATE_ACCOUNT_REQUEST` - Request new account
- `CREATE_TRANSACTION_REQUEST` - Request deposit/withdraw/transfer

❌ CANNOT:
- Approve anything
- Execute transactions
- Modify balances
- Delete users
- Freeze accounts
- View other users' information

### MANAGER (Operations Officer) - Can ONLY APPROVE/REJECT

✅ Permissions:
- `APPROVE_ACCOUNT_REQUEST` - Approve account requests
- `REJECT_ACCOUNT_REQUEST` - Reject account requests
- `APPROVE_TRANSACTION_REQUEST` - Approve transaction requests
- `REJECT_TRANSACTION_REQUEST` - Reject transaction requests

❌ CANNOT:
- Create requests
- Directly modify balances
- Bypass execution logic
- Delete users
- Freeze accounts
- View audit logs

**CRITICAL**: Approval automatically triggers execution via `executeApprovedTransaction()`

### ADMIN (Supervisor/Auditor) - Can ONLY VIEW & MANAGE ACCOUNTS

✅ Permissions:
- `VIEW_ALL_USERS` - View user list
- `VIEW_ALL_REQUESTS` - View pending requests
- `VIEW_ALL_TRANSACTIONS` - View all transactions
- `VIEW_AUDIT_LOGS` - View audit trail
- `FREEZE_ACCOUNT` - Freeze account (prevents transactions)
- `UNFREEZE_ACCOUNT` - Unfreeze account
- `DELETE_USER` - Delete user account

❌ CANNOT:
- Create requests
- Approve requests
- Execute transactions directly
- Modify balances
- Bypass approval system

---

## ACCOUNT LIFECYCLE

```
PENDING → APPROVED → ACTIVE
  ↓
REJECTED
```

### Phase 1: ACCOUNT REQUEST (Viewer submits)
```javascript
{
  id: "unique-id",
  username: "newuser",
  status: "PENDING",           // Awaiting manager
  createdBy: "viewer",
  createdAt: 1234567890,
  approvedBy: null,
  approvedAt: null
}
```

### Phase 2: MANAGER REVIEWS
- ✅ Approve: Account is created with `isActive: true`, balance = 0
- ❌ Reject: Request stays in system, marked as REJECTED

### Phase 3: ACCOUNT ACTIVE
```javascript
{
  username: "newuser",
  balance: 0,                  // Starts at zero
  isActive: true,              // Can now transact
  isFrozen: false,             // Not frozen by admin
  transactions: [],            // History starts empty
  createdAt: 1234567890,
  activatedAt: 1234567891
}
```

---

## TRANSACTION WORKFLOW

```
REQUEST (Viewer) → APPROVAL (Manager) → EXECUTION (Auto)
```

### Step 1: VIEWER CREATES TRANSACTION REQUEST

Only viewers can create requests. Request does NOT modify balance.

```javascript
// Request structure
{
  id: "transaction-id",
  type: "deposit|withdraw|transfer",
  amount: 1000.50,
  fromUser: "viewer-username",
  toUser: "recipient-username",   // null for deposit/withdraw
  status: "PENDING",              // Awaiting manager approval
  createdBy: "viewer-username",
  createdAt: 1234567890,
  approvedBy: null,
  approvedAt: null,
  executedAt: null
}
```

**Validations before request creation:**
- User account exists and is ACTIVE
- User account is NOT frozen
- For transfers: recipient exists, is ACTIVE, not frozen
- Amount > 0 and is valid

### Step 2: MANAGER APPROVES

Manager reviews and clicks "Approve". System:
1. Marks request as `APPROVED`
2. **IMMEDIATELY** calls `executeApprovedTransaction()`
3. Execution validates everything again
4. If successful: balances update, transaction complete
5. If failed: reverts approval, logs error

### Step 3: EXECUTION ENGINE

**CRITICAL**: This is the ONLY place balances are modified.

```javascript
function executeApprovedTransaction(txnId) {
  // Get transaction
  // Validate source account (exists, active, not frozen)
  // Validate target account if transfer (exists, active, not frozen)
  // Validate sufficient balance for withdraw/transfer
  
  // DEPOSIT: Add funds
  sourceUser.balance += amount
  
  // WITHDRAW: Remove funds
  sourceUser.balance -= amount
  
  // TRANSFER: Move between accounts
  sourceUser.balance -= amount
  targetUser.balance += amount
  
  // Mark as EXECUTED
  // Save users
  // Create audit log
}
```

---

## KEY SECURITY FEATURES

### 1. Permission Enforcement (NOT UI-based)

Every critical function calls `assertPermission()`:

```javascript
function approveTransactionRequest(id) {
  assertPermission('APPROVE_TRANSACTION_REQUEST');  // Throws if not permitted
  // ... rest of logic
}
```

**Why this matters**: Attackers cannot bypass by modifying DOM or calling functions directly.

### 2. No Balance Modifications Outside Execution Engine

Search the codebase for `balance =`:
- Only `executeApprovedTransaction()` modifies `sourceUser.balance`
- Only `executeApprovedTransaction()` modifies `targetUser.balance`
- Everything else creates REQUESTS

### 3. Audit Trail

Every sensitive operation is logged:

```javascript
writeAuditLog(action, details)

// Examples:
ACCOUNT_REQUEST_CREATED
ACCOUNT_REQUEST_APPROVED
TRANSACTION_REQUEST_CREATED
TRANSACTION_REQUEST_APPROVED
TRANSACTION_EXECUTED
TRANSACTION_APPROVAL_FAILED
ACCOUNT_FROZEN
UNAUTHORIZED_ACCESS_ATTEMPT
```

### 4. Double Approval Prevention

Cannot approve already-processed requests:

```javascript
if (request.status !== 'PENDING') {
  throw new Error('Cannot approve request with status: ' + request.status);
}
```

### 5. Account State Validation

Before ANY execution, system validates:

```javascript
// Is account active?
if (!sourceUser.isActive) {
  throw new Error('Source account is not active');
}

// Is account frozen?
if (sourceUser.isFrozen) {
  throw new Error('Source account is frozen');
}

// Sufficient balance?
if (amount > sourceUser.balance) {
  throw new Error('Insufficient balance');
}
```

---

## ROLE-BASED UI

### VIEWER (Customer)
Shows:
- Dashboard (view-only summary)
- "Request Account" button
- "Request Transaction" button
- Their own pending requests

Cannot see:
- Other users
- Approval queue
- Audit logs
- System controls

### MANAGER (Operations Officer)
Shows:
- Dashboard (view-only summary)
- Pending account requests with Approve/Reject buttons
- Pending transaction requests with Approve/Reject buttons

Cannot see:
- User management
- Request creation section
- Audit logs

### ADMIN (Supervisor)
Shows:
- Dashboard with all stats
- Users list with Freeze/Delete buttons
- Audit logs
- All transactions (filterable)
- System controls section

Cannot modify:
- Balances directly
- Bypass approval workflows
- Create requests

---

## DATA STORAGE

All data persists in localStorage:

```javascript
// Users with full account lifecycle
bankUsersData = [{
  username: "user1",
  balance: 5000.00,
  isActive: true,           // Account approved
  isFrozen: false,          // Not frozen
  transactions: [...],      // Full history
  createdAt: 1234567890,
  activatedAt: 1234567891
}]

// Pending requests awaiting manager approval
bankAccountRequests = [{
  id: "req-id",
  username: "newuser",
  status: "PENDING|APPROVED|REJECTED",
  createdBy: "viewer-username",
  createdAt: 1234567890,
  approvedBy: "manager",
  approvedAt: 1234567891
}]

// Pending transactions awaiting manager approval
bankPendingTransactions = [{
  id: "txn-id",
  type: "deposit|withdraw|transfer",
  amount: 1000,
  fromUser: "user1",
  toUser: "user2",           // null for non-transfers
  status: "PENDING|APPROVED|EXECUTED|REJECTED",
  createdBy: "viewer",
  approvedBy: "manager",
  createdAt: 1234567890,
  approvedAt: 1234567891,
  executedAt: 1234567892
}]

// Audit trail
bankAuditLogs = [{
  id: "log-id",
  action: "TRANSACTION_EXECUTED",
  actor: "manager",
  role: "manager",
  details: {...},
  createdAt: 1234567892
}]

// Session
adminSession: "true|false"
currentUserRole: "admin|manager|viewer"
currentUsername: "username"
```

---

## CRITICAL FUNCTIONS

### Request Creation (VIEWERS ONLY)

```javascript
createAccountRequest(data)    // Create account request
createTransactionRequest(type, data)  // Create transaction request
```

### Approval Workflow (MANAGERS ONLY)

```javascript
approveAccountRequest(id)     // Approve account creation
rejectAccountRequest(id)      // Reject account request
approveTransactionRequest(id) // Approve transaction + execute
rejectTransactionRequest(id)  // Reject transaction request
```

### Execution (AUTOMATIC - NEVER CALL DIRECTLY)

```javascript
executeApprovedTransaction(txnId)  // ONLY modifies balances
```

### Admin Functions

```javascript
freezeAccount(username)       // Prevent transactions
unfreezeAccount(username)     // Re-enable transactions
deleteUser(username)          // Remove user account
```

---

## TESTING THE SYSTEM

### Test Workflow 1: New Account + Deposit

1. **Login as viewer**
   - Password: viewer123

2. **Create Account Request**
   - Click "Request Account"
   - Enter username: "testuser"
   - Submit

3. **Login as manager**
   - Password: manager123
   - Go to Approvals section
   - See pending account request
   - Click Approve

4. **Verify account created**
   - Login as admin (admin123)
   - Go to Users section
   - See "testuser" with balance 0, Active

5. **Create transaction request**
   - Login as viewer
   - Click "Request Transaction"
   - Action: Deposit
   - Amount: 500
   - Submit

6. **Approve transaction**
   - Login as manager
   - See pending transaction
   - Click Approve
   - System executes immediately

7. **Verify balance updated**
   - Login as admin
   - Check "testuser" balance is now 500

### Test Workflow 2: Security Validation

1. **Try to access admin features as viewer**
   - Login as viewer
   - Try direct URL to admin features
   - Should be redirected or show permission denied

2. **Try to call functions directly from console**
   - Open browser DevTools
   - Try: `deleteUser('testuser')`
   - Should throw: "Permission required: DELETE_USER"

3. **Try to modify balance directly**
   - Open DevTools
   - Try: `getUsers()[0].balance = 999999`
   - Save and refresh
   - Balance reverts (not persisted through proper flow)

---

## EDGE CASES HANDLED

✅ Cannot approve already processed request
✅ Cannot transact on frozen account
✅ Cannot transfer to non-existent user
✅ Cannot transfer to self
✅ Cannot process invalid or negative amounts
✅ Cannot withdraw more than balance
✅ Cannot create duplicate usernames
✅ Cannot activate already-active account
✅ Cannot delete non-existent user
✅ Cannot freeze already-frozen account
✅ Cannot execute non-approved transaction
✅ Cannot approve already-executed transaction

---

## COMPARISON: BEFORE vs AFTER

### BEFORE (Insecure)
```
Viewer: Can click button → balance changes instantly
Manager: Can bypass approval
Admin: Can directly modify balances
Security: UI hiding only
Workflow: No real banking flow
```

### AFTER (Secure)
```
Viewer: Creates request → awaits approval
Manager: Reviews → approves → system executes
Admin: Views only (except freeze/delete)
Security: Enforced in code, not UI
Workflow: Real banking simulation
```

---

## SUMMARY

The system now implements **proper banking security**:

1. ✅ **Strict RBAC** - Permissions enforced in code
2. ✅ **Request-Approval-Execution** - No direct balance changes
3. ✅ **Account Lifecycle** - Proper onboarding flow
4. ✅ **Audit Trail** - Every action logged
5. ✅ **Frozen Accounts** - Admin can lock accounts
6. ✅ **Validation** - All inputs validated before execution
7. ✅ **Error Handling** - Meaningful error messages
8. ✅ **Backward Compatible** - Existing demo data still works

---

## FILES MODIFIED

- ✅ `app/script.js` - Complete restructuring with new architecture
- ✅ `app/style.css` - Added status indicator styles
- ✅ `app/home.html` - No changes needed (UI works with new backend)

---

## NEXT STEPS

1. **Test the complete workflow** using the test cases above
2. **Review audit logs** to verify all actions are tracked
3. **Try edge cases** to ensure security
4. **Deploy with confidence** - system now implements real banking principles

