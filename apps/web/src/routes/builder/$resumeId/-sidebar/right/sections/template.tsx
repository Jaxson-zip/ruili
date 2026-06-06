import { useLingui } from "@lingui/react";
import { InfoIcon, SwapIcon } from "@phosphor-icons/react";
import { Alert, AlertDescription, AlertTitle } from "@reactive-resume/ui/components/alert";
import { Badge } from "@reactive-resume/ui/components/badge";
import { Button } from "@reactive-resume/ui/components/button";
import { primaryTemplateIds, templates } from "@/dialogs/resume/template/data";
import { createRecommendedTemplateLayout, needsTemplateLayoutSync } from "@/dialogs/resume/template/layout";
import { TemplateThumbnail } from "@/dialogs/resume/template/thumbnail";
import { useDialogStore } from "@/dialogs/store";
import { useCurrentResume, useUpdateResumeData } from "@/features/resume/builder/draft";
import { SectionBase } from "../shared/section-base";

export function TemplateSectionBuilder() {
	return (
		<SectionBase type="template">
			<TemplateSectionForm />
		</SectionBase>
	);
}

function TemplateSectionForm() {
	const { i18n } = useLingui();
	const openDialog = useDialogStore((state) => state.openDialog);
	const resume = useCurrentResume();
	const updateResumeData = useUpdateResumeData();
	const template = resume.data.metadata.template;

	const metadata = templates[template];
	const shouldSyncLayout = needsTemplateLayoutSync(resume.data, metadata);

	const onOpenTemplateGallery = () => {
		openDialog("resume.template.gallery", undefined);
	};

	const onSyncTemplateLayout = () => {
		updateResumeData((draft) => {
			draft.metadata.layout = createRecommendedTemplateLayout(draft, metadata);
		});
	};

	return (
		<div className="flex @md:flex-row flex-col items-stretch gap-x-4 gap-y-3">
			<Button
				variant="ghost"
				onClick={onOpenTemplateGallery}
				aria-label={`浏览全部中文模板，当前模板：${metadata.name}`}
				className="group/preview relative h-auto w-40 shrink-0 cursor-pointer overflow-hidden rounded-md border bg-white p-0"
			>
				<div className="relative z-10 aspect-page size-full overflow-hidden rounded-md opacity-100 transition-opacity group-hover/preview:opacity-50">
					<TemplateThumbnail template={template} label={metadata.name} imageUrl={metadata.imageUrl} />
				</div>

				<div className="absolute inset-0 flex items-center justify-center">
					<SwapIcon size={48} weight="thin" className="size-12" />
				</div>
			</Button>

			<div className="flex flex-1 flex-col gap-y-4 @md:pt-1 @md:pb-3">
				<div className="space-y-1">
					<div className="flex flex-wrap items-center gap-2">
						<Badge variant="secondary">当前模板</Badge>
						<Badge variant="outline">{primaryTemplateIds.length} 套可选</Badge>
					</div>
					<h3 className="font-semibold text-2xl tracking-tight">{metadata.name}</h3>
					<p className="text-muted-foreground text-sm">{i18n.t(metadata.description)}</p>
					<p className="text-muted-foreground text-xs leading-relaxed">
						切换模板只调整版式、颜色和布局，正文内容会保留。
					</p>
				</div>

				{shouldSyncLayout ? (
					<Alert className="border-primary/30 bg-primary/5">
						<InfoIcon className="size-4 text-primary" />
						<AlertTitle>排版需要整理</AlertTitle>
						<AlertDescription className="space-y-3">
							<p>当前简历的栏位或模块顺序还不是这套模板的推荐排版。整理后预览和导出会更接近模板样张。</p>
							<Button type="button" size="sm" variant="outline" className="w-fit" onClick={onSyncTemplateLayout}>
								按当前模板整理排版
							</Button>
						</AlertDescription>
					</Alert>
				) : null}

				<div className="flex flex-wrap gap-2.5">
					{metadata.tags.map((tag) => (
						<Badge key={tag} variant="secondary">
							{tag}
						</Badge>
					))}
				</div>

				<Button size="sm" className="w-fit gap-2" onClick={onOpenTemplateGallery}>
					<SwapIcon className="size-4" />
					浏览全部中文模板
				</Button>
			</div>
		</div>
	);
}
