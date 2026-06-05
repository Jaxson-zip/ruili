import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { ArrowLeftIcon, CheckIcon } from "@phosphor-icons/react";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import z from "zod";
import { Button } from "@reactive-resume/ui/components/button";
import { FormControl, FormItem, FormMessage } from "@reactive-resume/ui/components/form";
import { Input } from "@reactive-resume/ui/components/input";
import { authClient } from "@/libs/auth/client";
import { useAppForm } from "@/libs/tanstack-form";

const formSchema = z.object({
	code: z.string().length(6, "验证码必须是 6 位数字"),
});

export function VerifyTwoFactorPage() {
	const router = useRouter();
	const navigate = useNavigate();

	const form = useAppForm({
		defaultValues: { code: "" },
		validators: { onSubmit: formSchema },
		onSubmit: async ({ value }) => {
			const toastId = toast.loading(t`正在验证...`);

			const { error } = await authClient.twoFactor.verifyTotp({
				code: value.code,
			});

			if (error) {
				toast.error(
					t({
						comment: "Fallback toast when verifying a two-factor authentication code fails",
						message: "验证码验证失败，请重试。",
					}),
					{ id: toastId },
				);
				return;
			}

			toast.dismiss(toastId);
			await router.invalidate();
			void navigate({ to: "/dashboard", replace: true });
		},
	});

	return (
		<>
			<div className="space-y-1 text-center">
				<h1 className="font-semibold text-2xl tracking-tight">
					<Trans>双重验证</Trans>
				</h1>
				<div className="text-muted-foreground">
					<Trans>输入验证器应用中的验证码</Trans>
				</div>
			</div>

			<form
				className="grid gap-6"
				onSubmit={(event) => {
					event.preventDefault();
					event.stopPropagation();
					void form.handleSubmit();
				}}
			>
				<form.Field name="code">
					{(field) => (
						<FormItem
							className="justify-self-center"
							hasError={field.state.meta.isTouched && field.state.meta.errors.length > 0}
						>
							<FormControl
								render={
									<Input
										type="number"
										maxLength={6}
										className="max-w-xs"
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
									/>
								}
							/>
							<FormMessage errors={field.state.meta.errors} />
						</FormItem>
					)}
				</form.Field>

				<div className="flex gap-x-2">
					<Button
						variant="outline"
						className="flex-1"
						nativeButton={false}
						render={
							<Link to="/auth/login">
								<ArrowLeftIcon />
								<Trans comment="Secondary navigation button on 2FA verification screen">返回登录</Trans>
							</Link>
						}
					/>

					<Button type="submit" className="flex-1">
						<CheckIcon />
						<Trans comment="Primary action button to submit 2FA code">验证</Trans>
					</Button>
				</div>
			</form>

			<Button
				variant="link"
				nativeButton={false}
				className="h-auto justify-self-center p-0 text-sm"
				render={
					<Link to="/auth/verify-2fa-backup">
						<Trans comment="Link to backup-code verification flow when authenticator app is unavailable">
							无法使用验证器？
						</Trans>
					</Link>
				}
			/>
		</>
	);
}
