import type { Style } from "@react-pdf/types";
import type { TemplatePageProps } from "../../document";
import type { TemplateColorRoles, TemplateStyleSlots } from "../shared/types";
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

type BronzorStyles = Omit<TemplateStyleSlots, "page"> & {
	page: Style;
	header: Style;
	picture: Style;
	headerTitle: Style;
	headerIdentity: Style;
	headerName: Style;
	headerContactRow: Style;
	headerContactItem: Style;
	sections: Style;
};

type BronzorTemplate = {
	colors: TemplateColorRoles;
	styles: BronzorStyles;
};

type BronzorHeaderProps = {
	styles: BronzorStyles;
};

const getBronzorSections = ({
	mainSections,
	sidebarSections,
	fullWidth,
}: {
	mainSections: string[];
	sidebarSections: string[];
	fullWidth: boolean;
}) => {
	if (fullWidth) return mainSections;

	const sections: string[] = [];
	const sectionCount = Math.max(mainSections.length, sidebarSections.length);

	for (let index = 0; index < sectionCount; index += 1) {
		const sidebarSection = sidebarSections[index];
		const mainSection = mainSections[index];

		if (sidebarSection) sections.push(sidebarSection);
		if (mainSection) sections.push(mainSection);
	}

	return sections;
};

export const BronzorPage = ({ page, pageIndex }: TemplatePageProps) => {
	const data = useRender();
	const { metadata } = data;
	const { styles, colors } = useBronzorTemplate();
	const metrics = getTemplateMetrics(metadata.page);
	const pageSize = getTemplatePageSize(metadata.page.format);
	const pageMinHeightStyle = getTemplatePageMinHeightStyle(metadata.page.format);
	const showHeader = pageIndex === 0;
	const sidebarSections = filterSections(page.sidebar, data);
	const mainSections = filterSections(page.main, data);
	const sections = getBronzorSections({ mainSections, sidebarSections, fullWidth: page.fullWidth });

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

const Header = ({ styles }: BronzorHeaderProps) => {
	const { basics, picture } = useRender();
	const hasPicture = hasTemplatePicture(picture);

	return (
		<View style={styles.header}>
			{hasPicture && <Image src={picture.url} style={styles.picture} />}

			<View style={styles.headerTitle}>
				<View style={styles.headerIdentity}>
					<Heading style={styles.headerName}>{basics.name}</Heading>
					<Text>{basics.headline}</Text>
				</View>
			</View>

			<View style={styles.headerContactRow}>
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
				{basics.location && (
					<View style={styles.headerContactItem}>
						<Icon name="map-pin" />
						<Text>{basics.location}</Text>
					</View>
				)}
				<WebsiteContactItem website={basics.website} style={styles.headerContactItem} />
				{basics.customFields.map((field) => (
					<CustomFieldContactItem key={field.id} field={field} style={styles.headerContactItem} />
				))}
			</View>
		</View>
	);
};

const useBronzorTemplate = (): BronzorTemplate => {
	const { picture, metadata, rtl } = useRender();

	return useMemo(() => {
		const r = createRtlStyleHelpers(rtl);
		const foreground = rgbaStringToHex(metadata.design.colors.text);
		const background = rgbaStringToHex(metadata.design.colors.background);
		const primary = rgbaStringToHex(metadata.design.colors.primary);
		const muted = "#5C6470";
		const hairline = "#D8D3CC";
		const warmSurface = "#FBF8F4";
		const headingSurface = "#F1E9DE";
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
				flexDirection: "column",
				rowGap: metrics.headerGap * 0.82,
				color: foreground,
				backgroundColor: background,
				paddingHorizontal: metrics.page.paddingHorizontal,
				paddingVertical: metrics.page.paddingVertical,
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
				fontSize: metadata.typography.body.fontSize * 0.86,
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
				rowGap: metrics.gapY(0.3),
				borderTopWidth: 0.55,
				borderTopColor: hairline,
				paddingTop: metrics.gapY(0.42),
			},
			sectionHeading: {
				alignSelf: "flex-start",
				color: primary,
				backgroundColor: headingSurface,
				borderLeftWidth: 2.4,
				borderLeftColor: primary,
				fontSize: metadata.typography.heading.fontSize * 0.86,
				fontWeight: metadata.typography.heading.fontWeights.at(-1) ?? "700",
				paddingHorizontal: metrics.gapX(0.42),
				paddingVertical: metrics.gapY(0.1),
				textAlign: r.sectionHeadingTextAlign,
			},
			sectionItems: {
				rowGap: metrics.gapY(0.28),
			},
			sections: {
				flexDirection: "column",
			},
			header: {
				flexDirection: r.row,
				alignItems: "flex-start",
				columnGap: metrics.gapX(0.9),
				backgroundColor: warmSurface,
				borderTopWidth: 2.2,
				borderTopColor: primary,
				borderBottomWidth: 0.7,
				borderBottomColor: hairline,
				paddingHorizontal: metrics.gapX(0.78),
				paddingVertical: metrics.gapY(0.58),
			},
			picture: {
				width: Math.min(picture.size, 58),
				height: Math.min(picture.size, 58),
				objectFit: "cover",
				aspectRatio: picture.aspectRatio,
				borderRadius: Math.min(picture.borderRadius, 6),
				borderColor: rgbaStringToHex(picture.borderColor),
				borderWidth: picture.borderWidth,
				shadowColor: rgbaStringToHex(picture.shadowColor),
				shadowWidth: picture.shadowWidth,
				transform: `rotate(${picture.rotation}deg)`,
			},
			headerTitle: {
				flex: 1,
				rowGap: metrics.gapY(0.35),
			},
			headerIdentity: {
				...r.headerIdentity,
				rowGap: metrics.gapY(0.18),
			},
			headerName: {
				fontSize: metadata.typography.heading.fontSize * 1.7,
				lineHeight: headerNameLineHeight,
			},
			headerContactRow: {
				width: "39%",
				justifyContent: "flex-start",
				rowGap: metrics.gapY(0.1),
			},
			headerContactItem: {
				flexDirection: r.row,
				alignItems: "center",
				columnGap: metrics.gapX(0.22),
				color: muted,
				fontSize: metadata.typography.body.fontSize * 0.88,
			},
			icon: {
				display: metadata.page.hideIcons ? "none" : "flex",
				size: metadata.typography.body.fontSize * 0.86,
				color: primary,
			},
		});

		return { colors, styles: baseStyles satisfies BronzorStyles };
	}, [picture, metadata, rtl]);
};
