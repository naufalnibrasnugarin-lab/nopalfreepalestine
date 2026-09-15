const express = require('express');
const cors = require('cors');
const path = require('node:path');

const transactionService = require('./services/transactionService');
const dashboardService = require('./services/dashboardService');
const reportService = require('./services/reportService');
const companyService = require('./services/companyService');
const categoryService = require('./services/categoryService');
const accountService = require('./services/accountService');
require('./db'); // Ensure DB is initialized

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Allows base64 logo uploads
app.use(express.urlencoded({ extended: true }));

// Serve static assets from public/
app.use(express.static(path.join(__dirname, '..', 'public')));

// ==========================================
// 1. DASHBOARD API
// ==========================================
app.get('/api/dashboard', (req, res) => {
  try {
    const { period, month } = req.query;
    const data = dashboardService.getOverview(period || '30d', month || '2026-03');
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 2. TRANSACTIONS API
// ==========================================
app.get('/api/transactions', (req, res) => {
  try {
    const filters = {
      search: req.query.search,
      type: req.query.type,
      month: req.query.month,
      category_id: req.query.category_id,
      account_id: req.query.account_id,
      page: req.query.page,
      limit: req.query.limit
    };
    const result = transactionService.getAll(filters);
    res.json({ success: true, data: result.items, summary: result.summary, totalCount: result.totalCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/transactions/:id', (req, res) => {
  try {
    const item = transactionService.getById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan.' });
    }
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/transactions', (req, res) => {
  try {
    const item = transactionService.create(req.body);
    res.status(201).json({ success: true, message: 'Transaksi berhasil ditambahkan.', data: item });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.put('/api/transactions/:id', (req, res) => {
  try {
    const item = transactionService.update(req.params.id, req.body);
    res.json({ success: true, message: 'Transaksi berhasil diperbarui.', data: item });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.delete('/api/transactions/:id', (req, res) => {
  try {
    const item = transactionService.delete(req.params.id);
    res.json({ success: true, message: 'Transaksi berhasil dihapus.', data: item });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ==========================================
// 3. REPORTS API
// ==========================================
app.get('/api/reports', (req, res) => {
  try {
    const { month } = req.query;
    const report = reportService.getMonthlyReport(month || '2026-03');
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/reports/export', (req, res) => {
  try {
    const { month } = req.query;
    const csvContent = reportService.exportCsv(month);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="laporan-kas-${month || 'semua'}.csv"`);
    res.send(csvContent);
  } catch (error) {
    res.status(500).send('Gagal mengekspor laporan: ' + error.message);
  }
});

// ==========================================
// 4. COMPANY PROFILE API
// ==========================================
app.get('/api/company', (req, res) => {
  try {
    const profile = companyService.getProfile();
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/company', (req, res) => {
  try {
    const profile = companyService.updateProfile(req.body);
    res.json({ success: true, message: 'Profil PT Nusantara Digital Solusi berhasil diperbarui!', data: profile });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.post('/api/company/reset-logo', (req, res) => {
  try {
    const profile = companyService.resetLogo();
    res.json({ success: true, message: 'Logo perusahaan diatur ulang ke default.', data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 5. CATEGORIES API
// ==========================================
app.get('/api/categories', (req, res) => {
  try {
    const includeInactive = req.query.include_inactive === 'true';
    const categories = categoryService.getAll(includeInactive);
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/categories', (req, res) => {
  try {
    const cat = categoryService.create(req.body);
    res.status(201).json({ success: true, message: 'Kategori berhasil ditambahkan.', data: cat });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.put('/api/categories/:id', (req, res) => {
  try {
    const cat = categoryService.update(req.params.id, req.body);
    res.json({ success: true, message: 'Kategori berhasil diperbarui.', data: cat });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.delete('/api/categories/:id', (req, res) => {
  try {
    const result = categoryService.deactivateOrDelete(req.params.id);
    res.json({ success: true, message: result.message, action: result.action });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ==========================================
// 6. ACCOUNTS API
// ==========================================
app.get('/api/accounts', (req, res) => {
  try {
    const includeInactive = req.query.include_inactive === 'true';
    const accounts = accountService.getAll(includeInactive);
    res.json({ success: true, data: accounts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/accounts', (req, res) => {
  try {
    const acc = accountService.create(req.body);
    res.status(201).json({ success: true, message: 'Akun kas/rekening berhasil ditambahkan.', data: acc });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.put('/api/accounts/:id', (req, res) => {
  try {
    const acc = accountService.update(req.params.id, req.body);
    res.json({ success: true, message: 'Akun berhasil diperbarui.', data: acc });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.delete('/api/accounts/:id', (req, res) => {
  try {
    const result = accountService.deactivateOrDelete(req.params.id);
    res.json({ success: true, message: result.message, action: result.action });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ==========================================
// 7. SPA ROUTING FALLBACK
// ==========================================
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`[Buku Kas Perusahaan] Server running at http://localhost:${PORT}`);
});
