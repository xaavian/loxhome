<script lang="ts">
	import { dashboardConfig, showViewEditor, activeViewId } from "$lib/stores";
	import { saveConfig, generateId } from "$lib/config";
	import type { ViewConfig } from "$lib/types";
	import MdiIcon from "./MdiIcon.svelte";

	let newViewName = $state("");
	let newViewIcon = $state("mdi:home");
	let newViewColor = $state("#69b34c");

	const iconOptions = [
		"mdi:home",
		"mdi:sofa",
		"mdi:bed",
		"mdi:stove",
		"mdi:shower",
		"mdi:office-building",
		"mdi:tree",
		"mdi:car",
		"mdi:star",
		"mdi:television",
		"mdi:gamepad-variant",
		"mdi:dumbbell",
		"mdi:desk",
		"mdi:door",
		"mdi:stairs",
		"mdi:baby-face",
		"mdi:pool",
		"mdi:book-open-variant",
		"mdi:washing-machine",
		"mdi:flower",
		"mdi:fridge",
		"mdi:balcony",
		"mdi:server",
		"mdi:toilet",
	];
	const colorOptions = [
		"#69b34c",
		"#e8c840",
		"#4aa8d8",
		"#e85050",
		"#e84898",
		"#8d6e63",
		"#26c6da",
		"#ab47bc",
	];

	function addView() {
		if (!newViewName.trim()) return;

		const newView: ViewConfig = {
			id: generateId(),
			name: newViewName.trim(),
			icon: newViewIcon,
			color: newViewColor,
			tiles: [],
			order: $dashboardConfig.views.length,
		};

		dashboardConfig.update((config) => {
			config.views.push(newView);
			saveConfig(config);
			return { ...config };
		});

		newViewName = "";
		newViewIcon = "mdi:home";
	}

	function removeView(viewId: string) {
		if ($dashboardConfig.views.length <= 1) return;

		dashboardConfig.update((config) => {
			config.views = config.views.filter((v) => v.id !== viewId);
			if ($activeViewId === viewId && config.views.length > 0) {
				activeViewId.set(config.views[0].id);
			}
			saveConfig(config);
			return { ...config };
		});
	}

	function close() {
		showViewEditor.set(false);
	}

	function handleOverlayClick(e: MouseEvent) {
		if ((e.target as HTMLElement).classList.contains("dialog-overlay"))
			close();
	}
</script>

{#if $showViewEditor}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class="dialog-overlay"
		onclick={handleOverlayClick}
		onkeydown={(e) => e.key === "Escape" && close()}
	>
		<div class="dialog animate-scale-in">
			<div class="dialog-header">
				<span class="dialog-title">Ansichten verwalten</span>
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
				<div class="views-list">
					{#each $dashboardConfig.views as view}
						<div class="view-item">
							<span class="view-icon"
								><MdiIcon name={view.icon} size={20} /></span
							>
							<span class="view-name">{view.name}</span>
							{#if $dashboardConfig.views.length > 1}
								<button
									class="remove-btn"
									onclick={() => removeView(view.id)}
									aria-label="Remove {view.name}"
								>
									<svg
										width="14"
										height="14"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
									>
										<path d="M18 6L6 18M6 6l12 12" />
									</svg>
								</button>
							{/if}
						</div>
					{/each}
				</div>

				<div class="add-section">
					<span class="section-label">Ansicht hinzufügen</span>
					<input
						type="text"
						placeholder="Name der Ansicht..."
						bind:value={newViewName}
						class="name-input"
					/>

					<div class="picker-row">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="picker-label">Icon</label>
						<div class="picker-grid">
							{#each iconOptions as icon}
								<button
									class="picker-item"
									class:selected={newViewIcon === icon}
									onclick={() => (newViewIcon = icon)}
									><MdiIcon name={icon} size={20} /></button
								>
							{/each}
						</div>
					</div>

					<div class="picker-row">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="picker-label">Farbe</label>
						<div class="picker-grid">
							{#each colorOptions as color}
								<button
									class="color-item"
									class:selected={newViewColor === color}
									style="background: {color}"
									onclick={() => (newViewColor = color)}
									aria-label={color}
								></button>
							{/each}
						</div>
					</div>

					<button
						class="btn-add"
						disabled={!newViewName.trim()}
						onclick={addView}>Hinzufügen</button
					>
				</div>
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
		max-width: 400px;
		max-height: 80vh;
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

	.views-list {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.view-item {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-sm);
		background: var(--bg-primary);
	}

	.view-icon {
		font-size: var(--font-md);
		width: 28px;
		text-align: center;
	}

	.view-name {
		flex: 1;
		font-size: var(--font-sm);
	}

	.remove-btn {
		color: var(--text-muted);
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: var(--radius-sm);
		transition: all var(--transition-fast);
	}

	.remove-btn:hover {
		color: var(--color-error);
		background: var(--bg-surface-hover);
	}

	.add-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.section-label {
		font-size: var(--font-xs);
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.name-input {
		width: 100%;
	}

	.picker-row {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.picker-label {
		font-size: var(--font-xs);
		color: var(--text-secondary);
	}

	.picker-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
	}

	.picker-item {
		width: 36px;
		height: 36px;
		border-radius: var(--radius-sm);
		background: var(--bg-primary);
		border: 1px solid var(--border-subtle);
		font-size: var(--font-md);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all var(--transition-fast);
	}

	.picker-item.selected {
		border-color: var(--accent);
		background: var(--accent-subtle);
	}

	.color-item {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		border: 2px solid transparent;
		transition: all var(--transition-fast);
	}

	.color-item.selected {
		border-color: var(--text-primary);
		transform: scale(1.15);
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
</style>
