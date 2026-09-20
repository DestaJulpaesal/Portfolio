// Anggap URL "valid" kalau ada isinya dan bukan placeholder "#".
// Dipakai supaya tombol yang butuh link asli (CV, Demo, Source) cuma aktif kalau memang ada linknya.
export function hasRealUrl(url: string | undefined): url is string {
  return !!url && url !== "#";
}

export interface SocialLink {
  label: string;
  href: string;
  icon: "github" | "linkedin" | "tiktok" | "instagram" | "whatsapp";
}

export type PhotoTreatment = "natural" | "warm" | "cool" | "mono" | "cinema" | "vivid" | "soft";

export const PHOTO_TREATMENT_OPTIONS: { value: PhotoTreatment; label: string }[] = [
  { value: "natural", label: "Natural" },
  { value: "warm", label: "Warm editorial" },
  { value: "cool", label: "Cool clean" },
  { value: "mono", label: "Black & white" },
  { value: "cinema", label: "Cinema contrast" },
  { value: "vivid", label: "Vivid pop" },
  { value: "soft", label: "Soft portrait" },
];

export const profile = {
  name: "Desta Julpaesal",
  role: "Informatics Student & Web Developer",
  logoMark: "",
  logoImage: "/logo.png",
  availability: "Terbuka untuk kolaborasi & proyek",
  headlineTop: "Saya Membangun",
  headlineAccent: "Sistem & Solusi Web Modern",
  tagline:
    "Mahasiswa Teknik Informatika UNIKOM berlatar belakang SMK RPL. Berfokus pada pengembangan sistem web yang terstruktur, fungsional, dan mudah digunakan.",
  photo: "/projects/hero-cutout.png",
  location: "Citatah Nyalindung, Cirawamekar, Bandung Barat",
  email: "destajulpaesal@gmail.com", 
  phone: "+62 821-1899-6827",
  cvUrl: "#",
  stats: [
    { label: "Semester", value: "2" },
    { label: "Project Selesai", value: "10" },
    { label: "Fokus Utama", value: "Web & Desktop" },
  ],
  socials: [
    { label: "GitHub", href: "https://github.com/DestaJulpaesal", icon: "github" },
    { label: "LinkedIn", href: "https://linkedin.com/in/destajulpaesal", icon: "linkedin" },
    { label: "TikTok", href: "https://tiktok.com/@dstaafsl", icon: "tiktok" }, // Sesuaikan username TikTok kamu
    { label: "Instagram", href: "https://instagram.com/dstaafsl", icon: "instagram" },
    { label: "WhatsApp", href: "https://wa.me/6282118996827", icon: "whatsapp" }, // Sesuaikan nomor WhatsApp aktifmu
  ] as SocialLink[],
};

export const aboutBullets = [
  "Alumni SMK RPL dengan pemahaman logika pemrograman kuat",
  "Fokus pada Reusability & Clean Code (Java & Laravel)",
  "Senang memecahkan masalah melalui pengembangan sistem terintegrasi",
];

export const aboutText = {
  photo: "/projects/hero-cutout.png",
  paragraph:
    "Saya adalah mahasiswa Teknik Informatika di UNIKOM Bandung dengan latar belakang pendidikan vokasi di bidang Rekayasa Perangkat Lunak (RPL). Memiliki passion dalam pengembangan web serta Pemrograman Berorientasi Objek (PBO) menggunakan Java dan PHP/Laravel.",
};

export type SkillIcon =
  | "javascript"
  | "typescript"
  | "react"
  | "nextjs"
  | "nodejs"
  | "html5"
  | "css3"
  | "tailwind"
  | "mongodb"
  | "postgresql"
  | "git"
  | "docker"
  | "aws"
  | "figma"
  | "graphql"
  | "threejs"
  | "supabase"
  | "laravel"
  | "php"
  | "bootstrap"
  | "express"
  | "vscode"
  | "apache"
  | "java"
  | "mysql"
  | "sqlite"
  | "sqlyog";

// Daftar semua SkillIcon yang valid — dipakai di halaman admin (dropdown pilih
// icon) supaya tetap sinkron dengan union type di atas tanpa duplikasi manual.
export const SKILL_ICON_OPTIONS: SkillIcon[] = [
  "javascript",
  "typescript",
  "react",
  "nextjs",
  "nodejs",
  "html5",
  "css3",
  "tailwind",
  "mongodb",
  "postgresql",
  "git",
  "docker",
  "aws",
  "figma",
  "graphql",
  "threejs",
  "supabase",
  "laravel",
  "php",
  "bootstrap",
  "express",
  "vscode",
  "apache",
  "java",
  "mysql",
  "sqlite",
  "sqlyog",
];

export const skills: { name: string; icon: SkillIcon }[] = [
  { name: "Laravel", icon: "laravel" },
  { name: "Java", icon: "java" },
  { name: "JavaScript", icon: "javascript" },
  { name: "HTML5", icon: "html5" },
  { name: "CSS3", icon: "css3" },
  { name: "Tailwind CSS", icon: "tailwind" },
  { name: "React", icon: "react" },
  { name: "MySQL", icon: "mysql" },
  { name: "SQLite", icon: "sqlite" },
  { name: "MongoDB", icon: "mongodb" },
  { name: "SQLyog", icon: "sqlyog" },
  { name: "Git", icon: "git" },
  { name: "Supabase", icon: "supabase" },
];

export interface SkillCategory {
  name: string;
  items: { name: string; icon: SkillIcon }[];
}

// Skill dikelompokkan per kategori, dipakai di section "Skills & Stack"
export const skillCategories: SkillCategory[] = [
  {
    name: "Frontend",
    items: [
      { name: "HTML5", icon: "html5" },
      { name: "CSS3", icon: "css3" },
      { name: "JavaScript", icon: "javascript" },
      { name: "React", icon: "react" },
      { name: "Tailwind CSS", icon: "tailwind" },
      { name: "Bootstrap", icon: "bootstrap" },
    ],
  },
  {
    name: "Backend",
    items: [
      { name: "Laravel", icon: "laravel" },
      { name: "PHP", icon: "php" },
      { name: "Express.js", icon: "express" },
      { name: "Java", icon: "java" },
    ],
  },
  {
    name: "Database",
    items: [
      { name: "MySQL", icon: "mysql" },
      { name: "SQLite", icon: "sqlite" },
      { name: "MongoDB", icon: "mongodb" },
      { name: "SQLyog", icon: "sqlyog" },
    ],
  },
  {
    name: "Tools & Version Control",
    items: [
      { name: "Git", icon: "git" },
      { name: "Supabase", icon: "supabase" },
      { name: "VS Code", icon: "vscode" },
      { name: "Apache", icon: "apache" },
    ],
  },
];

// Beberapa tools utama yang ditonjolkan sebagai pill kecil di Hero
export const heroStack: { name: string; icon: SkillIcon }[] = [
  { name: "Laravel", icon: "laravel" },
  { name: "JavaScript", icon: "javascript" },
  { name: "Tailwind CSS", icon: "tailwind" },
  { name: "MySQL", icon: "mysql" },
];

export interface Project {
  name: string;
  summary: string;
  description: string;
  features: string[];
  stack: string[];
  href?: string;
  repo?: string;
  status: "live" | "source-only" | "in-progress" | "archived";
  image?: string;
}

export const projects: Project[] = [
  {
    name: "Portal Desa CirawaMekar",
    summary: "Portal informasi dan layanan publik terpadu untuk masyarakat CirawaMekar.",
    description:
      "Portal informasi dan pelayanan publik terpadu untuk Desa CirawaMekar, dibangun agar masyarakat bisa mengakses informasi desa, layanan administrasi, dan pengumuman secara online tanpa harus datang langsung ke kantor desa. Dibangun dengan Laravel dan Bootstrap, dengan MySQL sebagai basis data.",
    features: [
      "Informasi & pengumuman desa terkini",
      "Portal layanan administrasi publik",
      "Struktur data kependudukan terpusat",
    ],
    stack: ["Laravel", "Bootstrap", "MySQL"],
    image: "/projects/5.png",
    repo: "#",
    status: "source-only",
  },
  {
    name: "Absensi Siswa",
    summary: "Implementasi Pemrograman Berorientasi Objek berbasis Java untuk manajemen data.",
    description:
      "Aplikasi desktop yang dibangun untuk menerapkan konsep Pemrograman Berorientasi Objek (PBO) dalam manajemen data, menggunakan Java dengan IDE NetBeans dan MySQL sebagai basis data. Proyek ini berfokus pada penerapan class, inheritance, dan encapsulation dalam studi kasus nyata.",
    features: [
      "Manajemen data berbasis konsep OOP",
      "Koneksi & operasi CRUD ke MySQL",
      "Dibangun dengan Java & NetBeans",
    ],
    stack: ["Java", "NetBeans", "MySQL"],
    image: "/projects/15.png",
    repo: "#",
    status: "source-only",
  },
  {
    name: "Internet Service Agency",
    summary: "Panel admin untuk kelola produk, artikel, dan galeri di sisi backend website.",
    description:
      "Halaman admin untuk mengelola konten website secara terpusat — data produk, artikel, dan galeri — lengkap dengan ringkasan jumlah data di dashboard utama.",
    features: ["Kelola data produk", "Kelola artikel", "Kelola galeri foto"],
    stack: ["React", "Tailwind CSS"],
    image: "/projects/3.png",
    repo: "#",
    status: "source-only",
  },
  {
    name: "Website Microsoft Copilot",
    summary: "Replikasi halaman landing page produk Microsoft Copilot untuk latihan front-end & Laravel.",
    description:
      "Proyek latihan membangun ulang (clone) tampilan landing page resmi Microsoft, lengkap dengan navigasi multi-halaman (Profile, Produk, Artikel, Gallery, Contact, Login). Fokus latihan pada penataan layout, tipografi, dan struktur halaman berbasis Laravel.",
    features: ["Landing page multi-section", "Navigasi ke beberapa halaman statis", "Halaman login terpisah"],
    stack: ["Laravel", "MySQL"],
    image: "/projects/17.png",
    repo: "#",
    status: "source-only",
  },
  {
    name: "Solusi Koneksi Anda",
    summary: "Sistem informasi dengan autentikasi admin untuk mengelola data seputar sepak bola.",
    description:
      "Aplikasi berbasis web dengan halaman login admin sebagai gerbang masuk untuk mengelola data — dibangun untuk melatih alur autentikasi dan manajemen data sederhana.",
    features: ["Autentikasi admin (login)", "Manajemen data terpusat"],
    stack: ["PHP", "MySQL"],
    image: "/projects/2.png",
    repo: "#",
    status: "source-only",
  },
  {
    name: "Master Kanji & Japanese",
    summary: "Website edukasi untuk belajar kanji dan dasar bahasa Jepang.",
    description:
      "Platform edukasi yang menyajikan materi kanji dan bahasa Jepang dasar secara terstruktur, dengan halaman beranda, tentang, blog, dan sistem masuk/daftar untuk pengguna.",
    features: ["Materi belajar kanji terstruktur", "Halaman blog edukasi", "Sistem masuk & daftar akun"],
    stack: ["Laravel", "MySQL"],
    image: "/projects/7.png",
    repo: "#",
    status: "source-only",
  },
  {
    name: "Daily Schedule",
    summary: "Aplikasi pengelolaan jadwal harian dalam satu platform yang intuitif.",
    description:
      "Aplikasi untuk mengatur, memantau, dan mengelola jadwal harian pengguna dalam satu tempat, dibangun agar penggunaannya tetap sederhana dan mudah dipahami.",
    features: ["Atur & pantau jadwal harian", "Tampilan ringkas & mudah digunakan"],
    stack: ["Laravel", "Tailwind CSS"],
    image: "/projects/8.png",
    repo: "#",
    status: "source-only",
  },
  {
    name: "Sistem Informasi Nilai Siswa",
    summary: "Aplikasi berbasis web untuk pengolahan data nilai, galeri, dan informasi akademis sekolah.",
    description:
      "Sistem ini dibangun untuk membantu pihak sekolah mengelola data nilai siswa secara terpusat — mulai dari input nilai per mata pelajaran, rekap otomatis, hingga galeri dan informasi akademik untuk siswa maupun orang tua. Backend dibangun dengan Laravel dan MySQL, sedangkan tampilannya memakai Tailwind CSS agar tetap responsif di berbagai perangkat.",
    features: [
      "Input & rekap nilai per mata pelajaran",
      "Galeri dokumentasi kegiatan sekolah",
      "Halaman informasi akademik untuk publik",
    ],
    stack: ["Laravel", "React", "SQLite"],
    image: "/projects/1.png",
    repo: "https://github.com/DestaJulpaesal/nilai-siswa",
    status: "in-progress",
  },
];

export interface Certification {
  name: string;
  issuer: string;
  date: string;
  url?: string;
  // Deskripsi untuk modal "Lihat Detail" — sesuaikan dengan sertifikatmu.
  description: string;
}

export const certifications: Certification[] = [
  {
    name: "Ijazah Rekayasa Perangkat Lunak (RPL)",
    issuer: "SMK RPL",
    date: "2025",
    url: "/projects/10.png",
    description:
      "Ijazah kelulusan jenjang SMK dengan jurusan Rekayasa Perangkat Lunak, mencakup dasar-dasar pemrograman, basis data, dan pengembangan aplikasi — menjadi fondasi sebelum melanjutkan studi Teknik Informatika.",
  },
  {
    name: "Pemrograman Java Dasar",
    issuer: "UNIKOM",
    date: "2026",
    url: "/projects/11.png",
    description:
      "Capaian pembelajaran mata kuliah Pemrograman Java Dasar di Teknik Informatika UNIKOM, mencakup konsep dasar Pemrograman Berorientasi Objek seperti class, object, inheritance, dan encapsulation.",
  },
  {
    name: "Sertifikat Pelatihan / Kompetensi 3",
    issuer: "Penyelenggara / Lembaga",
    date: "2026",
    url: "/projects/12.png",
    description:
      "Deskripsi singkat mengenai keahlian dan topik yang dipelajari pada sertifikat ini.",
  },
  {
    name: "Sertifikat Pelatihan / Kompetensi 4",
    issuer: "Penyelenggara / Lembaga",
    date: "2026",
    url: "/projects/13.png",
    description:
      "Deskripsi singkat mengenai keahlian dan topik yang dipelajari pada sertifikat ini.",
  },
  {
    name: "Sertifikat Pelatihan / Kompetensi 5",
    issuer: "Penyelenggara / Lembaga",
    date: "2026",
    url: "/projects/14.png",
    description:
      "Deskripsi singkat mengenai keahlian dan topik yang dipelajari pada sertifikat ini.",
  },
];

/* --------------------------------------------------------------------- */
/*  Bentuk data untuk section yang bisa diedit lewat /admin (Profile/Hero, */
/*  About, Skills). Disimpan di tabel "site_content" sebagai JSON, dengan  */
/*  bentuk yang sama persis seperti objek statis di atas supaya halaman    */
/*  publik bisa langsung pakai tanpa mapping tambahan.                    */
/* --------------------------------------------------------------------- */

export interface ProfileData {
  name: string;
  role: string;
  logoMark: string;
  availability: string;
  headlineTop: string;
  headlineAccent: string;
  tagline: string;
  photo: string;
  photoFilter?: PhotoTreatment;
  logoImage: string;
  location: string;
  email: string;
  phone: string;
  cvUrl: string;
  stats: { label: string; value: string }[];
  socials: SocialLink[];
}

export interface AboutData {
  photo: string;
  photoFilter?: PhotoTreatment;
  paragraph: string;
  bullets: string[];
}

export interface SkillsData {
  categories: SkillCategory[];
}

/** Nilai default kalau tabel "site_content" belum diisi baris untuk section ini. */
export function defaultProfileData(): ProfileData {
  return {
    name: profile.name,
    role: profile.role,
    logoMark: profile.logoMark,
    availability: profile.availability,
    headlineTop: profile.headlineTop,
    headlineAccent: profile.headlineAccent,
    tagline: profile.tagline,
    photo: profile.photo,
    photoFilter: "natural",
    logoImage: profile.logoImage,
    location: profile.location,
    email: profile.email,
    phone: profile.phone,
    cvUrl: profile.cvUrl,
    stats: profile.stats.map((s) => ({ ...s })),
    socials: profile.socials.map((s) => ({ ...s })),
  };
}

export function defaultAboutData(): AboutData {
  return {
    photo: aboutText.photo,
    photoFilter: "natural",
    paragraph: aboutText.paragraph,
    bullets: [...aboutBullets],
  };
}

export function defaultSkillsData(): SkillsData {
  return {
    categories: skillCategories.map((cat) => ({
      name: cat.name,
      items: cat.items.map((item) => ({ ...item })),
    })),
  };
}

export const cvSection = {
  heading: "Ingin melihat ringkasan akademis & proyek saya?",
  description: "Unduh CV saya untuk melihat riwayat pendidikan, keahlian teknis, dan proyek yang pernah saya selesaikan.",
  buttonLabel: "Download CV",
};

export const contactInfo = {
  heading: "Mari berkolaborasi atau berdiskusi.",
  subheading:
    "Punya ide proyek, diskusi seputar web development, atau peluang kerja sama? Silakan hubungi saya.",
};