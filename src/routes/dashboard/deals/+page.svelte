<script lang="ts">
    import { onMount } from "svelte";
    import { pb, getFileUrl } from "$lib/pocketbase";
    import type { Deal } from "$lib/types";

    let deals = $state<Deal[]>([]);
    let filtered = $state<Deal[]>([]);
    let isLoading = $state(true);
    let searchQuery = $state("");
    let sortBy = $state<"newest" | "oldest" | "highest" | "lowest">("newest");

    function formatRupiah(num: number): string {
        return num.toLocaleString("id-ID");
    }

    function formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function getInitials(name: string): string {
        return name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    }

    function applyFilters() {
        let result = [...deals];

        // Search
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (d) =>
                    d.nama_mitra.toLowerCase().includes(q) ||
                    d.brand_name?.toLowerCase().includes(q) ||
                    d.outlet_name?.toLowerCase().includes(q) ||
                    d.lokasi_buka_outlet?.toLowerCase().includes(q),
            );
        }

        // Sort
        switch (sortBy) {
            case "newest":
                result.sort((a, b) => b.created.localeCompare(a.created));
                break;
            case "oldest":
                result.sort((a, b) => a.created.localeCompare(b.created));
                break;
            case "highest":
                result.sort((a, b) => b.jumlah_transaksi - a.jumlah_transaksi);
                break;
            case "lowest":
                result.sort((a, b) => a.jumlah_transaksi - b.jumlah_transaksi);
                break;
        }

        filtered = result;
    }

    $effect(() => {
        searchQuery;
        sortBy;
        applyFilters();
    });

    async function deleteDeal(deal: Deal) {
        if (!confirm(`Hapus deal dari "${deal.nama_mitra}"?`)) return;
        try {
            await pb.collection("deals").delete(deal.id);
            deals = deals.filter((d) => d.id !== deal.id);
            applyFilters();
        } catch (err) {
            console.error("Delete failed:", err);
        }
    }

    function exportCSV() {
        const headers = [
            "No",
            "Nama Mitra",
            "Brand",
            "Outlet",
            "Lokasi",
            "Jumlah Transaksi",
            "Catatan",
            "Waktu",
        ];
        const rows = filtered.map((d, i) => [
            i + 1,
            d.nama_mitra,
            d.brand_name || "",
            d.outlet_name || "",
            d.lokasi_buka_outlet || "",
            d.jumlah_transaksi,
            d.catatan || "",
            new Date(d.created).toLocaleString("id-ID"),
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map((r) =>
                r
                    .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
                    .join(","),
            ),
        ].join("\n");

        const blob = new Blob(["\uFEFF" + csvContent], {
            type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `deals-expo-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    onMount(async () => {
        try {
            deals = await pb
                .collection("deals")
                .getFullList<Deal>({ sort: "-created" });
            applyFilters();
        } catch (err) {
            console.error("Failed to fetch deals:", err);
        } finally {
            isLoading = false;
        }
    });
</script>

<div class="deals-page">
    <div class="page-header">
        <div>
            <h1 class="page-title">🤝 Deals</h1>
            <p class="page-sub">
                Semua deal yang tercatat di leaderboard ({filtered.length} dari {deals.length})
            </p>
        </div>
        {#if !isLoading && deals.length > 0}
            <button class="btn btn-export" onclick={exportCSV}>
                📥 Export CSV
            </button>
        {/if}
    </div>

    <!-- Filters -->
    <div class="filters">
        <div class="search-wrap">
            <span class="search-icon">🔍</span>
            <input
                type="text"
                placeholder="Cari mitra, brand, outlet..."
                bind:value={searchQuery}
            />
        </div>
        <select bind:value={sortBy}>
            <option value="newest">Terbaru</option>
            <option value="oldest">Terlama</option>
            <option value="highest">Transaksi Terbesar</option>
            <option value="lowest">Transaksi Terkecil</option>
        </select>
    </div>

    {#if isLoading}
        <div class="loading-box">Memuat deals...</div>
    {:else if filtered.length === 0}
        <div class="empty-box">
            {#if searchQuery}
                <p>Tidak ada deal yang cocok dengan "{searchQuery}"</p>
            {:else}
                <p>🤝 Belum ada deal tercatat.</p>
            {/if}
        </div>
    {:else}
        <div class="deals-table">
            <div class="table-head">
                <span class="th" style="flex:0 0 40px">#</span>
                <span class="th" style="flex:2">Mitra</span>
                <span class="th" style="flex:1">Brand</span>
                <span class="th" style="flex:1">Outlet</span>
                <span class="th" style="flex:1">Transaksi</span>
                <span class="th" style="flex:1">Waktu</span>
                <span class="th" style="flex:0 0 50px"></span>
            </div>

            {#each filtered as deal, i}
                <div class="table-row">
                    <span
                        class="td"
                        style="flex:0 0 40px;color:var(--text-muted)"
                        >{i + 1}</span
                    >
                    <span class="td" style="flex:2">
                        <div class="mitra-cell">
                            <div class="mitra-avatar">
                                {#if deal.foto_mitra}
                                    <img
                                        src={getFileUrl(deal, deal.foto_mitra)}
                                        alt={deal.nama_mitra}
                                    />
                                {:else}
                                    <span class="mitra-initials"
                                        >{getInitials(deal.nama_mitra)}</span
                                    >
                                {/if}
                            </div>
                            <div class="mitra-info">
                                <span class="mitra-name">{deal.nama_mitra}</span
                                >
                                {#if deal.lokasi_buka_outlet}
                                    <span class="mitra-loc"
                                        >📍 {deal.lokasi_buka_outlet}</span
                                    >
                                {/if}
                            </div>
                        </div>
                    </span>
                    <span class="td" style="flex:1;color:var(--accent-cyan)"
                        >{deal.brand_name || "-"}</span
                    >
                    <span class="td" style="flex:1;color:var(--text-secondary)"
                        >{deal.outlet_name || "-"}</span
                    >
                    <span class="td money" style="flex:1"
                        >Rp {formatRupiah(deal.jumlah_transaksi)}</span
                    >
                    <span
                        class="td"
                        style="flex:1;color:var(--text-muted);font-size:12px"
                        >{formatDate(deal.created)}</span
                    >
                    <span class="td" style="flex:0 0 50px">
                        <button
                            class="del-btn"
                            onclick={() => deleteDeal(deal)}
                            title="Hapus">🗑️</button
                        >
                    </span>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .deals-page {
        max-width: 1100px;
    }

    .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
        margin-bottom: 20px;
    }

    .btn-export {
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
        white-space: nowrap;
        flex-shrink: 0;
        background: rgba(16, 185, 129, 0.12);
        color: var(--accent-green);
        transition: all var(--transition-fast);
    }

    .btn-export:hover {
        background: rgba(16, 185, 129, 0.22);
        transform: translateY(-1px);
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

    /* Filters */
    .filters {
        display: flex;
        gap: 12px;
        margin-bottom: 20px;
    }

    .search-wrap {
        flex: 1;
        position: relative;
    }

    .search-icon {
        position: absolute;
        left: 14px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 14px;
    }

    .search-wrap input {
        width: 100%;
        padding: 10px 14px 10px 38px;
        background: var(--bg-input);
        border: 1px solid var(--border-input);
        border-radius: var(--radius-md);
        color: var(--text-primary);
        font-family: var(--font-family);
        font-size: 14px;
        outline: none;
        transition: border var(--transition-fast);
    }

    .search-wrap input:focus {
        border-color: var(--accent-blue);
    }

    select {
        padding: 10px 14px;
        background: var(--bg-input);
        border: 1px solid var(--border-input);
        border-radius: var(--radius-md);
        color: var(--text-primary);
        font-family: var(--font-family);
        font-size: 14px;
        outline: none;
        cursor: pointer;
    }

    /* Table */
    .deals-table {
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        overflow: hidden;
    }

    .table-head {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        background: var(--bg-card-elevated);
        border-bottom: 1px solid var(--border-color);
    }

    .th {
        font-size: 12px;
        font-weight: 600;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.4px;
    }

    .table-row {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        border-bottom: 1px solid var(--border-color);
        transition: background var(--transition-fast);
    }

    .table-row:last-child {
        border-bottom: none;
    }
    .table-row:hover {
        background: var(--bg-card);
    }

    .td {
        font-size: 14px;
        padding: 0 4px;
    }

    .money {
        font-weight: 700;
        color: var(--accent-green);
    }

    /* Mitra Cell */
    .mitra-cell {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .mitra-avatar {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--bg-card-elevated);
        flex-shrink: 0;
    }

    .mitra-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    .mitra-initials {
        font-size: 12px;
        font-weight: 700;
        color: var(--text-muted);
    }
    .mitra-info {
        display: flex;
        flex-direction: column;
        gap: 1px;
    }
    .mitra-name {
        font-weight: 600;
        font-size: 14px;
        color: var(--text-heading);
    }
    .mitra-loc {
        font-size: 11px;
        color: var(--text-muted);
    }

    .del-btn {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 14px;
        padding: 4px;
        border-radius: var(--radius-sm);
        transition: background var(--transition-fast);
        opacity: 0.5;
    }

    .del-btn:hover {
        opacity: 1;
        background: rgba(239, 68, 68, 0.1);
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

    @media (max-width: 768px) {
        .filters {
            flex-direction: column;
        }

        .table-head {
            display: none;
        }

        .table-row {
            flex-wrap: wrap;
            gap: 8px;
        }

        .td {
            flex: 1 1 auto !important;
            min-width: 100px;
        }
    }
</style>
