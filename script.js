// --- Constants & Keys ---
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';
const USERS_KEY = 'bankUsersData';
const ADMIN_SESSION_KEY = 'adminSession';
const LAST_GLOBAL_KEY = 'lastGlobalAction'; // Store info for undoing

// --- Initialization ---
function initData() {
  if (!localStorage.getItem(USERS_KEY)) {
    // Seed with empty users array, or create a demo user
    const defaultData = [
      { username: 'user1', balance: 10000, transactions: [] },
      { username: 'testuser', balance: 500, transactions: [] }
    ];
    localStorage.setItem(USERS_KEY, JSON.stringify(defaultData));
  }
}

// --- LocalStorage Helpers ---
function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
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

// --- Authentication ---
function loginAdmin(username, password) {
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    localStorage.setItem(ADMIN_SESSION_KEY, 'true');
    localStorage.setItem('role', 'admin');
    window.location.href = 'home.html';
    return true;
  }
  return false;
}

function logoutAdmin() {
  localStorage.removeItem(ADMIN_SESSION_KEY);
  localStorage.removeItem('role');
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
    const tr = document.createElement('tr');
    const txCount = u.transactions ? u.transactions.length : 0;
    tr.innerHTML = `
      <td><strong>${u.username}</strong></td>
      <td>${formatCurrency(u.balance)}</td>
      <td>${txCount}</td>
      <td>
        <button class="ghost-btn manage-btn" data-username="${u.username}" style="padding: 6px 10px; font-size:13px;">Manage Balance</button>
        <button class="danger-btn del-btn" data-username="${u.username}" style="padding: 6px 10px; font-size:13px; margin-left: 5px;">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Attach events
  document.querySelectorAll('.manage-btn').forEach(btn => {
    btn.addEventListener('click', (e) => openManageModal(e.target.dataset.username));
  });
  document.querySelectorAll('.del-btn').forEach(btn => {
    btn.addEventListener('click', (e) => openDeleteModal(e.target.dataset.username));
  });
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
    transactions: initialBal > 0 ? [createTxRecord('Deposit', initialBal, initialBal, 'Initial Deposit')] : []
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

  if (action === 'add') {
    user.balance = roundToTwo(user.balance + amount);
    user.transactions.unshift(createTxRecord('Admin Mod', amount, user.balance, 'Admin Added Money'));
  } else if (action === 'deduct') {
    if(amount > user.balance) {
      showMessage('manageUserMsg', 'Insufficient balance for deduction', 'error');
      return;
    }
    user.balance = roundToTwo(user.balance - amount);
    user.transactions.unshift(createTxRecord('Admin Mod', -amount, user.balance, 'Admin Deducted Money'));
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
  if(!selectedUserForAction) return;
  const users = getUsers();
  const newUsers = users.filter(u => u.username !== selectedUserForAction);
  saveUsers(newUsers);
  closeDeleteModal();
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

// --- System Controls ---
function applyGlobalInterest() {
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

  if (isAdminLoggedIn()) {
    window.location.href = 'home.html';
    return;
  }

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const u = document.getElementById('username').value.trim();
    const p = document.getElementById('password').value.trim();

    if (!loginAdmin(u, p)) {
       // if it's the old 'user123' show special error
       if(u !== ADMIN_USER && p !== ADMIN_PASS && u !== '') {
           showMessage('loginMessage', 'Access Denied. Admin privileges required.', 'error');
       } else {
           showMessage('loginMessage', 'Invalid Admin Credentials', 'error');
       }
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
  setupNavigation();
  updateSystemTime();
  setInterval(updateSystemTime, 1000);
  renderDashboard();

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
  setupLoginPage();
  setupAdminPage();
});
