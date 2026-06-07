import type { ResumePreviewProps } from "@/features/resume/preview/preview";
import type { WordTemplateEditTarget } from "@/features/resume/word-template/preview";
import { t } from "@lingui/core/macro";
import { useEffect, useState } from "react";
import { useResume, useResumeData, useUpdateResumeData } from "@/features/resume/builder/draft";
import { ResumePreview } from "@/features/resume/preview/preview";
import { DEFAULT_PDF_PAGE_SIZE } from "@/features/resume/preview/preview.shared";
import { getSelectedWordTemplate, wordTemplateSelectionChangeEvent } from "@/features/resume/word-template/library";
import { WordTemplateDataPreview } from "@/features/resume/word-template/preview";
import { useSectionStore } from "../-store/section";
import { getPreviewSectionFromPoint } from "./preview-section-picker";

export function BuilderClickableResumePreview(props: ResumePreviewProps) {
	const resume = useResume();
	const resumeData = useResumeData();
	const selectSection = useSectionStore((state) => state.selectSection);
	const updateResumeData = useUpdateResumeData();
	const [selectionVersion, setSelectionVersion] = useState(0);
	const selectedWordTemplate = resume && selectionVersion >= 0 ? getSelectedWordTemplate(resume.id) : undefined;

	useEffect(() => {
		const onSelectionChange = () => setSelectionVersion((version) => version + 1);
		window.addEventListener(wordTemplateSelectionChangeEvent, onSelectionChange);
		return () => window.removeEventListener(wordTemplateSelectionChangeEvent, onSelectionChange);
	}, []);

	const selectSectionFromPreviewPoint = (x: number, y: number, width: number, height: number) => {
		if (!resumeData) return;

		const section = getPreviewSectionFromPoint({
			x,
			y,
			width,
			height,
			layout: resumeData.metadata.layout,
		});

		if (!section) return;
		selectSection(section);
	};

	const onEditWordTemplate = (target: WordTemplateEditTarget, value: string) => {
		updateResumeData((draft) => {
			switch (target.type) {
				case "basics":
					draft.basics[target.field] = value;
					break;
				case "websiteUrl":
					draft.basics.website.url = value;
					draft.basics.website.label = value;
					break;
				case "summary":
					draft.summary.content = plainTextToParagraph(value);
					break;
				case "experience": {
					const item = draft.sections.experience.items.find((item) => item.id === target.id);
					if (!item) return;
					item[target.field] = target.field === "description" ? plainTextToParagraph(value) : value;
					break;
				}
				case "education": {
					const item = draft.sections.education.items.find((item) => item.id === target.id);
					if (!item) return;
					item[target.field] = target.field === "description" ? plainTextToParagraph(value) : value;
					break;
				}
				case "project": {
					const item = draft.sections.projects.items.find((item) => item.id === target.id);
					if (!item) return;
					item[target.field] = target.field === "description" ? plainTextToParagraph(value) : value;
					break;
				}
				case "skill": {
					const item = draft.sections.skills.items.find((item) => item.id === target.id);
					if (!item) return;
					if (target.field === "keywords") {
						item.keywords = parseEditableKeywords(value);
					} else {
						item[target.field] = value;
					}
					break;
				}
			}
		});
	};

	if (selectedWordTemplate && resume) {
		return (
			<figure className="shrink-0">
				{props.showPageNumbers ? (
					<figcaption className="mb-1 font-medium text-[0.625rem] text-muted-foreground">第 1 页 / 共 1 页</figcaption>
				) : null}

				<div
					style={{ width: DEFAULT_PDF_PAGE_SIZE.width }}
					className="relative overflow-hidden rounded-md bg-background shadow-sm ring-1 ring-border"
				>
					<WordTemplateDataPreview data={resume.data} template={selectedWordTemplate} onEdit={onEditWordTemplate} />
				</div>
				<figcaption className="mt-2 text-center text-muted-foreground text-xs">
					左侧维护内容，预览和导出使用所选 Word 模板
				</figcaption>
			</figure>
		);
	}

	return (
		<button
			type="button"
			aria-label={t`双击简历预览快速编辑`}
			title={t`双击简历预览快速编辑`}
			className="relative block cursor-crosshair rounded-md bg-transparent p-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-primary"
			onDoubleClick={(event) => {
				if (selectedWordTemplate) {
					selectSection("basics");
					return;
				}

				const rect = event.currentTarget.getBoundingClientRect();
				selectSectionFromPreviewPoint(event.clientX - rect.left, event.clientY - rect.top, rect.width, rect.height);
			}}
			onKeyDown={(event) => {
				if (event.key !== "Enter" && event.key !== " ") return;
				event.preventDefault();
				selectSection("basics");
			}}
		>
			<ResumePreview {...props} />
		</button>
	);
}

function parseEditableKeywords(value: string) {
	return value
		.split(/[、,，\n]/)
		.map((keyword) => keyword.trim())
		.filter(Boolean);
}

function plainTextToParagraph(value: string) {
	const lines = value
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean);

	if (lines.length === 0) return "";

	return lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("");
}

function escapeHtml(value: string) {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}
