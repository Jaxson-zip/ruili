import { Trans } from "@lingui/react/macro";
import { PaletteIcon } from "@phosphor-icons/react";
import { CommandItem } from "@reactive-resume/ui/components/command";
import { useCommandPaletteStore } from "../../store";
import { BaseCommandGroup } from "../base";
import { ThemeCommandPage } from "./theme";

export function PreferencesCommandGroup() {
	const pushPage = useCommandPaletteStore((state) => state.pushPage);

	return (
		<>
			<BaseCommandGroup heading={<Trans>偏好设置</Trans>}>
				<CommandItem onSelect={() => pushPage("theme")}>
					<PaletteIcon />
					<Trans>切换主题…</Trans>
				</CommandItem>
			</BaseCommandGroup>

			<ThemeCommandPage />
		</>
	);
}
