const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const DB_PATH = path.join(__dirname, '..', 'buku_kas.db');
const db = new DatabaseSync(DB_PATH);

// Enable foreign keys and WAL mode for better concurrency and reliability
db.exec(`
  PRAGMA foreign_keys = ON;
`);

function initDatabase() {
  // 1. Companies table
  db.exec(`
    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      company_code TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      logo_url TEXT,
      currency TEXT NOT NULL DEFAULT 'IDR',
      cfo_name TEXT NOT NULL DEFAULT 'Bambang Sudiro, SE, Ak.',
      cfo_title TEXT NOT NULL DEFAULT 'CFO (Owner)',
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );
  `);

  // 2. Accounts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      account_number TEXT,
      type TEXT NOT NULL, -- BANK, CASH, CREDIT_CARD, PAYROLL
      initial_balance INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );
  `);

  // 3. Categories table
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('INCOME', 'EXPENSE')),
      icon TEXT NOT NULL DEFAULT 'category',
      color TEXT NOT NULL DEFAULT '#3B82F6',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );
  `);

  // 4. Transactions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('INCOME', 'EXPENSE')),
      amount INTEGER NOT NULL CHECK(amount > 0),
      category_id INTEGER NOT NULL REFERENCES categories(id),
      account_id INTEGER NOT NULL REFERENCES accounts(id),
      description TEXT NOT NULL,
      transaction_date TEXT NOT NULL, -- YYYY-MM-DD HH:mm:ss or YYYY-MM-DD
      payment_method TEXT NOT NULL,
      notes TEXT,
      receipt_url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );
  `);

  // 5. Savings Target table
  db.exec(`
    CREATE TABLE IF NOT EXISTS savings_targets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      target_amount INTEGER NOT NULL,
      collected_amount INTEGER NOT NULL,
      deadline_months INTEGER NOT NULL DEFAULT 2,
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );
  `);

  seedDataIfEmpty();
}

function seedDataIfEmpty() {
  const compCount = db.prepare('SELECT COUNT(*) as count FROM companies').get().count;
  if (compCount === 0) {
    const insertComp = db.prepare(`
      INSERT INTO companies (name, company_code, email, phone, address, logo_url, currency, cfo_name, cfo_title)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertComp.run(
      'PT Nusantara Digital Solusi',
      'NDS-8821',
      'finance@nusantaradigital.co.id',
      '021-88997766',
      'Gedung Menara, Jl. Sudirman Kav 21, Jakarta Selatan, DKI Jakarta 12920',
      'https://lh3.googleusercontent.com/aida/AEtjO1UEIIuujRikTSxPj_sA95MmnhEkekPXgrgQnpitzpBlBg2I-ThYRTw_tHH4nnVAoBATox955DAB-fyJ3vkPkkZ23iyVKgcOYlcgX333Vlivj7zv2g4JjIMr9bKmDQjHXcOYW2Wa2UyvStONLiTsBp3l4HeHJ_iYib1dE9TinxH-z_t_PaAmxyZ_5sMjSyoXcHpeQ48nor1hiKRVq2BdSKgK7uE8tTIgYTc6RNNmC3YcEi6M60CsDEbbiVy6',
      'IDR',
      'Bambang Sudiro, SE, Ak.',
      'CFO (Owner)'
    );
  }

  const accCount = db.prepare('SELECT COUNT(*) as count FROM accounts').get().count;
  if (accCount === 0) {
    const insertAcc = db.prepare(`
      INSERT INTO accounts (name, account_number, type, initial_balance, is_active)
      VALUES (?, ?, ?, ?, 1)
    `);
    // Initial balances set so that after applying seed transactions, current balance matches the UI exactly (Rp 128.450.000)
    // Seed Transactions Net = +Rp 24.450.000
    // So initial balance sum = Rp 104.000.000
    insertAcc.run('BCA Giro Korporat', '001-992-8819', 'BANK', 80000000); // Net in tx: +35M +7.8M -1.42M = +41.38M -> ~121.38M
    insertAcc.run('Mandiri Corporate Card', '4111-2299-8812', 'CREDIT_CARD', 10000000); // Net in tx: -3.5M -> 6.5M
    insertAcc.run('Petty Cash Kasir', 'CASH-01', 'CASH', 2000000); // Net in tx: -450k -780k -100k = -1.33M -> 670k
    insertAcc.run('Payroll BNI Terjadwal', '028-119-4401', 'PAYROLL', 12000000); // Net in tx: -12.1M -> -100k or balance adjustment
  }

  const catCount = db.prepare('SELECT COUNT(*) as count FROM categories').get().count;
  if (catCount === 0) {
    const insertCat = db.prepare(`
      INSERT INTO categories (name, type, icon, color, is_active)
      VALUES (?, ?, ?, ?, 1)
    `);
    // Income categories
    insertCat.run('Pemasukan Operasional', 'INCOME', 'domain_verification', '#4edea3'); // ID 1
    insertCat.run('Insentif & Bonus Proyek', 'INCOME', 'stars', '#4edea3'); // ID 2
    insertCat.run('Gaji Pokok & Dividen', 'INCOME', 'laptop_mac', '#4edea3'); // ID 3

    // Expense categories matching UI exactly
    insertCat.run('Payroll & Karyawan', 'EXPENSE', 'payments', '#3B82F6'); // ID 4
    insertCat.run('Software & Cloud IT', 'EXPENSE', 'dns', '#06B6D4'); // ID 5
    insertCat.run('Utilitas Gedung & Kantor', 'EXPENSE', 'bolt', '#8B5CF6'); // ID 6
    insertCat.run('Pantry & Konsumsi Tim', 'EXPENSE', 'restaurant', '#F59E0B'); // ID 7
    insertCat.run('Transportasi Dinas', 'EXPENSE', 'commute', '#EC4899'); // ID 8
  }

  const txCount = db.prepare('SELECT COUNT(*) as count FROM transactions').get().count;
  if (txCount === 0) {
    const insertTx = db.prepare(`
      INSERT INTO transactions (type, amount, category_id, account_id, description, transaction_date, payment_method, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // 8 transactions exactly from the assets
    // 1. Pelunasan Invoice Retainer IT (+35.000.000, BCA Giro Korporat, 25 Mar 2026, 14:20)
    insertTx.run('INCOME', 35000000, 1, 1, 'Pelunasan Invoice Retainer IT', '2026-03-25 14:20:00', 'Transfer Bank', 'Pelunasan termin Q1 PT Multi Karya Persada', '2026-03-25 14:20:00');

    // 2. Kopi & Makan Siang Tim (-450.000, Petty Cash Kasir, 25 Mar 2026, 12:45)
    insertTx.run('EXPENSE', 450000, 7, 3, 'Kopi & Makan Siang Tim', '2026-03-25 12:45:00', 'Petty Cash', 'Meeting Sprint Planning Q1 Divisi Tech', '2026-03-25 12:45:00');

    // 3. Langganan Cloud Server AWS & Google (-3.500.000, Mandiri Corporate Card, 24 Mar 2026, 16:30)
    insertTx.run('EXPENSE', 3500000, 5, 2, 'Langganan Cloud Server AWS & Google', '2026-03-24 16:30:00', 'Kartu Kredit Corporate', 'AWS Cloud compute dan Google Workspace tier Enterprise', '2026-03-24 16:30:00');

    // 4. Tagihan Listrik & WiFi Fiber (-1.420.000, BCA Giro Korporat, 24 Mar 2026, 10:15)
    insertTx.run('EXPENSE', 1420000, 6, 1, 'Tagihan Listrik & WiFi Fiber', '2026-03-24 10:15:00', 'Transfer Bank', 'Utilitas Gedung Menara Kav 21 & Dedicated Fiber 200Mbps', '2026-03-24 10:15:00');

    // 5. Bonus Proyek Mobile App Client (+7.800.000, BCA Giro Korporat, 22 Mar 2026, 15:10)
    insertTx.run('INCOME', 7800000, 2, 1, 'Bonus Proyek Mobile App Client', '2026-03-22 15:10:00', 'Transfer Bank', 'Milestone termin 2 PT Fintek Sejahtera', '2026-03-22 15:10:00');

    // 6. Belanja Bulanan Supermarket & Pantry (-780.000, Petty Cash Kasir, 22 Mar 2026, 11:00)
    insertTx.run('EXPENSE', 780000, 7, 3, 'Belanja Bulanan Supermarket & Pantry', '2026-03-22 11:00:00', 'Petty Cash', 'Stok pantry kantor, snack meeting, kebersihan', '2026-03-22 11:00:00');

    // 7. Gaji Bulanan PT Digital (Batch 1) (-12.100.000, Payroll BNI Terjadwal, 18 Mar 2026, 09:30)
    insertTx.run('EXPENSE', 12100000, 4, 4, 'Gaji Bulanan PT Digital (Batch 1)', '2026-03-18 09:30:00', 'Payroll Otomatis', 'Payroll gaji 8 staf tetap periode Maret 2026', '2026-03-18 09:30:00');

    // 8. Penggantian Transportasi Dinas (-100.000, Petty Cash Kasir, 18 Mar 2026, 08:45)
    insertTx.run('EXPENSE', 100000, 8, 3, 'Penggantian Transportasi Dinas', '2026-03-18 08:45:00', 'Petty Cash', 'Reimbursement Grab taxi kunjungan klien Sudirman', '2026-03-18 08:45:00');
  }

  const savCount = db.prepare('SELECT COUNT(*) as count FROM savings_targets').get().count;
  if (savCount === 0) {
    db.prepare(`
      INSERT INTO savings_targets (title, target_amount, collected_amount, deadline_months)
      VALUES (?, ?, ?, ?)
    `).run('Liburan Impian (Bali & Bajo)', 20000000, 15000000, 2);
  }
}

// Initialize tables and seed data
initDatabase();

module.exports = {
  db,
  initDatabase
};
