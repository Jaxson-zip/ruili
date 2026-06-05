import type { RightSidebarSection } from "@/libs/resume/section";
import { Fragment, useEffect, useRef } from "react";
import { match } from "ts-pattern";
import { Button } from "@reactive-resume/ui/components/button";
import { ScrollArea } from "@reactive-resume/ui/components/scroll-area";
import { Separator } from "@reactive-resume/ui/components/separator";
import { Copyright } from "@/components/ui/copyright";
import { getSectionIcon, getSectionTitle, rightSidebarSections } from "@/libs/resume/section";
import { BuilderSidebarEdge } from "../../-components/edge";
import { useSectionStore } from "../../-store/section";
import { useBuilderSidebar } from "../../-store/sidebar";
import { CustomStylesSectionBuilder } from "./sections/custom-styles";
import { DesignSectionBuilder } from "./sections/design";
import { ExportSectionBuilder } from "./sections/export";
import { InformationSectionBuilder } from "./sections/information";
import { LayoutSectionBuilder } from "./sections/layout";
import { NotesSectionBuilder } from "./sections/notes";
import { PageSectionBuilder } from "./sections/page";
import { ReplacementChecklistSection } from "./sections/replacement-checklist";
import { ResumeAnalysisSectionBuilder } from "./sections/resume-analysis";
import { SharingSectionBuilder } from "./sections/sharing";
import { StatisticsSectionBuilder } from "./sections/statistics";
import { TemplateSectionBuilder } from "./sections/template";
import { TypographySectionBuilder } from "./sections/typography";

function getSectionComponent(type: RightSidebarSection) {
	return match(type)
		.with("template", () => <TemplateSectionBuilder />)
		.with("layout", () => <LayoutSectionBuilder />)
		.with("typography", () => <TypographySectionBuilder />)
		.with("design", () => <DesignSectionBuilder />)
		.with("styles", () => <CustomStylesSectionBuilder />)
		.with("page", () => <PageSectionBuilder />)
		.with("notes", () => <NotesSectionBuilder />)
		.with("sharing", () => <SharingSectionBuilder />)
		.with("statistics", () => <StatisticsSectionBuilder />)
		.with("analysis", () => <ResumeAnalysisSectionBuilder />)
		.with("export", () => <ExportSectionBuilder />)
		.with("information", () => <InformationSectionBuilder />)
		.exhaustive();
}

export function BuilderSidebarRight() {
	const scrollAreaRef = useRef<HTMLDivElement | null>(null);
	const selectedSection = useSectionStore((state) => state.selectedSection);
	const selectionRequestId = useSectionStore((state) => state.selectionRequestId);
	const setCollapsed = useSectionStore((state) => state.setCollapsed);
	const toggleSidebar = useBuilderSidebar((state) => state.toggleSidebar);

	useEffect(() => {
		if (selectionRequestId === 0 || !selectedSection) return;
		if (!rightSidebarSections.includes(selectedSection as RightSidebarSection)) return;

		const section = selectedSection as RightSidebarSection;
		toggleSidebar("right", true);
		setCollapsed(section, false);

		const frame = window.requestAnimationFrame(() => {
			const sectionElement = scrollAreaRef.current?.querySelector(`#sidebar-${section}`);
			sectionElement?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
		});

		return () => {
			window.cancelAnimationFrame(frame);
		};
	}, [selectedSection, selectionRequestId, setCollapsed, toggleSidebar]);

	return (
		<>
			<SidebarEdge />

			<ScrollArea
				ref={scrollAreaRef}
				className="@container h-[calc(100svh-3.5rem)] overflow-hidden bg-background sm:me-12"
			>
				<div className="space-y-4 p-4">
					<ReplacementChecklistSection />
					<Separator />

					{rightSidebarSections.map((section) => (
						<Fragment key={section}>
							{getSectionComponent(section)}
							<Separator />
						</Fragment>
					))}

					<Copyright className="mx-auto py-2 text-center" />
				</div>
			</ScrollArea>
		</>
	);
}

function SidebarEdge() {
	const selectedSection = useSectionStore((state) => state.selectedSection);
	const selectSection = useSectionStore((state) => state.selectSection);

	return (
		<BuilderSidebarEdge side="right">
			<div className="no-scrollbar min-h-0 w-full flex-1 overflow-y-auto overflow-x-hidden">
				<div className="flex min-h-full flex-col items-center justify-center gap-y-2">
					{rightSidebarSections.map((section) => (
						<Button
							key={section}
							size="icon"
							variant={selectedSection === section ? "secondary" : "ghost"}
							title={getSectionTitle(section)}
							onClick={() => selectSection(section)}
						>
							{getSectionIcon(section)}
						</Button>
					))}
				</div>
			</div>
		</BuilderSidebarEdge>
	);
}
