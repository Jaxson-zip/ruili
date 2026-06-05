import type { IconProps } from "@phosphor-icons/react";
import type { SectionType } from "@reactive-resume/schema/resume/data";
import { t } from "@lingui/core/macro";
import {
	ArticleIcon,
	BooksIcon,
	BrainIcon,
	BriefcaseIcon,
	CertificateIcon,
	ChartLineIcon,
	CodeSimpleIcon,
	CompassToolIcon,
	DiamondsFourIcon,
	DownloadIcon,
	EnvelopeSimpleIcon,
	FootballIcon,
	GraduationCapIcon,
	HandHeartIcon,
	ImageIcon,
	InfoIcon,
	LayoutIcon,
	MessengerLogoIcon,
	NotepadIcon,
	PaintBrushBroadIcon,
	PaletteIcon,
	PhoneIcon,
	ReadCvLogoIcon,
	ShareFatIcon,
	StarIcon,
	TextTIcon,
	TranslateIcon,
	TrophyIcon,
	UserIcon,
} from "@phosphor-icons/react";
import { match } from "ts-pattern";
import { cn } from "@reactive-resume/utils/style";

export type LeftSidebarSection = "picture" | "basics" | "summary" | SectionType | "custom";

// CustomSectionType values that are not in SectionType (used in custom sections only)
type CustomOnlyType = "cover-letter";

export type RightSidebarSection =
	| "template"
	| "layout"
	| "typography"
	| "design"
	| "styles"
	| "page"
	| "notes"
	| "sharing"
	| "statistics"
	| "analysis"
	| "export"
	| "information";

export type SidebarSection = LeftSidebarSection | RightSidebarSection;

export const leftSidebarSections: LeftSidebarSection[] = [
	"picture",
	"basics",
	"summary",
	"profiles",
	"experience",
	"education",
	"projects",
	"skills",
	"languages",
	"interests",
	"awards",
	"certifications",
	"publications",
	"volunteer",
	"references",
	"custom",
] as const;

export const rightSidebarSections: RightSidebarSection[] = [
	"template",
	"layout",
	"typography",
	"design",
	"styles",
	"page",
	"notes",
	"sharing",
	"statistics",
	"analysis",
	"export",
	"information",
] as const;

export const getSectionTitle = (type: SidebarSection | CustomOnlyType): string => {
	return (
		match(type)
			// Left Sidebar Sections
			.with("picture", () => t`照片`)
			.with("basics", () => t`基本信息`)
			.with("summary", () => t`个人总结`)
			.with("profiles", () => t`个人链接`)
			.with("experience", () => t`工作经历`)
			.with("education", () => t`教育经历`)
			.with("projects", () => t`项目经历`)
			.with("skills", () => t`技能`)
			.with("languages", () => t`语言能力`)
			.with("interests", () => t`兴趣爱好`)
			.with("awards", () => t`奖项荣誉`)
			.with("certifications", () => t`证书认证`)
			.with("publications", () => t`发表作品`)
			.with("volunteer", () => t`志愿经历`)
			.with("references", () => t`推荐人`)
			.with("custom", () => t`自定义模块`)

			// Custom Section Types (not in main sidebar)
			.with("cover-letter", () => t`求职信`)

			// Right Sidebar Sections
			.with("template", () => t`模板`)
			.with("layout", () => t`排版`)
			.with("typography", () => t`字体`)
			.with("design", () => t`设计`)
			.with("styles", () => t`自定义样式`)
			.with("page", () => t`页面`)
			.with("notes", () => t`备注`)
			.with("sharing", () => t`分享`)
			.with("statistics", () => t`统计`)
			.with("analysis", () => t`AI 简历分析`)
			.with("export", () => t`导出`)
			.with("information", () => t`产品信息`)

			.exhaustive()
	);
};

export const getSectionIcon = (type: SidebarSection | CustomOnlyType, props?: IconProps): React.ReactNode => {
	const iconProps = { ...props, className: cn("shrink-0", props?.className) };

	return (
		match(type)
			// Left Sidebar Sections
			.with("picture", () => <ImageIcon {...iconProps} />)
			.with("basics", () => <UserIcon {...iconProps} />)
			.with("summary", () => <ArticleIcon {...iconProps} />)
			.with("profiles", () => <MessengerLogoIcon {...iconProps} />)
			.with("experience", () => <BriefcaseIcon {...iconProps} />)
			.with("education", () => <GraduationCapIcon {...iconProps} />)
			.with("projects", () => <CodeSimpleIcon {...iconProps} />)
			.with("skills", () => <CompassToolIcon {...iconProps} />)
			.with("languages", () => <TranslateIcon {...iconProps} />)
			.with("interests", () => <FootballIcon {...iconProps} />)
			.with("awards", () => <TrophyIcon {...iconProps} />)
			.with("certifications", () => <CertificateIcon {...iconProps} />)
			.with("publications", () => <BooksIcon {...iconProps} />)
			.with("volunteer", () => <HandHeartIcon {...iconProps} />)
			.with("references", () => <PhoneIcon {...iconProps} />)
			.with("custom", () => <StarIcon {...iconProps} />)

			// Custom Section Types (not in main sidebar)
			.with("cover-letter", () => <EnvelopeSimpleIcon {...iconProps} />)

			// Right Sidebar Sections
			.with("template", () => <DiamondsFourIcon {...iconProps} />)
			.with("layout", () => <LayoutIcon {...iconProps} />)
			.with("typography", () => <TextTIcon {...iconProps} />)
			.with("design", () => <PaletteIcon {...iconProps} />)
			.with("styles", () => <PaintBrushBroadIcon {...iconProps} />)
			.with("page", () => <ReadCvLogoIcon {...iconProps} />)
			.with("notes", () => <NotepadIcon {...iconProps} />)
			.with("sharing", () => <ShareFatIcon {...iconProps} />)
			.with("statistics", () => <ChartLineIcon {...iconProps} />)
			.with("analysis", () => <BrainIcon {...iconProps} />)
			.with("export", () => <DownloadIcon {...iconProps} />)
			.with("information", () => <InfoIcon {...iconProps} />)

			.exhaustive()
	);
};
