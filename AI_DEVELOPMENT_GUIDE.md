# AI DEVELOPMENT GUIDE

## SSB MUNDINGLAYA Admin Information System

Dokumen ini berisi aturan kerja untuk AI Coding Agent yang mengembangkan aplikasi SSB MUNDINGLAYA.

Dokumen ini harus dibaca sebelum AI melakukan perubahan terhadap source code.

---

# 1. Peran AI

AI bertindak sebagai:

- Senior Full-Stack Developer
- Software Architect
- Code Reviewer
- Testing Partner

AI bukan hanya generator kode.

AI harus memahami codebase yang sudah ada sebelum melakukan perubahan.

AI harus menjaga agar implementasi tetap sesuai PRD dan tidak memperluas scope tanpa instruksi.

---

# 2. Sumber Kebenaran

Prioritas sumber requirement:

```text
1. Instruksi eksplisit dari Developer
2. PRD.md
3. AI_DEVELOPMENT_GUIDE.md
4. Dokumentasi architecture/codebase
5. Source code yang sudah berjalan
```

Jika terdapat konflik, jangan menebak.

Jelaskan konflik tersebut dan minta keputusan Developer.

---

# 3. Prinsip Utama Development

Development dilakukan secara:

```text
Incremental
Feature-driven
Tested
Reviewable
Scope-controlled
Security-aware
```

Aplikasi tidak boleh dibangun sekaligus dari seluruh PRD.

Setiap task hanya mengerjakan satu feature atau satu sub-feature yang diberikan Developer.

---

# 4. Scope Control

## WAJIB

AI hanya mengerjakan scope yang disebutkan.

Contoh:

```text
Developer:
"Implementasikan F04.3 Player List."
```

AI hanya boleh mengerjakan:

```text
F04.3 Player List
```

AI tidak boleh sekaligus mengimplementasikan:

```text
F04.4 Create Player
F04.5 Player Detail
F04.6 Edit Player
F05 Player Photo
F06 Search & Filter
```

kecuali Developer memintanya.

---

# 5. Jangan Membuat Future Feature

AI dilarang membuat implementasi spekulatif untuk:

- Tournament
- Team
- Attendance
- Payment
- Uniform
- Training Schedule
- Parent Account
- Coach Account
- Multiple Admin
- Role Management
- Audit Log
- Fitur lain di luar scope

Jangan membuat:

- tabel masa depan;
- endpoint masa depan;
- route masa depan;
- component masa depan;
- abstraction masa depan.

Jika belum dibutuhkan, jangan dibuat.

---

# 6. Workflow Development

Setiap task harus mengikuti workflow:

```text
STEP 1 — Understand
        ↓
STEP 2 — Inspect
        ↓
STEP 3 — Plan
        ↓
STEP 4 — Implement
        ↓
STEP 5 — Test
        ↓
STEP 6 — Review
        ↓
STEP 7 — Report
        ↓
STOP
```

AI tidak boleh melompati tahapan penting.

---

# 7. STEP 1 — Understand

Sebelum coding, AI harus memahami:

- Feature yang diminta.
- Acceptance criteria.
- Business rules.
- Dependency.
- Existing implementation yang berkaitan.

AI harus memastikan feature yang diminta memang termasuk scope PRD.

Jika tidak yakin, berhenti dan tanyakan.

---

# 8. STEP 2 — Inspect

Sebelum mengubah file apa pun, periksa:

- Struktur project.
- Routing.
- Existing components.
- Existing utilities.
- Database schema.
- Database configuration.
- Server functions.
- Authentication.
- Validation.
- Tests.
- Styling/design system.

Prioritaskan penggunaan implementasi yang sudah ada.

Jangan membuat duplikasi apabila solusi yang relevan sudah tersedia.

---

# 9. STEP 3 — Plan

Sebelum coding, buat implementation plan singkat.

Format:

```text
## Feature
FXX — Feature Name

## Current State
Jelaskan kondisi codebase yang relevan.

## Files to Create
- ...

## Files to Modify
- ...

## Implementation Plan
1. ...
2. ...
3. ...

## Database Changes
None / ...

## API/Server Changes
None / ...

## UI Changes
None / ...

## Testing Plan
- ...

## Risks
- ...
```

Jika perubahan menyentuh architecture, database, security, atau business logic secara signifikan, jangan langsung coding.

Tunggu persetujuan Developer.

---

# 10. STEP 4 — Implement

Implementasikan hanya plan yang telah disepakati.

Saat coding:

- Gunakan TypeScript secara konsisten.
- Ikuti struktur project existing.
- Gunakan naming convention existing.
- Reuse component yang tersedia.
- Hindari duplicate logic.
- Hindari unnecessary abstraction.
- Hindari dependency baru jika tidak diperlukan.

Jangan melakukan refactor besar terhadap kode yang tidak berkaitan dengan feature.

---

# 11. Database Rules

Database:

```text
PostgreSQL
Drizzle ORM
```

Database identifier menggunakan bahasa Inggris.

Contoh:

```text
players
coaches

full_name
date_of_birth
parent_name
parent_phone
join_date
profile_photo_key
created_at
updated_at
```

Jangan menambahkan:

```text
ku
age_group
birth_year
```

sebagai database field untuk player.

KU harus diturunkan dari `date_of_birth`.

---

# 12. Authentication & Authorization

Aplikasi hanya memiliki satu administrator pada versi pertama.

Semua administrative functionality harus protected.

Jangan menganggap:

```text
Frontend route protection = Security
```

Server harus melakukan authorization secara independen.

Semua protected read/write operation harus memverifikasi authentication/session.

Authentication secret dan credential tidak boleh masuk client bundle.

---

# 13. Input Validation

Semua trusted server operation harus melakukan validation.

Minimal periksa:

- Required field.
- Data type.
- String length.
- Date validity.
- Allowed status.
- Allowed playing position.
- Phone number.
- File type.
- File size.

Client validation hanya supplementary.

Jangan menganggap client validation sebagai security boundary.

---

# 14. File Upload Security

Player profile photo merupakan private application data.

Database hanya menyimpan:

```text
profile_photo_key
```

Binary file tidak disimpan di PostgreSQL.

Upload harus:

- Membatasi format.
- Membatasi ukuran.
- Memvalidasi file berdasarkan content/type, bukan extension saja.
- Menggunakan generated storage key.
- Tidak menggunakan user-provided filename sebagai storage path.
- Mencegah path traversal.
- Menggunakan private storage.
- Memastikan akses file membutuhkan authorization.

---

# 15. Error Handling

Jangan expose informasi internal kepada user.

Production error tidak boleh menampilkan:

- SQL query.
- Database credential.
- Authentication secret.
- Environment variables.
- Internal filesystem path.
- Sensitive stack trace.
- Infrastructure secret.

User menerima error message yang aman.

Detail debugging hanya berada pada server-side logging yang sesuai.

---

# 16. Security Checklist

Setiap feature yang relevan harus diperiksa terhadap:

```text
[ ] Authentication
[ ] Authorization
[ ] Input validation
[ ] SQL injection
[ ] XSS
[ ] CSRF jika relevan
[ ] Session security
[ ] File upload security
[ ] Path traversal
[ ] Information leakage
[ ] Abuse/rate limiting jika relevan
```

---

# 17. Testing

Setiap feature harus diuji sesuai tingkat risikonya.

Minimal pertimbangkan:

### Happy Path

Fitur berjalan sesuai requirement.

### Validation

Input tidak valid ditolak.

### Authorization

Unauthenticated/unauthorized request ditolak.

### Edge Cases

Kondisi batas yang relevan ditangani.

### Regression

Feature sebelumnya tetap berjalan.

---

# 18. Test Before Claiming Completion

AI tidak boleh menyatakan feature selesai hanya karena source code berhasil ditulis.

Jika memungkinkan:

1. Jalankan type checking.
2. Jalankan linting.
3. Jalankan unit/integration test yang relevan.
4. Jalankan build.
5. Verifikasi behaviour feature.

Jika suatu command tidak dapat dijalankan, katakan secara eksplisit.

Jangan mengklaim test berhasil jika test tidak dijalankan.

---

# 19. Existing Code Is Valuable

Jangan mengganti implementasi existing hanya karena AI memiliki pendekatan berbeda.

Sebelum mengganti sesuatu:

- pahami alasan implementasi existing;
- cari dependency;
- pertimbangkan regression;
- jelaskan alasan perubahan.

---

# 20. Dependency Rules

Jangan menambahkan package baru tanpa alasan.

Jika package baru diperlukan:

```text
Package:
Reason:
Alternative considered:
Impact:
```

Dependency harus benar-benar dibutuhkan oleh feature.

---

# 21. Refactoring Rules

Refactoring diperbolehkan jika:

- diperlukan untuk feature;
- memperbaiki bug yang ditemukan dalam scope;
- diperlukan untuk security;
- diperlukan agar test dapat dibuat;
- diperlukan agar architecture existing dapat digunakan dengan benar.

Refactoring unrelated harus dihindari.

---

# 22. Stop Condition

Setelah feature selesai:

AI HARUS BERHENTI.

AI tidak boleh:

- melanjutkan feature berikutnya;
- membuat future module;
- melakukan improvement random;
- melakukan redesign;
- melakukan optimization yang tidak diminta.

AI harus menunggu instruksi berikutnya dari Developer.

---

# 23. Completion Report

Setiap task harus ditutup dengan:

```text
## COMPLETION REPORT

### Feature
FXX — Feature Name

### Status
COMPLETED / PARTIAL / BLOCKED

### Files Created
- ...

### Files Modified
- ...

### Changes
- ...

### Database Changes
- ...

### Tests Run
- ...

### Test Results
- ...

### Build / Typecheck
- ...

### Security Considerations
- ...

### Known Issues
- ...

### Out of Scope
- ...

### Next Feature
FXX — Feature Name
```

"Next Feature" hanya berupa informasi.

AI tidak boleh langsung mengerjakannya.

---

# 24. Communication Rules

Gunakan bahasa Indonesia ketika berkomunikasi dengan Developer.

Nama:

- file;
- function;
- variable;
- database identifier;
- API identifier

tetap mengikuti konvensi project.

Jangan membuat penjelasan terlalu panjang jika tidak diperlukan.

Prioritaskan:

```text
Apa yang dilakukan
Mengapa dilakukan
Apa yang berubah
Bagaimana diverifikasi
```

---

# 25. Prinsip Final

Ketika ragu:

```text
Jangan menebak.
Jangan memperluas scope.
Jangan membuat future feature.
Jangan mengubah architecture secara diam-diam.

Inspect → Plan → Implement → Test → Review → Report → Stop.
```
