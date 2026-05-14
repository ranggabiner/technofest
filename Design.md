# MedProof — Design System Reference
> Platform kesehatan personal yang menggabungkan kehangatan ilustrasi Family.co dengan ketenangan Claude — warm cream canvas sebagai fondasi, mint-teal sebagai sinyal kepercayaan medis, dan karakter blob yang membuat data sensitif terasa manusiawi.

**Tema:** Light · Warm & Human · Premium Trust

MedProof harus membuat pasien merasa aman sejak detik pertama. Filosofi desainnya adalah persimpangan antara dua referensi: kehangatan playful Family.co (cream canvas, ilustrasi blob, tipografi display yang kuat) dan ketenangan minimal Claude (sidebar lebar, area konten bersih, hirarki tanpa distraksi). Hasilnya adalah platform medis yang tidak terasa seperti klinik steril, tetapi juga tidak kehilangan bobot kepercayaan yang dibutuhkan ketika seseorang menyimpan rekam medis pribadinya. Warna digunakan dengan hemat — teal sebagai satu-satunya aksen kuat, cream sebagai napas halaman, dan tipografi yang melakukan pekerjaan berat. Dua karakter blob pada hero landing page menjadi wajah brand: tidak menakutkan, tidak terlalu ceria, tetapi hadir dengan kepribadian yang jelas.

---

## 1. Fondasi Visual

### 1.1 Filosofi Desain

MedProof beroperasi di area yang jarang dikunjungi desainer: di antara kepercayaan medis dan kehangatan manusiawi. Terlalu clinical akan membuat pasien merasa seperti objek data. Terlalu playful akan merusak kredibilitas di hadapan dokter. Solusinya adalah **restraint yang disengaja** — ilustrasi hadir tetapi tidak mendominasi, warna aksen digunakan jarang sehingga setiap kemunculannya bermakna, dan tipografi display memberikan karakter tanpa kehilangan otoritas.

Tiga prinsip utama:

1. **Trust through clarity** — Setiap elemen UI harus dapat dijelaskan kepada pasien awam dalam satu kalimat. Kompleksitas teknis (blockchain hash, enkripsi AES-256) disembunyikan di balik language yang manusiawi dan badge yang subtle.
2. **Warmth through restraint** — Kehangatan tidak berarti ramai. Cream canvas, karakter blob di titik-titik strategis, dan radius sudut yang lembut menciptakan nuansa approachable tanpa mengorbankan profesionalisme.
3. **Premium through precision** — Target pengguna adalah pasien kelas atas dan dokter. Premium tidak berarti banyak warna atau ornamen. Premium berarti spacing yang tepat, tipografi yang presisi, dan interaksi yang terasa responsif.

### 1.2 Referensi Visual

| Referensi | Elemen yang Diadopsi | Elemen yang Tidak Diadopsi |
|-----------|----------------------|---------------------------|
| Family.co | Warm cream canvas, ilustrasi blob, tipografi display, pill buttons, inset card borders | Kepadatan karakter yang tinggi, nuansa fintech playful |
| Claude (claude.ai) | Clean sidebar layout, area konten lebar tanpa distraksi, minimal chrome, quiet UI | Dark mode, UI yang terlalu sparse |
| Tailwind UI / Linear | Compact data tables, sidebar collapsible | Dark-first approach |

---

## 2. Token Warna

### 2.1 Palet Utama

| Nama | Nilai | Token | Peran |
|------|-------|-------|-------|
| Warm Canvas | `#fbfaf9` | `--color-warm-canvas` | Background halaman, nav landing, fill tombol light |
| Stone Surface | `#f2f0ed` | `--color-stone-surface` | Border inset kartu, background tombol sekunder, divider subtle |
| Parchment Card | `#f8f7f4` | `--color-parchment-card` | Background kartu fitur, panel recessed di dashboard |
| Graphite | `#474645` | `--color-graphite` | Teks body, nav links, copy kartu — warna teks dominan seluruh platform |
| Charcoal Primary | `#343433` | `--color-charcoal-primary` | Heading, teks nav utama, links |
| Midnight | `#121212` | `--color-midnight` | Background CTA button dark, teks heading high-contrast |
| Obsidian | `#000000` | `--color-obsidian` | Background dark surface untuk komponen kritis |
| Ash | `#848281` | `--color-ash` | Teks body muted, label nav sekunder |
| Fog | `#c6c6c6` | `--color-fog` | Teks footer, border inactive, divider |
| Smoke | `#a7a7a7` | `--color-smoke` | Disabled states, placeholder text, label tersier |

### 2.2 Aksen Brand (Teal)

Mint-teal adalah satu-satunya aksen kuat di seluruh platform. Kemunculannya yang jarang adalah kekuatannya — setiap elemen teal secara otomatis menarik perhatian. Jangan gunakan lebih dari satu elemen teal per viewport.

| Nama | Nilai | Token | Peran |
|------|-------|-------|-------|
| Teal Primary | `#2DD4BF` | `--color-teal-primary` | Aksen brand utama — CTA button, ikon highlights, elemen aktif sidebar, ilustrasi karakter |
| Teal Deep | `#0D9488` | `--color-teal-deep` | Hover state teal, stroke pada ilustrasi teal, teks link teal di body |
| Teal Muted | `#CCFBF1` | `--color-teal-muted` | Background badge teal ringan, highlight state subtle |
| Teal Surface | `#F0FDFA` | `--color-teal-surface` | Background section dengan konteks teal, onboarding step aktif |

### 2.3 Warna Status & Sistem

| Nama | Nilai | Token | Peran |
|------|-------|-------|-------|
| Valid Green | `#00C454` | `--color-valid-green` | Input valid, success state, konfirmasi akses |
| Error Red | `#EF4444` | `--color-error-red` | Error state, destructive action, input tidak valid |
| Warning Amber | `#F59E0B` | `--color-warning-amber` | Peringatan non-kritis, akses hampir expired |
| Info Blue | `#3B82F6` | `--color-info-blue` | Informasi netral, tooltip, helper text |

### 2.4 Warna Ilustrasi

| Nama | Nilai | Token | Peran |
|------|-------|-------|-------|
| Illustration Teal | `#2DD4BF` | `--graphic-teal` | Karakter blob utama (identitas MedProof) |
| Illustration Amber | `#FBBF24` | `--graphic-amber` | Karakter blob sekunder, koin, bintang, detail medis |
| Illustration Coral | `#FB7185` | `--graphic-coral` | Aksen karakter, elemen hati, detail human-touch |
| Illustration Lavender | `#A78BFA` | `--graphic-lavender` | Objek medis (pill, DNA, shield), detail pendukung |
| Illustration Amber Deep | `#D97706` | `--graphic-amber-deep` | Stroke/shadow pada elemen amber |
| Illustration Teal Deep | `#0D9488` | `--graphic-teal-deep` | Stroke/shadow pada karakter teal |

---

## 3. Tipografi

### 3.1 Filosofi Tipografi

MedProof menggunakan sistem dua-font yang identik dengan Family.co: **Family/Fraunces** untuk display dan section heading, **Inter** untuk semua teks UI. Pemisahan ini kritis — display font memberi karakter dan kehangatan, Inter menjaga kredibilitas dan keterbacaan di semua ukuran fungsional.

### 3.2 Font Stack

**Family / Fraunces — Hero dan section display heading saja**
- Substitute: Fraunces (Google Fonts) atau Playfair Display weight 500
- Weights: 500
- Ukuran: 44px, 60px, 68px
- Line height: 1.09–1.10
- Letter spacing: -2.11px pada 68px, -1.40px pada 60px, -0.88px pada 44px
- Peran: Headline hero landing page, section display heading. Maksimum 2–3 instance per halaman. Memberikan kehangatan dan kepribadian tanpa mengorbankan keterbacaan.

**Inter — Semua teks UI tanpa pengecualian**
- Weights: 400, 500, 600
- Ukuran: 12px, 13px, 14px, 15px, 16px, 17px, 19px, 23px, 44px
- Line height: 1.00–1.58
- Letter spacing: Semakin besar ukuran, semakin negatif tracking (lihat skala di bawah)
- Peran: Navigasi, body copy, label kartu, tombol, caption, form, tabel, semua teks portal

### 3.3 Skala Tipografi

| Peran | Ukuran | Line Height | Letter Spacing | Token |
|-------|--------|-------------|----------------|-------|
| caption | 12px | 1.58 | -0.14px | `--text-caption` |
| caption-sm | 11px | 1.50 | -0.10px | `--text-caption-sm` |
| body-sm | 13px | 1.50 | -0.17px | `--text-body-sm` |
| body | 15px | 1.47 | -0.20px | `--text-body` |
| body-lg | 17px | 1.47 | -0.22px | `--text-body-lg` |
| heading-sm | 19px | 1.38 | -0.25px | `--text-heading-sm` |
| heading | 23px | 1.20 | -0.44px | `--text-heading` |
| heading-lg | 44px | 1.09 | -1.14px | `--text-heading-lg` |
| display-sm | 60px | 1.09 | -1.80px | `--text-display-sm` |
| display | 68px | 1.09 | -2.11px | `--text-display` |

---

## 4. Spacing & Bentuk

### 4.1 Unit Dasar

**Base unit:** 4px. Semua spacing adalah kelipatan 4.

### 4.2 Skala Spacing

| Nama | Nilai | Token |
|------|-------|-------|
| 4 | 4px | `--spacing-4` |
| 8 | 8px | `--spacing-8` |
| 12 | 12px | `--spacing-12` |
| 16 | 16px | `--spacing-16` |
| 20 | 20px | `--spacing-20` |
| 24 | 24px | `--spacing-24` |
| 32 | 32px | `--spacing-32` |
| 40 | 40px | `--spacing-40` |
| 48 | 48px | `--spacing-48` |
| 64 | 64px | `--spacing-64` |
| 80 | 80px | `--spacing-80` |
| 96 | 96px | `--spacing-96` |
| 120 | 120px | `--spacing-120` |
| 160 | 160px | `--spacing-160` |

### 4.3 Border Radius

| Elemen | Nilai | Token |
|--------|-------|-------|
| Tag, badge | 6px | `--radius-tag` |
| Kartu standar | 10px | `--radius-card` |
| Input, textarea | 10px | `--radius-input` |
| Kartu besar | 24px | `--radius-card-lg` |
| Tombol pill | 32px | `--radius-pill` |
| Ikon container | 40px | `--radius-icon` |
| Ilustrasi container | 72px | `--radius-illustration` |
| Avatar | 9999px | `--radius-full` |

### 4.4 Shadows

| Nama | Nilai | Token | Penggunaan |
|------|-------|-------|------------|
| subtle | `color(display-p3 0.94902 0.941176 0.929412) 0px 0px 0px 1px inset` | `--shadow-subtle` | Semua white card — border inset hangat |
| subtle-3 | `rgba(0, 0, 0, 0.04) 0px 0px 0px 1px` | `--shadow-subtle-3` | Navigation bar outline |
| sm | `rgba(0, 0, 0, 0.04) 0px 1px 6px 0px, rgba(0, 0, 0, 0.05) 0px 0px 24px 0px` | `--shadow-sm` | Hover state kartu, elevated state |
| lg | `rgba(0, 0, 0, 0.15) 0px 0px 24px 0px` | `--shadow-lg` | Dark surface komponen kritis |
| teal-glow | `rgba(45, 212, 191, 0.15) 0px 0px 24px 0px` | `--shadow-teal` | CTA button teal, elemen aktif kritis |

---

## 5. Layout

### 5.1 Landing Page

- **Max-width:** 1200px, terpusat di warm canvas
- **Top Navigation:** Sticky, height 64px, logo kiri, links tengah, CTA kanan
- **Hero:** Full viewport, headline Family typeface terpusat, dua karakter blob kiri dan kanan headline
- **Section gap:** 120–160px antar section
- **Card padding:** 32px
- **Grid:** 3-kolom untuk feature cards, 2-kolom untuk split content sections
- **Footer:** Minimal, link grid di atas canvas background

### 5.2 Portal (Post-Login — Patient, Doctor, Admin)

- **Layout:** SPA dengan sidebar + area konten utama, terinspirasi Claude
- **Sidebar width:** 260px (expanded), 64px (collapsed)
- **Sidebar default:** Expanded
- **Content area:** Lebar penuh setelah sidebar, max-width konten inner 860px untuk readability
- **Content padding:** 32px horizontal, 40px vertikal
- **Top bar portal:** Tinggi 56px, breadcrumb kiri, user avatar + notifikasi kanan
- **Sidebar collapsible:** Toggle dengan animasi slide 0.2s ease
- **Mobile:** Sidebar menjadi drawer overlay, content area full-width

### 5.3 Struktur Halaman Portal

```
[Sidebar 260px] | [Content Area]
                  [Top Bar 56px]
                  [Main Content — max 860px inner]
```

---

## 6. Komponen

### 6.1 Tombol

**Primary CTA — Teal Pill**
Peran: Aksi konversi utama — "Mulai Gratis", "Grant Access", "Simpan Rekam Medis"

Background `#2DD4BF`, teks `#121212` (dark pada teal muda untuk kontras optimal), border-radius 32px, padding `8px 20px`. Inter 14px weight 600. Hover: background `#0D9488`, teks `#ffffff`, transisi 0.2s ease. Box-shadow hover: `rgba(45, 212, 191, 0.25) 0px 0px 16px 0px`.

**CTA Sekunder — Dark Pill**
Peran: Aksi utama alternatif — "Daftar sebagai Dokter", "Lihat Demo"

Background `#121212`, teks `#ffffff`, border-radius 32px, padding `8px 20px`. Inter 14px weight 500. Hover: background `#343433`, transisi 0.2s ease.

**Ghost Light — Cream Pill**
Peran: Aksi tersier — "Log In", "Batal", "Kembali"

Background `#f2f0ed`, teks `#121212`, border-radius 32px, padding `8px 20px`. Inter 14px weight 500.

**Tombol Destruktif**
Peran: Revoke akses, hapus sesi

Background `transparent`, border `1px solid #EF4444`, teks `#EF4444`, border-radius 32px, padding `8px 20px`. Inter 14px weight 500. Hover: background `#FEF2F2`.

**Inline Text Link**
Peran: Link CTA di dalam paragraf atau section

Background transparent, teks `#2DD4BF` (atau `#0D9488` pada background cream), no border. Inter 14–15px weight 500. Underline none, hover: teks `#0D9488`.

### 6.2 Kartu

**Feature Card — White**
Peran: Kartu konten utama — fitur landing, info panel dashboard

Background `#ffffff`, box-shadow inset warm stone `color(display-p3 0.949 0.941 0.929) 0px 0px 0px 1px inset`, border-radius 10px, padding 32px. Hover: tambah `--shadow-sm`. Teknik inset shadow menjaga kartu tetap flat dan terasa hand-placed di atas canvas.

**Feature Card — Warm Cream**
Peran: Panel sekunder, container screenshot, preview demo

Background `#f8f7f4`, no shadow, border-radius 12px, padding 24px. Sedikit tenggelam di bawah white card — perbedaan tone menciptakan kedalaman satu level tanpa shadow.

**Dark Surface Card**
Peran: Komponen kritis yang butuh perhatian penuh — modal konfirmasi penting, alert kritis, preview blockchain hash

Background `#121212`, border-radius 16px, padding 32px, box-shadow `rgba(0,0,0,0.15) 0px 0px 24px 0px`. Teks utama `#ffffff`, teks sekunder `rgba(255,255,255,0.6)`. Gunakan sangat hemat — maksimum satu per halaman.

**Dashboard Widget Card**
Peran: List-based widget di patient/doctor dashboard

Background `#ffffff`, box-shadow inset stone, border-radius 10px, padding 20px 24px. Lebih compact dari Feature Card. Item list di dalam dengan separator `#f2f0ed` 1px.

**Sidebar Card**
Peran: Quick summary info di sidebar dokter

Background `#f8f7f4`, border-radius 10px, padding 16px. No shadow. Compact.

### 6.3 Navigasi

**Top Navigation — Landing Page**
Background `#fbfaf9`, height 64px, box-shadow `rgba(0,0,0,0.04) 0px 0px 0px 1px`. Logo kiri: Family typeface 16px weight 500 `#343433` + ikon shield teal. Link tengah: Inter 14px weight 500 `#343433`. Kanan: Ghost cream pill "Masuk" + Teal pill "Mulai Gratis".

**Sidebar — Portal**
Background `#fbfaf9` (sama dengan canvas, border-right `1px solid #f2f0ed`). Width 260px expanded, 64px collapsed. Logo area atas 64px height. Nav items: Inter 14px weight 500, warna normal `#474645`, warna aktif `#121212` dengan background `#f2f0ed` dan aksen teal 3px kiri. Group labels: Inter 11px weight 600 uppercase `#848281` letter-spacing 0.06em. Transisi collapse: 0.2s ease, ikon tetap terlihat saat collapsed.

**Top Bar — Portal**
Background `#fbfaf9`, height 56px, border-bottom `1px solid #f2f0ed`. Breadcrumb kiri Inter 14px `#848281` → `#343433`. Kanan: ikon notifikasi (bell) `#474645` + avatar bulat 32px + nama Inter 14px `#343433`.

### 6.4 Form & Input

**Text Input**
Background `#ffffff`, border `1px solid #f2f0ed`, border-radius 10px, padding `10px 14px`. Inter 15px `#474645`. Focus: border `1.5px solid #2DD4BF`, box-shadow `rgba(45,212,191,0.12) 0px 0px 0px 3px`. Placeholder `#a7a7a7`. Valid state: border `#00C454`. Error state: border `#EF4444`.

**Textarea**
Sama dengan Text Input. Min-height 100px. Resize: vertical only.

**Select**
Sama dengan Text Input dengan chevron kanan `#848281`.

**Label**
Inter 13px weight 500 `#343433`, margin-bottom 6px.

**Helper Text**
Inter 12px `#848281`, margin-top 4px.

**Error Message**
Inter 12px `#EF4444`, margin-top 4px, dengan ikon warning kecil.

**File Upload (KYC Doctor)**
Dashed border `1.5px dashed #c6c6c6`, border-radius 10px, background `#f8f7f4`, padding 32px, teks `#848281` Inter 14px. Hover: border `#2DD4BF`, background `#F0FDFA`. Uploaded state: border `#00C454`, tampilkan nama file + ikon checkmark.

### 6.5 AI Chat Interface

Peran: Fitur inti journaling pasien dan RAG dokter

**Layout Chat:**
- Container chat: width penuh content area, max-width 720px, centered
- Pesan pasien: bubble kanan, background `#2DD4BF`, teks `#121212`, border-radius `18px 18px 4px 18px`, padding `10px 16px`, max-width 75%
- Pesan AI (MedProof AI): bubble kiri, background `#ffffff` dengan inset stone shadow, teks `#474645`, border-radius `18px 18px 18px 4px`, padding `10px 16px`, max-width 80%
- Avatar AI: lingkaran 32px dengan karakter blob teal kecil, kiri atas bubble AI
- Timestamp: Inter 11px `#a7a7a7`, bawah bubble, right-aligned untuk pasien, left-aligned untuk AI

**Typing Indicator:**
Tiga titik animasi di bubble AI. Titik bulat 6px `#2DD4BF`, animasi bounce dengan delay bertahap (0s, 0.15s, 0.30s), durasi 0.8s infinite. Muncul saat AI sedang memproses streaming response.

**Input Area:**
Sticky bottom, background `#fbfaf9`, border-top `1px solid #f2f0ed`, padding 16px. Textarea input (1–4 baris auto-expand), tombol kirim teal pill kanan.

**Disclaimer AI:**
Banner tipis di atas area chat: background `#F0FDFA`, border `1px solid #CCFBF1`, teks Inter 12px `#0D9488`: "MedProof AI bukan alat diagnosis. Selalu konsultasikan kondisi Anda dengan dokter."

### 6.6 Consent Wizard (3 Steps)

Peran: Pasien memberikan akses ke dokter — step-by-step

**Container:** Modal overlay, background `#ffffff`, border-radius 16px, padding 40px, max-width 560px, box-shadow `rgba(0,0,0,0.12) 0px 8px 32px`.

**Progress Indicator:**
Tiga lingkaran kecil (12px) connected dengan garis. Step selesai: fill teal `#2DD4BF`. Step aktif: border `1.5px solid #2DD4BF`, fill `#F0FDFA`. Step belum: fill `#f2f0ed`. Label step: Inter 12px `#848281` di bawah setiap titik.

**Step 1 — Pilih Dokter:**
Display kartu dokter (nama, spesialisasi, kode akses) dari QR scan atau input kode 6 digit. Konfirmasi identitas dokter sebelum lanjut.

**Step 2 — Pilih Scope & Durasi:**
Toggle cards untuk: Scope 1 saja / Scope 2 saja / Keduanya. Sub-toggle Scope 2: Mental health saja / Fisik saja / Keduanya. Dropdown durasi akses (1 hari, 3 hari, 1 minggu, 1 bulan, custom). Toggle izin download attachment.

**Step 3 — Konfirmasi:**
Summary akses yang akan diberikan dalam bahasa plain. Tombol "Konfirmasi & Berikan Akses" teal pill. Teks disclaimer kecil tentang revoke kapan saja.

### 6.7 QR Code — Modal Overlay

**Container:** Overlay gelap `rgba(0,0,0,0.5)`, modal background `#ffffff`, border-radius 16px, padding 40px, max-width 360px, centered.

**Isi:**
- Heading Inter 600 19px `#343433`: "QR Code Dokter Anda"
- QR code container: background `#121212`, border-radius 12px, padding 20px
- Di bawah QR: "atau bagikan kode akses"
- Doctor Access Code: Monospace Inter 600 28px `#343433`, background `#f8f7f4`, border-radius 10px, padding `12px 24px`, letter-spacing 0.1em, centered
- Tombol "Tutup" ghost cream pill

### 6.8 Blockchain Verified Badge

Peran: Indikator subtle bahwa rekam medis atau event telah di-hash ke Polygon

**Badge Style:**
Sangat subtle. Background `#F0FDFA`, border `1px solid #CCFBF1`, border-radius 6px, padding `2px 8px`. Ikon gembok (🔒 atau SVG custom) 12px `#0D9488` + teks Inter 11px weight 500 `#0D9488`: "Terverifikasi di Blockchain". 

**Posisi:** Kanan bawah kartu rekam medis atau kanan header audit entry. Jangan di atas fold atau posisi dominan — ia harus hadir tetapi tidak bersaing dengan konten utama.

**Hash Display (Inline):**
Untuk menampilkan hash value: font monospace (font-family: `'SF Mono', 'Consolas', monospace`), Inter 11px, warna `#848281`, truncated dengan tooltip full hash on hover. Background inline: `#f8f7f4`, border-radius 4px, padding `1px 6px`. **Tidak** menggunakan dark surface untuk hash inline.

### 6.9 Data Table — Audit Log

**Style:** Compact. Row height 40px. Sangat efisien vertikal.

**Header:** Background `#f8f7f4`, border-bottom `1.5px solid #f2f0ed`. Inter 12px weight 600 uppercase `#848281` letter-spacing 0.05em.

**Row:** Background alternating — baris ganjil `#ffffff`, baris genap `#fbfaf9`. Border-bottom `1px solid #f2f0ed`. Inter 13px `#474645`. Hover: background `#f8f7f4`.

**Cell padding:** 8px 12px horizontal, 0 vertikal (vertikal dihandle row height).

**Status cell:** Badge inline compact (lihat Badge component).

### 6.10 Timeline — Audit Trail

Peran: Visualisasi kronologis aktivitas sensitif pasien

**Container:** Vertical timeline, padding-left 32px.

**Garis timeline:** 2px solid `#f2f0ed`, berjalan vertikal dari atas ke bawah.

**Entry:**
- Titik timeline: lingkaran 10px, fill `#2DD4BF` untuk event teal/positif, fill `#EF4444` untuk event destruktif, fill `#848281` untuk event netral. Posisi center pada garis.
- Konten kanan: tanggal-waktu Inter 12px `#848281` + deskripsi event Inter 14px `#474645` + badge blockchain jika applicable
- Gap antar entry: 24px

### 6.11 Badge & Label

**Status Badge:**
Border-radius 6px, padding `2px 8px`, Inter 11px weight 600.
- Active: background `#CCFBF1`, teks `#0D9488`
- Expired: background `#f2f0ed`, teks `#848281`
- Revoked: background `#FEE2E2`, teks `#EF4444`
- Pending: background `#FEF3C7`, teks `#D97706`

**Data Scope Badge:**
- Mental Health: background `#EDE9FE`, teks `#7C3AED`, Inter 11px weight 500
- Fisik: background `#DBEAFE`, teks `#1D4ED8`, Inter 11px weight 500
- Scope 1: background `#F0FDFA`, teks `#0D9488`, Inter 11px weight 500
- Scope 2: background `#FEF3C7`, teks `#D97706`, Inter 11px weight 500

### 6.12 Disclaimer / Warning Component

**Medical Disclaimer:**
Background `#FEF3C7`, border-left `3px solid #F59E0B`, border-radius `0 8px 8px 0`, padding `12px 16px`. Ikon warning segitiga `#F59E0B` + teks Inter 13px `#474645`.

Contoh teks: *"Informasi ini bukan diagnosis medis. MedProof hanya menyimpan dan memverifikasi data kesehatan Anda. Konsultasikan selalu dengan dokter berlisensi."*

**Info Banner:**
Background `#EFF6FF`, border-left `3px solid #3B82F6`, border-radius `0 8px 8px 0`, padding `12px 16px`. Ikon info `#3B82F6` + teks Inter 13px `#474645`.

**Success Banner:**
Background `#F0FDF4`, border-left `3px solid #00C454`, border-radius `0 8px 8px 0`, padding `12px 16px`. Ikon check `#00C454` + teks Inter 13px `#474645`.

**Danger Banner:**
Background `#FEF2F2`, border-left `3px solid #EF4444`, border-radius `0 8px 8px 0`, padding `12px 16px`. Ikon X `#EF4444` + teks Inter 13px `#474645`.

---

## 7. Sistem Ilustrasi

### 7.1 Filosofi Ilustrasi

Sistem ilustrasi MedProof adalah warisan langsung dari Family.co, diadaptasi untuk konteks medis. Karakter blob hadir bukan sebagai dekorasi, melainkan sebagai strategi trust: membuat subjek berat (data medis, blockchain, enkripsi) terasa approachable. Ilustrasi harus minimal dan disengaja: gunakan hanya ketika membantu pemahaman, onboarding, atau identitas brand.

**Budget global ilustrasi:** Maksimum **1–5 ilustrasi ikonik untuk seluruh project**. Alokasi default: landing page maksimal 2 ilustrasi, dashboard/portal maksimal 3 ilustrasi total. Jangan membuat ilustrasi baru untuk setiap halaman, state, atau step. Prioritaskan UI bersih, hirarki informasi, spacing, tipografi, reusable components, dan usability di atas dekorasi visual.

### 7.2 Karakter Blob

**Kosakata bentuk:** Organik, tidak ada geometri kaku. Blob bulat tidak sempurna dengan anggota tubuh tipis (stick limbs), mata titik ekspresif (dot eyes), dan kurva mulut sederhana. Setiap karakter menggunakan satu warna dominan dari palet ilustrasi dengan stroke lebih gelap untuk kedalaman.

**Karakter utama landing page:**
- **Karakter kiri:** Blob teal (`#2DD4BF`) dengan stroke `#0D9488`, membawa ikon shield atau stethoscope kecil — representasi keamanan dan kepercayaan medis
- **Karakter kanan:** Blob amber (`#FBBF24`) dengan stroke `#D97706`, membawa ikon hati atau bintang — representasi kepedulian dan wellness

Gunakan satu atau dua karakter saja di hero. Jika dua karakter dipakai, keduanya menghitung 2 dari budget global 1–5 ilustrasi.

**Ukuran:** 80–140px pada hero. 40–60px untuk empty states dan onboarding.

### 7.3 Objek Medis (Object Vocabulary)

Objek-objek flat ini adalah kosakata visual untuk ilustrasi yang sudah masuk budget global, bukan izin untuk menambah dekorasi bebas:
- **Shield** (`#A78BFA` fill, `#7C3AED` stroke) — keamanan data
- **Stethoscope** (`#0D9488` fill) — koneksi dokter
- **Pill/Capsule** (`#FBBF24` + `#F87171` split) — Scope 1 rekam medis
- **Heartbeat line** (`#FB7185` fill) — health journaling
- **Lock** (`#2DD4BF` fill, `#0D9488` stroke) — blockchain proof
- **DNA helix** (`#A78BFA` fill) — data medis
- **Star** (`#FBBF24` fill) — milestone atau AI session selesai

### 7.4 Aturan Penggunaan

1. **Global cap:** Maksimum 1–5 ilustrasi ikonik untuk seluruh project. Setiap ilustrasi baru harus punya tujuan jelas: pemahaman, onboarding, atau brand identity.
2. **Hero landing page:** Maksimal 2 karakter mengelilingi headline. Lengan/bagian tubuh boleh tumpang tindih teks untuk efek kedalaman. Posisi asimetris.
3. **Dashboard/portal:** Maksimal 3 ilustrasi total untuk semua dashboard dan portal. Utamakan empty state penting atau onboarding, bukan dekorasi.
4. **Dashboard empty states:** Satu karakter kecil (40px) + teks helper + CTA. Reuse aset yang sama jika state mirip.
5. **Onboarding:** Gunakan maksimal satu ilustrasi shared untuk wizard atau gunakan icon-only steps. Jangan buat pose/ilustrasi unik untuk setiap step.
6. **Maksimum 2 karakter per scene.** Jangan padat seperti Family.co — MedProof perlu lebih restraint.
7. **Tidak ada ilustrasi di dalam portal setelah login** selain empty states dan onboarding yang masuk budget. Portal adalah data-focused.

---

## 8. Motion

### 8.1 Prinsip Motion

Motion MedProof harus terasa **confident tapi quiet** — menambah kehalusan tanpa mengalihkan perhatian dari data medis. Gunakan motion untuk: konfirmasi aksi (consent berhasil), transisi halaman, dan entrance komponen pada scroll. Jangan gunakan motion sebagai entertainment di portal — simpan untuk landing page.

### 8.2 Durasi & Easing

| Konteks | Durasi | Easing | Penggunaan |
|---------|--------|--------|------------|
| Mikro-interaksi | 0.15s | ease | Hover tombol, toggle, checkbox |
| Transisi UI | 0.20s | ease | Perubahan background, border color, box-shadow |
| Entrance komponen | 0.30s | cubic-bezier(0.19, 1, 0.22, 1) | Kartu muncul saat scroll |
| Karakter ilustrasi | 1.0s | cubic-bezier(0.19, 1, 0.22, 1) | Spring bounce saat halaman load |
| Sidebar collapse | 0.20s | ease | Width transition sidebar |
| Modal entrance | 0.25s | cubic-bezier(0.34, 1.56, 0.64, 1) | Slight overshoot untuk modal |
| Typing indicator | 0.80s | ease-in-out | Bounce loop tiga titik |

### 8.3 Pola Motion Utama

**Karakter Ilustrasi (Landing):**
Karakter masuk dengan spring bounce saat halaman pertama load. Transform: translateY(20px) → translateY(0) + scale(0.9) → scale(1). Floating idle: keyframe animation `float` dengan translateY(0 → -8px → 0), durasi 3s infinite ease-in-out. Karakter kiri dan kanan memiliki delay berbeda (0s dan 0.5s) untuk efek asimetris yang hidup.

**Tombol:**
Hover: `transform: translateY(-1px)`, background color transition 0.15s ease. Active: `transform: translateY(0px)` kembali.

**Kartu:**
Hover: `box-shadow` transition dari inset stone ke `--shadow-sm`, 0.20s ease.

**Typing Indicator AI:**
```css
@keyframes typing-bounce {
  0%, 100% { transform: translateY(0); opacity: 0.5; }
  50% { transform: translateY(-4px); opacity: 1; }
}
```
Titik 1: delay 0s, Titik 2: delay 0.15s, Titik 3: delay 0.30s.

**Blockchain Badge:**
Tidak ada animasi permanen. Hanya entrance subtle (opacity 0 → 1, 0.30s) saat kartu rekam medis pertama kali muncul.

---

## 9. Portal-Spesifik

### 9.1 Patient Portal

**Sidebar items:**
- Dashboard (ikon home)
- Rekam Medis — Scope 1 (ikon file-medical)
- Jurnal Kesehatan — Scope 2 (ikon chat/brain)
- AI Chat (ikon sparkles)
- Akses Dokter (ikon key)
- Riwayat & Audit (ikon clock)
- Pengaturan (ikon settings)

**Dashboard layout:** List-based. Widget utama:
1. Ringkasan akses aktif saat ini (dokter siapa, scope apa, kapan expired)
2. Aktivitas terbaru (timeline mini 5 entry terakhir)
3. Sesi AI terakhir (judul + tanggal + CTA "Lanjutkan")
4. Shortcut: "Mulai Sesi AI" + "Tambah Akses Dokter"

### 9.2 Doctor Portal

**Sidebar items:**
- Dashboard
- Pasien Aktif (ikon users)
- Tambah Rekam Medis (ikon file-plus)
- RAG AI — Tanya Data Pasien (ikon brain)
- QR Code Saya (ikon qr-code)
- Profil & Verifikasi (ikon shield-check)

**Dashboard layout:** List-based.
1. Daftar pasien yang memberikan akses aktif
2. Scope yang diizinkan per pasien + durasi tersisa
3. Aktivitas tambah rekam medis terbaru
4. Status verifikasi dokter (badge "Terverifikasi" teal atau "Menunggu Persetujuan" amber)

### 9.3 Admin Portal

**Sidebar items:**
- Dashboard
- Antrian Verifikasi Dokter (ikon clipboard-check)
- Dokter Terverifikasi (ikon user-check)
- Log Aktivitas Admin (ikon activity)

**Dashboard layout:** List-based.
1. Jumlah dokter menunggu persetujuan (badge counter merah jika > 0)
2. Antrian verifikasi terbaru dalam tabel compact
3. Aktivitas admin terbaru dalam timeline

---

## 10. Permukaan (Surfaces)

| Level | Nama | Nilai | Tujuan |
|-------|------|-------|--------|
| 1 | Canvas | `#fbfaf9` | Background halaman, sidebar background — warm off-white |
| 2 | Card Surface | `#ffffff` | Wajah kartu putih dengan inset stone border |
| 3 | Recessed Panel | `#f8f7f4` | Container screenshot, panel sekunder, hover row table |
| 4 | Stone Tint | `#f2f0ed` | Background tombol ghost, border reference, divider |
| 5 | Dark Shell | `#121212` | Dark surface untuk komponen kritis, modal konfirmasi |

---

## 11. Responsif & Mobile

### 11.1 Breakpoints

| Nama | Nilai | Perilaku |
|------|-------|---------|
| xs | 375px | Base mobile |
| sm | 640px | Tablet portrait |
| md | 768px | Tablet landscape |
| lg | 1024px | Desktop compact |
| xl | 1280px | Desktop standard |

### 11.2 Penyesuaian Mobile

- **Landing page hero:** Display font turun ke 44px pada mobile (dari 68px desktop). Dua karakter ilustrasi diposisikan di atas-bawah headline, bukan kiri-kanan.
- **Sidebar portal:** Berubah menjadi drawer yang muncul dari kiri, overlay gelap `rgba(0,0,0,0.4)`. Toggle melalui hamburger icon di top bar.
- **Data table:** Horizontal scroll pada mobile untuk tabel audit. Prioritaskan kolom: tanggal, event, status. Kolom hash tersembunyi di mobile.
- **Consent wizard:** Full-screen modal pada mobile, bukan centered overlay.
- **Chat interface:** Full-screen pada mobile, input sticky bottom.
- **Tombol:** Minimum touch target 44px height.

---

## 12. Do's dan Don'ts

### Do
- Gunakan `#fbfaf9` sebagai background halaman — tidak pernah pure white `#ffffff` di level canvas.
- Terapkan inset stone border pada semua white card sebagai pengganti CSS border biasa.
- Gunakan border-radius 32px untuk semua pill button.
- Terapkan negative letter-spacing pada semua teks besar: -2.11px pada 68px, -1.14px pada 44px, scaling mendekati nol pada ukuran body.
- Batasi Fraunces/Family font hanya untuk display heading (44px dan 68px) — Inter menangani semua teks UI.
- Gunakan `#2DD4BF` teal hanya untuk **satu elemen UI per viewport** — kelangkaannya adalah kekuatannya.
- Jaga budget ilustrasi global: 1–5 ilustrasi ikonik untuk seluruh project, landing maksimal 2, dashboard/portal maksimal 3.
- Jika hero memakai ilustrasi, posisikan karakter secara asimetris dan biarkan sedikit tumpang tindih dengan bounding box headline.
- Sertakan disclaimer AI pada setiap halaman yang menampilkan output AI.
- Gunakan badge scope (Mental Health, Fisik) untuk memberi konteks visual pada data Scope 2.

### Don't
- Jangan gunakan drop shadow pada content card — inset warm-stone border adalah satu-satunya mekanisme definisi permukaan untuk kartu biasa.
- Jangan gunakan pure `#ffffff` sebagai background halaman — warm cream `#fbfaf9` adalah minimum threshold kehangatan.
- Jangan gunakan ilustrasi karakter di dalam portal setelah login, kecuali pada empty state dan onboarding yang masuk budget global.
- Jangan campur Inter weight 700+ dengan Family/Fraunces display font — maksimum Inter weight 600.
- Jangan gunakan lebih dari satu elemen teal `#2DD4BF` per viewport — overuse menghancurkan hirarki visual.
- Jangan gunakan border-radius di bawah 10px pada kartu — minimum radius kartu adalah 10px.
- Jangan tampilkan blockchain hash secara prominent — ia harus ada tetapi subtle, tersedia saat dibutuhkan.
- Jangan hilangkan disclaimer "bukan diagnosis medis" pada halaman atau fitur apapun yang menggunakan AI.
- Jangan gunakan linear easing pada animasi yang terlihat — platform ini expressive, bukan mechanical.
- Jangan gunakan lebih dari dua karakter ilustrasi per scene.
- Jangan gunakan lebih dari 5 ilustrasi ikonik di seluruh project.

---

## 13. CSS Custom Properties — Quick Start

```css
:root {
  /* === SURFACES === */
  --color-warm-canvas: #fbfaf9;
  --color-stone-surface: #f2f0ed;
  --color-parchment-card: #f8f7f4;

  /* === TEXT === */
  --color-graphite: #474645;
  --color-charcoal-primary: #343433;
  --color-midnight: #121212;
  --color-ash: #848281;
  --color-fog: #c6c6c6;
  --color-smoke: #a7a7a7;
  --color-obsidian: #000000;

  /* === BRAND TEAL === */
  --color-teal-primary: #2DD4BF;
  --color-teal-deep: #0D9488;
  --color-teal-muted: #CCFBF1;
  --color-teal-surface: #F0FDFA;

  /* === STATUS === */
  --color-valid-green: #00C454;
  --color-error-red: #EF4444;
  --color-warning-amber: #F59E0B;
  --color-info-blue: #3B82F6;

  /* === ILLUSTRATION === */
  --graphic-teal: #2DD4BF;
  --graphic-amber: #FBBF24;
  --graphic-coral: #FB7185;
  --graphic-lavender: #A78BFA;
  --graphic-amber-deep: #D97706;
  --graphic-teal-deep: #0D9488;

  /* === TYPOGRAPHY === */
  --font-family: 'Fraunces', ui-serif, Georgia, serif;
  --font-inter: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;

  /* === TYPE SCALE === */
  --text-caption: 12px;
  --leading-caption: 1.58;
  --tracking-caption: -0.14px;

  --text-body-sm: 13px;
  --leading-body-sm: 1.50;
  --tracking-body-sm: -0.17px;

  --text-body: 15px;
  --leading-body: 1.47;
  --tracking-body: -0.20px;

  --text-body-lg: 17px;
  --leading-body-lg: 1.47;
  --tracking-body-lg: -0.22px;

  --text-heading-sm: 19px;
  --leading-heading-sm: 1.38;
  --tracking-heading-sm: -0.25px;

  --text-heading: 23px;
  --leading-heading: 1.20;
  --tracking-heading: -0.44px;

  --text-heading-lg: 44px;
  --leading-heading-lg: 1.09;
  --tracking-heading-lg: -1.14px;

  --text-display-sm: 60px;
  --leading-display-sm: 1.09;
  --tracking-display-sm: -1.80px;

  --text-display: 68px;
  --leading-display: 1.09;
  --tracking-display: -2.11px;

  /* === SPACING === */
  --spacing-4: 4px;
  --spacing-8: 8px;
  --spacing-12: 12px;
  --spacing-16: 16px;
  --spacing-20: 20px;
  --spacing-24: 24px;
  --spacing-32: 32px;
  --spacing-40: 40px;
  --spacing-48: 48px;
  --spacing-64: 64px;
  --spacing-80: 80px;
  --spacing-96: 96px;
  --spacing-120: 120px;
  --spacing-160: 160px;

  /* === BORDER RADIUS === */
  --radius-tag: 6px;
  --radius-card: 10px;
  --radius-input: 10px;
  --radius-card-lg: 24px;
  --radius-pill: 32px;
  --radius-icon: 40px;
  --radius-illustration: 72px;
  --radius-full: 9999px;

  /* === SHADOWS === */
  --shadow-subtle: color(display-p3 0.94902 0.941176 0.929412) 0px 0px 0px 1px inset;
  --shadow-subtle-3: rgba(0, 0, 0, 0.04) 0px 0px 0px 1px;
  --shadow-sm: rgba(0, 0, 0, 0.04) 0px 1px 6px 0px, rgba(0, 0, 0, 0.05) 0px 0px 24px 0px;
  --shadow-lg: rgba(0, 0, 0, 0.15) 0px 0px 24px 0px;
  --shadow-teal: rgba(45, 212, 191, 0.15) 0px 0px 24px 0px;

  /* === LAYOUT === */
  --page-max-width: 1200px;
  --content-max-width: 860px;
  --sidebar-width: 260px;
  --sidebar-collapsed-width: 64px;
  --topbar-height: 56px;
  --nav-height: 64px;
  --section-gap: 120px;
  --card-padding: 32px;
}
```

---

## 14. Tailwind v4 Theme

```css
@theme {
  --color-warm-canvas: #fbfaf9;
  --color-stone-surface: #f2f0ed;
  --color-parchment-card: #f8f7f4;
  --color-graphite: #474645;
  --color-charcoal-primary: #343433;
  --color-midnight: #121212;
  --color-ash: #848281;
  --color-fog: #c6c6c6;
  --color-smoke: #a7a7a7;
  --color-teal-primary: #2DD4BF;
  --color-teal-deep: #0D9488;
  --color-teal-muted: #CCFBF1;
  --color-teal-surface: #F0FDFA;
  --color-valid-green: #00C454;
  --color-error-red: #EF4444;
  --color-warning-amber: #F59E0B;
  --color-info-blue: #3B82F6;

  --font-family: 'Fraunces', ui-serif, Georgia, serif;
  --font-inter: 'Inter', ui-sans-serif, system-ui, sans-serif;

  --text-caption: 12px;
  --text-body-sm: 13px;
  --text-body: 15px;
  --text-body-lg: 17px;
  --text-heading-sm: 19px;
  --text-heading: 23px;
  --text-heading-lg: 44px;
  --text-display-sm: 60px;
  --text-display: 68px;

  --spacing-4: 4px;
  --spacing-8: 8px;
  --spacing-12: 12px;
  --spacing-16: 16px;
  --spacing-20: 20px;
  --spacing-24: 24px;
  --spacing-32: 32px;
  --spacing-40: 40px;
  --spacing-48: 48px;
  --spacing-64: 64px;
  --spacing-80: 80px;
  --spacing-96: 96px;
  --spacing-120: 120px;

  --radius-tag: 6px;
  --radius-card: 10px;
  --radius-input: 10px;
  --radius-card-lg: 24px;
  --radius-pill: 32px;
  --radius-icon: 40px;
  --radius-illustration: 72px;

  --shadow-subtle: color(display-p3 0.94902 0.941176 0.929412) 0px 0px 0px 1px inset;
  --shadow-subtle-3: rgba(0, 0, 0, 0.04) 0px 0px 0px 1px;
  --shadow-sm: rgba(0, 0, 0, 0.04) 0px 1px 6px 0px, rgba(0, 0, 0, 0.05) 0px 0px 24px 0px;
  --shadow-lg: rgba(0, 0, 0, 0.15) 0px 0px 24px 0px;
  --shadow-teal: rgba(45, 212, 191, 0.15) 0px 0px 24px 0px;
}
```

---

## 15. Panduan Prompt untuk AI Agent

### Quick Color Reference

```
Background halaman:    #fbfaf9 (warm cream — tidak pernah pure white)
Teks primer:           #474645 (Graphite)
Teks heading:          #343433 (Charcoal Primary)
CTA button (teal):     #2DD4BF background, #121212 text
CTA button (dark):     #121212 background, #ffffff text
CTA button (ghost):    #f2f0ed background, #121212 text
Brand accent / link:   #2DD4BF (Teal Primary) — gunakan hemat, max 1x per viewport
Border kartu:          box-shadow inset ~#f2f0ed 1px
Teks muted:            #848281 (Ash)
Error:                 #EF4444
Success:               #00C454
```

### Contoh Prompt Komponen

**1. Hero Landing Page:**
Background `#fbfaf9`. Center-aligned headline font Fraunces 500 68px, warna `#343433`, letter-spacing -2.11px, line-height 1.09. Subtext 16px Inter 400 `#474645`, max-width 480px. Dua tombol pill di bawah: teal (`#2DD4BF` background, `#121212` text, 32px radius) dan dark (`#121212` background, `#ffffff` text, 32px radius). Maksimal dua karakter blob: kiri teal `#2DD4BF` membawa shield, kanan amber `#FBBF24` membawa hati. Ukuran 100–120px, posisi asimetris, lengan tumpang tindih batas headline. Keduanya menghitung 2 dari budget global 1–5 ilustrasi project.

**2. Patient Dashboard:**
Sidebar 260px background `#fbfaf9`, border-right `1px solid #f2f0ed`. Active item: background `#f2f0ed`, border-left `3px solid #2DD4BF`, teks `#121212`. Content area padding 32px, max-width konten inner 860px. Widget list-based dengan kartu background `#ffffff`, inset stone shadow, border-radius 10px, padding 20px 24px.

**3. AI Chat Interface:**
Container max-width 720px. Bubble pasien kanan: background `#2DD4BF`, teks `#121212`, border-radius `18px 18px 4px 18px`. Bubble AI kiri: background `#ffffff`, inset stone shadow, teks `#474645`, border-radius `18px 18px 18px 4px`. Typing indicator: 3 titik `#2DD4BF` dengan bounce animation delay 0s, 0.15s, 0.30s. Disclaimer banner di atas chat: background `#F0FDFA`, border `1px solid #CCFBF1`, teks teal `#0D9488` 12px.

**4. Consent Wizard:**
Modal `#ffffff`, border-radius 16px, padding 40px, max-width 560px. Progress 3 step: titik 12px, aktif teal border, selesai teal fill, belum stone fill. Step labels Inter 12px `#848281`. CTA step terakhir: teal pill "Konfirmasi & Berikan Akses".

**5. Blockchain Badge:**
Background `#F0FDFA`, border `1px solid #CCFBF1`, border-radius 6px, padding `2px 8px`. Ikon gembok SVG 12px `#0D9488` + teks Inter 11px weight 500 `#0D9488`: "Terverifikasi". Posisi kanan bawah kartu rekam medis.

**6. Timeline Audit:**
Padding-left 32px, garis vertical 2px `#f2f0ed`. Titik timeline 10px: positif teal `#2DD4BF`, destruktif `#EF4444`, netral `#848281`. Konten kanan: tanggal Inter 12px `#848281` + deskripsi 14px `#474645`. Gap antar entry 24px.
```
