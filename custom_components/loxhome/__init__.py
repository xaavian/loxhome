"""LoxHome — A Loxone-inspired dashboard for Home Assistant."""

from __future__ import annotations

import logging
import os

from homeassistant.components import frontend
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "frontend")
URL_BASE = f"/{DOMAIN}_static"


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up LoxHome from a config entry."""
    hass.data.setdefault(DOMAIN, {})

    # Serve built frontend files at /loxhome_static/
    await hass.http.async_register_static_paths(
        [StaticPathConfig(URL_BASE, FRONTEND_DIR, cache_headers=False)]
    )

    # Register as panel_custom so HA passes the hass object with auth
    frontend.async_register_built_in_panel(
        hass,
        component_name="custom",
        sidebar_title="LoxHome",
        sidebar_icon="mdi:view-dashboard",
        frontend_url_path=DOMAIN,
        config={
            "_panel_custom": {
                "name": "loxhome-panel",
                "embed_iframe": False,
                "trust_external": False,
                "js_url": f"{URL_BASE}/loxhome-panel.js",
            }
        },
        require_admin=False,
    )

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    frontend.async_remove_panel(hass, DOMAIN)
    hass.data.pop(DOMAIN, None)
    return True
