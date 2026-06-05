import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import {
	ChatCircleDotsIcon,
	GearIcon,
	HouseSimpleIcon,
	KeyIcon,
	OpenAiLogoIcon,
	ReadCvLogoIcon,
	ShieldCheckIcon,
	UserCircleIcon,
	WarningIcon,
} from "@phosphor-icons/react";
import { useNavigate, useRouteContext } from "@tanstack/react-router";
import { CommandItem } from "@reactive-resume/ui/components/command";
import { useCommandPaletteStore } from "../store";
import { BaseCommandGroup } from "./base";

export function NavigationCommandGroup() {
	const navigate = useNavigate();
	const { session } = useRouteContext({ strict: false });
	const reset = useCommandPaletteStore((state) => state.reset);
	const pushPage = useCommandPaletteStore((state) => state.pushPage);

	const onNavigate = async (path: string) => {
		await navigate({ to: path });
		reset();
	};

	return (
		<>
			<BaseCommandGroup heading={<Trans>跳转到...</Trans>}>
				<CommandItem keywords={[t`首页`]} value="navigation.home" onSelect={() => onNavigate("/")}>
					<HouseSimpleIcon />
					<Trans>首页</Trans>
				</CommandItem>

				<CommandItem
					disabled={!session}
					keywords={[t`我的简历`, t`Resumes`]}
					value="navigation.resumes"
					onSelect={() => onNavigate("/dashboard/resumes")}
				>
					<ReadCvLogoIcon />
					<Trans>我的简历</Trans>
				</CommandItem>

				<CommandItem
					disabled={!session}
					keywords={[t`AI Agent`, t`Agent`, t`大模型助手`]}
					value="navigation.agent"
					onSelect={() => onNavigate("/agent")}
				>
					<ChatCircleDotsIcon />
					<Trans>AI 助手</Trans>
				</CommandItem>

				<CommandItem
					disabled={!session}
					keywords={[t`设置`, t`Settings`]}
					value="navigation.settings"
					onSelect={() => pushPage("settings")}
				>
					<GearIcon />
					<Trans>设置</Trans>
				</CommandItem>
			</BaseCommandGroup>

			<BaseCommandGroup page="settings" heading={<Trans>设置</Trans>}>
				<CommandItem
					keywords={[t`个人资料`, t`Profile`]}
					value="navigation.settings.profile"
					onSelect={() => onNavigate("/dashboard/settings/profile")}
				>
					<UserCircleIcon />
					<Trans>个人资料</Trans>
				</CommandItem>

				<CommandItem
					keywords={[t`偏好设置`, t`Preferences`]}
					value="navigation.settings.preferences"
					onSelect={() => onNavigate("/dashboard/settings/preferences")}
				>
					<GearIcon />
					<Trans>偏好设置</Trans>
				</CommandItem>

				<CommandItem
					keywords={[t`账号安全`, t`Authentication`]}
					value="navigation.settings.authentication"
					onSelect={() => onNavigate("/dashboard/settings/authentication")}
				>
					<ShieldCheckIcon />
					<Trans>账号安全</Trans>
				</CommandItem>

				<CommandItem
					keywords={[t`API Key`, t`API 密钥`]}
					value="navigation.settings.api-keys"
					onSelect={() => onNavigate("/dashboard/settings/api-keys")}
				>
					<KeyIcon />
					<Trans>API 密钥</Trans>
				</CommandItem>

				<CommandItem
					keywords={[t`AI 服务商`, t`Provider`, t`大模型配置`]}
					value="navigation.settings.integrations"
					onSelect={() => onNavigate("/dashboard/settings/integrations")}
				>
					<OpenAiLogoIcon />
					<span>AI 服务商</span>
				</CommandItem>

				<CommandItem
					keywords={[t`危险操作`, t`Danger Zone`]}
					value="navigation.settings.danger-zone"
					onSelect={() => onNavigate("/dashboard/settings/danger-zone")}
				>
					<WarningIcon />
					<Trans>危险操作</Trans>
				</CommandItem>
			</BaseCommandGroup>
		</>
	);
}
