const DEMO_USERNAME = 'user123';
const DEMO_PASSWORD = 'pass123';

const BALANCE_KEY = 'bankBalance';
const SESSION_KEY = 'isLoggedIn';
const HISTORY_KEY = 'transactionHistory';

function loginUser(username, password) {
  if (username === DEMO_USERNAME && password === DEMO_PASSWORD) {
    localStorage.setItem(SESSION_KEY, 'true');
    window.location.href = 'home.html';
    return true;
  }

  return false;
}

function isLoggedIn() {
  return localStorage.getItem(SESSION_KEY) === 'true';
}

function logoutUser() {
  localStorage.removeItem(SESSION_KEY);
  window.location.href = 'index.html';
}

function initializeBalance() {
  const existingBalance = localStorage.getItem(BALANCE_KEY);

  if (existingBalance === null) {
    localStorage.setItem(BALANCE_KEY, '10000');
  }
}

function getCurrentBalance() {
  return Number(localStorage.getItem(BALANCE_KEY)) || 0;
}

function setCurrentBalance(newBalance) {
  localStorage.setItem(BALANCE_KEY, String(newBalance));
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(amount);
}

function updateBalance() {
  const balanceElement = document.getElementById('balanceAmount');

  if (balanceElement) {
    balanceElement.textContent = formatCurrency(getCurrentBalance());
  }
}

function getAmountFromInput() {
  const amountInput = document.getElementById('amountInput');
  const amount = Number(amountInput.value);

  if (!amount || amount <= 0) {
    return { valid: false, amount: 0 };
  }

  return { valid: true, amount };
}

function getHistory() {
  const rawHistory = localStorage.getItem(HISTORY_KEY);

  if (!rawHistory) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawHistory);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveHistory(history) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 5)));
}

function addTransaction(type, amount, balanceAfter) {
  const history = getHistory();
  const entry = `${type}: ${formatCurrency(amount)} | Balance: ${formatCurrency(balanceAfter)}`;
  history.unshift(entry);
  saveHistory(history);
}

function renderTransactionHistory() {
  const txList = document.getElementById('txList');

  if (!txList) {
    return;
  }

  const history = getHistory();
  txList.innerHTML = '';

  if (history.length === 0) {
    const emptyState = document.createElement('li');
    emptyState.textContent = 'No transactions yet.';
    txList.appendChild(emptyState);
    return;
  }

  history.forEach((item) => {
    const listItem = document.createElement('li');
    listItem.textContent = item;
    txList.appendChild(listItem);
  });
}

function showMessage(elementId, text, type) {
  const messageElement = document.getElementById(elementId);

  if (!messageElement) {
    return;
  }

  messageElement.textContent = text;
  messageElement.className = `message ${type}`;
}

function depositAmount() {
  const { valid, amount } = getAmountFromInput();

  if (!valid) {
    showMessage('actionMessage', 'Enter a valid positive amount.', 'error');
    return;
  }

  const newBalance = getCurrentBalance() + amount;
  setCurrentBalance(newBalance);
  updateBalance();
  addTransaction('Deposit', amount, newBalance);
  renderTransactionHistory();

  document.getElementById('amountInput').value = '';
  showMessage('actionMessage', 'Deposit successful.', 'success');
}

function withdrawAmount() {
  const { valid, amount } = getAmountFromInput();

  if (!valid) {
    showMessage('actionMessage', 'Enter a valid positive amount.', 'error');
    return;
  }

  const currentBalance = getCurrentBalance();

  if (amount > currentBalance) {
    showMessage('actionMessage', 'Insufficient balance', 'error');
    return;
  }

  const newBalance = currentBalance - amount;
  setCurrentBalance(newBalance);
  updateBalance();
  addTransaction('Withdraw', amount, newBalance);
  renderTransactionHistory();

  document.getElementById('amountInput').value = '';
  showMessage('actionMessage', 'Withdrawal successful.', 'success');
}

function setupLoginPage() {
  const loginForm = document.getElementById('loginForm');

  if (!loginForm) {
    return;
  }

  if (isLoggedIn()) {
    window.location.href = 'home.html';
    return;
  }

  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    const loginSuccess = loginUser(username, password);

    if (!loginSuccess) {
      showMessage('loginMessage', 'Invalid credentials', 'error');
    }
  });
}

function setupHomePage() {
  const homePageElement = document.getElementById('balanceAmount');

  if (!homePageElement) {
    return;
  }

  if (!isLoggedIn()) {
    window.location.href = 'index.html';
    return;
  }

  initializeBalance();
  updateBalance();
  renderTransactionHistory();

  const depositButton = document.getElementById('depositBtn');
  const withdrawButton = document.getElementById('withdrawBtn');
  const logoutButton = document.getElementById('logoutBtn');

  depositButton.addEventListener('click', depositAmount);
  withdrawButton.addEventListener('click', withdrawAmount);
  logoutButton.addEventListener('click', logoutUser);
}

document.addEventListener('DOMContentLoaded', () => {
  setupLoginPage();
  setupHomePage();
});
