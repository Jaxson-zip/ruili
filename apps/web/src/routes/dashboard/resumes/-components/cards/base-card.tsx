import { Badge } from "@reactive-resume/ui/components/badge";
import { cn } from "@reactive-resume/utils/style";
import { CometCard } from "@/components/animation/comet-card";

type BaseCardProps = {
	asButton?: boolean;
	title: string;
	description: string;
	tags?: string[];
	className?: string;
	children?: React.ReactNode;
	onClick?: React.MouseEventHandler<HTMLButtonElement | HTMLDivElement>;
};

export function BaseCard({ asButton = false, title, description, tags, className, children, onClick }: BaseCardProps) {
	const cardClassName = cn(
		"relative flex aspect-page size-full overflow-hidden rounded-md bg-popover text-left text-foreground shadow transition-shadow hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
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

	return (
		<CometCard translateDepth={3} rotateDepth={6}>
			{asButton ? (
				<button type="button" className={cardClassName} onClick={onClick}>
					{content}
				</button>
			) : (
				<div className={cardClassName}>{content}</div>
			)}
		</CometCard>
	);
}
