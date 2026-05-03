// Analytics Dashboard module
document.addEventListener('DOMContentLoaded', () => {
  if (typeof getUsers !== 'function') {
    console.error('Required functions from script.js are not available.');
    return;
  }
  initAnalytics();
});

let charts = {};

function initAnalytics(){
  applyRoleAccess();
  bindControls();
  renderAllAnalytics();
}

function applyRoleAccess(){
  const role = getCurrentRole ? getCurrentRole() : localStorage.getItem('currentUserRole') || 'viewer';
  // viewer: only metrics, hide charts
  if(role === 'viewer'){
    document.getElementById('chartsGrid').style.display = 'none';
  }
}

function bindControls(){
  document.getElementById('refreshBtn').addEventListener('click', renderAllAnalytics);
  document.getElementById('filterStart').addEventListener('change', renderAllAnalytics);
  document.getElementById('filterEnd').addEventListener('change', renderAllAnalytics);
  document.getElementById('filterType').addEventListener('change', renderAllAnalytics);
  document.getElementById('filterStatus').addEventListener('change', renderAllAnalytics);
  document.getElementById('exportJsonBtn').addEventListener('click', exportAnalyticsJson);
  document.getElementById('downloadChartsBtn').addEventListener('click', downloadAllChartsImages);
}

function renderAllAnalytics(){
  showLoading(true);
  setTimeout(()=>{
    const filters = readFilters();
    const users = safeGetUsers();
    const pending = safeGetPending();
    const txs = aggregateAllTransactions(users, pending);

    const filteredTxs = applyFiltersToTxs(txs, filters);

    renderMetrics(users, filteredTxs, pending);
    const role = getCurrentRole ? getCurrentRole() : localStorage.getItem('currentUserRole') || 'viewer';
    if(role !== 'viewer'){
      renderCharts(filteredTxs, users, pending);
    }
    toggleNoDataState(filteredTxs, users);
    showLoading(false);
  }, 250);
}

function showLoading(show){
  // simple visual feedback: disable buttons while loading
  document.getElementById('refreshBtn').disabled = show;
}

function readFilters(){
  const s = document.getElementById('filterStart').value;
  const e = document.getElementById('filterEnd').value;
  const type = document.getElementById('filterType').value;
  const status = document.getElementById('filterStatus').value;
  return { start: s ? new Date(s).getTime() : null, end: e ? (new Date(e).setHours(23,59,59,999)) : null, type, status };
}

function safeGetUsers(){
  try{ return getUsers(); }catch(e){ return []; }
}
function safeGetPending(){
  try{ return getPendingTransactions(); }catch(e){ return []; }
}

function aggregateAllTransactions(users, pending){
  const txs = [];
  users.forEach(u => {
    (u.transactions||[]).forEach(t => txs.push({ ...t, username: u.username, status: 'APPROVED' }));
  });
  // Pending transactions stored separately include PENDING/APPROVED/REJECTED
  (pending||[]).forEach(p=> txs.push({ id: p.id, type: p.type, amount: Number(p.amount), username: p.fromUser, toUser: p.toUser||null, timestamp: p.createdAt||p.createdAt, status: p.status }));
  // Normalize type casing
  txs.forEach(t => { if(t.type) t.type = String(t.type).toLowerCase(); });
  return txs.sort((a,b)=> (b.timestamp||0) - (a.timestamp||0));
}

function applyFiltersToTxs(txs, filters){
  return txs.filter(t => {
    if(filters.type && filters.type !== 'ALL' && t.type !== filters.type) return false;
    if(filters.status && filters.status !== 'ALL' && String(t.status).toUpperCase() !== String(filters.status).toUpperCase()) return false;
    if(filters.start && t.timestamp < filters.start) return false;
    if(filters.end && t.timestamp > filters.end) return false;
    return true;
  });
}

function renderMetrics(users, txs, pending){
  const approvedTxs = txs.filter(t => String(t.status).toUpperCase() === 'APPROVED');

  const totalUsers = users.length || 0;
  const totalTxs = approvedTxs.length;
  const totalDeposits = approvedTxs.filter(t=>t.type==='deposit').reduce((s,t)=>s+Number(t.amount||0),0);
  const totalWithdrawals = approvedTxs.filter(t=>t.type==='withdraw').reduce((s,t)=>s+Math.abs(Number(t.amount||0)),0);
  const totalTransfers = approvedTxs.filter(t=>t.type==='transfer').reduce((s,t)=>s+Math.abs(Number(t.amount||0)),0);
  const pendingCount = (pending||[]).filter(p=> String(p.status).toUpperCase() === 'PENDING').length;

  document.getElementById('mTotalUsers').textContent = totalUsers;
  document.getElementById('mTotalTxs').textContent = totalTxs;
  document.getElementById('mTotalDeposits').textContent = formatCurrency(totalDeposits);
  document.getElementById('mTotalWithdrawals').textContent = formatCurrency(totalWithdrawals);
  document.getElementById('mTotalTransfers').textContent = formatCurrency(totalTransfers);
  document.getElementById('mPendingCount').textContent = pendingCount;
}

function renderCharts(txs, users, pending){
  renderTypeChart(txs);
  renderTrendChart(txs);
  renderUserActivityChart(txs);
  renderStatusChart(txs.concat((pending||[]).map(p=>({ type:p.type, amount:p.amount, username:p.fromUser, timestamp:p.createdAt, status:p.status }))))
}

function renderTypeChart(txs){
  const approved = txs.filter(t=> String(t.status).toUpperCase()==='APPROVED');
  const counts = { deposit:0, withdraw:0, transfer:0 };
  approved.forEach(t=>{ if(counts[t.type]!==undefined) counts[t.type]++; });
  const data = [counts.deposit, counts.withdraw, counts.transfer];
  const ctx = document.getElementById('chartType').getContext('2d');
  if(charts.type) charts.type.destroy();
  charts.type = new Chart(ctx, {
    type: 'pie',
    data: { labels:['Deposit','Withdraw','Transfer'], datasets:[{data, backgroundColor:['#2ecc71','#e74c3c','#3498db']}] },
    options: { responsive:true, plugins:{legend:{position:'bottom'}} }
  });
}

function renderTrendChart(txs){
  const approved = txs.filter(t=> String(t.status).toUpperCase()==='APPROVED');
  // group by date
  const map = {};
  approved.forEach(t=>{
    const d = new Date(t.timestamp);
    const key = d.toISOString().slice(0,10);
    map[key] = (map[key]||0)+1;
  });
  const labels = Object.keys(map).sort();
  const data = labels.map(k=>map[k]);
  const ctx = document.getElementById('chartTrend').getContext('2d');
  if(charts.trend) charts.trend.destroy();
  charts.trend = new Chart(ctx, { type:'line', data:{labels, datasets:[{label:'Txs/day', data, borderColor:'#0b74de', backgroundColor:'rgba(11,116,222,0.08)', tension:0.3}]}, options:{responsive:true, plugins:{legend:{display:false}}} });
}

function renderUserActivityChart(txs){
  const approved = txs.filter(t=> String(t.status).toUpperCase()==='APPROVED');
  const counts = {};
  approved.forEach(t=>{ counts[t.username] = (counts[t.username]||0)+1; });
  const entries = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const labels = entries.map(e=>e[0]||'Unknown');
  const data = entries.map(e=>e[1]);
  const ctx = document.getElementById('chartUsers').getContext('2d');
  if(charts.users) charts.users.destroy();
  charts.users = new Chart(ctx, { type:'bar', data:{labels, datasets:[{label:'Transactions', data, backgroundColor:'#6a5acd'}]}, options:{responsive:true, plugins:{legend:{display:false}}} });
}

function renderStatusChart(txs){
  const counts = { PENDING:0, APPROVED:0, REJECTED:0 };
  txs.forEach(t=>{ const s = String(t.status||'PENDING').toUpperCase(); if(counts[s]!==undefined) counts[s]++; });
  const ctx = document.getElementById('chartStatus').getContext('2d');
  if(charts.status) charts.status.destroy();
  charts.status = new Chart(ctx, { type:'doughnut', data:{ labels:['Pending','Approved','Rejected'], datasets:[{data:[counts.PENDING, counts.APPROVED, counts.REJECTED], backgroundColor:['#f39c12','#2ecc71','#e74c3c']}]}, options:{responsive:true, plugins:{legend:{position:'bottom'}}} });
}

function toggleNoDataState(txs, users){
  const noDataEl = document.getElementById('noDataMessage');
  if((txs||[]).length === 0 && (users||[]).length === 0){
    noDataEl.style.display = 'block';
  } else if((txs||[]).length === 0){
    noDataEl.style.display = 'block';
  } else {
    noDataEl.style.display = 'none';
  }
}

function exportAnalyticsJson(){
  const users = safeGetUsers();
  const pending = safeGetPending();
  const txs = aggregateAllTransactions(users, pending);
  const payload = { generatedAt: Date.now(), users, pending, transactions: txs };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type:'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'bank-analytics.json'; a.click(); URL.revokeObjectURL(url);
}

function downloadAllChartsImages(){
  Object.keys(charts).forEach((k, idx)=>{
    try{
      const c = charts[k].canvas;
      const url = c.toDataURL('image/png');
      const a = document.createElement('a'); a.href = url; a.download = `chart-${k}.png`; a.click();
    }catch(e){ console.warn('Failed to download chart', k, e); }
  });
}

// Utility: reuse formatCurrency from global if available
function formatCurrency(amount){
  if(typeof window.formatCurrency === 'function') return window.formatCurrency(amount);
  return new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(Number(amount||0));
}
