import { resolveUrl } from './utils';

export async function fetchHtml(url: string): Promise<{ html: string, finalUrl: string }> {
	// Use a standard browser User-Agent to avoid being blocked or treated as a bot
	const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
	let currentUrl = url;
	let redirects = 0;
	const maxRedirects = 10;

	while (redirects < maxRedirects) {
		try {
			const response = await fetch(currentUrl, {
				redirect: 'manual',
				headers: {
					'User-Agent': userAgent
				}
			});

			if (response.status >= 300 && response.status < 400) {
				const location = response.headers.get('location');
				if (!location) {
					throw new Error(`Redirect detected at ${currentUrl} but no Location header found.`);
				}

				currentUrl = resolveUrl(currentUrl, location);
				redirects++;
				continue;
			}

			if (!response.ok) {
				throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
			}

			const html = await response.text();
			return {
				html,
				finalUrl: currentUrl
			};
		} catch (error: any) {
			if (error.cause && error.cause.code === 'ECONNREFUSED') {
				throw new Error(`Failed to connect to ${currentUrl}. Is the server running?`);
			}
			throw error;
		}
	}

	throw new Error(`Too many redirects (limit: ${maxRedirects})`);
}
