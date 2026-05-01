# Quickstart: Enhanced Compliance & Governance

**Branch**: `003-enhanced-compliance-governance` | **Tanggal**: 2026-05-01
**Tujuan**: Memverifikasi evidence bundle, governance summary, dan release readiness checklist untuk GARUDA-LINK.
**Changelog**: Lihat [CHANGELOG.md](../../CHANGELOG.md) untuk ringkasan rilis terbaru.

## Prasyarat

- Backend API sudah berjalan di `http://localhost:3000`
- Node.js 20+ dan `pnpm` tersedia
- Feature 002 sudah memiliki audit trace aktif

## 1. Jalankan Service

```powershell
Set-Location "backend-api"
pnpm install
pnpm run dev
```

## 2. Verifikasi Governance Evidence

```powershell
Set-Location "backend-api"
.\scripts\verify-governance-evidence.ps1
```

Ekspektasi:
- Evidence bundle terambil berdasarkan `correlationId`
- Payload deterministik saat diambil ulang
- Required fields lengkap

## 3. Verifikasi Governance Summary

```powershell
Set-Location "backend-api"
.\scripts\verify-governance-summary.ps1
```

Ekspektasi:
- Summary harian dan release berhasil dibentuk
- Domain `AUDIT_TRACE`, `FALLBACK_DETERMINISM`, `DATA_PROTECTION`, `SECURITY_READINESS` tersedia
- Drill-down refs ada untuk domain `warn/fail`

## 4. Verifikasi Release Readiness

```powershell
Invoke-RestMethod "http://localhost:3000/api/v1/governance/release-readiness?releaseCandidate=v0.2.0-rc1"
```

Ekspektasi:
- `overallDecision` bernilai `GO`, `CONDITIONAL_GO`, atau `NO_GO`
- Setiap item memiliki `evidenceRef`
- Override traceable jika digunakan

## Evidence Pack

Simpan artefak berikut untuk review internal:
- Output `verify-governance-evidence.ps1`
- Output `verify-governance-summary.ps1`
- Response `release-readiness`
- Satu `correlationId` lengkap untuk jejak audit dan evidence bundle
