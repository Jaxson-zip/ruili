import { t } from "@lingui/core/macro";
import { UserCircleIcon } from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";
import { Separator } from "@reactive-resume/ui/components/separator";
import { ProfileSettingsPage } from "@/features/settings/pages/profile";
import { DashboardHeader } from "../-components/header";

export const Route = createFileRoute("/dashboard/settings/profile")({
	component: RouteComponent,
});

function RouteComponent() {
	const { session } = Route.useRouteContext();

	return (
		<div className="space-y-4">
			<DashboardHeader icon={UserCircleIcon} title={t`个人资料`} />

			<Separator />

			<ProfileSettingsPage session={session} />
		</div>
	);
}
