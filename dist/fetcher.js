"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchHtml = fetchHtml;
async function fetchHtml(url) {
    const userAgent = 'ogp-preview-cli/1.0 (Mozilla/5.0 compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': userAgent
            }
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
        }
        return await response.text();
    }
    catch (error) {
        if (error.cause && error.cause.code === 'ECONNREFUSED') {
            throw new Error(`Failed to connect to ${url}. Is the server running?`);
        }
        throw error;
    }
}
