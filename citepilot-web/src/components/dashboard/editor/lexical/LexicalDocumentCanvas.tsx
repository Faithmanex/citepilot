"use client";

import React, { useEffect, useRef, useMemo } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot, $createParagraphNode, $createTextNode } from "lexical";
import { lexicalEditorTheme } from "./theme";
import { FloatingBubbleToolbar } from "./FloatingBubbleToolbar";

interface LexicalDocumentCanvasProps {
  initialText: string;
  onUpdateText: (newText: string) => void;
  onInspectSelection?: (text: string) => void;
  className?: string;
}

function TextSyncPlugin({
  text,
  onUpdateText,
}: {
  text: string;
  onUpdateText: (newText: string) => void;
}) {
  const [editor] = useLexicalComposerContext();
  const isInternalUpdate = useRef(false);

  // Synchronize incoming text from outside (e.g. 1-click fix, docx upload, reset draft)
  useEffect(() => {
    editor.getEditorState().read(() => {
      const currentContent = $getRoot().getTextContent();
      if (currentContent !== text && !isInternalUpdate.current) {
        editor.update(() => {
          const root = $getRoot();
          root.clear();
          const paragraphs = (text || "").split("\n\n");
          for (const para of paragraphs) {
            const pNode = $createParagraphNode();
            if (para) {
              pNode.append($createTextNode(para));
            }
            root.append(pNode);
          }
        });
      }
    });
  }, [editor, text]);

  return (
    <OnChangePlugin
      onChange={(editorState) => {
        editorState.read(() => {
          const root = $getRoot();
          const newText = root.getTextContent();
          isInternalUpdate.current = true;
          onUpdateText(newText);
          Promise.resolve().then(() => {
            isInternalUpdate.current = false;
          });
        });
      }}
    />
  );
}

export function LexicalDocumentCanvas({
  initialText,
  onUpdateText,
  onInspectSelection,
  className = "",
}: LexicalDocumentCanvasProps) {
  const initialConfig = useMemo(
    () => ({
      namespace: "CitePilotLexicalCanvas",
      theme: lexicalEditorTheme,
      onError: (error: Error) => {
        console.warn("Lexical editor warning:", error);
      },
      nodes: [HeadingNode, QuoteNode],
      editorState: () => {
        const root = $getRoot();
        if (root.getFirstChild() === null) {
          const paragraphs = (initialText || "").split("\n\n");
          for (const para of paragraphs) {
            const pNode = $createParagraphNode();
            if (para) {
              pNode.append($createTextNode(para));
            }
            root.append(pNode);
          }
        }
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <div
      data-testid="lexical-document-canvas"
      className={`relative w-full flex-1 flex flex-col ${className}`.trim()}
    >
      <LexicalComposer initialConfig={initialConfig}>
        <div className="relative flex-1 flex flex-col">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                data-testid="lexical-content-editable"
                aria-label="Academic Manuscript Lexical Rich Text Editor"
                className="w-full flex-1 min-h-[300px] p-4 sm:p-6 font-serif text-[15px] sm:text-[16px] leading-[1.8] text-[#0e101a] bg-[#ffffff] border border-[#d9d9d9] rounded-lg shadow-none focus:border-[#027e6f] focus:ring-2 focus:ring-[#027e6f]/20 focus:outline-none transition-all selection:bg-[#ccebe6]"
              />
            }
            placeholder={
              <div className="absolute top-4 sm:top-6 left-4 sm:left-6 text-[#707070] italic font-serif text-[15px] sm:text-[16px] pointer-events-none select-none">
                Start writing or paste your academic manuscript here…
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <TextSyncPlugin text={initialText} onUpdateText={onUpdateText} />
          <FloatingBubbleToolbar onInspectSelection={onInspectSelection} />
        </div>
      </LexicalComposer>
    </div>
  );
}

export default LexicalDocumentCanvas;
