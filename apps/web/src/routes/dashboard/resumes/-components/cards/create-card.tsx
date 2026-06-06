import { t } from "@lingui/core/macro";
import { PlusIcon } from "@phosphor-icons/react";
import { useDialogStore } from "@/dialogs/store";
import { BaseCard } from "./base-card";

export function CreateResumeCard() {
	const { openDialog } = useDialogStore();

	return (
		<BaseCard
			asButton
			testId="create-resume-from-starter"
			title={t`创建简历`}
			description={t`选样张或模板开始`}
			onClick={() => openDialog("resume.create", undefined)}
		>
			<div className="absolute inset-0 overflow-hidden bg-linear-to-b from-muted/20 to-muted/5">
				<div className="absolute inset-x-6 top-7 h-52">
					<img
						src="/templates/starters/frontend-engineer.jpg"
						alt={t`前端工程师样张预览`}
						className="absolute top-4 left-1 h-44 w-31 -rotate-3 rounded border bg-white object-cover object-top shadow-black/20 shadow-md"
						loading="lazy"
					/>
					<img
						src="/templates/collection/028.jpg"
						alt={t`中文模板预览`}
						className="absolute top-0 right-1 h-48 w-34 rotate-3 rounded border bg-white object-cover object-top shadow-black/20 shadow-md"
						loading="lazy"
					/>
				</div>
				<div className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-full border bg-background/90 shadow-sm">
					<PlusIcon weight="bold" className="size-4" />
				</div>
			</div>
		</BaseCard>
	);
}
