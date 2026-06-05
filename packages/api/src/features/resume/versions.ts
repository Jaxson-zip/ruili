import type { ResumeData } from "@reactive-resume/schema/resume/data";
import { ORPCError } from "@orpc/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@reactive-resume/db/client";
import * as schema from "@reactive-resume/db/schema";
import { protectedProcedure } from "../../context";
import { resumeDto } from "../../dto/resume";
import { resumeMutationRateLimit } from "../../middleware/rate-limit";
import { resumeService } from "./service";

const VERSION_SOURCES = new Set(["manual", "ai_patch", "import", "export"]);

export function normalizeVersionSource(source: string) {
	return VERSION_SOURCES.has(source) ? source : "manual";
}

export function cloneVersionSnapshot(data: ResumeData): ResumeData {
	return structuredClone(data);
}

export const resumeVersionsRouter = {
	list: protectedProcedure
		.route({
			method: "GET",
			path: "/resumes/{resumeId}/versions",
			tags: ["Resumes"],
			operationId: "listResumeVersions",
			summary: "List resume versions",
			description: "Lists saved version snapshots for a resume owned by the authenticated user.",
			successDescription: "A list of saved resume version snapshots.",
		})
		.input(resumeDto.versions.list.input)
		.output(resumeDto.versions.list.output)
		.handler(async ({ context, input }) => {
			await resumeService.getById({ id: input.resumeId, userId: context.user.id });

			return await db
				.select({
					id: schema.resumeVersion.id,
					resumeId: schema.resumeVersion.resumeId,
					label: schema.resumeVersion.label,
					source: schema.resumeVersion.source,
					createdAt: schema.resumeVersion.createdAt,
				})
				.from(schema.resumeVersion)
				.where(and(eq(schema.resumeVersion.resumeId, input.resumeId), eq(schema.resumeVersion.userId, context.user.id)))
				.orderBy(desc(schema.resumeVersion.createdAt));
		}),

	create: protectedProcedure
		.route({
			method: "POST",
			path: "/resumes/{resumeId}/versions",
			tags: ["Resumes"],
			operationId: "createResumeVersion",
			summary: "Create resume version",
			description: "Creates a named snapshot from the current resume data.",
			successDescription: "The ID of the created resume version.",
		})
		.input(resumeDto.versions.create.input)
		.use(resumeMutationRateLimit)
		.output(resumeDto.versions.create.output)
		.handler(async ({ context, input }) => {
			const resume = await resumeService.getById({ id: input.resumeId, userId: context.user.id });
			const [version] = await db
				.insert(schema.resumeVersion)
				.values({
					resumeId: resume.id,
					userId: context.user.id,
					label: input.label,
					source: normalizeVersionSource(input.source),
					snapshotData: cloneVersionSnapshot(resume.data),
				})
				.returning({ id: schema.resumeVersion.id });

			if (!version) throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to create resume version." });
			return version;
		}),

	restore: protectedProcedure
		.route({
			method: "POST",
			path: "/resume-versions/{id}/restore",
			tags: ["Resumes"],
			operationId: "restoreResumeVersion",
			summary: "Restore resume version",
			description: "Restores a saved resume version snapshot into its source resume.",
			successDescription: "The restored resume.",
		})
		.input(resumeDto.versions.restore.input)
		.use(resumeMutationRateLimit)
		.output(resumeDto.versions.restore.output)
		.handler(async ({ context, input }) => {
			const [version] = await db
				.select()
				.from(schema.resumeVersion)
				.where(and(eq(schema.resumeVersion.id, input.id), eq(schema.resumeVersion.userId, context.user.id)))
				.limit(1);

			if (!version) throw new ORPCError("NOT_FOUND", { message: "Resume version was not found." });

			return await resumeService.update({
				id: version.resumeId,
				userId: context.user.id,
				data: cloneVersionSnapshot(version.snapshotData),
			});
		}),
};
