#!/usr/bin/env node
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const fs = __importStar(require("fs"));
const open_1 = __importDefault(require("open"));
const path = __importStar(require("path"));
const readline = __importStar(require("readline"));
const fetcher_1 = require("./fetcher");
const generator_1 = require("./generator");
const parser_1 = require("./parser");
const program = new commander_1.Command();
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
    }
    else if (port && !targetUrl) {
        targetUrl = `http://localhost:${port}/`;
    }
    else if (targetUrl && !targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
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
        const html = await (0, fetcher_1.fetchHtml)(targetUrl);
        // 2. Parse
        console.log("Parsing metadata...");
        const ogpData = (0, parser_1.parseHtml)(html, targetUrl);
        // 3. Generate
        console.log("Generating preview...");
        const tempFileName = "ogp_preview_temp.html";
        const tempFilePath = path.resolve(process.cwd(), tempFileName);
        (0, generator_1.generatePreview)(ogpData, tempFilePath);
        // 4. Open
        console.log(`Opening in default browser: ${tempFilePath}`);
        await (0, open_1.default)(tempFilePath);
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
    }
    catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
});
program.parse();
