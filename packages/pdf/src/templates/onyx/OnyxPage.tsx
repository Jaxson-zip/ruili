import type { Style } from "@react-pdf/types";
import type { TemplatePageProps } from "../../document";
import type { TemplateColorRoles, TemplateStyleContext, TemplateStyleSlot, TemplateStyleSlots } from "../shared/types";
import { useMemo } from "react";
import { rgbaStringToHex } from "@reactive-resume/utils/color";
import { useRender } from "../../context";
import { Image, Page, Link as PdfLink, StyleSheet, View } from "../../renderer";
import { getResumeSectionTitle } from "../../section-title";
import { getCustomFieldLinkUrl, getWebsiteDisplayText } from "../shared/contact";
import { TemplateProvider } from "../shared/context";
import { filterSections } from "../shared/filtering";
import { getTemplateMetrics } from "../shared/metrics";
import { getTemplatePageMinHeightStyle, getTemplatePageSize } from "../shared/page-size";
import { hasTemplatePicture } from "../shared/picture";
import { Heading, Text } from "../shared/primitives";
import { RichText } from "../shared/rich-text";
import { createRtlStyleHelpers } from "../shared/rtl";
import { Section } from "../shared/sections";
import { composeStyles, headerNameLineHeight } from "../shared/styles";

type OnyxStyles = Omit<TemplateStyleSlots, "page"> & {
	page: Style;
	header: Style;
	headerIdentity: Style;
	headerName: Style;
	headerHeadline: Style;
	picture: Style;
	contactList: Style;
	contactItem: Style;
	contactText: Style;
	contactDivider: Style;
	contentRow: Style;
	mainColumn: Style;
	sidebarColumn: Style;
	compactSkillList: Style;
	compactSkillRow: Style;
	compactSkillText: Style;
	compactSkillName: Style;
	compactProfileList: Style;
	compactProfileRow: Style;
	compactProfileText: Style;
	compactProjectItem: Style;
	compactProjectTitle: Style;
	compactProjectLink: Style;
};

type OnyxTemplate = {
	colors: TemplateColorRoles;
	styles: OnyxStyles;
};

type ContactEntry = {
	id: string;
	label: string;
	url?: string | undefined;
};

type OnyxHeaderProps = {
	styles: OnyxStyles;
};

type CompactSkillsProps = {
	colors: TemplateColorRoles;
	placement: "main" | "sidebar";
	styles: OnyxStyles;
};

export const OnyxPage = ({ page, pageIndex }: TemplatePageProps) => {
	const data = useRender();
	const { metadata } = data;
	const { colors, styles } = useOnyxTemplate();
	const metrics = getTemplateMetrics(metadata.page);
	const pageSize = getTemplatePageSize(metadata.page.format);
	const pageMinHeightStyle = getTemplatePageMinHeightStyle(metadata.page.format);
	const showHeader = pageIndex === 0;
	const mainSections = filterSections(page.main, data);
	const sidebarSections = filterSections(page.sidebar, data);

	return (
		<Page size={pageSize} style={composeStyles(styles.page, pageMinHeightStyle)}>
			<TemplateProvider styles={styles} colors={colors}>
				{showHeader && <Header styles={styles} />}

				<View style={composeStyles(styles.contentRow, { columnGap: metrics.columnGap })}>
					<View style={composeStyles(styles.mainColumn, { rowGap: metrics.sectionGap })}>
						{mainSections.map((section) => (
							<OnyxSection key={section} section={section} placement="main" styles={styles} colors={colors} />
						))}
					</View>

					{!page.fullWidth && sidebarSections.length > 0 && (
						<View
							style={composeStyles(styles.sidebarColumn, {
								width: `${metadata.layout.sidebarWidth}%`,
								rowGap: metrics.sectionGap,
							})}
						>
							{sidebarSections.map((section) => (
								<OnyxSection key={section} section={section} placement="sidebar" styles={styles} colors={colors} />
							))}
						</View>
					)}
				</View>
			</TemplateProvider>
		</Page>
	);
};

type OnyxSectionProps = {
	colors: TemplateColorRoles;
	section: string;
	placement: "main" | "sidebar";
	styles: OnyxStyles;
};

const OnyxSection = ({ colors, section, placement, styles }: OnyxSectionProps) => {
	if (section === "skills") return <CompactSkillsSection colors={colors} placement={placement} styles={styles} />;
	if (section === "profiles") return <CompactProfilesSection colors={colors} placement={placement} styles={styles} />;
	if (section === "projects") return <CompactProjectsSection colors={colors} placement={placement} styles={styles} />;

	return <Section section={section} placement={placement} />;
};

const resolveStyleSlot = (slot: TemplateStyleSlot | undefined, context: TemplateStyleContext) =>
	typeof slot === "function" ? slot(context) : slot;

const CompactSkillsSection = ({ colors, placement, styles }: CompactSkillsProps) => {
	const data = useRender();
	const skills = data.sections.skills;
	const visibleSkills = skills.items.filter((item) => !item.hidden);
	const title = getResumeSectionTitle(data, "skills", skills.title);
	const context = { placement, colors };

	if (skills.hidden || visibleSkills.length === 0) return null;

	return (
		<View style={composeStyles(resolveStyleSlot(styles.section, context))}>
			<Heading style={composeStyles(resolveStyleSlot(styles.sectionHeading, context))}>{title}</Heading>
			<View style={styles.compactSkillList}>
				{visibleSkills.map((item) => {
					const details = item.keywords.length > 0 ? item.keywords.join("、") : item.proficiency;

					return (
						<View key={item.id} style={styles.compactSkillRow}>
							<Text style={styles.compactSkillText}>
								<Text style={styles.compactSkillName}>{item.name}</Text>
								{details ? `：${details}` : ""}
							</Text>
						</View>
					);
				})}
			</View>
		</View>
	);
};

const CompactProfilesSection = ({ colors, placement, styles }: CompactSkillsProps) => {
	const data = useRender();
	const profiles = data.sections.profiles;
	const visibleProfiles = profiles.items.filter((item) => !item.hidden);
	const title = getResumeSectionTitle(data, "profiles", profiles.title);
	const context = { placement, colors };

	if (profiles.hidden || visibleProfiles.length === 0) return null;

	return (
		<View style={composeStyles(resolveStyleSlot(styles.section, context))}>
			<Heading style={composeStyles(resolveStyleSlot(styles.sectionHeading, context))}>{title}</Heading>
			<View style={styles.compactProfileList}>
				{visibleProfiles.map((item) => {
					const value = item.website.url ? getWebsiteDisplayText(item.website) : item.username;

					return (
						<View key={item.id} style={styles.compactProfileRow}>
							<Text style={styles.compactProfileText}>
								<Text style={styles.compactSkillName}>{item.network}</Text>
								{value ? `：${value}` : ""}
							</Text>
						</View>
					);
				})}
			</View>
		</View>
	);
};

const CompactProjectsSection = ({ colors, placement, styles }: CompactSkillsProps) => {
	const data = useRender();
	const projects = data.sections.projects;
	const visibleProjects = projects.items.filter((item) => !item.hidden);
	const title = getResumeSectionTitle(data, "projects", projects.title);
	const context = { placement, colors };
	const splitRowStyle = resolveStyleSlot(styles.splitRow, context);
	const alignEndStyle = resolveStyleSlot(styles.alignEnd, context);

	if (projects.hidden || visibleProjects.length === 0) return null;

	return (
		<View style={composeStyles(resolveStyleSlot(styles.section, context))}>
			<Heading style={composeStyles(resolveStyleSlot(styles.sectionHeading, context))}>{title}</Heading>
			<View style={composeStyles(resolveStyleSlot(styles.sectionItems, context))}>
				{visibleProjects.map((item) => {
					const linkLabel = item.website.url ? getWebsiteDisplayText(item.website) : "";

					return (
						<View key={item.id} style={styles.compactProjectItem}>
							<View style={composeStyles(splitRowStyle)}>
								<Text style={styles.compactProjectTitle}>{item.name}</Text>
								{item.period && <Text style={composeStyles(alignEndStyle)}>{item.period}</Text>}
							</View>
							<RichText>{item.description}</RichText>
							{linkLabel && <Text style={styles.compactProjectLink}>{linkLabel}</Text>}
						</View>
					);
				})}
			</View>
		</View>
	);
};

const Header = ({ styles }: OnyxHeaderProps) => {
	const { basics, picture } = useRender();
	const hasPicture = hasTemplatePicture(picture);
	const contactEntries: ContactEntry[] = [
		basics.email ? { id: "email", label: basics.email, url: `mailto:${basics.email}` } : null,
		basics.phone ? { id: "phone", label: basics.phone, url: `tel:${basics.phone}` } : null,
		basics.location ? { id: "location", label: basics.location } : null,
		basics.website.url
			? { id: "website", label: getWebsiteDisplayText(basics.website), url: basics.website.url }
			: null,
		...basics.customFields
			.filter((field) => field.text.trim().length > 0)
			.map((field) => ({
				id: field.id,
				label: field.text,
				url: getCustomFieldLinkUrl(field),
			})),
	].filter(Boolean) as ContactEntry[];

	return (
		<View style={styles.header}>
			{hasPicture && <Image src={picture.url} style={styles.picture} />}

			<View style={styles.headerIdentity}>
				<Heading style={styles.headerName}>{basics.name}</Heading>
				{basics.headline && <Text style={styles.headerHeadline}>{basics.headline}</Text>}
			</View>

			{contactEntries.length > 0 && (
				<View style={styles.contactList}>
					{contactEntries.map((entry, index) => (
						<View key={entry.id} style={styles.contactItem}>
							{entry.url ? (
								<PdfLink src={entry.url} style={styles.contactText}>
									{entry.label}
								</PdfLink>
							) : (
								<Text style={styles.contactText}>{entry.label}</Text>
							)}
							{index < contactEntries.length - 1 && <Text style={styles.contactDivider}>|</Text>}
						</View>
					))}
				</View>
			)}
		</View>
	);
};

const useOnyxTemplate = (): OnyxTemplate => {
	const { picture, metadata, rtl } = useRender();

	return useMemo(() => {
		const r = createRtlStyleHelpers(rtl);
		const foreground = rgbaStringToHex(metadata.design.colors.text);
		const background = rgbaStringToHex(metadata.design.colors.background);
		const primary = rgbaStringToHex(metadata.design.colors.primary);
		const muted = "#344256";
		const softText = "#5F6D7E";
		const hairline = "#D8E0EA";
		const accentSurface = "#EEF4FA";
		const sidebarBackground = "#F6F9FD";
		const colors: TemplateColorRoles = { foreground, background, primary };
		const metrics = getTemplateMetrics(metadata.page);

		const bodyText = {
			fontFamily: metadata.typography.body.fontFamily,
			fontSize: metadata.typography.body.fontSize,
			fontWeight: metadata.typography.body.fontWeights[0] ?? "400",
			lineHeight: Math.min(metadata.typography.body.lineHeight, 1.42),
			color: foreground,
			...r.text,
		} satisfies Style;

		const baseStyles = StyleSheet.create({
			page: {
				color: foreground,
				backgroundColor: background,
				paddingHorizontal: metrics.page.paddingHorizontal,
				paddingVertical: metrics.page.paddingVertical,
				rowGap: metrics.gapY(0.95),
				fontFamily: metadata.typography.body.fontFamily,
				fontSize: metadata.typography.body.fontSize,
				lineHeight: Math.min(metadata.typography.body.lineHeight, 1.42),
				direction: r.pageDirection,
			},
			text: bodyText,
			heading: {
				fontFamily: metadata.typography.heading.fontFamily,
				fontSize: metadata.typography.heading.fontSize,
				fontWeight: metadata.typography.heading.fontWeights.at(-1) ?? "600",
				lineHeight: metadata.typography.heading.lineHeight,
				color: foreground,
				...r.text,
			},
			div: {
				rowGap: metrics.gapY(0.1),
				columnGap: metrics.gapX(0.28),
			},
			inline: {
				flexDirection: r.row,
				alignItems: "center",
				columnGap: metrics.gapX(0.25),
			},
			link: {
				textDecoration: "none",
				color: foreground,
			},
			small: {
				fontSize: metadata.typography.body.fontSize * 0.86,
				color: softText,
			},
			bold: {
				fontWeight: metadata.typography.body.fontWeights.at(-1) ?? "600",
				color: foreground,
			},
			richParagraph: {
				margin: 0,
				...bodyText,
			},
			richListItemRow: {
				flexDirection: "row",
				columnGap: metrics.gapX(0.25),
				alignItems: "flex-start",
			},
			richListItemMarker: {
				...bodyText,
				width: metadata.typography.body.fontSize * 0.92,
				textAlign: r.listMarkerTextAlign,
			},
			richListItemContent: {
				...bodyText,
				flex: 1,
			},
			splitRow: {
				flexDirection: r.row,
				flexWrap: "wrap",
				alignItems: "flex-start",
				justifyContent: "space-between",
				rowGap: metrics.gapY(0.04),
				columnGap: metrics.gapX(0.6),
			},
			alignEnd: {
				color: softText,
				...r.alignEnd,
			},
			section: {
				flexDirection: "column",
				rowGap: metrics.gapY(0.3),
			},
			sectionHeading: {
				color: primary,
				backgroundColor: accentSurface,
				borderLeftWidth: 2.6,
				borderLeftColor: primary,
				fontSize: metadata.typography.heading.fontSize * 0.88,
				fontWeight: metadata.typography.heading.fontWeights.at(-1) ?? "700",
				lineHeight: 1.22,
				paddingHorizontal: metrics.gapX(0.38),
				paddingVertical: metrics.gapY(0.12),
				textAlign: r.sectionHeadingTextAlign,
			},
			sectionItems: {
				rowGap: metrics.gapY(0.32),
			},
			item: {
				rowGap: metrics.gapY(0.16),
				paddingBottom: metrics.gapY(0.26),
			},
			levelContainer: {
				display: "none",
			},
			levelItem: {
				borderColor: primary,
			},
			levelItemActive: {
				backgroundColor: primary,
			},
			header: {
				position: "relative",
				alignItems: "flex-start",
				rowGap: metrics.gapY(0.28),
				backgroundColor: accentSurface,
				borderTopWidth: 2.4,
				borderTopColor: primary,
				borderBottomWidth: 0.6,
				borderBottomColor: hairline,
				paddingHorizontal: metrics.gapX(0.72),
				paddingTop: metrics.gapY(0.46),
				paddingBottom: metrics.gapY(0.52),
			},
			headerIdentity: {
				alignItems: "flex-start",
				rowGap: metrics.gapY(0.1),
			},
			headerName: {
				color: foreground,
				fontSize: metadata.typography.heading.fontSize * 1.64,
				lineHeight: headerNameLineHeight,
				textAlign: "left",
			},
			headerHeadline: {
				color: muted,
				fontSize: metadata.typography.body.fontSize * 0.96,
				textAlign: "left",
			},
			picture: {
				position: "absolute",
				right: 0,
				top: 0,
				width: Math.min(picture.size, 48),
				height: Math.min(picture.size, 48),
				objectFit: "cover",
				aspectRatio: picture.aspectRatio,
				borderRadius: Math.min(picture.borderRadius, 4),
				borderColor: rgbaStringToHex(picture.borderColor),
				borderWidth: picture.borderWidth,
				shadowColor: rgbaStringToHex(picture.shadowColor),
				shadowWidth: picture.shadowWidth,
				transform: `rotate(${picture.rotation}deg)`,
			},
			contactList: {
				flexDirection: r.row,
				flexWrap: "wrap",
				justifyContent: "flex-start",
				rowGap: metrics.gapY(0.1),
				columnGap: metrics.gapX(0.3),
			},
			contactItem: {
				flexDirection: r.row,
				alignItems: "center",
				columnGap: metrics.gapX(0.3),
			},
			contactText: {
				color: muted,
				fontSize: metadata.typography.body.fontSize * 0.86,
				textDecoration: "none",
			},
			contactDivider: {
				color: "#A0A8B5",
				fontSize: metadata.typography.body.fontSize * 0.82,
			},
			compactSkillList: {
				flexDirection: r.row,
				flexWrap: "wrap",
				rowGap: metrics.gapY(0.2),
				columnGap: metrics.gapX(0.72),
				paddingTop: metrics.gapY(0.02),
			},
			compactSkillRow: {
				width: "48%",
			},
			compactSkillText: {
				...bodyText,
				color: foreground,
				fontSize: metadata.typography.body.fontSize * 0.92,
			},
			compactSkillName: {
				fontWeight: metadata.typography.body.fontWeights.at(-1) ?? "600",
				color: foreground,
			},
			compactProfileList: {
				flexDirection: r.row,
				flexWrap: "wrap",
				rowGap: metrics.gapY(0.18),
				columnGap: metrics.gapX(0.72),
				paddingTop: metrics.gapY(0.02),
			},
			compactProfileRow: {
				width: "48%",
			},
			compactProfileText: {
				...bodyText,
				color: foreground,
				fontSize: metadata.typography.body.fontSize * 0.92,
			},
			compactProjectItem: {
				rowGap: metrics.gapY(0.08),
				paddingBottom: metrics.gapY(0.24),
				borderBottomWidth: 0.35,
				borderBottomColor: hairline,
			},
			compactProjectTitle: {
				...bodyText,
				fontWeight: metadata.typography.body.fontWeights.at(-1) ?? "600",
				color: foreground,
			},
			compactProjectLink: {
				...bodyText,
				color: softText,
				fontSize: metadata.typography.body.fontSize * 0.86,
			},
			contentRow: {
				flexDirection: r.row,
				alignItems: "flex-start",
				width: "100%",
			},
			mainColumn: {
				flex: 1,
			},
			sidebarColumn: {
				flexShrink: 0,
				backgroundColor: sidebarBackground,
				borderLeftWidth: rtl ? 0 : 0.8,
				borderLeftColor: hairline,
				borderRightWidth: rtl ? 0.8 : 0,
				borderRightColor: hairline,
				paddingHorizontal: metrics.gapX(0.7),
				paddingVertical: metrics.gapY(0.65),
			},
		});

		const foregroundFor = ({ colors }: TemplateStyleContext) => colors.foreground;
		const accentFor = ({ colors }: TemplateStyleContext) => colors.primary;

		return {
			colors,
			styles: {
				...baseStyles,
				text: (context) => ({ ...baseStyles.text, color: foregroundFor(context) }),
				heading: (context) => ({ ...baseStyles.heading, color: foregroundFor(context) }),
				link: (context) => ({ ...baseStyles.link, color: foregroundFor(context) }),
				richParagraph: (context) => ({ ...baseStyles.richParagraph, color: foregroundFor(context) }),
				richListItemMarker: (context) => ({ ...baseStyles.richListItemMarker, color: foregroundFor(context) }),
				richListItemContent: (context) => ({ ...baseStyles.richListItemContent, color: foregroundFor(context) }),
				section: (context) => ({
					...baseStyles.section,
					...(context.placement === "sidebar" ? { rowGap: metrics.gapY(0.22) } : {}),
				}),
				sectionHeading: (context) => ({
					...baseStyles.sectionHeading,
					color: accentFor(context),
					backgroundColor: context.placement === "sidebar" ? background : accentSurface,
					borderLeftColor: accentFor(context),
				}),
				item: (context) => ({
					...baseStyles.item,
					...(context.placement === "main"
						? { borderBottomWidth: 0.35, borderBottomColor: hairline }
						: { paddingBottom: 0 }),
				}),
				splitRow: (context) => ({
					...baseStyles.splitRow,
					...(context.placement === "sidebar"
						? { flexDirection: "column", alignItems: "flex-start", justifyContent: "flex-start" }
						: {}),
				}),
				alignEnd: (context) => ({
					...baseStyles.alignEnd,
					...(context.placement === "sidebar" ? { textAlign: "left" } : {}),
				}),
				levelItem: (context) => ({ borderColor: accentFor(context) }),
				levelItemActive: (context) => ({ backgroundColor: accentFor(context) }),
				icon: () => ({
					display: "none",
					size: metadata.typography.body.fontSize * 0.9,
					color: primary,
				}),
			} satisfies OnyxStyles,
		};
	}, [picture, metadata, rtl]);
};
