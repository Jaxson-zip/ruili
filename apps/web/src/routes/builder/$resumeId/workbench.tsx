import { createFileRoute } from "@tanstack/react-router";
import { useCurrentResume } from "@/features/resume/builder/draft";
import { WorkbenchShell } from "@/features/resume/workbench/workbench-shell";

export const Route = createFileRoute("/builder/$resumeId/workbench")({
	component: WorkbenchRoute,
});

function WorkbenchRoute() {
	const resume = useCurrentResume();
	return <WorkbenchShell resume={resume} />;
}
