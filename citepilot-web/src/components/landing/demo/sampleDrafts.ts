import type { AcademicDraft, DemoSuggestion } from "./types";

const LIT_REVIEW_TEXT =
  "Recent developments in transformer scaling have demonstrated that dense retrieval mechanisms significantly outperform classical sparse keyword matching in domain-specific tasks (Karpukhin et al., 2020). Multi-query attention reduces KV-cache memory overhead by a factor of eight without degrading retrieval perplexity. Furthermore, recent empirical benchmarks indicate that retrieval-augmented generation reduces hallucination rates across open-domain QA from 38.2% down to 12.4%. As demonstrated by early recurrent sequence transduction models (Graves, 2013), sequential bottlenecks prevent parallelized training across long contexts. This completely proves beyond any doubt that autoregressive architectures are inherently superior to bidirectional encoder representations in all production reasoning environments.";

const LIT_REVIEW_SUGGESTIONS: DemoSuggestion[] = [
  {
    id: "lit-1",
    category: "missing-citation",
    title: "Unattributed Architectural Claim",
    rationale:
      "Key architectural memory reduction claims require attribution to seminal multi-query attention literature.",
    originalText:
      "Multi-query attention reduces KV-cache memory overhead by a factor of eight without degrading retrieval perplexity.",
    replacementText:
      "Multi-query attention reduces KV-cache memory overhead by a factor of eight without degrading retrieval perplexity (Shazeer, 2019; Ainslie et al., 2023).",
    status: "pending",
    startIndex: 203,
    endIndex: 318,
    impactScore: 9,
    metadata: {
      authors: "Shazeer, N. & Ainslie, J. et al.",
      year: "2019, 2023",
      doi: "10.48550/arXiv.1911.02150",
      journal: "arXiv / Fast and Accurate Multi-Query Attention",
      crossrefVerified: true,
      ruleCode: "CITE-ARCH-01",
      citationStyle: "APA 7",
    },
  },
  {
    id: "lit-2",
    category: "claim-needs-source",
    title: "Empirical Metric Lacks Source",
    rationale:
      "Precise quantitative statistical benchmarks asserted without empirical verification paper citation.",
    originalText:
      "recent empirical benchmarks indicate that retrieval-augmented generation reduces hallucination rates across open-domain QA from 38.2% down to 12.4%",
    replacementText:
      "recent empirical benchmarks indicate that retrieval-augmented generation reduces hallucination rates across open-domain QA from 38.2% down to 12.4% (Lewis et al., 2020; Gao et al., 2023)",
    status: "pending",
    startIndex: 332,
    endIndex: 479,
    impactScore: 10,
    metadata: {
      authors: "Lewis, P. et al. & Gao, Y. et al.",
      year: "2020, 2023",
      doi: "10.5555/3495724.3496517",
      journal: "Advances in Neural Information Processing Systems (NeurIPS)",
      crossrefVerified: true,
      ruleCode: "CLAIM-STAT-02",
      citationStyle: "APA 7",
    },
  },
  {
    id: "lit-3",
    category: "outdated-reference",
    title: "Outdated Foundational Reference",
    rationale:
      "2013 RNN citation is outdated when contextualizing modern attention-based scaling limits and non-sequential parallelism.",
    originalText: "(Graves, 2013)",
    replacementText: "(Vaswani et al., 2017; Kaplan et al., 2020)",
    status: "pending",
    startIndex: 545,
    endIndex: 559,
    impactScore: 8,
    metadata: {
      authors: "Vaswani, A. et al. & Kaplan, J. et al.",
      year: "2017, 2020",
      doi: "10.48550/arXiv.1706.03762",
      journal: "NeurIPS / Attention Is All You Need",
      crossrefVerified: true,
      ruleCode: "REF-RECENCY-03",
      citationStyle: "APA 7",
    },
  },
  {
    id: "lit-4",
    category: "tone-clarity",
    title: "Overly Definitive & Unhedged Claim",
    rationale:
      "Overly definitive assertion violating academic objectivity and scholarly hedging conventions.",
    originalText:
      "This completely proves beyond any doubt that autoregressive architectures are inherently superior to bidirectional encoder representations in all production reasoning environments.",
    replacementText:
      "These findings suggest that autoregressive architectures frequently provide measurable latency and generation advantages over bidirectional encoders across many production reasoning tasks.",
    status: "pending",
    startIndex: 636,
    endIndex: 816,
    impactScore: 9,
    metadata: {
      authors: "APA Publication Manual §4.12",
      year: "2020",
      journal: "Scientific Hedging & Academic Objectivity",
      crossrefVerified: true,
      ruleCode: "TONE-HEDGE-04",
      guidelineRef: "APA 7 §4.12",
    },
  },
];

const INTRO_TEXT =
  "The clinical translation of programmable RNA-guided endonucleases has revolutionized targeted genome therapeutics for monogenic disorders (Doudna & Charpentier, 2014). High-fidelity Cas9 variants engineered with structure-guided mutations exhibit undetectable off-target cleavages at standard genomic loci while maintaining on-target cleavage efficiencies. Nonetheless, over 68% of unoptimized synthetic single-guide RNAs generate off-target double-stranded breaks in non-homologous flanking regions. Target validation protocols rely primarily on early zinc-finger nuclease binding protocols (Urnov et al., 2010). These results obviously eliminate all clinical safety risks associated with therapeutic in vivo delivery in patient-derived stem cells.";

const INTRO_SUGGESTIONS: DemoSuggestion[] = [
  {
    id: "bio-1",
    category: "missing-citation",
    title: "Missing Citation for Variant Fidelity",
    rationale:
      "Specific biochemical engineering claim regarding engineered high-fidelity Cas9 variants lacking direct literature source.",
    originalText:
      "High-fidelity Cas9 variants engineered with structure-guided mutations exhibit undetectable off-target cleavages at standard genomic loci while maintaining on-target cleavage efficiencies.",
    replacementText:
      "High-fidelity Cas9 variants engineered with structure-guided mutations exhibit undetectable off-target cleavages at standard genomic loci while maintaining on-target cleavage efficiencies (Kleinstiver et al., 2016; Chen et al., 2017).",
    status: "pending",
    startIndex: 168,
    endIndex: 356,
    impactScore: 9,
    metadata: {
      authors: "Kleinstiver, B.P. et al. & Chen, J.S. et al.",
      year: "2016, 2017",
      doi: "10.1038/nature16526",
      journal: "Nature / High-fidelity CRISPR–Cas9 enzymes",
      crossrefVerified: true,
      ruleCode: "CITE-BIO-01",
      citationStyle: "Nature",
    },
  },
  {
    id: "bio-2",
    category: "claim-needs-source",
    title: "Quantitative Off-Target Rate Lacks Citation",
    rationale:
      "Exact empirical percentage asserted requiring experimental verification and landmark study attribution.",
    originalText:
      "over 68% of unoptimized synthetic single-guide RNAs generate off-target double-stranded breaks in non-homologous flanking regions",
    replacementText:
      "over 68% of unoptimized synthetic single-guide RNAs generate off-target double-stranded breaks in non-homologous flanking regions (Hsu et al., 2013; Kim et al., 2019)",
    status: "pending",
    startIndex: 370,
    endIndex: 499,
    impactScore: 10,
    metadata: {
      authors: "Hsu, P.D. et al. & Kim, D. et al.",
      year: "2013, 2019",
      doi: "10.1038/nbt.2647",
      journal: "Nature Biotechnology",
      crossrefVerified: true,
      ruleCode: "CLAIM-BIO-02",
      citationStyle: "Nature",
    },
  },
  {
    id: "bio-3",
    category: "outdated-reference",
    title: "Outdated Validation Methodology Cited",
    rationale:
      "Pre-2015 ZFN protocol cited for modern CRISPR off-target sequencing where GUIDE-seq or CIRCLE-seq is current standard.",
    originalText: "(Urnov et al., 2010)",
    replacementText: "(Tsai et al., 2015; Wienert et al., 2019)",
    status: "pending",
    startIndex: 592,
    endIndex: 612,
    impactScore: 8,
    metadata: {
      authors: "Tsai, S.Q. et al. & Wienert, B. et al.",
      year: "2015, 2019",
      doi: "10.1038/nbt.3117",
      journal: "Nature Biotechnology / GUIDE-seq",
      crossrefVerified: true,
      ruleCode: "REF-METHOD-03",
      citationStyle: "Nature",
    },
  },
  {
    id: "bio-4",
    category: "tone-clarity",
    title: "Hyperbolic Safety Assertion",
    rationale:
      "Hyperbolic assertion ignoring longitudinal safety requirements and clinical reserve standards.",
    originalText:
      "These results obviously eliminate all clinical safety risks associated with therapeutic in vivo delivery in patient-derived stem cells.",
    replacementText:
      "These improvements substantially mitigate therapeutic risks, although longitudinal safety profiles and genomic stability remain subject to ongoing clinical evaluation.",
    status: "pending",
    startIndex: 614,
    endIndex: 749,
    impactScore: 9,
    metadata: {
      authors: "Scholarly Hedging & Clinical Reserve Standards",
      year: "2023",
      journal: "Cell Stem Cell / Regulatory Perspectives",
      crossrefVerified: true,
      ruleCode: "TONE-CLINICAL-04",
      guidelineRef: "ICMJE Recommendations",
    },
  },
];

const DISCUSSION_TEXT =
  "Our multi-center trial demonstrates that automated mobile health platforms improve self-management behaviors among adults with newly diagnosed type 2 diabetes (Boren et al., 2014). Micro-incentive structures delivered via push notifications stimulate dopaminergic habit loops that elevate daily logging consistency. Patients in the adaptive feedback cohort achieved a 1.4% reduction in HbA1c at 24 weeks compared to standard clinical care. Mobile health interventions operate predominantly through unidirectional SMS reminders (Fjeldsoe et al., 2009). Our findings undeniably establish that digital therapeutics will entirely replace traditional in-person endocrinological consultations across primary care networks.";

const DISCUSSION_SUGGESTIONS: DemoSuggestion[] = [
  {
    id: "dh-1",
    category: "missing-citation",
    title: "Uncited Behavioral Mechanism",
    rationale:
      "Behavioral economics and neurocognitive mechanism stated without supporting citation.",
    originalText:
      "Micro-incentive structures delivered via push notifications stimulate dopaminergic habit loops that elevate daily logging consistency.",
    replacementText:
      "Micro-incentive structures delivered via push notifications stimulate behavioral habit loops that elevate daily logging consistency (Milkman et al., 2021; Patel et al., 2022).",
    status: "pending",
    startIndex: 181,
    endIndex: 315,
    impactScore: 9,
    metadata: {
      authors: "Milkman, K.L. et al. & Patel, M.S. et al.",
      year: "2021, 2022",
      doi: "10.1038/s41586-021-04128-4",
      journal: "Nature / Megastudies improve health habits",
      crossrefVerified: true,
      ruleCode: "CITE-BEHAVIOR-01",
      citationStyle: "APA 7",
    },
  },
  {
    id: "dh-2",
    category: "claim-needs-source",
    title: "Clinical Outcome Metric Lacks Source",
    rationale:
      "Specific quantitative clinical outcome metric asserted without external comparative study attribution.",
    originalText:
      "Patients in the adaptive feedback cohort achieved a 1.4% reduction in HbA1c at 24 weeks compared to standard clinical care",
    replacementText:
      "Patients in the adaptive feedback cohort achieved a 1.4% reduction in HbA1c at 24 weeks compared to standard clinical care (Quinn et al., 2021; Agarwal et al., 2023)",
    status: "pending",
    startIndex: 316,
    endIndex: 438,
    impactScore: 10,
    metadata: {
      authors: "Quinn, C.C. et al. & Agarwal, P. et al.",
      year: "2021, 2023",
      doi: "10.2337/dc20-2187",
      journal: "Diabetes Care / American Diabetes Association",
      crossrefVerified: true,
      ruleCode: "CLAIM-CLINICAL-02",
      citationStyle: "APA 7",
    },
  },
  {
    id: "dh-3",
    category: "outdated-reference",
    title: "Superseded Intervention Reference",
    rationale:
      "2009 SMS reminder paper cited in a modern discussion on adaptive mobile applications.",
    originalText: "(Fjeldsoe et al., 2009)",
    replacementText: "(Pal et al., 2018; Schwebel & Larimer, 2020)",
    status: "pending",
    startIndex: 527,
    endIndex: 550,
    impactScore: 8,
    metadata: {
      authors: "Pal, K. et al. & Schwebel, F.J.",
      year: "2018, 2020",
      doi: "10.1002/14651858.CD011019.pub2",
      journal: "Cochrane Database of Systematic Reviews",
      crossrefVerified: true,
      ruleCode: "REF-RECENCY-03",
      citationStyle: "APA 7",
    },
  },
  {
    id: "dh-4",
    category: "tone-clarity",
    title: "Extreme Scope Overgeneralization",
    rationale:
      "Extreme overgeneralization claiming total replacement of medical clinicians.",
    originalText:
      "Our findings undeniably establish that digital therapeutics will entirely replace traditional in-person endocrinological consultations across primary care networks.",
    replacementText:
      "Our findings indicate that digital therapeutics can effectively augment and scale traditional endocrinological consultations across primary care networks.",
    status: "pending",
    startIndex: 552,
    endIndex: 716,
    impactScore: 9,
    metadata: {
      authors: "Clinical Scope Limitation Guidelines",
      year: "2023",
      journal: "Lancet Digital Health",
      crossrefVerified: true,
      ruleCode: "TONE-SCOPE-04",
      guidelineRef: "APA 7 §4.12",
    },
  },
];

const CUSTOM_DRAFT_TEXT =
  "Recent developments in neural retrieval demonstrate that dense representations significantly outperform sparse keyword search. The system obviously eliminates all hallucination risks across production environments.";

function enrichSuggestion(s: DemoSuggestion): DemoSuggestion {
  return {
    ...s,
    originalSpan: s.originalText,
    suggestedReplacement: s.replacementText,
    explanation: s.rationale,
  };
}

const ENRICHED_LIT_REVIEW_SUGGESTIONS = LIT_REVIEW_SUGGESTIONS.map(enrichSuggestion);
const ENRICHED_INTRO_SUGGESTIONS = INTRO_SUGGESTIONS.map(enrichSuggestion);
const ENRICHED_DISCUSSION_SUGGESTIONS = DISCUSSION_SUGGESTIONS.map(enrichSuggestion);

export const ACADEMIC_DRAFTS: Record<AcademicDraft["id"], AcademicDraft> = {
  "lit-review": {
    id: "lit-review",
    name: "Literature Review",
    shortLabel: "Lit Review",
    title: "Transformer Attention Mechanisms",
    discipline: "Computer Science & Artificial Intelligence",
    fieldIcon: "⚡",
    baseScore: 64,
    initialText: LIT_REVIEW_TEXT,
    defaultSuggestions: ENRICHED_LIT_REVIEW_SUGGESTIONS,
    suggestions: ENRICHED_LIT_REVIEW_SUGGESTIONS,
  },
  intro: {
    id: "intro",
    name: "Introduction",
    shortLabel: "Introduction",
    title: "CRISPR-Cas9 Precision Editing",
    discipline: "Molecular Genetics & Biotechnology",
    fieldIcon: "🧬",
    baseScore: 64,
    initialText: INTRO_TEXT,
    defaultSuggestions: ENRICHED_INTRO_SUGGESTIONS,
    suggestions: ENRICHED_INTRO_SUGGESTIONS,
  },
  discussion: {
    id: "discussion",
    name: "Discussion",
    shortLabel: "Discussion",
    title: "Digital Health & Telemedicine Adherence",
    discipline: "Digital Health & Behavioral Medicine",
    fieldIcon: "📊",
    baseScore: 64,
    initialText: DISCUSSION_TEXT,
    defaultSuggestions: ENRICHED_DISCUSSION_SUGGESTIONS,
    suggestions: ENRICHED_DISCUSSION_SUGGESTIONS,
  },
  custom: {
    id: "custom",
    name: "Custom Draft",
    shortLabel: "Custom Draft",
    title: "Live Interactive Manuscript Audit",
    discipline: "User Defined Manuscript",
    fieldIcon: "✍️",
    baseScore: 64,
    initialText: CUSTOM_DRAFT_TEXT,
    defaultSuggestions: [],
    suggestions: [],
  },
};

export const DRAFT_LIST: AcademicDraft[] = [
  ACADEMIC_DRAFTS["lit-review"],
  ACADEMIC_DRAFTS.intro,
  ACADEMIC_DRAFTS.discussion,
  ACADEMIC_DRAFTS.custom,
];
