<script lang="ts">
	import MdiIcon from "./MdiIcon.svelte";
	import {
		activeTab,
		activeViewId,
		editMode,
		currentTabViews,
	} from "$lib/stores";

	type Tab = "favourites" | "central" | "rooms" | "categories";

	const tabs: { id: Tab; label: string; icon: string }[] = [
		{ id: "favourites", label: "Favoriten", icon: "mdi:star-outline" },
		{ id: "central", label: "Zentral", icon: "mdi:home-outline" },
		{ id: "rooms", label: "Räume", icon: "mdi:door-open" },
		{
			id: "categories",
			label: "Kategorien",
			icon: "mdi:view-grid-outline",
		},
	];

	function selectTab(id: Tab) {
		activeTab.set(id);
	}

	// When tab changes, auto-select first view in that tab
	$effect(() => {
		const views = $currentTabViews;
		if (views.length > 0) {
			activeViewId.set(views[0].id);
		}
	});
</script>

<nav class="bottombar">
	{#each tabs as tab}
		<button
			class="tab"
			class:active={$activeTab === tab.id}
			onclick={() => selectTab(tab.id)}
			aria-label={tab.label}
		>
			<div class="tab-icon">
				<MdiIcon
					name={$activeTab === tab.id
						? tab.icon.replace("-outline", "")
						: tab.icon}
					size={22}
					color={$activeTab === tab.id
						? "var(--accent)"
						: "currentColor"}
				/>
			</div>
			<span class="tab-label">{tab.label}</span>
		</button>
	{/each}
</nav>

<style>
	.bottombar {
		display: flex;
		align-items: center;
		justify-content: space-around;
		height: var(--bottombar-height);
		background: var(--bg-primary);
		border-top: 1px solid var(--border-tile);
		padding: 0 var(--space-sm);
		flex-shrink: 0;
		z-index: 100;
	}

	.tab {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 3px;
		padding: var(--space-xs) var(--space-md);
		color: var(--text-muted);
		transition: color var(--transition-fast);
		min-width: 64px;
	}

	.tab:hover {
		color: var(--text-secondary);
	}

	.tab.active {
		color: var(--accent);
	}

	.tab-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 24px;
	}

	.tab-label {
		font-size: var(--font-2xs);
		font-weight: 500;
		letter-spacing: 0.02em;
	}
</style>
