"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { pb } from "@/lib/pocketbase";
import type { ExpoOutlet } from "@/lib/types";
import "./page.css";

export default function QRPrintPage() {
    const params = useParams();
    const id = (params?.id as string) || "";

    const [outlet, setOutlet] = useState<ExpoOutlet | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!id) {
            setNotFound(true);
            setIsLoading(false);
            return;
        }

        async function fetchOutlet() {
            try {
                const data = await pb.collection("expo_outlets").getOne<ExpoOutlet>(id);
                setOutlet(data);
            } catch {
                setNotFound(true);
            } finally {
                setIsLoading(false);
            }
        }

        fetchOutlet();
    }, [id]);

    function getFormUrl(token: string): string {
        const base = typeof window !== "undefined" ? window.location.origin : "";
        return `${base}/form?token=${token}`;
    }

    function getQrUrl(token: string): string {
        const formUrl = encodeURIComponent(getFormUrl(token));
        return `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${formUrl}&ecc=M&margin=10`;
    }

    function printPage() {
        if (typeof window !== "undefined") {
            window.print();
        }
    }

    if (isLoading) {
        return (
            <div className="qr-page">
                <div className="state-center">
                    <div className="spinner"></div>
                    <p>Memuat data outlet...</p>
                </div>
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="qr-page">
                <div className="state-center">
                    <div className="error-icon">🚫</div>
                    <h2>Outlet tidak ditemukan</h2>
                    <Link href="/dashboard/outlets" className="back-btn">
                        ← Kembali
                    </Link>
                </div>
            </div>
        );
    }

    if (!outlet) return null;

    return (
        <div className="qr-page">
            <title>{outlet ? `QR — ${outlet.name}` : "QR Outlet"}</title>

            {/* Print controls — hidden when printing */}
            <div className="controls no-print">
                <Link href="/dashboard/outlets" className="ctrl-btn">
                    ← Kembali
                </Link>
                <button className="ctrl-btn print-btn" onClick={printPage}>
                    🖨️ Print QR
                </button>
            </div>

            {/* Printable card */}
            <div className="qr-card">
                <div className="card-header">
                    <div className="expo-logo">🏆</div>
                    <div className="expo-info">
                        <h1 className="expo-title">Expo Franchise Manado 2026</h1>
                        <p className="expo-sub">Scan untuk input deal franchise</p>
                    </div>
                </div>

                <div className="qr-wrap">
                    <img
                        src={getQrUrl(outlet.access_token)}
                        alt={`QR Code for ${outlet.name}`}
                        className="qr-image"
                    />
                </div>

                <div className="outlet-info">
                    <h2 className="outlet-name">{outlet.name}</h2>
                    {outlet.brand_name && <p className="outlet-brand">{outlet.brand_name}</p>}
                </div>

                <div className="divider"></div>

                <p className="url-label">Atau buka link berikut:</p>
                <p className="form-url">{getFormUrl(outlet.access_token)}</p>

                <p className="token-label">
                    Token: <strong>{outlet.access_token}</strong>
                </p>
            </div>
        </div>
    );
}
