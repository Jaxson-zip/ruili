import type { resumeTemplateStarters } from "@reactive-resume/schema/resume/starters";
import type { Template } from "@reactive-resume/schema/templates";
import type { DialogProps } from "../store";
import { t } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { MagicWandIcon, PencilSimpleLineIcon, PlusIcon } from "@phosphor-icons/react";
import { useStore } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import z from "zod";
import { Badge } from "@reactive-resume/ui/components/badge";
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
	InputGroupInput,
	InputGroupText,
} from "@reactive-resume/ui/components/input-group";
import { generateId, generateRandomName, slugify } from "@reactive-resume/utils/string";
import { ChipInput } from "@/components/input/chip-input";
import { usePatchResume } from "@/features/resume/builder/draft";
import { useFormBlocker } from "@/hooks/use-form-blocker";
import { authClient } from "@/libs/auth/client";
import { getResumeErrorMessage } from "@/libs/error-message";
import { orpc } from "@/libs/orpc/client";
import { useAppForm, withForm } from "@/libs/tanstack-form";
import { useDialogStore } from "../store";
import { getLaunchResumeTemplateStarters, getStarterPreviewImageUrl } from "./starter-preview";
import { primaryTemplateIds, templates } from "./template/data";
import { TemplateThumbnail } from "./template/thumbnail";
import { buildBlankTemplateImportInput, buildResumeStarterImportInput } from "./template-starter-import";

type CreateMode = "starter" | "template" | "blank";

const formSchema = z.object({
	id: z.string(),
	name: z.string().min(1).max(64),
	slug: z.string().min(1).max(64).transform(slugify),
	tags: z.array(z.string()),
});

type FormValues = z.infer<typeof formSchema>;

const defaultValues: FormValues = {
	id: "",
	name: "",
	slug: "",
	tags: [],
};

export function CreateResumeDialog(_: DialogProps<"resume.create">) {
	const { i18n } = useLingui();
	const navigate = useNavigate();
	const closeDialog = useDialogStore((state) => state.closeDialog);

	const { mutate: createResume, isPending } = useMutation(orpc.resume.create.mutationOptions());
	const { mutate: importStarter, isPending: isImportingStarter } = useMutation(orpc.resume.import.mutationOptions());
	const isBusy = isPending || isImportingStarter;

	const form = useAppForm({
		defaultValues: {
			id: generateId(),
			name: "",
			slug: "",
			tags: [] as string[],
		},
		validators: { onSubmit: formSchema },
		onSubmit: ({ value }) => {
			const toastId = toast.loading(t`正在创建简历...`);

			createResume(value, {
				onSuccess: (id) => {
					toast.success(t`简历已创建`, { id: toastId });
					closeDialog();
					void navigate({ to: "/builder/$resumeId", params: { resumeId: id } });
				},
				onError: (error) => {
					toast.error(getResumeErrorMessage(error), { id: toastId });
				},
			});
		},
	});

	const name = useStore(form.store, (s) => s.values.name);
	const [createMode, setCreateMode] = useState<CreateMode>("starter");
	const launchStarters = getLaunchResumeTemplateStarters();

	useEffect(() => {
		form.setFieldValue("slug", slugify(name));
	}, [form, name]);

	useFormBlocker(form);

	const onCreateFromStarter = (starter: (typeof resumeTemplateStarters)[number]) => {
		const input = buildResumeStarterImportInput(starter, form.state.values.name);

		const toastId = toast.loading(t`正在套用模板...`);

		importStarter(input, {
			onSuccess: (id) => {
				toast.success(t`模板简历已创建`, { id: toastId });
				closeDialog();
				void navigate({ to: "/builder/$resumeId", params: { resumeId: id } });
			},
			onError: (error) => {
				toast.error(getResumeErrorMessage(error), { id: toastId });
			},
		});
	};

	const onCreateFromTemplate = (template: Template) => {
		const input = buildBlankTemplateImportInput(template, templates[template], form.state.values.name);

		const toastId = toast.loading(t`正在创建模板简历...`);

		importStarter(input, {
			onSuccess: (id) => {
				toast.success(t`模板简历已创建`, { id: toastId });
				closeDialog();
				void navigate({ to: "/builder/$resumeId", params: { resumeId: id } });
			},
			onError: (error) => {
				toast.error(getResumeErrorMessage(error), { id: toastId });
			},
		});
	};

	return (
		<DialogContent className="lg:max-w-5xl">
			<DialogHeader>
				<DialogTitle className="flex items-center gap-x-2">
					<PlusIcon />
					<Trans>新建简历</Trans>
				</DialogTitle>
				<DialogDescription>
					<Trans>选择一份成品样张，或直接挑一套中文模板开始填写。</Trans>
				</DialogDescription>
			</DialogHeader>

			<form
				className="max-h-[78svh] space-y-5 overflow-y-auto pr-1"
				onSubmit={(event) => {
					event.preventDefault();
					event.stopPropagation();
					void form.handleSubmit();
				}}
			>
				<div className="grid grid-cols-1 gap-2 rounded-md border bg-secondary/20 p-1 sm:grid-cols-3">
					<CreateModeButton
						active={createMode === "starter"}
						description={`${launchStarters.length} 份完整内容`}
						label="成品样张"
						onClick={() => setCreateMode("starter")}
					/>
					<CreateModeButton
						active={createMode === "template"}
						description={`${primaryTemplateIds.length} 套可导出模板`}
						label="空白模板"
						onClick={() => setCreateMode("template")}
					/>
					<CreateModeButton
						active={createMode === "blank"}
						description="自定义名称和链接"
						label="空白简历"
						onClick={() => setCreateMode("blank")}
					/>
				</div>

				{createMode === "starter" ? (
					<section className="space-y-3">
						<div className="flex flex-col gap-1">
							<h3 className="font-semibold text-sm">
								<Trans>从成品样张开始</Trans>
								<span className="ms-2 text-muted-foreground">({launchStarters.length} 套)</span>
							</h3>
							<p className="text-muted-foreground text-sm">
								<Trans>样张已经填好中文内容，适合先看完整效果，再替换成自己的经历。</Trans>
							</p>
						</div>

						<div className="grid max-h-[58svh] grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
							{launchStarters.map((starter) => (
								<button
									key={starter.id}
									type="button"
									data-starter-id={starter.id}
									disabled={isBusy}
									className="group overflow-hidden rounded-md border bg-background text-left transition-colors hover:border-foreground/30 disabled:cursor-not-allowed disabled:opacity-60"
									onClick={() => onCreateFromStarter(starter)}
								>
									<div className="aspect-page overflow-hidden border-b bg-white">
										<TemplateThumbnail
											template={starter.template}
											label={starter.name}
											imageUrl={getStarterPreviewImageUrl(starter)}
										/>
									</div>

									<div className="space-y-2 p-3">
										<div className="flex items-start justify-between gap-2">
											<h4 className="line-clamp-1 font-semibold text-sm">{starter.name}</h4>
											<Badge variant="secondary" className="shrink-0 text-[11px]">
												PDF
											</Badge>
										</div>
										<p className="line-clamp-2 min-h-9 text-muted-foreground text-xs leading-relaxed">
											{starter.description}
										</p>
										<div className="flex min-h-6 flex-wrap gap-1">
											{starter.tags.slice(0, 3).map((tag) => (
												<Badge key={tag} variant="secondary" className="text-[11px]">
													{tag}
												</Badge>
											))}
										</div>
									</div>
								</button>
							))}
						</div>
					</section>
				) : null}

				{createMode === "template" ? (
					<section className="space-y-3">
						<div className="flex flex-col gap-1">
							<h3 className="font-semibold text-sm">
								<Trans>从空白模板开始</Trans>
								<span className="ms-2 text-muted-foreground">({primaryTemplateIds.length} 套)</span>
							</h3>
							<p className="text-muted-foreground text-sm">
								<Trans>先选版式，再进入编辑器填写内容；适合已经有简历内容的人。</Trans>
							</p>
						</div>

						<div className="grid max-h-[58svh] grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-4">
							{primaryTemplateIds.map((template) => {
								const metadata = templates[template];

								return (
									<button
										key={template}
										type="button"
										disabled={isBusy}
										className="group overflow-hidden rounded-md border bg-background text-left transition-colors hover:border-foreground/30 disabled:cursor-not-allowed disabled:opacity-60"
										onClick={() => onCreateFromTemplate(template)}
									>
										<div className="aspect-page overflow-hidden border-b bg-white">
											<TemplateThumbnail template={template} label={metadata.name} imageUrl={metadata.imageUrl} />
										</div>

										<div className="space-y-2 p-3">
											<div className="flex items-start justify-between gap-2">
												<h4 className="line-clamp-1 font-semibold text-sm">{metadata.name}</h4>
												<Badge variant="secondary" className="shrink-0 text-[11px]">
													PDF
												</Badge>
											</div>
											<p className="line-clamp-2 min-h-10 text-muted-foreground text-xs leading-relaxed">
												{i18n.t(metadata.description)}
											</p>
											<div className="flex flex-wrap gap-1">
												{metadata.tags.slice(0, 3).map((tag) => (
													<Badge key={tag} variant="secondary" className="text-[11px]">
														{tag}
													</Badge>
												))}
											</div>
											<div className="pt-1 font-medium text-primary text-xs group-hover:underline">
												<Trans>创建空白简历</Trans>
											</div>
										</div>
									</button>
								);
							})}
						</div>
					</section>
				) : null}

				{createMode === "blank" ? (
					<section className="space-y-4 rounded-md border bg-secondary/20 p-4">
						<div className="flex flex-col gap-1">
							<h3 className="font-semibold text-sm">
								<Trans>从空白简历开始</Trans>
							</h3>
							<p className="text-muted-foreground text-sm">
								<Trans>输入名称后创建空白版本，后续仍可添加组件、切换模板和调整排版。</Trans>
							</p>
						</div>

						<ResumeForm form={form} />
					</section>
				) : null}

				{createMode === "blank" ? (
					<DialogFooter>
						<Button type="submit" disabled={isBusy}>
							<Trans>创建空白简历</Trans>
						</Button>
					</DialogFooter>
				) : null}
			</form>
		</DialogContent>
	);
}

type CreateModeButtonProps = {
	active: boolean;
	description: string;
	label: string;
	onClick: () => void;
};

function CreateModeButton({ active, description, label, onClick }: CreateModeButtonProps) {
	return (
		<Button
			type="button"
			variant={active ? "secondary" : "ghost"}
			className="h-auto justify-start px-3 py-2 text-left"
			onClick={onClick}
		>
			<span className="flex flex-col items-start gap-0.5">
				<span className="font-medium text-sm">{label}</span>
				<span className="text-muted-foreground text-xs">{description}</span>
			</span>
		</Button>
	);
}

export function UpdateResumeDialog({ data }: DialogProps<"resume.update">) {
	const closeDialog = useDialogStore((state) => state.closeDialog);
	const patchResume = usePatchResume();
	const params = useParams({ strict: false }) as { resumeId?: string };

	const { mutate: updateResume, isPending } = useMutation(orpc.resume.update.mutationOptions());

	const form = useAppForm({
		defaultValues: {
			id: data.id,
			name: data.name,
			slug: data.slug,
			tags: data.tags,
		},
		validators: { onSubmit: formSchema },
		onSubmit: ({ value }) => {
			const toastId = toast.loading(t`正在更新简历...`);

			updateResume(value, {
				onSuccess: (updated) => {
					if (params.resumeId === updated.id) {
						patchResume((draft) => {
							draft.name = updated.name;
							draft.slug = updated.slug;
							draft.tags = updated.tags;
							draft.isLocked = updated.isLocked;
							draft.isPublic = updated.isPublic;
							draft.hasPassword = updated.hasPassword;
						});
					}

					toast.success(t`简历已更新`, { id: toastId });
					closeDialog();
				},
				onError: (error) => {
					toast.error(getResumeErrorMessage(error), { id: toastId });
				},
			});
		},
	});

	const name = useStore(form.store, (s) => s.values.name);

	useEffect(() => {
		if (!name) return;
		form.setFieldValue("slug", slugify(name));
	}, [form, name]);

	useFormBlocker(form);

	return (
		<DialogContent>
			<DialogHeader>
				<DialogTitle className="flex items-center gap-x-2">
					<PencilSimpleLineIcon />
					<Trans>编辑简历</Trans>
				</DialogTitle>
				<DialogDescription>
					<Trans>给这份简历换一个更清楚的名称，方便区分不同投递版本。</Trans>
				</DialogDescription>
			</DialogHeader>

			<form
				className="space-y-4"
				onSubmit={(event) => {
					event.preventDefault();
					event.stopPropagation();
					void form.handleSubmit();
				}}
			>
				<ResumeForm form={form} />

				<DialogFooter>
					<Button type="submit" disabled={isPending}>
						<Trans>保存修改</Trans>
					</Button>
				</DialogFooter>
			</form>
		</DialogContent>
	);
}

export function DuplicateResumeDialog({ data }: DialogProps<"resume.duplicate">) {
	const navigate = useNavigate();
	const closeDialog = useDialogStore((state) => state.closeDialog);

	const { mutate: duplicateResume, isPending } = useMutation(orpc.resume.duplicate.mutationOptions());

	const form = useAppForm({
		defaultValues: {
			id: data.id,
			name: `${data.name} 副本`,
			slug: `${data.slug}-copy`,
			tags: data.tags,
		},
		validators: { onSubmit: formSchema },
		onSubmit: ({ value }) => {
			const toastId = toast.loading(t`正在复制简历...`);

			duplicateResume(value, {
				onSuccess: async (id) => {
					toast.success(t`简历已复制`, { id: toastId });
					closeDialog();

					if (!data.shouldRedirect) return;
					void navigate({ to: "/builder/$resumeId", params: { resumeId: id } });
				},
				onError: (error) => {
					toast.error(getResumeErrorMessage(error), { id: toastId });
				},
			});
		},
	});

	const name = useStore(form.store, (s) => s.values.name);

	useEffect(() => {
		if (!name) return;
		form.setFieldValue("slug", slugify(name));
	}, [form, name]);

	useFormBlocker(form);

	return (
		<DialogContent>
			<DialogHeader>
				<DialogTitle className="flex items-center gap-x-2">
					<PencilSimpleLineIcon />
					<Trans>复制简历</Trans>
				</DialogTitle>
				<DialogDescription>
					<Trans>复制当前简历，创建一份内容相同的新版本。</Trans>
				</DialogDescription>
			</DialogHeader>

			<form
				className="space-y-4"
				onSubmit={(event) => {
					event.preventDefault();
					event.stopPropagation();
					void form.handleSubmit();
				}}
			>
				<ResumeForm form={form} />

				<DialogFooter>
					<Button type="submit" disabled={isPending}>
						<Trans>复制</Trans>
					</Button>
				</DialogFooter>
			</form>
		</DialogContent>
	);
}

const ResumeForm = withForm({
	defaultValues,
	render: function ResumeFormRenderer({ form }) {
		const { data: session } = authClient.useSession();

		const slugPrefix = `${window.location.origin}/${session?.user.username ?? ""}/`;

		const onGenerateName = () => {
			form.setFieldValue("name", generateRandomName());
		};

		return (
			<>
				<form.Field name="name">
					{(field) => (
						<FormItem hasError={field.state.meta.isTouched && field.state.meta.errors.length > 0}>
							<FormLabel>
								<Trans>简历名称</Trans>
							</FormLabel>
							<div className="flex items-center gap-x-2">
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

								<Button size="icon" variant="outline" title={t`生成随机名称`} onClick={onGenerateName}>
									<MagicWandIcon />
								</Button>
							</div>
							<FormMessage errors={field.state.meta.errors} />
							<FormDescription>
								<Trans>建议按岗位或用途命名，后面管理多个投递版本会更清楚。</Trans>
							</FormDescription>
						</FormItem>
					)}
				</form.Field>

				<form.Field name="slug">
					{(field) => (
						<FormItem hasError={field.state.meta.isTouched && field.state.meta.errors.length > 0}>
							<FormLabel>
								<Trans>公开链接</Trans>
							</FormLabel>
							<FormControl
								render={
									<InputGroup>
										<InputGroupAddon align="inline-start" className="hidden sm:flex">
											<InputGroupText>{slugPrefix}</InputGroupText>
										</InputGroupAddon>
										<InputGroupInput
											min={1}
											max={64}
											className="ps-0!"
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) => field.handleChange(event.target.value)}
										/>
									</InputGroup>
								}
							/>
							<FormMessage errors={field.state.meta.errors} />
							<FormDescription>
								<Trans>这是简历公开访问地址的一部分，可以用拼音或英文。</Trans>
							</FormDescription>
						</FormItem>
					)}
				</form.Field>

				<form.Field name="tags">
					{(field) => (
						<FormItem hasError={field.state.meta.isTouched && field.state.meta.errors.length > 0}>
							<FormLabel>
								<Trans>标签</Trans>
							</FormLabel>
							<FormControl
								render={
									<ChipInput
										value={field.state.value}
										onChange={(value) => {
											field.handleChange(value);
										}}
									/>
								}
							/>
							<FormMessage errors={field.state.meta.errors} />
							<FormDescription>
								<Trans>可以用“校招”“前端”“产品”等标签区分不同版本。</Trans>
							</FormDescription>
						</FormItem>
					)}
				</form.Field>
			</>
		);
	},
});
