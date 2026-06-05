import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { BookOpenIcon, KeyIcon, LinkSimpleIcon, PlusIcon, TrashSimpleIcon } from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, m } from "motion/react";
import { toast } from "sonner";
import { Button } from "@reactive-resume/ui/components/button";
import { Separator } from "@reactive-resume/ui/components/separator";
import { useDialogStore } from "@/dialogs/store";
import { useConfirm } from "@/hooks/use-confirm";
import { authClient } from "@/libs/auth/client";
import { getReadableErrorMessage } from "@/libs/error-message";

export function ApiKeysSettingsPage() {
	const confirm = useConfirm();
	const queryClient = useQueryClient();
	const openDialog = useDialogStore((state) => state.openDialog);

	const { data: apiKeys = [] } = useQuery({
		queryKey: ["auth", "api-keys"],
		queryFn: () => authClient.apiKey.list(),
		select: ({ data }) => {
			if (!data) return [];

			return data.apiKeys
				.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
				.filter((key) => !!key.expiresAt && key.expiresAt.getTime() > Date.now());
		},
	});

	const onDelete = async (id: string) => {
		const confirmation = await confirm(t`确定要删除这个 API Key 吗？`, {
			description: t`删除后这个 API Key 将无法再访问你的数据，此操作无法撤销。`,
			confirmText: t({
				comment: "API key deletion confirmation dialog confirm action in settings",
				message: "删除",
			}),
			cancelText: t({
				comment: "API key deletion confirmation dialog cancel action in settings",
				message: "取消",
			}),
		});

		if (!confirmation) return;

		const toastId = toast.loading(t`正在删除 API Key...`);

		const { error } = await authClient.apiKey.delete({ keyId: id });

		if (error) {
			toast.error(
				getReadableErrorMessage(
					error,
					t({
						comment: "Fallback toast when deleting an API key fails",
						message: "删除 API Key 失败，请重试。",
					}),
				),
				{ id: toastId },
			);
			return;
		}

		toast.success(t`API Key 已删除。`, { id: toastId });
		void queryClient.invalidateQueries({ queryKey: ["auth", "api-keys"] });
	};

	return (
		<m.div
			initial={{ opacity: 0, y: -20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.25, ease: "easeOut" }}
			className="grid max-w-xl gap-6 will-change-[transform,opacity]"
		>
			<div className="flex items-start gap-4 rounded-md border bg-popover p-6">
				<div className="rounded-md bg-primary/10 p-2.5">
					<BookOpenIcon className="text-primary" size={24} />
				</div>

				<div className="flex-1 space-y-2">
					<h3 className="font-semibold">
						<Trans>如何使用 API？</Trans>
					</h3>

					<p className="text-muted-foreground leading-relaxed">
						<Trans>锐历当前沿用原项目的 API 结构。你可以查看原项目 API 文档，了解端点、请求示例和认证方式。</Trans>
					</p>

					<Button
						variant="link"
						nativeButton={false}
						render={
							<a href="https://docs.rxresu.me/api-reference" target="_blank" rel="noopener noreferrer">
								<LinkSimpleIcon />
								<Trans>原项目 API 文档</Trans>
							</a>
						}
					/>
				</div>
			</div>

			<Separator />

			<div>
				<Button
					variant="outline"
					className="h-auto w-full py-3"
					onClick={() => openDialog("api-key.create", undefined)}
				>
					<PlusIcon />
					<Trans>创建新的 API Key</Trans>
				</Button>

				<AnimatePresence initial={false} mode="popLayout">
					{apiKeys.map((key, index) => (
						<m.div
							key={key.id}
							className="flex items-center gap-x-4 py-4 will-change-[transform,opacity]"
							initial={{ opacity: 0, y: -16 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -16 }}
							transition={{ duration: 0.16, delay: Math.min(0.12, index * 0.04) }}
						>
							<KeyIcon />

							<div className="flex-1 space-y-1">
								<p className="font-mono text-xs">{key.start}...</p>
								<div className="text-muted-foreground text-xs">
									<Trans>到期时间：{key.expiresAt?.toLocaleDateString()}</Trans>
								</div>
							</div>

							<m.div
								className="will-change-transform"
								whileHover={{ y: -1, scale: 1.03 }}
								whileTap={{ scale: 0.96 }}
								transition={{ duration: 0.14, ease: "easeOut" }}
							>
								<Button size="icon" variant="ghost" onClick={() => onDelete(key.id)}>
									<TrashSimpleIcon />
								</Button>
							</m.div>
						</m.div>
					))}
				</AnimatePresence>
			</div>
		</m.div>
	);
}
