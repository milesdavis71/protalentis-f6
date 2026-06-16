module.exports = function lt(a, b, options) {
    return Number(a) < Number(b) ? options.fn(this) : options.inverse(this);
};
