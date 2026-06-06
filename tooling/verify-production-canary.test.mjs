import { spawn } from "node:child_process";
import http from "node:http";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const scriptPath = path.resolve("tooling/verify-production-canary.mjs");
const expectedTemplateAssetPaths = [
	"/templates/jpg/ditto.jpg",
	"/templates/jpg/scizor.jpg",
	"/templates/jpg/onyx.jpg",
	"/templates/jpg/azurill.jpg",
	"/templates/jpg/collection001.jpg",
	"/templates/jpg/collection002.jpg",
	"/templates/jpg/collection003.jpg",
	"/templates/jpg/collection005.jpg",
	"/templates/jpg/collection016.jpg",
	"/templates/jpg/collection020.jpg",
	"/templates/jpg/collection021.jpg",
	"/templates/jpg/collection024.jpg",
];

let server;
let origin;
let requestedPaths;

const imageBody = Buffer.alloc(12_000, 1);

const listen = (server) =>
	new Promise((resolve, reject) => {
		server.once("error", reject);
		server.listen(0, "127.0.0.1", () => {
			server.off("error", reject);
			resolve();
		});
	});

beforeEach(async () => {
	requestedPaths = [];
	server = http.createServer((request, response) => {
		const url = new URL(request.url ?? "/", "http://127.0.0.1");
		requestedPaths.push(url.pathname);

		if (url.pathname === "/api/health") {
			response.writeHead(200, { "content-type": "application/json" });
			response.end(
				JSON.stringify({ database: { status: "healthy" }, status: "healthy", storage: { status: "healthy" } }),
			);
			return;
		}

		if (url.pathname === "/") {
			response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
			response.end('<!doctype html><html><body><script type="module" src="/src/main.tsx"></script></body></html>');
			return;
		}

		if (expectedTemplateAssetPaths.includes(url.pathname)) {
			response.writeHead(200, { "content-type": "image/jpeg" });
			response.end(imageBody);
			return;
		}

		response.writeHead(404, { "content-type": "text/plain" });
		response.end("not found");
	});

	await listen(server);
	const address = server.address();
	if (!address || typeof address === "string") throw new Error("Expected test server to listen on a TCP port.");
	origin = `http://127.0.0.1:${address.port}`;
});

afterEach(async () => {
	if (!server) return;
	await new Promise((resolve, reject) => {
		server.close((error) => (error ? reject(error) : resolve()));
	});
	server = undefined;
});

const runScript = (args) =>
	new Promise((resolve) => {
		const child = spawn(process.execPath, [scriptPath, ...args], {
			cwd: path.resolve("."),
			stdio: ["ignore", "pipe", "pipe"],
		});
		let stdout = "";
		let stderr = "";

		child.stdout.setEncoding("utf8");
		child.stderr.setEncoding("utf8");
		child.stdout.on("data", (chunk) => {
			stdout += chunk;
		});
		child.stderr.on("data", (chunk) => {
			stderr += chunk;
		});
		child.on("close", (status) => {
			resolve({ status, stdout, stderr });
		});
	});

describe("verify-production-canary", () => {
	it("checks health, homepage HTML, and every production template asset", async () => {
		const result = await runScript(["--url", origin, "--allow-local", "--skip-browser"]);

		if (result.status !== 0)
			throw new Error(`Expected canary to pass.\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
		const payload = JSON.parse(result.stdout);
		expect(payload.ok).toBe(true);
		expect(payload.checks.map((check) => check.name)).toEqual(["health", "homepage html", "template assets"]);
		expect(requestedPaths).toEqual(["/api/health", "/", ...expectedTemplateAssetPaths]);
	});

	it("rejects non-HTTPS URLs unless local verification is explicitly allowed", async () => {
		const result = await runScript(["--url", origin, "--skip-browser"]);

		expect(result.status).not.toBe(0);
		expect(result.stderr).toContain("https:// URL");
	});
});
