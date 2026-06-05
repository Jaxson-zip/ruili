import { spawnSync } from "node:child_process";

const appUrl = process.env.APP_URL_OVERRIDE ?? "http://localhost:3000";

const checks = [
	{
		name: "health",
		run: () =>
			spawnSync(
				process.execPath,
				[
					"-e",
					`fetch(${JSON.stringify(`${appUrl}/api/health`)}).then((r)=>{if(!r.ok)process.exit(1);return r.text()}).then(console.log).catch((error)=>{console.error(error);process.exit(1)})`,
				],
				{
					stdio: "inherit",
				},
			),
	},
	{ name: "homepage templates", command: ["tooling/verify-homepage-templates.mjs"] },
	{ name: "template starter", command: ["tooling/verify-template-starter.mjs"] },
	{ name: "builder quick edit and JSON import", command: ["tooling/verify-builder-quick-edit.mjs"] },
	{ name: "PDF and DOCX export downloads", command: ["tooling/verify-export-downloads.mjs"] },
	{ name: "DOCX template export", command: ["tooling/verify-docx-template-export.mjs"] },
];

const startedAt = Date.now();

for (const check of checks) {
	console.log(`\n=== ${check.name} ===`);
	const result = check.run
		? check.run()
		: spawnSync(process.execPath, check.command, {
				stdio: "inherit",
				env: process.env,
			});

	if (result.status !== 0) {
		console.error(`\nBeta smoke failed: ${check.name}`);
		process.exit(result.status ?? 1);
	}
}

console.log(
	JSON.stringify(
		{
			ok: true,
			appUrl,
			checks: checks.map((check) => check.name),
			durationMs: Date.now() - startedAt,
		},
		null,
		2,
	),
);
