import type { MessageDescriptor } from "@lingui/core";
import type { CustomSectionType } from "@reactive-resume/schema/resume/data";
import type z from "zod";
import type { DialogProps } from "@/dialogs/store";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { PencilSimpleLineIcon, PlusIcon } from "@phosphor-icons/react";
import { useStore } from "@tanstack/react-form";
import { customSectionSchema } from "@reactive-resume/schema/resume/data";
import { Button } from "@reactive-resume/ui/components/button";
import {
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@reactive-resume/ui/components/dialog";
import { FormControl, FormItem, FormLabel, FormMessage } from "@reactive-resume/ui/components/form";
import { Input } from "@reactive-resume/ui/components/input";
import { generateId } from "@reactive-resume/utils/string";
import { Combobox } from "@/components/ui/combobox";
import { useDialogStore } from "@/dialogs/store";
import { useUpdateResumeData } from "@/features/resume/builder/draft";
import { useFormBlocker } from "@/hooks/use-form-blocker";
import { useAppForm, withForm } from "@/libs/tanstack-form";

const formSchema = customSectionSchema;

type FormValues = z.infer<typeof formSchema>;

const defaultValues: FormValues = {
	id: "",
	title: "",
	type: "experience",
	columns: 1,
	hidden: false,
	items: [],
};

const SECTION_TYPE_OPTIONS: { value: CustomSectionType; label: MessageDescriptor }[] = [
	{ value: "summary", label: msg`个人总结` },
	{ value: "experience", label: msg`工作经历` },
	{ value: "education", label: msg`教育经历` },
	{ value: "projects", label: msg`项目经历` },
	{ value: "profiles", label: msg`个人链接` },
	{ value: "skills", label: msg`技能` },
	{ value: "languages", label: msg`语言能力` },
	{ value: "interests", label: msg`兴趣爱好` },
	{ value: "awards", label: msg`奖项荣誉` },
	{ value: "certifications", label: msg`证书认证` },
	{ value: "publications", label: msg`发表作品` },
	{ value: "volunteer", label: msg`志愿经历` },
	{ value: "references", label: msg`推荐人` },
	{ value: "cover-letter", label: msg`求职信` },
];

function isCustomSectionType(value: string | null | undefined): value is CustomSectionType {
	return SECTION_TYPE_OPTIONS.some((option) => option.value === value);
}

export function CreateCustomSectionDialog({ data }: DialogProps<"resume.sections.custom.create">) {
	const closeDialog = useDialogStore((state) => state.closeDialog);
	const updateResumeData = useUpdateResumeData();

	const form = useAppForm({
		defaultValues: {
			id: generateId(),
			title: data?.title ?? "",
			type: (data?.type ?? "experience") as CustomSectionType,
			columns: data?.columns ?? 1,
			hidden: data?.hidden ?? false,
			items: data?.items ?? [],
		},
		validators: { onSubmit: formSchema },
		onSubmit: async ({ value }) => {
			updateResumeData((draft) => {
				draft.customSections.push(value);
				const lastPageIndex = draft.metadata.layout.pages.length - 1;
				if (lastPageIndex < 0) return;
				draft.metadata.layout.pages[lastPageIndex].main.push(value.id);
			});
			closeDialog();
		},
	});

	const { requestClose } = useFormBlocker(form);
	const isSubmitting = useStore(form.store, (state) => state.isSubmitting);

	return (
		<DialogContent>
			<DialogHeader>
				<DialogTitle className="flex items-center gap-x-2">
					<PlusIcon />
					<Trans>新增自定义模块</Trans>
				</DialogTitle>
				<DialogDescription />
			</DialogHeader>

			<form
				className="grid gap-4 sm:grid-cols-2"
				onSubmit={(event) => {
					event.preventDefault();
					event.stopPropagation();
					void form.handleSubmit();
				}}
			>
				<CreateCustomSectionForm form={form} />

				<DialogFooter className="sm:col-span-full">
					<Button variant="ghost" onClick={requestClose}>
						<Trans>取消</Trans>
					</Button>

					<Button type="submit" disabled={isSubmitting}>
						<Trans>创建</Trans>
					</Button>
				</DialogFooter>
			</form>
		</DialogContent>
	);
}

export function UpdateCustomSectionDialog({ data }: DialogProps<"resume.sections.custom.update">) {
	const closeDialog = useDialogStore((state) => state.closeDialog);
	const updateResumeData = useUpdateResumeData();

	const form = useAppForm({
		defaultValues: data,
		validators: { onSubmit: formSchema },
		onSubmit: async ({ value }) => {
			updateResumeData((draft) => {
				const index = draft.customSections.findIndex((item) => item.id === value.id);
				if (index === -1) return;
				draft.customSections[index] = value;
			});
			closeDialog();
		},
	});

	const { requestClose } = useFormBlocker(form);
	const isSubmitting = useStore(form.store, (state) => state.isSubmitting);

	return (
		<DialogContent>
			<DialogHeader>
				<DialogTitle className="flex items-center gap-x-2">
					<PencilSimpleLineIcon />
					<Trans>编辑自定义模块</Trans>
				</DialogTitle>
				<DialogDescription />
			</DialogHeader>

			<form
				className="grid gap-4 sm:grid-cols-2"
				onSubmit={(event) => {
					event.preventDefault();
					event.stopPropagation();
					void form.handleSubmit();
				}}
			>
				<UpdateCustomSectionForm form={form} />

				<DialogFooter className="sm:col-span-full">
					<Button variant="ghost" onClick={requestClose}>
						<Trans>取消</Trans>
					</Button>

					<Button type="submit" disabled={isSubmitting}>
						<Trans>保存修改</Trans>
					</Button>
				</DialogFooter>
			</form>
		</DialogContent>
	);
}

const CreateCustomSectionForm = withForm({
	defaultValues,
	render: function CreateCustomSectionFormRenderer({ form }) {
		const { i18n } = useLingui();

		return (
			<>
				<form.Field name="title">
					{(field) => (
						<FormItem
							className="sm:col-span-full"
							hasError={field.state.meta.isTouched && field.state.meta.errors.length > 0}
						>
							<FormLabel>
								<Trans>标题</Trans>
							</FormLabel>
							<FormControl
								render={
									<Input
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

				<form.Field name="type">
					{(field) => (
						<FormItem
							className="sm:col-span-full"
							hasError={field.state.meta.isTouched && field.state.meta.errors.length > 0}
						>
							<FormLabel>
								<Trans>模块类型</Trans>
							</FormLabel>
							<FormControl
								render={
									<Combobox
										name={field.name}
										value={field.state.value}
										disabled={false}
										onValueChange={(v) => {
											if (isCustomSectionType(v)) field.handleChange(v);
										}}
										options={SECTION_TYPE_OPTIONS.map((option) => ({
											value: option.value,
											label: i18n.t(option.label),
										}))}
									/>
								}
							/>
							<FormMessage errors={field.state.meta.errors} />
						</FormItem>
					)}
				</form.Field>
			</>
		);
	},
});

const UpdateCustomSectionForm = withForm({
	defaultValues,
	render: function UpdateCustomSectionFormRenderer({ form }) {
		const { i18n } = useLingui();

		return (
			<>
				<form.Field name="title">
					{(field) => (
						<FormItem
							className="sm:col-span-full"
							hasError={field.state.meta.isTouched && field.state.meta.errors.length > 0}
						>
							<FormLabel>
								<Trans>标题</Trans>
							</FormLabel>
							<FormControl
								render={
									<Input
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

				<form.Field name="type">
					{(field) => (
						<FormItem
							className="sm:col-span-full"
							hasError={field.state.meta.isTouched && field.state.meta.errors.length > 0}
						>
							<FormLabel>
								<Trans>模块类型</Trans>
							</FormLabel>
							<FormControl
								render={
									<Combobox
										name={field.name}
										value={field.state.value}
										disabled
										onValueChange={(v) => {
											if (isCustomSectionType(v)) field.handleChange(v);
										}}
										options={SECTION_TYPE_OPTIONS.map((option) => ({
											value: option.value,
											label: i18n.t(option.label),
										}))}
									/>
								}
							/>
							<FormMessage errors={field.state.meta.errors} />
						</FormItem>
					)}
				</form.Field>
			</>
		);
	},
});
