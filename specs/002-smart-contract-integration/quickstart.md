# Quickstart: Validasi Integrasi Besu via Backend Gateway

**Branch**: `002-smart-contract-integration` | **Tanggal**: 2026-03-20
**Tujuan**: Menjalankan dan memverifikasi alur tokenisasi/update/verifikasi status melalui backend gateway dengan fallback deterministik.

## Prasyarat

- Node.js 20+
- Python 3.11 (untuk ai-engine)
- Local Besu QBFT atau endpoint Besu yang dapat diakses
- PowerShell (Windows)

## 1. Jalankan Service Dasar

1. Backend API:

```powershell
Set-Location "backend-api"
npm install
npm run dev
```

2. AI engine (opsional untuk validasi boundary, tidak dipakai call DLT):

```powershell
Set-Location "ai-engine"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## 2. Health Checks

```powershell
Invoke-RestMethod "http://localhost:3000/api/v1/health"
Invoke-RestMethod "http://localhost:3000/api/v1/mock/health"
```

Ekspektasi:
- Endpoint health backend dan mock aktif.
- Correlation ID dikembalikan pada response header.

## 3. Validasi Alur Tokenisasi (Besu Up)

Kirim request tokenisasi melalui backend gateway contract (lihat `contracts/backend-gateway-contract.yaml`).

Ekspektasi:
- Response sukses berisi `status=SUCCESS`.
- Ada `txReference` non-null.
- `correlationId` konsisten request-response-audit.

## 4. Validasi Update Status dan Verifikasi (Besu Up)

1. Update status token oleh Bank Mitra.
2. Verifikasi status token yang sama.

Ekspektasi:
- Status backend dan on-chain konsisten.
- Tidak ada direct AI->DLT call pada log/flow.

## 5. Validasi Fallback Deterministik (Besu Down)

Simulasikan Besu unavailable (matikan endpoint atau gunakan URL invalid), lalu ulangi 3 request operasi DLT yang sama.

Ekspektasi:
- Ketiga request menghasilkan `errorCode`, `http status`, dan `payload shape` identik.
- Audit record tetap terbentuk untuk semua request fallback.

## 6. Validasi Kriteria Stabilitas PoC

Jalankan skenario end-to-end minimal 3 kali beruntun saat Besu up.

Checklist kelulusan:
- NFR-001: 3x run sukses beruntun.
- NFR-002: fallback deterministik 100%.
- NFR-003: semua transaksi dapat ditelusuri dengan correlation ID.
- NFR-004: latency <= 6 detik pada 95% request.

## 7. Evidence Pack untuk Review Konstitusi

Simpan artefak berikut untuk review `/speckit.tasks` dan PR:
- Cuplikan request-response sukses (mint/update/verify)
- Cuplikan request-response fallback deterministik
- Audit trace berdasarkan satu `correlationId`
- Catatan boundary check: tidak ada AI->DLT direct call