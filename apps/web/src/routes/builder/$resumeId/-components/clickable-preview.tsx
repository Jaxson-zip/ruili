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
	const updateResumeData = useUpdateResumeData();
	const selectSection = useSectionStore((state) => state.selectSection);
	const [selectionVersion, setSelectionVersion] = useState(0);
	const selectedWordTemplate =
		resume && selectionVersion >= 0 ? getSelectedWordTemplate(resume.id, resume.data) : undefined;

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

	if (selectedWordTemplate && resume) {
		return (
			<figure className="shrink-0">
				<div
					data-word-template-export-root
					style={{ width: DEFAULT_PDF_PAGE_SIZE.width }}
					className="relative overflow-hidden rounded-md bg-background shadow-sm ring-1 ring-border"
				>
					<WordTemplateDataPreview
						data={resume.data}
						template={selectedWordTemplate}
						onEdit={(target, value) => {
							updateResumeData((draft) => {
								applyWordTemplatePreviewEdit(draft, target, value);
							});
						}}
					/>
				</div>
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

function applyWordTemplatePreviewEdit(
	draft: NonNullable<ReturnType<typeof useResumeData>>,
	target: WordTemplateEditTarget,
	value: string,
) {
	switch (target.type) {
		case "basics": {
			draft.basics[target.field] = value;
			return;
		}
		case "customField": {
			const field = draft.basics.customFields.find((entry) => entry.id === target.id);
			if (field) {
				field.text = value;
				field.icon ||= target.icon;
				return;
			}

			draft.basics.customFields.push({ id: target.id, icon: target.icon, link: "", text: value });
			return;
		}
		case "websiteUrl": {
			draft.basics.website.url = value;
			draft.basics.website.label ||= value;
			return;
		}
		case "summary": {
			draft.summary.content = plainTextToHtml(value);
			return;
		}
		case "education": {
			const item = draft.sections.education.items.find((entry) => entry.id === target.id);
			if (item) item[target.field] = target.field === "description" ? plainTextToHtml(value) : value;
			return;
		}
		case "award": {
			const item = draft.sections.awards.items.find((entry) => entry.id === target.id);
			if (item) item[target.field] = value;
			return;
		}
		case "experience": {
			const item = draft.sections.experience.items.find((entry) => entry.id === target.id);
			if (item) item[target.field] = target.field === "description" ? plainTextToHtml(value) : value;
			return;
		}
		case "project": {
			const item = draft.sections.projects.items.find((entry) => entry.id === target.id);
			if (item) item[target.field] = target.field === "description" ? plainTextToHtml(value) : value;
			return;
		}
		case "skill": {
			const item = draft.sections.skills.items.find((entry) => entry.id === target.id);
			if (!item) return;

			if (target.field === "keywords") {
				const [rawName, rawKeywords] = value.includes("：") ? value.split(/：(.+)/, 2) : value.split(/:(.+)/, 2);
				if (rawKeywords !== undefined) {
					item.name = rawName.trim();
				}

				item.keywords = (rawKeywords ?? value)
					.split(/[、,，/|]/)
					.map((keyword) => keyword.trim())
					.filter(Boolean);
				return;
			}

			item[target.field] = value;
			return;
		}
	}
}

function plainTextToHtml(value: string) {
	return value
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean)
		.map((line) => `<p>${escapeHtml(line)}</p>`)
		.join("");
}

function escapeHtml(value: string) {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}
