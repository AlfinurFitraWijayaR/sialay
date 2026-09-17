# Product Requirements Document (PRD)

## SSB MUNDINGLAYA Admin Information System

**Versi:** 1.0
**Status:** Initial Development Scope
**Jenis Aplikasi:** Web Application — Admin Only
**Pengguna Utama:** Administrator SSB MUNDINGLAYA

---

# 1. Gambaran Produk

SSB MUNDINGLAYA saat ini mengelola administrasi pemain menggunakan dokumen fisik dan spreadsheet. Data pribadi pemain dicatat menggunakan Excel, sedangkan dokumen administrasi disimpan secara fisik.

Kondisi tersebut menyebabkan proses pencarian, pembaruan, dan pengelolaan data menjadi kurang efisien.

Sistem ini bertujuan menyediakan satu aplikasi web terpusat untuk membantu administrator mengelola data pemain dan pelatih secara lebih terstruktur.

Versi pertama aplikasi hanya berfokus pada dua domain utama:

1. Pemain
2. Pelatih

Tidak terdapat hubungan database antara pemain dan pelatih pada versi pertama.

Aplikasi bersifat **admin-only**. Pemain, orang tua/wali, dan pelatih bukan pengguna aplikasi.

---

# 2. Tujuan Produk

Sistem harus:

- Menjadi sumber data terpusat untuk data pemain.
- Menjadi sumber data terpusat untuk data pelatih.
- Memungkinkan satu administrator mengelola seluruh data.
- Mendukung operasi CRUD.
- Memungkinkan pencarian dan filtering data.
- Menyediakan pengelolaan foto profil pemain.
- Menghasilkan informasi KU berdasarkan tanggal lahir.
- Melindungi data pribadi pemain dan pelatih.
- Memiliki arsitektur sederhana dan mudah dipelihara.
- Tidak memperkenalkan fitur di luar scope versi pertama.

---

# 3. Scope Versi 1

## 3.1 Fitur yang Termasuk

### F01 — Project Foundation

Menyiapkan fondasi aplikasi:

- Struktur project.
- TanStack Start.
- PostgreSQL.
- Drizzle ORM.
- Environment configuration.
- Database connection.
- Struktur folder.
- Konvensi coding dasar.

### F02 — Administrator Authentication

- Login administrator.
- Session authentication.
- Protected routes.
- Logout.
- Session expiration.
- Server-side authorization.

### F03 — Dashboard

Dashboard menampilkan:

- Total pemain.
- Pemain aktif.
- Pemain tidak aktif.
- Total pelatih.
- Pelatih aktif.
- Pelatih tidak aktif.

### F04 — Player Management

Administrator dapat:

- Melihat daftar pemain.
- Melihat detail pemain.
- Menambahkan pemain.
- Mengubah data pemain.
- Mengubah status pemain.
- Menghapus pemain.

### F05 — Player Profile Photo

Administrator dapat:

- Upload foto.
- Mengganti foto.
- Menghapus foto.
- Melihat foto melalui akses yang terproteksi.

### F06 — Player Search & Filter

Administrator dapat:

- Mencari berdasarkan nama.
- Filter berdasarkan status.
- Filter berdasarkan tahun lahir/KU.

KU harus dihitung dari tanggal lahir dan tidak disimpan sebagai field database.

### F07 — Coach Management

Administrator dapat:

- Melihat daftar pelatih.
- Melihat detail pelatih.
- Menambahkan pelatih.
- Mengubah data pelatih.
- Mengubah status pelatih.
- Menghapus pelatih.

### F08 — Coach Search & Filter

Administrator dapat:

- Mencari berdasarkan nama.
- Filter berdasarkan status.

### F09 — Security & Hardening

Memastikan:

- Server-side authorization.
- Input validation.
- Secure authentication.
- Secure file upload.
- Protection terhadap SQL injection.
- Perlindungan XSS.
- Perlindungan CSRF jika relevan dengan arsitektur session.
- Error handling yang aman.
- Secret management.
- HTTPS pada production.

---

# 4. Fitur di Luar Scope

Jangan implementasikan fitur berikut pada versi 1:

- Tournament/event management.
- Team management.
- Tournament player selection.
- Screening album.
- Payment management.
- Uniform ordering.
- Attendance.
- Training schedule.
- Player-to-coach relationship.
- Age-group table.
- Parent/guardian table terpisah.
- Multiple administrator.
- Multiple role.
- Public registration.
- Player login.
- Parent login.
- Coach login.
- Audit log.

Fitur tersebut hanya menjadi pertimbangan versi berikutnya.

AI CODING AGENT DILARANG mengimplementasikan fitur di luar scope kecuali diminta secara eksplisit.

---

# 5. Model Pengguna

## Administrator

Sistem hanya memiliki satu akun administrator.

Administrator dapat:

- Login.
- Logout.
- Melihat dashboard.
- Mengelola pemain.
- Mengelola pelatih.
- Mengelola foto pemain.
- Mencari dan memfilter data.

Tidak terdapat halaman registrasi administrator.

---

# 6. Business Rules

## 6.1 Player

Player memiliki:

- Full name.
- Place of birth.
- Date of birth.
- Address.
- Playing position.
- Parent/guardian name.
- Parent/guardian phone.
- Join date.
- Status.
- Profile photo.

Status hanya:

```text
active
inactive
```

Join date bersifat opsional.

Profile photo bersifat opsional.

### Aturan KU

KU tidak boleh disimpan sebagai database field.

Contoh:

```text
date_of_birth = 2014-05-20

birth_year = 2014

displayed_age_group = KU 2014
```

Database tidak boleh memiliki:

```text
age_group
ku
birth_year
```

sebagai field player.

---

## 6.2 Coach

Coach memiliki:

- Full name.
- Phone.
- Address.
- Status.

Status hanya:

```text
active
inactive
```

Coach berdiri sebagai domain independen.

Tidak ada foreign key antara:

```text
players
coaches
```

---

# 7. Feature Dependency

Urutan implementasi resmi:

```text
F01 Foundation
      ↓
F02 Authentication
      ↓
F03 Dashboard
      ↓
F04 Player Management
      ↓
F05 Player Photo
      ↓
F06 Player Search & Filter
      ↓
F07 Coach Management
      ↓
F08 Coach Search & Filter
      ↓
F09 Security & Hardening
```

## Aturan Dependency

Feature hanya boleh menggunakan feature yang berada sebelumnya dalam dependency chain.

AI tidak boleh mengimplementasikan feature berikutnya secara otomatis.

Contoh:

Jika sedang mengerjakan:

```text
F04 — Player Management
```

AI tidak boleh sekaligus mengerjakan:

```text
F05 — Player Photo
F06 — Player Search
F07 — Coach Management
```

kecuali diminta secara eksplisit.

---

# 8. Spesifikasi Feature

# F01 — Project Foundation

## Tujuan

Menyiapkan fondasi teknis aplikasi tanpa mengimplementasikan business feature.

## Scope

- Inisialisasi TanStack Start.
- Konfigurasi PostgreSQL.
- Konfigurasi Drizzle ORM.
- Environment variables.
- Database connection.
- Struktur folder.
- Basic application shell.

## Tidak termasuk

- Login.
- Player CRUD.
- Coach CRUD.
- Dashboard.
- Photo upload.

## Definition of Done

- Aplikasi dapat dijalankan.
- Database dapat terkoneksi.
- Drizzle dapat melakukan migration.
- Environment secret tidak masuk source code.
- Struktur project terdokumentasi.

---

# F02 — Authentication

## Tujuan

Menyediakan authentication untuk satu administrator.

## Acceptance Criteria

1. Administrator dapat login.
2. Credential tidak disimpan plaintext.
3. Password tidak dikirim atau disimpan secara tidak aman.
4. Halaman administratif membutuhkan session valid.
5. Request tanpa authentication ditolak.
6. Server melakukan authorization check.
7. Administrator dapat logout.
8. Logout menginvalidasi session.
9. Session memiliki expiration yang sesuai.
10. Tidak terdapat registration flow.

## Tidak termasuk

- Multiple users.
- Role management.
- Registration.
- Password reset.
- Social login.

---

# F03 — Dashboard

## Tujuan

Menyediakan ringkasan data administrasi.

## Data

```text
Total Players
Active Players
Inactive Players

Total Coaches
Active Coaches
Inactive Coaches
```

## Acceptance Criteria

- Dashboard hanya dapat diakses administrator.
- Statistik player berasal dari database.
- Statistik coach berasal dari database.
- Nilai statistik tidak hard-coded.
- Dashboard tidak memperkenalkan domain baru.

---

# F04 — Player Management

## Tujuan

Menyediakan CRUD pemain.

## Data Player

```text
full_name
place_of_birth
date_of_birth
address
playing_position
parent_name
parent_phone
join_date
status
profile_photo_key
created_at
updated_at
```

## Operasi

### Create

Administrator dapat membuat player baru.

Server harus melakukan validasi sebelum insert.

### Read

Administrator dapat:

- melihat list;
- melihat detail.

### Update

Administrator dapat:

- mengubah informasi;
- mengubah status.

### Delete

Delete harus membutuhkan konfirmasi administrator.

## Acceptance Criteria

- CRUD berfungsi.
- Required field divalidasi.
- Status hanya active/inactive.
- Tanggal lahir valid.
- KU tidak disimpan di database.
- Data hanya dapat diakses administrator.

---

# F05 — Player Profile Photo

## Tujuan

Mengelola foto profil pemain secara private.

## Aturan Penyimpanan

Binary image tidak disimpan di PostgreSQL.

Database hanya menyimpan:

```text
profile_photo_key
```

File disimpan pada private storage.

## Aturan Upload

Format yang diperbolehkan:

```text
JPEG
PNG
WebP
```

Ukuran maksimum harus ditentukan pada implementasi.

Validasi file tidak boleh hanya berdasarkan extension.

Storage key harus dibuat oleh aplikasi.

Nama file dari pengguna tidak boleh menentukan path penyimpanan.

Path traversal harus dicegah.

## Operasi

- Upload.
- Replace.
- Remove.
- Protected retrieval.

## Acceptance Criteria

- Foto hanya dapat diakses administrator.
- File invalid ditolak.
- File terlalu besar ditolak.
- Replace tidak meninggalkan file lama jika dapat dihindari.
- Remove menghapus atau menginvalidasi asset.
- Tidak ada public player photo URL.

---

# F06 — Player Search & Filter

## Search

Search berdasarkan:

```text
full_name
```

## Filter

Filter berdasarkan:

```text
status
birth_year / KU
```

Birth year/KU harus diturunkan dari:

```text
date_of_birth
```

Tidak boleh menggunakan field database:

```text
ku
age_group
birth_year
```

untuk menyimpan data turunan tersebut.

---

# F07 — Coach Management

## Data

```text
full_name
phone
address
status
created_at
updated_at
```

## Operasi

- Create.
- Read.
- Update.
- Delete.
- Change status.

## Acceptance Criteria

- CRUD berjalan.
- Status hanya active/inactive.
- Required field divalidasi.
- Delete membutuhkan konfirmasi.
- Data hanya dapat diakses administrator.

---

# F08 — Coach Search & Filter

## Search

```text
full_name
```

## Filter

```text
status
```

Search dan filter hanya dapat digunakan oleh administrator.

---

# F09 — Security & Hardening

## Authentication

Semua operasi protected harus melakukan authentication check.

## Database

- Credential database hanya berada di server.
- Browser tidak boleh mengakses PostgreSQL secara langsung.
- Query menggunakan mekanisme parameterized.
- User input tidak boleh membentuk query melalui string concatenation.
- Database credentials tidak boleh masuk repository.

## Input Validation

Validasi:

- Required fields.
- Type.
- String length.
- Date.
- Status.
- Playing position.
- Phone.
- File type.
- File size.

Client-side validation tidak menggantikan server-side validation.

## Web Security

Implementasi harus memperhatikan:

- SQL injection.
- XSS.
- CSRF jika relevan.
- Broken authentication.
- Broken access control.
- Session theft/fixation.
- Malicious file upload.
- Path traversal.
- Information leakage.
- Abuse terhadap endpoint authentication.

## Error Handling

Production error tidak boleh mengungkap:

- SQL query.
- Database credential.
- Stack trace sensitif.
- Internal filesystem path.
- Authentication secret.
- Environment variable.
- Infrastruktur internal.

---

# 9. Database

## players

```text
id
full_name
place_of_birth
date_of_birth
address
playing_position
parent_name
parent_phone
join_date
status
profile_photo_key
created_at
updated_at
```

## coaches

```text
id
full_name
phone
address
status
created_at
updated_at
```

## Relationship

Tidak ada relationship:

```text
players ↔ coaches
```

Tidak ada foreign key antara keduanya.

---

# 10. Konvensi Database

Database identifier menggunakan bahasa Inggris.

Table:

```text
players
coaches
```

Column:

```text
full_name
date_of_birth
parent_name
parent_phone
join_date
profile_photo_key
created_at
updated_at
```

Naming convention:

- Table → plural snake_case.
- Column → snake_case.

Bahasa Indonesia hanya digunakan pada UI jika diperlukan.

---

# 11. Technology Direction

Teknologi awal:

```text
Full-stack framework : TanStack Start
Database              : PostgreSQL
ORM                   : Drizzle ORM
```

Aplikasi harus tetap menjadi satu full-stack application.

Jangan membuat separate API service tanpa requirement yang jelas.

Authentication implementation, storage provider, deployment platform, dan infrastructure merupakan keputusan implementasi yang harus memenuhi requirement keamanan PRD.

---

# 12. Navigation

```text
Login
  │
  ▼
Dashboard
  │
  ├── Players
  │     ├── Player List
  │     ├── Add Player
  │     ├── Player Detail
  │     └── Edit Player
  │
  ├── Coaches
  │     ├── Coach List
  │     ├── Add Coach
  │     ├── Coach Detail
  │     └── Edit Coach
  │
  └── Logout
```

---

# 13. Testing Requirement

Setiap feature yang memiliki business logic harus memiliki pengujian yang sesuai.

Minimal pengujian mencakup:

### Happy Path

Fitur bekerja sesuai requirement.

### Validation

Input invalid ditolak.

### Authorization

User tanpa authentication tidak dapat mengakses protected operation.

### Edge Case

Kondisi batas yang relevan harus diuji.

### Regression

Implementasi feature baru tidak boleh merusak feature sebelumnya.

---

# 14. Definition of Done

Sebuah feature dianggap selesai apabila:

1. Requirement feature telah diimplementasikan.
2. Tidak ada feature di luar scope yang ikut dibuat.
3. Server-side validation tersedia.
4. Authorization sesuai requirement.
5. Error handling sesuai.
6. Test yang relevan tersedia.
7. Test berhasil dijalankan.
8. Tidak terdapat regression pada feature sebelumnya.
9. Tidak terdapat secret yang masuk source code.
10. Perubahan kode dapat dijelaskan.
11. File yang berubah terdokumentasi.
12. Feature dapat digunakan sesuai acceptance criteria.

---

# 15. Aturan Pengembangan untuk AI Coding Agent

Bagian ini WAJIB dibaca sebelum melakukan coding.

## Rule 1 — Satu Feature dalam Satu Task

AI hanya boleh mengerjakan feature yang disebutkan dalam instruksi.

Contoh:

```text
Implementasikan F04.
```

Berarti hanya:

```text
F04 — Player Management
```

Tidak boleh otomatis mengimplementasikan F05, F06, F07, dan seterusnya.

---

## Rule 2 — Jangan Berasumsi Requirement

Jika requirement ambigu dan keputusan tersebut memengaruhi:

- database;
- security;
- architecture;
- business logic;

AI harus meminta klarifikasi sebelum coding.

---

## Rule 3 — Inspect Sebelum Modify

Sebelum mengubah kode:

1. Baca struktur project.
2. Identifikasi architecture.
3. Cari reusable component.
4. Cari utility yang sudah tersedia.
5. Periksa database schema.
6. Periksa existing route.
7. Periksa existing test.

Jangan membuat implementasi baru apabila functionality yang dibutuhkan sudah tersedia.

---

## Rule 4 — Jangan Refactor Tanpa Alasan

AI tidak boleh melakukan refactoring besar terhadap kode yang tidak berkaitan dengan feature yang sedang dikerjakan.

---

## Rule 5 — Jangan Membuat Fitur Masa Depan

Jangan membuat:

- endpoint yang belum dibutuhkan;
- tabel yang belum dibutuhkan;
- component yang belum dibutuhkan;
- abstraction yang belum dibutuhkan;
- module future feature;
- placeholder feature.

Implementasikan kebutuhan saat ini saja.

---

## Rule 6 — Security Tidak Boleh Hanya di Client

Client-side protection bukan pengganti server-side authorization.

Semua protected operation harus diverifikasi di server.

---

## Rule 7 — Setelah Coding Jangan Lanjut Otomatis

Setelah feature selesai:

AI harus berhenti dan memberikan:

```text
## Feature Completed

Feature:
FXX — ...

## File Changed

- ...
- ...

## Implementation

- ...
- ...

## Tests

- ...
- ...

## Result

PASS / FAIL

## Known Issues

- ...

## Scope Check

Feature di luar scope:
NONE / ...

## Next Suggested Feature

FXX — ...
```

AI tidak boleh langsung mengerjakan next feature.

---

# 16. Definition of Version 1 Complete

Version 1 dianggap selesai apabila:

- Administrator dapat login dan logout secara aman.
- Unauthenticated request tidak dapat mengakses data administratif.
- Player CRUD tersedia.
- Player search/filter tersedia.
- Player photo dapat dikelola secara private.
- Coach CRUD tersedia.
- Coach search/filter tersedia.
- Dashboard menampilkan statistik.
- KU dapat ditampilkan berdasarkan tanggal lahir.
- KU tidak disimpan sebagai duplicate database field.
- Data tidak lagi membutuhkan Excel untuk operasi CRUD rutin.
- Input tidak dapat memanipulasi struktur query.
- Production error tidak membocorkan informasi sensitif.
- Aplikasi tetap fokus pada administrasi player dan coach.

---

# 17. Prinsip Utama Produk

Versi pertama SSB MUNDINGLAYA harus mengikuti prinsip:

> **Sederhana, aman, terpusat, dan fokus pada administrasi pemain serta pelatih.**

Jangan memperluas domain sebelum kebutuhan bisnis baru didefinisikan secara eksplisit.

---

# 18. Performance Requirements

Performance merupakan salah satu non-functional requirement utama aplikasi.

Aplikasi harus dirancang agar tetap responsif pada kondisi penggunaan normal dan tetap memiliki performa yang baik ketika jumlah data meningkat.

Performance tidak boleh hanya dioptimalkan setelah aplikasi selesai dibuat.

Setiap feature harus mempertimbangkan:

- Database performance.
- Server response time.
- Network payload.
- Client rendering.
- Bundle size.
- Image loading.
- Query efficiency.
- Scalability.
- Caching jika relevan.

---

# 18.1 Performance Principles

Implementasi harus mengikuti prinsip:

```text
Measure before optimizing.
Avoid unnecessary work.
Fetch only required data.
Query only required records.
Minimize network payload.
Minimize client-side JavaScript.
Use database capabilities appropriately.
Keep rendering efficient.
Optimize assets.
```

Jangan melakukan premature optimization yang menambah kompleksitas tanpa manfaat yang jelas.

Namun, pola implementasi yang jelas-jelas tidak scalable harus dihindari.

---

# 18.2 Database Performance

Database query harus dirancang agar efisien.

## Pagination

List data tidak boleh mengambil seluruh record sekaligus.

Player list dan coach list harus menggunakan pagination.

Contoh konsep:

```text
page
page_size
```

atau cursor-based pagination jika diperlukan.

Default page size harus dibatasi.

AI tidak boleh membuat endpoint yang mengambil seluruh data player atau coach tanpa pagination kecuali untuk kebutuhan internal yang jelas dan datanya memang terbatas.

---

# 18.3 Query Scope

Query harus mengambil hanya kolom yang diperlukan.

Hindari:

```text
SELECT *
```

untuk endpoint yang hanya membutuhkan sebagian data.

Contoh player list tidak harus mengambil seluruh informasi detail player apabila UI hanya membutuhkan:

```text
id
full_name
date_of_birth
playing_position
status
profile_photo_key
```

Detail player dapat mengambil data lengkap ketika halaman detail dibuka.

---

# 18.4 Database Indexing

Index database harus dibuat berdasarkan pola query yang benar-benar digunakan aplikasi.

Minimal evaluasi index untuk:

```text
players.status
players.full_name
players.date_of_birth

coaches.status
coaches.full_name
```

Namun index tidak boleh dibuat secara membabi buta.

Setiap index harus memiliki alasan berdasarkan:

- search;
- filtering;
- sorting;
- uniqueness;
- foreign key jika ada pada masa depan.

Index tambahan harus dipertimbangkan berdasarkan query pattern dan hasil pengukuran.

---

# 18.5 Search Performance

Search player dan coach harus tetap efisien ketika jumlah record meningkat.

Search tidak boleh menyebabkan:

```text
load seluruh database
→ kirim seluruh data ke browser
→ filter menggunakan JavaScript
```

Filtering harus dilakukan pada server/database.

Untuk pencarian nama, implementasi harus mempertimbangkan kemampuan PostgreSQL dan index yang sesuai apabila dataset berkembang.

---

# 18.6 Dashboard Performance

Dashboard tidak boleh melakukan query yang tidak diperlukan.

Statistik:

```text
Total Players
Active Players
Inactive Players
Total Coaches
Active Coaches
Inactive Coaches
```

harus diperoleh dengan query yang efisien.

Jangan mengambil seluruh record player atau coach ke application memory hanya untuk menghitung jumlah.

Hindari pola:

```text
SELECT all players
→ JavaScript count()
```

Gunakan aggregation pada database apabila sesuai.

---

# 18.7 Server Performance

Business logic dan database operation yang sensitif terhadap latency harus tetap berada di server.

TanStack Start Server Functions dapat digunakan untuk operasi server-side yang membutuhkan database atau server-only capability.

Jangan memindahkan data dalam jumlah besar ke client hanya untuk melakukan processing yang dapat dilakukan di server.

---

# 18.8 Client Performance

Frontend harus menghindari JavaScript yang tidak diperlukan.

Prinsip:

- Jangan mengirim data yang tidak digunakan.
- Jangan membuat component terlalu kompleks.
- Hindari unnecessary re-render.
- Hindari duplicate data fetching.
- Gunakan route/data loading mechanism yang sesuai.
- Gunakan pending state untuk operasi asynchronous.
- Gunakan lazy loading untuk asset atau component berat jika memang diperlukan.

TanStack Start mendukung SSR dan streaming, sehingga kemampuan tersebut dapat digunakan apabila memberikan manfaat nyata terhadap rendering dan perceived performance.

---

# 18.9 Image Performance

Player profile photo harus dioptimalkan.

Requirements:

- Batasi ukuran upload.
- Batasi dimensi image jika diperlukan.
- Gunakan format modern seperti WebP jika sesuai.
- Hindari mengirim image dengan resolusi jauh lebih besar daripada kebutuhan UI.
- Thumbnail/list view sebaiknya tidak selalu mengambil image resolusi penuh.
- Image detail dapat menggunakan ukuran yang lebih besar jika diperlukan.

Original/private asset dan display asset dapat dipisahkan jika diperlukan.

Jangan melakukan image processing berat pada setiap request jika hasilnya dapat diproses dan disimpan/cache sebelumnya.

---

# 18.10 Network Performance

Response API/server function harus membawa data minimum yang diperlukan.

Hindari:

```text
database
→ seluruh record
→ server
→ seluruh record
→ browser
→ browser filtering
```

Gunakan:

```text
database
→ filtered/paginated result
→ server
→ minimal payload
→ browser
```

---

# 18.11 Caching

Caching boleh digunakan jika memberikan manfaat nyata.

Caching dapat dipertimbangkan untuk:

- data dashboard yang tidak berubah setiap detik;
- asset image;
- data yang sering dibaca dan jarang berubah;
- hasil query tertentu.

Namun, data administratif yang berubah harus mempertimbangkan cache invalidation.

Jangan menambahkan caching hanya karena dianggap "lebih cepat".

Setiap caching strategy harus menjelaskan:

```text
What is cached?
How long?
When is it invalidated?
What happens after update?
```

---

# 18.12 Performance Budget

Aplikasi harus memiliki target performance yang dapat diukur.

Target awal:

### Initial Page Load

Pada environment production yang wajar:

```text
Dashboard:
Target perceived initial render ≤ 2 seconds

Player List:
Target initial usable render ≤ 2 seconds

Coach List:
Target initial usable render ≤ 2 seconds
```

Angka tersebut merupakan target engineering, bukan jaminan terhadap semua kondisi jaringan/perangkat.

---

# 18.13 Server Response Target

Untuk operasi CRUD sederhana dalam kondisi normal:

```text
Target server response:
p95 ≤ 500 ms
```

Target ini berlaku untuk application/server processing dan database operation dalam environment production yang wajar, tidak termasuk kondisi jaringan client yang buruk.

Jika target tidak tercapai, lakukan profiling untuk menentukan bottleneck.

---

# 18.14 Large Dataset Requirement

Aplikasi harus tetap dapat digunakan ketika data berkembang.

Target pengujian awal:

```text
Players:
≥ 10,000 records

Coaches:
≥ 1,000 records
```

Dataset tersebut digunakan untuk menguji:

- List performance.
- Search.
- Filtering.
- Pagination.
- Dashboard statistics.
- CRUD.

Aplikasi tidak boleh mengandalkan asumsi bahwa jumlah player selalu kecil.

---

# 18.15 Performance Testing

Feature yang berkaitan dengan data harus diuji menggunakan dataset yang representatif.

Minimal test:

```text
Player list dengan 10,000 records
Player search dengan 10,000 records
Player filtering dengan 10,000 records
Coach list dengan 1,000 records
Dashboard aggregation dengan dataset tersebut
```

Uji juga:

- database query time;
- server response time;
- payload size;
- rendering behaviour.

---

# 18.16 Performance Regression

Feature baru tidak boleh menyebabkan regression performance yang signifikan.

Sebelum dan sesudah perubahan, evaluasi jika feature tersebut memengaruhi:

- database query;
- list rendering;
- bundle size;
- network payload;
- server latency.

---

# 18.17 Performance Anti-Patterns

AI dilarang membuat implementasi seperti:

```text
1. Mengambil seluruh player ke browser lalu melakukan search di client.
2. Mengambil seluruh player hanya untuk menghitung statistik.
3. SELECT * jika hanya beberapa kolom dibutuhkan.
4. Mengirim image original berukuran besar untuk thumbnail.
5. Melakukan N+1 database query.
6. Melakukan request berulang yang sebenarnya dapat digabung.
7. Membuat polling tanpa requirement.
8. Menambahkan library besar untuk kebutuhan sederhana.
9. Membuat cache tanpa invalidation strategy.
10. Menambahkan index tanpa query/use-case yang jelas.
11. Menggunakan debounce/throttle secara asal tanpa memahami kebutuhan interaksi.
12. Memindahkan seluruh data ke client untuk mengurangi query server.
```

---

# 18.18 Performance Definition of Done

Feature yang berkaitan dengan data dianggap selesai apabila:

- Query hanya mengambil data yang diperlukan.
- Pagination diterapkan untuk collection/list.
- Filtering dilakukan pada server/database.
- Tidak terdapat N+1 query.
- Payload tidak membawa data yang tidak diperlukan.
- Image tidak dikirim dalam ukuran yang tidak perlu.
- Test relevan telah dijalankan.
- Tidak terdapat performance regression yang signifikan.
- Bottleneck yang diketahui telah didokumentasikan.

---

# 19. Performance Monitoring

Production application sebaiknya memiliki kemampuan untuk mengidentifikasi:

- Request latency.
- Error rate.
- Database query latency.
- Resource usage.
- Slow query.
- Failed request.

Logging tidak boleh memasukkan:

- password;
- authentication secret;
- database credential;
- sensitive player information yang tidak diperlukan.

Performance monitoring harus menjaga prinsip privacy.
