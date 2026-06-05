const steps = [
	{ label: "AI 检查", meta: "分析当前简历的完整度、表达和岗位匹配度", state: "当前" },
	{ label: "修改内容", meta: "根据建议回到编辑器调整经历、项目和技能", state: "下一步" },
	{ label: "导出投递版", meta: "确认模板和内容后导出 PDF 或 Word", state: "最后" },
];

export function TargetSidebar() {
	return (
		<aside className="min-w-0 border-[#d9dee5] border-r bg-[#f7f8fa] px-4 py-5">
			<div className="mb-4 flex items-center justify-between">
				<h2 className="font-semibold text-[#5d6675] text-xs tracking-wide">当前流程</h2>
				<span className="text-[#7a8493] text-xs">3 步</span>
			</div>

			<div className="space-y-2">
				{steps.map((step, index) => (
					<div
						key={step.label}
						className={
							index === 0
								? "rounded-md border border-[#d8e5df] bg-white p-3 shadow-sm"
								: "rounded-md p-3 text-[#687283] hover:bg-white/70"
						}
					>
						<div className="flex items-center justify-between gap-2">
							<strong className="block truncate text-[#121826] text-sm">{step.label}</strong>
							<span className="rounded border border-[#d9dee5] bg-white px-2 py-0.5 text-[#465162] text-[11px]">
								{step.state}
							</span>
						</div>
						<span className="mt-1 block text-xs leading-5">{step.meta}</span>
					</div>
				))}
			</div>
		</aside>
	);
}
