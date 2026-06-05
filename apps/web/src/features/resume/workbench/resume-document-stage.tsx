import type { Resume } from "@/features/resume/builder/draft";
import { ResumePreview } from "@/features/resume/preview/preview";

type Props = {
	resume: Resume;
};

export function ResumeDocumentStage({ resume }: Props) {
	return (
		<main className="min-w-0 overflow-auto bg-[#edf1f4] px-8 py-7">
			<div className="mx-auto w-fit min-w-[595px]">
				<ResumePreview
					data={resume.data}
					pageClassName="rounded-sm shadow-[0_18px_50px_rgba(31,41,55,0.14)]"
					pageGap={24}
					pageLayout="vertical"
					pageScale={0.92}
					showPageNumbers
				/>
			</div>
		</main>
	);
}
