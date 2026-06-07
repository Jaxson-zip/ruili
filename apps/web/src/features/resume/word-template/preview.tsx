import type { ResumeData } from "@reactive-resume/schema/resume/data";
import type React from "react";
import type { WordTemplate } from "./library";
import { useEffect, useState } from "react";
import { cn } from "@reactive-resume/utils/style";

export type WordTemplateEditTarget =
	| { type: "basics"; field: "email" | "headline" | "location" | "name" | "phone" }
	| { type: "websiteUrl" }
	| { type: "summary" }
	| { type: "experience"; id: string; field: "company" | "description" | "period" | "position" }
	| { type: "education"; id: string; field: "area" | "degree" | "description" | "period" | "school" }
	| { type: "project"; id: string; field: "description" | "name" | "period" }
	| { type: "skill"; id: string; field: "keywords" | "name" | "proficiency" };

type WordTemplateDataPreviewProps = {
	data: ResumeData;
	template?: WordTemplate;
	onEdit?: (target: WordTemplateEditTarget, value: string) => void;
};

export function WordTemplateDataPreview({ data, onEdit, template }: WordTemplateDataPreviewProps) {
	if (template?.id === "compact-blue-grid") {
		return (
			<WordTemplatePdfPreview
				data={data}
				fallback={<CompactBlueGridPreview data={data} onEdit={onEdit} />}
				template={template}
			/>
		);
	}

	if (template?.id !== "dark-orange-sidebar") return null;

	const experience = data.sections.experience.items.filter((item) => !item.hidden).slice(0, 3);
	const education = data.sections.education.items.filter((item) => !item.hidden).slice(0, 2);
	const projects = data.sections.projects.items.filter((item) => !item.hidden).slice(0, 2);
	const skills = data.sections.skills.items.filter((item) => !item.hidden).slice(0, 6);
	const summary = htmlToPlainText(data.summary.content);
	const hasMainItems = experience.length > 0 || projects.length > 0 || education.length > 0;

	return (
		<div
			data-testid="word-template-data-preview"
			className="relative aspect-page w-full overflow-hidden bg-[#faf8f4] text-[#202020] shadow-sm [container-type:inline-size]"
			style={{ fontSize: "clamp(7px, 1.96cqw, 13.2px)" }}
		>
			<div className="grid h-full grid-cols-[31.5%_1fr]">
				<aside className="overflow-hidden bg-[#34333c] px-[2.45em] py-[2.85em] text-white">
					<div className="mb-[1.85em] flex justify-center">
						{data.picture.hidden || !data.picture.url ? (
							<div className="grid aspect-[4/5] w-[73%] place-items-center border-[0.28em] border-white/75 bg-white/10 text-white/65">
								照片
							</div>
						) : (
							<img
								src={data.picture.url}
								alt={textOrFallback(data.basics.name, "照片")}
								className="aspect-[4/5] w-[75%] border-[0.32em] border-white/75 object-cover"
							/>
						)}
					</div>

					<div className="mb-[2.1em] text-center">
						<EditableText
							as="h1"
							label="姓名"
							value={data.basics.name}
							fallback="姓名"
							className="mx-auto block max-w-full break-words font-semibold text-[2.65em] text-white leading-tight tracking-[0.12em]"
							onCommit={(value) => onEdit?.({ type: "basics", field: "name" }, value)}
						/>
						<EditableText
							as="p"
							label="求职方向"
							value={data.basics.headline}
							fallback="求职方向"
							className="mt-[0.7em] block break-words font-semibold text-[#ff9d12] text-[1.05em] leading-snug"
							onCommit={(value) => onEdit?.({ type: "basics", field: "headline" }, value)}
						/>
					</div>

					<SidebarSection title="基本资料">
						<SidebarEditableRow
							label="所在地"
							value={data.basics.location}
							onCommit={(value) => onEdit?.({ type: "basics", field: "location" }, value)}
						/>
						<SidebarEditableRow
							label="网站"
							value={websiteLabel(data.basics.website)}
							onCommit={(value) => onEdit?.({ type: "websiteUrl" }, value)}
						/>
						<SidebarEditableRow
							label="邮箱"
							value={data.basics.email}
							onCommit={(value) => onEdit?.({ type: "basics", field: "email" }, value)}
						/>
						<SidebarEditableRow
							label="电话"
							value={data.basics.phone}
							onCommit={(value) => onEdit?.({ type: "basics", field: "phone" }, value)}
						/>
					</SidebarSection>

					<SidebarSection title="联系方式">
						<SidebarEditableRow
							label="手机"
							value={data.basics.phone}
							onCommit={(value) => onEdit?.({ type: "basics", field: "phone" }, value)}
						/>
						<SidebarEditableRow
							label="邮箱"
							value={data.basics.email}
							onCommit={(value) => onEdit?.({ type: "basics", field: "email" }, value)}
						/>
						<SidebarEditableRow
							label="地址"
							value={data.basics.location}
							onCommit={(value) => onEdit?.({ type: "basics", field: "location" }, value)}
						/>
					</SidebarSection>

					<SidebarSection title="能力标签">
						{skills.length > 0 ? (
							<div className="space-y-[0.7em]">
								{skills.map((skill) => (
									<div key={skill.id} className="grid grid-cols-[1fr_43%] items-center gap-[0.8em]">
										<EditableText
											label="技能名称"
											value={skill.name}
											fallback="技能"
											className="block truncate font-semibold text-[0.83em]"
											onCommit={(value) => onEdit?.({ type: "skill", id: skill.id, field: "name" }, value)}
										/>
										<div className="relative h-[0.52em] overflow-hidden rounded-full bg-white/20">
											<div className="h-full w-4/5 bg-[#ffae18]" />
										</div>
									</div>
								))}
							</div>
						) : (
							<p className="text-[0.82em] text-white/70">点击左侧添加技能后会显示在这里。</p>
						)}
					</SidebarSection>
				</aside>

				<main className="overflow-hidden px-[3.15em] py-[3.05em]">
					<MainSection title="基本资料">
						<div className="flex flex-wrap items-center gap-x-[0.65em] gap-y-[0.25em] font-medium leading-[1.7]">
							<EditableText
								label="姓名"
								value={data.basics.name}
								fallback="姓名"
								className="inline-block"
								onCommit={(value) => onEdit?.({ type: "basics", field: "name" }, value)}
							/>
							<span>，</span>
							<EditableText
								label="城市"
								value={data.basics.location}
								fallback="城市"
								className="inline-block"
								onCommit={(value) => onEdit?.({ type: "basics", field: "location" }, value)}
							/>
							<span>，</span>
							<EditableText
								label="邮箱"
								value={data.basics.email}
								fallback="邮箱"
								className="inline-block"
								onCommit={(value) => onEdit?.({ type: "basics", field: "email" }, value)}
							/>
							<span>，</span>
							<EditableText
								label="电话"
								value={data.basics.phone}
								fallback="电话"
								className="inline-block"
								onCommit={(value) => onEdit?.({ type: "basics", field: "phone" }, value)}
							/>
						</div>
					</MainSection>

					<MainSection title="求职意向">
						<EditableText
							as="p"
							label="求职意向"
							value={data.basics.headline}
							fallback="请填写求职标题"
							className="block font-medium leading-[1.7]"
							onCommit={(value) => onEdit?.({ type: "basics", field: "headline" }, value)}
						/>
					</MainSection>

					{experience.length > 0 ? (
						<MainSection title="工作经验">
							<div className="space-y-[1.05em]">
								{experience.map((item) => (
									<ResumeItem
										key={item.id}
										title={item.company}
										subtitle={item.position}
										period={item.period}
										description={item.description}
										onTitleCommit={(value) => onEdit?.({ type: "experience", id: item.id, field: "company" }, value)}
										onSubtitleCommit={(value) =>
											onEdit?.({ type: "experience", id: item.id, field: "position" }, value)
										}
										onPeriodCommit={(value) => onEdit?.({ type: "experience", id: item.id, field: "period" }, value)}
										onDescriptionCommit={(value) =>
											onEdit?.({ type: "experience", id: item.id, field: "description" }, value)
										}
									/>
								))}
							</div>
						</MainSection>
					) : null}

					{projects.length > 0 ? (
						<MainSection title="项目经历">
							<div className="space-y-[1.05em]">
								{projects.map((item) => (
									<ResumeItem
										key={item.id}
										title={item.name}
										period={item.period}
										description={item.description}
										onTitleCommit={(value) => onEdit?.({ type: "project", id: item.id, field: "name" }, value)}
										onPeriodCommit={(value) => onEdit?.({ type: "project", id: item.id, field: "period" }, value)}
										onDescriptionCommit={(value) =>
											onEdit?.({ type: "project", id: item.id, field: "description" }, value)
										}
									/>
								))}
							</div>
						</MainSection>
					) : null}

					{education.length > 0 ? (
						<MainSection title="教育经历">
							<div className="space-y-[0.9em]">
								{education.map((item) => (
									<ResumeItem
										key={item.id}
										title={item.school}
										subtitle={[item.degree, item.area].filter(Boolean).join(" / ")}
										period={item.period}
										description={item.description}
										onTitleCommit={(value) => onEdit?.({ type: "education", id: item.id, field: "school" }, value)}
										onSubtitleCommit={(value) => {
											const [degree = "", area = ""] = value.split(/[/／]/).map((part) => part.trim());
											onEdit?.({ type: "education", id: item.id, field: "degree" }, degree);
											onEdit?.({ type: "education", id: item.id, field: "area" }, area);
										}}
										onPeriodCommit={(value) => onEdit?.({ type: "education", id: item.id, field: "period" }, value)}
										onDescriptionCommit={(value) =>
											onEdit?.({ type: "education", id: item.id, field: "description" }, value)
										}
									/>
								))}
							</div>
						</MainSection>
					) : null}

					{data.summary.hidden ? null : (
						<MainSection title="自我评价">
							<EditableText
								as="p"
								label="个人总结"
								value={summary}
								fallback="请填写个人总结。"
								multiline
								className="line-clamp-5 block leading-[1.75]"
								onCommit={(value) => onEdit?.({ type: "summary" }, value)}
							/>
						</MainSection>
					)}

					{hasMainItems ? null : (
						<p className="mt-[2.5em] rounded-[0.45em] border border-[#ff9d12]/45 border-dashed px-[1em] py-[0.85em] text-[#7a746b] text-[0.86em]">
							先补充工作、项目或教育经历，这个模板会自动把内容排进右侧正文区。
						</p>
					)}
				</main>
			</div>
		</div>
	);
}

type WordTemplatePdfPreviewProps = {
	data: ResumeData;
	fallback: React.ReactNode;
	template: WordTemplate;
};

function WordTemplatePdfPreview({ data, fallback, template }: WordTemplatePdfPreviewProps) {
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [status, setStatus] = useState<"error" | "loading" | "ready">("loading");

	useEffect(() => {
		let cancelled = false;
		let objectUrl: string | null = null;

		async function renderPreview() {
			setStatus("loading");
			setPreviewUrl(null);

			try {
				const response = await fetch("/api/word-template/preview", {
					method: "POST",
					credentials: "include",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ templateId: template.id, data }),
				});

				if (!response.ok) throw new Error(`Failed to render Word template preview: ${response.status}`);

				const pdf = await response.blob();
				objectUrl = URL.createObjectURL(pdf);

				if (!cancelled) {
					setPreviewUrl(objectUrl);
					setStatus("ready");
				}
			} catch {
				if (!cancelled) setStatus("error");
			}
		}

		void renderPreview();

		return () => {
			cancelled = true;
			if (objectUrl) URL.revokeObjectURL(objectUrl);
		};
	}, [data, template.id]);

	return (
		<div
			data-testid="word-template-data-preview"
			className="relative aspect-page w-full overflow-hidden bg-[#f7f7f5] shadow-sm"
		>
			{previewUrl ? (
				<iframe
					title="Word 模板 PDF 预览"
					src={previewUrl}
					className="h-full w-full border-0 bg-white"
					data-testid="word-template-pdf-preview"
				/>
			) : null}
			{status === "loading" ? (
				<div className="absolute inset-0 grid place-items-center bg-white text-muted-foreground text-sm">
					正在生成 Word 高保真预览...
				</div>
			) : null}
			{status === "error" ? (
				<div className="absolute inset-0 overflow-auto bg-white">
					<div className="grid min-h-full place-items-center p-8 text-center">
						<div className="max-w-[28rem]">
							<p className="font-medium text-[#222] text-base">当前环境还不能生成 Word 高保真预览</p>
							<p className="mt-2 text-muted-foreground text-sm leading-6">
								需要在服务端安装 LibreOffice/soffice 后，才能把真实 DOCX 转成 PDF
								预览。下面只是临时内容编辑视图，不代表最终 Word 版式。
							</p>
						</div>
					</div>
					<div className="opacity-70">{fallback}</div>
				</div>
			) : null}
		</div>
	);
}

function CompactBlueGridPreview({ data, onEdit }: Omit<WordTemplateDataPreviewProps, "template">) {
	const experience = data.sections.experience.items.filter((item) => !item.hidden).slice(0, 2);
	const education = data.sections.education.items.filter((item) => !item.hidden).slice(0, 1);
	const projects = data.sections.projects.items.filter((item) => !item.hidden).slice(0, 3);
	const awards = data.sections.awards.items.filter((item) => !item.hidden).slice(0, 8);
	const skills = data.sections.skills.items.filter((item) => !item.hidden).slice(0, 8);
	const summary = htmlToPlainText(data.summary.content);

	return (
		<div
			data-testid="word-template-data-preview"
			className="relative aspect-page w-full overflow-hidden bg-[#fbfbfa] px-[4.9em] py-[4.15em] text-[#333] shadow-sm [container-type:inline-size]"
			style={{ fontSize: "clamp(6.8px, 1.74cqw, 11.7px)" }}
		>
			<div className="absolute top-0 left-0 h-[0.55em] w-[14em] bg-[#1296db]" />
			<div className="absolute top-[0.55em] left-[14em] h-px w-[68%] bg-[#d8d8d8]" />

			<header className="mb-[1.65em] grid grid-cols-[1fr_9.2em] gap-[2.1em]">
				<div className="min-w-0">
					<EditableText
						as="h1"
						label="姓名"
						value={data.basics.name}
						fallback="姓名"
						className="block break-words font-bold text-[#555] text-[2.85em] leading-none tracking-[0.18em]"
						onCommit={(value) => onEdit?.({ type: "basics", field: "name" }, value)}
					/>
					<div className="mt-[1.15em] grid grid-cols-2 overflow-hidden border-[#d5dde2] border-t border-l text-[0.95em] leading-[1.75]">
						<GridInfo
							label="求职岗位"
							value={data.basics.headline}
							onCommit={(value) => onEdit?.({ type: "basics", field: "headline" }, value)}
						/>
						<GridInfo
							label="所在城市"
							value={data.basics.location}
							onCommit={(value) => onEdit?.({ type: "basics", field: "location" }, value)}
						/>
						<GridInfo
							label="电话"
							value={data.basics.phone}
							onCommit={(value) => onEdit?.({ type: "basics", field: "phone" }, value)}
						/>
						<GridInfo
							label="邮箱"
							value={data.basics.email}
							onCommit={(value) => onEdit?.({ type: "basics", field: "email" }, value)}
						/>
					</div>
				</div>

				{data.picture.hidden || !data.picture.url ? (
					<div className="grid aspect-[5/6] place-items-center border border-[#b9c4cb] bg-[#f1f5f7] text-[#8a969d]">
						照片
					</div>
				) : (
					<img
						src={data.picture.url}
						alt={textOrFallback(data.basics.name, "照片")}
						className="aspect-[5/6] w-full border border-[#b9c4cb] object-cover"
					/>
				)}
			</header>

			<CompactSection title="求职意向">
				<EditableText
					as="p"
					label="求职意向"
					value={data.basics.headline}
					fallback="请填写求职岗位和方向"
					className="block font-semibold text-[#333] leading-[1.7]"
					onCommit={(value) => onEdit?.({ type: "basics", field: "headline" }, value)}
				/>
			</CompactSection>

			<CompactSection title="教育经历">
				{education.length > 0 ? (
					education.map((item) => (
						<CompactItem
							key={item.id}
							title={item.school}
							subtitle={[item.area, item.degree].filter(Boolean).join(" | ")}
							period={item.period}
							description={item.description}
							onTitleCommit={(value) => onEdit?.({ type: "education", id: item.id, field: "school" }, value)}
							onSubtitleCommit={(value) => {
								const [area = "", degree = ""] = value.split(/[/|｜]/).map((part) => part.trim());
								onEdit?.({ type: "education", id: item.id, field: "area" }, area);
								onEdit?.({ type: "education", id: item.id, field: "degree" }, degree);
							}}
							onPeriodCommit={(value) => onEdit?.({ type: "education", id: item.id, field: "period" }, value)}
							onDescriptionCommit={(value) => onEdit?.({ type: "education", id: item.id, field: "description" }, value)}
						/>
					))
				) : (
					<CompactEmpty>补充学校、专业、学历和时间后会显示在这里。</CompactEmpty>
				)}
			</CompactSection>

			{awards.length > 0 ? (
				<CompactSection title="获奖荣誉">
					<div className="grid gap-[0.18em]">
						{awards.map((item) => (
							<EditableText
								key={item.id}
								as="p"
								label="奖项"
								value={[item.date, item.title].filter(Boolean).join("  ")}
								fallback="奖项名称"
								className="block text-[#5a5a5a] text-[0.9em] leading-[1.48]"
								onCommit={undefined}
							/>
						))}
					</div>
				</CompactSection>
			) : null}

			{experience.length > 0 ? (
				<CompactSection title="工作经历">
					<div className="space-y-[0.82em]">
						{experience.map((item) => (
							<CompactItem
								key={item.id}
								title={item.company}
								subtitle={item.position}
								period={item.period}
								description={item.description}
								onTitleCommit={(value) => onEdit?.({ type: "experience", id: item.id, field: "company" }, value)}
								onSubtitleCommit={(value) => onEdit?.({ type: "experience", id: item.id, field: "position" }, value)}
								onPeriodCommit={(value) => onEdit?.({ type: "experience", id: item.id, field: "period" }, value)}
								onDescriptionCommit={(value) =>
									onEdit?.({ type: "experience", id: item.id, field: "description" }, value)
								}
							/>
						))}
					</div>
				</CompactSection>
			) : null}

			{projects.length > 0 ? (
				<CompactSection title="项目经历">
					<div className="space-y-[0.82em]">
						{projects.map((item) => (
							<CompactItem
								key={item.id}
								title={item.name}
								period={item.period}
								description={item.description}
								onTitleCommit={(value) => onEdit?.({ type: "project", id: item.id, field: "name" }, value)}
								onPeriodCommit={(value) => onEdit?.({ type: "project", id: item.id, field: "period" }, value)}
								onDescriptionCommit={(value) => onEdit?.({ type: "project", id: item.id, field: "description" }, value)}
							/>
						))}
					</div>
				</CompactSection>
			) : null}

			{summary || skills.length > 0 ? (
				<CompactSection title="能力补充">
					<div className="flex flex-wrap gap-x-[0.65em] gap-y-[0.38em]">
						{skills.map((skill) => (
							<EditableText
								key={skill.id}
								label="技能名称"
								value={skill.name}
								fallback="技能"
								className="rounded-sm bg-[#edf6fb] px-[0.55em] py-[0.12em] font-semibold text-[#26779d] text-[0.86em]"
								onCommit={(value) => onEdit?.({ type: "skill", id: skill.id, field: "name" }, value)}
							/>
						))}
					</div>
					{summary ? (
						<EditableText
							as="p"
							label="个人总结"
							value={summary}
							fallback="请填写个人总结。"
							multiline
							className="mt-[0.55em] line-clamp-3 block text-[#5a5a5a] text-[0.9em] leading-[1.55]"
							onCommit={(value) => onEdit?.({ type: "summary" }, value)}
						/>
					) : null}
				</CompactSection>
			) : null}
		</div>
	);
}

type EditableTextProps = {
	as?: "div" | "h1" | "h3" | "p" | "span";
	className?: string;
	fallback: string;
	label: string;
	multiline?: boolean;
	onCommit?: (value: string) => void;
	value: string;
};

function EditableText({
	as: Component = "span",
	className,
	fallback,
	label,
	multiline = false,
	onCommit,
	value,
}: EditableTextProps) {
	const displayValue = textOrFallback(value, fallback);
	const isPlaceholder = !value.trim();

	const commitValue = (event: React.FocusEvent<HTMLElement>) => {
		const nextValue = normalizeEditableText(event.currentTarget.innerText);
		if (nextValue === normalizeEditableText(displayValue)) return;
		onCommit?.(nextValue);
	};

	return (
		<Component
			aria-label={label}
			contentEditable={Boolean(onCommit)}
			role={onCommit ? "textbox" : undefined}
			suppressContentEditableWarning
			tabIndex={onCommit ? 0 : undefined}
			className={cn(
				"rounded-[0.18em] outline-none transition-colors",
				onCommit && "cursor-text hover:bg-[#ff980f]/10 focus:bg-[#fff4e3] focus:ring-[#ff980f]/45 focus:ring-[0.12em]",
				isPlaceholder && "text-current/55",
				className,
			)}
			onBlur={commitValue}
			onKeyDown={(event) => {
				if (multiline || event.key !== "Enter") return;
				event.preventDefault();
				event.currentTarget.blur();
			}}
		>
			{displayValue}
		</Component>
	);
}

type SectionProps = {
	children: React.ReactNode;
	title: string;
};

function SidebarSection({ children, title }: SectionProps) {
	return (
		<section className="mb-[2.25em]">
			<h2 className="mb-[0.85em] font-bold text-[#ff9d12] text-[1.32em]">{title}</h2>
			{children}
		</section>
	);
}

function MainSection({ children, title }: SectionProps) {
	return (
		<section className="mb-[1.38em]">
			<div className="mb-[0.72em] flex items-center gap-[1.15em]">
				<h2 className="shrink-0 font-bold text-[#ff8500] text-[1.52em] leading-none">{title}</h2>
				<div className="h-px flex-1 bg-gradient-to-r from-[#ff8500] via-[#ffb45b]/60 to-transparent" />
			</div>
			{children}
		</section>
	);
}

function CompactSection({ children, title }: SectionProps) {
	return (
		<section className="mb-[1.05em]">
			<div className="mb-[0.48em] grid grid-cols-[auto_1fr] items-center gap-[0.75em]">
				<h2 className="font-bold text-[#555] text-[1.32em] leading-none">{title}</h2>
				<div className="h-px bg-[#d7dfe3]" />
			</div>
			{children}
		</section>
	);
}

type GridInfoProps = {
	label: string;
	onCommit: (value: string) => void;
	value: string;
};

function GridInfo({ label, onCommit, value }: GridInfoProps) {
	return (
		<div className="grid grid-cols-[4.7em_1fr] border-[#d5dde2] border-r border-b">
			<span className="bg-[#f2f7fa] px-[0.55em] py-[0.28em] font-semibold text-[#557282]">{label}</span>
			<EditableText
				label={label}
				value={value}
				fallback="-"
				className="min-w-0 break-words px-[0.55em] py-[0.28em] text-[#333]"
				onCommit={onCommit}
			/>
		</div>
	);
}

type CompactItemProps = {
	description?: string;
	onDescriptionCommit?: (value: string) => void;
	onPeriodCommit?: (value: string) => void;
	onSubtitleCommit?: (value: string) => void;
	onTitleCommit?: (value: string) => void;
	period?: string;
	subtitle?: string;
	title: string;
};

function CompactItem({
	description,
	onDescriptionCommit,
	onPeriodCommit,
	onSubtitleCommit,
	onTitleCommit,
	period,
	subtitle,
	title,
}: CompactItemProps) {
	return (
		<article className="leading-[1.5]">
			<div className="grid grid-cols-[1fr_auto] gap-[1em] font-bold text-[#333]">
				<EditableText
					as="h3"
					label="条目标题"
					value={title}
					fallback="未命名经历"
					className="min-w-0 truncate text-[1.02em]"
					onCommit={onTitleCommit}
				/>
				{period ? (
					<EditableText
						label="时间"
						value={period}
						fallback="时间"
						className="whitespace-nowrap text-[0.95em]"
						onCommit={onPeriodCommit}
					/>
				) : null}
			</div>
			{subtitle || onSubtitleCommit ? (
				<EditableText
					as="p"
					label="条目副标题"
					value={subtitle ?? ""}
					fallback="职位 / 专业"
					className="block font-semibold text-[#606060] text-[0.94em]"
					onCommit={onSubtitleCommit}
				/>
			) : null}
			{description || onDescriptionCommit ? (
				<EditableDescription
					label="条目描述"
					value={description ?? ""}
					fallback="补充职责、成果或项目亮点。"
					onCommit={onDescriptionCommit}
				/>
			) : null}
		</article>
	);
}

function CompactEmpty({ children }: { children: React.ReactNode }) {
	return <p className="text-[#7b7b7b] text-[0.9em] leading-[1.55]">{children}</p>;
}

type SidebarEditableRowProps = {
	label: string;
	onCommit: (value: string) => void;
	value: string;
};

function SidebarEditableRow({ label, onCommit, value }: SidebarEditableRowProps) {
	return (
		<div className="mb-[0.48em] grid grid-cols-[4.4em_1fr] gap-[0.35em] text-[0.83em] leading-snug">
			<span className="font-semibold text-white/90">{label}：</span>
			<EditableText
				label={label}
				value={value}
				fallback="-"
				className="min-w-0 break-words text-white/95 focus:bg-white/12"
				onCommit={onCommit}
			/>
		</div>
	);
}

type ResumeItemProps = {
	description?: string;
	onDescriptionCommit?: (value: string) => void;
	onPeriodCommit?: (value: string) => void;
	onSubtitleCommit?: (value: string) => void;
	onTitleCommit?: (value: string) => void;
	period?: string;
	subtitle?: string;
	title: string;
};

function ResumeItem({
	description,
	onDescriptionCommit,
	onPeriodCommit,
	onSubtitleCommit,
	onTitleCommit,
	period,
	subtitle,
	title,
}: ResumeItemProps) {
	return (
		<article className="leading-[1.62]">
			<div className="grid grid-cols-[1fr_auto] gap-[1em] font-bold">
				<EditableText
					as="h3"
					label="条目标题"
					value={title}
					fallback="未命名经历"
					className="min-w-0 truncate"
					onCommit={onTitleCommit}
				/>
				{period ? (
					<EditableText
						label="时间"
						value={period}
						fallback="时间"
						className="whitespace-nowrap"
						onCommit={onPeriodCommit}
					/>
				) : null}
			</div>
			{subtitle || onSubtitleCommit ? (
				<EditableText
					as="p"
					label="条目副标题"
					value={subtitle ?? ""}
					fallback="职位 / 专业"
					className="block font-semibold"
					onCommit={onSubtitleCommit}
				/>
			) : null}
			{description || onDescriptionCommit ? (
				<EditableDescription
					label="条目描述"
					value={description ?? ""}
					fallback="补充职责、成果或项目亮点。"
					onCommit={onDescriptionCommit}
				/>
			) : null}
		</article>
	);
}

type EditableDescriptionProps = {
	fallback: string;
	label: string;
	onCommit?: (value: string) => void;
	value: string;
};

function EditableDescription({ fallback, label, onCommit, value }: EditableDescriptionProps) {
	const bullets = htmlToBulletLines(value).slice(0, 4);
	const plainText = bullets.join("\n");

	if (bullets.length <= 1) {
		return (
			<EditableText
				as="p"
				label={label}
				value={plainText}
				fallback={fallback}
				multiline
				className="line-clamp-3 block text-[#333] text-[0.92em] leading-[1.58]"
				onCommit={onCommit}
			/>
		);
	}

	return (
		// biome-ignore lint/a11y/useSemanticElements: A contenteditable block preserves the resume canvas layout while still exposing a textbox role.
		<div
			aria-label={label}
			aria-multiline="true"
			contentEditable={Boolean(onCommit)}
			role="textbox"
			suppressContentEditableWarning
			tabIndex={onCommit ? 0 : undefined}
			className={cn(
				"mt-[0.25em] space-y-[0.16em] rounded-[0.18em] text-[#333] text-[0.9em] leading-[1.5] outline-none transition-colors",
				onCommit && "cursor-text hover:bg-[#ff980f]/10 focus:bg-[#fff4e3] focus:ring-[#ff980f]/45 focus:ring-[0.12em]",
			)}
			onBlur={(event) => {
				const nextValue = normalizeEditableText(event.currentTarget.innerText);
				if (nextValue === normalizeEditableText(plainText)) return;
				onCommit?.(nextValue);
			}}
		>
			{bullets.map((line, index) => (
				<div key={`${line}-${index}`} className="grid grid-cols-[0.8em_1fr] gap-[0.35em]">
					<span className="pt-[0.18em] text-[#ff8500]">•</span>
					<span>{line}</span>
				</div>
			))}
		</div>
	);
}

function websiteLabel(website: ResumeData["basics"]["website"]) {
	return website.label || website.url;
}

function textOrFallback(value: string | undefined, fallback: string) {
	return value?.trim() || fallback;
}

function normalizeEditableText(value: string) {
	return value
		.replace(/\u00a0/g, " ")
		.replace(/\s+\n/g, "\n")
		.trim();
}

function htmlToPlainText(value: string) {
	return value
		.replace(/<br\s*\/?>/gi, "\n")
		.replace(/<li\b[^>]*>/gi, "")
		.replace(/<\/(?:p|div|li|h[1-6]|tr)>/gi, "\n")
		.replace(/<[^>]+>/g, "")
		.replace(/\r/g, "")
		.split("\n")
		.map((line) => line.replace(/[ \t]+/g, " ").trim())
		.filter(Boolean)
		.join("\n");
}

function htmlToBulletLines(value: string) {
	const plain = value
		.replace(/<br\s*\/?>/gi, "\n")
		.replace(/<li\b[^>]*>/gi, "\n")
		.replace(/<\/(?:p|div|li|h[1-6]|tr)>/gi, "\n")
		.replace(/<[^>]+>/g, "")
		.replace(/\r/g, "");

	return plain
		.split("\n")
		.map((line) =>
			line
				.replace(/^[•\-–]\s*/, "")
				.replace(/[ \t]+/g, " ")
				.trim(),
		)
		.filter(Boolean);
}
