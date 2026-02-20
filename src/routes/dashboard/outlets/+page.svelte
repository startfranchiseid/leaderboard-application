<script lang="ts">
    import { onMount } from "svelte";
    import { pb } from "$lib/pocketbase";
    import type { ExpoOutlet, Deal } from "$lib/types";

    let outlets = $state<ExpoOutlet[]>([]);
    let dealStats = $state<Record<string, { count: number; total: number }>>(
        {},
    );
    let isLoading = $state(true);

    // Modal state
    let showModal = $state(false);
    let editingOutlet = $state<ExpoOutlet | null>(null);
    let formName = $state("");
    let formBrand = $state("");
    let formToken = $state("");
    let formActive = $state(true);
    let isSaving = $state(false);
    let saveError = $state("");

    // Share modal
    let showShareModal = $state(false);
    let shareOutlet = $state<ExpoOutlet | null>(null);
    let copied = $state(false);

    function generateToken(): string {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let token = "BOOTH-";
        for (let i = 0; i < 6; i++)
            token += chars[Math.floor(Math.random() * chars.length)];
        return token;
    }

    function getFormUrl(token: string): string {
        const base =
            typeof window !== "undefined" ? window.location.origin : "";
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
                pb
                    .collection("expo_outlets")
                    .getFullList<ExpoOutlet>({ sort: "-created" }),
                pb.collection("deals").getFullList<Deal>(),
            ]);
            outlets = outletList;

            // Build per-outlet stats
            const stats: Record<string, { count: number; total: number }> = {};
            for (const deal of deals) {
                if (!stats[deal.expo_outlet])
                    stats[deal.expo_outlet] = { count: 0, total: 0 };
                stats[deal.expo_outlet].count += 1;
                stats[deal.expo_outlet].total += deal.jumlah_transaksi;
            }
            dealStats = stats;
        } catch (err) {
            console.error("Failed to fetch outlets:", err);
        } finally {
            isLoading = false;
        }
    }

    function openCreate() {
        editingOutlet = null;
        formName = "";
        formBrand = "";
        formToken = generateToken();
        formActive = true;
        saveError = "";
        showModal = true;
    }

    function openEdit(outlet: ExpoOutlet) {
        editingOutlet = outlet;
        formName = outlet.name;
        formBrand = outlet.brand_name;
        formToken = outlet.access_token;
        formActive = outlet.is_active;
        saveError = "";
        showModal = true;
    }

    function openShare(outlet: ExpoOutlet) {
        shareOutlet = outlet;
        copied = false;
        showShareModal = true;
    }

    async function copyLink() {
        if (!shareOutlet) return;
        try {
            await navigator.clipboard.writeText(
                getFormUrl(shareOutlet.access_token),
            );
            copied = true;
            setTimeout(() => {
                copied = false;
            }, 2000);
        } catch {
            // fallback
            const input = document.createElement("input");
            input.value = getFormUrl(shareOutlet.access_token);
            document.body.appendChild(input);
            input.select();
            document.execCommand("copy");
            document.body.removeChild(input);
            copied = true;
            setTimeout(() => {
                copied = false;
            }, 2000);
        }
    }

    async function handleSave() {
        if (!formName.trim() || !formToken.trim()) {
            saveError = "Nama dan token wajib diisi";
            return;
        }
        isSaving = true;
        saveError = "";

        try {
            const data = {
                name: formName.trim(),
                brand_name: formBrand.trim(),
                access_token: formToken.trim(),
                is_active: formActive,
            };

            if (editingOutlet) {
                await pb
                    .collection("expo_outlets")
                    .update(editingOutlet.id, data);
            } else {
                await pb.collection("expo_outlets").create(data);
            }

            showModal = false;
            await fetchOutlets();
        } catch (err: any) {
            saveError = err?.message || "Gagal menyimpan";
        } finally {
            isSaving = false;
        }
    }

    async function toggleActive(outlet: ExpoOutlet) {
        try {
            await pb
                .collection("expo_outlets")
                .update(outlet.id, { is_active: !outlet.is_active });
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

    onMount(fetchOutlets);
</script>

<div class="outlets-page">
    <div class="page-header">
        <div>
            <h1 class="page-title">🏪 Kelola Outlet</h1>
            <p class="page-sub">
                Buat dan kelola outlet peserta expo, share link form
            </p>
        </div>
        <button class="btn btn-primary" onclick={openCreate}
            >+ Tambah Outlet</button
        >
    </div>

    {#if isLoading}
        <div class="loading-box">Memuat...</div>
    {:else if outlets.length === 0}
        <div class="empty-box">
            <p>🏪 Belum ada outlet. Klik "Tambah Outlet" untuk mulai.</p>
        </div>
    {:else}
        <div class="outlet-grid">
            {#each outlets as outlet}
                <div class="outlet-card" class:inactive={!outlet.is_active}>
                    <div class="card-top">
                        <div
                            class="card-status"
                            class:active={outlet.is_active}
                        >
                            {outlet.is_active ? "● Aktif" : "○ Nonaktif"}
                        </div>
                        <div class="card-actions">
                            <button
                                class="icon-btn"
                                onclick={() => openEdit(outlet)}
                                title="Edit">✏️</button
                            >
                            <button
                                class="icon-btn"
                                onclick={() => deleteOutlet(outlet)}
                                title="Hapus">🗑️</button
                            >
                        </div>
                    </div>

                    <h3 class="card-name">{outlet.name}</h3>
                    <p class="card-brand">{outlet.brand_name || "-"}</p>
                    <p class="card-token">
                        Token: <code>{outlet.access_token}</code>
                    </p>

                    <!-- Deal Stats -->
                    {#if dealStats[outlet.id]}
                        <div class="card-stats">
                            <span class="stat-pill deals-pill">
                                🤝 {dealStats[outlet.id].count} deals
                            </span>
                            <span class="stat-pill money-pill">
                                💰 Rp {formatRupiah(dealStats[outlet.id].total)}
                            </span>
                        </div>
                    {:else}
                        <div class="card-stats">
                            <span class="stat-pill empty-pill"
                                >Belum ada deal</span
                            >
                        </div>
                    {/if}

                    <div class="card-bottom">
                        <button
                            class="btn btn-share"
                            onclick={() => openShare(outlet)}
                        >
                            🔗 Share Link
                        </button>
                        <a
                            href="/dashboard/outlets/{outlet.id}/qr"
                            class="btn btn-qr"
                            target="_blank"
                            rel="noopener"
                        >
                            🖨️ Print QR
                        </a>
                        <button
                            class="btn btn-toggle"
                            onclick={() => toggleActive(outlet)}
                        >
                            {outlet.is_active ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<!-- Create/Edit Modal -->
{#if showModal}
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_interactive_supports_focus -->
    <div
        class="modal-overlay"
        onclick={() => (showModal = false)}
        onkeydown={(e) => e.key === "Escape" && (showModal = false)}
        role="dialog"
        tabindex="-1"
        aria-modal="true"
    >
        <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
        <div class="modal" onclick={(e) => e.stopPropagation()} role="document">
            <h2>{editingOutlet ? "Edit Outlet" : "Tambah Outlet Baru"}</h2>

            <div class="modal-form">
                <label>
                    Nama Outlet *
                    <input
                        type="text"
                        bind:value={formName}
                        placeholder="Booth A - Hokben"
                    />
                </label>
                <label>
                    Nama Brand
                    <input
                        type="text"
                        bind:value={formBrand}
                        placeholder="Hokben"
                    />
                </label>
                <label>
                    Access Token *
                    <div class="token-row">
                        <input
                            type="text"
                            bind:value={formToken}
                            placeholder="BOOTH-XXXXXX"
                        />
                        {#if !editingOutlet}
                            <button
                                class="btn btn-sm"
                                onclick={() => (formToken = generateToken())}
                                >🔄 Generate</button
                            >
                        {/if}
                    </div>
                </label>
                <label class="check-label">
                    <input type="checkbox" bind:checked={formActive} />
                    <span>Outlet aktif</span>
                </label>

                {#if saveError}
                    <p class="error-msg">⚠️ {saveError}</p>
                {/if}

                <div class="modal-actions">
                    <button
                        class="btn btn-secondary"
                        onclick={() => (showModal = false)}>Batal</button
                    >
                    <button
                        class="btn btn-primary"
                        onclick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving
                            ? "Menyimpan..."
                            : editingOutlet
                              ? "Update"
                              : "Simpan"}
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}

<!-- Share Modal -->
{#if showShareModal && shareOutlet}
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_interactive_supports_focus -->
    <div
        class="modal-overlay"
        onclick={() => (showShareModal = false)}
        onkeydown={(e) => e.key === "Escape" && (showShareModal = false)}
        role="dialog"
        tabindex="-1"
        aria-modal="true"
    >
        <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
        <div
            class="modal share-modal"
            onclick={(e) => e.stopPropagation()}
            role="document"
        >
            <h2>🔗 Share Form Link</h2>
            <p class="share-outlet-name">{shareOutlet.name}</p>

            <div class="share-url-box">
                <input
                    type="text"
                    readonly
                    value={getFormUrl(shareOutlet.access_token)}
                />
                <button class="btn btn-copy" onclick={copyLink}>
                    {copied ? "✅ Copied!" : "📋 Copy"}
                </button>
            </div>

            <div class="qr-section">
                <p class="qr-label">Scan QR Code</p>
                <img
                    src={getQrUrl(shareOutlet.access_token)}
                    alt="QR Code untuk {shareOutlet.name}"
                    class="qr-image"
                />
            </div>

            <button
                class="btn btn-secondary full-width"
                onclick={() => (showShareModal = false)}>Tutup</button
            >
        </div>
    </div>
{/if}

<style>
    .outlets-page {
        max-width: 1000px;
    }

    .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 24px;
        gap: 16px;
    }

    .page-title {
        font-size: 26px;
        font-weight: 800;
        color: var(--text-heading);
        margin-bottom: 4px;
    }
    .page-sub {
        font-size: 14px;
        color: var(--text-muted);
    }

    /* Outlet Grid */
    .outlet-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 16px;
    }

    .outlet-card {
        background: var(--gradient-card);
        border: 1px solid var(--border-card);
        border-radius: var(--radius-lg);
        padding: 20px;
        box-shadow: var(--shadow-card);
        transition: all var(--transition-fast);
    }

    .outlet-card:hover {
        border-color: var(--accent-blue);
    }
    .outlet-card.inactive {
        opacity: 0.6;
    }

    .card-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
    }

    .card-status {
        font-size: 12px;
        font-weight: 600;
        color: var(--accent-red);
    }

    .card-status.active {
        color: var(--accent-green);
    }

    .card-actions {
        display: flex;
        gap: 4px;
    }

    .icon-btn {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 16px;
        padding: 4px;
        border-radius: var(--radius-sm);
        transition: background var(--transition-fast);
    }

    .icon-btn:hover {
        background: var(--bg-card-elevated);
    }

    .card-name {
        font-size: 16px;
        font-weight: 700;
        color: var(--text-heading);
        margin-bottom: 4px;
    }

    .card-brand {
        font-size: 13px;
        color: var(--accent-cyan);
        margin-bottom: 8px;
    }

    .card-token {
        font-size: 12px;
        color: var(--text-muted);
        margin-bottom: 12px;
    }

    .card-token code {
        background: var(--bg-card-elevated);
        padding: 2px 8px;
        border-radius: var(--radius-sm);
        font-size: 12px;
        color: var(--text-secondary);
    }

    /* Deal Stats */
    .card-stats {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 16px;
    }

    .stat-pill {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 10px;
        border-radius: var(--radius-full);
        font-size: 12px;
        font-weight: 600;
    }

    .deals-pill {
        background: rgba(59, 130, 246, 0.1);
        color: var(--accent-blue);
    }

    .money-pill {
        background: rgba(16, 185, 129, 0.1);
        color: var(--accent-green);
    }

    .empty-pill {
        background: var(--bg-card-elevated);
        color: var(--text-muted);
    }

    .card-bottom {
        display: flex;
        gap: 8px;
    }

    /* Empty / Loading */
    .loading-box,
    .empty-box {
        padding: 40px;
        text-align: center;
        color: var(--text-muted);
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
    }

    /* Buttons */
    .btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 10px 18px;
        border: none;
        border-radius: var(--radius-md);
        font-family: var(--font-family);
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all var(--transition-fast);
        white-space: nowrap;
    }

    .btn-primary {
        background: var(--accent-blue);
        color: white;
    }

    .btn-primary:hover {
        opacity: 0.9;
        transform: translateY(-1px);
    }
    .btn-primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .btn-secondary {
        background: var(--bg-card-elevated);
        color: var(--text-secondary);
        border: 1px solid var(--border-color);
    }

    .btn-secondary:hover {
        background: var(--bg-card);
    }

    .btn-share {
        background: rgba(16, 185, 129, 0.12);
        color: var(--accent-green);
        flex: 1;
    }

    .btn-share:hover {
        background: rgba(16, 185, 129, 0.2);
    }

    .btn-qr {
        background: rgba(139, 92, 246, 0.1);
        color: var(--accent-purple);
        font-size: 12px;
        padding: 8px 12px;
        text-decoration: none;
    }

    .btn-qr:hover {
        background: rgba(139, 92, 246, 0.2);
    }

    .btn-toggle {
        background: var(--bg-card-elevated);
        color: var(--text-muted);
        font-size: 12px;
        padding: 8px 12px;
    }

    .btn-toggle:hover {
        color: var(--text-primary);
    }

    .btn-sm {
        padding: 8px 12px;
        font-size: 12px;
        background: var(--bg-card-elevated);
        color: var(--text-secondary);
        border: 1px solid var(--border-color);
    }

    .btn-copy {
        background: var(--accent-blue);
        color: white;
        padding: 10px 16px;
        border-radius: 0 var(--radius-md) var(--radius-md) 0;
    }

    .full-width {
        width: 100%;
        justify-content: center;
    }

    /* Modal */
    .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999;
        padding: 20px;
        backdrop-filter: blur(4px);
    }

    .modal {
        background: var(--bg-surface);
        border: 1px solid var(--border-card);
        border-radius: var(--radius-xl);
        padding: 28px;
        width: 100%;
        max-width: 480px;
        box-shadow: var(--shadow-lg);
    }

    .modal h2 {
        font-size: 20px;
        font-weight: 700;
        color: var(--text-heading);
        margin-bottom: 20px;
    }

    .modal-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .modal-form label {
        display: flex;
        flex-direction: column;
        gap: 6px;
        font-size: 13px;
        font-weight: 600;
        color: var(--text-secondary);
    }

    .modal-form input[type="text"] {
        padding: 10px 14px;
        background: var(--bg-input);
        border: 1px solid var(--border-input);
        border-radius: var(--radius-md);
        color: var(--text-primary);
        font-family: var(--font-family);
        font-size: 14px;
        outline: none;
        transition: border var(--transition-fast);
    }

    .modal-form input[type="text"]:focus {
        border-color: var(--accent-blue);
    }

    .token-row {
        display: flex;
        gap: 8px;
    }

    .token-row input {
        flex: 1;
    }

    .check-label {
        flex-direction: row !important;
        align-items: center;
        gap: 8px !important;
    }

    .check-label input[type="checkbox"] {
        width: 18px;
        height: 18px;
        accent-color: var(--accent-blue);
    }

    .error-msg {
        font-size: 13px;
        color: var(--accent-red);
    }

    .modal-actions {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
        margin-top: 8px;
    }

    /* Share Modal */
    .share-modal {
        text-align: center;
        max-width: 420px;
    }

    .share-outlet-name {
        font-size: 16px;
        font-weight: 600;
        color: var(--text-heading);
        margin-bottom: 20px;
    }

    .share-url-box {
        display: flex;
        margin-bottom: 24px;
    }

    .share-url-box input {
        flex: 1;
        padding: 10px 14px;
        background: var(--bg-input);
        border: 1px solid var(--border-input);
        border-radius: var(--radius-md) 0 0 var(--radius-md);
        color: var(--text-primary);
        font-family: var(--font-family);
        font-size: 13px;
        outline: none;
    }

    .qr-section {
        margin-bottom: 20px;
    }

    .qr-label {
        font-size: 13px;
        color: var(--text-muted);
        margin-bottom: 12px;
    }

    .qr-image {
        width: 200px;
        height: 200px;
        margin: 0 auto;
        border-radius: var(--radius-md);
        border: 1px solid var(--border-color);
        background: white;
        padding: 8px;
    }

    @media (max-width: 640px) {
        .page-header {
            flex-direction: column;
        }
        .outlet-grid {
            grid-template-columns: 1fr;
        }
    }
</style>
