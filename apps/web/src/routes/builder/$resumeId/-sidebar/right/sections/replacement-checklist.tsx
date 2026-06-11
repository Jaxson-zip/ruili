import type { ResumeData } from "@reactive-resume/schema/resume/data";
import type { WordTemplateSupportedSectionId } from "@/features/resume/word-template/library";
import type { SidebarSection } from "@/libs/resume/section";
import { t } from "@lingui/core/macro";
import { Badge } from "@reactive-resume/ui/components/badge";
import { Button } from "@reactive-resume/ui/components/button";
import { useCurrentResume } from "@/features/resume/builder/draft";
import { getSelectedWordTemplate, getWordTemplateSupportedSectionIds } from "@/features/resume/word-template/library";
import { getSectionIcon } from "@/libs/resume/section";
import { useSectionStore } from "../../../-store/section";

type ReplacementChecklistItem = {
	section: SidebarSection;
	label: string;
	detail: string;
	status: string;
	isReady: boolean;
};

const wordChecklistSectionIds = [
	"education",
	"awards",
	"experience",
	"projects",
	"skills",
] as const satisfies readonly WordTemplateSupportedSectionId[];

type WordChecklistSectionId = (typeof wordChecklistSectionIds)[number];
const sidebarChecklistSectionOrder = [
	"education",
	"skills",
	"experience",
	"projects",
	"awards",
] as const satisfies readonly WordChecklistSectionId[];
const atsChecklistSectionOrder = [
	"education",
	"experience",
	"projects",
	"awards",
	"skills",
] as const satisfies readonly WordChecklistSectionId[];

function hasText(value: string) {
	return value.replace(/<[^>]*>/g, "").trim().length > 0;
}

export function ReplacementChecklistSection() {
	const resume = useCurrentResume();
	const selectedSection = useSectionStore((state) => state.selectedSection);
	const selectSection = useSectionStore((state) => state.selectSection);
	const { data } = resume;
	const selectedWordTemplate = getSelectedWordTemplate(resume.id, data);
	const isWordTemplateResume = Boolean(selectedWordTemplate);

	const items = isWordTemplateResume
		? buildWordTemplateItems(data, selectedWordTemplate?.id)
		: buildStandardItems(data);
	const title = isWordTemplateResume ? t`模板模块检查` : t`内容检查`;
	const description = isWordTemplateResume
		? t`只显示当前 Word 模板支持、会进入预览和导出的模块。未填写的模块不会强行占位。`
		: t`确认核心模块是否已经填写完整，点击条目可以快速定位到对应内容。`;

	return (
		<section aria-label={title} className="space-y-3 rounded-md border bg-secondary/20 p-3">
			<div className="space-y-1">
				<h2 className="font-semibold text-xl tracking-tight">{title}</h2>
				<p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
			</div>

			<div className="grid gap-2">
				{items.map((item) => {
					const active = selectedSection === item.section;

					return (
						<Button
							key={item.section}
							type="button"
							variant={active ? "secondary" : "ghost"}
							className="h-auto justify-start gap-3 rounded-md border bg-background/70 px-3 py-2 text-left"
							onClick={() => selectSection(item.section)}
						>
							<span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground">
								{getSectionIcon(item.section, { className: "size-4" })}
							</span>
							<span className="min-w-0 flex-1">
								<span className="block font-medium text-sm">{item.label}</span>
								<span className="block truncate text-muted-foreground text-xs">{item.detail}</span>
							</span>
							<Badge variant={item.isReady ? "secondary" : "outline"} className="shrink-0 text-[11px]">
								{item.status}
							</Badge>
						</Button>
					);
				})}
			</div>
		</section>
	);
}

function buildStandardItems(data: ResumeData): ReplacementChecklistItem[] {
	return [
		{
			section: "basics",
			label: t`基本信息`,
			detail: t`姓名、求职标题、联系方式`,
			status: data.basics.name && data.basics.headline ? t`已填写` : t`待替换`,
			isReady: Boolean(data.basics.name && data.basics.headline),
		},
		{
			section: "summary",
			label: t`个人总结`,
			detail: t`个人优势和求职定位`,
			status: hasText(data.summary.content) ? t`已填写` : t`待替换`,
			isReady: hasText(data.summary.content),
		},
		{
			section: "experience",
			label: t`工作经历`,
			detail: t`公司、职位、时间和成果`,
			status: data.sections.experience.items.length > 0 ? t`${data.sections.experience.items.length} 项` : t`待添加`,
			isReady: data.sections.experience.items.length > 0,
		},
		{
			section: "education",
			label: t`教育经历`,
			detail: t`学校、专业、学历和时间`,
			status: data.sections.education.items.length > 0 ? t`${data.sections.education.items.length} 项` : t`待添加`,
			isReady: data.sections.education.items.length > 0,
		},
		{
			section: "projects",
			label: t`项目经历`,
			detail: t`项目名称、职责和结果`,
			status: data.sections.projects.items.length > 0 ? t`${data.sections.projects.items.length} 项` : t`待添加`,
			isReady: data.sections.projects.items.length > 0,
		},
		{
			section: "skills",
			label: t`技能清单`,
			detail: t`技能名称、熟练度和关键词`,
			status: data.sections.skills.items.length > 0 ? t`${data.sections.skills.items.length} 项` : t`待添加`,
			isReady: data.sections.skills.items.length > 0,
		},
	];
}

type SelectedWordTemplateIdType = Parameters<typeof getWordTemplateSupportedSectionIds>[0];

function buildWordTemplateItems(data: ResumeData, templateId: SelectedWordTemplateIdType): ReplacementChecklistItem[] {
	const items: ReplacementChecklistItem[] = [
		{
			section: "basics",
			label: t`基本信息`,
			detail: t`姓名、求职标题和联系方式会进入模板头部`,
			status: data.basics.name && data.basics.headline ? t`模板头部` : t`待填写`,
			isReady: Boolean(data.basics.name && data.basics.headline),
		},
	];

	if (templateId === "zh-sidebar-clean-001" && !data.summary.hidden && hasText(data.summary.content)) {
		items.push({
			section: "summary",
			label: t`个人优势`,
			detail: t`侧栏双栏模板右侧顶部展示的能力摘要`,
			status: t`已填写`,
			isReady: true,
		});
	}

	items.push(
		...getVisibleWordTemplateSections(data, getWordTemplateSupportedSectionIds(templateId), templateId).map(
			(sectionId) => ({
				section: sectionId,
				label: getWordTemplateSectionLabel(sectionId),
				detail: getWordTemplateSectionDetail(sectionId),
				status: getWordTemplateSectionStatus(data, sectionId),
				isReady: true,
			}),
		),
	);

	return items;
}

function getVisibleWordTemplateSections(
	data: ResumeData,
	supportedSectionIds: readonly WordTemplateSupportedSectionId[],
	templateId: SelectedWordTemplateIdType,
): WordChecklistSectionId[] {
	return getWordTemplateLayoutOrder(data.metadata.layout.pages, supportedSectionIds, templateId).filter((sectionId) =>
		hasFilledWordTemplateSection(data, sectionId),
	);
}

function getWordTemplateLayoutOrder(
	pages: ResumeData["metadata"]["layout"]["pages"],
	supportedSectionIds: readonly WordTemplateSupportedSectionId[],
	templateId: SelectedWordTemplateIdType,
): WordChecklistSectionId[] {
	if (templateId === "zh-sidebar-clean-001") {
		return sidebarChecklistSectionOrder.filter((sectionId) => supportedSectionIds.includes(sectionId));
	}

	if (templateId === "zh-ats-compact-001") {
		return atsChecklistSectionOrder.filter((sectionId) => supportedSectionIds.includes(sectionId));
	}

	return [...getSavedWordTemplateLayoutOrder(pages, supportedSectionIds)];
}

function getSavedWordTemplateLayoutOrder(
	pages: ResumeData["metadata"]["layout"]["pages"],
	supportedSectionIds: readonly WordTemplateSupportedSectionId[],
): WordChecklistSectionId[] {
	const supported = new Set<string>(supportedSectionIds);
	const seen = new Set<WordChecklistSectionId>();
	const ordered: WordChecklistSectionId[] = [];

	for (const page of pages) {
		for (const sectionId of [...page.main, ...page.sidebar]) {
			if (!supported.has(sectionId) || seen.has(sectionId as WordChecklistSectionId)) continue;
			seen.add(sectionId as WordChecklistSectionId);
			ordered.push(sectionId as WordChecklistSectionId);
		}
	}

	for (const sectionId of supportedSectionIds) {
		if (seen.has(sectionId)) continue;
		seen.add(sectionId);
		ordered.push(sectionId);
	}

	return ordered;
}

function hasFilledWordTemplateSection(data: ResumeData, sectionId: WordChecklistSectionId) {
	const section = data.sections[sectionId];
	if (section.hidden) return false;

	return section.items.some((item) => !item.hidden && hasFilledItemValue(item));
}

function hasFilledItemValue(value: unknown): boolean {
	if (typeof value === "string") return value.trim().length > 0 && value.trim() !== "https://";
	if (Array.isArray(value)) return value.some(hasFilledItemValue);
	if (!value || typeof value !== "object") return false;

	return Object.entries(value).some(([key, childValue]) => {
		if (key === "id" || key === "hidden" || key === "icon" || key === "iconColor" || key === "level") return false;
		return hasFilledItemValue(childValue);
	});
}

function getWordTemplateSectionLabel(sectionId: WordChecklistSectionId) {
	switch (sectionId) {
		case "education":
			return t`教育经历`;
		case "awards":
			return t`奖项荣誉`;
		case "experience":
			return t`工作经历`;
		case "projects":
			return t`项目经历`;
		case "skills":
			return t`技能`;
	}
}

function getWordTemplateSectionDetail(sectionId: WordChecklistSectionId) {
	switch (sectionId) {
		case "education":
			return t`学校、专业、学历和在校时间`;
		case "awards":
			return t`荣誉条目会按模板顺序排版`;
		case "experience":
			return t`公司、职位、时间和职责内容`;
		case "projects":
			return t`项目名称、时间、角色和项目描述`;
		case "skills":
			return t`技能名称、熟练度和关键词`;
	}
}

function getWordTemplateSectionStatus(data: ResumeData, sectionId: WordChecklistSectionId) {
	const section = data.sections[sectionId];
	const count = section.hidden ? 0 : section.items.filter((item) => !item.hidden).length;
	return t`${count} 项内容`;
}
