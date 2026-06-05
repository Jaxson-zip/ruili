import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { ArrowRightIcon, EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useToggle } from "usehooks-ts";
import z from "zod";
import { Button } from "@reactive-resume/ui/components/button";
import { FormControl, FormDescription, FormItem, FormLabel, FormMessage } from "@reactive-resume/ui/components/form";
import { Input } from "@reactive-resume/ui/components/input";
import { authClient } from "@/libs/auth/client";
import { orpc } from "@/libs/orpc/client";
import { useAppForm } from "@/libs/tanstack-form";
import { SocialAuth } from "../components/social-auth";

const formSchema = z.object({
	identifier: z.string().trim().toLowerCase(),
	password: z.string().trim().min(6).max(64),
});

type Props = {
	disableEmailAuth: boolean;
	disableSignups: boolean;
};

export function LoginPage({ disableEmailAuth, disableSignups }: Props) {
	const router = useRouter();
	const navigate = useNavigate();

	const hasStartedConditionalPasskeyRef = useRef(false);
	const [showPassword, toggleShowPassword] = useToggle(false);

	const { data: providers = {} } = useQuery(orpc.auth.providers.list.queryOptions());

	const form = useAppForm({
		defaultValues: { identifier: "", password: "" },
		validators: { onSubmit: formSchema },
		onSubmit: async ({ value }) => {
			const toastId = toast.loading(t`正在登录...`);

			try {
				const isEmail = value.identifier.includes("@");

				const result = isEmail
					? await authClient.signIn.email({ email: value.identifier, password: value.password })
					: await authClient.signIn.username({ username: value.identifier, password: value.password });

				if (result.error) {
					toast.error(
						t({
							comment: "Fallback toast when sign-in fails",
							message: "登录失败，请检查账号或密码后重试。",
						}),
						{ id: toastId },
					);
					return;
				}

				const requiresTwoFactor =
					result.data &&
					typeof result.data === "object" &&
					"twoFactorRedirect" in result.data &&
					result.data.twoFactorRedirect;

				if (requiresTwoFactor) {
					toast.dismiss(toastId);
					void navigate({ to: "/auth/verify-2fa", replace: true });
					return;
				}

				toast.dismiss(toastId);
				await router.invalidate();
				void navigate({ to: "/dashboard", replace: true });
			} catch {
				toast.error(t`登录失败，请检查账号或密码后重试。`, { id: toastId });
			}
		},
	});

	useEffect(() => {
		if (!("passkey" in providers)) return;
		if (typeof window === "undefined") return;
		if (!("PublicKeyCredential" in window)) return;
		if (!PublicKeyCredential.isConditionalMediationAvailable) return;
		if (hasStartedConditionalPasskeyRef.current) return;

		hasStartedConditionalPasskeyRef.current = true;

		void PublicKeyCredential.isConditionalMediationAvailable().then(async (isAvailable) => {
			if (!isAvailable) return;

			const { error } = await authClient.signIn.passkey({ autoFill: true });
			if (error) return;

			await router.invalidate();
		});
	}, [providers, router]);

	return (
		<>
			<div className="space-y-1 text-center">
				<h1 className="font-semibold text-2xl tracking-tight">
					<Trans comment="Title on the login page">登录账号</Trans>
				</h1>

				{!disableSignups && (
					<div className="text-muted-foreground">
						<Trans>
							还没有账号？{" "}
							<Button
								variant="link"
								nativeButton={false}
								className="h-auto gap-1.5 px-1! py-0"
								render={
									<Link to="/auth/register">
										<Trans comment="Call-to-action link from login page to account registration page">立即创建</Trans>{" "}
										<ArrowRightIcon />
									</Link>
								}
							/>
						</Trans>
					</div>
				)}
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
					<form.Field name="identifier">
						{(field) => (
							<FormItem hasError={field.state.meta.isTouched && field.state.meta.errors.length > 0}>
								<FormLabel>
									<Trans comment="Label for login identifier input that accepts email or username">邮箱地址</Trans>
								</FormLabel>
								<FormControl
									render={
										<Input
											autoComplete="section-login username webauthn"
											placeholder={t({
												comment: "Example email placeholder for login identifier field",
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
								<FormDescription>
									<Trans>也可以使用用户名登录。</Trans>
								</FormDescription>
							</FormItem>
						)}
					</form.Field>

					<form.Field name="password">
						{(field) => (
							<FormItem hasError={field.state.meta.isTouched && field.state.meta.errors.length > 0}>
								<div className="flex items-center justify-between">
									<FormLabel>
										<Trans comment="Label for password input on login form">密码</Trans>
									</FormLabel>

									<Button
										tabIndex={-1}
										variant="link"
										nativeButton={false}
										className="h-auto p-0 text-xs leading-none"
										render={
											<Link to="/auth/forgot-password">
												<Trans comment="Link label to password reset page from login form">忘记密码？</Trans>
											</Link>
										}
									/>
								</div>
								<div className="flex items-center gap-x-1.5">
									<FormControl
										render={
											<Input
												min={6}
												max={64}
												type={showPassword ? "text" : "password"}
												autoComplete="section-login current-password"
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
														comment: "Accessible label for button that hides the password in login form",
														message: "隐藏密码",
													})
												: t({
														comment: "Accessible label for button that reveals the password in login form",
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
						<Trans comment="Primary action button label on login form">登录</Trans>
					</Button>
				</form>
			)}

			<SocialAuth />
		</>
	);
}
