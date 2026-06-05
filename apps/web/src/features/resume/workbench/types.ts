export type WorkbenchTarget = {
	id: string;
	label: string;
	score?: number;
	keywords: string[];
};

export type WorkbenchPatch = {
	id: string;
	title: string;
	status: "recommended" | "needs_confirmation" | "applied" | "rolled_back";
	summary: string;
};
