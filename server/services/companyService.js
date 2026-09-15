const { db } = require('../db');

const companyService = {
  getProfile: () => {
    const company = db.prepare('SELECT * FROM companies ORDER BY id ASC LIMIT 1').get();
    return company;
  },

  updateProfile: (data) => {
    const { name, company_code, email, phone, address, logo_url } = data;

    if (!name || !name.trim()) {
      throw new Error('Nama resmi perusahaan wajib diisi.');
    }
    if (!company_code || !company_code.trim()) {
      throw new Error('ID Perusahaan / NPWP wajib diisi.');
    }
    if (!email || !email.trim()) {
      throw new Error('Email resmi perusahaan wajib diisi.');
    }
    if (!phone || !phone.trim()) {
      throw new Error('Nomor telepon kantor wajib diisi.');
    }
    if (!address || !address.trim()) {
      throw new Error('Alamat kantor wajib diisi.');
    }

    const existing = companyService.getProfile();
    if (!existing) {
      db.prepare(`
        INSERT INTO companies (name, company_code, email, phone, address, logo_url, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
      `).run(name.trim(), company_code.trim(), email.trim(), phone.trim(), address.trim(), logo_url || null);
    } else {
      db.prepare(`
        UPDATE companies 
        SET name = ?, company_code = ?, email = ?, phone = ?, address = ?, logo_url = COALESCE(?, logo_url), updated_at = datetime('now', 'localtime')
        WHERE id = ?
      `).run(name.trim(), company_code.trim(), email.trim(), phone.trim(), address.trim(), logo_url !== undefined ? logo_url : existing.logo_url, existing.id);
    }

    return companyService.getProfile();
  },

  resetLogo: () => {
    const existing = companyService.getProfile();
    if (existing) {
      db.prepare(`
        UPDATE companies 
        SET logo_url = NULL, updated_at = datetime('now', 'localtime')
        WHERE id = ?
      `).run(existing.id);
    }
    return companyService.getProfile();
  }
};

module.exports = companyService;
