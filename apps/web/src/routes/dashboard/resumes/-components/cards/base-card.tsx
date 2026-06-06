import { Badge } from "@reactive-resume/ui/components/badge";
import { cn } from "@reactive-resume/utils/style";

type BaseCardProps = {
	asButton?: boolean;
	title: string;
	description: string;
	tags?: string[];
	className?: string;
	testId?: string;
	children?: React.ReactNode;
	onClick?: React.MouseEventHandler<HTMLButtonElement | HTMLDivElement>;
};

export function BaseCard({
	asButton = false,
	title,
	description,
	tags,
	className,
	testId,
	children,
	onClick,
}: BaseCardProps) {
	const cardClassName = cn(
		"relative flex aspect-page size-full overflow-hidden rounded-md border bg-popover text-left text-foreground shadow-sm transition-colors hover:border-foreground/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
		className,
	);
	const content = (
		<>
			{children}

			<div className="absolute inset-x-0 bottom-0 flex w-full flex-col justify-end gap-y-0.5 bg-background/40 px-4 py-3 backdrop-blur-xs">
				<h3 className="truncate font-medium tracking-tight">{title}</h3>
				<p className="truncate text-xs opacity-80">{description}</p>

				<div className={cn("mt-2 hidden flex-wrap items-center gap-1", tags && tags.length > 0 && "flex")}>
					{tags?.map((tag) => (
						<Badge key={tag} variant="secondary">
							{tag}
						</Badge>
					))}
				</div>
			</div>
		</>
	);

	if (asButton) {
		return (
			<button type="button" className={cardClassName} data-testid={testId} onClick={onClick}>
				{content}
			</button>
		);
	}

	return (
		<div className={cardClassName} data-testid={testId}>
			{content}
		</div>
	);
}
