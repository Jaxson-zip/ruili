import type { Template } from "@reactive-resume/schema/templates";

type TemplateThumbnailProps = {
	template: Template;
	label: string;
	imageUrl?: string;
	loading?: "eager" | "lazy";
};

export const getTemplatePreviewImageUrl = (template: Template) => `/templates/jpg/${template}.jpg`;

export function TemplateThumbnail({ template, label, imageUrl, loading = "lazy" }: TemplateThumbnailProps) {
	return (
		<img
			src={imageUrl ?? getTemplatePreviewImageUrl(template)}
			alt={label}
			className="size-full bg-white object-contain"
			loading={loading}
		/>
	);
}
