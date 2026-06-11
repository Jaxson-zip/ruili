export const internshipLayoutSectionIds = ["education", "awards", "experience", "projects"] as const;

export type InternshipLayoutSectionId = (typeof internshipLayoutSectionIds)[number];

export type InternshipItemRect = {
	top: number;
	bottom: number;
};

export type InternshipSectionMeasurement = {
	items: InternshipItemRect[];
	footerGap?: number;
};

export type InternshipPageBlock = {
	continuation?: boolean;
	end: number;
	sectionId: InternshipLayoutSectionId;
	start: number;
};

export type InternshipPaginationInput = {
	continuationPageCapacity: number;
	firstPageCapacity: number;
	minSectionStartItems?: Partial<Record<InternshipLayoutSectionId, number>>;
	sectionMeasurements: Partial<Record<InternshipLayoutSectionId, InternshipSectionMeasurement>>;
	sectionOrder: readonly InternshipLayoutSectionId[];
};

const EPSILON = 0.001;

export function paginateInternshipMeasuredLayout({
	continuationPageCapacity,
	firstPageCapacity,
	minSectionStartItems,
	sectionMeasurements,
	sectionOrder,
}: InternshipPaginationInput) {
	const pages: InternshipPageBlock[][] = [[]];
	const usedHeights: number[] = [0];

	const pushPage = () => {
		pages.push([]);
		usedHeights.push(0);
	};

	for (const sectionId of sectionOrder) {
		const sectionMeasurement = sectionMeasurements[sectionId];
		const items = sectionMeasurement?.items ?? [];
		const footerGap = sectionMeasurement?.footerGap ?? 0;
		if (items.length === 0) continue;

		let start = 0;

		while (start < items.length) {
			const pageIndex = pages.length - 1;
			const capacity = pageIndex === 0 ? firstPageCapacity : continuationPageCapacity;
			const used = usedHeights[pageIndex] ?? 0;
			const remaining = capacity - used;

			if (remaining <= EPSILON && pages[pageIndex].length > 0) {
				pushPage();
				continue;
			}

			const minimumStartItems = Math.min(minSectionStartItems?.[sectionId] ?? 1, items.length - start);
			if (start === 0 && minimumStartItems > 1 && pages[pageIndex].length > 0) {
				const fitCount = countMeasuredItemsThatFit(items, start, remaining, footerGap);
				if (fitCount < minimumStartItems) {
					pushPage();
					continue;
				}
			}

			const baseTop = start === 0 ? 0 : (items[start]?.top ?? 0);
			let end = start;

			while (end < items.length) {
				const nextHeight = (items[end]?.bottom ?? 0) - baseTop + footerGap;
				if (nextHeight > remaining + EPSILON) break;
				end += 1;
			}

			if (end === start) {
				if (pages[pageIndex].length > 0) {
					pushPage();
					continue;
				}

				end = start + 1;
			}

			const chunkHeight = (items[end - 1]?.bottom ?? 0) - baseTop + footerGap;
			pages[pageIndex].push({
				continuation: start > 0,
				end,
				sectionId,
				start,
			});
			usedHeights[pageIndex] = used + chunkHeight;
			start = end;
		}
	}

	return pages.filter((page) => page.length > 0);
}

function countMeasuredItemsThatFit(
	items: readonly InternshipItemRect[],
	start: number,
	remaining: number,
	footerGap: number,
) {
	if (remaining <= EPSILON) return 0;

	const baseTop = start === 0 ? 0 : (items[start]?.top ?? 0);
	let count = 0;

	while (start + count < items.length) {
		const nextHeight = (items[start + count]?.bottom ?? 0) - baseTop + footerGap;
		if (nextHeight > remaining + EPSILON) break;
		count += 1;
	}

	return count;
}
