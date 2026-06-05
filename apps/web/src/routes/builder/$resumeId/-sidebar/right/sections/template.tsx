import { useLingui } from "@lingui/react";
import { SwapIcon } from "@phosphor-icons/react";
import { Badge } from "@reactive-resume/ui/components/badge";
import { Button } from "@reactive-resume/ui/components/button";
import { templates } from "@/dialogs/resume/template/data";
import { TemplateThumbnail } from "@/dialogs/resume/template/thumbnail";
import { useDialogStore } from "@/dialogs/store";
import { useCurrentResume } from "@/features/resume/builder/draft";
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
	const template = resume.data.metadata.template;

	const metadata = templates[template];

	const onOpenTemplateGallery = () => {
		openDialog("resume.template.gallery", undefined);
	};

	return (
		<div className="flex @md:flex-row flex-col items-stretch gap-x-4 gap-y-2">
			<Button
				variant="ghost"
				onClick={onOpenTemplateGallery}
				className="group/preview relative h-auto w-40 shrink-0 cursor-pointer p-0"
			>
				<div className="relative z-10 aspect-page size-full overflow-hidden rounded-md opacity-100 transition-opacity group-hover/preview:opacity-50">
					<TemplateThumbnail template={template} label={metadata.name} />
				</div>

				<div className="absolute inset-0 flex items-center justify-center">
					<SwapIcon size={48} weight="thin" className="size-12" />
				</div>
			</Button>

			<div className="flex flex-1 flex-col gap-y-4 @md:pt-1 @md:pb-3">
				<div className="space-y-1">
					<h3 className="font-semibold text-2xl tracking-tight">{metadata.name}</h3>
					<p className="text-muted-foreground text-sm">{i18n.t(metadata.description)}</p>
					<p className="text-muted-foreground text-xs leading-relaxed">
						这里只切换当前简历的版式、颜色和布局，不会替换正文内容。
					</p>
				</div>

				<div className="flex flex-wrap gap-2.5">
					{metadata.tags.map((tag) => (
						<Badge key={tag} variant="secondary">
							{tag}
						</Badge>
					))}
				</div>

				<Button variant="outline" size="sm" className="w-fit gap-2" onClick={onOpenTemplateGallery}>
					<SwapIcon className="size-4" />
					更换模板
				</Button>
			</div>
		</div>
	);
}
