// --- BANKING SYSTEM CONSTANTS & KEYS ---
// ============================================
// Storage keys for localStorage persistence
const USERS_KEY = 'bankUsersData';
const AUTH_USERS_KEY = 'bankAuthUsers';
const PENDING_TX_KEY = 'bankPendingTransactions';
const ACCOUNT_REQUESTS_KEY = 'bankAccountRequests';
const AUDIT_LOGS_KEY = 'bankAuditLogs';
const ADMIN_SESSION_KEY = 'adminSession';
const CURRENT_USER_ROLE_KEY = 'currentUserRole';
const CURRENT_USER_NAME_KEY = 'currentUsername';
const FORCE_ERROR = false;

// Role definitions with strict separation
const ROLES = {
  ADMIN: 'admin',        // Supervisor/Auditor - VIEW ONLY (except freeze/delete)
  MANAGER: 'manager',    // Operations Officer - APPROVAL ONLY
  VIEWER: 'viewer'       // Customer - REQUEST ONLY
};

// CRITICAL: Strict permission system
// NO overlapping permissions between roles
// NO role can modify balances directly
const PERMISSIONS = {
  [ROLES.ADMIN]: [
    'VIEW_ALL_USERS',
    'VIEW_ALL_REQUESTS',
    'VIEW_ALL_TRANSACTIONS',
    'VIEW_AUDIT_LOGS',
    'FREEZE_ACCOUNT',
    'UNFREEZE_ACCOUNT',
    'DELETE_USER'
  ],
  [ROLES.MANAGER]: [
    'APPROVE_ACCOUNT_REQUEST',
    'REJECT_ACCOUNT_REQUEST',
    'APPROVE_TRANSACTION_REQUEST',
    'REJECT_TRANSACTION_REQUEST'
  ],
  [ROLES.VIEWER]: [
    'CREATE_ACCOUNT_REQUEST',
    'CREATE_TRANSACTION_REQUEST'
  ]
};

// --- INITIALIZATION WITH PROPER ACCOUNT LIFECYCLE ---
// ====================================================
function initData() {
  // Initialize users with account lifecycle support
  if (!localStorage.getItem(USERS_KEY)) {
    const defaultData = [
      { 
        username: 'user1', 
        balance: 10000, 
        transactions: [], 
        isFrozen: false, 
        isActive: true,    // Account is approved and active
        createdAt: Date.now(),
        activatedAt: Date.now()
      },
      { 
        username: 'testuser', 
        balance: 500, 
        transactions: [], 
        isFrozen: false, 
        isActive: true,
        createdAt: Date.now(),
        activatedAt: Date.now()
      }
    ];
    localStorage.setItem(USERS_KEY, JSON.stringify(defaultData));
  }

  // Initialize auth users with roles
  if (!localStorage.getItem(AUTH_USERS_KEY)) {
    const demoAuthUsers = [
      { username: 'admin', password: 'admin123', role: ROLES.ADMIN },
      { username: 'manager', password: 'manager123', role: ROLES.MANAGER },
      { username: 'viewer', password: 'viewer123', role: ROLES.VIEWER }
    ];
    localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(demoAuthUsers));
  }

  // Initialize empty pending transactions queue
  if (!localStorage.getItem(PENDING_TX_KEY)) {
    localStorage.setItem(PENDING_TX_KEY, JSON.stringify([]));
  }

  // Initialize empty account requests queue
  if (!localStorage.getItem(ACCOUNT_REQUESTS_KEY)) {
    localStorage.setItem(ACCOUNT_REQUESTS_KEY, JSON.stringify([]));
  }

  // Initialize audit logs
  if (!localStorage.getItem(AUDIT_LOGS_KEY)) {
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify([]));
  }
}

// --- STORAGE HELPERS WITH BACKWARD COMPATIBILITY ---
// ==================================================
function getUsers() {
  try {
    const users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    // Ensure all users have lifecycle properties for backward compatibility
    return users.map((u) => ({
      ...u,
      isFrozen: Boolean(u.isFrozen),
      isActive: u.isActive !== false,
      transactions: Array.isArray(u.transactions) ? u.transactions : [],
      createdAt: u.createdAt || Date.now(),
      activatedAt: u.activatedAt || Date.now()
    }));
  } catch (e) {
    console.error('Error reading users:', e);
    return [];
  }
}

function saveUsers(users) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return true;
  } catch (e) {
    console.error('Error saving users:', e);
    return false;
  }
}

function getAuthUsers() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_USERS_KEY)) || [];
  } catch (e) {
    console.error('Error reading auth users:', e);
    return [];
  }
}

function getPendingTransactions() {
  try {
    return JSON.parse(localStorage.getItem(PENDING_TX_KEY)) || [];
  } catch (e) {
    console.error('Error reading pending transactions:', e);
    return [];
  }
}

function savePendingTransactions(pending) {
  try {
    localStorage.setItem(PENDING_TX_KEY, JSON.stringify(pending));
    return true;
  } catch (e) {
    console.error('Error saving pending transactions:', e);
    return false;
  }
}

function getAccountRequests() {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNT_REQUESTS_KEY)) || [];
  } catch (e) {
    console.error('Error reading account requests:', e);
    return [];
  }
}

function saveAccountRequests(requests) {
  try {
    localStorage.setItem(ACCOUNT_REQUESTS_KEY, JSON.stringify(requests));
    return true;
  } catch (e) {
    console.error('Error saving account requests:', e);
    return false;
  }
}

function getAuditLogs() {
  try {
    return JSON.parse(localStorage.getItem(AUDIT_LOGS_KEY)) || [];
  } catch (e) {
    console.error('Error reading audit logs:', e);
    return [];
  }
}

function saveAuditLogs(logs) {
  try {
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(logs));
    return true;
  } catch (e) {
    console.error('Error saving audit logs:', e);
    return false;
  }
}

// --- UTILITY FUNCTIONS ---
// =======================
function roundToTwo(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(amount);
}

// Create transaction record for user history
function createTxRecord(type, amount, balanceAfter, details = '') {
  return {
    type,
    amount: roundToTwo(amount),
    balanceAfter: roundToTwo(balanceAfter),
    details,
    timestamp: Date.now()
  };
}

// Generate unique request ID
function createRequestId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

// --- AUDIT LOGGING ---
// ====================
// CRITICAL: All sensitive operations are logged for compliance
function writeAuditLog(action, details = {}) {
  const logs = getAuditLogs();
  const logEntry = {
    id: createRequestId(),
    action,
    details,
    actor: getCurrentUsername() || 'system',
    role: getCurrentRole(),
    createdAt: Date.now()
  };
  logs.unshift(logEntry);
  saveAuditLogs(logs);
  return logEntry;
}

// --- AUTHORIZATION & RBAC ENGINE ---
// ===================================
// CRITICAL: These functions ENFORCE role-based access control
// NO UI-based access control is sufficient

function getCurrentRole() {
  return localStorage.getItem(CURRENT_USER_ROLE_KEY) || ROLES.VIEWER;
}

function getCurrentUsername() {
  return localStorage.getItem(CURRENT_USER_NAME_KEY) || '';
}

// CRITICAL: Permission verification
// This MUST be called before ANY sensitive operation
function hasPermission(permission) {
  const role = getCurrentRole();
  const rolePermissions = PERMISSIONS[role] || [];
  const hasAccess = rolePermissions.includes(permission);
  
  if (!hasAccess) {
    console.warn(`[SECURITY] ${role} attempted unauthorized action: ${permission}`);
  }
  
  return hasAccess;
}

// Enforce permission check with error
function assertPermission(permission) {
  if (!hasPermission(permission)) {
    const error = `[ACCESS DENIED] Permission required: ${permission}`;
    writeAuditLog('UNAUTHORIZED_ACCESS_ATTEMPT', { permission, timestamp: Date.now() });
    throw new Error(error);
  }
}

// Helper: Is current user an admin?
function isAdmin() {
  return getCurrentRole() === ROLES.ADMIN;
}

// Helper: Is current user a manager?
function isManager() {
  return getCurrentRole() === ROLES.MANAGER;
}

// Helper: Is current user a viewer/customer?
function isViewer() {
  return getCurrentRole() === ROLES.VIEWER;
}

function denyAccess() {
  alert('Access Denied: You do not have permission for this action.');
}

function showMessage(id, text, type) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = text;
    el.className = `message ${type}`;
    setTimeout(() => { 
      if (el.textContent === text) {
        el.textContent = '';
        el.className = 'message';
      }
    }, 3000);
  }
}

// --- AUTHENTICATION ---
// =====================
function loginAdmin(username, password) {
  const authUsers = getAuthUsers();
  const found = authUsers.find((u) => u.username === username && u.password === password);

  if (found) {
    localStorage.setItem(ADMIN_SESSION_KEY, 'true');
    localStorage.setItem(CURRENT_USER_ROLE_KEY, found.role);
    localStorage.setItem(CURRENT_USER_NAME_KEY, found.username);
    writeAuditLog('USER_LOGIN', { username, role: found.role });
    window.location.href = 'home.html';
    return true;
  }

  writeAuditLog('FAILED_LOGIN_ATTEMPT', { username });
  return false;
}

function logoutAdmin() {
  const username = getCurrentUsername();
  const role = getCurrentRole();
  writeAuditLog('USER_LOGOUT', { username, role });
  localStorage.removeItem(ADMIN_SESSION_KEY);
  localStorage.removeItem(CURRENT_USER_ROLE_KEY);
  localStorage.removeItem(CURRENT_USER_NAME_KEY);
  window.location.href = 'index.html';
}

function isAdminLoggedIn() {
  return localStorage.getItem(ADMIN_SESSION_KEY) === 'true';
}

// --- TRANSACTION HELPERS ---
// ==========================
function getPendingTransactionById(id) {
  return getPendingTransactions().find((tx) => tx.id === id) || null;
}

function getAccountRequestById(id) {
  return getAccountRequests().find((req) => req.id === id) || null;
}

function updatePendingTransaction(id, updates) {
  const pending = getPendingTransactions();
  const index = pending.findIndex((tx) => tx.id === id);
  if (index === -1) {
    return false;
  }
  pending[index] = { ...pending[index], ...updates };
  savePendingTransactions(pending);
  return true;
}

function updateAccountRequest(id, updates) {
  const requests = getAccountRequests();
  const index = requests.findIndex((req) => req.id === id);
  if (index === -1) {
    return false;
  }
  requests[index] = { ...requests[index], ...updates };
  saveAccountRequests(requests);
  return true;
}

// --- VALIDATION HELPERS ---
// =========================
function validateUsername(username) {
  if (!username || typeof username !== 'string') {
    throw new Error('Invalid username');
  }
  const trimmed = username.trim();
  if (trimmed.length === 0 || trimmed.length > 50) {
    throw new Error('Username must be 1-50 characters');
  }
  return trimmed;
}

function validateAmount(amount) {
  const num = Number(amount);
  if (!isFinite(num) || num <= 0) {
    throw new Error('Amount must be a positive number');
  }
  return roundToTwo(num);
}

function validateTransactionType(type) {
  const normalizedType = String(type || '').toLowerCase();
  if (!['deposit', 'withdraw', 'transfer'].includes(normalizedType)) {
    throw new Error('Invalid transaction type. Must be deposit, withdraw, or transfer.');
  }
  return normalizedType;
}

// Check if account exists
function userExists(username) {
  return getUsers().some((u) => u.username === username);
}

// Check if account request exists and is pending
function accountRequestExists(username) {
  return getAccountRequests().some((req) => req.username === username && req.status === 'PENDING');
}

// ============================================================
// CRITICAL: EXECUTION ENGINE
// ============================================================
// THIS IS THE ONLY PLACE WHERE ACCOUNT BALANCES ARE MODIFIED
// All operations MUST follow: REQUEST → APPROVAL → EXECUTION
// NO role bypasses this system
// ============================================================

function executeApprovedTransaction(txnId) {
  // CRITICAL: Verify transaction exists and is approved
  const txn = getPendingTransactionById(txnId);
  if (!txn) {
    throw new Error('Transaction not found');
  }
  
  if (txn.status !== 'APPROVED') {
    throw new Error(`Cannot execute transaction in ${txn.status} state. Only APPROVED transactions can be executed.`);
  }

  // Validate source account
  const users = getUsers();
  const sourceUser = users.find((u) => u.username === txn.fromUser);
  if (!sourceUser) {
    throw new Error('Source user not found');
  }

  // Validate source account state
  if (!sourceUser.isActive) {
    throw new Error('Source account is not active');
  }

  if (sourceUser.isFrozen) {
    throw new Error('Source account is frozen and cannot execute transactions');
  }

  const txnType = validateTransactionType(txn.type);
  const amount = roundToTwo(txn.amount);

  // DEPOSIT: Add funds to source account
  if (txnType === 'deposit') {
    sourceUser.balance = roundToTwo(sourceUser.balance + amount);
    sourceUser.transactions.unshift(
      createTxRecord('Deposit', amount, sourceUser.balance, `Approved deposit request #${txnId}`)
    );
  }
  // WITHDRAW: Remove funds from source account
  else if (txnType === 'withdraw') {
    if (amount > sourceUser.balance) {
      throw new Error(`Insufficient balance. Required: ${formatCurrency(amount)}, Available: ${formatCurrency(sourceUser.balance)}`);
    }
    sourceUser.balance = roundToTwo(sourceUser.balance - amount);
    sourceUser.transactions.unshift(
      createTxRecord('Withdraw', -amount, sourceUser.balance, `Approved withdrawal request #${txnId}`)
    );
  }
  // TRANSFER: Move funds between accounts
  else if (txnType === 'transfer') {
    const targetUser = users.find((u) => u.username === txn.toUser);
    if (!targetUser) {
      throw new Error('Transfer recipient not found');
    }

    // Validate recipient account state
    if (!targetUser.isActive) {
      throw new Error('Recipient account is not active');
    }

    if (targetUser.isFrozen) {
      throw new Error('Recipient account is frozen and cannot receive transfers');
    }

    // Validate sufficient balance
    if (amount > sourceUser.balance) {
      throw new Error(`Insufficient balance. Required: ${formatCurrency(amount)}, Available: ${formatCurrency(sourceUser.balance)}`);
    }

    // Execute transfer
    sourceUser.balance = roundToTwo(sourceUser.balance - amount);
    targetUser.balance = roundToTwo(targetUser.balance + amount);

    // Record in both accounts
    sourceUser.transactions.unshift(
      createTxRecord('Transfer Out', -amount, sourceUser.balance, `Transfer to ${targetUser.username} #${txnId}`)
    );
    targetUser.transactions.unshift(
      createTxRecord('Transfer In', amount, targetUser.balance, `Transfer from ${sourceUser.username} #${txnId}`)
    );
  }

  // Mark transaction as executed
  updatePendingTransaction(txnId, {
    status: 'EXECUTED',
    executedAt: Date.now()
  });

  // Persist all changes
  if (!saveUsers(users)) {
    throw new Error('Failed to persist transaction');
  }

  // Log execution
  writeAuditLog('TRANSACTION_EXECUTED', {
    transactionId: txnId,
    type: txnType,
    amount: amount,
    fromUser: txn.fromUser,
    toUser: txn.toUser || null,
    approvedBy: txn.approvedBy,
    executedAt: Date.now()
  });

  return true;
}

// --- REQUEST CREATION FUNCTIONS ---
// ==================================
// CRITICAL: These are the ONLY functions that create requests
// Lower roles cannot directly modify accounts

function createAccountRequest(data = {}) {
  // CRITICAL: Only viewers can create account requests
  assertPermission('CREATE_ACCOUNT_REQUEST');

  try {
    const username = validateUsername(data.username);

    // Prevent duplicate requests
    if (userExists(username)) {
      throw new Error(`Username "${username}" already exists in the system`);
    }

    if (accountRequestExists(username)) {
      throw new Error(`Account request for "${username}" is already pending approval`);
    }

    const request = {
      id: createRequestId(),
      username,
      status: 'PENDING',      // Awaiting manager approval
      createdBy: getCurrentUsername(),
      approvedBy: null,
      createdAt: Date.now(),
      approvedAt: null
    };

    const requests = getAccountRequests();
    requests.push(request);
    saveAccountRequests(requests);

    writeAuditLog('ACCOUNT_REQUEST_CREATED', {
      requestId: request.id,
      username: username,
      createdBy: getCurrentUsername()
    });

    return request;
  } catch (error) {
    writeAuditLog('ACCOUNT_REQUEST_FAILED', {
      error: error.message,
      createdBy: getCurrentUsername()
    });
    throw error;
  }
}

function createTransactionRequest(type, data = {}) {
  // CRITICAL: Only viewers can create transaction requests
  assertPermission('CREATE_TRANSACTION_REQUEST');

  try {
    const txnType = validateTransactionType(type);
    const fromUser = getCurrentUsername();
    const amount = validateAmount(data.amount);
    
    // Validate sender is requesting for their own account only
    if (data.fromUser && data.fromUser !== fromUser) {
      throw new Error('You can only create requests for your own account');
    }

    // Validate source account exists
    const users = getUsers();
    const sourceUser = users.find((u) => u.username === fromUser);
    if (!sourceUser) {
      throw new Error('Your account was not found in the system');
    }

    // Validate source account is active
    if (!sourceUser.isActive) {
      throw new Error('Your account is not yet activated. Please wait for manager approval.');
    }

    // Validate source account is not frozen
    if (sourceUser.isFrozen) {
      throw new Error('Your account is frozen and cannot initiate transactions');
    }

    // Transfer-specific validation
    if (txnType === 'transfer') {
      const toUser = validateUsername(data.toUser);
      const targetUser = users.find((u) => u.username === toUser);

      if (!targetUser) {
        throw new Error(`Recipient account "${toUser}" does not exist`);
      }

      if (!targetUser.isActive) {
        throw new Error(`Recipient account "${toUser}" is not active`);
      }

      if (targetUser.isFrozen) {
        throw new Error(`Recipient account "${toUser}" is frozen`);
      }

      if (fromUser === toUser) {
        throw new Error('Cannot transfer to the same account');
      }
    }

    // Create request (does NOT modify balance)
    const request = {
      id: createRequestId(),
      type: txnType,
      amount: amount,
      fromUser: fromUser,
      toUser: txnType === 'transfer' ? validateUsername(data.toUser) : undefined,
      status: 'PENDING',       // Awaiting manager approval
      createdBy: fromUser,
      approvedBy: null,
      createdAt: Date.now(),
      approvedAt: null,
      executedAt: null
    };

    const pending = getPendingTransactions();
    pending.push(request);
    savePendingTransactions(pending);

    writeAuditLog('TRANSACTION_REQUEST_CREATED', {
      requestId: request.id,
      type: txnType,
      amount: amount,
      fromUser: fromUser,
      toUser: request.toUser || null,
      createdBy: fromUser
    });

    return request;
  } catch (error) {
    writeAuditLog('TRANSACTION_REQUEST_FAILED', {
      error: error.message,
      createdBy: getCurrentUsername(),
      type: type
    });
    throw error;
  }
}

// --- APPROVAL WORKFLOW (Manager Only) ---
// ========================================
// CRITICAL: Only managers can approve requests
// Approval does NOT execute - execution is a separate step

function approveAccountRequest(id) {
  // CRITICAL: Only managers can approve account requests
  assertPermission('APPROVE_ACCOUNT_REQUEST');

  try {
    const request = getAccountRequestById(id);
    if (!request) {
      throw new Error('Account request not found');
    }

    // Cannot approve already processed requests
    if (request.status !== 'PENDING') {
      throw new Error(`Cannot approve request with status: ${request.status}. Only PENDING requests can be approved.`);
    }

    // Prevent race condition: verify user doesn't already exist
    const users = getUsers();
    if (userExists(request.username)) {
      throw new Error(`User "${request.username}" already exists. Request is stale.`);
    }

    // Create the user account
    const newUser = {
      username: request.username,
      balance: 0,                           // Start with zero balance
      transactions: [],
      isFrozen: false,
      isActive: true,                       // Account is now active
      createdAt: request.createdAt,
      activatedAt: Date.now()
    };

    users.push(newUser);

    // Mark request as approved
    updateAccountRequest(id, {
      status: 'APPROVED',
      approvedBy: getCurrentUsername(),
      approvedAt: Date.now()
    });

    // Persist changes
    saveUsers(users);

    writeAuditLog('ACCOUNT_REQUEST_APPROVED', {
      requestId: id,
      username: request.username,
      approvedBy: getCurrentUsername(),
      newUserCreated: true
    });

    return true;
  } catch (error) {
    writeAuditLog('ACCOUNT_REQUEST_APPROVAL_FAILED', {
      requestId: id,
      error: error.message,
      approvedBy: getCurrentUsername()
    });
    throw error;
  }
}

function rejectAccountRequest(id) {
  // CRITICAL: Only managers can reject account requests
  assertPermission('REJECT_ACCOUNT_REQUEST');

  try {
    const request = getAccountRequestById(id);
    if (!request) {
      throw new Error('Account request not found');
    }

    // Cannot reject already processed requests
    if (request.status !== 'PENDING') {
      throw new Error(`Cannot reject request with status: ${request.status}. Only PENDING requests can be rejected.`);
    }

    // Mark request as rejected
    updateAccountRequest(id, {
      status: 'REJECTED',
      approvedBy: getCurrentUsername(),
      approvedAt: Date.now()
    });

    writeAuditLog('ACCOUNT_REQUEST_REJECTED', {
      requestId: id,
      username: request.username,
      rejectedBy: getCurrentUsername()
    });

    return true;
  } catch (error) {
    writeAuditLog('ACCOUNT_REQUEST_REJECTION_FAILED', {
      requestId: id,
      error: error.message,
      rejectedBy: getCurrentUsername()
    });
    throw error;
  }
}

function approveTransactionRequest(id) {
  // CRITICAL: Only managers can approve transaction requests
  assertPermission('APPROVE_TRANSACTION_REQUEST');

  try {
    const txn = getPendingTransactionById(id);
    if (!txn) {
      throw new Error('Transaction request not found');
    }

    // Cannot approve already processed transactions
    if (txn.status !== 'PENDING') {
      throw new Error(`Cannot approve transaction with status: ${txn.status}. Only PENDING transactions can be approved.`);
    }

    // Mark transaction as approved
    updatePendingTransaction(id, {
      status: 'APPROVED',
      approvedBy: getCurrentUsername(),
      approvedAt: Date.now()
    });

    // Execute the approved transaction immediately
    try {
      executeApprovedTransaction(id);
    } catch (execError) {
      // If execution fails, revert approval
      updatePendingTransaction(id, {
        status: 'PENDING',
        approvedBy: null,
        approvedAt: null,
        executedAt: null
      });

      writeAuditLog('TRANSACTION_EXECUTION_FAILED_AFTER_APPROVAL', {
        transactionId: id,
        error: execError.message,
        approvedBy: getCurrentUsername()
      });

      throw new Error(`Approval successful but execution failed: ${execError.message}`);
    }

    return true;
  } catch (error) {
    writeAuditLog('TRANSACTION_APPROVAL_FAILED', {
      transactionId: id,
      error: error.message,
      approvedBy: getCurrentUsername()
    });
    throw error;
  }
}

function rejectTransactionRequest(id) {
  // CRITICAL: Only managers can reject transaction requests
  assertPermission('REJECT_TRANSACTION_REQUEST');

  try {
    const txn = getPendingTransactionById(id);
    if (!txn) {
      throw new Error('Transaction request not found');
    }

    // Cannot reject already processed transactions
    if (txn.status !== 'PENDING') {
      throw new Error(`Cannot reject transaction with status: ${txn.status}. Only PENDING transactions can be rejected.`);
    }

    // Mark transaction as rejected
    updatePendingTransaction(id, {
      status: 'REJECTED',
      approvedBy: getCurrentUsername(),
      approvedAt: Date.now()
    });

    writeAuditLog('TRANSACTION_REQUEST_REJECTED', {
      transactionId: id,
      type: txn.type,
      amount: txn.amount,
      rejectedBy: getCurrentUsername()
    });

    return true;
  } catch (error) {
    writeAuditLog('TRANSACTION_REJECTION_FAILED', {
      transactionId: id,
      error: error.message,
      rejectedBy: getCurrentUsername()
    });
    throw error;
  }
}

// --- ADMIN FUNCTIONS (View-only except freeze/delete) ---
// ======================================================

function freezeAccount(username) {
  // CRITICAL: Only admins can freeze accounts
  assertPermission('FREEZE_ACCOUNT');

  try {
    const users = getUsers();
    const user = users.find((u) => u.username === username);
    
    if (!user) {
      throw new Error(`User "${username}" not found`);
    }

    if (user.isFrozen) {
      throw new Error(`Account "${username}" is already frozen`);
    }

    user.isFrozen = true;
    user.transactions.unshift(
      createTxRecord('System', 0, user.balance, '[ADMIN] Account frozen')
    );

    saveUsers(users);
    writeAuditLog('ACCOUNT_FROZEN', {
      username: username,
      frozenBy: getCurrentUsername()
    });

    return true;
  } catch (error) {
    writeAuditLog('ACCOUNT_FREEZE_FAILED', {
      username: username,
      error: error.message,
      actor: getCurrentUsername()
    });
    throw error;
  }
}

function unfreezeAccount(username) {
  // CRITICAL: Only admins can unfreeze accounts
  assertPermission('UNFREEZE_ACCOUNT');

  try {
    const users = getUsers();
    const user = users.find((u) => u.username === username);

    if (!user) {
      throw new Error(`User "${username}" not found`);
    }

    if (!user.isFrozen) {
      throw new Error(`Account "${username}" is not frozen`);
    }

    user.isFrozen = false;
    user.transactions.unshift(
      createTxRecord('System', 0, user.balance, '[ADMIN] Account unfrozen')
    );

    saveUsers(users);
    writeAuditLog('ACCOUNT_UNFROZEN', {
      username: username,
      unfroozenBy: getCurrentUsername()
    });

    return true;
  } catch (error) {
    writeAuditLog('ACCOUNT_UNFREEZE_FAILED', {
      username: username,
      error: error.message,
      actor: getCurrentUsername()
    });
    throw error;
  }
}

function deleteUser(username) {
  // CRITICAL: Only admins can delete users
  assertPermission('DELETE_USER');

  try {
    const users = getUsers();
    const userIndex = users.findIndex((u) => u.username === username);

    if (userIndex === -1) {
      throw new Error(`User "${username}" not found`);
    }

    const deletedUser = users[userIndex];
    users.splice(userIndex, 1);

    saveUsers(users);
    writeAuditLog('USER_DELETED', {
      username: username,
      deletedBy: getCurrentUsername(),
      userBalance: deletedUser.balance,
      txCount: deletedUser.transactions ? deletedUser.transactions.length : 0
    });

    return true;
  } catch (error) {
    writeAuditLog('USER_DELETION_FAILED', {
      username: username,
      error: error.message,
      actor: getCurrentUsername()
    });
    throw error;
  }
}

// --- UI SETUP & NAVIGATION ---
// =============================

function setRoleTextInHeader() {
  const adminNameEl = document.getElementById('adminName');
  if (!adminNameEl) return;
  const uname = getCurrentUsername() || 'User';
  const role = getCurrentRole();
  const roleLabel = {
    [ROLES.ADMIN]: 'Admin',
    [ROLES.MANAGER]: 'Manager',
    [ROLES.VIEWER]: 'Customer'
  }[role] || role;
  adminNameEl.textContent = `${uname} (${roleLabel})`;
}

function applyRoleBasedUIState() {
  const role = getCurrentRole();

  // Hide all sections by default
  const sections = {
    dashboard: document.getElementById('dashboard-section'),
    requests: document.getElementById('requests-section'),
    approvals: document.getElementById('approvals-section'),
    users: document.getElementById('users-section'),
    logs: document.getElementById('logs-section'),
    transactions: document.getElementById('transactions-section'),
    controls: document.getElementById('controls-section')
  };

  const menus = {
    dashboard: document.getElementById('menuDashboard'),
    requests: document.getElementById('menuRequests'),
    approvals: document.getElementById('menuApprovals'),
    users: document.getElementById('menuUsers'),
    logs: document.getElementById('menuLogs'),
    transactions: document.getElementById('menuTransactions'),
    controls: document.getElementById('menuControls')
  };

  Object.values(sections).forEach(sec => {
    if (sec) sec.style.display = 'none';
  });

  // Show dashboard for all roles
  if (sections.dashboard) sections.dashboard.style.display = 'block';
  if (menus.dashboard) menus.dashboard.style.display = '';

  // VIEWER: Request Account + Request Transaction
  if (role === ROLES.VIEWER) {
    if (sections.requests) sections.requests.style.display = 'block';
    if (menus.requests) menus.requests.style.display = '';
    
    // Hide everything else
    if (menus.approvals) menus.approvals.style.display = 'none';
    if (menus.users) menus.users.style.display = 'none';
    if (menus.logs) menus.logs.style.display = 'none';
    if (menus.controls) menus.controls.style.display = 'none';
  }

  // MANAGER: Pending Requests + Pending Transactions
  if (role === ROLES.MANAGER) {
    if (sections.approvals) sections.approvals.style.display = 'block';
    if (menus.approvals) menus.approvals.style.display = '';

    // Hide other sections
    if (menus.requests) menus.requests.style.display = 'none';
    if (menus.users) menus.users.style.display = 'none';
    if (menus.logs) menus.logs.style.display = 'none';
    if (menus.controls) menus.controls.style.display = 'none';
  }

  // ADMIN: Everything (Users, Logs, Transactions, Controls)
  if (role === ROLES.ADMIN) {
    if (sections.users) sections.users.style.display = 'block';
    if (sections.logs) sections.logs.style.display = 'block';
    if (sections.transactions) sections.transactions.style.display = 'block';
    if (sections.controls) sections.controls.style.display = 'block';

    if (menus.users) menus.users.style.display = '';
    if (menus.logs) menus.logs.style.display = '';
    if (menus.transactions) menus.transactions.style.display = '';
    if (menus.controls) menus.controls.style.display = '';

    // Hide request/approval sections for admin
    if (menus.requests) menus.requests.style.display = 'none';
    if (menus.approvals) menus.approvals.style.display = 'none';
  }
}

function setupNavigation() {
  const menuItems = document.querySelectorAll('.sidebar-menu li[data-target]');
  const sections = document.querySelectorAll('.section');

  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      // Update active menu item
      menuItems.forEach(m => m.classList.remove('active'));
      item.classList.add('active');

      // Update active section
      const target = item.dataset.target;
      sections.forEach(sec => sec.classList.remove('active'));
      const targetSection = document.getElementById(target);
      if (targetSection) targetSection.classList.add('active');

      // Refresh data for specific views
      if (target === 'requests-section') {
        renderPendingAccountRequests();
      } else if (target === 'approvals-section') {
        renderPendingAccountRequests();
        renderPendingTransactions();
      } else if (target === 'users-section') {
        renderUsersTable();
      } else if (target === 'logs-section') {
        renderAuditLogs();
      } else if (target === 'transactions-section') {
        populateUserFilter();
        renderAllTransactions();
      } else if (target === 'dashboard-section') {
        renderDashboard();
      }
    });
  });
}

// --- SYSTEM TIME ---
function updateSystemTime() {
  const timeEl = document.getElementById('systemTime');
  if (timeEl) {
    timeEl.textContent = new Date().toLocaleString('en-IN');
  }
}

// --- DASHBOARD RENDERING ---
function renderDashboard() {
  const users = getUsers();
  const statUsers = document.getElementById('stat-users');
  const statFunds = document.getElementById('stat-funds');
  const statTxs = document.getElementById('stat-txs');

  if (!statUsers) return;

  let totalFunds = 0;
  let allTxs = [];

  users.forEach(u => {
    totalFunds += u.balance;
    if (u.transactions) {
      u.transactions.forEach(tx => {
        allTxs.push({ ...tx, username: u.username });
      });
    }
  });

  allTxs.sort((a, b) => b.timestamp - a.timestamp);

  statUsers.textContent = users.length;
  statFunds.textContent = formatCurrency(totalFunds);
  statTxs.textContent = allTxs.length;

  const dashTableBody = document.querySelector('#dash-tx-table tbody');
  if (dashTableBody) {
    dashTableBody.innerHTML = '';

    allTxs.slice(0, 10).forEach(tx => {
      const tr = document.createElement('tr');
      const isCredit = tx.amount > 0;
      const isDebit = tx.amount < 0;
      const amountColor = isCredit ? 'var(--success)' : (isDebit ? 'var(--danger)' : 'inherit');

      tr.innerHTML = `
        <td>${new Date(tx.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</td>
        <td><strong>${tx.username}</strong></td>
        <td>${tx.type}</td>
        <td style="color: ${amountColor}">${isCredit ? '+' : ''}${formatCurrency(tx.amount)}</td>
      `;
      dashTableBody.appendChild(tr);
    });
  }
}

// --- USERS MANAGEMENT RENDERING ---
function renderUsersTable(filterText = '') {
  // Only admins can view users
  if (!isAdmin()) return;

  const users = getUsers();
  const tbody = document.querySelector('#users-table tbody');
  if (!tbody) return;

  tbody.innerHTML = '';

  const filteredUsers = filterText
    ? users.filter(u => u.username.toLowerCase().includes(filterText.toLowerCase()))
    : users;

  filteredUsers.forEach(u => {
    const tr = document.createElement('tr');
    const txCount = u.transactions ? u.transactions.length : 0;
    const statusClass = u.isFrozen ? 'frozen' : (u.isActive ? 'active' : 'inactive');
    const statusText = u.isFrozen ? '🔒 Frozen' : (u.isActive ? '✓ Active' : '⏳ Inactive');
    const freezeLabel = u.isFrozen ? 'Unfreeze' : 'Freeze';

    tr.innerHTML = `
      <td><strong>${u.username}</strong></td>
      <td><span class="status-${statusClass}">${statusText}</span></td>
      <td>${formatCurrency(u.balance)}</td>
      <td>${txCount}</td>
      <td>
        <button class="accent-btn freeze-btn" data-username="${u.username}" style="padding: 6px 10px; font-size:13px; margin-left: 5px;">${freezeLabel}</button>
        <button class="danger-btn del-btn" data-username="${u.username}" style="padding: 6px 10px; font-size:13px; margin-left: 5px;">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Attach event listeners
  document.querySelectorAll('.freeze-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const username = e.target.dataset.username;
      try {
        const users = getUsers();
        const user = users.find(u => u.username === username);
        if (user.isFrozen) {
          unfreezeAccount(username);
        } else {
          freezeAccount(username);
        }
        showMessage('controlMessage', `Account ${user.isFrozen ? 'frozen' : 'unfrozen'}.`, 'success');
        renderUsersTable(filterText);
      } catch (error) {
        showMessage('controlMessage', error.message, 'error');
      }
    });
  });

  document.querySelectorAll('.del-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      openDeleteModal(e.target.dataset.username);
    });
  });
}

// --- TRANSACTIONS RENDERING ---
function populateUserFilter() {
  const users = getUsers();
  const filter = document.getElementById('filterUser');
  if (!filter) return;

  const currentVal = filter.value;
  filter.innerHTML = '<option value="ALL">All Users</option>';

  users.forEach(u => {
    const opt = document.createElement('option');
    opt.value = u.username;
    opt.textContent = u.username;
    filter.appendChild(opt);
  });

  if ([...filter.options].some(o => o.value === currentVal)) {
    filter.value = currentVal;
  }
}

function renderAllTransactions() {
  // Only admins can view all transactions
  if (!isAdmin()) return;

  const users = getUsers();
  const tbody = document.querySelector('#all-transactions-table tbody');
  if (!tbody) return;

  const fUser = document.getElementById('filterUser')?.value || 'ALL';
  const fType = document.getElementById('filterType')?.value || 'ALL';

  let allTxs = [];
  users.forEach(u => {
    if (fUser === 'ALL' || fUser === u.username) {
      if (u.transactions) {
        u.transactions.forEach(tx => {
          if (fType === 'ALL' || fType === tx.type) {
            allTxs.push({ ...tx, username: u.username });
          }
        });
      }
    }
  });

  allTxs.sort((a, b) => b.timestamp - a.timestamp);

  tbody.innerHTML = '';
  allTxs.forEach(tx => {
    const tr = document.createElement('tr');
    const isCredit = tx.amount > 0;
    const isDebit = tx.amount < 0;
    const amountColor = isCredit ? 'var(--success)' : (isDebit ? 'var(--danger)' : 'inherit');

    tr.innerHTML = `
      <td>${new Date(tx.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
      <td><strong>${tx.username}</strong></td>
      <td>${tx.type}</td>
      <td style="color: ${amountColor}">${isCredit ? '+' : ''}${formatCurrency(tx.amount)}</td>
      <td>${tx.details}</td>
    `;
    tbody.appendChild(tr);
  });
}

// --- PENDING REQUESTS RENDERING ---
function renderPendingAccountRequests() {
  const tbody = document.querySelector('#pending-account-requests tbody');
  if (!tbody) return;

  const requests = getAccountRequests()
    .filter((req) => req.status === 'PENDING')
    .sort((a, b) => b.createdAt - a.createdAt);

  tbody.innerHTML = '';

  if (requests.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#999;">No pending account requests</td></tr>';
    return;
  }

  requests.forEach((request) => {
    const tr = document.createElement('tr');
    const canApprove = isManager();

    const actionCol = canApprove
      ? `<button class="accent-btn approve-account-btn" data-id="${request.id}" style="padding: 6px 10px; font-size:13px;">Approve</button>
         <button class="danger-btn reject-account-btn" data-id="${request.id}" style="padding: 6px 10px; font-size:13px; margin-left: 5px;">Reject</button>`
      : '<span style="color:#999;">View Only</span>';

    tr.innerHTML = `
      <td>${new Date(request.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
      <td><strong>${request.username}</strong></td>
      <td>${request.createdBy}</td>
      <td>${actionCol}</td>
    `;
    tbody.appendChild(tr);
  });

  // Attach event listeners
  document.querySelectorAll('.approve-account-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      try {
        approveAccountRequest(id);
        showMessage('controlMessage', 'Account request approved and user created.', 'success');
        renderPendingAccountRequests();
        renderUsersTable();
      } catch (error) {
        showMessage('controlMessage', error.message, 'error');
      }
    });
  });

  document.querySelectorAll('.reject-account-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      try {
        rejectAccountRequest(id);
        showMessage('controlMessage', 'Account request rejected.', 'success');
        renderPendingAccountRequests();
      } catch (error) {
        showMessage('controlMessage', error.message, 'error');
      }
    });
  });
}

function renderPendingTransactions() {
  const tbody = document.querySelector('#pending-transactions-table tbody');
  if (!tbody) return;

  const pending = getPendingTransactions()
    .filter((tx) => tx.status === 'PENDING')
    .sort((a, b) => b.createdAt - a.createdAt);

  tbody.innerHTML = '';

  if (pending.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#999;">No pending transaction requests</td></tr>';
    return;
  }

  pending.forEach((tx) => {
    const tr = document.createElement('tr');
    const canApprove = isManager();

    const actionCol = canApprove
      ? `<button class="accent-btn approve-btn" data-id="${tx.id}" style="padding: 6px 10px; font-size:13px;">Approve</button>
         <button class="danger-btn reject-btn" data-id="${tx.id}" style="padding: 6px 10px; font-size:13px; margin-left: 5px;">Reject</button>`
      : '<span style="color:#999;">View Only</span>';

    tr.innerHTML = `
      <td>${new Date(tx.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
      <td><strong>${tx.type.toUpperCase()}</strong></td>
      <td>${tx.fromUser}</td>
      <td>${tx.toUser || '-'}</td>
      <td>${formatCurrency(tx.amount)}</td>
      <td>${tx.createdBy}</td>
      <td>${actionCol}</td>
    `;
    tbody.appendChild(tr);
  });

  // Attach event listeners
  document.querySelectorAll('.approve-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      try {
        approveTransactionRequest(id);
        showMessage('controlMessage', 'Transaction approved and executed.', 'success');
        renderPendingTransactions();
        renderDashboard();
        renderUsersTable();
        renderAllTransactions();
      } catch (error) {
        showMessage('controlMessage', error.message, 'error');
      }
    });
  });

  document.querySelectorAll('.reject-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      try {
        rejectTransactionRequest(id);
        showMessage('controlMessage', 'Transaction request rejected.', 'success');
        renderPendingTransactions();
      } catch (error) {
        showMessage('controlMessage', error.message, 'error');
      }
    });
  });
}

function renderAuditLogs() {
  // Only admins can view audit logs
  if (!isAdmin()) return;

  const tbody = document.querySelector('#audit-logs-table tbody');
  if (!tbody) return;

  const logs = getAuditLogs().slice(0, 100);
  tbody.innerHTML = '';

  if (logs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#999;">No audit logs</td></tr>';
    return;
  }

  logs.forEach((log) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${new Date(log.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
      <td><strong>${log.action}</strong></td>
      <td>${log.actor}</td>
      <td>${log.role}</td>
      <td style="font-size:12px; max-width:300px; overflow:auto;">${JSON.stringify(log.details)}</td>
    `;
    tbody.appendChild(tr);
  });
}

// --- MODAL MANAGEMENT ---
// =======================
let selectedUserForAction = null;

function openAddUserModal() {
  if (!isViewer()) {
    denyAccess();
    return;
  }

  document.getElementById('newUsername').value = '';
  document.getElementById('addUserMsg').textContent = '';
  document.getElementById('addUserModal').classList.add('active');
}

function closeAddUserModal() {
  document.getElementById('addUserModal').classList.remove('active');
}

function addUser() {
  try {
    const uname = document.getElementById('newUsername').value.trim();

    if (!uname) {
      showMessage('addUserMsg', 'Username is required', 'error');
      return;
    }

    createAccountRequest({ username: uname });
    showMessage('addUserMsg', 'Account request submitted. Awaiting manager approval.', 'success');
    closeAddUserModal();
    renderPendingAccountRequests();
  } catch (error) {
    showMessage('addUserMsg', error.message, 'error');
  }
}

function openManageModal(username) {
  if (!isViewer()) {
    denyAccess();
    return;
  }

  selectedUserForAction = username || getCurrentUsername();
  document.getElementById('requestTransactionFrom').textContent = selectedUserForAction;
  document.getElementById('requestTransactionTo').value = '';
  document.getElementById('requestTransactionAmount').value = '';
  document.getElementById('requestTransactionMsg').textContent = '';
  document.getElementById('manageBalanceModal').classList.add('active');
}

function closeManageModal() {
  document.getElementById('manageBalanceModal').classList.remove('active');
  selectedUserForAction = null;
}

function applyManageUser() {
  try {
    const action = document.getElementById('manageAction').value;
    const amount = Number(document.getElementById('requestTransactionAmount').value);
    const toUser = document.getElementById('requestTransactionTo').value.trim();

    if (!amount || amount <= 0) {
      showMessage('requestTransactionMsg', 'Amount must be greater than 0', 'error');
      return;
    }

    if (action === 'transfer' && !toUser) {
      showMessage('requestTransactionMsg', 'Recipient username is required for transfers', 'error');
      return;
    }

    if (action === 'deposit' || action === 'withdraw') {
      createTransactionRequest(action, { amount });
    } else if (action === 'transfer') {
      createTransactionRequest('transfer', { amount, toUser });
    }

    showMessage('requestTransactionMsg', 'Transaction request submitted. Awaiting manager approval.', 'success');
    closeManageModal();
    renderPendingTransactions();
  } catch (error) {
    showMessage('requestTransactionMsg', error.message, 'error');
  }
}

function openDeleteModal(username) {
  if (!isAdmin()) {
    denyAccess();
    return;
  }

  selectedUserForAction = username;
  document.getElementById('deleteUsername').textContent = username;
  document.getElementById('deleteUserModal').classList.add('active');
}

function closeDeleteModal() {
  document.getElementById('deleteUserModal').classList.remove('active');
  selectedUserForAction = null;
}

function executeDeleteUser() {
  if (!isAdmin() || !selectedUserForAction) return;

  try {
    deleteUser(selectedUserForAction);
    showMessage('controlMessage', `User "${selectedUserForAction}" deleted.`, 'success');
    closeDeleteModal();
    renderUsersTable();
    renderDashboard();
  } catch (error) {
    showMessage('controlMessage', error.message, 'error');
  }
}

// --- DEPRECATED: Legacy transaction helpers (maintained for backwards compatibility) ---
function deposit(username, amount) {
  return createTransactionRequest('deposit', { amount });
}

function withdraw(username, amount) {
  return createTransactionRequest('withdraw', { amount });
}

function transfer(username, toUsername, amount) {
  return createTransactionRequest('transfer', { amount, toUser: toUsername });
}

// --- DISABLED CONTROLS (Admin-only functions) ---
// These are intentionally disabled to enforce request-based system
function applyGlobalInterest() {
  denyAccess();
}

function undoGlobalAction() {
  denyAccess();
}

function purgeData() {
  denyAccess();
}

// --- PAGE SETUP ---
// =================

function setupLoginPage() {
  const loginForm = document.getElementById('loginForm');
  if (!loginForm) return;

  initData();

  // Redirect if already logged in
  if (isAdminLoggedIn()) {
    window.location.href = 'home.html';
    return;
  }

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username || !password) {
      showMessage('loginMessage', 'Username and password are required', 'error');
      return;
    }

    if (loginAdmin(username, password)) {
      // Redirect is handled by loginAdmin()
    } else {
      showMessage('loginMessage', 'Invalid username or password', 'error');
      document.getElementById('username').focus();
    }
  });
}

function setupAdminPage() {
  const topbar = document.getElementById('topbar-title');
  if (!topbar) return;

  // Check authentication
  if (!isAdminLoggedIn()) {
    window.location.href = 'index.html';
    return;
  }

  // Initialize data
  initData();

  // Set up UI for current role
  setRoleTextInHeader();
  applyRoleBasedUIState();
  setupNavigation();

  // Update system time
  updateSystemTime();
  setInterval(updateSystemTime, 1000);

  // Initial data load
  renderDashboard();
  renderPendingAccountRequests();
  renderPendingTransactions();
  renderAuditLogs();

  // Setup user search for admins
  const searchUserInput = document.getElementById('searchUserInput');
  if (searchUserInput) {
    searchUserInput.addEventListener('input', (e) => renderUsersTable(e.target.value));
  }

  // Setup buttons
  const showAddUserBtn = document.getElementById('showAddUserBtn');
  if (showAddUserBtn) {
    showAddUserBtn.addEventListener('click', openAddUserModal);
  }

  const showManageModalBtn = document.getElementById('showManageModalBtn');
  if (showManageModalBtn) {
    showManageModalBtn.addEventListener('click', () => openManageModal(getCurrentUsername()));
  }

  // Modal close buttons
  document.getElementById('closeAddUserModal')?.addEventListener('click', closeAddUserModal);
  document.getElementById('confirmAddUserBtn')?.addEventListener('click', addUser);

  document.getElementById('closeManageModal')?.addEventListener('click', closeManageModal);
  document.getElementById('confirmManageBtn')?.addEventListener('click', applyManageUser);

  document.getElementById('closeDeleteModal')?.addEventListener('click', closeDeleteModal);
  document.getElementById('confirmDeleteBtn')?.addEventListener('click', executeDeleteUser);

  // Logout button
  document.getElementById('logoutBtn')?.addEventListener('click', logoutAdmin);

  // Transaction filters
  document.getElementById('filterUser')?.addEventListener('change', renderAllTransactions);
  document.getElementById('filterType')?.addEventListener('change', renderAllTransactions);

  // System controls (all disabled to enforce workflow)
  document.getElementById('applyInterestBtn')?.addEventListener('click', applyGlobalInterest);
  document.getElementById('undoGlobalBtn')?.addEventListener('click', undoGlobalAction);
  document.getElementById('clearAllHistoryBtn')?.addEventListener('click', purgeData);
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  // Simulate CI/CD failure if flag is set
  if (FORCE_ERROR) {
    throw new Error('INTENTIONAL ERROR: FORCE_ERROR flag is true. Simulating CI/CD failure.');
  }

  // Setup pages based on current location
  setupLoginPage();
  setupAdminPage();
});
