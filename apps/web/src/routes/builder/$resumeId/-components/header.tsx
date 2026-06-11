import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import {
	CaretDownIcon,
	CopySimpleIcon,
	HouseSimpleIcon,
	LockSimpleIcon,
	LockSimpleOpenIcon,
	PencilSimpleLineIcon,
	SidebarSimpleIcon,
	TrashSimpleIcon,
} from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@reactive-resume/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@reactive-resume/ui/components/dropdown-menu";
import { useDialogStore } from "@/dialogs/store";
import { useCurrentResume, usePatchResume } from "@/features/resume/builder/draft";
import { getSelectedWordTemplate } from "@/features/resume/word-template/library";
import { useConfirm } from "@/hooks/use-confirm";
import { getResumeErrorMessage } from "@/libs/error-message";
import { orpc } from "@/libs/orpc/client";
import { useBuilderSidebar } from "../-store/sidebar";

export function BuilderHeader() {
	const resume = useCurrentResume();
	const selectedWordTemplate = getSelectedWordTemplate(resume.id, resume.data);
	const name = selectedWordTemplate ? resume.data.basics.name.trim() || resume.name : resume.name;
	const templateName = selectedWordTemplate?.name;
	const isLocked = resume.isLocked;
	const toggleSidebar = useBuilderSidebar((state) => state.toggleSidebar);

	return (
		<div className="absolute inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b bg-popover px-1.5">
			<Button size="icon" variant="ghost" onClick={() => toggleSidebar("left")}>
				<SidebarSimpleIcon />
				<span className="sr-only">
					<Trans comment="Screen-reader label for opening or closing the left sidebar in resume builder">
						切换左侧栏
					</Trans>
				</span>
			</Button>

			<div className="flex items-center gap-x-1">
				<Button
					size="icon"
					variant="ghost"
					aria-label={t({
						comment: "Accessible label for button navigating from builder to resumes dashboard",
						message: "返回简历列表",
					})}
					nativeButton={false}
					render={
						<Link to="/dashboard/resumes" search={{ sort: "lastUpdatedAt", tags: [] }}>
							<HouseSimpleIcon />
						</Link>
					}
				/>
				<span className="me-2.5 text-muted-foreground">/</span>
				<div className="flex min-w-0 items-center gap-2">
					<h2 className="truncate font-medium">{name}</h2>
					{templateName ? (
						<span className="hidden max-w-[14rem] truncate text-muted-foreground text-xs sm:inline">
							{templateName}
						</span>
					) : null}
				</div>
				{isLocked && <LockSimpleIcon className="ms-2 text-muted-foreground" />}
				<BuilderHeaderDropdown />
			</div>

			<div className="flex items-center gap-1">
				<Button size="icon" variant="ghost" onClick={() => toggleSidebar("right")}>
					<SidebarSimpleIcon className="-scale-x-100" />
					<span className="sr-only">
						<Trans comment="Screen-reader label for opening or closing the right sidebar in resume builder">
							切换右侧栏
						</Trans>
					</span>
				</Button>
			</div>
		</div>
	);
}

function BuilderHeaderDropdown() {
	const confirm = useConfirm();
	const navigate = useNavigate();
	const { openDialog } = useDialogStore();

	const resume = useCurrentResume();
	const patchResume = usePatchResume();
	const id = resume.id;
	const name = resume.name;
	const slug = resume.slug;
	const tags = resume.tags;
	const isLocked = resume.isLocked;

	const { mutate: deleteResume } = useMutation(orpc.resume.delete.mutationOptions());
	const { mutate: setLockedResume } = useMutation(orpc.resume.setLocked.mutationOptions());

	const handleUpdate = () => {
		openDialog("resume.update", { id, name, slug, tags });
	};

	const handleDuplicate = () => {
		openDialog("resume.duplicate", { id, name, slug, tags, shouldRedirect: true });
	};

	const handleToggleLock = async () => {
		if (!isLocked) {
			const confirmation = await confirm(t`确定要锁定这份简历吗？`, {
				description: t`锁定后，这份简历将无法更新或删除。`,
			});

			if (!confirmation) return;
		}

		setLockedResume(
			{ id, isLocked: !isLocked },
			{
				onSuccess: () => {
					patchResume((draft) => {
						draft.isLocked = !isLocked;
					});
				},
				onError: (error) => {
					toast.error(getResumeErrorMessage(error));
				},
			},
		);
	};

	const handleDelete = async () => {
		const confirmation = await confirm(t`确定要删除这份简历吗？`, {
			description: t`此操作无法撤销。`,
		});

		if (!confirmation) return;

		const toastId = toast.loading(t`正在删除简历...`);

		deleteResume(
			{ id },
			{
				onSuccess: () => {
					toast.success(t`简历已删除。`, { id: toastId });
					void navigate({ to: "/dashboard/resumes", search: { sort: "lastUpdatedAt", tags: [] } });
				},
				onError: (error) => {
					toast.error(getResumeErrorMessage(error), { id: toastId });
				},
			},
		);
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button size="icon" variant="ghost">
						<CaretDownIcon />
					</Button>
				}
			/>

			<DropdownMenuContent>
				<DropdownMenuItem disabled={isLocked} onClick={handleUpdate}>
					<PencilSimpleLineIcon className="me-2" />
					<Trans>编辑</Trans>
				</DropdownMenuItem>

				<DropdownMenuItem onClick={handleDuplicate}>
					<CopySimpleIcon className="me-2" />
					<Trans>复制</Trans>
				</DropdownMenuItem>

				<DropdownMenuItem onClick={handleToggleLock}>
					{isLocked ? <LockSimpleOpenIcon className="me-2" /> : <LockSimpleIcon className="me-2" />}
					{isLocked ? <Trans>解锁</Trans> : <Trans>锁定</Trans>}
				</DropdownMenuItem>

				<DropdownMenuSeparator />

				<DropdownMenuItem variant="destructive" disabled={isLocked} onClick={handleDelete}>
					<TrashSimpleIcon className="me-2" />
					<Trans>删除</Trans>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
