import type {
	Basics,
	EducationItem,
	ExperienceItem,
	ProjectItem,
	SkillItem,
} from "@reactive-resume/schema/resume/data";
import type React from "react";
import { t } from "@lingui/core/macro";
import { XIcon } from "@phosphor-icons/react";
import { useId } from "react";
import { Button } from "@reactive-resume/ui/components/button";
import { Input } from "@reactive-resume/ui/components/input";
import { RichInput } from "@/components/input/rich-input";
import { useCurrentResume, useUpdateResumeData } from "@/features/resume/builder/draft";
import { useSectionStore } from "../-store/section";
import { useBuilderSidebarStore } from "../-store/sidebar";

type BasicsTextField = keyof Pick<Basics, "name" | "headline" | "email" | "phone" | "location">;
type SupportedQuickEditSection = "basics" | "summary" | "experience" | "education" | "projects" | "skills";
type ExperienceTextField = keyof Pick<ExperienceItem, "company" | "position" | "location" | "period">;
type EducationTextField = keyof Pick<EducationItem, "school" | "degree" | "area" | "grade" | "location" | "period">;
type ProjectTextField = keyof Pick<ProjectItem, "name" | "period">;
type SkillTextField = keyof Pick<SkillItem, "name" | "proficiency">;

const supportedQuickEditSections = new Set<string>([
	"basics",
	"summary",
	"experience",
	"education",
	"projects",
	"skills",
]);

function isSupportedQuickEditSection(section: string | null): section is SupportedQuickEditSection {
	return Boolean(section && supportedQuickEditSections.has(section));
}

function getQuickEditTitle(section: SupportedQuickEditSection) {
	switch (section) {
		case "basics":
			return t`基本信息`;
		case "summary":
			return t`个人总结`;
		case "experience":
			return t`工作经历`;
		case "education":
			return t`教育经历`;
		case "projects":
			return t`项目经历`;
		case "skills":
			return t`技能清单`;
	}
}

function parseKeywords(value: string) {
	return value
		.split(/[、,，]/)
		.map((keyword) => keyword.trim())
		.filter(Boolean);
}

export function BuilderQuickEditPanel() {
	const selectedSection = useSectionStore((state) => state.selectedSection);
	const clearSelectedSection = useSectionStore((state) => state.clearSelectedSection);
	const rightSidebarWidth = useBuilderSidebarStore((state) => state.layout.right);
	const resume = useCurrentResume();
	const updateResumeData = useUpdateResumeData();

	if (!isSupportedQuickEditSection(selectedSection)) return null;

	const title = getQuickEditTitle(selectedSection);

	const updateBasicsField = (field: BasicsTextField, value: string) => {
		updateResumeData((draft) => {
			draft.basics[field] = value;
		});
	};

	const updateExperienceField = (index: number, field: ExperienceTextField, value: string) => {
		updateResumeData((draft) => {
			const item = draft.sections.experience.items[index];
			if (!item) return;
			item[field] = value;
		});
	};

	const updateEducationField = (index: number, field: EducationTextField, value: string) => {
		updateResumeData((draft) => {
			const item = draft.sections.education.items[index];
			if (!item) return;
			item[field] = value;
		});
	};

	const updateProjectField = (index: number, field: ProjectTextField, value: string) => {
		updateResumeData((draft) => {
			const item = draft.sections.projects.items[index];
			if (!item) return;
			item[field] = value;
		});
	};

	const updateSkillField = (index: number, field: SkillTextField, value: string) => {
		updateResumeData((draft) => {
			const item = draft.sections.skills.items[index];
			if (!item) return;
			item[field] = value;
		});
	};

	return (
		<section
			aria-label={t`快速编辑：${title}`}
			data-testid="builder-quick-edit-panel"
			className="fixed top-[8.25rem] z-30 hidden max-h-[calc(100svh-10rem)] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-lg border bg-popover/95 p-3 shadow-xl backdrop-blur sm:block"
			style={{ right: `calc(${rightSidebarWidth}% + 1rem)` }}
		>
			<div className="mb-3 flex items-center justify-between gap-3">
				<h2 className="font-semibold text-sm">{title}</h2>

				<Button
					size="icon"
					variant="ghost"
					className="size-8"
					aria-label={t`关闭快速编辑`}
					onClick={clearSelectedSection}
				>
					<XIcon className="size-4" />
				</Button>
			</div>

			{selectedSection === "basics" ? (
				<div className="grid gap-3">
					<LabeledInput
						label={t`姓名`}
						value={resume.data.basics.name}
						onChange={(value) => updateBasicsField("name", value)}
					/>
					<LabeledInput
						label={t`求职标题`}
						value={resume.data.basics.headline}
						onChange={(value) => updateBasicsField("headline", value)}
					/>
					<div className="grid gap-3 sm:grid-cols-2">
						<LabeledInput
							type="email"
							label={t`邮箱`}
							value={resume.data.basics.email}
							onChange={(value) => updateBasicsField("email", value)}
						/>
						<LabeledInput
							label={t`电话`}
							value={resume.data.basics.phone}
							onChange={(value) => updateBasicsField("phone", value)}
						/>
					</div>
					<div className="grid gap-3 sm:grid-cols-2">
						<LabeledInput
							label={t`城市`}
							value={resume.data.basics.location}
							onChange={(value) => updateBasicsField("location", value)}
						/>
						<LabeledInput
							label={t`网站`}
							value={resume.data.basics.website.url}
							onChange={(value) => {
								updateResumeData((draft) => {
									draft.basics.website.url = value;
								});
							}}
						/>
					</div>
				</div>
			) : null}

			{selectedSection === "summary" ? (
				<div className="grid gap-3">
					<LabeledInput
						label={t`标题`}
						value={resume.data.summary.title}
						onChange={(value) => {
							updateResumeData((draft) => {
								draft.summary.title = value;
							});
						}}
					/>

					<div className="grid gap-1.5">
						<span className="font-medium text-muted-foreground text-xs">{t`内容`}</span>
						<RichInput
							value={resume.data.summary.content}
							onChange={(value) => {
								updateResumeData((draft) => {
									draft.summary.content = value;
								});
							}}
							editorClassName="max-h-[180px] min-h-[120px]"
						/>
					</div>
				</div>
			) : null}

			{selectedSection === "experience" ? (
				<div className="grid gap-3">
					{resume.data.sections.experience.items.length === 0 ? <EmptySectionHint /> : null}
					{resume.data.sections.experience.items.map((item, index) => (
						<div key={item.id} className="grid gap-3 rounded-md border bg-background/70 p-3">
							<h3 className="font-medium text-xs">{t`工作经历 ${index + 1}`}</h3>
							<LabeledInput
								label={t`公司`}
								value={item.company}
								onChange={(value) => updateExperienceField(index, "company", value)}
							/>
							<LabeledInput
								label={t`职位`}
								value={item.position}
								onChange={(value) => updateExperienceField(index, "position", value)}
							/>
							<div className="grid gap-3 sm:grid-cols-2">
								<LabeledInput
									label={t`时间`}
									value={item.period}
									onChange={(value) => updateExperienceField(index, "period", value)}
								/>
								<LabeledInput
									label={t`城市`}
									value={item.location}
									onChange={(value) => updateExperienceField(index, "location", value)}
								/>
							</div>
							<LabeledRichInput
								label={t`经历描述`}
								value={item.description}
								onChange={(value) => {
									updateResumeData((draft) => {
										const draftItem = draft.sections.experience.items[index];
										if (!draftItem) return;
										draftItem.description = value;
									});
								}}
							/>
						</div>
					))}
					<SectionEditNote />
				</div>
			) : null}

			{selectedSection === "education" ? (
				<div className="grid gap-3">
					{resume.data.sections.education.items.length === 0 ? <EmptySectionHint /> : null}
					{resume.data.sections.education.items.map((item, index) => (
						<div key={item.id} className="grid gap-3 rounded-md border bg-background/70 p-3">
							<h3 className="font-medium text-xs">{t`教育经历 ${index + 1}`}</h3>
							<LabeledInput
								label={t`学校`}
								value={item.school}
								onChange={(value) => updateEducationField(index, "school", value)}
							/>
							<div className="grid gap-3 sm:grid-cols-2">
								<LabeledInput
									label={t`学历`}
									value={item.degree}
									onChange={(value) => updateEducationField(index, "degree", value)}
								/>
								<LabeledInput
									label={t`专业`}
									value={item.area}
									onChange={(value) => updateEducationField(index, "area", value)}
								/>
							</div>
							<div className="grid gap-3 sm:grid-cols-2">
								<LabeledInput
									label={t`时间`}
									value={item.period}
									onChange={(value) => updateEducationField(index, "period", value)}
								/>
								<LabeledInput
									label={t`成绩`}
									value={item.grade}
									onChange={(value) => updateEducationField(index, "grade", value)}
								/>
							</div>
							<LabeledRichInput
								label={t`经历描述`}
								value={item.description}
								onChange={(value) => {
									updateResumeData((draft) => {
										const draftItem = draft.sections.education.items[index];
										if (!draftItem) return;
										draftItem.description = value;
									});
								}}
							/>
						</div>
					))}
					<SectionEditNote />
				</div>
			) : null}

			{selectedSection === "projects" ? (
				<div className="grid gap-3">
					{resume.data.sections.projects.items.length === 0 ? <EmptySectionHint /> : null}
					{resume.data.sections.projects.items.map((item, index) => (
						<div key={item.id} className="grid gap-3 rounded-md border bg-background/70 p-3">
							<h3 className="font-medium text-xs">{t`项目经历 ${index + 1}`}</h3>
							<LabeledInput
								label={t`项目名称`}
								value={item.name}
								onChange={(value) => updateProjectField(index, "name", value)}
							/>
							<LabeledInput
								label={t`时间`}
								value={item.period}
								onChange={(value) => updateProjectField(index, "period", value)}
							/>
							<LabeledRichInput
								label={t`项目描述`}
								value={item.description}
								onChange={(value) => {
									updateResumeData((draft) => {
										const draftItem = draft.sections.projects.items[index];
										if (!draftItem) return;
										draftItem.description = value;
									});
								}}
							/>
						</div>
					))}
					<SectionEditNote />
				</div>
			) : null}

			{selectedSection === "skills" ? (
				<div className="grid gap-3">
					{resume.data.sections.skills.items.length === 0 ? <EmptySectionHint /> : null}
					{resume.data.sections.skills.items.map((item, index) => (
						<div key={item.id} className="grid gap-3 rounded-md border bg-background/70 p-3">
							<h3 className="font-medium text-xs">{t`技能 ${index + 1}`}</h3>
							<LabeledInput
								label={t`技能名称`}
								value={item.name}
								onChange={(value) => updateSkillField(index, "name", value)}
							/>
							<LabeledInput
								label={t`熟练度`}
								value={item.proficiency}
								onChange={(value) => updateSkillField(index, "proficiency", value)}
							/>
							<LabeledInput
								label={t`关键词`}
								value={item.keywords.join("、")}
								onChange={(value) => {
									updateResumeData((draft) => {
										const draftItem = draft.sections.skills.items[index];
										if (!draftItem) return;
										draftItem.keywords = parseKeywords(value);
									});
								}}
							/>
						</div>
					))}
					<SectionEditNote />
				</div>
			) : null}
		</section>
	);
}

type LabeledInputProps = {
	label: string;
	value: string;
	type?: React.ComponentProps<typeof Input>["type"];
	onChange: (value: string) => void;
};

function LabeledInput({ label, value, type, onChange }: LabeledInputProps) {
	const id = useId();

	return (
		<div className="grid gap-1.5">
			<label htmlFor={id} className="font-medium text-muted-foreground text-xs">
				{label}
			</label>
			<Input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} />
		</div>
	);
}

type LabeledRichInputProps = {
	label: string;
	value: string;
	onChange: (value: string) => void;
};

function LabeledRichInput({ label, value, onChange }: LabeledRichInputProps) {
	return (
		<div className="grid gap-1.5">
			<span className="font-medium text-muted-foreground text-xs">{label}</span>
			<RichInput value={value} onChange={onChange} editorClassName="max-h-[180px] min-h-[120px]" />
		</div>
	);
}

function EmptySectionHint() {
	return <p className="rounded-md border border-dashed p-3 text-muted-foreground text-xs">{t`这个模块还没有内容。`}</p>;
}

function SectionEditNote() {
	return (
		<p className="text-muted-foreground text-xs">
			{t`这里用于快速替换已有内容；新增、删除和排序请继续使用左侧模块列表。`}
		</p>
	);
}
