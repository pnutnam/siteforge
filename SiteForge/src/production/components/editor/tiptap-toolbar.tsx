import { Editor } from '@tiptap/react';

interface TiptapToolbarProps {
  editor: Editor;
}

export function TiptapToolbar({ editor }: TiptapToolbarProps) {
  const tools = [
    {
      group: 'text',
      items: [
        { name: 'bold', label: 'B', action: () => editor.chain().focus().toggleBold().run(), isActive: editor.isActive('bold') },
        { name: 'italic', label: 'I', action: () => editor.chain().focus().toggleItalic().run(), isActive: editor.isActive('italic') },
        { name: 'underline', label: 'U', action: () => editor.chain().focus().toggleUnderline().run(), isActive: editor.isActive('underline') },
        { name: 'strike', label: 'S', action: () => editor.chain().focus().toggleStrike().run(), isActive: editor.isActive('strike') },
      ],
    },
    {
      group: 'headings',
      items: [
        { name: 'h1', label: 'H1', action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), isActive: editor.isActive('heading', { level: 1 }) },
        { name: 'h2', label: 'H2', action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), isActive: editor.isActive('heading', { level: 2 }) },
        { name: 'h3', label: 'H3', action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), isActive: editor.isActive('heading', { level: 3 }) },
      ],
    },
    {
      group: 'lists',
      items: [
        { name: 'bullet', label: 'Bullet', action: () => editor.chain().focus().toggleBulletList().run(), isActive: editor.isActive('bulletList') },
        { name: 'ordered', label: 'Numbered', action: () => editor.chain().focus().toggleOrderedList().run(), isActive: editor.isActive('orderedList') },
      ],
    },
    {
      group: 'blocks',
      items: [
        { name: 'blockquote', label: 'Quote', action: () => editor.chain().focus().toggleBlockquote().run(), isActive: editor.isActive('blockquote') },
        { name: 'code', label: 'Code', action: () => editor.chain().focus().toggleCodeBlock().run(), isActive: editor.isActive('codeBlock') },
      ],
    },
    {
      group: 'alignment',
      items: [
        { name: 'left', label: 'Left', action: () => editor.chain().focus().setTextAlign('left').run(), isActive: editor.isActive({ textAlign: 'left' }) },
        { name: 'center', label: 'Center', action: () => editor.chain().focus().setTextAlign('center').run(), isActive: editor.isActive({ textAlign: 'center' }) },
        { name: 'right', label: 'Right', action: () => editor.chain().focus().setTextAlign('right').run(), isActive: editor.isActive({ textAlign: 'right' }) },
      ],
    },
    {
      group: 'insert',
      items: [
        { name: 'image', label: 'Image', action: () => {
          const url = window.prompt('Image URL:');
          if (url) editor.chain().focus().setImage({ src: url }).run();
        }, isActive: false },
        { name: 'link', label: 'Link', action: () => {
          const url = window.prompt('Link URL:');
          if (url) editor.chain().focus().setLink({ href: url }).run();
        }, isActive: editor.isActive('link') },
      ],
    },
  ];

  return (
    <div className="toolbar border-b border-gray-200 bg-gray-50 p-2 flex flex-wrap gap-1">
      {tools.map((group, groupIdx) => (
        <div key={group.group} className="flex gap-1">
          {group.items.map((item) => (
            <button
              key={item.name}
              onClick={item.action}
              className={`
                px-3 py-1.5 rounded text-sm font-medium transition-colors
                ${item.isActive ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-100'}
              `}
              style={{ fontSize: '14px', lineHeight: 1.4 }}
            >
              {item.label}
            </button>
          ))}
          {groupIdx < tools.length - 1 && (
            <div className="w-px bg-gray-300 mx-1 self-center" />
          )}
        </div>
      ))}
    </div>
  );
}
