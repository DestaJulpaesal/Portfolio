import { useEffect, useState, type PropsWithChildren } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  Award,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Mail,
  UserCircle2,
  Info,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { profile } from "../data/content";
import { useAdminAuth } from "./AdminAuthContext";
import { useToast } from "./ToastContext";
import { countUnreadMessages } from "../lib/adminData";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import styles from "./AdminLayout.module.css";

const mainNavItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/projects", label: "Projects", icon: FolderKanban },
  { to: "/admin/certifications", label: "Certifications", icon: Award },
  { to: "/admin/messages", label: "Messages", icon: Mail, badge: true },
];

const contentNavItems = [
  { to: "/admin/profile", label: "Profile & Hero", icon: UserCircle2 },
  { to: "/admin/about", label: "About", icon: Info },
  { to: "/admin/skills", label: "Skills", icon: Sparkles },
];

export function AdminLayout({ children }: PropsWithChildren) {
  const { signOut, isOwner } = useAdminAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let cancelled = false;

    function refresh() {
      countUnreadMessages()
        .then((n) => {
          if (!cancelled) setUnread(n);
        })
        .catch(() => {
          // Tabel messages/kolom is_read belum ada — abaikan, badge cukup tidak muncul.
        });
    }

    refresh();
    const id = window.setInterval(refresh, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  async function handleSignOut() {
    await signOut();
    notify("success", "Berhasil keluar.");
    navigate("/admin/login");
  }

  return (
    <div className={styles.shell}>
      <button
        type="button"
        className={styles.mobileToggle}
        onClick={() => setMobileOpen((v) => !v)}
        aria-label="Buka menu"
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      <aside className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.brand}>
          <img src={profile.logoImage} alt="" className={styles.brandLogo} />
          <div>
            <p className={styles.brandName}>{profile.name}</p>
            <p className={`mono ${styles.brandTag}`}>Admin Panel</p>
          </div>
        </div>

        <nav className={styles.nav}>
          {mainNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
              onClick={() => setMobileOpen(false)}
            >
              <item.icon size={17} />
              {item.label}
              {item.badge && unread > 0 && <span className={styles.navBadge}>{unread}</span>}
            </NavLink>
          ))}

          <p className={styles.navGroupLabel}>Konten</p>
          {contentNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
              onClick={() => setMobileOpen(false)}
            >
              <item.icon size={17} />
              {item.label}
            </NavLink>
          ))}

          {isOwner && (
            <>
              <p className={styles.navGroupLabel}>Pengaturan</p>
              <NavLink
                to="/admin/admins"
                className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                onClick={() => setMobileOpen(false)}
              >
                <ShieldCheck size={17} />
                Manage Admins
              </NavLink>
            </>
          )}
        </nav>

        <div className={styles.sidebarFooter}>
          <a href="/" className={styles.viewSite}>
            <ExternalLink size={15} /> Lihat situs publik
          </a>
          <div className={styles.footerRow}>
            <ThemeToggle />
            <button type="button" className={styles.logoutBtn} onClick={handleSignOut}>
              <LogOut size={15} /> Keluar
            </button>
          </div>
        </div>
      </aside>

      {mobileOpen && <div className={styles.overlay} onClick={() => setMobileOpen(false)} />}

      <main className={styles.content}>{children}</main>
    </div>
  );
}
