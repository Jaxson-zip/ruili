import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { useIsClient } from "usehooks-ts";
import { sampleResumeData } from "@reactive-resume/schema/resume/sample";
import { templateSchema } from "@reactive-resume/schema/templates";
import { useLocalizedResumeDocument } from "@/features/resume/export/pdf-document";
import { createNoindexFollowMeta } from "@/libs/seo";

const PDFViewer = lazy(async () => {
	const { PDFViewer } = await import("@react-pdf/renderer");
	return { default: PDFViewer };
});

export const Route = createFileRoute("/templates/$")({
	component: TemplatePdfRoute,
	errorComponent: () => <div>未找到这个简历模板</div>,
	head: () => ({
		meta: [createNoindexFollowMeta()],
	}),
});

function TemplatePdfRoute() {
	const isClient = useIsClient();
	const params = Route.useParams();

	const templateName = params._splat?.split(".")[0] ?? "azurill";
	const template = templateSchema.parse(templateName);
	const resumeDocument = useLocalizedResumeDocument(sampleResumeData, template);

	if (!isClient || !resumeDocument) return null;

	return (
		<Suspense fallback={null}>
			<PDFViewer showToolbar={false} style={{ height: "100svh", width: "100svw", border: "none" }}>
				{resumeDocument}
			</PDFViewer>
		</Suspense>
	);
}
