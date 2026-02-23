<script lang="ts">
    import { page } from "$app/stores";
    import { PUBLIC_DASHBOARD_PIN } from "$env/static/public";
    import { onMount } from "svelte";

    let { children } = $props();

    const CORRECT_PIN = PUBLIC_DASHBOARD_PIN || "admin2026";
    const SESSION_KEY = "lb_dashboard_auth";

    let isAuthed = $state(false);
    let pinInput = $state("");
    let pinError = $state(false);
    let isReady = $state(false); // prevent flash

    const navItems = [
        {
            href: "/dashboard",
            label: "Overview",
            iconPath:
                "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z",
        },
        {
            href: "/dashboard/outlets",
            label: "Kelola Outlet",
            iconPath:
                "M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z",
        },
        {
            href: "/dashboard/deals",
            label: "Deals",
            iconPath:
                "M16.48 10.41c-.39.39-1.04.39-1.43 0l-4.47-4.46-7.05 7.04-.66-.63 3.7-3.7L.7 2.84 2.12 1.4l2.83 2.83 3.7-3.7 5.83 5.84 3.7-3.71 1.42 1.42-3.12 3.12v0z",
        },
    ];

    onMount(() => {
        const saved = sessionStorage.getItem(SESSION_KEY);
        if (saved === "1") {
            isAuthed = true;
        }
        isReady = true;
    });

    function handlePinSubmit() {
        if (pinInput === CORRECT_PIN) {
            isAuthed = true;
            pinError = false;
            sessionStorage.setItem(SESSION_KEY, "1");
        } else {
            pinError = true;
            pinInput = "";
            setTimeout(() => (pinError = false), 1500);
        }
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Enter") handlePinSubmit();
    }

    function logout() {
        sessionStorage.removeItem(SESSION_KEY);
        isAuthed = false;
        pinInput = "";
    }
</script>

<svelte:head>
    <title>Dashboard — Expo Franchise Manado</title>
</svelte:head>

{#if !isReady}
    <!-- prevent flash of PIN screen on hydration -->
    <div class="auth-loading">
        <div class="auth-spinner"></div>
    </div>
{:else if !isAuthed}
    <!-- PIN Gate -->
    <div class="pin-gate">
        <div class="pin-card">
            <div class="pin-icon">
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M9 12l2 2 4-4" />
                </svg>
            </div>
            <h1 class="pin-title">Admin Dashboard</h1>
            <p class="pin-sub">Masukkan PIN untuk melanjutkan</p>

            <div class="pin-input-wrap" class:shake={pinError}>
                <input
                    type="password"
                    inputmode="numeric"
                    placeholder="• • • • • •"
                    bind:value={pinInput}
                    onkeydown={handleKeydown}
                    maxlength={20}
                    autofocus
                    class="pin-input"
                />
            </div>

            {#if pinError}
                <p class="pin-error">
                    <svg
                        class="pin-error-icon"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        ><circle cx="12" cy="12" r="10" /><line
                            x1="15"
                            y1="9"
                            x2="9"
                            y2="15"
                        /><line x1="9" y1="9" x2="15" y2="15" /></svg
                    >
                    PIN salah. Coba lagi.
                </p>
            {/if}

            <button class="pin-btn" onclick={handlePinSubmit}>
                Masuk
                <svg
                    class="btn-arrow"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    ><line x1="5" y1="12" x2="19" y2="12" /><polyline
                        points="12 5 19 12 12 19"
                    /></svg
                >
            </button>

            <a href="/" class="back-link">
                <svg
                    class="back-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    ><line x1="19" y1="12" x2="5" y2="12" /><polyline
                        points="12 19 5 12 12 5"
                    /></svg
                >
                Kembali ke Leaderboard
            </a>
        </div>
    </div>
{:else}
    <!-- Dashboard Layout -->
    <div class="dashboard-layout">
        <!-- Sidebar -->
        <aside class="sidebar">
            <div class="sidebar-header">
                <div class="sidebar-logo-wrap">
                    <svg
                        class="sidebar-logo-icon"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 7 7 7 7" />
                        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 17 7 17 7" />
                        <path d="M4 22h16" />
                        <path
                            d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"
                        />
                        <path
                            d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"
                        />
                        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                    </svg>
                </div>
                <div>
                    <h2 class="sidebar-title">Expo Franchise</h2>
                    <p class="sidebar-sub">Admin Dashboard</p>
                </div>
            </div>

            <nav class="sidebar-nav">
                {#each navItems as item}
                    <a
                        href={item.href}
                        class="nav-item"
                        class:active={$page.url.pathname === item.href}
                    >
                        <span class="nav-icon">
                            <svg viewBox="0 0 24 24" fill="currentColor"
                                ><path d={item.iconPath} /></svg
                            >
                        </span>
                        <span class="nav-label">{item.label}</span>
                    </a>
                {/each}
            </nav>

            <div class="sidebar-footer">
                <a href="/" class="nav-item footer-link">
                    <span class="nav-icon">
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            ><path
                                d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
                            /><polyline points="15 3 21 3 21 9" /><line
                                x1="10"
                                y1="14"
                                x2="21"
                                y2="3"
                            /></svg
                        >
                    </span>
                    <span class="nav-label">Lihat Leaderboard</span>
                </a>
                <button class="nav-item logout-btn" onclick={logout}>
                    <span class="nav-icon">
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            ><path
                                d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
                            /><polyline points="16 17 21 12 16 7" /><line
                                x1="21"
                                y1="12"
                                x2="9"
                                y2="12"
                            /></svg
                        >
                    </span>
                    <span class="nav-label">Keluar</span>
                </button>
            </div>
        </aside>

        <!-- Main Content -->
        <div class="dash-main">
            {@render children()}
        </div>
    </div>
{/if}

<style>
    /* ============================================
       Auth Loading
       ============================================ */
    .auth-loading {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .auth-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid var(--border-color);
        border-top-color: var(--accent-blue);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    /* ============================================
       PIN Gate
       ============================================ */
    .pin-gate {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        background: var(--gradient-body);
    }

    .pin-card {
        width: 100%;
        max-width: 380px;
        background: var(--gradient-card);
        border: 1px solid var(--border-card);
        border-radius: var(--radius-xl);
        padding: 40px 32px;
        box-shadow: var(--shadow-lg);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        animation: fadeInUp 0.4s ease;
    }

    .pin-icon {
        width: 64px;
        height: 64px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(59, 130, 246, 0.1);
        border-radius: var(--radius-lg);
        color: var(--accent-blue);
        margin-bottom: 4px;
    }

    .pin-icon svg {
        width: 32px;
        height: 32px;
    }

    .pin-title {
        font-size: 24px;
        font-weight: 800;
        color: var(--text-heading);
    }

    .pin-sub {
        font-size: 14px;
        color: var(--text-muted);
        margin-bottom: 8px;
    }

    .pin-input-wrap {
        width: 100%;
    }

    .pin-input-wrap.shake {
        animation: shake 0.4s ease;
    }

    .pin-input {
        width: 100%;
        padding: 14px 18px;
        background: var(--bg-card-elevated);
        border: 1.5px solid var(--border-input);
        border-radius: var(--radius-md);
        color: var(--text-primary);
        font-family: var(--font-family);
        font-size: 18px;
        letter-spacing: 4px;
        text-align: center;
        outline: none;
        transition: border var(--transition-fast);
    }

    .pin-input:focus {
        border-color: var(--accent-blue);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }

    .pin-error {
        font-size: 13px;
        color: var(--accent-red);
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .pin-error-icon {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
    }

    .pin-btn {
        width: 100%;
        padding: 14px;
        margin-top: 4px;
        background: linear-gradient(135deg, var(--accent-blue), #06b6d4);
        color: white;
        border: none;
        border-radius: var(--radius-md);
        font-family: var(--font-family);
        font-size: 16px;
        font-weight: 700;
        cursor: pointer;
        transition: all var(--transition-fast);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
    }

    .btn-arrow {
        width: 18px;
        height: 18px;
    }

    .pin-btn:hover {
        opacity: 0.92;
        transform: translateY(-1px);
        box-shadow: var(--shadow-blue);
    }

    .back-link {
        font-size: 13px;
        color: var(--text-muted);
        text-decoration: none;
        margin-top: 4px;
        transition: color var(--transition-fast);
        display: inline-flex;
        align-items: center;
        gap: 6px;
    }

    .back-icon {
        width: 14px;
        height: 14px;
    }

    .back-link:hover {
        color: var(--accent-blue);
    }

    @keyframes shake {
        0%,
        100% {
            transform: translateX(0);
        }
        20% {
            transform: translateX(-8px);
        }
        40% {
            transform: translateX(8px);
        }
        60% {
            transform: translateX(-6px);
        }
        80% {
            transform: translateX(6px);
        }
    }

    /* ============================================
       Dashboard Layout
       ============================================ */
    .dashboard-layout {
        display: flex;
        min-height: 100vh;
    }

    /* Sidebar */
    .sidebar {
        width: 280px;
        background: var(--bg-card);
        border-right: 1px solid var(--border-color);
        display: flex;
        flex-direction: column;
        padding: 24px 16px;
        flex-shrink: 0;
        transition: background var(--transition-theme);
    }

    .sidebar-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 0 8px 24px;
        border-bottom: 1px solid var(--border-color);
        margin-bottom: 20px;
    }

    .sidebar-logo-wrap {
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, var(--accent-blue), #06b6d4);
        border-radius: var(--radius-md);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .sidebar-logo-icon {
        width: 22px;
        height: 22px;
        color: white;
    }

    .sidebar-title {
        font-size: 16px;
        font-weight: 700;
        color: var(--text-heading);
    }

    .sidebar-sub {
        font-size: 12px;
        color: var(--text-muted);
    }

    .sidebar-nav {
        display: flex;
        flex-direction: column;
        gap: 4px;
        flex: 1;
    }

    .nav-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        border-radius: var(--radius-md);
        font-size: 14px;
        font-weight: 500;
        color: var(--text-secondary);
        text-decoration: none;
        transition: all var(--transition-fast);
        background: none;
        border: none;
        font-family: var(--font-family);
        cursor: pointer;
        width: 100%;
        text-align: left;
        position: relative;
    }

    .nav-item:hover {
        background: var(--bg-card-elevated);
        color: var(--text-primary);
    }

    .nav-item.active {
        background: var(--bg-tab-active);
        color: var(--accent-blue);
        font-weight: 600;
    }

    .nav-item.active::before {
        content: "";
        position: absolute;
        left: 0;
        top: 6px;
        bottom: 6px;
        width: 3px;
        border-radius: 0 3px 3px 0;
        background: var(--accent-blue);
    }

    .nav-icon {
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .nav-icon svg {
        width: 18px;
        height: 18px;
    }

    .nav-label {
        white-space: nowrap;
    }

    .sidebar-footer {
        border-top: 1px solid var(--border-color);
        padding-top: 16px;
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .footer-link {
        color: var(--text-muted) !important;
    }

    .logout-btn {
        color: var(--accent-red) !important;
    }

    .logout-btn:hover {
        background: rgba(239, 68, 68, 0.08) !important;
        color: var(--accent-red) !important;
    }

    /* Main */
    .dash-main {
        flex: 1;
        padding: 32px;
        overflow-y: auto;
        max-height: 100vh;
    }

    @media (max-width: 768px) {
        .dashboard-layout {
            flex-direction: column;
        }

        .sidebar {
            width: 100%;
            padding: 16px;
            flex-direction: row;
            align-items: center;
            gap: 16px;
            overflow-x: auto;
        }

        .sidebar-header {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
        }
        .sidebar-nav {
            flex-direction: row;
            gap: 4px;
        }
        .sidebar-footer {
            border-top: none;
            padding-top: 0;
            flex-direction: row;
        }
        .nav-label {
            display: none;
        }

        .nav-item.active::before {
            display: none;
        }

        .dash-main {
            padding: 16px;
            max-height: none;
        }
    }
</style>
