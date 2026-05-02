// --- Constants & Keys ---
const USERS_KEY = 'bankUsersData';
const AUTH_USERS_KEY = 'bankAuthUsers';
const PENDING_TX_KEY = 'bankPendingTransactions';
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

const PERMISSIONS = {
  CREATE_TRANSACTION: 'CREATE_TRANSACTION',
  APPROVE_TRANSACTION: 'APPROVE_TRANSACTION',
  DELETE_USER: 'DELETE_USER',
  FREEZE_ACCOUNT: 'FREEZE_ACCOUNT',
  VIEW_ONLY: 'VIEW_ONLY'
};

const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: {
    [PERMISSIONS.CREATE_TRANSACTION]: true,
    [PERMISSIONS.APPROVE_TRANSACTION]: true,
    [PERMISSIONS.DELETE_USER]: true,
    [PERMISSIONS.FREEZE_ACCOUNT]: true,
    [PERMISSIONS.VIEW_ONLY]: true
  },
  [ROLES.MANAGER]: {
    [PERMISSIONS.CREATE_TRANSACTION]: false,
    [PERMISSIONS.APPROVE_TRANSACTION]: true,
    [PERMISSIONS.DELETE_USER]: false,
    [PERMISSIONS.FREEZE_ACCOUNT]: false,
    [PERMISSIONS.VIEW_ONLY]: true
  },
  [ROLES.VIEWER]: {
    [PERMISSIONS.CREATE_TRANSACTION]: false,
    [PERMISSIONS.APPROVE_TRANSACTION]: false,
    [PERMISSIONS.DELETE_USER]: false,
    [PERMISSIONS.FREEZE_ACCOUNT]: false,
    [PERMISSIONS.VIEW_ONLY]: true
  }
};

// --- Initialization ---
function initData() {
  if (!localStorage.getItem(USERS_KEY)) {
    // Seed demo account/balance data
    const defaultData = [
      { username: 'admin', balance: 10000, transactions: [], isFrozen: false },
      { username: 'manager', balance: 5000, transactions: [], isFrozen: false },
      { username: 'viewer', balance: 2000, transactions: [], isFrozen: false },
      { username: 'user1', balance: 10000, transactions: [], isFrozen: false },
      { username: 'testuser', balance: 500, transactions: [], isFrozen: false }
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
}

// --- LocalStorage Helpers ---
function getUsers() {
  try {
    const users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    // Keep backward compatibility for old entries without isFrozen flag
    return users.map((u) => ({ ...u, isFrozen: Boolean(u.isFrozen) }));
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

// --- Authentication + RBAC ---
function getCurrentRole() {
  return localStorage.getItem(CURRENT_USER_ROLE_KEY) || ROLES.VIEWER;
}

function getCurrentUsername() {
  return localStorage.getItem(CURRENT_USER_NAME_KEY) || '';
}

function hasPermission(action) {
  const role = getCurrentRole();
  const permissionsForRole = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS[ROLES.VIEWER];
  return Boolean(permissionsForRole[action]);
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

function setRoleTextInHeader() {
  const adminNameEl = document.getElementById('adminName');
  if (!adminNameEl) return;
  const uname = getCurrentUsername() || 'User';
  adminNameEl.textContent = `${uname} (${getCurrentRole()})`;
}

function applyRoleBasedUIState() {
  const role = getCurrentRole();

  const usersMenu = document.getElementById('menuUsers');
  const controlsMenu = document.getElementById('menuControls');
  const showAddUserBtn = document.getElementById('showAddUserBtn');

  const interestBtn = document.getElementById('applyInterestBtn');
  const undoBtn = document.getElementById('undoGlobalBtn');
  const clearBtn = document.getElementById('clearAllHistoryBtn');

  const approvalsCard = document.getElementById('approvalsCard');
  const controlsSection = document.getElementById('controls-section');

  if (role === ROLES.ADMIN) {
    if (usersMenu) usersMenu.style.display = '';
    if (controlsMenu) controlsMenu.style.display = '';
    if (showAddUserBtn) showAddUserBtn.disabled = false;
    if (interestBtn) interestBtn.disabled = false;
    if (undoBtn) undoBtn.disabled = false;
    if (clearBtn) clearBtn.disabled = false;
    if (approvalsCard) approvalsCard.style.display = '';
    return;
  }

  if (role === ROLES.MANAGER) {
    if (usersMenu) usersMenu.style.display = 'none';
    if (controlsMenu) controlsMenu.style.display = '';
    if (showAddUserBtn) showAddUserBtn.disabled = true;
    if (interestBtn) interestBtn.style.display = 'none';
    if (undoBtn) undoBtn.style.display = 'none';
    if (clearBtn) clearBtn.style.display = 'none';
    if (approvalsCard) approvalsCard.style.display = '';

    // Ensure manager lands on permitted section if currently on hidden section
    const activeSection = document.querySelector('.section.active');
    if (activeSection && activeSection.id === 'users-section') {
      document.querySelectorAll('.section').forEach((sec) => sec.classList.remove('active'));
      document.getElementById('controls-section')?.classList.add('active');
    }
    return;
  }

  // Viewer: read-only. Keep dashboard + transaction history only.
  if (usersMenu) usersMenu.style.display = 'none';
  if (controlsMenu) controlsMenu.style.display = 'none';
  if (showAddUserBtn) showAddUserBtn.disabled = true;
  if (controlsSection) controlsSection.style.display = 'none';
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
      if(target === 'users-section') renderUsersTable();
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
      <td>${formatCurrency(u.balance)}</td>
      <td>${txCount}</td>
      <td>
        <button class="ghost-btn manage-btn" data-username="${u.username}" style="padding: 6px 10px; font-size:13px;">Manage Balance</button>
        <button class="accent-btn freeze-btn" data-username="${u.username}" style="padding: 6px 10px; font-size:13px; margin-left: 5px;">${freezeLabel}</button>
        <button class="danger-btn del-btn" data-username="${u.username}" style="padding: 6px 10px; font-size:13px; margin-left: 5px;">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Attach events
  document.querySelectorAll('.manage-btn').forEach(btn => {
    btn.addEventListener('click', (e) => openManageModal(e.target.dataset.username));
  });
  document.querySelectorAll('.freeze-btn').forEach(btn => {
    btn.addEventListener('click', (e) => toggleFreezeAccount(e.target.dataset.username));
  });
  document.querySelectorAll('.del-btn').forEach(btn => {
    btn.addEventListener('click', (e) => openDeleteModal(e.target.dataset.username));
  });

  // Non-admin users should not be able to use account management controls.
  if (getCurrentRole() !== ROLES.ADMIN) {
    tbody.querySelectorAll('.manage-btn, .freeze-btn, .del-btn').forEach((btn) => {
      btn.disabled = true;
    });
  }
}

// --- Modals ---
function openAddUserModal() {
  document.getElementById('newUsername').value = '';
  document.getElementById('newInitialBalance').value = '';
  document.getElementById('addUserMsg').textContent = '';
  document.getElementById('addUserModal').classList.add('active');
}

function closeAddUserModal() {
  document.getElementById('addUserModal').classList.remove('active');
}

function addUser() {
  if (!hasPermission(PERMISSIONS.CREATE_TRANSACTION)) {
    denyAccess();
    return;
  }

  const uname = document.getElementById('newUsername').value.trim();
  const initialBal = Number(document.getElementById('newInitialBalance').value) || 0;

  if (!uname) {
    showMessage('addUserMsg', 'Username is required', 'error');
    return;
  }

  const users = getUsers();
  if (users.find(u => u.username === uname)) {
    showMessage('addUserMsg', 'Username already exists', 'error');
    return;
  }

  users.push({
    username: uname,
    balance: roundToTwo(initialBal),
    transactions: initialBal > 0 ? [createTxRecord('Deposit', initialBal, initialBal, 'Initial Deposit')] : [],
    isFrozen: false
  });

  saveUsers(users);
  closeAddUserModal();
  renderUsersTable(document.getElementById('searchUserInput').value);
  renderDashboard();
}

function openManageModal(username) {
  selectedUserForAction = username;
  const users = getUsers();
  const user = users.find(u => u.username === username);
  if(!user) return;

  document.getElementById('manageUsername').textContent = user.username;
  document.getElementById('manageCurrentBalance').textContent = formatCurrency(user.balance);
  document.getElementById('manageAmount').value = '';
  document.getElementById('manageUserMsg').textContent = '';
  document.getElementById('manageBalanceModal').classList.add('active');
}

function closeManageModal() {
  document.getElementById('manageBalanceModal').classList.remove('active');
  selectedUserForAction = null;
}

function applyManageUser() {
  if (!hasPermission(PERMISSIONS.CREATE_TRANSACTION)) {
    denyAccess();
    return;
  }

  if(!selectedUserForAction) return;
  const action = document.getElementById('manageAction').value;
  let amount = Number(document.getElementById('manageAmount').value);

  if(!amount || amount < 0) {
    if(action !== 'set' || amount < 0) {
      showMessage('manageUserMsg', 'Valid amount is required', 'error');
      return;
    }
  }

  const users = getUsers();
  const user = users.find(u => u.username === selectedUserForAction);
  if(!user) return;

  if (user.isFrozen) {
    showMessage('manageUserMsg', 'Account is frozen. Transaction not allowed.', 'error');
    return;
  }

  if (action === 'add') {
    deposit(user.username, amount);
    closeManageModal();
    renderPendingTransactions();
    return;
  } else if (action === 'deduct') {
    withdraw(user.username, amount);
    closeManageModal();
    renderPendingTransactions();
    return;
  } else if (action === 'set') {
    const diff = amount - user.balance;
    if(diff !== 0) {
      user.balance = roundToTwo(amount);
      user.transactions.unshift(createTxRecord('Admin Mod', diff, user.balance, 'Admin Reset Balance'));
    }
  }

  saveUsers(users);
  closeManageModal();
  renderUsersTable(document.getElementById('searchUserInput')?.value || '');
  renderDashboard();
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
  if (!hasPermission(PERMISSIONS.DELETE_USER)) {
    denyAccess();
    return;
  }

  if(!selectedUserForAction) return;
  const users = getUsers();
  const newUsers = users.filter(u => u.username !== selectedUserForAction);
  saveUsers(newUsers);
  closeDeleteModal();
  renderUsersTable(document.getElementById('searchUserInput')?.value || '');
  renderDashboard();
}

function toggleFreezeAccount(username) {
  if (!hasPermission(PERMISSIONS.FREEZE_ACCOUNT)) {
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

  const pending = getPendingTransactions().sort((a, b) => b.createdAt - a.createdAt);
  tbody.innerHTML = '';

  pending.forEach((tx) => {
    const tr = document.createElement('tr');
    const canApprove = hasPermission(PERMISSIONS.APPROVE_TRANSACTION);
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
    btn.addEventListener('click', (e) => approveTransaction(e.target.dataset.id, 'approve'));
  });
  document.querySelectorAll('.reject-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => approveTransaction(e.target.dataset.id, 'reject'));
  });
}

function queuePendingTransaction(type, username, amount, toUsername = '') {
  const pending = getPendingTransactions();
  pending.push({
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    username,
    toUsername,
    amount: roundToTwo(amount),
    status: 'PENDING',
    createdBy: getCurrentUsername() || 'system',
    createdAt: Date.now()
  });
  savePendingTransactions(pending);
}

// Required by task: permission-protected transaction actions
function deposit(username, amount) {
  if (!hasPermission(PERMISSIONS.CREATE_TRANSACTION)) {
    denyAccess();
    return false;
  }

  const users = getUsers();
  const user = users.find((u) => u.username === username);
  if (!user || user.isFrozen || !amount || amount <= 0) {
    return false;
  }

  queuePendingTransaction('Deposit', username, amount);
  showMessage('controlMessage', 'Deposit request submitted for approval.', 'success');
  return true;
}

function withdraw(username, amount) {
  if (!hasPermission(PERMISSIONS.CREATE_TRANSACTION)) {
    denyAccess();
    return false;
  }

  const users = getUsers();
  const user = users.find((u) => u.username === username);
  if (!user || user.isFrozen || !amount || amount <= 0) {
    return false;
  }

  if (amount > user.balance) {
    return false;
  }

  queuePendingTransaction('Withdraw', username, amount);
  showMessage('controlMessage', 'Withdraw request submitted for approval.', 'success');
  return true;
}

function transfer(username, toUsername, amount) {
  if (!hasPermission(PERMISSIONS.CREATE_TRANSACTION)) {
    denyAccess();
    return false;
  }

  if (!toUsername || username === toUsername || !amount || amount <= 0) {
    return false;
  }

  const users = getUsers();
  const fromUser = users.find((u) => u.username === username);
  const toUser = users.find((u) => u.username === toUsername);

  if (!fromUser || !toUser || fromUser.isFrozen || toUser.isFrozen || amount > fromUser.balance) {
    return false;
  }

  queuePendingTransaction('Transfer', username, amount, toUsername);
  showMessage('controlMessage', 'Transfer request submitted for approval.', 'success');
  return true;
}

function approveTransaction(transactionId, decision = 'approve') {
  if (!hasPermission(PERMISSIONS.APPROVE_TRANSACTION)) {
    denyAccess();
    return;
  }

  const pending = getPendingTransactions();
  const txIndex = pending.findIndex((tx) => tx.id === transactionId);
  if (txIndex === -1) return;

  const tx = pending[txIndex];

  if (decision === 'reject') {
    pending.splice(txIndex, 1);
    savePendingTransactions(pending);
    showMessage('controlMessage', 'Transaction rejected.', 'success');
    renderPendingTransactions();
    return;
  }

  const users = getUsers();
  const sourceUser = users.find((u) => u.username === tx.username);
  if (!sourceUser || sourceUser.isFrozen) {
    pending.splice(txIndex, 1);
    savePendingTransactions(pending);
    renderPendingTransactions();
    return;
  }

  if (tx.type === 'Deposit') {
    sourceUser.balance = roundToTwo(sourceUser.balance + tx.amount);
    sourceUser.transactions.unshift(createTxRecord('Deposit', tx.amount, sourceUser.balance, 'Approved Deposit'));
  } else if (tx.type === 'Withdraw') {
    if (tx.amount > sourceUser.balance) {
      pending.splice(txIndex, 1);
      savePendingTransactions(pending);
      showMessage('controlMessage', 'Withdraw failed during approval (insufficient balance).', 'error');
      renderPendingTransactions();
      return;
    }
    sourceUser.balance = roundToTwo(sourceUser.balance - tx.amount);
    sourceUser.transactions.unshift(createTxRecord('Withdraw', -tx.amount, sourceUser.balance, 'Approved Withdraw'));
  } else if (tx.type === 'Transfer') {
    const targetUser = users.find((u) => u.username === tx.toUsername);
    if (!targetUser || targetUser.isFrozen || tx.amount > sourceUser.balance) {
      pending.splice(txIndex, 1);
      savePendingTransactions(pending);
      showMessage('controlMessage', 'Transfer failed during approval.', 'error');
      renderPendingTransactions();
      return;
    }

    sourceUser.balance = roundToTwo(sourceUser.balance - tx.amount);
    targetUser.balance = roundToTwo(targetUser.balance + tx.amount);

    sourceUser.transactions.unshift(createTxRecord('Transfer', -tx.amount, sourceUser.balance, `Approved transfer to ${targetUser.username}`));
    targetUser.transactions.unshift(createTxRecord('Transfer', tx.amount, targetUser.balance, `Approved transfer from ${sourceUser.username}`));
  }

  pending.splice(txIndex, 1);
  saveUsers(users);
  savePendingTransactions(pending);

  showMessage('controlMessage', 'Transaction approved successfully.', 'success');
  renderDashboard();
  renderUsersTable(document.getElementById('searchUserInput')?.value || '');
  renderAllTransactions();
  renderPendingTransactions();
}

// --- System Controls ---
function applyGlobalInterest() {
  if (!hasPermission(PERMISSIONS.CREATE_TRANSACTION)) {
    denyAccess();
    return;
  }

  const users = getUsers();
  if(users.length === 0) {
    showMessage('controlMessage', 'No users to add interest to.', 'error');
    return;
  }

  let totalInterestGiven = 0;
  
  const snapshot = JSON.stringify(users); // For undo

  users.forEach(u => {
    if(u.balance > 0) {
      const interest = roundToTwo(u.balance * 0.02);
      if(interest > 0) {
        u.balance = roundToTwo(u.balance + interest);
        u.transactions.unshift(createTxRecord('Interest', interest, u.balance, '+2% Global Interest'));
        totalInterestGiven += interest;
      }
    }
  });

  saveUsers(users);
  
  localStorage.setItem(LAST_GLOBAL_KEY, JSON.stringify({
    type: 'INTEREST',
    previousState: snapshot
  }));

  showMessage('controlMessage', `Applied +2% Interest. Total disbursed: ${formatCurrency(totalInterestGiven)}`, 'success');
  renderDashboard();
}

function undoGlobalAction() {
  if (!hasPermission(PERMISSIONS.CREATE_TRANSACTION)) {
    denyAccess();
    return;
  }

  const lastAction = localStorage.getItem(LAST_GLOBAL_KEY);
  if(!lastAction) {
    showMessage('controlMessage', 'No system action available to undo.', 'error');
    return;
  }

  try {
    const actionData = JSON.parse(lastAction);
    if(actionData.previousState) {
      saveUsers(JSON.parse(actionData.previousState));
      localStorage.removeItem(LAST_GLOBAL_KEY);
      showMessage('controlMessage', 'Successfully reversed the last global action.', 'success');
      renderDashboard();
    }
  } catch(e) {
    showMessage('controlMessage', 'Failed to undo action. Data corrupted.', 'error');
  }
}

function purgeData() {
  if (!hasPermission(PERMISSIONS.DELETE_USER)) {
    denyAccess();
    return;
  }

  if(confirm("CRITICAL: You are about to clear transaction histories for EVERY user. This cannot be reversed. Proceed?")) {
    const users = getUsers();
    users.forEach(u => {
      u.transactions = [];
    });
    saveUsers(users);
    showMessage('controlMessage', 'All transaction history cleared across the system.', 'success');
    renderDashboard();
    
    // Clear undo stack as history is destroyed
    localStorage.removeItem(LAST_GLOBAL_KEY);
  }
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
  renderPendingTransactions();

  // Navigation Logic specific to User interactions
  const searchUserInput = document.getElementById('searchUserInput');
  if(searchUserInput) {
    searchUserInput.addEventListener('input', (e) => renderUsersTable(e.target.value));
  }

  const showAddUserBtn = document.getElementById('showAddUserBtn');
  if(showAddUserBtn) showAddUserBtn.addEventListener('click', openAddUserModal);

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

  // Controls triggers
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
