# Blueprint Aplikasi UMKM
# Sistem Keuangan (Pemasukan & Pengeluaran) + CRM

---

# 1. Overview

## Nama Project
**UMKM Finance CRM**

## Tujuan

Membantu pelaku UMKM untuk:

- Mencatat pemasukan
- Mencatat pengeluaran
- Menghitung laba/rugi
- Mengelola pelanggan
- Mengelola supplier
- Melihat laporan keuangan
- Mengelola piutang & hutang
- Dashboard bisnis secara real-time

---

# 2. Tech Stack

## Frontend

- React.js
- React Router
- React Query / TanStack Query
- Axios
- TailwindCSS
- Shadcn UI
- Recharts
- React Hook Form
- Zod

---

## Backend

- Node.js
- Express.js
- JWT Authentication
- Bcrypt
- Multer (upload file)
- Prisma ORM
- Cron Job (laporan otomatis)

---

## Database

PostgreSQL (Supabase)

Fitur Supabase:

- PostgreSQL
- Authentication (optional)
- Storage
- Row Level Security
- Realtime

---

# 3. Arsitektur

```
React Frontend
        │
        │ REST API
        ▼
Node.js + Express
        │
        ▼
 Prisma ORM
        │
        ▼
 PostgreSQL (Supabase)
```

---

# 4. Struktur Folder

## Frontend

```
src/
│
├── assets/
├── components/
│      ├── ui/
│      ├── dashboard/
│      ├── customer/
│      ├── finance/
│      ├── report/
│
├── layouts/
│
├── pages/
│      ├── Login
│      ├── Dashboard
│      ├── Income
│      ├── Expense
│      ├── Customer
│      ├── Supplier
│      ├── Invoice
│      ├── Report
│      ├── Settings
│
├── hooks/
├── services/
├── api/
├── context/
├── routes/
├── utils/
└── types/
```

---

## Backend

```
src/

├── config/
├── controllers/
├── middleware/
├── routes/
├── services/
├── repositories/
├── prisma/
├── validations/
├── helpers/
├── cron/
├── uploads/
├── utils/
└── app.js
```

---

# 5. Modul Aplikasi

## A. Authentication

Fitur

- Login
- Logout
- Register
- Forgot Password
- Refresh Token
- JWT
- Role Management

Role

- Owner
- Admin
- Staff Kasir

---

## B. Dashboard

Widget

- Total Pendapatan
- Total Pengeluaran
- Laba Bersih
- Cash Flow
- Piutang
- Hutang
- Jumlah Customer
- Jumlah Supplier

Chart

- Income per bulan
- Expense per bulan
- Profit
- Customer Growth

---

## C. Master Customer (CRM)

Data

- Nama
- No HP
- Email
- Alamat
- Kota
- Tanggal Bergabung
- Catatan
- Status

Fitur

- CRUD
- Riwayat transaksi
- Total pembelian
- Customer ranking
- Reminder follow up

---

## D. Master Supplier

Data

- Nama
- Kontak
- Alamat
- Email
- No HP
- Catatan

Fitur

- CRUD
- Histori pembelian
- Hutang supplier

---

## E. Income Management

Data

- Tanggal
- Invoice
- Customer
- Kategori
- Nominal
- Metode Pembayaran
- Catatan

Fitur

- CRUD
- Filter
- Search
- Export

---

## F. Expense Management

Kategori

- Gaji
- Operasional
- Listrik
- Air
- Internet
- Transportasi
- Marketing
- Pajak
- Lainnya

Fitur

- CRUD
- Upload Bukti
- Approval

---

## G. Invoice

Data

- Nomor Invoice
- Customer
- Item
- Qty
- Harga
- Diskon
- Pajak
- Total

Status

- Draft
- Unpaid
- Paid
- Cancel

Fitur

- Generate PDF
- Print
- WhatsApp Share
- Email

---

## H. Piutang

Data

- Customer
- Invoice
- Total
- Dibayar
- Sisa
- Jatuh Tempo

Reminder

- H-7
- H-3
- H-1

---

## I. Hutang

Supplier

Status

- Belum Bayar
- Sebagian
- Lunas

---

## J. Cash Flow

Menampilkan

Masuk

↓

Keluar

↓

Saldo

Realtime

---

## K. Report

Laporan

- Laporan Pendapatan
- Laporan Pengeluaran
- Cash Flow
- Profit Loss
- Customer Report
- Supplier Report
- Piutang
- Hutang

Export

- PDF
- Excel
- CSV

---

## L. Setting

- Profil Usaha
- Logo
- Pajak
- Nomor Invoice
- Backup
- User Management

---

# 6. Database Design

## users

| Field | Type |
|--------|------|
| id | uuid |
| name | text |
| email | text |
| password | text |
| role | text |
| created_at | timestamp |

---

## customers

| Field | Type |
|--------|------|
| id | uuid |
| name | text |
| phone | text |
| email | text |
| address | text |
| notes | text |
| created_at | timestamp |

---

## suppliers

| Field | Type |
|--------|------|
| id | uuid |
| name | text |
| phone | text |
| email | text |
| address | text |

---

## categories

| Field | Type |
|--------|------|
| id | uuid |
| name | text |
| type | income/expense |

---

## incomes

| Field | Type |
|--------|------|
| id | uuid |
| customer_id | uuid |
| category_id | uuid |
| amount | decimal |
| payment_method | text |
| note | text |
| transaction_date | date |

---

## expenses

| Field | Type |
|--------|------|
| id | uuid |
| supplier_id | uuid |
| category_id | uuid |
| amount | decimal |
| note | text |
| receipt | text |
| transaction_date | date |

---

## invoices

| Field | Type |
|--------|------|
| id | uuid |
| invoice_number | text |
| customer_id | uuid |
| total | decimal |
| discount | decimal |
| tax | decimal |
| status | text |
| due_date | date |

---

## invoice_items

| Field | Type |
|--------|------|
| id | uuid |
| invoice_id | uuid |
| product_name | text |
| qty | integer |
| price | decimal |
| subtotal | decimal |

---

## receivables

| Field | Type |
|--------|------|
| id | uuid |
| invoice_id | uuid |
| remaining | decimal |
| due_date | date |

---

## payables

| Field | Type |
|--------|------|
| id | uuid |
| supplier_id | uuid |
| amount | decimal |
| due_date | date |

---

# 7. API Design

## Auth

```
POST   /auth/login
POST   /auth/register
POST   /auth/logout
POST   /auth/refresh
```

---

## Customer

```
GET    /customers
GET    /customers/:id
POST   /customers
PUT    /customers/:id
DELETE /customers/:id
```

---

## Supplier

```
GET    /suppliers
POST   /suppliers
PUT    /suppliers/:id
DELETE /suppliers/:id
```

---

## Income

```
GET    /income
POST   /income
PUT    /income/:id
DELETE /income/:id
```

---

## Expense

```
GET    /expense
POST   /expense
PUT    /expense/:id
DELETE /expense/:id
```

---

## Invoice

```
GET    /invoice
POST   /invoice
PUT    /invoice/:id
DELETE /invoice/:id
```

---

## Dashboard

```
GET /dashboard/summary
GET /dashboard/chart
GET /dashboard/cashflow
```

---

# 8. Dashboard UI

```
-----------------------------------------------------

Selamat Datang

-----------------------------------------------------

Pendapatan
Rp 50.000.000

Pengeluaran
Rp 25.000.000

Profit
Rp 25.000.000

Saldo
Rp 100.000.000

-----------------------------------------------------

Grafik Pendapatan

███████

-----------------------------------------------------

Grafik Pengeluaran

███████

-----------------------------------------------------

Top Customer

1.
2.
3.

-----------------------------------------------------

Invoice Belum Dibayar

•
•
•

-----------------------------------------------------
```

---

# 9. Security

- JWT Authentication
- Refresh Token
- Password Hashing (bcrypt)
- Helmet
- CORS
- Rate Limiter
- SQL Injection Protection (Prisma ORM)
- XSS Protection
- Audit Log
- Role Based Access Control (RBAC)

---

# 10. Deployment

Frontend

- Vercel

Backend

- Railway / Render

Database

- Supabase PostgreSQL

Storage

- Supabase Storage

---

# 11. Future Roadmap

## Version 2

- Multi Cabang
- Multi Gudang
- POS Kasir
- Inventory
- Barcode Scanner
- WhatsApp API
- Email Reminder
- AI Financial Insight
- Forecast Penjualan
- OCR Struk
- Mobile Apps
- Approval Workflow
- QRIS Payment
- Midtrans/Xendit Integration
- Google Calendar Reminder

---

# 12. Estimasi Timeline

| Sprint | Modul | Durasi |
|---------|--------|---------|
| Sprint 1 | Authentication + User | 1 minggu |
| Sprint 2 | Customer + Supplier | 1 minggu |
| Sprint 3 | Income + Expense | 2 minggu |
| Sprint 4 | Invoice + Piutang | 2 minggu |
| Sprint 5 | Dashboard + Report | 2 minggu |
| Sprint 6 | Testing + Deployment | 1 minggu |

**Total Estimasi:** 9 Minggu

---

# 13. Pengembangan Selanjutnya

Agar aplikasi dapat bersaing dengan produk seperti BukuKas, Jurnal, atau Accurate Online, disarankan menambahkan modul berikut:

- Multi-tenant (Satu aplikasi untuk banyak UMKM)
- Pengelolaan Produk & Inventaris
- Pembelian (Purchase Order)
- Penjualan (Sales Order)
- Manajemen Stok (Stock In/Out, Stock Opname)
- Buku Besar (General Ledger)
- Chart of Accounts (COA)
- Jurnal Otomatis
- Rekonsiliasi Bank
- Manajemen Pajak (PPN/PPh)
- Target Penjualan & KPI
- CRM Pipeline (Lead → Prospect → Customer)
- Aktivitas Follow-up (Telepon, WhatsApp, Email)
- Loyalty Program & Poin Pelanggan
- Integrasi Payment Gateway (Midtrans, Xendit)
- Integrasi WhatsApp Business API
- Notifikasi Push dan Email
- Audit Log Lengkap
- Multi Bahasa (Indonesia & Inggris)
- Multi Mata Uang
- API Publik untuk Integrasi Pihak Ketiga
- Backup & Restore Otomatis
- Dashboard Analitik dengan AI untuk prediksi arus kas, rekomendasi penghematan, dan analisis perilaku pelanggan.

---

# 14. Multi Currency (Konversi Mata Uang)

## Tujuan

Memungkinkan seluruh transaksi disimpan dalam mata uang asli, kemudian dikonversi secara otomatis ke mata uang dasar (Base Currency) perusahaan.

Default Base Currency:

- IDR (Rupiah)

Contoh mata uang yang didukung:

| Kode | Mata Uang | Simbol |
|------|-----------|---------|
| IDR | Indonesian Rupiah | Rp |
| USD | US Dollar | $ |
| EUR | Euro | € |
| SGD | Singapore Dollar | S$ |
| MYR | Malaysian Ringgit | RM |
| JPY | Japanese Yen | ¥ |
| CNY | Chinese Yuan | ¥ |
| KRW | Korean Won | ₩ |
| GBP | British Pound | £ |
| AUD | Australian Dollar | A$ |
| CAD | Canadian Dollar | C$ |
| THB | Thai Baht | ฿ |
| PHP | Philippine Peso | ₱ |
| VND | Vietnamese Dong | ₫ |
| HKD | Hong Kong Dollar | HK$ |

---

## Fitur

- Base Currency Perusahaan
- Pilih Mata Uang Saat Transaksi
- Kurs Harian Otomatis
- Kurs Manual
- Riwayat Kurs
- Recalculate Laporan
- Konversi Real-time
- Menampilkan Nilai Asli & Nilai Konversi

---

## Contoh Transaksi

Invoice

```
Nominal Asli

USD 250

Kurs Hari Ini

1 USD = Rp16.350

Nilai IDR

Rp4.087.500
```

Disimpan di database:

```
Original Amount : 250
Currency : USD
Exchange Rate : 16350
Converted Amount : 4087500
```

---

# Database Tambahan

## currencies

| Field | Type |
|--------|------|
| id | uuid |
| code | varchar(5) |
| name | text |
| symbol | text |
| is_active | boolean |
| created_at | timestamp |

---

## exchange_rates

| Field | Type |
|--------|------|
| id | uuid |
| currency_code | varchar(5) |
| exchange_rate | decimal(18,6) |
| source | text |
| effective_date | date |
| created_at | timestamp |

---

# Update Tabel Income

Tambahkan field:

| Field | Type |
|--------|------|
| currency_code | varchar(5) |
| original_amount | decimal |
| exchange_rate | decimal |
| converted_amount | decimal |

---

# Update Tabel Expense

Tambahkan field:

| Field | Type |
|--------|------|
| currency_code | varchar(5) |
| original_amount | decimal |
| exchange_rate | decimal |
| converted_amount | decimal |

---

# Update Tabel Invoice

Tambahkan field:

| Field | Type |
|--------|------|
| currency_code | varchar(5) |
| exchange_rate | decimal |
| subtotal_original | decimal |
| total_original | decimal |
| total_idr | decimal |

---

# API Currency

```
GET     /currencies
GET     /exchange-rates
GET     /exchange-rates/latest
POST    /exchange-rates
PUT     /exchange-rates/:id
DELETE  /exchange-rates/:id
```

---

# Integrasi API Kurs

Aplikasi dapat mengambil kurs otomatis setiap hari melalui scheduler (Cron Job).

Pilihan penyedia kurs:

- Bank Indonesia (BI)
- Open Exchange Rates
- ExchangeRate.host
- Frankfurter API
- CurrencyFreaks
- Fixer.io

Cron Job

```
Setiap Hari

07:00 WIB

↓

Ambil Kurs Terbaru

↓

Simpan ke Database

↓

Gunakan untuk seluruh transaksi hari tersebut
```

---

# Tampilan Input Transaksi

```
========================================

Nominal

[ 500 ]

Mata Uang

[ USD ▼ ]

Kurs Hari Ini

Rp16.350

Nilai Rupiah

Rp8.175.000

========================================
```

---

# Dashboard

Widget Baru

• Total Saldo IDR

• Total Saldo USD

• Total Saldo EUR

• Total Saldo SGD

• Nilai Seluruh Aset (IDR)

• Grafik Pergerakan Kurs

---

# Laporan

Seluruh laporan dapat ditampilkan berdasarkan:

- Mata Uang Asli
- Mata Uang Dasar (IDR)
- Semua Mata Uang
- Per Negara
- Per Kurs Harian

---

# Setting

Menu

Finance Settings

↓

Base Currency

↓

IDR

↓

Auto Update Exchange Rate

ON / OFF

↓

Source Exchange Rate

- Bank Indonesia
- Frankfurter
- ExchangeRate.host
- Manual

↓

Decimal Precision

2 / 4 / 6 Digit

---

# Best Practice

Untuk menjaga integritas data keuangan:

- Simpan **nilai asli transaksi** (`original_amount`).
- Simpan **kode mata uang** (`currency_code`).
- Simpan **kurs saat transaksi** (`exchange_rate`) agar laporan historis tidak berubah jika kurs terbaru berbeda.
- Simpan **nilai hasil konversi** (`converted_amount`) sebagai dasar laporan keuangan.
- Gunakan tipe data `DECIMAL(18,6)` untuk nilai kurs dan `DECIMAL(18,2)` untuk nominal transaksi agar presisi tetap terjaga.