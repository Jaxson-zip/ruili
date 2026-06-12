import type { SectionType } from "@reactive-resume/schema/resume/data";
import { t } from "@lingui/core/macro";
import { Plural, Trans } from "@lingui/react/macro";
import {
	BroomIcon,
	ColumnsIcon,
	EyeClosedIcon,
	EyeIcon,
	ListIcon,
	PencilSimpleLineIcon,
	PlusIcon,
} from "@phosphor-icons/react";
import { Button } from "@reactive-resume/ui/components/button";
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
import { useDialogStore } from "@/dialogs/store";
import { useCurrentResume, useUpdateResumeData } from "@/features/resume/builder/draft";
import { getSelectedWordTemplate } from "@/features/resume/word-template/library";
import { useConfirm } from "@/hooks/use-confirm";
import { usePrompt } from "@/hooks/use-prompt";

type Props = {
	type: "summary" | SectionType;
};

export function SectionDropdownMenu({ type }: Props) {
	const prompt = usePrompt();
	const confirm = useConfirm();
	const { openDialog } = useDialogStore();

	const updateResumeData = useUpdateResumeData();
	const resume = useCurrentResume();
	const section = type === "summary" ? resume.data.summary : resume.data.sections[type];
	const selectedWordTemplate = getSelectedWordTemplate(resume.id, resume.data);

	const onAddItem = () => {
		if (type === "summary") return;
		openDialog(`resume.sections.${type}.create`, undefined);
	};

	const onToggleVisibility = () => {
		updateResumeData((draft) => {
			if (type === "summary") {
				draft.summary.hidden = !draft.summary.hidden;
			} else {
				draft.sections[type].hidden = !draft.sections[type].hidden;
			}
		});
	};

	const onRenameSection = async () => {
		const newTitle = await prompt(t`你想把这个模块重命名为什么？`, {
			description: t`留空即可恢复为原始标题。`,
			defaultValue: section.title,
		});

		if (newTitle === null || newTitle === section.title) return;

		updateResumeData((draft) => {
			if (type === "summary") {
				draft.summary.title = newTitle ?? "";
			} else {
				draft.sections[type].title = newTitle ?? "";
			}
		});
	};

	const onSetColumns = (value: string) => {
		updateResumeData((draft) => {
			if (type === "summary") {
				draft.summary.columns = Number.parseInt(value, 10);
			} else {
				draft.sections[type].columns = Number.parseInt(value, 10);
			}
		});
	};

	const onReset = async () => {
		const confirmed = await confirm(t`确定要重置这个模块吗？`, {
			description: t`这会移除该模块中的所有条目。`,
			confirmText: t({
				comment: "Destructive confirmation button label when resetting a resume section",
				message: "重置",
			}),
			cancelText: t({
				comment: "Confirmation dialog button label to abort resetting a resume section",
				message: "取消",
			}),
		});

		if (!confirmed) return;

		updateResumeData((draft) => {
			if (type === "summary") {
				draft.summary.content = "";
			} else {
				draft.sections[type].items = [];
			}
		});
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button size="icon" variant="ghost" aria-label={t`模块操作`}>
						<ListIcon />
					</Button>
				}
			/>

			<DropdownMenuContent align="end">
				{type !== "summary" && (
					<>
						<DropdownMenuGroup>
							<DropdownMenuItem onClick={onAddItem}>
								<PlusIcon />
								<Trans>添加新条目</Trans>
							</DropdownMenuItem>
						</DropdownMenuGroup>

						<DropdownMenuSeparator />
					</>
				)}

				<DropdownMenuGroup>
					<DropdownMenuItem onClick={onToggleVisibility}>
						{section.hidden ? <EyeIcon /> : <EyeClosedIcon />}
						{section.hidden ? <Trans>显示</Trans> : <Trans>隐藏</Trans>}
					</DropdownMenuItem>

					{selectedWordTemplate ? null : (
						<DropdownMenuItem onClick={onRenameSection}>
							<PencilSimpleLineIcon />
							<Trans>重命名</Trans>
						</DropdownMenuItem>
					)}

					{selectedWordTemplate ? null : (
						<DropdownMenuSub>
							<DropdownMenuSubTrigger>
								<ColumnsIcon />
								<Trans>栏数</Trans>
							</DropdownMenuSubTrigger>

							<DropdownMenuSubContent>
								<DropdownMenuRadioGroup value={section.columns.toString()} onValueChange={onSetColumns}>
									{[1, 2, 3, 4, 5, 6].map((column) => (
										<DropdownMenuRadioItem key={column} value={column.toString()}>
											<Plural value={column} one="# 栏" other="# 栏" />
										</DropdownMenuRadioItem>
									))}
								</DropdownMenuRadioGroup>
							</DropdownMenuSubContent>
						</DropdownMenuSub>
					)}
				</DropdownMenuGroup>

				<DropdownMenuSeparator />

				<DropdownMenuGroup>
					<DropdownMenuItem variant="destructive" onClick={onReset}>
						<BroomIcon />
						<Trans>重置</Trans>
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
