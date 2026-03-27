# ThinkPad Dock Display Fix — Design

**Date:** 2026-03-27
**Status:** Approved for implementation
**Approach:** Approach 2 — systemd service + udev rule for automated display re-initialization

---

## Problem Statement

On a **Lenovo ThinkPad P53** (Intel UHD 630 iGPU + NVIDIA Quadro RTX 4000) connected to a **Lenovo ThinkPad Thunderbolt 4 Workstation Dock (40B0)** driving two **LG 29WK600 ultrawide monitors**, the external displays intermittently drop out and fail to re-establish without manual intervention (unplugging dock, closing lid, reconnecting).

**Current working state (when detected):**
- `DP-1-0.3` — left LG ultrawide, primary, 2560x1080 @ 60Hz
- `DP-1-0.1` — right LG ultrawide, 2560x1080 @ 60Hz
- `eDP-1` — laptop screen, 3840x2160 @ 60Hz

**Root cause:** When the Thunderbolt link re-authenticates (on wake, hotplug, or GPU state change), the i915 DRM driver fails to re-establish the display pipeline to the dock's downstream DP ports. The manual unplug/lid-close ritual forces a full DRM pipeline teardown and rebuild.

---

## Approach 2: Automated Dock Display Re-initialization

### Components

1. **udev rule** — `/etc/udev/rules.d/99-thunderbolt-dock-display.rules`
   - Watches for Thunderbolt device events on the active dock's domain: `c0030000-0080-841e-8320-351e56221924`
   - On `bind` (device added/authorized), triggers `dock-display-reinit.service`

2. **systemd service** — `/etc/systemd/system/dock-display-reinit.service`
   - A oneshot service with `After=bolt.service`
   - Adds a 3-second delay to let the Thunderbolt link stabilize before re-init
   - Calls `/usr/local/bin/dock-display-reinit.sh`

3. **Re-initialization script** — `/usr/local/bin/dock-display-reinit.sh`
   - Unbinds/rebinds the i915 kernel module to force full DRM pipeline reset
   - Waits for display enumeration
   - Restores display layout via `xrandr`
   - Logs outcome to syslog

### Display Layout

```
[ LG Ultrawide #1 (left) ] [ LG Ultrawide #2 (right) ] [ eDP-1 laptop ]
   DP-1-0.3 @2560x1080        DP-1-0.1 @2560x1080       eDP-1 @3840x2160
   primary                    right-of #1                off (not presentation)
```

### Rollback Plan (if something breaks)

```bash
# Stop and disable the service
sudo systemctl stop dock-display-reinit.service
sudo systemctl disable dock-display-reinit.service

# Remove udev rule
sudo rm /etc/udev/rules.d/99-thunderbolt-dock-display.rules
sudo udevadm control --reload-rules

# Remove script
sudo rm /usr/local/bin/dock-display-reinit.sh

# Remove service
sudo rm /etc/systemd/system/dock-display-reinit.service
sudo systemctl daemon-reload
```

---

## Implementation Plan

1. Create `/usr/local/bin/dock-display-reinit.sh`
2. Create `/etc/systemd/system/dock-display-reinit.service`
3. Create `/etc/udev/rules.d/99-thunderbolt-dock-display.rules`
4. Run `sudo udevadm control --reload-rules`
5. Run `sudo systemctl daemon-reload`
6. Enable and start the service: `sudo systemctl enable --now dock-display-reinit.service`
7. Test by physically disconnecting and reconnecting the Thunderbolt cable

---

## Current System State (diagnostic reference)

```
GPU: Intel UHD 630 (iGPU drives display) + NVIDIA Quadro RTX 4000 (compute only)
Dock: Lenovo ThinkPad Thunderbolt 4 Workstation Dock (40B0), 230W
Dock Thunderbolt domain: c0030000-0080-841e-8320-351e56221924
Monitors: 2x LG 29WK600 ultrawide (2560x1080 each)
Laptop: eDP-1 @ 3840x2160
xrandr providers: modesetting (Intel iGPU, Source Output), NVIDIA-G0 (Sink Output)
boltctl: dock currently authorized and connected
```
