import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { m } from "motion/react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@reactive-resume/ui/components/accordion";
import { cn } from "@reactive-resume/utils/style";

type FAQItemData = {
	question: string;
	answer: React.ReactNode;
};

const getFaqItems = (): FAQItemData[] => [
	{
		question: t`锐历和普通简历模板有什么不一样？`,
		answer: t`普通模板更像一次性文档，锐历把简历拆成结构化模块，方便长期维护、切换模板、导出 PDF，并为 AI 优化保留清晰的数据基础。`,
	},
	{
		question: t`AI 改简历是不是还需要接 LLM？`,
		answer: t`是的。PDF、Word 解析和简历优化需要配置可用的 AI 模型服务商；图片简历和扫描版 PDF 还需要 OCR 服务商。基础编辑、模板预览和 PDF 导出不依赖 LLM。`,
	},
	{
		question: t`支持 Word 和版本管理吗？`,
		answer: t`支持导出可编辑 DOCX，也可以用带占位符的 Word 模板生成文档。重要修改前建议复制一份简历作为岗位版本，方便保留原稿。`,
	},
	{
		question: t`开源许可怎么说明？`,
		answer: t`锐历基于 MIT 开源项目 Reactive Resume 构建，页脚保留了上游项目、原作者和 MIT 许可证入口。你可以查看源码并按许可证要求使用。`,
	},
	{
		question: t`为什么说它是中文优先？`,
		answer: t`界面文案、样张内容、模板预览和岗位表达都按中文求职场景整理，不只是把按钮翻译成中文。`,
	},
	{
		question: t`可以自托管吗？`,
		answer: t`可以。自托管后可以控制部署域名、数据库、邮件服务、AI 模型服务商和 OCR 服务商，更适合团队或个人长期维护。`,
	},
];

export function Faq() {
	const faqItems = getFaqItems();

	return (
		<section
			id="frequently-asked-questions"
			className="flex flex-col gap-x-16 gap-y-6 p-4 md:p-8 lg:flex-row lg:gap-x-18 xl:py-16"
		>
			<m.h2
				className={cn(
					"flex-1 font-semibold text-2xl tracking-tight will-change-[transform,opacity] md:text-4xl xl:text-5xl",
					"flex shrink-0 flex-wrap items-center gap-x-1.5 lg:flex-col lg:items-start",
				)}
				initial={{ opacity: 0, x: -20 }}
				whileInView={{ opacity: 1, x: 0 }}
				viewport={{ once: true }}
				transition={{ duration: 0.45 }}
			>
				<Trans context="Home page FAQ section heading with each word visually separated into individual spans">
					<span>常见</span>
					<span>问题</span>
				</Trans>
			</m.h2>

			<m.div
				initial={{ opacity: 0, y: 20 }}
				whileInView={{ opacity: 1, y: 0 }}
				viewport={{ once: true }}
				transition={{ duration: 0.45, delay: 0.08 }}
				className="max-w-2xl flex-2 will-change-[transform,opacity] lg:ml-auto 2xl:max-w-3xl"
			>
				<Accordion multiple>
					{faqItems.map((item, index) => (
						<FAQItemComponent key={item.question} item={item} index={index} />
					))}
				</Accordion>
			</m.div>
		</section>
	);
}

type FAQItemComponentProps = {
	item: FAQItemData;
	index: number;
};

function FAQItemComponent({ item, index }: FAQItemComponentProps) {
	return (
		<m.div
			className="will-change-[transform,opacity] last:border-b"
			initial={{ opacity: 0, y: 10 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true }}
			transition={{ duration: 0.24, delay: Math.min(0.16, index * 0.03) }}
		>
			<AccordionItem value={item.question} className="group border-t">
				<AccordionTrigger className="py-5">{item.question}</AccordionTrigger>
				<AccordionContent className="pb-5 text-muted-foreground leading-relaxed">{item.answer}</AccordionContent>
			</AccordionItem>
		</m.div>
	);
}
