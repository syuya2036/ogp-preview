"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseHtml = parseHtml;
const cheerio = __importStar(require("cheerio"));
const utils_1 = require("./utils");
function parseHtml(html, targetUrl) {
    const $ = cheerio.load(html);
    const rawMeta = {};
    // Extract all meta tags
    $('meta').each((_, el) => {
        const attribs = el.attribs;
        const property = attribs['property'] || attribs['name'];
        const content = attribs['content'];
        if (property && content) {
            rawMeta[property] = content;
        }
    });
    // Title Strategy
    let title = rawMeta['og:title'] || $('title').text() || 'No Title';
    // Description Strategy
    let description = rawMeta['og:description'] || rawMeta['description'] || 'No Description';
    // Image Strategy
    let image = rawMeta['og:image'] || rawMeta['twitter:image'] || null;
    if (image) {
        image = (0, utils_1.resolveUrl)(targetUrl, image);
    }
    return {
        url: targetUrl,
        title,
        description,
        image,
        rawMeta
    };
}
