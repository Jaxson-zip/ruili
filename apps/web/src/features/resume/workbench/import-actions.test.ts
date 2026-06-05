import { describe, expect, it } from "vitest";
import { getImportTypeFromFile } from "./import-actions";

describe("getImportTypeFromFile", () => {
	it("detects supported import file types", () => {
		expect(getImportTypeFromFile(new File([""], "resume.pdf", { type: "application/pdf" }))).toBe("pdf");
		expect(
			getImportTypeFromFile(
				new File([""], "resume.docx", {
					type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
				}),
			),
		).toBe("docx");
		expect(getImportTypeFromFile(new File(["{}"], "resume.json", { type: "application/json" }))).toBe("json");
	});
});
