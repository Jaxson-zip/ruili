import { env } from "@reactive-resume/env/server";

const DOCS_URL = "https://docs.rxresu.me";

type StaticSeoOptions = {
	head?: boolean;
};

function appUrl() {
	return env.APP_URL.replace(/\/+$/, "");
}

function textResponse(body: string, options: StaticSeoOptions = {}) {
	return new Response(options.head ? null : body, {
		headers: { "Content-Type": "text/plain; charset=UTF-8" },
	});
}

export function handleRobots(options?: StaticSeoOptions) {
	const baseUrl = appUrl();
	const body = [
		"User-agent: *",
		"Allow: /",
		"Disallow: /api/rpc",
		"Disallow: /api/auth",
		"Disallow: /mcp",
		"Disallow: /.well-known",
		"",
		`Sitemap: ${baseUrl}/sitemap.xml`,
		`Sitemap: ${DOCS_URL}/sitemap.xml`,
		"",
	].join("\n");

	return textResponse(body, options);
}

export function handleSitemap(options?: StaticSeoOptions) {
	const baseUrl = appUrl();
	const body = [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		"  <url>",
		`    <loc>${baseUrl}/</loc>`,
		"  </url>",
		"</urlset>",
		"",
	].join("\n");

	return new Response(options?.head ? null : body, {
		headers: { "Content-Type": "application/xml; charset=UTF-8" },
	});
}

export function handleLlms(options?: StaticSeoOptions) {
	const baseUrl = appUrl();
	const body = [
		"# 锐历",
		"",
		"锐历是一款面向中文求职场景的简历生成与优化工具，支持结构化编辑、模板排版、PDF 导出和 AI 辅助优化。",
		"",
		"## Links",
		"",
		`- Product: ${baseUrl}`,
		`- Documentation: ${DOCS_URL}`,
		`- Documentation sitemap: ${DOCS_URL}/sitemap.xml`,
		`- Documentation llms.txt: ${DOCS_URL}/llms.txt`,
		`- API documentation: ${DOCS_URL}/api-reference`,
		`- Resume schema: ${baseUrl}/schema.json`,
		`- MCP documentation: ${DOCS_URL}/guides/using-the-mcp-server`,
		`- OpenAPI specification: ${baseUrl}/api/openapi/spec.json`,
		"",
	].join("\n");

	return textResponse(body, options);
}
