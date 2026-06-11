import type { WordTemplate } from "@/features/resume/word-template/library";
import type { DialogProps } from "../store";
import { t } from "@lingui/core/macro";
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
import { getWordTemplateLibrary, setSelectedWordTemplateId } from "@/features/resume/word-template/library";
import { WordTemplateLiveThumbnail } from "@/features/resume/word-template/thumbnail";
import { useFormBlocker } from "@/hooks/use-form-blocker";
import { authClient } from "@/libs/auth/client";
import { getResumeErrorMessage } from "@/libs/error-message";
import { orpc } from "@/libs/orpc/client";
import { useAppForm, withForm } from "@/libs/tanstack-form";
import { useDialogStore } from "../store";
import { buildWordTemplateImportInput } from "./template-starter-import";

type CreateMode = "word" | "blank";

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
	const [createMode, setCreateMode] = useState<CreateMode>("word");
	const wordTemplates = getWordTemplateLibrary();

	useEffect(() => {
		form.setFieldValue("slug", slugify(name));
	}, [form, name]);

	useFormBlocker(form);

	const onCreateFromWordTemplate = (template: WordTemplate) => {
		const requestedName = form.state.values.name.trim() || `${template.name} 简历`;
		const input = buildWordTemplateImportInput(requestedName, template.id);

		const toastId = toast.loading(t`正在创建 Word 模板简历...`);

		importStarter(input, {
			onSuccess: (id) => {
				setSelectedWordTemplateId(id, template.id);
				toast.success(t`Word 模板简历已创建`, { id: toastId });
				closeDialog();
				void navigate({ to: "/builder/$resumeId", params: { resumeId: id } });
			},
			onError: (error) => {
				toast.error(getResumeErrorMessage(error), { id: toastId });
			},
		});
	};

	const getTemplateModuleSummary = (template: WordTemplate) => {
		const visibleModules = template.modules.slice(0, 4).join("、");
		const suffix = template.modules.length > 4 ? `等 ${template.modules.length} 个模块` : "";
		return suffix ? `${visibleModules}${suffix}` : visibleModules;
	};

	return (
		<DialogContent className="lg:max-w-5xl">
			<DialogHeader>
				<DialogTitle className="flex items-center gap-x-2">
					<PlusIcon />
					<Trans>新建简历</Trans>
				</DialogTitle>
				<DialogDescription>
					<Trans>从内置 DOCX 模板或空白简历开始。模板简历会保留 Word 版式并填入结构化内容。</Trans>
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
				<div className="grid grid-cols-1 gap-2 rounded-md border bg-secondary/20 p-1 sm:grid-cols-2">
					<CreateModeButton
						active={createMode === "word"}
						description={wordTemplates.length > 0 ? `${wordTemplates.length} 套内置 DOCX` : "模板待添加"}
						label="Word 模板库"
						onClick={() => setCreateMode("word")}
					/>
					<CreateModeButton
						active={createMode === "blank"}
						description="自定义名称和链接"
						label="空白简历"
						onClick={() => setCreateMode("blank")}
					/>
				</div>

				{createMode === "word" ? (
					<section className="space-y-3">
						<div className="flex flex-col gap-1">
							<h3 className="font-semibold text-sm">
								<Trans>从 Word 模板库开始</Trans>
								<span className="ms-2 text-muted-foreground">({wordTemplates.length} 套)</span>
							</h3>
							<p className="text-muted-foreground text-sm">
								<Trans>
									这里展示可直接套用的内置 DOCX 模板。示例内容仅用于预览，创建后可以继续编辑结构化内容，并按模板版式导出
									Word。
								</Trans>
							</p>
						</div>

						{wordTemplates.length === 0 ? (
							<EmptyTemplateState />
						) : (
							<div className="grid max-h-[58svh] grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
								{wordTemplates.map((template) => (
									<button
										key={template.id}
										type="button"
										data-word-template-id={template.id}
										disabled={isBusy}
										className="group overflow-hidden rounded-md border bg-background text-left transition-colors hover:border-foreground/30 disabled:cursor-not-allowed disabled:opacity-60"
										onClick={() => onCreateFromWordTemplate(template)}
									>
										<WordTemplateLiveThumbnail
											className="rounded-none border-0 border-b"
											data={buildWordTemplateImportInput(undefined, template.id).data}
											name={template.name}
											scale={0.25}
											template={template}
										/>

										<div className="space-y-2 p-3">
											<div className="flex items-start justify-between gap-2">
												<h4 className="line-clamp-1 font-semibold text-sm">{template.name}</h4>
												<Badge variant="secondary" className="shrink-0 text-[11px]">
													DOCX
												</Badge>
											</div>
											<p className="line-clamp-2 min-h-9 text-muted-foreground text-xs leading-relaxed">
												{template.description}
											</p>
											<p className="line-clamp-1 text-[11px] text-muted-foreground">
												包含：{getTemplateModuleSummary(template)}
											</p>
											<div className="flex min-h-6 flex-wrap gap-1">
												{template.tags.slice(0, 3).map((tag) => (
													<Badge key={tag} variant="secondary" className="text-[11px]">
														{tag}
													</Badge>
												))}
											</div>
										</div>
									</button>
								))}
							</div>
						)}
					</section>
				) : null}

				{createMode === "blank" ? (
					<section className="space-y-4 rounded-md border bg-secondary/20 p-4">
						<div className="flex flex-col gap-1">
							<h3 className="font-semibold text-sm">
								<Trans>从空白简历开始</Trans>
							</h3>
							<p className="text-muted-foreground text-sm">
								<Trans>输入名称后创建空白版本，后续仍可添加内容、切换模板和调整排版。</Trans>
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

function EmptyTemplateState() {
	return (
		<div className="rounded-md border border-dashed bg-secondary/20 px-4 py-10 text-center">
			<h4 className="font-semibold text-sm">模板库暂时为空</h4>
			<p className="mx-auto mt-2 max-w-md text-muted-foreground text-sm">确认后的 Word 模板会逐个加入这里。</p>
		</div>
	);
}

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
					<Trans>给这份简历换一个更清晰的名称，方便区分不同投递版本。</Trans>
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
								<Trans>这是简历公开访问地址的一部分，可以使用拼音或英文。</Trans>
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
