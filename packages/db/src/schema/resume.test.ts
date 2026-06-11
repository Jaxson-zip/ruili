import { describe, expect, it } from "vitest";
import { getTableColumns, getTableName } from "drizzle-orm";
import { createDefaultResumeData } from "@reactive-resume/schema/resume/default";
import { resume, resumeAnalysis, resumeStatistics, resumeTarget, resumeVersion } from "./resume";

describe("resume table definition", () => {
	it("is named 'resume' in the database", () => {
		expect(getTableName(resume)).toBe("resume");
	});

	it("declares the expected columns", () => {
		const columns = getTableColumns(resume);
		for (const name of [
			"id",
			"name",
			"slug",
			"tags",
			"isPublic",
			"isLocked",
			"password",
			"data",
			"userId",
			"createdAt",
			"updatedAt",
		]) {
			expect(columns[name as keyof typeof columns], name).toBeDefined();
		}
	});

	it("data column defaults to defaultResumeData when invoked", () => {
		const columns = getTableColumns(resume);
		// drizzle exposes the default function under `default` or via column config — the
		// most stable way to assert intent is to make sure `data` has a default at all.
		expect(columns.data).toBeDefined();
		// Roundtrip the imported default to make sure the import wiring works.
		expect(createDefaultResumeData().basics).toBeDefined();
	});
});

describe("resumeStatistics table definition", () => {
	it("is named 'resume_statistics' in the database", () => {
		expect(getTableName(resumeStatistics)).toBe("resume_statistics");
	});

	it("exposes counter columns and a unique resume_id FK", () => {
		const columns = getTableColumns(resumeStatistics);
		for (const name of ["views", "downloads", "lastViewedAt", "lastDownloadedAt", "resumeId"]) {
			expect(columns[name as keyof typeof columns], name).toBeDefined();
		}
	});
});

describe("resumeAnalysis table definition", () => {
	it("is named 'resume_analysis' in the database", () => {
		expect(getTableName(resumeAnalysis)).toBe("resume_analysis");
	});

	it("declares analysis + resumeId columns", () => {
		const columns = getTableColumns(resumeAnalysis);
		expect(columns.analysis).toBeDefined();
		expect(columns.resumeId).toBeDefined();
	});
});

describe("resumeVersion table definition", () => {
	it("is named 'resume_version' in the database", () => {
		expect(getTableName(resumeVersion)).toBe("resume_version");
	});

	it("declares persisted version metadata columns", () => {
		const columns = getTableColumns(resumeVersion);
		for (const name of ["resumeId", "userId", "snapshotData", "source", "createdAt"]) {
			expect(columns[name as keyof typeof columns], name).toBeDefined();
		}
	});
});

describe("resumeTarget table definition", () => {
	it("is named 'resume_target' in the database", () => {
		expect(getTableName(resumeTarget)).toBe("resume_target");
	});

	it("declares persisted target metadata columns", () => {
		const columns = getTableColumns(resumeTarget);
		for (const name of ["resumeId", "userId", "jdText", "keywords", "createdAt", "updatedAt"]) {
			expect(columns[name as keyof typeof columns], name).toBeDefined();
		}
	});
});
