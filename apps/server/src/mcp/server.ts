import type { RouterClient } from "@orpc/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { onError } from "@orpc/client";
import { createRouterClient } from "@orpc/server";
import router from "@reactive-resume/api/routers";
import { MCP_TOOL_NAME, registerPrompts, registerResources, registerTools } from "@reactive-resume/mcp";
import { appVersion } from "../app-version";
import { getRequestLocale } from "../rpc/locale";

function createRequestClient(request: Request): RouterClient<typeof router> {
	return createRouterClient(router, {
		interceptors: [
			onError((error) => {
				console.error("[MCP oRPC]", error);
			}),
		],
		context: () => ({
			locale: getRequestLocale(request),
			reqHeaders: request.headers,
			resHeaders: new Headers(),
		}),
	});
}

export async function createMcpServer(request: Request) {
	const appOrigin = new URL("/", request.url).origin;

	const server = new McpServer(
		{
			name: "reactive-resume",
			version: appVersion,
			title: "锐历",
			websiteUrl: appOrigin,
			description: "锐历是面向中文求职场景的简历生成与优化工作台，可通过 MCP 让 LLM 读取、分析和修改你的简历。",
			icons: [
				{
					src: new URL("/icon/light.svg", appOrigin).toString(),
					mimeType: "image/svg+xml",
					theme: "light",
				},
				{
					src: new URL("/icon/dark.svg", appOrigin).toString(),
					mimeType: "image/svg+xml",
					theme: "dark",
				},
			],
		},
		{
			instructions: [
				"You are connected to 锐历 over MCP.",
				"Authenticate with OAuth (recommended) or an API key (`x-api-key`).",
				`Discover resume IDs with \`${MCP_TOOL_NAME.listResumes}\` (not \`resources/list\`).`,
				`List distinct tags with \`${MCP_TOOL_NAME.listResumeTags}\`.`,
				`Read schema at \`resume://_meta/schema\`; read resume JSON via \`resume://{id}\` or \`${MCP_TOOL_NAME.getResume}\`.`,
				`Apply body edits with JSON Patch through \`${MCP_TOOL_NAME.patchResume}\`.`,
				`Change name, slug, tags, or public visibility with \`${MCP_TOOL_NAME.updateResume}\` (returns canonical share URL; anonymous access only when \`isPublic\` is true; passwords are managed in the web app only).`,
				`Import full ResumeData JSON with \`${MCP_TOOL_NAME.importResume}\`; read saved AI analysis with \`${MCP_TOOL_NAME.getResumeAnalysis}\`.`,
			].join(" "),
		},
	);

	const client = createRequestClient(request);
	registerResources(server, client);
	registerTools(server, client, request.headers);
	registerPrompts(server);

	return server;
}
