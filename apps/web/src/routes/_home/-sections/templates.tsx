import type { Template } from "@reactive-resume/schema/templates";
import { Trans } from "@lingui/react/macro";
import { m } from "motion/react";
import { featuredTemplateIds, templates as systemTemplates } from "@/dialogs/resume/template/data";

type SystemTemplatePreview = {
	id: string;
	name: string;
	audience: string;
	imageUrl: string;
	style: string;
};

type TemplateItemProps = {
	preview: SystemTemplatePreview;
	index: number;
};

const createSystemTemplatePreviews = (templates: readonly Template[]): SystemTemplatePreview[] =>
	templates.map((template) => ({
		id: `system-${template}`,
		name: systemTemplates[template].name,
		audience: systemTemplates[template].audience,
		imageUrl: systemTemplates[template].imageUrl,
		style: systemTemplates[template].tags.slice(0, 2).join(" · "),
	}));

const promotedTemplatePreviews = createSystemTemplatePreviews(featuredTemplateIds);

function TemplateItem({ preview, index }: TemplateItemProps) {
	return (
		<m.article
			className="group overflow-hidden rounded-md border border-zinc-200 bg-white text-zinc-950 shadow-black/5 shadow-sm"
			initial={{ opacity: 0, y: 16 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: "-80px" }}
			transition={{ duration: 0.28, delay: Math.min(index * 0.035, 0.2) }}
		>
			<div className="aspect-page overflow-hidden border-zinc-200 border-b bg-white">
				<img
					src={preview.imageUrl}
					alt={preview.name}
					className="size-full object-contain transition-transform duration-300 group-hover:scale-[1.015]"
					loading="lazy"
				/>
			</div>

			<div className="space-y-2 p-3">
				<div className="flex items-start justify-between gap-2">
					<h3 className="line-clamp-1 font-semibold text-sm">{preview.name}</h3>
					<span className="shrink-0 rounded border border-zinc-300 bg-zinc-50 px-1.5 py-0.5 text-[11px] text-zinc-600">
						<Trans>可导出 PDF</Trans>
					</span>
				</div>
				<p className="line-clamp-2 min-h-10 text-xs text-zinc-600 leading-relaxed">{preview.audience}</p>
				<p className="text-[11px] text-zinc-500">{preview.style}</p>
			</div>
		</m.article>
	);
}

export function Templates() {
	return (
		<section
			id="templates"
			className="scroll-mt-24 border-t-0! bg-zinc-50 p-4 text-zinc-950 md:scroll-mt-28 md:p-8 xl:py-16 dark:bg-zinc-50 dark:text-zinc-950"
		>
			<m.div
				className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"
				initial={{ opacity: 0, y: 18 }}
				whileInView={{ opacity: 1, y: 0 }}
				viewport={{ once: true }}
				transition={{ duration: 0.35 }}
			>
				<div className="space-y-3">
					<h2 className="font-semibold text-2xl tracking-tight md:text-4xl xl:text-5xl">
						<Trans>中文简历模板</Trans>
					</h2>
					<p className="max-w-2xl text-zinc-600 leading-relaxed">
						<Trans>挑选适合岗位的中文模板，预览图对应实际 PDF 导出效果，创建后可以继续替换内容。</Trans>
					</p>
				</div>

				<p className="text-sm text-zinc-600">
					<Trans>完整样张 · 可编辑 · 可导出</Trans>
				</p>
			</m.div>

			<div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{promotedTemplatePreviews.map((preview, index) => (
					<TemplateItem key={preview.id} preview={preview} index={index} />
				))}
			</div>
		</section>
	);
}
