#!/bin/bash
#
# dock-display-reinit.sh
# Restores display layout after a Thunderbolt dock re-connect.
#
# Key: xrandr must run as the logged-in user (not root) to access X11.
# We detect the active X11 display via loginctl and run xrandr via su.
#
# Called by dock-display-reinit.service (systemd)
# Triggered by udev rule on Thunderbolt dock bind event.

LOGFILE="/var/log/dock-display-reinit.log"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') [dock-reinit] $*" | tee -a "$LOGFILE" 2>/dev/null || \
        echo "$(date '+%Y-%m-%d %H:%M:%S') [dock-reinit] $*"
}

# ── 1. Find the active X11 display (run xrandr as the user) ─────────────
# Detect the display belonging to the active local session
detect_display() {
    local user="$1"
    # Try loginctl first (works on most modern systems)
    local display=$(loginctl show-user "$user" 2>/dev/null | grep -oP 'Display=\K[^\s]+' || true)
    if [ -z "$display" ]; then
        # Fallback: grab the display from who
        display=$(who | grep "$user" | grep -oE ':[0-9]+' | head -1 || true)
    fi
    if [ -z "$display" ]; then
        display=":0"
    fi
    echo "$display"
}

RUN_USER="nate"
DETECTED_DISPLAY=$(detect_display "$RUN_USER")
export DISPLAY="$DETECTED_DISPLAY"
log "Detected DISPLAY=$DISPLAY for user $RUN_USER"

# ── 2. Force DRM connector re-probe via DPMS toggle ──────────────────────
# Toggling the DPMS node tells i915 to re-read the display pipeline.
DPMS_PATH="/sys/class/drm/card0-DP-1-0/dpms"
if [ -f "$DPMS_PATH" ]; then
    log "Toggling DPMS to force re-probe"
    echo 0 > "$DPMS_PATH" 2>/dev/null && sleep 1
    echo 1 > "$DPMS_PATH" 2>/dev/null && log "DPMS toggle done" || log "DPMS toggle skipped"
else
    log "DPMS node not found — skipping toggle"
fi

# ── 3. Wait for dock displays to enumerate ────────────────────────────────
WAIT=0
MAX_WAIT=30
log "Waiting for dock displays..."
while [ $WAIT -lt $MAX_WAIT ]; do
    # Run xrandr as the user so it can talk to X11
    COUNT=$(su "$RUN_USER" -c "xrandr --listmonitors 2>/dev/null" | grep -c "DP-1-0" || echo "0")
    COUNT=$(echo "$COUNT" | tr -d '[:space:]')
    if [ -n "$COUNT" ] && [ "$COUNT" -ge 2 ] 2>/dev/null; then
        log "Dock displays detected ($COUNT) after ${WAIT}s"
        break
    fi
    log "  polling... (${WAIT}s/${MAX_WAIT}s)"
    sleep 2
    WAIT=$((WAIT + 2))
done

# ── 4. Restore display layout (as user) ──────────────────────────────────
log "Restoring display layout as $RUN_USER"

su "$RUN_USER" -c "xrandr --output eDP-1 --off" 2>/dev/null && log "eDP-1 off" || log "eDP-1 off skipped"
su "$RUN_USER" -c "xrandr --output DP-1-0.3 --mode 2560x1080 --primary" 2>/dev/null && log "DP-1-0.3 set" || log "DP-1-0.3 config failed"
su "$RUN_USER" -c "xrandr --output DP-1-0.1 --mode 2560x1080 --right-of DP-1-0.3" 2>/dev/null && log "DP-1-0.1 set" || log "DP-1-0.1 config failed"

# ── 5. Verify ──────────────────────────────────────────────────────────────
sleep 3
COUNT=$(su "$RUN_USER" -c "xrandr --listmonitors 2>/dev/null" | grep -c "DP-1-0" || echo "0")
COUNT=$(echo "$COUNT" | tr -d '[:space:]')
if [ -n "$COUNT" ] && [ "$COUNT" -ge 2 ] 2>/dev/null; then
    log "SUCCESS: $COUNT dock displays active"
    exit 0
else
    log "WARNING: $COUNT dock displays detected (expected 2)"
    exit 1
fi
