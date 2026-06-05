import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { ArrowRightIcon, GithubLogoIcon, SparkleIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { m } from "motion/react";
import { Badge } from "@reactive-resume/ui/components/badge";
import { Button } from "@reactive-resume/ui/components/button";
import { CometCard } from "@/components/animation/comet-card";
import { Spotlight } from "@/components/animation/spotlight";
import { productRepositoryUrl } from "@/libs/links";

export function Hero() {
	return (
		<section
			id="hero"
			className="relative flex min-h-svh w-full flex-col items-center justify-center overflow-hidden border-b py-24"
		>
			<Spotlight />

			<m.div
				className="will-change-[transform,opacity]"
				initial={{ opacity: 0, y: 100 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 1.1, ease: "easeOut" }}
			>
				<CometCard glareOpacity={0} className="relative -mb-12 3xl:max-w-7xl max-w-4xl px-8 md:-mb-24 md:px-12 lg:px-0">
					<img
						src="/videos/timelapse-cn.svg"
						alt={t`使用锐历编辑中文简历的动态演示`}
						className="pointer-events-none size-full rounded-md border object-cover"
					/>

					<div
						aria-hidden="true"
						className="pointer-events-none absolute inset-0 bg-linear-to-b from-transparent via-40% via-transparent to-background"
					/>
				</CometCard>
			</m.div>

			<div className="relative z-10 flex max-w-2xl flex-col items-center gap-y-6 px-4 xs:px-0 text-center">
				<m.div
					className="will-change-[transform,opacity]"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.45, delay: 0.55 }}
				>
					<Badge variant="secondary" className="h-auto gap-1.5 px-3 py-0.5">
						<SparkleIcon aria-hidden="true" className="size-3.5" weight="fill" />
						<Trans>中文简历生成与优化工作台</Trans>
					</Badge>
				</m.div>

				<m.div
					className="will-change-[transform,opacity]"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.45, delay: 0.7 }}
				>
					<Trans>
						<p className="font-medium text-muted-foreground tracking-tight md:text-lg">终于，</p>
						<h1 className="mt-1 font-semibold text-4xl tracking-tight md:text-5xl lg:text-6xl">
							一款更懂中文求职的简历工作台
						</h1>
					</Trans>
				</m.div>

				<m.p
					className="max-w-xl text-base text-muted-foreground leading-relaxed will-change-[transform,opacity] md:text-lg"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.45, delay: 0.82 }}
				>
					<Trans>
						锐历把简历编辑、模板排版、PDF 导出和 AI 优化放在同一个工作流里，适合中文求职者长期维护不同岗位版本。
					</Trans>
				</m.p>

				<m.div
					className="flex flex-col items-center gap-3 will-change-[transform,opacity] sm:flex-row sm:gap-4"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.45, delay: 0.95 }}
				>
					<Button
						size="lg"
						nativeButton={false}
						className="group relative overflow-hidden px-4"
						render={
							<Link to="/dashboard">
								<span className="relative z-10 flex items-center gap-2">
									<Trans>开始使用</Trans>
									<ArrowRightIcon
										aria-hidden="true"
										className="size-4 transition-transform group-hover:translate-x-0.5"
									/>
								</span>
							</Link>
						}
					/>

					<Button
						size="lg"
						variant="ghost"
						className="gap-2 px-4"
						nativeButton={false}
						render={
							<a href={productRepositoryUrl} target="_blank" rel="noopener noreferrer">
								<GithubLogoIcon aria-hidden="true" className="size-4" />
								<Trans>查看源码</Trans>
								<span className="sr-only">
									<Trans>（在新标签页打开）</Trans>
								</span>
							</a>
						}
					/>
				</m.div>
			</div>

			<m.div
				aria-hidden="true"
				role="presentation"
				className="absolute inset-s-1/2 bottom-8 -translate-x-1/2"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 1.25, duration: 0.7 }}
			>
				<m.div
					className="flex h-8 w-5 items-start justify-center rounded-full border border-muted-foreground/30 p-1.5 will-change-transform"
					animate={{ y: [0, 5, 0] }}
					transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
				>
					<m.div className="h-1.5 w-1 rounded-full bg-muted-foreground/50" />
				</m.div>
			</m.div>
		</section>
	);
}
