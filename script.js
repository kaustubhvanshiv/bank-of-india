const DEMO_USERNAME = 'user123';
const DEMO_PASSWORD = 'pass123';

const BALANCE_KEY = 'bankBalance';
const SESSION_KEY = 'isLoggedIn';
const USER_KEY = 'loggedInUser';
const HISTORY_KEY = 'transactionHistory';
const HISTORY_LIMIT = 20;
const HISTORY_DISPLAY_LIMIT = 5;
const INTEREST_RATE = 0.02;

function roundToTwo(value) {
  return Number(value.toFixed(2));
}

function loginUser(username, password) {
  if (username === DEMO_USERNAME && password === DEMO_PASSWORD) {
    localStorage.setItem(SESSION_KEY, 'true');
    localStorage.setItem(USER_KEY, username);
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
  localStorage.removeItem(USER_KEY);
  window.location.href = 'index.html';
}

function getLoggedInUser() {
  return localStorage.getItem(USER_KEY) || 'User';
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

function getPositiveAmount(inputId) {
  const inputElement = document.getElementById(inputId);
  const value = Number(inputElement.value);

  if (!Number.isFinite(value) || value <= 0) {
    return { valid: false, amount: 0 };
  }

  return { valid: true, amount: roundToTwo(value) };
}

function clearInput(inputId) {
  const inputElement = document.getElementById(inputId);

  if (inputElement) {
    inputElement.value = '';
  }
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

function updateWelcomeMessage() {
  const welcomeElement = document.getElementById('welcomeText');

  if (welcomeElement) {
    welcomeElement.textContent = `Welcome, ${getLoggedInUser()}`;
  }
}

function getHistory() {
  const rawHistory = localStorage.getItem(HISTORY_KEY);

  if (!rawHistory) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawHistory);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((item) => {
      if (typeof item === 'string') {
        return {
          type: 'Transaction',
          amount: 0,
          delta: 0,
          balanceAfter: getCurrentBalance(),
          timestamp: Date.now(),
          note: item,
          undoable: false
        };
      }

      return {
        type: item.type || 'Transaction',
        amount: Number(item.amount) || 0,
        delta: Number(item.delta) || 0,
        balanceAfter: Number(item.balanceAfter) || 0,
        timestamp: Number(item.timestamp) || Date.now(),
        note: item.note || '',
        undoable: item.undoable !== false
      };
    });
  } catch (error) {
    return [];
  }
}

function saveHistory(history) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, HISTORY_LIMIT)));
}

function addTransaction(type, amount, delta, balanceAfter, note = '', undoable = true) {
  const history = getHistory();
  history.unshift({
    type,
    amount,
    delta,
    balanceAfter,
    timestamp: Date.now(),
    note,
    undoable
  });
  saveHistory(history);
}

function formatTransactionEntry(entry) {
  if (entry.note && entry.amount === 0) {
    return entry.note;
  }

  const dateText = new Date(entry.timestamp).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
  const detailText = entry.note ? ` (${entry.note})` : '';

  return `${entry.type}: ${formatCurrency(entry.amount)} | Balance: ${formatCurrency(entry.balanceAfter)}${detailText} | ${dateText}`;
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

  history.slice(0, HISTORY_DISPLAY_LIMIT).forEach((item) => {
    const listItem = document.createElement('li');
    listItem.textContent = formatTransactionEntry(item);
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

function refreshDashboard() {
  updateBalance();
  renderTransactionHistory();
}

function depositAmount() {
  const { valid, amount } = getPositiveAmount('amountInput');

  if (!valid) {
    showMessage('actionMessage', 'Enter a valid positive amount.', 'error');
    return;
  }

  const newBalance = roundToTwo(getCurrentBalance() + amount);
  setCurrentBalance(newBalance);
  addTransaction('Deposit', amount, amount, newBalance);
  refreshDashboard();

  clearInput('amountInput');
  showMessage('actionMessage', 'Deposit successful.', 'success');
}

function withdrawAmount() {
  const { valid, amount } = getPositiveAmount('amountInput');

  if (!valid) {
    showMessage('actionMessage', 'Enter a valid positive amount.', 'error');
    return;
  }

  const currentBalance = getCurrentBalance();

  if (amount > currentBalance) {
    showMessage('actionMessage', 'Insufficient balance', 'error');
    return;
  }

  const newBalance = roundToTwo(currentBalance - amount);
  setCurrentBalance(newBalance);
  addTransaction('Withdraw', amount, -amount, newBalance);
  refreshDashboard();

  clearInput('amountInput');
  showMessage('actionMessage', 'Withdrawal successful.', 'success');
}

function transferAmount() {
  const recipientName = document.getElementById('recipientInput').value.trim();
  const { valid, amount } = getPositiveAmount('transferAmountInput');

  if (!recipientName) {
    showMessage('actionMessage', 'Enter recipient name before transfer.', 'error');
    return;
  }

  if (!valid) {
    showMessage('actionMessage', 'Enter a valid transfer amount.', 'error');
    return;
  }

  const currentBalance = getCurrentBalance();

  if (amount > currentBalance) {
    showMessage('actionMessage', 'Insufficient balance for transfer.', 'error');
    return;
  }

  const newBalance = roundToTwo(currentBalance - amount);
  setCurrentBalance(newBalance);
  addTransaction('Transfer', amount, -amount, newBalance, `To ${recipientName}`);
  refreshDashboard();

  clearInput('recipientInput');
  clearInput('transferAmountInput');
  showMessage('actionMessage', `Transfer to ${recipientName} successful.`, 'success');
}

function addInterest() {
  const currentBalance = getCurrentBalance();

  if (currentBalance <= 0) {
    showMessage('actionMessage', 'Balance must be above zero to add interest.', 'error');
    return;
  }

  const interestAmount = roundToTwo(currentBalance * INTEREST_RATE);

  if (interestAmount <= 0) {
    showMessage('actionMessage', 'Balance too low to calculate interest.', 'error');
    return;
  }

  const newBalance = roundToTwo(currentBalance + interestAmount);
  setCurrentBalance(newBalance);
  addTransaction('Interest', interestAmount, interestAmount, newBalance, '2% credit');
  refreshDashboard();

  showMessage('actionMessage', `Interest added: ${formatCurrency(interestAmount)}.`, 'success');
}

function undoLastTransaction() {
  const history = getHistory();

  if (history.length === 0) {
    showMessage('actionMessage', 'No transactions available to undo.', 'error');
    return;
  }

  const lastTransaction = history[0];

  if (!lastTransaction.undoable) {
    showMessage('actionMessage', 'The latest record cannot be undone.', 'error');
    return;
  }

  const currentBalance = getCurrentBalance();
  const reversedBalance = roundToTwo(currentBalance - lastTransaction.delta);

  if (reversedBalance < 0) {
    showMessage('actionMessage', 'Undo failed due to invalid balance state.', 'error');
    return;
  }

  setCurrentBalance(reversedBalance);
  history.shift();
  saveHistory(history);
  refreshDashboard();

  showMessage('actionMessage', `Last transaction (${lastTransaction.type}) has been undone.`, 'success');
}

function clearHistory() {
  saveHistory([]);
  renderTransactionHistory();

  showMessage('actionMessage', 'Transaction history cleared.', 'success');
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
  updateWelcomeMessage();
  refreshDashboard();

  const depositButton = document.getElementById('depositBtn');
  const withdrawButton = document.getElementById('withdrawBtn');
  const transferButton = document.getElementById('transferBtn');
  const interestButton = document.getElementById('interestBtn');
  const undoButton = document.getElementById('undoBtn');
  const clearHistoryButton = document.getElementById('clearHistoryBtn');
  const logoutButton = document.getElementById('logoutBtn');

  if (depositButton) {
    depositButton.addEventListener('click', depositAmount);
  }

  if (withdrawButton) {
    withdrawButton.addEventListener('click', withdrawAmount);
  }

  if (transferButton) {
    transferButton.addEventListener('click', transferAmount);
  }

  if (interestButton) {
    interestButton.addEventListener('click', addInterest);
  }

  if (undoButton) {
    undoButton.addEventListener('click', undoLastTransaction);
  }

  if (clearHistoryButton) {
    clearHistoryButton.addEventListener('click', clearHistory);
  }

  if (logoutButton) {
    logoutButton.addEventListener('click', logoutUser);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setupLoginPage();
  setupHomePage();
});
