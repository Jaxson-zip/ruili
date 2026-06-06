import { t } from "@lingui/core/macro";
import { FloppyDiskIcon } from "@phosphor-icons/react";
import { useHotkey } from "@tanstack/react-hotkeys";
import { Suspense, useState } from "react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { toast } from "sonner";
import { LoadingScreen } from "@/components/layout/loading-screen";
import { BuilderClickableResumePreview } from "./clickable-preview";
import { BuilderDock } from "./dock";
import { DEFAULT_BUILDER_PREVIEW_PAGE_LAYOUT, getNextBuilderPreviewPageLayout } from "./page-layout";
import { getBuilderPreviewInitialScale } from "./preview-scale";
import { BuilderQuickEditPanel } from "./quick-edit-panel";
import { BuilderQuickEditRail } from "./quick-edit-rail";

export function PreviewPage() {
	const [pageLayout, setPageLayout] = useState(DEFAULT_BUILDER_PREVIEW_PAGE_LAYOUT);
	const [initialScale] = useState(() => getBuilderPreviewInitialScale());

	useHotkey("Mod+S", () => {
		toast.info(t`你的修改会自动保存。`, { id: "auto-save", icon: <FloppyDiskIcon /> });
	});

	return (
		<Suspense fallback={<LoadingScreen />}>
			<div className="fixed inset-0">
				<TransformWrapper
					centerOnInit
					maxScale={5}
					minScale={0.45}
					initialScale={initialScale}
					limitToBounds={false}
					wheel={{ step: 0.001 }}
				>
					<TransformComponent wrapperClass="h-full! w-full!">
						<BuilderClickableResumePreview showPageNumbers pageLayout={pageLayout} />
					</TransformComponent>

					<BuilderQuickEditRail />
					<BuilderQuickEditPanel />

					<BuilderDock
						pageLayout={pageLayout}
						onTogglePageLayout={() => {
							setPageLayout((current) => getNextBuilderPreviewPageLayout(current));
						}}
					/>
				</TransformWrapper>
			</div>
		</Suspense>
	);
}
