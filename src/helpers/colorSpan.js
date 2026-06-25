const Handlebars = require('handlebars');

const COLOR_CLASSES = {
    primary: 'text-color-primary',
    secondary: 'text-color-secondary'
};

const COLOR_VALUES = {
    primary: '#52666f',
    secondary: '#ab4d3a'
};

function normalizeShade(value) {
    const shade = Number(value === undefined || value === null ? 100 : value);

    if (Number.isNaN(shade)) {
        return 100;
    }

    return Math.min(100, Math.max(0, shade));
}

function mixWithWhite(hexColor, shade) {
    const normalizedHex = hexColor.replace('#', '');
    const color = {
        red: parseInt(normalizedHex.slice(0, 2), 16),
        green: parseInt(normalizedHex.slice(2, 4), 16),
        blue: parseInt(normalizedHex.slice(4, 6), 16)
    };
    const colorWeight = shade / 100;

    const toHex = (channel) => {
        const mixedChannel = Math.round((channel * colorWeight) + (255 * (1 - colorWeight)));
        return mixedChannel.toString(16).padStart(2, '0');
    };

    return `#${toHex(color.red)}${toHex(color.green)}${toHex(color.blue)}`;
}

module.exports = function colorSpan(color, textOrOptions, maybeOptions) {
    const key = String(color || '').toLowerCase();
    const className = COLOR_CLASSES[key];
    const colorValue = COLOR_VALUES[key];
    const isInline = Boolean(maybeOptions);
    const options = isInline ? maybeOptions : textOrOptions;

    if (!className) {
        return isInline ? Handlebars.escapeExpression(textOrOptions || '') : options.fn(this);
    }

    const content = isInline
        ? Handlebars.escapeExpression(textOrOptions || '')
        : options.fn(this);
    const shade = normalizeShade(options.hash && options.hash.shade);
    const style = shade === 100
        ? ''
        : ` style="color: ${mixWithWhite(colorValue, shade)};"`;

    return new Handlebars.SafeString(`<span class="${className}"${style}>${content}</span>`);
};
