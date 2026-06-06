import { t } from "@lingui/core/macro";
import { FileArrowUpIcon } from "@phosphor-icons/react";
import { useDialogStore } from "@/dialogs/store";
import { BaseCard } from "./base-card";

export function ImportResumeCard() {
	const { openDialog } = useDialogStore();

	return (
		<BaseCard
			asButton
			title={t`导入已有简历`}
			description={t`支持 Word / PDF / 图片 / JSON`}
			onClick={() => openDialog("resume.import", undefined)}
		>
			<div className="absolute inset-0 overflow-hidden bg-linear-to-b from-muted/20 to-muted/5 px-7 pt-8">
				<div className="space-y-3">
					{["PDF", "Word", "图片", "JSON"].map((label) => (
						<div key={label} className="flex items-center gap-3 rounded-md border bg-background/70 px-3 py-2 shadow-sm">
							<FileArrowUpIcon className="size-4 text-muted-foreground" />
							<span className="font-medium text-sm">{label}</span>
						</div>
					))}
				</div>
			</div>
		</BaseCard>
	);
}
