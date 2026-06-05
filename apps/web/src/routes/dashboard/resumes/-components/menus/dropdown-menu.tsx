import type { RouterOutput } from "@/libs/orpc/client";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import {
	CopySimpleIcon,
	FolderOpenIcon,
	LockSimpleIcon,
	LockSimpleOpenIcon,
	PencilSimpleLineIcon,
	SparkleIcon,
	TrashSimpleIcon,
} from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@reactive-resume/ui/components/dropdown-menu";
import { useDialogStore } from "@/dialogs/store";
import { useConfirm } from "@/hooks/use-confirm";
import { getResumeErrorMessage } from "@/libs/error-message";
import { orpc } from "@/libs/orpc/client";

type Props = Omit<React.ComponentProps<typeof DropdownMenuContent>, "children"> & {
	resume: RouterOutput["resume"]["list"][number];
	children: React.ComponentProps<typeof DropdownMenuTrigger>["render"];
};

export function ResumeDropdownMenu({ resume, children, ...props }: Props) {
	const confirm = useConfirm();
	const { openDialog } = useDialogStore();

	const { mutate: deleteResume } = useMutation(orpc.resume.delete.mutationOptions());
	const { mutate: setLockedResume } = useMutation(orpc.resume.setLocked.mutationOptions());

	const handleUpdate = () => {
		openDialog("resume.update", resume);
	};

	const handleDuplicate = () => {
		openDialog("resume.duplicate", resume);
	};

	const handleToggleLock = async () => {
		if (!resume.isLocked) {
			const confirmation = await confirm(t`确认锁定这份简历？`, {
				description: t`锁定后，这份简历不能继续编辑或删除。`,
			});

			if (!confirmation) return;
		}

		setLockedResume(
			{ id: resume.id, isLocked: !resume.isLocked },
			{
				onError: (error) => {
					toast.error(getResumeErrorMessage(error));
				},
			},
		);
	};

	const handleDelete = async () => {
		const confirmation = await confirm(t`确认删除这份简历？`, {
			description: t`删除后无法恢复。`,
		});

		if (!confirmation) return;

		const toastId = toast.loading(t`正在删除简历...`);

		deleteResume(
			{ id: resume.id },
			{
				onSuccess: () => {
					toast.success(t`简历已删除。`, { id: toastId });
				},
				onError: (error) => {
					toast.error(getResumeErrorMessage(error), { id: toastId });
				},
			},
		);
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger render={children} />

			<DropdownMenuContent {...props}>
				<Link to="/builder/$resumeId" params={{ resumeId: resume.id }}>
					<DropdownMenuItem>
						<FolderOpenIcon />
						<Trans comment="Resume card dropdown action to open the resume editor">打开编辑</Trans>
					</DropdownMenuItem>
				</Link>

				<Link to="/builder/$resumeId/workbench" params={{ resumeId: resume.id }}>
					<DropdownMenuItem>
						<SparkleIcon />
						<Trans comment="Resume card dropdown action to open AI resume check">AI 检查</Trans>
					</DropdownMenuItem>
				</Link>

				<DropdownMenuSeparator />

				<DropdownMenuItem disabled={resume.isLocked} onClick={handleUpdate}>
					<PencilSimpleLineIcon />
					<Trans comment="Resume card dropdown action to edit resume metadata">修改信息</Trans>
				</DropdownMenuItem>

				<DropdownMenuItem onClick={handleDuplicate}>
					<CopySimpleIcon />
					<Trans comment="Resume card dropdown action to create a copy">复制简历</Trans>
				</DropdownMenuItem>

				<DropdownMenuItem onClick={handleToggleLock}>
					{resume.isLocked ? <LockSimpleOpenIcon /> : <LockSimpleIcon />}
					{resume.isLocked ? (
						<Trans comment="Resume card dropdown action to remove edit lock">解锁</Trans>
					) : (
						<Trans comment="Resume card dropdown action to prevent edits">锁定</Trans>
					)}
				</DropdownMenuItem>

				<DropdownMenuSeparator />

				<DropdownMenuItem variant="destructive" disabled={resume.isLocked} onClick={handleDelete}>
					<TrashSimpleIcon />
					<Trans comment="Resume card dropdown destructive action to remove a resume">删除</Trans>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
