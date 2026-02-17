# LoxHome

<p align="center">
  <img src="https://raw.githubusercontent.com/xaavian/loxhome/main/icon.svg" width="120" alt="LoxHome Icon" />
</p>

<p align="center">
  <strong>A Loxone-inspired custom dashboard for <a href="https://www.home-assistant.io/">Home Assistant</a></strong><br/>
  Brings the sleek, dark aesthetic and tile-based navigation of the Loxone Smart Home app to your HA setup.
</p>

<p align="center">
  <a href="https://github.com/xaavian/loxhome/releases"><img src="https://img.shields.io/github/v/release/xaavian/loxhome?style=flat-square" alt="Release" /></a>
  <a href="https://github.com/xaavian/loxhome/actions"><img src="https://img.shields.io/github/actions/workflow/status/xaavian/loxhome/ci.yml?style=flat-square" alt="CI" /></a>
  <a href="https://github.com/xaavian/loxhome/blob/main/LICENSE"><img src="https://img.shields.io/github/license/xaavian/loxhome?style=flat-square" alt="License" /></a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/xaavian/loxhome/main/docs/screenshot-favourites.png" width="45%" alt="Favourites Tab" />
  <img src="https://raw.githubusercontent.com/xaavian/loxhome/main/docs/screenshot-rooms.png" width="45%" alt="Rooms Tab" />
</p>

If you find this project useful, be sure to 🌟 this repository!

---

## ✨ Features

- **Loxone-styled UI** — dark theme with glowing accents, category-colored states, and line-art SVG icons
- **4-Tab Navigation** — Favourites, Central, Rooms, Categories — just like the real Loxone app
- **Room & Category Selectors** — large icon card grids with drill-down into entity tiles
- **13 Entity Domains** — lights, switches, climate, covers, media players, sensors, locks, alarms, fans, cameras, input booleans, automations
- **Real-time WebSocket** — live entity state updates via `home-assistant-js-websocket`
- **Drag & Drop Editing** — reorder tiles, add/remove entities, customize views
- **Responsive Design** — optimized for tablets (wall-mount), phones, and desktops
- **Persistent Config** — dashboard layouts saved in localStorage

---

## Installation

### HACS (Recommended)

> **Prerequisites:** [HACS](https://hacs.xyz/) must be installed in your Home Assistant instance.

1. Open Home Assistant and go to **HACS** in the sidebar.

2. Click the **⋮ menu** (top right) → **Custom repositories**.

3. Enter the repository URL and select the category:

   | Field | Value |
   |-------|-------|
   | **Repository** | `https://github.com/xaavian/loxhome` |
   | **Category** | `Integration` |

4. Click **Add**.

5. Search for **"LoxHome"** in HACS and click **Download**.

6. **Restart Home Assistant** (Settings → System → Restart).

7. Go to **Settings → Devices & Services → Add Integration** → search for **"LoxHome"**.

8. Click **Submit** — the LoxHome panel will appear in your sidebar.

---

### Docker

If you prefer to run LoxHome as a standalone container:

1. **Docker Compose File**: Place your edited copy of the [docker-compose.yml](https://github.com/xaavian/loxhome/blob/main/docker-compose.yml) file in a suitable directory.

2. **Create Container**:

   ```bash
   cd path/to/docker-compose.yml
   docker compose up -d loxhome
   ```

<details>
<summary>
   <b>Without Docker Compose</b>
</summary>

```bash
docker run -d \
  --name loxhome \
  --network bridge \
  -p 5050:5050 \
  -e TZ=Europe/Berlin \
  --restart always \
  ghcr.io/xaavian/loxhome
```

</details>

#### Update

To update to the latest version of LoxHome, run the following commands:

```bash
docker compose pull loxhome
docker compose up -d loxhome
```

---

## Connecting to Home Assistant

### As HACS Integration (Automatic — No Token Required)

When installed as a HACS integration, **no setup is needed**. The dashboard runs inside Home Assistant as a panel and connects automatically via WebSocket. Just open it from the sidebar and you're ready to go.

### Standalone / Docker

> **Only required when running LoxHome outside of Home Assistant** (e.g. Docker, separate server).

You need a **Long-Lived Access Token**:

1. In Home Assistant, click your **profile** (bottom-left of sidebar).
2. Scroll to **Long-Lived Access Tokens** → click **Create Token**.
3. Name it `LoxHome` → **copy the token** (won't be shown again!).
4. In the dashboard connection screen:

   | Field | Value |
   |-------|-------|
   | **Home Assistant URL** | `http://homeassistant.local:8123` |
   | **Access Token** | *(paste your token)* |

5. Click **Verbinden** (Connect).

> **💡 Tip:** Credentials are saved in `localStorage` — you only enter them once per browser.

---

## Screenshots

<p align="center">
  <img src="https://raw.githubusercontent.com/xaavian/loxhome/main/docs/screenshot-favourites.png" width="45%" alt="Favourites" />
  <img src="https://raw.githubusercontent.com/xaavian/loxhome/main/docs/screenshot-central.png" width="45%" alt="Central" />
</p>
<p align="center">
  <img src="https://raw.githubusercontent.com/xaavian/loxhome/main/docs/screenshot-rooms.png" width="45%" alt="Rooms" />
  <img src="https://raw.githubusercontent.com/xaavian/loxhome/main/docs/screenshot-categories.png" width="45%" alt="Categories" />
</p>
<p align="center">
  <img src="https://raw.githubusercontent.com/xaavian/loxhome/main/docs/screenshot-room-detail.png" width="45%" alt="Room Detail" />
  <img src="https://raw.githubusercontent.com/xaavian/loxhome/main/docs/screenshot-connect.png" width="45%" alt="Connection" />
</p>

---

## Debug

To debug any errors, check the Home Assistant logs (**Settings → System → Logs**), or use `docker logs loxhome` for Docker setups. To inspect frontend issues, open the browser's console.

---

## Develop

To begin contributing to the project, you'll need **Node.js 20+** and **npm 9+**.

```bash
# install
git clone https://github.com/xaavian/loxhome.git
cd loxhome
npm install

# server
npm run dev

# open http://localhost:5173

# build (outputs to custom_components/loxhome/frontend/)
npm run build

# type checking
npm run check
```

---

## 📄 License

MIT © 2025
