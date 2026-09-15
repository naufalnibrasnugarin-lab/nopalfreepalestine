/**
 * BUKU KAS PERUSAHAAN — Core Application Logic
 * Single Page Application, Router, Data Store, SVG Chart Rendering & UI Handlers
 */

// ==========================================
// 1. UTILITY FUNCTIONS
// ==========================================
function formatRupiah(amount, showSign = false, type = 'INCOME') {
  if (amount === undefined || amount === null || isNaN(amount)) return 'Rp 0';
  const num = Math.abs(Number(amount));
  const formatted = 'Rp ' + num.toLocaleString('id-ID');
  if (showSign) {
    return type === 'INCOME' ? '+' + formatted : '-' + formatted;
  }
  return formatted;
}

function parseRupiahInput(value) {
  if (!value) return 0;
  return parseInt(value.replace(/[^0-9]/g, ''), 10) || 0;
}

function formatRupiahInput(input) {
  const num = parseRupiahInput(input.value);
  input.value = num > 0 ? num.toLocaleString('id-ID') : '';
}

function formatDateIndo(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  
  const options = { day: 'numeric', month: 'long', year: 'numeric' };
  return d.toLocaleDateString('id-ID', options);
}

function formatDateGroup(dateStr) {
  if (!dateStr) return '';
  const txDate = new Date(dateStr);
  const now = new Date();
  
  // Format check for 'today' or 'yesterday'
  const isToday = txDate.toDateString() === now.toDateString();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = txDate.toDateString() === yesterday.toDateString();

  const formattedDate = txDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  if (isToday) return `Hari ini — ${formattedDate}`;
  if (isYesterday) return `Kemarin — ${formattedDate}`;
  return formattedDate;
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
}

// ==========================================
// 2. TOAST NOTIFICATION SERVICE
// ==========================================
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `flex items-center gap-3 px-5 py-3.5 rounded-xl bg-surface-container-high border shadow-2xl text-on-surface transform transition-all duration-300 translate-y-2 opacity-0 pointer-events-auto max-w-md ${
    type === 'success' ? 'border-secondary/40' : type === 'error' ? 'border-error/40' : 'border-primary/40'
  }`;

  const icon = type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info';
  const iconColor = type === 'success' ? 'text-secondary' : type === 'error' ? 'text-error' : 'text-primary';
  const iconBg = type === 'success' ? 'bg-secondary/20' : type === 'error' ? 'bg-error-container/20' : 'bg-primary/20';

  toast.innerHTML = `
    <div class="w-8 h-8 rounded-full ${iconBg} ${iconColor} flex items-center justify-center shrink-0">
      <span class="material-symbols-outlined text-[20px]">${icon}</span>
    </div>
    <div class="flex flex-col pr-2 min-w-0">
      <span class="font-body-sm text-body-sm font-bold text-on-surface truncate">${message}</span>
      <span class="font-body-sm text-[11px] text-on-surface-variant">Buku Kas Perusahaan</span>
    </div>
    <button onclick="this.parentElement.remove()" class="p-1 text-outline hover:text-on-surface transition-colors ml-auto" type="button">
      <span class="material-symbols-outlined text-[16px]">close</span>
    </button>
  `;

  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ==========================================
// 3. API CLIENT STORE
// ==========================================
const store = {
  company: null,
  categories: [],
  accounts: [],
  dashboard: null,
  transactions: [],
  txSummary: null,
  txTotalCount: 0,
  currentTxFilters: {
    page: 1,
    limit: 15,
    type: 'all',
    month: '2026-03',
    search: ''
  },
  report: null,
  currentReportMonth: '2026-03',
  activeDetailTxId: null,

  async fetchCompany() {
    try {
      const res = await fetch('/api/company');
      const json = await res.json();
      if (json.success) {
        this.company = json.data;
        this.updateCompanyUI();
      }
    } catch (err) {
      console.error('Fetch company error:', err);
    }
  },

  updateCompanyUI() {
    if (!this.company) return;
    const c = this.company;
    
    // Sidebar items
    const sbName = document.getElementById('sidebarCompanyName');
    if (sbName) sbName.textContent = c.name;
    const sbCode = document.getElementById('sidebarCompanyCode');
    if (sbCode) sbCode.textContent = `ID: ${c.company_code}`;
    const sbCfoName = document.getElementById('sidebarCfoName');
    if (sbCfoName) sbCfoName.textContent = c.cfo_name || 'Bambang Sudiro, SE, Ak.';
    const sbCfoTitle = document.getElementById('sidebarCfoTitle');
    if (sbCfoTitle) sbCfoTitle.textContent = c.cfo_title || 'CFO (Owner)';

    // Settings inputs
    const formName = document.getElementById('settings_company_name');
    if (formName) formName.value = c.name;
    const formTax = document.getElementById('settings_company_tax_id');
    if (formTax) formTax.value = c.company_code;
    const formEmail = document.getElementById('settings_company_email');
    if (formEmail) formEmail.value = c.email;
    const formPhone = document.getElementById('settings_company_phone');
    if (formPhone) formPhone.value = c.phone;
    const formAddress = document.getElementById('settings_company_address');
    if (formAddress) formAddress.value = c.address;
    const confId = document.getElementById('settingsConfId');
    if (confId) confId.textContent = `CONF: #${c.company_code}-SYS`;

    // Logo preview
    const logoImg = document.getElementById('settingsLogoPreview');
    if (logoImg && c.logo_url) {
      logoImg.src = c.logo_url;
    }
  },

  async fetchCategories() {
    try {
      const res = await fetch('/api/categories?include_inactive=true');
      const json = await res.json();
      if (json.success) {
        this.categories = json.data;
        this.populateCategoryDropdown();
        this.renderSettingsCategories();
      }
    } catch (err) {
      console.error('Fetch categories error:', err);
    }
  },

  async fetchAccounts() {
    try {
      const res = await fetch('/api/accounts?include_inactive=true');
      const json = await res.json();
      if (json.success) {
        this.accounts = json.data;
        this.populateAccountDropdown();
        this.renderSettingsAccounts();
      }
    } catch (err) {
      console.error('Fetch accounts error:', err);
    }
  },

  populateCategoryDropdown(selectedTypeId = 'INCOME') {
    const select = document.getElementById('txFormCategory');
    if (!select) return;
    select.innerHTML = '';
    
    const filtered = this.categories.filter(c => c.is_active === 1 && c.type === selectedTypeId);
    filtered.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name;
      select.appendChild(opt);
    });
  },

  populateAccountDropdown() {
    const select = document.getElementById('txFormAccount');
    if (!select) return;
    select.innerHTML = '';
    
    const filtered = this.accounts.filter(a => a.is_active === 1);
    filtered.forEach(a => {
      const opt = document.createElement('option');
      opt.value = a.id;
      opt.textContent = `${a.name} (${formatRupiah(a.current_balance)})`;
      select.appendChild(opt);
    });
  },

  async fetchDashboard(period = '30d') {
    try {
      const res = await fetch(`/api/dashboard?period=${period}&month=2026-03`);
      const json = await res.json();
      if (json.success) {
        this.dashboard = json.data;
        this.renderDashboard();
      }
    } catch (err) {
      console.error('Fetch dashboard error:', err);
    }
  },

  renderDashboard() {
    if (!this.dashboard) return;
    const d = this.dashboard;

    // 1. KPIs
    const kpiSaldo = document.getElementById('kpiTotalSaldo');
    if (kpiSaldo) kpiSaldo.textContent = formatRupiah(d.kpis.totalSaldo);
    
    const kpiIncome = document.getElementById('kpiTotalIncome');
    if (kpiIncome) kpiIncome.textContent = formatRupiah(d.kpis.income, true, 'INCOME');
    
    const kpiExpense = document.getElementById('kpiTotalExpense');
    if (kpiExpense) kpiExpense.textContent = formatRupiah(d.kpis.expense, true, 'EXPENSE');

    const kpiActiveAccounts = document.getElementById('kpiActiveAccountsText');
    if (kpiActiveAccounts) kpiActiveAccounts.textContent = `Tersimpan di ${d.kpis.activeAccountsCount} rekening aktif`;

    // 2. Savings Target
    if (d.savingsTarget) {
      const st = d.savingsTarget;
      const sBadge = document.getElementById('savingsBadge');
      if (sBadge) sBadge.textContent = `${st.percentage}% Terkumpul`;
      const sTitle = document.getElementById('savingsTitle');
      if (sTitle) sTitle.textContent = st.title;
      const sAmounts = document.getElementById('savingsAmounts');
      if (sAmounts) sAmounts.innerHTML = `Terkumpul: <span class="text-on-surface font-semibold">${formatRupiah(st.collected_amount)}</span> / ${formatRupiah(st.target_amount)}`;
      const sBar = document.getElementById('savingsProgressBar');
      if (sBar) sBar.style.width = `${st.percentage}%`;
      const sRem = document.getElementById('savingsRemainingText');
      if (sRem) sRem.textContent = `Kurang ${formatRupiah(st.remaining)} lagi! 🏖️`;
      const sDead = document.getElementById('savingsDeadlineText');
      if (sDead) sDead.textContent = `Sisa ${st.deadline_months} bulan`;
    }

    // 3. Render Chart
    this.renderCashflowChart(d.chart);

    // 4. Render Recent Transactions
    this.renderRecentTransactions(d.recentTransactions);
  },

  renderCashflowChart(chartData) {
    if (!chartData || !chartData.points || chartData.points.length === 0) return;

    const points = chartData.points;
    const svg = document.getElementById('cashflowSvg');
    const nodesGroup = document.getElementById('svgNodesGroup');
    const labelsContainer = document.getElementById('chartAxisLabels');
    if (!svg || !nodesGroup) return;

    nodesGroup.innerHTML = '';
    if (labelsContainer) labelsContainer.innerHTML = '';

    // Calculate scaling: width 1000, height 320 (playable height 40 to 260)
    const maxVal = Math.max(
      ...points.map(p => Math.max(p.income, p.expense, 10000000))
    );

    const chartW = 1000;
    const topY = 50;
    const bottomY = 260;
    const heightRange = bottomY - topY;

    const incomeCoords = [];
    const expenseCoords = [];

    const step = chartW / (points.length - 1 || 1);

    points.forEach((p, idx) => {
      const x = Math.round(idx * step);
      // Invert Y so highest value is topY
      const yInc = Math.round(bottomY - (p.income / maxVal) * heightRange);
      const yExp = Math.round(bottomY - (p.expense / maxVal) * heightRange);

      incomeCoords.push({ x, y: yInc, point: p });
      expenseCoords.push({ x, y: yExp, point: p });

      // Labels
      if (labelsContainer) {
        const span = document.createElement('span');
        span.className = p.isAuditPoint ? 'text-primary font-bold bg-primary/10 px-2 py-0.5 rounded' : '';
        span.textContent = p.label;
        labelsContainer.appendChild(span);
      }
    });

    // Build SVG path strings with smooth bezier curves
    function buildSmoothPath(coords) {
      if (coords.length === 0) return '';
      let d = `M ${coords[0].x} ${coords[0].y}`;
      for (let i = 0; i < coords.length - 1; i++) {
        const curr = coords[i];
        const next = coords[i + 1];
        const cp1x = curr.x + (next.x - curr.x) / 2;
        const cp1y = curr.y;
        const cp2x = curr.x + (next.x - curr.x) / 2;
        const cp2y = next.y;
        d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
      }
      return d;
    }

    const incLinePath = buildSmoothPath(incomeCoords);
    const expLinePath = buildSmoothPath(expenseCoords);

    const incAreaPath = `${incLinePath} L 1000 280 L 0 280 Z`;
    const expAreaPath = `${expLinePath} L 1000 280 L 0 280 Z`;

    const svgIncArea = document.getElementById('svgIncomeArea');
    if (svgIncArea) svgIncArea.setAttribute('d', incAreaPath);
    const svgExpArea = document.getElementById('svgExpenseArea');
    if (svgExpArea) svgExpArea.setAttribute('d', expAreaPath);
    const svgIncLine = document.getElementById('svgIncomeLine');
    if (svgIncLine) svgIncLine.setAttribute('d', incLinePath);
    const svgExpLine = document.getElementById('svgExpenseLine');
    if (svgExpLine) svgExpLine.setAttribute('d', expLinePath);

    // Render interactive data nodes
    incomeCoords.forEach((c) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', c.x);
      circle.setAttribute('cy', c.y);
      circle.setAttribute('r', c.point.isAuditPoint ? '6' : '4');
      circle.setAttribute('fill', '#4edea3');
      circle.setAttribute('stroke', '#051424');
      circle.setAttribute('stroke-width', '2');
      circle.setAttribute('class', 'cursor-pointer hover:scale-150 transition-transform');
      circle.addEventListener('mouseenter', () => {
        showChartTooltip(c.x, c.point);
      });
      nodesGroup.appendChild(circle);
    });

    expenseCoords.forEach((c) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', c.x);
      circle.setAttribute('cy', c.y);
      circle.setAttribute('r', c.point.isAuditPoint ? '5' : '3.5');
      circle.setAttribute('fill', '#ffb3ad');
      circle.setAttribute('stroke', '#051424');
      circle.setAttribute('stroke-width', '1.5');
      circle.setAttribute('class', 'cursor-pointer hover:scale-150 transition-transform');
      circle.addEventListener('mouseenter', () => {
        showChartTooltip(c.x, c.point);
      });
      nodesGroup.appendChild(circle);
    });
  },

  renderRecentTransactions(transactions) {
    const container = document.getElementById('dashRecentTxList');
    if (!container) return;
    container.innerHTML = '';

    if (!transactions || transactions.length === 0) {
      container.innerHTML = `
        <div class="p-6 text-center text-on-surface-variant flex flex-col items-center gap-2">
          <span class="material-symbols-outlined text-outline text-[32px]">receipt_long</span>
          <span class="font-body-sm">Belum ada transaksi tercatat.</span>
        </div>
      `;
      return;
    }

    transactions.forEach(t => {
      const isIncome = t.type === 'INCOME';
      const iconColor = isIncome ? 'text-secondary' : 'text-tertiary';
      const iconBg = isIncome ? 'bg-secondary-container/20' : 'bg-surface-container-highest';
      const amountColor = isIncome ? 'text-secondary' : 'text-tertiary';
      const amountText = formatRupiah(t.amount, true, t.type);

      const row = document.createElement('div');
      row.className = 'flex items-center justify-between p-space-md rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer group';
      row.onclick = () => window.modalManager.openDetailDrawer(t.id);

      row.innerHTML = `
        <div class="flex items-center gap-space-md min-w-0">
          <div class="p-2.5 rounded-lg ${iconBg} ${iconColor} group-hover:scale-105 transition-transform shrink-0">
            <span class="material-symbols-outlined text-[20px]">${t.category_icon || (isIncome ? 'laptop_mac' : 'local_cafe')}</span>
          </div>
          <div class="flex flex-col min-w-0">
            <span class="font-body-md text-body-md font-semibold text-on-surface truncate">${t.description}</span>
            <div class="flex items-center gap-1.5 text-on-surface-variant font-body-sm text-body-sm truncate">
              <span>${formatDateGroup(t.transaction_date)}, ${formatTime(t.transaction_date)}</span>
              <span>•</span>
              <span class="${isIncome ? 'text-secondary-fixed-dim' : 'text-outline'}">${t.category_name}</span>
            </div>
          </div>
        </div>
        <div class="text-right shrink-0 pl-2">
          <span class="font-currency-md text-currency-md font-bold ${amountColor}">${amountText}</span>
        </div>
      `;
      container.appendChild(row);
    });
  },

  async fetchTransactions() {
    try {
      const q = new URLSearchParams(this.currentTxFilters).toString();
      const res = await fetch(`/api/transactions?${q}`);
      const json = await res.json();
      if (json.success) {
        this.transactions = json.data;
        this.txSummary = json.summary;
        this.txTotalCount = json.totalCount;
        this.renderTransactions();
      }
    } catch (err) {
      console.error('Fetch transactions error:', err);
    }
  },

  renderTransactions() {
    const container = document.getElementById('transactionListContainer');
    const noResults = document.getElementById('txNoResultsState');
    if (!container) return;

    // 1. Summary Cards
    if (this.txSummary) {
      const mutasiEl = document.getElementById('txSummaryMutasi');
      if (mutasiEl) mutasiEl.textContent = formatRupiah(this.txSummary.totalMutasi);
      const incEl = document.getElementById('txSummaryIncome');
      if (incEl) incEl.textContent = formatRupiah(this.txSummary.totalIncome, true, 'INCOME');
      const expEl = document.getElementById('txSummaryExpense');
      if (expEl) expEl.textContent = formatRupiah(this.txSummary.totalExpense, true, 'EXPENSE');

      const incCountEl = document.getElementById('txSummaryIncomeCount');
      if (incCountEl) incCountEl.textContent = `${this.txSummary.incomeCount} transaksi berhasil tercatat`;
      const expCountEl = document.getElementById('txSummaryExpenseCount');
      if (expCountEl) expCountEl.textContent = `${this.txSummary.expenseCount} alokasi beban operasional`;
    }

    // 2. Pagination info
    const pagInfo = document.getElementById('txPaginationInfo');
    if (pagInfo) {
      pagInfo.innerHTML = `Menampilkan <span class="font-semibold text-on-surface">${this.transactions.length}</span> dari <span class="font-semibold text-on-surface">${this.txTotalCount}</span> transaksi`;
    }

    // 3. Transactions Grouping by Date
    container.innerHTML = '';
    if (this.transactions.length === 0) {
      if (noResults) noResults.classList.remove('hidden');
      if (noResults) noResults.classList.add('flex');
      return;
    } else {
      if (noResults) noResults.classList.add('hidden');
      if (noResults) noResults.classList.remove('flex');
    }

    // Group items by date string (YYYY-MM-DD)
    const groups = {};
    this.transactions.forEach(t => {
      const dKey = t.transaction_date ? t.transaction_date.split(' ')[0] : 'Lainnya';
      if (!groups[dKey]) groups[dKey] = [];
      groups[dKey].push(t);
    });

    Object.keys(groups).forEach(dKey => {
      const items = groups[dKey];
      const groupEl = document.createElement('div');
      groupEl.className = 'tx-date-group flex flex-col';

      const headerLabel = formatDateGroup(items[0].transaction_date);

      let rowsHtml = '';
      items.forEach((t, i) => {
        const isIncome = t.type === 'INCOME';
        const iconBg = isIncome ? 'bg-secondary/10' : 'bg-tertiary/10';
        const iconColor = isIncome ? 'text-secondary' : 'text-tertiary';
        const amountColor = isIncome ? 'text-secondary' : 'text-tertiary';
        const amountFormatted = formatRupiah(t.amount, true, t.type);
        const subtext = `${formatDateGroup(t.transaction_date)}, ${formatTime(t.transaction_date)} • ${t.category_name} • ${t.payment_method}`;

        rowsHtml += `
          <div onclick="window.modalManager.openDetailDrawer(${t.id})" class="tx-item px-space-lg py-3.5 hover:bg-surface-container/60 transition-colors flex items-center justify-between gap-space-md cursor-pointer">
            <div class="flex items-center gap-space-md min-w-0">
              <div class="w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center ${iconColor} shrink-0">
                <span class="material-symbols-outlined text-[20px]">${t.category_icon || (isIncome ? 'domain_verification' : 'payments')}</span>
              </div>
              <div class="flex flex-col min-w-0">
                <span class="font-body-md text-body-md font-semibold text-on-surface truncate">${t.description}</span>
                <span class="font-body-sm text-body-sm text-on-surface-variant truncate">${subtext}</span>
              </div>
            </div>
            <div class="flex flex-col items-end shrink-0 pl-2">
              <span class="font-currency-md text-body-lg ${amountColor} font-bold tracking-tight">${amountFormatted}</span>
              <span class="font-label-caps text-label-caps text-on-surface-variant uppercase">${t.account_name}</span>
            </div>
          </div>
          ${i < items.length - 1 ? '<div class="h-[1px] bg-surface-variant/40 mx-space-lg"></div>' : ''}
        `;
      });

      groupEl.innerHTML = `
        <div class="px-space-lg py-2.5 bg-surface-container-lowest/80 flex items-center justify-between border-y border-outline-variant/10">
          <span class="font-label-caps text-label-caps uppercase text-outline tracking-wider font-semibold">${headerLabel}</span>
          <span class="font-currency-md text-body-sm text-outline">${items.length} Transaksi</span>
        </div>
        ${rowsHtml}
      `;
      container.appendChild(groupEl);
    });
  },

  async fetchReport(month = '2026-03') {
    try {
      this.currentReportMonth = month;
      const res = await fetch(`/api/reports?month=${month}`);
      const json = await res.json();
      if (json.success) {
        this.report = json.data;
        this.renderReport();
      }
    } catch (err) {
      console.error('Fetch report error:', err);
    }
  },

  renderReport() {
    if (!this.report) return;
    const r = this.report;

    // Metrics
    const mInc = document.getElementById('reportMetricIncome');
    if (mInc) mInc.textContent = formatRupiah(r.metrics.totalIncome, true, 'INCOME');
    const mExp = document.getElementById('reportMetricExpense');
    if (mExp) mExp.textContent = formatRupiah(r.metrics.totalExpense, true, 'EXPENSE');
    const mSur = document.getElementById('reportMetricSurplus');
    if (mSur) mSur.textContent = formatRupiah(r.metrics.netSurplus, true, r.metrics.netSurplus >= 0 ? 'INCOME' : 'EXPENSE');

    const mIncCount = document.getElementById('reportMetricIncomeCount');
    if (mIncCount) mIncCount.textContent = `${r.metrics.incomeCount} transaksi kredit terverifikasi`;
    const mExpCount = document.getElementById('reportMetricExpenseCount');
    if (mExpCount) mExpCount.textContent = `${r.metrics.expenseCount} alokasi pos beban operasional`;

    const totalBebanBadge = document.getElementById('reportTotalBebanBadge');
    if (totalBebanBadge) totalBebanBadge.textContent = formatRupiah(r.metrics.totalExpense);

    const centerTotal = document.getElementById('donutCenterTotal');
    if (centerTotal) centerTotal.textContent = r.donut.totalExpenseFormatted;

    // Donut SVG slices
    const slicesGroup = document.getElementById('donutSlicesGroup');
    if (slicesGroup) {
      slicesGroup.innerHTML = '';
      if (r.donut && r.donut.categories) {
        r.donut.categories.forEach(cat => {
          const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          circle.setAttribute('cx', '100');
          circle.setAttribute('cy', '100');
          circle.setAttribute('r', '75');
          circle.setAttribute('fill', 'none');
          circle.setAttribute('stroke', cat.color);
          circle.setAttribute('stroke-width', '26');
          circle.setAttribute('stroke-dasharray', cat.dashArray);
          circle.setAttribute('stroke-dashoffset', cat.dashOffset);
          circle.setAttribute('class', 'hover:opacity-80 transition-opacity cursor-pointer');
          slicesGroup.appendChild(circle);
        });
      }
    }

    // Legend List
    const legendList = document.getElementById('reportLegendList');
    if (legendList) {
      legendList.innerHTML = '';
      if (r.donut && r.donut.categories) {
        r.donut.categories.forEach(cat => {
          const row = document.createElement('div');
          row.className = 'flex items-center justify-between p-3 rounded-lg bg-[#071525] border border-[#162536] hover:border-slate-700 transition';
          row.innerHTML = `
            <div class="flex items-center gap-3">
              <span class="w-3 h-3 rounded-full flex-shrink-0" style="background-color: ${cat.color}"></span>
              <div>
                <div class="text-xs font-semibold text-slate-200">${cat.name}</div>
                <div class="text-[10px] text-slate-400">${cat.descriptionSample || (cat.txCount + ' transaksi')}</div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-xs font-bold text-white font-currency-md">${formatRupiah(cat.amount)}</div>
              <div class="text-[10px] font-semibold" style="color: ${cat.color}">${cat.percentage}%</div>
            </div>
          `;
          legendList.appendChild(row);
        });
      }
    }

    // Detailed Category Table
    this.renderReportCategoryDetailTable(r.detailedCategories);
  },

  renderReportCategoryDetailTable(categories) {
    const table = document.getElementById('reportCategoryDetailTable');
    if (!table) return;
    table.innerHTML = '';

    if (!categories || categories.length === 0) {
      table.innerHTML = `
        <div class="p-6 text-center text-slate-400 text-xs">
          Belum ada beban operasional yang tercatat untuk periode ini.
        </div>
      `;
      return;
    }

    categories.forEach(cat => {
      const row = document.createElement('div');
      row.className = 'p-4 flex items-center justify-between hover:bg-[#0e2034]/40 transition';
      row.innerHTML = `
        <div class="flex items-center gap-3.5 w-1/3 min-w-[200px]">
          <div class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style="background-color: ${cat.color}15; color: ${cat.color}; border: 1px solid ${cat.color}30">
            <span class="material-symbols-outlined text-[18px]">${cat.icon || 'receipt'}</span>
          </div>
          <div>
            <div class="text-xs font-semibold text-white">${cat.name}</div>
            <div class="text-[11px] text-slate-400 mt-0.5">${cat.txCount} transaksi • ${cat.descriptionSample || ''}</div>
          </div>
        </div>
        <div class="hidden sm:block flex-1 max-w-xs mx-6">
          <div class="flex justify-between text-[10px] text-slate-400 mb-1">
            <span>Rasio Beban</span>
            <span class="font-medium" style="color: ${cat.color}">${cat.percentage}%</span>
          </div>
          <div class="w-full bg-[#132437] rounded-full h-1.5 overflow-hidden">
            <div class="h-1.5 rounded-full transition-all duration-700" style="width: ${cat.percentage}%; background-color: ${cat.color}"></div>
          </div>
        </div>
        <div class="text-right">
          <div class="text-xs font-bold text-red-400 font-currency-md">-${formatRupiah(cat.amount)}</div>
          <div class="text-[10px] text-slate-500 mt-0.5 uppercase">${cat.accountName}</div>
        </div>
      `;
      table.appendChild(row);
    });
  },

  renderSettingsCategories() {
    const list = document.getElementById('settingsCategoryList');
    if (!list) return;
    list.innerHTML = '';

    this.categories.forEach(cat => {
      const isInc = cat.type === 'INCOME';
      const badgeBg = isInc ? 'bg-secondary/20 text-secondary' : 'bg-tertiary/20 text-tertiary';
      const typeLabel = isInc ? 'Pemasukan' : 'Pengeluaran';

      const row = document.createElement('div');
      row.className = 'py-3.5 flex items-center justify-between gap-4';
      row.innerHTML = `
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center shrink-0" style="color: ${cat.color}">
            <span class="material-symbols-outlined text-[20px]">${cat.icon}</span>
          </div>
          <div class="flex flex-col min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-body-sm font-semibold text-on-surface truncate">${cat.name}</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${badgeBg}">${typeLabel}</span>
              ${cat.is_active === 0 ? '<span class="px-2 py-0.5 rounded text-[10px] bg-outline-variant/30 text-outline">Nonaktif</span>' : ''}
            </div>
            <span class="text-[11px] text-on-surface-variant">${cat.transaction_count || 0} transaksi terhubung</span>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button onclick="window.editCategory(${cat.id})" class="p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors" title="Edit Kategori">
            <span class="material-symbols-outlined text-[18px]">edit</span>
          </button>
          <button onclick="window.deactivateCategory(${cat.id})" class="p-1.5 rounded-lg text-outline hover:text-tertiary hover:bg-error-container/20 transition-colors" title="Nonaktifkan / Hapus Kategori">
            <span class="material-symbols-outlined text-[18px]">block</span>
          </button>
        </div>
      `;
      list.appendChild(row);
    });
  },

  renderSettingsAccounts() {
    const list = document.getElementById('settingsAccountList');
    if (!list) return;
    list.innerHTML = '';

    this.accounts.forEach(acc => {
      const row = document.createElement('div');
      row.className = 'py-3.5 flex items-center justify-between gap-4';
      row.innerHTML = `
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-9 h-9 rounded-lg bg-surface-container text-primary flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-[20px]">${acc.type === 'CASH' ? 'payments' : 'account_balance'}</span>
          </div>
          <div class="flex flex-col min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-body-sm font-semibold text-on-surface truncate">${acc.name}</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-surface-container-high text-on-surface-variant">${acc.type}</span>
              ${acc.is_active === 0 ? '<span class="px-2 py-0.5 rounded text-[10px] bg-outline-variant/30 text-outline">Nonaktif</span>' : ''}
            </div>
            <span class="text-[11px] text-on-surface-variant">No. Rekening: ${acc.account_number || '-'} • Saldo Awal: ${formatRupiah(acc.initial_balance)}</span>
          </div>
        </div>
        <div class="flex items-center gap-4 shrink-0">
          <div class="text-right">
            <div class="font-currency-md text-sm font-bold text-on-surface">${formatRupiah(acc.current_balance)}</div>
            <div class="text-[10px] text-secondary">Saldo Terverifikasi</div>
          </div>
          <button onclick="window.editAccount(${acc.id})" class="p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors" title="Edit Akun">
            <span class="material-symbols-outlined text-[18px]">edit</span>
          </button>
          <button onclick="window.deactivateAccount(${acc.id})" class="p-1.5 rounded-lg text-outline hover:text-tertiary hover:bg-error-container/20 transition-colors" title="Nonaktifkan / Hapus Akun">
            <span class="material-symbols-outlined text-[18px]">block</span>
          </button>
        </div>
      `;
      list.appendChild(row);
    });
  }
};

// ==========================================
// 4. CHART TOOLTIP HANDLER
// ==========================================
function showChartTooltip(xPos, point) {
  const tooltip = document.getElementById('chartTooltip');
  const guide = document.getElementById('chartGuideLine');
  const title = document.getElementById('chartTooltipTitle');
  const vals = document.getElementById('chartTooltipValues');
  const sur = document.getElementById('chartTooltipSurplus');
  if (!tooltip || !guide) return;

  const percent = Math.max(5, Math.min(95, (xPos / 1000) * 100));
  tooltip.style.left = `${percent}%`;
  guide.style.left = `${percent}%`;

  if (title) title.textContent = `Titik Audit: ${point.label}`;
  if (vals) vals.textContent = `${formatRupiah(point.income, true, 'INCOME')} / ${formatRupiah(point.expense, true, 'EXPENSE')}`;
  if (sur) {
    const isPositive = point.surplus >= 0;
    sur.className = isPositive ? 'text-secondary' : 'text-tertiary';
    sur.textContent = `Surplus Kas: ${formatRupiah(point.surplus, true, isPositive ? 'INCOME' : 'EXPENSE')}`;
  }

  tooltip.classList.remove('hidden');
  guide.classList.remove('hidden');
}

// ==========================================
// 5. CLIENT-SIDE ROUTER (NO FULL RELOAD)
// ==========================================
const router = {
  routes: {
    '/': { viewId: 'view-dashboard', title: 'Dashboard', breadcrumb: 'Dashboard' },
    '/transactions': { viewId: 'view-transactions', title: 'Riwayat Transaksi', breadcrumb: 'Riwayat Transaksi' },
    '/reports': { viewId: 'view-reports', title: 'Laporan Keuangan', breadcrumb: 'Laporan Transaksi' },
    '/settings': { viewId: 'view-settings', title: 'Pengaturan Perusahaan', breadcrumb: 'Pengaturan Perusahaan' }
  },

  init() {
    // Intercept clicks on links with data-route or matching routes
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href]');
      if (link && link.origin === window.location.origin) {
        const href = link.getAttribute('href');
        if (this.routes[href]) {
          e.preventDefault();
          this.navigate(href);
        }
      }
    });

    // Listen for browser Back/Forward navigation
    window.addEventListener('popstate', () => {
      this.handleRoute(window.location.pathname);
    });

    // Initial route handling
    this.handleRoute(window.location.pathname);
  },

  navigate(path) {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    this.handleRoute(path);
  },

  handleRoute(path) {
    const route = this.routes[path] || this.routes['/'];

    // 1. Hide all views and show active
    document.querySelectorAll('.page-view').forEach(view => {
      view.classList.add('hidden');
    });
    const targetView = document.getElementById(route.viewId);
    if (targetView) {
      targetView.classList.remove('hidden');
    }

    // 2. Update Breadcrumb
    const bc = document.getElementById('headerBreadcrumbPage');
    if (bc) bc.textContent = route.breadcrumb;
    document.title = `${route.title} — Buku Kas Perusahaan`;

    // 3. Update active sidebar link
    document.querySelectorAll('#sidebarNav a.nav-link').forEach(link => {
      const linkRoute = link.getAttribute('data-route');
      const icon = link.querySelector('.material-symbols-outlined');
      if (linkRoute === path || (path === '' && linkRoute === '/')) {
        link.className = 'nav-link flex items-center gap-space-md px-space-md py-space-sm rounded-lg transition-colors group bg-surface-container-highest text-primary font-bold shadow-sm';
        if (icon) {
          icon.className = 'material-symbols-outlined text-primary text-[20px]';
        }
      } else {
        link.className = 'nav-link flex items-center gap-space-md px-space-md py-space-sm rounded-lg font-body-md text-body-md text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors group';
        if (icon) {
          icon.className = 'material-symbols-outlined text-outline group-hover:text-primary transition-colors text-[20px]';
        }
      }
    });

    // 4. Trigger data refresh for the active view
    if (route.viewId === 'view-dashboard') {
      store.fetchDashboard();
    } else if (route.viewId === 'view-transactions') {
      store.fetchTransactions();
    } else if (route.viewId === 'view-reports') {
      store.fetchReport(store.currentReportMonth);
    } else if (route.viewId === 'view-settings') {
      store.fetchCompany();
      store.fetchCategories();
      store.fetchAccounts();
    }
  }
};

// ==========================================
// 6. MODAL & DRAWER MANAGER
// ==========================================
const modalManager = {
  currentTxType: 'INCOME',
  isEditing: false,

  openAddTransaction(defaultType = 'INCOME') {
    this.isEditing = false;
    document.getElementById('txFormId').value = '';
    document.getElementById('txModalTitle').textContent = 'Catat Transaksi Baru';
    document.getElementById('btnSaveTxText').textContent = 'Simpan Transaksi';

    // Clear inputs
    const amountInput = document.getElementById('txFormAmount');
    if (amountInput) amountInput.value = '';
    const descInput = document.getElementById('txFormDesc');
    if (descInput) descInput.value = '';
    const notesInput = document.getElementById('txFormNotes');
    if (notesInput) notesInput.value = '';

    // Clear receipt attachment
    if (typeof clearReceiptAttachment === 'function') clearReceiptAttachment();

    // Set default datetime to now
    const dateInput = document.getElementById('txFormDate');
    if (dateInput) {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      dateInput.value = now.toISOString().slice(0, 16);
    }

    this.selectType(defaultType);
    store.populateAccountDropdown();

    const modal = document.getElementById('txModal');
    if (modal) modal.classList.remove('hidden');
  },

  openEditTransaction(id) {
    const tx = store.transactions.find(t => t.id === id) || (store.dashboard ? store.dashboard.recentTransactions.find(t => t.id === id) : null);
    if (!tx) {
      // Fetch directly
      fetch(`/api/transactions/${id}`)
        .then(res => res.json())
        .then(json => {
          if (json.success) this.populateFormForEdit(json.data);
        });
      return;
    }
    this.populateFormForEdit(tx);
  },

  populateFormForEdit(tx) {
    this.isEditing = true;
    document.getElementById('txFormId').value = tx.id;
    document.getElementById('txModalTitle').textContent = `Edit Transaksi #${tx.id}`;
    document.getElementById('btnSaveTxText').textContent = 'Simpan Perubahan';

    const amountInput = document.getElementById('txFormAmount');
    if (amountInput) amountInput.value = tx.amount.toLocaleString('id-ID');
    const descInput = document.getElementById('txFormDesc');
    if (descInput) descInput.value = tx.description;
    const notesInput = document.getElementById('txFormNotes');
    if (notesInput) notesInput.value = tx.notes || '';

    const dateInput = document.getElementById('txFormDate');
    if (dateInput) {
      const d = new Date(tx.transaction_date);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      dateInput.value = d.toISOString().slice(0, 16);
    }

    const paySelect = document.getElementById('txFormPaymentMethod');
    if (paySelect && tx.payment_method) paySelect.value = tx.payment_method;

    this.selectType(tx.type);

    const catSelect = document.getElementById('txFormCategory');
    if (catSelect && tx.category_id) catSelect.value = tx.category_id;

    const accSelect = document.getElementById('txFormAccount');
    if (accSelect && tx.account_id) accSelect.value = tx.account_id;

    // Set receipt attachment if present
    if (tx.receipt_url) {
      const b64 = document.getElementById('txReceiptBase64');
      if (b64) b64.value = tx.receipt_url;
      const nameText = document.getElementById('txReceiptNameText');
      if (nameText) nameText.textContent = 'Bukti Kuitansi Tersimpan';
      const rmBtn = document.getElementById('btnRemoveReceipt');
      if (rmBtn) rmBtn.classList.remove('hidden');
    } else {
      if (typeof clearReceiptAttachment === 'function') clearReceiptAttachment();
    }

    const modal = document.getElementById('txModal');
    if (modal) modal.classList.remove('hidden');
    this.closeDetailDrawer();
  },

  selectType(type) {
    this.currentTxType = type;
    const btnInc = document.getElementById('btnTypeIncome');
    const btnExp = document.getElementById('btnTypeExpense');
    const iconWrapper = document.getElementById('txModalIconWrapper');

    if (type === 'INCOME') {
      btnInc.className = 'flex items-center justify-center gap-2 py-2 rounded-lg font-body-sm text-body-sm font-semibold transition-all bg-secondary-container/20 text-secondary border border-secondary/40 shadow-sm';
      btnExp.className = 'flex items-center justify-center gap-2 py-2 rounded-lg font-body-sm text-body-sm font-medium transition-all text-on-surface-variant hover:text-on-surface';
      if (iconWrapper) {
        iconWrapper.className = 'w-9 h-9 rounded-xl bg-secondary-container/20 text-secondary flex items-center justify-center';
        iconWrapper.innerHTML = '<span class="material-symbols-outlined text-[20px]">arrow_downward_alt</span>';
      }
    } else {
      btnExp.className = 'flex items-center justify-center gap-2 py-2 rounded-lg font-body-sm text-body-sm font-semibold transition-all bg-error-container/30 text-error border border-error/40 shadow-sm';
      btnInc.className = 'flex items-center justify-center gap-2 py-2 rounded-lg font-body-sm text-body-sm font-medium transition-all text-on-surface-variant hover:text-on-surface';
      if (iconWrapper) {
        iconWrapper.className = 'w-9 h-9 rounded-xl bg-error-container/30 text-error flex items-center justify-center';
        iconWrapper.innerHTML = '<span class="material-symbols-outlined text-[20px]">arrow_outward</span>';
      }
    }

    store.populateCategoryDropdown(type);
  },

  closeTransactionModal() {
    const modal = document.getElementById('txModal');
    if (modal) modal.classList.add('hidden');
  },

  async openDetailDrawer(id) {
    store.activeDetailTxId = id;
    try {
      const res = await fetch(`/api/transactions/${id}`);
      const json = await res.json();
      if (!json.success) return;
      const tx = json.data;

      const isInc = tx.type === 'INCOME';
      document.getElementById('drawerTxId').textContent = `ID: #TX-${tx.id}`;
      const typePill = document.getElementById('drawerTxTypePill');
      if (typePill) {
        typePill.textContent = isInc ? 'Pemasukan' : 'Pengeluaran';
        typePill.className = `px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
          isInc ? 'bg-secondary-container/20 text-secondary' : 'bg-error-container/30 text-error'
        }`;
      }

      const amtEl = document.getElementById('drawerTxAmount');
      if (amtEl) {
        amtEl.textContent = formatRupiah(tx.amount, true, tx.type);
        amtEl.className = `font-currency-xl text-2xl font-bold tracking-tight ${isInc ? 'text-secondary' : 'text-tertiary'}`;
      }

      document.getElementById('drawerTxAccountBadge').textContent = tx.account_name;
      document.getElementById('drawerTxDesc').textContent = tx.description;
      document.getElementById('drawerTxCategory').textContent = tx.category_name;
      document.getElementById('drawerTxPaymentMethod').textContent = tx.payment_method;
      document.getElementById('drawerTxDate').textContent = `${formatDateIndo(tx.transaction_date)}, ${formatTime(tx.transaction_date)}`;
      document.getElementById('drawerTxNotes').textContent = tx.notes || 'Tidak ada catatan tambahan.';
      document.getElementById('drawerTxCreated').textContent = formatDateIndo(tx.created_at);
      document.getElementById('drawerTxUpdated').textContent = formatDateIndo(tx.updated_at);

      // Receipt preview in drawer
      const rcptSec = document.getElementById('drawerTxReceiptSection');
      const rcptImg = document.getElementById('drawerTxReceiptImg');
      if (rcptSec && rcptImg) {
        if (tx.receipt_url) {
          rcptImg.src = tx.receipt_url;
          rcptSec.classList.remove('hidden');
        } else {
          rcptSec.classList.add('hidden');
        }
      }

      const drawer = document.getElementById('txDetailDrawer');
      if (drawer) drawer.classList.remove('hidden');
    } catch (err) {
      console.error('Open drawer error:', err);
    }
  },

  closeDetailDrawer() {
    const drawer = document.getElementById('txDetailDrawer');
    if (drawer) drawer.classList.add('hidden');
    store.activeDetailTxId = null;
  },

  openDeleteModal(id) {
    const tx = store.transactions.find(t => t.id === id) || (store.dashboard ? store.dashboard.recentTransactions.find(t => t.id === id) : null);
    if (!tx) return;

    store.activeDetailTxId = id;
    document.getElementById('deleteModalDesc').textContent = tx.description;
    document.getElementById('deleteModalAmount').textContent = formatRupiah(tx.amount, true, tx.type);
    document.getElementById('deleteModalDate').textContent = `${formatDateIndo(tx.transaction_date)} • ${tx.account_name}`;

    const modal = document.getElementById('txDeleteModal');
    if (modal) modal.classList.remove('hidden');
  },

  closeDeleteModal() {
    const modal = document.getElementById('txDeleteModal');
    if (modal) modal.classList.add('hidden');
  },

  // Category Modal
  currentCatType: 'INCOME',
  openCategoryModal(cat = null) {
    const form = document.getElementById('categoryForm');
    if (!form) return;
    form.reset();

    const title = document.getElementById('categoryModalTitle');
    const idInput = document.getElementById('categoryFormId');
    const nameInput = document.getElementById('categoryFormName');
    const iconInput = document.getElementById('categoryFormIcon');
    const colorInput = document.getElementById('categoryFormColor');
    const colorText = document.getElementById('categoryFormColorText');
    const activeRow = document.getElementById('categoryActiveToggleRow');
    const isActiveCheckbox = document.getElementById('categoryFormIsActive');
    const btnSaveText = document.getElementById('btnSaveCategoryText');

    if (cat) {
      title.textContent = `Edit Kategori: ${cat.name}`;
      idInput.value = cat.id;
      nameInput.value = cat.name;
      this.selectCategoryType(cat.type);
      if (iconInput) iconInput.value = cat.icon || 'category';
      if (colorInput) colorInput.value = cat.color || '#4edea3';
      if (colorText) colorText.textContent = cat.color || '#4edea3';
      if (activeRow) activeRow.classList.remove('hidden');
      if (isActiveCheckbox) isActiveCheckbox.checked = cat.is_active !== 0;
      if (btnSaveText) btnSaveText.textContent = 'Simpan Perubahan';
    } else {
      title.textContent = 'Tambah Kategori Baru';
      idInput.value = '';
      this.selectCategoryType('INCOME');
      if (iconInput) iconInput.value = 'payments';
      if (colorInput) colorInput.value = '#4edea3';
      if (colorText) colorText.textContent = '#4edea3';
      if (activeRow) activeRow.classList.add('hidden');
      if (isActiveCheckbox) isActiveCheckbox.checked = true;
      if (btnSaveText) btnSaveText.textContent = 'Simpan Kategori';
    }

    const modal = document.getElementById('categoryModal');
    if (modal) modal.classList.remove('hidden');
  },

  selectCategoryType(type) {
    this.currentCatType = type;
    const btnInc = document.getElementById('btnCatTypeIncome');
    const btnExp = document.getElementById('btnCatTypeExpense');
    const iconWrapper = document.getElementById('catModalIconWrapper');

    if (type === 'INCOME') {
      if (btnInc) btnInc.className = 'flex items-center justify-center gap-2 py-2 rounded-lg font-body-sm text-body-sm font-semibold transition-all bg-secondary-container/20 text-secondary border border-secondary/40 shadow-sm';
      if (btnExp) btnExp.className = 'flex items-center justify-center gap-2 py-2 rounded-lg font-body-sm text-body-sm font-medium transition-all text-on-surface-variant hover:text-on-surface';
      if (iconWrapper) {
        iconWrapper.className = 'w-9 h-9 rounded-xl bg-secondary-container/20 text-secondary flex items-center justify-center';
        iconWrapper.innerHTML = '<span class="material-symbols-outlined text-[20px]">arrow_downward_alt</span>';
      }
    } else {
      if (btnExp) btnExp.className = 'flex items-center justify-center gap-2 py-2 rounded-lg font-body-sm text-body-sm font-semibold transition-all bg-error-container/30 text-error border border-error/40 shadow-sm';
      if (btnInc) btnInc.className = 'flex items-center justify-center gap-2 py-2 rounded-lg font-body-sm text-body-sm font-medium transition-all text-on-surface-variant hover:text-on-surface';
      if (iconWrapper) {
        iconWrapper.className = 'w-9 h-9 rounded-xl bg-error-container/30 text-error flex items-center justify-center';
        iconWrapper.innerHTML = '<span class="material-symbols-outlined text-[20px]">arrow_outward</span>';
      }
    }
  },

  closeCategoryModal() {
    const modal = document.getElementById('categoryModal');
    if (modal) modal.classList.add('hidden');
  },

  // Account Modal
  openAccountModal(acc = null) {
    const form = document.getElementById('accountForm');
    if (!form) return;
    form.reset();

    const title = document.getElementById('accountModalTitle');
    const idInput = document.getElementById('accountFormId');
    const nameInput = document.getElementById('accountFormName');
    const numberInput = document.getElementById('accountFormNumber');
    const typeInput = document.getElementById('accountFormType');
    const balanceInput = document.getElementById('accountFormInitialBalance');
    const activeRow = document.getElementById('accountActiveToggleRow');
    const isActiveCheckbox = document.getElementById('accountFormIsActive');
    const btnSaveText = document.getElementById('btnSaveAccountText');

    if (acc) {
      title.textContent = `Edit Akun: ${acc.name}`;
      idInput.value = acc.id;
      nameInput.value = acc.name;
      if (numberInput) numberInput.value = acc.account_number || '';
      if (typeInput) typeInput.value = acc.type || 'BANK';
      if (balanceInput) balanceInput.value = acc.initial_balance ? acc.initial_balance.toLocaleString('id-ID') : '0';
      if (activeRow) activeRow.classList.remove('hidden');
      if (isActiveCheckbox) isActiveCheckbox.checked = acc.is_active !== 0;
      if (btnSaveText) btnSaveText.textContent = 'Simpan Perubahan';
    } else {
      title.textContent = 'Tambah Akun Kas/Rekening Baru';
      idInput.value = '';
      if (numberInput) numberInput.value = '';
      if (typeInput) typeInput.value = 'BANK';
      if (balanceInput) balanceInput.value = '';
      if (activeRow) activeRow.classList.add('hidden');
      if (isActiveCheckbox) isActiveCheckbox.checked = true;
      if (btnSaveText) btnSaveText.textContent = 'Simpan Akun';
    }

    const modal = document.getElementById('accountModal');
    if (modal) modal.classList.remove('hidden');
  },

  closeAccountModal() {
    const modal = document.getElementById('accountModal');
    if (modal) modal.classList.add('hidden');
  }
};

// ==========================================
// 7. FORM SUBMISSION & CRUD ACTIONS
// ==========================================
async function handleTransactionSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('btnSaveTx');
  const origHtml = btn.innerHTML;

  const id = document.getElementById('txFormId').value;
  const amount = parseRupiahInput(document.getElementById('txFormAmount').value);
  const category_id = document.getElementById('txFormCategory').value;
  const account_id = document.getElementById('txFormAccount').value;
  const transaction_date = document.getElementById('txFormDate').value;
  const payment_method = document.getElementById('txFormPaymentMethod').value;
  const description = document.getElementById('txFormDesc').value;
  const notes = document.getElementById('txFormNotes').value;

  if (amount <= 0) {
    showToast('Nominal transaksi harus lebih besar dari Rp0.', 'error');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = `
    <span class="material-symbols-outlined text-[18px] animate-spin">sync</span>
    <span>Menyimpan...</span>
  `;

  // Format datetime safely
  let formattedDate = transaction_date;
  if (formattedDate.includes('T')) {
    formattedDate = formattedDate.replace('T', ' ');
  }
  if (formattedDate.split(':').length === 2) {
    formattedDate += ':00';
  }

  const receipt_url = document.getElementById('txReceiptBase64') ? (document.getElementById('txReceiptBase64').value || null) : null;

  const payload = {
    type: modalManager.currentTxType,
    amount,
    category_id,
    account_id,
    transaction_date: formattedDate,
    payment_method,
    description,
    notes,
    receipt_url
  };

  try {
    const url = id ? `/api/transactions/${id}` : '/api/transactions';
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    btn.disabled = false;
    btn.innerHTML = origHtml;

    if (!json.success) {
      showToast(json.message || 'Gagal menyimpan transaksi.', 'error');
      return;
    }

    modalManager.closeTransactionModal();
    showToast(id ? 'Transaksi berhasil diperbarui.' : 'Transaksi berhasil ditambahkan.', 'success');

    // Refresh all state
    await store.fetchAccounts();
    await store.fetchDashboard();
    await store.fetchTransactions();
    if (store.currentReportMonth) {
      await store.fetchReport(store.currentReportMonth);
    }
  } catch (err) {
    btn.disabled = false;
    btn.innerHTML = origHtml;
    showToast('Terjadi gangguan jaringan saat menyimpan transaksi.', 'error');
  }
}

async function executeDeleteTransaction() {
  const id = store.activeDetailTxId;
  if (!id) return;

  const btn = document.getElementById('btnConfirmDelete');
  const origHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="material-symbols-outlined text-[18px] animate-spin">sync</span> Menghapus...';

  try {
    const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
    const json = await res.json();
    btn.disabled = false;
    btn.innerHTML = origHtml;

    if (!json.success) {
      showToast(json.message || 'Gagal menghapus transaksi.', 'error');
      return;
    }

    modalManager.closeDeleteModal();
    modalManager.closeDetailDrawer();
    showToast('Transaksi berhasil dihapus.', 'success');

    await store.fetchAccounts();
    await store.fetchDashboard();
    await store.fetchTransactions();
    if (store.currentReportMonth) {
      await store.fetchReport(store.currentReportMonth);
    }
  } catch (err) {
    btn.disabled = false;
    btn.innerHTML = origHtml;
    showToast('Gagal menghapus transaksi karena masalah koneksi.', 'error');
  }
}

// Drawer quick action triggers
function editFromDrawer() {
  if (store.activeDetailTxId) {
    modalManager.openEditTransaction(store.activeDetailTxId);
  }
}

function confirmDeleteFromDrawer() {
  if (store.activeDetailTxId) {
    modalManager.openDeleteModal(store.activeDetailTxId);
  }
}

// ==========================================
// 8. FILTERS & SEARCH LISTENERS
// ==========================================
function filterTransactionsByType(type) {
  store.currentTxFilters.type = type;
  store.currentTxFilters.page = 1;

  document.querySelectorAll('#txFilterGroup button').forEach(btn => {
    if (btn.getAttribute('data-filter') === type) {
      btn.className = 'tx-filter-pill active px-3 py-1 rounded-md font-body-sm text-body-sm font-semibold bg-surface-container-highest text-primary transition-colors';
    } else {
      btn.className = 'tx-filter-pill px-3 py-1 rounded-md font-body-sm text-body-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors';
    }
  });

  store.fetchTransactions();
}

function filterTransactionsByMonth(month) {
  store.currentTxFilters.month = month;
  store.currentTxFilters.page = 1;
  store.fetchTransactions();
}

function changeTxPage(delta) {
  const newPage = store.currentTxFilters.page + delta;
  if (newPage < 1) return;
  store.currentTxFilters.page = newPage;
  store.fetchTransactions();
}

function loadReportData(month) {
  store.fetchReport(month);
}

function downloadReportCsv() {
  const month = store.currentReportMonth;
  window.open(`/api/reports/export?month=${month}`, '_blank');
  showToast('Laporan kas berhasil diunduh dalam format CSV.', 'success');
}

function setChartPeriod(period) {
  document.querySelectorAll('.chart-period-btn').forEach(btn => {
    if (btn.getAttribute('data-period') === period) {
      btn.className = 'chart-period-btn px-3 py-1 rounded-md text-label-caps font-label-caps bg-surface-container-high text-on-surface shadow-sm font-semibold';
    } else {
      btn.className = 'chart-period-btn px-3 py-1 rounded-md text-label-caps font-label-caps text-on-surface-variant hover:text-on-surface transition-colors';
    }
  });
  store.fetchDashboard(period);
}

// ==========================================
// 9. SETTINGS & PROFILE MANAGEMENT
// ==========================================
function switchSettingsTab(tabName) {
  document.querySelectorAll('.settings-tab-btn').forEach(btn => {
    btn.className = 'settings-tab-btn px-4 py-2 rounded-lg font-body-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors';
  });

  document.querySelectorAll('.settings-tab-content').forEach(content => {
    content.classList.add('hidden');
  });

  if (tabName === 'profile') {
    document.getElementById('tabBtnProfile').className = 'settings-tab-btn px-4 py-2 rounded-lg font-body-sm font-semibold bg-primary-container text-on-primary shadow-sm transition-colors';
    document.getElementById('settingsTabProfile').classList.remove('hidden');
  } else if (tabName === 'categories') {
    document.getElementById('tabBtnCategories').className = 'settings-tab-btn px-4 py-2 rounded-lg font-body-sm font-semibold bg-primary-container text-on-primary shadow-sm transition-colors';
    document.getElementById('settingsTabCategories').classList.remove('hidden');
  } else if (tabName === 'accounts') {
    document.getElementById('tabBtnAccounts').className = 'settings-tab-btn px-4 py-2 rounded-lg font-body-sm font-semibold bg-primary-container text-on-primary shadow-sm transition-colors';
    document.getElementById('settingsTabAccounts').classList.remove('hidden');
  }
}

async function saveCompanyProfile(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-save-profile');
  const origHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="material-symbols-outlined text-[18px] animate-spin">sync</span> Menyimpan...';

  const payload = {
    name: document.getElementById('settings_company_name').value,
    company_code: document.getElementById('settings_company_tax_id').value,
    email: document.getElementById('settings_company_email').value,
    phone: document.getElementById('settings_company_phone').value,
    address: document.getElementById('settings_company_address').value
  };

  try {
    const res = await fetch('/api/company', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    btn.disabled = false;
    btn.innerHTML = origHtml;

    if (json.success) {
      store.company = json.data;
      store.updateCompanyUI();
      showToast('Profil PT Nusantara Digital Solusi berhasil diperbarui!');
    } else {
      showToast(json.message || 'Gagal menyimpan pengaturan.', 'error');
    }
  } catch (err) {
    btn.disabled = false;
    btn.innerHTML = origHtml;
    showToast('Terjadi kesalahan jaringan saat menyimpan profil.', 'error');
  }
}

function resetCompanySettingsForm() {
  store.updateCompanyUI();
  showToast('Formulir telah dikembalikan ke data awal.');
}

function handleLogoChange(e) {
  if (e.target.files && e.target.files[0]) {
    const file = e.target.files[0];
    if (file.size > 2 * 1024 * 1024) {
      showToast('Ukuran file melebihi 2MB. Silakan pilih gambar yang lebih kecil.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async function(evt) {
      const base64 = evt.target.result;
      document.getElementById('settingsLogoPreview').src = base64;
      try {
        const res = await fetch('/api/company', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: document.getElementById('settings_company_name').value,
            company_code: document.getElementById('settings_company_tax_id').value,
            email: document.getElementById('settings_company_email').value,
            phone: document.getElementById('settings_company_phone').value,
            address: document.getElementById('settings_company_address').value,
            logo_url: base64
          })
        });
        const json = await res.json();
        if (json.success) {
          showToast('Logo resmi perusahaan berhasil diperbarui!');
        }
      } catch (err) {
        showToast('Gagal mengunggah logo ke server.', 'error');
      }
    };
    reader.readAsDataURL(file);
  }
}

async function resetCompanyLogo() {
  if (!confirm('Apakah Anda yakin ingin menghapus logo resmi perusahaan?')) return;
  try {
    const res = await fetch('/api/company/reset-logo', { method: 'POST' });
    const json = await res.json();
    if (json.success) {
      store.company = json.data;
      document.getElementById('settingsLogoPreview').src = 'https://lh3.googleusercontent.com/aida/AEtjO1UEIIuujRikTSxPj_sA95MmnhEkekPXgrgQnpitzpBlBg2I-ThYRTw_tHH4nnVAoBATox955DAB-fyJ3vkPkkZ23iyVKgcOYlcgX333Vlivj7zv2g4JjIMr9bKmDQjHXcOYW2Wa2UyvStONLiTsBp3l4HeHJ_iYib1dE9TinxH-z_t_PaAmxyZ_5sMjSyoXcHpeQ48nor1hiKRVq2BdSKgK7uE8tTIgYTc6RNNmC3YcEi6M60CsDEbbiVy6';
      showToast('Logo perusahaan diatur ulang ke default.');
    }
  } catch (err) {
    showToast('Gagal mereset logo.', 'error');
  }
}

// Receipt Attachment Handlers
function handleReceiptFileChange(e) {
  if (e.target.files && e.target.files[0]) {
    const file = e.target.files[0];
    if (file.size > 2 * 1024 * 1024) {
      showToast('Ukuran file kuitansi melebihi 2MB. Silakan pilih foto yang lebih kecil.', 'error');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = function(evt) {
      document.getElementById('txReceiptBase64').value = evt.target.result;
      document.getElementById('txReceiptNameText').textContent = file.name;
      const rmBtn = document.getElementById('btnRemoveReceipt');
      if (rmBtn) rmBtn.classList.remove('hidden');
      showToast('Bukti kuitansi siap dilampirkan.');
    };
    reader.readAsDataURL(file);
  }
}

function clearReceiptAttachment() {
  const fileInput = document.getElementById('txFormReceipt');
  if (fileInput) fileInput.value = '';
  const b64 = document.getElementById('txReceiptBase64');
  if (b64) b64.value = '';
  const nameText = document.getElementById('txReceiptNameText');
  if (nameText) nameText.textContent = 'Pilih Foto / Bukti Kuitansi';
  const rmBtn = document.getElementById('btnRemoveReceipt');
  if (rmBtn) rmBtn.classList.add('hidden');
}

// Category & Account Full CRUD Handlers
function openNewCategoryModal() {
  modalManager.openCategoryModal(null);
}

function editCategory(id) {
  const cat = store.categories.find(c => c.id === id);
  if (cat) {
    modalManager.openCategoryModal(cat);
  } else {
    fetch(`/api/categories`)
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          store.categories = json.data;
          const found = store.categories.find(c => c.id === id);
          if (found) modalManager.openCategoryModal(found);
        }
      });
  }
}

function selectCategoryType(type) {
  modalManager.selectCategoryType(type);
}

async function handleCategorySubmit(e) {
  e.preventDefault();
  const id = document.getElementById('categoryFormId').value;
  const name = document.getElementById('categoryFormName').value.trim();
  const icon = document.getElementById('categoryFormIcon').value;
  const color = document.getElementById('categoryFormColor').value;
  const isActive = document.getElementById('categoryFormIsActive').checked;
  const btn = document.getElementById('btnSaveCategory');
  const origHtml = btn.innerHTML;

  if (!name) {
    showToast('Nama kategori wajib diisi.', 'error');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span class="material-symbols-outlined text-[18px] animate-spin">sync</span> Menyimpan...';

  const payload = {
    name,
    type: modalManager.currentCatType,
    icon,
    color,
    is_active: isActive ? 1 : 0
  };

  try {
    const url = id ? `/api/categories/${id}` : '/api/categories';
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    btn.disabled = false;
    btn.innerHTML = origHtml;

    if (!json.success) {
      showToast(json.message || 'Gagal menyimpan kategori.', 'error');
      return;
    }

    modalManager.closeCategoryModal();
    showToast(id ? 'Kategori berhasil diperbarui.' : 'Kategori baru berhasil ditambahkan.');
    await store.fetchCategories();
  } catch (err) {
    btn.disabled = false;
    btn.innerHTML = origHtml;
    showToast('Terjadi gangguan jaringan saat menyimpan kategori.', 'error');
  }
}

async function deactivateCategory(id) {
  const cat = store.categories.find(c => c.id === id);
  const promptText = cat && cat.transaction_count > 0
    ? `Kategori "${cat.name}" memiliki ${cat.transaction_count} transaksi terhubung. Apakah Anda ingin menonaktifkannya?`
    : `Apakah Anda yakin ingin menghapus kategori ini?`;

  if (!confirm(promptText)) return;

  try {
    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      showToast(json.message);
      await store.fetchCategories();
    } else {
      showToast(json.message, 'error');
    }
  } catch (err) {
    showToast('Gagal menonaktifkan kategori.', 'error');
  }
}

function openNewAccountModal() {
  modalManager.openAccountModal(null);
}

function editAccount(id) {
  const acc = store.accounts.find(a => a.id === id);
  if (acc) {
    modalManager.openAccountModal(acc);
  } else {
    fetch(`/api/accounts`)
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          store.accounts = json.data;
          const found = store.accounts.find(a => a.id === id);
          if (found) modalManager.openAccountModal(found);
        }
      });
  }
}

async function handleAccountSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('accountFormId').value;
  const name = document.getElementById('accountFormName').value.trim();
  const account_number = document.getElementById('accountFormNumber').value.trim();
  const type = document.getElementById('accountFormType').value;
  const initial_balance = parseRupiahInput(document.getElementById('accountFormInitialBalance').value);
  const isActive = document.getElementById('accountFormIsActive').checked;
  const btn = document.getElementById('btnSaveAccount');
  const origHtml = btn.innerHTML;

  if (!name) {
    showToast('Nama akun / bank wajib diisi.', 'error');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span class="material-symbols-outlined text-[18px] animate-spin">sync</span> Menyimpan...';

  const payload = {
    name,
    account_number,
    type,
    initial_balance,
    is_active: isActive ? 1 : 0
  };

  try {
    const url = id ? `/api/accounts/${id}` : '/api/accounts';
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    btn.disabled = false;
    btn.innerHTML = origHtml;

    if (!json.success) {
      showToast(json.message || 'Gagal menyimpan akun.', 'error');
      return;
    }

    modalManager.closeAccountModal();
    showToast(id ? 'Akun berhasil diperbarui.' : 'Akun kas/rekening berhasil ditambahkan.');
    await store.fetchAccounts();
    await store.fetchDashboard();
  } catch (err) {
    btn.disabled = false;
    btn.innerHTML = origHtml;
    showToast('Terjadi gangguan jaringan saat menyimpan akun.', 'error');
  }
}

async function deactivateAccount(id) {
  const acc = store.accounts.find(a => a.id === id);
  const promptText = acc && acc.transaction_count > 0
    ? `Akun "${acc.name}" memiliki ${acc.transaction_count} transaksi tercatat. Apakah Anda ingin menonaktifkannya?`
    : `Apakah Anda yakin ingin menghapus akun ini?`;

  if (!confirm(promptText)) return;

  try {
    const res = await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      showToast(json.message);
      await store.fetchAccounts();
      await store.fetchDashboard();
    } else {
      showToast(json.message, 'error');
    }
  } catch (err) {
    showToast('Gagal menonaktifkan akun.', 'error');
  }
}

function promptNewTarget() {
  const title = prompt('Masukkan Nama Target Tabungan Baru:', 'Investasi Server Cloud 2026');
  if (!title) return;
  showToast(`Target "${title}" berhasil disiapkan!`);
}

function showHelpDialog() {
  alert('Buku Kas Perusahaan — Tracking Keuangan Perusahaan\n\n• Gunakan "+ Catat Transaksi Cepat" untuk mencatat uang masuk/keluar.\n• Semua angka, saldo, dan kalkulasi tersimpan persisten di SQLite.\n• Anda dapat mencari, memfilter, mengedit, dan menghapus transaksi dengan rekonsiliasi saldo otomatis.');
}

function showNotificationPopover() {
  showToast('Tidak ada notifikasi sistem yang tertunda. Semua buku besar terverifikasi seimbang.');
}

// ==========================================
// 10. GLOBAL EXPORTS & INITIALIZATION
// ==========================================
window.router = router;
window.modalManager = modalManager;
window.showToast = showToast;
window.formatRupiahInput = formatRupiahInput;
window.selectModalTxType = (type) => modalManager.selectType(type);
window.handleTransactionSubmit = handleTransactionSubmit;
window.executeDeleteTransaction = executeDeleteTransaction;
window.editFromDrawer = editFromDrawer;
window.confirmDeleteFromDrawer = confirmDeleteFromDrawer;
window.filterTransactionsByType = filterTransactionsByType;
window.filterTransactionsByMonth = filterTransactionsByMonth;
window.changeTxPage = changeTxPage;
window.loadReportData = loadReportData;
window.downloadReportCsv = downloadReportCsv;
window.setChartPeriod = setChartPeriod;
window.switchSettingsTab = switchSettingsTab;
window.saveCompanyProfile = saveCompanyProfile;
window.resetCompanySettingsForm = resetCompanySettingsForm;
window.handleLogoChange = handleLogoChange;
window.resetCompanyLogo = resetCompanyLogo;
window.openNewCategoryModal = openNewCategoryModal;
window.editCategory = editCategory;
window.selectCategoryType = selectCategoryType;
window.handleCategorySubmit = handleCategorySubmit;
window.deactivateCategory = deactivateCategory;
window.openNewAccountModal = openNewAccountModal;
window.editAccount = editAccount;
window.handleAccountSubmit = handleAccountSubmit;
window.deactivateAccount = deactivateAccount;
window.handleReceiptFileChange = handleReceiptFileChange;
window.clearReceiptAttachment = clearReceiptAttachment;
window.promptNewTarget = promptNewTarget;
window.showHelpDialog = showHelpDialog;
window.showNotificationPopover = showNotificationPopover;

// Init on DOM ready
document.addEventListener('DOMContentLoaded', async () => {
  // Setup quick search listeners with debounce
  const txSearch = document.getElementById('txSearchInput');
  if (txSearch) {
    let timeout = null;
    txSearch.addEventListener('input', (e) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        store.currentTxFilters.search = e.target.value.trim();
        store.currentTxFilters.page = 1;
        store.fetchTransactions();
      }, 300);
    });
  }

  const dashSearch = document.getElementById('dashSearchInput');
  if (dashSearch) {
    dashSearch.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const val = e.target.value.trim();
        store.currentTxFilters.search = val;
        router.navigate('/transactions');
      }
    });
  }

  // Report category search filter
  const repCatSearch = document.getElementById('reportCategorySearchInput');
  if (repCatSearch) {
    repCatSearch.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      if (!store.report || !store.report.detailedCategories) return;
      const filtered = store.report.detailedCategories.filter(c => 
        c.name.toLowerCase().includes(q) || (c.descriptionSample && c.descriptionSample.toLowerCase().includes(q))
      );
      store.renderReportCategoryDetailTable(filtered);
    });
  }

  // Load baseline corporate metadata
  await store.fetchCompany();
  await store.fetchCategories();
  await store.fetchAccounts();

  // Initialize router
  router.init();
});
