# Word Template Assets

This directory is the single public asset location for built-in Word-style resume templates.

## File Rules

- `zh-<scenario>-<number>.docx`: bundled DOCX export template.
- `zh-<scenario>-<number>.png`: template gallery thumbnail.
- `zh-<scenario>-<number>-photo.jpeg`: bundled sample photo or placeholder asset.

## Current Templates

- `zh-internship-001`: the first official Chinese internship template, now shown to users as `校招实习标准模板`.
- `zh-ats-compact-001`: compact ATS-friendly Chinese template.
- `zh-sidebar-clean-001`: two-column sidebar Chinese template.

## Source Of Truth

The editable realtime canvas is implemented in:

`apps/web/src/features/resume/word-template/preview.tsx`

The public DOCX files in this directory are export assets. They should match the same template id from:

`packages/schema/src/resume/word-template.ts`

Do not add ad-hoc template files elsewhere. New built-in templates need a manifest entry, a thumbnail, a DOCX export asset, and a realtime HTML preview implementation.
