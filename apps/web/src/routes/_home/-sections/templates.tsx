import type { Template } from "@reactive-resume/schema/templates";
import { Trans } from "@lingui/react/macro";
import { m } from "motion/react";
import { useMemo } from "react";
import {
	additionalCollectionTemplateReferences,
	featuredTemplateIds,
	recommendedCollectionTemplateReferences,
	templates as systemTemplates,
} from "@/dialogs/resume/template/data";

type SystemTemplatePreview = {
	id: string;
	name: string;
	role: string;
	imageUrl: string;
	source: string;
};

type TemplateItemProps = {
	preview: SystemTemplatePreview;
};

type TemplateMarqueeItem = {
	id: string;
	preview: SystemTemplatePreview;
};

const createSystemTemplatePreviews = (templates: readonly Template[]): SystemTemplatePreview[] =>
	templates.map((template) => ({
		id: `system-${template}`,
		name: systemTemplates[template].name,
		role: systemTemplates[template].tags.slice(0, 3).join(" / "),
		imageUrl: systemTemplates[template].imageUrl,
		source: "可导出 PDF",
	}));

const promotedTemplatePreviews = createSystemTemplatePreviews(featuredTemplateIds);

const referenceTemplatePreviews: SystemTemplatePreview[] = [
	...recommendedCollectionTemplateReferences,
	...additionalCollectionTemplateReferences,
].map((reference) => ({
	id: `reference-${reference.id}`,
	name: reference.name,
	role: reference.tags.slice(0, 3).join(" / "),
	imageUrl: reference.imageUrl,
	source: "待制作真实模板",
}));

function TemplateItem({ preview }: TemplateItemProps) {
	return (
		<m.div
			className="group relative shrink-0 will-change-transform"
			initial={{ scale: 1, zIndex: 10 }}
			whileHover={{ y: -6, zIndex: 20 }}
			whileTap={{ scale: 0.99 }}
			transition={{ type: "spring", stiffness: 360, damping: 30 }}
		>
			<div className="relative w-48 overflow-hidden rounded-md border bg-white shadow-sm transition-[border-color,box-shadow,transform] duration-200 group-hover:border-foreground/20 group-hover:shadow-lg sm:w-56 md:w-64">
				<div className="aspect-page overflow-hidden bg-white">
					<img src={preview.imageUrl} alt={preview.name} className="size-full object-contain" loading="lazy" />
				</div>

				<div className="border-t bg-background/95 p-3">
					<p className="line-clamp-1 font-semibold text-sm">{preview.name}</p>
					<p className="mt-1 line-clamp-1 text-muted-foreground text-xs">{preview.role}</p>
					<p className="mt-1 text-[11px] text-muted-foreground">{preview.source}</p>
				</div>
			</div>
		</m.div>
	);
}

type MarqueeRowProps = {
	templates: TemplateMarqueeItem[];
	direction: "left" | "right";
	duration?: number;
};

function MarqueeRow({ templates, direction, duration = 40 }: MarqueeRowProps) {
	const animateX = direction === "left" ? ["0%", "-50%"] : ["-50%", "0%"];

	return (
		<m.div
			className="flex gap-x-4 will-change-transform sm:gap-x-6"
			animate={{ x: animateX }}
			transition={{
				x: {
					repeat: Number.POSITIVE_INFINITY,
					repeatType: "loop",
					duration,
					ease: "linear",
				},
			}}
		>
			{templates.map(({ id, preview }) => (
				<TemplateItem key={id} preview={preview} />
			))}
		</m.div>
	);
}

const createMarqueeItems = (entries: SystemTemplatePreview[], rowId: string): TemplateMarqueeItem[] => [
	...entries.map((preview) => ({ id: `${rowId}-${preview.id}-primary`, preview })),
	...entries.map((preview) => ({ id: `${rowId}-${preview.id}-repeat`, preview })),
];

export function Templates() {
	const { row1, row2 } = useMemo(() => {
		return {
			row1: createMarqueeItems(promotedTemplatePreviews, "row1"),
			row2: createMarqueeItems(referenceTemplatePreviews, "row2"),
		};
	}, []);

	return (
		<section id="templates" className="overflow-hidden border-t-0! p-4 md:p-8 xl:py-16">
			<m.div
				className="space-y-4 will-change-[transform,opacity]"
				initial={{ opacity: 0, y: 20 }}
				whileInView={{ opacity: 1, y: 0 }}
				viewport={{ once: true }}
				transition={{ duration: 0.35 }}
			>
				<h2 className="font-semibold text-2xl tracking-tight md:text-4xl xl:text-5xl">
					<Trans>中文简历模板与风格</Trans>
				</h2>

				<p className="max-w-2xl text-muted-foreground leading-relaxed">
					<Trans>第一排已经升级为真实可导出的中文模板；第二排是待制作样张，不会再强行套成别的模板。</Trans>
				</p>
			</m.div>

			<div className="relative mt-8 py-4">
				<div className="flex min-h-[360px] flex-col gap-y-4 sm:min-h-[400px] sm:gap-y-5 md:min-h-[460px]">
					<MarqueeRow templates={row1} direction="left" duration={58} />
					<MarqueeRow templates={row2} direction="right" duration={64} />
				</div>
			</div>
		</section>
	);
}
