<script lang="ts">
    import { onMount } from "svelte";
    import { pb } from "$lib/pocketbase";
    import { page } from "$app/stores";
    import type { ExpoOutlet } from "$lib/types";

    let outlet = $state<ExpoOutlet | null>(null);
    let isLoading = $state(true);
    let notFound = $state(false);

    function getFormUrl(token: string): string {
        const base =
            typeof window !== "undefined" ? window.location.origin : "";
        return `${base}/form?token=${token}`;
    }

    function getQrUrl(token: string): string {
        const formUrl = encodeURIComponent(getFormUrl(token));
        return `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${formUrl}&ecc=M&margin=10`;
    }

    onMount(async () => {
        const id = $page.params.id ?? "";
        if (!id) {
            notFound = true;
            isLoading = false;
            return;
        }
        try {
            outlet = await pb.collection("expo_outlets").getOne<ExpoOutlet>(id);
        } catch {
            notFound = true;
        } finally {
            isLoading = false;
        }
    });

    function printPage() {
        window.print();
    }
</script>

<svelte:head>
    <title>{outlet ? `QR — ${outlet.name}` : "QR Outlet"}</title>
</svelte:head>

<div class="qr-page">
    {#if isLoading}
        <div class="state-center">
            <div class="spinner"></div>
            <p>Memuat data outlet...</p>
        </div>
    {:else if notFound}
        <div class="state-center">
            <div class="error-icon">🚫</div>
            <h2>Outlet tidak ditemukan</h2>
            <a href="/dashboard/outlets" class="back-btn">← Kembali</a>
        </div>
    {:else if outlet}
        <!-- Print controls — hidden when printing -->
        <div class="controls no-print">
            <a href="/dashboard/outlets" class="ctrl-btn">← Kembali</a>
            <button class="ctrl-btn print-btn" onclick={printPage}
                >🖨️ Print QR</button
            >
        </div>

        <!-- Printable card -->
        <div class="qr-card">
            <div class="card-header">
                <div class="expo-logo">🏆</div>
                <div class="expo-info">
                    <h1 class="expo-title">Expo Franchise Manado 2026</h1>
                    <p class="expo-sub">Scan untuk input deal franchise</p>
                </div>
            </div>

            <div class="qr-wrap">
                <img
                    src={getQrUrl(outlet.access_token)}
                    alt="QR Code for {outlet.name}"
                    class="qr-image"
                />
            </div>

            <div class="outlet-info">
                <h2 class="outlet-name">{outlet.name}</h2>
                {#if outlet.brand_name}
                    <p class="outlet-brand">{outlet.brand_name}</p>
                {/if}
            </div>

            <div class="divider"></div>

            <p class="url-label">Atau buka link berikut:</p>
            <p class="form-url">{getFormUrl(outlet.access_token)}</p>

            <p class="token-label">
                Token: <strong>{outlet.access_token}</strong>
            </p>
        </div>
    {/if}
</div>

<style>
    :global(body) {
        background: white;
    }

    .qr-page {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        padding: 24px 20px;
        background: #f5f7fa;
        font-family: "Outfit", sans-serif;
    }

    /* Controls (hidden on print) */
    .controls {
        display: flex;
        gap: 12px;
        margin-bottom: 24px;
        align-self: flex-start;
        width: 100%;
        max-width: 500px;
    }

    .ctrl-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 10px 18px;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 600;
        text-decoration: none;
        border: none;
        cursor: pointer;
        font-family: inherit;
        background: #e2e8f0;
        color: #475569;
        transition: all 0.15s ease;
    }

    .ctrl-btn:hover {
        background: #cbd5e1;
    }

    .print-btn {
        background: #1e293b;
        color: white;
        margin-left: auto;
    }

    .print-btn:hover {
        background: #0f172a;
    }

    /* QR Card */
    .qr-card {
        width: 100%;
        max-width: 500px;
        background: white;
        border-radius: 24px;
        padding: 36px 32px;
        box-shadow: 0 4px 40px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        text-align: center;
    }

    .card-header {
        display: flex;
        align-items: center;
        gap: 14px;
        width: 100%;
    }

    .expo-logo {
        font-size: 36px;
        flex-shrink: 0;
    }

    .expo-info {
        text-align: left;
    }

    .expo-title {
        font-size: 16px;
        font-weight: 800;
        color: #0f172a;
        line-height: 1.2;
    }

    .expo-sub {
        font-size: 12px;
        color: #94a3b8;
        margin-top: 2px;
    }

    .qr-wrap {
        padding: 12px;
        background: white;
        border-radius: 16px;
        border: 2px solid #e2e8f0;
        margin: 4px 0;
    }

    .qr-image {
        width: 280px;
        height: 280px;
        display: block;
    }

    .outlet-name {
        font-size: 26px;
        font-weight: 800;
        color: #0f172a;
    }

    .outlet-brand {
        font-size: 14px;
        color: #3b82f6;
        font-weight: 600;
        margin-top: -8px;
    }

    .divider {
        width: 100%;
        height: 1px;
        background: #e2e8f0;
    }

    .url-label {
        font-size: 12px;
        color: #94a3b8;
        margin-bottom: -8px;
    }

    .form-url {
        font-size: 12px;
        color: #475569;
        word-break: break-all;
        background: #f1f5f9;
        padding: 8px 14px;
        border-radius: 8px;
        width: 100%;
    }

    .token-label {
        font-size: 13px;
        color: #64748b;
    }

    .token-label strong {
        color: #0f172a;
        font-family: monospace;
        font-size: 15px;
    }

    /* States */
    .state-center {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 16px;
        min-height: 60vh;
        text-align: center;
    }

    .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid #e2e8f0;
        border-top-color: #3b82f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    .error-icon {
        font-size: 64px;
    }

    .back-btn {
        padding: 10px 20px;
        background: #1e293b;
        color: white;
        border-radius: 10px;
        text-decoration: none;
        font-weight: 600;
    }

    /* Print styles */
    @media print {
        .no-print {
            display: none !important;
        }

        :global(body) {
            background: white !important;
        }

        .qr-page {
            background: white;
            padding: 0;
            justify-content: center;
        }

        .qr-card {
            box-shadow: none;
            border: 1px solid #e2e8f0;
            max-width: 100%;
            border-radius: 16px;
        }

        .qr-image {
            width: 320px;
            height: 320px;
        }
    }
</style>
