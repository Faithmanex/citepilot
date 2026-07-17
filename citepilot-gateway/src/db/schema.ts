import { pgTable, text, timestamp, boolean, integer, smallint, real, jsonb, uniqueIndex, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => `usr_${crypto.randomUUID().slice(0, 20)}`),
  email: text("email").notNull(),
  emailVerified: boolean("email_verified").notNull().default(false),
  passwordHash: text("password_hash"),
  name: text("name").notNull(),
  role: text("role", { enum: ["user", "institutional_admin", "super_admin"] }).notNull().default("user"),
  tier: text("tier", { enum: ["free", "student", "professional", "institutional"] }).notNull().default("free"),
  avatarUrl: text("avatar_url"),
  oauthProvider: text("oauth_provider", { enum: ["google", "microsoft"] }),
  oauthProviderId: text("oauth_provider_id"),
  organisationId: text("organisation_id"),
  preferences: jsonb("preferences").notNull().default({}),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
  idx_users_email: uniqueIndex("idx_users_email").on(table.email).where(sql`deleted_at IS NULL`),
  idx_users_tier: index("idx_users_tier").on(table.tier),
}));

export const organisations = pgTable("organisations", {
  id: text("id").primaryKey().$defaultFn(() => `org_${crypto.randomUUID().slice(0, 20)}`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  domain: text("domain"),
  maxSeats: integer("max_seats").notNull().default(100),
  ssoProvider: text("sso_provider"),
  ssoConfig: jsonb("sso_config"),
  settings: jsonb("settings").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const organisationMembers = pgTable("organisation_members", {
  id: text("id").primaryKey().$defaultFn(() => `om_${crypto.randomUUID().slice(0, 20)}`),
  organisationId: text("organisation_id").notNull().references(() => organisations.id),
  userId: text("user_id").notNull().references(() => users.id),
  role: text("role", { enum: ["member", "admin"] }).notNull().default("member"),
  status: text("status", { enum: ["invited", "active", "suspended"] }).notNull().default("active"),
  invitedBy: text("invited_by"),
  joinedAt: timestamp("joined_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  idx_org_members_unique: uniqueIndex("idx_org_members_unique").on(table.organisationId, table.userId),
}));

export const documents = pgTable("documents", {
  id: text("id").primaryKey().$defaultFn(() => `doc_${crypto.randomUUID().slice(0, 20)}`),
  userId: text("user_id").notNull().references(() => users.id),
  filename: text("filename"),
  label: text("label"),
  mimeType: text("mime_type").notNull(),
  fileSize: integer("file_size").notNull(),
  filePath: text("file_path"),
  citationStyle: text("citation_style").notNull(),
  multiRefList: boolean("multi_ref_list").notNull().default(false),
  status: text("status", {
    enum: ["uploaded", "parsing", "parsed", "analysing", "analysed", "validating", "validated", "failed"],
  }).notNull().default("uploaded"),
  progress: smallint("progress").notNull().default(0),
  wordCount: integer("word_count"),
  bodyText: text("body_text"),
  resultVersion: integer("result_version").notNull().default(1),
  errorMessage: text("error_message"),
  processingTimeMs: integer("processing_time_ms"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull().$defaultFn(() => new Date(Date.now() + 36 * 60 * 60 * 1000)),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
  idx_documents_user_created: index("idx_documents_user_created").on(table.userId, table.createdAt),
  idx_documents_status: index("idx_documents_status").on(table.status),
}));

export const citations = pgTable("citations", {
  id: text("id").primaryKey().$defaultFn(() => `cit_${crypto.randomUUID().slice(0, 20)}`),
  documentId: text("document_id").notNull().references(() => documents.id),
  rawText: text("raw_text").notNull(),
  normalisedText: text("normalised_text").notNull(),
  extractedAuthors: text("extracted_authors").array().notNull(),
  extractedYear: smallint("extracted_year"),
  citationNumber: smallint("citation_number"),
  paragraphIndex: integer("paragraph_index").notNull(),
  charStart: integer("char_start").notNull(),
  charEnd: integer("char_end").notNull(),
  context: text("context").notNull(),
  citationType: text("citation_type", { enum: ["parenthetical", "narrative", "numeric", "footnote"] }).notNull(),
  matchedReferenceId: text("matched_reference_id"),
  status: text("status", { enum: ["pending", "matched", "possible_match", "no_match", "ignored"] }).notNull().default("pending"),
  confidence: real("confidence"),
  ignored: boolean("ignored").notNull().default(false),
  ignoreReason: text("ignore_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  idx_citations_document: index("idx_citations_document").on(table.documentId),
  idx_citations_status: index("idx_citations_status").on(table.documentId, table.status),
}));

export const references = pgTable("references", {
  id: text("id").primaryKey().$defaultFn(() => `ref_${crypto.randomUUID().slice(0, 20)}`),
  documentId: text("document_id").notNull().references(() => documents.id),
  listIndex: smallint("list_index").notNull().default(0),
  position: smallint("position").notNull(),
  rawEntry: text("raw_entry").notNull(),
  parsedAuthors: jsonb("parsed_authors").notNull(),
  parsedYear: smallint("parsed_year"),
  parsedTitle: text("parsed_title"),
  parsedJournal: text("parsed_journal"),
  parsedVolume: text("parsed_volume"),
  parsedIssue: text("parsed_issue"),
  parsedPages: text("parsed_pages"),
  parsedDoi: text("parsed_doi"),
  parsedUrl: text("parsed_url"),
  parsedIsbn: text("parsed_isbn"),
  parsedPmid: text("parsed_pmid"),
  referenceType: text("reference_type").notNull().default("unknown"),
  citationCount: smallint("citation_count").notNull().default(0),
  status: text("status", { enum: ["pending", "cited", "orphaned"] }).notNull().default("pending"),
  alphabeticalExpected: smallint("alphabetical_expected"),
  alphabeticalCorrect: boolean("alphabetical_correct"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  idx_references_document: index("idx_references_document").on(table.documentId),
  idx_references_document_list: index("idx_references_document_list").on(table.documentId, table.listIndex, table.position),
}));

export const citationResults = pgTable("citation_results", {
  id: text("id").primaryKey().$defaultFn(() => `cr_${crypto.randomUUID().slice(0, 20)}`),
  citationId: text("citation_id").notNull().references(() => citations.id).unique(),
  documentId: text("document_id").notNull().references(() => documents.id),
  matchType: text("match_type", { enum: ["exact", "fuzzy", "ai_verified", "none"] }).notNull(),
  matchScore: real("match_score").notNull(),
  authorScore: real("author_score"),
  yearScore: real("year_score"),
  titleSimilarity: real("title_similarity"),
  issues: jsonb("issues").notNull().default([]),
  aiExplanation: text("ai_explanation"),
  aiSuggestion: text("ai_suggestion"),
  modelUsed: text("model_used").notNull(),
  processingTimeMs: integer("processing_time_ms").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  idx_citation_results_document: index("idx_citation_results_document").on(table.documentId),
}));

export const referenceResults = pgTable("reference_results", {
  id: text("id").primaryKey().$defaultFn(() => `rr_${crypto.randomUUID().slice(0, 20)}`),
  referenceId: text("reference_id").notNull().references(() => references.id).unique(),
  documentId: text("document_id").notNull().references(() => documents.id),
  isOrphaned: boolean("is_orphaned").notNull().default(false),
  isRetracted: boolean("is_retracted").notNull().default(false),
  isHallucinated: boolean("is_hallucinated").notNull().default(false),
  hallucinationConfidence: real("hallucination_confidence"),
  hallucinationEvidence: text("hallucination_evidence"),
  retractionDetail: jsonb("retraction_detail"),
  issues: jsonb("issues").notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  idx_reference_results_document: index("idx_reference_results_document").on(table.documentId),
}));

export const styleWarnings = pgTable("style_warnings", {
  id: text("id").primaryKey().$defaultFn(() => `sw_${crypto.randomUUID().slice(0, 20)}`),
  documentId: text("document_id").notNull().references(() => documents.id),
  citationId: text("citation_id"),
  referenceId: text("reference_id"),
  code: text("code").notNull(),
  category: text("category").notNull(),
  message: text("message").notNull(),
  suggestion: text("suggestion"),
  severity: text("severity", { enum: ["error", "warning", "info"] }).notNull(),
  location: jsonb("location").notNull(),
  rawText: text("raw_text"),
  ruleSource: text("rule_source", { enum: ["rule_based", "ai_powered"] }).notNull(),
  styleGuideRef: text("style_guide_ref"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  idx_style_warnings_document: index("idx_style_warnings_document").on(table.documentId),
}));

export const externalValidations = pgTable("external_validations", {
  id: text("id").primaryKey().$defaultFn(() => `ev_${crypto.randomUUID().slice(0, 20)}`),
  referenceId: text("reference_id").notNull().references(() => references.id),
  documentId: text("document_id").notNull().references(() => documents.id),
  source: text("source", { enum: ["crossref", "openalex", "pubmed", "doi_org"] }).notNull(),
  queryType: text("query_type").notNull(),
  queryValue: text("query_value").notNull(),
  status: text("status", { enum: ["verified", "discrepancy", "not_found", "error", "unavailable"] }).notNull(),
  verified: boolean("verified").notNull(),
  externalMetadata: jsonb("external_metadata"),
  discrepancies: jsonb("discrepancies").notNull().default([]),
  responseTimeMs: integer("response_time_ms").notNull(),
  checkedAt: timestamp("checked_at", { withTimezone: true }).notNull().defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: text("id").primaryKey().$defaultFn(() => `sub_${crypto.randomUUID().slice(0, 20)}`),
  userId: text("user_id").notNull().references(() => users.id).unique(),
  stripeCustomerId: text("stripe_customer_id").notNull(),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripePriceId: text("stripe_price_id"),
  tier: text("tier", { enum: ["free", "student", "professional", "institutional"] }).notNull().default("free"),
  status: text("status", { enum: ["active", "past_due", "cancelled", "paused", "trialing"] }).notNull().default("active"),
  billingCycle: text("billing_cycle", { enum: ["monthly", "annual"] }),
  currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  trialEnd: timestamp("trial_end", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const usageLogs = pgTable("usage_logs", {
  id: text("id").primaryKey().$defaultFn(() => `ul_${crypto.randomUUID().slice(0, 20)}`),
  userId: text("user_id").notNull().references(() => users.id),
  action: text("action").notNull(),
  documentId: text("document_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey().$defaultFn(() => `sess_${crypto.randomUUID().slice(0, 20)}`),
  userId: text("user_id").notNull().references(() => users.id),
  refreshTokenHash: text("refresh_token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  idx_sessions_user: index("idx_sessions_user").on(table.userId),
  idx_sessions_token: uniqueIndex("idx_sessions_token").on(table.refreshTokenHash),
}));
