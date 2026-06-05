import { Trans } from "@lingui/react/macro";
import { m } from "motion/react";
import { useMemo } from "react";
import { featuredTemplateIds, templates } from "@/dialogs/resume/template/data";

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

const systemTemplatePreviews: SystemTemplatePreview[] = featuredTemplateIds.map((id) => {
	const metadata = templates[id];

	return {
		id: `system-${id}`,
		name: metadata.name,
		role: metadata.tags.slice(0, 2).join(" / "),
		imageUrl: metadata.imageUrl,
		source: "精选模板",
	};
});

const templatePreviews = systemTemplatePreviews;

function TemplateItem({ preview }: TemplateItemProps) {
	return (
		<m.div
			className="group relative shrink-0 will-change-transform"
			initial={{ scale: 1, zIndex: 10 }}
			whileHover={{ scale: 1.05, zIndex: 20 }}
			whileTap={{ scale: 0.99 }}
			transition={{ type: "spring", stiffness: 320, damping: 26 }}
		>
			<div className="relative aspect-page w-48 overflow-hidden rounded-md border border-white/10 bg-white shadow-[0_20px_70px_rgba(0,0,0,0.28)] transition-all duration-300 group-hover:shadow-[0_28px_90px_rgba(0,0,0,0.38)] sm:w-56 md:w-64 lg:w-72">
				<img src={preview.imageUrl} alt={preview.name} className="size-full object-cover" loading="lazy" />

				<div className="absolute inset-0 bg-linear-to-t from-black/72 via-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

				<div className="absolute inset-x-0 bottom-0 translate-y-full p-4 transition-transform duration-300 group-hover:translate-y-0">
					<p className="font-semibold text-white drop-shadow-lg">{preview.name}</p>
					<p className="mt-1 text-white/75 text-xs">{preview.role}</p>
					<p className="mt-2 text-[11px] text-white/55">{preview.source}</p>
				</div>

				<div className="pointer-events-none absolute inset-0 -translate-x-full rotate-12 bg-linear-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
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
		const offset = Math.ceil(templatePreviews.length / 2);
		const secondRowPreviews = [...templatePreviews.slice(offset), ...templatePreviews.slice(0, offset)];

		return {
			row1: createMarqueeItems(templatePreviews, "row1"),
			row2: createMarqueeItems(secondRowPreviews, "row2"),
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
					<Trans>首页只展示真实可导出的首批精品模板，预览效果和 PDF 导出保持一致。</Trans>
				</p>
			</m.div>

			<div className="relative mt-8 -rotate-3 py-8 sm:-rotate-4 lg:mt-0 lg:-rotate-5">
				<div className="flex min-h-[280px] flex-col gap-y-4 sm:min-h-[320px] sm:gap-y-6 md:min-h-[380px] lg:min-h-[420px]">
					<MarqueeRow templates={row1} direction="left" duration={58} />
					<MarqueeRow templates={row2} direction="right" duration={64} />
				</div>
			</div>
		</section>
	);
}
