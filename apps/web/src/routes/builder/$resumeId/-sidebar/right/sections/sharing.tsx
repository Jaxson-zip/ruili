import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { ORPCError } from "@orpc/client";
import { ClipboardIcon, LockSimpleIcon, LockSimpleOpenIcon } from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { useCopyToClipboard } from "usehooks-ts";
import { Button } from "@reactive-resume/ui/components/button";
import { Input } from "@reactive-resume/ui/components/input";
import { Label } from "@reactive-resume/ui/components/label";
import { Switch } from "@reactive-resume/ui/components/switch";
import { useCurrentResume, usePatchResume } from "@/features/resume/builder/draft";
import { useConfirm } from "@/hooks/use-confirm";
import { usePrompt } from "@/hooks/use-prompt";
import { authClient } from "@/libs/auth/client";
import { orpc } from "@/libs/orpc/client";
import { SectionBase } from "../shared/section-base";

export function SharingSectionBuilder() {
	const prompt = usePrompt();
	const confirm = useConfirm();
	const [_, copyToClipboard] = useCopyToClipboard();
	const { data: session } = authClient.useSession();
	const resume = useCurrentResume();
	const patchResume = usePatchResume();

	const { mutateAsync: updateResume } = useMutation(orpc.resume.update.mutationOptions());
	const { mutateAsync: setPassword } = useMutation(orpc.resume.setPassword.mutationOptions());
	const { mutateAsync: removePassword } = useMutation(orpc.resume.removePassword.mutationOptions());

	const publicUrl = useMemo(() => {
		if (!session) return "";
		return `${window.location.origin}/${session.user.username}/${resume.slug}`;
	}, [session, resume]);

	const onCopyUrl = useCallback(async () => {
		await copyToClipboard(publicUrl);
		toast.success(t`简历链接已复制到剪贴板。`);
	}, [publicUrl, copyToClipboard]);

	const onTogglePublic = useCallback(
		async (checked: boolean) => {
			try {
				const updated = await updateResume({ id: resume.id, isPublic: checked });
				patchResume((draft) => {
					draft.isPublic = updated.isPublic;
				});
			} catch (error) {
				const message = error instanceof ORPCError ? error.message : t`出现问题，请重试。`;
				toast.error(message);
			}
		},
		[patchResume, resume.id, updateResume],
	);

	const onSetPassword = useCallback(async () => {
		const value = await prompt(t`用密码保护简历，避免未授权访问`, {
			description: t`访问这份简历公开链接的人必须输入密码才能查看。`,
			confirmText: t`设置密码`,
			inputProps: {
				type: "password",
				minLength: 6,
				maxLength: 64,
			},
		});
		if (!value) return;

		const password = value.trim();
		if (!password) return toast.error(t`密码不能为空。`);

		const toastId = toast.loading(t`正在开启密码保护...`);

		try {
			await setPassword({ id: resume.id, password });
			patchResume((draft) => {
				draft.hasPassword = true;
			});
			toast.success(t`已开启密码保护。`, { id: toastId });
		} catch (error) {
			const message = error instanceof ORPCError ? error.message : t`出现问题，请重试。`;
			toast.error(message, { id: toastId });
		}
	}, [patchResume, prompt, resume.id, setPassword]);

	const onRemovePassword = useCallback(async () => {
		if (!resume.hasPassword) return;

		const confirmation = await confirm(t`确定要移除密码保护吗？`, {
			description: t`拥有公开链接的人将无需输入密码即可查看和下载这份简历。`,
			confirmText: t`确认`,
			cancelText: t`取消`,
		});
		if (!confirmation) return;

		const toastId = toast.loading(t`正在移除密码保护...`);

		try {
			await removePassword({ id: resume.id });
			patchResume((draft) => {
				draft.hasPassword = false;
			});
			toast.success(t`已关闭密码保护。`, { id: toastId });
		} catch (error) {
			const message = error instanceof ORPCError ? error.message : t`出现问题，请重试。`;
			toast.error(message, { id: toastId });
		}
	}, [confirm, patchResume, removePassword, resume.hasPassword, resume.id]);

	const isPasswordProtected = resume.hasPassword;

	return (
		<SectionBase type="sharing" className="space-y-4">
			<div className="flex items-center gap-x-4">
				<Switch
					id="sharing-switch"
					checked={resume.isPublic}
					onCheckedChange={(checked) => void onTogglePublic(checked)}
				/>

				<Label htmlFor="sharing-switch" className="my-2 flex flex-col items-start gap-y-1 font-normal">
					<span className="font-medium">
						<Trans>允许公开访问</Trans>
					</span>

					<span className="text-muted-foreground text-xs">
						<Trans>拥有链接的人可以查看并下载这份简历。</Trans>
					</span>
				</Label>
			</div>

			{resume.isPublic && (
				<div className="space-y-4 rounded-md border p-4">
					<div className="grid gap-2">
						<Label htmlFor="sharing-url">
							<Trans comment="Form field label for the generated public resume link in sharing settings">URL</Trans>
						</Label>

						<div className="flex items-center gap-x-2">
							<Input readOnly id="sharing-url" value={publicUrl} />

							<Button size="icon" variant="ghost" onClick={onCopyUrl}>
								<ClipboardIcon />
							</Button>
						</div>
					</div>

					<p className="text-muted-foreground">
						{isPasswordProtected ? (
							<Trans>这份简历的公开链接已受密码保护。请只把密码分享给你信任的人。</Trans>
						) : (
							<Trans>你也可以设置密码，让只有知道密码的人才能通过链接查看简历。</Trans>
						)}
					</p>

					{isPasswordProtected ? (
						<Button variant="outline" onClick={onRemovePassword}>
							<LockSimpleOpenIcon />
							<Trans>移除密码</Trans>
						</Button>
					) : (
						<Button variant="outline" onClick={onSetPassword}>
							<LockSimpleIcon />
							<Trans>设置密码</Trans>
						</Button>
					)}
				</div>
			)}
		</SectionBase>
	);
}
