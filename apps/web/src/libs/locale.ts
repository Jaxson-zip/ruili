import type { Messages } from "@lingui/core";
import type { Locale } from "@reactive-resume/utils/locale";
import { i18n } from "@lingui/core";
import { isRTL } from "@reactive-resume/utils/locale";

export { isRTL };

const defaultLocale: Locale = "zh-CN";
const messageLoaders = import.meta.glob<{ messages: Messages }>("../../locales/*.po");

export const resolveLocale = (_locale: string): Locale => defaultLocale;

export const getLocale = () => {
	return defaultLocale;
};

const loadMessages = async (locale: Locale) => {
	const load = messageLoaders[`../../locales/${locale}.po`];

	if (!load) throw new Error(`Unknown locale: ${locale}`);

	const { messages } = await load();
	return messages;
};

export const getLocaleMessages = async (locale: string) => {
	const resolvedLocale = resolveLocale(locale);
	let messages: Messages;

	try {
		messages = await loadMessages(resolvedLocale);
		return { locale: resolvedLocale, messages };
	} catch {
		messages = await loadMessages(defaultLocale);
		return { locale: defaultLocale, messages };
	}
};

export const loadLocale = async (locale: string) => {
	const { locale: resolvedLocale, messages } = await getLocaleMessages(locale);
	i18n.loadAndActivate({ locale: resolvedLocale, messages });
};
