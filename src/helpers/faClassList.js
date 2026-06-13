const CLASS_MAP = {
    'fa-solid': 'fas',
    'fa-regular': 'far',
    'fa-light': 'fal',
    'fa-duotone': 'fad',
    'fa-house': 'fa-home',
    'fa-circle-info': 'fa-info-circle',
    'fa-people-group': 'fa-users',
    'fa-file-lines': 'fa-file-alt'
};

module.exports = function faClassList(items, separator) {
    if (!Array.isArray(items)) {
        return '';
    }

    return items
        .filter(Boolean)
        .map(item => CLASS_MAP[item] || item)
        .join(typeof separator === 'string' ? separator : ' ');
};
