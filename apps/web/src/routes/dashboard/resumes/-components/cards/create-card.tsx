import { t } from "@lingui/core/macro";
import { PlusIcon } from "@phosphor-icons/react";
import { useDialogStore } from "@/dialogs/store";
import { getWordTemplateLibrary } from "@/features/resume/word-template/library";
import { BaseCard } from "./base-card";

export function CreateResumeCard() {
	const { openDialog } = useDialogStore();
	const wordTemplateCount = getWordTemplateLibrary().length;

	return (
		<BaseCard
			asButton
			testId="create-resume-from-starter"
			title={t`创建简历`}
			description={t`${wordTemplateCount} 套 Word 模板可用`}
			onClick={() => openDialog("resume.create", undefined)}
		>
			<div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-linear-to-b from-muted/20 to-muted/5">
				<div className="flex size-20 items-center justify-center rounded-full border bg-background/90 shadow-sm">
					<PlusIcon weight="bold" className="size-8" />
				</div>
			</div>
		</BaseCard>
	);
}
