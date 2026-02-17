<script lang="ts">
	import TileGrid from "$lib/components/TileGrid.svelte";
	import RoomSelector from "$lib/components/RoomSelector.svelte";
	import CategorySelector from "$lib/components/CategorySelector.svelte";
	import Tile from "$lib/components/Tile.svelte";
	import MdiIcon from "$lib/components/MdiIcon.svelte";
	import {
		activeTab,
		activeViewId,
		dashboardConfig,
		entityStates,
		editMode,
	} from "$lib/stores";
	import { saveConfig } from "$lib/config";
	import { DEFAULT_CATEGORIES } from "$lib/types";
	import type { TileConfig } from "$lib/types";

	let drillDown = $state(false);
	let drillDownName = $state("");
	let categoryDrillDown = $state(false);
	let activeCategoryId = $state("");

	function handleSelect(id: string, name: string) {
		if ($activeTab === "categories") {
			activeCategoryId = id;
			drillDownName = name;
			categoryDrillDown = true;
			drillDown = true;
		} else {
			activeViewId.set(id);
			drillDownName = name;
			drillDown = true;
			categoryDrillDown = false;
		}
	}

	function handleBack() {
		drillDown = false;
		categoryDrillDown = false;
		activeCategoryId = "";
	}

	// Reset drill-down when switching tabs
	$effect(() => {
		const _tab = $activeTab;
		drillDown = false;
		categoryDrillDown = false;
	});

	// Get tiles for the selected category
	let categoryTiles = $derived(() => {
		if (!categoryDrillDown || !activeCategoryId) return [];
		const cat = DEFAULT_CATEGORIES.find((c) => c.id === activeCategoryId);
		if (!cat) return [];

		const tiles: TileConfig[] = [];
		for (const view of $dashboardConfig.views) {
			for (const tile of view.tiles) {
				const domain = tile.entityId.split(".")[0];
				if (cat.domains.includes(domain)) {
					tiles.push(tile);
				}
			}
		}
		return tiles;
	});

	// === Zentrale tab logic ===
	let centralViewId = $derived(
		$dashboardConfig.settings?.centralViewId || "",
	);
	let centralView = $derived(
		$dashboardConfig.views.find((v) => v.id === centralViewId),
	);

	// === Room detail view: group tiles by category ===
	let activeView = $derived(
		$dashboardConfig.views.find((v) => v.id === $activeViewId),
	);

	function getRoomCategoryGroups() {
		if (!activeView) return [];

		const groups: {
			category: (typeof DEFAULT_CATEGORIES)[0];
			tiles: TileConfig[];
		}[] = [];

		for (const cat of DEFAULT_CATEGORIES) {
			const catTiles = activeView.tiles.filter((tile) => {
				const domain = tile.entityId.split(".")[0];
				return cat.domains.includes(domain);
			});
			if (catTiles.length > 0) {
				groups.push({ category: cat, tiles: catTiles });
			}
		}

		return groups;
	}

	let roomCategoryGroups = $derived(getRoomCategoryGroups());
</script>

<svelte:head>
	<title>LoxHome Dashboard</title>
	<meta
		name="description"
		content="Ein von Loxone inspiriertes Home Assistant Dashboard"
	/>
</svelte:head>

{#if ($activeTab === "rooms" || $activeTab === "categories") && !drillDown}
	{#if $activeTab === "rooms"}
		<RoomSelector onSelect={handleSelect} />
	{:else}
		<CategorySelector onSelect={handleSelect} />
	{/if}
{:else if $activeTab === "categories" && categoryDrillDown}
	<div class="detail-header">
		<button class="back-btn" onclick={handleBack} aria-label="Zurück">
			<MdiIcon name="mdi:chevron-left" size={24} />
		</button>
		<h2 class="detail-title">{drillDownName}</h2>
	</div>
	<div class="category-tiles">
		<div class="tile-grid">
			{#each categoryTiles() as tile (tile.id)}
				<Tile {tile} zoneName={drillDownName} />
			{/each}
		</div>
		{#if categoryTiles().length === 0}
			<div class="empty-state">Keine Entitäten in dieser Kategorie</div>
		{/if}
	</div>
{:else if $activeTab === "rooms" && drillDown}
	<!-- Loxone-style room detail view with category grouping -->
	<div class="room-detail">
		<div class="room-detail-header">
			<button class="back-btn" onclick={handleBack} aria-label="Zurück">
				<MdiIcon name="mdi:chevron-left" size={24} />
			</button>
			<div class="room-detail-title-area">
				<span class="room-detail-subtitle">ZUHAUSE</span>
				<h2 class="room-detail-name">{drillDownName}</h2>
			</div>
		</div>

		{#if activeView && activeView.tiles.length > 0}
			{#each roomCategoryGroups as group}
				<div class="room-category-section">
					<div class="room-category-header">
						<span class="room-category-name"
							>{group.category.name}</span
						>
						<MdiIcon
							name="mdi:chevron-right"
							size={18}
							color="var(--text-muted)"
						/>
					</div>
					<div class="tile-grid">
						{#each group.tiles as tile (tile.id)}
							<Tile {tile} zoneName={drillDownName} />
						{/each}
					</div>
				</div>
			{/each}
		{:else}
			<div class="empty-state">
				Keine Entitäten in diesem Raum. Füge Geräte über den
				Bearbeitungsmodus hinzu.
			</div>
		{/if}
	</div>
{:else if $activeTab === "central"}
	<!-- Zentrale: shows entities with "Zentral" HA label -->
	{#if centralViewId && centralView}
		<div class="central-header">
			<div class="central-title-row">
				<span class="central-icon"
					><MdiIcon name={centralView.icon} size={28} /></span
				>
				<h2 class="detail-title">{centralView.name}</h2>
			</div>
		</div>
		<div class="central-tiles">
			<div class="tile-grid">
				{#each centralView.tiles as tile (tile.id)}
					<Tile {tile} zoneName="Zentral" />
				{/each}
			</div>
			{#if centralView.tiles.length === 0}
				<div class="empty-state">
					Keine Entitäten mit dem Label "Zentral" gefunden. Weise
					Entitäten in Home Assistant das Label "Zentral" zu.
				</div>
			{/if}
		</div>
	{:else}
		<div class="central-setup">
			<div class="central-setup-header">
				<span class="central-setup-icon"
					><MdiIcon
						name="mdi:home"
						size={40}
						color="var(--accent)"
					/></span
				>
				<h2 class="central-setup-title">Zentrale einrichten</h2>
				<p class="central-setup-desc">
					Weise in Home Assistant Entitäten das Label "Zentral" zu, um
					sie hier anzuzeigen. Starte dann die Auto-Erkennung erneut.
				</p>
			</div>
		</div>
	{/if}
{:else}
	<!-- Favoriten: Kacheln anzeigen -->
	<TileGrid />
{/if}

<style>
	.detail-header {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-md);
	}

	.back-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border-radius: var(--radius-full);
		color: var(--text-secondary);
		transition: all var(--transition-fast);
		flex-shrink: 0;
	}

	.back-btn:hover {
		background: var(--bg-surface);
		color: var(--text-primary);
	}

	.detail-title {
		font-size: var(--font-lg);
		font-weight: 600;
		color: var(--text-primary);
	}

	.category-tiles,
	.central-tiles {
		padding: var(--space-md);
		padding-bottom: calc(var(--bottombar-height) + var(--space-lg));
	}

	.tile-grid {
		display: grid;
		grid-template-columns: repeat(var(--dashboard-columns, 2), 1fr);
		gap: var(--space-sm);
	}

	.empty-state {
		text-align: center;
		padding: var(--space-2xl);
		color: var(--text-muted);
		font-size: var(--font-sm);
	}

	/* === Loxone-style Room Detail View === */
	.room-detail {
		padding: var(--space-md);
		padding-bottom: calc(var(--bottombar-height) + var(--space-lg));
	}

	.room-detail-header {
		display: flex;
		align-items: flex-start;
		gap: var(--space-sm);
		margin-bottom: var(--space-lg);
	}

	.room-detail-title-area {
		display: flex;
		flex-direction: column;
	}

	.room-detail-subtitle {
		font-size: var(--font-2xs);
		font-weight: 600;
		letter-spacing: 0.1em;
		color: var(--text-muted);
		text-transform: uppercase;
	}

	.room-detail-name {
		font-size: 28px;
		font-weight: 700;
		color: var(--text-primary);
		margin: 2px 0 0;
	}

	.room-category-section {
		margin-bottom: var(--space-lg);
	}

	.room-category-header {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		margin-bottom: var(--space-sm);
	}

	.room-category-name {
		font-size: var(--font-sm);
		font-weight: 500;
		color: var(--text-secondary);
	}

	/* === Zentrale header === */
	.central-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-sm) var(--space-md);
	}

	.central-title-row {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.central-icon {
		font-size: 24px;
		line-height: 1;
	}

	/* === Zentrale setup === */
	.central-setup {
		padding: var(--space-lg) var(--space-md);
		padding-bottom: calc(var(--bottombar-height) + var(--space-lg));
	}

	.central-setup-header {
		text-align: center;
		margin-bottom: var(--space-xl);
	}

	.central-setup-icon {
		font-size: 48px;
		display: block;
		margin-bottom: var(--space-sm);
	}

	.central-setup-title {
		font-size: var(--font-xl);
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: var(--space-xs);
	}

	.central-setup-desc {
		font-size: var(--font-sm);
		color: var(--text-muted);
		max-width: 320px;
		margin: 0 auto;
	}
</style>
