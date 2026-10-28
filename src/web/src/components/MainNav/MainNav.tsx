"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, House, Users, Vote, type LucideIcon } from "lucide-react";
import styles from "./MainNav.module.scss";

interface NavItem {
    href: string;
    label: string;
    icon: LucideIcon;
}

const NAV_ITEMS: readonly NavItem[] = [
    { href: "/", label: "Início", icon: House },
    { href: "/deputados", label: "Deputados", icon: Users },
    { href: "/votacoes", label: "Votações", icon: Vote },
    { href: "/agenda", label: "Agenda", icon: Calendar },
];

function isCurrentSection(pathname: string, href: string): boolean {
    return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

interface MainNavProps {
    placement: "top" | "bottom";
}

// the same items render as a top bar on desktop and as a bottom bar on phones, css shows one of them
export function MainNav({ placement }: Readonly<MainNavProps>) {
    const pathname = usePathname();

    return (
        <nav className={placement === "top" ? styles.topNav : styles.bottomNav} aria-label="Principal">
            <ul className={styles.list}>
                {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                    <li key={href}>
                        <Link href={href} className={styles.link} aria-current={isCurrentSection(pathname, href) ? "page" : undefined}>
                            {placement === "bottom" && (
                                <span className={styles.iconBox}>
                                    <Icon aria-hidden="true" />
                                </span>
                            )}
                            {label}
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
    );
}