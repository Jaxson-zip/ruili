import type { SidebarSection } from "@/libs/resume/section";
import { t } from "@lingui/core/macro";
import { Button } from "@reactive-resume/ui/components/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@reactive-resume/ui/components/tooltip";
import { cn } from "@reactive-resume/utils/style";
import { getSectionIcon } from "@/libs/resume/section";
import { useSectionStore } from "../-store/section";

type QuickEditItem = {
	section: SidebarSection;
	label: string;
};

export function BuilderQuickEditRail() {
	const selectedSection = useSectionStore((state) => state.selectedSection);
	const selectSection = useSectionStore((state) => state.selectSection);

	const items: QuickEditItem[] = [
		{ section: "basics", label: t`基本信息` },
		{ section: "summary", label: t`个人总结` },
		{ section: "experience", label: t`工作经历` },
		{ section: "education", label: t`教育经历` },
		{ section: "projects", label: t`项目经历` },
		{ section: "skills", label: t`技能清单` },
		{ section: "template", label: t`模板` },
		{ section: "layout", label: t`排版` },
		{ section: "analysis", label: t`AI 分析` },
		{ section: "export", label: t`导出` },
	];

	return (
		<nav aria-label={t`快速编辑`} className="pointer-events-none fixed inset-x-3 top-20 z-30 flex justify-center">
			<div className="pointer-events-auto flex max-w-[min(56rem,calc(100vw-1.5rem))] items-center gap-1 overflow-x-auto rounded-lg border bg-popover/95 p-1 shadow-lg backdrop-blur">
				<span className="hidden shrink-0 border-e px-2 font-medium text-muted-foreground text-xs sm:block">
					{t`快速编辑`}
				</span>

				{items.map((item) => {
					const active = selectedSection === item.section;

					return (
						<Tooltip key={item.section}>
							<TooltipTrigger
								render={
									<Button
										size="sm"
										variant={active ? "secondary" : "ghost"}
										aria-pressed={active}
										className={cn("h-8 shrink-0 gap-1.5 px-2.5 text-xs", active && "text-foreground")}
										onClick={() => selectSection(item.section)}
									>
										{getSectionIcon(item.section, { className: "size-4" })}
										<span className="whitespace-nowrap">{item.label}</span>
									</Button>
								}
							/>

							<TooltipContent side="bottom" align="center" className="font-medium">
								{item.label}
							</TooltipContent>
						</Tooltip>
					);
				})}
			</div>
		</nav>
	);
}
