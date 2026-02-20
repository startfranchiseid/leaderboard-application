<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { pb, getFileUrl } from "$lib/pocketbase";
    import {
        confettiBurst,
        confettiSideCannons,
        confettiGrand,
        confettiRain,
    } from "$lib/confetti";
    import type { Deal, LeaderboardEntry } from "$lib/types";

    let deals = $state<Deal[]>([]);
    let leaderboard = $state<LeaderboardEntry[]>([]);
    let totalDeals = $state(0);
    let totalTransaksi = $state(0);
    let newDealHighlight = $state<string | null>(null);
    let isLoading = $state(true);
    let unsubscribe: (() => void) | null = null;

    // Build leaderboard from deals
    function buildLeaderboard(allDeals: Deal[]): LeaderboardEntry[] {
        const mitraMap = new Map<string, LeaderboardEntry>();

        for (const deal of allDeals) {
            const key = deal.nama_mitra.trim().toLowerCase();
            if (!mitraMap.has(key)) {
                mitraMap.set(key, {
                    nama_mitra: deal.nama_mitra,
                    foto_mitra: deal.foto_mitra,
                    foto_url: deal.foto_mitra
                        ? getFileUrl(deal, deal.foto_mitra)
                        : "",
                    brand_name: deal.brand_name || "",
                    lokasi_buka_outlet: deal.lokasi_buka_outlet || "",
                    total_transaksi: 0,
                    deal_count: 0,
                    latest_deal: deal.created,
                    deals: [],
                });
            }
            const entry = mitraMap.get(key)!;
            entry.total_transaksi += deal.jumlah_transaksi;
            entry.deal_count += 1;
            entry.deals.push(deal);
            if (deal.created > entry.latest_deal) {
                entry.latest_deal = deal.created;
                if (deal.brand_name) entry.brand_name = deal.brand_name;
                if (deal.foto_mitra) {
                    entry.foto_mitra = deal.foto_mitra;
                    entry.foto_url = getFileUrl(deal, deal.foto_mitra);
                }
                if (deal.lokasi_buka_outlet)
                    entry.lokasi_buka_outlet = deal.lokasi_buka_outlet;
            }
        }

        return Array.from(mitraMap.values()).sort(
            (a, b) => b.total_transaksi - a.total_transaksi,
        );
    }

    function formatRupiah(num: number): string {
        return num.toLocaleString("id-ID");
    }

    function formatRupiahShort(num: number): string {
        if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}M`;
        if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(0)}jt`;
        if (num >= 1_000) return `${(num / 1_000).toFixed(0)}rb`;
        return num.toLocaleString("id-ID");
    }

    function getInitials(name: string): string {
        return name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    }

    async function fetchDeals() {
        try {
            const records = await pb
                .collection("deals")
                .getFullList<Deal>({ sort: "-created" });
            deals = records;
            leaderboard = buildLeaderboard(records);
            totalDeals = records.length;
            totalTransaksi = records.reduce(
                (sum, d) => sum + d.jumlah_transaksi,
                0,
            );
            isLoading = false;
        } catch (err) {
            console.error("Failed to fetch deals:", err);
            isLoading = false;
        }
    }

    async function subscribeToDeals() {
        try {
            unsubscribe = await pb
                .collection("deals")
                .subscribe<Deal>("*", (e) => {
                    if (e.action === "create") {
                        const previousTop =
                            leaderboard.length > 0
                                ? leaderboard[0].nama_mitra
                                : null;
                        deals = [e.record, ...deals];
                        leaderboard = buildLeaderboard(deals);
                        totalDeals = deals.length;
                        totalTransaksi = deals.reduce(
                            (sum, d) => sum + d.jumlah_transaksi,
                            0,
                        );

                        newDealHighlight = e.record.nama_mitra;
                        setTimeout(() => {
                            newDealHighlight = null;
                        }, 3000);

                        const newTop =
                            leaderboard.length > 0
                                ? leaderboard[0].nama_mitra
                                : null;
                        if (previousTop && newTop && previousTop !== newTop) {
                            confettiGrand();
                        } else {
                            confettiBurst();
                            setTimeout(() => confettiRain(), 300);
                        }
                    } else if (e.action === "update") {
                        deals = deals.map((d) =>
                            d.id === e.record.id ? e.record : d,
                        );
                        leaderboard = buildLeaderboard(deals);
                        totalDeals = deals.length;
                        totalTransaksi = deals.reduce(
                            (sum, d) => sum + d.jumlah_transaksi,
                            0,
                        );
                    } else if (e.action === "delete") {
                        deals = deals.filter((d) => d.id !== e.record.id);
                        leaderboard = buildLeaderboard(deals);
                        totalDeals = deals.length;
                        totalTransaksi = deals.reduce(
                            (sum, d) => sum + d.jumlah_transaksi,
                            0,
                        );
                    }
                });
        } catch (err) {
            console.error("Failed to subscribe:", err);
        }
    }

    onMount(() => {
        fetchDeals();
        subscribeToDeals();
    });

    onDestroy(() => {
        if (unsubscribe) pb.collection("deals").unsubscribe("*");
    });

    let top3 = $derived(leaderboard.slice(0, 3));
    let rest = $derived(leaderboard.slice(3));
</script>

<div class="leaderboard-app">
    <!-- Ambient background -->
    <div class="ambient-bg">
        <div class="ambient-orb orb-1"></div>
        <div class="ambient-orb orb-2"></div>
        <div class="ambient-orb orb-3"></div>
    </div>

    <!-- Top Nav -->
    <nav class="top-nav">
        <div class="nav-brand">
            <span class="brand-icon">🏆</span>
            <span class="brand-text">Expo Franchise</span>
        </div>
        <div class="nav-center">
            <span class="nav-link active">Leaderboard</span>
        </div>
        <div class="nav-right">
            <div class="live-indicator">
                <span class="live-dot"></span>
                LIVE
            </div>
        </div>
    </nav>

    <!-- Main Content -->
    <main class="main">
        {#if isLoading}
            <div class="center-state">
                <div class="spinner"></div>
                <p>Memuat leaderboard...</p>
            </div>
        {:else if leaderboard.length === 0}
            <div class="center-state">
                <div class="empty-icon">🏁</div>
                <h2>Belum Ada Deal</h2>
                <p>Deal pertama akan segera muncul di sini!</p>
            </div>
        {:else}
            <!-- Podium Section -->
            <section class="podium-section">
                <div class="podium-row">
                    <!-- 2nd Place -->
                    {#if top3.length >= 2}
                        <div
                            class="podium-slot second"
                            class:highlight={newDealHighlight ===
                                top3[1].nama_mitra}
                        >
                            <div class="podium-avatar-wrap">
                                <div class="podium-avatar silver-ring">
                                    {#if top3[1].foto_url}
                                        <img
                                            src={top3[1].foto_url}
                                            alt={top3[1].nama_mitra}
                                        />
                                    {:else}
                                        <span class="initials"
                                            >{getInitials(
                                                top3[1].nama_mitra,
                                            )}</span
                                        >
                                    {/if}
                                </div>
                            </div>
                            <h3 class="podium-name">{top3[1].nama_mitra}</h3>

                            <div class="podium-pedestal second-pedestal">
                                <div class="trophy-badge silver-trophy">🥈</div>
                                <p class="pedestal-subtitle">
                                    {top3[1].brand_name || "Mitra"}
                                </p>
                                <div class="pedestal-amount">
                                    <span class="heart-icon">💎</span>
                                    <span class="amount-value"
                                        >{formatRupiah(
                                            top3[1].total_transaksi,
                                        )}</span
                                    >
                                </div>
                                <p class="pedestal-label">Transaksi</p>
                            </div>
                        </div>
                    {:else}
                        <div class="podium-slot placeholder"></div>
                    {/if}

                    <!-- 1st Place -->
                    {#if top3.length >= 1}
                        <div
                            class="podium-slot first"
                            class:highlight={newDealHighlight ===
                                top3[0].nama_mitra}
                        >
                            <div class="podium-avatar-wrap first-wrap">
                                <div class="crown-float">👑</div>
                                <div
                                    class="podium-avatar gold-ring first-avatar"
                                >
                                    {#if top3[0].foto_url}
                                        <img
                                            src={top3[0].foto_url}
                                            alt={top3[0].nama_mitra}
                                        />
                                    {:else}
                                        <span class="initials"
                                            >{getInitials(
                                                top3[0].nama_mitra,
                                            )}</span
                                        >
                                    {/if}
                                </div>
                            </div>
                            <h3 class="podium-name first-name">
                                {top3[0].nama_mitra}
                            </h3>

                            <div class="podium-pedestal first-pedestal">
                                <div class="trophy-badge gold-trophy">🏆</div>
                                <p class="pedestal-subtitle">
                                    {top3[0].brand_name || "Mitra"}
                                </p>
                                <div class="pedestal-amount first-amount">
                                    <span class="heart-icon">💎</span>
                                    <span class="amount-value"
                                        >{formatRupiah(
                                            top3[0].total_transaksi,
                                        )}</span
                                    >
                                </div>
                                <p class="pedestal-label">Transaksi</p>
                            </div>
                        </div>
                    {/if}

                    <!-- 3rd Place -->
                    {#if top3.length >= 3}
                        <div
                            class="podium-slot third"
                            class:highlight={newDealHighlight ===
                                top3[2].nama_mitra}
                        >
                            <div class="podium-avatar-wrap">
                                <div class="podium-avatar bronze-ring">
                                    {#if top3[2].foto_url}
                                        <img
                                            src={top3[2].foto_url}
                                            alt={top3[2].nama_mitra}
                                        />
                                    {:else}
                                        <span class="initials"
                                            >{getInitials(
                                                top3[2].nama_mitra,
                                            )}</span
                                        >
                                    {/if}
                                </div>
                            </div>
                            <h3 class="podium-name">{top3[2].nama_mitra}</h3>

                            <div class="podium-pedestal third-pedestal">
                                <div class="trophy-badge bronze-trophy">🥉</div>
                                <p class="pedestal-subtitle">
                                    {top3[2].brand_name || "Mitra"}
                                </p>
                                <div class="pedestal-amount">
                                    <span class="heart-icon">💎</span>
                                    <span class="amount-value"
                                        >{formatRupiah(
                                            top3[2].total_transaksi,
                                        )}</span
                                    >
                                </div>
                                <p class="pedestal-label">Transaksi</p>
                            </div>
                        </div>
                    {:else}
                        <div class="podium-slot placeholder"></div>
                    {/if}
                </div>
            </section>

            <!-- Info Bar -->
            <div class="info-bar">
                <span
                    >📊 Total <strong>{totalDeals}</strong> deals terdaftar</span
                >
                <span class="info-sep">•</span>
                <span
                    >💰 Total transaksi: <strong
                        >Rp {formatRupiah(totalTransaksi)}</strong
                    ></span
                >
                <span class="info-sep">•</span>
                <span>👥 <strong>{leaderboard.length}</strong> mitra</span>
            </div>

            <!-- Ranking Table -->
            {#if rest.length > 0}
                <section class="table-section">
                    <div class="rank-table">
                        <div class="table-head">
                            <span class="th-rank">Rank</span>
                            <span class="th-name">Nama Mitra</span>
                            <span class="th-brand">Brand</span>
                            <span class="th-deals">Deals</span>
                            <span class="th-amount">Total Transaksi</span>
                        </div>
                        {#each rest as entry, i}
                            <div
                                class="table-row"
                                class:highlight={newDealHighlight ===
                                    entry.nama_mitra}
                                style="animation-delay: {i * 60}ms"
                            >
                                <span class="td-rank">
                                    <span class="rank-num">{i + 4}</span>
                                </span>
                                <span class="td-name">
                                    <div class="row-avatar">
                                        {#if entry.foto_url}
                                            <img
                                                src={entry.foto_url}
                                                alt={entry.nama_mitra}
                                            />
                                        {:else}
                                            <span class="row-initials"
                                                >{getInitials(
                                                    entry.nama_mitra,
                                                )}</span
                                            >
                                        {/if}
                                    </div>
                                    <div class="row-name-wrap">
                                        <span class="row-name-text"
                                            >{entry.nama_mitra}</span
                                        >
                                        {#if entry.lokasi_buka_outlet}
                                            <span class="row-sub"
                                                >📍 {entry.lokasi_buka_outlet}</span
                                            >
                                        {/if}
                                    </div>
                                </span>
                                <span class="td-brand"
                                    >{entry.brand_name || "-"}</span
                                >
                                <span class="td-deals">
                                    <span class="deal-pill"
                                        >{entry.deal_count}</span
                                    >
                                </span>
                                <span class="td-amount">
                                    <span class="amt-icon">💎</span>
                                    Rp {formatRupiah(entry.total_transaksi)}
                                </span>
                            </div>
                        {/each}
                    </div>
                </section>
            {/if}
        {/if}
    </main>
</div>

<style>
    /* ============================================
	   App Layout
	   ============================================ */
    .leaderboard-app {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        position: relative;
    }

    /* Ambient Background Orbs */
    .ambient-bg {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 0;
        overflow: hidden;
    }

    .ambient-orb {
        position: absolute;
        border-radius: 50%;
        filter: blur(80px);
        opacity: 0.12;
    }

    :global([data-theme="light"]) .ambient-orb {
        opacity: 0.06;
    }

    .orb-1 {
        width: 500px;
        height: 500px;
        background: #3b82f6;
        top: -150px;
        left: 30%;
    }

    .orb-2 {
        width: 400px;
        height: 400px;
        background: #8b5cf6;
        bottom: -100px;
        right: 10%;
    }

    .orb-3 {
        width: 300px;
        height: 300px;
        background: #ffd700;
        top: 40%;
        left: -100px;
    }

    /* ============================================
	   Top Nav
	   ============================================ */
    .top-nav {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 40px;
        position: relative;
        z-index: 10;
    }

    .nav-brand {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .brand-icon {
        font-size: 24px;
    }

    .brand-text {
        font-size: 20px;
        font-weight: 800;
        color: var(--text-heading);
        letter-spacing: -0.3px;
    }

    .nav-center {
        display: flex;
        gap: 4px;
        background: var(--bg-tab);
        padding: 4px;
        border-radius: var(--radius-full);
        border: 1px solid var(--border-color);
    }

    .nav-link {
        padding: 8px 24px;
        border-radius: var(--radius-full);
        font-size: 14px;
        font-weight: 600;
        color: var(--text-secondary);
        cursor: pointer;
        transition: all var(--transition-fast);
    }

    .nav-link.active {
        background: var(--bg-tab-active);
        color: var(--accent-blue);
    }

    .nav-right {
        display: flex;
        align-items: center;
        gap: 16px;
    }

    .live-indicator {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 16px;
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.2);
        border-radius: var(--radius-full);
        font-size: 12px;
        font-weight: 700;
        color: #ef4444;
        letter-spacing: 0.5px;
    }

    .live-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #ef4444;
        animation: pulse 2s infinite;
    }

    /* ============================================
	   Main
	   ============================================ */
    .main {
        flex: 1;
        padding: 0 40px 40px;
        position: relative;
        z-index: 1;
        max-width: 1200px;
        margin: 0 auto;
        width: 100%;
    }

    .center-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 60vh;
        gap: 12px;
        text-align: center;
    }

    .center-state p {
        color: var(--text-secondary);
    }

    .spinner {
        width: 42px;
        height: 42px;
        border: 3px solid var(--border-color);
        border-top-color: var(--accent-blue);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    .empty-icon {
        font-size: 72px;
        animation: fadeInUp 0.5s ease;
    }

    .center-state h2 {
        font-size: 26px;
        font-weight: 700;
        color: var(--text-heading);
    }

    /* ============================================
	   Podium Section
	   ============================================ */
    .podium-section {
        padding: 20px 0 12px;
    }

    .podium-row {
        display: flex;
        justify-content: center;
        align-items: flex-end;
        gap: 28px;
    }

    .podium-slot {
        display: flex;
        flex-direction: column;
        align-items: center;
        animation: fadeInUp 0.6s ease backwards;
        width: 260px;
    }

    .podium-slot.second {
        animation-delay: 0.1s;
    }
    .podium-slot.first {
        animation-delay: 0s;
    }
    .podium-slot.third {
        animation-delay: 0.2s;
    }
    .podium-slot.placeholder {
        width: 260px;
        visibility: hidden;
    }

    .podium-slot.highlight .podium-pedestal {
        animation: rankUp 1.5s ease;
    }

    /* Avatar */
    .podium-avatar-wrap {
        position: relative;
        margin-bottom: 12px;
    }

    .first-wrap .crown-float {
        position: absolute;
        top: -30px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 34px;
        z-index: 5;
        animation: crown-bounce 3s ease-in-out infinite;
        filter: drop-shadow(0 2px 6px rgba(255, 215, 0, 0.4));
    }

    .podium-avatar {
        width: 88px;
        height: 88px;
        border-radius: 20px;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--bg-card);
        position: relative;
    }

    .first-avatar {
        width: 108px;
        height: 108px;
        border-radius: 24px;
    }

    .gold-ring {
        border: 3px solid var(--gold);
        box-shadow: 0 0 24px rgba(255, 215, 0, 0.2);
    }
    .silver-ring {
        border: 3px solid var(--silver);
        box-shadow: 0 0 16px rgba(184, 196, 212, 0.15);
    }
    .bronze-ring {
        border: 3px solid var(--bronze);
        box-shadow: 0 0 16px rgba(205, 142, 62, 0.15);
    }

    .podium-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .initials {
        font-size: 28px;
        font-weight: 700;
        color: var(--text-muted);
    }

    .first-avatar .initials {
        font-size: 34px;
    }

    .podium-name {
        font-size: 16px;
        font-weight: 700;
        color: var(--text-heading);
        margin-bottom: 14px;
        text-align: center;
    }

    .first-name {
        font-size: 19px;
    }

    /* Pedestal Card */
    .podium-pedestal {
        width: 100%;
        background: var(--gradient-card);
        border: 1px solid var(--border-card);
        border-radius: var(--radius-xl);
        padding: 20px 16px 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        box-shadow: var(--shadow-podium);
        transition: all var(--transition-theme);
    }

    .first-pedestal {
        background: var(--gradient-card-first);
        border-color: rgba(255, 215, 0, 0.12);
        box-shadow: var(--shadow-podium), var(--shadow-gold);
        padding: 24px 16px 24px;
        min-height: 180px;
    }

    .second-pedestal {
        min-height: 155px;
    }
    .third-pedestal {
        min-height: 140px;
    }

    .trophy-badge {
        font-size: 28px;
        margin-bottom: 2px;
    }

    .gold-trophy {
        filter: drop-shadow(0 2px 8px rgba(255, 215, 0, 0.3));
    }

    .pedestal-subtitle {
        font-size: 12px;
        color: var(--text-muted);
        font-weight: 500;
    }

    .pedestal-amount {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-top: 4px;
    }

    .heart-icon {
        font-size: 16px;
    }

    .amount-value {
        font-size: 20px;
        font-weight: 800;
        color: var(--text-heading);
    }

    .first-amount .amount-value {
        font-size: 26px;
        background: linear-gradient(135deg, var(--gold), #ffa500);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .pedestal-label {
        font-size: 12px;
        color: var(--text-muted);
        font-weight: 500;
    }

    /* ============================================
	   Info Bar
	   ============================================ */
    .info-bar {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        padding: 12px 24px;
        background: var(--bg-info-bar);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-full);
        font-size: 14px;
        color: var(--text-secondary);
        margin: 24px auto;
        max-width: 700px;
        backdrop-filter: blur(12px);
        transition: all var(--transition-theme);
    }

    .info-bar strong {
        color: var(--text-heading);
        font-weight: 700;
    }
    .info-sep {
        opacity: 0.3;
    }

    /* ============================================
	   Ranking Table
	   ============================================ */
    .table-section {
        margin-top: 8px;
        animation: fadeInUp 0.5s ease 0.3s backwards;
    }

    .rank-table {
        width: 100%;
    }

    .table-head {
        display: grid;
        grid-template-columns: 70px 1fr 160px 90px 180px;
        padding: 12px 20px;
        font-size: 13px;
        font-weight: 600;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-bottom: 1px solid var(--border-color);
    }

    .table-row {
        display: grid;
        grid-template-columns: 70px 1fr 160px 90px 180px;
        align-items: center;
        padding: 14px 20px;
        background: var(--gradient-card);
        border: 1px solid var(--border-card);
        border-radius: var(--radius-lg);
        margin-bottom: 8px;
        transition: all var(--transition-fast);
        animation: fadeInUp 0.4s ease backwards;
        box-shadow: var(--shadow-card);
    }

    .table-row:hover {
        border-color: var(--accent-blue);
        transform: translateY(-1px);
        box-shadow: var(--shadow-md);
    }

    .table-row.highlight {
        animation: rankUp 1.5s ease;
        border-color: var(--gold);
    }

    /* Table Cells */
    .td-rank {
        text-align: center;
    }

    .rank-num {
        display: inline-flex;
        width: 32px;
        height: 32px;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: var(--bg-card-elevated);
        font-weight: 700;
        font-size: 14px;
        color: var(--text-secondary);
    }

    .td-name {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .row-avatar {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--bg-card-elevated);
        flex-shrink: 0;
    }

    .row-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .row-initials {
        font-size: 14px;
        font-weight: 700;
        color: var(--text-muted);
    }

    .row-name-wrap {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .row-name-text {
        font-weight: 600;
        font-size: 14px;
        color: var(--text-heading);
    }

    .row-sub {
        font-size: 12px;
        color: var(--text-muted);
    }

    .td-brand {
        font-size: 14px;
        font-weight: 500;
        color: var(--accent-cyan);
    }

    .td-deals {
        text-align: center;
    }

    .deal-pill {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 4px 14px;
        background: var(--bg-badge);
        color: var(--accent-blue);
        border-radius: var(--radius-full);
        font-weight: 700;
        font-size: 13px;
    }

    .td-amount {
        display: flex;
        align-items: center;
        gap: 6px;
        font-weight: 700;
        font-size: 14px;
        color: var(--text-heading);
        justify-content: flex-end;
    }

    .amt-icon {
        font-size: 14px;
    }

    /* ============================================
	   Responsive
	   ============================================ */
    @media (max-width: 1024px) {
        .top-nav,
        .main {
            padding-left: 20px;
            padding-right: 20px;
        }

        .podium-row {
            gap: 16px;
        }
        .podium-slot {
            width: 200px;
        }
        .podium-avatar {
            width: 72px;
            height: 72px;
            border-radius: 16px;
        }
        .first-avatar {
            width: 88px;
            height: 88px;
            border-radius: 20px;
        }

        .table-head,
        .table-row {
            grid-template-columns: 60px 1fr 120px 70px 150px;
        }
    }

    @media (max-width: 768px) {
        .top-nav {
            flex-direction: column;
            gap: 12px;
            padding: 12px 16px;
        }

        .main {
            padding: 0 16px 24px;
        }

        .podium-row {
            flex-direction: column;
            align-items: center;
            gap: 20px;
        }

        .podium-slot {
            width: 100%;
            max-width: 320px;
        }
        .podium-slot.first {
            order: -1;
        }

        .table-head {
            display: none;
        }

        .table-row {
            grid-template-columns: 50px 1fr auto;
            gap: 8px;
        }

        .td-brand,
        .td-deals {
            display: none;
        }

        .info-bar {
            flex-direction: column;
            gap: 6px;
            padding: 14px 20px;
            font-size: 13px;
        }

        .info-sep {
            display: none;
        }
    }
</style>
