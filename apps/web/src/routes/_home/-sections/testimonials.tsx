import { Trans } from "@lingui/react/macro";
import { QuotesIcon } from "@phosphor-icons/react";
import { m } from "motion/react";
import { useMemo } from "react";

const testimonials: string[] = [
	"编辑和预览放在同一个工作台里，改完马上能看到效果，比来回调 Word 模板省心很多。",
	"准备校招简历时很方便，模块、排版和 PDF 导出都比较稳定，适合针对不同岗位保存多个版本。",
	"我更在意数据能自己掌控。可以自托管，也能继续二开，这一点对长期维护个人简历库很重要。",
	"给不同公司的 JD 做了多个投递版本，导出 PDF 后格式保持得很好，不用担心排版在发送后乱掉。",
	"以前写简历总是先纠结样式，现在可以先把经历结构化，再慢慢调模板，整个过程清晰很多。",
	"对技术岗位来说，项目经历、技能栈和成果指标都能拆开维护，改投递方向时不用从头复制一份文档。",
	"临时需要一份中文 PDF 简历，它帮我节省了很多整理格式的时间。",
	"同一段经历可以根据岗位侧重点改写，不会把原始版本弄丢，版本管理这个思路很实用。",
	"围绕岗位描述补关键词和表达，比单纯套模板更有帮助。",
	"页面干净，功能直接，没有广告和多余干扰。写简历这种事，越少分心越好。",
	"把简历当成一个长期维护的项目，而不是一次性文档，这个思路很适合经常投递和迭代的人。",
];

type TestimonialCardProps = {
	testimonial: string;
};

function TestimonialCard({ testimonial }: TestimonialCardProps) {
	return (
		<m.div
			className="group relative flex w-full flex-col overflow-hidden text-pretty rounded-2xl border bg-card p-4 will-change-transform"
			initial={{ scale: 1, boxShadow: "0 0 20px 0 rgba(0, 0, 0, 0)" }}
			whileHover={{ scale: 1.2, zIndex: 100, boxShadow: "0 0 40px 0 rgba(0, 0, 0, 0.5)" }}
			transition={{ type: "spring", stiffness: 320, damping: 24 }}
		>
			<QuotesIcon
				weight="fill"
				className="absolute -right-2 -bottom-4 size-18 opacity-10 transition-[bottom] duration-200 group-hover:-bottom-16"
			/>
			<p className="flex-1 text-muted-foreground leading-relaxed">{testimonial}</p>
		</m.div>
	);
}

type TestimonialColumnProps = {
	id: string;
	testimonials: string[];
};

function TestimonialColumn({ id, testimonials }: TestimonialColumnProps) {
	return (
		<div className="flex w-[320px] shrink-0 flex-col gap-y-4 sm:w-[360px] md:w-[400px]">
			{testimonials.map((testimonial) => (
				<TestimonialCard key={`${id}-${testimonial}`} testimonial={testimonial} />
			))}
		</div>
	);
}

type TestimonialColumnData = {
	id: string;
	testimonials: string[];
};

type MarqueeMasonryProps = {
	columns: TestimonialColumnData[];
	direction: "left" | "right";
	duration?: number;
};

function MarqueeMasonry({ columns, direction, duration = 30 }: MarqueeMasonryProps) {
	const animateX = direction === "left" ? ["0%", "-50%"] : ["-50%", "0%"];
	const marqueeColumns = columns.flatMap((column) => [
		{ ...column, id: `${column.id}-primary` },
		{ ...column, id: `${column.id}-repeat` },
	]);

	return (
		<m.div
			className="flex items-start gap-x-4 will-change-transform"
			animate={{ x: animateX }}
			transition={{ x: { repeat: Number.POSITIVE_INFINITY, repeatType: "loop", duration, ease: "linear" } }}
		>
			{marqueeColumns.map((column) => (
				<TestimonialColumn key={column.id} id={column.id} testimonials={column.testimonials} />
			))}
		</m.div>
	);
}

export function Testimonials() {
	const columns = useMemo(() => {
		const columns: TestimonialColumnData[] = [];

		for (let index = 0; index < testimonials.length; index += 2) {
			columns.push({ id: `column-${index / 2}`, testimonials: testimonials.slice(index, index + 2) });
		}

		return columns;
	}, []);

	return (
		<section id="testimonials" className="overflow-hidden py-12 md:py-16 xl:py-20">
			<m.div
				className="mb-10 flex flex-col items-center gap-y-4 px-4 text-center md:px-8"
				initial={{ opacity: 0, y: 20 }}
				whileInView={{ opacity: 1, y: 0 }}
				viewport={{ once: true }}
				transition={{ duration: 0.6 }}
			>
				<h2 className="font-semibold text-2xl tracking-tight md:text-4xl xl:text-5xl">
					<Trans>用户反馈</Trans>
				</h2>

				<p className="max-w-4xl text-balance text-muted-foreground leading-relaxed">
					<Trans>来自中文简历编辑、PDF 导出和多岗位投递场景的使用体验，帮助你判断锐历是否适合自己的求职流程。</Trans>
				</p>
			</m.div>

			<div className="relative">
				<div className="pointer-events-none absolute inset-s-0 top-0 bottom-0 z-10 w-16 bg-linear-to-r from-background to-transparent sm:w-24 md:w-32 lg:w-48" />
				<div className="pointer-events-none absolute inset-e-0 top-0 bottom-0 z-10 w-16 bg-linear-to-l from-background to-transparent sm:w-24 md:w-32 lg:w-48" />

				<MarqueeMasonry columns={columns} direction="left" duration={60} />
			</div>
		</section>
	);
}
