"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveUrl = resolveUrl;
const url_1 = require("url");
function resolveUrl(base, path) {
    try {
        const resolved = new url_1.URL(path, base);
        return resolved.toString();
    }
    catch (e) {
        return path; // Fallback if invalid
    }
}
