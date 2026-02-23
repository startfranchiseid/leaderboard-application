"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { pb } from "@/lib/pocketbase";
import { confettiBurst, confettiRain } from "@/lib/confetti";
import type { ExpoOutlet } from "@/lib/types";
import "./page.css";

function FormContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token") || "";

    const [outlet, setOutlet] = useState<ExpoOutlet | null>(null);
    const [isValidating, setIsValidating] = useState(true);
    const [isInvalid, setIsInvalid] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Form fields
    const [namaMitra, setNamaMitra] = useState("");
    const [lokasiBukaOutlet, setLokasiBukaOutlet] = useState("");
    const [jumlahTransaksi, setJumlahTransaksi] = useState<number | null>(null);
    const [catatan, setCatatan] = useState("");
    const [fotoFile, setFotoFile] = useState<File | null>(null);
    const [fotoPreview, setFotoPreview] = useState<string | null>(null);

    // Error state
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Hidden inputs refs
    const fotoCamRef = useRef<HTMLInputElement>(null);
    const fotoGalleryRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!token) {
            setIsValidating(false);
            setIsInvalid(true);
            return;
        }

        async function validateToken() {
            try {
                const records = await pb
                    .collection("expo_outlets")
                    .getFullList<ExpoOutlet>({
                        filter: `access_token = "${token}" && is_active = true`,
                    });

                if (records.length > 0) {
                    setOutlet(records[0]);
                    setIsInvalid(false);
                } else {
                    setIsInvalid(true);
                }
            } catch (err) {
                console.error("Token validation failed:", err);
                setIsInvalid(true);
            } finally {
                setIsValidating(false);
            }
        }

        validateToken();
    }, [token]);

    function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];

        if (file) {
            setFotoFile(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                setFotoPreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    }

    function removePhoto() {
        setFotoFile(null);
        setFotoPreview(null);
    }

    function validate(): boolean {
        const newErrors: Record<string, string> = {};

        if (!namaMitra.trim()) {
            newErrors["namaMitra"] = "Nama mitra wajib diisi";
        }

        if (!jumlahTransaksi || jumlahTransaksi <= 0) {
            newErrors["jumlahTransaksi"] = "Jumlah transaksi wajib diisi dengan angka valid";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    function formatRupiahInput(value: number | null): string {
        if (!value) return "";
        return value.toLocaleString("id-ID");
    }

    function handleAmountInput(event: React.ChangeEvent<HTMLInputElement>) {
        const input = event.target;
        const raw = input.value.replace(/[^0-9]/g, "");
        const parsed = raw ? parseInt(raw) : null;
        setJumlahTransaksi(parsed);
        // React handles display via the value prop formatting below
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!validate() || !outlet) return;

        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append("nama_mitra", namaMitra.trim());

            if (outlet.brand_name) formData.append("brand_name", outlet.brand_name);
            if (outlet.brand) formData.append("brand", outlet.brand);

            formData.append("outlet_name", outlet.name);
            formData.append("lokasi_buka_outlet", lokasiBukaOutlet.trim());
            formData.append("jumlah_transaksi", String(jumlahTransaksi));
            formData.append("catatan", catatan.trim());
            formData.append("expo_outlet", outlet.id);

            if (fotoFile) {
                formData.append("foto_mitra", fotoFile);
            }

            await pb.collection("deals").create(formData);

            setShowSuccess(true);
            confettiBurst();
            setTimeout(() => confettiRain(), 300);

            setTimeout(() => {
                resetForm();
            }, 3000);
        } catch (err) {
            console.error("Submit failed:", err);
            setErrors((prev) => ({ ...prev, submit: "Gagal mengirim data. Silakan coba lagi." }));
        } finally {
            setIsSubmitting(false);
        }
    }

    function resetForm() {
        setNamaMitra("");
        setLokasiBukaOutlet("");
        setJumlahTransaksi(null);
        setCatatan("");
        setFotoFile(null);
        setFotoPreview(null);
        setErrors({});
        setShowSuccess(false);
    }

    return (
        <div className="form-page">
            <title>Input Deal — Expo Franchise</title>
            {isValidating ? (
                <div className="center-state">
                    <div className="loading-spinner"></div>
                    <p>Memvalidasi token outlet...</p>
                </div>
            ) : isInvalid ? (
                <div className="center-state error-state">
                    <div className="error-icon">🚫</div>
                    <h2>Token Tidak Valid</h2>
                    <p>Token outlet tidak ditemukan atau sudah nonaktif.</p>
                    <p className="hint">Pastikan URL yang diberikan sudah benar.</p>
                </div>
            ) : showSuccess ? (
                <div className="center-state success-state">
                    <div className="success-icon">🎉</div>
                    <h2>Deal Berhasil Tercatat!</h2>
                    <p>Data sudah masuk ke leaderboard secara real-time.</p>
                    <button className="btn btn-primary" onClick={resetForm}>
                        Input Deal Baru
                    </button>
                </div>
            ) : (
                <div className="form-container">
                    <div className="form-header">
                        <div className="outlet-badge">
                            <span className="outlet-icon">📍</span>
                            <span>{outlet?.name}</span>
                        </div>
                        <h1>Input Deal Baru</h1>
                        <p>Catat deal franchise baru untuk leaderboard</p>
                    </div>

                    <form className="deal-form" onSubmit={handleSubmit}>
                        {/* Nama Mitra */}
                        <div className="form-group">
                            <label htmlFor="namaMitra">
                                Nama Mitra <span className="required">*</span>
                            </label>
                            <input
                                id="namaMitra"
                                type="text"
                                value={namaMitra}
                                onChange={(e) => setNamaMitra(e.target.value)}
                                placeholder="Nama orang yang melakukan deal"
                                className={errors["namaMitra"] ? "error" : ""}
                            />
                            {errors["namaMitra"] && <span className="error-text">{errors["namaMitra"]}</span>}
                        </div>

                        {/* Foto Mitra */}
                        <div className="form-group">
                            <label>Foto Mitra</label>
                            {fotoPreview ? (
                                <div className="photo-preview">
                                    <img src={fotoPreview} alt="Preview" />
                                    <button
                                        type="button"
                                        className="remove-photo"
                                        onClick={removePhoto}
                                        aria-label="Hapus foto"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="photo-actions">
                                        <button
                                            type="button"
                                            className="photo-btn camera-btn"
                                            onClick={() => fotoCamRef.current?.click()}
                                        >
                                            <span className="photo-btn-icon">📷</span>
                                            <span className="photo-btn-label">Ambil Foto</span>
                                            <span className="photo-btn-hint">Buka kamera</span>
                                        </button>
                                        <button
                                            type="button"
                                            className="photo-btn gallery-btn"
                                            onClick={() => fotoGalleryRef.current?.click()}
                                        >
                                            <span className="photo-btn-icon">🖼️</span>
                                            <span className="photo-btn-label">Dari Galeri</span>
                                            <span className="photo-btn-hint">Pilih file</span>
                                        </button>
                                    </div>
                                    <input
                                        ref={fotoCamRef}
                                        id="fotoCam"
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        onChange={handleFileChange}
                                        className="file-input-hidden"
                                    />
                                    <input
                                        ref={fotoGalleryRef}
                                        id="fotoGallery"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="file-input-hidden"
                                    />
                                </>
                            )}
                        </div>

                        {/* Lokasi */}
                        <div className="form-group">
                            <label htmlFor="lokasi">Lokasi Rencana Buka Outlet</label>
                            <input
                                id="lokasi"
                                type="text"
                                value={lokasiBukaOutlet}
                                onChange={(e) => setLokasiBukaOutlet(e.target.value)}
                                placeholder="Kota/daerah rencana buka"
                            />
                        </div>

                        {/* Jumlah Transaksi */}
                        <div className="form-group">
                            <label htmlFor="transaksi">
                                Jumlah Transaksi (Rp) <span className="required">*</span>
                            </label>
                            <div className="input-with-prefix">
                                <span className="input-prefix">Rp</span>
                                <input
                                    id="transaksi"
                                    type="text"
                                    inputMode="numeric"
                                    value={formatRupiahInput(jumlahTransaksi)}
                                    onChange={handleAmountInput}
                                    placeholder="0"
                                    className={errors["jumlahTransaksi"] ? "error" : ""}
                                />
                            </div>
                            {errors["jumlahTransaksi"] && <span className="error-text">{errors["jumlahTransaksi"]}</span>}
                        </div>

                        {/* Catatan */}
                        <div className="form-group">
                            <label htmlFor="catatan">Catatan</label>
                            <textarea
                                id="catatan"
                                value={catatan}
                                onChange={(e) => setCatatan(e.target.value)}
                                placeholder="Keterangan tambahan (opsional)"
                                rows={3}
                            ></textarea>
                        </div>

                        {/* Submit Error */}
                        {errors["submit"] && (
                            <div className="submit-error">
                                <span>⚠️ {errors["submit"]}</span>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button type="submit" className="btn btn-submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <span className="btn-spinner"></span> Mengirim...
                                </>
                            ) : (
                                "🚀 Submit Deal"
                            )}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}

export default function Page() {
    return (
        <Suspense fallback={<div className="center-state"><div className="loading-spinner"></div><p>Memuat formulir...</p></div>}>
            <FormContent />
        </Suspense>
    );
}
