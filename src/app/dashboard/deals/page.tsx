"use client";

import { useEffect, useState } from "react";
import { pb, getFileUrl } from "@/lib/pocketbase";
import type { Deal } from "@/lib/types";
import "./page.css";

export default function DealsPage() {
    const [deals, setDeals] = useState<Deal[]>([]);
    const [filtered, setFiltered] = useState<Deal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<"newest" | "oldest" | "highest" | "lowest">("newest");

    function formatRupiah(num: number): string {
        return num.toLocaleString("id-ID");
    }

    function formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function getInitials(name: string): string {
        return name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    }

    useEffect(() => {
        let result = [...deals];

        // Search
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (d) =>
                    d.nama_mitra.toLowerCase().includes(q) ||
                    (d.brand_name || "").toLowerCase().includes(q) ||
                    (d.outlet_name || "").toLowerCase().includes(q) ||
                    (d.lokasi_buka_outlet || "").toLowerCase().includes(q)
            );
        }

        // Sort
        switch (sortBy) {
            case "newest":
                result.sort((a, b) => b.created.localeCompare(a.created));
                break;
            case "oldest":
                result.sort((a, b) => a.created.localeCompare(b.created));
                break;
            case "highest":
                result.sort((a, b) => b.jumlah_transaksi - a.jumlah_transaksi);
                break;
            case "lowest":
                result.sort((a, b) => a.jumlah_transaksi - b.jumlah_transaksi);
                break;
        }

        setFiltered(result);
    }, [searchQuery, sortBy, deals]);

    async function deleteDeal(deal: Deal) {
        if (!confirm(`Hapus deal dari "${deal.nama_mitra}"?`)) return;
        try {
            await pb.collection("deals").delete(deal.id);
            setDeals((prev) => prev.filter((d) => d.id !== deal.id));
        } catch (err) {
            console.error("Delete failed:", err);
        }
    }

    function exportCSV() {
        const headers = [
            "No",
            "Nama Mitra",
            "Brand",
            "Outlet",
            "Lokasi",
            "Jumlah Transaksi",
            "Catatan",
            "Waktu",
        ];
        const rows = filtered.map((d, i) => [
            i + 1,
            d.nama_mitra,
            d.brand_name || "",
            d.outlet_name || "",
            d.lokasi_buka_outlet || "",
            d.jumlah_transaksi,
            d.catatan || "",
            new Date(d.created).toLocaleString("id-ID"),
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
        ].join("\n");

        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `deals-expo-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    useEffect(() => {
        let isMounted = true;
        async function fetchDeals() {
            try {
                const data = await pb.collection("deals").getFullList<Deal>();
                data.sort((a, b) => (b.created || "").localeCompare(a.created || ""));
                if (isMounted) setDeals(data);
            } catch (err) {
                console.error("Failed to fetch deals:", err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }
        fetchDeals();
        return () => { isMounted = false; };
    }, []);

    return (
        <div className="deals-page">
            <title>Kelola Deals — Expo Franchise Manado</title>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Deals</h1>
                    <p className="page-sub">
                        Semua deal yang tercatat di leaderboard ({filtered.length} dari {deals.length})
                    </p>
                </div>
                {!isLoading && deals.length > 0 && (
                    <button className="btn btn-export" onClick={exportCSV}>
                        <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Export CSV
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="filters">
                <div className="search-wrap">
                    <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Cari mitra, brand, outlet..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
                    <option value="newest">Terbaru</option>
                    <option value="oldest">Terlama</option>
                    <option value="highest">Transaksi Terbesar</option>
                    <option value="lowest">Transaksi Terkecil</option>
                </select>
            </div>

            {isLoading ? (
                <div className="loading-box">Memuat deals...</div>
            ) : filtered.length === 0 ? (
                <div className="empty-box">
                    {searchQuery ? (
                        <p>Tidak ada deal yang cocok dengan "{searchQuery}"</p>
                    ) : (
                        <>
                            <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16.5 9.4l-9-5.19" />
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                                <line x1="12" y1="22.08" x2="12" y2="12" />
                            </svg>
                            <p>Belum ada deal tercatat.</p>
                        </>
                    )}
                </div>
            ) : (
                <div className="deals-table">
                    <div className="table-head">
                        <span className="th" style={{ flex: "0 0 40px" }}>#</span>
                        <span className="th" style={{ flex: 2 }}>Mitra</span>
                        <span className="th" style={{ flex: 1 }}>Brand</span>
                        <span className="th" style={{ flex: 1 }}>Outlet</span>
                        <span className="th" style={{ flex: 1 }}>Transaksi</span>
                        <span className="th" style={{ flex: 1 }}>Waktu</span>
                        <span className="th" style={{ flex: "0 0 50px" }}></span>
                    </div>

                    {filtered.map((deal, i) => (
                        <div key={deal.id} className="table-row">
                            <span className="td" style={{ flex: "0 0 40px", color: "var(--text-muted)" }}>
                                {i + 1}
                            </span>
                            <span className="td" style={{ flex: 2 }}>
                                <div className="mitra-cell">
                                    <div className="mitra-avatar">
                                        {deal.foto_mitra ? (
                                            <img src={getFileUrl(deal, deal.foto_mitra)} alt={deal.nama_mitra} />
                                        ) : (
                                            <span className="mitra-initials">{getInitials(deal.nama_mitra)}</span>
                                        )}
                                    </div>
                                    <div className="mitra-info">
                                        <span className="mitra-name">{deal.nama_mitra}</span>
                                        {deal.lokasi_buka_outlet && (
                                            <span className="mitra-loc">
                                                <svg className="loc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                                    <circle cx="12" cy="10" r="3" />
                                                </svg>
                                                {deal.lokasi_buka_outlet}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </span>
                            <span className="td" style={{ flex: 1, color: "var(--accent-cyan)" }}>
                                {deal.brand_name || "-"}
                            </span>
                            <span className="td" style={{ flex: 1, color: "var(--text-secondary)" }}>
                                {deal.outlet_name || "-"}
                            </span>
                            <span className="td money" style={{ flex: 1 }}>
                                Rp {formatRupiah(deal.jumlah_transaksi)}
                            </span>
                            <span className="td" style={{ flex: 1, color: "var(--text-muted)", fontSize: "12px" }}>
                                {formatDate(deal.created)}
                            </span>
                            <span className="td" style={{ flex: "0 0 50px" }}>
                                <button className="del-btn" onClick={() => deleteDeal(deal)} title="Hapus">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        <line x1="10" y1="11" x2="10" y2="17" />
                                        <line x1="14" y1="11" x2="14" y2="17" />
                                    </svg>
                                </button>
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
