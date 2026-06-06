import type { Template } from "@reactive-resume/schema/templates";
import type { TemplatePage } from "../document";
import { AzurillPage } from "./azurill/AzurillPage";
import { BronzorPage } from "./bronzor/BronzorPage";
import { ChikoritaPage } from "./chikorita/ChikoritaPage";
import {
	Collection001Page,
	Collection002Page,
	Collection003Page,
	Collection005Page,
	Collection007Page,
	Collection016Page,
	Collection017Page,
	Collection018Page,
	Collection019Page,
	Collection020Page,
	Collection021Page,
	Collection022Page,
	Collection024Page,
	Collection026Page,
	Collection027Page,
	Collection028Page,
	Collection029Page,
} from "./collection/CollectionPage";
import { DitgarPage } from "./ditgar/DitgarPage";
import { DittoPage } from "./ditto/DittoPage";
import { GengarPage } from "./gengar/GengarPage";
import { GlaliePage } from "./glalie/GlaliePage";
import { KakunaPage } from "./kakuna/KakunaPage";
import { LaprasPage } from "./lapras/LaprasPage";
import { LeafishPage } from "./leafish/LeafishPage";
import { MeowthPage } from "./meowth/MeowthPage";
import { OnyxPage } from "./onyx/OnyxPage";
import { PikachuPage } from "./pikachu/PikachuPage";
import { RhyhornPage } from "./rhyhorn/RhyhornPage";
import { ScizorPage } from "./scizor/ScizorPage";

export const templatePages = {
	azurill: AzurillPage,
	bronzor: BronzorPage,
	collection001: Collection001Page,
	collection002: Collection002Page,
	collection003: Collection003Page,
	collection005: Collection005Page,
	collection007: Collection007Page,
	collection016: Collection016Page,
	collection017: Collection017Page,
	collection018: Collection018Page,
	collection019: Collection019Page,
	collection020: Collection020Page,
	collection021: Collection021Page,
	collection022: Collection022Page,
	collection024: Collection024Page,
	collection026: Collection026Page,
	collection027: Collection027Page,
	collection028: Collection028Page,
	collection029: Collection029Page,
	chikorita: ChikoritaPage,
	ditgar: DitgarPage,
	ditto: DittoPage,
	gengar: GengarPage,
	glalie: GlaliePage,
	kakuna: KakunaPage,
	lapras: LaprasPage,
	leafish: LeafishPage,
	meowth: MeowthPage,
	onyx: OnyxPage,
	pikachu: PikachuPage,
	rhyhorn: RhyhornPage,
	scizor: ScizorPage,
} satisfies Record<Template, TemplatePage>;

export const defaultTemplatePage = OnyxPage;

export const getTemplatePage = (template: Template): TemplatePage => templatePages[template] ?? defaultTemplatePage;

export {
	AzurillPage,
	BronzorPage,
	ChikoritaPage,
	Collection001Page,
	Collection002Page,
	Collection003Page,
	Collection005Page,
	Collection007Page,
	Collection016Page,
	Collection017Page,
	Collection018Page,
	Collection019Page,
	Collection020Page,
	Collection021Page,
	Collection022Page,
	Collection024Page,
	Collection026Page,
	Collection027Page,
	Collection028Page,
	Collection029Page,
	DitgarPage,
	DittoPage,
	GengarPage,
	GlaliePage,
	KakunaPage,
	LaprasPage,
	LeafishPage,
	MeowthPage,
	OnyxPage,
	PikachuPage,
	RhyhornPage,
	ScizorPage,
};
