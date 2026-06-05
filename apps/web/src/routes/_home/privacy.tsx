import { createFileRoute } from "@tanstack/react-router";

const dataCategories = [
	{
		title: "账号与基础资料",
		body: "注册、登录和使用过程中会处理账号标识、邮箱、用户名、头像、偏好设置以及必要的安全记录，用于提供登录、同步、导出和账户管理能力。",
	},
	{
		title: "简历内容与上传文件",
		body: "你在编辑器中填写的教育经历、工作经历、项目经历、技能、链接、附件和导入文件会用于生成、预览、导出和恢复简历。PDF、Word、图片和扫描件导入会把文件内容发送给你配置或实例配置的 AI/OCR 服务商用于解析；JSON 导入只在本系统内读取。",
	},
	{
		title: "公开分享与访问统计",
		body: "当你主动开启公开分享链接时，简历内容会通过对应链接展示给访问者。系统可能记录必要的访问、错误和性能信息，用于排查问题、保障服务稳定和评估产品体验。",
	},
	{
		title: "AI/OCR 服务商",
		body: "图片简历、扫描版 PDF 会发送到 Azure Document Intelligence 做 OCR；识别出的文本会继续交给 AI 模型解析。AI 优化、AI 导入和改写功能会把你提交的简历内容、岗位信息或提示词发送给当前配置的模型服务商。",
	},
];

const responsibilityItems = [
	"如果你自托管锐历，实际的数据存储、备份、日志、邮件、对象存储、AI/OCR 密钥和第三方服务配置由部署方负责。",
	"如果你使用他人部署的锐历实例，请确认该实例运营者提供的隐私政策、服务条款、删除流程和联系方式。",
	"请不要在简历或上传文件中填写不必要的身份证号、银行卡号、家庭详细住址、健康记录等敏感信息。",
];

export const Route = createFileRoute("/_home/privacy")({
	component: PrivacyRoute,
	head: () => ({
		meta: [
			{ title: "隐私与数据处理说明 - 锐历" },
			{
				name: "description",
				content: "了解锐历在中文简历编辑、导入、导出、公开分享以及 AI/OCR 功能中的数据处理方式。",
			},
		],
	}),
});

function PrivacyRoute() {
	return (
		<main id="main-content" className="border-border border-y">
			<section className="container mx-auto px-4 py-16 sm:px-6 lg:px-12 lg:py-20">
				<div className="mx-auto max-w-4xl">
					<p className="font-medium text-muted-foreground text-sm">产品说明</p>
					<h1 className="mt-3 font-semibold text-4xl tracking-tight sm:text-5xl">隐私与数据处理说明</h1>
					<p className="mt-6 max-w-3xl text-foreground/75 leading-8">
						这份说明帮助你理解锐历在中文简历编辑、模板预览、PDF/DOCX 导出、公开分享以及 AI/OCR
						辅助功能中的数据流向。它是一份产品层面的数据处理说明，不替代正式法律意见。
					</p>
				</div>
			</section>

			<section className="container mx-auto px-4 pb-16 sm:px-6 lg:px-12 lg:pb-24">
				<div className="mx-auto grid max-w-4xl gap-10 lg:grid-cols-[0.82fr_1.18fr]">
					<div>
						<h2 className="font-semibold text-2xl tracking-tight">我们处理哪些数据</h2>
						<p className="mt-4 text-foreground/72 leading-7">
							锐历只应处理完成简历创建、优化、导入、导出和分享所需的数据。不同部署实例的实际处理范围，取决于部署方开启的功能和第三方服务配置。
						</p>
					</div>

					<div className="space-y-8">
						{dataCategories.map((category) => (
							<section key={category.title} className="border-border border-b pb-8 last:border-b-0 last:pb-0">
								<h3 className="font-semibold text-lg tracking-tight">{category.title}</h3>
								<p className="mt-3 text-foreground/72 leading-7">{category.body}</p>
							</section>
						))}
					</div>
				</div>
			</section>

			<section className="bg-secondary/35">
				<div className="container mx-auto px-4 py-14 sm:px-6 lg:px-12 lg:py-18">
					<div className="mx-auto grid max-w-4xl gap-10 lg:grid-cols-[0.82fr_1.18fr]">
						<div>
							<h2 className="font-semibold text-2xl tracking-tight">自托管与部署方责任</h2>
							<p className="mt-4 text-foreground/72 leading-7">
								锐历是基于开源项目二次开发的产品。上线前，部署方需要为自己的实例补齐正式的隐私政策、服务条款、联系方式和数据删除流程。
							</p>
						</div>

						<ul className="space-y-4">
							{responsibilityItems.map((item) => (
								<li key={item} className="border-border border-l-2 pl-4 text-foreground/72 leading-7">
									{item}
								</li>
							))}
						</ul>
					</div>
				</div>
			</section>

			<section className="container mx-auto px-4 py-16 sm:px-6 lg:px-12 lg:py-20">
				<div className="mx-auto grid max-w-4xl gap-10 lg:grid-cols-[0.82fr_1.18fr]">
					<div>
						<h2 className="font-semibold text-2xl tracking-tight">数据控制</h2>
						<p className="mt-4 text-foreground/72 leading-7">
							你可以在应用内编辑、删除简历，关闭公开分享链接，或删除账户。删除后，系统会尽量移除对应的简历数据、上传文件和导出文件；备份、日志或第三方服务商侧副本可能需要根据部署方和服务商规则处理。
						</p>
					</div>

					<div>
						<h2 className="font-semibold text-2xl tracking-tight">开源来源</h2>
						<p className="mt-4 text-foreground/72 leading-7">
							锐历基于 Reactive Resume 二次开发，遵循 MIT License 保留上游版权与许可说明。公开仓库、上游项目和 MIT
							许可入口已在页脚提供。
						</p>
						<p className="mt-6 text-foreground/60 text-sm leading-6">最后更新：2026 年 6 月 6 日</p>
					</div>
				</div>
			</section>
		</main>
	);
}
