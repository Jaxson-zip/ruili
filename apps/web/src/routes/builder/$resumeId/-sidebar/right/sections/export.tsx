import { t } from "@lingui/core/macro";
import { CircleNotchIcon, FileDocIcon, FilePdfIcon } from "@phosphor-icons/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { buildDocx } from "@reactive-resume/docx";
import { Button } from "@reactive-resume/ui/components/button";
import { downloadWithAnchor, generateFilename } from "@reactive-resume/utils/file";
import { useResume } from "@/features/resume/builder/draft";
import { buildDocxFromTemplate } from "@/features/resume/export/docx-template";
import { createWordTemplateHtmlPreviewPdfBlob } from "@/features/resume/export/html-preview-pdf";
import { getSelectedWordTemplate } from "@/features/resume/word-template/library";
import { WordTemplateLiveThumbnail } from "@/features/resume/word-template/thumbnail";
import { SectionBase } from "../shared/section-base";

export function ExportSectionBuilder() {
	const resume = useResume();

	const [isPrinting, setIsPrinting] = useState(false);
	const [isGeneratingTemplateDocx, setIsGeneratingTemplateDocx] = useState(false);
	const selectedWordTemplate = resume ? getSelectedWordTemplate(resume.id, resume.data) : undefined;

	const onDownloadDOCX = useCallback(async () => {
		if (!resume) return;

		const filename = generateFilename(resume.name, "docx");

		try {
			const blob = await buildDocx(resume.data);
			downloadWithAnchor(blob, filename);
			toast.success(t`Word 已导出。`);
		} catch {
			toast.error(t`生成 Word 时出现问题，请重试。`);
		}
	}, [resume]);

	const onDownloadPDF = useCallback(async () => {
		if (!resume) return;

		const filename = generateFilename(resume.name, "pdf");
		const toastId = toast.loading(t`正在生成 PDF，请稍候...`);

		setIsPrinting(true);
		try {
			const blob = selectedWordTemplate
				? await createWordTemplateHtmlPreviewPdfBlob()
				: await import("@/features/resume/export/pdf-document").then(({ createResumePdfBlob }) =>
						createResumePdfBlob(resume.data),
					);
			downloadWithAnchor(blob, filename);
		} catch {
			toast.error(t`生成 PDF 时出现问题，请重试。`);
		} finally {
			setIsPrinting(false);
			toast.dismiss(toastId);
		}
	}, [resume, selectedWordTemplate]);

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
			toast.error(t`Word 模板生成失败，请稍后重试。`);
		} finally {
			setIsGeneratingTemplateDocx(false);
		}
	}, [resume, selectedWordTemplate]);

	if (!resume) return null;

	return (
		<SectionBase type="export" className="space-y-4">
			{selectedWordTemplate ? null : (
				<Button
					variant="outline"
					onClick={onDownloadDOCX}
					className="h-auto gap-x-4 whitespace-normal p-4! text-start font-normal active:scale-98"
				>
					<FileDocIcon className="size-6 shrink-0" />
					<div className="flex flex-1 flex-col gap-y-1">
						<h6 className="font-medium">Word 导出</h6>
						<p className="text-muted-foreground text-xs leading-normal">
							生成可编辑 Word 文档。若要保留固定模板版式，请先在模板面板选择内置 Word 模板。
						</p>
					</div>
				</Button>
			)}

			<div className="rounded-lg border border-input border-dashed bg-muted/20 p-4">
				<div className="flex items-start gap-x-4">
					<FileDocIcon className="mt-0.5 size-6 shrink-0" />
					<div className="min-w-0 flex-1 space-y-3">
						<div className="space-y-1">
							<h6 className="font-medium">Word 导出</h6>
							<p className="text-muted-foreground text-xs leading-normal">按当前模板生成可编辑 Word 文档。</p>
						</div>

						{selectedWordTemplate ? (
							<div className="rounded-md border border-border bg-background/70 p-2.5 text-xs">
								<div className="flex gap-3">
									<WordTemplateLiveThumbnail
										className="h-24 w-[68px] rounded-sm"
										data={resume.data}
										name={selectedWordTemplate.name}
										scale={0.085}
										template={selectedWordTemplate}
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
										<div className="flex flex-wrap gap-1">
											{selectedWordTemplate.modules.slice(0, 4).map((module) => (
												<span key={module} className="rounded-md bg-secondary px-1.5 py-0.5 text-[11px]">
													{module}
												</span>
											))}
											{selectedWordTemplate.modules.length > 4 ? (
												<span className="rounded-md border px-1.5 py-0.5 text-[11px] text-muted-foreground">
													+{selectedWordTemplate.modules.length - 4}
												</span>
											) : null}
										</div>
										<Button
											variant="secondary"
											size="sm"
											disabled={isGeneratingTemplateDocx}
											onClick={onDownloadSelectedWordTemplateDOCX}
											className="w-full"
										>
											{isGeneratingTemplateDocx ? <CircleNotchIcon className="animate-spin" /> : null}
											Word 导出
										</Button>
									</div>
								</div>
							</div>
						) : null}
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
					<p className="text-muted-foreground text-xs leading-normal">导出当前预览版式，适合打印或直接发送给招聘方。</p>
					{selectedWordTemplate ? (
						<p className="text-muted-foreground text-xs leading-normal">
							当前会按右侧实时预览生成 PDF，优先保证网页预览与 PDF 一致。
						</p>
					) : null}
				</div>
			</Button>
		</SectionBase>
	);
}
