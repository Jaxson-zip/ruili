import type { MessageDescriptor } from "@lingui/core";
import type { SectionTitleResolver } from "@reactive-resume/pdf/section-title";
import type { CustomSectionType, SectionType } from "@reactive-resume/schema/resume/data";
import { i18n } from "@lingui/core";
import { msg } from "@lingui/core/macro";

type SectionTranslator = {
	_: (descriptor: MessageDescriptor) => string;
};

const sectionTitleMessages = {
	summary: msg`个人总结`,
	profiles: msg`个人链接`,
	experience: msg`工作经历`,
	education: msg`教育经历`,
	projects: msg`项目经历`,
	skills: msg`技能`,
	languages: msg`语言能力`,
	interests: msg`兴趣爱好`,
	awards: msg`奖项荣誉`,
	certifications: msg`证书认证`,
	publications: msg`发表作品`,
	volunteer: msg`志愿经历`,
	references: msg`推荐人`,
	"cover-letter": msg`求职信`,
} satisfies Record<"summary" | SectionType | CustomSectionType, MessageDescriptor>;

export const createSectionTitleResolver = (translator: SectionTranslator = i18n): SectionTitleResolver => {
	return ({ sectionId, sectionKind, customSectionType, defaultEnglishTitle }) => {
		const sectionType = sectionKind === "custom" ? customSectionType : sectionId;
		const message = sectionTitleMessages[sectionType as keyof typeof sectionTitleMessages];

		if (!message) return defaultEnglishTitle ?? sectionId;

		return translator._(message) || defaultEnglishTitle || sectionId;
	};
};
