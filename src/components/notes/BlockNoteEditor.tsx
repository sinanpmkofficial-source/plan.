'use client';

import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";

interface BlockNoteEditorProps {
  initialContent?: string;
  onChange: (blocksJson: string) => void;
}

export default function BlockNoteEditor({ initialContent, onChange }: BlockNoteEditorProps) {
  // Parse initial content if present
  let initialBlocks = undefined;
  if (initialContent) {
    try {
      initialBlocks = JSON.parse(initialContent);
    } catch (e) {
      console.error("Failed to parse initial content blocks", e);
    }
  }

  const editor = useCreateBlockNote({
    initialContent: initialBlocks,
  });

  return (
    <div className="w-full h-full min-h-[400px] text-black">
      <BlockNoteView
        editor={editor}
        theme="light"
        onChange={() => {
          onChange(JSON.stringify(editor.document));
        }}
      />
    </div>
  );
}
