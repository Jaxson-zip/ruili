import type { NotFoundRouteProps } from "@tanstack/react-router";
import { Trans } from "@lingui/react/macro";
import { ArrowLeftIcon, WarningIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { Alert, AlertDescription, AlertTitle } from "@reactive-resume/ui/components/alert";
import { BrandIcon } from "@reactive-resume/ui/components/brand-icon";
import { buttonVariants } from "@reactive-resume/ui/components/button";

export function NotFoundScreen({ routeId }: NotFoundRouteProps) {
	return (
		<div className="mx-auto flex h-svh max-w-md flex-col items-center justify-center gap-y-4">
			<BrandIcon variant="logo" className="size-12" />

			<Alert>
				<WarningIcon />
				<AlertTitle>
					<Trans>页面加载时出现错误。</Trans>
				</AlertTitle>
				<AlertDescription>{routeId}</AlertDescription>
			</Alert>

			<Link to=".." className={buttonVariants()}>
				<ArrowLeftIcon />
				<Trans>返回</Trans>
			</Link>
		</div>
	);
}
