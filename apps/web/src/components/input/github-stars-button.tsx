import { t } from "@lingui/core/macro";
import { GithubLogoIcon } from "@phosphor-icons/react";
import { Button } from "@reactive-resume/ui/components/button";
import { productRepositoryUrl } from "@/libs/links";

export function GithubStarsButton() {
	return (
		<Button
			variant="outline"
			nativeButton={false}
			render={
				<a
					target="_blank"
					href={productRepositoryUrl}
					aria-label={t`查看锐历源码（在新标签页打开）`}
					rel="noopener noreferrer"
				>
					<GithubLogoIcon aria-hidden="true" />
					<span className="font-medium text-sm">GitHub</span>
				</a>
			}
		/>
	);
}
