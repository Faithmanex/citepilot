import type { EditorThemeClasses } from "lexical";

export const lexicalEditorTheme: EditorThemeClasses = {
  paragraph: "mb-3 leading-relaxed text-[#221d16] font-serif text-[15px] sm:text-base selection:bg-[#e7e9f5]",
  heading: {
    h1: "text-2xl font-bold font-sans tracking-tight text-[#221d16] mt-6 mb-3",
    h2: "text-xl font-bold font-sans tracking-tight text-[#221d16] mt-5 mb-2",
    h3: "text-lg font-semibold font-sans text-[#221d16] mt-4 mb-2",
  },
  text: {
    bold: "font-bold text-[#221d16]",
    italic: "italic",
    underline: "underline decoration-[#2c3e8c] decoration-2 underline-offset-2",
    strikethrough: "line-through text-[#948a76]",
    code: "font-mono text-xs px-1.5 py-0.5 rounded bg-[#faf6ec] text-[#93650f] border border-[#d9cfb8]",
  },
  list: {
    ul: "list-disc pl-5 my-2 space-y-1",
    ol: "list-decimal pl-5 my-2 space-y-1",
    listitem: "leading-relaxed text-[#221d16]",
  },
  quote: "border-l-4 border-[#2c3e8c] pl-4 py-1 italic my-3 text-[#5c5344] bg-[#faf6ec]/60 rounded-r",
  mark: "rounded px-1 py-0.5 transition-colors cursor-pointer",
};
