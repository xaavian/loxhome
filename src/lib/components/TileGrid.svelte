<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import Tile from "./Tile.svelte";
	import {
		dashboardConfig,
		activeView,
		editMode,
		showAddTileDialog,
		editingTileId,
	} from "$lib/stores";
	import { saveConfig } from "$lib/config";
	import type { TileConfig } from "$lib/types";
	import Sortable from "sortablejs";

	let gridElement: HTMLElement;
	let sortableInstance: Sortable | null = null;
	let movingTileId = $state<string | null>(null);

	let tiles = $derived($activeView?.tiles || []);

	function setupSortable() {
		if (sortableInstance) sortableInstance.destroy();
		if (!gridElement || !$editMode) return;

		sortableInstance = Sortable.create(gridElement, {
			animation: 200,
			ghostClass: "sortable-ghost",
			chosenClass: "sortable-chosen",
			dragClass: "sortable-drag",
			handle: ".tile",
			onEnd: (evt) => {
				if (evt.oldIndex === undefined || evt.newIndex === undefined)
					return;
				reorderTiles(evt.oldIndex, evt.newIndex);
			},
		});
	}

	function reorderTiles(oldIndex: number, newIndex: number) {
		dashboardConfig.update((config) => {
			const view = config.views.find((v) => v.id === $activeView?.id);
			if (!view) return config;

			const [moved] = view.tiles.splice(oldIndex, 1);
			view.tiles.splice(newIndex, 0, moved);
			view.tiles.forEach((t, i) => (t.order = i));

			saveConfig(config);
			return { ...config };
		});
	}

	function removeTile(tileId: string) {
		dashboardConfig.update((config) => {
			const view = config.views.find((v) => v.id === $activeView?.id);
			if (!view) return config;

			view.tiles = view.tiles.filter((t) => t.id !== tileId);
			view.tiles.forEach((t, i) => (t.order = i));

			saveConfig(config);
			return { ...config };
		});
	}

	function toggleMoveMenu(tileId: string) {
		movingTileId = movingTileId === tileId ? null : tileId;
	}

	function moveTileToView(tileId: string, targetViewId: string) {
		dashboardConfig.update((config) => {
			const sourceView = config.views.find(
				(v) => v.id === $activeView?.id,
			);
			const targetView = config.views.find((v) => v.id === targetViewId);
			if (!sourceView || !targetView || sourceView.id === targetView.id)
				return config;

			const tileIndex = sourceView.tiles.findIndex(
				(t) => t.id === tileId,
			);
			if (tileIndex === -1) return config;

			const [tile] = sourceView.tiles.splice(tileIndex, 1);
			tile.order = targetView.tiles.length;
			targetView.tiles.push(tile);

			// Re-index source
			sourceView.tiles.forEach((t, i) => (t.order = i));

			saveConfig(config);
			return { ...config };
		});
		movingTileId = null;
	}

	$effect(() => {
		if ($editMode) {
			setTimeout(setupSortable, 100);
		} else if (sortableInstance) {
			sortableInstance.destroy();
			sortableInstance = null;
		}
	});

	onDestroy(() => {
		if (sortableInstance) sortableInstance.destroy();
	});
</script>

<div class="tile-grid" bind:this={gridElement} class:editing={$editMode}>
	{#each tiles as tile (tile.id)}
		<div class="tile-wrapper">
			<Tile
				{tile}
				zoneName={$activeView?.name}
				onRemove={$editMode ? () => removeTile(tile.id) : undefined}
			/>
			{#if $editMode}
				<button
					class="edit-btn"
					onclick={(e) => {
						e.stopPropagation();
						editingTileId.set(tile.id);
					}}
					title="Edit tile"
				>
					<svg
						width="12"
						height="12"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path
							d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
						/>
						<path
							d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
						/>
					</svg>
				</button>
				<button
					class="move-btn"
					onclick={() => toggleMoveMenu(tile.id)}
					title="Move to room"
				>
					<svg
						width="12"
						height="12"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path
							d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3"
						/>
						<line x1="2" y1="12" x2="22" y2="12" />
						<line x1="12" y1="2" x2="12" y2="22" />
					</svg>
				</button>
				{#if movingTileId === tile.id}
					<div class="move-menu">
						{#each $dashboardConfig.views.filter((v) => v.id !== $activeView?.id) as view}
							<button
								class="move-option"
								onclick={() => moveTileToView(tile.id, view.id)}
							>
								{view.icon}
								{view.name}
							</button>
						{/each}
						{#if $dashboardConfig.views.filter((v) => v.id !== $activeView?.id).length === 0}
							<span class="move-empty">No other rooms</span>
						{/if}
					</div>
				{/if}
			{/if}
		</div>
	{/each}

	{#if $editMode}
		<button
			class="add-tile-btn"
			onclick={() => showAddTileDialog.set(true)}
		>
			<svg
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
			>
				<path d="M12 5v14M5 12h14" />
			</svg>
			<span>Add Tile</span>
		</button>
	{/if}

	{#if tiles.length === 0 && !$editMode}
		<div class="empty-state">
			<div class="empty-icon">
				<svg
					width="48"
					height="48"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1"
				>
					<rect x="3" y="3" width="7" height="7" rx="1.5" />
					<rect x="14" y="3" width="7" height="7" rx="1.5" />
					<rect x="3" y="14" width="7" height="7" rx="1.5" />
					<rect x="14" y="14" width="7" height="7" rx="1.5" />
				</svg>
			</div>
			<p>Tap the grid icon to start adding tiles</p>
		</div>
	{/if}
</div>

<style>
	.tile-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--tile-gap);
		padding: var(--space-sm) var(--space-md);
		padding-bottom: calc(var(--bottombar-height) + var(--space-md));
		width: 100%;
		animation: fadeIn var(--transition-normal);
	}

	/* Tablet: 3 columns */
	@media (min-width: 600px) {
		.tile-grid {
			grid-template-columns: repeat(3, 1fr);
			padding: var(--space-md) var(--space-lg);
			padding-bottom: calc(var(--bottombar-height) + var(--space-lg));
		}
	}

	/* Desktop: 4 columns */
	@media (min-width: 900px) {
		.tile-grid {
			grid-template-columns: repeat(4, 1fr);
			max-width: 1200px;
			margin: 0 auto;
		}
	}

	/* Large desktop: 5 columns */
	@media (min-width: 1200px) {
		.tile-grid {
			grid-template-columns: repeat(5, 1fr);
			max-width: 1400px;
		}
	}

	.add-tile-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-sm);
		min-height: 110px;
		border: 1px dashed rgba(255, 255, 255, 0.1);
		border-radius: var(--radius-md);
		color: var(--text-muted);
		font-size: var(--font-xs);
		transition: all var(--transition-fast);
	}

	.add-tile-btn:hover {
		border-color: var(--accent);
		color: var(--accent);
		background: var(--accent-subtle);
	}

	.empty-state {
		grid-column: 1 / -1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		padding: var(--space-2xl);
		color: var(--text-muted);
	}

	.empty-icon {
		margin-bottom: var(--space-md);
		opacity: 0.25;
	}

	.empty-state p {
		font-size: var(--font-sm);
		max-width: 240px;
	}

	/* SortableJS classes */
	:global(.sortable-ghost) {
		opacity: 0.3;
	}

	:global(.sortable-chosen) {
		box-shadow: var(--shadow-md) !important;
	}

	:global(.sortable-drag) {
		opacity: 0.9;
	}

	/* ── Edit & Move ── */
	.tile-wrapper {
		position: relative;
	}

	.edit-btn {
		position: absolute;
		bottom: 4px;
		right: 4px;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: var(--accent);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10;
		transition: transform var(--transition-fast);
		opacity: 0.7;
	}

	.edit-btn:hover {
		transform: scale(1.15);
		opacity: 1;
	}

	.move-btn {
		position: absolute;
		bottom: 4px;
		left: 4px;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: var(--accent);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10;
		transition: transform var(--transition-fast);
		opacity: 0.7;
	}

	.move-btn:hover {
		transform: scale(1.15);
		opacity: 1;
	}

	.move-menu {
		position: absolute;
		bottom: 28px;
		left: 4px;
		z-index: 20;
		background: var(--bg-surface);
		border: 1px solid var(--border-tile);
		border-radius: var(--radius-sm);
		padding: 4px;
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 140px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
	}

	.move-option {
		padding: 6px 10px;
		font-size: var(--font-xs);
		color: var(--text-primary);
		text-align: left;
		border-radius: var(--radius-sm);
		transition: background var(--transition-fast);
		white-space: nowrap;
	}

	.move-option:hover {
		background: var(--bg-surface-hover);
	}

	.move-empty {
		padding: 6px 10px;
		font-size: var(--font-xs);
		color: var(--text-muted);
		text-align: center;
	}
</style>
