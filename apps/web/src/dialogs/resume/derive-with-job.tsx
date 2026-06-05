import type { DialogProps } from "../store";
import { t } from "@lingui/core/macro";
import { MagicWandIcon } from "@phosphor-icons/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@reactive-resume/ui/components/button";
import {
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@reactive-resume/ui/components/dialog";
import { Input } from "@reactive-resume/ui/components/input";
import { Spinner } from "@reactive-resume/ui/components/spinner";
import { Textarea } from "@reactive-resume/ui/components/textarea";
import { getResumeErrorMessage } from "@/libs/error-message";
import { orpc } from "@/libs/orpc/client";
import { useDialogStore } from "../store";

export function DeriveResumeWithJobDialog({ data }: DialogProps<"resume.deriveWithJob">) {
	const navigate = useNavigate();
	const closeDialog = useDialogStore((state) => state.closeDialog);
	const { data: providers = [], isLoading } = useQuery(orpc.aiProviders.list.queryOptions());
	const hasAIProvider = providers.some((provider) => provider.enabled && provider.testStatus === "success");
	const { mutate: deriveWithJob, isPending } = useMutation(orpc.resume.deriveWithJob.mutationOptions());
	const [company, setCompany] = useState("");
	const [roleTitle, setRoleTitle] = useState("");
	const [jdText, setJdText] = useState("");
	const companyInputId = useId();
	const roleTitleInputId = useId();
	const jdTextInputId = useId();
	const isBlocked = isLoading || !hasAIProvider || jdText.trim().length < 20 || isPending;

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		event.stopPropagation();

		if (isBlocked) return;

		const toastId = toast.loading(t`正在生成 JD 定制副本...`, {
			description: t`原简历不会被覆盖，生成后会跳转到新副本。`,
		});

		const trimmedCompany = company.trim();
		const trimmedRoleTitle = roleTitle.trim();

		deriveWithJob(
			{
				id: data.id,
				...(trimmedCompany ? { company: trimmedCompany } : {}),
				...(trimmedRoleTitle ? { roleTitle: trimmedRoleTitle } : {}),
				jdText: jdText.trim(),
			},
			{
				onSuccess: (id) => {
					toast.success(t`定制副本已生成`, { id: toastId, description: null });
					closeDialog();
					void navigate({ to: "/builder/$resumeId", params: { resumeId: id } });
				},
				onError: (error) => {
					toast.error(getResumeErrorMessage(error), { id: toastId, description: null });
				},
			},
		);
	};

	return (
		<DialogContent>
			<DialogHeader>
				<DialogTitle className="flex items-center gap-x-2">
					<MagicWandIcon />
					结合 JD 派生副本
				</DialogTitle>
				<DialogDescription>
					基于「{data.name}」生成一份新简历，AI 会按目标岗位调整摘要、经历表述和关键词侧重，不覆盖原版本。
				</DialogDescription>
			</DialogHeader>

			<form className="space-y-4" onSubmit={handleSubmit}>
				<div className="grid gap-3 sm:grid-cols-2">
					<div className="space-y-1.5">
						<span className="font-medium text-sm">目标公司</span>
						<Input
							id={companyInputId}
							aria-label="目标公司"
							value={company}
							onChange={(event) => setCompany(event.target.value)}
							placeholder="例如：星河科技"
						/>
					</div>

					<div className="space-y-1.5">
						<span className="font-medium text-sm">目标岗位</span>
						<Input
							id={roleTitleInputId}
							aria-label="目标岗位"
							value={roleTitle}
							onChange={(event) => setRoleTitle(event.target.value)}
							placeholder="例如：高级前端工程师"
						/>
					</div>
				</div>

				<div className="space-y-1.5">
					<span className="font-medium text-sm">岗位 JD</span>
					<Textarea
						id={jdTextInputId}
						aria-label="岗位 JD"
						value={jdText}
						onChange={(event) => setJdText(event.target.value)}
						placeholder="粘贴招聘 JD、岗位职责、任职要求。至少 20 个字。"
						className="min-h-40 resize-y"
					/>
				</div>

				{!hasAIProvider ? (
					<div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-950 text-sm">
						<p className="font-medium">需要先配置可用的 AI 模型</p>
						<p className="mt-1 text-xs leading-normal opacity-85">
							JD 派生需要 LLM。请先到设置里添加并测试一个 AI Provider。
						</p>
					</div>
				) : null}

				<DialogFooter>
					<Button type="submit" disabled={isBlocked}>
						{isPending ? <Spinner /> : null}
						生成定制副本
					</Button>
				</DialogFooter>
			</form>
		</DialogContent>
	);
}
