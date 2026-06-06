import { Trans } from "@lingui/react/macro";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { m } from "motion/react";
import { TextMaskEffect } from "@/components/animation/text-mask";

export function Prefooter() {
	return (
		<section id="prefooter" className="relative overflow-hidden py-16 md:py-24">
			<div className="relative space-y-8">
				<TextMaskEffect aria-hidden="true" text="锐历" className="hidden md:block" />

				<m.div
					className="mx-auto max-w-3xl space-y-6 px-6 text-center will-change-[transform,opacity] md:px-8 xl:px-0"
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.45 }}
				>
					<h2 className="font-semibold text-2xl tracking-tight md:text-4xl">
						<Trans>从一份能投递的中文简历开始</Trans>
					</h2>

					<p className="text-muted-foreground leading-relaxed">
						<Trans>选择一份完整样张，替换成自己的经历，确认预览后导出 PDF。后续再按不同岗位复制版本。</Trans>
					</p>

					<a
						href="/auth/login"
						className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-medium text-primary-foreground text-sm transition-colors hover:bg-primary/90"
					>
						<Trans>开始创建简历</Trans>
						<ArrowRightIcon />
					</a>
				</m.div>
			</div>
		</section>
	);
}
