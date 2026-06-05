type ProductionEnvName =
	| "APP_URL"
	| "AUTH_SECRET"
	| "DATABASE_URL"
	| "ENCRYPTION_SECRET"
	| "S3_ACCESS_KEY_ID"
	| "S3_SECRET_ACCESS_KEY";

type IsProductionEnvValueSafeInput = {
	name: ProductionEnvName;
	nodeEnv: string | undefined;
	value: string;
};

const exampleSecrets = new Set([
	"change-me-to-a-secure-secret-key-in-production",
	"change-me-to-a-secure-agent-secret-in-production",
]);

function isLocalhostUrl(value: string) {
	try {
		const url = new URL(value);
		return ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
	} catch {
		return false;
	}
}

function isDefaultPostgresUrl(value: string) {
	try {
		const url = new URL(value);
		return url.username === "postgres" && url.password === "postgres";
	} catch {
		return false;
	}
}

export function isProductionEnvValueSafe({ name, nodeEnv, value }: IsProductionEnvValueSafeInput) {
	if (nodeEnv !== "production") return true;
	if (value.toLowerCase().includes("change-me")) return false;

	if (name === "AUTH_SECRET" || name === "ENCRYPTION_SECRET") return !exampleSecrets.has(value);
	if (name === "APP_URL") return value.startsWith("https://") && !isLocalhostUrl(value);
	if (name === "DATABASE_URL") return !isDefaultPostgresUrl(value);
	if (name === "S3_ACCESS_KEY_ID" || name === "S3_SECRET_ACCESS_KEY") return value !== "seaweedfs";

	return true;
}

export function productionSafetyMessage(name: ProductionEnvName) {
	return `${name} uses an unsafe example value for production. Set a real production value before starting the app.`;
}
