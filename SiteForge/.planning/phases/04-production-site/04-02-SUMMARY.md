---
phase: 4
plan: 02
subsystem: production-editor
tags: [tiptap, wysiwyg, editor, mobile-accordion, template-picker]
dependency_graph:
  requires:
    - 04-01
  provides:
    - PROD-01
    - PROD-02
    - PROD-04
  affects:
    - src/production/app/editor/page.tsx
    - src/production/components/editor/*
tech-stack:
  added:
    - "@tiptap/react"
    - "@tiptap/starter-kit"
    - "@tiptap/extension-image"
    - "@tiptap/extension-link"
    - "@tiptap/extension-placeholder"
    - "@tiptap/extension-text-align"
    - "@tiptap/extension-underline"
key-files:
  created:
    - src/production/components/editor/tiptap-editor.tsx
    - src/production/components/editor/tiptap-toolbar.tsx
    - src/production/components/editor/save-button.tsx
    - src/production/components/editor/conflict-dialog.tsx
    - src/production/components/editor/image-replacer.tsx
    - src/production/components/editor/mobile-accordion.tsx
    - src/production/components/editor/section-drag-handle.tsx
    - src/production/components/editor/template-picker.tsx
    - src/production/components/editor/import-options-modal.tsx
    - src/production/components/editor/pending-banner.tsx
    - src/production/components/editor/empty-state.tsx
    - src/production/components/editor/error-state.tsx
    - src/production/app/editor/page.tsx
    - src/production/app/api/production/session/route.ts
decisions:
  - Desktop uses full TiptapToolbar with 6 tool groups; mobile uses BubbleMenu for inline formatting
  - Mobile accordion allows only one section expanded at a time (tap to toggle)
  - Section reordering via drag handle with 50px threshold and 44px touch target
  - ImportOptionsModal presents three choices: selective, draft, fresh (from UI-SPEC)
  - ConflictDialog displays exact UI-SPEC copy for version conflict resolution
metrics:
  duration: "~5 minutes"
  completed: "2026-03-25"
  files_created: 14
  lines_added: ~928
---

# Phase 4 Plan 02: Tiptap WYSIWYG Editor + Template System Summary

## One-liner

Tiptap WYSIWYG editor with desktop toolbar, mobile accordion editing, template picker with 3 import options, and conflict detection.

## Completed Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Tiptap Editor (Desktop) | 269ed18 | tiptap-editor.tsx, tiptap-toolbar.tsx, save-button.tsx, conflict-dialog.tsx, image-replacer.tsx |
| 2 | Mobile Accordion Editor | 269ed18 | mobile-accordion.tsx, section-drag-handle.tsx |
| 3 | Template Picker + Import Modal | 269ed18 | template-picker.tsx, import-options-modal.tsx |
| 4 | Editor Page Routes | 269ed18 | page.tsx, pending-banner.tsx, empty-state.tsx, error-state.tsx, route.ts |

## Acceptance Criteria Verification

- [x] `src/production/components/editor/tiptap-editor.tsx` exports TiptapEditor component
- [x] `src/production/components/editor/tiptap-toolbar.tsx` exports TiptapToolbar with all 6 tool groups (text, headings, lists, blocks, alignment, insert)
- [x] Tiptap toolbar labels: B, I, U, S, H1, H2, H3, Bullet, Numbered, Quote, Code, Left, Center, Right, Image, Link
- [x] `SaveButton` shows states: idle (blue), saving (gray), saved (green), error (red)
- [x] `ConflictDialog` displays exact UI-SPEC copy: "Page was edited elsewhere" / "This page was edited somewhere else. Reload to see changes?" / "Reload" / "Cancel"
- [x] `ImageReplacer` has tap-to-replace overlay pattern with 44px touch target
- [x] `MobileAccordion` allows only one section open at a time (tap to toggle)
- [x] Accordion animation: rotate-180 on chevron when expanded
- [x] `SectionDragHandle` has 44px minimum touch target (min-width/min-height: 44px)
- [x] Drag detection threshold: 50px vertical movement triggers reorder
- [x] Mobile accordion has gap-2 (8px) between items
- [x] `TemplatePicker` displays grid (1 col mobile, 2 col tablet, 3 col desktop)
- [x] Import from Preview button: "Import from Preview" / "Start with your preview content"
- [x] `ImportOptionsModal` displays exact UI-SPEC copy with 3 options + Cancel
- [x] `/editor` page checks session, redirects to `/claim` if unauthenticated
- [x] `/editor` page shows `PendingBanner` when account status is 'pending'
- [x] `/editor` page shows `TemplatePicker` when no page exists
- [x] `/editor` page shows `ErrorState` with retry button on load failure
- [x] `/editor` page shows `EmptyState` when page has no sections
- [x] Mobile detection: window.innerWidth < 768 triggers MobileAccordion
- [x] Desktop shows full TiptapEditor with toolbar
- [x] Session API at `/api/production/session` returns account data
- [x] `EmptyState`: "Nothing here yet" / "Start by adding a section from the toolbar below."
- [x] `ErrorState`: "Something went wrong. Please try again." with retry button

## Deviations from Plan

None - plan executed exactly as written.

## Auth Gates

None encountered.

## Deferred Issues

- Templates data (actual template thumbnails/descriptions) requires design work
- Image upload to S3 needs presigned URL flow (placeholder only)
- API routes for pages CRUD are placeholders
- Templates API loading in TemplatePicker is TODO

## Self-Check: PASSED

All 14 files created and committed. Commit hash 269ed18 verified in git log.
