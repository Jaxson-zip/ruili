import { ArrowRightIcon, SparkleIcon } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { match } from "ts-pattern";
import { Button } from "@reactive-resume/ui/components/button";
import { getOrpcErrorMessage } from "@/libs/error-message";
import { orpc } from "@/libs/orpc/client";

type Props = {
	resumeId: string;
};

function impactLabel(impact: "high" | "medium" | "low") {
	return match(impact)
		.with("high", () => "高优先级")
		.with("medium", () => "中优先级")
		.with("low", () => "低优先级")
		.exhaustive();
}

function impactClassName(impact: "high" | "medium" | "low") {
	return match(impact)
		.with("high", () => "bg-[#fee2e2] text-[#b91c1c]")
		.with("medium", () => "bg-[#fef3c7] text-[#92400e]")
		.with("low", () => "bg-[#dcfce7] text-[#166534]")
		.exhaustive();
}

export function AIReviewPanel({ resumeId }: Props) {
	const queryClient = useQueryClient();
	const { data: providers = [], isLoading } = useQuery(orpc.aiProviders.list.queryOptions());
	const hasUsableProvider = providers.some((provider) => provider.enabled && provider.testStatus === "success");
	const analysisQuery = useQuery({
		...orpc.resume.analysis.getById.queryOptions({ input: { id: resumeId } }),
		enabled: Boolean(resumeId) && hasUsableProvider,
	});

	const analyzeMutation = useMutation({
		...orpc.ai.analyzeResume.mutationOptions(),
		onSuccess: (analysis) => {
			queryClient.setQueryData(orpc.resume.analysis.getById.queryKey({ input: { id: resumeId } }), analysis);
			toast.success("AI 审稿已完成");
		},
		onError: (error) => {
			toast.error("AI 审稿失败", {
				description: getOrpcErrorMessage(error, {
					byCode: {
						BAD_REQUEST: "模型返回的分析格式无效，请换一个模型或稍后重试。",
						BAD_GATEWAY: "无法连接到 AI Provider，请检查 Base URL、模型名和 API Key。",
						PRECONDITION_FAILED: "需要先配置 REDIS_URL 和 ENCRYPTION_SECRET。",
					},
					fallback: "分析简历时发生错误，请稍后重试。",
				}),
			});
		},
	});

	const onAnalyze = () => {
		analyzeMutation.mutate({ resumeId });
	};

	if (isLoading) {
		return (
			<aside className="min-w-0 border-[#d9dee5] border-l bg-white px-4 py-5">
				<h2 className="font-semibold text-[#111827] text-lg tracking-normal">AI 审稿</h2>
				<div className="mt-4 rounded-md border border-[#d9dee5] p-4 text-[#687283] text-sm">正在检查模型配置...</div>
			</aside>
		);
	}

	if (!hasUsableProvider) {
		return (
			<aside className="min-w-0 border-[#d9dee5] border-l bg-white px-4 py-5">
				<h2 className="font-semibold text-[#111827] text-lg tracking-normal">AI 审稿</h2>
				<div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-950 text-sm leading-6">
					<strong className="block">需要先配置可用的 AI 模型</strong>
					<span>AI 改简历需要 LLM。请到设置里添加并测试一个 Provider，然后再生成中文审稿建议。</span>
					<Button
						className="mt-4 bg-[#111827] text-white hover:bg-[#1f2937]"
						size="sm"
						nativeButton={false}
						render={
							<a href="/dashboard/settings/integrations">
								去配置模型
								<ArrowRightIcon />
							</a>
						}
					/>
				</div>
			</aside>
		);
	}

	const analysis = analysisQuery.data;
	const score = analysis?.overallScore;
	const scoreTone =
		score == null ? "bg-[#eef2f7] text-[#687283]" : score >= 80 ? "bg-[#0f766e] text-white" : "bg-[#b7791f] text-white";
	const updatedAtLabel = analysis?.updatedAt ? new Date(analysis.updatedAt).toLocaleString("zh-CN") : null;

	return (
		<aside className="min-w-0 overflow-y-auto border-[#d9dee5] border-l bg-white px-4 py-5">
			<div className="mb-4 flex items-center justify-between gap-3">
				<div>
					<h2 className="font-semibold text-[#111827] text-lg tracking-normal">AI 审稿</h2>
					<p className="mt-1 text-[#687283] text-xs">基于当前简历内容生成中文投递建议</p>
				</div>
				<Button
					size="sm"
					disabled={analyzeMutation.isPending}
					onClick={onAnalyze}
					className="bg-[#111827] text-white hover:bg-[#1f2937]"
				>
					<SparkleIcon />
					{analyzeMutation.isPending ? "分析中..." : analysis ? "重新分析" : "开始分析"}
				</Button>
			</div>

			<div className="mb-4 rounded-md border border-[#d9dee5] p-4">
				<div className="flex items-end gap-2">
					<strong className={`grid size-16 place-items-center rounded-full text-2xl leading-none ${scoreTone}`}>
						{score ?? "--"}
					</strong>
					<div className="pb-1">
						<p className="font-medium text-[#111827] text-sm">综合评分</p>
						<p className="text-[#687283] text-xs">
							{updatedAtLabel ? `最近分析：${updatedAtLabel}` : "尚未生成审稿结果"}
						</p>
					</div>
				</div>
			</div>

			{analysisQuery.isLoading ? (
				<div className="rounded-md border border-[#d9dee5] p-4 text-[#687283] text-sm">正在加载历史分析...</div>
			) : null}

			{!analysis && !analysisQuery.isLoading ? (
				<div className="rounded-md border border-[#c5ccd6] border-dashed p-4 text-[#687283] text-sm leading-6">
					点击“开始分析”后，模型会输出维度评分、优势和优先修改建议。后续再接一键改写和应用 Patch。
				</div>
			) : null}

			{analysis ? (
				<div className="space-y-4">
					<section className="rounded-md border border-[#d9dee5] p-3">
						<h3 className="font-semibold text-[#111827] text-sm">评分维度</h3>
						<div className="mt-3 space-y-2">
							{analysis.scorecard.map((item) => (
								<div key={item.dimension} className="rounded-md bg-[#f7f9fb] p-3">
									<div className="flex items-center justify-between gap-2">
										<span className="font-medium text-[#111827] text-sm">{item.dimension}</span>
										<span className="font-semibold text-[#0f766e] text-sm">{item.score}/100</span>
									</div>
									<p className="mt-2 text-[#687283] text-xs leading-5">{item.rationale}</p>
								</div>
							))}
						</div>
					</section>

					{analysis.strengths.length > 0 ? (
						<section className="rounded-md border border-[#d9dee5] p-3">
							<h3 className="font-semibold text-[#111827] text-sm">当前优势</h3>
							<ul className="mt-2 list-disc space-y-1.5 pl-4 text-[#687283] text-sm leading-6">
								{analysis.strengths.map((strength) => (
									<li key={strength}>{strength}</li>
								))}
							</ul>
						</section>
					) : null}

					{analysis.suggestions.length > 0 ? (
						<section className="rounded-md border border-[#d9dee5] p-3">
							<h3 className="font-semibold text-[#111827] text-sm">修改建议</h3>
							<div className="mt-3 space-y-3">
								{analysis.suggestions.map((suggestion) => (
									<div key={suggestion.title} className="rounded-md border border-[#e6eaf0] p-3">
										<div className="flex items-center gap-2">
											<span
												className={`rounded px-1.5 py-0.5 font-medium text-xs ${impactClassName(suggestion.impact)}`}
											>
												{impactLabel(suggestion.impact)}
											</span>
											<h4 className="font-semibold text-[#111827] text-sm">{suggestion.title}</h4>
										</div>
										<p className="mt-2 text-[#687283] text-xs leading-5">{suggestion.why}</p>
										{suggestion.exampleRewrite ? (
											<p className="mt-2 rounded bg-[#f7f9fb] p-2 text-[#374151] text-xs leading-5">
												{suggestion.exampleRewrite}
											</p>
										) : null}
									</div>
								))}
							</div>
						</section>
					) : null}
				</div>
			) : null}
		</aside>
	);
}
