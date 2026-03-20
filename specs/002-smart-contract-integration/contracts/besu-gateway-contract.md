# Contract: Backend Gateway -> Besu Smart Contract Operations

**Versi**: v0.1 | **Tanggal**: 2026-03-20
**Referensi**: FR-002, FR-003, FR-004, FR-005, FR-006, HA-002, HA-003

## Tujuan

Dokumen ini mendefinisikan kontrak operasi yang boleh dipanggil backend-api ke jaringan Besu.
Only backend gateway boleh melakukan operasi ini. AI module tidak boleh mengakses JSON-RPC Besu.

## Network Baseline

- Network: Hyperledger Besu QBFT local
- RPC endpoint: configurable via `BESU_RPC_URL`
- Contract addresses:
  - `GARUDA_LINK_TOKENIZATION_ADDRESS`
  - `HARVEST_TOKEN_REGISTRY_ADDRESS`

## Allowed Operations

## 1. Mint Token

Contract: `GarudaLinkTokenization`

Operation:
`mintToken(batchId, commodityCode, quantityKg, referenceValueIdr, correlationId)`

Expected result:
- `txHash` (non-empty)
- `tokenId` (non-empty)

Failure mapping:
- RPC connect error -> `BESU_UNAVAILABLE`
- RPC timeout -> `BESU_TIMEOUT`
- ABI mismatch -> `CONTRACT_ABI_MISMATCH`

## 2. Update Token Status

Contract: `HarvestTokenRegistry`

Operation:
`updateStatus(tokenId, newStatus, reason, correlationId)`

Expected result:
- `txHash`
- `updatedStatus`

Failure mapping:
- Unknown token -> domain error `TOKEN_NOT_FOUND`
- Invalid transition -> domain error `INVALID_STATUS_TRANSITION`
- Besu unavailable classes -> fallback mapping sama seperti mint

## 3. Verify Token Status

Contract: `HarvestTokenRegistry`

Operation:
`getTokenStatus(tokenId)`

Expected result:
- `tokenId`
- `status`
- `lastUpdated`

Failure mapping:
- Besu down/timeout/ABI mismatch -> deterministic fallback response

## Deterministic Fallback Rules

Untuk kegagalan Besu yang sama, backend wajib mengembalikan:

1. HTTP status yang sama
2. `errorCode` yang sama
3. Struktur payload yang sama
4. `correlationId` unik per request, namun schema tetap

## Audit Minimum Fields

Untuk semua operasi di atas, backend menulis audit artifact dengan field:

- `eventTime`
- `actor`
- `operation`
- `status` (`SUCCESS`/`FALLBACK`/`FAILED`)
- `correlationId`
- `txReference` (nullable)
- `fallbackReason` (nullable)

## Boundary Assertion

Aturan wajib:

- Backend -> Besu: ALLOWED
- AI engine -> Besu: FORBIDDEN
- Frontend -> Besu: FORBIDDEN

Boundary check ini harus diverifikasi saat implementasi dan pengujian.