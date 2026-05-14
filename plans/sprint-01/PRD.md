# FINAL PRD — MedProof
### Platform Rekam Medis Pribadi Berbasis AI & Blockchain
**Versi:** 1.0.0 (MVP)
**Status:** Final — Ready for Development
**Terakhir Diperbarui:** Mei 2026
**Blockchain Network:** Polygon Amoy Testnet

---

## 1. Ringkasan Eksekutif

MedProof adalah platform pelacakan dan pengelolaan riwayat kesehatan pribadi berbasis web yang menempatkan pasien sebagai pemilik sah atas seluruh data medis mereka sendiri (*self-sovereignty*). Platform ini menggabungkan tiga lapisan teknologi utama: **AI conversational** untuk pencatatan keluhan harian secara natural, **sistem akses berbasis izin granular** yang memberikan kontrol penuh kepada pasien atas siapa yang dapat melihat datanya dan berapa lama, serta **blockchain layer (Polygon Amoy)** sebagai lapisan verifikasi integritas yang tamper-proof — bukan sebagai media penyimpanan data medis.

**Tagline:** *Your health data. Your proof.*

**Masalah yang Diselesaikan:**

1. **Data tersentralisasi di pihak ketiga:** Platform kesehatan seperti SATU SEHAT menyimpan data di server Kementerian Kesehatan, sementara Halodoc dan Alodokter di server perusahaan swasta. Pengguna seringkali tidak mengetahui siapa yang mengakses datanya, kapan, dan untuk keperluan apa.
2. **Akses dokter tidak terkontrol pengguna:** Jika pasien berkonsultasi di platform terafiliasi, dokter lain di jaringan tersebut berpotensi membaca riwayat medis pasien tanpa persetujuan eksplisit per-dokter.
3. **Tidak ada tracking keluhan harian yang holistik:** Belum ada sistem tunggal yang menangkap keluhan naratif harian, pemantauan kesehatan mental, dan rekam medis formal dari dokter — dalam satu tempat yang aman dan terenkripsi.
4. **Riwayat medis tersebar:** Rekam medis tersebar di berbagai fasilitas kesehatan, menyulitkan pasien saat berpindah dokter atau memerlukan histori medis lengkap.
5. **Tidak ada jaminan integritas data:** Tidak ada mekanisme bagi pasien maupun dokter untuk memverifikasi bahwa data medis belum pernah dimanipulasi secara diam-diam.

**Solusi MedProof:**
- Data medis disimpan secara terenkripsi (AES-256-GCM) di database off-chain.
- Blockchain (Polygon Amoy) hanya menyimpan *hash* dari data — bukan konten data itu sendiri — sebagai bukti integritas yang tidak dapat dipalsukan.
- Akses dokter bersifat time-limited, scope-granular, dan sepenuhnya dikendalikan oleh pasien.
- AI conversational memudahkan pencatatan kondisi harian tanpa mengisi form yang rumit.

---

## 2. User Roles

Platform MedProof memiliki **3 Role Pengguna** dengan hierarki akses yang ketat dan terdefinisi:

| Role | Deskripsi | Akses Data |
|---|---|---|
| **Patient (Pasien)** | Pemilik utama data. Mendaftar, berinteraksi dengan AI harian, dan mengelola izin akses dokter. | Full access ke seluruh data milik sendiri. Dapat memberikan dan mencabut akses dokter. |
| **Doctor (Dokter)** | Tenaga medis terverifikasi melalui proses KYC. Menganalisis data pasien yang sudah memberikan izin. | Hanya dapat mengakses data pasien setelah mendapat izin eksplisit dan dalam durasi yang ditetapkan pasien. Memiliki QR Code unik setelah disetujui. |
| **Medical Admin (Verifikator)** | Staf internal platform yang bertugas memverifikasi identitas dan legalitas dokter. | Hanya akses data administratif pendaftaran dokter. **Sama sekali tidak memiliki akses** ke data medis pasien — baik Scope 1 maupun Scope 2. |

---

## 3. Arsitektur Data — Data Scopes

Seluruh data kesehatan dibagi menjadi dua kategori (*scopes*) dengan aturan sumber data dan akses yang berbeda:

### Scope 1 — Verified Medical Data (Dokter-Driven)
- **Sumber:** Input eksklusif dari Dokter yang sudah terverifikasi dan memiliki akses aktif ke data pasien.
- **Contoh Data:** Hasil laboratorium, rontgen (paru-paru, jantung, tulang), diagnosis penyakit, resep obat, riwayat vaksin, riwayat tindakan medis (suntik, operasi, prosedur lainnya).
- **Aturan Akses:**
  - Pasien: **Read-only**. Dapat melihat, tidak dapat mengubah atau menghapus data yang diinput dokter.
  - Dokter: Dapat menambahkan data baru. Tidak dapat mengubah data yang sudah diinput oleh dokter lain sebelumnya.
  - Medical Admin: **Tidak memiliki akses sama sekali.**

### Scope 2 — Patient-Generated AI Data (Pasien-Driven)
- **Sumber:** Hasil ekstraksi dan strukturisasi otomatis oleh AI dari percakapan harian pasien.
- **Format Penyimpanan:** **Row-based** (bukan JSON blob), agar mudah di-*query* untuk pembuatan grafik, agregasi, dan analisis tren oleh RAG AI dokter.
- **Terdiri dari dua sub-tabel terpisah** yang dihubungkan via `session_id` dan dapat ditampilkan bersama di UI melalui `patient_id + log_date`.

#### Scope 2A — Data Kesehatan Mental (`scope_2_mental`)
| Field | Tipe | Keterangan |
|---|---|---|
| `log_id` | UUID PK | Primary key |
| `patient_id` | UUID FK | Referensi ke tabel patients |
| `session_id` | UUID FK | Referensi ke tabel ai_sessions |
| `log_date` | DATE | Tanggal check-in |
| `mood_score` | INT 1-10 NULLABLE | Skala mood, ditentukan AI dari analisis teks |
| `anxiety_level` | INT 1-10 NULLABLE | Skala kecemasan |
| `sleep_hours` | DECIMAL NULLABLE | Estimasi jam tidur |
| `trigger_notes` | TEXT NULLABLE | Teks singkat penyebab (contoh: "tugas numpuk") |
| `raw_quote` | TEXT NULLABLE | Kutipan asli ucapan pasien yang representatif |
| `is_emergency_flagged` | BOOLEAN DEFAULT FALSE | True jika AI mendeteksi indikasi krisis mental |
| `created_at` | TIMESTAMP | Waktu data tersimpan |

#### Scope 2B — Data Keluhan Fisik (`scope_2_physical`)
| Field | Tipe | Keterangan |
|---|---|---|
| `log_id` | UUID PK | Primary key |
| `patient_id` | UUID FK | Referensi ke tabel patients |
| `session_id` | UUID FK | Referensi ke tabel ai_sessions |
| `log_date` | DATE | Tanggal check-in |
| `symptom_type` | VARCHAR NULLABLE | Nama gejala (contoh: "sakit kepala", "demam", "mual") |
| `severity` | INT 1-10 NULLABLE | Tingkat keparahan, diestimasi AI dari deskripsi pasien |
| `body_location` | VARCHAR NULLABLE | Lokasi keluhan (contoh: "kepala", "dada kiri", "perut") |
| `duration_note` | TEXT NULLABLE | Durasi gejala (contoh: "sejak kemarin pagi") |
| `raw_quote` | TEXT NULLABLE | Kutipan asli ucapan pasien |
| `is_emergency_flagged` | BOOLEAN DEFAULT FALSE | True jika AI mendeteksi gejala yang mengkhawatirkan |
| `created_at` | TIMESTAMP | Waktu data tersimpan |

> **Catatan Nullable:** Pasien berinteraksi melalui percakapan bebas, bukan form terstruktur. AI mengekstrak data sebatas yang disebutkan pasien secara natural. Kolom yang tidak disebutkan dalam percakapan dibiarkan `NULL` — AI tidak mengarang data, tidak mengasumsikan, dan tidak memaksa pasien melengkapi semua field. Apabila AI menilai suatu informasi penting secara medis (misalnya: lokasi gejala atau durasi keluhan), AI diizinkan menanyakannya secara natural dalam alur percakapan — bukan sebagai interogasi, melainkan sebagai bagian dari dialog yang empatik.

> **Catatan Dual-Table:** Satu sesi chat dapat menghasilkan entri di kedua tabel sekaligus apabila pasien menyebutkan keluhan fisik dan kondisi mental dalam percakapan yang sama. Keduanya dihubungkan melalui `session_id` yang identik dan dapat di-*join* berdasarkan `patient_id + log_date` untuk ditampilkan bersama dalam timeline dokter.

**Aturan Akses Scope 2 (berlaku untuk 2A dan 2B):**
- Pasien: Full control (sebagai pemilik data).
- Dokter: Hanya dapat diakses setelah pasien memberikan izin yang mencakup Scope 2 (secara eksplisit terpisah dari izin Scope 1).
- Dokter **tidak dapat mengubah** data Scope 2 dalam kondisi apapun.
- Medical Admin: **Tidak memiliki akses sama sekali.**

---

## 4. Arsitektur Database (PostgreSQL)

### 4.1 Tabel Inti Pasien & Dokter

**`patients`**
```sql
patient_id      UUID PRIMARY KEY DEFAULT gen_random_uuid()
nama            VARCHAR(255) NOT NULL
email           VARCHAR(255) UNIQUE NOT NULL          -- identifier login utama
password_hash   TEXT NOT NULL
tanggal_lahir   DATE
profiling_data  JSONB                                 -- hasil Form Profiling AI
created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

**`doctors`**
```sql
doctor_id       UUID PRIMARY KEY DEFAULT gen_random_uuid()
nama            VARCHAR(255) NOT NULL
email           VARCHAR(255) UNIQUE NOT NULL
nomor_telepon   VARCHAR(20)
spesialisasi    VARCHAR(100)
status_akun     ENUM('pending', 'approved', 'rejected') DEFAULT 'pending'
dokumen_str_url TEXT                                  -- URL file STR yang di-upload
dokumen_sip_url TEXT                                  -- URL file SIP yang di-upload
dokumen_ktp_url TEXT                                  -- URL file KTP/identitas
verified_by     UUID REFERENCES medical_admins(admin_id)
verified_at     TIMESTAMP
qr_code_token   TEXT UNIQUE                           -- generate HANYA setelah status 'approved'
created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

**`medical_admins`**
```sql
admin_id        UUID PRIMARY KEY DEFAULT gen_random_uuid()
nama            VARCHAR(255) NOT NULL
email           VARCHAR(255) UNIQUE NOT NULL
password_hash   TEXT NOT NULL
created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### 4.2 Tabel Rekam Medis

**`scope_1_medical_records`**
```sql
record_id       UUID PRIMARY KEY DEFAULT gen_random_uuid()
patient_id      UUID NOT NULL REFERENCES patients(patient_id)
doctor_id       UUID NOT NULL REFERENCES doctors(doctor_id)
record_type     ENUM('lab', 'xray', 'diagnosis', 'prescription', 'vaccine', 'action', 'note')
title           VARCHAR(255) NOT NULL
description     TEXT
attachment_url  TEXT                                  -- URL file lampiran (hasil lab, dll.)
record_hash     TEXT NOT NULL                         -- SHA-256 hash dari payload record
blockchain_tx_hash TEXT                               -- hash transaksi Polygon Amoy
created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

**`scope_2_mental`**
*(lihat definisi lengkap di Bagian 3)*

**`scope_2_physical`**
*(lihat definisi lengkap di Bagian 3)*

**`ai_sessions`**
```sql
session_id      UUID PRIMARY KEY DEFAULT gen_random_uuid()
patient_id      UUID NOT NULL REFERENCES patients(patient_id)
session_title   VARCHAR(255)                          -- judul sesi, di-generate AI
summary_text    TEXT                                  -- rangkuman singkat sesi
created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at      TIMESTAMP
```

### 4.3 Tabel Manajemen Izin Akses

**`access_grants`** — *Tabel paling krusial dalam sistem*
```sql
grant_id        UUID PRIMARY KEY DEFAULT gen_random_uuid()
patient_id      UUID NOT NULL REFERENCES patients(patient_id)
doctor_id       UUID NOT NULL REFERENCES doctors(doctor_id)
scope_granted   ENUM('scope_1_only', 'scope_1_and_2') NOT NULL
can_download    BOOLEAN DEFAULT FALSE                 -- apakah dokter boleh download PDF
granted_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
expires_at      TIMESTAMP NOT NULL                   -- kunci utama timer akses
is_revoked      BOOLEAN DEFAULT FALSE                -- untuk pencabutan akses manual oleh pasien
revoked_at      TIMESTAMP
consent_hash    TEXT                                  -- SHA-256 hash dari payload consent
blockchain_tx_hash TEXT                               -- hash transaksi Polygon Amoy
```

**Logika Query Pengecekan Izin Akses (Backend Middleware):**
```sql
SELECT * FROM access_grants
WHERE doctor_id = '{doctor_id}'
  AND patient_id = '{patient_id}'
  AND expires_at > CURRENT_TIMESTAMP
  AND is_revoked = FALSE;
```
Jika hasil query **kosong** → Tolak akses (`403 Forbidden`). Jika ada baris → Lanjutkan pengambilan data sesuai `scope_granted`.

### 4.4 Tabel Audit Log

**`audit_logs`**
```sql
log_id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
actor_id            UUID NOT NULL               -- ID dokter atau pasien yang melakukan aksi
actor_role          ENUM('patient', 'doctor', 'admin') NOT NULL
action              VARCHAR(100) NOT NULL       -- contoh: 'VIEW_SCOPE_1', 'GRANT_ACCESS', 'REVOKE_ACCESS', 'INPUT_SCOPE_1'
target_type         VARCHAR(50)                 -- 'health_record', 'access_grant', dll.
target_id           UUID
patient_id          UUID REFERENCES patients(patient_id)
access_status       ENUM('ALLOWED', 'DENIED') NOT NULL
reason              TEXT                        -- alasan diizinkan atau ditolak
ip_address          INET
audit_event_hash    TEXT                        -- SHA-256 hash dari payload audit event
blockchain_tx_hash  TEXT                        -- hash transaksi Polygon Amoy
created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

---

## 5. Fitur & Alur Per Portal

---

### 5.1 Patient Portal

#### A. Alur Registrasi & Login Pasien

**Registrasi:**
1. Pasien mengakses halaman registrasi dan mengisi form: nama lengkap, email, password, konfirmasi password.
2. Sistem mengirimkan email verifikasi OTP ke alamat email yang didaftarkan.
3. Pasien memasukkan kode OTP untuk mengaktifkan akun.
4. Setelah verifikasi berhasil, pasien diarahkan ke **Form Profiling AI** (berlangsung sekali, hanya saat pertama kali login).

**Form Profiling AI** *(muncul satu kali setelah registrasi pertama)*:
Berbeda dari form konvensional, sesi ini berbentuk wawancara singkat oleh AI yang mengajukan pertanyaan secara natural:
- Dari mana mengenal platform MedProof?
- Usia dan tanggal lahir.
- Perasaan hari ini (skala atau pilihan bebas).
- Pekerjaan atau kesibukan saat ini.
- Deskripsi kondisi lingkungan sekitar dan gaya hidup umum.
- Riwayat penyakit yang sudah diketahui (jika ada dan bersedia berbagi).

Seluruh jawaban diproses oleh AI menjadi data profil terstruktur (`profiling_data` JSONB di tabel `patients`). Tujuannya agar AI dapat menyesuaikan gaya bahasa, nada respons, dan pendekatan conversational secara personal untuk setiap pasien.

**Login:**
- Pasien login menggunakan email dan password.
- Jika membutuhkan OTP, sistem mengirim kode verifikasi ke email terdaftar.

---

#### B. Dashboard Pasien

Dashboard pasien dirancang sebagai pusat kendali yang ringkas namun informatif. Komponen utama yang ditampilkan:

1. **Greeting & Status Harian:** Salam personal berdasarkan nama pasien dan waktu, disertai status check-in harian (sudah atau belum check-in hari ini).
2. **Streak Tracker / Kalender Check-in:** Visualisasi konsistensi pasien dalam melakukan check-in harian ke AI (contoh: streak 12 hari berturut-turut). Berfungsi sebagai motivasi gamifikasi ringan.
3. **CTA Card Utama:** Tombol atau kartu besar yang mencolok untuk langsung masuk ke halaman Chat AI — elemen paling penting di dashboard.
4. **Ringkasan Dua Panel:**
   - **Panel Kiri — Scope 1:** Ringkasan data medis dari dokter (diagnosis terakhir, hasil lab terbaru, obat aktif). Dapat diklik untuk melihat detail lengkap.
   - **Panel Kanan — Scope 2:** Ringkasan kondisi harian dari histori chat AI (mood score rata-rata 7 hari terakhir, keluhan fisik yang sering muncul).
5. **Status Akses Dokter Aktif:** Indikator yang menampilkan daftar dokter yang saat ini memiliki akses aktif beserta sisa waktu akses mereka (contoh: "Dr. Ahmad — Berakhir dalam 2 hari").
6. **Tombol Kelola Akses Dokter:** Akses cepat ke halaman manajemen izin akses dokter (scan QR, revoke akses, dll.).

---

#### C. Halaman Chat AI Pasien

**Layout:** Terinspirasi dari antarmuka ChatGPT — sidebar kiri (dapat disembunyikan) untuk histori sesi + area chat utama di sebelah kanan.

**Sidebar:** Menampilkan daftar histori sesi obrolan sebelumnya, mencantumkan judul sesi (di-generate AI) dan tanggal sesi.

**Area Chat Utama:**
- Pesan sambutan AI di bagian atas yang menampilkan rangkuman kondisi terakhir pasien secara personal. Contoh: *"Halo! Kemarin kamu cerita lagi capek banget karena deadline. Hari ini gimana kabarnya?"*
- Antarmuka chat bebas untuk menceritakan keluhan, kondisi mental, gejala fisik, atau sekadar bercerita tentang hari tersebut.
- AI tidak menghakimi, tidak memaksa, dan mendorong keterbukaan melalui pendekatan empatik.

**Mekanisme Perekaman Data (Backend, tidak terlihat oleh pasien):**
- AI menganalisis teks percakapan secara real-time dan mengekstraksi data terstruktur secara otomatis.
- Jika pasien menyebutkan perasaan, emosi, atau kondisi psikologis → AI mengisi `scope_2_mental`.
- Jika pasien menyebutkan gejala fisik (nyeri, demam, pusing, mual, dll.) → AI mengisi `scope_2_physical`.
- Jika keduanya disebutkan dalam satu sesi → kedua tabel diisi, dihubungkan melalui `session_id` yang sama.
- Kolom yang tidak disebutkan pasien dibiarkan `NULL` — AI tidak mengarang data.
- Di akhir sesi, AI menyampaikan rangkuman singkat kepada pasien mengenai apa yang dicatat hari ini.

---

#### D. Manajemen Akses Dokter (Patient Access Control)

Fitur ini memungkinkan pasien mengendalikan secara penuh siapa yang dapat mengakses data medisnya.

**Alur Memberikan Akses ke Dokter (via QR Code):**
1. Pasien membuka halaman "Kelola Akses Dokter" dari dashboard.
2. Pasien menekan tombol "Beri Akses Dokter Baru" dan membuka kamera untuk melakukan scan QR Code unik milik dokter.
3. Sistem menampilkan halaman konfirmasi yang berisi profil dokter (nama, spesialisasi) dan formulir pengaturan izin akses:
   - **Pilihan Scope:** Scope 1 saja, atau Scope 1 & 2.
   - **Durasi Akses:** 1 jam, 6 jam, 24 jam, 3 hari, 7 hari, atau kustom (input manual).
   - **Hak Unduh:** Centang apakah dokter diizinkan untuk mengunduh (download) data pasien dalam format PDF.
4. Pasien menekan tombol "Beri Akses" → sistem membuat entri baru di tabel `access_grants` dengan `expires_at` yang terhitung dari saat konfirmasi.
5. Hash dari payload consent (`consent_hash`) dikirimkan ke smart contract Polygon Amoy dan `blockchain_tx_hash` disimpan di tabel.

**Revoke Akses Manual oleh Pasien:**
- Pasien dapat mencabut akses dokter kapan saja sebelum waktu habis melalui dashboard.
- Sistem mengubah `is_revoked = TRUE` dan mencatat `revoked_at` di tabel `access_grants`.
- Aksi revoke juga dicatat di `audit_logs`.
- Setelah di-revoke, dokter yang mencoba mengakses data akan mendapat respons `403 Forbidden` dari middleware.

**Melihat Daftar Akses Aktif:**
- Pasien dapat melihat seluruh dokter yang saat ini memiliki akses aktif, termasuk: nama dokter, scope yang diberikan, sisa waktu akses, dan hak unduh.
- Pasien dapat melihat riwayat akses yang sudah berakhir atau sudah di-revoke.

---

### 5.2 Doctor Portal

#### A. Registrasi & Verifikasi Dokter (KYC)

1. Dokter mengisi form registrasi: nama lengkap, spesialisasi, nomor telepon, dan email.
2. Dokter meng-upload tiga dokumen wajib: **Foto STR (Surat Tanda Registrasi)**, **Foto SIP (Surat Izin Praktik)**, dan **Foto KTP/identitas resmi**.
3. Akun berhasil dibuat dengan `status_akun = 'pending'`. Seluruh fitur utama portal dikunci dan tidak dapat diakses.
4. Dokter diarahkan ke halaman status menunggu dengan pesan: *"Dokumen Anda sedang ditinjau oleh tim MedProof. Kami akan memberitahu Anda melalui email setelah proses verifikasi selesai."*
5. Setelah Medical Admin menyetujui:
   - `status_akun` diubah menjadi `'approved'`.
   - Sistem secara otomatis meng-generate `qr_code_token` unik untuk dokter tersebut.
   - Email notifikasi dikirimkan kepada dokter berisi konfirmasi persetujuan dan instruksi akses ke dashboard.

---

#### B. Dashboard Dokter

- **QR Code Unik Dokter:** Tampilan QR Code milik dokter yang harus ditunjukkan kepada pasien secara fisik atau digital agar pasien dapat melakukan scan dan memberikan akses. QR Code ini merepresentasikan `qr_code_token` yang tersimpan di database.
- **Daftar Pasien Aktif:** Menampilkan daftar pasien yang saat ini sudah memberikan akses dalam durasi yang masih berlaku, beserta indikator sisa waktu akses untuk setiap pasien.
- **Tidak ada fitur pencarian bebas:** Dokter **tidak dapat** mencari nama atau data pasien mana pun secara bebas. Ini adalah keamanan kritis untuk mencegah *data fishing* — dokter hanya dapat mengakses data pasien yang secara eksplisit telah memberikan izin.

---

#### C. Halaman Data Pasien (Akses Sementara)

Halaman ini hanya dapat dibuka setelah pasien melakukan scan QR Code dokter dan mengonfirmasi pemberian akses. Akses dibatasi oleh durasi yang ditetapkan pasien.

**Indikator Timer yang Terlihat Jelas:** Countdown waktu sisa akses yang diberikan pasien ditampilkan secara prominent di bagian atas halaman.

**Konten Halaman berdasarkan Scope yang Diberikan:**

*Panel Scope 1 (selalu tersedia jika akses diberikan):*
- Timeline kronologis data medis dari seluruh dokter sebelumnya yang pernah menginput data pasien ini.
- Setiap item timeline mencantumkan: judul tindakan/hasil, tipe record, nama dokter yang menginput, dan tanggal pencatatan.
- Attachment (file hasil lab, rontgen) dapat dilihat langsung di platform.
- Jika pasien mengizinkan `can_download = TRUE`, dokter dapat mengunduh data dalam format PDF.

*Panel Scope 2 (hanya muncul jika scope_granted = 'scope_1_and_2'):*
- Ringkasan keluhan harian dari percakapan AI pasien.
- Informasi: kapan pasien terakhir melakukan check-in, mood score rata-rata, gejala fisik yang sering dilaporkan.
- Data ditampilkan dalam format timeline yang terurut berdasarkan tanggal.

**Form Input Scope 1 oleh Dokter:**
- Formulir yang tersedia bagi dokter untuk menambahkan data medis baru hasil kunjungan atau konsultasi saat ini.
- Field yang tersedia: tipe record (lab, xray, diagnosis, prescription, vaccine, action, note), judul, deskripsi lengkap, dan opsi upload attachment.
- Saat dokter menyimpan data baru:
  1. Backend memvalidasi bahwa dokter memiliki akses aktif dan belum expired ke pasien tersebut.
  2. Data disimpan ke tabel `scope_1_medical_records`.
  3. SHA-256 hash dari payload record di-generate dan disimpan sebagai `record_hash`.
  4. Hash tersebut dikirimkan ke smart contract Polygon Amoy.
  5. `blockchain_tx_hash` dari respons Polygon disimpan di tabel.
  6. Aksi ini dicatat di `audit_logs`.

**Saat Waktu Akses Habis:** Layar data pasien secara otomatis terkunci. Dokter tidak dapat melihat data apapun. Dokter harus meminta pasien untuk memberikan akses baru — tidak ada mekanisme perpanjangan otomatis di sisi dokter.

---

#### D. RAG AI untuk Dokter (Retrieval-Augmented Generation)

Dokter dapat bertanya kepada AI mengenai kondisi dan riwayat pasien berdasarkan data Scope 2 yang tersimpan, selama akses masih aktif.

**Scope RAG AI MVP:** Text Q&A berbasis Scope 2 (scope_2_mental dan scope_2_physical).

**Contoh Query yang Dapat Dilakukan Dokter:**
- *"Kapan pertama kali pasien ini mulai mengeluhkan sakit kepala?"*
- *"Bagaimana tren mood pasien selama dua minggu terakhir?"*
- *"Apakah ada pola antara gangguan tidur dan keluhan mual pada pasien ini?"*
- *"Berapa kali pasien melaporkan demam dalam satu bulan terakhir?"*
- *"Apakah pernah ada hari dengan emergency flag pada pasien ini?"*

**Mekanisme Teknis (RAG):**
1. Dokter mengirim pertanyaan melalui antarmuka chat di halaman data pasien.
2. Backend terlebih dahulu memvalidasi bahwa dokter masih memiliki akses aktif.
3. Sistem melakukan retrieval data dari tabel `scope_2_mental` dan `scope_2_physical` berdasarkan `patient_id` dan rentang tanggal yang relevan.
4. Data yang di-retrieve dimasukkan sebagai konteks (augmented context) ke dalam prompt AI.
5. AI (Claude API) menghasilkan jawaban berdasarkan data nyata pasien — bukan asumsi atau pengetahuan umum semata.
6. Respons AI ditampilkan dalam antarmuka chat dokter.

**Batasan Penting:**
- RAG AI hanya mengakses Scope 2. Scope 1 tidak dimasukkan sebagai konteks RAG di MVP.
- AI tidak membuat diagnosis. Semua respons disertai disclaimer bahwa ini adalah ringkasan data pasien, bukan rekomendasi medis.
- Setiap sesi RAG AI dicatat di `audit_logs`.

---

### 5.3 Medical Admin Portal

#### A. Dashboard Admin — Antrian Verifikasi

- Menampilkan daftar seluruh pendaftar dokter baru dengan status `'pending'`.
- Setiap item dalam daftar menampilkan: nama dokter, spesialisasi, tanggal pendaftaran, dan thumbnail dari dokumen yang di-upload.
- Admin dapat melakukan filter berdasarkan: tanggal pendaftaran, spesialisasi, atau status.

#### B. Alur Verifikasi Dokter

1. Admin membuka halaman detail profil dokter dan memeriksa dokumen yang di-upload: STR, SIP, dan KTP.
2. Admin dapat melakukan *cross-check* manual ke situs resmi Konsil Kedokteran Indonesia (KKI) untuk memvalidasi nomor STR yang tercantum.
3. Admin mengambil keputusan:
   - **Approve:** `status_akun` diubah menjadi `'approved'`, sistem secara otomatis meng-generate `qr_code_token` unik untuk dokter, email notifikasi persetujuan dikirim.
   - **Reject:** `status_akun` diubah menjadi `'rejected'`, sistem mengirim email penolakan ke dokter beserta alasan penolakan yang diisi admin.

#### C. Pembatasan Akses Admin (Aturan Kritis)

Ini adalah *hard rule* yang tidak dapat dikompromikan dalam kondisi apapun:
- Admin **sama sekali tidak memiliki akses** ke data Scope 1 atau Scope 2 pasien mana pun.
- Dashboard Admin hanya menampilkan data administratif terkait proses pendaftaran dokter.
- Pembatasan ini diimplementasikan di tiga lapisan:
  1. **Level UI:** Dashboard admin tidak memiliki navigasi atau halaman apapun yang terkait data pasien.
  2. **Level Backend Middleware:** Setiap request yang mengandung `patient_id` dari token admin akan langsung ditolak dengan `403 Forbidden`.
  3. **Level Database:** Row-Level Security (RLS) di PostgreSQL dikonfigurasi sehingga query dari session admin tidak dapat me-return baris dari tabel `patients`, `scope_1_medical_records`, `scope_2_mental`, `scope_2_physical`, atau `ai_sessions`.

---

## 6. Arsitektur Keamanan

### 6.1 Enkripsi Data

- **Standar Enkripsi:** AES-256-GCM untuk data at-rest (data yang disimpan di database).
- **Transport Layer:** TLS 1.3 untuk seluruh komunikasi data in-transit antara client dan server.
- **Data yang dienkripsi:** Seluruh payload data medis (diagnosis, keluhan, hasil lab, catatan dokter) dienkripsi sebelum disimpan di database. Kolom yang dienkripsi menyimpan: ciphertext, IV (Initialization Vector), dan authentication tag.
- **Key Management:** Encryption key tidak disimpan bersama data di database yang sama. Dikelola secara terpisah menggunakan environment variable dan secret management service.
- **Prinsip:** Server/developer tidak memiliki akses ke plaintext data medis pasien.

### 6.2 Access Control

- **Backend Middleware:** Setiap endpoint yang mengakses data pasien harus melewati pemeriksaan tabel `access_grants` — memvalidasi `doctor_id`, `patient_id`, `expires_at > CURRENT_TIMESTAMP`, dan `is_revoked = FALSE`.
- **PostgreSQL Row-Level Security (RLS):** Lapisan keamanan di level database agar query tidak dapat melewati aturan akses meskipun terjadi kesalahan logika di backend.
- **JWT Authentication:** Setiap request yang terautentikasi menggunakan JWT token dengan informasi role dan user_id. Token memiliki masa berlaku terbatas.
- **Prinsip Least Privilege:** Setiap role hanya memiliki akses minimal yang diperlukan untuk menjalankan fungsinya.

### 6.3 Audit Trail

Setiap aksi yang melibatkan data sensitif dicatat secara permanen di tabel `audit_logs`. Aksi yang wajib diaudit meliputi:
- Setiap kali dokter membuka atau mencoba membuka data pasien (baik berhasil maupun ditolak).
- Setiap pemberian akses baru oleh pasien.
- Setiap pencabutan akses oleh pasien.
- Setiap penginputan data Scope 1 oleh dokter.
- Setiap sesi RAG AI yang dilakukan dokter.
- Setiap perubahan status akun di admin portal.

---

## 7. Blockchain Layer (Polygon Amoy Testnet)

### 7.1 Filosofi Blockchain di MedProof

Blockchain di MedProof bukan media penyimpanan data medis. Blockchain berperan sebagai **lapisan verifikasi integritas yang tamper-proof** — membuktikan bahwa data yang tersimpan di database belum pernah dimanipulasi secara diam-diam, tanpa menyimpan konten data sensitif di-chain.

**Prinsip yang tidak dapat dilanggar:**
- Data medis mentah (nama pasien, NIK, diagnosis, resep, hasil lab, catatan dokter) **tidak boleh tersimpan on-chain** dalam kondisi apapun.
- Blockchain hanya menerima nilai *hash* yang tidak dapat di-reverse menjadi data aslinya.

### 7.2 Apa yang Disimpan On-Chain

Tiga kategori event yang dicatat ke Polygon Amoy Testnet:

**A. Record Hash (saat dokter menginput Scope 1)**
```json
{
  "event": "HealthRecordRegistered",
  "record_id": "HR-UUID",
  "patient_hash": "SHA256(patient_id)",
  "record_hash": "SHA256(encrypted_payload)",
  "issuer_hash": "SHA256(doctor_id)",
  "version": 1,
  "created_at": 1778322600
}
```

**B. Consent Hash (saat pasien memberikan atau mencabut akses dokter)**
```json
{
  "event": "ConsentGranted / ConsentRevoked",
  "consent_hash": "SHA256(grant_id + patient_id + doctor_id + scope + expires_at)",
  "patient_hash": "SHA256(patient_id)",
  "grantee_hash": "SHA256(doctor_id)",
  "scope_hash": "SHA256(scope_granted)",
  "expires_at": 1781049599,
  "created_at": 1778324400
}
```

**C. Audit Event Hash (saat aksi sensitif terjadi)**
```json
{
  "event": "AuditEventRecorded",
  "audit_event_hash": "SHA256(log_id + actor_id + action + target_id + created_at)",
  "actor_hash": "SHA256(actor_id)",
  "target_hash": "SHA256(target_id)",
  "action_hash": "SHA256(action)",
  "created_at": 1778325000
}
```

### 7.3 Smart Contract

Smart contract MedProof di-deploy ke **Polygon Amoy Testnet** menggunakan Solidity. Contract menyediakan tiga fungsi utama:

```solidity
// Fungsi untuk menyimpan hash record medis
function registerHealthRecord(
    string memory recordId,
    bytes32 patientHash,
    bytes32 recordHash,
    bytes32 issuerHash,
    uint256 version
) external;

// Fungsi untuk menyimpan hash consent
function recordConsent(
    bytes32 consentHash,
    bytes32 patientHash,
    bytes32 granteeHash,
    bytes32 scopeHash,
    uint256 expiresAt,
    bool isRevoked
) external;

// Fungsi untuk menyimpan hash audit event
function recordAuditEvent(
    bytes32 auditEventHash,
    bytes32 actorHash,
    bytes32 targetHash,
    bytes32 actionHash
) external;
```

### 7.4 Alur Verifikasi Integritas

Kapan saja diperlukan (misalnya saat dokter atau sistem ingin memverifikasi keaslian data):

1. Ambil `encrypted_payload` dari database untuk record tertentu.
2. Generate ulang SHA-256 hash dari payload tersebut.
3. Bandingkan hasil hash baru dengan `record_hash` yang tersimpan on-chain di Polygon Amoy.
4. Jika **sama** → data valid, tidak pernah dimodifikasi.
5. Jika **berbeda** → data telah dimanipulasi sejak terakhir di-hash. Sistem menampilkan peringatan integritas.

### 7.5 Perbandingan Data: Off-Chain vs On-Chain

| Jenis Data | Off-Chain (Database Encrypted) | On-Chain (Polygon Amoy) |
|---|---|---|
| Nama pasien | ✅ Disimpan terenkripsi | ❌ Tidak boleh |
| NIK / email | ✅ Disimpan terenkripsi | ❌ Tidak boleh |
| Diagnosis | ✅ Disimpan terenkripsi | ❌ Tidak boleh |
| Hasil lab / resep | ✅ Disimpan terenkripsi | ❌ Tidak boleh |
| Mood score / keluhan | ✅ Disimpan terenkripsi | ❌ Tidak boleh |
| Record hash | ✅ Disimpan sebagai referensi | ✅ Disimpan |
| Consent hash | ✅ Disimpan sebagai referensi | ✅ Disimpan |
| Audit event hash | ✅ Disimpan sebagai referensi | ✅ Disimpan |
| Blockchain tx hash | ✅ Disimpan sebagai referensi | N/A |

---

## 8. Arsitektur AI

### 8.1 AI untuk Pasien — Conversational & Extractor

**Mode:** AI companion conversational harian.

**Personalisasi:** AI membaca data profil dari `profiling_data` (JSONB di tabel `patients`) yang dihasilkan Form Profiling untuk menyesuaikan gaya bahasa (formal/santai), pendekatan (empatik/direktif), dan topik yang relevan untuk setiap pasien.

**Peran Ganda AI Pasien:**
- **Companion:** Mengajak pasien bercerita secara natural tanpa rasa dihakimi. AI merespons dengan empati dan tidak memaksakan pasien untuk mengungkap informasi tertentu.
- **Extractor (Background Process):** Secara otomatis menganalisis teks percakapan dan mengisi data ke dua tabel Scope 2 secara paralel berdasarkan konten yang disebutkan pasien.

**Logika Ekstraksi Dual-Table:**
- Jika pasien menyebutkan perasaan, emosi, kondisi psikologis, tingkat stres, atau kualitas tidur → AI mengisi `scope_2_mental`.
- Jika pasien menyebutkan gejala fisik (nyeri, demam, pusing, mual, sesak nafas, dll.) → AI mengisi `scope_2_physical`.
- Jika keduanya disebutkan dalam satu sesi → kedua tabel diisi, dihubungkan melalui `session_id` yang sama.
- Kolom yang tidak disebutkan oleh pasien secara eksplisit dibiarkan `NULL`.
- Jika AI menilai suatu informasi penting secara medis (misalnya: lokasi spesifik gejala, durasi keluhan), AI diizinkan menanyakannya secara natural dalam percakapan — bukan interogasi terstruktur.

**Di Akhir Sesi:** AI menyampaikan rangkuman singkat sesi kepada pasien, berisi poin-poin utama yang berhasil dicatat. Ini memberi transparansi kepada pasien tentang apa yang disimpan sistem.

### 8.2 AI untuk Dokter — RAG (Retrieval-Augmented Generation)

**Mode:** AI asisten medis berbasis data aktual pasien.

**Scope MVP:** Text Q&A dari data Scope 2 (scope_2_mental dan scope_2_physical).

**Cara Kerja RAG:**
1. Dokter mengetik pertanyaan dalam antarmuka chat di halaman data pasien.
2. Backend memvalidasi bahwa dokter masih memiliki akses aktif ke pasien tersebut.
3. Sistem melakukan data retrieval dari tabel Scope 2 berdasarkan `patient_id`.
4. Data yang relevan di-format menjadi konteks terstruktur dan dimasukkan ke dalam prompt AI.
5. Claude API menghasilkan respons berdasarkan konteks data nyata — bukan pengetahuan umum.
6. Respons ditampilkan kepada dokter disertai disclaimer medis.

**Disclaimer Wajib pada Setiap Respons RAG:**
> *"Informasi ini dihasilkan berdasarkan ringkasan percakapan harian pasien dengan AI MedProof dan bukan merupakan penilaian atau rekomendasi medis. Gunakan sebagai bahan asesmen awal, bukan sebagai basis diagnosis tunggal."*

---

## 9. Alur Lengkap Antar-Sistem (End-to-End Flow)

```
═══════════════════════════════════════════════════════════════
ALUR PASIEN
═══════════════════════════════════════════════════════════════

1. Registrasi
   Pasien isi form (nama, email, password)
   → Verifikasi OTP via email
   → Form Profiling AI (sekali saja)
   → Masuk Dashboard

2. Daily Check-in
   Pasien buka Chat AI
   → Bercerita bebas tentang kondisi hari ini
   → AI ekstrak data → simpan ke scope_2_mental + scope_2_physical
   → AI buat rangkuman sesi
   → Data session tersimpan di ai_sessions

3. Memberikan Akses ke Dokter
   Pasien scan QR Code dokter
   → Atur: scope + durasi + hak download
   → Tekan "Beri Akses"
   → System buat entri di access_grants (expires_at ter-set)
   → consent_hash di-generate → kirim ke Polygon Amoy
   → blockchain_tx_hash tersimpan

4. Memantau & Mencabut Akses
   Pasien lihat daftar akses aktif di dashboard
   → Pilih dokter yang ingin dicabut aksesnya
   → Tekan "Cabut Akses"
   → System set is_revoked = TRUE + revoked_at = NOW()
   → Aksi tercatat di audit_logs

═══════════════════════════════════════════════════════════════
ALUR DOKTER
═══════════════════════════════════════════════════════════════

1. Registrasi & KYC
   Dokter isi form + upload STR, SIP, KTP
   → status_akun = 'pending'
   → Tunggu verifikasi Medical Admin

2. Setelah Disetujui Admin
   → status_akun = 'approved'
   → qr_code_token ter-generate
   → Email notifikasi dikirim ke dokter
   → Dokter bisa akses dashboard

3. Mendapat Akses dari Pasien
   Dokter tampilkan QR Code ke pasien
   → Pasien scan → konfirmasi akses
   → Dokter muncul di daftar "Pasien Aktif"

4. Melihat & Menganalisis Data Pasien
   Dokter buka halaman data pasien
   → Backend cek access_grants (valid? belum expired? belum revoked?)
   → Jika valid: tampilkan data sesuai scope
   → Dokter bisa lihat Scope 1 + Scope 2 (sesuai izin)
   → Aksi dicatat di audit_logs + audit_event_hash → Polygon Amoy

5. Input Data Scope 1 Baru
   Dokter isi form input data medis
   → Backend validasi akses masih aktif
   → Data disimpan ke scope_1_medical_records
   → record_hash di-generate → kirim ke Polygon Amoy
   → blockchain_tx_hash tersimpan

6. Tanya RAG AI
   Dokter ketik pertanyaan di chat AI
   → Backend retrieve data Scope 2 pasien
   → AI jawab berdasarkan data aktual
   → Sesi RAG dicatat di audit_logs

7. Waktu Akses Habis
   expires_at terlewati → middleware otomatis tolak akses
   → Halaman data pasien terkunci
   → Dokter harus minta izin baru dari pasien

═══════════════════════════════════════════════════════════════
ALUR MEDICAL ADMIN
═══════════════════════════════════════════════════════════════

1. Menerima Antrean Pendaftaran Dokter
   Dokter baru mendaftar → status = 'pending'
   → Muncul di dashboard admin

2. Proses Verifikasi
   Admin buka detail dokter → periksa STR, SIP, KTP
   → Cross-check manual ke situs KKI jika diperlukan

3. Keputusan
   Approve → status = 'approved' → QR ter-generate → email dikirim
   Reject  → status = 'rejected' → email penolakan + alasan dikirim
```

---

## 10. Tech Stack (Final)

| Layer | Teknologi | Keterangan |
|---|---|---|
| **Frontend** | Next.js 14 (App Router) + TailwindCSS + shadcn/ui | SSR + client components; UI library untuk komponen yang konsisten |
| **State Management** | Zustand | State management ringan untuk session dan akses data |
| **Chat UI** | Vercel AI SDK | Streaming response real-time seperti ChatGPT |
| **Backend API** | Next.js API Routes (Route Handlers) | Tidak perlu server eksternal terpisah di MVP |
| **Database** | PostgreSQL via Supabase | Mature JSONB support, Row-Level Security, real-time sync |
| **ORM** | Prisma | Type-safe database access dengan full TypeScript support |
| **Auth** | NextAuth.js (Auth.js v5) | Session management, JWT, OTP via email |
| **Email / OTP** | Resend atau SendGrid | Pengiriman OTP verifikasi dan notifikasi via email |
| **AI Model** | Claude API (Anthropic) | Conversational AI pasien + RAG AI dokter; superior dalam konteks kesehatan dan anamnesis medis |
| **AI RAG** | LangChain atau LlamaIndex | Orkestrasi retrieval dan augmentation untuk RAG dokter |
| **File Storage** | Supabase Storage atau Cloudflare R2 | Upload dokumen STR/SIP/KTP dokter dan attachment rekam medis |
| **Enkripsi** | AES-256-GCM (at-rest) + TLS 1.3 (in-transit) | Standar enkripsi industri untuk data kesehatan |
| **Blockchain** | Solidity + Hardhat + Polygon Amoy Testnet | Smart contract untuk record hash, consent hash, audit event hash |
| **QR Code** | qrcode.js atau library serupa | Generate dan display QR Code dokter |
| **Hosting Frontend** | Vercel | Auto-deploy dari GitHub, edge functions, global CDN |
| **Hosting Backend/DB** | Supabase | Managed PostgreSQL + storage + auth dalam satu platform |

---

## 11. MVP Scope (Fitur yang Dibangun)

Berikut adalah daftar fitur yang **masuk dalam MVP** dan harus selesai dalam fase pengembangan pertama:

| No | Fitur | Portal | Status |
|---|---|---|---|
| 1 | Registrasi & Login Pasien (email + OTP) | Patient | MVP ✅ |
| 2 | Form Profiling AI (onboarding sekali) | Patient | MVP ✅ |
| 3 | Dashboard Pasien (ringkasan sederhana) | Patient | MVP ✅ |
| 4 | AI Chat Pasien (conversational + data extraction ke scope_2_mental & scope_2_physical) | Patient | MVP ✅ |
| 5 | Registrasi & KYC Dokter (upload STR, SIP, KTP) | Doctor | MVP ✅ |
| 6 | Medical Admin Portal (approval workflow) | Admin | MVP ✅ |
| 7 | QR Code Doctor + Access Grant System (timer + scope + can_download) | Doctor + Patient | MVP ✅ |
| 8 | Patient Data View untuk Dokter (Scope 1 & Scope 2) | Doctor | MVP ✅ |
| 9 | Input Scope 1 oleh Dokter (dengan record_hash → Polygon Amoy) | Doctor | MVP ✅ |
| 10 | Revoke Access Manual oleh Pasien | Patient | MVP ✅ |
| 11 | RAG AI untuk Dokter (text Q&A dari Scope 2) | Doctor | MVP ✅ |
| 12 | Blockchain Layer (record hash + consent hash + audit event hash → Polygon Amoy) | System | MVP ✅ |

### Fitur yang TIDAK Masuk MVP (Future Releases)

| Fitur | Target Fase |
|---|---|
| Emergency SOS Detection di Chat AI | Fase 2 |
| Health Access Card (NFC + QR fisik mirip KTP) | Fase 2 |
| Break-Glass Protocol (akses IGD darurat) | Fase 2 |
| AI Chart Generation / Function Calling di Doctor Portal | Fase 2 |
| Request Extension Akses oleh Dokter | Fase 2 |
| NIK-based Emergency Search | Fase 2 |
| Notifikasi Push (Web Push API) | Fase 2 |
| Mobile App (Android / iOS) | Fase 3 |
| Zero-Knowledge Encryption (client-side) | Fase 3 |
| Integrasi API SATUSEHAT | Fase 4 |
| Integrasi API KKI (verifikasi STR otomatis) | Fase 4 |
| Predictive Health Insight AI | Fase 4 |
| Ekspor standar FHIR R4 | Fase 5 |

---

## 12. Keputusan Desain (Design Decisions)

| Keputusan | Pilihan yang Diambil | Alasan |
|---|---|---|
| Identifier login pasien | **Email** | Lebih familiar untuk target pengguna tech-savvy; tidak perlu integrasi SMS gateway di MVP |
| Format penyimpanan Scope 2 | **Dual-table row-based** (scope_2_mental + scope_2_physical terpisah) | Query lebih cepat untuk agregasi tren; mudah di-join berdasarkan session_id; lebih scalable untuk future chart generation |
| Blockchain network | **Polygon Amoy Testnet** | Gas fee rendah; kompatibel EVM; cocok untuk prototype/lomba; mudah di-upgrade ke Polygon mainnet |
| Data yang disimpan on-chain | **Hanya hash** (record + consent + audit event) | Mematuhi prinsip privacy; data medis tidak bisa di-reverse dari hash; compliant dengan UU PDP |
| Verifikasi dokter | **Manual via Medical Admin** | Lebih pragmatis untuk MVP; menghindari birokrasi API KKI di fase awal |
| RAG AI scope | **Text Q&A dari Scope 2 saja** | Lebih fokus dan feasible untuk MVP; chart generation ditunda ke Fase 2 |
| Emergency SOS | **Tidak masuk MVP** | Perlu desain UX dan compliance yang matang; akan dibangun dengan benar di Fase 2 |
| Can download oleh dokter | **Masuk MVP** | Kebutuhan nyata dokter untuk arsip; dikendalikan oleh pilihan pasien saat memberikan akses |
| Access control enforcement | **3 lapisan: UI + Middleware + RLS PostgreSQL** | Defense in depth; satu lapisan gagal tidak membuka akses ilegal |
| Enkripsi | **AES-256-GCM server-side** | Pragmatis untuk MVP; Zero-Knowledge (client-side) direncanakan di Fase 3 |

---

## 13. Pertimbangan Regulasi & Kepatuhan

MedProof dibangun dengan kesadaran terhadap regulasi yang berlaku di Indonesia:

1. **UU PDP (Undang-Undang Perlindungan Data Pribadi):** Data kesehatan termasuk data pribadi spesifik yang memerlukan persetujuan eksplisit untuk diproses. Mekanisme consent granular MedProof (scope, durasi, hak download) secara langsung mengimplementasikan prinsip ini.
2. **Permenkes No. 24 Tahun 2022 tentang Rekam Medis Elektronik:** Mengatur prinsip kerahasiaan, integritas, dan ketersediaan rekam medis. MedProof menerapkan enkripsi (kerahasiaan), blockchain hash verification (integritas), dan arsitektur cloud yang reliable (ketersediaan).
3. **Prinsip Right to Erasure:** Pasien memiliki hak untuk meminta penghapusan data (direncanakan di Fase 2 sebagai fitur "Right to Delete"). Di sisi blockchain, hanya hash yang tersimpan on-chain — bukan data asli — sehingga penghapusan data off-chain sudah memadai tanpa perlu memodifikasi blockchain yang immutable.

**Disclaimer Penting:**
MedProof MVP tidak mengklaim sebagai sistem Rekam Medis Elektronik yang sepenuhnya terintegrasi dengan ekosistem SATUSEHAT atau memenuhi seluruh persyaratan sertifikasi Kementerian Kesehatan. Platform ini dirancang sebagai sistem pengelolaan data kesehatan pribadi berbasis consent yang melengkapi — bukan menggantikan — sistem rekam medis resmi fasilitas kesehatan.

---

*PRD ini disusun berdasarkan merger dari tiga dokumen PRD (Rannga, Cenna, Niefa) dengan prinsip mengambil konten terbaik pada setiap bagian yang overlap. Seluruh keputusan teknis dan scope MVP telah dikonfirmasi dan disepakati. Versi ini siap digunakan sebagai referensi utama untuk development planning, sprint breakdown, dan presentasi produk.*
