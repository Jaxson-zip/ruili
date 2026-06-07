import { useLingui } from "@lingui/react";
import { FileDocIcon, InfoIcon, SwapIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@reactive-resume/ui/components/alert";
import { Badge } from "@reactive-resume/ui/components/badge";
import { Button } from "@reactive-resume/ui/components/button";
import { primaryTemplateIds, templates } from "@/dialogs/resume/template/data";
import { createRecommendedTemplateLayout, needsTemplateLayoutSync } from "@/dialogs/resume/template/layout";
import { TemplateThumbnail } from "@/dialogs/resume/template/thumbnail";
import { useDialogStore } from "@/dialogs/store";
import { useCurrentResume, useUpdateResumeData } from "@/features/resume/builder/draft";
import {
	getSelectedWordTemplateId,
	getWordTemplateById,
	getWordTemplateLibrary,
	setSelectedWordTemplateId,
	wordTemplateSelectionChangeEvent,
} from "@/features/resume/word-template/library";
import { useSectionStore } from "../../../-store/section";
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
	const selectSection = useSectionStore((state) => state.selectSection);
	const [selectedWordTemplateId, setSelectedWordTemplateIdState] = useState(() => getSelectedWordTemplateId(resume.id));
	const selectedWordTemplate = getWordTemplateById(selectedWordTemplateId);
	const wordTemplates = getWordTemplateLibrary();
	const alternateWordTemplates = wordTemplates.filter((template) => template.id !== selectedWordTemplate?.id);
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

	const onSelectWordTemplate = (templateId: (typeof wordTemplates)[number]["id"]) => {
		setSelectedWordTemplateId(resume.id, templateId);
		setSelectedWordTemplateIdState(templateId);
	};

	useEffect(() => {
		const onSelectionChange = () => setSelectedWordTemplateIdState(getSelectedWordTemplateId(resume.id));
		window.addEventListener(wordTemplateSelectionChangeEvent, onSelectionChange);
		return () => window.removeEventListener(wordTemplateSelectionChangeEvent, onSelectionChange);
	}, [resume.id]);

	if (selectedWordTemplate) {
		return (
			<div className="flex @md:flex-row flex-col items-stretch gap-x-4 gap-y-3">
				<div className="relative w-40 shrink-0 overflow-hidden rounded-md border bg-white">
					<img
						src={selectedWordTemplate.previewUrl}
						alt={selectedWordTemplate.name}
						className="aspect-page size-full object-cover object-top"
					/>
					<div className="absolute top-2 left-2 rounded-md bg-background/90 px-2 py-0.5 font-medium text-[11px] shadow-sm">
						DOCX
					</div>
				</div>

				<div className="flex flex-1 flex-col gap-y-4 @md:pt-1 @md:pb-3">
					<div className="space-y-1">
						<div className="flex flex-wrap items-center gap-2">
							<Badge variant="secondary">当前 Word 模板</Badge>
							{selectedWordTemplate.badges.map((badge) => (
								<Badge key={badge} variant="outline">
									{badge}
								</Badge>
							))}
						</div>
						<h3 className="font-semibold text-2xl tracking-tight">{selectedWordTemplate.name}</h3>
						<p className="text-muted-foreground text-sm">{selectedWordTemplate.description}</p>
						<p className="text-muted-foreground text-xs leading-relaxed">
							在线编辑区用于维护简历内容；导出 Word 时会使用这份 DOCX 模板填充文字并保留原模板样式。
						</p>
					</div>

					<div className="flex flex-wrap gap-2.5">
						{selectedWordTemplate.tags.map((tag) => (
							<Badge key={tag} variant="secondary">
								{tag}
							</Badge>
						))}
					</div>

					<Button size="sm" className="w-fit gap-2" onClick={() => selectSection("export")}>
						<FileDocIcon className="size-4" />
						前往导出 Word
					</Button>

					{alternateWordTemplates.length > 0 ? (
						<div className="space-y-2 border-t pt-3">
							<p className="font-medium text-muted-foreground text-xs">其他 Word 模板</p>
							<div className="grid gap-2">
								{alternateWordTemplates.map((template) => (
									<div key={template.id} className="flex items-center gap-3 rounded-md border p-2">
										<img
											src={template.previewUrl}
											alt={template.name}
											className="aspect-page w-12 shrink-0 rounded-sm border bg-white object-cover object-top"
										/>
										<div className="min-w-0 flex-1">
											<p className="truncate font-medium text-sm">{template.name}</p>
											<p className="line-clamp-1 text-muted-foreground text-xs">{template.description}</p>
										</div>
										<Button type="button" size="sm" variant="outline" onClick={() => onSelectWordTemplate(template.id)}>
											使用此模板
										</Button>
									</div>
								))}
							</div>
						</div>
					) : null}
				</div>
			</div>
		);
	}

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
