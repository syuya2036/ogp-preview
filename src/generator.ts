import * as fs from 'fs';
import { OgpData } from './parser';

const HTML_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OGP Preview CLI</title>
    <style>
        :root {
            /* Light Theme Colors (Twitter-like) */
            --bg-color: #f7f9f9;
            --card-bg: #ffffff;
            --text-color: #0f1419;
            --secondary-text: #536471;
            --border-color: #cfd9de;
            --accent-color: #1d9bf0;
            --hover-bg: #eff3f4;
        }
        body {
            background-color: var(--bg-color);
            color: var(--text-color);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        h1 {
            font-size: 1.5rem;
            margin-bottom: 0.5rem;
            color: var(--text-color);
        }
        .target-url {
            color: var(--accent-color);
            font-size: 0.9rem;
            margin-bottom: 2rem;
            text-decoration: none;
        }
        .target-url:hover {
            text-decoration: underline;
        }
        .preview-container {
            width: 100%;
            max-width: 500px;
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            overflow: hidden;
            cursor: pointer;
            transition: background-color 0.2s;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .preview-container:hover {
            background-color: var(--hover-bg);
        }
        .preview-image {
            width: 100%;
            aspect-ratio: 1.91 / 1;
            background-color: #e1e8ed;
            background-size: cover;
            background-position: center;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--secondary-text);
            font-size: 0.9rem;
            border-bottom: 1px solid var(--border-color);
        }
        .preview-content {
            padding: 12px 15px;
        }
        .preview-domain {
            color: var(--secondary-text);
            font-size: 0.9rem;
            margin-bottom: 4px;
            text-transform: uppercase;
        }
        .preview-title {
            font-size: 1rem;
            font-weight: 700;
            line-height: 1.3;
            margin-bottom: 4px;
            color: var(--text-color);

            /* Truncation logic */
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
            word-break: break-word; /* Prevent long words from breaking layout */
        }
        .preview-desc {
            font-size: 0.95rem;
            color: var(--secondary-text);
            line-height: 1.35;

            /* Truncation logic */
             display: -webkit-box;
            -webkit-line-clamp: 3; /* Increased slightly */
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
            word-break: break-word; /* Prevent long words from breaking layout */
        }

        .debug-section {
            margin-top: 3rem;
            width: 100%;
            max-width: 800px;
            border-top: 1px solid var(--border-color);
            padding-top: 1rem;
        }
        details {
            background-color: #ffffff;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 10px;
        }
        summary {
            cursor: pointer;
            font-weight: bold;
            color: var(--accent-color);
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-family: monospace;
            font-size: 0.85rem;
            table-layout: fixed; /* Enforce fixed layout */
        }
        th, td {
            text-align: left;
            padding: 8px;
            border-bottom: 1px solid var(--border-color);
            color: var(--text-color);
            word-wrap: break-word; /* Wrap long words */
            overflow-wrap: break-word;
        }
        th {
            width: 30%; /* Give some fixed width to keys */
            color: var(--secondary-text);
            background-color: #f7f9f9;
        }
        .footer {
            margin-top: 4rem;
            color: var(--secondary-text);
            font-size: 0.8rem;
        }
    </style>
</head>
<body>
    <h1>OGP Preview CLI</h1>
    <a href="{TARGET_URL}" target="_blank" class="target-url">{TARGET_URL}</a>

    <!-- Preview Card -->
    <div class="preview-container">
        <div class="preview-image" style="{IMAGE_STYLE}">
            {NO_IMAGE_TEXT}
        </div>
        <div class="preview-content">
            <div class="preview-domain">{DOMAIN}</div>
            <div class="preview-title">{TITLE}</div>
            <div class="preview-desc">{DESCRIPTION}</div>
        </div>
    </div>

    <!-- Debug Section -->
    <div class="debug-section">
        <details open>
            <summary>Raw Meta Tags</summary>
            <table>
                <thead>
                    <tr>
                        <th>Property / Name</th>
                        <th>Content</th>
                    </tr>
                </thead>
                <tbody>
                    {DEBUG_ROWS}
                </tbody>
            </table>
        </details>
    </div>

    <div class="footer">
        Generated by OGP Preview CLI | Created by @syuya2036<br>
        Press Enter in terminal to close.
    </div>
</body>
</html>
`;

function escapeHtml(unsafe: string): string {
	return unsafe
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

export function generatePreview(data: OgpData, outputPath: string): void {
	let html = HTML_TEMPLATE;

	// Target URL
	html = html.replace(/\{TARGET_URL\}/g, data.url);

	// Image
	if (data.image) {
		html = html.replace("{IMAGE_STYLE}", `background-image: url('${data.image}')`);
		html = html.replace("{NO_IMAGE_TEXT}", "");
	} else {
		html = html.replace("{IMAGE_STYLE}", "");
		html = html.replace("{NO_IMAGE_TEXT}", "No Image");
	}

	// Text
	html = html.replace("{TITLE}", escapeHtml(data.title));
	html = html.replace("{DESCRIPTION}", escapeHtml(data.description));

	// Domain
	let domain = "unknown";
	try {
		domain = new URL(data.url).hostname;
	} catch { }
	html = html.replace("{DOMAIN}", domain);

	// Debug Rows (with Priority Sort)
	const priorityKeys = [
		"og:title", "og:description", "og:image", "og:url", "og:type", "og:site_name",
		"twitter:card", "twitter:title", "twitter:description", "twitter:image",
		"title", "description"
	];

	const keys = Object.keys(data.rawMeta).sort((a, b) => {
		const aPriority = priorityKeys.indexOf(a);
		const bPriority = priorityKeys.indexOf(b);

		if (aPriority !== -1 && bPriority !== -1) return aPriority - bPriority;
		if (aPriority !== -1) return -1;
		if (bPriority !== -1) return 1;
		return a.localeCompare(b);
	});

	let rows = "";
	for (const key of keys) {
		rows += `<tr><td>${escapeHtml(key)}</td><td>${escapeHtml(data.rawMeta[key])}</td></tr>`;
	}
	html = html.replace("{DEBUG_ROWS}", rows);

	fs.writeFileSync(outputPath, html);
}
