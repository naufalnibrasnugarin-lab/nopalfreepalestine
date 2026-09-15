const { db } = require('../db');

const categoryService = {
  getAll: (includeInactive = false) => {
    let query = `
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM transactions t WHERE t.category_id = c.id) as transaction_count
      FROM categories c
    `;
    if (!includeInactive) {
      query += ` WHERE c.is_active = 1`;
    }
    query += ` ORDER BY c.type ASC, c.name ASC`;
    return db.prepare(query).all();
  },

  create: (data) => {
    const { name, type, icon, color } = data;
    if (!name || !name.trim()) {
      throw new Error('Nama kategori wajib diisi.');
    }
    if (!type || !['INCOME', 'EXPENSE'].includes(type.toUpperCase())) {
      throw new Error('Tipe kategori harus INCOME atau EXPENSE.');
    }

    const stmt = db.prepare(`
      INSERT INTO categories (name, type, icon, color, is_active, created_at)
      VALUES (?, ?, ?, ?, 1, datetime('now', 'localtime'))
    `);

    const result = stmt.run(
      name.trim(),
      type.toUpperCase(),
      icon || (type.toUpperCase() === 'INCOME' ? 'trending_up' : 'receipt'),
      color || (type.toUpperCase() === 'INCOME' ? '#10B981' : '#EF4444')
    );

    return db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
  },

  update: (id, data) => {
    const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    if (!existing) {
      throw new Error('Kategori tidak ditemukan.');
    }

    const name = data.name !== undefined ? data.name.trim() : existing.name;
    const icon = data.icon !== undefined ? data.icon : existing.icon;
    const color = data.color !== undefined ? data.color : existing.color;
    const is_active = data.is_active !== undefined ? (data.is_active ? 1 : 0) : existing.is_active;

    if (!name) {
      throw new Error('Nama kategori tidak boleh kosong.');
    }

    db.prepare(`
      UPDATE categories 
      SET name = ?, icon = ?, color = ?, is_active = ?
      WHERE id = ?
    `).run(name, icon, color, is_active, id);

    return db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  },

  deactivateOrDelete: (id) => {
    const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    if (!existing) {
      throw new Error('Kategori tidak ditemukan.');
    }

    // Check if transactions exist for this category
    const txCount = db.prepare('SELECT COUNT(*) as count FROM transactions WHERE category_id = ?').get(id).count;
    if (txCount > 0) {
      // Deactivate instead of hard delete to preserve historical integrity
      db.prepare('UPDATE categories SET is_active = 0 WHERE id = ?').run(id);
      return { action: 'deactivated', message: `Kategori dinonaktifkan karena terdapat ${txCount} transaksi terkait.` };
    } else {
      // Can safely delete
      db.prepare('DELETE FROM categories WHERE id = ?').run(id);
      return { action: 'deleted', message: 'Kategori berhasil dihapus.' };
    }
  }
};

module.exports = categoryService;
