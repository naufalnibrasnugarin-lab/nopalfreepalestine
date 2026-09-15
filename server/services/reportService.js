const { db } = require('../db');

const reportService = {
  getMonthlyReport: (month = '2026-03') => {
    // 1. Metric Summary
    const stats = db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0) as total_expense,
        COUNT(CASE WHEN type = 'INCOME' THEN 1 END) as income_count,
        COUNT(CASE WHEN type = 'EXPENSE' THEN 1 END) as expense_count
      FROM transactions
      WHERE strftime('%Y-%m', transaction_date) = ?
    `).get(month);

    const totalIncome = stats.total_income;
    const totalExpense = stats.total_expense;
    const netSurplus = totalIncome - totalExpense;

    // 2. Expense breakdown by Category
    const categoryRows = db.prepare(`
      SELECT 
        c.id,
        c.name,
        c.icon,
        c.color,
        COALESCE(SUM(t.amount), 0) as total_amount,
        COUNT(t.id) as tx_count,
        GROUP_CONCAT(t.description, ' • ') as sample_descriptions
      FROM categories c
      JOIN transactions t ON t.category_id = c.id
      WHERE t.type = 'EXPENSE' AND strftime('%Y-%m', t.transaction_date) = ?
      GROUP BY c.id
      ORDER BY total_amount DESC
    `).all(month);

    // Color palette for donut slices matching design:
    // 1. Blue #3B82F6, 2. Cyan #06B6D4, 3. Purple #8B5CF6, 4. Amber #F59E0B, 5. Pink #EC4899
    const defaultColors = ['#3B82F6', '#06B6D4', '#8B5CF6', '#F59E0B', '#EC4899', '#10B981', '#6366F1'];

    // Calculate SVG circle circumference: Radius = 75, Circumference = 2 * PI * 75 ~= 471.24
    const circumference = 471.24;
    let accumulatedOffset = 0;

    const breakdown = categoryRows.map((cat, index) => {
      const percentage = totalExpense > 0 ? (cat.total_amount / totalExpense) * 100 : 0;
      const formattedPercent = Math.round(percentage * 10) / 10;
      const dashLength = (percentage / 100) * circumference;
      const spaceLength = circumference - dashLength;
      const currentOffset = accumulatedOffset;
      accumulatedOffset -= dashLength;

      const color = cat.color || defaultColors[index % defaultColors.length];

      // Find primary account used for this category
      const mainAcc = db.prepare(`
        SELECT a.name 
        FROM transactions t
        JOIN accounts a ON t.account_id = a.id
        WHERE t.category_id = ? AND strftime('%Y-%m', t.transaction_date) = ?
        LIMIT 1
      `).get(cat.id, month);

      return {
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        color: color,
        amount: cat.total_amount,
        percentage: formattedPercent,
        txCount: cat.tx_count,
        descriptionSample: cat.sample_descriptions ? cat.sample_descriptions.split(' • ').slice(0, 2).join(' • ') : '',
        accountName: mainAcc ? mainAcc.name : 'Kas Korporasi',
        dashArray: `${dashLength.toFixed(1)} ${spaceLength.toFixed(1)}`,
        dashOffset: currentOffset.toFixed(1)
      };
    });

    return {
      period: month,
      metrics: {
        totalIncome,
        totalExpense,
        netSurplus,
        incomeCount: stats.income_count,
        expenseCount: stats.expense_count
      },
      donut: {
        circumference,
        totalExpenseFormatted: 'Rp ' + (totalExpense >= 1000000 ? (totalExpense / 1000000).toFixed(2) + 'M' : totalExpense.toLocaleString('id-ID')),
        categories: breakdown
      },
      detailedCategories: breakdown
    };
  },

  exportCsv: (month) => {
    let query = `
      SELECT 
        t.id,
        t.transaction_date,
        t.type,
        t.description,
        c.name as category,
        a.name as account,
        t.payment_method,
        t.amount,
        t.notes
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      JOIN accounts a ON t.account_id = a.id
    `;
    const params = [];
    if (month) {
      query += ` WHERE strftime('%Y-%m', t.transaction_date) = ?`;
      params.push(month);
    }
    query += ` ORDER BY t.transaction_date DESC, t.id DESC`;

    const rows = db.prepare(query).all(...params);

    const headers = ['ID', 'Tanggal', 'Tipe', 'Deskripsi', 'Kategori', 'Akun', 'Metode Pembayaran', 'Nominal (Rp)', 'Catatan'];
    const csvLines = [headers.join(',')];

    rows.forEach(r => {
      const line = [
        r.id,
        `"${r.transaction_date}"`,
        r.type,
        `"${(r.description || '').replace(/"/g, '""')}"`,
        `"${(r.category || '').replace(/"/g, '""')}"`,
        `"${(r.account || '').replace(/"/g, '""')}"`,
        `"${(r.payment_method || '').replace(/"/g, '""')}"`,
        r.amount,
        `"${(r.notes || '').replace(/"/g, '""')}"`
      ];
      csvLines.push(line.join(','));
    });

    return csvLines.join('\r\n');
  }
};

module.exports = reportService;
