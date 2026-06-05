import type { LeftSidebarSection } from "@/libs/resume/section";
import { Fragment, useEffect, useRef } from "react";
import { match } from "ts-pattern";
import { Avatar, AvatarFallback, AvatarImage } from "@reactive-resume/ui/components/avatar";
import { Button } from "@reactive-resume/ui/components/button";
import { ScrollArea } from "@reactive-resume/ui/components/scroll-area";
import { Separator } from "@reactive-resume/ui/components/separator";
import { getInitials } from "@reactive-resume/utils/string";
import { ThemeToggleButton } from "@/features/theme/toggle-button";
import { UserDropdownMenu } from "@/features/user/dropdown-menu";
import { getSectionIcon, getSectionTitle, leftSidebarSections } from "@/libs/resume/section";
import { BuilderSidebarEdge } from "../../-components/edge";
import { useSectionStore } from "../../-store/section";
import { useBuilderSidebar } from "../../-store/sidebar";
import { AwardsSectionBuilder } from "./sections/awards";
import { BasicsSectionBuilder } from "./sections/basics";
import { CertificationsSectionBuilder } from "./sections/certifications";
import { CustomSectionBuilder } from "./sections/custom";
import { EducationSectionBuilder } from "./sections/education";
import { ExperienceSectionBuilder } from "./sections/experience";
import { InterestsSectionBuilder } from "./sections/interests";
import { LanguagesSectionBuilder } from "./sections/languages";
import { PictureSectionBuilder } from "./sections/picture";
import { ProfilesSectionBuilder } from "./sections/profiles";
import { ProjectsSectionBuilder } from "./sections/projects";
import { PublicationsSectionBuilder } from "./sections/publications";
import { ReferencesSectionBuilder } from "./sections/references";
import { SkillsSectionBuilder } from "./sections/skills";
import { SummarySectionBuilder } from "./sections/summary";
import { VolunteerSectionBuilder } from "./sections/volunteer";

function getSectionComponent(type: LeftSidebarSection) {
	return match(type)
		.with("picture", () => <PictureSectionBuilder />)
		.with("basics", () => <BasicsSectionBuilder />)
		.with("summary", () => <SummarySectionBuilder />)
		.with("profiles", () => <ProfilesSectionBuilder />)
		.with("experience", () => <ExperienceSectionBuilder />)
		.with("education", () => <EducationSectionBuilder />)
		.with("projects", () => <ProjectsSectionBuilder />)
		.with("skills", () => <SkillsSectionBuilder />)
		.with("languages", () => <LanguagesSectionBuilder />)
		.with("interests", () => <InterestsSectionBuilder />)
		.with("awards", () => <AwardsSectionBuilder />)
		.with("certifications", () => <CertificationsSectionBuilder />)
		.with("publications", () => <PublicationsSectionBuilder />)
		.with("volunteer", () => <VolunteerSectionBuilder />)
		.with("references", () => <ReferencesSectionBuilder />)
		.with("custom", () => <CustomSectionBuilder />)
		.exhaustive();
}

export function BuilderSidebarLeft() {
	const scrollAreaRef = useRef<HTMLDivElement | null>(null);
	const selectedSection = useSectionStore((state) => state.selectedSection);
	const selectionRequestId = useSectionStore((state) => state.selectionRequestId);
	const setCollapsed = useSectionStore((state) => state.setCollapsed);
	const toggleSidebar = useBuilderSidebar((state) => state.toggleSidebar);

	useEffect(() => {
		if (selectionRequestId === 0 || !selectedSection) return;
		if (!leftSidebarSections.includes(selectedSection as LeftSidebarSection)) return;

		const section = selectedSection as LeftSidebarSection;
		toggleSidebar("left", true);
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

			<ScrollArea ref={scrollAreaRef} className="@container h-[calc(100svh-3.5rem)] bg-background sm:ms-12">
				<div className="space-y-4 p-4">
					{leftSidebarSections.map((section) => (
						<Fragment key={section}>
							{getSectionComponent(section)}
							<Separator />
						</Fragment>
					))}
				</div>
			</ScrollArea>
		</>
	);
}

function SidebarEdge() {
	const selectedSection = useSectionStore((state) => state.selectedSection);
	const selectSection = useSectionStore((state) => state.selectSection);

	return (
		<BuilderSidebarEdge side="left">
			<div className="flex min-h-0 w-full flex-1 flex-col items-center gap-y-2 overflow-hidden">
				<div className="no-scrollbar min-h-0 w-full flex-1 overflow-y-auto overflow-x-hidden">
					<div className="flex min-h-full flex-col items-center justify-center gap-y-2">
						{leftSidebarSections.map((section) => (
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

				<div className="flex shrink-0 flex-col items-center gap-y-1">
					<ThemeToggleButton className="size-8" />

					<UserDropdownMenu>
						{({ session }) => (
							<Button size="icon" variant="ghost">
								<Avatar className="size-6">
									<AvatarImage src={session.user.image ?? undefined} />
									<AvatarFallback className="text-[0.5rem]">{getInitials(session.user.name)}</AvatarFallback>
								</Avatar>
							</Button>
						)}
					</UserDropdownMenu>
				</div>
			</div>
		</BuilderSidebarEdge>
	);
}
