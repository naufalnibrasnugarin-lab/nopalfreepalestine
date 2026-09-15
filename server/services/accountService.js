const { db } = require('../db');

const accountService = {
  getAll: (includeInactive = false) => {
    let query = `SELECT * FROM accounts`;
    if (!includeInactive) {
      query += ` WHERE is_active = 1`;
    }
    query += ` ORDER BY id ASC`;
    const accounts = db.prepare(query).all();

    // Compute derived balance for each account
    return accounts.map(acc => {
      const stats = db.prepare(`
        SELECT 
          COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0) as total_income,
          COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0) as total_expense,
          COUNT(id) as transaction_count
        FROM transactions
        WHERE account_id = ?
      `).get(acc.id);

      const currentBalance = acc.initial_balance + stats.total_income - stats.total_expense;

      return {
        ...acc,
        current_balance: currentBalance,
        total_income: stats.total_income,
        total_expense: stats.total_expense,
        transaction_count: stats.transaction_count
      };
    });
  },

  getById: (id) => {
    const acc = db.prepare('SELECT * FROM accounts WHERE id = ?').get(id);
    if (!acc) return null;

    const stats = db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0) as total_expense,
        COUNT(id) as transaction_count
      FROM transactions
      WHERE account_id = ?
    `).get(acc.id);

    return {
      ...acc,
      current_balance: acc.initial_balance + stats.total_income - stats.total_expense,
      total_income: stats.total_income,
      total_expense: stats.total_expense,
      transaction_count: stats.transaction_count
    };
  },

  create: (data) => {
    const { name, account_number, type, initial_balance } = data;
    if (!name || !name.trim()) {
      throw new Error('Nama akun kas/bank wajib diisi.');
    }

    const initBal = parseInt(initial_balance, 10) || 0;
    const stmt = db.prepare(`
      INSERT INTO accounts (name, account_number, type, initial_balance, is_active, created_at)
      VALUES (?, ?, ?, ?, 1, datetime('now', 'localtime'))
    `);

    const result = stmt.run(name.trim(), account_number ? account_number.trim() : null, type || 'BANK', initBal);
    return accountService.getById(result.lastInsertRowid);
  },

  update: (id, data) => {
    const existing = db.prepare('SELECT * FROM accounts WHERE id = ?').get(id);
    if (!existing) {
      throw new Error('Akun tidak ditemukan.');
    }

    const name = data.name !== undefined ? data.name.trim() : existing.name;
    const account_number = data.account_number !== undefined ? data.account_number.trim() : existing.account_number;
    const type = data.type !== undefined ? data.type : existing.type;
    const initial_balance = data.initial_balance !== undefined ? parseInt(data.initial_balance, 10) : existing.initial_balance;
    const is_active = data.is_active !== undefined ? (data.is_active ? 1 : 0) : existing.is_active;

    if (!name) {
      throw new Error('Nama akun tidak boleh kosong.');
    }

    db.prepare(`
      UPDATE accounts 
      SET name = ?, account_number = ?, type = ?, initial_balance = ?, is_active = ?
      WHERE id = ?
    `).run(name, account_number, type, initial_balance, is_active, id);

    return accountService.getById(id);
  },

  deactivateOrDelete: (id) => {
    const existing = db.prepare('SELECT * FROM accounts WHERE id = ?').get(id);
    if (!existing) {
      throw new Error('Akun tidak ditemukan.');
    }

    const txCount = db.prepare('SELECT COUNT(*) as count FROM transactions WHERE account_id = ?').get(id).count;
    if (txCount > 0) {
      db.prepare('UPDATE accounts SET is_active = 0 WHERE id = ?').run(id);
      return { action: 'deactivated', message: `Akun dinonaktifkan karena terdapat ${txCount} transaksi terkait.` };
    } else {
      db.prepare('DELETE FROM accounts WHERE id = ?').run(id);
      return { action: 'deleted', message: 'Akun berhasil dihapus.' };
    }
  }
};

module.exports = accountService;
