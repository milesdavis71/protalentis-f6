const Handlebars = require('handlebars');

const COLOR_CLASSES = {
    primary: 'text-color-primary',
    secondary: 'text-color-secondary'
};

module.exports = function colorSpan(color, textOrOptions, maybeOptions) {
    const key = String(color || '').toLowerCase();
    const className = COLOR_CLASSES[key];
    const isInline = Boolean(maybeOptions);
    const options = isInline ? maybeOptions : textOrOptions;

    if (!className) {
        return isInline ? Handlebars.escapeExpression(textOrOptions || '') : options.fn(this);
    }

    const content = isInline
        ? Handlebars.escapeExpression(textOrOptions || '')
        : options.fn(this);

    return new Handlebars.SafeString(`<span class="${className}">${content}</span>`);
};
