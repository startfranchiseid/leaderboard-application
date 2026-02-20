<script lang="ts">
    import { onMount } from "svelte";
    import { pb, getFileUrl } from "$lib/pocketbase";
    import { confettiBurst, confettiRain } from "$lib/confetti";
    import type { ExpoOutlet } from "$lib/types";

    // State
    let token = $state("");
    let outlet = $state<ExpoOutlet | null>(null);
    let isValidating = $state(true);
    let isInvalid = $state(false);
    let isSubmitting = $state(false);
    let showSuccess = $state(false);

    // Form fields
    let namaMitra = $state("");
    let brandName = $state("");
    let lokasiBukaOutlet = $state("");
    let jumlahTransaksi = $state<number | null>(null);
    let catatan = $state("");
    let fotoFile = $state<File | null>(null);
    let fotoPreview = $state<string | null>(null);

    // Error state
    let errors = $state<Record<string, string>>({});

    // Get token from URL
    onMount(() => {
        const url = new URL(window.location.href);
        token = url.searchParams.get("token") || "";

        if (!token) {
            isValidating = false;
            isInvalid = true;
            return;
        }

        validateToken();
    });

    async function validateToken() {
        try {
            const records = await pb
                .collection("expo_outlets")
                .getFullList<ExpoOutlet>({
                    filter: `access_token = "${token}" && is_active = true`,
                });

            if (records.length > 0) {
                outlet = records[0];
                isInvalid = false;
            } else {
                isInvalid = true;
            }
        } catch (err) {
            console.error("Token validation failed:", err);
            isInvalid = true;
        } finally {
            isValidating = false;
        }
    }

    function handleFileChange(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];

        if (file) {
            fotoFile = file;
            // Create preview
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
        // Remove non-numeric characters
        const raw = input.value.replace(/[^0-9]/g, "");
        jumlahTransaksi = raw ? parseInt(raw) : null;
        // Re-format display
        input.value = jumlahTransaksi
            ? jumlahTransaksi.toLocaleString("id-ID")
            : "";
    }

    async function handleSubmit() {
        if (!validate() || !outlet) return;

        isSubmitting = true;

        try {
            const formData = new FormData();
            formData.append("nama_mitra", namaMitra.trim());
            formData.append("brand_name", brandName.trim());
            formData.append("outlet_name", outlet.name);
            formData.append("lokasi_buka_outlet", lokasiBukaOutlet.trim());
            formData.append("jumlah_transaksi", String(jumlahTransaksi));
            formData.append("catatan", catatan.trim());
            formData.append("expo_outlet", outlet.id);

            if (fotoFile) {
                formData.append("foto_mitra", fotoFile);
            }

            await pb.collection("deals").create(formData);

            // Success!
            showSuccess = true;
            confettiBurst();
            setTimeout(() => confettiRain(), 300);

            // Reset form after delay
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
        brandName = "";
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
    <title>Input Deal — Expo Franchise Manado 2026</title>
</svelte:head>

<div class="form-page">
    {#if isValidating}
        <!-- Loading -->
        <div class="center-state">
            <div class="loading-spinner"></div>
            <p>Memvalidasi token outlet...</p>
        </div>
    {:else if isInvalid}
        <!-- Invalid Token -->
        <div class="center-state error-state">
            <div class="error-icon">🚫</div>
            <h2>Token Tidak Valid</h2>
            <p>Token outlet tidak ditemukan atau sudah nonaktif.</p>
            <p class="hint">Pastikan URL yang diberikan sudah benar.</p>
        </div>
    {:else if showSuccess}
        <!-- Success -->
        <div class="center-state success-state">
            <div class="success-icon">🎉</div>
            <h2>Deal Berhasil Tercatat!</h2>
            <p>Data sudah masuk ke leaderboard secara real-time.</p>
            <button class="btn btn-primary" onclick={resetForm}>
                Input Deal Baru
            </button>
        </div>
    {:else}
        <!-- Form -->
        <div class="form-container">
            <div class="form-header">
                <div class="outlet-badge">
                    <span class="outlet-icon">📍</span>
                    <span>{outlet?.name}</span>
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
                    <label for="namaMitra">
                        Nama Mitra <span class="required">*</span>
                    </label>
                    <input
                        id="namaMitra"
                        type="text"
                        bind:value={namaMitra}
                        placeholder="Nama orang yang melakukan deal"
                        class:error={errors["namaMitra"]}
                    />
                    {#if errors["namaMitra"]}
                        <span class="error-text">{errors["namaMitra"]}</span>
                    {/if}
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
                        <label class="file-upload" for="fotoMitra">
                            <div class="upload-icon">📷</div>
                            <span>Tap untuk ambil/pilih foto</span>
                            <span class="upload-hint">JPG, PNG, max 5MB</span>
                        </label>
                        <input
                            id="fotoMitra"
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onchange={handleFileChange}
                            class="file-input-hidden"
                        />
                    {/if}
                </div>

                <!-- Brand -->
                <div class="form-group">
                    <label for="brandName">Nama Brand</label>
                    <input
                        id="brandName"
                        type="text"
                        bind:value={brandName}
                        placeholder="Nama brand franchise"
                    />
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
                    <label for="transaksi">
                        Jumlah Transaksi (Rp) <span class="required">*</span>
                    </label>
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
                    {#if errors["jumlahTransaksi"]}
                        <span class="error-text"
                            >{errors["jumlahTransaksi"]}</span
                        >
                    {/if}
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

                <!-- Submit Error -->
                {#if errors["submit"]}
                    <div class="submit-error">
                        <span>⚠️ {errors["submit"]}</span>
                    </div>
                {/if}

                <!-- Submit Button -->
                <button
                    type="submit"
                    class="btn btn-submit"
                    disabled={isSubmitting}
                >
                    {#if isSubmitting}
                        <span class="btn-spinner"></span>
                        Mengirim...
                    {:else}
                        🚀 Submit Deal
                    {/if}
                </button>
            </form>
        </div>
    {/if}
</div>

<style>
    /* ============================================
	   Form Page Layout
	   ============================================ */
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

    /* Error State */
    .error-state .error-icon {
        font-size: 64px;
    }

    .error-state h2 {
        font-size: 24px;
        color: #ef4444;
    }

    .hint {
        color: var(--text-muted);
        font-size: 14px;
    }

    /* Success State */
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

    /* ============================================
	   Form Container
	   ============================================ */
    .form-container {
        width: 100%;
        max-width: 520px;
        animation: fadeInUp 0.5s ease;
    }

    .form-header {
        text-align: center;
        margin-bottom: 28px;
    }

    .outlet-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 16px;
        background: var(--bg-card);
        border: 1px solid rgba(255, 215, 0, 0.3);
        border-radius: var(--radius-full);
        font-size: 14px;
        font-weight: 600;
        color: var(--gold);
        margin-bottom: 16px;
    }

    .outlet-icon {
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

    /* ============================================
	   Form Fields
	   ============================================ */
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
    textarea {
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

    input[type="text"]:focus,
    textarea:focus {
        border-color: var(--accent-blue);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }

    input[type="text"].error,
    textarea.error {
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

    /* File Upload */
    .file-input-hidden {
        display: none;
    }

    .file-upload {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 28px;
        border: 2px dashed var(--border-color);
        border-radius: var(--radius-lg);
        cursor: pointer;
        transition: all var(--transition-fast);
        gap: 8px;
        background: var(--bg-card);
    }

    .file-upload:hover {
        border-color: var(--accent-blue);
        background: rgba(59, 130, 246, 0.05);
    }

    .upload-icon {
        font-size: 32px;
    }

    .file-upload span {
        font-size: 14px;
        color: var(--text-secondary);
        font-weight: 500;
    }

    .upload-hint {
        color: var(--text-muted) !important;
        font-size: 12px !important;
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

    /* Submit Error */
    .submit-error {
        padding: 12px 16px;
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.3);
        border-radius: var(--radius-md);
        color: #fca5a5;
        font-size: 14px;
    }

    /* ============================================
	   Buttons
	   ============================================ */
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
