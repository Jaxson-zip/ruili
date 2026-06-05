import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { ArrowRightIcon, EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useToggle } from "usehooks-ts";
import z from "zod";
import { Alert, AlertDescription, AlertTitle } from "@reactive-resume/ui/components/alert";
import { Button } from "@reactive-resume/ui/components/button";
import { FormControl, FormItem, FormLabel, FormMessage } from "@reactive-resume/ui/components/form";
import { Input } from "@reactive-resume/ui/components/input";
import { authClient } from "@/libs/auth/client";
import { useAppForm } from "@/libs/tanstack-form";
import { SocialAuth } from "../components/social-auth";

const formSchema = z.object({
	name: z.string().min(3).max(64),
	username: z
		.string()
		.min(3)
		.max(64)
		.trim()
		.toLowerCase()
		.regex(/^[a-z0-9._-]+$/, {
			message: "用户名只能包含小写字母、数字、点、短横线和下划线。",
		}),
	email: z.email().toLowerCase(),
	password: z.string().min(6).max(64),
});

type Props = {
	disableEmailAuth: boolean;
};

export function RegisterPage({ disableEmailAuth }: Props) {
	const [submitted, setSubmitted] = useState(false);
	const [showPassword, toggleShowPassword] = useToggle(false);

	const form = useAppForm({
		defaultValues: { name: "", username: "", email: "", password: "" },
		validators: { onSubmit: formSchema },
		onSubmit: async ({ value }) => {
			const toastId = toast.loading(t`正在注册...`);

			const { error } = await authClient.signUp.email({
				name: value.name,
				email: value.email,
				password: value.password,
				username: value.username,
				displayUsername: value.username,
				callbackURL: "/dashboard",
			});

			if (error) {
				toast.error(
					error.message ||
						t({
							comment: "Fallback toast when account registration fails without a server error message",
							message: "账号创建失败，请稍后重试。",
						}),
					{ id: toastId },
				);
				return;
			}

			setSubmitted(true);
			toast.dismiss(toastId);
		},
	});

	if (submitted) return <PostSignupScreen />;

	return (
		<>
			<div className="space-y-1 text-center">
				<h1 className="font-semibold text-2xl tracking-tight">
					<Trans>创建新账号</Trans>
				</h1>

				<div className="text-muted-foreground">
					<Trans>
						已有账号？{" "}
						<Button
							variant="link"
							nativeButton={false}
							className="h-auto gap-1.5 px-1! py-0"
							render={
								<Link to="/auth/login">
									<Trans comment="Call-to-action link from registration page to login page">现在登录</Trans>{" "}
									<ArrowRightIcon />
								</Link>
							}
						/>
					</Trans>
				</div>
			</div>

			{!disableEmailAuth && (
				<form
					className="space-y-6"
					onSubmit={(event) => {
						event.preventDefault();
						event.stopPropagation();
						void form.handleSubmit();
					}}
				>
					<form.Field name="name">
						{(field) => (
							<FormItem hasError={field.state.meta.isTouched && field.state.meta.errors.length > 0}>
								<FormLabel>
									<Trans comment="Label for full name input on registration form">姓名</Trans>
								</FormLabel>
								<FormControl
									render={
										<Input
											min={3}
											max={64}
											autoComplete="section-register name"
											placeholder={t({
												comment: "Example full name placeholder on registration form",
												message: "张三",
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

					<form.Field name="username">
						{(field) => (
							<FormItem hasError={field.state.meta.isTouched && field.state.meta.errors.length > 0}>
								<FormLabel>
									<Trans comment="Label for username input on registration form">用户名</Trans>
								</FormLabel>
								<FormControl
									render={
										<Input
											min={3}
											max={64}
											autoComplete="section-register username"
											placeholder={t({
												comment: "Example username placeholder on registration form",
												message: "zhangsan",
											})}
											className="lowercase"
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

					<form.Field name="email">
						{(field) => (
							<FormItem hasError={field.state.meta.isTouched && field.state.meta.errors.length > 0}>
								<FormLabel>
									<Trans comment="Label for email input on registration form">邮箱地址</Trans>
								</FormLabel>
								<FormControl
									render={
										<Input
											type="email"
											autoComplete="section-register email"
											placeholder={t({
												comment: "Example email placeholder on registration form",
												message: "zhangsan@example.com",
											})}
											className="lowercase"
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

					<form.Field name="password">
						{(field) => (
							<FormItem hasError={field.state.meta.isTouched && field.state.meta.errors.length > 0}>
								<FormLabel>
									<Trans comment="Label for password input on registration form">密码</Trans>
								</FormLabel>
								<div className="flex items-center gap-x-1.5">
									<FormControl
										render={
											<Input
												min={6}
												max={64}
												type={showPassword ? "text" : "password"}
												autoComplete="section-register new-password"
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
														comment: "Accessible label for button that hides password in registration form",
														message: "隐藏密码",
													})
												: t({
														comment: "Accessible label for button that reveals password in registration form",
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
						<Trans comment="Primary action button label on registration form">注册</Trans>
					</Button>
				</form>
			)}

			<SocialAuth requestSignUp />
		</>
	);
}

function PostSignupScreen() {
	return (
		<>
			<div className="space-y-1 text-center">
				<h1 className="font-semibold text-2xl tracking-tight">
					<Trans>邮件已发送</Trans>
				</h1>
				<p className="text-muted-foreground">
					<Trans>请查收邮箱，点击链接完成账号验证。</Trans>
				</p>
			</div>

			<Alert>
				<AlertTitle>
					<Trans>这一步不是必须的，但建议完成。</Trans>
				</AlertTitle>
				<AlertDescription>
					<Trans>后续找回密码时需要先验证邮箱。</Trans>
				</AlertDescription>
			</Alert>

			<Button
				nativeButton={false}
				render={
					<Link to="/dashboard">
						<Trans comment="Button label to continue to dashboard after successful registration">继续</Trans>{" "}
						<ArrowRightIcon />
					</Link>
				}
			/>
		</>
	);
}
