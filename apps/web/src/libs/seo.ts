const productionRootUrl = "https://ruili.resume/";
const appName = "锐历";
const repositoryUrl = "https://github.com/Jaxson-zip/ruili";

type JsonLd = Record<string, unknown>;

export const getCanonicalRootUrl = (origin?: string): string => {
	if (!origin) return productionRootUrl;

	const url = new URL(origin);
	url.pathname = "/";
	url.search = "";
	url.hash = "";

	return url.toString();
};

export const createNoindexFollowMeta = () => ({ name: "robots", content: "noindex, follow" });

const serializeJsonLdForScript = (data: JsonLd) =>
	JSON.stringify(data).replace(/[<>&\u2028\u2029]/g, (character) => {
		switch (character) {
			case "<":
				return "\\u003C";
			case ">":
				return "\\u003E";
			case "&":
				return "\\u0026";
			case "\u2028":
				return "\\u2028";
			case "\u2029":
				return "\\u2029";
			default:
				return character;
		}
	});

const createStructuredDataScript = (id: string, data: JsonLd) => ({
	id,
	type: "application/ld+json",
	children: serializeJsonLdForScript(data),
});

export const getRootStructuredData = (canonicalUrl: string): JsonLd[] => [
	{
		"@type": "WebSite",
		name: appName,
		url: canonicalUrl,
	},
	{
		"@type": ["SoftwareApplication", "WebApplication"],
		name: appName,
		url: canonicalUrl,
		description: "锐历是一款面向中文求职场景的简历生成与优化工具，支持结构化编辑、模板排版、PDF 导出和 AI 辅助优化。",
		applicationCategory: "BusinessApplication",
		operatingSystem: "Web",
		isAccessibleForFree: true,
		offers: {
			"@type": "Offer",
			price: "0",
			priceCurrency: "USD",
		},
		codeRepository: repositoryUrl,
	},
	{
		"@type": "Project",
		name: appName,
		url: canonicalUrl,
		sameAs: [repositoryUrl],
	},
	{
		"@type": "FAQPage",
		mainEntity: homeFaqJsonLdItems.map((item) => ({
			"@type": "Question",
			name: item.question,
			acceptedAnswer: {
				"@type": "Answer",
				text: item.answer,
			},
		})),
	},
];

export const createRootStructuredDataScript = (canonicalUrl: string) =>
	createStructuredDataScript("reactive-resume-structured-data", {
		"@context": "https://schema.org",
		"@graph": getRootStructuredData(canonicalUrl),
	});

const homeFaqJsonLdItems = [
	{
		question: "锐历适合什么场景？",
		answer: "锐历适合中文求职者创建、维护和针对岗位优化简历，也适合团队自托管内部简历工具。",
	},
	{
		question: "我的简历数据安全吗？",
		answer: "简历数据会存储在当前部署环境中。你也可以自托管锐历，把数据完全掌握在自己的服务器里。",
	},
	{
		question: "可以导出 PDF 吗？",
		answer: "可以。编辑完成后可以直接导出 PDF，并尽量保持模板排版与样式一致。",
	},
	{
		question: "为什么说它是中文优先？",
		answer: "锐历把界面文案、示例简历、模板预览和后续 AI 优化流程都按中文求职场景整理，而不是只翻译按钮。",
	},
	{
		question: "它和普通简历模板有什么区别？",
		answer: "锐历把简历拆成结构化模块，可以反复维护不同岗位版本，再结合模板、导出和 AI 建议完成优化。",
	},
	{
		question: "可以分享简历链接吗？",
		answer: "可以。你可以通过公开链接分享简历，也可以下载 PDF 后直接投递。",
	},
] as const;
