module.exports = function filterBy(items, key, expected) {
    if (!Array.isArray(items) || !key) {
        return [];
    }

    const hasExpected = arguments.length >= 3;

    return items.filter((item) => {
        const value = item ? item[key] : undefined;
        return hasExpected ? value === expected : Boolean(value);
    });
};
