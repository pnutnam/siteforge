'use client';

import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { useCallback, useEffect, useState } from 'react';
import { TiptapToolbar } from './tiptap-toolbar';
import { ConflictDialog } from './conflict-dialog';
import { SaveButton } from './save-button';

interface TiptapEditorProps {
  initialContent: Record<string, unknown>;  // Tiptap JSON
  pageId: string;
  businessId: string;
  onSave: (content: Record<string, unknown>, version: number) => Promise<{ conflict?: boolean; serverVersion?: number }>;
  isMobile?: boolean;
}

export function TiptapEditor({
  initialContent,
  pageId,
  businessId,
  onSave,
  isMobile = false,
}: TiptapEditorProps) {
  const [showConflict, setShowConflict] = useState(false);
  const [serverVersion, setServerVersion] = useState<number | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Image.configure({
        HTMLAttributes: { class: 'editor-image' },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'editor-link' },
      }),
      Placeholder.configure({
        placeholder: 'Start typing...',
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Underline,
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[200px] px-4 py-3',
        style: 'font-size: 16px; line-height: 1.5;',
      },
    },
    onUpdate: ({ editor }) => {
      // Content changed - mark as unsaved
    },
  });

  const handleSave = useCallback(async () => {
    if (!editor) return;

    const content = editor.getJSON();
    const currentVersion = serverVersion ?? 1;

    try {
      const result = await onSave(content, currentVersion);

      if (result.conflict) {
        setShowConflict(true);
        setServerVersion(result.serverVersion ?? null);
      }
    } catch (error) {
      console.error('Save failed:', error);
    }
  }, [editor, onSave, serverVersion]);

  const handleConflictReload = useCallback(() => {
    // In real impl, refetch content from server
    setShowConflict(false);
  }, []);

  if (!editor) {
    return <div className="animate-pulse h-[200px] bg-gray-100 rounded" />;
  }

  return (
    <div className="editor-container border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Toolbar - full on desktop, hidden on mobile (accordion handles mobile) */}
      {!isMobile && <TiptapToolbar editor={editor} />}

      {/* Bubble menu for inline formatting */}
      <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
        <div className="bg-white shadow-lg border border-gray-200 rounded flex gap-1 p-1">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded ${editor.isActive('bold') ? 'bg-gray-100' : ''}`}
          >
            B
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded ${editor.isActive('italic') ? 'bg-gray-100' : ''}`}
          >
            I
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-2 rounded ${editor.isActive('underline') ? 'bg-gray-100' : ''}`}
          >
            U
          </button>
        </div>
      </BubbleMenu>

      {/* Editor content */}
      <EditorContent
        editor={editor}
        className="cursor-text"
      />

      {/* Save button fixed at bottom */}
      <div className="border-t border-gray-200 p-3 bg-gray-50">
        <SaveButton onSave={handleSave} />
      </div>

      {/* Conflict dialog */}
      {showConflict && (
        <ConflictDialog
          onReload={handleConflictReload}
          onCancel={() => setShowConflict(false)}
        />
      )}
    </div>
  );
}
