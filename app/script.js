// --- Constants & Keys ---
const USERS_KEY = 'bankUsersData';
const AUTH_USERS_KEY = 'bankAuthUsers';
const PENDING_TX_KEY = 'bankPendingTransactions';
const ACCOUNT_REQUESTS_KEY = 'bankAccountRequests';
const AUDIT_LOGS_KEY = 'bankAuditLogs';
const ADMIN_SESSION_KEY = 'adminSession';
const CURRENT_USER_ROLE_KEY = 'currentUserRole';
const CURRENT_USER_NAME_KEY = 'currentUsername';
const LAST_GLOBAL_KEY = 'lastGlobalAction'; // Store info for undoing
const FORCE_ERROR = false; // Set to true to simulate CI/CD failure during demo

const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  VIEWER: 'viewer'
};

const ACTIONS = {
  CREATE_REQUEST: 'CREATE_REQUEST',
  APPROVE: 'APPROVE',
  FREEZE: 'FREEZE',
  DELETE_USER: 'DELETE_USER',
  VIEW_ONLY: 'VIEW_ONLY',
  VIEW_ALL: 'VIEW_ALL'
};

// Strict permission map for the banking simulation.
const PERMISSIONS = {
  [ROLES.ADMIN]: [ACTIONS.VIEW_ALL, ACTIONS.FREEZE, ACTIONS.DELETE_USER],
  [ROLES.MANAGER]: [ACTIONS.APPROVE],
  [ROLES.VIEWER]: [ACTIONS.CREATE_REQUEST]
};

// --- Initialization ---
function initData() {
  if (!localStorage.getItem(USERS_KEY)) {
    // Seed demo account/balance data
    const defaultData = [
      { username: 'user1', balance: 10000, transactions: [], isFrozen: false, isActive: true },
      { username: 'testuser', balance: 500, transactions: [], isFrozen: false, isActive: true }
    ];
    localStorage.setItem(USERS_KEY, JSON.stringify(defaultData));
  }

  if (!localStorage.getItem(AUTH_USERS_KEY)) {
    // Demo auth users with roles for RBAC
    const demoAuthUsers = [
      { username: 'admin', password: 'admin123', role: ROLES.ADMIN },
      { username: 'manager', password: 'manager123', role: ROLES.MANAGER },
      { username: 'viewer', password: 'viewer123', role: ROLES.VIEWER }
    ];
    localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(demoAuthUsers));
  }

  if (!localStorage.getItem(PENDING_TX_KEY)) {
    localStorage.setItem(PENDING_TX_KEY, JSON.stringify([]));
  }

  if (!localStorage.getItem(ACCOUNT_REQUESTS_KEY)) {
    localStorage.setItem(ACCOUNT_REQUESTS_KEY, JSON.stringify([]));
  }

  if (!localStorage.getItem(AUDIT_LOGS_KEY)) {
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify([]));
  }
}

// --- LocalStorage Helpers ---
function getUsers() {
  try {
    const users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    // Keep backward compatibility for old entries without lifecycle flags.
    return users.map((u) => ({ ...u, isFrozen: Boolean(u.isFrozen), isActive: u.isActive !== false }));
  } catch (e) {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getAuthUsers() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_USERS_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function getPendingTransactions() {
  try {
    return JSON.parse(localStorage.getItem(PENDING_TX_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function savePendingTransactions(pending) {
  localStorage.setItem(PENDING_TX_KEY, JSON.stringify(pending));
}

function getAccountRequests() {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNT_REQUESTS_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveAccountRequests(requests) {
  localStorage.setItem(ACCOUNT_REQUESTS_KEY, JSON.stringify(requests));
}

function getAuditLogs() {
  try {
    return JSON.parse(localStorage.getItem(AUDIT_LOGS_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveAuditLogs(logs) {
  localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(logs));
}

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

// Transaction factory
function createTxRecord(type, amount, balanceAfter, details = '') {
  return {
    type,
    amount: roundToTwo(amount),
    balanceAfter: roundToTwo(balanceAfter),
    details,
    timestamp: Date.now()
  };
}

function writeAuditLog(action, details = {}) {
  const logs = getAuditLogs();
  logs.unshift({
    id: createRequestId(),
    action,
    details,
    actor: getCurrentUsername() || 'system',
    role: getCurrentRole(),
    createdAt: Date.now()
  });
  saveAuditLogs(logs);
}

// --- Authentication + RBAC ---
function getCurrentRole() {
  return localStorage.getItem(CURRENT_USER_ROLE_KEY) || ROLES.VIEWER;
}

function getCurrentUsername() {
  return localStorage.getItem(CURRENT_USER_NAME_KEY) || '';
}

function hasPermission(action) {
  const role = localStorage.getItem(CURRENT_USER_ROLE_KEY) || ROLES.VIEWER;
  const permissionsForRole = PERMISSIONS[role] || [];
  return permissionsForRole.includes(action);
}

function denyAccess() {
  alert('Access Denied');
}

function loginAdmin(username, password) {
  const authUsers = getAuthUsers();
  const found = authUsers.find((u) => u.username === username && u.password === password);

  if (found) {
    localStorage.setItem(ADMIN_SESSION_KEY, 'true');
    localStorage.setItem(CURRENT_USER_ROLE_KEY, found.role);
    localStorage.setItem(CURRENT_USER_NAME_KEY, found.username);
    window.location.href = 'home.html';
    return true;
  }

  return false;
}

function logoutAdmin() {
  localStorage.removeItem(ADMIN_SESSION_KEY);
  localStorage.removeItem(CURRENT_USER_ROLE_KEY);
  localStorage.removeItem(CURRENT_USER_NAME_KEY);
  window.location.href = 'index.html';
}

function isAdminLoggedIn() {
  return localStorage.getItem(ADMIN_SESSION_KEY) === 'true';
}

function showMessage(id, text, type) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = text;
    el.className = `message ${type}`;
    setTimeout(() => { if(el.textContent===text) el.textContent=''; el.className='message'; }, 3000);
  }
}

function createRequestId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function getPendingTransactionById(id) {
  return getPendingTransactions().find((transaction) => transaction.id === id) || null;
}

function persistPendingTransaction(updatedTxn) {
  const pending = getPendingTransactions();
  const index = pending.findIndex((transaction) => transaction.id === updatedTxn.id);
  if (index === -1) {
    return false;
  }
  pending[index] = updatedTxn;
  savePendingTransactions(pending);
  return true;
}

function assertRoleAllowedForManagement() {
  if (getCurrentRole() !== ROLES.ADMIN) {
    denyAccess();
    return false;
  }
  return true;
}

function assertManagerApprovalAccess() {
  if (getCurrentRole() !== ROLES.MANAGER) {
    denyAccess();
    return false;
  }
  return true;
}

function setRoleTextInHeader() {
  const adminNameEl = document.getElementById('adminName');
  if (!adminNameEl) return;
  const uname = getCurrentUsername() || 'User';
  adminNameEl.textContent = `${uname} (${getCurrentRole()})`;
}

function applyRoleBasedUIState() {
  const role = getCurrentRole();

  const requestSection = document.getElementById('requests-section');
  const approvalsSection = document.getElementById('approvals-section');
  const usersSection = document.getElementById('users-section');
  const logsSection = document.getElementById('logs-section');
  const controlsSection = document.getElementById('controls-section');

  const usersMenu = document.getElementById('menuUsers');
  const requestsMenu = document.getElementById('menuRequests');
  const approvalsMenu = document.getElementById('menuApprovals');
  const logsMenu = document.getElementById('menuLogs');
  const controlsMenu = document.getElementById('menuControls');
  const showAddUserBtn = document.getElementById('showAddUserBtn');

  const interestBtn = document.getElementById('applyInterestBtn');
  const undoBtn = document.getElementById('undoGlobalBtn');
  const clearBtn = document.getElementById('clearAllHistoryBtn');

  const hideAll = [requestSection, approvalsSection, usersSection, logsSection, controlsSection];
  hideAll.forEach((section) => {
    if (section) section.style.display = 'none';
  });

  if (role === ROLES.VIEWER) {
    if (requestsMenu) requestsMenu.style.display = '';
    if (approvalsMenu) approvalsMenu.style.display = 'none';
    if (usersMenu) usersMenu.style.display = 'none';
    if (logsMenu) logsMenu.style.display = 'none';
    if (controlsMenu) controlsMenu.style.display = 'none';
    if (requestSection) requestSection.style.display = 'block';
    return;
  }

  if (role === ROLES.MANAGER) {
    if (requestsMenu) requestsMenu.style.display = 'none';
    if (approvalsMenu) approvalsMenu.style.display = '';
    if (usersMenu) usersMenu.style.display = 'none';
    if (logsMenu) logsMenu.style.display = 'none';
    if (controlsMenu) controlsMenu.style.display = 'none';
    if (approvalsSection) approvalsSection.style.display = 'block';
    return;
  }

  if (role === ROLES.ADMIN) {
    if (requestsMenu) requestsMenu.style.display = 'none';
    if (approvalsMenu) approvalsMenu.style.display = 'none';
    if (usersMenu) usersMenu.style.display = '';
    if (logsMenu) logsMenu.style.display = '';
    if (controlsMenu) controlsMenu.style.display = '';
    if (usersSection) usersSection.style.display = 'block';
    if (logsSection) logsSection.style.display = 'block';
    if (controlsSection) controlsSection.style.display = 'block';
    if (showAddUserBtn) showAddUserBtn.disabled = false;
    if (interestBtn) interestBtn.style.display = 'none';
    if (undoBtn) undoBtn.style.display = 'none';
    if (clearBtn) clearBtn.style.display = 'none';
  }
}

function createTransactionRequest(type, data = {}) {
  if (getCurrentRole() !== ROLES.VIEWER) {
    denyAccess();
    return null;
  }

  const normalizedType = String(type || '').toLowerCase();
  if (!['deposit', 'withdraw', 'transfer'].includes(normalizedType)) {
    throw new Error('Unsupported transaction type');
  }

  const fromUser = getCurrentUsername().trim();
  const toUser = String(data.toUser || '').trim();
  const amount = roundToTwo(Number(data.amount));

  if (!fromUser || !amount || amount <= 0) {
    throw new Error('Valid transaction details are required');
  }

  if (normalizedType === 'transfer' && (!toUser || fromUser === toUser)) {
    throw new Error('Transfer recipient is required');
  }

  const users = getUsers();
  const sourceUser = users.find((user) => user.username === fromUser);
  const targetUser = normalizedType === 'transfer' ? users.find((user) => user.username === toUser) : null;

  if (!sourceUser) {
    throw new Error('Source user not found');
  }

  if (!sourceUser.isActive || sourceUser.isFrozen) {
    throw new Error('Source account is frozen');
  }

  if (normalizedType === 'transfer' && (!targetUser || targetUser.isFrozen)) {
    throw new Error('Transfer target account is unavailable');
  }

  const request = {
    id: createRequestId(),
    type: normalizedType,
    amount,
    fromUser,
    toUser: normalizedType === 'transfer' ? toUser : undefined,
    status: 'PENDING',
    createdBy: getCurrentUsername() || 'system',
    approvedBy: null,
    createdAt: Date.now(),
    approvedAt: null
  };

  const pending = getPendingTransactions();
  pending.push(request);
  savePendingTransactions(pending);
  return request;
}

function createAccountRequest(data = {}) {
  if (getCurrentRole() !== ROLES.VIEWER) {
    denyAccess();
    return null;
  }

  const username = String(data.username || getCurrentUsername()).trim();
  if (!username) {
    throw new Error('Username is required');
  }

  const users = getUsers();
  const accountRequests = getAccountRequests();

  if (users.some((user) => user.username === username) || accountRequests.some((request) => request.username === username && request.status === 'PENDING')) {
    throw new Error('Username already exists or is already pending');
  }

  const request = {
    id: createRequestId(),
    username,
    status: 'PENDING',
    createdBy: getCurrentUsername() || username,
    approvedBy: null,
    createdAt: Date.now(),
    approvedAt: null
  };

  accountRequests.push(request);
  saveAccountRequests(accountRequests);
  writeAuditLog('ACCOUNT_REQUEST_CREATED', { username });
  return request;
}

function executeApprovedTransaction(txn) {
  if (!txn || txn.status !== 'APPROVED') {
    throw new Error('Only approved transactions can be executed');
  }

  const users = getUsers();
  const sourceUser = users.find((user) => user.username === txn.fromUser);
  const targetUser = txn.toUser ? users.find((user) => user.username === txn.toUser) : sourceUser;

  if (!sourceUser) {
    throw new Error('Source user not found');
  }

  if (!sourceUser.isActive) {
    throw new Error('Source account is inactive');
  }

  if (sourceUser.isFrozen) {
    throw new Error('Source account is frozen');
  }

  if (txn.type === 'transfer') {
    if (!targetUser) {
      throw new Error('Transfer target user not found');
    }
    if (!targetUser.isActive) {
      throw new Error('Transfer target account is inactive');
    }
    if (targetUser.isFrozen) {
      throw new Error('Target account is frozen');
    }
  }

  const amount = roundToTwo(Number(txn.amount));
  if (!amount || amount <= 0) {
    throw new Error('Invalid transaction amount');
  }

  if (txn.type === 'deposit') {
    sourceUser.balance = roundToTwo(sourceUser.balance + amount);
    sourceUser.transactions.unshift(createTxRecord('Deposit', amount, sourceUser.balance, 'Approved deposit request'));
  } else if (txn.type === 'withdraw') {
    if (amount > sourceUser.balance) {
      throw new Error('Insufficient balance');
    }
    sourceUser.balance = roundToTwo(sourceUser.balance - amount);
    sourceUser.transactions.unshift(createTxRecord('Withdraw', -amount, sourceUser.balance, 'Approved withdrawal request'));
  } else if (txn.type === 'transfer') {
    if (amount > sourceUser.balance) {
      throw new Error('Insufficient balance');
    }

    sourceUser.balance = roundToTwo(sourceUser.balance - amount);
    targetUser.balance = roundToTwo(targetUser.balance + amount);

    sourceUser.transactions.unshift(createTxRecord('Transfer', -amount, sourceUser.balance, `Transfer to ${targetUser.username}`));
    targetUser.transactions.unshift(createTxRecord('Transfer', amount, targetUser.balance, `Transfer from ${sourceUser.username}`));
  } else {
    throw new Error('Unsupported approved transaction type');
  }

  txn.executedAt = Date.now();
  saveUsers(users);
  persistPendingTransaction(txn);
  writeAuditLog('TRANSACTION_EXECUTED', { id: txn.id, type: txn.type, fromUser: txn.fromUser, toUser: txn.toUser || null, amount: txn.amount });
  return true;
}

function approveTransaction(id) {
  if (!assertManagerApprovalAccess()) {
    denyAccess();
    return false;
  }

  const pendingTxn = getPendingTransactionById(id);
  if (!pendingTxn) {
    throw new Error('Transaction not found');
  }

  if (pendingTxn.status !== 'PENDING') {
    throw new Error('Transaction has already been processed');
  }

  const updatedTxn = { ...pendingTxn, status: 'APPROVED', approvedBy: getCurrentUsername() || 'system', approvedAt: Date.now() };
  persistPendingTransaction(updatedTxn);

  try {
    executeApprovedTransaction(updatedTxn);
  } catch (error) {
    persistPendingTransaction({ ...updatedTxn, status: 'PENDING', approvedBy: null, approvedAt: null, executedAt: null });
    showMessage('controlMessage', error.message, 'error');
    return false;
  }

  showMessage('controlMessage', 'Transaction approved and executed.', 'success');
  writeAuditLog('TRANSACTION_APPROVED', { id });
  renderDashboard();
  renderUsersTable(document.getElementById('searchUserInput')?.value || '');
  renderAllTransactions();
  renderPendingTransactions();
  return true;
}

function rejectTransaction(id) {
  if (!assertManagerApprovalAccess()) {
    denyAccess();
    return false;
  }

  const pendingTxn = getPendingTransactionById(id);
  if (!pendingTxn) {
    throw new Error('Transaction not found');
  }

  if (pendingTxn.status !== 'PENDING') {
    throw new Error('Transaction has already been processed');
  }

  const updatedTxn = { ...pendingTxn, status: 'REJECTED', approvedBy: getCurrentUsername() || 'system', approvedAt: Date.now() };
  persistPendingTransaction(updatedTxn);
  writeAuditLog('TRANSACTION_REJECTED', { id });
  showMessage('controlMessage', 'Transaction rejected.', 'success');
  renderPendingTransactions();
  return true;
}

function approveAccountRequest(id) {
  if (!assertManagerApprovalAccess()) {
    denyAccess();
    return false;
  }

  const requests = getAccountRequests();
  const request = requests.find((item) => item.id === id);
  if (!request) {
    throw new Error('Account request not found');
  }
  if (request.status !== 'PENDING') {
    throw new Error('Account request has already been processed');
  }

  const users = getUsers();
  if (users.some((user) => user.username === request.username)) {
    throw new Error('User already exists');
  }

  request.status = 'APPROVED';
  request.approvedBy = getCurrentUsername() || 'system';
  request.approvedAt = Date.now();

  users.push({
    username: request.username,
    balance: 0,
    transactions: [],
    isFrozen: false,
    isActive: true
  });

  saveUsers(users);
  saveAccountRequests(requests);
  writeAuditLog('ACCOUNT_REQUEST_APPROVED', { id, username: request.username });
  renderPendingAccountRequests();
  renderUsersTable(document.getElementById('searchUserInput')?.value || '');
  return true;
}

function rejectAccountRequest(id) {
  if (!assertManagerApprovalAccess()) {
    denyAccess();
    return false;
  }

  const requests = getAccountRequests();
  const request = requests.find((item) => item.id === id);
  if (!request) {
    throw new Error('Account request not found');
  }
  if (request.status !== 'PENDING') {
    throw new Error('Account request has already been processed');
  }

  request.status = 'REJECTED';
  request.approvedBy = getCurrentUsername() || 'system';
  request.approvedAt = Date.now();

  saveAccountRequests(requests);
  writeAuditLog('ACCOUNT_REQUEST_REJECTED', { id, username: request.username });
  renderPendingAccountRequests();
  return true;
}

// --- UI Logic: Navigation ---
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
      document.getElementById(target).classList.add('active');

      // Refresh specific views
      if(target === 'requests-section') {
        renderPendingAccountRequests();
      }
      if(target === 'approvals-section') {
        renderPendingAccountRequests();
        renderPendingTransactions();
      }
      if(target === 'users-section') renderUsersTable();
      if(target === 'logs-section') renderAuditLogs();
      if(target === 'transactions-section') {
        populateUserFilter();
        renderAllTransactions();
      }
      if(target === 'dashboard-section') renderDashboard();
    });
  });
}

// --- Time System ---
function updateSystemTime() {
  const timeEl = document.getElementById('systemTime');
  if (timeEl) {
    timeEl.textContent = new Date().toLocaleString('en-IN');
  }
}

// --- Dashboard ---
function renderDashboard() {
  const users = getUsers();
  const statUsers = document.getElementById('stat-users');
  const statFunds = document.getElementById('stat-funds');
  const statTxs = document.getElementById('stat-txs');
  
  if(!statUsers) return;

  let totalFunds = 0;
  let allTxs = [];
  
  users.forEach(u => {
    totalFunds += u.balance;
    if(u.transactions) {
      u.transactions.forEach(tx => {
        allTxs.push({ ...tx, username: u.username });
      });
    }
  });

  allTxs.sort((a,b) => b.timestamp - a.timestamp);

  statUsers.textContent = users.length;
  statFunds.textContent = formatCurrency(totalFunds);
  statTxs.textContent = allTxs.length;

  const dashTableBody = document.querySelector('#dash-tx-table tbody');
  dashTableBody.innerHTML = '';
  
  allTxs.slice(0, 10).forEach(tx => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${new Date(tx.timestamp).toLocaleTimeString('en-IN', {hour:'2-digit', minute:'2-digit'})}</td>
      <td><strong>${tx.username}</strong></td>
      <td>${tx.type}</td>
      <td style="color:${tx.amount<0 && tx.type!=='Deposit'? 'var(--danger)':'var(--success)'}">${tx.amount<0 ? '-':'+'}${formatCurrency(Math.abs(tx.amount))}</td>
    `;
    dashTableBody.appendChild(tr);
  });
}

// --- Users Management ---
let selectedUserForAction = null;

function renderUsersTable(filterText = '') {
  const users = getUsers();
  const tbody = document.querySelector('#users-table tbody');
  if(!tbody) return;

  tbody.innerHTML = '';
  
  const filteredUsers = filterText 
    ? users.filter(u => u.username.toLowerCase().includes(filterText.toLowerCase()))
    : users;

  filteredUsers.forEach(u => {
    const freezeLabel = u.isFrozen ? 'Unfreeze' : 'Freeze';
    const tr = document.createElement('tr');
    const txCount = u.transactions ? u.transactions.length : 0;
    tr.innerHTML = `
      <td><strong>${u.username}</strong></td>
      <td>${u.isActive ? 'Active' : 'Inactive'}</td>
      <td>${formatCurrency(u.balance)}</td>
      <td>${txCount}</td>
      <td>
        <button class="accent-btn freeze-btn" data-username="${u.username}" style="padding: 6px 10px; font-size:13px; margin-left: 5px;">${freezeLabel}</button>
        <button class="danger-btn del-btn" data-username="${u.username}" style="padding: 6px 10px; font-size:13px; margin-left: 5px;">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Attach events
  document.querySelectorAll('.freeze-btn').forEach(btn => {
    btn.addEventListener('click', (e) => toggleFreezeAccount(e.target.dataset.username));
  });
  document.querySelectorAll('.del-btn').forEach(btn => {
    btn.addEventListener('click', (e) => openDeleteModal(e.target.dataset.username));
  });

  // Non-admin users should not be able to use account management controls.
  if (getCurrentRole() !== ROLES.ADMIN) {
    tbody.querySelectorAll('.freeze-btn, .del-btn').forEach((btn) => {
      btn.disabled = true;
    });
  }
}

// --- Modals ---
function openAddUserModal() {
  document.getElementById('newUsername').value = '';
  document.getElementById('addUserMsg').textContent = '';
  document.getElementById('addUserModal').classList.add('active');
}

function closeAddUserModal() {
  document.getElementById('addUserModal').classList.remove('active');
}

function addUser() {
  if (!hasPermission(ACTIONS.CREATE_REQUEST)) {
    denyAccess();
    return;
  }

  const uname = document.getElementById('newUsername').value.trim();

  if (!uname) {
    showMessage('addUserMsg', 'Username is required', 'error');
    return;
  }

  try {
    createAccountRequest({ username: uname });
  } catch (error) {
    showMessage('addUserMsg', error.message, 'error');
    return;
  }

  closeAddUserModal();
  renderPendingAccountRequests();
}

function openManageModal(username) {
  selectedUserForAction = username;
  document.getElementById('requestTransactionFrom').textContent = username || getCurrentUsername();
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
  if (getCurrentRole() !== ROLES.VIEWER) {
    denyAccess();
    return;
  }

  const action = document.getElementById('manageAction').value;
  const amount = Number(document.getElementById('requestTransactionAmount').value);
  const toUser = document.getElementById('requestTransactionTo').value.trim();
  const fromUser = getCurrentUsername().trim();

  if(!amount || amount < 0) {
    showMessage('requestTransactionMsg', 'Valid amount is required', 'error');
    return;
  }

  if (!fromUser || fromUser !== getCurrentUsername()) {
    showMessage('requestTransactionMsg', 'You can only request transactions for your own account.', 'error');
    return;
  }

  try {
    if (action === 'deposit' || action === 'withdraw') {
      createTransactionRequest(action, { amount });
    } else if (action === 'transfer') {
      createTransactionRequest('transfer', { amount, toUser });
    }
  } catch (error) {
    showMessage('requestTransactionMsg', error.message, 'error');
    return;
  }

  closeManageModal();
  renderPendingTransactions();
}

function openDeleteModal(username) {
  selectedUserForAction = username;
  document.getElementById('deleteUsername').textContent = username;
  document.getElementById('deleteUserModal').classList.add('active');
}

function closeDeleteModal() {
  document.getElementById('deleteUserModal').classList.remove('active');
  selectedUserForAction = null;
}

function executeDeleteUser() {
  if (!hasPermission(ACTIONS.DELETE_USER)) {
    denyAccess();
    return;
  }

  if(!selectedUserForAction) return;
  const users = getUsers();
  const newUsers = users.filter(u => u.username !== selectedUserForAction);
  saveUsers(newUsers);
  writeAuditLog('USER_DELETED', { username: selectedUserForAction });
  closeDeleteModal();
  renderUsersTable(document.getElementById('searchUserInput')?.value || '');
  renderDashboard();
}

function toggleFreezeAccount(username) {
  if (!hasPermission(ACTIONS.FREEZE)) {
    denyAccess();
    return;
  }

  const users = getUsers();
  const user = users.find((u) => u.username === username);
  if (!user) return;

  user.isFrozen = !user.isFrozen;
  const actionText = user.isFrozen ? 'Account Frozen' : 'Account Unfrozen';
  user.transactions.unshift(createTxRecord('System', 0, user.balance, actionText));

  saveUsers(users);
  writeAuditLog('ACCOUNT_TOGGLE_FREEZE', { username, frozen: user.isFrozen });
  renderUsersTable(document.getElementById('searchUserInput')?.value || '');
  renderDashboard();
}

// --- Transactions Display ---
function populateUserFilter() {
  const users = getUsers();
  const filter = document.getElementById('filterUser');
  if(!filter) return;
  
  const currentVal = filter.value;
  filter.innerHTML = '<option value="ALL">All Users</option>';
  users.forEach(u => {
    const opt = document.createElement('option');
    opt.value = u.username;
    opt.textContent = u.username;
    filter.appendChild(opt);
  });
  if([...filter.options].some(o => o.value === currentVal)) {
    filter.value = currentVal;
  }
}

function renderAllTransactions() {
  const users = getUsers();
  const tbody = document.querySelector('#all-transactions-table tbody');
  if(!tbody) return;

  const fUser = document.getElementById('filterUser').value;
  const fType = document.getElementById('filterType').value;

  let allTxs = [];
  users.forEach(u => {
    if(fUser === 'ALL' || fUser === u.username) {
      if(u.transactions) {
        u.transactions.forEach(tx => {
          if(fType === 'ALL' || fType === tx.type || (fType === 'System' && tx.type === 'System')) {
             allTxs.push({ ...tx, username: u.username });
          }
        });
      }
    }
  });

  allTxs.sort((a,b) => b.timestamp - a.timestamp);

  tbody.innerHTML = '';
  allTxs.forEach(tx => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${new Date(tx.timestamp).toLocaleString('en-IN', {dateStyle:'medium', timeStyle:'short'})}</td>
      <td><strong>${tx.username}</strong></td>
      <td>${tx.type}</td>
      <td style="color:${tx.amount<0 && tx.type!=='Deposit'? 'var(--danger)':'var(--success)'}">${formatCurrency(tx.amount)}</td>
      <td>${tx.details}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderPendingTransactions() {
  const tbody = document.querySelector('#pending-transactions-table tbody');
  if (!tbody) return;

  const pending = getPendingTransactions().filter((transaction) => transaction.status === 'PENDING').sort((a, b) => b.createdAt - a.createdAt);
  tbody.innerHTML = '';

  pending.forEach((tx) => {
    const tr = document.createElement('tr');
    const canApprove = getCurrentRole() === ROLES.MANAGER;
    const actionCol = canApprove
      ? `<button class="accent-btn approve-btn" data-id="${tx.id}" style="padding: 6px 10px; font-size:13px;">Approve</button>
         <button class="danger-btn reject-btn" data-id="${tx.id}" style="padding: 6px 10px; font-size:13px; margin-left: 5px;">Reject</button>`
      : '<span style="color:#666;">No permission</span>';

    tr.innerHTML = `
      <td>${new Date(tx.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
      <td>${tx.type}</td>
      <td>${tx.username}</td>
      <td>${tx.toUsername || '-'}</td>
      <td>${formatCurrency(tx.amount)}</td>
      <td>${tx.createdBy}</td>
      <td>${actionCol}</td>
    `;
    tbody.appendChild(tr);
  });

  document.querySelectorAll('.approve-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => approveTransaction(e.target.dataset.id));
  });
  document.querySelectorAll('.reject-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => rejectTransaction(e.target.dataset.id));
  });
}

function renderPendingAccountRequests() {
  const tbody = document.querySelector('#pending-account-requests tbody');
  if (!tbody) return;

  const requests = getAccountRequests().filter((request) => request.status === 'PENDING').sort((a, b) => b.createdAt - a.createdAt);
  tbody.innerHTML = '';

  requests.forEach((request) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${new Date(request.createdAt).toLocaleString('en-IN', {dateStyle:'medium', timeStyle:'short'})}</td>
      <td>${request.username}</td>
      <td>${request.createdBy}</td>
      <td>
        <button class="accent-btn approve-account-btn" data-id="${request.id}" style="padding: 6px 10px; font-size:13px;">Approve</button>
        <button class="danger-btn reject-account-btn" data-id="${request.id}" style="padding: 6px 10px; font-size:13px; margin-left: 5px;">Reject</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.querySelectorAll('.approve-account-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => approveAccountRequest(e.target.dataset.id));
  });
  document.querySelectorAll('.reject-account-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => rejectAccountRequest(e.target.dataset.id));
  });
}

function renderAuditLogs() {
  const tbody = document.querySelector('#audit-logs-table tbody');
  if (!tbody) return;

  const logs = getAuditLogs();
  tbody.innerHTML = '';

  logs.slice(0, 50).forEach((log) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${new Date(log.createdAt).toLocaleString('en-IN', {dateStyle:'medium', timeStyle:'short'})}</td>
      <td>${log.action}</td>
      <td>${log.actor}</td>
      <td>${log.role}</td>
      <td>${JSON.stringify(log.details)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderPendingAccountRequests() {
  const tbody = document.querySelector('#pending-account-requests tbody');
  if (!tbody) return;

  const requests = getAccountRequests().filter((request) => request.status === 'PENDING').sort((a, b) => b.createdAt - a.createdAt);
  tbody.innerHTML = '';

  requests.forEach((request) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${new Date(request.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
      <td>${request.username}</td>
      <td>${request.createdBy}</td>
      <td>
        <button class="accent-btn approve-account-btn" data-id="${request.id}" style="padding: 6px 10px; font-size:13px;">Approve</button>
        <button class="danger-btn reject-account-btn" data-id="${request.id}" style="padding: 6px 10px; font-size:13px; margin-left: 5px;">Reject</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.querySelectorAll('.approve-account-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => approveAccountRequest(e.target.dataset.id));
  });
  document.querySelectorAll('.reject-account-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => rejectAccountRequest(e.target.dataset.id));
  });
}

function renderAuditLogs() {
  const tbody = document.querySelector('#audit-logs-table tbody');
  if (!tbody) return;

  const logs = getAuditLogs();
  tbody.innerHTML = '';

  logs.slice(0, 50).forEach((log) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${new Date(log.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
      <td>${log.action}</td>
      <td>${log.actor}</td>
      <td>${log.role}</td>
      <td>${JSON.stringify(log.details)}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Required by task: permission-protected transaction actions
function deposit(username, amount) {
  return createTransactionRequest('deposit', { amount, toUser: '' });
}

function withdraw(username, amount) {
  return createTransactionRequest('withdraw', { amount, toUser: '' });
}

function transfer(username, toUsername, amount) {
  return createTransactionRequest('transfer', { amount, toUser: toUsername });
}

// --- System Controls ---
function applyGlobalInterest() {
  denyAccess();
}

function undoGlobalAction() {
  denyAccess();
}

function purgeData() {
  denyAccess();
}

// --- Setup Pages ---
function setupLoginPage() {
  const loginForm = document.getElementById('loginForm');
  if (!loginForm) return;

  initData();

  if (isAdminLoggedIn()) {
    window.location.href = 'home.html';
    return;
  }

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const u = document.getElementById('username').value.trim();
    const p = document.getElementById('password').value.trim();

    if (!loginAdmin(u, p)) {
      showMessage('loginMessage', 'Invalid credentials', 'error');
    }
  });
}

function setupAdminPage() {
  const dashboardTop = document.getElementById('topbar-title');
  if (!dashboardTop) return;

  if (!isAdminLoggedIn()) {
    window.location.href = 'index.html';
    return;
  }

  initData();
  setRoleTextInHeader();
  setupNavigation();
  applyRoleBasedUIState();
  updateSystemTime();
  setInterval(updateSystemTime, 1000);
  renderDashboard();
  renderPendingAccountRequests();
  renderPendingTransactions();
  renderAuditLogs();

  const searchUserInput = document.getElementById('searchUserInput');
  if(searchUserInput) {
    searchUserInput.addEventListener('input', (e) => renderUsersTable(e.target.value));
  }

  const showAddUserBtn = document.getElementById('showAddUserBtn');
  if(showAddUserBtn) showAddUserBtn.addEventListener('click', openAddUserModal);

  const showManageModalBtn = document.getElementById('showManageModalBtn');
  if(showManageModalBtn) showManageModalBtn.addEventListener('click', () => openManageModal(getCurrentUsername()));

  document.getElementById('closeAddUserModal')?.addEventListener('click', closeAddUserModal);
  document.getElementById('confirmAddUserBtn')?.addEventListener('click', addUser);

  document.getElementById('closeManageModal')?.addEventListener('click', closeManageModal);
  document.getElementById('confirmManageBtn')?.addEventListener('click', applyManageUser);

  document.getElementById('closeDeleteModal')?.addEventListener('click', closeDeleteModal);
  document.getElementById('confirmDeleteBtn')?.addEventListener('click', executeDeleteUser);

  document.getElementById('logoutBtn')?.addEventListener('click', logoutAdmin);

  // Filter triggers
  document.getElementById('filterUser')?.addEventListener('change', renderAllTransactions);
  document.getElementById('filterType')?.addEventListener('change', renderAllTransactions);

  // Legacy controls are now intentionally inert to preserve request-only balance changes.
  document.getElementById('applyInterestBtn')?.addEventListener('click', applyGlobalInterest);
  document.getElementById('undoGlobalBtn')?.addEventListener('click', undoGlobalAction);
  document.getElementById('clearAllHistoryBtn')?.addEventListener('click', purgeData);
}

document.addEventListener('DOMContentLoaded', () => {
  // Debug flag: intentional error for CI/CD failure simulation
  if (FORCE_ERROR) {
    throw new Error('INTENTIONAL ERROR: FORCE_ERROR flag is true. Simulating CI/CD failure.');
  }
  
  setupLoginPage();
  setupAdminPage();
});
