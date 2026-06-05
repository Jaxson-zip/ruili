export type WorkbenchImportType = "pdf" | "docx" | "json";

export function getImportTypeFromFile(file: File): WorkbenchImportType | null {
	const name = file.name.toLowerCase();

	if (file.type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
	if (file.type === "application/json" || name.endsWith(".json")) return "json";
	if (
		file.type === "application/msword" ||
		file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
		name.endsWith(".doc") ||
		name.endsWith(".docx")
	) {
		return "docx";
	}

	return null;
}
