import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useToggle } from "usehooks-ts";
import z from "zod";
import { Button } from "@reactive-resume/ui/components/button";
import { FormControl, FormItem, FormLabel, FormMessage } from "@reactive-resume/ui/components/form";
import { Input } from "@reactive-resume/ui/components/input";
import { authClient } from "@/libs/auth/client";
import { useAppForm } from "@/libs/tanstack-form";

const formSchema = z.object({
	password: z.string().min(6).max(64),
});

type Props = {
	token: string;
};

export function ResetPasswordPage({ token }: Props) {
	const navigate = useNavigate();
	const [showPassword, toggleShowPassword] = useToggle(false);

	const form = useAppForm({
		defaultValues: { password: "" },
		validators: { onSubmit: formSchema },
		onSubmit: async ({ value }) => {
			const toastId = toast.loading(t`正在重置密码...`);

			const { error } = await authClient.resetPassword({ token, newPassword: value.password });

			if (error) {
				toast.error(
					t({
						comment: "Fallback toast when resetting password fails",
						message: "密码重置失败，请稍后重试。",
					}),
					{ id: toastId },
				);
				return;
			}

			toast.success(t`密码已重置成功，现在可以使用新密码登录。`, {
				id: toastId,
			});

			void navigate({ to: "/auth/login" });
		},
	});

	return (
		<>
			<div className="space-y-1 text-center">
				<h1 className="font-semibold text-2xl tracking-tight">
					<Trans>重置密码</Trans>
				</h1>

				<div className="text-muted-foreground">
					<Trans>请输入新的账号密码</Trans>
				</div>
			</div>

			<form
				className="space-y-6"
				onSubmit={(event) => {
					event.preventDefault();
					event.stopPropagation();
					void form.handleSubmit();
				}}
			>
				<form.Field name="password">
					{(field) => (
						<FormItem hasError={field.state.meta.isTouched && field.state.meta.errors.length > 0}>
							<FormLabel>
								<Trans comment="Label for new password input on reset-password form">新密码</Trans>
							</FormLabel>
							<div className="flex items-center gap-x-1.5">
								<FormControl
									render={
										<Input
											min={6}
											max={64}
											type={showPassword ? "text" : "password"}
											autoComplete="new-password"
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) => field.handleChange(event.target.value)}
										/>
									}
								/>

								<Button
									size="icon"
									variant="ghost"
									onClick={toggleShowPassword}
									aria-label={
										showPassword
											? t({
													comment: "Accessible label for button that hides password in reset-password form",
													message: "隐藏密码",
												})
											: t({
													comment: "Accessible label for button that reveals password in reset-password form",
													message: "显示密码",
												})
									}
								>
									{showPassword ? <EyeIcon /> : <EyeSlashIcon />}
								</Button>
							</div>
							<FormMessage errors={field.state.meta.errors} />
						</FormItem>
					)}
				</form.Field>

				<Button type="submit" className="w-full">
					<Trans comment="Primary action button label on reset-password form">重置密码</Trans>
				</Button>
			</form>
		</>
	);
}
