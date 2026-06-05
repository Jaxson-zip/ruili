import { Trans } from "@lingui/react/macro";
import { GithubLogoIcon, InfoIcon } from "@phosphor-icons/react";
import { Button } from "@reactive-resume/ui/components/button";
import { productRepositoryUrl, upstreamLicenseUrl, upstreamRepositoryUrl } from "@/libs/links";
import { SectionBase } from "../shared/section-base";

export function InformationSectionBuilder() {
	return (
		<SectionBase type="information" className="space-y-4">
			<div className="space-y-3 rounded-md border bg-card p-5">
				<div className="flex items-center gap-2">
					<InfoIcon aria-hidden="true" className="size-4 text-primary" />
					<h4 className="font-medium tracking-tight">
						<Trans>关于锐历</Trans>
					</h4>
				</div>

				<div className="space-y-2 text-muted-foreground text-xs leading-normal">
					<p>
						<Trans>锐历面向中文求职场景，提供结构化简历编辑、模板预览、PDF 导出和后续 AI 优化工作流。</Trans>
					</p>
					<p>
						<Trans>本版本基于 MIT 开源项目二次开发，已保留必要的上游项目来源和许可证说明。</Trans>
					</p>
				</div>

				<Button
					size="sm"
					variant="secondary"
					nativeButton={false}
					className="mt-1 whitespace-normal px-4! text-xs"
					render={
						<a href={productRepositoryUrl} target="_blank" rel="noopener noreferrer">
							<GithubLogoIcon />
							<span className="truncate">
								<Trans>查看锐历源码</Trans>
							</span>
						</a>
					}
				/>
			</div>

			<div className="flex flex-wrap gap-0.5">
				<Button
					size="sm"
					variant="link"
					className="text-xs"
					nativeButton={false}
					render={
						<a href={upstreamRepositoryUrl} target="_blank" rel="noopener noreferrer">
							<Trans>上游项目</Trans>
						</a>
					}
				/>

				<Button
					size="sm"
					variant="link"
					className="text-xs"
					nativeButton={false}
					render={
						<a href={upstreamLicenseUrl} target="_blank" rel="noopener noreferrer">
							<Trans>MIT 许可证</Trans>
						</a>
					}
				/>
			</div>
		</SectionBase>
	);
}
