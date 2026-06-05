import type { Resume } from "@/features/resume/builder/draft";
import { AIReviewPanel } from "./ai-review-panel";
import { ResumeDocumentStage } from "./resume-document-stage";
import { TargetSidebar } from "./target-sidebar";
import { WorkbenchToolbar } from "./workbench-toolbar";

type Props = {
	resume: Resume;
};

export function WorkbenchShell({ resume }: Props) {
	return (
		<div className="flex h-svh min-h-[720px] flex-col bg-[#edf1f4] text-[#121826]">
			<WorkbenchToolbar resume={resume} />
			<div className="grid min-h-0 flex-1 grid-cols-[288px_minmax(520px,1fr)_360px]">
				<TargetSidebar />
				<ResumeDocumentStage resume={resume} />
				<AIReviewPanel resumeId={resume.id} />
			</div>
		</div>
	);
}
