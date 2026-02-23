"use client";

import { useEffect, useState, useRef } from "react";
import { pb } from "@/lib/pocketbase";
import { confettiBurst, confettiRain } from "@/lib/confetti";
import type { ExpoOutlet, Brand } from "@/lib/types";
import "./page.css";

export default function GlobalSubmitPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [brands, setBrands] = useState<Brand[]>([]);
    const [outlets, setOutlets] = useState<ExpoOutlet[]>([]);

    // Form fields
    const [namaMitra, setNamaMitra] = useState("");
    const [selectedBrandId, setSelectedBrandId] = useState("");
    const [selectedOutletId, setSelectedOutletId] = useState("");
    const [lokasiBukaOutlet, setLokasiBukaOutlet] = useState("");
    const [jumlahTransaksi, setJumlahTransaksi] = useState<number | null>(null);
    const [catatan, setCatatan] = useState("");
    const [fotoFile, setFotoFile] = useState<File | null>(null);
    const [fotoPreview, setFotoPreview] = useState<string | null>(null);

    // Error state
    const [errors, setErrors] = useState<Record<string, string>>({});

    // File input refs
    const fotoCamRef = useRef<HTMLInputElement>(null);
    const fotoGalleryRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        async function fetchInitData() {
            try {
                const [brandsList, outletsList] = await Promise.all([
                    pb.collection("brands").getFullList<Brand>({ sort: "name" }),
                    pb.collection("expo_outlets").getFullList<ExpoOutlet>({
                        filter: "is_active = true",
                        sort: "name",
                    }),
                ]);
                setBrands(brandsList);
                setOutlets(outletsList);
            } catch (err) {
                console.error("Failed to load form data:", err);
                setErrors((prev) => ({
                    ...prev,
                    init: "Gagal memuat data formulir. Silakan muat ulang halaman.",
                }));
            } finally {
                setIsLoading(false);
            }
        }
        fetchInitData();
    }, []);

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

        if (!selectedBrandId) {
            newErrors["brand"] = "Brand wajib dipilih";
        }

        if (!selectedOutletId) {
            newErrors["outlet"] = "Outlet wajib dipilih";
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
        const raw = event.target.value.replace(/[^0-9]/g, "");
        setJumlahTransaksi(raw ? parseInt(raw) : null);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!validate()) return;

        setIsSubmitting(true);

        try {
            const selectedBrand = brands.find((b) => b.id === selectedBrandId);
            const selectedOutlet = outlets.find((o) => o.id === selectedOutletId);

            const formData = new FormData();
            formData.append("nama_mitra", namaMitra.trim());

            if (selectedBrand) {
                formData.append("brand", selectedBrand.id);
                formData.append("brand_name", selectedBrand.name);
            }
            if (selectedOutlet) {
                formData.append("expo_outlet", selectedOutlet.id);
                formData.append("outlet_name", selectedOutlet.name);
            }
            formData.append("lokasi_buka_outlet", lokasiBukaOutlet.trim());
            formData.append("jumlah_transaksi", String(jumlahTransaksi));
            formData.append("catatan", catatan.trim());

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
        setSelectedBrandId("");
        setSelectedOutletId("");
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
            <title>Input Deal Global — Expo Franchise</title>

            {isLoading ? (
                <div className="center-state">
                    <div className="loading-spinner"></div>
                    <p>Memuat formulir...</p>
                </div>
            ) : errors["init"] ? (
                <div className="center-state error-state">
                    <div className="error-icon">🚫</div>
                    <h2>Terjadi Kesalahan</h2>
                    <p>{errors["init"]}</p>
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
                        <div className="public-badge">
                            <span className="public-icon">🌍</span>
                            <span>Global Submit Form</span>
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
                                        </button>
                                        <button
                                            type="button"
                                            className="photo-btn gallery-btn"
                                            onClick={() => fotoGalleryRef.current?.click()}
                                        >
                                            <span className="photo-btn-icon">🖼️</span>
                                            <span className="photo-btn-label">Dari Galeri</span>
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

                        {/* Brand Dropdown */}
                        <div className="form-group">
                            <label htmlFor="brand">
                                Brand <span className="required">*</span>
                            </label>
                            <div className="select-wrap">
                                <select
                                    id="brand"
                                    value={selectedBrandId}
                                    onChange={(e) => setSelectedBrandId(e.target.value)}
                                    className={errors["brand"] ? "error" : ""}
                                >
                                    <option value="" disabled>Pilih Brand</option>
                                    {brands.map((brand) => (
                                        <option key={brand.id} value={brand.id}>
                                            {brand.name}
                                        </option>
                                    ))}
                                </select>
                                <div className="select-arrow">▼</div>
                            </div>
                            {errors["brand"] && <span className="error-text">{errors["brand"]}</span>}
                        </div>

                        {/* Outlet Dropdown */}
                        <div className="form-group">
                            <label htmlFor="outlet">
                                Outlet Pameran (Tempat Deal) <span className="required">*</span>
                            </label>
                            <div className="select-wrap">
                                <select
                                    id="outlet"
                                    value={selectedOutletId}
                                    onChange={(e) => setSelectedOutletId(e.target.value)}
                                    className={errors["outlet"] ? "error" : ""}
                                >
                                    <option value="" disabled>Pilih Outlet Pameran</option>
                                    {outlets.map((outlet) => (
                                        <option key={outlet.id} value={outlet.id}>
                                            {outlet.name}
                                        </option>
                                    ))}
                                </select>
                                <div className="select-arrow">▼</div>
                            </div>
                            {errors["outlet"] && <span className="error-text">{errors["outlet"]}</span>}
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
