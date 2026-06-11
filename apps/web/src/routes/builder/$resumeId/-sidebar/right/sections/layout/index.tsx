import type { DragEndEvent } from "@dnd-kit/core";
import type { ResumeData } from "@reactive-resume/schema/resume/data";
import type { CSSProperties, HTMLAttributes } from "react";
import type z from "zod";
import type { WordTemplateSupportedSectionId } from "@/features/resume/word-template/library";
import { closestCenter, DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trans } from "@lingui/react/macro";
import { DotsSixVerticalIcon } from "@phosphor-icons/react";
import { metadataSchema } from "@reactive-resume/schema/resume/data";
import { Badge } from "@reactive-resume/ui/components/badge";
import { FormControl, FormItem, FormLabel, FormMessage } from "@reactive-resume/ui/components/form";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	InputGroupText,
} from "@reactive-resume/ui/components/input-group";
import { Slider } from "@reactive-resume/ui/components/slider";
import { useCurrentResume, useUpdateResumeData } from "@/features/resume/builder/draft";
import { getSelectedWordTemplate, getWordTemplateSupportedSectionIds } from "@/features/resume/word-template/library";
import { useSyncFormValues } from "@/hooks/use-sync-form-values";
import { useAppForm } from "@/libs/tanstack-form";
import { SectionBase } from "../../shared/section-base";
import { LayoutPages } from "./pages";
import { resolveLayoutSectionTitle } from "./title";

const wordLayoutSectionIds = [
	"education",
	"awards",
	"experience",
	"projects",
	"skills",
] as const satisfies readonly WordTemplateSupportedSectionId[];

type WordLayoutSectionId = (typeof wordLayoutSectionIds)[number];

export function LayoutSectionBuilder() {
	const resume = useCurrentResume();
	const selectedWordTemplate = getSelectedWordTemplate(resume.id, resume.data);

	return (
		<SectionBase type="layout" className="space-y-4">
			{selectedWordTemplate ? (
				<WordTemplateLayoutForm />
			) : (
				<>
					<LayoutPages />
					<LayoutSectionForm />
				</>
			)}
		</SectionBase>
	);
}

function WordTemplateLayoutForm() {
	const resume = useCurrentResume();
	const updateResumeData = useUpdateResumeData();
	const selectedWordTemplate = getSelectedWordTemplate(resume.id, resume.data);
	const supportedSectionIds = getWordTemplateSupportedSectionIds(selectedWordTemplate?.id);
	const layoutSectionIds = getWordTemplateLayoutSectionIds(selectedWordTemplate?.id, supportedSectionIds);
	const sectionOrder = getVisibleWordLayoutOrder(resume.data, layoutSectionIds, selectedWordTemplate?.id);
	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

	const handleDragEnd = ({ active, over }: DragEndEvent) => {
		if (!over) return;

		const activeId = String(active.id);
		const overId = String(over.id);
		if (
			activeId === overId ||
			!isWordLayoutSectionId(activeId, layoutSectionIds) ||
			!isWordLayoutSectionId(overId, layoutSectionIds)
		) {
			return;
		}

		const oldIndex = sectionOrder.indexOf(activeId);
		const newIndex = sectionOrder.indexOf(overId);
		if (oldIndex === -1 || newIndex === -1) return;

		const nextOrder = arrayMove(sectionOrder, oldIndex, newIndex);

		updateResumeData((draft) => {
			persistWordLayoutOrder(draft, nextOrder, layoutSectionIds);
		});
	};

	return (
		<div className="space-y-4">
			<div className="space-y-2 rounded-md border bg-secondary/20 p-3">
				<div className="flex flex-wrap items-center gap-2">
					<Badge variant="secondary">Word 模板</Badge>
					<Badge variant="outline">当前模板</Badge>
				</div>
				<div className="space-y-1">
					<h3 className="font-semibold text-lg tracking-tight">Word 模板模块顺序</h3>
					<p className="text-muted-foreground text-sm leading-relaxed">
						只显示当前模板已经支持、已经填写并会进入预览和导出的模块。拖拽可以调整模块顺序；字体、页边距、栏宽和装饰样式以
						Word 模板原文件为准。
					</p>
				</div>
			</div>

			{sectionOrder.length > 0 ? (
				<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
					<SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
						<div className="space-y-2">
							{sectionOrder.map((sectionId) => (
								<WordLayoutItem
									key={sectionId}
									sectionId={sectionId}
									status={getWordSectionStatus(resume.data, sectionId)}
									title={resolveLayoutSectionTitle(resume.data, sectionId)}
								/>
							))}
						</div>
					</SortableContext>
				</DndContext>
			) : (
				<div className="rounded-md border border-dashed bg-background/50 p-4 text-muted-foreground text-sm">
					先在左侧填写当前模板支持的内容，填写后才会进入这里排序。
				</div>
			)}
		</div>
	);
}

type WordLayoutItemProps = HTMLAttributes<HTMLDivElement> & {
	sectionId: WordLayoutSectionId;
	status: string;
	title: string;
};

function WordLayoutItem({ className, sectionId, status, style, title, ...rest }: WordLayoutItemProps) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sectionId });

	const itemStyle: CSSProperties = {
		...style,
		transform: CSS.Transform.toString(transform),
		transition,
	};

	return (
		<div
			ref={setNodeRef}
			style={itemStyle}
			data-dragging={isDragging ? "true" : undefined}
			className={[
				"flex items-center gap-3 rounded-md border bg-background px-3 py-2 transition-colors",
				"data-[dragging=true]:border-primary/60 data-[dragging=true]:bg-secondary/40",
				className,
			]
				.filter(Boolean)
				.join(" ")}
			{...rest}
		>
			<button
				type="button"
				className="flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-secondary active:cursor-grabbing"
				{...attributes}
				{...listeners}
				aria-label={`拖拽排序 ${title}`}
				title={`拖拽排序 ${title}`}
			>
				<DotsSixVerticalIcon className="size-4" />
			</button>

			<div className="min-w-0 flex-1">
				<p className="truncate font-medium text-sm">{title}</p>
				<p className="text-muted-foreground text-xs">{status}</p>
			</div>
		</div>
	);
}

function getVisibleWordLayoutOrder(
	data: ResumeData,
	supportedSectionIds: readonly WordTemplateSupportedSectionId[],
	templateId?: string,
): WordLayoutSectionId[] {
	return getWordLayoutOrder(data.metadata.layout.pages, supportedSectionIds, templateId).filter((sectionId) =>
		hasFilledWordSection(data, sectionId),
	);
}

function getWordLayoutOrder(
	pages: ResumeData["metadata"]["layout"]["pages"],
	supportedSectionIds: readonly WordTemplateSupportedSectionId[],
	templateId?: string,
): WordLayoutSectionId[] {
	const supported = new Set<string>(supportedSectionIds);
	const seen = new Set<WordLayoutSectionId>();
	const ordered: WordLayoutSectionId[] = [];

	for (const page of pages) {
		for (const sectionId of [...page.main, ...page.sidebar]) {
			if (!supported.has(sectionId) || seen.has(sectionId as WordLayoutSectionId)) continue;
			seen.add(sectionId as WordLayoutSectionId);
			ordered.push(sectionId as WordLayoutSectionId);
		}
	}

	for (const sectionId of supportedSectionIds) {
		if (seen.has(sectionId)) continue;
		seen.add(sectionId);
		ordered.push(sectionId);
	}

	return templateId === "zh-sidebar-clean-001" ? normalizeSidebarWordLayoutOrder(ordered) : ordered;
}

function getWordTemplateLayoutSectionIds(
	templateId: string | undefined,
	supportedSectionIds: readonly WordTemplateSupportedSectionId[],
): readonly WordTemplateSupportedSectionId[] {
	if (templateId !== "zh-sidebar-clean-001") return supportedSectionIds;

	return wordLayoutSectionIds.filter(
		(sectionId) =>
			(sectionId === "experience" || sectionId === "projects" || sectionId === "awards") &&
			supportedSectionIds.includes(sectionId),
	);
}

function normalizeSidebarWordLayoutOrder(order: readonly WordLayoutSectionId[]): WordLayoutSectionId[] {
	const mainOrder = order.filter((sectionId) => sectionId === "experience" || sectionId === "projects");
	return order.includes("awards") ? [...mainOrder, "awards"] : mainOrder;
}

function persistWordLayoutOrder(
	data: ResumeData,
	nextOrder: WordLayoutSectionId[],
	supportedSectionIds: readonly WordTemplateSupportedSectionId[],
) {
	const pages = data.metadata.layout.pages;
	if (pages.length === 0) {
		pages.push({ fullWidth: true, main: [], sidebar: [] });
	}

	const supported = new Set<string>(supportedSectionIds);
	const unsupportedSections = pages
		.flatMap((page) => [...page.main, ...page.sidebar])
		.filter((id) => !supported.has(id));

	for (const page of pages) {
		page.main = page.main.filter((id) => !supported.has(id));
		page.sidebar = page.sidebar.filter((id) => !supported.has(id));
	}

	const firstPage = pages[0];
	firstPage.fullWidth = true;
	firstPage.main = [...nextOrder, ...unsupportedSections];
	firstPage.sidebar = [];
}

function isWordLayoutSectionId(
	sectionId: string,
	supportedSectionIds: readonly WordTemplateSupportedSectionId[],
): sectionId is WordLayoutSectionId {
	return (supportedSectionIds as readonly string[]).includes(sectionId);
}

function hasFilledWordSection(data: ResumeData, sectionId: WordLayoutSectionId) {
	const section = data.sections[sectionId];
	if (section.hidden) return false;

	return section.items.some((item) => !item.hidden && hasFilledItemValue(item));
}

function hasFilledItemValue(value: unknown): boolean {
	if (typeof value === "string") return value.trim().length > 0 && value.trim() !== "https://";
	if (Array.isArray(value)) return value.some(hasFilledItemValue);
	if (!value || typeof value !== "object") return false;

	return Object.entries(value).some(([key, childValue]) => {
		if (key === "id" || key === "hidden" || key === "icon" || key === "iconColor" || key === "level") return false;
		return hasFilledItemValue(childValue);
	});
}

function getWordSectionStatus(data: ResumeData, sectionId: WordLayoutSectionId) {
	switch (sectionId) {
		case "education":
		case "awards":
		case "experience":
		case "projects":
		case "skills": {
			const count = data.sections[sectionId].items.filter((item) => !item.hidden).length;
			return count > 0 ? `${count} 项内容` : "暂无内容";
		}
	}
}

const formSchema = metadataSchema.shape.layout.omit({ pages: true });

type FormValues = z.infer<typeof formSchema>;

function LayoutSectionForm() {
	const resume = useCurrentResume();
	const layout = resume.data.metadata.layout;
	const updateResumeData = useUpdateResumeData();

	const persist = (data: FormValues) => {
		updateResumeData((draft) => {
			draft.metadata.layout.sidebarWidth = data.sidebarWidth;
		});
	};

	const form = useAppForm({
		defaultValues: { sidebarWidth: layout.sidebarWidth },
		validators: { onChange: formSchema },
		onSubmit: ({ value }) => {
			persist(value);
		},
	});
	useSyncFormValues(form, { sidebarWidth: layout.sidebarWidth });

	const handleAutoSave = () => {
		persist(form.state.values);
	};

	return (
		<form
			className="space-y-4"
			onSubmit={(event) => {
				event.preventDefault();
				event.stopPropagation();
				void form.handleSubmit();
			}}
		>
			<form.Field name="sidebarWidth">
				{(field) => (
					<FormItem hasError={field.state.meta.isTouched && field.state.meta.errors.length > 0}>
						<FormLabel>
							<Trans>侧栏宽度</Trans>
						</FormLabel>
						<div className="flex items-center gap-4">
							<FormControl
								render={
									<Slider
										min={10}
										max={50}
										step={0.01}
										value={[field.state.value]}
										onValueChange={(value) => {
											field.handleChange(Array.isArray(value) ? value[0] : value);
											handleAutoSave();
										}}
									/>
								}
							/>

							<FormControl
								render={
									<InputGroup className="w-auto shrink-0">
										<InputGroupInput
											name={field.name}
											value={field.state.value}
											type="number"
											min={10}
											max={50}
											step={0.1}
											onBlur={field.handleBlur}
											onChange={(e) => {
												const value = e.target.value;
												if (value === "") field.handleChange("" as unknown as number);
												else field.handleChange(Number(value));
												handleAutoSave();
											}}
										/>
										<InputGroupAddon align="inline-end">
											<InputGroupText>%</InputGroupText>
										</InputGroupAddon>
									</InputGroup>
								}
							/>
						</div>
						<FormMessage errors={field.state.meta.errors} />
					</FormItem>
				)}
			</form.Field>
		</form>
	);
}
