import z from "zod";

export const templateSchema = z.enum([
	"azurill",
	"bronzor",
	"collection001",
	"collection002",
	"collection003",
	"collection005",
	"collection016",
	"collection020",
	"collection021",
	"collection024",
	"chikorita",
	"ditgar",
	"ditto",
	"gengar",
	"glalie",
	"kakuna",
	"lapras",
	"leafish",
	"meowth",
	"onyx",
	"pikachu",
	"rhyhorn",
	"scizor",
]);

export type Template = z.infer<typeof templateSchema>;
