import type { ResumeData } from "@reactive-resume/schema/resume/data";
import type React from "react";
import type { WordTemplate } from "./library";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@reactive-resume/utils/style";
import { paginateAtsMeasuredLayout } from "./ats-pagination";
import { paginateInternshipMeasuredLayout } from "./internship-pagination";

export type WordTemplateEditTarget =
	| { type: "basics"; field: "email" | "headline" | "location" | "name" | "phone" }
	| { type: "customField"; icon: string; id: string }
	| { type: "websiteUrl" }
	| { type: "summary" }
	| { type: "award"; id: string; field: "date" | "title" }
	| { type: "experience"; id: string; field: "company" | "description" | "period" | "position" }
	| { type: "education"; id: string; field: "area" | "degree" | "description" | "period" | "school" }
	| { type: "project"; id: string; field: "description" | "name" | "period" }
	| { type: "skill"; id: string; field: "keywords" | "name" | "proficiency" };

type WordTemplateDataPreviewProps = {
	data: ResumeData;
	template?: WordTemplate;
	onEdit?: (target: WordTemplateEditTarget, value: string) => void;
};

const INTERNSHIP_REFERENCE_PAGE_WIDTH = 794;
const INTERNSHIP_REFERENCE_FONT_SIZE = 14;
const internshipLayoutSectionIds = ["education", "awards", "experience", "projects"] as const;
const atsSectionIds = ["education", "experience", "projects", "awards", "skills"] as const;
const sidebarAsideSectionIds = ["education", "skills"] as const;
const sidebarMainSectionIds = ["experience", "projects", "awards"] as const;
const ATS_FIRST_PAGE_CAPACITY = 15.8;
const ATS_CONTINUATION_PAGE_CAPACITY = 16.8;
const INTERNSHIP_FIRST_PAGE_CAPACITY = 8.1;
const INTERNSHIP_CONTINUATION_PAGE_CAPACITY = 11.2;
const INTERNSHIP_AWARDS_SECTION_BASE_WEIGHT = 0.95;
const INTERNSHIP_AWARD_ITEM_WEIGHT = 0.32;
const INTERNSHIP_KEEP_AWARDS_TOGETHER_LIMIT = 8;
const INTERNSHIP_MIN_AWARD_ITEMS_AT_SECTION_START = 4;
const SIDEBAR_FIRST_PAGE_CAPACITY = 20.1;
const SIDEBAR_CONTINUATION_PAGE_CAPACITY = 25.8;
const SIDEBAR_KEEP_CHUNK_TOGETHER_LIMIT = 7.2;
const SIDEBAR_MIN_AWARD_ITEMS_AT_SECTION_START = 4;
type InternshipLayoutSectionId = (typeof internshipLayoutSectionIds)[number];
type AtsSectionId = (typeof atsSectionIds)[number];
const ATS_MIN_SECTION_START_ITEMS: Partial<Record<AtsSectionId, number>> = {
	awards: 3,
	skills: 2,
};
type OrderedWordSectionId =
	| AtsSectionId
	| (typeof sidebarAsideSectionIds)[number]
	| (typeof sidebarMainSectionIds)[number];
type InternshipPageBlock = {
	continuation?: boolean;
	end: number;
	sectionId: InternshipLayoutSectionId;
	start: number;
};

type AtsPreviewSections = {
	awards: ResumeData["sections"]["awards"]["items"];
	education: ResumeData["sections"]["education"]["items"];
	experience: AtsExperienceUnit[];
	projects: AtsProjectUnit[];
	skills: ResumeData["sections"]["skills"]["items"];
};

type AtsPageBlock = {
	end: number;
	sectionId: AtsSectionId;
	start: number;
};

type AtsExperienceItem = ResumeData["sections"]["experience"]["items"][number];
type AtsProjectItem = ResumeData["sections"]["projects"]["items"][number];

type AtsExperienceUnit =
	| { gapBefore: boolean; item: AtsExperienceItem; key: string; kind: "experience-header" }
	| {
			item: AtsExperienceItem;
			key: string;
			kind: "experience-description";
			line: string;
			lineIndex: number;
			trailingGap: boolean;
	  };

type AtsProjectUnit =
	| { gapBefore: boolean; item: AtsProjectItem; key: string; kind: "project-header" }
	| {
			item: AtsProjectItem;
			key: string;
			kind: "project-description";
			line: string;
			lineIndex: number;
			trailingGap: boolean;
	  };

type SidebarMainSectionId = (typeof sidebarMainSectionIds)[number];
type SidebarExperienceItem = ResumeData["sections"]["experience"]["items"][number];
type SidebarProjectItem = ResumeData["sections"]["projects"]["items"][number];
type SidebarAwardItem = ResumeData["sections"]["awards"]["items"][number];

type SidebarMainUnit =
	| { key: string; kind: "section-title"; sectionId: SidebarMainSectionId; title: string }
	| { content: string; key: string; kind: "summary"; title: string }
	| { continuation?: boolean; items: SidebarAwardItem[]; key: string; kind: "awards-group"; title: string }
	| { gapBefore: boolean; item: SidebarExperienceItem; key: string; kind: "experience-header" }
	| {
			item: SidebarExperienceItem;
			key: string;
			kind: "experience-description";
			line: string;
			lineIndex: number;
			trailingGap: boolean;
	  }
	| { gapBefore: boolean; item: SidebarProjectItem; key: string; kind: "project-header" }
	| {
			item: SidebarProjectItem;
			key: string;
			kind: "project-description";
			line: string;
			lineIndex: number;
			trailingGap: boolean;
	  };

export function WordTemplateDataPreview({ data, onEdit, template }: WordTemplateDataPreviewProps) {
	if (!template) return null;

	if (template.id === "zh-sidebar-clean-001") return <SidebarLivePreview data={data} onEdit={onEdit} />;
	if (template.id === "zh-ats-compact-001") return <AtsCompactLivePreview data={data} onEdit={onEdit} />;
	return <InternshipLivePreview data={data} onEdit={onEdit} />;
}

function InternshipLivePreview({ data, onEdit }: WordTemplateDataPreviewProps) {
	const { fontSize, previewRef } = useAdaptiveInternshipFontSize();
	const gender = getCustomFieldText(data, ["zh-internship-gender", "gender"]);
	const birthday = getCustomFieldText(data, ["zh-internship-birthday", "birthday"]);
	const orderedSectionIds = useMemo(() => getInternshipVisibleSectionOrder(data), [data]);
	const { canMeasureLayout, measureRootRef, pages } = useMeasuredInternshipPages({
		data,
		fontSize,
		orderedSectionIds,
		previewRef,
	});
	const [firstPageBlocks = [], ...restPageBlocks] = pages;

	return (
		<div
			ref={previewRef}
			data-testid="word-template-data-preview"
			className="flex w-full flex-col gap-2 text-[#2d2d2d]"
			style={{
				fontFamily: '"Microsoft YaHei", "微软雅黑", sans-serif',
				fontSize,
			}}
		>
			<div
				data-word-template-preview-page
				className="relative aspect-page overflow-hidden bg-[#fbfbfa] px-[3.3em] py-[5.3em] text-[#2d2d2d] shadow-sm"
			>
				<InternshipHeader data={data} gender={gender} birthday={birthday} onEdit={onEdit} />

				<InternshipSection title="求职意向">
					<div className="grid grid-cols-2 gap-[2em] text-[#555] text-[1.15em] leading-[1.75]">
						<InlineInfo
							label="应聘岗位"
							value={data.basics.headline}
							onCommit={(value) => onEdit?.({ type: "basics", field: "headline" }, value)}
						/>
						<InlineInfo
							label="意向城市"
							value={data.basics.location}
							onCommit={(value) => onEdit?.({ type: "basics", field: "location" }, value)}
						/>
					</div>
				</InternshipSection>

				{firstPageBlocks.map((block) => (
					<InternshipSectionBlock key={getInternshipPageBlockKey(block)} block={block} data={data} onEdit={onEdit} />
				))}
			</div>

			{restPageBlocks.map((pageBlocks, pageIndex) => (
				<div
					key={pageIndex}
					data-word-template-preview-page
					className="relative aspect-page overflow-hidden bg-[#fbfbfa] px-[3.3em] py-[3.1em] text-[#2d2d2d] shadow-sm"
				>
					{pageBlocks.map((block) => (
						<InternshipSectionBlock key={getInternshipPageBlockKey(block)} block={block} data={data} onEdit={onEdit} />
					))}
				</div>
			))}

			{canMeasureLayout ? (
				<InternshipMeasurementHost
					data={data}
					fontSize={fontSize}
					gender={gender}
					birthday={birthday}
					measureRootRef={measureRootRef}
					orderedSectionIds={orderedSectionIds}
				/>
			) : null}
		</div>
	);
}

function useAdaptiveInternshipFontSize() {
	const previewRef = useRef<HTMLDivElement>(null);
	const [fontSize, setFontSize] = useState("10.5px");

	useEffect(() => {
		const element = previewRef.current;
		if (!element) return;

		const updateFontSize = () => {
			const width = element.clientWidth;
			if (!width) return;

			const nextSize = (width / INTERNSHIP_REFERENCE_PAGE_WIDTH) * INTERNSHIP_REFERENCE_FONT_SIZE;
			setFontSize(`${Number(nextSize.toFixed(3))}px`);
		};

		updateFontSize();

		if (typeof ResizeObserver === "undefined") return;

		const observer = new ResizeObserver(updateFontSize);
		observer.observe(element);

		return () => observer.disconnect();
	}, []);

	return { fontSize, previewRef };
}

function useMeasuredInternshipPages({
	data,
	fontSize,
	orderedSectionIds,
	previewRef,
}: {
	data: ResumeData;
	fontSize: string;
	orderedSectionIds: readonly InternshipLayoutSectionId[];
	previewRef: React.RefObject<HTMLDivElement | null>;
}) {
	const measureRootRef = useRef<HTMLDivElement>(null);
	const [canMeasureLayout, setCanMeasureLayout] = useState(false);
	const [pages, setPages] = useState(() => paginateInternshipSections(data, orderedSectionIds));

	useEffect(() => {
		if (canMeasureLayout) return;

		const animationFrameId = window.requestAnimationFrame(() => {
			const firstPage = previewRef.current?.querySelector<HTMLElement>("[data-word-template-preview-page]");
			setCanMeasureLayout((firstPage?.getBoundingClientRect().height ?? 0) > 0);
		});

		return () => window.cancelAnimationFrame(animationFrameId);
	}, [canMeasureLayout, previewRef]);

	useEffect(() => {
		if (!canMeasureLayout) return;

		const measure = () => {
			const measureRoot = measureRootRef.current;
			const previewRoot = previewRef.current;
			const firstPage = previewRoot?.querySelector<HTMLElement>("[data-word-template-preview-page]");
			if (!measureRoot || !firstPage) return;

			const fontSizePx = Number.parseFloat(fontSize);
			if (!Number.isFinite(fontSizePx) || fontSizePx <= 0) return;

			const firstPageRect = firstPage.getBoundingClientRect();
			const pageHeight = firstPage.offsetHeight || firstPageRect.height;
			if (pageHeight <= 0) return;

			const visualToLayoutScale = firstPageRect.height > 0 && pageHeight > 0 ? firstPageRect.height / pageHeight : 1;
			const toLayoutPx = (value: number) => (visualToLayoutScale > 0 ? value / visualToLayoutScale : value);
			const getLayoutHeight = (element: HTMLElement) =>
				element.offsetHeight || toLayoutPx(element.getBoundingClientRect().height);

			const headerElement = measureRoot.querySelector<HTMLElement>('[data-internship-measure="header"]');
			const headerHeight = headerElement
				? getLayoutHeight(headerElement) + getTrailingChildMarginBottom(headerElement)
				: 0;
			const sectionMeasurements: Partial<
				Record<InternshipLayoutSectionId, { footerGap?: number; items: { bottom: number; top: number }[] }>
			> = {};

			for (const sectionElement of Array.from(
				measureRoot.querySelectorAll<HTMLElement>("[data-internship-measure-section]"),
			)) {
				const sectionId = sectionElement.dataset.internshipMeasureSection as InternshipLayoutSectionId | undefined;
				if (!sectionId) continue;

				const sectionRect = sectionElement.getBoundingClientRect();
				const itemElements = Array.from(sectionElement.querySelectorAll<HTMLElement>("[data-internship-measure-item]"));
				const items = itemElements
					.map((itemElement) => {
						const rect = itemElement.getBoundingClientRect();
						return {
							bottom: toLayoutPx(rect.bottom - sectionRect.top),
							top: toLayoutPx(rect.top - sectionRect.top),
						};
					})
					.filter((item) => item.bottom > item.top);

				sectionMeasurements[sectionId] = {
					footerGap: Math.max(
						0,
						getLayoutHeight(sectionElement) - (items.at(-1)?.bottom ?? 0) + getLayoutMarginBottom(sectionElement),
					),
					items,
				};
			}

			const nextPages = paginateInternshipMeasuredLayout({
				continuationPageCapacity: Math.max(1, pageHeight - fontSizePx * 6.2),
				firstPageCapacity: Math.max(1, pageHeight - fontSizePx * 10.6 - headerHeight),
				minSectionStartItems: { awards: INTERNSHIP_MIN_AWARD_ITEMS_AT_SECTION_START },
				sectionMeasurements,
				sectionOrder: orderedSectionIds,
			});

			setPages((current) => (areInternshipPagesEqual(current, nextPages) ? current : nextPages));
		};

		const animationFrameId = window.requestAnimationFrame(measure);
		return () => window.cancelAnimationFrame(animationFrameId);
	}, [canMeasureLayout, fontSize, orderedSectionIds, previewRef]);

	return { canMeasureLayout, measureRootRef, pages };
}

function areInternshipPagesEqual(current: InternshipPageBlock[][], next: InternshipPageBlock[][]) {
	if (current.length !== next.length) return false;

	return current.every((page, pageIndex) => {
		const nextPage = next[pageIndex];
		if (!nextPage || page.length !== nextPage.length) return false;

		return page.every((block, blockIndex) => {
			const nextBlock = nextPage[blockIndex];
			return (
				!!nextBlock &&
				block.sectionId === nextBlock.sectionId &&
				block.start === nextBlock.start &&
				block.end === nextBlock.end &&
				Boolean(block.continuation) === Boolean(nextBlock.continuation)
			);
		});
	});
}

function getLayoutMarginBottom(element: HTMLElement) {
	const marginBottom = Number.parseFloat(window.getComputedStyle(element).marginBottom);
	return Number.isFinite(marginBottom) ? marginBottom : 0;
}

function getTrailingChildMarginBottom(element: HTMLElement) {
	const lastChild = element.lastElementChild;
	return lastChild instanceof HTMLElement ? getLayoutMarginBottom(lastChild) : 0;
}

function InternshipMeasurementHost({
	birthday,
	data,
	fontSize,
	gender,
	measureRootRef,
	orderedSectionIds,
}: {
	birthday: string;
	data: ResumeData;
	fontSize: string;
	gender: string;
	measureRootRef: React.RefObject<HTMLDivElement | null>;
	orderedSectionIds: readonly InternshipLayoutSectionId[];
}) {
	return (
		<div
			ref={measureRootRef}
			aria-hidden="true"
			className="pointer-events-none absolute inset-0 -z-10 overflow-hidden opacity-0"
			style={{
				fontFamily: '"Microsoft YaHei", "微软雅黑", sans-serif',
				fontSize,
			}}
		>
			<div className="w-full px-[3.3em] py-[5.3em]">
				<div data-internship-measure="header">
					<InternshipHeader data={data} gender={gender} birthday={birthday} />

					<InternshipSection title="求职意向">
						<div className="grid grid-cols-2 gap-[2em] text-[#555] text-[1.15em] leading-[1.75]">
							<InlineInfo label="应聘岗位" value={data.basics.headline} />
							<InlineInfo label="意向城市" value={data.basics.location} />
						</div>
					</InternshipSection>
				</div>

				<div className="w-full">
					{orderedSectionIds.map((sectionId) => {
						const items = getVisibleItems(data.sections[sectionId]);
						if (items.length === 0) return null;

						return (
							<div key={sectionId}>
								<InternshipSectionBlock block={{ end: items.length, sectionId, start: 0 }} data={data} measureItems />
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}

function InternshipSectionBlock({
	dense = false,
	block,
	data,
	measureItems = false,
	onEdit,
}: {
	dense?: boolean;
	block: InternshipPageBlock;
	data: ResumeData;
	measureItems?: boolean;
	onEdit?: (target: WordTemplateEditTarget, value: string) => void;
}) {
	const { end, sectionId, start } = block;

	switch (sectionId) {
		case "education": {
			const education = getVisibleItems(data.sections.education).slice(start, end);
			if (education.length === 0) return null;

			const content = (
				<div className="space-y-[0.9em]">
					{education.map((item, index) => (
						<InternshipItem
							key={item.id}
							measureItemId={measureItems ? `${sectionId}-${start + index}` : undefined}
							primary={item.period}
							secondary={item.school}
							subtitle={[item.area, item.degree].filter(Boolean).join(" | ")}
							description={item.description}
							onPrimaryCommit={(value) => onEdit?.({ type: "education", id: item.id, field: "period" }, value)}
							onSecondaryCommit={(value) => onEdit?.({ type: "education", id: item.id, field: "school" }, value)}
							onSubtitleCommit={(value) => {
								const [area = "", degree = ""] = value.split(/[/|｜]/).map((part) => part.trim());
								onEdit?.({ type: "education", id: item.id, field: "area" }, area);
								onEdit?.({ type: "education", id: item.id, field: "degree" }, degree);
							}}
							onDescriptionCommit={(value) => onEdit?.({ type: "education", id: item.id, field: "description" }, value)}
						/>
					))}
				</div>
			);

			if (start > 0) return <div className={dense ? "mb-[0.12em]" : "mb-[0.45em]"}>{content}</div>;

			return (
				<InternshipSection dense={dense} measureSectionId={measureItems ? sectionId : undefined} title="教育经历">
					{content}
				</InternshipSection>
			);
		}
		case "awards": {
			const awards = getVisibleItems(data.sections.awards).slice(start, end);
			if (awards.length === 0) return null;

			const content = (
				<div className="grid gap-[0.18em]">
					{awards.map((item, index) => (
						<div
							key={item.id}
							data-internship-measure-item={measureItems ? `${sectionId}-${start + index}` : undefined}
						>
							<EditableText
								as="p"
								label="获奖荣誉"
								value={[item.date, item.title].filter(Boolean).join("  ")}
								fallback="获奖荣誉"
								className="block text-[#666] text-[1.05em] leading-[1.5]"
								onCommit={(value) => {
									const nextAward = splitAwardLine(value, item.date);
									onEdit?.({ type: "award", id: item.id, field: "date" }, nextAward.date);
									onEdit?.({ type: "award", id: item.id, field: "title" }, nextAward.title);
								}}
							/>
						</div>
					))}
				</div>
			);

			if (block.continuation) return <div className={dense ? "mb-[0.12em]" : "mb-[0.45em]"}>{content}</div>;

			return (
				<InternshipSection dense={dense} measureSectionId={measureItems ? sectionId : undefined} title="获奖荣誉">
					{content}
				</InternshipSection>
			);
		}
		case "experience": {
			const experience = getVisibleItems(data.sections.experience).slice(start, end);
			if (experience.length === 0) return null;

			const content = (
				<div className="space-y-[0.9em]">
					{experience.map((item, index) => (
						<InternshipItem
							key={item.id}
							measureItemId={measureItems ? `${sectionId}-${start + index}` : undefined}
							primary={item.period}
							secondary={item.company}
							subtitle={item.position}
							description={item.description}
							onPrimaryCommit={(value) => onEdit?.({ type: "experience", id: item.id, field: "period" }, value)}
							onSecondaryCommit={(value) => onEdit?.({ type: "experience", id: item.id, field: "company" }, value)}
							onSubtitleCommit={(value) => onEdit?.({ type: "experience", id: item.id, field: "position" }, value)}
							onDescriptionCommit={(value) =>
								onEdit?.({ type: "experience", id: item.id, field: "description" }, value)
							}
						/>
					))}
				</div>
			);

			if (start > 0) return <div className={dense ? "mb-[0.12em]" : "mb-[0.45em]"}>{content}</div>;

			return (
				<InternshipSection dense={dense} measureSectionId={measureItems ? sectionId : undefined} title="工作经历">
					{content}
				</InternshipSection>
			);
		}
		case "projects": {
			const projects = getVisibleItems(data.sections.projects).slice(start, end);
			if (projects.length === 0) return null;

			const content = (
				<div className={dense ? "space-y-[1.28em]" : "space-y-[1.45em]"}>
					{projects.map((item, index) => (
						<InternshipItem
							key={item.id}
							measureItemId={measureItems ? `${sectionId}-${start + index}` : undefined}
							primary={item.period}
							secondary={item.name}
							description={item.description}
							onPrimaryCommit={(value) => onEdit?.({ type: "project", id: item.id, field: "period" }, value)}
							onSecondaryCommit={(value) => onEdit?.({ type: "project", id: item.id, field: "name" }, value)}
							onDescriptionCommit={(value) => onEdit?.({ type: "project", id: item.id, field: "description" }, value)}
						/>
					))}
				</div>
			);

			if (start > 0) return <div className={dense ? "mb-[0.12em]" : "mb-[0.45em]"}>{content}</div>;

			return (
				<InternshipSection dense={dense} measureSectionId={measureItems ? sectionId : undefined} title="项目经历">
					{content}
				</InternshipSection>
			);
		}
	}
}

function getInternshipVisibleSectionOrder(data: ResumeData): InternshipLayoutSectionId[] {
	const supported = new Set<string>(internshipLayoutSectionIds);
	const seen = new Set<InternshipLayoutSectionId>();
	const ordered: InternshipLayoutSectionId[] = [];

	for (const page of data.metadata.layout.pages) {
		for (const sectionId of [...page.main, ...page.sidebar]) {
			if (!supported.has(sectionId) || seen.has(sectionId as InternshipLayoutSectionId)) continue;
			seen.add(sectionId as InternshipLayoutSectionId);
			ordered.push(sectionId as InternshipLayoutSectionId);
		}
	}

	for (const sectionId of internshipLayoutSectionIds) {
		if (seen.has(sectionId)) continue;
		ordered.push(sectionId);
	}

	return ordered.filter((sectionId) => hasVisibleInternshipSection(data, sectionId));
}

function paginateInternshipSections(
	data: ResumeData,
	sectionIds: readonly InternshipLayoutSectionId[],
): InternshipPageBlock[][] {
	const pages: InternshipPageBlock[][] = [[]];
	let used = 0;

	for (const sectionId of sectionIds) {
		if (sectionId === "awards") {
			const result = paginateInternshipAwards(data, pages, used);
			used = result.used;
			continue;
		}

		const weight = estimateInternshipSectionWeight(data, sectionId);
		if (getCurrentPage(pages).length > 0 && used + weight > getCurrentInternshipPageCapacity(pages)) {
			pages.push([]);
			used = 0;
		}

		getCurrentPage(pages).push({
			end: getVisibleItems(data.sections[sectionId]).length,
			sectionId,
			start: 0,
		});
		used += weight;
	}

	return pages.filter((page) => page.length > 0);
}

function paginateInternshipAwards(data: ResumeData, pages: InternshipPageBlock[][], used: number) {
	const awards = getVisibleItems(data.sections.awards);
	let nextUsed = used;

	if (awards.length <= INTERNSHIP_KEEP_AWARDS_TOGETHER_LIMIT) {
		const requiredStartItems = Math.min(INTERNSHIP_MIN_AWARD_ITEMS_AT_SECTION_START, awards.length);
		const availableItems = Math.floor(
			(getCurrentInternshipPageCapacity(pages) - nextUsed - INTERNSHIP_AWARDS_SECTION_BASE_WEIGHT) /
				INTERNSHIP_AWARD_ITEM_WEIGHT,
		);
		if (getCurrentPage(pages).length > 0 && availableItems < requiredStartItems) {
			pages.push([]);
			nextUsed = 0;
		}

		getCurrentPage(pages).push({
			end: awards.length,
			sectionId: "awards",
			start: 0,
		});

		return { used: nextUsed + INTERNSHIP_AWARDS_SECTION_BASE_WEIGHT + awards.length * INTERNSHIP_AWARD_ITEM_WEIGHT };
	}

	let start = 0;

	while (start < awards.length) {
		const currentPage = getCurrentPage(pages);
		const isContinuation = start > 0;
		const baseWeight = isContinuation ? 0 : INTERNSHIP_AWARDS_SECTION_BASE_WEIGHT;
		const availableWeight = getCurrentInternshipPageCapacity(pages) - nextUsed - baseWeight;
		if (!isContinuation && currentPage.length > 0) {
			const availableItems = Math.max(0, Math.floor(availableWeight / INTERNSHIP_AWARD_ITEM_WEIGHT));
			const requiredStartItems = Math.min(INTERNSHIP_MIN_AWARD_ITEMS_AT_SECTION_START, awards.length - start);
			if (availableItems < requiredStartItems) {
				pages.push([]);
				nextUsed = 0;
				continue;
			}
		}

		const itemCount = Math.min(
			awards.length - start,
			Math.max(0, Math.floor(availableWeight / INTERNSHIP_AWARD_ITEM_WEIGHT)),
		);

		if (itemCount <= 0) {
			pages.push([]);
			nextUsed = 0;
			continue;
		}

		currentPage.push({
			continuation: isContinuation,
			end: start + itemCount,
			sectionId: "awards",
			start,
		});
		nextUsed += baseWeight + itemCount * INTERNSHIP_AWARD_ITEM_WEIGHT;
		start += itemCount;
	}

	return { used: nextUsed };
}

function getCurrentPage(pages: InternshipPageBlock[][]) {
	const page = pages.at(-1);
	if (!page) {
		const nextPage: InternshipPageBlock[] = [];
		pages.push(nextPage);
		return nextPage;
	}

	return page;
}

function getCurrentInternshipPageCapacity(pages: InternshipPageBlock[][]) {
	return pages.length <= 1 ? INTERNSHIP_FIRST_PAGE_CAPACITY : INTERNSHIP_CONTINUATION_PAGE_CAPACITY;
}

function getInternshipPageBlockKey(block: InternshipPageBlock) {
	return `${block.sectionId}-${block.start}-${block.end}`;
}

function estimateInternshipSectionWeight(data: ResumeData, sectionId: InternshipLayoutSectionId) {
	switch (sectionId) {
		case "education":
			return 0.95 + getVisibleItems(data.sections.education).length * 1.25;
		case "awards":
			return (
				INTERNSHIP_AWARDS_SECTION_BASE_WEIGHT +
				getVisibleItems(data.sections.awards).length * INTERNSHIP_AWARD_ITEM_WEIGHT
			);
		case "experience":
			return 0.95 + getVisibleItems(data.sections.experience).length * 1.55;
		case "projects":
			return 0.95 + getVisibleItems(data.sections.projects).length * 1.65;
	}
}

function hasVisibleInternshipSection(data: ResumeData, sectionId: InternshipLayoutSectionId) {
	return getVisibleItems(data.sections[sectionId]).length > 0;
}

function AtsCompactLivePreview({ data, onEdit }: WordTemplateDataPreviewProps) {
	const previewRef = useRef<HTMLDivElement>(null);
	const experience = buildAtsExperienceUnits(getVisibleItems(data.sections.experience));
	const education = getVisibleItems(data.sections.education);
	const projects = buildAtsProjectUnits(getVisibleItems(data.sections.projects));
	const awards = getVisibleItems(data.sections.awards);
	const skills = getVisibleItems(data.sections.skills);
	const sections = { awards, education, experience, projects, skills } satisfies AtsPreviewSections;
	const sectionOrder = getSavedWordSectionOrder(data, atsSectionIds).filter(
		(sectionId) => sections[sectionId].length > 0,
	);
	const { canMeasureLayout, measureRootRef, pages } = useMeasuredAtsPages({
		previewRef,
		sectionOrder,
		sections,
	});
	const firstPageBlocks = pages[0] ?? [];
	const continuationPages = pages.slice(1);

	return (
		<div
			ref={previewRef}
			data-testid="word-template-data-preview"
			data-template-variant="ats-polished-single-column"
			className="relative flex w-full flex-col gap-3 text-[#222] [container-type:inline-size]"
			style={{ fontSize: "clamp(7px, 1.76cqw, 12.2px)" }}
		>
			<div
				data-word-template-preview-page
				className="relative aspect-page w-full overflow-hidden bg-[#fdfdfc] px-[4.55em] py-[3.35em] shadow-sm"
			>
				<AtsHeader data={data} onEdit={onEdit} />

				<div className="mt-[0.9em]">
					<AtsSectionBlocks blocks={firstPageBlocks} sections={sections} onEdit={onEdit} />
				</div>
			</div>

			{continuationPages.map((continuationSectionOrder, pageIndex) => (
				<div
					key={pageIndex}
					data-word-template-preview-page
					className="relative aspect-page w-full overflow-hidden bg-[#fdfdfc] px-[4.55em] py-[3.35em] shadow-sm"
				>
					<div>
						<AtsSectionBlocks blocks={continuationSectionOrder} sections={sections} onEdit={onEdit} />
					</div>
				</div>
			))}

			{canMeasureLayout ? (
				<AtsMeasurementHost
					data={data}
					measureRootRef={measureRootRef}
					sectionOrder={sectionOrder}
					sections={sections}
				/>
			) : null}
		</div>
	);
}

function AtsSectionBlocks({
	blocks,
	measure = false,
	onEdit,
	sections,
}: {
	blocks: readonly AtsPageBlock[];
	measure?: boolean;
	onEdit?: (target: WordTemplateEditTarget, value: string) => void;
	sections: AtsPreviewSections;
}) {
	return blocks.map((block) => (
		<Fragment key={[block.sectionId, block.start, block.end].join("-")}>
			{block.sectionId === "education" && sections.education.length > 0 ? (
				<AtsSectionShell block={block} measureSectionId={measure ? block.sectionId : undefined} title="教育经历">
					{sections.education.slice(block.start, block.end).map((item) => (
						<CompactItem
							key={item.id}
							measureItemId={measure ? item.id : undefined}
							title={item.school}
							subtitle={[item.area, item.degree].filter(Boolean).join(" | ")}
							period={item.period}
							description={item.description}
							onTitleCommit={(value) => onEdit?.({ type: "education", id: item.id, field: "school" }, value)}
							onSubtitleCommit={(value) => {
								const [area, degree] = splitCombinedText(value);
								onEdit?.({ type: "education", id: item.id, field: "area" }, area);
								onEdit?.({ type: "education", id: item.id, field: "degree" }, degree);
							}}
							onPeriodCommit={(value) => onEdit?.({ type: "education", id: item.id, field: "period" }, value)}
							onDescriptionCommit={(value) => onEdit?.({ type: "education", id: item.id, field: "description" }, value)}
						/>
					))}
				</AtsSectionShell>
			) : null}

			{block.sectionId === "experience" && sections.experience.length > 0 ? (
				<AtsSectionShell block={block} measureSectionId={measure ? block.sectionId : undefined} title="工作经历">
					<AtsExperienceUnits
						units={sections.experience.slice(block.start, block.end)}
						measure={measure}
						onEdit={onEdit}
					/>
				</AtsSectionShell>
			) : null}

			{block.sectionId === "projects" && sections.projects.length > 0 ? (
				<AtsSectionShell block={block} measureSectionId={measure ? block.sectionId : undefined} title="项目经历">
					<AtsProjectUnits units={sections.projects.slice(block.start, block.end)} measure={measure} onEdit={onEdit} />
				</AtsSectionShell>
			) : null}

			{block.sectionId === "awards" && sections.awards.length > 0 ? (
				<AtsSectionShell block={block} measureSectionId={measure ? block.sectionId : undefined} title="获奖荣誉">
					{sections.awards.slice(block.start, block.end).map((item) => (
						<div key={item.id} data-ats-measure-item={measure ? item.id : undefined}>
							<EditableText
								as="p"
								label="获奖荣誉"
								value={[item.date, item.title].filter(Boolean).join("  ")}
								fallback="获奖荣誉"
								className="block text-[0.95em] leading-[1.6]"
								onCommit={(value) => {
									const nextAward = splitAwardLine(value, item.date);
									onEdit?.({ type: "award", id: item.id, field: "date" }, nextAward.date);
									onEdit?.({ type: "award", id: item.id, field: "title" }, nextAward.title);
								}}
							/>
						</div>
					))}
				</AtsSectionShell>
			) : null}

			{block.sectionId === "skills" && sections.skills.length > 0 ? (
				<AtsSectionShell block={block} measureSectionId={measure ? block.sectionId : undefined} title="技能特长">
					<div className="space-y-[0.35em] text-[0.96em] leading-[1.65]">
						{sections.skills.slice(block.start, block.end).map((item) => (
							<div key={item.id} data-ats-measure-item={measure ? item.id : undefined}>
								<EditableText
									as="p"
									label="技能特长"
									value={formatSkillLine(item)}
									fallback="技能特长：关键词"
									onCommit={(value) => onEdit?.({ type: "skill", id: item.id, field: "keywords" }, value)}
								/>
							</div>
						))}
					</div>
				</AtsSectionShell>
			) : null}
		</Fragment>
	));
}

function AtsSectionShell({
	block,
	children,
	measureSectionId,
	title,
}: {
	block: AtsPageBlock;
	children: React.ReactNode;
	measureSectionId?: AtsSectionId;
	title: string;
}) {
	if (block.start > 0) return <div className="mb-[0.75em]">{children}</div>;
	return (
		<CompactSection measureSectionId={measureSectionId} title={title}>
			{children}
		</CompactSection>
	);
}
function useMeasuredAtsPages({
	previewRef,
	sectionOrder,
	sections,
}: {
	previewRef: React.RefObject<HTMLDivElement | null>;
	sectionOrder: readonly AtsSectionId[];
	sections: AtsPreviewSections;
}) {
	const measureRootRef = useRef<HTMLDivElement>(null);
	const [canMeasureLayout, setCanMeasureLayout] = useState(false);
	const [pages, setPages] = useState(() => paginateAtsSections(sectionOrder, sections));

	useEffect(() => {
		if (canMeasureLayout) return;

		const animationFrameId = window.requestAnimationFrame(() => {
			const firstPage = previewRef.current?.querySelector<HTMLElement>("[data-word-template-preview-page]");
			setCanMeasureLayout((firstPage?.getBoundingClientRect().height ?? 0) > 0);
		});

		return () => window.cancelAnimationFrame(animationFrameId);
	}, [canMeasureLayout, previewRef]);

	useEffect(() => {
		if (!canMeasureLayout) return;

		const measure = () => {
			const measureRoot = measureRootRef.current;
			const previewRoot = previewRef.current;
			const firstPage = previewRoot?.querySelector<HTMLElement>("[data-word-template-preview-page]");
			if (!measureRoot || !previewRoot || !firstPage) return;

			const fontSizePx = Number.parseFloat(getComputedStyle(previewRoot).fontSize);
			if (!Number.isFinite(fontSizePx) || fontSizePx <= 0) return;

			const firstPageRect = firstPage.getBoundingClientRect();
			const pageHeight = firstPage.offsetHeight || firstPageRect.height;
			if (pageHeight <= 0) return;

			const visualToLayoutScale = firstPageRect.height > 0 && pageHeight > 0 ? firstPageRect.height / pageHeight : 1;
			const toLayoutPx = (value: number) => (visualToLayoutScale > 0 ? value / visualToLayoutScale : value);
			const getLayoutHeight = (element: HTMLElement) =>
				element.offsetHeight || toLayoutPx(element.getBoundingClientRect().height);
			const getLayoutPx = (element: HTMLElement, property: string) => {
				const value = getComputedStyle(element).getPropertyValue(property);
				const parsed = Number.parseFloat(value);
				return Number.isFinite(parsed) ? parsed : 0;
			};

			const headerElement = measureRoot.querySelector<HTMLElement>('[data-ats-measure="header"]');
			const headerHeight = headerElement ? getLayoutHeight(headerElement) : 0;
			const bodyElement = measureRoot.querySelector<HTMLElement>('[data-ats-measure="body"]');
			const bodyTopGap = bodyElement ? getLayoutPx(bodyElement, "margin-top") : 0;
			const firstPagePaddingY = firstPageRect.height > 0 ? fontSizePx * 3.35 * 2 : 0;
			const continuationPaddingY = firstPagePaddingY;
			const sectionMeasurements: Partial<
				Record<AtsSectionId, { footerGap?: number; items: { bottom: number; top: number }[] }>
			> = {};

			for (const sectionElement of Array.from(
				measureRoot.querySelectorAll<HTMLElement>("[data-ats-measure-section]"),
			)) {
				const sectionId = sectionElement.dataset.atsMeasureSection as AtsSectionId | undefined;
				if (!sectionId) continue;

				const sectionRect = sectionElement.getBoundingClientRect();
				const itemElements = Array.from(sectionElement.querySelectorAll<HTMLElement>("[data-ats-measure-item]"));
				const items = itemElements
					.map((itemElement) => {
						const rect = itemElement.getBoundingClientRect();
						return {
							bottom: toLayoutPx(rect.bottom - sectionRect.top),
							top: toLayoutPx(rect.top - sectionRect.top),
						};
					})
					.filter((item) => item.bottom > item.top);

				const lastItem = items.at(-1);
				const sectionMarginBottom = getLayoutPx(sectionElement, "margin-bottom");
				sectionMeasurements[sectionId] = {
					footerGap: Math.max(0, getLayoutHeight(sectionElement) - (lastItem?.bottom ?? 0) + sectionMarginBottom),
					items,
				};
			}

			const nextPages = paginateAtsMeasuredLayout({
				continuationPageCapacity: Math.max(1, pageHeight - continuationPaddingY),
				firstPageCapacity: Math.max(1, pageHeight - firstPagePaddingY - headerHeight - bodyTopGap),
				minSectionStartItems: ATS_MIN_SECTION_START_ITEMS,
				sectionMeasurements,
				sectionOrder,
			});

			setPages((current) => (areAtsPagesEqual(current, nextPages) ? current : nextPages));
		};

		const animationFrameId = window.requestAnimationFrame(measure);
		return () => window.cancelAnimationFrame(animationFrameId);
	}, [canMeasureLayout, previewRef, sectionOrder]);

	return { canMeasureLayout, measureRootRef, pages };
}

function areAtsPagesEqual(current: AtsPageBlock[][], next: AtsPageBlock[][]) {
	if (current.length !== next.length) return false;

	return current.every((page, pageIndex) => {
		const nextPage = next[pageIndex];
		if (!nextPage || page.length !== nextPage.length) return false;

		return page.every((block, blockIndex) => {
			const nextBlock = nextPage[blockIndex];
			return (
				!!nextBlock &&
				block.sectionId === nextBlock.sectionId &&
				block.start === nextBlock.start &&
				block.end === nextBlock.end
			);
		});
	});
}

function AtsMeasurementHost({
	data,
	measureRootRef,
	sectionOrder,
	sections,
}: {
	data: ResumeData;
	measureRootRef: React.RefObject<HTMLDivElement | null>;
	sectionOrder: readonly AtsSectionId[];
	sections: AtsPreviewSections;
}) {
	return (
		<div aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-0">
			<div ref={measureRootRef} data-ats-measure-root className="flex w-full flex-col gap-3 text-[#222]">
				<div className="relative aspect-page w-full overflow-hidden bg-[#fdfdfc] px-[4.55em] py-[3.35em] shadow-sm">
					<div data-ats-measure="header">
						<AtsHeader data={data} />
					</div>
					<div className="mt-[0.9em]" data-ats-measure="body">
						<AtsSectionBlocks
							blocks={sectionOrder.map((sectionId) => ({ end: sections[sectionId].length, sectionId, start: 0 }))}
							measure
							sections={sections}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}

function paginateAtsSections(sectionOrder: readonly AtsSectionId[], sections: AtsPreviewSections): AtsPageBlock[][] {
	const pages: AtsPageBlock[][] = [[]];
	let used = 0;

	for (const sectionId of sectionOrder) {
		const itemCount = sections[sectionId].length;
		if (itemCount === 0) continue;

		const headingWeight = 0.68;
		const itemWeight = getAtsSectionItemWeight(sectionId);
		let start = 0;

		while (start < itemCount) {
			const currentPage = pages.at(-1) ?? [];
			const capacity = pages.length === 1 ? ATS_FIRST_PAGE_CAPACITY : ATS_CONTINUATION_PAGE_CAPACITY;
			const remaining = capacity - used;

			if (currentPage.length > 0 && remaining < headingWeight + itemWeight) {
				pages.push([]);
				used = 0;
				continue;
			}

			const availableForItems = Math.max(itemWeight, remaining - headingWeight);
			const fitItemCount = Math.max(0, Math.floor(availableForItems / itemWeight));
			const minimumStartItemCount = Math.min(ATS_MIN_SECTION_START_ITEMS[sectionId] ?? 1, itemCount - start);
			if (start === 0 && currentPage.length > 0 && fitItemCount < minimumStartItemCount) {
				pages.push([]);
				used = 0;
				continue;
			}

			const nextItemCount = Math.min(itemCount - start, Math.max(1, fitItemCount));
			const end = start + nextItemCount;

			(pages.at(-1) ?? currentPage).push({ end, sectionId, start });
			used += headingWeight + nextItemCount * itemWeight;
			start = end;

			if (start < itemCount) {
				pages.push([]);
				used = 0;
			}
		}
	}

	return pages.filter((page) => page.length > 0);
}

function getAtsSectionItemWeight(sectionId: AtsSectionId) {
	switch (sectionId) {
		case "education":
			return 0.95;
		case "experience":
			return 0.36;
		case "projects":
			return 0.36;
		case "awards":
			return 0.28;
		case "skills":
			return 0.34;
	}
}

function AtsHeader({ data, onEdit }: WordTemplateDataPreviewProps) {
	const portfolio = getAtsPortfolioItem(data);

	return (
		<header className="relative border-[#1f4e79] border-b-[0.14em] pr-[7.2em] pb-[0.72em] text-left">
			<EditableText
				as="h1"
				label="姓名"
				value={data.basics.name}
				fallback="姓名"
				className="block font-bold text-[#1d2730] text-[2.25em] leading-none tracking-[0.02em]"
				onCommit={(value) => onEdit?.({ type: "basics", field: "name" }, value)}
			/>
			<EditableText
				as="p"
				label="求职方向"
				value={data.basics.headline}
				fallback="求职方向"
				className="mt-[0.52em] block font-semibold text-[#1f4e79] text-[0.98em]"
				onCommit={(value) => onEdit?.({ type: "basics", field: "headline" }, value)}
			/>
			<div
				data-ats-contact-strip
				className="mt-[0.72em] flex max-w-full flex-wrap gap-x-[0.7em] gap-y-[0.36em] text-[0.74em]"
			>
				<AtsContactItem
					label="电话"
					value={data.basics.phone}
					onCommit={(value) => onEdit?.({ type: "basics", field: "phone" }, value)}
				/>
				<AtsContactItem
					label="邮箱"
					value={data.basics.email}
					onCommit={(value) => onEdit?.({ type: "basics", field: "email" }, value)}
				/>
				<AtsContactItem
					label="城市"
					value={data.basics.location}
					onCommit={(value) => onEdit?.({ type: "basics", field: "location" }, value)}
				/>
				{portfolio ? (
					<AtsContactItem
						label={portfolio.label}
						value={portfolio.value}
						onCommit={(value) => onEdit?.({ type: "websiteUrl" }, value)}
					/>
				) : null}
			</div>
			<div aria-hidden="true" className="hidden">
				<EditableText
					label="电话"
					value={data.basics.phone}
					fallback="电话"
					onCommit={(value) => onEdit?.({ type: "basics", field: "phone" }, value)}
				/>
				<span aria-hidden>|</span>
				<EditableText
					label="邮箱"
					value={data.basics.email}
					fallback="邮箱"
					onCommit={(value) => onEdit?.({ type: "basics", field: "email" }, value)}
				/>
				<span aria-hidden>|</span>
				<EditableText
					label="城市"
					value={data.basics.location}
					fallback="城市"
					onCommit={(value) => onEdit?.({ type: "basics", field: "location" }, value)}
				/>
			</div>
			<div className="absolute top-0 right-0 grid aspect-[4/5] w-[5.6em] place-items-center overflow-hidden border border-[#cfd9e0] bg-[#f3f6f8] text-[#87939d] text-[0.72em]">
				{data.picture.hidden || !data.picture.url ? (
					<span>照片</span>
				) : (
					<img
						src={data.picture.url}
						alt={textOrFallback(data.basics.name, "照片")}
						className="size-full object-cover"
					/>
				)}
			</div>
		</header>
	);
}

function AtsContactItem({
	label,
	onCommit,
	value,
}: {
	label: string;
	onCommit?: (value: string) => void;
	value?: string;
}) {
	if (!value?.trim() && !onCommit) return null;

	return (
		<span className="inline-flex max-w-full items-center gap-[0.34em] rounded-[0.2em] bg-[#f3f6f8] px-[0.58em] py-[0.24em] text-[#3f4c56]">
			<span className="shrink-0 text-[#7b8892]">{label}</span>
			<EditableText
				label={label}
				value={value}
				fallback="-"
				className="min-w-0 truncate font-medium text-[#26323b]"
				onCommit={onCommit}
			/>
		</span>
	);
}

function getAtsPortfolioItem(data: ResumeData) {
	const customGithub = data.basics.customFields.find((field) => {
		const value = `${field.icon} ${field.text} ${field.link}`.toLowerCase();
		return value.includes("github");
	});

	if (customGithub?.text?.trim()) return { label: "GitHub", value: customGithub.text.trim() };

	const profileGithub = getVisibleItems(data.sections.profiles).find((profile) => {
		const value =
			`${profile.icon} ${profile.network} ${profile.username} ${profile.website.label} ${profile.website.url}`.toLowerCase();
		return value.includes("github");
	});

	if (profileGithub) {
		const value = profileGithub.website.label || profileGithub.username || profileGithub.website.url;
		if (value.trim()) return { label: "GitHub", value: value.trim() };
	}

	const website = data.basics.website.label || data.basics.website.url;
	if (website.trim()) return { label: "链接", value: website.trim() };

	return null;
}

function getSidebarPortfolioItem(data: ResumeData) {
	return getAtsPortfolioItem(data);
}

function SidebarLivePreview({ data, onEdit }: WordTemplateDataPreviewProps) {
	const experience = getVisibleItems(data.sections.experience);
	const education = getVisibleItems(data.sections.education);
	const projects = getVisibleItems(data.sections.projects);
	const awards = getVisibleItems(data.sections.awards);
	const skills = getVisibleItems(data.sections.skills);
	const asideSectionOrder = getSavedWordSectionOrder(data, sidebarAsideSectionIds);
	const mainSectionOrder = getSidebarMainSectionOrder(data);
	const summary = data.summary.hidden ? "" : htmlToPlainText(data.summary.content);
	const mainUnits = buildSidebarMainUnits({
		awards,
		experience,
		projects,
		sectionOrder: mainSectionOrder,
		summary,
		summaryTitle: data.summary.title.trim() || "个人优势",
	});
	const pages = paginateSidebarMainUnits(mainUnits);
	const visiblePages = pages.length > 0 ? pages : [[]];

	return (
		<div
			data-testid="word-template-data-preview"
			data-template-variant="sidebar-polished-two-column"
			className="relative flex w-full flex-col gap-3 text-[#202020] [container-type:inline-size]"
			style={{ fontSize: "clamp(7px, 1.86cqw, 12.6px)" }}
		>
			{visiblePages.map((pageUnits, pageIndex) => (
				<div
					key={pageIndex}
					data-word-template-preview-page
					className="relative aspect-page w-full overflow-hidden bg-[#fbfaf7] shadow-sm"
				>
					{pageIndex === 0 ? (
						<div className="grid h-full grid-cols-[31%_1fr]">
							<SidebarAside
								asideSectionOrder={asideSectionOrder}
								data={data}
								education={education}
								onEdit={onEdit}
								skills={skills}
							/>
							<main className="overflow-hidden bg-[#fbfaf7] px-[3.15em] py-[2.85em]">
								<SidebarMainUnits onEdit={onEdit} units={pageUnits} />
							</main>
						</div>
					) : (
						<SidebarContinuationPage data={data} onEdit={onEdit} units={pageUnits} />
					)}
				</div>
			))}
		</div>
	);
}

function getSidebarMainSectionOrder(data: ResumeData): SidebarMainSectionId[] {
	const savedOrder = getSavedWordSectionOrder(data, sidebarMainSectionIds);
	const awardsIndex = savedOrder.indexOf("awards");
	if (awardsIndex === -1 || awardsIndex === savedOrder.length - 1) return savedOrder;

	const nonAwardSections: SidebarMainSectionId[] = savedOrder.filter((sectionId) => sectionId !== "awards");
	return [...nonAwardSections, "awards"];
}

function SidebarAside({
	asideSectionOrder,
	data,
	education,
	onEdit,
	skills,
}: {
	asideSectionOrder: readonly (typeof sidebarAsideSectionIds)[number][];
	data: ResumeData;
	education: ResumeData["sections"]["education"]["items"];
	onEdit?: (target: WordTemplateEditTarget, value: string) => void;
	skills: ResumeData["sections"]["skills"]["items"];
}) {
	const portfolio = getSidebarPortfolioItem(data);

	return (
		<aside className="h-full overflow-hidden bg-[#263545] px-[2.22em] py-[2.78em] text-white">
			<div
				data-sidebar-photo-frame
				className="mx-auto mb-[1.2em] grid aspect-[4/5] w-[58%] place-items-center overflow-hidden border border-white/45 bg-white/8 text-[0.78em] text-white/55"
			>
				{data.picture.hidden || !data.picture.url ? (
					<span>照片</span>
				) : (
					<img
						src={data.picture.url}
						alt={textOrFallback(data.basics.name, "照片")}
						className="size-full object-cover"
					/>
				)}
			</div>

			<div className="mb-[1.58em] border-white/18 border-b pb-[1.16em] text-center">
				<EditableText
					as="h1"
					label="姓名"
					value={data.basics.name}
					fallback="姓名"
					className="block break-words font-semibold text-[2.18em] leading-tight"
					onCommit={(value) => onEdit?.({ type: "basics", field: "name" }, value)}
				/>
				<EditableText
					as="p"
					label="求职方向"
					value={data.basics.headline}
					fallback="求职方向"
					className="mt-[0.66em] block text-[#d8c38a] text-[0.92em] leading-snug"
					onCommit={(value) => onEdit?.({ type: "basics", field: "headline" }, value)}
				/>
			</div>

			<SidebarSection title="联系方式">
				<SidebarRow
					label="手机"
					value={data.basics.phone}
					onCommit={(value) => onEdit?.({ type: "basics", field: "phone" }, value)}
				/>
				<SidebarRow
					label="邮箱"
					value={data.basics.email}
					onCommit={(value) => onEdit?.({ type: "basics", field: "email" }, value)}
				/>
				<SidebarRow
					label="城市"
					value={data.basics.location}
					onCommit={(value) => onEdit?.({ type: "basics", field: "location" }, value)}
				/>
			</SidebarSection>

			{portfolio ? (
				<SidebarSection title="个人链接">
					<SidebarRow
						label={portfolio.label}
						value={portfolio.value}
						onCommit={(value) => onEdit?.({ type: "websiteUrl" }, value)}
					/>
				</SidebarSection>
			) : null}

			{asideSectionOrder.map((sectionId) => (
				<Fragment key={sectionId}>
					{sectionId === "education" && education.length > 0 ? (
						<SidebarSection title="教育背景">
							{education.map((item) => (
								<div key={item.id} className="mb-[0.82em] text-[0.82em] leading-[1.48]">
									<EditableText
										as="p"
										label="学校"
										value={item.school}
										fallback="学校"
										className="block font-semibold"
										onCommit={(value) => onEdit?.({ type: "education", id: item.id, field: "school" }, value)}
									/>
									<EditableText
										as="p"
										label="专业学历"
										value={[item.area, item.degree].filter(Boolean).join(" / ")}
										fallback="专业 / 学历"
										className="block text-white/75"
										onCommit={(value) => {
											const [area, degree] = splitCombinedText(value);
											onEdit?.({ type: "education", id: item.id, field: "area" }, area);
											onEdit?.({ type: "education", id: item.id, field: "degree" }, degree);
										}}
									/>
									<EditableText
										as="p"
										label="时间"
										value={item.period}
										fallback="时间"
										className="block text-white/65"
										onCommit={(value) => onEdit?.({ type: "education", id: item.id, field: "period" }, value)}
									/>
								</div>
							))}
						</SidebarSection>
					) : null}

					{sectionId === "skills" && skills.length > 0 ? (
						<SidebarSection title="核心技能">
							<div className="space-y-[0.52em] text-[0.8em] leading-[1.42]">
								{skills.map((item) => (
									<EditableText
										key={item.id}
										as="p"
										label="核心技能"
										value={formatSkillLine(item)}
										fallback="核心技能：关键词"
										className="block text-white/92"
										onCommit={(value) => onEdit?.({ type: "skill", id: item.id, field: "keywords" }, value)}
									/>
								))}
							</div>
						</SidebarSection>
					) : null}
				</Fragment>
			))}
		</aside>
	);
}

function SidebarContinuationPage({
	data,
	onEdit,
	units,
}: WordTemplateDataPreviewProps & { units: readonly SidebarMainUnit[] }) {
	return (
		<div className="flex h-full flex-col overflow-hidden bg-[#fbfaf7] px-[3.15em] py-[2.7em]">
			<header className="mb-[1.15em] border-[#d8c38a]/65 border-b pb-[0.72em]">
				<div className="grid grid-cols-[1fr_auto] items-end gap-[1.4em]">
					<div className="min-w-0">
						<EditableText
							as="p"
							label="姓名"
							value={data.basics.name}
							fallback="姓名"
							className="block truncate font-semibold text-[#263545] text-[1.42em] leading-tight"
							onCommit={(value) => onEdit?.({ type: "basics", field: "name" }, value)}
						/>
						<EditableText
							as="p"
							label="求职方向"
							value={data.basics.headline}
							fallback="求职方向"
							className="mt-[0.2em] block truncate text-[#6e6a5f] text-[0.82em] leading-snug"
							onCommit={(value) => onEdit?.({ type: "basics", field: "headline" }, value)}
						/>
					</div>
					<div className="grid max-w-[24em] grid-cols-[auto_auto_auto] gap-x-[0.72em] text-[#66737d] text-[0.76em] leading-snug">
						<EditableText
							label="手机"
							value={data.basics.phone}
							fallback="手机"
							className="whitespace-nowrap"
							onCommit={(value) => onEdit?.({ type: "basics", field: "phone" }, value)}
						/>
						<EditableText
							label="邮箱"
							value={data.basics.email}
							fallback="邮箱"
							className="whitespace-nowrap"
							onCommit={(value) => onEdit?.({ type: "basics", field: "email" }, value)}
						/>
						<EditableText
							label="城市"
							value={data.basics.location}
							fallback="城市"
							className="whitespace-nowrap"
							onCommit={(value) => onEdit?.({ type: "basics", field: "location" }, value)}
						/>
					</div>
				</div>
			</header>
			<main className="min-h-0 flex-1 overflow-hidden bg-[#fbfaf7]">
				<SidebarMainUnits onEdit={onEdit} units={units} />
			</main>
		</div>
	);
}

function SidebarMainUnits({
	onEdit,
	units,
}: {
	onEdit?: (target: WordTemplateEditTarget, value: string) => void;
	units: readonly SidebarMainUnit[];
}) {
	const renderedUnits: React.ReactNode[] = [];

	for (let index = 0; index < units.length; index++) {
		const unit = units[index];
		if (!unit) continue;

		if (unit.kind === "section-title") {
			renderedUnits.push(<SidebarMainTitle key={unit.key} title={unit.title} />);
			continue;
		}

		if (unit.kind === "summary") {
			renderedUnits.push(<SidebarMainSummary key={unit.key} unit={unit} onEdit={onEdit} />);
			continue;
		}

		if (unit.kind === "awards-group") {
			renderedUnits.push(<SidebarAwardsSection key={unit.key} unit={unit} onEdit={onEdit} />);
			continue;
		}

		if (unit.kind === "experience-header") {
			renderedUnits.push(
				<SidebarEntryHeader
					key={unit.key}
					gapBefore={unit.gapBefore}
					period={unit.item.period}
					subtitle={unit.item.position}
					title={unit.item.company}
					onPeriodCommit={(value) => onEdit?.({ type: "experience", id: unit.item.id, field: "period" }, value)}
					onSubtitleCommit={(value) => onEdit?.({ type: "experience", id: unit.item.id, field: "position" }, value)}
					onTitleCommit={(value) => onEdit?.({ type: "experience", id: unit.item.id, field: "company" }, value)}
				/>,
			);
			continue;
		}

		if (unit.kind === "project-header") {
			renderedUnits.push(
				<SidebarEntryHeader
					key={unit.key}
					gapBefore={unit.gapBefore}
					period={unit.item.period}
					title={unit.item.name}
					onPeriodCommit={(value) => onEdit?.({ type: "project", id: unit.item.id, field: "period" }, value)}
					onTitleCommit={(value) => onEdit?.({ type: "project", id: unit.item.id, field: "name" }, value)}
				/>,
			);
			continue;
		}

		renderedUnits.push(
			<SidebarDescriptionLine
				key={unit.key}
				label="条目描述"
				line={unit.line}
				onCommit={(value) => {
					const nextDescription = replaceDescriptionLine(unit.item.description, unit.lineIndex, value);
					onEdit?.(
						{
							type: unit.kind === "experience-description" ? "experience" : "project",
							id: unit.item.id,
							field: "description",
						},
						nextDescription,
					);
				}}
				trailingGap={unit.trailingGap}
			/>,
		);
	}

	return <div>{renderedUnits}</div>;
}

function SidebarMainSummary({
	onEdit,
	unit,
}: {
	onEdit?: (target: WordTemplateEditTarget, value: string) => void;
	unit: Extract<SidebarMainUnit, { kind: "summary" }>;
}) {
	return (
		<section className="mb-[0.95em]">
			<SidebarMainTitle title={unit.title} />
			<EditableText
				as="p"
				label="个人优势"
				multiline
				value={unit.content}
				fallback="个人优势"
				className="block whitespace-pre-line rounded-[0.18em] text-[#333] text-[0.86em] leading-[1.5] outline-none transition-colors hover:bg-[#1296db]/10 focus:bg-[#eaf6ff] focus:ring-[#1296db]/35 focus:ring-[0.12em]"
				onCommit={(value) => onEdit?.({ type: "summary" }, value)}
			/>
		</section>
	);
}

function SidebarAwardsSection({
	onEdit,
	unit,
}: {
	onEdit?: (target: WordTemplateEditTarget, value: string) => void;
	unit: Extract<SidebarMainUnit, { kind: "awards-group" }>;
}) {
	return (
		<section className={cn(unit.continuation ? "mt-0" : "mt-[0.64em]")}>
			<SidebarMainTitle compact={unit.continuation} title={unit.title} />
			<SidebarAwards awards={unit.items} onEdit={onEdit} />
		</section>
	);
}

function SidebarAwards({
	awards,
	onEdit,
}: {
	awards: readonly SidebarAwardItem[];
	onEdit?: (target: WordTemplateEditTarget, value: string) => void;
}) {
	return (
		<div className="mb-[0.48em] space-y-[0.16em]">
			{awards.map((item) => {
				const hasDate = Boolean(item.date?.trim());

				return (
					<div
						key={item.id}
						className={cn(
							"grid items-baseline gap-x-[0.72em]",
							hasDate ? "grid-cols-[minmax(0,1fr)_6.2em]" : "grid-cols-1",
						)}
					>
						<EditableText
							as="span"
							label="奖项名称"
							value={item.title}
							fallback="奖项名称"
							className="block min-w-0 text-[#2f3337] text-[0.8em] leading-[1.45]"
							onCommit={(value) => onEdit?.({ type: "award", id: item.id, field: "title" }, value)}
						/>
						{hasDate ? (
							<EditableText
								as="span"
								label="获奖时间"
								value={item.date}
								fallback="时间"
								className="block whitespace-nowrap text-right text-[#8a784d] text-[0.72em] leading-[1.45]"
								onCommit={(value) => onEdit?.({ type: "award", id: item.id, field: "date" }, value)}
							/>
						) : null}
					</div>
				);
			})}
		</div>
	);
}

function SidebarMainTitle({ compact = false, title }: { compact?: boolean; title: string }) {
	return (
		<h2
			className={cn(
				"grid grid-cols-[auto_1fr] items-center gap-[0.7em] font-bold text-[#263545]",
				compact ? "mb-[0.48em] text-[1.06em]" : "mb-[0.58em] text-[1.12em]",
			)}
		>
			<span>{title}</span>
			<span className="h-px bg-[#d8c38a]" />
		</h2>
	);
}

function SidebarEntryHeader({
	gapBefore,
	onPeriodCommit,
	onSubtitleCommit,
	onTitleCommit,
	period,
	subtitle,
	title,
}: {
	gapBefore: boolean;
	onPeriodCommit?: (value: string) => void;
	onSubtitleCommit?: (value: string) => void;
	onTitleCommit?: (value: string) => void;
	period?: string;
	subtitle?: string;
	title: string;
}) {
	return (
		<article className={cn("text-[0.91em] leading-[1.44]", gapBefore && "mt-[0.68em]")}>
			<div className="grid grid-cols-[1fr_auto] gap-[1em] font-bold">
				<EditableText
					as="h3"
					label="条目标题"
					value={title}
					fallback="未命名经历"
					className="min-w-0 text-[#1e2933]"
					onCommit={onTitleCommit}
				/>
				{period ? (
					<EditableText
						label="时间"
						value={period}
						fallback="时间"
						className="whitespace-nowrap text-[#66737d]"
						onCommit={onPeriodCommit}
					/>
				) : null}
			</div>
			{subtitle || onSubtitleCommit ? (
				<EditableText
					as="p"
					label="条目副标题"
					value={subtitle ?? ""}
					fallback="职位"
					className="mt-[0.04em] block font-medium text-[#5f6870]"
					onCommit={onSubtitleCommit}
				/>
			) : null}
		</article>
	);
}

function SidebarDescriptionLine({
	label,
	line,
	onCommit,
	trailingGap,
}: {
	label: string;
	line: string;
	onCommit?: (value: string) => void;
	trailingGap: boolean;
}) {
	return (
		<p
			contentEditable={Boolean(onCommit)}
			suppressContentEditableWarning
			{...(onCommit ? { "aria-label": label, role: "textbox" as const, tabIndex: 0 } : {})}
			className={cn(
				"rounded-[0.18em] text-[#333] text-[0.86em] leading-[1.42] outline-none transition-colors",
				onCommit && "cursor-text hover:bg-[#1296db]/10 focus:bg-[#eaf6ff] focus:ring-[#1296db]/35 focus:ring-[0.12em]",
				trailingGap ? "mb-[0.62em]" : "mb-[0.12em]",
			)}
			onBlur={(event) => {
				const nextValue = normalizeEditableText(event.currentTarget.innerText);
				if (nextValue === normalizeEditableText(line)) return;
				onCommit?.(nextValue);
			}}
		>
			{line}
		</p>
	);
}

type GridInfoProps = {
	label: string;
	onCommit?: (value: string) => void;
	value?: string;
};

function InternshipHeader({
	birthday,
	data,
	gender,
	onEdit,
}: {
	birthday: string;
	data: ResumeData;
	gender: string;
	onEdit?: (target: WordTemplateEditTarget, value: string) => void;
}) {
	return (
		<header className="relative mb-[2.15em] h-[11em]">
			<div className="absolute top-[4.14em] right-[-0.57em] left-[-0.85em] h-[6.43em] bg-[#f1f1f1]" />

			{data.picture.hidden || !data.picture.url ? (
				<div className="absolute top-0 left-[1.14em] grid h-[10.9em] w-[8.43em] place-items-center border border-[#d4dde4] bg-[#e9f2fb] text-[#7d8c96] text-[1em]">
					照片
				</div>
			) : (
				<img
					src={data.picture.url}
					alt={textOrFallback(data.basics.name, "照片")}
					className="absolute top-0 left-[1.14em] h-[10.9em] w-[8.43em] border border-[#d4dde4] object-cover"
				/>
			)}

			<div className="absolute top-[1.45em] left-[12.85em]">
				<EditableText
					as="h1"
					label="姓名"
					value={data.basics.name}
					fallback="姓名"
					className="block min-w-[3.4em] max-w-[12em] whitespace-nowrap font-normal text-[#555] text-[2.35em] leading-none"
					onCommit={(value) => onEdit?.({ type: "basics", field: "name" }, value)}
				/>
			</div>

			<div className="absolute top-[5.62em] right-[2.6em] left-[13.1em] grid grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-x-[2em] gap-y-[0.48em] text-[#555] text-[1.05em] leading-[1.25]">
				<InlineInfo
					label="性别"
					value={gender}
					onCommit={(value) => onEdit?.({ icon: "user", id: "zh-internship-gender", type: "customField" }, value)}
				/>
				<InlineInfo
					label="出生日期"
					value={birthday}
					onCommit={(value) => onEdit?.({ icon: "calendar", id: "zh-internship-birthday", type: "customField" }, value)}
				/>
				<InlineInfo
					label="电话"
					value={data.basics.phone}
					onCommit={(value) => onEdit?.({ type: "basics", field: "phone" }, value)}
				/>
				<InlineInfo
					label="邮箱"
					value={data.basics.email}
					onCommit={(value) => onEdit?.({ type: "basics", field: "email" }, value)}
				/>
			</div>
		</header>
	);
}

function InlineInfo({ label, onCommit, value }: GridInfoProps) {
	return (
		<p className="flex min-w-0 items-center gap-[0.28em] whitespace-nowrap">
			<span className="shrink-0 text-[#666]">{label}：</span>
			<EditableText
				label={label}
				value={value}
				fallback="-"
				className="min-w-0 truncate text-[#555]"
				onCommit={onCommit}
			/>
		</p>
	);
}

function InternshipSection({
	children,
	dense = false,
	measureSectionId,
	title,
}: {
	children: React.ReactNode;
	dense?: boolean;
	measureSectionId?: string;
	title: string;
}) {
	return (
		<section className={dense ? "mb-[0.76em]" : "mb-[1.72em]"} data-internship-measure-section={measureSectionId}>
			<div
				className={
					dense
						? "mb-[0.45em] grid grid-cols-[1.86em_auto_1fr] items-center gap-[0.57em]"
						: "mb-[1em] grid grid-cols-[1.86em_auto_1fr] items-center gap-[0.57em]"
				}
			>
				<div className="h-[1.29em] w-[1.29em] bg-[#087ec1]" />
				<h2 className="whitespace-nowrap font-bold text-[#50555a] text-[1.5em] leading-none">{title}</h2>
				<div className="ml-[2.43em] h-px bg-[#9fa3a6]" />
			</div>
			{children}
		</section>
	);
}

type InternshipItemProps = {
	description?: string;
	measureItemId?: string;
	onDescriptionCommit?: (value: string) => void;
	onPrimaryCommit?: (value: string) => void;
	onSecondaryCommit?: (value: string) => void;
	onSubtitleCommit?: (value: string) => void;
	primary?: string;
	secondary: string;
	subtitle?: string;
};

function InternshipItem({
	description,
	measureItemId,
	onDescriptionCommit,
	onPrimaryCommit,
	onSecondaryCommit,
	onSubtitleCommit,
	primary,
	secondary,
	subtitle,
}: InternshipItemProps) {
	return (
		<article className="text-[1.12em] leading-[1.55]" data-internship-measure-item={measureItemId}>
			<div className="grid grid-cols-[1fr_auto] gap-[2em] font-bold text-black">
				<EditableText
					as="h3"
					label="时间"
					value={primary}
					fallback="时间"
					className="min-w-0"
					onCommit={onPrimaryCommit}
				/>
				<EditableText
					label="条目标题"
					value={secondary}
					fallback="未命名经历"
					className="max-w-[24em] whitespace-nowrap text-right"
					onCommit={onSecondaryCommit}
				/>
			</div>
			{subtitle || onSubtitleCommit ? (
				<EditableText
					as="p"
					label="条目副标题"
					value={subtitle ?? ""}
					fallback="职位 / 专业"
					className="mt-[0.2em] block font-normal text-[#666]"
					onCommit={onSubtitleCommit}
				/>
			) : null}
			{description || onDescriptionCommit ? (
				<EditableDescription
					label="条目描述"
					value={description ?? ""}
					fallback="补充职责、成果或项目亮点。"
					onCommit={onDescriptionCommit}
				/>
			) : null}
		</article>
	);
}

function CompactSection({
	children,
	measureSectionId,
	title,
}: {
	children: React.ReactNode;
	measureSectionId?: AtsSectionId;
	title: string;
}) {
	return (
		<section className="mb-[0.72em]" data-ats-measure-section={measureSectionId}>
			<div className="mb-[0.38em] grid grid-cols-[0.28em_auto_1fr] items-center gap-[0.62em]">
				<div className="h-[1.05em] bg-[#1f4e79]" />
				<h2 className="whitespace-nowrap font-bold text-[#1f4e79] text-[1em] tracking-[0.06em]">{title}</h2>
				<div className="h-px bg-[#d6dee5]" />
			</div>
			{children}
		</section>
	);
}

function SidebarSection({ children, title }: { children: React.ReactNode; title: string }) {
	return (
		<section className="mb-[1.32em]">
			<h2 className="mb-[0.64em] border-white/18 border-b pb-[0.38em] font-semibold text-[#d8c38a] text-[0.88em] tracking-[0.04em]">
				{title}
			</h2>
			{children}
		</section>
	);
}

function SidebarRow({ label, onCommit, value }: GridInfoProps) {
	return (
		<div className="mb-[0.58em] text-[0.76em] leading-snug">
			<span className="block text-white/54">{label}</span>
			<EditableText
				label={label}
				value={value}
				fallback="-"
				className="mt-[0.12em] block break-all text-white/92"
				onCommit={onCommit}
			/>
		</div>
	);
}

function AtsExperienceUnits({
	measure,
	onEdit,
	units,
}: {
	measure: boolean;
	onEdit?: (target: WordTemplateEditTarget, value: string) => void;
	units: AtsExperienceUnit[];
}) {
	return (
		<div>
			{units.map((unit) => {
				if (unit.kind === "experience-header") {
					return (
						<article
							key={unit.key}
							className={cn("text-[0.91em] leading-[1.44]", unit.gapBefore && "mt-[0.56em]")}
							data-ats-measure-item={measure ? unit.key : undefined}
						>
							<div className="grid grid-cols-[1fr_auto] gap-[1em] font-bold">
								<EditableText
									as="h3"
									label="条目标题"
									value={unit.item.company}
									fallback="未命名经历"
									className="min-w-0 text-[#1e2933]"
									onCommit={(value) => onEdit?.({ type: "experience", id: unit.item.id, field: "company" }, value)}
								/>
								{unit.item.period ? (
									<EditableText
										label="时间"
										value={unit.item.period}
										fallback="时间"
										className="whitespace-nowrap text-[#66737d]"
										onCommit={(value) => onEdit?.({ type: "experience", id: unit.item.id, field: "period" }, value)}
									/>
								) : null}
							</div>
							<EditableText
								as="p"
								label="条目副标题"
								value={unit.item.position}
								fallback="职位"
								className="mt-[0.04em] block font-medium text-[#5f6870]"
								onCommit={(value) => onEdit?.({ type: "experience", id: unit.item.id, field: "position" }, value)}
							/>
						</article>
					);
				}

				return (
					<AtsDescriptionLine
						key={unit.key}
						label="条目描述"
						line={unit.line}
						measureItemId={measure ? unit.key : undefined}
						onCommit={(value) => {
							const nextDescription = replaceDescriptionLine(unit.item.description, unit.lineIndex, value);
							onEdit?.({ type: "experience", id: unit.item.id, field: "description" }, nextDescription);
						}}
						trailingGap={unit.trailingGap}
					/>
				);
			})}
		</div>
	);
}

function AtsProjectUnits({
	measure,
	onEdit,
	units,
}: {
	measure: boolean;
	onEdit?: (target: WordTemplateEditTarget, value: string) => void;
	units: AtsProjectUnit[];
}) {
	return (
		<div>
			{units.map((unit) => {
				if (unit.kind === "project-header") {
					return (
						<article
							key={unit.key}
							className={cn("text-[0.91em] leading-[1.44]", unit.gapBefore && "mt-[0.56em]")}
							data-ats-measure-item={measure ? unit.key : undefined}
						>
							<div className="grid grid-cols-[1fr_auto] gap-[1em] font-bold">
								<EditableText
									as="h3"
									label="条目标题"
									value={unit.item.name}
									fallback="未命名项目"
									className="min-w-0 text-[#1e2933]"
									onCommit={(value) => onEdit?.({ type: "project", id: unit.item.id, field: "name" }, value)}
								/>
								{unit.item.period ? (
									<EditableText
										label="时间"
										value={unit.item.period}
										fallback="时间"
										className="whitespace-nowrap text-[#66737d]"
										onCommit={(value) => onEdit?.({ type: "project", id: unit.item.id, field: "period" }, value)}
									/>
								) : null}
							</div>
						</article>
					);
				}

				return (
					<AtsDescriptionLine
						key={unit.key}
						label="条目描述"
						line={unit.line}
						measureItemId={measure ? unit.key : undefined}
						onCommit={(value) => {
							const nextDescription = replaceDescriptionLine(unit.item.description, unit.lineIndex, value);
							onEdit?.({ type: "project", id: unit.item.id, field: "description" }, nextDescription);
						}}
						trailingGap={unit.trailingGap}
					/>
				);
			})}
		</div>
	);
}

function AtsDescriptionLine({
	label,
	line,
	measureItemId,
	onCommit,
	trailingGap,
}: {
	label: string;
	line: string;
	measureItemId?: string;
	onCommit?: (value: string) => void;
	trailingGap: boolean;
}) {
	return (
		<p
			contentEditable={Boolean(onCommit)}
			data-ats-measure-item={measureItemId}
			suppressContentEditableWarning
			{...(onCommit ? { "aria-label": label, role: "textbox" as const, tabIndex: 0 } : {})}
			className={cn(
				"rounded-[0.18em] text-[#333] text-[0.82em] leading-[1.34] outline-none transition-colors",
				onCommit && "cursor-text hover:bg-[#1296db]/10 focus:bg-[#eaf6ff] focus:ring-[#1296db]/35 focus:ring-[0.12em]",
				trailingGap ? "mb-[0.52em]" : "mb-[0.08em]",
			)}
			onBlur={(event) => {
				const nextValue = normalizeEditableText(event.currentTarget.innerText);
				if (nextValue === normalizeEditableText(line)) return;
				onCommit?.(nextValue);
			}}
		>
			{line}
		</p>
	);
}

type CompactItemProps = {
	description?: string;
	measureItemId?: string;
	onDescriptionCommit?: (value: string) => void;
	onPeriodCommit?: (value: string) => void;
	onSubtitleCommit?: (value: string) => void;
	onTitleCommit?: (value: string) => void;
	period?: string;
	subtitle?: string;
	title: string;
};

function CompactItem({
	description,
	measureItemId,
	onDescriptionCommit,
	onPeriodCommit,
	onSubtitleCommit,
	onTitleCommit,
	period,
	subtitle,
	title,
}: CompactItemProps) {
	return (
		<article className="text-[0.91em] leading-[1.44]" data-ats-measure-item={measureItemId}>
			<div className="grid grid-cols-[1fr_auto] gap-[1em] font-bold">
				<EditableText
					as="h3"
					label="条目标题"
					value={title}
					fallback="未命名经历"
					className="min-w-0 text-[#1e2933]"
					onCommit={onTitleCommit}
				/>
				{period ? (
					<EditableText
						label="时间"
						value={period}
						fallback="时间"
						className="whitespace-nowrap text-[#66737d]"
						onCommit={onPeriodCommit}
					/>
				) : null}
			</div>
			{subtitle || onSubtitleCommit ? (
				<EditableText
					as="p"
					label="条目副标题"
					value={subtitle ?? ""}
					fallback="职位 / 专业"
					className="mt-[0.04em] block font-medium text-[#5f6870]"
					onCommit={onSubtitleCommit}
				/>
			) : null}
			{description || onDescriptionCommit ? (
				<EditableDescription
					label="条目描述"
					value={description ?? ""}
					fallback="补充职责、成果或项目亮点。"
					onCommit={onDescriptionCommit}
				/>
			) : null}
		</article>
	);
}

type EditableTextProps = {
	as?: React.ElementType;
	className?: string;
	fallback: string;
	label: string;
	multiline?: boolean;
	onCommit?: (value: string) => void;
	value?: string;
};

function EditableText({
	as: Component = "span",
	className,
	fallback,
	label,
	multiline,
	onCommit,
	value,
}: EditableTextProps) {
	const displayValue = textOrFallback(value, fallback);

	return (
		<Component
			aria-label={label}
			aria-multiline={multiline || undefined}
			contentEditable={Boolean(onCommit)}
			role={onCommit ? "textbox" : undefined}
			suppressContentEditableWarning
			tabIndex={onCommit ? 0 : undefined}
			className={cn(
				"rounded-[0.18em] outline-none transition-colors",
				onCommit && "cursor-text hover:bg-[#1296db]/10 focus:bg-[#eaf6ff] focus:ring-[#1296db]/35 focus:ring-[0.12em]",
				className,
			)}
			onBlur={(event: React.FocusEvent<HTMLElement>) => {
				const nextValue = normalizeEditableText(event.currentTarget.innerText);
				if (nextValue === normalizeEditableText(value ?? "")) return;
				onCommit?.(nextValue);
			}}
		>
			{displayValue}
		</Component>
	);
}

type EditableDescriptionProps = {
	fallback: string;
	label: string;
	onCommit?: (value: string) => void;
	value: string;
};

function EditableDescription({ fallback, label, onCommit, value }: EditableDescriptionProps) {
	const lines = htmlToPlainText(value).split("\n").filter(Boolean);
	const displayLines = lines.length > 0 ? lines : [fallback];
	const plainText = lines.join("\n");
	const className = cn(
		"mt-[0.25em] space-y-[0.16em] rounded-[0.18em] text-[#333] text-[0.9em] leading-[1.5] outline-none transition-colors",
		onCommit && "cursor-text hover:bg-[#1296db]/10 focus:bg-[#eaf6ff] focus:ring-[#1296db]/35 focus:ring-[0.12em]",
	);
	const content = displayLines.map((line, index) => <p key={`${line}-${index}`}>{line}</p>);

	if (!onCommit) return <div className={className}>{content}</div>;

	return (
		// biome-ignore lint/a11y/useSemanticElements: the preview edits rich multi-line resume text in place.
		<div
			aria-label={label}
			aria-multiline="true"
			contentEditable
			role="textbox"
			suppressContentEditableWarning
			tabIndex={0}
			className={className}
			onBlur={(event) => {
				const nextValue = normalizeEditableText(event.currentTarget.innerText);
				if (nextValue === normalizeEditableText(plainText)) return;
				onCommit(nextValue);
			}}
		>
			{content}
		</div>
	);
}

function getCustomFieldText(data: ResumeData, ids: string[]) {
	for (const id of ids) {
		const value = data.basics.customFields.find((field) => field.id === id)?.text;
		if (value?.trim()) return value;
	}

	return "";
}

function getSavedWordSectionOrder<TSectionId extends OrderedWordSectionId>(
	data: ResumeData,
	defaultOrder: readonly TSectionId[],
): TSectionId[] {
	const supported = new Set<string>(defaultOrder);
	const seen = new Set<TSectionId>();
	const ordered: TSectionId[] = [];

	for (const page of data.metadata.layout.pages) {
		for (const sectionId of [...page.main, ...page.sidebar]) {
			if (!supported.has(sectionId) || seen.has(sectionId as TSectionId)) continue;
			seen.add(sectionId as TSectionId);
			ordered.push(sectionId as TSectionId);
		}
	}

	for (const sectionId of defaultOrder) {
		if (seen.has(sectionId)) continue;
		ordered.push(sectionId);
	}

	return ordered;
}

function buildAtsExperienceUnits(items: AtsExperienceItem[]): AtsExperienceUnit[] {
	return items.flatMap((item, itemIndex) => {
		const lines = getDescriptionLines(item.description);
		const units: AtsExperienceUnit[] = [
			{
				gapBefore: itemIndex > 0,
				item,
				key: `${item.id}-header`,
				kind: "experience-header",
			},
		];

		for (const [lineIndex, line] of lines.entries()) {
			units.push({
				item,
				key: `${item.id}-description-${lineIndex}`,
				kind: "experience-description",
				line,
				lineIndex,
				trailingGap: lineIndex === lines.length - 1,
			});
		}

		return units;
	});
}

function buildAtsProjectUnits(items: AtsProjectItem[]): AtsProjectUnit[] {
	return items.flatMap((item, itemIndex) => {
		const lines = getDescriptionLines(item.description);
		const units: AtsProjectUnit[] = [
			{
				gapBefore: itemIndex > 0,
				item,
				key: `${item.id}-header`,
				kind: "project-header",
			},
		];

		for (const [lineIndex, line] of lines.entries()) {
			units.push({
				item,
				key: `${item.id}-description-${lineIndex}`,
				kind: "project-description",
				line,
				lineIndex,
				trailingGap: lineIndex === lines.length - 1,
			});
		}

		return units;
	});
}

function buildSidebarMainUnits({
	awards,
	experience,
	projects,
	sectionOrder,
	summary,
	summaryTitle,
}: {
	awards: SidebarAwardItem[];
	experience: SidebarExperienceItem[];
	projects: SidebarProjectItem[];
	sectionOrder: readonly SidebarMainSectionId[];
	summary: string;
	summaryTitle: string;
}) {
	const units: SidebarMainUnit[] = [];

	if (summary.trim()) {
		units.push({ content: summary, key: "summary-main", kind: "summary", title: summaryTitle });
	}

	for (const sectionId of sectionOrder) {
		if (sectionId === "experience" && experience.length > 0) {
			units.push({ key: "experience-title", kind: "section-title", sectionId, title: "工作经历" });
			units.push(...buildSidebarExperienceUnits(experience));
		}

		if (sectionId === "projects" && projects.length > 0) {
			units.push({ key: "projects-title", kind: "section-title", sectionId, title: "项目经历" });
			units.push(...buildSidebarProjectUnits(projects));
		}

		if (sectionId === "awards" && awards.length > 0) {
			units.push({ items: awards, key: "awards-group", kind: "awards-group", title: "奖项荣誉" });
		}
	}

	return units;
}

function buildSidebarExperienceUnits(items: SidebarExperienceItem[]): SidebarMainUnit[] {
	return items.flatMap((item, itemIndex) => {
		const lines = getDescriptionLines(item.description);
		const units: SidebarMainUnit[] = [
			{
				gapBefore: itemIndex > 0,
				item,
				key: `${item.id}-sidebar-experience-header`,
				kind: "experience-header",
			},
		];

		for (const [lineIndex, line] of lines.entries()) {
			units.push({
				item,
				key: `${item.id}-sidebar-experience-description-${lineIndex}`,
				kind: "experience-description",
				line,
				lineIndex,
				trailingGap: lineIndex === lines.length - 1,
			});
		}

		return units;
	});
}

function buildSidebarProjectUnits(items: SidebarProjectItem[]): SidebarMainUnit[] {
	return items.flatMap((item, itemIndex) => {
		const lines = getDescriptionLines(item.description);
		const units: SidebarMainUnit[] = [
			{
				gapBefore: itemIndex > 0,
				item,
				key: `${item.id}-sidebar-project-header`,
				kind: "project-header",
			},
		];

		for (const [lineIndex, line] of lines.entries()) {
			units.push({
				item,
				key: `${item.id}-sidebar-project-description-${lineIndex}`,
				kind: "project-description",
				line,
				lineIndex,
				trailingGap: lineIndex === lines.length - 1,
			});
		}

		return units;
	});
}

function paginateSidebarMainUnits(units: readonly SidebarMainUnit[]) {
	const pages: SidebarMainUnit[][] = [];
	let page: SidebarMainUnit[] = [];
	let used = 0;
	let pendingTitle: Extract<SidebarMainUnit, { kind: "section-title" }> | null = null;
	let index = 0;

	const pushPage = () => {
		if (page.length === 0) return;
		pages.push(page);
		page = [];
		used = 0;
	};

	const getCapacity = () => (pages.length === 0 ? SIDEBAR_FIRST_PAGE_CAPACITY : SIDEBAR_CONTINUATION_PAGE_CAPACITY);

	const addUnit = (unit: SidebarMainUnit) => {
		const capacity = pages.length === 0 ? SIDEBAR_FIRST_PAGE_CAPACITY : SIDEBAR_CONTINUATION_PAGE_CAPACITY;
		const weight = getSidebarMainUnitWeight(unit);
		const shouldStartNewPage = page.length > 0 && used + weight > capacity;

		if (shouldStartNewPage) pushPage();

		page.push(unit);
		used += weight;
	};

	const addChunk = (chunk: SidebarMainUnit[]) => {
		const chunkWeight = chunk.reduce((total, item) => total + getSidebarMainUnitWeight(item), 0);
		const canKeepTogether = chunkWeight <= Math.min(getCapacity(), SIDEBAR_KEEP_CHUNK_TOGETHER_LIMIT);

		if (page.length > 0 && canKeepTogether && used + chunkWeight > getCapacity()) pushPage();

		if (canKeepTogether) {
			page.push(...chunk);
			used += chunkWeight;
			return;
		}

		const leadingPair = chunk.slice(0, 2);
		const shouldKeepLeadingPair =
			leadingPair[0]?.kind === "section-title" &&
			(leadingPair[1]?.kind === "experience-header" || leadingPair[1]?.kind === "project-header");
		const leadingPairWeight = shouldKeepLeadingPair
			? leadingPair.reduce((total, item) => total + getSidebarMainUnitWeight(item), 0)
			: 0;

		if (page.length > 0 && shouldKeepLeadingPair && used + leadingPairWeight > getCapacity()) pushPage();

		for (const chunkUnit of chunk) addUnit(chunkUnit);
	};

	const addAwardsGroup = (unit: Extract<SidebarMainUnit, { kind: "awards-group" }>) => {
		let itemIndex = 0;
		let continuation = Boolean(unit.continuation);

		while (itemIndex < unit.items.length) {
			const nextItem = unit.items[itemIndex];
			if (!nextItem) break;

			const titleWeight = getSidebarAwardsTitleWeight(continuation);
			const firstItemWeight = getSidebarAwardItemWeight(nextItem);

			if (!continuation && page.length > 0) {
				const firstChunkCapacity = getCapacity() - used - titleWeight;
				const firstChunkFitCount = countSidebarAwardItemsThatFit(unit.items, itemIndex, firstChunkCapacity);
				const minimumStartCount = Math.min(SIDEBAR_MIN_AWARD_ITEMS_AT_SECTION_START, unit.items.length - itemIndex);

				if (firstChunkFitCount < minimumStartCount) pushPage();
			}

			if (page.length > 0 && used + titleWeight + firstItemWeight > getCapacity()) pushPage();

			const chunkStart = itemIndex;
			const chunkItems: SidebarAwardItem[] = [];
			let chunkWeight = titleWeight;

			while (itemIndex < unit.items.length) {
				const item = unit.items[itemIndex];
				if (!item) break;

				const itemWeight = getSidebarAwardItemWeight(item);
				const wouldFit = used + chunkWeight + itemWeight <= getCapacity();

				if (chunkItems.length > 0 && !wouldFit) break;
				if (chunkItems.length === 0 && page.length > 0 && !wouldFit) {
					pushPage();
					continue;
				}

				chunkItems.push(item);
				chunkWeight += itemWeight;
				itemIndex++;
			}

			if (chunkItems.length === 0) {
				const item = unit.items[itemIndex];
				if (!item) break;
				chunkItems.push(item);
				chunkWeight += getSidebarAwardItemWeight(item);
				itemIndex++;
			}

			page.push({
				...unit,
				continuation,
				items: chunkItems,
				key: `${unit.key}-${chunkStart}-${itemIndex}`,
			});
			used += chunkWeight;
			continuation = true;

			if (itemIndex < unit.items.length) pushPage();
		}
	};

	while (index < units.length) {
		const unit = units[index];
		if (!unit) {
			index++;
			continue;
		}

		if (unit.kind === "section-title") {
			pendingTitle = unit;
			index++;
			continue;
		}

		if (unit.kind === "experience-header" || unit.kind === "project-header") {
			const chunk: SidebarMainUnit[] = pendingTitle ? [pendingTitle, unit] : [unit];
			pendingTitle = null;
			index++;

			while (isSidebarDescriptionUnit(units[index])) {
				chunk.push(units[index]);
				index++;
			}

			addChunk(chunk);
			continue;
		}

		if (unit.kind === "awards-group") {
			if (pendingTitle) {
				addUnit(pendingTitle);
				pendingTitle = null;
			}

			addAwardsGroup(unit);
			index++;
			continue;
		}

		if (pendingTitle) {
			addUnit(pendingTitle);
			pendingTitle = null;
		}

		addUnit(unit);
		index++;
	}

	if (pendingTitle) addUnit(pendingTitle);
	if (page.length > 0) pages.push(page);
	return pages;
}

function isSidebarDescriptionUnit(
	unit: SidebarMainUnit | undefined,
): unit is Extract<SidebarMainUnit, { kind: "experience-description" | "project-description" }> {
	return unit?.kind === "experience-description" || unit?.kind === "project-description";
}

function getSidebarMainUnitWeight(unit: SidebarMainUnit) {
	switch (unit.kind) {
		case "section-title":
			return 1.02;
		case "summary":
			return 1.24 + estimateSidebarTextLineCount(unit.content, 34) * 0.46;
		case "experience-header":
		case "project-header":
			return unit.gapBefore ? 1.28 : 1.02;
		case "experience-description":
		case "project-description":
			return unit.trailingGap ? 0.56 : 0.36;
		case "awards-group":
			return getSidebarAwardsTitleWeight(Boolean(unit.continuation)) + getSidebarAwardsWeight(unit.items);
	}
}

function getSidebarAwardsWeight(items: readonly SidebarAwardItem[]) {
	return items.reduce((total, item) => total + getSidebarAwardItemWeight(item), 0);
}

function getSidebarAwardsTitleWeight(continuation: boolean) {
	return continuation ? 0.9 : 1.0;
}

function getSidebarAwardItemWeight(item: SidebarAwardItem) {
	return Math.max(0.4, estimateSidebarTextLineCount(item.title, 30) * 0.38);
}

function countSidebarAwardItemsThatFit(items: readonly SidebarAwardItem[], startIndex: number, capacity: number) {
	if (capacity <= 0) return 0;

	let count = 0;
	let used = 0;

	for (let index = startIndex; index < items.length; index++) {
		const item = items[index];
		if (!item) break;

		const weight = getSidebarAwardItemWeight(item);
		if (used + weight > capacity) break;

		used += weight;
		count++;
	}

	return count;
}

function estimateSidebarTextLineCount(value: string, charsPerLine: number) {
	const lines = value.split("\n").filter(Boolean);
	return Math.max(
		1,
		lines.reduce((total, line) => total + Math.max(1, Math.ceil(line.trim().length / charsPerLine)), 0),
	);
}

function getDescriptionLines(value: string | undefined) {
	return htmlToPlainText(value).split("\n").filter(Boolean);
}

function replaceDescriptionLine(value: string | undefined, lineIndex: number, nextLine: string) {
	const lines = getDescriptionLines(value);
	lines[lineIndex] = nextLine;
	return lines.join("\n");
}

function getVisibleItems<TSection extends { hidden?: boolean; items: Array<{ hidden?: boolean }> }>(
	section: TSection,
): TSection["items"] {
	if (section.hidden) return [];
	return section.items.filter((item) => !item.hidden) as TSection["items"];
}

function textOrFallback(value: string | undefined, fallback: string) {
	return value?.trim() || fallback;
}

function splitCombinedText(value: string) {
	const [first = "", second = ""] = normalizeEditableText(value)
		.split(/\s*(?:\/|\||、|，|,)\s*/, 2)
		.map((part) => part.trim());

	return [first, second] as const;
}

function formatSkillLine(item: { keywords?: string[]; name?: string }) {
	const keywords = item.keywords?.filter(Boolean) ?? [];
	if (item.name && keywords.length > 0) return `${item.name}：${keywords.join("、")}`;
	return item.name || keywords.join("、");
}

function splitAwardLine(value: string, currentDate?: string) {
	const normalizedValue = normalizeEditableText(value);
	if (!currentDate?.trim()) return { date: "", title: normalizedValue };

	const [date = "", title = ""] = normalizedValue.split(/\s+(.+)/, 2);
	if (!title) return { date: "", title: normalizedValue };

	return { date, title };
}

function normalizeEditableText(value: string) {
	return value
		.replace(/\u00a0/g, " ")
		.replace(/\s+\n/g, "\n")
		.trim();
}

function htmlToPlainText(value: string | undefined) {
	if (!value) return "";

	return value
		.replace(/<br\s*\/?>/gi, "\n")
		.replace(/<li\b[^>]*>/gi, "\n")
		.replace(/<\/(?:p|div|li|h[1-6]|tr)>/gi, "\n")
		.replace(/<[^>]+>/g, "")
		.replace(/&nbsp;/g, " ")
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/\r/g, "")
		.split("\n")
		.map((line) =>
			line
				.replace(/^[•\-–]\s*/, "")
				.replace(/[ \t]+/g, " ")
				.trim(),
		)
		.filter(Boolean)
		.join("\n");
}
