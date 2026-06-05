import type { Layout } from "@reactive-resume/schema/resume/data";
import type { SidebarSection } from "@/libs/resume/section";
import { leftSidebarSections } from "@/libs/resume/section";

const BASICS_HEIGHT_RATIO = 0.18;

type PreviewPoint = {
	x: number;
	y: number;
	width: number;
	height: number;
	layout: Layout;
	pageIndex?: number;
};

const leftSidebarSectionSet = new Set<string>(leftSidebarSections);

function toSidebarSection(section: string | undefined): SidebarSection | null {
	if (!section) return null;
	if (!leftSidebarSectionSet.has(section)) return null;

	return section as SidebarSection;
}

function getColumnSections(point: PreviewPoint) {
	const page = point.layout.pages[point.pageIndex ?? 0];
	if (!page) return [];
	if (page.fullWidth || page.sidebar.length === 0) return page.main;

	const sidebarWidth = point.width * (point.layout.sidebarWidth / 100);
	const isNearLeftEdge = point.x <= sidebarWidth;
	const isNearRightEdge = point.x >= point.width - sidebarWidth;

	return isNearLeftEdge || isNearRightEdge ? page.sidebar : page.main;
}

export function getPreviewSectionFromPoint(point: PreviewPoint): SidebarSection | null {
	if (point.width <= 0 || point.height <= 0) return null;
	if (point.x < 0 || point.x > point.width || point.y < 0 || point.y > point.height) return null;

	const verticalRatio = point.y / point.height;
	if (verticalRatio <= BASICS_HEIGHT_RATIO) return "basics";

	const sections = getColumnSections(point);
	if (sections.length === 0) return null;

	const bodyRatio = (verticalRatio - BASICS_HEIGHT_RATIO) / (1 - BASICS_HEIGHT_RATIO);
	const sectionIndex = Math.min(sections.length - 1, Math.max(0, Math.floor(bodyRatio * sections.length)));

	return toSidebarSection(sections[sectionIndex]);
}
