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
            <h1 class="page-title">Kelola Outlet</h1>
            <p class="page-sub">
                Buat dan kelola outlet peserta expo, share link form
            </p>
        </div>
        <button class="btn btn-primary" onclick={openCreate}>
            <svg
                class="btn-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                ><line x1="12" y1="5" x2="12" y2="19" /><line
                    x1="5"
                    y1="12"
                    x2="19"
                    y2="12"
                /></svg
            >
            Tambah Outlet
        </button>
    </div>

    {#if isLoading}
        <div class="loading-box">Memuat...</div>
    {:else if outlets.length === 0}
        <div class="empty-box">
            <svg
                class="empty-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                ><path
                    d="M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z"
                /></svg
            >
            <p>Belum ada outlet. Klik "Tambah Outlet" untuk mulai.</p>
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
                            <span class="status-dot"></span>
                            {outlet.is_active ? "Aktif" : "Nonaktif"}
                        </div>
                        <div class="card-actions">
                            <button
                                class="icon-btn"
                                onclick={() => openEdit(outlet)}
                                title="Edit"
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    ><path
                                        d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                                    /><path
                                        d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                                    /></svg
                                >
                            </button>
                            <button
                                class="icon-btn icon-btn-danger"
                                onclick={() => deleteOutlet(outlet)}
                                title="Hapus"
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    ><polyline points="3 6 5 6 21 6" /><path
                                        d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                                    /></svg
                                >
                            </button>
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
                                <svg
                                    class="pill-icon"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    ><path d="M16.5 9.4l-9-5.19" /><path
                                        d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
                                    /></svg
                                >
                                {dealStats[outlet.id].count} deals
                            </span>
                            <span class="stat-pill money-pill">
                                <svg
                                    class="pill-icon"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    ><line
                                        x1="12"
                                        y1="1"
                                        x2="12"
                                        y2="23"
                                    /><path
                                        d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
                                    /></svg
                                >
                                Rp {formatRupiah(dealStats[outlet.id].total)}
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
                            <svg
                                class="btn-icon"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                ><path
                                    d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
                                /><path
                                    d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
                                /></svg
                            >
                            Share
                        </button>
                        <a
                            href="/dashboard/outlets/{outlet.id}/qr"
                            class="btn btn-qr"
                            target="_blank"
                            rel="noopener"
                        >
                            <svg
                                class="btn-icon"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                ><polyline points="6 9 6 2 18 2 18 9" /><path
                                    d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"
                                /><rect
                                    x="6"
                                    y="14"
                                    width="12"
                                    height="8"
                                /></svg
                            >
                            Print QR
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
                            >
                                <svg
                                    class="btn-icon-sm"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    ><polyline
                                        points="23 4 23 10 17 10"
                                    /><polyline points="1 20 1 14 7 14" /><path
                                        d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
                                    /></svg
                                >
                                Generate
                            </button>
                        {/if}
                    </div>
                </label>
                <label class="check-label">
                    <input type="checkbox" bind:checked={formActive} />
                    <span>Outlet aktif</span>
                </label>

                {#if saveError}
                    <p class="error-msg">
                        <svg
                            class="error-icon"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            ><path
                                d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                            /><line x1="12" y1="9" x2="12" y2="13" /><line
                                x1="12"
                                y1="17"
                                x2="12.01"
                                y2="17"
                            /></svg
                        >
                        {saveError}
                    </p>
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
            <h2>
                <svg
                    class="modal-title-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    ><path
                        d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
                    /><path
                        d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
                    /></svg
                >
                Share Form Link
            </h2>
            <p class="share-outlet-name">{shareOutlet.name}</p>

            <div class="share-url-box">
                <input
                    type="text"
                    readonly
                    value={getFormUrl(shareOutlet.access_token)}
                />
                <button class="btn btn-copy" onclick={copyLink}>
                    {#if copied}
                        <svg
                            class="btn-icon"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            ><polyline points="20 6 9 17 4 12" /></svg
                        >
                        Copied!
                    {:else}
                        <svg
                            class="btn-icon"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            ><rect
                                x="9"
                                y="9"
                                width="13"
                                height="13"
                                rx="2"
                                ry="2"
                            /><path
                                d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                            /></svg
                        >
                        Copy
                    {/if}
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
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
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
        display: inline-flex;
        align-items: center;
        gap: 6px;
    }

    .card-status.active {
        color: var(--accent-green);
    }

    .status-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: currentColor;
    }

    .card-status.active .status-dot {
        animation: pulse 2s infinite;
    }

    .card-actions {
        display: flex;
        gap: 4px;
    }

    .icon-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 6px;
        border-radius: var(--radius-sm);
        transition: all var(--transition-fast);
        color: var(--text-muted);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .icon-btn svg {
        width: 16px;
        height: 16px;
    }

    .icon-btn:hover {
        background: var(--bg-card-elevated);
        color: var(--text-primary);
    }

    .icon-btn-danger:hover {
        background: rgba(239, 68, 68, 0.1);
        color: var(--accent-red);
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
        gap: 5px;
        padding: 4px 10px;
        border-radius: var(--radius-full);
        font-size: 12px;
        font-weight: 600;
    }

    .pill-icon {
        width: 13px;
        height: 13px;
        flex-shrink: 0;
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
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
    }

    .empty-icon {
        width: 40px;
        height: 40px;
        color: var(--text-muted);
        opacity: 0.5;
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

    .btn-icon {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
    }

    .btn-icon-sm {
        width: 14px;
        height: 14px;
        flex-shrink: 0;
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
        display: inline-flex;
        align-items: center;
        gap: 8px;
    }

    .modal-title-icon {
        width: 22px;
        height: 22px;
        color: var(--accent-blue);
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
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .error-icon {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
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

    .share-modal h2 {
        justify-content: center;
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
