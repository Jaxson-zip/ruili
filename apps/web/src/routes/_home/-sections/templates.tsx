import type { Template } from "@reactive-resume/schema/templates";
import type { TemplateMetadata } from "@/dialogs/resume/template/data";
import { Trans } from "@lingui/react/macro";
import { m } from "motion/react";
import { useMemo } from "react";
import { featuredTemplateIds, templates as systemTemplates } from "@/dialogs/resume/template/data";

type SystemTemplatePreview = {
	id: string;
	name: string;
	audience: string;
	imageUrl: string;
	accentColor: string;
	layout: "单栏" | "左侧栏" | "右侧栏";
	style: string;
	tags: readonly string[];
};

type TemplateItemProps = {
	preview: SystemTemplatePreview;
	rhythm: TemplateRhythm;
};

type TemplateMarqueeItem = {
	id: string;
	preview: SystemTemplatePreview;
	rhythm: TemplateRhythm;
};

type TemplateRhythm = "feature" | "standard" | "compact";

const layoutLabels = {
	left: "左侧栏",
	right: "右侧栏",
	none: "单栏",
} as const;

const rhythmClasses: Record<TemplateRhythm, string> = {
	feature: "w-56 sm:w-64 md:w-72",
	standard: "w-48 sm:w-56 md:w-64",
	compact: "w-44 sm:w-52 md:w-56",
};

const rhythmPattern: TemplateRhythm[] = ["feature", "standard", "compact", "standard", "feature", "compact"];

const createSystemTemplatePreviews = (templates: readonly Template[]): SystemTemplatePreview[] =>
	templates.map((template) => {
		const metadata = systemTemplates[template] as TemplateMetadata;

		return {
			id: `system-${template}`,
			name: metadata.name,
			audience: metadata.audience,
			imageUrl: metadata.imageUrl,
			accentColor: metadata.accentColor ?? "rgba(24, 24, 27, 1)",
			layout: layoutLabels[metadata.sidebarPosition],
			style: metadata.tags.slice(0, 2).join(" · "),
			tags: metadata.tags,
		};
	});

const promotedTemplatePreviews = createSystemTemplatePreviews(featuredTemplateIds);

function TemplateItem({ preview, rhythm }: TemplateItemProps) {
	return (
		<m.div
			className="group relative shrink-0 will-change-transform"
			initial={{ scale: 1, zIndex: 10 }}
			whileHover={{ y: -6, zIndex: 20 }}
			whileTap={{ scale: 0.99 }}
			transition={{ type: "spring", stiffness: 360, damping: 30 }}
		>
			<div
				className={`relative overflow-hidden rounded-md border border-border/80 border-t-4 bg-white shadow-sm transition-[border-color,box-shadow,transform] duration-200 group-hover:border-foreground/20 group-hover:shadow-lg ${rhythmClasses[rhythm]}`}
				style={{ borderTopColor: preview.accentColor }}
			>
				<div className="aspect-page overflow-hidden bg-white px-2 pt-2">
					<img src={preview.imageUrl} alt={preview.name} className="size-full object-contain" loading="lazy" />
				</div>

				<div className="border-t bg-background/95 p-3">
					<div className="flex items-start gap-2">
						<span className="mt-1 size-2 shrink-0 rounded-full" style={{ backgroundColor: preview.accentColor }} />
						<div className="min-w-0">
							<p className="line-clamp-1 font-semibold text-sm">{preview.name}</p>
							<p className="mt-1 line-clamp-1 text-muted-foreground text-xs">{preview.audience}</p>
						</div>
					</div>

					<div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
						<span className="shrink-0 rounded-sm border px-1.5 py-0.5 font-medium text-foreground/80">
							{preview.layout}
						</span>
						<span className="min-w-0 truncate">{preview.style}</span>
					</div>
				</div>
			</div>
		</m.div>
	);
}

type MarqueeRowProps = {
	templates: TemplateMarqueeItem[];
	label: string;
	detail: string;
	direction: "left" | "right";
	duration?: number;
};

function MarqueeRow({ templates, label, detail, direction, duration = 40 }: MarqueeRowProps) {
	const animateX = direction === "left" ? ["0%", "-50%"] : ["-50%", "0%"];

	return (
		<div className="space-y-3">
			<div className="flex items-center gap-3 px-1 text-xs">
				<span className="font-semibold text-foreground">{label}</span>
				<span className="h-px w-8 bg-border" />
				<span className="text-muted-foreground">{detail}</span>
			</div>

			<m.div
				className="flex items-start gap-x-4 will-change-transform sm:gap-x-6"
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
				{templates.map(({ id, preview, rhythm }) => (
					<TemplateItem key={id} preview={preview} rhythm={rhythm} />
				))}
			</m.div>
		</div>
	);
}

const createMarqueeItems = (
	entries: SystemTemplatePreview[],
	rowId: string,
	rhythmOffset = 0,
): TemplateMarqueeItem[] => {
	const primaryItems = entries.map((preview, index) => ({
		id: `${rowId}-${preview.id}`,
		preview,
		rhythm: rhythmPattern[(index + rhythmOffset) % rhythmPattern.length] ?? "standard",
	}));

	return [
		...primaryItems.map((item) => ({ ...item, id: `${item.id}-primary` })),
		...primaryItems.map((item) => ({ ...item, id: `${item.id}-repeat` })),
	];
};

const isSteadyTemplate = (preview: SystemTemplatePreview) =>
	preview.tags.some((tag) => ["单栏", "正式", "传统", "网申"].includes(tag));

export function Templates() {
	const { row1, row2 } = useMemo(() => {
		const steadyTemplates = promotedTemplatePreviews.filter(isSteadyTemplate);
		const sidebarTemplates = promotedTemplatePreviews.filter((preview) => !isSteadyTemplate(preview));

		return {
			row1: createMarqueeItems(steadyTemplates, "row1"),
			row2: createMarqueeItems(sidebarTemplates, "row2", 2),
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
					<Trans>按中文投递场景挑选稳重、侧栏和项目型版式，滚动预览真实可导出的模板。</Trans>
				</p>
			</m.div>

			<div className="relative mt-8 py-4">
				<div className="flex min-h-[360px] flex-col gap-y-5 sm:min-h-[400px] sm:gap-y-6 md:min-h-[460px]">
					<MarqueeRow
						templates={row1}
						label="稳重一页"
						detail="时间轴、单栏与正式投递"
						direction="left"
						duration={54}
					/>
					<MarqueeRow
						templates={row2}
						label="侧栏信息"
						detail="技能、作品入口与项目经历"
						direction="right"
						duration={70}
					/>
				</div>
			</div>
		</section>
	);
}
