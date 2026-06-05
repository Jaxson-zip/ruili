import { Trans } from "@lingui/react/macro";
import { m } from "motion/react";
import { TextMaskEffect } from "@/components/animation/text-mask";

export function Prefooter() {
	return (
		<section id="prefooter" className="relative overflow-hidden py-16 md:py-24">
			{/* Background decoration */}
			<div aria-hidden="true" className="pointer-events-none absolute inset-0">
				<div className="absolute inset-s-1/4 top-0 size-96 rounded-full bg-primary/5 blur-3xl" />
				<div className="absolute inset-e-1/4 bottom-0 size-96 rounded-full bg-primary/5 blur-3xl" />
			</div>

			<div className="relative space-y-8">
				<TextMaskEffect aria-hidden="true" text="锐历" className="hidden md:block" />

				<m.div
					className="mx-auto max-w-3xl space-y-8 px-6 text-center will-change-[transform,opacity] md:px-8 xl:px-0"
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.45 }}
				>
					<h2 className="font-semibold text-2xl tracking-tight md:text-4xl">
						<Trans>从模板工具，走向中文简历优化助手。</Trans>
					</h2>

					<p className="text-muted-foreground leading-relaxed">
						<Trans>
							锐历保留开源简历编辑器的结构化能力，同时把示例、预览、文案和后续 AI
							工作流逐步改成中文求职习惯。下一步可以继续强化岗位匹配、 经历改写、关键词检查和多版本管理。
						</Trans>
					</p>
				</m.div>
			</div>
		</section>
	);
}
