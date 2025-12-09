import { URL } from 'url';

export function resolveUrl(base: string, path: string): string {
	try {
		const resolved = new URL(path, base);
		return resolved.toString();
	} catch (e) {
		return path; // Fallback if invalid
	}
}
