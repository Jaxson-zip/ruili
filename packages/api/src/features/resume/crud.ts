import { ORPCError } from "@orpc/client";
import { sampleResumeData } from "@reactive-resume/schema/resume/sample";
import { generateId, generateRandomName } from "@reactive-resume/utils/string";
import { protectedProcedure } from "../../context";
import { resumeDto } from "../../dto/resume";
import { aiRequestRateLimit, resumeMutationRateLimit } from "../../middleware/rate-limit";
import { buildJobDerivedResumeName } from "../ai/derive-resume";
import { aiService } from "../ai/service";
import { aiProvidersService } from "../ai-providers/service";
import { buildImportedResumeSlug, resolveImportedResumeLocale, resolveImportedResumeName } from "./import";
import { resumeService } from "./service";

export const crudRouter = {
	list: protectedProcedure
		.route({
			method: "GET",
			path: "/resumes",
			tags: ["Resumes"],
			operationId: "listResumes",
			summary: "List all resumes",
			description:
				"Returns a list of all resumes belonging to the authenticated user. Results can be filtered by tags and sorted by last updated date, creation date, or name. Resume data is not included in the response for performance; use the get endpoint to fetch full resume data. Requires authentication.",
			successDescription: "A list of resumes with their metadata (without full resume data).",
		})
		.input(resumeDto.list.input.optional().default({ tags: [], sort: "lastUpdatedAt" }))
		.output(resumeDto.list.output)
		.handler(async ({ input, context }) => {
			return resumeService.list({
				userId: context.user.id,
				tags: input.tags,
				sort: input.sort,
			});
		}),

	getById: protectedProcedure
		.route({
			method: "GET",
			path: "/resumes/{id}",
			tags: ["Resumes"],
			operationId: "getResume",
			summary: "Get resume by ID",
			description:
				"Returns a single resume with its full data, identified by its unique ID. Only resumes belonging to the authenticated user can be retrieved. Requires authentication.",
			successDescription: "The resume with its full data.",
		})
		.input(resumeDto.getById.input)
		.output(resumeDto.getById.output)
		.handler(async ({ context, input }) => {
			return resumeService.getById({ id: input.id, userId: context.user.id });
		}),

	create: protectedProcedure
		.route({
			method: "POST",
			path: "/resumes",
			tags: ["Resumes"],
			operationId: "createResume",
			summary: "Create a new resume",
			description:
				"Creates a new resume with the given name, slug, and tags. Optionally initializes the resume with sample data by setting withSampleData to true. The slug must be unique across the user's resumes. Returns the ID of the newly created resume. Requires authentication.",
			successDescription: "The ID of the newly created resume.",
		})
		.input(resumeDto.create.input)
		.use(resumeMutationRateLimit)
		.output(resumeDto.create.output)
		.errors({
			RESUME_SLUG_ALREADY_EXISTS: {
				message: "A resume with this slug already exists.",
				status: 400,
			},
		})
		.handler(async ({ context, input }) => {
			return resumeService.create({
				name: input.name,
				slug: input.slug,
				tags: input.tags,
				locale: context.locale,
				userId: context.user.id,
				...(input.withSampleData ? { data: sampleResumeData } : {}),
			});
		}),

	import: protectedProcedure
		.route({
			method: "POST",
			path: "/resumes/import",
			tags: ["Resumes"],
			operationId: "importResume",
			summary: "Import a resume",
			description:
				"Creates a new resume from an existing ResumeData object (e.g. from a previously exported JSON file). The imported resume name is derived from the parsed candidate name or uploaded file name, and a unique slug is generated automatically. Returns the ID of the imported resume. Requires authentication.",
			successDescription: "The ID of the imported resume.",
		})
		.input(resumeDto.import.input)
		.use(resumeMutationRateLimit)
		.output(resumeDto.import.output)
		.errors({
			RESUME_SLUG_ALREADY_EXISTS: {
				message: "A resume with this slug already exists.",
				status: 400,
			},
		})
		.handler(async ({ context, input }) => {
			const slugSeed = generateId();
			const name = resolveImportedResumeName({
				data: input.data,
				requestedName: input.name ?? null,
				fallbackName: generateRandomName(),
				preferRequestedName: input.preferRequestedName,
			});
			const slug = buildImportedResumeSlug(name, slugSeed);
			const importLocale = resolveImportedResumeLocale(input.data, context.locale);

			return resumeService.create({
				name,
				slug,
				tags: [],
				data: input.data,
				locale: importLocale,
				userId: context.user.id,
			});
		}),

	update: protectedProcedure
		.route({
			method: "PUT",
			path: "/resumes/{id}",
			tags: ["Resumes"],
			operationId: "updateResume",
			summary: "Update a resume",
			description:
				"Updates one or more fields of a resume identified by its ID. All fields are optional; only provided fields will be updated. Locked resumes cannot be updated. Requires authentication.",
			successDescription: "The updated resume with its full data.",
		})
		.input(resumeDto.update.input)
		.use(resumeMutationRateLimit)
		.output(resumeDto.update.output)
		.errors({
			RESUME_SLUG_ALREADY_EXISTS: {
				message: "A resume with this slug already exists.",
				status: 400,
			},
		})
		.handler(async ({ context, input }) => {
			return resumeService.update({
				id: input.id,
				userId: context.user.id,
				...(input.name !== undefined ? { name: input.name } : {}),
				...(input.slug !== undefined ? { slug: input.slug } : {}),
				...(input.tags !== undefined ? { tags: input.tags } : {}),
				...(input.data !== undefined ? { data: input.data } : {}),
				...(input.isPublic !== undefined ? { isPublic: input.isPublic } : {}),
			});
		}),

	patch: protectedProcedure
		.route({
			method: "PATCH",
			path: "/resumes/{id}",
			tags: ["Resumes"],
			operationId: "patchResume",
			summary: "Patch resume data",
			description:
				"Applies JSON Patch (RFC 6902) operations to partially update a resume's data. This allows small, targeted changes (e.g. updating a single field) without sending the entire resume object. Locked resumes cannot be patched. Requires authentication.",
			successDescription: "The patched resume with its full data.",
		})
		.input(resumeDto.patch.input)
		.use(resumeMutationRateLimit)
		.output(resumeDto.patch.output)
		.errors({
			INVALID_PATCH_OPERATIONS: {
				message: "The patch operations are invalid or produced an invalid resume.",
				status: 400,
			},
			RESUME_VERSION_CONFLICT: {
				message: "The resume changed after this patch was generated.",
				status: 409,
			},
		})
		.handler(async ({ context, input }) => {
			return resumeService.patch({
				id: input.id,
				userId: context.user.id,
				operations: input.operations,
				...(input.expectedUpdatedAt ? { expectedUpdatedAt: input.expectedUpdatedAt } : {}),
			});
		}),

	setLocked: protectedProcedure
		.route({
			method: "POST",
			path: "/resumes/{id}/lock",
			tags: ["Resumes"],
			operationId: "setResumeLocked",
			summary: "Set resume lock status",
			description:
				"Toggles the locked status of a resume. When locked, a resume cannot be updated, patched, or deleted. Useful for protecting finalized resumes from accidental edits. Requires authentication.",
			successDescription: "The resume lock status was updated successfully.",
		})
		.input(resumeDto.setLocked.input)
		.use(resumeMutationRateLimit)
		.output(resumeDto.setLocked.output)
		.handler(async ({ context, input }) => {
			return resumeService.setLocked({
				id: input.id,
				userId: context.user.id,
				isLocked: input.isLocked,
			});
		}),

	duplicate: protectedProcedure
		.route({
			method: "POST",
			path: "/resumes/{id}/duplicate",
			tags: ["Resumes"],
			operationId: "duplicateResume",
			summary: "Duplicate a resume",
			description:
				"Creates a copy of an existing resume with the same data. Optionally override the name, slug, and tags for the duplicate. If not provided, the original resume's name, slug, and tags are used. Returns the ID of the duplicated resume. Requires authentication.",
			successDescription: "The ID of the duplicated resume.",
		})
		.input(resumeDto.duplicate.input)
		.use(resumeMutationRateLimit)
		.output(resumeDto.duplicate.output)
		.handler(async ({ context, input }) => {
			const original = await resumeService.getById({ id: input.id, userId: context.user.id });

			return resumeService.create({
				userId: context.user.id,
				name: input.name ?? original.name,
				slug: input.slug ?? original.slug,
				tags: input.tags ?? original.tags,
				locale: context.locale,
				data: original.data,
			});
		}),

	deriveWithJob: protectedProcedure
		.route({
			method: "POST",
			path: "/resumes/{id}/derive-with-job",
			tags: ["Resumes", "AI"],
			operationId: "deriveResumeWithJob",
			summary: "Create a JD-tailored duplicate",
			description:
				"Creates a new resume duplicate adapted to a target job description. The original resume is not modified. Requires authentication and a tested AI provider.",
			successDescription: "The ID of the generated resume duplicate.",
		})
		.input(resumeDto.deriveWithJob.input)
		.use(resumeMutationRateLimit)
		.use(aiRequestRateLimit)
		.output(resumeDto.deriveWithJob.output)
		.handler(async ({ context, input }) => {
			const [original, provider] = await Promise.all([
				resumeService.getById({ id: input.id, userId: context.user.id }),
				input.aiProviderId
					? aiProvidersService.getRunnableById({ id: input.aiProviderId, userId: context.user.id })
					: aiProvidersService.getDefaultRunnable({ userId: context.user.id }),
			]);

			if (!provider) {
				throw new ORPCError("BAD_REQUEST", { message: "No tested AI provider is available." });
			}

			const target = {
				...(input.company ? { company: input.company } : {}),
				...(input.roleTitle ? { roleTitle: input.roleTitle } : {}),
			};

			const derivedData = await aiService.deriveResumeForJob({
				provider: provider.provider,
				model: provider.model,
				apiKey: provider.apiKey,
				baseURL: provider.baseURL ?? "",
				resumeData: original.data,
				jdText: input.jdText,
				...target,
			});
			const name = buildJobDerivedResumeName(original.name, target);
			const slug = buildImportedResumeSlug(name, generateId());

			return resumeService.create({
				userId: context.user.id,
				name,
				slug,
				tags: original.tags,
				locale: context.locale,
				data: derivedData,
			});
		}),

	delete: protectedProcedure
		.route({
			method: "DELETE",
			path: "/resumes/{id}",
			tags: ["Resumes"],
			operationId: "deleteResume",
			summary: "Delete a resume",
			description:
				"Permanently deletes a resume and its associated files (screenshots, PDFs) from storage. Locked resumes cannot be deleted; unlock the resume first. Requires authentication.",
			successDescription: "The resume and its associated files were deleted successfully.",
		})
		.input(resumeDto.delete.input)
		.use(resumeMutationRateLimit)
		.output(resumeDto.delete.output)
		.handler(async ({ context, input }) => {
			return resumeService.delete({ id: input.id, userId: context.user.id });
		}),
};
