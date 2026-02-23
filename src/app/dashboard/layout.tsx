"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import "./dashboard.css";

const CORRECT_PIN = process.env.NEXT_PUBLIC_DASHBOARD_PIN || "admin2026";
const SESSION_KEY = "lb_dashboard_auth";

const navItems = [
    {
        href: "/dashboard",
        label: "Overview",
        iconPath: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z",
    },
    {
        href: "/dashboard/outlets",
        label: "Kelola Outlet",
        iconPath: "M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z",
    },
    {
        href: "/dashboard/deals",
        label: "Deals",
        iconPath: "M16.48 10.41c-.39.39-1.04.39-1.43 0l-4.47-4.46-7.05 7.04-.66-.63 3.7-3.7L.7 2.84 2.12 1.4l2.83 2.83 3.7-3.7 5.83 5.84 3.7-3.71 1.42 1.42-3.12 3.12v0z",
    },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isAuthed, setIsAuthed] = useState(false);
    const [pinInput, setPinInput] = useState("");
    const [pinError, setPinError] = useState(false);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const saved = sessionStorage.getItem(SESSION_KEY);
        if (saved === "1") {
            setIsAuthed(true);
        }
        setIsReady(true);
    }, []);

    function handlePinSubmit() {
        if (pinInput === CORRECT_PIN) {
            setIsAuthed(true);
            setPinError(false);
            sessionStorage.setItem(SESSION_KEY, "1");
        } else {
            setPinError(true);
            setPinInput("");
            setTimeout(() => setPinError(false), 1500);
        }
    }

    function handleKeydown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter") handlePinSubmit();
    }

    function logout() {
        sessionStorage.removeItem(SESSION_KEY);
        setIsAuthed(false);
        setPinInput("");
    }

    if (!isReady) {
        return (
            <div className="auth-loading">
                <div className="auth-spinner"></div>
            </div>
        );
    }

    if (!isAuthed) {
        return (
            <div className="pin-gate">
                <title>Admin Login — Expo Franchise</title>
                <div className="pin-card">
                    <div className="pin-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            <path d="M9 12l2 2 4-4" />
                        </svg>
                    </div>
                    <h1 className="pin-title">Admin Dashboard</h1>
                    <p className="pin-sub">Masukkan PIN untuk melanjutkan</p>

                    <div className={`pin-input-wrap ${pinError ? "shake" : ""}`}>
                        <input
                            type="password"
                            inputMode="numeric"
                            placeholder="• • • • • •"
                            value={pinInput}
                            onChange={(e) => setPinInput(e.target.value)}
                            onKeyDown={handleKeydown}
                            maxLength={20}
                            autoFocus
                            className="pin-input"
                        />
                    </div>

                    {pinError && (
                        <p className="pin-error">
                            <svg className="pin-error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="15" y1="9" x2="9" y2="15" />
                                <line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                            PIN salah. Coba lagi.
                        </p>
                    )}

                    <button className="pin-btn" onClick={handlePinSubmit}>
                        Masuk
                        <svg className="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                        </svg>
                    </button>

                    <Link href="/" className="back-link">
                        <svg className="back-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12" />
                            <polyline points="12 19 5 12 12 5" />
                        </svg>
                        Kembali ke Leaderboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-layout">
            <title>Dashboard — Expo Franchise Manado</title>
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="sidebar-logo-wrap">
                        <svg className="sidebar-logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 7 7 7 7" />
                            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 17 7 17 7" />
                            <path d="M4 22h16" />
                            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="sidebar-title">Expo Franchise</h2>
                        <p className="sidebar-sub">Admin Dashboard</p>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`nav-item ${pathname === item.href ? "active" : ""}`}
                        >
                            <span className="nav-icon">
                                <svg viewBox="0 0 24 24" fill="currentColor"><path d={item.iconPath} /></svg>
                            </span>
                            <span className="nav-label">{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <Link href="/" className="nav-item footer-link">
                        <span className="nav-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <polyline points="15 3 21 3 21 9" />
                                <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                        </span>
                        <span className="nav-label">Lihat Leaderboard</span>
                    </Link>
                    <button className="nav-item logout-btn" onClick={logout}>
                        <span className="nav-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                        </span>
                        <span className="nav-label">Keluar</span>
                    </button>
                </div>
            </aside>

            <div className="dash-main">
                {children}
            </div>
        </div>
    );
}
