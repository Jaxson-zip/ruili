import type { ResumeData } from "@reactive-resume/schema/resume/data";
import type { WordTemplate } from "./library";
import { useEffect, useRef, useState } from "react";
import { cn } from "@reactive-resume/utils/style";
import { DEFAULT_PDF_PAGE_SIZE } from "../preview/preview.shared";
import { WordTemplateDataPreview } from "./preview";

const A4_PAGE_ASPECT_RATIO = 297 / 210;
const BUILDER_INITIAL_VERTICAL_PAGE_OFFSET = 0.29;

type WordTemplateLiveThumbnailProps = {
	badge?: string;
	className?: string;
	data: ResumeData;
	name: string;
	scale: number;
	template: WordTemplate;
};

export function WordTemplateLiveThumbnail({
	badge,
	className,
	data,
	name,
	scale,
	template,
}: WordTemplateLiveThumbnailProps) {
	return (
		<div
			aria-label={name}
			data-testid="word-template-live-thumbnail"
			role="img"
			className={`relative aspect-page shrink-0 overflow-hidden rounded-md border bg-white ${className ?? ""}`}
		>
			<div
				aria-hidden="true"
				className="pointer-events-none absolute top-0 left-0 origin-top-left"
				style={{
					transform: `scale(${scale})`,
					width: `${100 / scale}%`,
				}}
			>
				<WordTemplateDataPreview data={data} template={template} />
			</div>

			{badge ? (
				<div className="absolute top-2 left-2 rounded-md bg-background/90 px-2 py-0.5 font-medium text-[11px] shadow-sm">
					{badge}
				</div>
			) : null}
		</div>
	);
}

type WordTemplateBuilderViewportThumbnailProps = {
	className?: string;
	data: ResumeData;
	name: string;
	scale: number;
	template: WordTemplate;
};

export function WordTemplateBuilderViewportThumbnail({
	className,
	data,
	name,
	scale,
	template,
}: WordTemplateBuilderViewportThumbnailProps) {
	const stageRef = useRef<HTMLDivElement>(null);
	const [stageWidth, setStageWidth] = useState(0);
	const resolvedScale = stageWidth > 0 ? stageWidth / DEFAULT_PDF_PAGE_SIZE.width : scale;
	const pageOffset =
		DEFAULT_PDF_PAGE_SIZE.width * resolvedScale * A4_PAGE_ASPECT_RATIO * BUILDER_INITIAL_VERTICAL_PAGE_OFFSET;

	useEffect(() => {
		const element = stageRef.current;
		if (!element) return;

		const updateWidth = () => setStageWidth(element.clientWidth);

		updateWidth();

		if (typeof ResizeObserver === "undefined") return;

		const observer = new ResizeObserver(updateWidth);
		observer.observe(element);

		return () => observer.disconnect();
	}, []);

	return (
		<div
			ref={stageRef}
			aria-label={name}
			data-testid="word-template-builder-viewport-thumbnail"
			role="img"
			className={cn("relative size-full overflow-hidden bg-white", className)}
		>
			<div
				aria-hidden="true"
				className="pointer-events-none shrink-0"
				style={{
					marginTop: pageOffset ? `${-pageOffset}px` : undefined,
					transform: `scale(${resolvedScale})`,
					transformOrigin: "top left",
					width: `${DEFAULT_PDF_PAGE_SIZE.width}px`,
				}}
			>
				<WordTemplateDataPreview data={data} template={template} />
			</div>
		</div>
	);
}
