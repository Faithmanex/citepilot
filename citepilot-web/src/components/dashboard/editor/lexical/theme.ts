import type { EditorThemeClasses } from "lexical";

export const lexicalEditorTheme: EditorThemeClasses = {
  paragraph: "mb-3 leading-relaxed text-[#0e101a] font-serif text-[15px] sm:text-base selection:bg-[#ccebe6]",
  heading: {
    h1: "text-2xl font-bold font-sans tracking-tight text-[#0e101a] mt-6 mb-3",
    h2: "text-xl font-bold font-sans tracking-tight text-[#0e101a] mt-5 mb-2",
    h3: "text-lg font-semibold font-sans text-[#0e101a] mt-4 mb-2",
  },
  text: {
    bold: "font-bold text-[#0e101a]",
    italic: "italic",
    underline: "underline decoration-[#027e6f] decoration-2 underline-offset-2",
    strikethrough: "line-through text-[#707070]",
    code: "font-mono text-xs px-1.5 py-0.5 rounded bg-[#f5f5f5] text-[#b06000] border border-[#d9d9d9]",
  },
  list: {
    ul: "list-disc pl-5 my-2 space-y-1",
    ol: "list-decimal pl-5 my-2 space-y-1",
    listitem: "leading-relaxed text-[#0e101a]",
  },
  quote: "border-l-4 border-[#027e6f] pl-4 py-1 italic my-3 text-[#545454] bg-[#f5f5f5]/60 rounded-r",
  mark: "rounded px-1 py-0.5 transition-colors cursor-pointer",
};
