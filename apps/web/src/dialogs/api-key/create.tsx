import type { DialogProps } from "../store";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { CopyIcon, PlusIcon } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useCopyToClipboard } from "usehooks-ts";
import z from "zod";
import { Button } from "@reactive-resume/ui/components/button";
import {
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@reactive-resume/ui/components/dialog";
import { FormControl, FormDescription, FormItem, FormLabel, FormMessage } from "@reactive-resume/ui/components/form";
import { Input } from "@reactive-resume/ui/components/input";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "@reactive-resume/ui/components/input-group";
import { Combobox } from "@/components/ui/combobox";
import { useFormBlocker } from "@/hooks/use-form-blocker";
import { authClient } from "@/libs/auth/client";
import { getReadableErrorMessage } from "@/libs/error-message";
import { useAppForm } from "@/libs/tanstack-form";
import { useDialogStore } from "../store";

const formSchema = z.object({
	name: z.string().min(1).max(64),
	expiresIn: z.number().min(1),
});

export function CreateApiKeyDialog(_: DialogProps<"api-key.create">) {
	const [apiKey, setApiKey] = useState<string | null>(null);

	if (apiKey) return <CopyApiKeyForm apiKey={apiKey} />;

	return <CreateApiKeyForm setApiKey={setApiKey} />;
}

type CreateApiKeyFormProps = {
	setApiKey: (apiKey: string) => void;
};

const CreateApiKeyForm = ({ setApiKey }: CreateApiKeyFormProps) => {
	const form = useAppForm({
		defaultValues: {
			name: "",
			expiresIn: 3600 * 24 * 30,
		},
		validators: { onSubmit: formSchema },
		onSubmit: async ({ value }) => {
			const toastId = toast.loading(t`正在创建 API 密钥...`);

			const { data, error } = await authClient.apiKey.create({
				name: value.name,
				expiresIn: value.expiresIn,
			});

			if (error) {
				toast.error(
					getReadableErrorMessage(
						error,
						t({
							comment: "Fallback toast when creating an API key fails",
							message: "API 密钥创建失败，请稍后重试。",
						}),
					),
					{ id: toastId },
				);
				return;
			}

			setApiKey(data.key);
			toast.dismiss(toastId);
		},
	});

	useFormBlocker(form);

	return (
		<DialogContent>
			<DialogHeader>
				<DialogTitle className="flex items-center gap-x-2">
					<PlusIcon />
					<Trans>创建新的 API 密钥</Trans>
				</DialogTitle>
				<DialogDescription>
					<Trans>这会生成一个新的 API key，用于访问锐历 API，让程序可以读取或操作你的简历数据。</Trans>
				</DialogDescription>
			</DialogHeader>

			<form
				className="space-y-6 py-2"
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
								<Trans>名称</Trans>
							</FormLabel>
							<FormControl
								render={
									<Input
										min={1}
										max={64}
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
									/>
								}
							/>
							<FormMessage errors={field.state.meta.errors} />
							<FormDescription>
								<Trans>建议按用途给 API 密钥命名，后续更容易识别。</Trans>
							</FormDescription>
						</FormItem>
					)}
				</form.Field>

				<form.Field name="expiresIn">
					{(field) => (
						<FormItem hasError={field.state.meta.isTouched && field.state.meta.errors.length > 0}>
							<FormLabel>
								<Trans>有效期</Trans>
							</FormLabel>
							<FormControl
								render={
									<Combobox
										value={field.state.value}
										onValueChange={(value) => value && field.handleChange(Number(value))}
										options={[
											{
												// 1 month = 30 days
												value: 3600 * 24 * 30,
												label: t`1 个月`,
											},
											{
												// 3 months = 90 days
												value: 3600 * 24 * 90,
												label: t`3 个月`,
											},
											{
												// 6 months = 180 days
												value: 3600 * 24 * 180,
												label: t`6 个月`,
											},
											{
												// 1 year = 365 days
												value: 3600 * 24 * 365,
												label: t`1 年`,
											},
										]}
									/>
								}
							/>
							<FormMessage errors={field.state.meta.errors} />
						</FormItem>
					)}
				</form.Field>

				<DialogFooter>
					<Button type="submit">
						<Trans comment="Create API key dialog submit action">创建</Trans>
					</Button>
				</DialogFooter>
			</form>
		</DialogContent>
	);
};

type CopyApiKeyFormProps = {
	apiKey: string;
};

const CopyApiKeyForm = ({ apiKey }: CopyApiKeyFormProps) => {
	const queryClient = useQueryClient();
	const [_, copyToClipboard] = useCopyToClipboard();
	const closeDialog = useDialogStore((state) => state.closeDialog);

	const onCopy = async () => {
		await copyToClipboard(apiKey);
		toast.success(t`API 密钥已复制到剪贴板。`);
	};

	const onConfirm = () => {
		closeDialog();
		void queryClient.invalidateQueries({ queryKey: ["auth", "api-keys"] });
	};

	return (
		<DialogContent>
			<DialogHeader>
				<DialogTitle className="flex items-center gap-x-2">
					<CopyIcon />
					<Trans>这是你的新 API 密钥</Trans>
				</DialogTitle>
				<DialogDescription>
					<Trans>复制这段密钥，在你的应用中用它访问简历数据。</Trans>
				</DialogDescription>
			</DialogHeader>

			<div className="space-y-2 py-2">
				<InputGroup>
					<InputGroupInput value={apiKey} readOnly />
					<InputGroupAddon align="inline-end">
						<InputGroupButton size="icon-sm" onClick={onCopy}>
							<CopyIcon />
						</InputGroupButton>
					</InputGroupAddon>
				</InputGroup>

				<span className="font-medium text-muted-foreground text-sm">
					<Trans>出于安全原因，这段密钥只会显示一次。</Trans>
				</span>
			</div>

			<DialogFooter>
				<Button onClick={onConfirm}>
					<Trans comment="Create API key dialog acknowledgment action after copying">确认</Trans>
				</Button>
			</DialogFooter>
		</DialogContent>
	);
};
