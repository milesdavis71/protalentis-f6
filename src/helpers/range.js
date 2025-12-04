// Használat: {{#range 1 count pad=2}} ... {{/range}}
// A belső blokkban {{this}} lesz a (paddingolt) szám, pl. "01", "02", ...
module.exports = function range(start, end, options) {
    const pad = parseInt((options.hash || {}).pad, 10) || 0;
    const from = Number(start) || 1;
    const to = Number(end) || 0;
    let out = '';
    for (let i = from; i <= to; i++) {
        const v = pad ? String(i).padStart(pad, '0') : String(i);
        out += options.fn(v);
    }
    return out;
};