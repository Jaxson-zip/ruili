import { describe, expect, it } from "vitest";
import {
	createNoindexFollowMeta,
	createRootStructuredDataScript,
	getCanonicalRootUrl,
	getRootStructuredData,
} from "./seo";

describe("getCanonicalRootUrl", () => {
	it("uses the production root when no origin is available", () => {
		expect(getCanonicalRootUrl()).toBe("https://ruili.resume/");
	});

	it("normalizes an app origin to the root URL", () => {
		expect(getCanonicalRootUrl("http://localhost:3000")).toBe("http://localhost:3000/");
		expect(getCanonicalRootUrl("https://ruili.resume/")).toBe("https://ruili.resume/");
	});
});

describe("createNoindexFollowMeta", () => {
	it("returns the robots noindex metadata used by private app surfaces", () => {
		expect(createNoindexFollowMeta()).toEqual({ name: "robots", content: "noindex, follow" });
	});
});

describe("createRootStructuredDataScript", () => {
	it("serializes JSON-LD using the structured data script id", () => {
		const script = createRootStructuredDataScript("https://ruili.resume/");

		expect(script.id).toBe("reactive-resume-structured-data");
		expect(script.type).toBe("application/ld+json");
		expect(JSON.parse(script.children)).toMatchObject({ "@context": "https://schema.org" });
	});

	it("escapes script-breaking sequences in JSON-LD children", () => {
		const script = createRootStructuredDataScript("https://ruili.resume/</script><!---->\u2028\u2029");

		expect(script.children).not.toContain("</script");
		expect(script.children).not.toContain("<!--");
		expect(script.children).not.toContain("\u2028");
		expect(script.children).not.toContain("\u2029");
		expect(script.children).toContain("\\u003C/script");
		expect(script.children).toContain("\\u003C!--");
		expect(script.children).toContain("\\u2028");
		expect(script.children).toContain("\\u2029");
	});
});

describe("getRootStructuredData", () => {
	it("describes only conservative visible product facts", () => {
		const schemas = getRootStructuredData("https://ruili.resume/");

		expect(schemas).toHaveLength(4);
		expect(schemas[0]).toMatchObject({
			"@type": "WebSite",
			name: "锐历",
			url: "https://ruili.resume/",
		});
		expect(schemas[1]).toMatchObject({
			"@type": ["SoftwareApplication", "WebApplication"],
			name: "锐历",
			applicationCategory: "BusinessApplication",
			operatingSystem: "Web",
			offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
		});
		expect(schemas[3]).toMatchObject({
			"@type": "FAQPage",
			mainEntity: expect.arrayContaining([
				expect.objectContaining({
					name: "锐历适合什么场景？",
				}),
			]),
		});
	});
});
