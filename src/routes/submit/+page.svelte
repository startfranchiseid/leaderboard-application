<script lang="ts">
    import { onMount } from "svelte";
    import { pb } from "$lib/pocketbase";
    import { confettiBurst, confettiRain } from "$lib/confetti";
    import type { ExpoOutlet, Brand } from "$lib/types";

    // State
    let isSubmitting = $state(false);
    let showSuccess = $state(false);
    let isLoading = $state(true);

    let brands = $state<Brand[]>([]);
    let outlets = $state<ExpoOutlet[]>([]);

    // Form fields
    let namaMitra = $state("");
    let selectedBrandId = $state("");
    let selectedOutletId = $state("");
    let lokasiBukaOutlet = $state("");
    let jumlahTransaksi = $state<number | null>(null);
    let catatan = $state("");
    let fotoFile = $state<File | null>(null);
    let fotoPreview = $state<string | null>(null);

    // Error state
    let errors = $state<Record<string, string>>({});

    onMount(async () => {
        try {
            // Fetch active brands and outlets for dropdowns
            const [brandsList, outletsList] = await Promise.all([
                pb.collection("brands").getFullList<Brand>({ sort: "name" }),
                pb.collection("expo_outlets").getFullList<ExpoOutlet>({
                    filter: "is_active = true",
                    sort: "name",
                }),
            ]);
            brands = brandsList;
            outlets = outletsList;
        } catch (err) {
            console.error("Failed to load form data:", err);
            errors["init"] =
                "Gagal memuat data formulir. Silakan muat ulang halaman.";
        } finally {
            isLoading = false;
        }
    });

    function handleFileChange(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];

        if (file) {
            fotoFile = file;
            const reader = new FileReader();
            reader.onload = (e) => {
                fotoPreview = e.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    }

    function removePhoto() {
        fotoFile = null;
        fotoPreview = null;
    }

    function validate(): boolean {
        errors = {};

        if (!namaMitra.trim()) {
            errors["namaMitra"] = "Nama mitra wajib diisi";
        }

        if (!selectedBrandId) {
            errors["brand"] = "Brand wajib dipilih";
        }

        if (!selectedOutletId) {
            errors["outlet"] = "Outlet wajib dipilih";
        }

        if (!jumlahTransaksi || jumlahTransaksi <= 0) {
            errors["jumlahTransaksi"] =
                "Jumlah transaksi wajib diisi dengan angka valid";
        }

        return Object.keys(errors).length === 0;
    }

    function formatRupiahInput(value: number | null): string {
        if (!value) return "";
        return value.toLocaleString("id-ID");
    }

    function handleAmountInput(event: Event) {
        const input = event.target as HTMLInputElement;
        const raw = input.value.replace(/[^0-9]/g, "");
        jumlahTransaksi = raw ? parseInt(raw) : null;
        input.value = jumlahTransaksi
            ? jumlahTransaksi.toLocaleString("id-ID")
            : "";
    }

    async function handleSubmit() {
        if (!validate()) return;

        isSubmitting = true;

        try {
            const selectedBrand = brands.find((b) => b.id === selectedBrandId);
            const selectedOutlet = outlets.find(
                (o) => o.id === selectedOutletId,
            );

            const formData = new FormData();
            formData.append("nama_mitra", namaMitra.trim());
            // Relasi ke tabel brands
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

            showSuccess = true;
            confettiBurst();
            setTimeout(() => confettiRain(), 300);

            setTimeout(() => {
                resetForm();
            }, 3000);
        } catch (err) {
            console.error("Submit failed:", err);
            errors["submit"] = "Gagal mengirim data. Silakan coba lagi.";
        } finally {
            isSubmitting = false;
        }
    }

    function resetForm() {
        namaMitra = "";
        selectedBrandId = "";
        selectedOutletId = "";
        lokasiBukaOutlet = "";
        jumlahTransaksi = null;
        catatan = "";
        fotoFile = null;
        fotoPreview = null;
        errors = {};
        showSuccess = false;
    }
</script>

<svelte:head>
    <title>Input Deal Global — Expo Franchise Manado 2026</title>
</svelte:head>

<div class="form-page">
    {#if isLoading}
        <div class="center-state">
            <div class="loading-spinner"></div>
            <p>Memuat formulir...</p>
        </div>
    {:else if errors["init"]}
        <div class="center-state error-state">
            <div class="error-icon">🚫</div>
            <h2>Terjadi Kesalahan</h2>
            <p>{errors["init"]}</p>
        </div>
    {:else if showSuccess}
        <div class="center-state success-state">
            <div class="success-icon">🎉</div>
            <h2>Deal Berhasil Tercatat!</h2>
            <p>Data sudah masuk ke leaderboard secara real-time.</p>
            <button class="btn btn-primary" onclick={resetForm}>
                Input Deal Baru
            </button>
        </div>
    {:else}
        <div class="form-container">
            <div class="form-header">
                <div class="public-badge">
                    <span class="public-icon">🌍</span>
                    <span>Global Submit Form</span>
                </div>
                <h1>Input Deal Baru</h1>
                <p>Catat deal franchise baru untuk leaderboard</p>
            </div>

            <form
                class="deal-form"
                onsubmit={(e) => {
                    e.preventDefault();
                    handleSubmit();
                }}
            >
                <!-- Nama Mitra -->
                <div class="form-group">
                    <label for="namaMitra"
                        >Nama Mitra <span class="required">*</span></label
                    >
                    <input
                        id="namaMitra"
                        type="text"
                        bind:value={namaMitra}
                        placeholder="Nama orang yang melakukan deal"
                        class:error={errors["namaMitra"]}
                    />
                    {#if errors["namaMitra"]}<span class="error-text"
                            >{errors["namaMitra"]}</span
                        >{/if}
                </div>

                <!-- Foto Mitra -->
                <div class="form-group">
                    <label>Foto Mitra</label>
                    {#if fotoPreview}
                        <div class="photo-preview">
                            <img src={fotoPreview} alt="Preview" />
                            <button
                                type="button"
                                class="remove-photo"
                                onclick={removePhoto}
                                aria-label="Hapus foto"
                            >
                                ✕
                            </button>
                        </div>
                    {:else}
                        <div class="photo-actions">
                            <button
                                type="button"
                                class="photo-btn camera-btn"
                                onclick={() => {
                                    const el = document.getElementById(
                                        "fotoCam",
                                    ) as HTMLInputElement;
                                    el?.click();
                                }}
                            >
                                <span class="photo-btn-icon">📷</span>
                                <span class="photo-btn-label">Ambil Foto</span>
                            </button>
                            <button
                                type="button"
                                class="photo-btn gallery-btn"
                                onclick={() => {
                                    const el = document.getElementById(
                                        "fotoGallery",
                                    ) as HTMLInputElement;
                                    el?.click();
                                }}
                            >
                                <span class="photo-btn-icon">🖼️</span>
                                <span class="photo-btn-label">Dari Galeri</span>
                            </button>
                        </div>
                        <input
                            id="fotoCam"
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onchange={handleFileChange}
                            class="file-input-hidden"
                        />
                        <input
                            id="fotoGallery"
                            type="file"
                            accept="image/*"
                            onchange={handleFileChange}
                            class="file-input-hidden"
                        />
                    {/if}
                </div>

                <!-- Brand Dropdown -->
                <div class="form-group">
                    <label for="brand"
                        >Brand <span class="required">*</span></label
                    >
                    <div class="select-wrap">
                        <select
                            id="brand"
                            bind:value={selectedBrandId}
                            class:error={errors["brand"]}
                        >
                            <option value="" disabled>Pilih Brand</option>
                            {#each brands as brand}
                                <option value={brand.id}>{brand.name}</option>
                            {/each}
                        </select>
                        <div class="select-arrow">▼</div>
                    </div>
                    {#if errors["brand"]}<span class="error-text"
                            >{errors["brand"]}</span
                        >{/if}
                </div>

                <!-- Outlet Dropdown -->
                <div class="form-group">
                    <label for="outlet"
                        >Outlet Pameran (Tempat Deal) <span class="required"
                            >*</span
                        ></label
                    >
                    <div class="select-wrap">
                        <select
                            id="outlet"
                            bind:value={selectedOutletId}
                            class:error={errors["outlet"]}
                        >
                            <option value="" disabled
                                >Pilih Outlet Pameran</option
                            >
                            {#each outlets as outlet}
                                <option value={outlet.id}>{outlet.name}</option>
                            {/each}
                        </select>
                        <div class="select-arrow">▼</div>
                    </div>
                    {#if errors["outlet"]}<span class="error-text"
                            >{errors["outlet"]}</span
                        >{/if}
                </div>

                <!-- Lokasi -->
                <div class="form-group">
                    <label for="lokasi">Lokasi Rencana Buka Outlet</label>
                    <input
                        id="lokasi"
                        type="text"
                        bind:value={lokasiBukaOutlet}
                        placeholder="Kota/daerah rencana buka"
                    />
                </div>

                <!-- Jumlah Transaksi -->
                <div class="form-group">
                    <label for="transaksi"
                        >Jumlah Transaksi (Rp) <span class="required">*</span
                        ></label
                    >
                    <div class="input-with-prefix">
                        <span class="input-prefix">Rp</span>
                        <input
                            id="transaksi"
                            type="text"
                            inputmode="numeric"
                            value={formatRupiahInput(jumlahTransaksi)}
                            oninput={handleAmountInput}
                            placeholder="0"
                            class:error={errors["jumlahTransaksi"]}
                        />
                    </div>
                    {#if errors["jumlahTransaksi"]}<span class="error-text"
                            >{errors["jumlahTransaksi"]}</span
                        >{/if}
                </div>

                <!-- Catatan -->
                <div class="form-group">
                    <label for="catatan">Catatan</label>
                    <textarea
                        id="catatan"
                        bind:value={catatan}
                        placeholder="Keterangan tambahan (opsional)"
                        rows="3"
                    ></textarea>
                </div>

                {#if errors["submit"]}
                    <div class="submit-error">
                        <span>⚠️ {errors["submit"]}</span>
                    </div>
                {/if}

                <button
                    type="submit"
                    class="btn btn-submit"
                    disabled={isSubmitting}
                >
                    {#if isSubmitting}
                        <span class="btn-spinner"></span> Mengirim...
                    {:else}
                        🚀 Submit Deal
                    {/if}
                </button>
            </form>
        </div>
    {/if}
</div>

<style>
    /* Styling similar to existing form layout */
    .form-page {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        background: var(--gradient-body);
    }
    .center-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        gap: 12px;
        padding: 40px;
    }
    .loading-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid var(--border-color);
        border-top-color: var(--gold);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
    .center-state p {
        color: var(--text-secondary);
    }
    .error-state .error-icon {
        font-size: 64px;
    }
    .error-state h2 {
        font-size: 24px;
        color: #ef4444;
    }
    .success-state {
        animation: fadeInUp 0.5s ease;
    }
    .success-icon {
        font-size: 80px;
        animation: bounce 0.6s ease;
    }
    @keyframes bounce {
        0%,
        100% {
            transform: translateY(0);
        }
        50% {
            transform: translateY(-20px);
        }
    }
    .success-state h2 {
        font-size: 28px;
        background: linear-gradient(135deg, var(--gold), var(--accent-orange));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }
    .form-container {
        width: 100%;
        max-width: 520px;
        animation: fadeInUp 0.5s ease;
    }
    .form-header {
        text-align: center;
        margin-bottom: 28px;
    }
    .public-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 16px;
        background: var(--bg-card);
        border: 1px solid rgba(59, 130, 246, 0.3);
        border-radius: var(--radius-full);
        font-size: 14px;
        font-weight: 600;
        color: var(--accent-blue);
        margin-bottom: 16px;
    }
    .public-icon {
        font-size: 16px;
    }
    .form-header h1 {
        font-size: 28px;
        font-weight: 800;
        background: linear-gradient(135deg, var(--gold), var(--accent-orange));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin-bottom: 4px;
    }
    .form-header p {
        color: var(--text-secondary);
        font-size: 14px;
    }
    .deal-form {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }
    .form-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    .form-group label {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-secondary);
    }
    .required {
        color: #ef4444;
    }
    input[type="text"],
    textarea,
    select {
        width: 100%;
        padding: 14px 16px;
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        color: var(--text-primary);
        font-family: var(--font-family);
        font-size: 15px;
        transition: all var(--transition-fast);
        outline: none;
    }
    .select-wrap {
        position: relative;
        width: 100%;
    }
    select {
        appearance: none;
        cursor: pointer;
    }
    .select-arrow {
        position: absolute;
        right: 16px;
        top: 50%;
        transform: translateY(-50%);
        pointer-events: none;
        font-size: 10px;
        color: var(--text-muted);
    }
    input[type="text"]:focus,
    textarea:focus,
    select:focus {
        border-color: var(--accent-blue);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }
    input[type="text"].error,
    textarea.error,
    select.error {
        border-color: #ef4444;
    }
    textarea {
        resize: vertical;
        min-height: 80px;
    }
    .input-with-prefix {
        display: flex;
        align-items: stretch;
    }
    .input-prefix {
        display: flex;
        align-items: center;
        padding: 0 14px;
        background: var(--bg-card-elevated);
        border: 1px solid var(--border-color);
        border-right: none;
        border-radius: var(--radius-md) 0 0 var(--radius-md);
        color: var(--text-muted);
        font-weight: 600;
        font-size: 14px;
    }
    .input-with-prefix input {
        border-radius: 0 var(--radius-md) var(--radius-md) 0;
        flex: 1;
    }
    .error-text {
        font-size: 13px;
        color: #ef4444;
        font-weight: 500;
    }
    .file-input-hidden {
        display: none;
    }
    .photo-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
    }
    .photo-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 24px 16px;
        border: 2px dashed var(--border-color);
        border-radius: var(--radius-lg);
        cursor: pointer;
        transition: all var(--transition-fast);
        background: var(--bg-card);
        font-family: var(--font-family);
    }
    .photo-btn:hover {
        border-color: var(--accent-blue);
        background: rgba(59, 130, 246, 0.05);
        transform: translateY(-2px);
    }
    .photo-btn-icon {
        font-size: 32px;
    }
    .photo-btn-label {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
    }
    .photo-preview {
        position: relative;
        width: 100%;
        max-height: 300px;
        border-radius: var(--radius-lg);
        overflow: hidden;
        border: 1px solid var(--border-color);
    }
    .photo-preview img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        max-height: 300px;
    }
    .remove-photo {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.7);
        border: none;
        color: white;
        font-size: 16px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all var(--transition-fast);
    }
    .remove-photo:hover {
        background: #ef4444;
    }
    .submit-error {
        padding: 12px 16px;
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.3);
        border-radius: var(--radius-md);
        color: #fca5a5;
        font-size: 14px;
    }
    .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 14px 24px;
        border: none;
        border-radius: var(--radius-md);
        font-family: var(--font-family);
        font-size: 16px;
        font-weight: 700;
        cursor: pointer;
        transition: all var(--transition-fast);
    }
    .btn-primary {
        background: linear-gradient(135deg, #3b82f6, #06b6d4);
        color: white;
        margin-top: 8px;
    }
    .btn-primary:hover {
        transform: translateY(-1px);
        box-shadow: var(--shadow-blue);
    }
    .btn-submit {
        background: linear-gradient(135deg, #ffd700, #ffa500, #ff8c00);
        color: #1a1a2e;
        font-size: 17px;
        padding: 16px 24px;
        margin-top: 4px;
    }
    .btn-submit:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: var(--shadow-gold);
    }
    .btn-submit:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }
    .btn-spinner {
        width: 18px;
        height: 18px;
        border: 2px solid rgba(0, 0, 0, 0.2);
        border-top-color: #1a1a2e;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
</style>
