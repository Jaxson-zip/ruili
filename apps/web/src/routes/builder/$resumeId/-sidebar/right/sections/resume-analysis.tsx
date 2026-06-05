import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { ArrowRightIcon, InfoIcon, LightningIcon, SparkleIcon } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { match } from "ts-pattern";
import { Alert, AlertDescription } from "@reactive-resume/ui/components/alert";
import { Badge } from "@reactive-resume/ui/components/badge";
import { Button } from "@reactive-resume/ui/components/button";
import { useResume } from "@/features/resume/builder/draft";
import { getOrpcErrorMessage } from "@/libs/error-message";
import { orpc } from "@/libs/orpc/client";
import { SectionBase } from "../shared/section-base";

function impactCircleClass(impact: "high" | "medium" | "low") {
	return match(impact)
		.with("high", () => "bg-rose-600")
		.with("medium", () => "bg-amber-600")
		.with("low", () => "bg-emerald-600")
		.exhaustive();
}

function impactLabel(impact: "high" | "medium" | "low") {
	return match(impact)
		.with("high", () =>
			t({
				comment: "Impact severity label in resume analysis suggestion card",
				message: "高优先级",
			}),
		)
		.with("medium", () =>
			t({
				comment: "Impact severity label in resume analysis suggestion card",
				message: "中优先级",
			}),
		)
		.with("low", () =>
			t({
				comment: "Impact severity label in resume analysis suggestion card",
				message: "低优先级",
			}),
		)
		.exhaustive();
}

export function ResumeAnalysisSectionBuilder() {
	const queryClient = useQueryClient();

	const resume = useResume();

	const resumeId = resume?.id ?? "";
	const providersQuery = useQuery(orpc.aiProviders.list.queryOptions());
	const aiEnabled =
		providersQuery.data?.some((provider) => provider.enabled && provider.testStatus === "success") ?? false;

	const analysisQuery = useQuery({
		...orpc.resume.analysis.getById.queryOptions({ input: { id: resumeId } }),
		enabled: !!resume,
	});

	const { mutate: analyzeResume, isPending } = useMutation({
		...orpc.ai.analyzeResume.mutationOptions(),
		onSuccess: (analysis) => {
			queryClient.setQueryData(orpc.resume.analysis.getById.queryKey({ input: { id: resumeId } }), analysis);
			toast.success(t`简历分析完成。`);
		},
		onError: (error) => {
			toast.error(t`简历分析失败。`, {
				description: getOrpcErrorMessage(error, {
					byCode: {
						BAD_REQUEST: t({
							comment: "Error description when AI returns invalid resume analysis format",
							message: "模型返回的分析格式无效，请换一个模型或稍后重试。",
						}),
						BAD_GATEWAY: t({
							comment: "Error description when AI provider cannot be reached during resume analysis",
							message: "无法连接到 AI Provider，请检查 Base URL、模型名和 API Key。",
						}),
					},
					fallback: t({
						comment: "Fallback error description when resume analysis request fails",
						message: "分析简历时发生错误，请稍后重试。",
					}),
				}),
			});
		},
	});

	const analysis = analysisQuery.data;
	const score = analysis?.overallScore ?? null;
	const updatedAt = analysis?.updatedAt ?? null;
	const [updatedAtLabel, setUpdatedAtLabel] = useState<string | null>(null);
	const analyzeLabel = isPending ? t`分析中…` : analysis ? t`重新分析` : t`分析简历`;

	const scoreTone = useMemo(() => {
		if (score == null) return "bg-muted";
		if (score >= 80) return "bg-emerald-600";
		if (score >= 60) return "bg-amber-600";
		return "bg-rose-600";
	}, [score]);

	useEffect(() => {
		setUpdatedAtLabel(updatedAt ? new Date(updatedAt).toLocaleString("zh-CN") : null);
	}, [updatedAt]);

	const onAnalyze = () => {
		if (!resume) return;

		analyzeResume({
			resumeId: resume.id,
		});
	};

	if (!resume) return null;

	return (
		<SectionBase type="analysis" className="space-y-4">
			{!aiEnabled && <DisabledState />}

			{aiEnabled && (
				<div className="space-y-3">
					<div className="space-y-4 rounded-md border bg-card p-3">
						<div className="grid grid-cols-2 items-center gap-3">
							<div>
								<p className="text-muted-foreground text-xs">
									<Trans>让 AI 按中文投递场景检查简历，输出综合评分、当前优势和优先修改建议。</Trans>
								</p>
							</div>

							<Button disabled={isPending} onClick={onAnalyze} className="ml-auto w-fit">
								<SparkleIcon />
								{analyzeLabel}
							</Button>
						</div>

						<div className="grid grid-cols-[auto_1fr] items-center gap-3">
							<div
								className={`grid size-18 place-items-center rounded-full border-3 border-background font-bold text-lg text-white ${scoreTone}`}
							>
								{score ?? "--"}
							</div>

							<div className="space-y-3">
								<p className="font-medium text-sm leading-none">
									<Trans>综合评分</Trans>
								</p>
								<div className="grid grid-cols-10 gap-1">
									{Array.from({ length: 10 }).map((_, index) => {
										const active = score != null && index < Math.round(score / 10);
										return (
											<div
												key={`scorebar-${index}`}
												className={`h-1.5 rounded-full transition-colors ${active ? "bg-primary" : "bg-muted"}`}
											/>
										);
									})}
								</div>
								{updatedAtLabel ? (
									<p className="text-muted-foreground text-xs leading-none">
										<Trans>最近分析：{updatedAtLabel}</Trans>
									</p>
								) : null}
							</div>
						</div>
					</div>

					{analysisQuery.isFetched && !analysis && !isPending && (
						<div className="rounded-md border border-dashed p-3">
							<p className="max-w-xs text-muted-foreground text-sm">
								<Trans>第一次分析后，这里会显示评分维度、当前优势和按优先级排序的修改建议。</Trans>
							</p>
						</div>
					)}

					{analysis && (
						<div className="space-y-4">
							<div className="space-y-3 rounded-md border p-3">
								<h5 className="flex items-center gap-2 font-semibold text-sm">
									<LightningIcon className="text-primary" />
									<Trans>评分维度</Trans>
								</h5>

								<div className="space-y-3">
									{analysis.scorecard.map((item) => (
										<div key={item.dimension} className="space-y-3 rounded-md border bg-card p-3">
											<div className="flex items-center justify-between gap-2">
												<div className="font-medium text-sm">{item.dimension}</div>
												<Badge variant="secondary">{item.score}/100</Badge>
											</div>
											<p className="text-muted-foreground text-xs">{item.rationale}</p>
										</div>
									))}
								</div>
							</div>

							{analysis.strengths.length > 0 && (
								<div className="space-y-3 rounded-md border p-3">
									<h5 className="font-semibold text-sm">
										<Trans>当前优势</Trans>
									</h5>

									<ul className="list-outside list-disc pl-5 text-muted-foreground text-sm">
										{analysis.strengths.map((strength) => (
											<li key={strength} className="py-1.5">
												{strength}
											</li>
										))}
									</ul>
								</div>
							)}

							{analysis.suggestions.length > 0 && (
								<div className="space-y-4 rounded-md border p-3">
									<h5 className="font-semibold text-sm">
										<Trans>修改建议</Trans>
									</h5>

									<div className="space-y-3">
										{analysis.suggestions.map((suggestion) => (
											<div key={suggestion.title} className="space-y-3 rounded-md border bg-card p-3">
												<div className="flex items-center gap-2">
													<span
														aria-hidden="true"
														className={`size-2.5 shrink-0 rounded-full ring-1 ring-border ${impactCircleClass(suggestion.impact)}`}
														title={impactLabel(suggestion.impact)}
													/>
													<span className="sr-only">{impactLabel(suggestion.impact)}</span>
													<div className="font-semibold text-sm tracking-tight">{suggestion.title}</div>
												</div>

												<div className="text-muted-foreground text-xs">{suggestion.why}</div>

												{suggestion.exampleRewrite && (
													<div className="rounded bg-muted p-2 text-muted-foreground text-xs">
														{suggestion.exampleRewrite}
													</div>
												)}
											</div>
										))}
									</div>
								</div>
							)}
						</div>
					)}
				</div>
			)}
		</SectionBase>
	);
}

function DisabledState() {
	return (
		<Alert>
			<InfoIcon />
			<AlertDescription className="space-y-3">
				<p>
					<Trans>配置 AI Provider 后，可以生成中文简历分析，包括综合评分、当前优势和可执行的修改建议。</Trans>
				</p>

				<Button
					size="sm"
					variant="outline"
					nativeButton={false}
					render={
						<Link to="/dashboard/settings/integrations">
							<Trans>打开 AI Providers</Trans>
							<ArrowRightIcon />
						</Link>
					}
				/>
			</AlertDescription>
		</Alert>
	);
}
