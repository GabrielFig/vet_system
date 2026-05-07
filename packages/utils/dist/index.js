"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSlug = generateSlug;
exports.paginate = paginate;
function generateSlug(name) {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}
function paginate(items, page, limit) {
    const total = items.length;
    const data = items.slice((page - 1) * limit, page * limit);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}
//# sourceMappingURL=index.js.map