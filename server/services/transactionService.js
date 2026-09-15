const { db } = require('../db');

function formatRupiah(amount) {
  return 'Rp ' + Number(amount).toLocaleString('id-ID');
}

function getAccountBalance(accountId) {
  const acc = db.prepare('SELECT initial_balance FROM accounts WHERE id = ?').get(accountId);
  if (!acc) return 0;
  
  const stats = db.prepare(`
    SELECT 
      COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0) as total_income,
      COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0) as total_expense
    FROM transactions 
    WHERE account_id = ?
  `).get(accountId);

  return acc.initial_balance + stats.total_income - stats.total_expense;
}

const transactionService = {
  getAll: (filters = {}) => {
    let query = `
      SELECT 
        t.id,
        t.type,
        t.amount,
        t.description,
        t.transaction_date,
        t.payment_method,
        t.notes,
        t.receipt_url,
        t.created_at,
        t.updated_at,
        c.id as category_id,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        a.id as account_id,
        a.name as account_name,
        a.type as account_type
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      JOIN accounts a ON t.account_id = a.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.type && filters.type !== 'all' && (filters.type === 'INCOME' || filters.type === 'EXPENSE')) {
      query += ` AND t.type = ?`;
      params.push(filters.type);
    }

    if (filters.month) {
      // filters.month format 'YYYY-MM'
      query += ` AND strftime('%Y-%m', t.transaction_date) = ?`;
      params.push(filters.month);
    }

    if (filters.category_id) {
      query += ` AND t.category_id = ?`;
      params.push(Number(filters.category_id));
    }

    if (filters.account_id) {
      query += ` AND t.account_id = ?`;
      params.push(Number(filters.account_id));
    }

    if (filters.search) {
      query += ` AND (t.description LIKE ? OR c.name LIKE ? OR a.name LIKE ? OR CAST(t.id AS TEXT) LIKE ?)`;
      const s = `%${filters.search}%`;
      params.push(s, s, s, s);
    }

    // Order by date descending, then id descending
    query += ` ORDER BY t.transaction_date DESC, t.id DESC`;

    const allItems = db.prepare(query).all(...params);
    const totalCount = allItems.length;

    let items = allItems;
    if (filters.page && filters.limit) {
      const page = Math.max(1, parseInt(filters.page, 10));
      const limit = Math.max(1, parseInt(filters.limit, 10));
      const offset = (page - 1) * limit;
      items = allItems.slice(offset, offset + limit);
    }

    // Also compute month summary for Riwayat Transaksi cards
    let summaryMonth = filters.month || '2026-03';
    const summary = db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0) as total_expense,
        COUNT(CASE WHEN type = 'INCOME' THEN 1 END) as income_count,
        COUNT(CASE WHEN type = 'EXPENSE' THEN 1 END) as expense_count
      FROM transactions
      WHERE strftime('%Y-%m', transaction_date) = ?
    `).get(summaryMonth);

    const netSurplus = summary.total_income - summary.total_expense;
    const totalMutasi = summary.total_income + summary.total_expense;

    return {
      items,
      totalCount,
      summary: {
        totalIncome: summary.total_income,
        totalExpense: summary.total_expense,
        netSurplus,
        totalMutasi,
        incomeCount: summary.income_count,
        expenseCount: summary.expense_count,
        period: summaryMonth
      }
    };
  },

  getById: (id) => {
    const item = db.prepare(`
      SELECT 
        t.*,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        a.name as account_name,
        a.type as account_type
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      JOIN accounts a ON t.account_id = a.id
      WHERE t.id = ?
    `).get(id);

    return item || null;
  },

  create: (data) => {
    let { type, amount, category_id, account_id, description, transaction_date, payment_method, notes, receipt_url } = data;

    // Validation
    if (!type || !['INCOME', 'EXPENSE'].includes(type.toUpperCase())) {
      throw new Error('Tipe transaksi harus Uang Masuk (INCOME) atau Uang Keluar (EXPENSE).');
    }
    type = type.toUpperCase();

    const numAmount = parseInt(amount, 10);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new Error('Nominal transaksi harus lebih besar dari Rp0.');
    }

    if (!category_id) {
      throw new Error('Kategori transaksi wajib dipilih.');
    }
    const cat = db.prepare('SELECT id, name FROM categories WHERE id = ? AND is_active = 1').get(category_id);
    if (!cat) {
      throw new Error('Kategori yang dipilih tidak valid atau sudah tidak aktif.');
    }

    if (!account_id) {
      throw new Error('Akun kas/rekening wajib dipilih.');
    }
    const acc = db.prepare('SELECT id, name FROM accounts WHERE id = ? AND is_active = 1').get(account_id);
    if (!acc) {
      throw new Error('Akun yang dipilih tidak valid atau sudah tidak aktif.');
    }

    if (!description || !description.trim()) {
      throw new Error('Deskripsi transaksi wajib diisi.');
    }

    if (!transaction_date) {
      throw new Error('Tanggal transaksi wajib diisi.');
    }

    // Account balance validation for expense
    if (type === 'EXPENSE') {
      const currentBalance = getAccountBalance(account_id);
      if (currentBalance < numAmount) {
        throw new Error(`Saldo akun ${acc.name} tidak mencukupi. Sisa saldo saat ini: ${formatRupiah(currentBalance)}.`);
      }
    }

    const stmt = db.prepare(`
      INSERT INTO transactions (type, amount, category_id, account_id, description, transaction_date, payment_method, notes, receipt_url, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'), datetime('now', 'localtime'))
    `);

    const result = stmt.run(
      type,
      numAmount,
      category_id,
      account_id,
      description.trim(),
      transaction_date,
      payment_method || 'Transfer Bank',
      notes ? notes.trim() : null,
      receipt_url || null
    );

    return transactionService.getById(result.lastInsertRowid);
  },

  update: (id, data) => {
    const existing = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
    if (!existing) {
      throw new Error('Transaksi tidak ditemukan.');
    }

    let type = (data.type || existing.type).toUpperCase();
    if (!['INCOME', 'EXPENSE'].includes(type)) {
      throw new Error('Tipe transaksi tidak valid.');
    }

    const numAmount = data.amount !== undefined ? parseInt(data.amount, 10) : existing.amount;
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new Error('Nominal transaksi harus lebih besar dari Rp0.');
    }

    const category_id = data.category_id !== undefined ? data.category_id : existing.category_id;
    const account_id = data.account_id !== undefined ? data.account_id : existing.account_id;
    const description = (data.description !== undefined ? data.description : existing.description).trim();
    const transaction_date = data.transaction_date !== undefined ? data.transaction_date : existing.transaction_date;
    const payment_method = data.payment_method !== undefined ? data.payment_method : existing.payment_method;
    const notes = data.notes !== undefined ? (data.notes ? data.notes.trim() : null) : existing.notes;
    const receipt_url = data.receipt_url !== undefined ? data.receipt_url : existing.receipt_url;

    if (!description) {
      throw new Error('Deskripsi transaksi wajib diisi.');
    }

    // Check account balance with reversal of old transaction
    if (type === 'EXPENSE') {
      let simulatedBalance = getAccountBalance(account_id);
      // If same account, reverse existing transaction effect first
      if (existing.account_id === account_id) {
        if (existing.type === 'EXPENSE') {
          simulatedBalance += existing.amount; // give back old expense
        } else {
          simulatedBalance -= existing.amount; // take back old income
        }
      }
      if (simulatedBalance < numAmount) {
        const acc = db.prepare('SELECT name FROM accounts WHERE id = ?').get(account_id);
        throw new Error(`Saldo akun ${acc ? acc.name : ''} tidak mencukupi untuk penyesuaian nominal ini.`);
      }
    }

    const stmt = db.prepare(`
      UPDATE transactions 
      SET type = ?, amount = ?, category_id = ?, account_id = ?, description = ?, transaction_date = ?, payment_method = ?, notes = ?, receipt_url = ?, updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `);

    stmt.run(type, numAmount, category_id, account_id, description, transaction_date, payment_method, notes, receipt_url, id);

    return transactionService.getById(id);
  },

  delete: (id) => {
    const existing = transactionService.getById(id);
    if (!existing) {
      throw new Error('Transaksi tidak ditemukan.');
    }

    db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
    return existing;
  }
};

module.exports = transactionService;
