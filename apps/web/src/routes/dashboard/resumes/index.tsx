import { t } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import {
	ExportIcon,
	GridFourIcon,
	ListIcon,
	PencilSimpleLineIcon,
	ReadCvLogoIcon,
	SquaresFourIcon,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, stripSearchParams, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import z from "zod";
import { Label } from "@reactive-resume/ui/components/label";
import { Separator } from "@reactive-resume/ui/components/separator";
import { Tabs, TabsList, TabsTrigger } from "@reactive-resume/ui/components/tabs";
import { cn } from "@reactive-resume/utils/style";
import { Combobox } from "@/components/ui/combobox";
import { orpc } from "@/libs/orpc/client";
import { DashboardHeader } from "../-components/header";
import { GridView } from "./-components/grid-view";
import { ListView } from "./-components/list-view";

type SortOption = "lastUpdatedAt" | "createdAt" | "name";

const searchSchema = z.object({
	tags: z.array(z.string()).default([]),
	sort: z.enum(["lastUpdatedAt", "createdAt", "name"]).default("lastUpdatedAt"),
	view: z.enum(["grid", "list"]).default("grid"),
});

type Search = z.output<typeof searchSchema>;

const defaultSearch: Search = { tags: [], sort: "lastUpdatedAt", view: "grid" };

export const Route = createFileRoute("/dashboard/resumes/")({
	component: RouteComponent,
	validateSearch: searchSchema,
	search: {
		middlewares: [stripSearchParams(defaultSearch)],
	},
});

function RouteComponent() {
	const { i18n } = useLingui();
	const { tags, sort, view } = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });

	const { data: allTags } = useQuery(orpc.resume.tags.list.queryOptions());
	const { data: resumes } = useQuery(orpc.resume.list.queryOptions({ input: { tags, sort } }));

	const tagOptions = useMemo(() => {
		if (!allTags) return [];
		return allTags.map((tag) => ({ value: tag, label: tag }));
	}, [allTags]);

	const sortOptions = useMemo(() => {
		return [
			{ value: "lastUpdatedAt", label: i18n.t("最近更新") },
			{ value: "createdAt", label: i18n.t("创建时间") },
			{ value: "name", label: i18n.t("名称") },
		];
	}, [i18n]);

	return (
		<div className="space-y-4">
			<DashboardHeader icon={ReadCvLogoIcon} title={t`我的简历`} />

			<Separator />

			<div className="grid gap-2 rounded-md border bg-muted/30 p-3 text-sm md:grid-cols-4">
				<div className="flex items-center gap-2">
					<span className="grid size-6 place-items-center rounded bg-primary text-primary-foreground text-xs">1</span>
					<span className="font-medium">
						<Trans>创建简历</Trans>
					</span>
				</div>
				<div className="flex items-center gap-2 text-muted-foreground">
					<PencilSimpleLineIcon />
					<span>
						<Trans>填写内容</Trans>
					</span>
				</div>
				<div className="flex items-center gap-2 text-muted-foreground">
					<SquaresFourIcon />
					<span>
						<Trans>选择模板</Trans>
					</span>
				</div>
				<div className="flex items-center gap-2 text-muted-foreground">
					<ExportIcon />
					<span>
						<Trans>导出 PDF</Trans>
					</span>
				</div>
			</div>

			<div className="flex items-center gap-x-4">
				<div className="flex gap-2">
					<Label>
						<Trans>排序</Trans>
					</Label>
					<Combobox
						value={sort}
						options={sortOptions}
						placeholder={t`排序`}
						onValueChange={(value) => {
							if (!value) return;
							void navigate({ search: (prev: Search) => ({ ...prev, sort: value as SortOption }) });
						}}
					/>
				</div>

				<div className={cn("flex gap-2", { hidden: tagOptions.length === 0 })}>
					<Label>
						<Trans>筛选</Trans>
					</Label>
					<Combobox
						multiple
						value={tags}
						options={tagOptions}
						placeholder={t`筛选`}
						onValueChange={(value) => {
							void navigate({ search: (prev: Search) => ({ ...prev, tags: value ?? [] }) });
						}}
					/>
				</div>

				<Tabs className="ltr:ms-auto rtl:me-auto" value={view}>
					<TabsList>
						<TabsTrigger
							value="grid"
							nativeButton={false}
							className="rounded-r-none"
							render={<Link to="." search={(prev: Search) => ({ ...prev, view: "grid" })} />}
						>
							<GridFourIcon />
							<Trans>宫格</Trans>
						</TabsTrigger>

						<TabsTrigger
							value="list"
							nativeButton={false}
							className="rounded-l-none"
							render={<Link to="." search={(prev: Search) => ({ ...prev, view: "list" })} />}
						>
							<ListIcon />
							<Trans>列表</Trans>
						</TabsTrigger>
					</TabsList>
				</Tabs>
			</div>

			{view === "list" ? <ListView resumes={resumes ?? []} /> : <GridView resumes={resumes ?? []} />}
		</div>
	);
}
