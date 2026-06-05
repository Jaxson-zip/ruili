import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";
import { Button } from "@reactive-resume/ui/components/button";
import { FormControl, FormItem, FormLabel, FormMessage } from "@reactive-resume/ui/components/form";
import { Input } from "@reactive-resume/ui/components/input";
import { authClient } from "@/libs/auth/client";
import { useAppForm } from "@/libs/tanstack-form";

const formSchema = z.object({
	email: z.email(),
});

export function ForgotPasswordPage() {
	const [submitted, setSubmitted] = useState(false);

	const form = useAppForm({
		defaultValues: { email: "" },
		validators: { onSubmit: formSchema },
		onSubmit: async ({ value }) => {
			const toastId = toast.loading(t`正在发送密码重置邮件...`);

			const { error } = await authClient.requestPasswordReset({
				email: value.email,
				redirectTo: "/auth/reset-password",
			});

			if (error) {
				toast.error(
					t({
						comment: "Fallback toast when requesting password reset email fails",
						message: "密码重置邮件发送失败，请稍后重试。",
					}),
					{ id: toastId },
				);
				return;
			}

			setSubmitted(true);
			toast.dismiss(toastId);
		},
	});

	if (submitted) return <PostForgotPasswordScreen />;

	return (
		<>
			<div className="space-y-1 text-center">
				<h1 className="font-semibold text-2xl tracking-tight">
					<Trans>忘记密码？</Trans>
				</h1>

				<div className="text-muted-foreground">
					<Trans>
						想起密码了？{" "}
						<Button
							variant="link"
							className="h-auto gap-1.5 px-1! py-0"
							nativeButton={false}
							render={
								<Link to="/auth/login">
									<Trans comment="Call-to-action link from forgot-password page to login page">现在登录</Trans>{" "}
									<ArrowRightIcon />
								</Link>
							}
						/>
					</Trans>
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
				<form.Field name="email">
					{(field) => (
						<FormItem hasError={field.state.meta.isTouched && field.state.meta.errors.length > 0}>
							<FormLabel>
								<Trans comment="Label for email input on forgot-password form">邮箱地址</Trans>
							</FormLabel>
							<FormControl
								render={
									<Input
										type="email"
										autoComplete="email"
										placeholder={t({
											comment: "Example email placeholder on forgot-password form",
											message: "zhangsan@example.com",
										})}
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

				<Button type="submit" className="w-full">
					<Trans comment="Primary action button label on forgot-password form">发送密码重置邮件</Trans>
				</Button>
			</form>
		</>
	);
}

function PostForgotPasswordScreen() {
	return (
		<>
			<div className="space-y-1 text-center">
				<h1 className="font-semibold text-2xl tracking-tight">
					<Trans>邮件已发送</Trans>
				</h1>
				<p className="text-muted-foreground">
					<Trans>请查收邮箱，点击链接重置密码。</Trans>
				</p>
			</div>

			<Button
				nativeButton={false}
				render={
					<a href="mailto:">
						<Trans comment="Button label to open the user's default email app">打开邮箱客户端</Trans>
					</a>
				}
			/>
		</>
	);
}
