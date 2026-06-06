import type { Style } from "@react-pdf/types";
import type { TemplatePageProps } from "../../document";
import type {
	TemplateColorRoles,
	TemplateFeatureStyleSlots,
	TemplateFeatures,
	TemplateStyleContext,
	TemplateStyleSlots,
} from "../shared/types";
import { Fragment, useMemo } from "react";
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
import { composeStyles, headerNameLineHeight, resolvePlacementColor } from "../shared/styles";

type CollectionVariant = {
	accent: string;
	headerBackground: string;
	headerForeground: string;
	headingBackground: string;
	headingMode: "bar" | "tag" | "line";
	id: "collection001" | "collection002" | "collection003" | "collection005";
	sidebarBackground?: string;
	sidebarForeground?: string;
};

type CollectionStyles = Omit<TemplateStyleSlots, "page"> & {
	page: Style;
	contentRow: Style;
	sidebarColumn: Style;
	mainColumn: Style;
	header: Style;
	headerIdentity: Style;
	headerName: Style;
	headerHeadline: Style;
	headerContactRow: Style;
	headerContactItem: Style;
	picture: Style;
	sidebarHeader: Style;
	sidebarPicture: Style;
	sidebarName: Style;
	sidebarHeadline: Style;
};

type CollectionTemplate = {
	colors: TemplateColorRoles;
	featureStyles: TemplateFeatureStyleSlots;
	styles: CollectionStyles;
};

type HeaderProps = {
	styles: CollectionStyles;
	variant: CollectionVariant;
};

const variants = {
	collection001: {
		id: "collection001",
		accent: "#2F6F7A",
		headerBackground: "#F6FAFB",
		headerForeground: "#244957",
		headingBackground: "#E9F2F4",
		headingMode: "tag",
	},
	collection002: {
		id: "collection002",
		accent: "#B98A3B",
		headerBackground: "#FFFFFF",
		headerForeground: "#2E3440",
		headingBackground: "#FBF3E4",
		headingMode: "line",
	},
	collection003: {
		id: "collection003",
		accent: "#28526F",
		headerBackground: "#FFFFFF",
		headerForeground: "#22313F",
		headingBackground: "#EEF4F8",
		headingMode: "bar",
		sidebarBackground: "#15314D",
		sidebarForeground: "#F8FAFC",
	},
	collection005: {
		id: "collection005",
		accent: "#315D7D",
		headerBackground: "#FFFFFF",
		headerForeground: "#22313F",
		headingBackground: "#EAF2F8",
		headingMode: "bar",
		sidebarBackground: "#213A52",
		sidebarForeground: "#F8FAFC",
	},
} as const satisfies Record<CollectionVariant["id"], CollectionVariant>;

const collectionFeatures = {
	sectionTimeline: true,
	stackSidebarItemHeader: true,
} satisfies TemplateFeatures;

const createCollectionPage =
	(variant: CollectionVariant) =>
	({ page, pageIndex }: TemplatePageProps) => {
		const data = useRender();
		const { metadata } = data;
		const { colors, styles, featureStyles } = useCollectionTemplate(variant);
		const metrics = getTemplateMetrics(metadata.page);
		const pageSize = getTemplatePageSize(metadata.page.format);
		const pageMinHeightStyle = getTemplatePageMinHeightStyle(metadata.page.format);
		const showHeader = pageIndex === 0;
		const sidebarSections = filterSections(page.sidebar, data);
		const mainSections = filterSections(page.main, data);
		const hasSidebar = !page.fullWidth && sidebarSections.length > 0;

		return (
			<Page size={pageSize} style={composeStyles(styles.page, pageMinHeightStyle)}>
				<TemplateProvider styles={styles} featureStyles={featureStyles} colors={colors} features={collectionFeatures}>
					{showHeader && !hasSidebar && <FullHeader styles={styles} variant={variant} />}

					<View style={composeStyles(styles.contentRow, { columnGap: metrics.columnGap })}>
						{hasSidebar && (
							<View
								style={composeStyles(styles.sidebarColumn, {
									flexBasis: `${metadata.layout.sidebarWidth}%`,
									rowGap: metrics.sectionGap * 0.82,
								})}
							>
								{showHeader && <SidebarHeader styles={styles} />}
								{sidebarSections.map((section) => (
									<Fragment key={section}>
										<Section section={section} placement="sidebar" />
									</Fragment>
								))}
							</View>
						)}

						<View style={composeStyles(styles.mainColumn, { rowGap: metrics.sectionGap })}>
							{showHeader && hasSidebar && <FullHeader styles={styles} variant={variant} />}
							{mainSections.map((section) => (
								<Section key={section} section={section} placement="main" />
							))}
						</View>
					</View>
				</TemplateProvider>
			</Page>
		);
	};

const FullHeader = ({ styles }: HeaderProps) => {
	const { basics, picture } = useRender();
	const hasPicture = hasTemplatePicture(picture);

	return (
		<View style={styles.header}>
			<View style={styles.headerIdentity}>
				<Heading style={styles.headerName}>{basics.name}</Heading>
				{basics.headline && <Text style={styles.headerHeadline}>{basics.headline}</Text>}
			</View>

			{hasPicture && <Image src={picture.url} style={styles.picture} />}

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

const SidebarHeader = ({ styles }: Pick<HeaderProps, "styles">) => {
	const { basics, picture } = useRender();
	const hasPicture = hasTemplatePicture(picture);

	return (
		<View style={styles.sidebarHeader}>
			{hasPicture && <Image src={picture.url} style={styles.sidebarPicture} />}
			<Heading style={styles.sidebarName}>{basics.name}</Heading>
			{basics.headline && <Text style={styles.sidebarHeadline}>{basics.headline}</Text>}
		</View>
	);
};

const useCollectionTemplate = (variant: CollectionVariant): CollectionTemplate => {
	const { picture, metadata, rtl } = useRender();

	return useMemo(() => {
		const r = createRtlStyleHelpers(rtl);
		const foreground = rgbaStringToHex(metadata.design.colors.text);
		const background = rgbaStringToHex(metadata.design.colors.background);
		const primary = variant.accent;
		const muted = "#5B6775";
		const subtle = "#E2E8F0";
		const sidebarBackground = variant.sidebarBackground ?? "#F8FAFC";
		const sidebarForeground = variant.sidebarForeground ?? foreground;
		const sidebarMuted = variant.sidebarForeground ? "#C8D5E2" : muted;
		const colors: TemplateColorRoles = { foreground, background, primary, sidebarForeground, sidebarBackground };
		const metrics = getTemplateMetrics(metadata.page);
		const sectionHeadingMainPaddingLeft =
			variant.headingMode === "tag" ? metrics.gapX(0.42) : variant.headingMode === "bar" ? metrics.gapX(0.38) : 0;

		const bodyText = {
			fontFamily: metadata.typography.body.fontFamily,
			fontSize: metadata.typography.body.fontSize,
			fontWeight: metadata.typography.body.fontWeights[0] ?? "400",
			lineHeight: Math.min(metadata.typography.body.lineHeight, 1.42),
			color: foreground,
			...r.text,
		} satisfies Style;

		const sectionHeadingBase = {
			color: foreground,
			fontSize: metadata.typography.heading.fontSize * 0.84,
			fontWeight: metadata.typography.heading.fontWeights.at(-1) ?? "700",
			lineHeight: 1.22,
			textAlign: r.sectionHeadingTextAlign,
		} satisfies Style;

		const headingVariant =
			variant.headingMode === "tag"
				? ({
						backgroundColor: variant.headingBackground,
						borderLeftWidth: 4,
						borderLeftColor: primary,
						borderBottomWidth: 0.5,
						borderBottomColor: subtle,
						paddingHorizontal: metrics.gapX(0.42),
						paddingTop: metrics.gapY(0.12),
						paddingBottom: metrics.gapY(0.12),
					} satisfies Style)
				: variant.headingMode === "line"
					? ({
							backgroundColor: "transparent",
							borderBottomWidth: 1,
							borderBottomColor: primary,
							borderLeftWidth: 0,
							paddingTop: 0,
							paddingBottom: metrics.gapY(0.16),
						} satisfies Style)
					: ({
							backgroundColor: variant.headingBackground,
							borderTopWidth: 3,
							borderTopColor: primary,
							borderBottomWidth: 0,
							borderLeftWidth: 0,
							paddingHorizontal: metrics.gapX(0.38),
							paddingTop: metrics.gapY(0.12),
							paddingBottom: metrics.gapY(0.12),
						} satisfies Style);

		const baseStyles = StyleSheet.create({
			page: {
				color: foreground,
				backgroundColor: background,
				paddingHorizontal: metrics.page.paddingHorizontal,
				paddingVertical: metrics.page.paddingVertical,
				rowGap: metrics.gapY(0.72),
				fontFamily: metadata.typography.body.fontFamily,
				fontSize: metadata.typography.body.fontSize,
				lineHeight: Math.min(metadata.typography.body.lineHeight, 1.42),
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
				rowGap: metrics.gapY(0.11),
				columnGap: metrics.gapX(0.28),
			},
			inline: {
				flexDirection: r.row,
				alignItems: "center",
				columnGap: metrics.gapX(0.28),
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
				fontWeight: metadata.typography.body.fontWeights.at(-1) ?? "700",
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
				color: primary,
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
				columnGap: metrics.gapX(0.55),
			},
			alignEnd: {
				color: muted,
				...r.alignEnd,
			},
			section: {
				flexDirection: "column",
				rowGap: metrics.gapY(0.28),
			},
			sectionHeading: {
				...sectionHeadingBase,
				...headingVariant,
			},
			sectionItems: {
				rowGap: metrics.gapY(0.34),
			},
			item: {
				rowGap: metrics.gapY(0.13),
				borderBottomWidth: 0.35,
				borderBottomColor: subtle,
				paddingBottom: metrics.gapY(0.18),
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
			contentRow: {
				flexDirection: r.row,
				alignItems: "flex-start",
			},
			sidebarColumn: {
				backgroundColor: sidebarBackground,
				paddingHorizontal: metrics.gapX(0.72),
				paddingVertical: metrics.gapY(0.72),
			},
			mainColumn: {
				flex: 1,
			},
			header: {
				flexDirection: r.row,
				flexWrap: "wrap",
				alignItems: "flex-start",
				rowGap: metrics.gapY(0.28),
				columnGap: metrics.gapX(0.8),
				backgroundColor: variant.headerBackground,
				borderTopWidth: variant.headingMode === "line" ? 5 : 0,
				borderTopColor: primary,
				borderBottomWidth: 2,
				borderBottomColor: primary,
				paddingHorizontal: metrics.gapX(0.7),
				paddingTop: metrics.gapY(0.52),
				paddingBottom: metrics.gapY(0.54),
			},
			headerIdentity: {
				flex: 1,
				...r.headerIdentity,
				rowGap: metrics.gapY(0.16),
			},
			headerName: {
				color: variant.headerForeground,
				fontSize: metadata.typography.heading.fontSize * 1.76,
				lineHeight: headerNameLineHeight,
			},
			headerHeadline: {
				color: muted,
			},
			headerContactRow: {
				flexDirection: r.row,
				flexWrap: "wrap",
				rowGap: metrics.gapY(0.14),
				columnGap: metrics.gapX(0.32),
				width: "100%",
			},
			headerContactItem: {
				flexDirection: r.row,
				alignItems: "center",
				columnGap: metrics.gapX(0.16),
				color: muted,
			},
			picture: {
				width: Math.min(picture.size, 54),
				height: Math.min(picture.size, 54),
				objectFit: "cover",
				aspectRatio: picture.aspectRatio,
				borderRadius: Math.min(picture.borderRadius, 4),
				borderColor: rgbaStringToHex(picture.borderColor),
				borderWidth: picture.borderWidth,
				shadowColor: rgbaStringToHex(picture.shadowColor),
				shadowWidth: picture.shadowWidth,
				transform: `rotate(${picture.rotation}deg)`,
			},
			sidebarHeader: {
				alignItems: "center",
				rowGap: metrics.gapY(0.26),
				paddingBottom: metrics.gapY(0.44),
				borderBottomWidth: 0.6,
				borderBottomColor: variant.sidebarForeground ? "#45617A" : subtle,
			},
			sidebarPicture: {
				width: Math.min(picture.size, 62),
				height: Math.min(picture.size, 62),
				objectFit: "cover",
				aspectRatio: picture.aspectRatio,
				borderRadius: 4,
				borderColor: primary,
				borderWidth: 1.2,
				shadowColor: rgbaStringToHex(picture.shadowColor),
				shadowWidth: picture.shadowWidth,
				transform: `rotate(${picture.rotation}deg)`,
			},
			sidebarName: {
				color: sidebarForeground,
				fontSize: metadata.typography.heading.fontSize * 1.2,
				lineHeight: 1.2,
				textAlign: "center",
			},
			sidebarHeadline: {
				color: sidebarMuted,
				fontSize: metadata.typography.body.fontSize * 0.88,
				textAlign: "center",
			},
		});

		const sectionTimelineStyles = StyleSheet.create({
			items: {
				position: "relative",
			},
			line: {
				position: "absolute",
				top: 0,
				bottom: 0,
				left: 6.5,
				width: 1,
				backgroundColor: primary,
			},
			item: {
				flexDirection: "row",
				columnGap: metrics.gapX(0.42),
				position: "relative",
			},
			marker: {
				width: 14,
				alignItems: "center",
			},
			dot: {
				width: 7,
				height: 7,
				marginTop: 8,
				borderRadius: 999,
				borderWidth: 1.2,
				borderColor: primary,
				backgroundColor: background,
			},
			content: {
				flex: 1,
			},
		});

		const foregroundFor = ({ placement, colors }: TemplateStyleContext) =>
			resolvePlacementColor({
				placement,
				defaultForeground: colors.foreground,
				sidebarForeground: colors.sidebarForeground,
			});

		const accentFor = ({ placement, colors }: TemplateStyleContext) =>
			resolvePlacementColor({
				placement,
				defaultForeground: colors.primary,
				sidebarForeground: colors.sidebarForeground,
			});

		const featureStyles = {
			sectionTimeline: {
				...sectionTimelineStyles,
				line: (context) => ({ ...sectionTimelineStyles.line, backgroundColor: accentFor(context) }),
				dot: (context) => ({
					...sectionTimelineStyles.dot,
					borderColor: accentFor(context),
					backgroundColor: context.placement === "sidebar" ? sidebarBackground : background,
				}),
			},
		} satisfies TemplateFeatureStyleSlots;

		return {
			colors,
			featureStyles,
			styles: {
				...baseStyles,
				text: (context) => ({ ...baseStyles.text, color: foregroundFor(context) }),
				heading: (context) => ({ ...baseStyles.heading, color: foregroundFor(context) }),
				link: (context) => ({ ...baseStyles.link, color: foregroundFor(context) }),
				small: (context) => ({ ...baseStyles.small, color: context.placement === "sidebar" ? sidebarMuted : muted }),
				bold: (context) => ({ ...baseStyles.bold, color: foregroundFor(context) }),
				richParagraph: (context) => ({ ...baseStyles.richParagraph, color: foregroundFor(context) }),
				richListItemMarker: (context) => ({
					...baseStyles.richListItemMarker,
					color: context.placement === "sidebar" ? accentFor(context) : primary,
				}),
				richListItemContent: (context) => ({ ...baseStyles.richListItemContent, color: foregroundFor(context) }),
				sectionHeading: (context) => ({
					...baseStyles.sectionHeading,
					color: context.placement === "sidebar" ? sidebarForeground : foreground,
					borderLeftColor: accentFor(context),
					borderTopColor: accentFor(context),
					borderBottomColor: context.placement === "sidebar" ? "#45617A" : primary,
					backgroundColor: context.placement === "sidebar" ? "transparent" : variant.headingBackground,
					paddingLeft: context.placement === "sidebar" ? 0 : sectionHeadingMainPaddingLeft,
				}),
				item: (context) => ({
					...baseStyles.item,
					borderBottomColor: context.placement === "sidebar" ? "#45617A" : subtle,
				}),
				splitRow: (context) => ({
					...baseStyles.splitRow,
					...(context.placement === "sidebar"
						? { flexDirection: "column", alignItems: "flex-start", justifyContent: "flex-start" }
						: {}),
				}),
				alignEnd: (context) => ({
					...baseStyles.alignEnd,
					color: context.placement === "sidebar" ? sidebarMuted : muted,
					...(context.placement === "sidebar" ? { textAlign: "left" } : {}),
				}),
				levelItem: (context) => ({ borderColor: accentFor(context) }),
				levelItemActive: (context) => ({ backgroundColor: accentFor(context) }),
				icon: (context) => ({
					display: "none",
					size: metadata.typography.body.fontSize * 0.9,
					color: accentFor(context),
				}),
			} satisfies CollectionStyles,
		};
	}, [picture, metadata, rtl, variant]);
};

export const Collection001Page = createCollectionPage(variants.collection001);
export const Collection002Page = createCollectionPage(variants.collection002);
export const Collection003Page = createCollectionPage(variants.collection003);
export const Collection005Page = createCollectionPage(variants.collection005);
