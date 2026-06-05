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
		answer: t`普通模板更像一次性文档，锐历把简历拆成结构化模块，方便长期维护、切换模板、导出 PDF，并为后续 AI 优化保留清晰的数据基础。`,
	},
	{
		question: t`AI 改简历是不是还需要接 LLM？`,
		answer: t`是的。PDF、Word 解析和简历优化需要配置可用的 AI Provider；图片简历和扫描版 PDF 还需要 OCR Provider。基础编辑、模板预览和 PDF 导出不依赖 LLM。`,
	},
	{
		question: t`现在支持 Word 编辑和回退吗？`,
		answer: t`现有能力重点是结构化编辑和 PDF 导出；Word 文件可以通过 AI 解析导入。撤销、历史版本、Word 级编辑体验还需要继续二开完善。`,
	},
	{
		question: t`二开后能作为自己的项目吗？`,
		answer: t`可以。原项目是 MIT License，允许修改、商用和再分发；但需要保留原版权和 MIT 许可证声明，并避免暗示原作者为你的版本背书。`,
	},
	{
		question: t`为什么要先做中文化？`,
		answer: t`因为目标用户是中国求职者，英文菜单、英文样张和原项目捐赠入口都会削弱产品感。先把界面和示例换成中文，后面的 AI 优化才更自然。`,
	},
	{
		question: t`可以自托管吗？`,
		answer: t`可以。自托管后你可以控制部署域名、数据库、邮件服务、AI Provider 和 OCR Provider，更适合做成自己的中文简历产品。`,
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
