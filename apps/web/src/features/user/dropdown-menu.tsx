import type { AuthSession } from "@reactive-resume/auth/types";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { PaletteIcon, SignOutIcon } from "@phosphor-icons/react";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { useIsClient } from "usehooks-ts";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@reactive-resume/ui/components/dropdown-menu";
import { useTheme } from "@/features/theme/provider";
import { authClient } from "@/libs/auth/client";
import { getReadableErrorMessage } from "@/libs/error-message";
import { isTheme } from "@/libs/theme";

type Props = {
	children: ({ session }: { session: AuthSession }) => React.ComponentProps<typeof DropdownMenuTrigger>["render"];
};

export function UserDropdownMenu({ children }: Props) {
	const isClient = useIsClient();
	const router = useRouter();
	const { theme, setTheme } = useTheme();
	const { data: session } = authClient.useSession();

	const handleThemeChange = (value: string) => {
		if (!isTheme(value)) return;
		setTheme(value);
	};

	const handleLogout = async () => {
		const toastId = toast.loading(t`Signing out...`);

		await authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					toast.dismiss(toastId);
					void router.invalidate();
				},
				onError: ({ error }) => {
					toast.error(
						getReadableErrorMessage(
							error,
							t({
								comment: "Fallback toast when signing out fails",
								message: "Failed to sign out. Please try again.",
							}),
						),
						{ id: toastId },
					);
				},
			},
		});
	};

	if (!isClient) return null;
	if (!session?.user) return null;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger render={children({ session: session as AuthSession })} />

			<DropdownMenuContent align="start" side="top">
				<DropdownMenuGroup>
					<DropdownMenuSub>
						<DropdownMenuSubTrigger>
							<PaletteIcon />
							<Trans comment="Menu item that opens appearance theme selection submenu">主题</Trans>
						</DropdownMenuSubTrigger>
						<DropdownMenuSubContent>
							<DropdownMenuRadioGroup value={theme} onValueChange={handleThemeChange}>
								<DropdownMenuRadioItem value="light">
									<Trans comment="Appearance theme option for light mode">浅色</Trans>
								</DropdownMenuRadioItem>
								<DropdownMenuRadioItem value="dark">
									<Trans comment="Appearance theme option for dark mode">深色</Trans>
								</DropdownMenuRadioItem>
							</DropdownMenuRadioGroup>
						</DropdownMenuSubContent>
					</DropdownMenuSub>
				</DropdownMenuGroup>

				<DropdownMenuSeparator />

				<DropdownMenuItem onClick={handleLogout}>
					<SignOutIcon />
					<Trans comment="User menu action to sign out of current account">退出登录</Trans>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
