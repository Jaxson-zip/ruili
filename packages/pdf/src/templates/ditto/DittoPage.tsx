import type { Style } from "@react-pdf/types";
import type { TemplatePageProps } from "../../document";
import type { TemplateColorRoles, TemplateStyleContext, TemplateStyleSlots } from "../shared/types";
import { useMemo } from "react";
import { rgbaStringToHex } from "@reactive-resume/utils/color";
import { useRender } from "../../context";
import { Image, Page, StyleSheet, View } from "../../renderer";
import { CustomFieldContactItem, WebsiteContactItem } from "../shared/contact-item";
import { TemplateProvider } from "../shared/context";
import { filterSections } from "../shared/filtering";
import { getTemplateMetrics } from "../shared/metrics";
import { getTemplatePageMinHeightStyle, getTemplatePageSize } from "../shared/page-size";
import { hasTemplatePicture } from "../shared/picture";
import { Heading, Icon, Link, Text } from "../shared/primitives";
import { createRtlStyleHelpers } from "../shared/rtl";
import { Section } from "../shared/sections";
import { composeStyles, headerNameLineHeight } from "../shared/styles";

type DittoStyles = Omit<TemplateStyleSlots, "page"> & {
	page: Style;
	header: Style;
	headerTop: Style;
	headerIdentity: Style;
	headerName: Style;
	headerHeadline: Style;
	picture: Style;
	contactList: Style;
	contactItem: Style;
	sectionGroup: Style;
	sidebarGroup: Style;
};

type DittoTemplate = {
	colors: TemplateColorRoles;
	styles: DittoStyles;
};

type DittoHeaderProps = {
	styles: DittoStyles;
};

export const DittoPage = ({ page, pageIndex }: TemplatePageProps) => {
	const data = useRender();
	const { metadata } = data;
	const { colors, styles } = useDittoTemplate();
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

				<View style={composeStyles(styles.sectionGroup, { rowGap: metrics.sectionGap })}>
					{mainSections.map((section) => (
						<Section key={section} section={section} placement="main" />
					))}
				</View>

				{!page.fullWidth && sidebarSections.length > 0 && (
					<View style={composeStyles(styles.sidebarGroup, { rowGap: metrics.sectionGap })}>
						{sidebarSections.map((section) => (
							<Section key={section} section={section} placement="sidebar" />
						))}
					</View>
				)}
			</TemplateProvider>
		</Page>
	);
};

const Header = ({ styles }: DittoHeaderProps) => {
	const { basics, picture } = useRender();
	const hasPicture = hasTemplatePicture(picture);

	return (
		<View style={styles.header}>
			<View style={styles.headerTop}>
				<View style={styles.headerIdentity}>
					<Heading style={styles.headerName}>{basics.name}</Heading>
					<Text style={styles.headerHeadline}>{basics.headline}</Text>
				</View>

				{hasPicture && <Image src={picture.url} style={styles.picture} />}
			</View>

			<View style={styles.contactList}>
				{basics.email && (
					<Link src={`mailto:${basics.email}`} style={styles.contactItem}>
						<Icon name="envelope" />
						<Text>{basics.email}</Text>
					</Link>
				)}
				{basics.phone && (
					<Link src={`tel:${basics.phone}`} style={styles.contactItem}>
						<Icon name="phone" />
						<Text>{basics.phone}</Text>
					</Link>
				)}
				{basics.location && (
					<View style={styles.contactItem}>
						<Icon name="map-pin" />
						<Text>{basics.location}</Text>
					</View>
				)}
				<WebsiteContactItem website={basics.website} style={styles.contactItem} />
				{basics.customFields.map((field) => (
					<CustomFieldContactItem key={field.id} field={field} style={styles.contactItem} />
				))}
			</View>
		</View>
	);
};

const useDittoTemplate = (): DittoTemplate => {
	const { picture, metadata, rtl } = useRender();

	return useMemo(() => {
		const r = createRtlStyleHelpers(rtl);
		const foreground = rgbaStringToHex(metadata.design.colors.text);
		const background = rgbaStringToHex(metadata.design.colors.background);
		const primary = rgbaStringToHex(metadata.design.colors.primary);
		const muted = "#5F6673";
		const hairline = "#D7DBE2";
		const sidebarTint = "#F7F8FA";
		const colors: TemplateColorRoles = { foreground, background, primary };
		const metrics = getTemplateMetrics(metadata.page);

		const bodyText = {
			fontFamily: metadata.typography.body.fontFamily,
			fontSize: metadata.typography.body.fontSize,
			fontWeight: metadata.typography.body.fontWeights[0] ?? "400",
			lineHeight: metadata.typography.body.lineHeight,
			color: foreground,
			...r.text,
		} satisfies Style;

		const baseStyles = StyleSheet.create({
			page: {
				color: foreground,
				backgroundColor: background,
				paddingHorizontal: metrics.page.paddingHorizontal,
				paddingVertical: metrics.page.paddingVertical,
				rowGap: metrics.headerGap * 0.85,
				fontFamily: metadata.typography.body.fontFamily,
				fontSize: metadata.typography.body.fontSize,
				lineHeight: metadata.typography.body.lineHeight,
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
				rowGap: metrics.gapY(0.125),
				columnGap: metrics.gapX(1 / 3),
			},
			inline: {
				flexDirection: r.row,
				alignItems: "center",
				columnGap: metrics.gapX(1 / 3),
			},
			link: {
				textDecoration: "none",
				color: foreground,
			},
			small: {
				fontSize: metadata.typography.body.fontSize * 0.875,
				color: muted,
			},
			bold: {
				fontWeight: metadata.typography.body.fontWeights.at(-1) ?? "600",
			},
			richParagraph: {
				margin: 0,
				...bodyText,
			},
			richListItemRow: {
				flexDirection: "row",
				columnGap: metrics.gapX(1 / 3),
				alignItems: "flex-start",
			},
			richListItemMarker: {
				...bodyText,
				width: metadata.typography.body.fontSize,
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
				columnGap: metrics.gapX(2 / 3),
			},
			alignEnd: {
				...r.alignEnd,
			},
			section: {
				flexDirection: "column",
				rowGap: metrics.gapY(0.26),
			},
			sectionHeading: {
				color: primary,
				borderBottomWidth: 0.8,
				borderBottomColor: hairline,
				paddingBottom: metrics.gapY(0.12),
				textAlign: r.sectionHeadingTextAlign,
			},
			sectionItems: {
				rowGap: metrics.gapY(0.32),
			},
			item: {
				rowGap: metrics.gapY(0.14),
			},
			levelContainer: {
				width: "100%",
			},
			levelItem: {
				borderColor: primary,
			},
			levelItemActive: {
				backgroundColor: primary,
			},
			header: {
				rowGap: metrics.gapY(0.55),
				borderBottomWidth: 1.2,
				borderBottomColor: foreground,
				paddingBottom: metrics.gapY(0.7),
			},
			headerTop: {
				flexDirection: r.row,
				alignItems: "flex-start",
				justifyContent: "space-between",
				columnGap: metrics.gapX(0.8),
			},
			headerIdentity: {
				...r.headerIdentity,
				flex: 1,
				rowGap: metrics.gapY(0.22),
			},
			headerName: {
				fontSize: metadata.typography.heading.fontSize * 1.85,
				lineHeight: headerNameLineHeight,
			},
			headerHeadline: {
				color: muted,
			},
			picture: {
				width: Math.min(picture.size, 56),
				height: Math.min(picture.size, 56),
				objectFit: "cover",
				aspectRatio: picture.aspectRatio,
				borderRadius: Math.min(picture.borderRadius, 6),
				borderColor: rgbaStringToHex(picture.borderColor),
				borderWidth: picture.borderWidth,
				shadowColor: rgbaStringToHex(picture.shadowColor),
				shadowWidth: picture.shadowWidth,
				transform: `rotate(${picture.rotation}deg)`,
			},
			contactList: {
				flexDirection: r.row,
				flexWrap: "wrap",
				rowGap: metrics.gapY(0.14),
				columnGap: metrics.gapX(0.75),
			},
			contactItem: {
				flexDirection: r.row,
				alignItems: "center",
				columnGap: metrics.gapX(1 / 6),
			},
			sectionGroup: {},
			sidebarGroup: {
				backgroundColor: sidebarTint,
				borderTopWidth: 0.8,
				borderTopColor: hairline,
				paddingTop: metrics.gapY(0.65),
				paddingHorizontal: metrics.gapX(0.65),
				paddingBottom: metrics.gapY(0.65),
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
				sectionHeading: (context) => ({
					...baseStyles.sectionHeading,
					color: accentFor(context),
				}),
				levelItem: (context) => ({ borderColor: accentFor(context) }),
				levelItemActive: (context) => ({ backgroundColor: accentFor(context) }),
				icon: (context) => ({
					display: metadata.page.hideIcons ? "none" : "flex",
					size: metadata.typography.body.fontSize,
					color: accentFor(context),
				}),
			} satisfies DittoStyles,
		};
	}, [picture, metadata, rtl]);
};
