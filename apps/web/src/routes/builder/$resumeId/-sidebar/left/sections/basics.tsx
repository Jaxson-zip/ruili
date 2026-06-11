import type z from "zod";
import { Trans } from "@lingui/react/macro";
import { basicsSchema } from "@reactive-resume/schema/resume/data";
import { FormControl, FormItem, FormLabel, FormMessage } from "@reactive-resume/ui/components/form";
import { Input } from "@reactive-resume/ui/components/input";
import { URLInput } from "@/components/input/url-input";
import { useCurrentResume, useUpdateResumeData } from "@/features/resume/builder/draft";
import { getSelectedWordTemplate } from "@/features/resume/word-template/library";
import { useSyncFormValues } from "@/hooks/use-sync-form-values";
import { useAppForm } from "@/libs/tanstack-form";
import { SectionBase } from "../shared/section-base";
import { CustomFieldsSection } from "./custom-fields";

export function BasicsSectionBuilder() {
	return (
		<SectionBase type="basics">
			<BasicsSectionForm />
		</SectionBase>
	);
}

const formSchema = basicsSchema;

type FormValues = z.infer<typeof formSchema>;

function BasicsSectionForm() {
	const resume = useCurrentResume();
	const basics = resume.data.basics;
	const updateResumeData = useUpdateResumeData();
	const selectedWordTemplate = getSelectedWordTemplate(resume.id, resume.data);
	const isWordTemplateResume = Boolean(selectedWordTemplate);
	const shouldShowWebsiteField = !isWordTemplateResume || selectedWordTemplate?.id !== "zh-internship-001";

	const persist = (data: FormValues) => {
		updateResumeData((draft) => {
			draft.basics = data;
		});
	};

	const form = useAppForm({
		defaultValues: basics,
		validators: { onChange: formSchema },
		onSubmit: ({ value }) => {
			persist(value);
		},
	});
	useSyncFormValues(form, basics);

	const setWordTemplateCustomFieldText = (fieldId: "zh-internship-birthday" | "zh-internship-gender", text: string) => {
		const currentFields = form.state.values.customFields ?? [];
		const existingIndex = currentFields.findIndex((field) => field.id === fieldId);
		const nextFields = [...currentFields];

		if (existingIndex >= 0) {
			nextFields[existingIndex] = { ...nextFields[existingIndex], text };
		} else {
			nextFields.push({
				id: fieldId,
				icon: fieldId === "zh-internship-gender" ? "user" : "calendar",
				link: "",
				text,
			});
		}

		form.setFieldValue("customFields", nextFields);
		void form.handleSubmit();
	};

	const getWordTemplateCustomFieldText = (fieldId: "zh-internship-birthday" | "zh-internship-gender") =>
		form.state.values.customFields?.find((field) => field.id === fieldId)?.text ?? "";

	return (
		<form
			className="space-y-4"
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
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => {
										field.handleChange(e.target.value);
										void form.handleSubmit();
									}}
								/>
							}
						/>
						<FormMessage errors={field.state.meta.errors} />
					</FormItem>
				)}
			</form.Field>

			<form.Field name="headline">
				{(field) => (
					<FormItem hasError={field.state.meta.isTouched && field.state.meta.errors.length > 0}>
						<FormLabel>{isWordTemplateResume ? <Trans>求职方向 / 应聘岗位</Trans> : <Trans>标题</Trans>}</FormLabel>
						<FormControl
							render={
								<Input
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => {
										field.handleChange(e.target.value);
										void form.handleSubmit();
									}}
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
							<Trans>邮箱</Trans>
						</FormLabel>
						<FormControl
							render={
								<Input
									type="email"
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => {
										field.handleChange(e.target.value);
										void form.handleSubmit();
									}}
								/>
							}
						/>
						<FormMessage errors={field.state.meta.errors} />
					</FormItem>
				)}
			</form.Field>

			<form.Field name="phone">
				{(field) => (
					<FormItem hasError={field.state.meta.isTouched && field.state.meta.errors.length > 0}>
						<FormLabel>{isWordTemplateResume ? <Trans>手机号</Trans> : <Trans>电话</Trans>}</FormLabel>
						<FormControl
							render={
								<Input
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => {
										field.handleChange(e.target.value);
										void form.handleSubmit();
									}}
								/>
							}
						/>
						<FormMessage errors={field.state.meta.errors} />
					</FormItem>
				)}
			</form.Field>

			<form.Field name="location">
				{(field) => (
					<FormItem hasError={field.state.meta.isTouched && field.state.meta.errors.length > 0}>
						<FormLabel>{isWordTemplateResume ? <Trans>意向城市</Trans> : <Trans>所在地</Trans>}</FormLabel>
						<FormControl
							render={
								<Input
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => {
										field.handleChange(e.target.value);
										void form.handleSubmit();
									}}
								/>
							}
						/>
						<FormMessage errors={field.state.meta.errors} />
					</FormItem>
				)}
			</form.Field>

			{shouldShowWebsiteField && isWordTemplateResume ? (
				<form.Field name="website">
					{(field) => (
						<FormItem hasError={field.state.meta.isTouched && field.state.meta.errors.length > 0}>
							<FormLabel>
								<Trans>GitHub / 个人链接</Trans>
							</FormLabel>
							<URLInput
								aria-label="GitHub / 个人链接"
								name={field.name}
								value={field.state.value}
								onChange={(value) => {
									field.handleChange(value);
									void form.handleSubmit();
								}}
							/>
							<FormMessage errors={field.state.meta.errors} />
						</FormItem>
					)}
				</form.Field>
			) : null}

			{isWordTemplateResume ? null : (
				<form.Field name="website">
					{(field) => (
						<FormItem hasError={field.state.meta.isTouched && field.state.meta.errors.length > 0}>
							<FormLabel>
								<Trans>网站</Trans>
							</FormLabel>
							<URLInput
								name={field.name}
								value={field.state.value}
								onChange={(value) => {
									field.handleChange(value);
									void form.handleSubmit();
								}}
							/>
							<FormMessage errors={field.state.meta.errors} />
						</FormItem>
					)}
				</form.Field>
			)}

			{selectedWordTemplate?.id === "zh-internship-001" ? (
				<WordTemplateProfileFields
					birthday={getWordTemplateCustomFieldText("zh-internship-birthday")}
					gender={getWordTemplateCustomFieldText("zh-internship-gender")}
					onBirthdayChange={(value) => setWordTemplateCustomFieldText("zh-internship-birthday", value)}
					onGenderChange={(value) => setWordTemplateCustomFieldText("zh-internship-gender", value)}
				/>
			) : isWordTemplateResume ? null : (
				<CustomFieldsSection form={form} />
			)}
		</form>
	);
}

function WordTemplateProfileFields({
	birthday,
	gender,
	onBirthdayChange,
	onGenderChange,
}: {
	birthday: string;
	gender: string;
	onBirthdayChange: (value: string) => void;
	onGenderChange: (value: string) => void;
}) {
	return (
		<div className="grid gap-4 rounded-md border bg-secondary/20 p-3">
			<FormItem>
				<FormLabel>
					<Trans>性别</Trans>
				</FormLabel>
				<FormControl
					render={
						<Input value={gender} placeholder="例如：女" onChange={(event) => onGenderChange(event.target.value)} />
					}
				/>
			</FormItem>

			<FormItem>
				<FormLabel>
					<Trans>出生日期</Trans>
				</FormLabel>
				<FormControl
					render={
						<Input
							value={birthday}
							placeholder="例如：2004.6.18"
							onChange={(event) => onBirthdayChange(event.target.value)}
						/>
					}
				/>
			</FormItem>
		</div>
	);
}
