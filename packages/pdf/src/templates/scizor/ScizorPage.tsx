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

type ScizorStyles = Omit<TemplateStyleSlots, "page"> & {
	page: Style;
	header: Style;
	headerIdentity: Style;
	headerName: Style;
	headerNameRule: Style;
	headerHeadline: Style;
	headerContactRow: Style;
	headerContactItem: Style;
	picture: Style;
	sections: Style;
};

type ScizorTemplate = {
	colors: TemplateColorRoles;
	styles: ScizorStyles;
};

type ScizorHeaderProps = {
	styles: ScizorStyles;
};

export const ScizorPage = ({ page, pageIndex }: TemplatePageProps) => {
	const data = useRender();
	const { metadata } = data;
	const { colors, styles } = useScizorTemplate();
	const metrics = getTemplateMetrics(metadata.page);
	const pageSize = getTemplatePageSize(metadata.page.format);
	const pageMinHeightStyle = getTemplatePageMinHeightStyle(metadata.page.format);
	const showHeader = pageIndex === 0;
	const mainSections = filterSections(page.main, data);
	const sidebarSections = page.fullWidth ? [] : filterSections(page.sidebar, data);
	const sections = [...mainSections, ...sidebarSections];

	return (
		<Page size={pageSize} style={composeStyles(styles.page, pageMinHeightStyle)}>
			<TemplateProvider styles={styles} colors={colors}>
				{showHeader && <Header styles={styles} />}

				<View style={composeStyles(styles.sections, { rowGap: metrics.sectionGap })}>
					{sections.map((section) => (
						<Section key={section} section={section} placement="main" />
					))}
				</View>
			</TemplateProvider>
		</Page>
	);
};

const Header = ({ styles }: ScizorHeaderProps) => {
	const { basics, picture } = useRender();
	const hasPicture = hasTemplatePicture(picture);

	return (
		<View style={styles.header}>
			<View style={styles.headerIdentity}>
				<Heading style={styles.headerName}>{basics.name}</Heading>
				<View style={styles.headerNameRule} />
				{basics.headline && <Text style={styles.headerHeadline}>{basics.headline}</Text>}

				<View style={styles.headerContactRow}>
					{basics.location && (
						<View style={styles.headerContactItem}>
							<Icon name="map-pin" />
							<Text>{basics.location}</Text>
						</View>
					)}
					{basics.email && (
						<Link src={`mailto:${basics.email}`} style={styles.headerContactItem}>
							<Icon name="envelope" />
							<Text>{basics.email}</Text>
						</Link>
					)}
					{basics.phone && (
						<Link src={`tel:${basics.phone}`} style={styles.headerContactItem}>
							<Icon name="phone" />
							<Text>{basics.phone}</Text>
						</Link>
					)}
					<WebsiteContactItem website={basics.website} style={styles.headerContactItem} />
					{basics.customFields.map((field) => (
						<CustomFieldContactItem key={field.id} field={field} style={styles.headerContactItem} />
					))}
				</View>
			</View>

			{hasPicture && <Image src={picture.url} style={styles.picture} />}
		</View>
	);
};

const useScizorTemplate = (): ScizorTemplate => {
	const { picture, metadata, rtl } = useRender();

	return useMemo(() => {
		const r = createRtlStyleHelpers(rtl);
		const foreground = rgbaStringToHex(metadata.design.colors.text);
		const background = rgbaStringToHex(metadata.design.colors.background);
		const primary = rgbaStringToHex(metadata.design.colors.primary);
		const divider = "#D8DDE5";
		const headingSurface = "#F5EFE7";
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
				fontWeight: metadata.typography.heading.fontWeights.at(-1) ?? "700",
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
				color: foreground,
				opacity: 0.76,
			},
			bold: {
				fontWeight: metadata.typography.body.fontWeights.at(-1) ?? "700",
				color: foreground,
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
				rowGap: metrics.gapY(0.3),
				borderTopWidth: 0.55,
				borderTopColor: divider,
				paddingTop: metrics.gapY(0.42),
			},
			sectionHeading: {
				color: primary,
				backgroundColor: headingSurface,
				fontSize: metadata.typography.heading.fontSize * 0.88,
				fontWeight: metadata.typography.heading.fontWeights.at(-1) ?? "700",
				borderLeftWidth: 2.4,
				borderLeftColor: primary,
				paddingHorizontal: metrics.gapX(0.42),
				paddingVertical: metrics.gapY(0.1),
				textAlign: r.sectionHeadingTextAlign,
			},
			sectionItems: {
				rowGap: metrics.gapY(0.3),
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
				flexDirection: r.row,
				alignItems: "flex-start",
				columnGap: metrics.gapX(1),
				borderTopWidth: 2,
				borderTopColor: primary,
				borderBottomWidth: 0.8,
				borderBottomColor: divider,
				paddingTop: metrics.gapY(0.32),
				paddingBottom: metrics.gapY(0.56),
			},
			headerIdentity: {
				flex: 1,
				...r.headerIdentity,
				rowGap: metrics.gapY(0.32),
			},
			headerName: {
				color: foreground,
				fontSize: metadata.typography.heading.fontSize * 1.72,
				lineHeight: headerNameLineHeight,
			},
			headerNameRule: {
				width: "30%",
				borderBottomWidth: 1.4,
				borderBottomColor: primary,
			},
			headerHeadline: {
				color: foreground,
				opacity: 0.78,
			},
			headerContactRow: {
				flexDirection: r.row,
				flexWrap: "wrap",
				rowGap: metrics.gapY(0.125),
				columnGap: metrics.gapX(0.55),
			},
			headerContactItem: {
				flexDirection: r.row,
				alignItems: "center",
				columnGap: metrics.gapX(1 / 6),
				color: foreground,
				opacity: 0.76,
			},
			picture: {
				width: Math.min(picture.size, 58),
				height: Math.min(picture.size, 58),
				objectFit: "cover",
				aspectRatio: picture.aspectRatio,
				borderRadius: Math.min(picture.borderRadius, 8),
				borderColor: rgbaStringToHex(picture.borderColor),
				borderWidth: picture.borderWidth,
				shadowColor: rgbaStringToHex(picture.shadowColor),
				shadowWidth: picture.shadowWidth,
				transform: `rotate(${picture.rotation}deg)`,
			},
			sections: {
				flexDirection: "column",
			},
		});

		const accentFor = ({ colors }: TemplateStyleContext) => colors.primary;

		return {
			colors,
			styles: {
				...baseStyles,
				sectionHeading: (context) => ({
					...baseStyles.sectionHeading,
					color: accentFor(context),
					borderLeftColor: accentFor(context),
				}),
				levelItem: (context) => ({ borderColor: accentFor(context) }),
				levelItemActive: (context) => ({ backgroundColor: accentFor(context) }),
				icon: (context) => ({
					display: metadata.page.hideIcons ? "none" : "flex",
					size: metadata.typography.body.fontSize,
					color: accentFor(context),
				}),
			} satisfies ScizorStyles,
		};
	}, [picture, metadata, rtl]);
};
