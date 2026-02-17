<script lang="ts">
	import "$lib/styles/global.css";
	import Header from "$lib/components/Header.svelte";
	import BottomBar from "$lib/components/BottomBar.svelte";
	import EntityModal from "$lib/components/EntityModal.svelte";
	import AddTileDialog from "$lib/components/AddTileDialog.svelte";
	import ViewEditor from "$lib/components/ViewEditor.svelte";
	import OnboardingWizard from "$lib/components/OnboardingWizard.svelte";
	import YamlEditor from "$lib/components/YamlEditor.svelte";
	import EditTileDialog from "$lib/components/EditTileDialog.svelte";
	import { onMount } from "svelte";
	import { loadConfig } from "$lib/config";
	import { connectToHA, connectAsPanel, connectWithUrl } from "$lib/hass";
	import {
		hassConnected,
		dashboardConfig,
		showOnboarding,
	} from "$lib/stores";

	let hassUrl = $state("");
	let hassToken = $state("");
	let connecting = $state(false);
	let showConnect = $state(false);
	let errorMsg = $state("");

	onMount(async () => {
		await loadConfig();

		// 1. Try panel auth (works when loaded inside HA as iframe)
		try {
			await connectAsPanel();
			checkFirstLaunch();
			return;
		} catch {
			// Not inside HA panel, continue with other methods
		}

		// 2. Try env vars (dev mode)
		const supervisorToken = import.meta.env.VITE_SUPERVISOR_TOKEN || "";
		const haUrl = import.meta.env.VITE_HASS_URL || "";

		if (supervisorToken && haUrl) {
			try {
				await connectToHA(haUrl, supervisorToken);
				checkFirstLaunch();
			} catch {
				showConnect = true;
			}
		} else {
			// 3. Try saved credentials
			const saved = localStorage.getItem("ha-loxone-credentials");
			if (saved) {
				const { url, token } = JSON.parse(saved);
				hassUrl = url;
				hassToken = token;
				try {
					await connectToHA(url, token);
					checkFirstLaunch();
				} catch {
					showConnect = true;
				}
			} else {
				showConnect = true;
			}
		}
	});

	/** Show onboarding wizard if dashboard has no real tiles */
	function checkFirstLaunch() {
		if (localStorage.getItem("loxhome-onboarding-done")) return;
		const config = $dashboardConfig;
		const hasTiles = config.views.some((v) => v.tiles.length > 0);
		if (!hasTiles && config.views.length <= 1) {
			showOnboarding.set(true);
		}
	}

	async function handleConnect() {
		if (!hassUrl) return;
		connecting = true;
		errorMsg = "";

		try {
			if (hassToken) {
				// Token provided → direct WebSocket auth
				await connectToHA(hassUrl, hassToken);
				localStorage.setItem(
					"ha-loxone-credentials",
					JSON.stringify({ url: hassUrl, token: hassToken }),
				);
			} else {
				// No token → try OAuth flow with URL
				await connectWithUrl(hassUrl);
			}
			showConnect = false;
			checkFirstLaunch();
		} catch (e) {
			errorMsg = "Verbindung fehlgeschlagen. URL und Token prüfen.";
		} finally {
			connecting = false;
		}
	}

	let { children } = $props();
</script>

{#if showConnect && !$hassConnected}
	<div class="connect-screen">
		<div class="connect-card animate-scale-in">
			<span class="connect-brand">LOXHOME</span>
			<p class="connect-subtitle">Mit Home Assistant verbinden</p>

			<div class="connect-form">
				<div class="form-group">
					<label for="hass-url">Home Assistant URL</label>
					<input
						id="hass-url"
						type="url"
						placeholder="http://homeassistant.local:8123"
						bind:value={hassUrl}
					/>
				</div>
				<div class="form-group">
					<label for="hass-token">Langlebiges Zugriffstoken</label>
					<input
						id="hass-token"
						type="password"
						placeholder="eyJ0eXAiOiJK..."
						bind:value={hassToken}
					/>
					<p class="form-hint">Profil → Langlebige Zugriffstokens</p>
				</div>

				{#if errorMsg}
					<p class="error-msg">{errorMsg}</p>
				{/if}

				<button
					class="connect-btn"
					onclick={handleConnect}
					disabled={connecting || !hassUrl}
				>
					{connecting ? "Verbinden..." : "Verbinden"}
				</button>
			</div>
		</div>
	</div>
{:else}
	<div class="app-layout">
		<Header />
		<main class="content">
			{@render children()}
		</main>
		<BottomBar />
	</div>

	<EntityModal />
	<AddTileDialog />
	<ViewEditor />
	<OnboardingWizard />
	<YamlEditor />
	<EditTileDialog />
{/if}

<style>
	/* Connect Screen */
	.connect-screen {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		background: var(--bg-primary);
		padding: var(--space-xl);
	}

	.connect-card {
		width: 100%;
		max-width: 360px;
		padding: var(--space-2xl);
		background: var(--bg-surface);
		border-radius: var(--radius-lg);
		border: 1px solid var(--border-tile);
		text-align: center;
	}

	.connect-brand {
		font-size: var(--font-xl);
		font-weight: 700;
		color: var(--accent);
		letter-spacing: 4px;
		display: block;
		margin-bottom: var(--space-xs);
	}

	.connect-subtitle {
		color: var(--text-secondary);
		font-size: var(--font-sm);
		margin-bottom: var(--space-xl);
	}

	.connect-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		text-align: left;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.form-group label {
		font-size: var(--font-xs);
		font-weight: 500;
		color: var(--text-secondary);
	}

	.form-hint {
		font-size: var(--font-2xs);
		color: var(--text-muted);
	}

	.error-msg {
		color: var(--color-error);
		font-size: var(--font-xs);
		text-align: center;
	}

	.connect-btn {
		padding: var(--space-sm) var(--space-lg);
		border-radius: var(--radius-sm);
		font-size: var(--font-sm);
		font-weight: 600;
		background: var(--accent);
		color: white;
		transition: all var(--transition-fast);
	}

	.connect-btn:hover:not(:disabled) {
		background: var(--accent-hover);
	}

	.connect-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	/* App Layout — vertical stack */
	.app-layout {
		display: flex;
		flex-direction: column;
		height: 100vh;
		overflow: hidden;
	}

	.content {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
	}
</style>
