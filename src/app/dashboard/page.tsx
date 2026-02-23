"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { pb } from "@/lib/pocketbase";
import type { Deal, ExpoOutlet } from "@/lib/types";

export default function DashboardOverview() {
    const [totalDeals, setTotalDeals] = useState(0);
    const [totalTransaksi, setTotalTransaksi] = useState(0);
    const [totalOutlets, setTotalOutlets] = useState(0);
    const [totalMitra, setTotalMitra] = useState(0);
    const [recentDeals, setRecentDeals] = useState<Deal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLive, setIsLive] = useState(false);

    const allDealsRef = useRef<Deal[]>([]);

    function formatRupiah(num: number): string {
        return num.toLocaleString("id-ID");
    }

    function timeAgo(dateStr: string): string {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return "Baru saja";
        if (mins < 60) return `${mins} menit lalu`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours} jam lalu`;
        const days = Math.floor(hours / 24);
        return `${days} hari lalu`;
    }

    function recalculate(deals: Deal[]) {
        setTotalDeals(deals.length);
        setTotalTransaksi(deals.reduce((sum, d) => sum + d.jumlah_transaksi, 0));
        const mitraSet = new Set(deals.map((d) => d.nama_mitra.trim().toLowerCase()));
        setTotalMitra(mitraSet.size);
        setRecentDeals(
            [...deals].sort((a, b) => b.created.localeCompare(a.created)).slice(0, 8)
        );
    }

    useEffect(() => {
        let isMounted = true;

        async function initDashboard() {
            try {
                const [deals, outlets] = await Promise.all([
                    pb.collection("deals").getFullList<Deal>(),
                    pb.collection("expo_outlets").getFullList<ExpoOutlet>(),
                ]);

                if (!isMounted) return;

                allDealsRef.current = deals;
                setTotalOutlets(outlets.length);
                recalculate(deals);

                await pb.collection("deals").subscribe<Deal>("*", (e) => {
                    let currentDeals = [...allDealsRef.current];
                    if (e.action === "create") {
                        currentDeals = [e.record, ...currentDeals];
                    } else if (e.action === "update") {
                        currentDeals = currentDeals.map((d) => (d.id === e.record.id ? e.record : d));
                    } else if (e.action === "delete") {
                        currentDeals = currentDeals.filter((d) => d.id !== e.record.id);
                    }
                    allDealsRef.current = currentDeals;
                    recalculate(currentDeals);
                });

                if (isMounted) {
                    setIsLive(true);
                }
            } catch (err) {
                console.error("Failed to load dashboard data:", err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        initDashboard();

        return () => {
            isMounted = false;
            pb.collection("deals").unsubscribe("*").catch(() => { });
        };
    }, []);

    return (
        <div className="overview">
            <div className="page-top">
                <div>
                    <h1 className="page-title">Overview</h1>
                    <p className="page-sub">Pantau semua aktivitas leaderboard expo franchise</p>
                </div>
                {isLive && (
                    <div className="live-badge">
                        <span className="live-dot"></span>
                        LIVE
                    </div>
                )}
            </div>

            {isLoading ? (
                <div className="loading-row">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="stat-card skeleton"></div>
                    ))}
                </div>
            ) : (
                <>
                    {/* Stat Cards */}
                    <div className="stat-grid">
                        <div className="stat-card">
                            <div className="stat-icon blue">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M16.5 9.4l-9-5.19" />
                                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                                    <line x1="12" y1="22.08" x2="12" y2="12" />
                                </svg>
                            </div>
                            <div className="stat-info">
                                <span className="stat-value">{totalDeals}</span>
                                <span className="stat-label">Total Deals</span>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon gold">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="12" y1="1" x2="12" y2="23" />
                                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                </svg>
                            </div>
                            <div className="stat-info">
                                <span className="stat-value">Rp {formatRupiah(totalTransaksi)}</span>
                                <span className="stat-label">Total Transaksi</span>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon green">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z" />
                                </svg>
                            </div>
                            <div className="stat-info">
                                <span className="stat-value">{totalOutlets}</span>
                                <span className="stat-label">Outlet Aktif</span>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon purple">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                            </div>
                            <div className="stat-info">
                                <span className="stat-value">{totalMitra}</span>
                                <span className="stat-label">Mitra Unik</span>
                            </div>
                        </div>
                    </div>

                    {/* Recent Deals */}
                    <div className="section">
                        <div className="section-header">
                            <h2>
                                <svg className="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                </svg>
                                Deals Terbaru
                            </h2>
                            <Link href="/dashboard/deals" className="view-all">
                                Lihat Semua
                                <svg className="view-all-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                    <polyline points="12 5 19 12 12 19" />
                                </svg>
                            </Link>
                        </div>

                        {recentDeals.length === 0 ? (
                            <div className="empty-box">
                                <p>Belum ada deal yang tercatat.</p>
                            </div>
                        ) : (
                            <div className="deals-list">
                                {recentDeals.map((deal) => (
                                    <div key={deal.id} className="deal-row">
                                        <div className="deal-accent"></div>
                                        <div className="deal-info">
                                            <span className="deal-name">{deal.nama_mitra}</span>
                                            <span className="deal-meta">
                                                {deal.brand_name || "-"} · {deal.outlet_name || "-"}
                                            </span>
                                        </div>
                                        <div className="deal-right">
                                            <span className="deal-amount">Rp {formatRupiah(deal.jumlah_transaksi)}</span>
                                            <span className="deal-time">{timeAgo(deal.created)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
