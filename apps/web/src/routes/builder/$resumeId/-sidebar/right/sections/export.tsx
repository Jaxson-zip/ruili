import { t } from "@lingui/core/macro";
import { CircleNotchIcon, FileDocIcon, FileJsIcon, FilePdfIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import { useCallback, useId, useState } from "react";
import { toast } from "sonner";
import { buildDocx } from "@reactive-resume/docx";
import { Button, buttonVariants } from "@reactive-resume/ui/components/button";
import { downloadWithAnchor, generateFilename } from "@reactive-resume/utils/file";
import { useResume } from "@/features/resume/builder/draft";
import { buildDocxFromTemplate, inspectDocxTemplate } from "@/features/resume/export/docx-template";
import { createResumePdfBlob } from "@/features/resume/export/pdf-document";
import { getSelectedWordTemplate } from "@/features/resume/word-template/library";
import { SectionBase } from "../shared/section-base";

export function ExportSectionBuilder() {
	const resumeData = useResume();
	const templateInputId = useId();

	const [isPrinting, setIsPrinting] = useState(false);
	const [isInspectingTemplate, setIsInspectingTemplate] = useState(false);
	const [isGeneratingTemplateDocx, setIsGeneratingTemplateDocx] = useState(false);
	const [templateFile, setTemplateFile] = useState<File | null>(null);
	const [templatePlaceholders, setTemplatePlaceholders] = useState<string[]>([]);
	const [unsupportedTemplatePlaceholders, setUnsupportedTemplatePlaceholders] = useState<string[]>([]);
	const resume = resumeData;
	const selectedWordTemplate = resume ? getSelectedWordTemplate(resume.id) : undefined;

	const onDownloadJSON = useCallback(() => {
		if (!resume) return;
		const filename = generateFilename(resume.name, "json");
		const jsonString = JSON.stringify(resume.data, null, 2);
		const blob = new Blob([jsonString], { type: "application/json" });

		downloadWithAnchor(blob, filename);
	}, [resume]);

	const onDownloadDOCX = useCallback(async () => {
		if (!resume) return;
		const filename = generateFilename(resume.name, "docx");

		try {
			const blob = await buildDocx(resume.data);
			downloadWithAnchor(blob, filename);
			toast.success(t`DOCX 已导出；这是方便二次编辑的文字版，正式投递建议使用 PDF。`);
		} catch {
			toast.error(t`生成 DOCX 时出现问题，请重试。`);
		}
	}, [resume]);

	const onDownloadPDF = useCallback(async () => {
		if (!resume) return;
		const filename = generateFilename(resume.name, "pdf");
		const toastId = toast.loading(t`正在生成 PDF，请稍候...`);

		setIsPrinting(true);
		try {
			const blob = await createResumePdfBlob(resume.data);
			downloadWithAnchor(blob, filename);
		} catch {
			toast.error(t`生成 PDF 时出现问题，请重试。`);
		} finally {
			setIsPrinting(false);
			toast.dismiss(toastId);
		}
	}, [resume]);

	const onSelectDocxTemplate = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0] ?? null;

		setTemplateFile(null);
		setTemplatePlaceholders([]);
		setUnsupportedTemplatePlaceholders([]);

		if (!file) return;

		if (!file.name.toLowerCase().endsWith(".docx")) {
			toast.error(t`请上传 .docx 格式的 Word 模板。`);
			event.target.value = "";
			return;
		}

		setTemplateFile(file);
		setIsInspectingTemplate(true);

		try {
			const inspection = await inspectDocxTemplate(file);
			setTemplatePlaceholders(inspection.placeholders);
			setUnsupportedTemplatePlaceholders(inspection.unsupportedPlaceholders);

			if (inspection.placeholders.length === 0) toast.warning(t`未检测到可替换占位符。`);
		} catch {
			toast.error(t`无法读取这个 Word 模板，请换一个 .docx 文件。`);
			setTemplateFile(null);
			event.target.value = "";
		} finally {
			setIsInspectingTemplate(false);
		}
	}, []);

	const onDownloadTemplateDOCX = useCallback(async () => {
		if (!resume || !templateFile) return;

		const filename = generateFilename(`${resume.name}.template`, "docx");

		setIsGeneratingTemplateDocx(true);
		try {
			const blob = await buildDocxFromTemplate(templateFile, resume.data);
			downloadWithAnchor(blob, filename);
		} catch {
			toast.error(t`Word 模板生成失败，请检查占位符或换一个 .docx 文件。`);
		} finally {
			setIsGeneratingTemplateDocx(false);
		}
	}, [resume, templateFile]);

	const onDownloadSelectedWordTemplateDOCX = useCallback(async () => {
		if (!resume || !selectedWordTemplate) return;

		const filename = generateFilename(`${resume.name}.word-template`, "docx");

		setIsGeneratingTemplateDocx(true);
		try {
			const response = await fetch(selectedWordTemplate.docxUrl);
			if (!response.ok) throw new Error("Failed to fetch Word template.");

			const templateBlob = await response.blob();
			const blob = await buildDocxFromTemplate(templateBlob, resume.data);
			downloadWithAnchor(blob, filename);
		} catch {
			toast.error(t`Word 模板生成失败，请稍后重试或改用手动上传。`);
		} finally {
			setIsGeneratingTemplateDocx(false);
		}
	}, [resume, selectedWordTemplate]);

	if (!resume) return null;

	return (
		<SectionBase type="export" className="space-y-4">
			<Button
				variant="outline"
				onClick={onDownloadJSON}
				className="h-auto gap-x-4 whitespace-normal p-4! text-start font-normal active:scale-98"
			>
				<FileJsIcon className="size-6 shrink-0" />
				<div className="flex flex-1 flex-col gap-y-1">
					<h6 className="font-medium">JSON</h6>
					<p className="text-muted-foreground text-xs leading-normal">
						下载简历数据备份，可用于恢复、迁移或交给 AI 分析。
					</p>
				</div>
			</Button>

			<Button
				variant="outline"
				onClick={onDownloadDOCX}
				className="h-auto gap-x-4 whitespace-normal p-4! text-start font-normal active:scale-98"
			>
				<FileDocIcon className="size-6 shrink-0" />
				<div className="flex flex-1 flex-col gap-y-1">
					<h6 className="font-medium">DOCX</h6>
					<p className="text-muted-foreground text-xs leading-normal">
						生成可编辑的 Word 文档，适合微调文字；复杂双栏或强视觉模板请以 PDF 为准。
					</p>
				</div>
			</Button>

			<div className="rounded-lg border border-input border-dashed bg-muted/20 p-4">
				<div className="flex items-start gap-x-4">
					<FileDocIcon className="mt-0.5 size-6 shrink-0" />
					<div className="min-w-0 flex-1 space-y-3">
						<div className="space-y-1">
							<h6 className="font-medium">Word 模板导出</h6>
							<p className="text-muted-foreground text-xs leading-normal">
								使用模板库或自己上传的 .docx，用当前简历内容生成可编辑 Word。
							</p>
						</div>

						{selectedWordTemplate ? (
							<div className="rounded-md border border-border bg-background/70 p-2.5 text-xs">
								<div className="flex gap-3">
									<img
										src={selectedWordTemplate.previewUrl}
										alt={selectedWordTemplate.name}
										className="h-24 w-[68px] shrink-0 rounded-sm border bg-white object-cover object-top"
									/>
									<div className="min-w-0 flex-1 space-y-2">
										<div className="space-y-1">
											<div className="flex items-start justify-between gap-2">
												<span className="min-w-0 truncate font-medium leading-5">{selectedWordTemplate.name}</span>
												<span className="rounded-md bg-secondary px-1.5 py-0.5 text-[11px]">DOCX</span>
											</div>
											<p className="line-clamp-2 text-muted-foreground leading-relaxed">
												{selectedWordTemplate.suitableFor}
											</p>
										</div>
										<Button
											variant="secondary"
											size="sm"
											disabled={isGeneratingTemplateDocx}
											onClick={onDownloadSelectedWordTemplateDOCX}
											className="w-full"
										>
											{isGeneratingTemplateDocx ? <CircleNotchIcon className="animate-spin" /> : null}
											用所选模板生成 Word
										</Button>
									</div>
								</div>
							</div>
						) : null}

						<div className="space-y-2">
							<label htmlFor={templateInputId} className="sr-only">
								上传 DOCX 模板
							</label>
							<input
								id={templateInputId}
								type="file"
								aria-label="上传 DOCX 模板"
								accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
								onChange={onSelectDocxTemplate}
								className="sr-only"
							/>
							<label
								htmlFor={templateInputId}
								className={buttonVariants({
									variant: "outline",
									size: "sm",
									className: "w-full cursor-pointer justify-start gap-x-2 text-start",
								})}
							>
								<UploadSimpleIcon />
								<span className="truncate">{templateFile ? "更换上传模板" : "上传其他 Word 模板"}</span>
							</label>

							{templateFile ? (
								<div className="rounded-md border border-border bg-background/70 p-2.5 text-xs">
									<div className="grid gap-1">
										<span className="min-w-0 truncate font-medium leading-5" title={templateFile.name}>
											{templateFile.name}
										</span>
										<span className="text-muted-foreground">
											{isInspectingTemplate ? "读取中" : `${templatePlaceholders.length} 个占位符`}
										</span>
									</div>

									{templatePlaceholders.length > 0 ? (
										<div className="mt-2 flex flex-wrap gap-1.5">
											{templatePlaceholders.slice(0, 8).map((placeholder) => (
												<span
													key={placeholder}
													className="rounded-md border border-border bg-background px-1.5 py-0.5 font-mono text-[11px]"
												>
													{placeholder}
												</span>
											))}
											{templatePlaceholders.length > 8 ? (
												<span className="rounded-md border border-border bg-background px-1.5 py-0.5 text-[11px] text-muted-foreground">
													+{templatePlaceholders.length - 8}
												</span>
											) : null}
										</div>
									) : null}

									{unsupportedTemplatePlaceholders.length > 0 ? (
										<p className="mt-2 text-amber-700 dark:text-amber-400">
											未支持：{unsupportedTemplatePlaceholders.join("、")}
										</p>
									) : null}
								</div>
							) : null}
						</div>

						<Button
							variant="secondary"
							size="sm"
							disabled={!templateFile || isInspectingTemplate || isGeneratingTemplateDocx}
							onClick={onDownloadTemplateDOCX}
							className="w-full"
						>
							{isGeneratingTemplateDocx ? <CircleNotchIcon className="animate-spin" /> : null}
							用当前简历生成 Word
						</Button>
					</div>
				</div>
			</div>

			<Button
				variant="outline"
				disabled={isPrinting}
				onClick={onDownloadPDF}
				className="h-auto gap-x-4 whitespace-normal p-4! text-start font-normal active:scale-98"
			>
				{isPrinting ? (
					<CircleNotchIcon className="size-6 shrink-0 animate-spin" />
				) : (
					<FilePdfIcon className="size-6 shrink-0" />
				)}

				<div className="flex flex-1 flex-col gap-y-1">
					<h6 className="font-medium">PDF</h6>
					<p className="text-muted-foreground text-xs leading-normal">导出最终投递版本，适合打印或直接发送给招聘方。</p>
				</div>
			</Button>
		</SectionBase>
	);
}
