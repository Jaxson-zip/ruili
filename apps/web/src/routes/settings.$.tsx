import { createFileRoute, redirect } from "@tanstack/react-router";

const settingsRedirectTargets = new Set([
	"api-keys",
	"authentication",
	"danger-zone",
	"integrations",
	"job-search",
	"preferences",
	"profile",
]);

export const Route = createFileRoute("/settings/$")({
	beforeLoad: ({ params }) => {
		const segment = params._splat?.split("/")[0] ?? "profile";
		const target = settingsRedirectTargets.has(segment) ? segment : "profile";

		throw redirect({ to: `/dashboard/settings/${target}`, replace: true });
	},
});
