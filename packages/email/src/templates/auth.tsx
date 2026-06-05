import {
	Body,
	Button,
	Container,
	Font,
	Head,
	Heading,
	Hr,
	Html,
	Img,
	Link,
	Preview,
	pixelBasedPreset,
	Section,
	Tailwind,
	Text,
} from "react-email";

const appName = "锐历";

interface AuthEmailLayoutProps {
	preview: string;
	heading: string;
	intro: string;
	details?: string;
	actionLabel: string;
	actionUrl: string;
	outro: string;
}

function AuthEmailLayout({ preview, heading, intro, details, actionLabel, actionUrl, outro }: AuthEmailLayoutProps) {
	const logoUrl = new URL("/icon/dark.svg", actionUrl).toString();

	return (
		<Html lang="zh-CN">
			<Tailwind
				config={{
					presets: [pixelBasedPreset],
					theme: {
						fontFamily: {
							body: ["IBM Plex Sans", "sans-serif"],
							heading: ["IBM Plex Sans Condensed", "sans-serif"],
						},
					},
				}}
			>
				<Head>
					<Font
						fontFamily="IBM Plex Sans Condensed"
						fallbackFontFamily="sans-serif"
						fontWeight={500}
						fontStyle="normal"
						webFont={{
							url: "https://fonts.gstatic.com/s/ibmplexsans/v23/zYXGKVElMYYaJe8bpLHnCwDKr932-G7dytD-DmvrswZSAXcomDVmadSD2FlDB6g4tIOm6_De.woff2",
							format: "woff2",
						}}
					/>
					<Font
						fontFamily="IBM Plex Sans"
						fallbackFontFamily="sans-serif"
						fontWeight={400}
						fontStyle="normal"
						webFont={{
							url: "https://fonts.gstatic.com/s/ibmplexsans/v23/zYXGKVElMYYaJe8bpLHnCwDKr932-G7dytD-Dmu1swZSAXcomDVmadSD6llDB6g4tIOm6_De.woff2",
							format: "woff2",
						}}
					/>
				</Head>

				<Body className="m-0 bg-zinc-950 p-0 font-body text-sm text-zinc-50">
					<Preview>{preview}</Preview>
					<Container className="mx-auto w-full max-w-xl bg-zinc-900 p-6 text-zinc-50">
						<Section>
							<Img src={logoUrl} alt={appName} width="48" height="48" className="block" />
						</Section>

						<Section className="mt-6">
							<Heading className="whitespace-break-spaces font-heading font-medium text-2xl leading-0 tracking-tighter md:text-5xl">
								{heading}
							</Heading>

							<Section className="mt-6 md:mt-12">
								<Text>{intro}</Text>

								{details ? <Text className="opacity-60">{details}</Text> : null}
							</Section>

							<Button
								target="_blank"
								href={actionUrl}
								className="mt-6 box-border inline-block bg-zinc-200 px-6 py-3 text-center text-zinc-900 no-underline"
							>
								{actionLabel}
							</Button>

							<Section className="mt-8">
								<Text className="leading-0">如果按钮无法使用，请复制下面的链接到浏览器打开：</Text>
								<Link className="text-zinc-200/60 leading-0 underline underline-offset-2" href={actionUrl}>
									{actionUrl}
								</Link>
							</Section>

							<Section className="mt-4">
								<Text className="opacity-60">{outro}</Text>
							</Section>

							<Hr className="my-10 border-zinc-700" />

							<Text className="mt-8 text-xs leading-1 opacity-40">中文简历生成与优化工作台。</Text>
							<Text className="text-xs leading-1 opacity-40">
								基于开源项目 Reactive Resume 二次开发，原项目作者为{" "}
								<Link
									target="_blank"
									rel="noopener noreferrer"
									href="https://amruthpillai.com"
									className="text-inherit underline underline-offset-2"
								>
									Amruth Pillai
								</Link>
								。
							</Text>

							<Text className="mt-8 font-heading font-medium text-base tracking-tight opacity-80">锐历</Text>
						</Section>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
}

interface ResetPasswordEmailProps {
	url: string;
}

export function ResetPasswordEmail({ url }: ResetPasswordEmailProps) {
	return (
		<AuthEmailLayout
			preview={`重置你的 ${appName} 密码`}
			heading="重置密码"
			intro={`我们收到了重置 ${appName} 密码的请求。`}
			details="如果不是你本人操作，可以忽略这封邮件，你的密码不会被修改。"
			actionLabel="创建新密码"
			actionUrl={url}
			outro="为了账户安全，请只使用锐历官方邮件中的链接。"
		/>
	);
}

interface VerifyEmailProps {
	url: string;
}

export function VerifyEmail({ url }: VerifyEmailProps) {
	return (
		<AuthEmailLayout
			preview={`验证你的 ${appName} 邮箱`}
			heading="验证邮箱"
			intro={`感谢注册 ${appName}。请验证你的邮箱地址后继续使用。`}
			details="邮箱验证可以帮助我们保护你的账户和登录安全。"
			actionLabel="验证邮箱"
			actionUrl={url}
			outro="如果你没有创建这个账户，可以安全地忽略这封邮件。"
		/>
	);
}

interface VerifyEmailChangeProps {
	url: string;
	previousEmail: string;
	newEmail: string;
}

export function VerifyEmailChange({ url, previousEmail, newEmail }: VerifyEmailChangeProps) {
	return (
		<AuthEmailLayout
			preview={`确认你的 ${appName} 新邮箱`}
			heading="确认邮箱变更"
			intro={`你正在把 ${appName} 登录邮箱从 ${previousEmail} 修改为 ${newEmail}。`}
			details="确认本次变更后，新邮箱将用于后续账户访问。"
			actionLabel="验证新邮箱"
			actionUrl={url}
			outro="如果你没有发起这次变更，请忽略这封邮件并及时检查账户安全。"
		/>
	);
}
