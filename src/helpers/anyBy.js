module.exports = function anyBy(items, key, expected, options) {
    if (!Array.isArray(items) || !key) {
        return options.inverse(this);
    }

    const hasExpected = items.some((item) => {
        const value = item ? item[key] : undefined;
        return value === expected;
    });

    return hasExpected ? options.fn(this) : options.inverse(this);
};
