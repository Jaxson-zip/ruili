import type { AuthSession } from "@reactive-resume/auth/types";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { CheckIcon, WarningIcon } from "@phosphor-icons/react";
import { useStore } from "@tanstack/react-form";
import { useRouter } from "@tanstack/react-router";
import { AnimatePresence, m } from "motion/react";
import { toast } from "sonner";
import z from "zod";
import { Button } from "@reactive-resume/ui/components/button";
import { FormControl, FormItem, FormLabel, FormMessage } from "@reactive-resume/ui/components/form";
import { Input } from "@reactive-resume/ui/components/input";
import { authClient } from "@/libs/auth/client";
import { getReadableErrorMessage } from "@/libs/error-message";
import { useAppForm } from "@/libs/tanstack-form";

const formSchema = z.object({
	name: z.string().trim().min(1).max(64),
	username: z
		.string()
		.trim()
		.min(1)
		.max(64)
		.regex(/^[a-z0-9._-]+$/, {
			message: "用户名只能包含小写字母、数字、点、连字符和下划线。",
		}),
	email: z.email().trim(),
});

type Props = {
	session: AuthSession;
};

export function ProfileSettingsPage({ session }: Props) {
	const router = useRouter();

	const form = useAppForm({
		defaultValues: {
			name: session.user.name,
			username: session.user.username,
			email: session.user.email,
		},
		validators: { onSubmit: formSchema },
		onSubmit: async ({ value }) => {
			const { error } = await authClient.updateUser({
				name: value.name,
				username: value.username,
				displayUsername: value.username,
			});

			if (error) {
				toast.error(
					getReadableErrorMessage(
						error,
						t({
							comment: "Fallback toast when updating profile details fails",
							message: "更新个人资料失败，请重试。",
						}),
					),
				);
				return;
			}

			toast.success(t`个人资料已更新。`);
			form.reset({ name: value.name, username: value.username, email: session.user.email });
			void router.invalidate();

			if (value.email !== session.user.email) {
				const { error } = await authClient.changeEmail({
					newEmail: value.email,
					callbackURL: "/dashboard/settings/profile",
				});

				if (error) {
					toast.error(
						getReadableErrorMessage(
							error,
							t({
								comment: "Fallback toast when requesting email change confirmation fails",
								message: "请求修改邮箱失败，请重试。",
							}),
						),
					);
					return;
				}

				toast.success(t`确认链接已发送到你当前的邮箱，请打开收件箱完成确认。`);
				form.reset({ name: value.name, username: value.username, email: session.user.email });
				void router.invalidate();
			}
		},
	});

	const onCancel = () => {
		form.reset();
	};

	const isDirty = useStore(form.store, (s) => s.isDirty);

	const handleResendVerificationEmail = async () => {
		const toastId = toast.loading(t`正在重新发送验证邮件...`);

		const { error } = await authClient.sendVerificationEmail({
			email: session.user.email,
			callbackURL: "/dashboard/settings/profile",
		});

		if (error) {
			toast.error(
				getReadableErrorMessage(
					error,
					t({
						comment: "Fallback toast when resending account verification email fails",
						message: "重新发送验证邮件失败，请重试。",
					}),
				),
				{ id: toastId },
			);
			return;
		}

		toast.success(t`新的验证链接已发送到你的邮箱，请打开收件箱验证账号。`, { id: toastId });
		void router.invalidate();
	};

	return (
		<m.form
			initial={{ opacity: 0, y: -20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.25, ease: "easeOut" }}
			className="grid max-w-xl gap-6 will-change-[transform,opacity]"
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
							<Trans>姓名</Trans>
						</FormLabel>
						<FormControl
							render={
								<Input
									min={3}
									max={64}
									autoComplete="name"
									placeholder={t({
										comment: "Example full name placeholder on profile settings form",
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
							<Trans>用户名</Trans>
						</FormLabel>
						<FormControl
							render={
								<Input
									min={3}
									max={64}
									autoComplete="username"
									placeholder={t({
										comment: "Example username placeholder on profile settings form",
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
							<Trans>邮箱地址</Trans>
						</FormLabel>
						<FormControl
							render={
								<Input
									type="email"
									autoComplete="email"
									placeholder={t({
										comment: "Example email placeholder on profile settings form",
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
						{session.user.emailVerified === true ? (
							<p className="flex items-center gap-x-1.5 text-green-700 text-xs">
								<CheckIcon />
								<Trans>已验证</Trans>
							</p>
						) : (
							<p className="flex items-center gap-x-1.5 text-amber-600 text-xs">
								<WarningIcon className="size-3.5" />
								<Trans>未验证</Trans>
								<span>|</span>
								<Button
									variant="link"
									className="h-auto gap-x-1.5 p-0! text-inherit text-xs"
									onClick={handleResendVerificationEmail}
								>
									<Trans>重新发送验证邮件</Trans>
								</Button>
							</p>
						)}
					</FormItem>
				)}
			</form.Field>

			<AnimatePresence initial={false} mode="popLayout">
				{isDirty && (
					<m.div
						initial={{ opacity: 0, y: -8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -8 }}
						transition={{ duration: 0.16, ease: "easeOut" }}
						className="flex items-center gap-x-4 justify-self-end will-change-[transform,opacity]"
					>
						<Button type="reset" variant="ghost" onClick={onCancel}>
							<Trans comment="Profile settings form action to discard unsaved edits">取消</Trans>
						</Button>

						<Button type="submit">
							<Trans>保存修改</Trans>
						</Button>
					</m.div>
				)}
			</AnimatePresence>
		</m.form>
	);
}
