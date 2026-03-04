// Color utility for mapping color names to hex values and vice versa
// Based on backend Color model (name field)

// Predefined color mappings with hex values
export const COLOR_MAP = {
    // Reds
    'red': '#ef4444',
    'crimson': '#dc2626',
    'maroon': '#7f1d1d',
    'burgundy': '#881337',
    'scarlet': '#ef4444',

    // Blues
    'blue': '#3b82f6',
    'navy': '#1e3a8a',
    'navy blue': '#1e3a8a',
    'royal blue': '#2563eb',
    'sky blue': '#0ea5e9',
    'steel blue': '#475569',
    'slate': '#475569',
    'slate gray': '#475569',

    // Blacks
    'black': '#1a1a1a',
    'charcoal': '#374151',

    // Whites
    'white': '#ffffff',
    'ivory': '#fffff0',
    'cream': '#fdfbf7',

    // Grays
    'gray': '#6b7280',
    'grey': '#6b7280',
    'silver': '#c0c0c0',
    'ash': '#b2beb5',

    // Browns
    'brown': '#92400e',
    'earth brown': '#7d6e5d',
    'tan': '#d2b48c',
    'chocolate': '#7b341e',
    'coffee': '#4a2c2a',
    'beige': '#f5f5dc',

    // Greens
    'green': '#22c55e',
    'emerald': '#059669',
    'olive': '#84cc16',
    'forest green': '#166534',
    'sage': '#9dc183',

    // Purples
    'purple': '#a855f7',
    'violet': '#8b5cf6',
    'lavender': '#c4b5fd',
    'plum': '#7e22ce',

    // Pinks
    'pink': '#ec4899',
    'rose': '#f43f5e',
    'magenta': '#d946ef',

    // Oranges
    'orange': '#f97316',
    'peach': '#fed7aa',
    'coral': '#f97316',
    'terracotta': '#c2410c',

    // Yellows/Golds
    'yellow': '#eab308',
    'gold': '#ffd700',
    'mustard': '#eab308',
    'champagne': '#f7e7ce',

    // Other
    'teal': '#14b8a6',
    'cyan': '#06b6d4',
    'aqua': '#06b6d4',
    'beige': '#f5f5dc',
    'navy': '#1e3a8a',
};

// Get hex color from name
export const getHexColor = (colorName) => {
    if (!colorName) return '#6b7280'; // default gray

    const normalized = colorName.toLowerCase().trim();
    return COLOR_MAP[normalized] || '#6b7280';
};

// Get all available colors as array
export const getAvailableColors = () => [
    { name: 'Black', hex: '#1a1a1a' },
    { name: 'Navy Blue', hex: '#1e3a8a' },
    { name: 'Charcoal', hex: '#374151' },
    { name: 'Gray', hex: '#6b7280' },
    { name: 'Slate Gray', hex: '#475569' },
    { name: 'White', hex: '#ffffff' },
    { name: 'Cream', hex: '#fdfbf7' },
    { name: 'Earth Brown', hex: '#7d6e5d' },
    { name: 'Tan', hex: '#d2b48c' },
    { name: 'Blue', hex: '#3b82f6' },
    { name: 'Royal Blue', hex: '#2563eb' },
    { name: 'Green', hex: '#22c55e' },
    { name: 'Red', hex: '#ef4444' },
    { name: 'Burgundy', hex: '#881337' },
    { name: 'Pink', hex: '#ec4899' },
    { name: 'Purple', hex: '#a855f7' },
    { name: 'Gold', hex: '#ffd700' },
    { name: 'Silver', hex: '#c0c0c0' },
    { name: 'Olive', hex: '#84cc16' },
    { name: 'Teal', hex: '#14b8a6' },
];

// Extract unique colors from materials
export const extractColorsFromMaterials = (materials) => {
    const colorsMap = new Map();

    materials.forEach(material => {
        // Handle colors array from backend
        if (material.colors && Array.isArray(material.colors)) {
            material.colors.forEach(color => {
                const name = typeof color === 'object' ? color.name : color;
                if (name && !colorsMap.has(name.toLowerCase())) {
                    colorsMap.set(name.toLowerCase(), {
                        name: name,
                        hex: getHexColor(name)
                    });
                }
            });
        }

        // Handle legacy color field
        if (material.color) {
            const colorName = material.color;
            if (!colorsMap.has(colorName.toLowerCase())) {
                colorsMap.set(colorName.toLowerCase(), {
                    name: colorName,
                    hex: getHexColor(colorName)
                });
            }
        }
    });

    return Array.from(colorsMap.values());
};

// Format color name for display
export const formatColorName = (colorName) => {
    if (!colorName) return '';
    return colorName
        .split(/[\s_-]+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

// Check if color is light or dark
export const isLightColor = (hexColor) => {
    if (!hexColor) return true;

    // Remove # if present
    const hex = hexColor.replace('#', '');

    // Parse RGB values
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Calculate brightness (perceived luminance)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    return brightness > 128;
};

export default {
    COLOR_MAP,
    getHexColor,
    getAvailableColors,
    extractColorsFromMaterials,
    formatColorName,
    isLightColor,
};
