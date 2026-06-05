import { ORPCError } from "@orpc/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@reactive-resume/db/client";
import * as schema from "@reactive-resume/db/schema";
import { protectedProcedure } from "../../context";
import { resumeDto } from "../../dto/resume";
import { resumeMutationRateLimit } from "../../middleware/rate-limit";
import { resumeService } from "./service";

const KNOWN_KEYWORDS = [
	"React",
	"TypeScript",
	"Vue",
	"Node",
	"前端",
	"工程化",
	"接口联调",
	"性能优化",
	"组件抽象",
	"状态管理",
];

export function extractTargetKeywords(text: string): string[] {
	return KNOWN_KEYWORDS.filter((keyword) => text.includes(keyword));
}

export const resumeTargetsRouter = {
	list: protectedProcedure
		.route({
			method: "GET",
			path: "/resumes/{resumeId}/targets",
			tags: ["Resumes"],
			operationId: "listResumeTargets",
			summary: "List resume targets",
			description: "Lists target jobs and JD metadata saved for a resume owned by the authenticated user.",
			successDescription: "A list of saved target jobs.",
		})
		.input(resumeDto.targets.list.input)
		.output(resumeDto.targets.list.output)
		.handler(async ({ context, input }) => {
			await resumeService.getById({ id: input.resumeId, userId: context.user.id });

			return await db
				.select({
					id: schema.resumeTarget.id,
					resumeId: schema.resumeTarget.resumeId,
					label: schema.resumeTarget.label,
					roleTitle: schema.resumeTarget.roleTitle,
					company: schema.resumeTarget.company,
					jdText: schema.resumeTarget.jdText,
					keywords: schema.resumeTarget.keywords,
					createdAt: schema.resumeTarget.createdAt,
					updatedAt: schema.resumeTarget.updatedAt,
				})
				.from(schema.resumeTarget)
				.where(and(eq(schema.resumeTarget.resumeId, input.resumeId), eq(schema.resumeTarget.userId, context.user.id)))
				.orderBy(desc(schema.resumeTarget.updatedAt));
		}),

	upsert: protectedProcedure
		.route({
			method: "POST",
			path: "/resumes/{resumeId}/targets",
			tags: ["Resumes"],
			operationId: "upsertResumeTarget",
			summary: "Create or update target job",
			description: "Creates or updates JD metadata for a resume owned by the authenticated user.",
			successDescription: "The ID of the created or updated target job.",
		})
		.input(resumeDto.targets.upsert.input)
		.use(resumeMutationRateLimit)
		.output(resumeDto.targets.upsert.output)
		.handler(async ({ context, input }) => {
			await resumeService.getById({ id: input.resumeId, userId: context.user.id });
			const values = {
				resumeId: input.resumeId,
				userId: context.user.id,
				label: input.label,
				roleTitle: input.roleTitle ?? null,
				company: input.company ?? null,
				jdText: input.jdText,
				keywords: extractTargetKeywords(input.jdText),
			};

			if (input.id) {
				const [updated] = await db
					.update(schema.resumeTarget)
					.set(values)
					.where(
						and(
							eq(schema.resumeTarget.id, input.id),
							eq(schema.resumeTarget.resumeId, input.resumeId),
							eq(schema.resumeTarget.userId, context.user.id),
						),
					)
					.returning({ id: schema.resumeTarget.id });

				if (updated) return updated;
			}

			const [created] = await db.insert(schema.resumeTarget).values(values).returning({ id: schema.resumeTarget.id });
			if (!created) throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to create resume target." });
			return created;
		}),
};
