import type { Icon } from "@phosphor-icons/react";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import {
	CloudArrowUpIcon,
	CodeSimpleIcon,
	DatabaseIcon,
	DotsThreeIcon,
	FilePdfIcon,
	FilesIcon,
	GithubLogoIcon,
	GlobeIcon,
	KeyIcon,
	LayoutIcon,
	LockSimpleIcon,
	PaletteIcon,
	ShieldCheckIcon,
	TranslateIcon,
} from "@phosphor-icons/react";
import { m } from "motion/react";
import { useMemo } from "react";
import { cn } from "@reactive-resume/utils/style";

type Feature = {
	id: string;
	icon: Icon;
	title: string;
	description: string;
};

type FeatureCardProps = Feature;

const getFeatures = (): Feature[] => [
	{
		id: "chinese-first",
		icon: TranslateIcon,
		title: t`中文优先`,
		description: t`界面、示例、模板预览和产品文案都按中文求职场景整理。`,
	},
	{
		id: "ai-optimization",
		icon: DotsThreeIcon,
		title: t`AI 优化入口`,
		description: t`接入 AI Provider 后，可继续扩展岗位匹配、经历改写和关键词检查。`,
	},
	{
		id: "structured-editing",
		icon: FilesIcon,
		title: t`结构化编辑`,
		description: t`把基础信息、经历、项目、技能等内容拆成模块，方便长期维护。`,
	},
	{
		id: "pdf-export",
		icon: FilePdfIcon,
		title: t`PDF 导出`,
		description: t`编辑完成后直接导出 PDF，适合投递、分享和留档。`,
	},
	{
		id: "import",
		icon: CloudArrowUpIcon,
		title: t`文件导入`,
		description: t`支持导入 JSON，配置 AI 后可解析 PDF 和 Microsoft Word 简历。`,
	},
	{
		id: "job-versions",
		icon: FilesIcon,
		title: t`多岗位版本`,
		description: t`为不同岗位复制和调整简历版本，避免把原始版本改乱。`,
	},
	{
		id: "templates",
		icon: LayoutIcon,
		title: t`中文模板预览`,
		description: t`首批 5 套稳定模板已经换成中文样张，更容易判断版式是否适合投递。`,
	},
	{
		id: "design",
		icon: PaletteIcon,
		title: t`样式可调`,
		description: t`可以调整颜色、字体、间距和版式，让简历更符合你的职业气质。`,
	},
	{
		id: "self-host",
		icon: CloudArrowUpIcon,
		title: t`可自托管`,
		description: t`可以部署到自己的服务器，控制域名、数据库、邮件、AI Provider 和 OCR Provider。`,
	},
	{
		id: "data-control",
		icon: DatabaseIcon,
		title: t`数据自控`,
		description: t`自托管后简历数据留在你的环境里，更适合做长期产品。`,
	},
	{
		id: "auth",
		icon: KeyIcon,
		title: t`账户体系`,
		description: t`支持邮箱登录、OAuth、API key，以及适合团队使用的认证扩展。`,
	},
	{
		id: "2fa",
		icon: ShieldCheckIcon,
		title: t`安全增强`,
		description: t`支持通行密钥和双因素认证，保护账户与简历数据。`,
	},
	{
		id: "public",
		icon: GlobeIcon,
		title: t`公开链接`,
		description: t`需要时可以生成公开简历链接，方便作品集或招聘方查看。`,
	},
	{
		id: "password-protection",
		icon: LockSimpleIcon,
		title: t`密码保护`,
		description: t`公开简历也可以加密码，只让指定的人查看。`,
	},
	{
		id: "api-access",
		icon: CodeSimpleIcon,
		title: t`API 自动化`,
		description: t`通过 API 读取、导入、导出和管理简历，方便后续接业务系统。`,
	},
	{
		id: "open-source",
		icon: GithubLogoIcon,
		title: t`MIT 开源基础`,
		description: t`基于开源项目二次开发，可继续商用改造，同时保留必要来源注明。`,
	},
];

function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
	return (
		<m.div
			className={cn(
				"group relative flex min-h-48 flex-col gap-4 overflow-hidden border-b bg-background p-6 transition-[background-color] duration-300 will-change-[transform,opacity]",
				"not-nth-[2n]:border-r xl:not-nth-[4n]:border-r",
				"hover:bg-secondary/30",
			)}
			initial={{ opacity: 0, y: 16 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, amount: 0.1 }}
			transition={{ duration: 0.35, ease: "easeOut" }}
		>
			{/* Hover gradient overlay */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
			/>

			{/* Icon */}
			<div aria-hidden="true" className="relative">
				<div className="inline-flex rounded-md bg-primary/5 p-2.5 text-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
					<Icon size={24} weight="thin" />
				</div>
			</div>

			{/* Content */}
			<div className="relative flex flex-col gap-y-1.5">
				<h3 className="font-semibold text-base tracking-tight transition-colors group-hover:text-primary">{title}</h3>
				<p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
			</div>
		</m.div>
	);
}

export function Features() {
	const features = useMemo(() => getFeatures(), []);

	return (
		<section id="features">
			{/* Header */}
			<m.div
				className="space-y-4 p-4 will-change-[transform,opacity] md:p-8 xl:py-16"
				initial={{ opacity: 0, y: 20 }}
				whileInView={{ opacity: 1, y: 0 }}
				viewport={{ once: true }}
				transition={{ duration: 0.45 }}
			>
				<h2 className="font-semibold text-2xl tracking-tight md:text-4xl xl:text-5xl">
					<Trans>核心能力</Trans>
				</h2>

				<p className="max-w-2xl text-muted-foreground leading-relaxed">
					<Trans>先把中文简历编辑、模板、导出和自托管能力打牢，再继续往 AI 改写、岗位匹配和求职流程自动化延展。</Trans>
				</p>
			</m.div>

			{/* Features Grid */}
			<div className="grid grid-cols-1 xs:grid-cols-2 border-t xl:grid-cols-4">
				{features.map((feature) => (
					<FeatureCard key={feature.id} {...feature} />
				))}
			</div>
		</section>
	);
}
