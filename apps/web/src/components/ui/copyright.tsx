import { Trans } from "@lingui/react/macro";
import { cn } from "@reactive-resume/utils/style";
import { upstreamAuthorUrl, upstreamLicenseUrl, upstreamRepositoryUrl } from "@/libs/links";

type Props = React.ComponentProps<"div">;

export function Copyright({ className, ...props }: Props) {
	return (
		<div className={cn("text-muted-foreground/80 text-xs leading-relaxed", className)} {...props}>
			<p>
				<Trans>
					锐历是基于{" "}
					<a
						href={upstreamRepositoryUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="font-medium underline underline-offset-2"
					>
						Reactive Resume
					</a>{" "}
					二次开发的中文简历产品改造，原项目作者为{" "}
					<a
						target="_blank"
						rel="noopener noreferrer"
						href={upstreamAuthorUrl}
						className="font-medium underline underline-offset-2"
					>
						Amruth Pillai
					</a>
					。
				</Trans>
			</p>

			<p>
				<Trans>
					上游项目遵循{" "}
					<a
						href={upstreamLicenseUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="font-medium underline underline-offset-2"
					>
						MIT
					</a>{" "}
					许可证，本项目保留原版权与许可证声明。
				</Trans>
			</p>

			<p className="mt-4">
				<Trans comment="App version label in footer; includes semantic version variable">锐历 v{__APP_VERSION__}</Trans>
			</p>
		</div>
	);
}
