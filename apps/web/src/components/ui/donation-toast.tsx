import { Trans } from "@lingui/react/macro";
import { GithubLogoIcon } from "@phosphor-icons/react";
import { useCallback } from "react";
import { toast } from "sonner";
import { useTimeout } from "usehooks-ts";
import { Button } from "@reactive-resume/ui/components/button";
import { useCookie } from "@reactive-resume/ui/hooks/use-cookie";
import { productRepositoryUrl } from "@/libs/links";

const TOAST_ID = "source-toast";
const SHOW_TOAST_DELAY_MS = 5 * 60 * 1000;
const DISMISSED_COOKIE_NAME = "source-toast-dismissed";
const DISMISSED_COOKIE_EXPIRES_MS = 30 * 24 * 60 * 60 * 1000;

const getDismissedCookieExpiresAt = () => new Date(Date.now() + DISMISSED_COOKIE_EXPIRES_MS);

export function DonationToast() {
	const [dismissed, setDismissed] = useCookie(DISMISSED_COOKIE_NAME);

	const showToast = useCallback(() => {
		if (dismissed === "true") return;

		const onOpenSource = (t: string | number) => {
			toast.dismiss(t);
			setDismissed("true", { expires: getDismissedCookieExpiresAt() });
			window.open(productRepositoryUrl, "_blank", "noopener,noreferrer");
		};

		const onDismiss = (t: string | number) => {
			toast.dismiss(t);
			setDismissed("true", { expires: getDismissedCookieExpiresAt() });
		};

		toast.custom((t) => <SourceToastCard onDismiss={() => onDismiss(t)} onOpenSource={() => onOpenSource(t)} />, {
			id: TOAST_ID,
			unstyled: true,
			dismissible: false,
			duration: Number.POSITIVE_INFINITY,
		});
	}, [dismissed, setDismissed]);

	useTimeout(showToast, SHOW_TOAST_DELAY_MS);

	return null;
}

type SourceToastCardProps = {
	onDismiss: () => void;
	onOpenSource: () => void;
};

function SourceToastCard({ onDismiss, onOpenSource }: SourceToastCardProps) {
	return (
		<div className="w-sm rounded-md bg-popover p-4 shadow-xl">
			<div className="flex items-start gap-3">
				<div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
					<GithubLogoIcon aria-hidden="true" />
				</div>

				<div className="min-w-0 flex-1 space-y-1">
					<p className="font-semibold text-sm tracking-tight">
						<Trans>锐历源码已开放</Trans>
					</p>
					<p className="text-pretty text-muted-foreground text-xs">
						<Trans>这是一个中文简历产品二开项目，你可以查看源码、继续改造或作为作品集案例展示。</Trans>
					</p>
				</div>
			</div>

			<div className="mt-4 grid grid-cols-2 gap-2">
				<Button size="sm" variant="outline" onClick={onDismiss}>
					<Trans>关闭</Trans>
				</Button>
				<Button size="sm" onClick={onOpenSource}>
					<Trans>查看锐历源码</Trans>
				</Button>
			</div>
		</div>
	);
}
