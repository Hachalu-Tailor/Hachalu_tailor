// Backend-driven color utility.
// This file intentionally avoids hardcoded frontend color catalogs.

const DEFAULT_FALLBACK_COLOR = '#6b7280';

export const COLOR_MAP = Object.create(null);
export const COLOR_LIST = [];
export const COLOR_PALETTE = { backend: [] };

const backendColorRegistry = new Map();

const normalizeColorKey = (value) =>
    (value || '')
        .toString()
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();

const normalizeHex = (input) => {
    if (!input) return null;
    const match = input.toString().trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (!match) return null;

    const raw = match[1].toLowerCase();
    if (raw.length === 3) {
        return `#${raw.split('').map((ch) => `${ch}${ch}`).join('')}`;
    }

    return `#${raw}`;
};

const extractHex = (value) => {
    const text = (value || '').toString().trim();
    const direct = normalizeHex(text);
    if (direct) return direct;

    const embedded = text.match(/#([0-9a-f]{3}|[0-9a-f]{6})\b/i);
    return embedded ? normalizeHex(embedded[1]) : null;
};

const rgbToHex = (rgbText) => {
    const rgbMatch = rgbText.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (!rgbMatch) return null;

    const toHex = (num) => Number(num).toString(16).padStart(2, '0');
    return `#${toHex(rgbMatch[1])}${toHex(rgbMatch[2])}${toHex(rgbMatch[3])}`;
};

const resolveCssKeywordToHex = (name) => {
    if (typeof document === 'undefined' || !name) return null;

    const normalized = normalizeColorKey(name);
    const candidates = [normalized, normalized.replace(/\s+/g, '')];

    for (const candidate of candidates) {
        const el = document.createElement('span');
        el.style.color = '';
        el.style.color = candidate;
        if (!el.style.color) {
            continue;
        }

        document.body.appendChild(el);
        const resolved = window.getComputedStyle(el).color;
        document.body.removeChild(el);

        const hex = rgbToHex(resolved);
        if (hex) {
            return hex;
        }
    }

    return null;
};

const hashColorNameToHex = (name) => {
    const key = normalizeColorKey(name) || 'color';
    let hash = 0;
    for (let i = 0; i < key.length; i += 1) {
        hash = key.charCodeAt(i) + ((hash << 5) - hash);
    }

    const hue = Math.abs(hash) % 360;
    const saturation = 55;
    const lightness = 52;

    const c = (1 - Math.abs((2 * lightness) / 100 - 1)) * (saturation / 100);
    const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
    const m = lightness / 100 - c / 2;

    let r = 0;
    let g = 0;
    let b = 0;

    if (hue < 60) {
        r = c;
        g = x;
    } else if (hue < 120) {
        r = x;
        g = c;
    } else if (hue < 180) {
        g = c;
        b = x;
    } else if (hue < 240) {
        g = x;
        b = c;
    } else if (hue < 300) {
        r = x;
        b = c;
    } else {
        r = c;
        b = x;
    }

    const toHex = (channel) => Math.round((channel + m) * 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const refreshCompatibilityExports = () => {
    Object.keys(COLOR_MAP).forEach((key) => {
        delete COLOR_MAP[key];
    });

    COLOR_LIST.splice(0, COLOR_LIST.length);
    COLOR_PALETTE.backend = [];

    Array.from(backendColorRegistry.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .forEach(([name, hex]) => {
            COLOR_MAP[name] = hex;
            COLOR_LIST.push(formatColorName(name));
            COLOR_PALETTE.backend.push({ name: formatColorName(name), hex });
        });
};

export const setBackendColors = (colors = []) => {
    backendColorRegistry.clear();

    colors.forEach((color) => {
        const rawName = typeof color === 'object' ? color?.name : color;
        const key = normalizeColorKey(rawName);
        if (!key) return;

        const candidateHex =
            extractHex(typeof color === 'object' ? color?.hex_color || color?.hex || color?.name : color) ||
            hashColorNameToHex(rawName);

        backendColorRegistry.set(key, candidateHex);
    });

    refreshCompatibilityExports();
};

export const upsertBackendColor = (color) => {
    const rawName = typeof color === 'object' ? color?.name : color;
    const key = normalizeColorKey(rawName);
    if (!key) return;

    const nextHex =
        extractHex(typeof color === 'object' ? color?.hex_color || color?.hex || color?.name : color) ||
        backendColorRegistry.get(key) ||
        hashColorNameToHex(rawName);

    backendColorRegistry.set(key, nextHex);
    refreshCompatibilityExports();
};

// Get hex color from a backend color name/value.
export const getHexColor = (colorName) => {
    if (!colorName) return DEFAULT_FALLBACK_COLOR;

    if (typeof colorName === 'object') {
        const objectHex = extractHex(colorName.hex_color || colorName.hex || colorName.name);
        if (objectHex) return objectHex;
        const objectKey = normalizeColorKey(colorName.name);
        if (objectKey && backendColorRegistry.has(objectKey)) {
            return backendColorRegistry.get(objectKey);
        }
    }

    const raw = colorName.toString().trim();
    const directHex = extractHex(raw);
    if (directHex) return directHex;

    const key = normalizeColorKey(raw);
    if (backendColorRegistry.has(key)) {
        return backendColorRegistry.get(key);
    }

    const cssHex = resolveCssKeywordToHex(raw);
    if (cssHex) {
        return cssHex;
    }

    return hashColorNameToHex(raw) || DEFAULT_FALLBACK_COLOR;
};

// Extract unique colors from materials and sync backend registry as we learn them.
export const extractColorsFromMaterials = (materials = []) => {
    const colorsMap = new Map();

    materials.forEach((material) => {
        if (material?.colors && Array.isArray(material.colors)) {
            material.colors.forEach((color) => {
                const name = typeof color === 'object' ? color?.name : color;
                const key = normalizeColorKey(name);
                if (!key || colorsMap.has(key)) return;

                const hex =
                    extractHex(typeof color === 'object' ? color?.hex_color || color?.hex || color?.name : color) ||
                    getHexColor(name);

                colorsMap.set(key, { name, hex });
                upsertBackendColor({ name, hex_color: hex });
            });
        }

        if (material?.color) {
            const key = normalizeColorKey(material.color);
            if (!key || colorsMap.has(key)) return;
            const hex = getHexColor(material.color);
            colorsMap.set(key, { name: material.color, hex });
            upsertBackendColor({ name: material.color, hex_color: hex });
        }
    });

    return Array.from(colorsMap.values());
};

export const formatColorName = (colorName) => {
    if (!colorName) return '';
    return colorName
        .toString()
        .split(/[\s_-]+/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

// Check if color is light or dark
export const isLightColor = (hexColor) => {
    const normalized = normalizeHex(hexColor) || getHexColor(hexColor);
    const safeHex = normalizeHex(normalized) || DEFAULT_FALLBACK_COLOR;
    const hex = safeHex.replace('#', '');

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128;
};

export const getContrastingTextColor = (hexColor) =>
    isLightColor(hexColor) ? '#000000' : '#ffffff';

export const getColorSelectorData = () =>
    (COLOR_PALETTE.backend || []).map((color) => ({ ...color, category: 'Backend' }));

export const getColorsByCategory = (category) => {
    const key = (category || '').toString().toLowerCase();
    if (key === 'backend') {
        return COLOR_PALETTE.backend || [];
    }
    return [];
};

export const getColorCategories = () => ['backend'];

export default {
    COLOR_MAP,
    COLOR_LIST,
    COLOR_PALETTE,
    setBackendColors,
    upsertBackendColor,
    getHexColor,
    extractColorsFromMaterials,
    formatColorName,
    isLightColor,
    getContrastingTextColor,
    getColorSelectorData,
    getColorsByCategory,
    getColorCategories,
};
