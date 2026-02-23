"use client";

import { useEffect, useState } from "react";
import { pb } from "@/lib/pocketbase";
import type { ExpoOutlet, Deal } from "@/lib/types";
import "./page.css";

export default function OutletsPage() {
    const [outlets, setOutlets] = useState<ExpoOutlet[]>([]);
    const [dealStats, setDealStats] = useState<Record<string, { count: number; total: number }>>({});
    const [isLoading, setIsLoading] = useState(true);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingOutlet, setEditingOutlet] = useState<ExpoOutlet | null>(null);
    const [formName, setFormName] = useState("");
    const [formBrand, setFormBrand] = useState("");
    const [formToken, setFormToken] = useState("");
    const [formActive, setFormActive] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState("");

    // Share modal
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareOutlet, setShareOutlet] = useState<ExpoOutlet | null>(null);
    const [copied, setCopied] = useState(false);

    function generateToken(): string {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let token = "BOOTH-";
        for (let i = 0; i < 6; i++) token += chars[Math.floor(Math.random() * chars.length)];
        return token;
    }

    function getFormUrl(token: string): string {
        const base = typeof window !== "undefined" ? window.location.origin : "";
        return `${base}/form?token=${token}`;
    }

    function getQrUrl(token: string): string {
        const formUrl = encodeURIComponent(getFormUrl(token));
        return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${formUrl}`;
    }

    function formatRupiah(num: number): string {
        return num.toLocaleString("id-ID");
    }

    async function fetchOutlets() {
        try {
            const [outletList, deals] = await Promise.all([
                pb.collection("expo_outlets").getFullList<ExpoOutlet>(),
                pb.collection("deals").getFullList<Deal>(),
            ]);
            setOutlets(outletList);

            // Build per-outlet stats
            const stats: Record<string, { count: number; total: number }> = {};
            for (const deal of deals) {
                if (!stats[deal.expo_outlet]) stats[deal.expo_outlet] = { count: 0, total: 0 };
                stats[deal.expo_outlet].count += 1;
                stats[deal.expo_outlet].total += deal.jumlah_transaksi;
            }
            setDealStats(stats);
        } catch (err) {
            console.error("Failed to fetch outlets:", err);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchOutlets();
    }, []);

    function openCreate() {
        setEditingOutlet(null);
        setFormName("");
        setFormBrand("");
        setFormToken(generateToken());
        setFormActive(true);
        setSaveError("");
        setShowModal(true);
    }

    function openEdit(outlet: ExpoOutlet) {
        setEditingOutlet(outlet);
        setFormName(outlet.name);
        setFormBrand(outlet.brand_name || "");
        setFormToken(outlet.access_token);
        setFormActive(outlet.is_active);
        setSaveError("");
        setShowModal(true);
    }

    function openShare(outlet: ExpoOutlet) {
        setShareOutlet(outlet);
        setCopied(false);
        setShowShareModal(true);
    }

    async function copyLink() {
        if (!shareOutlet) return;
        try {
            await navigator.clipboard.writeText(getFormUrl(shareOutlet.access_token));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            const input = document.createElement("input");
            input.value = getFormUrl(shareOutlet.access_token);
            document.body.appendChild(input);
            input.select();
            document.execCommand("copy");
            document.body.removeChild(input);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }

    async function handleSave() {
        if (!formName.trim() || !formToken.trim()) {
            setSaveError("Nama dan token wajib diisi");
            return;
        }
        setIsSaving(true);
        setSaveError("");

        try {
            const data = {
                name: formName.trim(),
                brand_name: formBrand.trim(),
                access_token: formToken.trim(),
                is_active: formActive,
            };

            if (editingOutlet) {
                await pb.collection("expo_outlets").update(editingOutlet.id, data);
            } else {
                await pb.collection("expo_outlets").create(data);
            }

            setShowModal(false);
            await fetchOutlets();
        } catch (err: any) {
            setSaveError(err?.message || "Gagal menyimpan");
        } finally {
            setIsSaving(false);
        }
    }

    async function toggleActive(outlet: ExpoOutlet) {
        try {
            await pb.collection("expo_outlets").update(outlet.id, { is_active: !outlet.is_active });
            await fetchOutlets();
        } catch (err) {
            console.error("Toggle failed:", err);
        }
    }

    async function deleteOutlet(outlet: ExpoOutlet) {
        if (!confirm(`Hapus outlet "${outlet.name}"?`)) return;
        try {
            await pb.collection("expo_outlets").delete(outlet.id);
            await fetchOutlets();
        } catch (err) {
            console.error("Delete failed:", err);
        }
    }

    return (
        <div className="outlets-page">
            <title>Kelola Outlet — Expo Franchise Manado</title>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Kelola Outlet</h1>
                    <p className="page-sub">Buat dan kelola outlet peserta expo, share link form</p>
                </div>
                <button className="btn btn-primary" onClick={openCreate}>
                    <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Tambah Outlet
                </button>
            </div>

            {isLoading ? (
                <div className="loading-box">Memuat...</div>
            ) : outlets.length === 0 ? (
                <div className="empty-box">
                    <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z" />
                    </svg>
                    <p>Belum ada outlet. Klik "Tambah Outlet" untuk mulai.</p>
                </div>
            ) : (
                <div className="outlet-grid">
                    {outlets.map((outlet) => (
                        <div key={outlet.id} className={`outlet-card ${!outlet.is_active ? "inactive" : ""}`}>
                            <div className="card-top">
                                <div className={`card-status ${outlet.is_active ? "active" : ""}`}>
                                    <span className="status-dot"></span>
                                    {outlet.is_active ? "Aktif" : "Nonaktif"}
                                </div>
                                <div className="card-actions">
                                    <button className="icon-btn" onClick={() => openEdit(outlet)} title="Edit">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                    </button>
                                    <button className="icon-btn icon-btn-danger" onClick={() => deleteOutlet(outlet)} title="Hapus">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="3 6 5 6 21 6" />
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <h3 className="card-name">{outlet.name}</h3>
                            <p className="card-brand">{outlet.brand_name || "-"}</p>
                            <p className="card-token">
                                Token: <code>{outlet.access_token}</code>
                            </p>

                            {dealStats[outlet.id] ? (
                                <div className="card-stats">
                                    <span className="stat-pill deals-pill">
                                        <svg className="pill-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M16.5 9.4l-9-5.19" />
                                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                        </svg>
                                        {dealStats[outlet.id].count} deals
                                    </span>
                                    <span className="stat-pill money-pill">
                                        <svg className="pill-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="12" y1="1" x2="12" y2="23" />
                                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                        </svg>
                                        Rp {formatRupiah(dealStats[outlet.id].total)}
                                    </span>
                                </div>
                            ) : (
                                <div className="card-stats">
                                    <span className="stat-pill empty-pill">Belum ada deal</span>
                                </div>
                            )}

                            <div className="card-bottom">
                                <button className="btn btn-share" onClick={() => openShare(outlet)}>
                                    <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                    </svg>
                                    Share
                                </button>
                                <a href={`/dashboard/outlets/${outlet.id}/qr`} className="btn btn-qr" target="_blank" rel="noopener">
                                    <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="6 9 6 2 18 2 18 9" />
                                        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                                        <rect x="6" y="14" width="12" height="8" />
                                    </svg>
                                    Print QR
                                </a>
                                <button className="btn btn-toggle" onClick={() => toggleActive(outlet)}>
                                    {outlet.is_active ? "Nonaktifkan" : "Aktifkan"}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div
                    className="modal-overlay"
                    onClick={() => setShowModal(false)}
                    onKeyDown={(e) => e.key === "Escape" && setShowModal(false)}
                    role="dialog"
                    tabIndex={-1}
                    aria-modal="true"
                >
                    <div className="modal" onClick={(e) => e.stopPropagation()} role="document">
                        <h2>{editingOutlet ? "Edit Outlet" : "Tambah Outlet Baru"}</h2>

                        <div className="modal-form">
                            <label>
                                Nama Outlet *
                                <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Booth A - Hokben" />
                            </label>
                            <label>
                                Nama Brand
                                <input type="text" value={formBrand} onChange={(e) => setFormBrand(e.target.value)} placeholder="Hokben" />
                            </label>
                            <label>
                                Access Token *
                                <div className="token-row">
                                    <input type="text" value={formToken} onChange={(e) => setFormToken(e.target.value)} placeholder="BOOTH-XXXXXX" />
                                    {!editingOutlet && (
                                        <button className="btn btn-sm" onClick={() => setFormToken(generateToken())}>
                                            <svg className="btn-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="23 4 23 10 17 10" />
                                                <polyline points="1 20 1 14 7 14" />
                                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                                            </svg>
                                            Generate
                                        </button>
                                    )}
                                </div>
                            </label>
                            <label className="check-label">
                                <input type="checkbox" checked={formActive} onChange={(e) => setFormActive(e.target.checked)} />
                                <span>Outlet aktif</span>
                            </label>

                            {saveError && (
                                <p className="error-msg">
                                    <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                        <line x1="12" y1="9" x2="12" y2="13" />
                                        <line x1="12" y1="17" x2="12.01" y2="17" />
                                    </svg>
                                    {saveError}
                                </p>
                            )}

                            <div className="modal-actions">
                                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
                                <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
                                    {isSaving ? "Menyimpan..." : editingOutlet ? "Update" : "Simpan"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Share Modal */}
            {showShareModal && shareOutlet && (
                <div
                    className="modal-overlay"
                    onClick={() => setShowShareModal(false)}
                    onKeyDown={(e) => e.key === "Escape" && setShowShareModal(false)}
                    role="dialog"
                    tabIndex={-1}
                    aria-modal="true"
                >
                    <div className="modal share-modal" onClick={(e) => e.stopPropagation()} role="document">
                        <h2>
                            <svg className="modal-title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                            </svg>
                            Share Form Link
                        </h2>
                        <p className="share-outlet-name">{shareOutlet.name}</p>

                        <div className="share-url-box">
                            <input type="text" readOnly value={getFormUrl(shareOutlet.access_token)} />
                            <button className="btn btn-copy" onClick={copyLink}>
                                {copied ? (
                                    <>
                                        <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                        </svg>
                                        Copy
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="qr-section">
                            <p className="qr-label">Scan QR Code</p>
                            <img src={getQrUrl(shareOutlet.access_token)} alt={`QR Code untuk ${shareOutlet.name}`} className="qr-image" />
                        </div>

                        <button className="btn btn-secondary full-width" onClick={() => setShowShareModal(false)}>
                            Tutup
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
