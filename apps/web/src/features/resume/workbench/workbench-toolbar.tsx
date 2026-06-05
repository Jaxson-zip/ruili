import type { Resume } from "@/features/resume/builder/draft";
import { ArrowLeftIcon, FileDocIcon, FilePdfIcon, FloppyDiskIcon } from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@reactive-resume/ui/components/button";
import { orpc } from "@/libs/orpc/client";
import { exportResumeDocx, exportResumePdf } from "./export-actions";

type Props = {
	resume: Resume;
};

export function WorkbenchToolbar({ resume }: Props) {
	const { mutateAsync: createVersion, isPending: isSavingVersion } = useMutation(
		orpc.resume.versions.create.mutationOptions(),
	);

	const onSaveVersion = async () => {
		const id = toast.loading("正在保存版本...");

		try {
			await createVersion({
				resumeId: resume.id,
				label: `手动保存 · ${new Date().toLocaleString("zh-CN", { hour12: false })}`,
				source: "manual",
			});
			toast.success("版本已保存", { id });
		} catch {
			toast.error("版本保存失败，请重试。", { id });
		}
	};

	const onExportPdf = async () => {
		const id = toast.loading("正在生成 PDF...");

		try {
			await exportResumePdf(resume);
			toast.success("PDF 已导出", { id });
		} catch {
			toast.error("PDF 生成失败，请重试。", { id });
		}
	};

	const onExportDocx = async () => {
		const id = toast.loading("正在生成 Word...");

		try {
			await exportResumeDocx(resume);
			toast.success("Word 已导出", { id });
		} catch {
			toast.error("Word 生成失败，请重试。", { id });
		}
	};

	return (
		<header className="flex h-14 shrink-0 items-center justify-between border-[#d9dee5] border-b bg-white px-4">
			<div className="flex min-w-0 items-center gap-3">
				<div className="grid size-8 shrink-0 place-items-center rounded-md bg-[#111827] font-semibold text-sm text-white">
					锐
				</div>
				<strong className="text-sm tracking-normal">锐历</strong>
				<span className="h-4 w-px bg-[#d9dee5]" />
				<span className="truncate text-[#5d6675] text-sm">{resume.name}</span>
			</div>

			<div className="flex items-center gap-2">
				<Button
					variant="ghost"
					size="sm"
					className="gap-2"
					onClick={() => {
						window.location.href = `/builder/${resume.id}`;
					}}
				>
					<ArrowLeftIcon className="size-4" />
					返回编辑
				</Button>
				<Button
					variant="outline"
					size="sm"
					className="gap-2"
					disabled={isSavingVersion}
					onClick={() => onSaveVersion()}
				>
					<FloppyDiskIcon className="size-4" />
					保存版本
				</Button>
				<Button variant="outline" size="sm" className="gap-2" onClick={() => onExportDocx()}>
					<FileDocIcon className="size-4" />
					导出 Word
				</Button>
				<Button size="sm" className="gap-2 bg-[#111827] text-white hover:bg-[#1f2937]" onClick={() => onExportPdf()}>
					<FilePdfIcon className="size-4" />
					导出 PDF
				</Button>
			</div>
		</header>
	);
}
