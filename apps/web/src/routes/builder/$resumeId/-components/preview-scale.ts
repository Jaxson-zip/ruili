const DEFAULT_INITIAL_SCALE = 0.75;
const MOBILE_PREVIEW_GUTTER = 48;
const A4_PAGE_WIDTH = 595.28;

export function getBuilderPreviewInitialScale(
	viewportWidth = typeof window === "undefined" ? A4_PAGE_WIDTH : window.innerWidth,
) {
	if (viewportWidth >= 640) return DEFAULT_INITIAL_SCALE;

	const fitScale = (viewportWidth - MOBILE_PREVIEW_GUTTER) / A4_PAGE_WIDTH;

	return Math.max(0.5, Math.min(DEFAULT_INITIAL_SCALE, fitScale));
}
