import type { Icon } from "@phosphor-icons/react";
import type { BuilderPreviewPageLayout } from "./page-layout";
import { t } from "@lingui/core/macro";
import {
	AlignCenterHorizontalIcon,
	AlignTopIcon,
	ChatCircleDotsIcon,
	CircleNotchIcon,
	CubeFocusIcon,
	FileDocIcon,
	FilePdfIcon,
	LinkSimpleIcon,
	MagnifyingGlassMinusIcon,
	MagnifyingGlassPlusIcon,
} from "@phosphor-icons/react";
import { useNavigate } from "@tanstack/react-router";
import { m } from "motion/react";
import { useCallback, useMemo, useState } from "react";
import { useControls } from "react-zoom-pan-pinch";
import { toast } from "sonner";
import { useCopyToClipboard } from "usehooks-ts";
import { buildDocx } from "@reactive-resume/docx";
import { Button } from "@reactive-resume/ui/components/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@reactive-resume/ui/components/tooltip";
import { downloadWithAnchor, generateFilename } from "@reactive-resume/utils/file";
import { cn } from "@reactive-resume/utils/style";
import { useCurrentResume } from "@/features/resume/builder/draft";
import { buildDocxFromTemplate } from "@/features/resume/export/docx-template";
import { createWordTemplateHtmlPreviewPdfBlob } from "@/features/resume/export/html-preview-pdf";
import { getSelectedWordTemplate } from "@/features/resume/word-template/library";
import { authClient } from "@/libs/auth/client";

type BuilderDockProps = {
	pageLayout: BuilderPreviewPageLayout;
	onTogglePageLayout: () => void;
};

export function BuilderDock({ pageLayout, onTogglePageLayout }: BuilderDockProps) {
	const { data: session } = authClient.useSession();
	const resume = useCurrentResume();
	const navigate = useNavigate();
	const selectedWordTemplate = resume ? getSelectedWordTemplate(resume.id, resume.data) : undefined;

	const [_, copyToClipboard] = useCopyToClipboard();
	const { zoomIn, zoomOut, centerView } = useControls();

	const [isPrinting, setIsPrinting] = useState(false);

	const publicUrl = useMemo(() => {
		if (!session?.user.username || !resume?.slug) return "";
		return `${window.location.origin}/${session.user.username}/${resume.slug}`;
	}, [session?.user.username, resume?.slug]);

	const onCopyUrl = useCallback(async () => {
		await copyToClipboard(publicUrl);
		toast.success(t`简历链接已复制到剪贴板。`);
	}, [publicUrl, copyToClipboard]);

	const onDownloadDOCX = useCallback(async () => {
		if (!resume) return;
		const filename = generateFilename(resume.name, "docx");

		try {
			const blob = selectedWordTemplate
				? await fetch(selectedWordTemplate.docxUrl)
						.then((response) => {
							if (!response.ok) throw new Error("Failed to fetch selected Word template.");
							return response.blob();
						})
						.then((templateBlob) => buildDocxFromTemplate(templateBlob, resume.data))
				: await buildDocx(resume.data);

			downloadWithAnchor(blob, filename);
			toast.success(
				selectedWordTemplate ? t`Word 模板已导出。` : t`DOCX 已导出；这是方便二次编辑的文字版，正式投递建议使用 PDF。`,
			);
		} catch {
			toast.error(t`生成 DOCX 时出现问题，请重试。`);
		}
	}, [resume, selectedWordTemplate]);

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

	return (
		<div className="fixed inset-x-0 bottom-4 flex items-center justify-center">
			<m.div
				initial={{ opacity: 0, y: -18 }}
				animate={{ opacity: 0.6, y: 0 }}
				whileHover={{ opacity: 1, y: -2, scale: 1.01 }}
				transition={{ duration: 0.2, ease: "easeOut" }}
				className="flex items-center rounded-r-full rounded-l-full bg-popover px-2 shadow-xl will-change-[transform,opacity]"
			>
				<DockIcon icon={MagnifyingGlassPlusIcon} title={t`放大`} onClick={() => zoomIn(0.1)} />
				<DockIcon icon={MagnifyingGlassMinusIcon} title={t`缩小`} onClick={() => zoomOut(0.1)} />
				<DockIcon icon={CubeFocusIcon} title={t`居中视图`} onClick={() => centerView()} />
				<DockIcon
					icon={pageLayout === "horizontal" ? AlignTopIcon : AlignCenterHorizontalIcon}
					title={t`切换页面排列`}
					onClick={onTogglePageLayout}
				/>
				<DockIcon
					icon={ChatCircleDotsIcon}
					title={t`打开 AI 助手`}
					onClick={() => {
						if (!resume) return;
						void navigate({ to: "/agent/new", search: { resumeId: resume.id } });
					}}
				/>
				<div className="mx-1 h-8 w-px bg-border" />
				<DockIcon icon={LinkSimpleIcon} title={t`复制链接`} onClick={() => onCopyUrl()} />
				<DockIcon icon={FileDocIcon} title={t`下载 DOCX`} onClick={() => onDownloadDOCX()} />
				<DockIcon
					title={t`下载 PDF`}
					disabled={isPrinting}
					onClick={() => onDownloadPDF()}
					icon={isPrinting ? CircleNotchIcon : FilePdfIcon}
					iconClassName={cn(isPrinting && "animate-spin")}
				/>
			</m.div>
		</div>
	);
}

type DockIconProps = {
	title: string;
	icon: Icon;
	disabled?: boolean;
	onClick: () => void;
	iconClassName?: string;
	active?: boolean;
};

function DockIcon({ icon: Icon, title, disabled, onClick, iconClassName, active }: DockIconProps) {
	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<m.div
						className="will-change-transform"
						whileHover={disabled ? undefined : { y: -1, scale: 1.04 }}
						whileTap={disabled ? undefined : { scale: 0.97 }}
						transition={{ duration: 0.15, ease: "easeOut" }}
					>
						<Button
							size="icon"
							variant="ghost"
							disabled={disabled}
							className={cn(active && "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary")}
							onClick={onClick}
							aria-label={title}
						>
							<Icon className={cn("size-4", iconClassName)} />
						</Button>
					</m.div>
				}
			/>

			<TooltipContent side="top" align="center" className="font-medium">
				{title}
			</TooltipContent>
		</Tooltip>
	);
}
