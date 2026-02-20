<script lang="ts">
	import "../app.css";
	import { onMount } from "svelte";

	let { children } = $props();
	let theme = $state<"dark" | "light">("dark");

	function toggleTheme() {
		theme = theme === "dark" ? "light" : "dark";
		document.documentElement.setAttribute("data-theme", theme);
		localStorage.setItem("leaderboard-theme", theme);
	}

	onMount(() => {
		const saved = localStorage.getItem("leaderboard-theme") as
			| "dark"
			| "light"
			| null;
		if (saved) {
			theme = saved;
			document.documentElement.setAttribute("data-theme", saved);
		}
	});
</script>

<svelte:head>
	<title>Leaderboard — Expo Franchise Manado 2026</title>
</svelte:head>

<!-- Theme Toggle (global, fixed) -->
<button
	class="theme-toggle"
	onclick={toggleTheme}
	aria-label="Toggle dark/light mode"
>
	{#if theme === "dark"}
		<svg
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<circle cx="12" cy="12" r="5" />
			<line x1="12" y1="1" x2="12" y2="3" />
			<line x1="12" y1="21" x2="12" y2="23" />
			<line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
			<line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
			<line x1="1" y1="12" x2="3" y2="12" />
			<line x1="21" y1="12" x2="23" y2="12" />
			<line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
			<line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
		</svg>
	{:else}
		<svg
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
		</svg>
	{/if}
</button>

{@render children()}

<style>
	.theme-toggle {
		position: fixed;
		top: 20px;
		right: 24px;
		z-index: 1000;
		width: 42px;
		height: 42px;
		border-radius: 50%;
		border: 1px solid var(--border-card);
		background: var(--bg-card);
		color: var(--text-secondary);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 250ms ease;
		box-shadow: var(--shadow-sm);
	}

	.theme-toggle:hover {
		background: var(--bg-card-elevated);
		color: var(--gold);
		transform: scale(1.08);
	}
</style>
