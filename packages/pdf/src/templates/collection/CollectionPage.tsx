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
	density?: "compact" | "normal";
	fullBleedSidebar?: boolean;
	headerBackground: string;
	headerForeground: string;
	headerMode?: "band" | "center" | "pill";
	headingBackground: string;
	headingMode: "bar" | "tag" | "line";
	id:
		| "collection001"
		| "collection002"
		| "collection003"
		| "collection005"
		| "collection007"
		| "collection016"
		| "collection017"
		| "collection018"
		| "collection019"
		| "collection020"
		| "collection021"
		| "collection022"
		| "collection024"
		| "collection026"
		| "collection027"
		| "collection028"
		| "collection029";
	referenceStyle?: "blueBlocks" | "darkOrange" | "qrSidebar";
	sectionFrame?: "boxed" | "plain";
	sidebarBackground?: string;
	sidebarForeground?: string;
	sidebarSide?: "left" | "right";
	visualTreatment?: "timelineStrip" | "leftBlock" | "contactBand";
};

type CollectionStyles = Omit<TemplateStyleSlots, "page"> & {
	page: Style;
	contentRow: Style;
	sidebarColumn: Style;
	mainColumn: Style;
	header: Style;
	headerBadge: Style;
	headerBadgeCaption: Style;
	headerBadgeTitle: Style;
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
	sidebarContactList: Style;
	sidebarContactItem: Style;
	sidebarQrBox: Style;
	sidebarQrCell: Style;
	sidebarQrGrid: Style;
	sidebarQrTitle: Style;
	sidebarQrWrap: Style;
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
		headerMode: "pill",
		headingBackground: "#E9F2F4",
		headingMode: "tag",
	},
	collection002: {
		id: "collection002",
		accent: "#B98A3B",
		headerBackground: "#FFFFFF",
		headerForeground: "#2E3440",
		headerMode: "center",
		headingBackground: "#FBF3E4",
		headingMode: "line",
	},
	collection003: {
		id: "collection003",
		accent: "#28526F",
		headerBackground: "#FFFFFF",
		headerForeground: "#22313F",
		headerMode: "band",
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
	collection007: {
		id: "collection007",
		accent: "#1E91BE",
		headerBackground: "#FFFFFF",
		headerForeground: "#22313F",
		headingBackground: "#E7F6FB",
		headingMode: "bar",
		sidebarBackground: "#37414C",
		sidebarForeground: "#F8FAFC",
	},
	collection016: {
		id: "collection016",
		accent: "#4F99CF",
		headerBackground: "#FFFFFF",
		headerForeground: "#1F4F70",
		headingBackground: "#EAF5FC",
		headingMode: "tag",
		sidebarBackground: "#EAF5FC",
		sidebarForeground: "#1F4F70",
	},
	collection017: {
		id: "collection017",
		accent: "#58A53E",
		headerBackground: "#FFFFFF",
		headerForeground: "#2F5F36",
		headingBackground: "#EDF8EA",
		headingMode: "tag",
		sidebarBackground: "#F1F8EF",
		sidebarForeground: "#2F5F36",
	},
	collection018: {
		id: "collection018",
		accent: "#525B66",
		headerBackground: "#FFFFFF",
		headerForeground: "#2F3842",
		headingBackground: "#EEF0F2",
		headingMode: "line",
		sidebarBackground: "#33404F",
		sidebarForeground: "#F8FAFC",
	},
	collection019: {
		id: "collection019",
		accent: "#4B93BE",
		density: "compact",
		headerBackground: "#EAF4FB",
		headerForeground: "#1F4F70",
		headerMode: "band",
		headingBackground: "#DDEFF8",
		headingMode: "bar",
		referenceStyle: "blueBlocks",
		sidebarBackground: "#EDF7FD",
		sidebarForeground: "#1F4F70",
		sidebarSide: "right",
		visualTreatment: "timelineStrip",
	},
	collection020: {
		id: "collection020",
		accent: "#2A97BC",
		headerBackground: "#FFFFFF",
		headerForeground: "#1F4B61",
		headingBackground: "#E7F5F9",
		headingMode: "bar",
		sidebarBackground: "#1F5F78",
		sidebarForeground: "#F8FAFC",
	},
	collection021: {
		id: "collection021",
		accent: "#3965A7",
		headerBackground: "#F7FAFF",
		headerForeground: "#233B63",
		headingBackground: "#EAF0FA",
		headingMode: "tag",
	},
	collection022: {
		id: "collection022",
		accent: "#30B159",
		headerBackground: "#FFFFFF",
		headerForeground: "#255C37",
		headingBackground: "#EAF8EF",
		headingMode: "bar",
		sidebarBackground: "#EAF8EF",
		sidebarForeground: "#255C37",
	},
	collection024: {
		id: "collection024",
		accent: "#2F84BD",
		headerBackground: "#FFFFFF",
		headerForeground: "#1F4F70",
		headingBackground: "#EAF5FC",
		headingMode: "line",
		sidebarBackground: "#EDF7FD",
		sidebarForeground: "#1F4F70",
	},
	collection026: {
		id: "collection026",
		accent: "#E8892B",
		density: "compact",
		fullBleedSidebar: true,
		headerBackground: "#FFFFFF",
		headerForeground: "#2B2F34",
		headingBackground: "#FFF1E3",
		headingMode: "line",
		referenceStyle: "darkOrange",
		sidebarBackground: "#2F3740",
		sidebarForeground: "#F8FAFC",
		visualTreatment: "leftBlock",
	},
	collection027: {
		id: "collection027",
		accent: "#50B46B",
		headerBackground: "#F8FCF9",
		headerForeground: "#255C37",
		headingBackground: "#EAF8EF",
		headingMode: "tag",
	},
	collection028: {
		id: "collection028",
		accent: "#4C8BBF",
		density: "compact",
		fullBleedSidebar: true,
		headerBackground: "#FFFFFF",
		headerForeground: "#1F4F70",
		headingBackground: "#EAF5FC",
		headingMode: "line",
		referenceStyle: "qrSidebar",
		sectionFrame: "boxed",
		sidebarBackground: "#6BA4CD",
		sidebarForeground: "#F8FAFC",
		visualTreatment: "contactBand",
	},
	collection029: {
		id: "collection029",
		accent: "#2896D7",
		headerBackground: "#FFFFFF",
		headerForeground: "#214D6A",
		headingBackground: "#E9F6FD",
		headingMode: "bar",
		sidebarBackground: "#EDF8FE",
		sidebarForeground: "#214D6A",
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
		const sidebarColumn = hasSidebar ? (
			<View
				style={composeStyles(styles.sidebarColumn, {
					flexBasis: `${metadata.layout.sidebarWidth}%`,
					rowGap: metrics.sectionGap * (variant.visualTreatment === "contactBand" ? 0.72 : 0.82),
				})}
			>
				{showHeader && variant.referenceStyle !== "blueBlocks" && <SidebarHeader styles={styles} variant={variant} />}
				{sidebarSections.map((section) => (
					<Fragment key={section}>
						<Section section={section} placement="sidebar" />
					</Fragment>
				))}
			</View>
		) : null;
		const mainColumn = (
			<View
				style={composeStyles(styles.mainColumn, {
					rowGap: metrics.sectionGap * (variant.visualTreatment === "timelineStrip" ? 0.76 : 1),
				})}
			>
				{mainSections.map((section) => (
					<Section key={section} section={section} placement="main" />
				))}
			</View>
		);

		return (
			<Page size={pageSize} style={composeStyles(styles.page, pageMinHeightStyle)}>
				<TemplateProvider styles={styles} featureStyles={featureStyles} colors={colors} features={collectionFeatures}>
					{showHeader && (!hasSidebar || variant.referenceStyle === "blueBlocks") && (
						<FullHeader styles={styles} variant={variant} />
					)}

					<View style={composeStyles(styles.contentRow, { columnGap: metrics.columnGap })}>
						{variant.sidebarSide === "right" ? mainColumn : sidebarColumn}
						{variant.sidebarSide === "right" ? sidebarColumn : mainColumn}
					</View>
				</TemplateProvider>
			</Page>
		);
	};

const FullHeader = ({ styles, variant }: HeaderProps) => {
	const { basics, picture } = useRender();
	const hasPicture = hasTemplatePicture(picture);

	return (
		<View style={styles.header}>
			{variant.headerMode ? (
				<View style={styles.headerBadge}>
					<Text style={styles.headerBadgeTitle}>
						{variant.headerMode === "center" ? "\u4e2a\u4eba\u7b80\u5386" : "\u6c42\u804c\u7b80\u5386"}
					</Text>
					<Text style={styles.headerBadgeCaption}>PERSONAL RESUME</Text>
				</View>
			) : null}

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

const SidebarHeader = ({ styles, variant }: HeaderProps) => {
	const { basics, picture } = useRender();
	const hasPicture = hasTemplatePicture(picture);

	return (
		<View style={styles.sidebarHeader}>
			{hasPicture && <Image src={picture.url} style={styles.sidebarPicture} />}
			<Heading style={styles.sidebarName}>{basics.name}</Heading>
			{basics.headline && <Text style={styles.sidebarHeadline}>{basics.headline}</Text>}
			<View style={styles.sidebarContactList}>
				{basics.email && (
					<Link src={`mailto:${basics.email}`} style={styles.sidebarContactItem}>
						<Icon name="envelope" />
						<Text>{basics.email}</Text>
					</Link>
				)}
				{basics.phone && (
					<Link src={`tel:${basics.phone}`} style={styles.sidebarContactItem}>
						<Icon name="phone" />
						<Text>{basics.phone}</Text>
					</Link>
				)}
				{basics.location && (
					<View style={styles.sidebarContactItem}>
						<Icon name="map-pin" />
						<Text>{basics.location}</Text>
					</View>
				)}
				<WebsiteContactItem website={basics.website} style={styles.sidebarContactItem} />
				{basics.customFields.map((field) => (
					<CustomFieldContactItem key={field.id} field={field} style={styles.sidebarContactItem} />
				))}
			</View>
			{variant.referenceStyle === "qrSidebar" ? <SidebarQr styles={styles} /> : null}
		</View>
	);
};

const SidebarQr = ({ styles }: Pick<HeaderProps, "styles">) => {
	const qrCells = [0, 1, 2, 4, 6, 8, 9, 11, 12, 14, 16, 18, 20, 22, 24];

	return (
		<View style={styles.sidebarQrWrap}>
			<Text style={styles.sidebarQrTitle}>{"\u4f5c\u54c1\u5165\u53e3"}</Text>
			<View style={styles.sidebarQrBox}>
				<View style={styles.sidebarQrGrid}>
					{Array.from({ length: 25 }).map((_, index) => (
						<View
							key={`qr-${index}`}
							style={composeStyles(styles.sidebarQrCell, {
								backgroundColor: qrCells.includes(index) ? "#111827" : "#FFFFFF",
							})}
						/>
					))}
				</View>
			</View>
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
		const isCompact = variant.density === "compact";
		const isDarkOrange = variant.referenceStyle === "darkOrange";
		const isQrSidebar = variant.referenceStyle === "qrSidebar";
		const isBoxed = variant.sectionFrame === "boxed";
		const isTimelineStrip = variant.visualTreatment === "timelineStrip";
		const isLeftBlock = variant.visualTreatment === "leftBlock";
		const isContactBand = variant.visualTreatment === "contactBand";
		const sectionHeadingMainPaddingLeft =
			variant.headingMode === "tag" ? metrics.gapX(0.42) : variant.headingMode === "bar" ? metrics.gapX(0.38) : 0;

		const bodyText = {
			fontFamily: metadata.typography.body.fontFamily,
			fontSize: isTimelineStrip
				? metadata.typography.body.fontSize * 0.92
				: isCompact
					? metadata.typography.body.fontSize * 0.94
					: metadata.typography.body.fontSize,
			fontWeight: metadata.typography.body.fontWeights[0] ?? "400",
			lineHeight: Math.min(metadata.typography.body.lineHeight, isTimelineStrip ? 1.28 : isCompact ? 1.34 : 1.42),
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
				fontSize: bodyText.fontSize,
				lineHeight: bodyText.lineHeight,
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
				rowGap: metrics.gapY(isTimelineStrip ? 0.16 : isCompact ? 0.2 : 0.28),
			},
			sectionHeading: {
				...sectionHeadingBase,
				...headingVariant,
			},
			sectionItems: {
				rowGap: metrics.gapY(isTimelineStrip ? 0.18 : isCompact ? 0.24 : 0.34),
			},
			item: {
				rowGap: metrics.gapY(isCompact ? 0.1 : 0.13),
				borderBottomWidth: 0.35,
				borderBottomColor: subtle,
				paddingBottom: metrics.gapY(isCompact ? 0.12 : 0.18),
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
				paddingHorizontal: metrics.gapX(0.78),
				paddingVertical: metrics.gapY(0.88),
			},
			mainColumn: {
				flex: 1,
				rowGap: metrics.gapY(isCompact ? 0.52 : 0.7),
			},
			header: {
				flexDirection: r.row,
				flexWrap: "wrap",
				alignItems: "flex-start",
				rowGap: metrics.gapY(0.28),
				columnGap: metrics.gapX(0.8),
				backgroundColor: variant.referenceStyle === "blueBlocks" ? primary : variant.headerBackground,
				borderTopWidth: variant.headerMode === "band" ? 8 : variant.headingMode === "line" ? 5 : 0,
				borderTopColor: variant.referenceStyle === "blueBlocks" ? primary : primary,
				borderBottomWidth: variant.referenceStyle === "blueBlocks" ? 0 : 2,
				borderBottomColor: primary,
				paddingHorizontal: metrics.gapX(variant.referenceStyle === "blueBlocks" ? 1.0 : 0.7),
				paddingTop: metrics.gapY(variant.referenceStyle === "blueBlocks" ? 1.0 : 0.52),
				paddingBottom: metrics.gapY(variant.referenceStyle === "blueBlocks" ? 0.92 : 0.54),
			},
			headerBadge: {
				width: "100%",
				alignItems: variant.headerMode === "center" ? "center" : "flex-start",
				backgroundColor: variant.headerMode === "pill" ? primary : "transparent",
				borderRadius: variant.headerMode === "pill" ? 14 : 0,
				paddingHorizontal: variant.headerMode === "pill" ? metrics.gapX(0.58) : 0,
				paddingVertical: variant.headerMode === "pill" ? metrics.gapY(0.12) : 0,
			},
			headerBadgeTitle: {
				color: variant.headerMode === "pill" || variant.referenceStyle === "blueBlocks" ? "#FFFFFF" : primary,
				fontFamily: metadata.typography.heading.fontFamily,
				fontSize: metadata.typography.heading.fontSize * 1.05,
				fontWeight: metadata.typography.heading.fontWeights.at(-1) ?? "700",
				lineHeight: 1.1,
			},
			headerBadgeCaption: {
				color: variant.headerMode === "pill" || variant.referenceStyle === "blueBlocks" ? "#DCEEEF" : muted,
				fontSize: metadata.typography.body.fontSize * 0.64,
				letterSpacing: 0,
				lineHeight: 1.1,
			},
			headerIdentity: {
				flex: 1,
				...r.headerIdentity,
				rowGap: metrics.gapY(0.16),
			},
			headerName: {
				color: variant.referenceStyle === "blueBlocks" ? "#FFFFFF" : variant.headerForeground,
				fontSize: metadata.typography.heading.fontSize * 1.76,
				lineHeight: headerNameLineHeight,
			},
			headerHeadline: {
				color: variant.referenceStyle === "blueBlocks" ? "#EAF5FC" : muted,
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
				color: variant.referenceStyle === "blueBlocks" ? "#EAF5FC" : muted,
			},
			picture: {
				width: Math.min(picture.size, variant.referenceStyle === "blueBlocks" ? 74 : 54),
				height: Math.min(picture.size, variant.referenceStyle === "blueBlocks" ? 74 : 54),
				objectFit: "cover",
				aspectRatio: picture.aspectRatio,
				borderRadius: Math.min(picture.borderRadius, 4),
				borderColor: variant.referenceStyle === "blueBlocks" ? "#D8E8F4" : rgbaStringToHex(picture.borderColor),
				borderWidth: variant.referenceStyle === "blueBlocks" ? 2 : picture.borderWidth,
				shadowColor: rgbaStringToHex(picture.shadowColor),
				shadowWidth: picture.shadowWidth,
				transform: `rotate(${picture.rotation}deg)`,
			},
			sidebarHeader: {
				alignItems: isContactBand ? "stretch" : "center",
				rowGap: metrics.gapY(isContactBand ? 0.24 : isQrSidebar ? 0.32 : 0.26),
				paddingBottom: metrics.gapY(isContactBand ? 0.52 : variant.fullBleedSidebar ? 0.64 : 0.44),
				borderBottomWidth: 0.6,
				borderBottomColor: isDarkOrange ? "#535B64" : variant.sidebarForeground ? "#45617A" : subtle,
			},
			sidebarPicture: {
				width: Math.min(picture.size, variant.fullBleedSidebar ? 86 : 62),
				height: Math.min(picture.size, variant.fullBleedSidebar ? 86 : 62),
				objectFit: "cover",
				aspectRatio: picture.aspectRatio,
				borderRadius: isQrSidebar ? 2 : 4,
				borderColor: isDarkOrange ? "#F8FAFC" : primary,
				borderWidth: variant.fullBleedSidebar ? 2 : 1.2,
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
			sidebarContactList: {
				width: "100%",
				rowGap: metrics.gapY(isContactBand ? 0.1 : 0.12),
				backgroundColor: isContactBand ? "#5A94BB" : "transparent",
				borderLeftWidth: isContactBand ? 3 : 0,
				borderLeftColor: "#F8FAFC",
				paddingHorizontal: isContactBand ? metrics.gapX(0.3) : 0,
				paddingVertical: isContactBand ? metrics.gapY(0.22) : 0,
			},
			sidebarContactItem: {
				flexDirection: r.row,
				alignItems: "center",
				columnGap: metrics.gapX(0.16),
				color: isContactBand ? "#FFFFFF" : sidebarMuted,
			},
			sidebarQrWrap: {
				width: "100%",
				rowGap: metrics.gapY(0.18),
				marginTop: metrics.gapY(0.28),
			},
			sidebarQrTitle: {
				color: sidebarForeground,
				fontFamily: metadata.typography.heading.fontFamily,
				fontSize: metadata.typography.heading.fontSize * 0.88,
				fontWeight: metadata.typography.heading.fontWeights.at(-1) ?? "700",
				borderBottomWidth: 1.2,
				borderBottomColor: "#F8FAFC",
				paddingBottom: metrics.gapY(0.12),
			},
			sidebarQrBox: {
				width: isContactBand ? 68 : 76,
				height: isContactBand ? 68 : 76,
				alignSelf: "center",
				backgroundColor: "#FFFFFF",
				padding: isContactBand ? 6 : 7,
			},
			sidebarQrGrid: {
				flexDirection: "row",
				flexWrap: "wrap",
				width: "100%",
				height: "100%",
			},
			sidebarQrCell: {
				width: "20%",
				height: "20%",
				borderWidth: 0.5,
				borderColor: "#FFFFFF",
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
				left: isTimelineStrip ? 4.5 : 6.5,
				width: isTimelineStrip ? 1.4 : 1,
				backgroundColor: primary,
			},
			item: {
				flexDirection: "row",
				columnGap: metrics.gapX(isTimelineStrip ? 0.3 : 0.42),
				position: "relative",
			},
			marker: {
				width: isTimelineStrip ? 10 : 14,
				alignItems: "center",
			},
			dot: {
				width: isTimelineStrip ? 5 : 7,
				height: isTimelineStrip ? 5 : 7,
				marginTop: isTimelineStrip ? 7 : 8,
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
				section: (context) => ({
					...baseStyles.section,
					...(context.placement === "main" && isBoxed
						? {
								borderWidth: 1,
								borderColor: primary,
								paddingHorizontal: metrics.gapX(0.46),
								paddingTop: metrics.gapY(0.34),
								paddingBottom: metrics.gapY(0.38),
							}
						: {}),
				}),
				sectionHeading: (context) => ({
					...baseStyles.sectionHeading,
					color: context.placement === "sidebar" ? sidebarForeground : isDarkOrange ? primary : foreground,
					borderLeftColor: accentFor(context),
					borderTopColor: accentFor(context),
					borderBottomColor: context.placement === "sidebar" ? (isDarkOrange ? "#535B64" : "#45617A") : primary,
					backgroundColor:
						context.placement === "sidebar" || isDarkOrange || isBoxed ? "transparent" : variant.headingBackground,
					...(context.placement === "main" && isLeftBlock
						? {
								backgroundColor: variant.headingBackground,
								borderBottomWidth: 0,
								borderLeftWidth: 5,
								paddingLeft: metrics.gapX(0.5),
								paddingTop: metrics.gapY(0.16),
							}
						: {}),
					fontSize:
						context.placement === "main" && (isDarkOrange || isBoxed)
							? metadata.typography.heading.fontSize * 1.05
							: baseStyles.sectionHeading.fontSize,
					paddingBottom:
						context.placement === "main" && (isDarkOrange || isBoxed)
							? metrics.gapY(0.18)
							: headingVariant.paddingBottom,
					paddingLeft: context.placement === "sidebar" ? 0 : sectionHeadingMainPaddingLeft,
				}),
				item: (context) => ({
					...baseStyles.item,
					borderBottomColor: context.placement === "sidebar" ? (isDarkOrange ? "#535B64" : "#45617A") : subtle,
					...(context.placement === "main" && isLeftBlock
						? {
								borderBottomWidth: 0.2,
								borderLeftWidth: 2,
								borderLeftColor: primary,
								paddingLeft: metrics.gapX(0.36),
							}
						: {}),
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
export const Collection007Page = createCollectionPage(variants.collection007);
export const Collection016Page = createCollectionPage(variants.collection016);
export const Collection017Page = createCollectionPage(variants.collection017);
export const Collection018Page = createCollectionPage(variants.collection018);
export const Collection019Page = createCollectionPage(variants.collection019);
export const Collection020Page = createCollectionPage(variants.collection020);
export const Collection021Page = createCollectionPage(variants.collection021);
export const Collection022Page = createCollectionPage(variants.collection022);
export const Collection024Page = createCollectionPage(variants.collection024);
export const Collection026Page = createCollectionPage(variants.collection026);
export const Collection027Page = createCollectionPage(variants.collection027);
export const Collection028Page = createCollectionPage(variants.collection028);
export const Collection029Page = createCollectionPage(variants.collection029);
