<script lang="ts">
	import { showAutoSetup, dashboardConfig } from "$lib/stores";
	import { discoverEntities } from "$lib/hass";
	import { saveConfig, generateId } from "$lib/config";
	import type {
		DiscoveryResult,
		TileConfig,
		TileType,
		ViewConfig,
	} from "$lib/types";

	type Step = "intro" | "loading" | "preview" | "error";
	let step = $state<Step>("intro");
	let discovery = $state<DiscoveryResult | null>(null);
	let errorMsg = $state("");

	const roomIcons = [
		"🛋️",
		"🛏️",
		"🍳",
		"🚿",
		"🏢",
		"🌳",
		"🚗",
		"📺",
		"🎮",
		"🏋️",
		"🏠",
		"⭐",
	];
	const roomColors = [
		"#69b34c",
		"#e8c840",
		"#4aa8d8",
		"#e85050",
		"#ab47bc",
		"#8d6e63",
		"#26c6da",
		"#e84898",
	];

	// Map common HA MDI icons to emojis
	const mdiToEmoji: Record<string, string> = {
		"mdi:sofa": "🛋️",
		"mdi:bed": "🛏️",
		"mdi:bed-double": "🛏️",
		"mdi:stove": "🍳",
		"mdi:silverware-fork-knife": "🍽️",
		"mdi:pot-steam": "🍳",
		"mdi:shower": "🚿",
		"mdi:shower-head": "🚿",
		"mdi:toilet": "🚿",
		"mdi:office-building": "🏢",
		"mdi:desk": "🖥️",
		"mdi:briefcase": "💼",
		"mdi:tree": "🌳",
		"mdi:flower": "🌸",
		"mdi:grass": "🌿",
		"mdi:car": "🚗",
		"mdi:garage": "🚗",
		"mdi:garage-variant": "🚗",
		"mdi:television": "📺",
		"mdi:gamepad-variant": "🎮",
		"mdi:dumbbell": "🏋️",
		"mdi:weight-lifter": "🏋️",
		"mdi:home": "🏠",
		"mdi:home-outline": "🏠",
		"mdi:home-variant": "🏠",
		"mdi:stairs": "🪜",
		"mdi:door": "🚪",
		"mdi:door-open": "🚪",
		"mdi:washing-machine": "👕",
		"mdi:hanger": "👔",
		"mdi:baby-face": "👶",
		"mdi:baby-face-outline": "👶",
		"mdi:pool": "🏊",
		"mdi:hot-tub": "♨️",
		"mdi:book-open-variant": "📚",
		"mdi:bookshelf": "📚",
		"mdi:balcony": "🌇",
		"mdi:terrace": "🌇",
		"mdi:food-apple": "🍎",
		"mdi:fridge": "🧊",
	};

	/** Resolve icon for a discovered area: use area.icon (MDI→emoji), fallback to rotating list */
	function resolveAreaIcon(icon: string | undefined, index: number): string {
		if (icon && mdiToEmoji[icon]) return mdiToEmoji[icon];
		if (icon) return icon.replace("mdi:", "").charAt(0).toUpperCase(); // First letter fallback
		return roomIcons[index % roomIcons.length];
	}

	async function runDiscovery() {
		step = "loading";
		errorMsg = "";
		try {
			discovery = await discoverEntities();
			step = "preview";
		} catch (e) {
			errorMsg =
				e instanceof Error ? e.message : "Erkennung fehlgeschlagen";
			step = "error";
		}
	}

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

	function applyDiscovery() {
		if (!discovery) return;

		const views: ViewConfig[] = discovery.areas.map((item, i) => ({
			id: generateId(),
			name: item.area.name,
			icon: resolveAreaIcon(item.area.icon, i),
			color: roomColors[i % roomColors.length],
			order: i,
			tiles: item.entities.map((entityId, j) => ({
				id: generateId(),
				type: detectTileType(entityId),
				entityId,
				size: "1x1" as const,
				order: j,
				dimmable: entityId.startsWith("light."),
			})),
		}));

		// Nicht zugewiesene Entitäten als "Favoriten"-Ansicht
		if (discovery.unassigned.length > 0) {
			views.unshift({
				id: "favourites",
				name: "Favoriten",
				icon: "⭐",
				color: "#e8c840",
				order: -1,
				tiles: discovery.unassigned.slice(0, 30).map((entityId, j) => ({
					id: generateId(),
					type: detectTileType(entityId),
					entityId,
					size: "1x1" as const,
					order: j,
					dimmable: entityId.startsWith("light."),
				})),
			});
		}

		// Re-index order
		views.forEach((v, i) => (v.order = i));

		dashboardConfig.update((config) => {
			config.views = views;
			saveConfig(config);
			return { ...config };
		});

		close();
	}

	function close() {
		showAutoSetup.set(false);
		step = "intro";
		discovery = null;
		errorMsg = "";
	}

	function handleOverlayClick(e: MouseEvent) {
		if ((e.target as HTMLElement).classList.contains("dialog-overlay"))
			close();
	}

	let totalEntities = $derived(
		discovery
			? discovery.areas.reduce((sum, a) => sum + a.entities.length, 0) +
					discovery.unassigned.length
			: 0,
	);
</script>

{#if $showAutoSetup}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class="dialog-overlay"
		onclick={handleOverlayClick}
		onkeydown={(e) => e.key === "Escape" && close()}
	>
		<div class="dialog animate-scale-in">
			<div class="dialog-header">
				<span class="dialog-title">Auto-Erkennung</span>
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
				{#if step === "intro"}
					<div class="intro-section">
						<div class="intro-icon">🏠</div>
						<h3 class="intro-title">Dein Zuhause entdecken</h3>
						<p class="intro-desc">
							Dein Home Assistant wird automatisch nach Bereichen,
							Geräten und Entitäten durchsucht. Räume und Kacheln
							werden anhand deiner HA-Konfiguration erstellt.
						</p>
						<button class="btn-discover" onclick={runDiscovery}>
							<svg
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<circle cx="11" cy="11" r="8" />
								<line x1="21" y1="21" x2="16.65" y2="16.65" />
							</svg>
							Mein Zuhause erkennen
						</button>
					</div>
				{:else if step === "loading"}
					<div class="loading-section">
						<div class="spinner"></div>
						<p class="loading-text">
							Bereiche & Entitäten werden gescannt...
						</p>
					</div>
				{:else if step === "preview"}
					<div class="preview-section">
						<div class="summary-bar">
							<span class="summary-stat">
								<strong>{discovery?.areas.length || 0}</strong> Räume
							</span>
							<span class="summary-divider">·</span>
							<span class="summary-stat">
								<strong>{totalEntities}</strong> Entitäten
							</span>
						</div>

						<div class="preview-list">
							{#each discovery?.areas || [] as item, i}
								<div class="preview-room">
									<span class="preview-icon"
										>{resolveAreaIcon(
											item.area.icon,
											i,
										)}</span
									>
									<span class="preview-name"
										>{item.area.name}</span
									>
									<span class="preview-count"
										>{item.entities.length} Entitäten</span
									>
								</div>
							{/each}
							{#if (discovery?.unassigned.length || 0) > 0}
								<div class="preview-room unassigned">
									<span class="preview-icon">⭐</span>
									<span class="preview-name"
										>Favoriten (Nicht zugewiesen)</span
									>
									<span class="preview-count"
										>{discovery?.unassigned.length} Entitäten</span
									>
								</div>
							{/if}
						</div>
					</div>
				{:else if step === "error"}
					<div class="error-section">
						<p class="error-icon">⚠️</p>
						<p class="error-text">{errorMsg}</p>
						<button class="btn-retry" onclick={runDiscovery}
							>Erneut versuchen</button
						>
					</div>
				{/if}
			</div>

			{#if step === "preview"}
				<div class="dialog-footer">
					<button class="btn-cancel" onclick={close}>Abbrechen</button
					>
					<button class="btn-apply" onclick={applyDiscovery}
						>Anwenden</button
					>
				</div>
			{/if}
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
		padding: var(--space-xl);
	}

	/* ── Intro ── */
	.intro-section {
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-md);
	}

	.intro-icon {
		font-size: 48px;
		margin-bottom: var(--space-sm);
	}

	.intro-title {
		font-size: var(--font-lg);
		font-weight: 600;
		color: var(--text-primary);
	}

	.intro-desc {
		font-size: var(--font-sm);
		color: var(--text-secondary);
		max-width: 320px;
		line-height: 1.5;
	}

	.btn-discover {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-md) var(--space-xl);
		border-radius: var(--radius-sm);
		font-size: var(--font-sm);
		font-weight: 600;
		background: var(--accent);
		color: white;
		transition: all var(--transition-fast);
		margin-top: var(--space-sm);
	}

	.btn-discover:hover {
		background: var(--accent-hover);
	}

	/* ── Loading ── */
	.loading-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-lg);
		padding: var(--space-xl);
	}

	.spinner {
		width: 36px;
		height: 36px;
		border: 3px solid var(--border-tile);
		border-top-color: var(--accent);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.loading-text {
		color: var(--text-secondary);
		font-size: var(--font-sm);
	}

	/* ── Preview ── */
	.preview-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.summary-bar {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-sm);
		padding: var(--space-sm);
		background: var(--accent-subtle);
		border-radius: var(--radius-sm);
		font-size: var(--font-sm);
		color: var(--text-primary);
	}

	.summary-divider {
		color: var(--text-muted);
	}

	.preview-list {
		display: flex;
		flex-direction: column;
		gap: 4px;
		max-height: 300px;
		overflow-y: auto;
	}

	.preview-room {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-sm);
		background: var(--bg-primary);
	}

	.preview-room.unassigned {
		border: 1px dashed var(--border-tile);
		background: transparent;
	}

	.preview-icon {
		font-size: var(--font-md);
		width: 28px;
		text-align: center;
	}

	.preview-name {
		flex: 1;
		font-size: var(--font-sm);
		font-weight: 500;
	}

	.preview-count {
		font-size: var(--font-xs);
		color: var(--text-muted);
	}

	/* ── Error ── */
	.error-section {
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-lg);
	}

	.error-icon {
		font-size: 36px;
	}

	.error-text {
		color: var(--color-error);
		font-size: var(--font-sm);
	}

	.btn-retry {
		padding: var(--space-sm) var(--space-lg);
		border-radius: var(--radius-sm);
		font-size: var(--font-sm);
		color: var(--text-secondary);
		border: 1px solid var(--border-tile);
		transition: all var(--transition-fast);
	}

	.btn-retry:hover {
		color: var(--text-primary);
		border-color: var(--text-secondary);
	}

	/* ── Footer ── */
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

	.btn-apply {
		padding: var(--space-sm) var(--space-lg);
		border-radius: var(--radius-sm);
		font-size: var(--font-sm);
		font-weight: 600;
		background: var(--accent);
		color: white;
		transition: all var(--transition-fast);
	}

	.btn-apply:hover {
		background: var(--accent-hover);
	}
</style>
