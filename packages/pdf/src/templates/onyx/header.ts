import type { ResumeData } from "@reactive-resume/schema/resume/data";
import { hasTemplatePicture } from "../shared/picture";

type OnyxHeaderData = Pick<ResumeData, "basics" | "picture">;

export const cleanOnyxContactLabel = (value: string): string => value.trim();

export const hasOnyxHeaderContent = ({ basics, picture }: OnyxHeaderData): boolean => {
	if (hasTemplatePicture(picture)) return true;
	if (cleanOnyxContactLabel(basics.name).length > 0) return true;
	if (cleanOnyxContactLabel(basics.headline).length > 0) return true;
	if (cleanOnyxContactLabel(basics.email).length > 0) return true;
	if (cleanOnyxContactLabel(basics.phone).length > 0) return true;
	if (cleanOnyxContactLabel(basics.location).length > 0) return true;
	if (cleanOnyxContactLabel(basics.website.url).length > 0) return true;

	return basics.customFields.some((field) => cleanOnyxContactLabel(field.text).length > 0);
};
