import sqlite3
import os
import hashlib
import uuid

DB_PATH = os.path.join(os.path.dirname(__file__), "citepilot.db")

def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn

def init_db():
    conn = get_conn()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            filename TEXT,
            label TEXT,
            mime_type TEXT NOT NULL,
            citation_style TEXT NOT NULL,
            body_text TEXT,
            status TEXT DEFAULT 'uploaded',
            word_count INTEGER,
            error_message TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS citations (
            id TEXT PRIMARY KEY,
            document_id TEXT NOT NULL,
            raw_text TEXT NOT NULL,
            normalised_text TEXT,
            extracted_authors TEXT,
            extracted_year INTEGER,
            paragraph_index INTEGER,
            char_start INTEGER,
            char_end INTEGER,
            context TEXT,
            citation_type TEXT,
            status TEXT DEFAULT 'pending',
            matched_reference_id TEXT,
            confidence REAL,
            FOREIGN KEY (document_id) REFERENCES documents(id)
        );
        CREATE TABLE IF NOT EXISTS refs (
            id TEXT PRIMARY KEY,
            document_id TEXT NOT NULL,
            position INTEGER,
            raw_entry TEXT,
            parsed_authors TEXT,
            parsed_year INTEGER,
            parsed_title TEXT,
            parsed_journal TEXT,
            parsed_volume TEXT,
            parsed_issue TEXT,
            parsed_pages TEXT,
            parsed_doi TEXT,
            reference_type TEXT,
            status TEXT DEFAULT 'pending',
            citation_count INTEGER DEFAULT 0,
            FOREIGN KEY (document_id) REFERENCES documents(id)
        );
        CREATE TABLE IF NOT EXISTS style_warnings (
            id TEXT PRIMARY KEY,
            document_id TEXT NOT NULL,
            code TEXT,
            category TEXT,
            message TEXT,
            suggestion TEXT,
            severity TEXT DEFAULT 'warning',
            location TEXT,
            FOREIGN KEY (document_id) REFERENCES documents(id)
        );
    """)
    conn.commit()
    conn.close()

def uid():
    return uuid.uuid4().hex[:20]

# --- Users ---
def create_user(email: str, password: str, name: str) -> dict | None:
    conn = get_conn()
    existing = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
    if existing:
        conn.close()
        return None
    pw_hash = hashlib.sha256(password.encode()).hexdigest()
    user_id = uid()
    conn.execute("INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)",
                 (user_id, email, pw_hash, name))
    conn.commit()
    conn.close()
    return {"id": user_id, "email": email, "name": name}

def login_user(email: str, password: str) -> dict | None:
    conn = get_conn()
    row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    conn.close()
    if not row:
        return None
    pw_hash = hashlib.sha256(password.encode()).hexdigest()
    if row["password_hash"] != pw_hash:
        return None
    return {"id": row["id"], "email": row["email"], "name": row["name"]}

# --- Documents ---
def create_document(user_id: str, filename: str | None, label: str | None,
                    mime_type: str, citation_style: str, body_text: str) -> dict:
    doc_id = uid()
    word_count = len(body_text.split())
    conn = get_conn()
    conn.execute("""INSERT INTO documents
        (id, user_id, filename, label, mime_type, citation_style, body_text, word_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (doc_id, user_id, filename, label, mime_type, citation_style, body_text, word_count))
    conn.commit()
    row = conn.execute("SELECT * FROM documents WHERE id = ?", (doc_id,)).fetchone()
    conn.close()
    return dict(row)

def list_documents(user_id: str) -> list[dict]:
    conn = get_conn()
    rows = conn.execute(
        "SELECT * FROM documents WHERE user_id = ? ORDER BY created_at DESC", (user_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_document(doc_id: str) -> dict | None:
    conn = get_conn()
    row = conn.execute("SELECT * FROM documents WHERE id = ?", (doc_id,)).fetchone()
    conn.close()
    return dict(row) if row else None

def delete_document(doc_id: str):
    conn = get_conn()
    conn.execute("DELETE FROM style_warnings WHERE document_id = ?", (doc_id,))
    conn.execute("DELETE FROM refs WHERE document_id = ?", (doc_id,))
    conn.execute("DELETE FROM citations WHERE document_id = ?", (doc_id,))
    conn.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
    conn.commit()
    conn.close()

def update_document_status(doc_id: str, status: str, error_message: str | None = None):
    conn = get_conn()
    if error_message:
        conn.execute("UPDATE documents SET status = ?, error_message = ? WHERE id = ?",
                     (status, error_message, doc_id))
    else:
        conn.execute("UPDATE documents SET status = ? WHERE id = ?", (status, doc_id))
    conn.commit()
    conn.close()

# --- Results ---
def save_results(doc_id: str, citations_data: list, refs_data: list, warnings_data: list):
    conn = get_conn()
    for c in citations_data:
        conn.execute("""INSERT INTO citations
            (id, document_id, raw_text, normalised_text, extracted_authors, extracted_year,
             paragraph_index, char_start, char_end, context, citation_type, status, confidence)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (uid(), doc_id, c.get("raw_text", ""),
             c.get("raw_text", "").lower(),
             str(c.get("extracted_authors", [])),
             c.get("extracted_year"),
             c.get("paragraph_index", 0),
             c.get("char_start", 0),
             c.get("char_end", 0),
             c.get("context", ""),
             c.get("citation_type", "parenthetical"),
             c.get("status", "pending"),
             c.get("confidence")))
    for r in refs_data:
        conn.execute("""INSERT INTO refs
            (id, document_id, position, raw_entry, parsed_authors, parsed_year,
             parsed_title, parsed_journal, parsed_volume, parsed_issue,
             parsed_pages, parsed_doi, reference_type, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (uid(), doc_id, r.get("position", 0),
             r.get("raw_entry", ""),
             str(r.get("parsed_authors", [])),
             r.get("parsed_year"),
             r.get("parsed_title"),
             r.get("parsed_journal"),
             r.get("parsed_volume"),
             r.get("parsed_issue"),
             r.get("parsed_pages"),
             r.get("parsed_doi"),
             r.get("reference_type", "unknown"),
             r.get("status", "pending")))
    for w in warnings_data:
        conn.execute("""INSERT INTO style_warnings
            (id, document_id, code, category, message, suggestion, severity, location)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (uid(), doc_id, w.get("code"), w.get("category"), w.get("message"),
             w.get("suggestion"), w.get("severity", "warning"),
             str(w.get("location", {}))))
    conn.commit()
    conn.close()

def get_citations(doc_id: str) -> list[dict]:
    conn = get_conn()
    rows = conn.execute(
        "SELECT * FROM citations WHERE document_id = ? ORDER BY paragraph_index, char_start", (doc_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_references(doc_id: str) -> list[dict]:
    conn = get_conn()
    rows = conn.execute(
        "SELECT * FROM refs WHERE document_id = ? ORDER BY position", (doc_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_style_warnings(doc_id: str) -> list[dict]:
    conn = get_conn()
    rows = conn.execute(
        "SELECT * FROM style_warnings WHERE document_id = ? ORDER BY severity", (doc_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]
