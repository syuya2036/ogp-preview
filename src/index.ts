#!/usr/bin/env node
import { Command } from 'commander';
import * as fs from 'fs';
import open from 'open';
import * as path from 'path';
import * as readline from 'readline';
import { fetchHtml } from './fetcher';
import { generatePreview } from './generator';
import { parseHtml } from './parser';

const program = new Command();

program
	.name('ogp-preview')
	.description('Preview OGP settings for localhost or remote URLs')
	.version('1.0.0')
	.argument('[url]', 'Preview target URL')
	.option('-p, --port <number>', 'Optional port to override or construct URL')
	.action(async (urlArg, options) => {
		let targetUrl = urlArg;
		const port = options.port;

		// URL Construction Logic
		if (port && targetUrl) {
			if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
				const pathPart = targetUrl.replace(/^\/+/, '');
				targetUrl = `http://localhost:${port}/${pathPart}`;
			}
		} else if (port && !targetUrl) {
			targetUrl = `http://localhost:${port}/`;
		} else if (targetUrl && !targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
			targetUrl = `http://${targetUrl}`;
		}

		if (!targetUrl) {
			program.help();
			return;
		}

		console.log(`Previewing URL: ${targetUrl}`);

		try {
			// 1. Fetch
			console.log("Fetching HTML...");
			const html = await fetchHtml(targetUrl);

			// 2. Parse
			console.log("Parsing metadata...");
			const ogpData = parseHtml(html, targetUrl);

			// 3. Generate
			console.log("Generating preview...");
			const tempFileName = "ogp_preview_temp.html";
			const tempFilePath = path.resolve(process.cwd(), tempFileName);
			generatePreview(ogpData, tempFilePath);

			// 4. Open
			console.log(`Opening in default browser: ${tempFilePath}`);
			await open(tempFilePath);

			// 5. Cleanup
			const rl = readline.createInterface({
				input: process.stdin,
				output: process.stdout
			});

			rl.question('\nPress [Enter] to close and clean up...', () => {
				if (fs.existsSync(tempFilePath)) {
					fs.unlinkSync(tempFilePath);
					console.log("Cleaned up.");
				}
				rl.close();
				process.exit(0);
			});

		} catch (error: any) {
			console.error(`Error: ${error.message}`);
			process.exit(1);
		}
	});

program.parse();
