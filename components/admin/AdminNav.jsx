"use client";

// Admin section links with aria-current on the active section.
import Link from "next/link";
import { usePathname } from "next/navigation";
import s from "./AdminShell.module.css";

const LINKS = [
  { href: "/admin", label: "Leads" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/packages", label: "Packages" },
  { href: "/admin/destinations", label: "Destinations" },
];

function isActive(pathname, href) {
  if (href === "/admin") return pathname === "/admin" || pathname === "/admin/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminNav() {
  const pathname = usePathname() ?? "";
  return (
    <nav aria-label="Admin" className={s.nav}>
      <ul className={s.navList}>
        {LINKS.map(({ href, label }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={s.navLink}
                aria-current={active ? "page" : undefined}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
