import { Trans } from "@lingui/react/macro";
import { cn } from "@reactive-resume/utils/style";
import { upstreamAuthorUrl, upstreamLicenseUrl, upstreamRepositoryUrl } from "@/libs/links";

type Props = React.ComponentProps<"div">;

export function Copyright({ className, ...props }: Props) {
	return (
		<div className={cn("text-muted-foreground/80 text-xs leading-relaxed", className)} {...props}>
			<p>
				<Trans>锐历基于</Trans>{" "}
				<a
					href={upstreamRepositoryUrl}
					target="_blank"
					rel="noopener noreferrer"
					className="font-medium underline underline-offset-2"
				>
					Reactive Resume
				</a>{" "}
				<Trans>二次开发，原作者</Trans>{" "}
				<a
					target="_blank"
					rel="noopener noreferrer"
					href={upstreamAuthorUrl}
					className="font-medium underline underline-offset-2"
				>
					Amruth Pillai
				</a>
				{" · "}
				<a
					href={upstreamLicenseUrl}
					target="_blank"
					rel="noopener noreferrer"
					className="font-medium underline underline-offset-2"
				>
					MIT
				</a>
			</p>

			<p className="mt-2">
				<Trans comment="App version label in footer; includes semantic version variable">锐历 v{__APP_VERSION__}</Trans>
			</p>
		</div>
	);
}
