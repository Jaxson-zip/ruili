import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const args = process.argv.slice(2);

const usage = `Usage:
  pnpm deploy:backup --env-file .env.production [--output backups/ruili-YYYYMMDD-HHMMSS] [--execute]

Options:
  --env-file <path>       Production env file used by docker compose. Default: .env.production
  --compose-file <path>   Compose file. Default: compose.yml
  --output <dir>          Backup directory. Default: backups/ruili-backup-<timestamp>
  --project-name <name>   Docker Compose project name. Default: COMPOSE_PROJECT_NAME or reactive_resume
  --execute               Run the backup. Without this flag the script prints the plan only.
  --exclude-env           Do not copy the env file into the backup directory.
  --skip-env-check        Skip pnpm deploy:check-style validation before execution.
  --json                  Print the plan as JSON.
`;

const getArgValue = (name) => {
	const index = args.indexOf(name);
	if (index === -1) return "";

	return args[index + 1] ?? "";
};

const hasFlag = (name) => args.includes(name);

if (hasFlag("--help") || hasFlag("-h")) {
	console.log(usage);
	process.exit(0);
}

const timestamp = new Date()
	.toISOString()
	.replaceAll(":", "")
	.replace(/\.\d{3}Z$/, "Z");
const envFile = path.resolve(getArgValue("--env-file") || ".env.production");
const composeFile = path.resolve(getArgValue("--compose-file") || "compose.yml");
const outputDir = path.resolve(getArgValue("--output") || path.join("backups", `ruili-backup-${timestamp}`));
const projectName = getArgValue("--project-name") || process.env.COMPOSE_PROJECT_NAME || "reactive_resume";
const execute = hasFlag("--execute");
const includeEnv = !hasFlag("--exclude-env");
const skipEnvCheck = hasFlag("--skip-env-check");
const json = hasFlag("--json");

const fail = (message) => {
	console.error(message);
	process.exit(1);
};

const readEnvFile = (filePath) => {
	const values = new Map();
	const raw = fs.readFileSync(filePath, "utf8");

	for (const line of raw.split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;

		const match = trimmed.match(/^(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)$/);
		if (!match) continue;

		let value = match[2].trim();
		if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
			value = value.slice(1, -1);
		}
		values.set(match[1], value);
	}

	return values;
};

if (!fs.existsSync(envFile)) fail(`Env file not found: ${envFile}`);
if (!fs.existsSync(composeFile)) fail(`Compose file not found: ${composeFile}`);

const env = readEnvFile(envFile);
const postgresUser = env.get("POSTGRES_USER") || "postgres";
const postgresDb = env.get("POSTGRES_DB") || "postgres";
const seaweedfsVolume = `${projectName}_seaweedfs_data`;
const redisDumpTarget = path.join(outputDir, "redis-dump.rdb");
const postgresDumpTarget = path.join(outputDir, "postgres.dump");
const seaweedfsTarget = path.join(outputDir, "seaweedfs-data.tgz");
const envSnapshotTarget = path.join(outputDir, path.basename(envFile));
const manifestTarget = path.join(outputDir, "manifest.json");

const composeArgs = ["compose", "-f", composeFile, "--env-file", envFile];
const plan = {
	ok: true,
	mode: execute ? "execute" : "plan",
	outputDir,
	envFile,
	composeFile,
	projectName,
	includeEnv,
	steps: [
		{
			name: "environment check",
			skipped: skipEnvCheck,
			command: [process.execPath, "tooling/check-production-env.mjs", envFile],
		},
		{
			name: "postgres pg_dump",
			command: [
				"docker",
				...composeArgs,
				"exec",
				"-T",
				"postgres",
				"pg_dump",
				"-U",
				postgresUser,
				"-d",
				postgresDb,
				"--format=custom",
			],
			output: postgresDumpTarget,
		},
		{
			name: "redis bgsave",
			command: ["docker", ...composeArgs, "exec", "-T", "redis", "redis-cli", "BGSAVE"],
		},
		{
			name: "redis dump copy",
			command: ["docker", ...composeArgs, "cp", "redis:/data/dump.rdb", redisDumpTarget],
		},
		{
			name: "seaweedfs volume archive",
			command: [
				"docker",
				"run",
				"--rm",
				"-v",
				`${seaweedfsVolume}:/data:ro`,
				"-v",
				`${outputDir}:/backup`,
				"busybox",
				"tar",
				"-czf",
				"/backup/seaweedfs-data.tgz",
				"-C",
				"/data",
				".",
			],
			output: seaweedfsTarget,
		},
		...(includeEnv
			? [
					{
						name: "env snapshot",
						command: ["copy", envFile, envSnapshotTarget],
						output: envSnapshotTarget,
					},
				]
			: []),
		{
			name: "manifest",
			command: ["write", manifestTarget],
			output: manifestTarget,
		},
	],
};

const printPlan = () => {
	if (json) {
		console.log(JSON.stringify(plan, null, 2));
		return;
	}

	console.log(`Ruili production backup ${execute ? "execution" : "plan"}`);
	console.log(`Output: ${outputDir}`);
	console.log(`Env: ${envFile}`);
	console.log(`Compose: ${composeFile}`);
	console.log(`Project: ${projectName}`);
	console.log("");

	for (const step of plan.steps) {
		const marker = step.skipped ? "skip" : "step";
		console.log(`[${marker}] ${step.name}`);
		console.log(`  ${step.command.join(" ")}`);
		if (step.output) console.log(`  -> ${step.output}`);
	}

	if (!execute) {
		console.log("");
		console.log("Dry run only. Add --execute to run the backup.");
	}
};

const run = (step, options = {}) => {
	const [command, ...commandArgs] = step.command;
	const result = spawnSync(command, commandArgs, {
		cwd: path.resolve("."),
		stdio: options.stdio ?? "inherit",
		maxBuffer: 1024 * 1024 * 100,
	});

	if (result.status !== 0) {
		fail(`Backup step failed: ${step.name}`);
	}

	return result;
};

printPlan();

if (!execute) process.exit(0);

fs.mkdirSync(outputDir, { recursive: true });

if (!skipEnvCheck) run(plan.steps[0]);

const postgresStep = plan.steps.find((step) => step.name === "postgres pg_dump");
const postgresFd = fs.openSync(postgresDumpTarget, "w");
try {
	run(postgresStep, { stdio: ["ignore", postgresFd, "inherit"] });
} finally {
	fs.closeSync(postgresFd);
}

run(plan.steps.find((step) => step.name === "redis bgsave"));
run(plan.steps.find((step) => step.name === "redis dump copy"));
run(plan.steps.find((step) => step.name === "seaweedfs volume archive"));

if (includeEnv) {
	fs.copyFileSync(envFile, envSnapshotTarget);
	try {
		fs.chmodSync(envSnapshotTarget, 0o600);
	} catch {
		// chmod is best-effort on Windows filesystems.
	}
}

const manifest = {
	id: crypto.randomUUID(),
	createdAt: new Date().toISOString(),
	composeFile,
	envFile: includeEnv ? path.basename(envSnapshotTarget) : null,
	projectName,
	artifacts: {
		postgres: path.basename(postgresDumpTarget),
		redis: path.basename(redisDumpTarget),
		seaweedfs: path.basename(seaweedfsTarget),
	},
	restoreNote:
		"Restore on a stopped maintenance window. Recreate the same compose project, restore Postgres with pg_restore, copy redis-dump.rdb to the redis volume, and extract seaweedfs-data.tgz into the seaweedfs volume.",
};

fs.writeFileSync(manifestTarget, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`Backup complete: ${outputDir}`);
