import * as cheerio from 'cheerio';
import { resolveUrl } from './utils';

export interface OgpData {
	url: string;
	title: string;
	description: string;
	image: string | null;
	rawMeta: Record<string, string>;
}

export function parseHtml(html: string, targetUrl: string): OgpData {
	const $ = cheerio.load(html);
	const rawMeta: Record<string, string> = {};

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
		image = resolveUrl(targetUrl, image);
	}

	return {
		url: targetUrl,
		title,
		description,
		image,
		rawMeta
	};
}
