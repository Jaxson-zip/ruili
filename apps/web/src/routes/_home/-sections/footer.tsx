import type { Icon } from "@phosphor-icons/react";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { GithubLogoIcon } from "@phosphor-icons/react";
import { m } from "motion/react";
import { useState } from "react";
import { BrandIcon } from "@reactive-resume/ui/components/brand-icon";
import { Button } from "@reactive-resume/ui/components/button";
import { Copyright } from "@/components/ui/copyright";
import { productRepositoryUrl, upstreamLicenseUrl, upstreamRepositoryUrl } from "@/libs/links";

type FooterLinkItem = {
	url: string;
	label: string;
};

type FooterLinkGroupProps = {
	title: string;
	links: FooterLinkItem[];
};

type SocialLink = {
	url: string;
	label: string;
	icon: Icon;
};

const getProductLinks = (): FooterLinkItem[] => [
	{ url: productRepositoryUrl, label: t`项目源码` },
	{ url: "/dashboard", label: t`开始使用` },
	{ url: "#templates", label: t`模板预览` },
	{ url: "#frequently-asked-questions", label: t`常见问题` },
];

const getLegalLinks = (): FooterLinkItem[] => [
	{ url: "/privacy", label: t`隐私与数据处理` },
	{ url: upstreamRepositoryUrl, label: t`上游开源项目` },
	{ url: upstreamLicenseUrl, label: t`MIT 许可证` },
];

const socialLinks: SocialLink[] = [{ url: productRepositoryUrl, label: t`GitHub`, icon: GithubLogoIcon }];

export function Footer() {
	return (
		<m.footer
			id="footer"
			className="p-4 pb-8 will-change-[opacity] md:p-8 md:pb-12"
			initial={{ opacity: 0 }}
			whileInView={{ opacity: 1 }}
			viewport={{ once: true }}
			transition={{ duration: 0.45 }}
		>
			<div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
				<div className="space-y-4 sm:col-span-2 lg:col-span-1">
					<BrandIcon variant="logo" className="size-10" />

					<div className="space-y-2">
						<h2 className="font-semibold text-lg tracking-tight">锐历</h2>
						<p className="max-w-xs text-muted-foreground text-sm leading-relaxed">
							<Trans>面向中文求职场景的简历生成与优化工作台，支持结构化编辑、模板排版、PDF 导出和 AI 辅助优化。</Trans>
						</p>
					</div>

					<div className="flex items-center gap-2 pt-2">
						{socialLinks.map((social) => (
							<Button
								key={social.label}
								size="icon-sm"
								variant="ghost"
								nativeButton={false}
								render={
									<a
										href={social.url}
										target="_blank"
										rel="noopener noreferrer"
										aria-label={`${social.label} (${t`在新标签页打开`})`}
									>
										<social.icon aria-hidden="true" size={18} />
									</a>
								}
							/>
						))}
					</div>
				</div>

				<FooterLinkGroup title={t`产品`} links={getProductLinks()} />

				<FooterLinkGroup title={t`开源说明`} links={getLegalLinks()} />

				<div className="space-y-4 sm:col-span-2 lg:col-span-1">
					<Copyright />
				</div>
			</div>
		</m.footer>
	);
}

function FooterLinkGroup({ title, links }: FooterLinkGroupProps) {
	return (
		<div className="space-y-4">
			<h2 className="font-medium text-muted-foreground text-sm tracking-tight">{title}</h2>

			<ul className="space-y-3">
				{links.map((link) => (
					<FooterLink key={link.url} url={link.url} label={link.label} />
				))}
			</ul>
		</div>
	);
}

function FooterLink({ url, label }: FooterLinkItem) {
	const [isHovered, setIsHovered] = useState(false);
	const isExternal = url.startsWith("http");

	return (
		<li className="relative">
			<a
				href={url}
				target={isExternal ? "_blank" : undefined}
				rel={isExternal ? "noopener noreferrer" : undefined}
				className="relative inline-block text-sm transition-colors hover:text-foreground"
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
			>
				{label}

				{isExternal && (
					<span className="sr-only">
						<Trans>（在新标签页打开）</Trans>
					</span>
				)}

				<m.div
					aria-hidden="true"
					initial={{ width: 0, opacity: 0 }}
					animate={isHovered ? { width: "100%", opacity: 1 } : { width: 0, opacity: 0 }}
					transition={{ duration: 0.2, ease: "easeOut" }}
					className="pointer-events-none absolute inset-s-0 -bottom-0.5 h-px rounded-md bg-primary will-change-[width,opacity]"
				/>
			</a>
		</li>
	);
}
