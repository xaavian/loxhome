<script lang="ts">
	import { entityStates, modalEntityId, dashboardConfig } from "$lib/stores";
	import { callHAService, toggleEntity } from "$lib/hass";

	let entity = $derived(
		$modalEntityId ? $entityStates[$modalEntityId] : undefined,
	);
	let domain = $derived($modalEntityId?.split(".")[0] || "");
	let name = $derived(
		(entity?.attributes?.friendly_name as string) || $modalEntityId || "",
	);

	// Find tile config for dimmable check
	let tileConfig = $derived(() => {
		if (!$modalEntityId) return undefined;
		for (const view of $dashboardConfig.views) {
			const tile = view.tiles.find((t) => t.entityId === $modalEntityId);
			if (tile) return tile;
		}
		return undefined;
	});
	let isDimmable = $derived(tileConfig()?.dimmable === true);

	let brightness = $state(100);
	let temperature = $state(21);

	$effect(() => {
		if (entity && domain === "light") {
			brightness = entity.attributes?.brightness
				? Math.round(
						((entity.attributes.brightness as number) / 255) * 100,
					)
				: 100;
		}
		if (entity && domain === "climate") {
			temperature = (entity.attributes?.temperature as number) || 21;
		}
	});

	function close() {
		modalEntityId.set(null);
	}

	function handleOverlayClick(e: MouseEvent) {
		if ((e.target as HTMLElement).classList.contains("modal-overlay"))
			close();
	}

	async function setBrightness(val: number) {
		brightness = val;
		if ($modalEntityId) {
			await callHAService(
				"light",
				"turn_on",
				{
					brightness: Math.round((val / 100) * 255),
				},
				{ entity_id: $modalEntityId },
			);
		}
	}

	async function setTemperature(val: number) {
		temperature = val;
		if ($modalEntityId) {
			await callHAService(
				"climate",
				"set_temperature",
				{
					temperature: val,
				},
				{ entity_id: $modalEntityId },
			);
		}
	}

	async function handleToggle() {
		if ($modalEntityId) {
			await toggleEntity($modalEntityId);
		}
	}

	let isOn = $derived(
		entity
			? !["off", "unavailable", "unknown", "idle"].includes(entity.state)
			: false,
	);
</script>

{#if $modalEntityId && entity}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class="modal-overlay"
		onclick={handleOverlayClick}
		onkeydown={(e) => e.key === "Escape" && close()}
	>
		<div class="modal animate-slide-up">
			<div class="modal-header">
				<span class="modal-name">{name}</span>
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

			<div class="modal-body">
				{#if domain === "light"}
					{#if isDimmable}
						<div class="control-section">
							<div class="slider-row">
								<svg
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="1.5"
									class="slider-icon"
								>
									<circle cx="12" cy="12" r="5" />
									<line x1="12" y1="1" x2="12" y2="3" />
									<line x1="12" y1="21" x2="12" y2="23" />
								</svg>
								<!-- svelte-ignore a11y_label_has_associated_control -->
								<label class="slider-label">Helligkeit</label>
								<span class="slider-value">{brightness}%</span>
							</div>
							<input
								type="range"
								min="1"
								max="100"
								value={brightness}
								class="lox-slider"
								oninput={(e) =>
									setBrightness(
										parseInt(
											(e.target as HTMLInputElement)
												.value,
										),
									)}
							/>
						</div>
					{/if}
					<button
						class="toggle-btn"
						class:on={isOn}
						onclick={handleToggle}
					>
						{isOn ? "Turn Off" : "Turn On"}
					</button>
				{:else if domain === "climate"}
					<div class="control-section">
						<div class="temp-display">
							<span class="temp-value">{temperature}°</span>
							<span class="temp-unit">Target</span>
						</div>
						<div class="temp-controls">
							<button
								class="temp-btn"
								onclick={() =>
									setTemperature(temperature - 0.5)}
								aria-label="Verringern"
							>
								<svg
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<line x1="5" y1="12" x2="19" y2="12" />
								</svg>
							</button>
							<button
								class="temp-btn"
								onclick={() =>
									setTemperature(temperature + 0.5)}
								aria-label="Erhöhen"
							>
								<svg
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<line x1="12" y1="5" x2="12" y2="19" />
									<line x1="5" y1="12" x2="19" y2="12" />
								</svg>
							</button>
						</div>
					</div>
				{:else if domain === "cover"}
					<div class="control-section">
						<div class="cover-btns">
							<button
								class="action-btn"
								onclick={() =>
									$modalEntityId &&
									callHAService(
										"cover",
										"open_cover",
										{},
										{ entity_id: $modalEntityId },
									)}
								aria-label="Öffnen"
							>
								<svg
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="1.5"
								>
									<polyline points="18 15 12 9 6 15" />
								</svg>
								<span>Open</span>
							</button>
							<button
								class="action-btn"
								onclick={() =>
									$modalEntityId &&
									callHAService(
										"cover",
										"stop_cover",
										{},
										{ entity_id: $modalEntityId },
									)}
								aria-label="Stopp"
							>
								<svg
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="1.5"
								>
									<rect
										x="6"
										y="6"
										width="12"
										height="12"
										rx="1"
									/>
								</svg>
								<span>Stop</span>
							</button>
							<button
								class="action-btn"
								onclick={() =>
									$modalEntityId &&
									callHAService(
										"cover",
										"close_cover",
										{},
										{ entity_id: $modalEntityId },
									)}
								aria-label="Schließen"
							>
								<svg
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="1.5"
								>
									<polyline points="6 9 12 15 18 9" />
								</svg>
								<span>Close</span>
							</button>
						</div>
					</div>
				{:else if domain === "media_player"}
					<div class="control-section">
						<div class="media-controls">
							<button
								class="action-btn"
								onclick={() =>
									$modalEntityId &&
									callHAService(
										"media_player",
										"media_previous_track",
										{},
										{ entity_id: $modalEntityId },
									)}
								aria-label="Zurück"
							>
								<svg
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="1.5"
								>
									<polygon points="19 20 9 12 19 4" />
									<line x1="5" y1="19" x2="5" y2="5" />
								</svg>
							</button>
							<button
								class="action-btn play"
								onclick={() =>
									$modalEntityId &&
									callHAService(
										"media_player",
										"media_play_pause",
										{},
										{ entity_id: $modalEntityId },
									)}
								aria-label="Play/Pause"
							>
								{#if isOn && entity?.state === "playing"}
									<svg
										width="28"
										height="28"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="1.5"
									>
										<rect
											x="6"
											y="4"
											width="4"
											height="16"
										/>
										<rect
											x="14"
											y="4"
											width="4"
											height="16"
										/>
									</svg>
								{:else}
									<svg
										width="28"
										height="28"
										viewBox="0 0 24 24"
										fill="currentColor"
									>
										<polygon points="5 3 19 12 5 21" />
									</svg>
								{/if}
							</button>
							<button
								class="action-btn"
								onclick={() =>
									$modalEntityId &&
									callHAService(
										"media_player",
										"media_next_track",
										{},
										{ entity_id: $modalEntityId },
									)}
								aria-label="Weiter"
							>
								<svg
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="1.5"
								>
									<polygon points="5 4 15 12 5 20" />
									<line x1="19" y1="5" x2="19" y2="19" />
								</svg>
							</button>
						</div>
					</div>
				{:else}
					<button
						class="toggle-btn"
						class:on={isOn}
						onclick={handleToggle}
					>
						{isOn ? "Turn Off" : "Turn On"}
					</button>
				{/if}

				<!-- Entity info -->
				<div class="entity-info">
					<div class="info-row">
						<span class="info-label">State</span>
						<span class="info-value" class:on={isOn}
							>{entity.state}</span
						>
					</div>
					<div class="info-row">
						<span class="info-label">Entity</span>
						<span class="info-value">{$modalEntityId}</span>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: var(--bg-overlay);
		z-index: 500;
		display: flex;
		align-items: flex-end;
		justify-content: center;
	}

	.modal {
		width: 100%;
		max-width: 440px;
		max-height: 80vh;
		background: var(--bg-surface);
		border-radius: var(--radius-lg) var(--radius-lg) 0 0;
		border: 1px solid var(--border-tile);
		border-bottom: none;
		overflow-y: auto;
	}

	@media (min-width: 600px) {
		.modal {
			align-self: center;
			border-radius: var(--radius-lg);
			border-bottom: 1px solid var(--border-tile);
			margin-bottom: 0;
		}

		.modal-overlay {
			align-items: center;
		}
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-lg);
		border-bottom: 1px solid var(--border-subtle);
	}

	.modal-name {
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

	.modal-body {
		padding: var(--space-lg);
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}

	.control-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.slider-row {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.slider-icon {
		color: var(--text-secondary);
	}

	.slider-label {
		flex: 1;
		font-size: var(--font-sm);
		color: var(--text-secondary);
	}

	.slider-value {
		font-size: var(--font-sm);
		font-weight: 600;
		color: var(--accent);
		min-width: 36px;
		text-align: right;
	}

	.lox-slider {
		width: 100%;
		height: 6px;
		-webkit-appearance: none;
		appearance: none;
		background: var(--bg-primary);
		border-radius: 3px;
		cursor: pointer;
		border: none;
		padding: 0;
	}

	.lox-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: var(--accent);
		cursor: pointer;
	}

	.toggle-btn {
		padding: var(--space-md);
		border-radius: var(--radius-sm);
		font-size: var(--font-sm);
		font-weight: 600;
		background: var(--bg-primary);
		color: var(--text-secondary);
		border: 1px solid var(--border-tile);
		transition: all var(--transition-fast);
	}

	.toggle-btn.on {
		background: var(--accent-subtle);
		color: var(--accent);
		border-color: rgba(105, 179, 76, 0.2);
	}

	.toggle-btn:hover {
		background: var(--bg-surface-hover);
	}

	.temp-display {
		text-align: center;
	}

	.temp-value {
		font-size: var(--font-2xl);
		font-weight: 700;
		color: var(--cat-climate);
	}

	.temp-unit {
		font-size: var(--font-xs);
		color: var(--text-muted);
		display: block;
		margin-top: 2px;
	}

	.temp-controls {
		display: flex;
		justify-content: center;
		gap: var(--space-lg);
	}

	.temp-btn {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: var(--bg-primary);
		border: 1px solid var(--border-tile);
		color: var(--text-secondary);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all var(--transition-fast);
	}

	.temp-btn:hover {
		background: var(--bg-surface-hover);
		color: var(--text-primary);
	}

	.cover-btns,
	.media-controls {
		display: flex;
		justify-content: center;
		gap: var(--space-md);
	}

	.action-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		padding: var(--space-md);
		border-radius: var(--radius-sm);
		background: var(--bg-primary);
		border: 1px solid var(--border-tile);
		color: var(--text-secondary);
		font-size: var(--font-xs);
		min-width: 64px;
		transition: all var(--transition-fast);
	}

	.action-btn:hover {
		background: var(--bg-surface-hover);
		color: var(--text-primary);
	}

	.action-btn.play {
		color: var(--accent);
	}

	.entity-info {
		border-top: 1px solid var(--border-subtle);
		padding-top: var(--space-md);
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		font-size: var(--font-xs);
	}

	.info-label {
		color: var(--text-muted);
	}

	.info-value {
		color: var(--text-secondary);
		text-transform: capitalize;
	}

	.info-value.on {
		color: var(--accent);
	}
</style>
