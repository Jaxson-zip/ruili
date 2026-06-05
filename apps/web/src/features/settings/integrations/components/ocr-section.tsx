import { Trans } from "@lingui/react/macro";
import { CheckCircleIcon, KeyIcon, TrashIcon, XCircleIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@reactive-resume/ui/components/badge";
import { Button } from "@reactive-resume/ui/components/button";
import { Input } from "@reactive-resume/ui/components/input";
import { Label } from "@reactive-resume/ui/components/label";
import { cn } from "@reactive-resume/utils/style";
import { clearBrowserOcrProvider, loadBrowserOcrProvider, saveBrowserOcrProvider } from "../ocr-settings";

const emptyForm = {
	apiKey: "",
	endpoint: "",
};

function maskKey(apiKey: string) {
	const trimmed = apiKey.trim();
	if (trimmed.length <= 8) return "••••";
	return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`;
}

export function OCRSettingsSection() {
	const [savedProvider, setSavedProvider] = useState(() => loadBrowserOcrProvider());
	const [form, setForm] = useState(() =>
		savedProvider ? { apiKey: savedProvider.apiKey, endpoint: savedProvider.endpoint } : emptyForm,
	);
	const canSave = form.endpoint.trim() && form.apiKey.trim();

	const onSave = () => {
		saveBrowserOcrProvider({
			apiKey: form.apiKey,
			endpoint: form.endpoint,
			provider: "azure-document-intelligence",
		});
		setSavedProvider(loadBrowserOcrProvider());
		toast.success("OCR Provider 已保存到当前浏览器。");
	};

	const onClear = () => {
		clearBrowserOcrProvider();
		setForm(emptyForm);
		setSavedProvider(null);
		toast.success("OCR Provider 已清除。");
	};

	return (
		<section className="grid gap-6">
			<div className="flex items-center justify-between gap-4">
				<div>
					<div className="flex flex-wrap items-center gap-2">
						<h2 className="font-semibold text-lg">
							<Trans>OCR Provider</Trans>
						</h2>
						<Badge variant="secondary">Azure Document Intelligence</Badge>
					</div>
					<p className="text-muted-foreground text-sm">
						<Trans>用于图片简历和扫描版 PDF 识别。Key 仅保存在当前浏览器，导入时随请求发送给后端调用 Azure。</Trans>
					</p>
				</div>

				<p className="flex items-center gap-2 text-sm">
					{savedProvider ? <CheckCircleIcon className="text-emerald-600" /> : <XCircleIcon className="text-rose-600" />}
					<span className={cn(savedProvider ? "text-emerald-700" : "text-muted-foreground")}>
						{savedProvider ? <Trans>OCR ready</Trans> : <Trans>No OCR Provider</Trans>}
					</span>
				</p>
			</div>

			<div className="rounded-md border bg-card p-4">
				<div className="grid gap-4 md:grid-cols-2">
					<div className="space-y-2">
						<Label htmlFor="ocr-endpoint">Endpoint</Label>
						<Input
							id="ocr-endpoint"
							type="url"
							value={form.endpoint}
							onChange={(event) => setForm((current) => ({ ...current, endpoint: event.target.value }))}
							placeholder="https://your-resource.cognitiveservices.azure.com"
							autoCorrect="off"
							autoCapitalize="off"
							spellCheck="false"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="ocr-api-key">API Key</Label>
						<Input
							id="ocr-api-key"
							type="password"
							value={form.apiKey}
							onChange={(event) => setForm((current) => ({ ...current, apiKey: event.target.value }))}
							autoCorrect="off"
							autoCapitalize="off"
							spellCheck="false"
							data-lpignore="true"
							data-bwignore="true"
							data-1p-ignore="true"
						/>
					</div>
				</div>

				{savedProvider ? (
					<p className="mt-3 text-muted-foreground text-sm">
						<Trans>当前已保存</Trans>: {savedProvider.endpoint} · Key {maskKey(savedProvider.apiKey)}
					</p>
				) : null}

				<div className="mt-4 flex flex-wrap justify-end gap-2">
					<Button variant="outline" disabled={!savedProvider} onClick={onClear}>
						<TrashIcon />
						<Trans>Clear</Trans>
					</Button>
					<Button disabled={!canSave} onClick={onSave}>
						<KeyIcon />
						<Trans>Save OCR Provider</Trans>
					</Button>
				</div>
			</div>
		</section>
	);
}
