<script lang="ts">
	import { entityStates, editMode, modalEntityId } from "$lib/stores";
	import { toggleEntity } from "$lib/hass";
	import type { TileConfig, EntityState } from "$lib/types";
	import MdiIcon from "./MdiIcon.svelte";
	import DimmerSlider from "./DimmerSlider.svelte";

	interface Props {
		tile: TileConfig;
		zoneName?: string;
		onRemove?: () => void;
	}

	let { tile, zoneName, onRemove }: Props = $props();

	let showDimmer = $state(false);

	let entity: EntityState | undefined = $derived(
		$entityStates[tile.entityId],
	);
	let isOn = $derived(
		entity
			? !["off", "unavailable", "unknown", "idle"].includes(entity.state)
			: false,
	);
	let domain = $derived(tile.entityId.split(".")[0]);

	let displayName = $derived(
		tile.name ||
			(entity?.attributes?.friendly_name as string) ||
			tile.entityId.split(".")[1]?.replace(/_/g, " ") ||
			tile.entityId,
	);
	let displayState = $derived(getDisplayState());

	let stateColor = $derived(tile.color || getStateColor());

	function getDisplayState(): string {
		if (!entity) return "Unavailable";
		const state = entity.state;

		switch (domain) {
			case "light":
				if (isOn) {
					if (tile.dimmable) {
						const brightness = entity.attributes?.brightness;
						return brightness
							? `${Math.round(((brightness as number) / 255) * 100)}%`
							: "An";
					}
					return "An";
				}
				return "Aus";
			case "climate":
				const temp = entity.attributes?.current_temperature;
				const mode = entity.attributes?.hvac_action || state;
				if (temp) return `${temp}°`;
				return (
					String(mode).charAt(0).toUpperCase() + String(mode).slice(1)
				);
			case "sensor":
				const unit = entity.attributes?.unit_of_measurement || "";
				return `${state} ${unit}`.trim();
			case "cover":
				const pos = entity.attributes?.current_position;
				if (state === "closed") return "Geschlossen";
				if (pos !== undefined) return `${pos}%`;
				return state.charAt(0).toUpperCase() + state.slice(1);
			case "media_player":
				if (state === "playing") {
					const title = entity.attributes?.media_title;
					return title ? `Wiedergabe` : "Wiedergabe";
				}
				return state.charAt(0).toUpperCase() + state.slice(1);
			case "lock":
				return state === "locked" ? "Gesperrt" : "Entriegelt";
			case "alarm_control_panel":
				if (state === "armed_away" || state === "armed_home")
					return "Gesperrt";
				return "Alles OK";
			default:
				return state.charAt(0).toUpperCase() + state.slice(1);
		}
	}

	function getStateColor(): string {
		if (!entity || entity.state === "unavailable")
			return "var(--text-muted)";

		switch (domain) {
			case "light":
				return isOn ? "var(--cat-lighting)" : "var(--text-secondary)";
			case "climate":
				return "var(--cat-climate)";
			case "cover":
				return isOn ? "var(--text-primary)" : "var(--cat-ok)";
			case "media_player":
				return isOn ? "var(--cat-media)" : "var(--text-secondary)";
			case "sensor":
				return "var(--text-primary)";
			case "lock":
			case "alarm_control_panel":
				return entity.state === "locked" ||
					entity.state === "armed_away"
					? "var(--cat-security)"
					: "var(--cat-ok)";
			case "switch":
			case "input_boolean":
				return isOn ? "var(--cat-switches)" : "var(--text-secondary)";
			default:
				return isOn ? "var(--accent)" : "var(--text-secondary)";
		}
	}

	function handleClick() {
		if ($editMode) return;
		if (
			[
				"light",
				"switch",
				"fan",
				"input_boolean",
				"automation",
				"lock",
			].includes(domain)
		) {
			toggleEntity(tile.entityId);
		} else {
			modalEntityId.set(tile.entityId);
		}
	}

	function handleLongPress() {
		modalEntityId.set(tile.entityId);
	}

	let tileSize = $derived(tile.size || "1x1");
	let colSpan = $derived(parseInt(tileSize.split("x")[0]));
	let rowSpan = $derived(parseInt(tileSize.split("x")[1]));

	/** Map domain to MDI icon name */
	function getDomainMdiIcon(d: string): string {
		const map: Record<string, string> = {
			light: "mdi:lightbulb-outline",
			switch: "mdi:flash",
			input_boolean: "mdi:flash",
			climate: "mdi:thermometer",
			cover: "mdi:window-shutter",
			media_player: "mdi:music",
			sensor: "mdi:chart-line",
			lock: "mdi:lock",
			alarm_control_panel: "mdi:shield-check",
			camera: "mdi:camera",
			fan: "mdi:fan",
			automation: "mdi:robot",
		};
		return map[d] || "mdi:circle-outline";
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="tile"
	class:on={isOn}
	class:editing={$editMode}
	style="grid-column: span {colSpan}; grid-row: span {rowSpan};"
	onclick={handleClick}
	onkeydown={(e) => {
		if (e.key === "Enter" || e.key === " ") handleClick();
	}}
	role="button"
	tabindex="0"
	aria-label={displayName}
>
	{#if $editMode && onRemove}
		<button
			class="remove-btn"
			onclick={(e) => {
				e.stopPropagation();
				onRemove?.();
			}}
			title="Remove tile"
		>
			<svg
				width="12"
				height="12"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="3"
			>
				<path d="M18 6L6 18M6 6l12 12" />
			</svg>
		</button>
	{/if}

	{#if zoneName && !$editMode}
		<span class="zone-label">{zoneName}</span>
	{/if}

	<!-- Icon -->
	<div class="tile-icon" style="color: {stateColor}">
		<MdiIcon name={tile.icon || getDomainMdiIcon(domain)} size={36} />
	</div>

	<!-- State & Name -->
	<div class="tile-content">
		<span class="tile-state" style="color: {stateColor}"
			>{displayState}</span
		>
		<span class="tile-name">{displayName}</span>
	</div>

	<!-- Action buttons for specific domains -->
	{#if domain === "cover" && !$editMode}
		<div class="tile-actions">
			<MdiIcon name="mdi:chevron-up" size={16} />
			<MdiIcon name="mdi:chevron-down" size={16} />
		</div>
	{:else if domain === "media_player" && isOn && !$editMode}
		<div class="tile-actions">
			<MdiIcon name="mdi:pause" size={16} />
		</div>
	{:else if domain === "light" && isOn && !$editMode}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="tile-actions"
			onclick={(e) => {
				e.stopPropagation();
				showDimmer = true;
			}}
			onkeydown={() => {}}
		>
			<MdiIcon name="mdi:plus" size={16} />
		</div>
	{/if}
</div>

{#if showDimmer}
	<DimmerSlider
		entityId={tile.entityId}
		onClose={() => (showDimmer = false)}
	/>
{/if}

<style>
	.tile {
		position: relative;
		display: flex;
		flex-direction: column;
		padding: var(--space-md) var(--space-lg);
		border-radius: var(--radius-md);
		background: var(--bg-surface);
		border: 1px solid var(--border-tile);
		cursor: pointer;
		transition: background var(--transition-fast);
		min-height: 110px;
		gap: var(--space-sm);
	}

	.tile:hover {
		background: var(--bg-surface-hover);
	}

	.tile:active {
		background: var(--bg-surface-active);
	}

	.tile.editing {
		cursor: grab;
		border-style: dashed;
		border-color: rgba(255, 255, 255, 0.08);
	}

	.tile.editing:active {
		cursor: grabbing;
	}

	.tile-icon {
		display: flex;
		align-items: center;
		margin-top: var(--space-xs);
	}

	/* State text + name */
	.tile-content {
		display: flex;
		flex-direction: column;
		gap: 1px;
		margin-top: auto;
	}

	.tile-state {
		font-size: var(--font-md);
		font-weight: 700;
		line-height: 1.2;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.tile-name {
		font-size: var(--font-xs);
		color: var(--text-secondary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.tile-actions {
		position: absolute;
		bottom: var(--space-md);
		right: var(--space-md);
		display: flex;
		flex-direction: column;
		gap: 4px;
		color: var(--text-secondary);
		cursor: pointer;
	}

	.tile-actions:hover {
		color: var(--text-primary);
	}

	.zone-label {
		position: absolute;
		top: var(--space-sm);
		right: var(--space-md);
		font-size: 10px;
		font-weight: 500;
		color: var(--text-muted);
		letter-spacing: 0.02em;
		text-transform: capitalize;
	}

	.remove-btn {
		position: absolute;
		top: 4px;
		left: 4px;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: var(--color-error);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10;
		transition: transform var(--transition-fast);
	}

	.remove-btn:hover {
		transform: scale(1.15);
	}
</style>
