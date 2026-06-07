// @vitest-environment happy-dom

import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import { defaultResumeData } from "@reactive-resume/schema/resume/default";
import {
	createCustomTemplatePreset,
	loadCustomTemplatePresets,
	parseTemplatePresetJson,
	saveCustomTemplatePresets,
} from "./custom-presets";

const deepGrayOrangePresetJson = readFileSync("../../docs/superpowers/demos/deep-gray-orange-preset.json", "utf8");

describe("custom template presets", () => {
	beforeEach(() => {
		window.localStorage.clear();
	});

	it("parses a template preset from direct metadata JSON", () => {
		const preset = parseTemplatePresetJson(
			JSON.stringify({ name: "技术岗模板", metadata: defaultResumeData.metadata }),
			"fallback.json",
		);

		expect(preset.name).toBe("技术岗模板");
		expect(preset.metadata.template).toBe(defaultResumeData.metadata.template);
		expect("basics" in preset).toBe(false);
	});

	it("parses a template preset from exported resume data", () => {
		const preset = parseTemplatePresetJson(JSON.stringify(defaultResumeData), "resume-style.json");

		expect(preset.name).toBe("resume-style");
		expect(preset.metadata.layout.pages).toHaveLength(defaultResumeData.metadata.layout.pages.length);
	});

	it("parses the deep gray orange sidebar demo preset", () => {
		const preset = parseTemplatePresetJson(deepGrayOrangePresetJson, "deep-gray-orange-preset.json");

		expect(preset.name).toBe("深灰橙色侧栏");
		expect(preset.metadata.template).toBe("collection026");
		expect(preset.metadata.layout.sidebarWidth).toBe(31);
		expect(preset.metadata.design.level.type).toBe("progress-bar");
		expect(preset.metadata.styleRules.length).toBeGreaterThan(0);
	});

	it("rejects JSON without metadata", () => {
		expect(() => parseTemplatePresetJson(JSON.stringify({ basics: { name: "张三" } }))).toThrow(
			/没有在文件中找到可用的模板配置/,
		);
	});

	it("saves and loads valid custom presets", () => {
		const preset = createCustomTemplatePreset({ name: "保存模板", metadata: defaultResumeData.metadata });
		saveCustomTemplatePresets([preset], window.localStorage);

		const loaded = loadCustomTemplatePresets(window.localStorage);
		expect(loaded).toHaveLength(1);
		expect(loaded[0]?.name).toBe("保存模板");
		expect(loaded[0]?.metadata.template).toBe(defaultResumeData.metadata.template);
	});
});
