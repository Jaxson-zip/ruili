import type { ResumeData } from "@reactive-resume/schema/resume/data";
import type { WordTemplate } from "@/features/resume/word-template/library";
import { FileDocIcon } from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Badge } from "@reactive-resume/ui/components/badge";
import { Button } from "@reactive-resume/ui/components/button";
import { useCurrentResume, usePatchResume, useUpdateResumeData } from "@/features/resume/builder/draft";
import {
	getSelectedWordTemplateId,
	getWordTemplateById,
	getWordTemplateDefaultResumeName,
	getWordTemplateLibrary,
	isDefaultWordTemplateResumeName,
	setSelectedWordTemplateId,
	wordTemplateSelectionChangeEvent,
} from "@/features/resume/word-template/library";
import { WordTemplateLiveThumbnail } from "@/features/resume/word-template/thumbnail";
import { orpc } from "@/libs/orpc/client";
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
	const resume = useCurrentResume();
	const patchResume = usePatchResume();
	const updateResumeData = useUpdateResumeData();
	const { mutate: updateResume } = useMutation(orpc.resume.update.mutationOptions());
	const selectSection = useSectionStore((state) => state.selectSection);
	const [selectedWordTemplateId, setSelectedWordTemplateIdState] = useState(() =>
		getSelectedWordTemplateId(resume.id, resume.data),
	);
	const selectedWordTemplate = getWordTemplateById(selectedWordTemplateId);
	const wordTemplates = getWordTemplateLibrary();

	const onSelectWordTemplate = (templateId: (typeof wordTemplates)[number]["id"]) => {
		const shouldSyncDefaultName = isDefaultWordTemplateResumeName(resume.name);
		const nextDefaultName = getWordTemplateDefaultResumeName(templateId);

		setSelectedWordTemplateId(resume.id, templateId);
		setSelectedWordTemplateIdState(templateId);
		updateResumeData((draft) => {
			draft.metadata.wordTemplate = { id: templateId };
		});

		if (!shouldSyncDefaultName || resume.name.trim() === nextDefaultName) return;

		updateResume(
			{ id: resume.id, name: nextDefaultName },
			{
				onSuccess: (updated) => {
					patchResume((draft) => {
						draft.name = updated.name;
						draft.slug = updated.slug;
						draft.tags = updated.tags;
						draft.isLocked = updated.isLocked;
						draft.isPublic = updated.isPublic;
						draft.hasPassword = updated.hasPassword;
						draft.updatedAt = updated.updatedAt;
					});
				},
			},
		);
	};

	useEffect(() => {
		const onSelectionChange = () => setSelectedWordTemplateIdState(getSelectedWordTemplateId(resume.id, resume.data));
		window.addEventListener(wordTemplateSelectionChangeEvent, onSelectionChange);
		return () => window.removeEventListener(wordTemplateSelectionChangeEvent, onSelectionChange);
	}, [resume.id, resume.data]);

	if (selectedWordTemplate) {
		const alternateWordTemplates = wordTemplates.filter((template) => template.id !== selectedWordTemplate.id);

		return (
			<div className="space-y-4">
				<WordTemplatePreview
					data={resume.data}
					template={selectedWordTemplate}
					name={selectedWordTemplate.name}
					badge="DOCX"
					className="mx-auto w-36"
					scale={0.18}
				/>

				<div className="space-y-3">
					<div className="space-y-2">
						<Badge variant="secondary">当前 Word 模板</Badge>
						<h3 className="text-balance font-semibold text-xl tracking-tight">{selectedWordTemplate.name}</h3>
					</div>

					<div className="flex flex-wrap gap-1.5">
						{selectedWordTemplate.modules.map((module) => (
							<Badge key={module} variant="secondary" className="text-[11px]">
								{module}
							</Badge>
						))}
					</div>

					<Button size="sm" className="w-full gap-2" onClick={() => selectSection("export")}>
						<FileDocIcon className="size-4" />
						Word 导出
					</Button>

					{alternateWordTemplates.length > 0 ? (
						<WordTemplateList
							title="其他 Word 模板"
							templates={alternateWordTemplates}
							onSelectWordTemplate={onSelectWordTemplate}
						/>
					) : null}
				</div>
			</div>
		);
	}

	if (wordTemplates.length === 0) {
		return <EmptyTemplateState />;
	}

	return (
		<div className="space-y-4">
			<div className="space-y-1">
				<div className="flex flex-wrap items-center gap-2">
					<Badge variant="secondary">Word 模板库</Badge>
					<Badge variant="outline">{wordTemplates.length} 套可选</Badge>
				</div>
				<h3 className="font-semibold text-2xl tracking-tight">选择 Word 模板</h3>
				<p className="text-muted-foreground text-sm leading-relaxed">
					选择一个固定 Word 模板作为当前简历的预览和导出版式。
				</p>
			</div>

			<WordTemplateList title="可用 Word 模板" templates={wordTemplates} onSelectWordTemplate={onSelectWordTemplate} />
		</div>
	);
}

function EmptyTemplateState() {
	return (
		<div className="rounded-md border border-dashed bg-secondary/20 px-4 py-10 text-center">
			<h3 className="font-semibold text-2xl tracking-tight">模板库暂时为空</h3>
			<p className="mx-auto mt-2 max-w-md text-muted-foreground text-sm">确认后的 Word 模板会逐个加入这里。</p>
		</div>
	);
}

type WordTemplateListProps = {
	onSelectWordTemplate: (templateId: ReturnType<typeof getWordTemplateLibrary>[number]["id"]) => void;
	templates: ReturnType<typeof getWordTemplateLibrary>;
	title: string;
};

function WordTemplateList({ onSelectWordTemplate, templates, title }: WordTemplateListProps) {
	return (
		<div className="space-y-2 border-t pt-3">
			<p className="font-medium text-muted-foreground text-xs">{title}</p>
			<div className="grid gap-2">
				{templates.map((template) => (
					<div key={template.id} className="flex items-center gap-3 rounded-md border p-2">
						<WordTemplatePreview name={template.name} template={template} className="w-12" scale={0.06} />
						<div className="min-w-0 flex-1">
							<p className="truncate font-medium text-sm">{template.name}</p>
							<p className="line-clamp-1 text-muted-foreground text-xs">{template.description}</p>
							<p className="line-clamp-1 text-[11px] text-muted-foreground">适用：{template.suitableFor}</p>
						</div>
						<Button type="button" size="sm" variant="outline" onClick={() => onSelectWordTemplate(template.id)}>
							使用此模板
						</Button>
					</div>
				))}
			</div>
		</div>
	);
}

type WordTemplatePreviewProps = {
	badge?: string;
	className: string;
	data?: ResumeData;
	name: string;
	scale: number;
	template: WordTemplate;
};

function WordTemplatePreview({ badge, className, data, name, scale, template }: WordTemplatePreviewProps) {
	const resume = useCurrentResume();

	return (
		<WordTemplateLiveThumbnail
			badge={badge}
			className={className}
			data={data ?? resume.data}
			name={name}
			scale={scale}
			template={template}
		/>
	);
}
