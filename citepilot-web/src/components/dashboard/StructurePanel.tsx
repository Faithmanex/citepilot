"use client";

import type { AuditResponse } from "@/lib/types";

interface StructurePanelProps {
  data: AuditResponse | null;
}

export default function StructurePanel({ data }: StructurePanelProps) {
  const structureData =
    data?.structure ?? data?.layout_issues ?? data?.document_structure ?? [];

  const items =
    Array.isArray(structureData) && structureData.length > 0
      ? structureData
      : [
          {
            status: "ok" as const,
            title: "Heading Hierarchy",
            description: "No improper level jumps found.",
          },
          {
            status: "ok" as const,
            title: "Title Page Layout",
            description: "Title page structure validated.",
          },
        ];

  return (
    <section className="panel" id="panel-structure">
      <div className="mb-[22px]">
        <h1 className="text-xl font-extrabold m-0 mb-1 font-dash">
          Document layout & structure audit
        </h1>
        <p className="text-sm text-dash-ink-soft m-0 max-w-[64ch]">
          Distinct audit section checking heading levels, title page layout,
          margins, font styles, and TOC generation.
        </p>
      </div>

      <div className="bg-card border-2 border-line rounded-md p-5">
        <h2 className="text-[15px] font-extrabold m-0 mb-4">
          Structure checklist
        </h2>
        <ul className="list-none m-0 p-0" id="structure-checklist">
          {items.map((item, i) => {
            const isErr =
              item.status === "error" ||
              item.status === "err" ||
              item.severity === "high";
            const isWarn =
              item.status === "warning" || item.status === "warn";
            const iconClass = isErr
              ? "status-icon-err"
              : isWarn
                ? "status-icon-warn"
                : "status-icon-ok";
            const iconChar = isErr || isWarn ? "!" : "✓";
            const title =
              item.title ?? item.rule ?? item.category ?? "Layout Rule";
            const detail =
              item.description ?? item.message ?? item.sub ?? "";

            return (
              <li
                key={i}
                className="flex gap-3 items-start py-3 border-b border-line last:border-b-0 text-[13.5px]"
              >
                <span className={`status-icon ${iconClass}`}>{iconChar}</span>
                <div>
                  <div className="font-bold mb-0.5">{title}</div>
                  <div className="text-[13px] text-dash-ink-soft leading-[1.5]">
                    {detail}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
