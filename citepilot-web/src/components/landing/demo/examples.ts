import type { EditorSuggestion } from "@/lib/editor/types";

/**
 * Worked examples for the marketing demo.
 *
 * These reuse the exact `EditorSuggestion` shape the production editor renders
 * and the same `applySuggestionMutation` / `summarizeFindings` engine. Nothing
 * here is generated, inferred, or verified at runtime: each finding is a plain
 * internal-consistency issue that a reader can check in the example text itself.
 * There are deliberately no DOIs, no "verified" badges, and no invented
 * citations — the old demo fabricated all three.
 */
export interface DemoExample {
  id: string;
  name: string;
  blurb: string;
  text: string;
  suggestions: EditorSuggestion[];
}

function locate(text: string, target: string): { start: number; end: number } {
  const start = text.indexOf(target);
  if (start === -1) {
    throw new Error(`Demo example target not found: ${target}`);
  }
  return { start, end: start + target.length };
}

function buildExample(
  id: string,
  name: string,
  blurb: string,
  text: string,
  specs: Array<{
    id: string;
    category: EditorSuggestion["category"];
    target: string;
    replacement: string;
    title: string;
    explanation: string;
    educationalContext?: string;
    severity: EditorSuggestion["severity"];
    fixType?: EditorSuggestion["fixType"];
  }>
): DemoExample {
  const suggestions: EditorSuggestion[] = specs.map((spec) => ({
    id: spec.id,
    category: spec.category,
    fixType: spec.fixType ?? "replace",
    original: spec.target,
    replacement: spec.replacement,
    span: locate(text, spec.target),
    title: spec.title,
    explanation: spec.explanation,
    educationalContext: spec.educationalContext,
    severity: spec.severity,
    impactScore: 0,
    status: "active",
  }));

  return { id, name, blurb, text, suggestions };
}

const TRANSFORMER_TEXT = `Introduction

Sequence models reshaped natural language processing (Vaswani et al. 2017). In our evaluation, accuracy improved by 42.8% after the pipeline change.

Transformer architectures remain the default for transfer learning (Devlin et al., 2019).

References

Devlin, J., Chang, M.-W., Lee, K., & Toutanova, K. (2018). BERT: Pre-training of deep bidirectional transformers. NAACL.
He, K., Zhang, X., Ren, S., & Sun, J. (2016). Deep residual learning for image recognition. CVPR.`;

const CLINICAL_TEXT = `Methods

We analysed 1,204 patient records collected between 2015 and 2020. Participants were grouped by treatment arm (Okafor et al., 2020).

Reported adherence reached 88.5% across both cohorts.

References

Okafor, J., Adeyemi, T., & Bello, A. (2019). Adherence patterns in outpatient care. Journal of Clinical Practice.
Nguyen, P. (2017). A framework for longitudinal cohort design. Epidemiology Today.`;

export const DEMO_EXAMPLES: DemoExample[] = [
  buildExample(
    "sequence-models",
    "Sequence models",
    "An in-text citation disagrees with the reference list.",
    TRANSFORMER_TEXT,
    [
      {
        id: "seq-style",
        category: "style",
        target: "(Vaswani et al. 2017)",
        replacement: "(Vaswani et al., 2017)",
        title: "Missing comma before year",
        explanation:
          "APA 7 in-text citations use a comma between the author and the year.",
        educationalContext:
          "Parenthetical citations follow the pattern (Author, Year).",
        severity: "low",
      },
      {
        id: "seq-claim",
        category: "claim",
        target: "In our evaluation, accuracy improved by 42.8% after the pipeline change.",
        replacement:
          "In our evaluation, accuracy improved by 42.8% after the pipeline change. [citation needed]",
        title: "Result reported without a source",
        explanation:
          "A specific percentage is asserted as a finding but no citation supports it.",
        educationalContext:
          "Quantitative results need a citation unless they are part of the reported method.",
        severity: "medium",
        fixType: "insert_placeholder",
      },
      {
        id: "seq-citation",
        category: "citation",
        target: "(Devlin et al., 2019)",
        replacement: "(Devlin et al., 2018)",
        title: "Year does not match the reference list",
        explanation:
          "The in-text year (2019) differs from the listed reference (2018).",
        educationalContext:
          "In-text years must match the corresponding reference-list entry.",
        severity: "high",
      },
      {
        id: "seq-reference",
        category: "reference",
        target:
          "He, K., Zhang, X., Ren, S., & Sun, J. (2016). Deep residual learning for image recognition. CVPR.",
        replacement:
          "He, K., Zhang, X., Ren, S., & Sun, J. (2016). Deep residual learning for image recognition. CVPR.",
        title: "Reference is never cited",
        explanation:
          "This entry appears in the reference list but is not cited anywhere in the text.",
        educationalContext:
          "Every reference-list entry should correspond to at least one in-text citation.",
        severity: "low",
      },
    ]
  ),
  buildExample(
    "patient-adherence",
    "Patient adherence",
    "A statistic is asserted with no supporting study.",
    CLINICAL_TEXT,
    [
      {
        id: "adh-citation",
        category: "citation",
        target: "(Okafor et al., 2020)",
        replacement: "(Okafor et al., 2019)",
        title: "Year does not match the reference list",
        explanation:
          "The in-text year (2020) differs from the listed reference (2019).",
        educationalContext:
          "In-text years must match the corresponding reference-list entry.",
        severity: "high",
      },
      {
        id: "adh-claim",
        category: "claim",
        target: "Reported adherence reached 88.5% across both cohorts.",
        replacement: "Reported adherence reached 88.5% across both cohorts. [citation needed]",
        title: "Statistic reported without a source",
        explanation:
          "An 88.5% adherence figure is stated factually without a supporting citation.",
        educationalContext:
          "Reported statistics must be attributed to the study that produced them.",
        severity: "medium",
        fixType: "insert_placeholder",
      },
      {
        id: "adh-reference",
        category: "reference",
        target:
          "Nguyen, P. (2017). A framework for longitudinal cohort design. Epidemiology Today.",
        replacement:
          "Nguyen, P. (2017). A framework for longitudinal cohort design. Epidemiology Today.",
        title: "Reference is never cited",
        explanation:
          "This entry appears in the reference list but is not cited anywhere in the text.",
        educationalContext:
          "Every reference-list entry should correspond to at least one in-text citation.",
        severity: "low",
      },
    ]
  ),
];

export const DEMO_EXAMPLE_IDS = DEMO_EXAMPLES.map((example) => example.id);
