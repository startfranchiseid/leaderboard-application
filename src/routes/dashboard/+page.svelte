<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { pb } from "$lib/pocketbase";
    import type { Deal, ExpoOutlet } from "$lib/types";

    let totalDeals = $state(0);
    let totalTransaksi = $state(0);
    let totalOutlets = $state(0);
    let totalMitra = $state(0);
    let recentDeals = $state<Deal[]>([]);
    let isLoading = $state(true);
    let isLive = $state(false);

    let allDeals = $state<Deal[]>([]);
    let unsubscribe: (() => void) | null = null;

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
        totalDeals = deals.length;
        totalTransaksi = deals.reduce((sum, d) => sum + d.jumlah_transaksi, 0);
        const mitraSet = new Set(
            deals.map((d) => d.nama_mitra.trim().toLowerCase()),
        );
        totalMitra = mitraSet.size;
        recentDeals = [...deals]
            .sort((a, b) => b.created.localeCompare(a.created))
            .slice(0, 8);
    }

    onMount(async () => {
        try {
            const [deals, outlets] = await Promise.all([
                pb.collection("deals").getFullList<Deal>({ sort: "-created" }),
                pb.collection("expo_outlets").getFullList<ExpoOutlet>(),
            ]);

            allDeals = deals;
            totalOutlets = outlets.length;
            recalculate(deals);

            // Subscribe to real-time updates
            unsubscribe = await pb
                .collection("deals")
                .subscribe<Deal>("*", (e) => {
                    if (e.action === "create") {
                        allDeals = [e.record, ...allDeals];
                    } else if (e.action === "update") {
                        allDeals = allDeals.map((d) =>
                            d.id === e.record.id ? e.record : d,
                        );
                    } else if (e.action === "delete") {
                        allDeals = allDeals.filter((d) => d.id !== e.record.id);
                    }
                    recalculate(allDeals);
                });

            isLive = true;
        } catch (err) {
            console.error("Failed to load dashboard data:", err);
        } finally {
            isLoading = false;
        }
    });

    onDestroy(() => {
        if (unsubscribe) pb.collection("deals").unsubscribe("*");
    });
</script>

<div class="overview">
    <div class="page-top">
        <div>
            <h1 class="page-title">📊 Overview</h1>
            <p class="page-sub">
                Pantau semua aktivitas leaderboard expo franchise
            </p>
        </div>
        {#if isLive}
            <div class="live-badge">
                <span class="live-dot"></span>
                LIVE
            </div>
        {/if}
    </div>

    {#if isLoading}
        <div class="loading-row">
            {#each Array(4) as _}
                <div class="stat-card skeleton"></div>
            {/each}
        </div>
    {:else}
        <!-- Stat Cards -->
        <div class="stat-grid">
            <div class="stat-card">
                <div class="stat-icon blue">🤝</div>
                <div class="stat-info">
                    <span class="stat-value">{totalDeals}</span>
                    <span class="stat-label">Total Deals</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon gold">💰</div>
                <div class="stat-info">
                    <span class="stat-value"
                        >Rp {formatRupiah(totalTransaksi)}</span
                    >
                    <span class="stat-label">Total Transaksi</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon green">🏪</div>
                <div class="stat-info">
                    <span class="stat-value">{totalOutlets}</span>
                    <span class="stat-label">Outlet Aktif</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon purple">👥</div>
                <div class="stat-info">
                    <span class="stat-value">{totalMitra}</span>
                    <span class="stat-label">Mitra Unik</span>
                </div>
            </div>
        </div>

        <!-- Recent Deals -->
        <div class="section">
            <div class="section-header">
                <h2>🕐 Deals Terbaru</h2>
                <a href="/dashboard/deals" class="view-all">Lihat Semua →</a>
            </div>

            {#if recentDeals.length === 0}
                <div class="empty-box">
                    <p>Belum ada deal yang tercatat.</p>
                </div>
            {:else}
                <div class="deals-list">
                    {#each recentDeals as deal (deal.id)}
                        <div class="deal-row">
                            <div class="deal-info">
                                <span class="deal-name">{deal.nama_mitra}</span>
                                <span class="deal-meta"
                                    >{deal.brand_name || "-"} • {deal.outlet_name ||
                                        "-"}</span
                                >
                            </div>
                            <div class="deal-right">
                                <span class="deal-amount"
                                    >Rp {formatRupiah(
                                        deal.jumlah_transaksi,
                                    )}</span
                                >
                                <span class="deal-time"
                                    >{timeAgo(deal.created)}</span
                                >
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    {/if}
</div>

<style>
    .overview {
        max-width: 900px;
    }

    .page-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 28px;
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

    /* Live Badge */
    .live-badge {
        display: flex;
        align-items: center;
        gap: 7px;
        padding: 6px 14px;
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.2);
        border-radius: var(--radius-full);
        font-size: 12px;
        font-weight: 700;
        color: #ef4444;
        letter-spacing: 0.5px;
        white-space: nowrap;
        flex-shrink: 0;
    }

    .live-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #ef4444;
        animation: pulse 2s infinite;
    }

    /* Stat Cards */
    .stat-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
        gap: 16px;
        margin-bottom: 36px;
    }

    .stat-card {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 20px;
        background: var(--gradient-card);
        border: 1px solid var(--border-card);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-card);
        transition: all var(--transition-theme);
    }

    .stat-card.skeleton {
        height: 80px;
        animation: pulse 1.5s infinite;
    }

    .loading-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
        gap: 16px;
        margin-bottom: 36px;
    }

    .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: var(--radius-md);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
        flex-shrink: 0;
    }

    .stat-icon.blue {
        background: rgba(59, 130, 246, 0.12);
    }
    .stat-icon.gold {
        background: rgba(255, 215, 0, 0.12);
    }
    .stat-icon.green {
        background: rgba(16, 185, 129, 0.12);
    }
    .stat-icon.purple {
        background: rgba(139, 92, 246, 0.12);
    }

    .stat-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .stat-value {
        font-size: 20px;
        font-weight: 800;
        color: var(--text-heading);
    }

    .stat-label {
        font-size: 12px;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.3px;
    }

    /* Section */
    .section {
        margin-bottom: 24px;
    }

    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
    }

    .section-header h2 {
        font-size: 18px;
        font-weight: 700;
        color: var(--text-heading);
    }

    .view-all {
        font-size: 13px;
        font-weight: 600;
        color: var(--accent-blue);
        text-decoration: none;
    }

    .view-all:hover {
        text-decoration: underline;
    }

    .empty-box {
        padding: 40px;
        text-align: center;
        color: var(--text-muted);
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
    }

    /* Deals List */
    .deals-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .deal-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 14px 18px;
        background: var(--gradient-card);
        border: 1px solid var(--border-card);
        border-radius: var(--radius-md);
        transition: all var(--transition-fast);
        animation: fadeInUp 0.3s ease;
    }

    .deal-row:hover {
        border-color: var(--accent-blue);
    }

    .deal-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .deal-name {
        font-weight: 600;
        font-size: 14px;
        color: var(--text-heading);
    }

    .deal-meta {
        font-size: 12px;
        color: var(--text-muted);
    }

    .deal-right {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 2px;
    }

    .deal-amount {
        font-weight: 700;
        font-size: 14px;
        color: var(--accent-green);
    }

    .deal-time {
        font-size: 11px;
        color: var(--text-muted);
    }
</style>
