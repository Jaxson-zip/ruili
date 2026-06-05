import type { SidebarSection } from "@/libs/resume/section";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { Badge } from "@reactive-resume/ui/components/badge";
import { Button } from "@reactive-resume/ui/components/button";
import { useCurrentResume } from "@/features/resume/builder/draft";
import { getSectionIcon } from "@/libs/resume/section";
import { useSectionStore } from "../../../-store/section";

type ReplacementChecklistItem = {
	section: SidebarSection;
	label: string;
	detail: string;
	status: string;
	isReady: boolean;
};

function hasText(value: string) {
	return value.replace(/<[^>]*>/g, "").trim().length > 0;
}

export function ReplacementChecklistSection() {
	const resume = useCurrentResume();
	const selectedSection = useSectionStore((state) => state.selectedSection);
	const selectSection = useSectionStore((state) => state.selectSection);
	const { data } = resume;

	const items: ReplacementChecklistItem[] = [
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

	return (
		<section aria-label={t`替换清单`} className="space-y-3 rounded-md border bg-secondary/20 p-3">
			<div className="space-y-1">
				<h2 className="font-semibold text-xl tracking-tight">
					<Trans>替换清单</Trans>
				</h2>
				<p className="text-muted-foreground text-sm leading-relaxed">
					<Trans>按模块替换模板内容。新增、删除和排序继续使用左侧模块列表。</Trans>
				</p>
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
