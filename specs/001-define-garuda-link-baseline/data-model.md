# Data Model: GARUDA-LINK Baseline PoC

**Branch**: `001-define-garuda-link-baseline` | **Tanggal**: 2026-03-17  
**Referensi Spec**: FR-001..009, HA-001..003, Key Entities (spec.md)  
**Database**: PostgreSQL 16 + pgcrypto (AES-256 untuk kolom PII)

---

## Entitas dan Relasi

```
FarmerProfile ──< HarvestAsset ──< FinancingApplication
                        │                   │
                        │                   └──< IASCTrace
                        │
                        └── (token_id) ──→ HarvestTokenRegistry [on-chain]

CommodityPrice ──< PriceForecast

FleetRoute (mandiri per request, dikaitkan ke HarvestAsset opsional)

AuditTrail (lintas semua entitas via correlation_id)
ComplianceRecord (summary per periode audit)
```

---

## 1. FarmerProfile (Profil Petani)

**Referensi**: Key Entities spec.md, CR-002 (enkripsi PII), CR-004 (least privilege)

```sql
CREATE TABLE farmer_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- PII dienkripsi AES-256 via pgcrypto (CR-002)
  nik_encrypted   BYTEA NOT NULL,           -- pgp_sym_encrypt(nik_value, $PII_KEY)
  name_encrypted  BYTEA NOT NULL,           -- pgp_sym_encrypt(full_name, $PII_KEY)
  -- Non-PII fields
  region_code     VARCHAR(10) NOT NULL,     -- Kode wilayah (misal: 'JKT', 'MKS', 'SBY')
  commodity_types VARCHAR(50)[] NOT NULL,   -- ['CABAI', 'BAWANG_MERAH', 'JAGUNG']
  data_consent_ts TIMESTAMPTZ NOT NULL,     -- Timestamp persetujuan data (UU PDP pasal 20)
  status          VARCHAR(20) NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Validasi**:
- `nik_encrypted`: wajib; plaintext NIK harus 16 digit sebelum enkripsi
- `region_code`: harus ada di tabel `regions` (ENUM FK)
- `commodity_types`: minimal 1, maksimal 5
- `data_consent_ts`: tidak boleh di masa depan

**Catatan Keamanan**: Akses dekripsi PII hanya via stored procedure `get_farmer_pii(farmer_id, $PII_KEY)` dengan logging otomatis ke `audit_trail`. Kolom plaintext TIDAK ADA di schema.

---

## 2. CommodityPrice (Data Harga Komoditas)

**Referensi**: FR-001, AC-PET-01, Assumptions & Mock-API Policy

```sql
CREATE TABLE commodity_prices (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commodity_code   VARCHAR(20) NOT NULL,    -- 'CABAI_RAWIT', 'BAWANG_MERAH', 'JAGUNG'
  region_code      VARCHAR(10) NOT NULL,
  price_value      NUMERIC(15, 2) NOT NULL, -- Harga dalam IDR per kg
  unit             VARCHAR(10) NOT NULL DEFAULT 'IDR/KG',
  source           VARCHAR(20) NOT NULL
                   CHECK (source IN ('PIHPS', 'MOCK')),
  quality_flag     VARCHAR(20) NOT NULL DEFAULT 'NORMAL'
                   CHECK (quality_flag IN ('NORMAL', 'SUSPECT', 'OUTLIER')),
  anomaly_flag     BOOLEAN NOT NULL DEFAULT FALSE,
  recorded_date    DATE NOT NULL,           -- Tanggal harga berlaku
  ingested_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  correlation_id   VARCHAR(60)              -- NFR-004: traceability
);

CREATE INDEX idx_commodity_prices_lookup
  ON commodity_prices (commodity_code, region_code, recorded_date DESC);
```

**Validasi**:
- `price_value`: > 0, outlier detection: > 3σ dari rolling 30-day mean → `anomaly_flag=true`
- Minimal coverage: 3 komoditas × 3 wilayah × 30 hari (Assumptions spec) = 270 records minimum
- Duplikasi: UNIQUE (commodity_code, region_code, recorded_date, source)

**Mock Data Seed**: `backend-api/src/mock/data/commodity-prices.json` — 3 komoditas (CABAI_RAWIT, BAWANG_MERAH, JAGUNG) × 3 wilayah (JKT, MKS, SBY) × 30 hari

---

## 3. PriceForecast (Hasil Prediksi Harga)

**Referensi**: FR-002, AC-PET-01 — output model hibrida XGBoost-LSTM

```sql
CREATE TABLE price_forecasts (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commodity_code         VARCHAR(20) NOT NULL,
  region_code            VARCHAR(10) NOT NULL,
  forecast_date          DATE NOT NULL,           -- Tanggal yang diprediksi
  predicted_price        NUMERIC(15, 2) NOT NULL,
  confidence_low         NUMERIC(15, 2) NOT NULL, -- Lower bound 80% CI
  confidence_high        NUMERIC(15, 2) NOT NULL, -- Upper bound 80% CI
  model_version          VARCHAR(20) NOT NULL,    -- Misal: 'hybrid-v1.0.0'
  input_date_range_start DATE NOT NULL,
  input_date_range_end   DATE NOT NULL,
  generated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  correlation_id         VARCHAR(60) NOT NULL     -- NFR-004
);

CREATE INDEX idx_forecasts_lookup
  ON price_forecasts (commodity_code, region_code, forecast_date DESC);
```

**Validasi**:
- `confidence_low` < `predicted_price` < `confidence_high`
- Horizon maksimal PoC: 7 hari ke depan (dari `forecast_date`)
- Satu record per (commodity_code, region_code, forecast_date, model_version, correlation_id)

---

## 4. FleetRoute (Rencana Rute Armada)

**Referensi**: FR-003, AC-PET-02 — output optimasi GA+PPO

```sql
CREATE TABLE fleet_routes (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_point         JSONB NOT NULL,    -- { "code": "JKT", "lat": -6.2, "lon": 106.8 }
  destination_points   JSONB NOT NULL,    -- [{ "code": "SBY", ... }, ...]
  waypoints            JSONB,             -- Titik singgah opsional
  fleet_capacity_kg    NUMERIC(10, 2) NOT NULL,
  deadline_ts          TIMESTAMPTZ NOT NULL,
  -- Output optimasi
  optimized_route      JSONB NOT NULL,    -- Urutan titik optimal beserta segmen
  estimated_cost_idr   NUMERIC(15, 2) NOT NULL,
  estimated_duration_min INTEGER NOT NULL,
  service_level_pct    NUMERIC(5, 2) NOT NULL, -- Persentase SLA terpenuhi
  baseline_cost_idr    NUMERIC(15, 2),         -- Untuk perbandingan AC-PET-02
  cost_reduction_pct   NUMERIC(5, 2),          -- (baseline - optimized)/baseline × 100
  algorithm_used       VARCHAR(50) NOT NULL,   -- 'GA', 'GA+PPO', 'GA+PPO+GNN'
  optimization_version VARCHAR(20) NOT NULL,
  generated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  correlation_id       VARCHAR(60) NOT NULL
);
```

**Validasi**:
- `deadline_ts` > NOW()
- `service_level_pct`: 0–100
- `cost_reduction_pct` ≥ 10 untuk memenuhi AC-PET-02 pada skenario benchmark

---

## 5. HarvestAsset (Aset Panen Tertokenisasi / Quasi-Collateral)

**Referensi**: FR-004, AC-PET-03, AC-BNK-01, AC-BNK-03

```sql
CREATE TABLE harvest_assets (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id            VARCHAR(50) UNIQUE NOT NULL, -- Identitas unik batch panen (Edge Case: anti-duplikasi)
  farmer_id           UUID NOT NULL REFERENCES farmer_profiles(id),
  commodity_code      VARCHAR(20) NOT NULL,
  harvest_quantity_kg NUMERIC(10, 2) NOT NULL CHECK (harvest_quantity_kg > 0),
  harvest_date        DATE NOT NULL,
  reference_value_idr NUMERIC(15, 2) NOT NULL,    -- Estimasi nilai berdasarkan harga terakhir
  -- Status token (state machine)
  token_status        VARCHAR(30) NOT NULL DEFAULT 'draft'
                      CHECK (token_status IN (
                        'draft',              -- Pengajuan dibuat
                        'pending_verification',-- Submit ke smart contract, belum diverifikasi
                        'verified',           -- Bank Mitra menyatakan valid
                        'collateralized',     -- Digunakan sebagai jaminan aktif
                        'released',           -- Jaminan dilepas pasca lunas
                        'rejected'            -- Ditolak verifikasi/pembiayaan
                      )),
  -- On-chain data (diisi setelah mint)
  token_id            VARCHAR(100),                -- ID token on-chain (Besu)
  besu_tx_hash        VARCHAR(66),                 -- 0x + 64 hex chars
  besu_block_number   BIGINT,
  -- Timestamps
  submitted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  correlation_id      VARCHAR(60) NOT NULL
);

CREATE INDEX idx_harvest_assets_farmer ON harvest_assets (farmer_id, token_status);
CREATE INDEX idx_harvest_assets_batch  ON harvest_assets (batch_id);
```

**State Transitions**:

```
draft
  └─(submit tokenization request)─→ pending_verification
       ├─(bank validates OK)──────→ verified
       │    └─(financing approved)─→ collateralized
       │         └─(loan settled)──→ released
       └─(bank rejects)────────────→ rejected
```

**Validasi Edge Cases**:
- Duplikasi `batch_id`: UNIQUE constraint → HTTP 409 `TOKEN_DUPLICATE`
- Nilai referensi: harus ada record `commodity_prices` terbaru dalam 7 hari sebelum `harvest_date`

---

## 6. FinancingApplication (Pengajuan Pembiayaan)

**Referensi**: FR-005, AC-BNK-01, AC-BNK-02, AC-BNK-03

```sql
CREATE TABLE financing_applications (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  harvest_asset_id UUID NOT NULL REFERENCES harvest_assets(id),
  bank_partner_id  VARCHAR(50) NOT NULL,       -- Kode Bank Mitra (misal: 'BNI', 'BRI')
  -- Evaluasi
  risk_score       NUMERIC(5, 2),              -- 0–100, semakin tinggi semakin berisiko
  risk_rationale   TEXT,                       -- Penjelasan skor risiko (NFR-004)
  iasc_trace_ref   VARCHAR(60),               -- Referensi ke IASCTrace.id
  -- Keputusan (AC-BNK-01, AC-BNK-02)
  decision         VARCHAR(20) NOT NULL DEFAULT 'pending'
                   CHECK (decision IN ('pending', 'approved', 'rejected')),
  decision_at      TIMESTAMPTZ,
  decision_reason  TEXT,                       -- Alasan keputusan untuk audit
  -- Kontrak (AC-BNK-03)
  contract_status  VARCHAR(30) DEFAULT 'none'
                   CHECK (contract_status IN ('none', 'active', 'completed', 'defaulted')),
  -- Timestamps
  applied_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  correlation_id   VARCHAR(60) NOT NULL
);

CREATE INDEX idx_financing_by_asset ON financing_applications (harvest_asset_id);
```

**Validasi**:
- Satu `harvest_asset_id` hanya boleh punya satu aplikasi aktif (status `pending` atau `approved`)
- `decision_at`: wajib diisi saat decision berubah dari `pending`
- `risk_score`: 0–100.00; ≥ 70 → rekomendasi tolak (rule PoC)

---

## 7. IASCTrace (Rekam Jejak IASC OJK)

**Referensi**: FR-005, AC-BNK-02, AC-REG-02

```sql
CREATE TABLE iasc_traces (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_id        VARCHAR(100) NOT NULL,    -- ID referensi dari IASC OJK / mock
  entity_type         VARCHAR(30) NOT NULL,     -- 'HARVEST_ASSET', 'FINANCING_APPLICATION'
  entity_id           UUID NOT NULL,            -- FK ke entitas terkait
  verification_status VARCHAR(30) NOT NULL
                      CHECK (verification_status IN (
                        'verified',
                        'pending',              -- Edge Case: IASC tidak sinkron sementara
                        'failed'
                      )),
  verification_ts     TIMESTAMPTZ,              -- NULL jika masih pending
  proof_hash          VARCHAR(128),             -- Hash bukti verifikasi dari IASC
  source              VARCHAR(20) NOT NULL
                      CHECK (source IN ('IASC_REAL', 'MOCK')),
  retry_deadline_ts   TIMESTAMPTZ,              -- Batas ulang evaluasi jika pending (Edge Case)
  correlation_id      VARCHAR(60) NOT NULL
);

CREATE INDEX idx_iasc_by_entity ON iasc_traces (entity_type, entity_id);
```

**Edge Case Handling**:
- Status `pending`: `retry_deadline_ts` = NOW() + interval '24 hours' — sesuai Edge Cases spec
- Mock source: `proof_hash` = SHA256 dari payload mock yang deterministik

---

## 8. AuditTrail (Jejak Audit Lintas Modul)

**Referensi**: FR-009, NFR-004, AC-REG-02 — setiap keputusan sistem harus traceable

```sql
CREATE TABLE audit_trail (
  id              BIGSERIAL PRIMARY KEY,
  correlation_id  VARCHAR(60) NOT NULL,    -- NFR-004: kunci penelusuran
  actor_role      VARCHAR(30) NOT NULL     -- 'PETANI', 'BANK_MITRA', 'REGULATOR', 'SYSTEM'
                  CHECK (actor_role IN ('PETANI', 'BANK_MITRA', 'REGULATOR', 'SYSTEM')),
  module          VARCHAR(30) NOT NULL
                  CHECK (module IN ('frontend', 'backend-api', 'ai-engine', 'blockchain')),
  action          VARCHAR(100) NOT NULL,   -- Misal: 'PRICE_FORECAST_REQUESTED', 'TOKEN_MINTED'
  entity_type     VARCHAR(30),
  entity_id       VARCHAR(60),
  status_before   VARCHAR(30),
  status_after    VARCHAR(30),
  metadata        JSONB,                   -- Detail tambahan (model_version, tx_hash, dll)
  timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_by_correlation ON audit_trail (correlation_id, timestamp);
CREATE INDEX idx_audit_by_module      ON audit_trail (module, timestamp DESC);
```

**Contoh Records**:
```json
[
  { "correlation_id": "GARUDA-...", "module": "backend-api", "action": "PRICE_FORECAST_REQUESTED", "actor_role": "PETANI" },
  { "correlation_id": "GARUDA-...", "module": "ai-engine",   "action": "PRICE_FORECAST_COMPLETED", "metadata": { "model_version": "hybrid-v1.0.0" } },
  { "correlation_id": "GARUDA-...", "module": "blockchain",  "action": "TOKEN_MINTED",              "metadata": { "tx_hash": "0x...", "token_id": "1" } }
]
```

---

## 9. ComplianceRecord (Catatan Kepatuhan)

**Referensi**: CR-001..005, AC-REG-01 — laporan kepatuhan SNAP BI + UU PDP

```sql
CREATE TABLE compliance_records (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start     DATE NOT NULL,
  period_end       DATE NOT NULL,
  control_id       VARCHAR(20) NOT NULL,   -- 'CR-001', 'CR-002', dst.
  control_name     VARCHAR(100) NOT NULL,
  status           VARCHAR(20) NOT NULL
                   CHECK (status IN ('compliant', 'non_compliant', 'not_applicable', 'pending_review')),
  evidence_ref     TEXT,                   -- Path atau ID referensi bukti
  reviewer_role    VARCHAR(30),
  reviewed_at      TIMESTAMPTZ,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## On-Chain Data Model — HarvestTokenRegistry (Solidity)

**File**: `blockchain-contracts/contracts/HarvestTokenRegistry.sol`

```solidity
// Struct disimpan di blockchain
struct HarvestToken {
    uint256 tokenId;
    string  batchId;          // Mirror batch_id dari PostgreSQL (anti-duplikasi)
    address farmerAddress;
    string  commodityCode;
    uint256 harvestQtyGrams;  // dalam gram untuk presisi integer
    uint256 referencePriceWei;
    TokenStatus status;
    string  correlationId;    // NFR-004: on-chain traceability
    uint256 mintedAt;
    uint256 updatedAt;
}

enum TokenStatus {
    Draft,              // 0
    PendingVerification,// 1
    Verified,           // 2
    Collateralized,     // 3
    Released,           // 4
    Rejected            // 5
}

// Events (indexed untuk efficient querying)
event TokenMinted(
    uint256 indexed tokenId,
    string  indexed batchId,
    address indexed farmerAddress,
    string  correlationId
);

event StatusUpdated(
    uint256 indexed tokenId,
    TokenStatus     oldStatus,
    TokenStatus     newStatus,
    string          correlationId
);
```

**Catatan**:
- `batchId` harus UNIK — implementasi via `require(!batchIdExists[batchId], "Duplicate batch")` (Edge Case spec)
- `correlationId` di-emit sebagai event field untuk cross-reference dengan PostgreSQL `audit_trail`

---

## Enkripsi PII — Prosedur Operasional

**Kunci enkripsi**: disimpan di environment variable `PII_ENCRYPTION_KEY` (min 32 karakter)

```sql
-- Enkripsi saat INSERT
INSERT INTO farmer_profiles (nik_encrypted, name_encrypted, ...)
VALUES (
  pgp_sym_encrypt('1234567890123456', current_setting('app.pii_key')),
  pgp_sym_encrypt('Budi Santoso', current_setting('app.pii_key')),
  ...
);

-- Dekripsi saat READ (audit-logged)
SELECT pgp_sym_decrypt(nik_encrypted, current_setting('app.pii_key'))::TEXT AS nik
FROM farmer_profiles WHERE id = $1;
```

**Rotasi kunci**: Tidak termasuk scope PoC; prosedur rotasi akan didokumentasikan di fase lanjutan.
