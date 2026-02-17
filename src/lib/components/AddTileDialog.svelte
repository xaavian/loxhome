<script lang="ts">
	import {
		entityStates,
		showAddTileDialog,
		dashboardConfig,
		activeView,
	} from "$lib/stores";
	import { saveConfig, generateId } from "$lib/config";
	import type { TileConfig, TileType, TileSize } from "$lib/types";
	import MdiIcon from "./MdiIcon.svelte";

	let searchQuery = $state("");
	let selectedEntityId = $state("");
	let selectedType = $state<TileType>("generic");
	let selectedSize = $state<TileSize>("1x1");
	let customName = $state("");
	let customIcon = $state("");
	let isDimmable = $state(false);
	let selectedViewId = $state("");

	// Default to active view when dialog opens
	$effect(() => {
		if ($showAddTileDialog && $activeView) {
			selectedViewId = $activeView.id;
		}
	});

	let selectedDomain = $derived(
		selectedEntityId ? selectedEntityId.split(".")[0] : "",
	);

	let allEntities = $derived(
		Object.entries($entityStates).map(([id, state]) => ({
			entity_id: id,
			name: (state.attributes?.friendly_name as string) || id,
			domain: id.split(".")[0],
			state: state.state,
		})),
	);

	let filteredEntities = $derived(
		allEntities
			.filter(
				(e) =>
					e.entity_id
						.toLowerCase()
						.includes(searchQuery.toLowerCase()) ||
					e.name.toLowerCase().includes(searchQuery.toLowerCase()),
			)
			.slice(0, 50),
	);

	function detectTileType(entityId: string): TileType {
		const domain = entityId.split(".")[0];
		const typeMap: Record<string, TileType> = {
			light: "light",
			switch: "switch",
			climate: "climate",
			cover: "cover",
			sensor: "sensor",
			media_player: "media",
			camera: "camera",
		};
		return typeMap[domain] || "generic";
	}

	function selectEntity(entityId: string) {
		selectedEntityId = entityId;
		selectedType = detectTileType(entityId);
	}

	function addTile() {
		if (!selectedEntityId) return;

		const targetViewId = selectedViewId || $activeView?.id;
		if (!targetViewId) return;

		dashboardConfig.update((config) => {
			const view = config.views.find((v) => v.id === targetViewId);
			if (!view) return config;

			const newTile: TileConfig = {
				id: generateId(),
				type: selectedType,
				entityId: selectedEntityId,
				size: selectedSize,
				order: view.tiles.length,
				...(customName ? { name: customName } : {}),
				...(customIcon ? { icon: customIcon } : {}),
				...(isDimmable ? { dimmable: true } : {}),
			};

			view.tiles.push(newTile);
			saveConfig(config);
			return { ...config };
		});

		close();
	}

	function close() {
		showAddTileDialog.set(false);
		searchQuery = "";
		selectedEntityId = "";
		selectedType = "generic";
		selectedSize = "1x1";
		customName = "";
		customIcon = "";
		isDimmable = false;
		selectedViewId = "";
	}

	function handleOverlayClick(e: MouseEvent) {
		if ((e.target as HTMLElement).classList.contains("dialog-overlay"))
			close();
	}

	const tileTypes: { value: TileType; label: string }[] = [
		{ value: "light", label: "Light" },
		{ value: "switch", label: "Switch" },
		{ value: "climate", label: "Climate" },
		{ value: "cover", label: "Cover" },
		{ value: "sensor", label: "Sensor" },
		{ value: "media", label: "Media" },
		{ value: "camera", label: "Camera" },
		{ value: "generic", label: "Generic" },
	];

	const tileSizes: { value: TileSize; label: string; desc: string }[] = [
		{ value: "1x1", label: "1×1", desc: "Small" },
		{ value: "2x1", label: "2×1", desc: "Wide" },
		{ value: "1x2", label: "1×2", desc: "Tall" },
		{ value: "2x2", label: "2×2", desc: "Large" },
	];

	function getDomainIcon(domain: string): string {
		const icons: Record<string, string> = {
			light: "mdi:lightbulb",
			switch: "mdi:flash",
			climate: "mdi:snowflake",
			cover: "mdi:window-shutter",
			sensor: "mdi:chart-line",
			media_player: "mdi:music",
			camera: "mdi:camera",
			fan: "mdi:fan",
			lock: "mdi:lock",
			automation: "mdi:robot",
		};
		return icons[domain] || "mdi:circle";
	}
</script>

{#if $showAddTileDialog}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class="dialog-overlay"
		onclick={handleOverlayClick}
		onkeydown={(e) => e.key === "Escape" && close()}
	>
		<div class="dialog animate-scale-in">
			<div class="dialog-header">
				<span class="dialog-title">Kachel hinzufügen</span>
				<button class="close-btn" onclick={close} aria-label="Close">
					<svg
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path d="M18 6L6 18M6 6l12 12" />
					</svg>
				</button>
			</div>

			<div class="dialog-body">
				<!-- Entity search -->
				<div class="search-section">
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label class="section-label">Entität</label>
					<input
						type="text"
						class="search-input"
						placeholder="Entitäten suchen..."
						bind:value={searchQuery}
					/>
					<div class="entity-list">
						{#if filteredEntities.length === 0}
							<p class="no-results">
								Keine Entitäten gefunden. Bitte zuerst mit Home
								Assistant verbinden.
							</p>
						{/if}
						{#each filteredEntities as entity}
							<button
								class="entity-item"
								class:selected={selectedEntityId ===
									entity.entity_id}
								onclick={() => selectEntity(entity.entity_id)}
							>
								<span class="entity-icon"
									><MdiIcon
										name={getDomainIcon(entity.domain)}
										size={20}
									/></span
								>
								<div class="entity-info">
									<span class="entity-name"
										>{entity.name}</span
									>
									<span class="entity-id"
										>{entity.entity_id}</span
									>
								</div>
								<span class="entity-state">{entity.state}</span>
							</button>
						{/each}
					</div>
				</div>

				{#if selectedEntityId}
					<div class="options-section">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="section-label">Raum zuweisen</label>
						<select class="room-select" bind:value={selectedViewId}>
							{#each $dashboardConfig.views as view}
								<option value={view.id}
									>{view.icon} {view.name}</option
								>
							{/each}
						</select>
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="section-label">Typ</label>
						<div class="type-grid">
							{#each tileTypes as t}
								<button
									class="type-option"
									class:selected={selectedType === t.value}
									onclick={() => (selectedType = t.value)}
								>
									{t.label}
								</button>
							{/each}
						</div>

						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="section-label">Größe</label>
						<div class="size-grid">
							{#each tileSizes as s}
								<button
									class="size-option"
									class:selected={selectedSize === s.value}
									onclick={() => (selectedSize = s.value)}
								>
									<span class="size-label">{s.label}</span>
									<span class="size-desc">{s.desc}</span>
								</button>
							{/each}
						</div>

						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="section-label">Eigener Name</label>
						<input
							type="text"
							class="search-input"
							placeholder="Leer lassen für Entitätsname"
							bind:value={customName}
						/>

						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="section-label">Eigenes Icon</label>
						<input
							type="text"
							class="search-input icon-input"
							placeholder="e.g. 💡 🌡️ ⚡"
							bind:value={customIcon}
						/>

						{#if selectedDomain === "light"}
							<label class="toggle-row">
								<input
									type="checkbox"
									bind:checked={isDimmable}
								/>
								<span>Dimmbar (Helligkeitsregler anzeigen)</span
								>
							</label>
						{/if}
					</div>
				{/if}
			</div>

			<div class="dialog-footer">
				<button class="btn-cancel" onclick={close}>Abbrechen</button>
				<button
					class="btn-add"
					disabled={!selectedEntityId}
					onclick={addTile}>Kachel hinzufügen</button
				>
			</div>
		</div>
	</div>
{/if}

<style>
	.dialog-overlay {
		position: fixed;
		inset: 0;
		background: var(--bg-overlay);
		z-index: 500;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-lg);
	}

	.dialog {
		width: 100%;
		max-width: 440px;
		max-height: 85vh;
		background: var(--bg-surface);
		border-radius: var(--radius-lg);
		border: 1px solid var(--border-tile);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.dialog-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-lg);
		border-bottom: 1px solid var(--border-subtle);
	}

	.dialog-title {
		font-size: var(--font-lg);
		font-weight: 600;
	}

	.close-btn {
		color: var(--text-muted);
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: var(--radius-sm);
		transition: all var(--transition-fast);
	}

	.close-btn:hover {
		color: var(--text-primary);
		background: var(--bg-surface-hover);
	}

	.dialog-body {
		flex: 1;
		overflow-y: auto;
		padding: var(--space-lg);
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}

	.section-label {
		font-size: var(--font-xs);
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: var(--space-sm);
		display: block;
	}

	.search-input {
		width: 100%;
		margin-bottom: var(--space-sm);
	}

	.entity-list {
		max-height: 220px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.no-results {
		text-align: center;
		color: var(--text-muted);
		font-size: var(--font-xs);
		padding: var(--space-lg);
	}

	.entity-item {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-sm);
		transition: background var(--transition-fast);
		text-align: left;
	}

	.entity-item:hover {
		background: var(--bg-surface-hover);
	}

	.entity-item.selected {
		background: var(--accent-subtle);
		border: 1px solid rgba(105, 179, 76, 0.2);
	}

	.entity-icon {
		width: 24px;
		text-align: center;
		font-size: var(--font-sm);
		flex-shrink: 0;
	}

	.entity-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
	}

	.entity-name {
		font-size: var(--font-sm);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.entity-id {
		font-size: var(--font-2xs);
		color: var(--text-muted);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.entity-state {
		font-size: var(--font-xs);
		color: var(--text-secondary);
		text-transform: capitalize;
		flex-shrink: 0;
	}

	.type-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 4px;
	}

	.type-option {
		padding: var(--space-sm);
		border-radius: var(--radius-sm);
		font-size: var(--font-xs);
		color: var(--text-secondary);
		background: var(--bg-primary);
		border: 1px solid var(--border-subtle);
		transition: all var(--transition-fast);
	}

	.type-option.selected {
		color: var(--accent);
		border-color: var(--accent);
		background: var(--accent-subtle);
	}

	.type-option:hover {
		background: var(--bg-surface-hover);
	}

	.size-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 4px;
	}

	.size-option {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: var(--space-sm);
		border-radius: var(--radius-sm);
		background: var(--bg-primary);
		border: 1px solid var(--border-subtle);
		transition: all var(--transition-fast);
	}

	.size-option.selected {
		border-color: var(--accent);
		background: var(--accent-subtle);
	}

	.size-option:hover {
		background: var(--bg-surface-hover);
	}

	.size-label {
		font-size: var(--font-sm);
		font-weight: 600;
		color: var(--text-primary);
	}

	.size-desc {
		font-size: var(--font-2xs);
		color: var(--text-muted);
	}

	.dialog-footer {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-sm);
		padding: var(--space-lg);
		border-top: 1px solid var(--border-subtle);
	}

	.btn-cancel {
		padding: var(--space-sm) var(--space-lg);
		border-radius: var(--radius-sm);
		font-size: var(--font-sm);
		color: var(--text-secondary);
	}

	.btn-cancel:hover {
		color: var(--text-primary);
	}

	.btn-add {
		padding: var(--space-sm) var(--space-lg);
		border-radius: var(--radius-sm);
		font-size: var(--font-sm);
		font-weight: 600;
		background: var(--accent);
		color: white;
		transition: all var(--transition-fast);
	}

	.btn-add:hover:not(:disabled) {
		background: var(--accent-hover);
	}

	.btn-add:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.icon-input {
		max-width: 120px;
		font-size: var(--font-lg);
	}

	.room-select {
		width: 100%;
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-sm);
		font-size: var(--font-sm);
		color: var(--text-primary);
		background: var(--bg-primary);
		border: 1px solid var(--border-subtle);
		margin-bottom: var(--space-sm);
		appearance: auto;
	}

	.room-select:focus {
		border-color: var(--accent);
		outline: none;
	}

	.toggle-row {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		font-size: var(--font-sm);
		color: var(--text-secondary);
		cursor: pointer;
		padding: var(--space-xs) 0;
	}

	.toggle-row input[type="checkbox"] {
		width: 16px;
		height: 16px;
		accent-color: var(--accent);
		cursor: pointer;
	}
</style>
