const TOUCH_KEY = 'br_touch_controls';

function isTouchDevice() {
    try {
        if (window.matchMedia) return window.matchMedia('(pointer: coarse)').matches;
    } catch (e) { /* fall through */ }
    return (navigator.maxTouchPoints || 0) > 0;
}

// Saved choice wins; otherwise on for touch devices, off for desktop.
export function touchControlsEnabled() {
    try {
        const saved = localStorage.getItem(TOUCH_KEY);
        if (saved !== null) return saved === '1';
    } catch (e) { /* storage blocked */ }
    return isTouchDevice();
}

export function setTouchControls(on) {
    try {
        localStorage.setItem(TOUCH_KEY, on ? '1' : '0');
    } catch (e) { /* storage blocked */ }
}
