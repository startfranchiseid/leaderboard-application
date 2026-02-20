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
        { href: "/dashboard", label: "Overview", icon: "📊" },
        { href: "/dashboard/outlets", label: "Kelola Outlet", icon: "🏪" },
        { href: "/dashboard/deals", label: "Deals", icon: "🤝" },
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
            <div class="pin-icon">🔐</div>
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
                <p class="pin-error">❌ PIN salah. Coba lagi.</p>
            {/if}

            <button class="pin-btn" onclick={handlePinSubmit}>
                Masuk →
            </button>

            <a href="/" class="back-link">← Kembali ke Leaderboard</a>
        </div>
    </div>
{:else}
    <!-- Dashboard Layout -->
    <div class="dashboard-layout">
        <!-- Sidebar -->
        <aside class="sidebar">
            <div class="sidebar-header">
                <span class="sidebar-logo">🏆</span>
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
                        <span class="nav-icon">{item.icon}</span>
                        <span class="nav-label">{item.label}</span>
                    </a>
                {/each}
            </nav>

            <div class="sidebar-footer">
                <a href="/" class="nav-item footer-link">
                    <span class="nav-icon">📺</span>
                    <span class="nav-label">Lihat Leaderboard</span>
                </a>
                <button class="nav-item logout-btn" onclick={logout}>
                    <span class="nav-icon">🔓</span>
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
        font-size: 48px;
        margin-bottom: 4px;
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
    }

    .back-link:hover {
        color: var(--accent-blue);
    }

    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        20%       { transform: translateX(-8px); }
        40%       { transform: translateX(8px); }
        60%       { transform: translateX(-6px); }
        80%       { transform: translateX(6px); }
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
        width: 260px;
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

    .sidebar-logo {
        font-size: 28px;
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

    .nav-icon {
        font-size: 18px;
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

        .dash-main {
            padding: 16px;
            max-height: none;
        }
    }
</style>
