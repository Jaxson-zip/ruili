import { t } from "@lingui/core/macro";
import { SparkleIcon } from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@reactive-resume/ui/components/button";
import { Textarea } from "@reactive-resume/ui/components/textarea";
import { orpc } from "@/libs/orpc/client";

type AiPolishItemKind = "experience" | "project" | "role";

type AiPolishItem = {
	title?: string;
	organization?: string;
	period?: string;
	location?: string;
};

type Props = {
	itemKind: AiPolishItemKind;
	item: AiPolishItem;
	descriptionHtml: string;
	onDescriptionChange: (descriptionHtml: string) => void;
};

export function AiPolishDescriptionAction({ itemKind, item, descriptionHtml, onDescriptionChange }: Props) {
	const jdInputId = useId();
	const [targetJobDescription, setTargetJobDescription] = useState("");
	const { mutateAsync, isPending } = useMutation(orpc.ai.polishResumeItem.mutationOptions());

	const handlePolish = async () => {
		const toastId = toast.loading(t`正在润色这段经历...`);

		try {
			const result = await mutateAsync({
				itemKind,
				item: {
					...item,
					descriptionHtml,
				},
				targetJobDescription: targetJobDescription.trim() || undefined,
			});

			onDescriptionChange(result.descriptionHtml);
			toast.success(t`AI 润色已写入描述`, { id: toastId });
		} catch {
			toast.error(t`AI 润色失败`, {
				id: toastId,
				description: t`请先确认设置里有可用的 AI 模型，并且模型测试通过。`,
			});
		}
	};

	return (
		<div className="space-y-2 rounded-md border border-dashed bg-muted/30 p-3">
			<label htmlFor={jdInputId} className="font-medium text-foreground text-xs">
				目标 JD（可选）
			</label>
			<Textarea
				id={jdInputId}
				value={targetJobDescription}
				onChange={(event) => setTargetJobDescription(event.target.value)}
				placeholder="粘贴目标岗位 JD，AI 会按关键词和职责侧重优化这条经历。"
				className="min-h-20 resize-y bg-background text-xs"
			/>
			<div className="flex items-center justify-between gap-3">
				<p className="text-muted-foreground text-xs leading-normal">只改写当前这条描述，不会自动保存整份简历。</p>
				<Button
					type="button"
					size="sm"
					variant="outline"
					className="shrink-0"
					disabled={isPending}
					onClick={handlePolish}
				>
					<SparkleIcon />
					{isPending ? "润色中..." : "AI 润色"}
				</Button>
			</div>
		</div>
	);
}
