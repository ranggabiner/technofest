# MedProof — Questions & Answers

## 1. Kenapa harus Amoy (Polygon)?

Karena network ini adalah network yang paling feasible untuk membuktikan konsep **tamper-proof medical audit trail** dalam waktu lomba, dengan biaya rendah, tooling mudah, dan jalan upgrade yang masuk akal.

Intinya, **Polygon Amoy** cukup ideal untuk MVP lomba.

---

## 2. Self-sovereignty apa?

**Self-sovereignty** adalah konsep bahwa user adalah pemilik dan pengendali utama atas data dirinya sendiri, bukan platform, rumah sakit, dokter, atau perusahaan.

Dalam konteks **MedProof**, maksudnya: pasien punya kendali penuh atas data medisnya, yaitu:

1. Siapa yang boleh akses.
2. Data bagian mana yang boleh dilihat.
3. Berapa lama akses berlaku.
4. Kapan akses itu dicabut.

---

## 3. Maksud izin granular apa?

**Izin granular** berarti user bisa memilih bagian data apa saja yang boleh diakses, bukan memberikan akses keseluruhan.

Kebalikannya adalah pendekatan **all-or-nothing**.

Intinya, izin granular itu lebih detail, spesifik, dan bisa dikontrol per bagian.

---

## 4. Maksud tamper-proof apa?

**Tamper-proof** adalah mekanisme yang digunakan agar data sulit dipalsukan, diubah diam-diam, atau dihapus tanpa meninggalkan jejak.

Contoh sederhana:

1. Segel botol. Kalau dibuka, bekasnya akan terlihat.
2. Sistem log yang datanya tidak bisa diam-diam dihapus atau dimodifikasi.

Dalam konteks MedProof, **tamper-proof** berarti sistem dapat membuktikan bahwa suatu data atau aktivitas tidak diubah setelah dicatat.

---

## 5. Title dan tagline saat ini belum merepresentasikan Scope 1 dan Scope 2

Title dan tagline saat ini masih belum merepresentasikan **Scope 1** dan **Scope 2** secara penuh. Tagline saat ini cenderung hanya merepresentasikan Scope 1 saja.

Tagline saat ini:

> Secure by blockchain. Smart with AI.

Catatan:

Tagline tersebut sudah menyebut blockchain dan AI, tetapi masih perlu dipastikan bahwa narasinya benar-benar mencerminkan dua scope utama MedProof:

1. **Scope 1**: tamper-proof medical record dan consent/audit trail berbasis blockchain.
2. **Scope 2**: AI-based health journaling, extraction, summary, dan RAG support untuk dokter.

---

## 6. Pertimbangan masalah data tersentralisasi di pihak ketiga

Perlu dipertimbangkan kembali masalah yang dideklarasikan pada poin pertama, yaitu data tersentralisasi di pihak ketiga.

Hal ini penting karena pada konsep saat ini, **MedProof** juga berperan seperti pihak ketiga yang menyimpan data pada database sendiri. Blockchain hanya digunakan sebagai validation layer, bukan tempat penyimpanan data medis utama.

Kutipan masalah:

> Rekam medis pasien tersebar di berbagai rumah sakit dan tidak terpusat di tangan pasien sendiri.

Dari kutipan tersebut, masalah saat ini adalah data medis pasien belum terpusat di tangan pasien. Namun, sebenarnya data kesehatan di Indonesia sudah mulai terpusat di Kemenkes melalui ekosistem health data nasional.

Karena itu, framing masalah perlu diperjelas agar tidak terlihat seolah-olah MedProof menyelesaikan masalah interoperability nasional secara penuh, padahal MVP MedProof lebih fokus pada:

1. Patient-controlled access.
2. Consent management.
3. Tamper-proof audit trail.
4. AI-assisted patient health journaling.

---

## 7. Pertimbangan menghapus masalah riwayat medis tersebar

Poin masalah terkait **riwayat medis tersebar** sebaiknya dihapus atau direvisi, karena MedProof tidak benar-benar menyelesaikan masalah tersebut secara langsung.

MedProof tidak melakukan integrasi menyeluruh dengan semua rumah sakit, klinik, atau sistem Kemenkes. Jadi, klaim bahwa MedProof menyelesaikan masalah data medis yang tersebar akan terlalu besar untuk scope MVP.

Rekomendasi:

Poin 4 pada bagian masalah sebaiknya dihapus karena MedProof tidak solving that problem secara langsung.

Fokus masalah yang lebih tepat untuk MedProof:

1. Pasien sulit mengontrol siapa yang mengakses data medisnya.
2. Riwayat akses data medis sulit diaudit secara transparan.
3. Consent pasien sulit diverifikasi secara tamper-proof.
4. Dokter membutuhkan konteks tambahan dari health journaling pasien, tetapi tetap harus berdasarkan data yang traceable.

---

## 8. Perjelas KYC untuk dokter

KYC untuk dokter perlu diperjelas bentuknya. Tujuannya adalah untuk memvalidasi bahwa user tersebut benar-benar dokter yang kredibel.

Dokumen yang digunakan untuk verifikasi dokter:

1. **STR**
2. **SIP**
3. **KTP**

Ketiga dokumen ini digunakan oleh Medical Admin untuk memverifikasi status dokter sebelum akun dokter diberi status `approved`.

---

## 9. Pendalaman format penyimpanan Scope 2: Row-Based vs JSONB

### Konteks

**Scope 2** adalah data kesehatan yang dihasilkan dari percakapan harian pasien dengan AI. Data ini mencakup:

1. Kondisi mental.
2. Kualitas tidur.
3. Mood.
4. Anxiety.
5. Keluhan fisik.
6. Severity.
7. Body location.
8. Durasi keluhan.
9. Emergency flag.
10. Kutipan asli pasien.

Karena sumber data Scope 2 berasal dari percakapan bebas, format penyimpanannya harus mampu menangani data yang:

1. Tidak selalu lengkap.
2. Tidak selalu konsisten.
3. Dapat berkembang seiring peningkatan kemampuan AI extractor.

Pertanyaan desain utamanya:

> Apakah data Scope 2 sebaiknya disimpan dalam format row-based terstruktur atau JSONB?

### Opsi 1 — Full JSONB

Pada pendekatan ini, hasil ekstraksi AI dari satu session disimpan sebagai satu object JSONB besar.

Contoh:

```text
scope_2_logs
- log_id UUID PRIMARY KEY
- patient_id UUID
- session_id UUID
- log_date DATE
- extracted_data JSONB
- created_at TIMESTAMP
```

Contoh isi `extracted_data`:

```json
{
  "mental": {
    "mood_score": 7,
    "anxiety_level": 6,
    "sleep_hours": 4.5,
    "trigger_notes": "deadline tugas"
  },
  "physical": [
    {
      "symptom_type": "sakit kepala",
      "severity": 6,
      "body_location": "kepala",
      "duration_note": "sejak kemarin malam"
    }
  ],
  "emergency_flags": []
}
```

### Kelebihan JSONB

1. Lebih fleksibel untuk data hasil AI yang bentuknya bisa berubah.
2. Lebih cepat untuk MVP awal karena tidak perlu banyak tabel dan kolom.
3. Cocok untuk menyimpan raw output dari AI extractor.
4. Cocok untuk eksperimen schema saat struktur data belum stabil.
5. Mudah menambahkan field baru tanpa migration database besar.

### Kekurangan JSONB

1. Sulit untuk query analytics dan trend.
2. Lebih sulit membuat chart seperti mood trend, frequency keluhan, atau sleep pattern.
3. Indexing lebih kompleks dibanding column biasa.
4. Validasi data lebih lemah karena struktur bergantung pada isi JSON.
5. Risiko inconsistent key naming, misalnya `moodScore`, `mood_score`, atau `mood`.
6. RAG retrieval lebih sulit dikontrol karena data harus diparsing dari blob.
7. Row-Level Security dan explicit column access lebih sulit diterapkan secara granular.
8. Bisa membuat data medis penting tersembunyi dalam blob yang sulit diaudit.

### Opsi 2 — Full Row-Based

Pada pendekatan ini, data Scope 2 disimpan dalam tabel terstruktur. PRD saat ini sudah mengarah ke pendekatan ini dengan membagi Scope 2 menjadi dua tabel utama:

1. `scope_2_mental`
2. `scope_2_physical`

Contoh:

```text
scope_2_mental
- log_id UUID PRIMARY KEY
- patient_id UUID
- session_id UUID
- log_date DATE
- mood_score INT
- anxiety_level INT
- sleep_hours DECIMAL
- trigger_notes TEXT
- raw_quote TEXT
- is_emergency_flagged BOOLEAN
- created_at TIMESTAMP

scope_2_physical
- log_id UUID PRIMARY KEY
- patient_id UUID
- session_id UUID
- log_date DATE
- symptom_type VARCHAR
- severity INT
- body_location VARCHAR
- duration_note TEXT
- raw_quote TEXT
- is_emergency_flagged BOOLEAN
- created_at TIMESTAMP
```

### Kelebihan Row-Based

1. Lebih mudah di-query untuk trend dan analytics.
2. Lebih cocok untuk chart generation.
3. Lebih cocok untuk RAG AI dokter karena retrieval bisa dilakukan berdasarkan kolom spesifik.
4. Lebih mudah membuat filter berdasarkan tanggal, symptom, severity, mood_score, atau emergency flag.
5. Lebih mudah menerapkan index database.
6. Lebih mudah menjaga data quality melalui constraint dan validation.
7. Lebih mudah diaudit.
8. Lebih jelas bagi developer dan juri lomba.
9. Lebih scalable untuk fitur lanjutan seperti predictive insight, alerting, dan medical timeline.

### Kekurangan Row-Based

1. Kurang fleksibel jika format output AI sering berubah.
2. Perlu migration ketika ada field baru yang ingin dijadikan field utama.
3. Tidak semua hasil ekstraksi AI cocok langsung dipaksa masuk ke kolom tetap.
4. Ada risiko terlalu banyak nullable columns jika schema terlalu ambisius.

### Rekomendasi Final — Hybrid Model

Rekomendasi terbaik untuk MedProof adalah menggunakan pendekatan hybrid:

1. Gunakan row-based sebagai canonical structured data.
2. Gunakan JSONB hanya sebagai supporting field untuk raw AI extraction, metadata, dan kebutuhan debugging/audit.

Dengan kata lain:

1. Data yang penting untuk query, chart, RAG, filter, dan medical timeline harus masuk ke kolom row-based.
2. Data mentah hasil AI yang belum tentu stabil boleh disimpan di JSONB sebagai `raw_extraction_jsonb`.

Pendekatan ini lebih seimbang karena menjaga struktur data tetap kuat tanpa kehilangan fleksibilitas untuk perkembangan AI extractor.

### Keputusan Desain yang Disarankan

Scope 2 tidak disimpan sebagai JSON blob utama. Scope 2 tetap menggunakan format row-based karena data ini akan digunakan untuk RAG AI dokter, charting, trend analysis, filtering, dan auditability.

Namun, setiap hasil ekstraksi AI boleh menyimpan raw output tambahan dalam format JSONB untuk kebutuhan traceability, debugging, dan pengembangan model di masa depan.

Artinya, JSONB bukan sumber data utama, melainkan data pendukung.

### Revisi Tabel yang Disarankan

#### `scope_2_mental`

```sql
log_id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
patient_id              UUID NOT NULL REFERENCES patients(patient_id)
session_id              UUID NOT NULL REFERENCES ai_sessions(session_id)
log_date                DATE NOT NULL
mood_score              INT CHECK (mood_score BETWEEN 1 AND 10) NULL
anxiety_level           INT CHECK (anxiety_level BETWEEN 1 AND 10) NULL
sleep_hours             DECIMAL NULL
trigger_notes           TEXT NULL
raw_quote               TEXT NULL
is_emergency_flagged    BOOLEAN DEFAULT FALSE
extraction_confidence   DECIMAL NULL
ai_model                VARCHAR(100) NULL
schema_version          VARCHAR(20) DEFAULT 'v1'
raw_extraction_jsonb    JSONB NULL
created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at              TIMESTAMP
```

#### `scope_2_physical`

```sql
log_id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
patient_id              UUID NOT NULL REFERENCES patients(patient_id)
session_id              UUID NOT NULL REFERENCES ai_sessions(session_id)
log_date                DATE NOT NULL
symptom_type            VARCHAR NULL
severity                INT CHECK (severity BETWEEN 1 AND 10) NULL
body_location           VARCHAR NULL
duration_note           TEXT NULL
raw_quote               TEXT NULL
is_emergency_flagged    BOOLEAN DEFAULT FALSE
extraction_confidence   DECIMAL NULL
ai_model                VARCHAR(100) NULL
schema_version          VARCHAR(20) DEFAULT 'v1'
raw_extraction_jsonb    JSONB NULL
created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at              TIMESTAMP
```

### Penjelasan Field Tambahan

#### `extraction_confidence`

Menyimpan tingkat keyakinan AI terhadap hasil ekstraksi.

Contoh:

1. `0.92` berarti AI cukup yakin.
2. `0.45` berarti AI kurang yakin dan data perlu ditampilkan lebih hati-hati.

Field ini berguna karena data Scope 2 berasal dari percakapan natural, bukan form medis formal.

#### `ai_model`

Menyimpan model AI yang digunakan saat ekstraksi.

Contoh:

1. `claude-3-5-sonnet`
2. `claude-3-7-sonnet`
3. `gpt-4.1`

Field ini berguna untuk audit dan debugging jika hasil ekstraksi berbeda antar versi model.

#### `schema_version`

Menyimpan versi struktur ekstraksi yang digunakan.

Contoh:

1. `v1`
2. `v1.1`
3. `v2`

Field ini penting jika di masa depan field Scope 2 berubah atau ditambah.

#### `raw_extraction_jsonb`

Menyimpan raw output dari AI extractor dalam bentuk JSONB.

Field ini tidak digunakan sebagai sumber utama untuk query production, chart, atau RAG. Field ini hanya digunakan untuk:

1. Debugging hasil ekstraksi AI.
2. Audit internal.
3. Evaluasi kualitas AI extractor.
4. Backfill data ketika schema berubah di masa depan.

### Kenapa Tidak Full JSONB?

Full JSONB tidak direkomendasikan karena Scope 2 adalah data yang akan sering digunakan untuk retrieval, trend analysis, charting, dan RAG AI dokter.

Jika semua data disimpan sebagai JSONB blob, maka query seperti berikut akan menjadi lebih rumit:

1. Tren mood pasien selama 14 hari terakhir.
2. Frekuensi sakit kepala dalam 30 hari terakhir.
3. Rata-rata anxiety level per minggu.
4. Daftar hari dengan emergency flag.
5. Hubungan antara sleep_hours dan physical symptom.
6. Retrieval data relevan untuk pertanyaan dokter.

Karena itu, field utama harus tetap disimpan sebagai kolom terstruktur.

### Kenapa Tidak Full Row-Based Tanpa JSONB?

Full row-based tanpa JSONB juga kurang ideal karena hasil ekstraksi AI dapat mengandung informasi tambahan yang belum masuk ke schema utama.

Contoh:

Pasien berkata:

> Aku tidur cuma 3 jam, kepala berat, dan rasanya makin parah setelah minum kopi.

Schema utama mungkin hanya menyimpan:

1. `sleep_hours = 3`
2. `symptom_type = sakit kepala`
3. `severity = NULL`
4. `raw_quote = teks asli pasien`

Namun AI mungkin juga mendeteksi informasi tambahan seperti:

```json
{
  "possible_trigger": "kopi",
  "temporal_context": "setelah minum kopi",
  "symptom_progression": "makin parah",
  "missing_fields": ["severity", "exact_duration"]
}
```

Informasi seperti ini belum tentu perlu menjadi kolom utama di MVP, tetapi tetap berguna untuk debugging dan future improvement. Karena itu, JSONB tetap berguna sebagai supporting field.

### Query Pattern yang Lebih Baik

Untuk RAG AI dokter, retrieval sebaiknya menggunakan kolom terstruktur, bukan parsing blob JSONB.

Contoh query mental health trend:

```sql
SELECT
  log_date,
  mood_score,
  anxiety_level,
  sleep_hours,
  trigger_notes,
  raw_quote
FROM scope_2_mental
WHERE patient_id = :patient_id
  AND log_date >= CURRENT_DATE - INTERVAL '14 days'
ORDER BY log_date ASC;
```

Contoh query physical symptom frequency:

```sql
SELECT
  symptom_type,
  COUNT(*) AS total_reports,
  AVG(severity) AS avg_severity
FROM scope_2_physical
WHERE patient_id = :patient_id
  AND log_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY symptom_type
ORDER BY total_reports DESC;
```

Contoh query emergency flag:

```sql
SELECT
  log_date,
  symptom_type,
  severity,
  body_location,
  raw_quote
FROM scope_2_physical
WHERE patient_id = :patient_id
  AND is_emergency_flagged = TRUE
ORDER BY log_date DESC;
```

### Prinsip Penyimpanan Scope 2

1. Jangan simpan seluruh Scope 2 hanya sebagai JSONB blob.
2. Gunakan row-based sebagai canonical data model.
3. Gunakan JSONB hanya untuk raw extraction dan metadata tambahan.
4. Field yang sering dipakai untuk query harus menjadi column eksplisit.
5. Field yang masih eksperimental boleh masuk ke JSONB.
6. AI tidak boleh mengisi field dengan asumsi.
7. Field yang tidak disebutkan pasien harus tetap NULL.
8. Setiap hasil ekstraksi harus bisa ditelusuri kembali ke `session_id` dan `raw_quote`.
9. Data Scope 2 harus mudah dipakai untuk RAG, charting, analytics, dan audit.

### Revisi PRD — Design Decision

Format penyimpanan Scope 2 menggunakan pendekatan hybrid dengan row-based sebagai canonical structured data dan JSONB sebagai supporting raw extraction.

Data utama seperti `mood_score`, `anxiety_level`, `sleep_hours`, `symptom_type`, `severity`, `body_location`, `duration_note`, `raw_quote`, dan `is_emergency_flagged` disimpan dalam kolom eksplisit agar mudah di-query, di-index, digunakan untuk RAG AI dokter, chart generation, trend analysis, dan audit.

JSONB tidak digunakan sebagai sumber data utama, tetapi disediakan dalam field `raw_extraction_jsonb` untuk menyimpan raw output dari AI extractor, metadata tambahan, dan informasi eksperimental yang belum masuk ke schema utama.

Pendekatan ini dipilih karena Scope 2 berasal dari percakapan natural yang fleksibel, tetapi tetap perlu menjadi data terstruktur yang dapat dianalisis secara konsisten.

### Final Recommendation

Gunakan row-based sebagai format utama Scope 2, dengan JSONB sebagai field pendukung.

Jangan menggunakan full JSONB sebagai penyimpanan utama karena akan menyulitkan RAG, charting, filtering, indexing, dan auditability.

Jangan juga menggunakan full row-based tanpa JSONB karena hasil ekstraksi AI dapat berkembang dan membutuhkan tempat untuk menyimpan raw extraction serta metadata tambahan.

Hybrid model adalah pilihan terbaik untuk MedProof MVP karena paling seimbang antara struktur, fleksibilitas, scalability, dan feasibility development.

---

## 10. Pertimbangan input table Scope 2A dan Scope 2B dari sesi percakapan pasien dengan AI

### Konteks

Scope 2 adalah data kesehatan pasien yang berasal dari percakapan natural antara pasien dan AI. Data ini tidak diinput melalui form medis terstruktur, melainkan diekstrak oleh AI dari pesan pasien selama sesi Chat AI.

Scope 2 dibagi menjadi dua tabel utama:

1. **Scope 2A — Data Kesehatan Mental** (`scope_2_mental`)
2. **Scope 2B — Data Keluhan Fisik** (`scope_2_physical`)

Karena sumber datanya adalah percakapan bebas, sistem perlu memiliki aturan yang jelas mengenai:

1. Kapan data diekstrak.
2. Kapan data disimpan.
3. Bagaimana pemetaan data dilakukan.
4. Bagaimana mencegah AI mengarang informasi yang tidak disebutkan pasien.

### Rekomendasi Utama

Data Scope 2A dan Scope 2B sebaiknya tidak diinput manual oleh pasien. Data tersebut dihasilkan melalui proses AI extraction dari percakapan pasien dengan AI.

Namun, AI tidak boleh langsung dianggap selalu benar. Karena itu, hasil ekstraksi harus memenuhi prinsip berikut:

1. Data hanya boleh diisi berdasarkan informasi yang benar-benar disebutkan oleh pasien.
2. Field yang tidak disebutkan pasien harus disimpan sebagai NULL.
3. AI boleh bertanya lanjutan jika informasi penting belum jelas, tetapi tidak boleh memaksa pasien mengisi semua field.
4. Setiap data yang disimpan harus bisa ditelusuri kembali ke `session_id`, `raw_quote`, dan jika memungkinkan `source_message_id`.
5. Hasil ekstraksi harus dipisahkan antara mental health data dan physical symptom data.
6. AI tidak boleh membuat diagnosis medis.
7. AI hanya melakukan extraction dan summarization, bukan clinical decision-making.

### Trigger Input Scope 2A dan Scope 2B

Input ke tabel Scope 2A dan Scope 2B dilakukan setelah AI mendeteksi adanya informasi kesehatan yang relevan dalam sesi percakapan pasien.

Untuk MVP, trigger penyimpanan data Scope 2 direkomendasikan menggunakan kombinasi berikut:

### 1. Incremental Extraction Saat Percakapan Berlangsung

Setiap kali pasien mengirim pesan baru, backend dapat menjalankan AI extraction ringan untuk mendeteksi apakah pesan tersebut mengandung informasi kesehatan mental atau keluhan fisik.

Jika pesan mengandung informasi relevan, sistem dapat menyimpan atau memperbarui draft extraction untuk session tersebut.

Tujuan incremental extraction:

1. Mendeteksi emergency flag lebih cepat.
2. Mengurangi risiko data hilang jika pasien keluar sebelum menekan tombol Selesai Check-in.
3. Memberi respons AI yang lebih kontekstual selama percakapan.

Namun, untuk MVP, incremental extraction tidak harus langsung melakukan final insert ke tabel Scope 2A/2B. Incremental extraction dapat disimpan sebagai draft atau temporary extraction terlebih dahulu.

### 2. Final Extraction Saat Session Selesai

Final extraction dilakukan ketika session dianggap selesai, yaitu ketika salah satu kondisi berikut terpenuhi:

1. Pasien menekan tombol **Selesai Check-in**.
2. Tidak ada aktivitas atau pesan baru selama 30 menit.
3. Pasien memulai session baru sementara session sebelumnya belum selesai.

Pada tahap final extraction, backend mengambil seluruh pesan dalam session, mengirimkannya ke AI extractor, lalu menyimpan hasil akhir ke:

1. `scope_2_mental` jika terdapat data mental health.
2. `scope_2_physical` jika terdapat data physical symptom.
3. Keduanya jika pasien menyebutkan kondisi mental dan fisik dalam session yang sama.

### Alur Teknis Input Data

#### Step 1 — Pasien Membuka Chat AI

Sistem membuat record baru di tabel `ai_sessions`.

```text
ai_sessions
- session_id
- patient_id
- session_title
- summary_text
- created_at
- updated_at
```

Untuk traceability yang lebih kuat, disarankan menambahkan tabel `ai_messages`.

```sql
ai_messages
- message_id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- session_id UUID NOT NULL REFERENCES ai_sessions(session_id)
- patient_id UUID NOT NULL REFERENCES patients(patient_id)
- sender_role ENUM('patient', 'ai') NOT NULL
- message_text TEXT NOT NULL
- created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

Tabel `ai_messages` penting agar setiap hasil ekstraksi Scope 2 dapat ditelusuri kembali ke pesan asli yang menjadi sumber data.

#### Step 2 — Pasien Mengirim Pesan

Setiap pesan pasien disimpan ke `ai_messages`.

Contoh pesan:

> Hari ini aku cemas banget karena kerjaan numpuk. Tidur cuma 4 jam, terus kepala sakit sejak pagi.

#### Step 3 — AI Melakukan Extraction

AI extractor membaca pesan atau seluruh session dan mengidentifikasi dua kategori data:

1. Mental health signal.
2. Physical symptom signal.

Dari contoh pesan di atas, AI dapat mengekstrak:

Scope 2A — Mental:

```json
{
  "mood_score": null,
  "anxiety_level": 8,
  "sleep_hours": 4,
  "trigger_notes": "kerjaan numpuk",
  "raw_quote": "Hari ini aku cemas banget karena kerjaan numpuk. Tidur cuma 4 jam..."
}
```

Scope 2B — Physical:

```json
{
  "symptom_type": "sakit kepala",
  "severity": null,
  "body_location": "kepala",
  "duration_note": "sejak pagi",
  "raw_quote": "...terus kepala sakit sejak pagi."
}
```

#### Step 4 — AI Menentukan Target Table

Rule mapping:

1. Jika pasien menyebutkan mood, emosi, anxiety, stress, burnout, sleep, atau trigger psikologis, data masuk ke `scope_2_mental`.
2. Jika pasien menyebutkan gejala tubuh seperti sakit kepala, demam, mual, nyeri dada, sesak napas, batuk, atau keluhan fisik lain, data masuk ke `scope_2_physical`.
3. Jika satu pesan mengandung keduanya, data masuk ke dua tabel sekaligus dengan `session_id` yang sama.
4. Jika tidak ada informasi kesehatan yang relevan, tidak perlu membuat record Scope 2.

### Struktur Input Scope 2A — Mental

Untuk `scope_2_mental`, satu session sebaiknya menghasilkan maksimal satu row per pasien per tanggal per session.

Alasannya:

1. Kondisi mental biasanya merupakan summary state dari satu sesi.
2. Mood, anxiety, sleep, dan trigger lebih cocok disimpan sebagai agregasi session-level.
3. Menghindari terlalu banyak row mental dari satu percakapan yang sama.

Contoh insert:

```sql
INSERT INTO scope_2_mental (
  patient_id,
  session_id,
  log_date,
  mood_score,
  anxiety_level,
  sleep_hours,
  trigger_notes,
  raw_quote,
  is_emergency_flagged,
  extraction_confidence,
  ai_model,
  schema_version,
  raw_extraction_jsonb
) VALUES (
  :patient_id,
  :session_id,
  CURRENT_DATE,
  :mood_score,
  :anxiety_level,
  :sleep_hours,
  :trigger_notes,
  :raw_quote,
  :is_emergency_flagged,
  :extraction_confidence,
  :ai_model,
  'v1',
  :raw_extraction_jsonb
);
```

Jika dalam satu session pasien beberapa kali menyebut kondisi mental, AI extractor harus memilih representasi paling akurat untuk session tersebut, bukan membuat banyak row tanpa kebutuhan jelas.

### Struktur Input Scope 2B — Physical

Untuk `scope_2_physical`, satu session dapat menghasilkan lebih dari satu row.

Alasannya:

1. Pasien bisa menyebut beberapa gejala fisik dalam satu percakapan.
2. Setiap gejala perlu bisa dianalisis secara terpisah.
3. Query seperti frequency symptom dan severity trend lebih mudah jika satu symptom disimpan sebagai satu row.

Contoh:

Pasien berkata:

> Kepala sakit sejak pagi, perut juga mual setelah makan.

Maka sistem dapat membuat dua row di `scope_2_physical`:

Row 1:

```text
symptom_type = sakit kepala
body_location = kepala
duration_note = sejak pagi
```

Row 2:

```text
symptom_type = mual
body_location = perut
duration_note = setelah makan
```

Contoh insert:

```sql
INSERT INTO scope_2_physical (
  patient_id,
  session_id,
  log_date,
  symptom_type,
  severity,
  body_location,
  duration_note,
  raw_quote,
  is_emergency_flagged,
  extraction_confidence,
  ai_model,
  schema_version,
  raw_extraction_jsonb
) VALUES (
  :patient_id,
  :session_id,
  CURRENT_DATE,
  :symptom_type,
  :severity,
  :body_location,
  :duration_note,
  :raw_quote,
  :is_emergency_flagged,
  :extraction_confidence,
  :ai_model,
  'v1',
  :raw_extraction_jsonb
);
```

### Handling Jika Data Tidak Lengkap

Karena pasien berbicara secara natural, tidak semua field akan tersedia.

Contoh pesan:

> Aku lagi pusing banget.

Data yang bisa diisi:

```text
symptom_type = pusing
severity = NULL
body_location = kepala
duration_note = NULL
raw_quote = Aku lagi pusing banget.
```

AI tidak boleh mengisi `severity = 8` hanya karena kata "banget" terdengar parah. AI boleh memberi estimation hanya jika rule PRD memang mengizinkan dan tetap disimpan dengan `extraction_confidence`.

Jika informasi penting belum jelas, AI boleh bertanya lanjutan secara natural:

> Pusingnya sudah terasa sejak kapan?

Namun jawaban pasien tetap opsional. Sistem tidak boleh memaksa pasien melengkapi semua field seperti form medis.

### Emergency Flag Handling

Jika AI mendeteksi indikasi emergency, sistem harus menandai `is_emergency_flagged = TRUE` pada row yang relevan.

Contoh indikasi emergency:

1. Nyeri dada berat.
2. Sesak napas parah.
3. Pingsan.
4. Keinginan menyakiti diri sendiri.
5. Gejala stroke seperti wajah mencong, bicara pelo, atau kelemahan satu sisi tubuh.

Untuk MVP, emergency flag tidak harus menjadi fitur SOS penuh, tetapi tetap perlu dicatat agar dokter dapat melihat bahwa ada hari tertentu yang berisiko tinggi.

Jika emergency flag terdeteksi, AI harus memberikan respons hati-hati dan menyarankan pasien mencari bantuan medis profesional atau layanan darurat sesuai konteks.

AI tetap tidak boleh membuat diagnosis.

### Idempotency dan Anti-Duplicate Rule

Karena extraction dapat terjadi lebih dari sekali, sistem perlu mencegah duplicate data.

Rekomendasi rule:

1. `scope_2_mental` hanya boleh memiliki satu row per `session_id`.
2. `scope_2_physical` boleh memiliki banyak row per `session_id`, tetapi tidak boleh membuat duplicate symptom yang sama dari quote yang sama.
3. Gunakan `source_message_id` atau `raw_quote_hash` jika ingin mencegah duplicate lebih kuat.
4. Final extraction boleh melakukan upsert terhadap draft extraction sebelumnya.

Rekomendasi field tambahan:

```sql
source_message_id UUID NULL REFERENCES ai_messages(message_id)
raw_quote_hash TEXT NULL
extraction_status ENUM('draft', 'final') DEFAULT 'final'
```

Untuk MVP sederhana, `source_message_id` boleh optional. Namun `session_id` dan `raw_quote` wajib ada agar data tetap traceable.

### Draft vs Final Extraction

#### Opsi A — Langsung Final Insert Saat Session Selesai

Ini opsi paling sederhana untuk MVP.

Flow:

1. Simpan semua pesan ke `ai_messages`.
2. Saat session selesai, jalankan AI extractor.
3. Insert final result ke `scope_2_mental` dan/atau `scope_2_physical`.

Kelebihan:

1. Lebih sederhana.
2. Lebih hemat biaya AI.
3. Mengurangi risiko data berubah-ubah selama percakapan.

Kekurangan:

1. Emergency detection tidak real-time jika hanya dijalankan di akhir session.
2. Jika user keluar sebelum session selesai, perlu fallback timeout.

#### Opsi B — Incremental Draft + Finalization

Ini opsi lebih kuat.

Flow:

1. Setiap pesan pasien diekstrak secara ringan.
2. Hasil sementara disimpan sebagai draft.
3. Saat session selesai, AI melakukan final extraction berdasarkan seluruh session.
4. Draft diubah menjadi final atau diganti dengan hasil final.

Kelebihan:

1. Emergency flag bisa terdeteksi lebih cepat.
2. Data tidak mudah hilang.
3. Lebih cocok untuk sistem kesehatan.

Kekurangan:

1. Lebih kompleks.
2. Lebih mahal secara token/API.
3. Perlu logic idempotency yang lebih rapi.

### Rekomendasi untuk MVP

Untuk MVP lomba, gunakan pendekatan kombinasi:

1. Simpan seluruh pesan pasien dan AI ke `ai_messages`.
2. Jalankan lightweight extraction real-time hanya untuk emergency flag dan context awareness.
3. Jalankan final extraction saat session selesai untuk mengisi `scope_2_mental` dan `scope_2_physical`.
4. Gunakan `session_id` sebagai penghubung utama antara `ai_sessions`, `scope_2_mental`, dan `scope_2_physical`.
5. Untuk `scope_2_mental`, gunakan satu row per session.
6. Untuk `scope_2_physical`, gunakan satu row per symptom per session.
7. Field yang tidak disebutkan pasien tetap NULL.
8. Semua hasil extraction harus menyimpan `raw_quote`.

Pendekatan ini paling seimbang antara feasibility MVP, data quality, dan keamanan.

### Revisi PRD — Mekanisme Input Scope 2 dari Percakapan AI

Data Scope 2A dan Scope 2B tidak diinput melalui form manual, tetapi dihasilkan dari proses AI extraction terhadap percakapan pasien di halaman Chat AI.

Setiap sesi percakapan disimpan di `ai_sessions`, dan setiap pesan disarankan untuk disimpan di tabel `ai_messages` agar hasil ekstraksi dapat ditelusuri kembali ke pesan asli.

Selama percakapan berlangsung, sistem dapat menjalankan lightweight extraction untuk mendeteksi emergency flag dan menjaga konteks respons AI. Namun, penyimpanan final ke tabel `scope_2_mental` dan `scope_2_physical` dilakukan saat session dianggap selesai, yaitu ketika pasien menekan tombol **Selesai Check-in**, tidak ada aktivitas selama 30 menit, atau pasien memulai session baru.

Jika percakapan mengandung informasi mental health seperti mood, anxiety, stress, sleep, atau trigger psikologis, sistem membuat atau memperbarui satu row di `scope_2_mental` untuk session tersebut.

Jika percakapan mengandung keluhan fisik seperti sakit kepala, demam, mual, nyeri, batuk, atau gejala tubuh lainnya, sistem membuat satu atau lebih row di `scope_2_physical`, dengan satu row mewakili satu symptom utama yang disebutkan pasien.

Jika satu session mengandung informasi mental dan fisik sekaligus, sistem dapat mengisi kedua tabel dengan `session_id` yang sama.

AI tidak boleh mengarang data. Field yang tidak disebutkan pasien harus disimpan sebagai NULL. AI hanya boleh menanyakan pertanyaan lanjutan secara natural jika informasi tersebut penting untuk memperjelas keluhan, tetapi pasien tidak wajib melengkapi semua field.

Setiap row Scope 2 wajib menyimpan `patient_id`, `session_id`, `log_date`, dan `raw_quote` agar data dapat diaudit dan ditelusuri kembali ke sumber percakapan.

### Revisi PRD — Tambahan Tabel `ai_messages`

Untuk meningkatkan traceability, tambahkan tabel `ai_messages`.

```sql
ai_messages
message_id      UUID PRIMARY KEY DEFAULT gen_random_uuid()
session_id      UUID NOT NULL REFERENCES ai_sessions(session_id)
patient_id      UUID NOT NULL REFERENCES patients(patient_id)
sender_role     ENUM('patient', 'ai') NOT NULL
message_text    TEXT NOT NULL
created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

Tabel ini berfungsi untuk menyimpan seluruh pesan dalam sesi Chat AI. Dengan adanya `ai_messages`, hasil ekstraksi pada Scope 2A dan Scope 2B dapat ditelusuri kembali ke percakapan asli pasien.

### Revisi PRD — Tambahan Field Opsional untuk Scope 2

Untuk memperkuat traceability dan anti-duplicate, pertimbangkan penambahan field berikut pada `scope_2_mental` dan `scope_2_physical`:

```sql
source_message_id   UUID NULL REFERENCES ai_messages(message_id)
raw_quote_hash      TEXT NULL
extraction_status   ENUM('draft', 'final') DEFAULT 'final'
```

Jika ingin menjaga MVP tetap sederhana, field ini dapat ditunda. Namun minimal `session_id` dan `raw_quote` harus tetap wajib digunakan sebagai traceability layer.

### Final Recommendation

Gunakan session-based AI extraction untuk menginput Scope 2A dan Scope 2B.

Untuk MVP, jangan membuat pasien mengisi form manual Scope 2. Biarkan AI mengekstrak data dari percakapan natural, lalu simpan hasil final saat session selesai.

Gunakan aturan berikut:

1. `scope_2_mental`: satu row per session jika ada mental health signal.
2. `scope_2_physical`: satu row per symptom per session jika ada physical symptom signal.
3. Satu session dapat mengisi kedua tabel sekaligus.
4. Field yang tidak disebutkan pasien tetap NULL.
5. Setiap data wajib menyimpan `session_id` dan `raw_quote`.
6. Tambahkan `ai_messages` untuk menyimpan pesan asli dan meningkatkan traceability.
7. Gunakan lightweight real-time extraction hanya untuk emergency flag, bukan sebagai final source of truth.
8. Gunakan final extraction saat session selesai sebagai data canonical Scope 2.

Pendekatan ini menjaga pengalaman pasien tetap natural, tetapi data yang masuk ke sistem tetap terstruktur, traceable, dan dapat digunakan untuk RAG AI dokter, charting, trend analysis, dan audit.

---

## 11. Pertimbangan menghapus kolom password hash pada tabel pasien dan medical admins

Keputusan:

> Delete is approved.

Kolom `password_hash` pada tabel pasien dan medical admins perlu dihapus karena password sudah pasti disimpan pada tabel autentikasi.

Menyimpan `password_hash` di tabel domain seperti `patients` atau `medical_admins` akan menyebabkan duplikasi data sensitif, meningkatkan risiko keamanan, dan melanggar separation of concern antara authentication layer dan domain data layer.

---

## 12. Trigger input `summary_text` pada tabel `ai_sessions`

### Trigger Penyimpanan Summary Session

Untuk dimasukkan ke bagian **5.1.C — Halaman Chat AI Pasien**.

`summary_text` pada tabel `ai_sessions` dihasilkan oleh AI setelah satu sesi percakapan dianggap selesai. Summary ini berisi rangkuman singkat dari kondisi pasien, keluhan utama, konteks emosional, gejala fisik yang disebutkan, serta poin penting yang berhasil dicatat oleh sistem selama sesi berlangsung.

Sebuah session dianggap selesai apabila salah satu kondisi berikut terpenuhi:

1. Pasien menekan tombol **Selesai Check-in** pada halaman Chat AI.
2. Tidak ada aktivitas atau pesan baru dari pasien selama 30 menit.
3. Pasien memulai session baru sementara session sebelumnya belum memiliki `summary_text`.

Setelah salah satu trigger terjadi, backend mengambil seluruh pesan dalam session tersebut, mengirimkannya ke AI summarizer, lalu menyimpan hasil ringkasan ke field `ai_sessions.summary_text`. Field `updated_at` juga diperbarui pada saat summary berhasil disimpan.

`summary_text` tidak diisi saat session pertama kali dibuat. Field ini hanya diisi setelah session dianggap selesai berdasarkan trigger yang telah ditentukan.

AI tidak boleh menambahkan informasi yang tidak disebutkan pasien. Jika ada informasi yang tidak jelas, tidak lengkap, atau tidak tersedia dalam percakapan, summary harus tetap bersifat deskriptif dan tidak membuat asumsi medis.

### Revisi bagian tabel `ai_sessions`

```sql
ai_sessions
session_id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
patient_id              UUID NOT NULL REFERENCES patients(patient_id)
session_title           VARCHAR(255) -- judul sesi, di-generate AI
summary_text            TEXT -- rangkuman singkat sesi yang dihasilkan AI setelah session selesai
ended_at                TIMESTAMP -- waktu ketika session dianggap selesai
end_reason              ENUM('manual_end', 'inactivity_timeout', 'new_session_started') -- alasan session selesai
summary_generated_at    TIMESTAMP -- waktu ketika summary_text berhasil dihasilkan dan disimpan
created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at              TIMESTAMP
```

Catatan:

`summary_text` dihasilkan setelah session selesai melalui salah satu trigger berikut: pasien menekan tombol **Selesai Check-in**, session inactive selama 30 menit, atau pasien memulai session baru saat session sebelumnya belum memiliki `summary_text`.

### Untuk dimasukkan ke bagian 9 — End-to-End Flow

#### Daily Check-in

```text
Pasien membuka Chat AI
→ Pasien bercerita bebas tentang kondisi hari ini
→ AI mengekstrak data terstruktur ke scope_2_mental dan/atau scope_2_physical
→ Data session tersimpan di ai_sessions
→ Saat pasien menekan tombol Selesai Check-in, session inactive selama 30 menit, atau pasien memulai session baru, sistem menutup session tersebut
→ AI summarizer membuat summary_text berdasarkan seluruh pesan dalam session
→ summary_text, ended_at, end_reason, dan summary_generated_at disimpan ke ai_sessions
```

---

## 13. Pertimbangan tidak menggunakan `SELECT *` pada semua logic query kecuali untuk log

Keputusan:

> Approved.

Hindari penggunaan `SELECT *` pada seluruh application query, terutama pada query yang digunakan oleh backend API, middleware access control, dan data retrieval untuk frontend.

Setiap query harus menggunakan explicit column selection sesuai kebutuhan endpoint untuk menjaga prinsip least privilege, mengurangi risiko accidental data exposure, meningkatkan performa, dan mencegah perubahan schema menyebabkan data sensitif ikut terkirim secara tidak sengaja.

Untuk query pengecekan akses, gunakan `SELECT EXISTS` atau `SELECT 1` apabila backend hanya perlu memvalidasi keberadaan akses aktif.

Jika backend membutuhkan informasi tambahan, ambil hanya kolom yang diperlukan seperti:

1. `grant_id`
2. `scope_granted`
3. `can_download`
4. `expires_at`

Penggunaan `SELECT *` hanya diperbolehkan untuk kebutuhan:

1. Ad-hoc debugging.
2. Local development.
3. Forensic audit internal yang terkontrol.

`SELECT *` tidak boleh digunakan pada production API logic, termasuk pada query `audit_logs` yang datanya akan ditampilkan ke frontend atau dikonsumsi oleh sistem lain.

---

## 14. Pertimbangan alternatif kode dokter selain QR Code untuk Kelola Akses Dokter

Keputusan:

> Approved.

### Rekomendasi

Pertimbangkan untuk menambahkan alternatif kode dokter yang mudah ditulis sebagai metode fallback selain QR Code pada fitur Kelola Akses Dokter.

QR Code tetap menjadi metode utama karena lebih cepat, minim kesalahan input, dan cocok untuk situasi tatap muka antara pasien dan dokter.

Namun, hanya mengandalkan QR Code memiliki beberapa risiko UX dan operasional, terutama ketika:

1. Kamera pasien bermasalah.
2. QR sulit dipindai.
3. Dokter melakukan konsultasi online.
4. Pasien tidak berada di lokasi yang sama dengan dokter.

Untuk mengatasi hal tersebut, sistem sebaiknya menyediakan alternatif berupa **Doctor Access Code** yang dapat diketik manual oleh pasien.

### Konsep Doctor Access Code

Setiap dokter yang sudah diverifikasi dan memiliki status akun `approved` akan mendapatkan dua identitas akses:

1. `qr_code_token`
2. `doctor_access_code`

`doctor_access_code` adalah kode unik yang singkat, mudah dibaca, dan mudah diketik oleh pasien. Kode ini tidak menggantikan QR Code, tetapi menjadi alternatif ketika QR Code tidak dapat digunakan.

Contoh format kode:

1. `DR-AHMAD-7K2Q`
2. `MP-DR-84FJQ`
3. `DOK-29X7P`

Untuk MVP, format yang disarankan adalah:

```text
MP-DR-XXXXX
```

Contoh:

```text
MP-DR-7K2Q9
```

Format ini cukup singkat, mudah dibaca, dan tetap memiliki identitas brand MedProof.

### Alur Penggunaan Kode Dokter oleh Pasien

1. Pasien membuka halaman Kelola Akses Dokter.
2. Pasien memilih tombol **Beri Akses Dokter Baru**.
3. Sistem menampilkan dua opsi:
   1. Scan QR Code Dokter.
   2. Masukkan Kode Dokter.
4. Jika pasien memilih **Masukkan Kode Dokter**, pasien mengetik `doctor_access_code` yang diberikan oleh dokter.
5. Backend mencari dokter berdasarkan `doctor_access_code`.
6. Jika kode valid dan dokter berstatus `approved`, sistem menampilkan halaman konfirmasi profil dokter.
7. Pasien mengatur:
   1. Scope akses: Scope 1 saja atau Scope 1 & 2.
   2. Durasi akses: 1 jam, 6 jam, 24 jam, 3 hari, 7 hari, atau custom.
   3. Hak download: aktif atau tidak.
8. Pasien menekan tombol **Beri Akses**.
9. Sistem membuat entri baru di `access_grants`.
10. `consent_hash` dibuat dan dikirim ke Polygon Amoy.
11. `blockchain_tx_hash` disimpan di database.

### Revisi Database yang Disarankan

Tambahkan field berikut pada tabel `doctors`:

```sql
doctor_access_code VARCHAR(20) UNIQUE
```

Revisi tabel `doctors`:

```sql
doctor_id           UUID PRIMARY KEY DEFAULT gen_random_uuid()
auth_user_id        UUID UNIQUE NOT NULL
nama                VARCHAR(255) NOT NULL
email               VARCHAR(255) UNIQUE NOT NULL
nomor_telepon       VARCHAR(20)
spesialisasi        VARCHAR(100)
status_akun         ENUM('pending', 'approved', 'rejected') DEFAULT 'pending'
dokumen_str_url     TEXT
dokumen_sip_url     TEXT
dokumen_ktp_url     TEXT
verified_by         UUID REFERENCES medical_admins(admin_id)
verified_at         TIMESTAMP
qr_code_token       TEXT UNIQUE
doctor_access_code  VARCHAR(20) UNIQUE
created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### Aturan Generate Kode Dokter

`doctor_access_code` hanya boleh di-generate setelah dokter berstatus `approved`.

Saat Medical Admin menyetujui dokter:

1. `status_akun` diubah menjadi `approved`.
2. Sistem generate `qr_code_token` unik.
3. Sistem generate `doctor_access_code` unik.
4. QR Code dan Doctor Access Code ditampilkan di dashboard dokter.
5. Email notifikasi approval dikirim ke dokter.

Kode tidak boleh dibuat saat status dokter masih `pending`, agar dokter yang belum diverifikasi tidak dapat membagikan kode akses kepada pasien.

### Aturan Keamanan

Doctor Access Code bukan credential login dan bukan permission final. Kode ini hanya berfungsi untuk membantu pasien menemukan profil dokter yang sudah diverifikasi.

Akses data pasien tetap hanya terjadi setelah pasien memberikan consent eksplisit melalui halaman konfirmasi akses.

Dengan kata lain, mengetahui kode dokter tidak otomatis membuka data pasien.

Security rule:

1. Kode hanya valid untuk dokter dengan `status_akun = 'approved'`.
2. Kode hanya digunakan untuk lookup profil dokter.
3. Kode tidak boleh memberikan akses langsung ke data pasien.
4. Semua akses tetap wajib membuat record di `access_grants`.
5. Semua pemberian akses tetap menghasilkan `consent_hash` dan dicatat ke blockchain.
6. Backend tetap wajib melakukan validasi `expires_at > CURRENT_TIMESTAMP` dan `is_revoked = FALSE` untuk setiap akses data pasien.

### Risiko dan Mitigasi

#### Risiko 1: Salah ketik kode dokter

Mitigasi:

1. Gunakan format kode pendek.
2. Hindari karakter ambigu seperti `O`, `0`, `I`, dan `1`.
3. Tampilkan nama dan spesialisasi dokter sebelum pasien memberi akses.
4. Pasien wajib melakukan konfirmasi manual sebelum akses diberikan.

#### Risiko 2: Kode dokter dibagikan sembarangan

Mitigasi:

1. Kode hanya untuk lookup dokter, bukan akses data.
2. Consent tetap harus diberikan oleh pasien.
3. Dokter tetap tidak bisa mencari pasien secara bebas.

#### Risiko 3: Brute force kode dokter

Mitigasi:

1. Terapkan rate limiting pada endpoint lookup kode dokter.
2. Batasi percobaan input kode per IP/user.
3. Gunakan kode random yang cukup panjang, minimal 5–6 karakter alphanumeric non-ambiguous.
4. Catat failed lookup attempt di `audit_logs` jika diperlukan.

### Revisi PRD — Bagian Patient Access Control

Pada alur memberikan akses ke dokter, sistem menyediakan dua metode identifikasi dokter:

1. Scan QR Code Dokter.
2. Input Doctor Access Code.

QR Code menjadi metode utama karena lebih cepat dan minim kesalahan. Doctor Access Code menjadi metode fallback untuk kondisi ketika QR Code tidak dapat dipindai, kamera pasien bermasalah, atau konsultasi dilakukan secara online.

Setelah dokter berhasil ditemukan melalui QR Code atau Doctor Access Code, sistem tetap menampilkan halaman konfirmasi dokter yang berisi nama, spesialisasi, dan pengaturan izin akses.

Pasien tetap harus memilih scope akses, durasi akses, dan hak download sebelum akses diberikan.

Doctor Access Code tidak memberikan akses langsung ke data pasien. Kode hanya digunakan untuk menemukan profil dokter yang sudah diverifikasi.

Akses data tetap sepenuhnya dikendalikan oleh pasien melalui consent eksplisit.

### Revisi PRD — Bagian Doctor Portal

Setelah Medical Admin menyetujui dokter, sistem secara otomatis menghasilkan `qr_code_token` dan `doctor_access_code`.

Dashboard dokter menampilkan:

1. QR Code unik dokter.
2. Doctor Access Code yang dapat diberikan kepada pasien jika QR Code tidak dapat digunakan.

Doctor Access Code hanya tersedia untuk dokter dengan status akun `approved`. Dokter dengan status `pending` atau `rejected` tidak memiliki QR Code maupun Doctor Access Code aktif.

### Final Recommendation

Tambahkan Doctor Access Code sebagai fallback method, bukan pengganti QR Code.

QR Code tetap menjadi primary flow. Doctor Access Code menjadi secondary flow untuk meningkatkan usability, terutama untuk konsultasi online, kamera bermasalah, atau situasi ketika QR Code sulit dipindai.

Keputusan ini membuat sistem lebih fleksibel tanpa mengorbankan security, karena akses data tetap membutuhkan consent eksplisit dari pasien dan tetap dikontrol melalui `access_grants`.

---

## 15. Apa yang dimaksud dengan RAG AI untuk dokter?

**RAG AI untuk dokter** adalah fitur AI yang membantu dokter bertanya dan menganalisis data pasien berdasarkan data nyata yang sudah tersimpan di sistem, bukan berdasarkan tebakan AI semata.

**RAG** adalah singkatan dari **Retrieval-Augmented Generation**.

Artinya:

AI tidak langsung menjawab dari “ingatan model”, tetapi mengambil dulu data relevan dari database pasien, lalu menggunakan data itu sebagai konteks untuk menghasilkan jawaban.

Dalam MedProof, RAG AI dipakai di Doctor Portal, khususnya saat dokter sudah mendapat akses dari pasien.

Contoh:

Dokter bertanya:

> Bagaimana tren anxiety pasien selama 14 hari terakhir?

Sistem akan:

1. Mengecek apakah dokter punya akses aktif.
2. Mengambil data Scope 2 yang relevan dari database.
3. Memberikan konteks tersebut ke AI.
4. AI membuat jawaban berdasarkan data pasien yang benar-benar tersedia.

RAG AI untuk dokter bukan diagnosis otomatis. Fitur ini hanya membantu dokter membaca, merangkum, dan menemukan pola dari data pasien yang sudah tersedia.

---

## 16. Apa yang dimaksud dengan smart contract?

**Smart contract** adalah program yang berjalan di blockchain dan mengeksekusi logic tertentu secara otomatis ketika dipanggil.

Di MedProof, smart contract dipakai untuk menyimpan hash sebagai bukti integritas, bukan untuk menyimpan data medis asli.

Dalam PRD MedProof, smart contract di-deploy ke Polygon Amoy Testnet menggunakan Solidity, dan memiliki tiga fungsi utama:

1. Mencatat hash medical record.
2. Mencatat hash consent.
3. Mencatat hash audit event.

Data medis asli tetap disimpan di database off-chain. Blockchain hanya menyimpan hash agar sistem bisa membuktikan bahwa data atau event tertentu tidak diubah setelah dicatat.
