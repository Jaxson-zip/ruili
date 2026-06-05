import type { ResumeData } from "@reactive-resume/schema/resume/data";
import type { DialogProps } from "../store";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { DownloadSimpleIcon, FileIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import { useStore } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import z from "zod";
import { JSONResumeImporter } from "@reactive-resume/import/json-resume";
import { ReactiveResumeJSONImporter } from "@reactive-resume/import/reactive-resume-json";
import { ReactiveResumeV4JSONImporter } from "@reactive-resume/import/reactive-resume-v4-json";
import { Badge } from "@reactive-resume/ui/components/badge";
import { Button } from "@reactive-resume/ui/components/button";
import {
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@reactive-resume/ui/components/dialog";
import { FormControl, FormItem, FormLabel, FormMessage } from "@reactive-resume/ui/components/form";
import { Input } from "@reactive-resume/ui/components/input";
import { Spinner } from "@reactive-resume/ui/components/spinner";
import { cn } from "@reactive-resume/utils/style";
import { Combobox } from "@/components/ui/combobox";
import { loadBrowserOcrProvider } from "@/features/settings/integrations/ocr-settings";
import { useFormBlocker } from "@/hooks/use-form-blocker";
import { getOrpcErrorMessage } from "@/libs/error-message";
import { client, orpc } from "@/libs/orpc/client";
import { useAppForm } from "@/libs/tanstack-form";
import { useDialogStore } from "../store";
import {
	deriveImportedResumeName,
	getAiImportReadiness,
	isImageResumeFile,
	isJsonResumeFile,
	isPdfResumeFile,
	isWordResumeFile,
} from "./import-file";

const formSchema = z.discriminatedUnion("type", [
	z.object({
		type: z.literal(""),
		file: z.undefined(),
	}),
	z.object({
		type: z.literal("pdf"),
		file: z.instanceof(File).refine(isPdfResumeFile, { message: "File must be a PDF" }),
	}),
	z.object({
		type: z.literal("docx"),
		file: z.instanceof(File).refine(isWordResumeFile, { message: "File must be a Microsoft Word document" }),
	}),
	z.object({
		type: z.literal("image"),
		file: z.instanceof(File).refine(isImageResumeFile, { message: "File must be a supported image" }),
	}),
	z.object({
		type: z.literal("reactive-resume-json"),
		file: z.instanceof(File).refine(isJsonResumeFile, { message: "File must be a JSON file" }),
	}),
	z.object({
		type: z.literal("reactive-resume-v4-json"),
		file: z.instanceof(File).refine(isJsonResumeFile, { message: "File must be a JSON file" }),
	}),
	z.object({
		type: z.literal("json-resume-json"),
		file: z.instanceof(File).refine(isJsonResumeFile, { message: "File must be a JSON file" }),
	}),
]);

type FormValues = z.infer<typeof formSchema>;
type ImportType = FormValues["type"];

function fileToBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const result = reader.result as string;
			// remove data URL prefix (e.g., "data:application/pdf;base64," or "data:application/vnd...;base64,")
			resolve(result.split(",")[1]);
		};
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
}

function getImageMediaType(file: File): "image/gif" | "image/jpeg" | "image/png" | "image/webp" {
	if (
		file.type === "image/gif" ||
		file.type === "image/jpeg" ||
		file.type === "image/png" ||
		file.type === "image/webp"
	) {
		return file.type;
	}

	const fileName = file.name.toLowerCase();
	if (fileName.endsWith(".gif")) return "image/gif";
	if (fileName.endsWith(".png")) return "image/png";
	if (fileName.endsWith(".webp")) return "image/webp";
	return "image/jpeg";
}

export function ImportResumeDialog(_: DialogProps<"resume.import">) {
	const navigate = useNavigate();
	const closeDialog = useDialogStore((state) => state.closeDialog);

	const inputRef = useRef<HTMLInputElement>(null);
	const [isImporting, setIsImporting] = useState<boolean>(false);

	const { mutateAsync: importResume } = useMutation(orpc.resume.import.mutationOptions());
	const { data: aiProviders, isLoading: isLoadingAiProviders } = useQuery(orpc.aiProviders.list.queryOptions());
	const hasAIProvider = aiProviders?.some((provider) => provider.enabled && provider.testStatus === "success") ?? false;
	const hasOcrProvider = Boolean(loadBrowserOcrProvider());

	const form = useAppForm({
		defaultValues: {
			type: "" as ImportType,
			file: undefined as File | undefined,
		},
		validators: { onSubmit: formSchema },
		onSubmit: async ({ value }) => {
			if (value.type === "" || !value.file) return;

			setIsImporting(true);

			const toastId = toast.loading(t`正在导入简历...`, {
				description: t`如果导入 PDF 或 Word，解析速度取决于 AI Provider 响应，请不要关闭窗口或刷新页面。`,
			});

			try {
				let data: ResumeData | undefined;

				if (value.type === "json-resume-json") {
					const json = await value.file.text();
					const importer = new JSONResumeImporter();
					data = importer.parse(json);
				}

				if (value.type === "reactive-resume-json") {
					const json = await value.file.text();
					const importer = new ReactiveResumeJSONImporter();
					data = importer.parse(json);
				}

				if (value.type === "reactive-resume-v4-json") {
					const json = await value.file.text();
					const importer = new ReactiveResumeV4JSONImporter();
					data = importer.parse(json);
				}

				if (value.type === "pdf") {
					if (isLoadingAiProviders) throw new Error(t`正在加载 AI Providers，请稍后重试。`);
					if (!hasAIProvider) throw new Error(t`PDF 导入需要一个已测试的 AI Provider，请先到 AI Providers 里配置。`);

					const base64 = await fileToBase64(value.file);
					const ocr = loadBrowserOcrProvider();

					data = await client.ai.parsePdf({
						file: { name: value.file.name, data: base64 },
						...(ocr ? { ocr } : {}),
					});
				}

				if (value.type === "docx") {
					if (isLoadingAiProviders) throw new Error(t`正在加载 AI Providers，请稍后重试。`);
					if (!hasAIProvider) throw new Error(t`Word 导入需要一个已测试的 AI Provider，请先到 AI Providers 里配置。`);

					const base64 = await fileToBase64(value.file);

					const mediaType =
						value.file.type === "application/msword"
							? ("application/msword" as const)
							: ("application/vnd.openxmlformats-officedocument.wordprocessingml.document" as const);

					data = await client.ai.parseDocx({
						mediaType,
						file: { name: value.file.name, data: base64 },
					});
				}

				if (value.type === "image") {
					if (isLoadingAiProviders) throw new Error(t`正在加载 AI Providers，请稍后重试。`);
					if (!hasAIProvider) throw new Error(t`图片导入需要一个已测试的 AI Provider，请先到 AI Providers 里配置。`);
					const ocr = loadBrowserOcrProvider();
					if (!ocr) throw new Error(t`图片/扫描件导入需要先到 AI / OCR Providers 配置 OCR Provider。`);

					const base64 = await fileToBase64(value.file);

					data = await client.ai.parseImage({
						mediaType: getImageMediaType(value.file),
						file: { name: value.file.name, data: base64 },
						ocr,
					});
				}

				if (!data) {
					throw new Error(
						t({
							comment: "Error shown when AI import endpoint returns no parsed resume data",
							message: "AI Provider 没有返回可用的简历数据。",
						}),
					);
				}

				const id = await importResume({ data, name: deriveImportedResumeName(data, value.file.name) });
				toast.success(t`简历已导入`, { id: toastId, description: null });
				closeDialog();
				void navigate({ to: "/builder/$resumeId", params: { resumeId: id } });
			} catch (error: unknown) {
				const fallbackMessage =
					value.type === "docx"
						? t`Word 解析失败。当前 AI Provider 可能不支持直接读取 .docx 文件，请换支持文件输入的模型，或先导入 PDF / JSON。`
						: value.type === "pdf"
							? t`PDF 解析失败。如果这是扫描版图片 PDF，请先到 AI / OCR Providers 配置 OCR Provider；如果是普通文本 PDF，请换一个可用的 AI Provider 后重试。`
							: value.type === "image"
								? t`图片解析失败。请先配置 OCR Provider，并上传清晰的 PNG/JPG/WebP/GIF 简历截图。`
								: t`导入简历失败，请检查文件格式后重试。`;
				const badRequestMessage =
					value.type === "image"
						? t`OCR Provider 配置不可用。请确认 Endpoint 是 Azure Document Intelligence 地址，并检查 API Key。`
						: t({
								comment: "Error shown when AI parsing returns invalid resume structure during import",
								message: "导入文件无法解析成有效简历，请检查文件内容是否是完整简历。",
							});

				toast.error(
					getOrpcErrorMessage(error, {
						byCode: {
							BAD_REQUEST: badRequestMessage,
							BAD_GATEWAY: t({
								comment: "Error shown when AI provider is unreachable during PDF/DOCX resume import",
								message: "无法连接 AI Provider / OCR Provider，或当前模型不支持解析该文件。",
							}),
						},
						fallback: fallbackMessage,
					}),
					{ id: toastId, description: null },
				);
			} finally {
				setIsImporting(false);
			}
		},
	});

	const type = useStore(form.store, (s) => s.values.type);
	const importReadiness = getAiImportReadiness({
		type,
		isLoadingAiProviders,
		hasAIProvider,
		hasOcrProvider,
	});
	const isImportBlocked = importReadiness?.blocked ?? false;

	const onSelectFile = () => {
		if (!inputRef.current) return;
		inputRef.current.click();
	};

	const onUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		form.setFieldValue("file", file);
	};

	const goToIntegrations = () => {
		closeDialog();
		void navigate({ to: "/dashboard/settings/integrations" });
	};

	useFormBlocker(form);

	return (
		<DialogContent>
			<DialogHeader>
				<DialogTitle className="flex items-center gap-x-2">
					<DownloadSimpleIcon />
					<Trans>导入已有简历</Trans>
				</DialogTitle>
				<DialogDescription>
					<Trans>
						导入已有简历文件继续编辑。JSON 可以直接导入，PDF 和 Microsoft Word 需要 AI Provider；图片和扫描件还需要 OCR
						Provider。
					</Trans>
				</DialogDescription>
			</DialogHeader>

			<form
				className="space-y-4"
				onSubmit={(event) => {
					event.preventDefault();
					event.stopPropagation();
					void form.handleSubmit();
				}}
			>
				<form.Field name="type">
					{(field) => (
						<FormItem hasError={field.state.meta.isTouched && field.state.meta.errors.length > 0}>
							<FormLabel>
								<Trans>文件类型</Trans>
							</FormLabel>
							<FormControl
								render={
									<Combobox
										showClear={false}
										value={field.state.value}
										onValueChange={(value) => {
											const nextType = value as ImportType;
											if (nextType !== field.state.value) form.setFieldValue("file", undefined);
											field.handleChange(nextType);
										}}
										options={[
											{
												value: "docx",
												keywords: ["word", "doc", "docx", "简历"],
												label: (
													<div className="flex items-center gap-x-2">
														Microsoft Word（.doc/.docx）
														<Badge>需 AI Provider</Badge>
													</div>
												),
											},
											{
												value: "pdf",
												keywords: ["pdf", "简历"],
												label: (
													<div className="flex items-center gap-x-2">
														PDF
														<Badge>需 AI Provider，扫描件需 OCR</Badge>
													</div>
												),
											},
											{
												value: "image",
												keywords: ["image", "png", "jpg", "jpeg", "webp", "gif", "扫描", "截图", "ocr"],
												label: (
													<div className="flex items-center gap-x-2">
														图片 / 扫描件（PNG/JPG/WebP/GIF）
														<Badge>需 OCR Provider + AI Provider</Badge>
													</div>
												),
											},
											{
												value: "reactive-resume-json",
												keywords: ["json", "备份", "导出"],
												label: t({
													comment: "Import source option for current app JSON format",
													message: "锐历 JSON（系统导出/备份）",
												}),
											},
											{
												value: "reactive-resume-v4-json",
												keywords: ["reactive resume", "json", "v4"],
												label: t({
													comment: "Import source option for legacy upstream v4 JSON format",
													message: "Reactive Resume v4 JSON（原项目兼容）",
												}),
											},
											{
												value: "json-resume-json",
												keywords: ["json resume", "json", "标准"],
												label: t({
													comment: "Import source option for standard JSON Resume format",
													message: "JSON Resume（标准简历数据，不是模板）",
												}),
											},
										]}
									/>
								}
							/>
							<FormMessage errors={field.state.meta.errors} />
						</FormItem>
					)}
				</form.Field>

				{importReadiness ? (
					<div
						className={cn(
							"rounded-md border p-3 text-sm",
							importReadiness.blocked
								? "border-amber-300 bg-amber-50 text-amber-950"
								: "border-blue-200 bg-blue-50 text-blue-950",
						)}
					>
						<div className="flex items-start justify-between gap-3">
							<div className="space-y-1">
								<p className="font-medium">{importReadiness.title}</p>
								<p className="text-xs leading-normal opacity-85">{importReadiness.description}</p>
							</div>

							{importReadiness.actionLabel ? (
								<Button
									type="button"
									size="sm"
									variant="outline"
									className="shrink-0 bg-background"
									onClick={goToIntegrations}
								>
									{importReadiness.actionLabel}
								</Button>
							) : null}
						</div>
					</div>
				) : null}

				<form.Field key={type} name="file">
					{(field) => (
						<FormItem
							className={cn(!type && "hidden")}
							hasError={field.state.meta.isTouched && field.state.meta.errors.length > 0}
						>
							<FormControl>
								<Input type="file" className="hidden" ref={inputRef} onChange={onUploadFile} />

								<Button
									variant="outline"
									className="h-auto w-full flex-col border-dashed py-8 font-normal"
									onClick={onSelectFile}
								>
									{field.state.value ? (
										<>
											<FileIcon weight="thin" size={32} />
											<p>{field.state.value.name}</p>
										</>
									) : (
										<>
											<UploadSimpleIcon weight="thin" size={32} />
											<Trans>点击选择要导入的文件</Trans>
										</>
									)}
								</Button>
							</FormControl>
							<FormMessage errors={field.state.meta.errors} />
						</FormItem>
					)}
				</form.Field>

				<DialogFooter>
					<Button type="submit" disabled={!type || isImporting || isImportBlocked}>
						{isImporting ? <Spinner /> : null}
						{isImporting ? t`导入中...` : t`导入`}
					</Button>
				</DialogFooter>
			</form>
		</DialogContent>
	);
}
