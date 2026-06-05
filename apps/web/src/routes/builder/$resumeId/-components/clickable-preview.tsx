import type { ResumePreviewProps } from "@/features/resume/preview/preview";
import { t } from "@lingui/core/macro";
import { useResumeData } from "@/features/resume/builder/draft";
import { ResumePreview } from "@/features/resume/preview/preview";
import { useSectionStore } from "../-store/section";
import { getPreviewSectionFromPoint } from "./preview-section-picker";

export function BuilderClickableResumePreview(props: ResumePreviewProps) {
	const resumeData = useResumeData();
	const selectSection = useSectionStore((state) => state.selectSection);

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
