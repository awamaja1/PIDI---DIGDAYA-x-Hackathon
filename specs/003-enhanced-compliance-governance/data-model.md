# Data Model: Enhanced Compliance & Governance

**Branch**: `003-enhanced-compliance-governance` | **Tanggal**: 2026-04-22
**Referensi**: FR-001..FR-007, NFR-001..NFR-004, CR-001..CR-004, HA-001..HA-003

## Entitas Utama

## 1. ComplianceEvidenceBundle

Deskripsi: Paket evidence terstruktur berbasis `correlation_id` sebagai sumber utama audit review.

Fields:
- `bundle_id` (string, required, unique)
- `correlation_id` (string, required, indexed, format `GARUDA-<uuid>`)
- `transaction_metadata` (object, required)
- `audit_trace` (array of `AuditEventRef`, required, min 1)
- `fallback_context` (object, nullable)
- `compliance_status` (object, required)
- `generated_at` (datetime, required)
- `source_refs` (array string, required)

Validation rules:
- Untuk `correlation_id` sama dan data source sama, payload bundle harus identik (NFR-001).
- `source_refs` wajib menunjuk ke artefak audit sumber (FR-007).

## 2. GovernanceControlSummary

Deskripsi: Ringkasan status kontrol governance untuk satu periode observasi.

Fields:
- `summary_id` (string, required, unique)
- `period_type` (enum: `DAILY`, `RELEASE`, required)
- `period_key` (string, required; contoh: `2026-04-22`, `v0.1.0`)
- `control_domains` (array of `ControlDomainStatus`, required)
- `overall_status` (enum: `pass`, `warn`, `fail`, required)
- `evaluated_at` (datetime, required)
- `evidence_coverage_pct` (number, required, 0..100)

Validation rules:
- `overall_status` diturunkan dari domain status, bukan input manual bebas.
- Jika `evidence_coverage_pct` < threshold minimum, status minimum `warn`.

## 3. ControlDomainStatus

Deskripsi: Status kontrol pada domain governance tertentu.

Fields:
- `domain_code` (enum: `AUDIT_TRACE`, `FALLBACK_DETERMINISM`, `DATA_PROTECTION`, `SECURITY_READINESS`)
- `status` (enum: `pass`, `warn`, `fail`, required)
- `reason` (string, required)
- `affected_correlations` (array string, optional)
- `evidence_refs` (array string, required)

Validation rules:
- `status=warn/fail` wajib menyertakan minimal satu `affected_correlations` atau alasan eksplisit domain-level.
- `evidence_refs` wajib valid dan dapat ditelusuri (NFR-002).

## 4. ReleaseReadinessChecklist

Deskripsi: Checklist readiness rilis yang diturunkan dari evidence aktual.

Fields:
- `checklist_id` (string, required, unique)
- `release_candidate` (string, required; contoh: `v0.2.0-rc1`)
- `items` (array of `ChecklistItem`, required)
- `overall_decision` (enum: `GO`, `CONDITIONAL_GO`, `NO_GO`, required)
- `evaluated_by` (string, required; system/user id)
- `evaluated_at` (datetime, required)

Validation rules:
- Setiap `ChecklistItem` wajib punya `evidence_ref`.
- `overall_decision=GO` hanya valid jika tidak ada item kritikal `fail`.

## 5. ChecklistItem

Deskripsi: Item kontrol individual untuk keputusan readiness.

Fields:
- `item_code` (string, required)
- `description` (string, required)
- `severity` (enum: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`, required)
- `status` (enum: `pass`, `warn`, `fail`, required)
- `evidence_ref` (string, required)
- `override` (object, nullable; actor, reason, timestamp)

Validation rules:
- Jika `override` diisi, reason wajib non-empty dan actor wajib teridentifikasi.
- Override tidak boleh menghapus jejak status asli yang diturunkan dari evidence.

## 6. AuditEventRef

Deskripsi: Referensi minimal ke event audit existing dari Feature 002.

Fields:
- `audit_id` (string, required)
- `operation` (string, required)
- `status` (enum: `SUCCESS`, `FAILED`, `FALLBACK`, required)
- `event_time` (datetime, required)
- `tx_reference` (string, nullable)
- `compliance_tags` (array string, optional)

Validation rules:
- `audit_id` wajib ada di sumber audit pipeline existing.
- Event fallback wajib menyertakan reason pada konteks bundle.

## Relasi Antar Entitas

- `ComplianceEvidenceBundle` menarik banyak `AuditEventRef` berdasarkan `correlation_id`.
- `GovernanceControlSummary` mengagregasi banyak `ComplianceEvidenceBundle` per periode.
- `ReleaseReadinessChecklist` diturunkan dari `GovernanceControlSummary` + evidence bundle yang relevan.
- `ChecklistItem.evidence_ref` menunjuk ke `ComplianceEvidenceBundle.bundle_id` atau `AuditEventRef.audit_id`.

## Aturan Derivasi Status

1. Domain `AUDIT_TRACE` = `fail` jika ada transaksi tanpa jejak audit minimum.
2. Domain `FALLBACK_DETERMINISM` = `warn/fail` jika respons fallback identik tidak terpenuhi pada kelas kegagalan yang sama.
3. Domain `DATA_PROTECTION` = `fail` jika evidence memuat field pribadi di luar whitelist.
4. Domain `SECURITY_READINESS` = `warn/fail` jika kontrol kritikal compliance tidak punya evidence valid.
5. `overall_status` summary mengikuti status domain terburuk (`fail` > `warn` > `pass`).

## Mapping Requirement ke Model

- FR-001, FR-002, FR-007: `ComplianceEvidenceBundle`, `AuditEventRef`
- FR-003, FR-004: `GovernanceControlSummary`, `ControlDomainStatus`
- FR-005: `ReleaseReadinessChecklist`, `ChecklistItem`
- FR-006, HA-001..HA-003: relasi model tetap berbasis backend audit pipeline (tanpa direct AI->DLT)
- NFR-001: deterministic construction pada `ComplianceEvidenceBundle`
- NFR-002: mandatory `evidence_ref` pada `ChecklistItem`
- NFR-003: evaluasi performa query evidence/summary
- CR-001..CR-004: compliance tags, access traceability, data minimization rules
