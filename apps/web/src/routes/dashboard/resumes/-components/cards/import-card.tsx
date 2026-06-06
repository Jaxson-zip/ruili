import { t } from "@lingui/core/macro";
import { DownloadSimpleIcon } from "@phosphor-icons/react";
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
			<div className="absolute inset-0 flex items-center justify-center">
				<DownloadSimpleIcon weight="thin" className="size-12" />
			</div>
		</BaseCard>
	);
}
