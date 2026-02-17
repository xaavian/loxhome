<script lang="ts">
	import {
		dashboardConfig,
		activeViewId,
		editMode,
		showViewEditor,
		sidebarOpen,
	} from "$lib/stores";
	import { DEFAULT_CATEGORIES } from "$lib/types";
	import MdiIcon from "./MdiIcon.svelte";

	function selectView(id: string) {
		activeViewId.set(id);
	}

	function closeSidebar() {
		sidebarOpen.set(false);
	}
</script>

<aside class="sidebar glassmorphism" class:collapsed={!$sidebarOpen}>
	<div class="sidebar-header">
		<div class="logo">
			<div class="logo-icon">
				<svg width="28" height="28" viewBox="0 0 24 24" fill="none">
					<rect
						x="3"
						y="3"
						width="7"
						height="7"
						rx="2"
						fill="var(--accent)"
						opacity="0.9"
					/>
					<rect
						x="14"
						y="3"
						width="7"
						height="7"
						rx="2"
						fill="var(--accent)"
						opacity="0.6"
					/>
					<rect
						x="3"
						y="14"
						width="7"
						height="7"
						rx="2"
						fill="var(--accent)"
						opacity="0.6"
					/>
					<rect
						x="14"
						y="14"
						width="7"
						height="7"
						rx="2"
						fill="var(--accent)"
						opacity="0.3"
					/>
				</svg>
			</div>
			{#if $sidebarOpen}
				<span class="logo-text"
					>Lox<span class="logo-accent">Home</span></span
				>
			{/if}
		</div>
		<button
			class="collapse-btn"
			onclick={() => sidebarOpen.update((v) => !v)}
			title="Toggle sidebar"
		>
			<MdiIcon
				name={$sidebarOpen ? "mdi:chevron-left" : "mdi:chevron-right"}
				size={18}
			/>
		</button>
	</div>

	<nav class="sidebar-nav">
		<div class="nav-section">
			{#if $sidebarOpen}
				<span class="nav-label">Ansichten</span>
			{/if}
			{#each $dashboardConfig.views as view}
				<button
					class="nav-item"
					class:active={$activeViewId === view.id}
					onclick={() => selectView(view.id)}
					title={view.name}
				>
					<span class="nav-icon" style="color: {view.color}">
						<MdiIcon
							name={view.icon}
							size={20}
							color={view.color}
						/>
					</span>
					{#if $sidebarOpen}
						<span class="nav-text">{view.name}</span>
					{/if}
					{#if $activeViewId === view.id}
						<div
							class="active-indicator"
							style="background: {view.color}"
						></div>
					{/if}
				</button>
			{/each}

			{#if $editMode}
				<button
					class="nav-item add-view"
					onclick={() => showViewEditor.set(true)}
					title="Ansichten verwalten"
				>
					<span class="nav-icon"
						><MdiIcon name="mdi:plus" size={20} /></span
					>
					{#if $sidebarOpen}
						<span class="nav-text">Ansichten verwalten</span>
					{/if}
				</button>
			{/if}
		</div>

		<div class="nav-divider"></div>

		<div class="nav-section">
			{#if $sidebarOpen}
				<span class="nav-label">Kategorien</span>
			{/if}
			{#each DEFAULT_CATEGORIES as category}
				<button class="nav-item category" title={category.name}>
					<span class="nav-icon">
						<MdiIcon
							name={category.icon}
							size={20}
							color={category.color}
						/>
					</span>
					{#if $sidebarOpen}
						<span class="nav-text">{category.name}</span>
						<span
							class="nav-badge"
							style="background: {category.color}"
						></span>
					{/if}
				</button>
			{/each}
		</div>
	</nav>

	<div class="sidebar-footer">
		<button class="nav-item" title="Einstellungen">
			<span class="nav-icon"><MdiIcon name="mdi:cog" size={20} /></span>
			{#if $sidebarOpen}
				<span class="nav-text">Einstellungen</span>
			{/if}
		</button>
	</div>
</aside>

<style>
	.sidebar {
		width: var(--sidebar-width);
		height: 100%;
		display: flex;
		flex-direction: column;
		border-right: 1px solid var(--border-subtle);
		transition: width var(--transition-normal);
		overflow: hidden;
		z-index: 200;
		flex-shrink: 0;
	}

	.sidebar.collapsed {
		width: var(--sidebar-collapsed-width);
	}

	.sidebar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-md) var(--space-md);
		height: var(--header-height);
		border-bottom: 1px solid var(--border-subtle);
	}

	.logo {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.logo-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
	}

	.logo-text {
		font-size: var(--font-lg);
		font-weight: 700;
		color: var(--text-primary);
		white-space: nowrap;
	}

	.logo-accent {
		color: var(--accent);
	}

	.collapse-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: var(--radius-sm);
		color: var(--text-muted);
		transition: all var(--transition-fast);
	}

	.collapse-btn:hover {
		color: var(--text-primary);
		background: var(--bg-surface-hover);
	}

	.sidebar-nav {
		flex: 1;
		overflow-y: auto;
		padding: var(--space-sm);
	}

	.nav-section {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.nav-label {
		font-size: var(--font-xs);
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 1px;
		padding: var(--space-sm) var(--space-sm);
		margin-bottom: 2px;
	}

	.nav-divider {
		height: 1px;
		background: var(--border-subtle);
		margin: var(--space-sm) 0;
	}

	.nav-item {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-sm);
		border-radius: var(--radius-sm);
		font-size: var(--font-sm);
		color: var(--text-secondary);
		transition: all var(--transition-fast);
		position: relative;
		white-space: nowrap;
		text-align: left;
	}

	.nav-item:hover {
		background: var(--bg-surface-hover);
		color: var(--text-primary);
	}

	.nav-item.active {
		background: var(--accent-subtle);
		color: var(--accent);
	}

	.nav-icon {
		font-size: 1.1rem;
		width: 28px;
		text-align: center;
		flex-shrink: 0;
	}

	.nav-text {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.nav-badge {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.active-indicator {
		position: absolute;
		left: 0;
		top: 50%;
		transform: translateY(-50%);
		width: 3px;
		height: 60%;
		border-radius: 0 2px 2px 0;
	}

	.add-view {
		border: 1px dashed var(--border-subtle);
		color: var(--text-muted);
		margin-top: var(--space-xs);
	}

	.add-view:hover {
		border-color: var(--accent);
		color: var(--accent);
	}

	.sidebar-footer {
		padding: var(--space-sm);
		border-top: 1px solid var(--border-subtle);
	}

	.collapsed .sidebar-header {
		justify-content: center;
		padding: var(--space-md) var(--space-xs);
	}

	.collapsed .nav-item {
		justify-content: center;
		padding: var(--space-sm);
	}

	@media (max-width: 768px) {
		.sidebar {
			position: fixed;
			left: 0;
			top: 0;
			z-index: 300;
			box-shadow: var(--shadow-lg);
		}

		.sidebar.collapsed {
			transform: translateX(-100%);
		}
	}
</style>
