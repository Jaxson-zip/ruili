import type { Icon } from "@phosphor-icons/react";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import {
	CloudArrowUpIcon,
	DotsThreeIcon,
	FilePdfIcon,
	FilesIcon,
	LayoutIcon,
	PaletteIcon,
	TranslateIcon,
} from "@phosphor-icons/react";
import { m } from "motion/react";
import { cn } from "@reactive-resume/utils/style";
import { featuredTemplateIds } from "@/dialogs/resume/template/data";

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
		description: t`界面、示例、模板预览和说明都按中文求职场景整理。`,
	},
	{
		id: "starter-samples",
		icon: LayoutIcon,
		title: t`成品样张`,
		description: t`默认展示少量完整中文样张，先看效果，再替换成自己的经历。`,
	},
	{
		id: "structured-editing",
		icon: FilesIcon,
		title: t`结构化编辑`,
		description: t`基础信息、经历、项目和技能分模块维护，后续改投递方向更省心。`,
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
		description: t`支持 JSON 导入；配置 AI 后可继续解析 PDF 和 Word 简历。`,
	},
	{
		id: "job-versions",
		icon: FilesIcon,
		title: t`多岗位版本`,
		description: t`为不同岗位复制和调整简历，避免把原始版本改乱。`,
	},
	{
		id: "templates",
		icon: PaletteIcon,
		title: t`中文模板`,
		description: t`首批 ${featuredTemplateIds.length} 套可导出模板使用中文样张，方便判断是否适合投递。`,
	},
	{
		id: "ai-optimization",
		icon: DotsThreeIcon,
		title: t`AI 优化入口`,
		description: t`接入模型服务后，可继续扩展岗位匹配、经历改写和关键词检查。`,
	},
];

function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
	return (
		<m.div
			className={cn(
				"group relative flex min-h-44 flex-col gap-4 overflow-hidden border-b bg-background p-5 transition-colors duration-200 will-change-[transform,opacity]",
				"not-nth-[2n]:border-r lg:not-nth-[4n]:border-r",
				"hover:bg-secondary/25",
			)}
			initial={{ opacity: 0, y: 14 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, amount: 0.1 }}
			transition={{ duration: 0.3, ease: "easeOut" }}
		>
			<div aria-hidden="true" className="inline-flex w-fit rounded-md border bg-secondary/30 p-2 text-muted-foreground">
				<Icon size={22} weight="thin" />
			</div>

			<div className="flex flex-col gap-y-1.5">
				<h3 className="font-semibold text-base tracking-tight">{title}</h3>
				<p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
			</div>
		</m.div>
	);
}

export function Features() {
	const features = getFeatures();

	return (
		<section id="features">
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
					<Trans>围绕中文简历最常见的流程设计：选样张、改内容、看预览、导出 PDF，再按不同岗位维护多个版本。</Trans>
				</p>
			</m.div>

			<div className="grid grid-cols-1 xs:grid-cols-2 border-t lg:grid-cols-4">
				{features.map((feature) => (
					<FeatureCard key={feature.id} {...feature} />
				))}
			</div>
		</section>
	);
}
