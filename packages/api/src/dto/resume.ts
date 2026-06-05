import { createSelectSchema } from "drizzle-zod";
import z from "zod";
import * as schema from "@reactive-resume/db/schema";
import { jsonPatchOperationSchema } from "@reactive-resume/resume/patch";
import { resumeDataSchema } from "@reactive-resume/schema/resume/data";

const resumeSchema = createSelectSchema(schema.resume, {
	id: z.string().describe("The ID of the resume."),
	name: z.string().trim().min(1).describe("The name of the resume."),
	slug: z.string().trim().min(1).describe("The slug of the resume."),
	tags: z.array(z.string()).describe("The tags of the resume."),
	isPublic: z.boolean().describe("Whether the resume is public."),
	isLocked: z.boolean().describe("Whether the resume is locked."),
	password: z.string().trim().min(6).max(64).nullable().describe("The password of the resume, if any."),
	data: resumeDataSchema,
	userId: z.string().describe("The ID of the user who owns the resume."),
	createdAt: z.date().describe("The date and time the resume was created."),
	updatedAt: z.date().describe("The date and time the resume was last updated."),
});

export const resumeDto = {
	list: {
		input: z
			.object({
				tags: z.array(z.string()).optional().default([]),
				sort: z.enum(["lastUpdatedAt", "createdAt", "name"]).optional().default("lastUpdatedAt"),
			})
			.optional()
			.default({ tags: [], sort: "lastUpdatedAt" }),
		output: z.array(resumeSchema.omit({ data: true, password: true, userId: true })),
	},

	getById: {
		input: resumeSchema.pick({ id: true }),
		output: resumeSchema.omit({ password: true, userId: true, createdAt: true }).extend({ hasPassword: z.boolean() }),
	},

	getBySlug: {
		input: z.object({ username: z.string(), slug: z.string() }),
		// `name` is the owner-chosen dashboard title and is intentionally redacted
		// to an empty string for non-owner viewers (see redactResumeForViewer in
		// features/resume/access-policy.ts). Relax the `min(1)` constraint here so
		// the redacted public response passes output validation.
		output: resumeSchema
			.omit({ name: true, password: true, userId: true, createdAt: true, updatedAt: true })
			.extend({ name: z.string() }),
	},

	create: {
		input: resumeSchema
			.pick({ name: true, slug: true, tags: true })
			.extend({ withSampleData: z.boolean().default(false) }),
		output: z.string().describe("The ID of the created resume."),
	},

	import: {
		input: resumeSchema.pick({ data: true }).extend({
			name: z.string().trim().min(1).optional().describe("Optional uploaded file name or user-facing import name."),
			preferRequestedName: z
				.boolean()
				.optional()
				.default(false)
				.describe("Prefer the provided name over the parsed candidate name. Used by system template starters."),
		}),
		output: z.string().describe("The ID of the imported resume."),
	},

	update: {
		input: resumeSchema
			.pick({ name: true, slug: true, tags: true, data: true, isPublic: true })
			.partial()
			.extend({ id: z.string() }),
		output: resumeSchema.omit({ password: true, userId: true, createdAt: true }).extend({ hasPassword: z.boolean() }),
	},

	setLocked: {
		input: resumeSchema.pick({ id: true, isLocked: true }),
		output: z.void(),
	},

	setPassword: {
		input: resumeSchema.pick({ id: true }).extend({ password: z.string().min(6).max(64) }),
		output: z.void(),
	},

	removePassword: {
		input: resumeSchema.pick({ id: true }),
		output: z.void(),
	},

	patch: {
		input: z.object({
			id: z.string().describe("The ID of the resume to patch."),
			expectedUpdatedAt: z.coerce
				.date()
				.optional()
				.describe("If provided, the patch only applies when the resume version still matches this timestamp."),
			operations: z
				.array(jsonPatchOperationSchema)
				.min(1)
				.describe("An array of JSON Patch (RFC 6902) operations to apply to the resume data."),
		}),
		output: resumeSchema.omit({ password: true, userId: true, createdAt: true }).extend({ hasPassword: z.boolean() }),
	},

	versions: {
		list: {
			input: z.object({ resumeId: z.string() }),
			output: z.array(
				z.object({
					id: z.string(),
					resumeId: z.string(),
					label: z.string(),
					source: z.string(),
					createdAt: z.date(),
				}),
			),
		},
		create: {
			input: z.object({
				resumeId: z.string(),
				label: z.string().trim().min(1).max(120),
				source: z.enum(["manual", "ai_patch", "import", "export"]).default("manual"),
			}),
			output: z.object({ id: z.string() }),
		},
		restore: {
			input: z.object({ id: z.string() }),
			output: resumeSchema.omit({ password: true, userId: true, createdAt: true }).extend({ hasPassword: z.boolean() }),
		},
	},

	targets: {
		list: {
			input: z.object({ resumeId: z.string() }),
			output: z.array(
				z.object({
					id: z.string(),
					resumeId: z.string(),
					label: z.string(),
					roleTitle: z.string().nullable(),
					company: z.string().nullable(),
					jdText: z.string(),
					keywords: z.array(z.string()),
					createdAt: z.date(),
					updatedAt: z.date(),
				}),
			),
		},
		upsert: {
			input: z.object({
				id: z.string().optional(),
				resumeId: z.string(),
				label: z.string().trim().min(1).max(120),
				roleTitle: z.string().trim().max(120).optional(),
				company: z.string().trim().max(120).optional(),
				jdText: z.string().max(20_000).default(""),
			}),
			output: z.object({ id: z.string() }),
		},
	},

	duplicate: {
		input: resumeSchema.pick({ id: true, name: true, slug: true, tags: true }),
		output: z.string().describe("The ID of the duplicated resume."),
	},

	deriveWithJob: {
		input: resumeSchema.pick({ id: true }).extend({
			aiProviderId: z.string().optional(),
			company: z.string().trim().max(120).optional(),
			roleTitle: z.string().trim().max(120).optional(),
			jdText: z.string().trim().min(20).max(20_000),
		}),
		output: z.string().describe("The ID of the AI-derived resume duplicate."),
	},

	delete: {
		input: resumeSchema.pick({ id: true }),
		output: z.void(),
	},
};
