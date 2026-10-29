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

export interface SkillCategory {
  name: string;
  items: { name: string; icon: SkillIcon }[];
}

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

export interface Certification {
  name: string;
  issuer: string;
  date: string;
  url?: string;
  // Deskripsi untuk modal "Lihat Detail" — sesuaikan dengan sertifikatmu.
  description: string;
}

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
  headlineAccent: string;
  tagline: string;
  photo: string;
  photoFilter?: PhotoTreatment;
  logoImage: string;
  location: string;
  email: string;
  phone: string;
  cvUrl: string;
  browserTitle?: string;
  faviconUrl?: string;
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
    name: "",
    role: "",
    logoMark: "",
    availability: "",
    headlineAccent: "",
    tagline: "",
    photo: "",
    photoFilter: "natural",
    logoImage: "",
    location: "",
    email: "",
    phone: "",
    cvUrl: "",
    browserTitle: "",
    faviconUrl: "",
    stats: [],
    socials: [],
  };
}

export function defaultAboutData(): AboutData {
  return {
    photo: "",
    photoFilter: "natural",
    paragraph: "",
    bullets: [],
  };
}

export function defaultSkillsData(): SkillsData {
  return {
    categories: [],
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