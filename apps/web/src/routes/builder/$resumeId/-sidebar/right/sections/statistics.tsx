import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { InfoIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { Accordion, AccordionContent, AccordionItem } from "@reactive-resume/ui/components/accordion";
import { Alert, AlertDescription, AlertTitle } from "@reactive-resume/ui/components/alert";
import { orpc } from "@/libs/orpc/client";
import { SectionBase } from "../shared/section-base";

export function StatisticsSectionBuilder() {
	const params = useParams({ from: "/builder/$resumeId" });
	const { data: statistics } = useQuery(
		orpc.resume.statistics.getById.queryOptions({ input: { id: params.resumeId } }),
	);

	if (!statistics) return null;

	return (
		<SectionBase type="statistics">
			<Accordion value={statistics.isPublic ? ["isPublic"] : ["isPrivate"]}>
				<AccordionItem value="isPrivate">
					<AccordionContent className="pb-0">
						<Alert>
							<InfoIcon />
							<AlertTitle>
								<Trans>跟踪简历浏览和下载</Trans>
							</AlertTitle>
							<AlertDescription>
								<Trans>开启公开分享后，可以统计这份简历被浏览或下载的次数。只有你可以看到这些统计数据。</Trans>
							</AlertDescription>
						</Alert>
					</AccordionContent>
				</AccordionItem>

				<AccordionItem value="isPublic">
					<AccordionContent className="grid @md:grid-cols-2 grid-cols-1 gap-4 pb-0">
						<StatisticsItem
							label={t`浏览`}
							value={statistics.views}
							timestamp={statistics.lastViewedAt ? t`最后浏览于 ${statistics.lastViewedAt.toDateString()}` : null}
						/>

						<StatisticsItem
							label={t`下载`}
							value={statistics.downloads}
							timestamp={
								statistics.lastDownloadedAt ? t`最后下载于 ${statistics.lastDownloadedAt.toDateString()}` : null
							}
						/>
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		</SectionBase>
	);
}

type StatisticsItemProps = {
	label: string;
	value: number;
	timestamp: string | null;
};

function StatisticsItem({ label, value, timestamp }: StatisticsItemProps) {
	return (
		<div>
			<h4 className="mb-1 font-mono font-semibold text-4xl">{value}</h4>
			<p className="font-medium text-muted-foreground leading-none">{label}</p>
			{timestamp && <span className="text-muted-foreground text-xs">{timestamp}</span>}
		</div>
	);
}
