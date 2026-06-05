import type z from "zod";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { pageSchema } from "@reactive-resume/schema/resume/data";
import { FormControl, FormItem, FormLabel, FormMessage } from "@reactive-resume/ui/components/form";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	InputGroupText,
} from "@reactive-resume/ui/components/input-group";
import { Switch } from "@reactive-resume/ui/components/switch";
import { Combobox } from "@/components/ui/combobox";
import { useResume, useUpdateResumeData } from "@/features/resume/builder/draft";
import { useSyncFormValues } from "@/hooks/use-sync-form-values";
import { useAppForm } from "@/libs/tanstack-form";
import { SectionBase } from "../shared/section-base";

export function PageSectionBuilder() {
	return (
		<SectionBase type="page">
			<PageSectionForm />
		</SectionBase>
	);
}

const formSchema = pageSchema;

type FormValues = z.infer<typeof formSchema>;

function PageSectionForm() {
	const resume = useResume();
	const page = resume?.data.metadata.page;
	const updateResumeData = useUpdateResumeData();

	const persist = (data: FormValues) => {
		updateResumeData((draft) => {
			draft.metadata.page = { ...data, locale: "zh-CN" };
		});
	};

	const form = useAppForm({
		defaultValues: page,
		validators: { onChange: formSchema },
		onSubmit: ({ value }) => {
			persist(value);
		},
	});
	useSyncFormValues(form, page);

	const handleAutoSave = <K extends keyof FormValues>(name: K, value: FormValues[K]) => {
		persist({ ...form.state.values, [name]: value });
	};

	return (
		<form
			className="grid @md:grid-cols-2 grid-cols-1 gap-4"
			onSubmit={(event) => {
				event.preventDefault();
				event.stopPropagation();
				void form.handleSubmit();
			}}
		>
			<form.Field name="format">
				{(field) => (
					<FormItem
						className="col-span-full"
						hasError={field.state.meta.isTouched && field.state.meta.errors.length > 0}
					>
						<FormLabel>
							<Trans context="Page Format (A4, Letter, Free-form)">纸张格式</Trans>
						</FormLabel>
						<FormControl
							render={
								<Combobox
									options={[
										{ value: "a4", label: t`A4` },
										{ value: "letter", label: t`Letter` },
										{ value: "free-form", label: t`自定义尺寸` },
									]}
									value={field.state.value}
									onValueChange={(value) => {
										const format = value as FormValues["format"];
										field.handleChange(format);
										handleAutoSave("format", format);
									}}
								/>
							}
						/>
						<FormMessage errors={field.state.meta.errors} />
					</FormItem>
				)}
			</form.Field>

			<form.Field name="marginX">
				{(field) => (
					<FormItem hasError={field.state.meta.isTouched && field.state.meta.errors.length > 0}>
						<FormLabel>
							<Trans>水平页边距</Trans>
						</FormLabel>
						<InputGroup>
							<FormControl
								render={
									<InputGroupInput
										name={field.name}
										value={field.state.value}
										min={0}
										max={100}
										step={1}
										type="number"
										onBlur={field.handleBlur}
										onChange={(e) => {
											const value = e.target.value;
											const marginX = value === "" ? ("" as unknown as number) : Number(value);
											field.handleChange(marginX);
											handleAutoSave("marginX", marginX);
										}}
									/>
								}
							/>
							<InputGroupAddon align="inline-end">
								<InputGroupText>pt</InputGroupText>
							</InputGroupAddon>
						</InputGroup>
						<FormMessage errors={field.state.meta.errors} />
					</FormItem>
				)}
			</form.Field>

			<form.Field name="marginY">
				{(field) => (
					<FormItem hasError={field.state.meta.isTouched && field.state.meta.errors.length > 0}>
						<FormLabel>
							<Trans>垂直页边距</Trans>
						</FormLabel>
						<InputGroup>
							<FormControl
								render={
									<InputGroupInput
										name={field.name}
										value={field.state.value}
										min={0}
										max={100}
										step={1}
										type="number"
										onBlur={field.handleBlur}
										onChange={(e) => {
											const value = e.target.value;
											const marginY = value === "" ? ("" as unknown as number) : Number(value);
											field.handleChange(marginY);
											handleAutoSave("marginY", marginY);
										}}
									/>
								}
							/>
							<InputGroupAddon align="inline-end">
								<InputGroupText>pt</InputGroupText>
							</InputGroupAddon>
						</InputGroup>
						<FormMessage errors={field.state.meta.errors} />
					</FormItem>
				)}
			</form.Field>

			<form.Field name="gapX">
				{(field) => (
					<FormItem hasError={field.state.meta.isTouched && field.state.meta.errors.length > 0}>
						<FormLabel>
							<Trans>水平间距</Trans>
						</FormLabel>
						<InputGroup>
							<FormControl
								render={
									<InputGroupInput
										name={field.name}
										value={field.state.value}
										min={0}
										step={1}
										type="number"
										onBlur={field.handleBlur}
										onChange={(e) => {
											const value = e.target.value;
											const gapX = value === "" ? ("" as unknown as number) : Number(value);
											field.handleChange(gapX);
											handleAutoSave("gapX", gapX);
										}}
									/>
								}
							/>
							<InputGroupAddon align="inline-end">
								<InputGroupText>pt</InputGroupText>
							</InputGroupAddon>
						</InputGroup>
						<FormMessage errors={field.state.meta.errors} />
					</FormItem>
				)}
			</form.Field>

			<form.Field name="gapY">
				{(field) => (
					<FormItem hasError={field.state.meta.isTouched && field.state.meta.errors.length > 0}>
						<FormLabel>
							<Trans>垂直间距</Trans>
						</FormLabel>
						<InputGroup>
							<FormControl
								render={
									<InputGroupInput
										name={field.name}
										value={field.state.value}
										min={0}
										step={1}
										type="number"
										onBlur={field.handleBlur}
										onChange={(e) => {
											const value = e.target.value;
											const gapY = value === "" ? ("" as unknown as number) : Number(value);
											field.handleChange(gapY);
											handleAutoSave("gapY", gapY);
										}}
									/>
								}
							/>
							<InputGroupAddon align="inline-end">
								<InputGroupText>pt</InputGroupText>
							</InputGroupAddon>
						</InputGroup>
						<FormMessage errors={field.state.meta.errors} />
					</FormItem>
				)}
			</form.Field>

			<form.Field name="hideIcons">
				{(field) => (
					<FormItem
						className="col-span-full flex items-center gap-x-3 py-2"
						hasError={field.state.meta.isTouched && field.state.meta.errors.length > 0}
					>
						<FormControl
							render={
								<Switch
									checked={field.state.value}
									onCheckedChange={(checked) => {
										field.handleChange(checked);
										handleAutoSave("hideIcons", checked);
									}}
								/>
							}
						/>
						<FormLabel>
							<Trans>隐藏简历中的所有图标</Trans>
						</FormLabel>
					</FormItem>
				)}
			</form.Field>
		</form>
	);
}
