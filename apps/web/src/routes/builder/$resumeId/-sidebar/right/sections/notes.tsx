import { Trans } from "@lingui/react/macro";
import { RichInput } from "@/components/input/rich-input";
import { useCurrentResume, useUpdateResumeData } from "@/features/resume/builder/draft";
import { SectionBase } from "../shared/section-base";

export function NotesSectionBuilder() {
	return (
		<SectionBase type="notes">
			<NotesSectionForm />
		</SectionBase>
	);
}

function NotesSectionForm() {
	const resume = useCurrentResume();
	const notes = resume.data.metadata.notes;
	const updateResumeData = useUpdateResumeData();

	const onChange = (value: string) => {
		updateResumeData((draft) => {
			draft.metadata.notes = value;
		});
	};

	return (
		<div className="space-y-4">
			<p>
				<Trans>这里可以记录这份简历专属的个人备注。内容仅自己可见，不会分享给其他人。</Trans>
			</p>

			<RichInput value={notes} onChange={onChange} />

			<p className="text-muted-foreground">
				<Trans>例如，你可以记录这份简历投递过哪些公司，或保存对应岗位描述链接。</Trans>
			</p>
		</div>
	);
}
