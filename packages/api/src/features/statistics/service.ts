import fs from "node:fs/promises";
import { dirname, join } from "node:path";
import { count } from "drizzle-orm";
import { db } from "@reactive-resume/db/client";
import * as schema from "@reactive-resume/db/schema";
import { env } from "@reactive-resume/env/server";
import { getLocalDataDirectory } from "@reactive-resume/utils/monorepo.node";

const CACHE_DURATION_MS = 6 * 60 * 60 * 1000; // 6 hours
const GITHUB_API_URL = "https://api.github.com/repos/amruthpillai/reactive-resume";
const GITHUB_REQUEST_TIMEOUT_MS = 5_000;
const GITHUB_REQUEST_MAX_ATTEMPTS = 2;

const LAST_KNOWN_GITHUB_STARS = 34_073;

const getCachePath = (key: string) => join(getLocalDataDirectory(env.LOCAL_STORAGE_PATH), "statistics", `${key}.txt`);

const readCache = async (key: string): Promise<number | null> => {
	try {
		const filePath = getCachePath(key);
		const [stats, contents] = await Promise.all([fs.stat(filePath), fs.readFile(filePath, "utf-8")]);

		if (stats.mtimeMs < Date.now() - CACHE_DURATION_MS) return null;

		const value = Number.parseInt(contents, 10);
		return Number.isFinite(value) && value >= 0 ? value : null;
	} catch {
		return null;
	}
};

const writeCache = async (key: string, value: number) => {
	try {
		const filePath = getCachePath(key);
		await fs.mkdir(dirname(filePath), { recursive: true });

		const contents = String(value);
		try {
			if ((await fs.readFile(filePath, "utf-8")) === contents) return;
		} catch {
			// Cache file does not exist yet.
		}

		await fs.writeFile(filePath, contents, "utf-8");
	} catch {
		// Ignore errors, cache is not critical
	}
};

const getCachedCount = async (key: string, fetcher: () => Promise<number | null>): Promise<number | null> => {
	const cached = await readCache(key);
	if (cached !== null) return cached;

	try {
		const value = await fetcher();
		if (value !== null) {
			await writeCache(key, value);
			return value;
		}
	} catch {
		// Ignore errors, hide instance statistics rather than showing upstream numbers.
	}

	return null;
};

const getCachedCountWithFallback = async (
	key: string,
	lastKnown: number,
	fetcher: () => Promise<number | null>,
): Promise<number> => {
	const value = await getCachedCount(key, fetcher);
	return value ?? lastKnown;
};

const getCountFromDatabase = async (table: typeof schema.user | typeof schema.resume): Promise<number | null> => {
	const [result] = await db.select({ count: count() }).from(table);
	if (!result) return null;
	return result.count;
};

const fetchGitHubStarsOnce = async (): Promise<number | null> => {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), GITHUB_REQUEST_TIMEOUT_MS);

	try {
		const response = await fetch(GITHUB_API_URL, {
			signal: controller.signal,
			headers: {
				Accept: "application/vnd.github+json",
			},
		});
		if (!response.ok) return null;

		const data = (await response.json()) as { stargazers_count?: unknown };
		const stars = Number(data.stargazers_count);
		return Number.isFinite(stars) && stars > 0 ? stars : null;
	} catch {
		return null;
	} finally {
		clearTimeout(timeoutId);
	}
};

const getGitHubStars = async (attempt = 1): Promise<number | null> => {
	if (attempt > GITHUB_REQUEST_MAX_ATTEMPTS) return null;

	const stars = await fetchGitHubStarsOnce();
	return stars ?? getGitHubStars(attempt + 1);
};

export const statisticsService = {
	user: {
		getCount: () => {
			return getCachedCount("instance-users", () => getCountFromDatabase(schema.user));
		},
	},
	resume: {
		getCount: () => {
			return getCachedCount("instance-resumes", () => getCountFromDatabase(schema.resume));
		},
	},
	github: {
		getStarCount: () => {
			return getCachedCountWithFallback("stars", LAST_KNOWN_GITHUB_STARS, getGitHubStars);
		},
	},
};
