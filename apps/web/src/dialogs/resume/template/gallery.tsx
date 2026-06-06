import type { Template } from "@reactive-resume/schema/templates";
import type { DialogProps } from "@/dialogs/store";
import type { CustomTemplatePreset } from "./custom-presets";
import type { TemplateMetadata } from "./data";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { MagnifyingGlassIcon, SlideshowIcon, TrashSimpleIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@reactive-resume/ui/components/badge";
import { Button } from "@reactive-resume/ui/components/button";
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@reactive-resume/ui/components/dialog";
import { Input } from "@reactive-resume/ui/components/input";
import { ScrollArea } from "@reactive-resume/ui/components/scroll-area";
import { cn } from "@reactive-resume/utils/style";
import { useDialogStore } from "@/dialogs/store";
import { useCurrentResume, useUpdateResumeData } from "@/features/resume/builder/draft";
import { loadCustomTemplatePresets, saveCustomTemplatePresets } from "./custom-presets";
import { primaryTemplateIds, templates } from "./data";
import { createRecommendedTemplateLayout } from "./layout";
import { TemplateThumbnail } from "./thumbnail";

const allSystemTemplateIds = primaryTemplateIds as readonly Template[];

const templateFilterOptions = [
	{ id: "all", label: "全部", keywords: [] },
	{ id: "tech", label: "技术", keywords: ["技术", "开发", "工程", "数据", "前端", "后端"] },
	{ id: "product", label: "产品/运营", keywords: ["产品", "运营", "增长", "项目管理"] },
	{ id: "business", label: "商务/咨询", keywords: ["商务", "咨询", "金融", "管理", "高管"] },
	{ id: "campus", label: "校招/实习", keywords: ["校招", "实习", "初级", "ATS", "紧凑"] },
	{ id: "creative", label: "设计/内容", keywords: ["设计", "内容", "创意", "品牌", "作品集"] },
	{ id: "function", label: "职能", keywords: ["人力资源", "职能", "行政", "财务", "法务", "客户成功"] },
] as const;

type TemplateFilterId = (typeof templateFilterOptions)[number]["id"];

function toSearchText(parts: Array<string | undefined>) {
	return parts.filter(Boolean).join(" ").toLocaleLowerCase();
}

function matchesTemplateFilter(parts: Array<string | undefined>, filterId: TemplateFilterId, query: string) {
	const searchText = toSearchText(parts);
	const selectedFilter = templateFilterOptions.find((option) => option.id === filterId) ?? templateFilterOptions[0];
	const matchesCategory =
		selectedFilter.keywords.length === 0 ||
		selectedFilter.keywords.some((keyword) => searchText.includes(keyword.toLocaleLowerCase()));
	const normalizedQuery = query.trim().toLocaleLowerCase();

	return matchesCategory && (normalizedQuery.length === 0 || searchText.includes(normalizedQuery));
}

export function TemplateGalleryDialog(_: DialogProps<"resume.template.gallery">) {
	const closeDialog = useDialogStore((state) => state.closeDialog);
	const resume = useCurrentResume();
	const selectedTemplate = resume.data.metadata.template;
	const updateResumeData = useUpdateResumeData();
	const [customPresets, setCustomPresets] = useState<CustomTemplatePreset[]>([]);
	const [activeFilter, setActiveFilter] = useState<TemplateFilterId>("all");
	const [searchQuery, setSearchQuery] = useState("");

	useEffect(() => {
		setCustomPresets(loadCustomTemplatePresets());
	}, []);

	function persistCustomPresets(nextPresets: CustomTemplatePreset[]) {
		setCustomPresets(nextPresets);
		saveCustomTemplatePresets(nextPresets);
	}

	function onSelectTemplate(template: Template) {
		const metadata = templates[template];

		updateResumeData((draft) => {
			draft.metadata.template = template;
			if ("accentColor" in metadata && metadata.accentColor)
				draft.metadata.design.colors.primary = metadata.accentColor;
			draft.metadata.layout = createRecommendedTemplateLayout(draft, metadata);
		});

		closeDialog();
	}

	function onSelectCustomTemplate(preset: CustomTemplatePreset) {
		updateResumeData((draft) => {
			draft.metadata = JSON.parse(JSON.stringify(preset.metadata));
		});

		closeDialog();
	}

	function onDeleteCustomTemplate(id: string) {
		persistCustomPresets(customPresets.filter((preset) => preset.id !== id));
		toast.success("模板已删除。");
	}

	const getVisibleTemplates = (templateIds: readonly Template[]) =>
		templateIds.map((template) => [template, templates[template]] as const);
	const visiblePrimaryTemplates = getVisibleTemplates(primaryTemplateIds).filter(([, metadata]) =>
		matchesTemplateFilter(
			[metadata.name, metadata.audience, metadata.description.message, ...metadata.tags],
			activeFilter,
			searchQuery,
		),
	);
	const visibleCustomPresets = customPresets.filter((preset) => {
		const baseTemplate = templates[preset.metadata.template];

		return matchesTemplateFilter(
			[preset.name, baseTemplate.name, baseTemplate.audience, baseTemplate.description.message, ...baseTemplate.tags],
			activeFilter,
			searchQuery,
		);
	});
	const resultCount = visiblePrimaryTemplates.length + visibleCustomPresets.length;

	return (
		<DialogContent className="lg:max-w-6xl">
			<div className="space-y-4 border-b pr-10 pb-4 sm:pr-12">
				<DialogHeader className="max-w-3xl gap-2">
					<DialogTitle className="flex items-center gap-3 text-xl">
						<SlideshowIcon size={20} />
						<Trans>模板库</Trans>
					</DialogTitle>
					<DialogDescription className="leading-relaxed">
						<Trans>选择一套适合岗位的中文模板，切换后会保留当前简历内容，并按模板重新整理排版。</Trans>
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-3">
					<div className="relative">
						<MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							aria-label="搜索模板"
							className="pl-9"
							placeholder="搜索岗位、风格、模板名"
							value={searchQuery}
							onChange={(event) => setSearchQuery(event.target.value)}
						/>
					</div>
				</div>

				<div className="flex gap-2 overflow-x-auto pb-1">
					{templateFilterOptions.map((option) => (
						<Button
							key={option.id}
							type="button"
							variant={activeFilter === option.id ? "default" : "outline"}
							size="sm"
							className="shrink-0"
							onClick={() => setActiveFilter(option.id)}
						>
							{option.label}
						</Button>
					))}
				</div>

				<div className="flex flex-wrap gap-2 text-xs">
					<Badge variant="secondary">可导出模板 {allSystemTemplateIds.length} 个</Badge>
					<Badge variant="secondary">可切换模板 {primaryTemplateIds.length} 个</Badge>
					<Badge variant="secondary">保留简历内容</Badge>
				</div>
			</div>

			<ScrollArea className="max-h-[72svh]">
				<div className="space-y-8 py-4 pr-4">
					{customPresets.length > 0 ? (
						<section className="space-y-4">
							<TemplateSectionHeader
								title="我的模板"
								badge={`${visibleCustomPresets.length} 个`}
								description="你导入或保存过的排版方案；这里只保存模板、布局、颜色和字体，不导入简历正文。"
							/>
							<div className="grid grid-cols-1 xs:grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
								{visibleCustomPresets.map((preset) => (
									<CustomTemplateCard
										key={preset.id}
										preset={preset}
										onDelete={onDeleteCustomTemplate}
										onSelect={onSelectCustomTemplate}
									/>
								))}
							</div>
						</section>
					) : null}

					<section className="space-y-4">
						<TemplateSectionHeader
							title="中文简历模板"
							badge={`${visiblePrimaryTemplates.length} 个`}
							description="预览图展示模板方向，点击后会整理当前简历排版，以编辑器预览和导出结果为准。"
						/>
						<div className="grid grid-cols-1 xs:grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
							{visiblePrimaryTemplates.map(([template, metadata]) => (
								<SystemTemplateCard
									key={template}
									metadata={metadata}
									id={template}
									isActive={template === selectedTemplate}
									onSelect={onSelectTemplate}
								/>
							))}
						</div>
					</section>

					{resultCount === 0 ? (
						<div className="rounded-md border border-dashed bg-secondary/20 px-4 py-10 text-center text-muted-foreground text-sm">
							<Trans>没有找到匹配的模板，可以换个关键词或选择“全部”。</Trans>
						</div>
					) : null}
				</div>
			</ScrollArea>
		</DialogContent>
	);
}

type TemplateSectionHeaderProps = {
	badge: string;
	description?: string;
	title: string;
};

function TemplateSectionHeader({ badge, description, title }: TemplateSectionHeaderProps) {
	return (
		<div className="space-y-1">
			<div className="flex items-center gap-2">
				<h3 className="font-semibold">{title}</h3>
				<Badge variant="secondary">{badge}</Badge>
			</div>
			{description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
		</div>
	);
}

type SystemTemplateCardProps = {
	id: Template;
	isActive?: boolean;
	metadata: TemplateMetadata;
	onSelect: (template: Template) => void;
};

function SystemTemplateCard({ id, metadata, isActive, onSelect }: SystemTemplateCardProps) {
	const { i18n } = useLingui();

	return (
		<article
			className={cn(
				"overflow-hidden rounded-md border bg-background transition-colors hover:border-foreground/25",
				isActive && "border-primary ring-1 ring-primary",
			)}
		>
			<button type="button" className="block w-full p-2 text-left outline-none" onClick={() => onSelect(id)}>
				<div className="aspect-page overflow-hidden rounded-sm border bg-white shadow-sm">
					<TemplateThumbnail template={id} label={metadata.name} imageUrl={metadata.imageUrl} />
				</div>

				<div className="min-h-32 space-y-2 px-1 pt-3 pb-2">
					<div className="flex items-start justify-between gap-2">
						<h4 className="line-clamp-1 font-semibold text-sm">{metadata.name}</h4>
						{isActive ? (
							<Badge variant="default" className="shrink-0">
								<Trans>当前</Trans>
							</Badge>
						) : null}
					</div>
					<p className="line-clamp-1 font-medium text-[11px] text-foreground/80 leading-relaxed">{metadata.audience}</p>
					<p className="line-clamp-2 text-muted-foreground text-xs leading-relaxed">{i18n.t(metadata.description)}</p>
				</div>
			</button>

			<div className="flex min-h-12 flex-wrap items-center gap-1.5 border-t px-3 py-2">
				{metadata.tags.slice(0, 3).map((tag) => (
					<Badge key={tag} variant="secondary" className="max-w-24 truncate text-[11px]">
						{tag}
					</Badge>
				))}
			</div>
		</article>
	);
}

type CustomTemplateCardProps = {
	preset: CustomTemplatePreset;
	onDelete: (id: string) => void;
	onSelect: (preset: CustomTemplatePreset) => void;
};

function CustomTemplateCard({ preset, onDelete, onSelect }: CustomTemplateCardProps) {
	const baseTemplate = templates[preset.metadata.template];

	return (
		<article className="overflow-hidden rounded-md border bg-background transition-colors hover:border-foreground/25">
			<button type="button" className="block w-full p-2 text-left outline-none" onClick={() => onSelect(preset)}>
				<div className="aspect-page overflow-hidden rounded-sm border bg-white shadow-sm">
					<TemplateThumbnail template={preset.metadata.template} label={preset.name} imageUrl={baseTemplate.imageUrl} />
				</div>

				<div className="min-h-24 space-y-2 px-1 pt-3 pb-2">
					<h4 className="line-clamp-1 font-semibold text-sm">{preset.name}</h4>
					<p className="line-clamp-2 text-muted-foreground text-xs leading-relaxed">
						基于「{baseTemplate.name}」保存的排版预设
					</p>
				</div>
			</button>

			<div className="flex min-h-12 items-center justify-between gap-2 border-t px-3 py-2">
				<Badge variant="secondary" className="text-[11px]">
					<Trans>我的模板</Trans>
				</Badge>

				<Button
					size="sm"
					variant="ghost"
					className="h-8 shrink-0 gap-1.5 px-2 text-destructive text-xs hover:text-destructive"
					aria-label={`删除模板：${preset.name}`}
					onClick={() => onDelete(preset.id)}
				>
					<TrashSimpleIcon className="size-3.5" />
					<Trans>删除</Trans>
				</Button>
			</div>
		</article>
	);
}
