/**
 * LoxHome Panel — custom element for HA panel_custom.
 *
 * HA sets the `hass` property on this element, which contains the
 * authenticated connection. We create an iframe to the SvelteKit app
 * and pass the auth token via postMessage.
 */
class LoxHomePanel extends HTMLElement {
    constructor() {
        super();
        this._hass = null;
        this._iframe = null;
        this._iframeReady = false;
    }

    /** Called by HA whenever the hass object updates */
    set hass(hass) {
        this._hass = hass;
        this._sendAuth();
    }

    _sendAuth() {
        if (!this._iframe || !this._iframeReady || !this._hass) return;
        try {
            this._iframe.contentWindow.postMessage({
                type: 'loxhome-auth',
                accessToken: this._hass.auth.data.access_token,
                hassUrl: this._hass.auth.data.hassUrl
            }, '*');
        } catch (e) {
            console.warn('LoxHome: failed to send auth to iframe', e);
        }
    }

    connectedCallback() {
        // Determine the base path for the SvelteKit app
        const scriptUrl = document.querySelector('script[src*="loxhome-panel"]')?.src || '';
        const basePath = scriptUrl ? scriptUrl.replace('/loxhome-panel.js', '') : '/loxhome_static';

        this._iframe = document.createElement('iframe');
        this._iframe.src = `${basePath}/index.html`;
        this._iframe.style.cssText = 'border:0;width:100%;height:100%;display:block;';
        this.style.cssText = 'display:block;width:100%;height:100%;';

        this._iframe.addEventListener('load', () => {
            this._iframeReady = true;
            // Small delay to ensure SvelteKit JS is initialized
            setTimeout(() => this._sendAuth(), 200);
        });

        // Listen for messages from the iframe
        window.addEventListener('message', (event) => {
            if (event.data?.type === 'loxhome-auth-request') {
                this._sendAuth();
            }
            // Toggle HA sidebar when iframe requests it
            if (event.data?.type === 'loxhome-toggle-sidebar') {
                try {
                    const haMain = document.querySelector('home-assistant')
                        ?.shadowRoot?.querySelector('home-assistant-main');
                    if (haMain) {
                        haMain.hass.callWS({ type: 'frontend/get_panels' }); // dummy to ensure connection
                        const drawer = haMain.shadowRoot?.querySelector('ha-drawer');
                        if (drawer) {
                            drawer.open = !drawer.open;
                        }
                    }
                } catch (e) {
                    console.warn('LoxHome: failed to toggle HA sidebar', e);
                }
            }
        });

        this.appendChild(this._iframe);
    }

    setConfig(config) {
        this._config = config;
    }
}

customElements.define('loxhome-panel', LoxHomePanel);
