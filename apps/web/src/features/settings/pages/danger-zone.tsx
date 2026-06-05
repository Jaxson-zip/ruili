import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { TrashSimpleIcon } from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { m } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@reactive-resume/ui/components/button";
import { Input } from "@reactive-resume/ui/components/input";
import { useConfirm } from "@/hooks/use-confirm";
import { authClient } from "@/libs/auth/client";
import { getReadableErrorMessage } from "@/libs/error-message";
import { orpc } from "@/libs/orpc/client";

const CONFIRMATION_TEXT = "delete";

export function DangerZoneSettingsPage() {
	const confirm = useConfirm();
	const navigate = useNavigate();
	const [confirmationText, setConfirmationText] = useState("");
	const isConfirmationValid = confirmationText === CONFIRMATION_TEXT;

	const { mutate: deleteAccount } = useMutation(orpc.auth.deleteAccount.mutationOptions());

	const handleDeleteAccount = async () => {
		const confirmed = await confirm(t`确定要删除你的账号吗？`, {
			description: t`此操作无法撤销，所有数据都会被永久删除。`,
			confirmText: t({
				comment: "Account deletion confirmation dialog confirm action in danger zone",
				message: "确认",
			}),
			cancelText: t({
				comment: "Account deletion confirmation dialog cancel action in danger zone",
				message: "取消",
			}),
		});

		if (!confirmed) return;

		const toastId = toast.loading(t`正在删除账号...`);

		deleteAccount(undefined, {
			onSuccess: async () => {
				toast.success(t`账号已删除。`, { id: toastId });
				await authClient.signOut();
				void navigate({ to: "/" });
			},
			onError: (error) => {
				toast.error(
					getReadableErrorMessage(
						error,
						t({
							comment: "Fallback toast when account deletion fails",
							message: "删除账号失败，请重试。",
						}),
					),
					{ id: toastId },
				);
			},
		});
	};

	return (
		<m.div
			initial={{ opacity: 0, y: -20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.25, ease: "easeOut" }}
			className="grid max-w-xl gap-6 will-change-[transform,opacity]"
		>
			<p className="leading-relaxed">
				<Trans>要删除账号，请输入确认文本并点击下方按钮。</Trans>
			</p>

			<Input
				type="text"
				value={confirmationText}
				onChange={(e) => setConfirmationText(e.target.value)}
				placeholder={t`输入 "${CONFIRMATION_TEXT}" 以确认`}
			/>

			<m.div
				className="justify-self-end will-change-transform"
				whileHover={!isConfirmationValid ? undefined : { y: -1, scale: 1.01 }}
				whileTap={!isConfirmationValid ? undefined : { scale: 0.98 }}
				transition={{ duration: 0.14, ease: "easeOut" }}
			>
				<Button variant="destructive" onClick={handleDeleteAccount} disabled={!isConfirmationValid}>
					<TrashSimpleIcon />
					<Trans>删除账号</Trans>
				</Button>
			</m.div>
		</m.div>
	);
}
