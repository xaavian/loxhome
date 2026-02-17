<script lang="ts">
	import { entityStates, dashboardConfig } from "$lib/stores";
	import {
		editMode,
		activeTab,
		showOnboarding,
		showYamlEditor,
	} from "$lib/stores";
	import MdiIcon from "./MdiIcon.svelte";
	import { onMount, onDestroy } from "svelte";

	let timeStr = $state("");

	function updateTime() {
		const now = new Date();
		timeStr = now.toLocaleTimeString("de-DE", {
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		});
	}

	let interval: ReturnType<typeof setInterval>;

	onMount(() => {
		updateTime();
		interval = setInterval(updateTime, 1000);
	});

	onDestroy(() => {
		if (interval) clearInterval(interval);
	});

	function toggleEdit() {
		editMode.update((v) => !v);
	}

	function openYamlEditor() {
		showYamlEditor.set(true);
	}

	function openAutoSetup() {
		showOnboarding.set(true);
	}

	function toggleHASidebar() {
		try {
			window.parent.postMessage({ type: "loxhome-toggle-sidebar" }, "*");
		} catch {
			// Fallback: nothing
		}
	}

	// Weather entity
	let weatherEntityId = $derived(
		$dashboardConfig?.settings?.weatherEntityId || "weather.home",
	);
	let weatherEntity = $derived($entityStates[weatherEntityId]);
	let temperature = $derived(
		weatherEntity?.attributes?.temperature !== undefined
			? `${weatherEntity.attributes.temperature}°`
			: "--°",
	);

	// Map weather state to MDI icon
	function getWeatherIcon(state: string | undefined): string {
		if (!state) return "mdi:weather-cloudy";
		const map: Record<string, string> = {
			sunny: "mdi:weather-sunny",
			"clear-night": "mdi:weather-night",
			partlycloudy: "mdi:weather-partly-cloudy",
			cloudy: "mdi:weather-cloudy",
			rainy: "mdi:weather-rainy",
			pouring: "mdi:weather-pouring",
			snowy: "mdi:weather-snowy",
			"snowy-rainy": "mdi:weather-snowy-rainy",
			hail: "mdi:weather-hail",
			windy: "mdi:weather-windy",
			"windy-variant": "mdi:weather-windy-variant",
			fog: "mdi:weather-fog",
			lightning: "mdi:weather-lightning",
			"lightning-rainy": "mdi:weather-lightning-rainy",
			exceptional: "mdi:weather-cloudy-alert",
		};
		return map[state] || "mdi:weather-cloudy";
	}

	let weatherIcon = $derived(getWeatherIcon(weatherEntity?.state));
</script>

<header class="topbar">
	<div class="topbar-left">
		<button class="icon-btn" aria-label="Menü" onclick={toggleHASidebar}>
			<MdiIcon name="mdi:menu" size={20} />
		</button>
		<span class="temp-display">
			<MdiIcon name={weatherIcon} size={18} />
			{temperature}
		</span>
	</div>

	<div class="topbar-center">
		<span class="brand"
			>{$dashboardConfig.settings?.brandTitle || "LoxHome"}</span
		>
	</div>

	<div class="topbar-right">
		{#if $editMode}
			<button
				class="icon-btn"
				onclick={openAutoSetup}
				aria-label="Auto-Erkennung"
				title="Räume & Geräte automatisch erkennen"
			>
				<MdiIcon name="mdi:auto-fix" size={18} />
			</button>
			<button
				class="icon-btn"
				onclick={openYamlEditor}
				aria-label="YAML-Editor"
				title="YAML-Konfiguration bearbeiten"
			>
				<MdiIcon name="mdi:code-tags" size={18} />
			</button>
			<button
				class="icon-btn done-btn"
				onclick={toggleEdit}
				aria-label="Bearbeitung beenden"
			>
				<MdiIcon name="mdi:check" size={20} color="var(--accent)" />
			</button>
		{:else}
			<span class="time-display">{timeStr}</span>
			<button
				class="icon-btn"
				onclick={toggleEdit}
				aria-label="Dashboard bearbeiten"
			>
				<MdiIcon name="mdi:view-grid-plus-outline" size={18} />
			</button>
			<button class="icon-btn" aria-label="Suche">
				<MdiIcon name="mdi:magnify" size={18} />
			</button>
		{/if}
	</div>
</header>

<style>
	.topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: var(--topbar-height);
		padding: 0 var(--space-lg);
		background: transparent;
		flex-shrink: 0;
		z-index: 100;
	}

	.topbar-left {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		flex: 1;
	}

	.topbar-center {
		flex: 0 0 auto;
	}

	.brand {
		font-size: var(--font-md);
		font-weight: 700;
		color: var(--accent);
		letter-spacing: 3px;
		text-transform: uppercase;
	}

	.topbar-right {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		flex: 1;
		justify-content: flex-end;
	}

	.icon-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border-radius: var(--radius-sm);
		color: var(--text-secondary);
		transition: all var(--transition-fast);
	}

	.icon-btn:hover {
		color: var(--text-primary);
		background: var(--bg-surface);
	}

	.done-btn {
		color: var(--accent);
	}

	.done-btn:hover {
		color: var(--accent);
		background: var(--accent-subtle);
	}

	.temp-display {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: var(--font-md);
		font-weight: 500;
		color: var(--text-primary);
	}

	.time-display {
		font-size: var(--font-md);
		font-weight: 500;
		color: var(--text-primary);
		letter-spacing: 0.5px;
	}
</style>
