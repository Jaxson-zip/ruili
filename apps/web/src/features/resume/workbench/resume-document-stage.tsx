import type { Resume } from "@/features/resume/builder/draft";

type Props = {
	resume: Resume;
};

export function ResumeDocumentStage({ resume }: Props) {
	const name = resume.data.basics.name || "未命名";
	const headline = resume.data.basics.headline || "目标岗位";

	return (
		<main className="min-w-0 overflow-auto bg-[#edf1f4] px-8 py-7">
			<article className="mx-auto min-h-[720px] max-w-[760px] rounded-sm border border-[#d9dee5] bg-white px-14 py-12 shadow-[0_18px_50px_rgba(31,41,55,0.14)]">
				<div className="flex items-end justify-between gap-6 border-[#e3e7ec] border-b pb-6">
					<div className="min-w-0">
						<h1 className="truncate font-bold text-3xl text-[#111827] tracking-normal">{name}</h1>
						<p className="mt-2 text-[#687283] text-sm">{resume.data.basics.email}</p>
					</div>
					<p className="shrink-0 font-medium text-[#0f766e] text-sm">{headline}</p>
				</div>

				<section className="mt-8">
					<h2 className="border-[#e3e7ec] border-b pb-2 font-semibold text-[#111827] text-sm">个人总结</h2>
					<p className="mt-3 text-[#465162] text-sm leading-7">
						这里展示简历正文。后续任务会接入真实预览、段落聚焦和 AI Patch 审阅。
					</p>
				</section>
			</article>
		</main>
	);
}
