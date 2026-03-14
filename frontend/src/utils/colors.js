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
    'firebrick': '#b22222',
    'dark red': '#8b0000',
    'light red': '#ff6b6b',
    'salmon': '#fa8072',
    'tomato': '#ff6347',

    // Blues
    'blue': '#3b82f6',
    'navy': '#1e3a8a',
    'navy blue': '#1e3a8a',
    'royal blue': '#2563eb',
    'sky blue': '#0ea5e9',
    'steel blue': '#475569',
    'slate': '#475569',
    'slate gray': '#475569',
    'light blue': '#93c5fd',
    'dark blue': '#1e40af',
    'powder blue': '#b0e0e6',
    'cornflower blue': '#6495ed',
    'dodger blue': '#1e90ff',

    // Blacks
    'black': '#1a1a1a',
    'charcoal': '#374151',
    'jet': '#0a0a0a',
    'onyx': '#353839',
    'ebony': '#555d50',

    // Whites
    'white': '#ffffff',
    'ivory': '#fffff0',
    'cream': '#fdfbf7',
    'snow': '#fffafa',
    'ghost white': '#f8f8ff',
    'linen': '#faf0e6',
    'seashell': '#fff5ee',

    // Grays
    'gray': '#6b7280',
    'grey': '#6b7280',
    'silver': '#c0c0c0',
    'ash': '#b2beb5',
    'light gray': '#d1d5db',
    'dark gray': '#374151',
    'slate gray': '#708090',
    'dim gray': '#696969',
    'gainsboro': '#dcdcdc',

    // Browns
    'brown': '#92400e',
    'earth brown': '#7d6e5d',
    'tan': '#d2b48c',
    'chocolate': '#7b341e',
    'coffee': '#4a2c2a',
    'beige': '#f5f5dc',
    'saddle brown': '#8b4513',
    'sienna': '#a0522d',
    'peru': '#cd853f',
    'wheat': '#f5deb3',
    'burlywood': '#deb887',
    'raw umber': '#826644',
    'khaki': '#c3b091',

    // Greens
    'green': '#22c55e',
    'emerald': '#059669',
    'olive': '#84cc16',
    'forest green': '#166534',
    'sage': '#9dc183',
    'lime': '#32cd32',
    'mint': '#98fb98',
    'sea green': '#2e8b57',
    'light green': '#90ee90',
    'dark green': '#006400',
    'medium sea green': '#3cb371',
    'pale green': '#98fb98',
    'lawn green': '#7cfc00',

    // Purples
    'purple': '#a855f7',
    'violet': '#8b5cf6',
    'lavender': '#c4b5fd',
    'plum': '#7e22ce',
    'indigo': '#4b0082',
    'dark violet': '#9400d3',
    'medium violet red': '#c71585',
    'thistle': '#d8bfd8',
    'orchid': '#da70d6',
    'medium purple': '#9370db',
    'rebecca purple': '#663399',

    // Pinks
    'pink': '#ec4899',
    'rose': '#f43f5e',
    'magenta': '#d946ef',
    'hot pink': '#ff69b4',
    'deep pink': '#ff1493',
    'light pink': '#ffb6c1',
    'dark pink': '#c71585',
    'pale violet red': '#db7093',
    'misty rose': '#ffe4e1',

    // Oranges
    'orange': '#f97316',
    'peach': '#fed7aa',
    'coral': '#f97316',
    'terracotta': '#c2410c',
    'dark orange': '#ff8c00',
    'tangerine': '#ff9966',
    'papaya whip': '#ffefd5',
    'bisque': '#ffe4c4',
    'sandy brown': '#f4a460',

    // Yellows/Golds
    'yellow': '#eab308',
    'gold': '#ffd700',
    'mustard': '#eab308',
    'champagne': '#f7e7ce',
    'lemon chiffon': '#fffacd',
    'cornsilk': '#fff8dc',
    'moccasin': '#ffe4b5',
    'pale goldenrod': '#eee8aa',
    'khaki': '#f0e68c',
    'olive drab': '#6b8e23',
    'marigold': '#eaa221',

    // Other
    'teal': '#14b8a6',
    'cyan': '#06b6d4',
    'aqua': '#06b6d4',
    'turquoise': '#40e0d0',
    'aquamarine': '#7fffd4',
    'medium turquoise': '#48d1cc',
    'dark cyan': '#008b8b',
    'cadet blue': '#5f9ea0',
    'cadmium yellow': '#fff600',
    'zinc': '#7a7a7a',
    'bronze': '#cd7f32',
    'copper': '#b87333',
    'pewter': '#8e8e8e',
    'gunmetal': '#2a3439',
};

// Complete list of all available colors (matching backend Color model)
export const COLOR_LIST = [
    // Basic Colors
    'Black', 'White', 'Gray', 'Brown', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Purple', 'Pink',
    // Extended Colors
    'Navy Blue', 'Navy', 'Royal Blue', 'Sky Blue', 'Steel Blue', 'Slate Gray', 'Charcoal',
    'Ivory', 'Cream', 'Beige', 'Tan', 'Khaki',
    'Maroon', 'Burgundy', 'Crimson', 'Scarlet', 'Rose', 'Firebrick', 'Dark Red',
    'Emerald', 'Forest Green', 'Olive', 'Sage', 'Teal', 'Cyan', 'Aqua', 'Turquoise', 'Mint', 'Lime',
    'Lavender', 'Violet', 'Plum', 'Magenta', 'Indigo', 'Orchid',
    'Gold', 'Silver', 'Mustard', 'Champagne', 'Peach', 'Coral', 'Terracotta', 'Marigold',
    'Earth Brown', 'Coffee', 'Chocolate', 'Ash', 'Sienna', 'Saddle Brown',
    'Light Blue', 'Dark Blue', 'Light Gray', 'Dark Gray', 'Light Green', 'Dark Green',
    'Light Pink', 'Dark Pink', 'Light Purple', 'Dark Purple',
    'Light Yellow', 'Dark Yellow', 'Light Orange', 'Dark Orange',
    'Hot Pink', 'Deep Pink', 'Salmon', 'Tomato', 'Wheat', 'Burlywood',
    'Snow', 'Ghost White', 'Linen', 'Seashell', 'Misty Rose', 'Bisque',
    'Cornsilk', 'Lemon Chiffon', 'Pale Goldenrod', 'Papaya Whip',
    'Sea Green', 'Medium Sea Green', 'Lawn Green', 'Pale Green',
    'Medium Purple', 'Thistle', 'Rebecca Purple',
    'Medium Violet Red', 'Pale Violet Red',
    'Dark Violet', 'Medium Turquoise', 'Dark Cyan', 'Cadet Blue',
    'Bronze', 'Copper', 'Pewter', 'Gunmetal'
];

// Organized color palette for UI selection
export const COLOR_PALETTE = {
    neutrals: [
        { name: 'Black', hex: '#1a1a1a' },
        { name: 'White', hex: '#ffffff' },
        { name: 'Charcoal', hex: '#374151' },
        { name: 'Gray', hex: '#6b7280' },
        { name: 'Silver', hex: '#c0c0c0' },
        { name: 'Ivory', hex: '#fffff0' },
        { name: 'Cream', hex: '#fdfbf7' },
        { name: 'Beige', hex: '#f5f5dc' },
        { name: 'Tan', hex: '#d2b48c' },
        { name: 'Khaki', hex: '#c3b091' },
    ],
    blues: [
        { name: 'Navy Blue', hex: '#1e3a8a' },
        { name: 'Royal Blue', hex: '#2563eb' },
        { name: 'Blue', hex: '#3b82f6' },
        { name: 'Sky Blue', hex: '#0ea5e9' },
        { name: 'Steel Blue', hex: '#475569' },
        { name: 'Slate Gray', hex: '#708090' },
        { name: 'Light Blue', hex: '#93c5fd' },
        { name: 'Dark Blue', hex: '#1e40af' },
        { name: 'Powder Blue', hex: '#b0e0e6' },
        { name: 'Cornflower Blue', hex: '#6495ed' },
    ],
    reds: [
        { name: 'Maroon', hex: '#7f1d1d' },
        { name: 'Burgundy', hex: '#881337' },
        { name: 'Crimson', hex: '#dc2626' },
        { name: 'Red', hex: '#ef4444' },
        { name: 'Scarlet', hex: '#ef4444' },
        { name: 'Firebrick', hex: '#b22222' },
        { name: 'Dark Red', hex: '#8b0000' },
        { name: 'Salmon', hex: '#fa8072' },
        { name: 'Tomato', hex: '#ff6347' },
        { name: 'Rose', hex: '#f43f5e' },
    ],
    greens: [
        { name: 'Forest Green', hex: '#166534' },
        { name: 'Green', hex: '#22c55e' },
        { name: 'Emerald', hex: '#059669' },
        { name: 'Sage', hex: '#9dc183' },
        { name: 'Olive', hex: '#84cc16' },
        { name: 'Lime', hex: '#32cd32' },
        { name: 'Mint', hex: '#98fb98' },
        { name: 'Sea Green', hex: '#2e8b57' },
        { name: 'Light Green', hex: '#90ee90' },
        { name: 'Dark Green', hex: '#006400' },
    ],
    purples: [
        { name: 'Indigo', hex: '#4b0082' },
        { name: 'Purple', hex: '#a855f7' },
        { name: 'Violet', hex: '#8b5cf6' },
        { name: 'Plum', hex: '#7e22ce' },
        { name: 'Lavender', hex: '#c4b5fd' },
        { name: 'Magenta', hex: '#d946ef' },
        { name: 'Orchid', hex: '#da70d6' },
        { name: 'Medium Purple', hex: '#9370db' },
        { name: 'Thistle', hex: '#d8bfd8' },
        { name: 'Dark Violet', hex: '#9400d3' },
    ],
    pinks: [
        { name: 'Pink', hex: '#ec4899' },
        { name: 'Hot Pink', hex: '#ff69b4' },
        { name: 'Deep Pink', hex: '#ff1493' },
        { name: 'Light Pink', hex: '#ffb6c1' },
        { name: 'Magenta', hex: '#d946ef' },
        { name: 'Rose', hex: '#f43f5e' },
        { name: 'Pale Violet Red', hex: '#db7093' },
        { name: 'Misty Rose', hex: '#ffe4e1' },
    ],
    yellows: [
        { name: 'Gold', hex: '#ffd700' },
        { name: 'Yellow', hex: '#eab308' },
        { name: 'Mustard', hex: '#eab308' },
        { name: 'Champagne', hex: '#f7e7ce' },
        { name: 'Marigold', hex: '#eaa221' },
        { name: 'Lemon Chiffon', hex: '#fffacd' },
        { name: 'Cornsilk', hex: '#fff8dc' },
        { name: 'Pale Goldenrod', hex: '#eee8aa' },
        { name: 'Wheat', hex: '#f5deb3' },
        { name: 'Moccasin', hex: '#ffe4b5' },
    ],
    oranges: [
        { name: 'Orange', hex: '#f97316' },
        { name: 'Dark Orange', hex: '#ff8c00' },
        { name: 'Coral', hex: '#f97316' },
        { name: 'Terracotta', hex: '#c2410c' },
        { name: 'Peach', hex: '#fed7aa' },
        { name: 'Tangerine', hex: '#ff9966' },
        { name: 'Sandy Brown', hex: '#f4a460' },
        { name: 'Papaya Whip', hex: '#ffefd5' },
        { name: 'Bisque', hex: '#ffe4c4' },
        { name: 'Burlywood', hex: '#deb887' },
    ],
    browns: [
        { name: 'Brown', hex: '#92400e' },
        { name: 'Earth Brown', hex: '#7d6e5d' },
        { name: 'Coffee', hex: '#4a2c2a' },
        { name: 'Chocolate', hex: '#7b341e' },
        { name: 'Saddle Brown', hex: '#8b4513' },
        { name: 'Sienna', hex: '#a0522d' },
        { name: 'Peru', hex: '#cd853f' },
        { name: 'Bronze', hex: '#cd7f32' },
        { name: 'Copper', hex: '#b87333' },
    ],
    teals: [
        { name: 'Teal', hex: '#14b8a6' },
        { name: 'Turquoise', hex: '#40e0d0' },
        { name: 'Cyan', hex: '#06b6d4' },
        { name: 'Aqua', hex: '#06b6d4' },
        { name: 'Aquamarine', hex: '#7fffd4' },
        { name: 'Medium Turquoise', hex: '#48d1cc' },
        { name: 'Dark Cyan', hex: '#008b8b' },
        { name: 'Cadet Blue', hex: '#5f9ea0' },
    ],
};

// Get hex color from name
export const getHexColor = (colorName) => {
    if (!colorName) return '#6b7280'; // default gray

    const normalized = colorName.toLowerCase().trim();
    return COLOR_MAP[normalized] || '#6b7280';
};

// Get all available colors as array of objects (for UI dropdowns)
export const getAvailableColors = () => [
    { name: 'Black', hex: '#1a1a1a' },
    { name: 'White', hex: '#ffffff' },
    { name: 'Navy Blue', hex: '#1e3a8a' },
    { name: 'Royal Blue', hex: '#2563eb' },
    { name: 'Blue', hex: '#3b82f6' },
    { name: 'Sky Blue', hex: '#0ea5e9' },
    { name: 'Steel Blue', hex: '#475569' },
    { name: 'Slate Gray', hex: '#475569' },
    { name: 'Charcoal', hex: '#374151' },
    { name: 'Gray', hex: '#6b7280' },
    { name: 'Silver', hex: '#c0c0c0' },
    { name: 'Ivory', hex: '#fffff0' },
    { name: 'Cream', hex: '#fdfbf7' },
    { name: 'Beige', hex: '#f5f5dc' },
    { name: 'Tan', hex: '#d2b48c' },
    { name: 'Khaki', hex: '#c3b091' },
    { name: 'Earth Brown', hex: '#7d6e5d' },
    { name: 'Brown', hex: '#92400e' },
    { name: 'Coffee', hex: '#4a2c2a' },
    { name: 'Chocolate', hex: '#7b341e' },
    { name: 'Maroon', hex: '#7f1d1d' },
    { name: 'Burgundy', hex: '#881337' },
    { name: 'Crimson', hex: '#dc2626' },
    { name: 'Red', hex: '#ef4444' },
    { name: 'Scarlet', hex: '#ef4444' },
    { name: 'Rose', hex: '#f43f5e' },
    { name: 'Pink', hex: '#ec4899' },
    { name: 'Magenta', hex: '#d946ef' },
    { name: 'Purple', hex: '#a855f7' },
    { name: 'Violet', hex: '#8b5cf6' },
    { name: 'Lavender', hex: '#c4b5fd' },
    { name: 'Plum', hex: '#7e22ce' },
    { name: 'Indigo', hex: '#4b0082' },
    { name: 'Green', hex: '#22c55e' },
    { name: 'Emerald', hex: '#059669' },
    { name: 'Forest Green', hex: '#166534' },
    { name: 'Olive', hex: '#84cc16' },
    { name: 'Sage', hex: '#9dc183' },
    { name: 'Teal', hex: '#14b8a6' },
    { name: 'Turquoise', hex: '#40e0d0' },
    { name: 'Cyan', hex: '#06b6d4' },
    { name: 'Aqua', hex: '#06b6d4' },
    { name: 'Mint', hex: '#98fb98' },
    { name: 'Lime', hex: '#32cd32' },
    { name: 'Yellow', hex: '#eab308' },
    { name: 'Gold', hex: '#ffd700' },
    { name: 'Mustard', hex: '#eab308' },
    { name: 'Champagne', hex: '#f7e7ce' },
    { name: 'Orange', hex: '#f97316' },
    { name: 'Peach', hex: '#fed7aa' },
    { name: 'Coral', hex: '#f97316' },
    { name: 'Terracotta', hex: '#c2410c' },
    { name: 'Marigold', hex: '#eaa221' },
    { name: 'Ash', hex: '#b2beb5' }
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

// Get contrasting text color (black or white)
export const getContrastingTextColor = (hexColor) => {
    return isLightColor(hexColor) ? '#000000' : '#ffffff';
};

// Color selector component data - for forms
export const getColorSelectorData = () => {
    const allColors = [];

    Object.entries(COLOR_PALETTE).forEach(([category, colors]) => {
        colors.forEach(color => {
            allColors.push({
                ...color,
                category: category.charAt(0).toUpperCase() + category.slice(1)
            });
        });
    });

    return allColors;
};

// Get colors by category
export const getColorsByCategory = (category) => {
    return COLOR_PALETTE[category] || [];
};

// Get all category names
export const getColorCategories = () => Object.keys(COLOR_PALETTE);

export default {
    COLOR_MAP,
    COLOR_LIST,
    COLOR_PALETTE,
    getHexColor,
    getAvailableColors,
    extractColorsFromMaterials,
    formatColorName,
    isLightColor,
    getContrastingTextColor,
    getColorSelectorData,
    getColorsByCategory,
    getColorCategories,
};
