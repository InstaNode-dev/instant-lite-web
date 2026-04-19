# Give Claude Code a real Postgres database in 30 seconds (with pgvector, no Docker)

I lost count of how many Claude Code sessions have died at the same wall.

I ask Claude to wire up a little side-project — a RAG over my notes, an agent that remembers conversations, a bookmark manager. Claude writes the app code. Then it gets to the database and stalls.

> "Before we proceed, can you install Postgres locally and create a database? Run `brew install postgresql`, then `createdb myapp`. Let me know when it's done."

And that's the moment the session breaks. Either I:

1. Install Postgres on the laptop, remember the password in three weeks when I come back to this, discover the version I installed is now behind whatever Drizzle needs, and burn 20 minutes fighting with `pg_hba.conf`.
2. Go sign up for Neon / Supabase / Railway. Create a free account. Accept terms. Verify email. Create a project. Copy the connection string. Paste it back into Claude. 15 minutes gone and I've lost flow.
3. Give up on the side-project.

The right answer was: **Claude Code should just provision the database itself.** No local install, no signup, no tab-switching. And it turns out that if you give Claude Code the right MCP server, it does.

## The setup — one line

Install `@instanode/mcp`:

```sh
claude mcp add instanode -- npx -y @instanode/mcp@latest
```

That's it. Restart Claude Code (or reload the session). It now has four new tools: `create_database`, `create_webhook`, `list_resources`, and `claim_token`.

Behind the scenes, the MCP server wraps a small HTTP API at `api.instanode.dev` that provisions real Postgres databases on demand. No account, no API key for the free tier — each database lives for 24 hours, has 10 MB of storage and two connections, and gets deleted after. Perfect for prototypes. When you want something permanent, you sign up for $12/mo and claim the resource.

Disclosure: I work on this. Disclosure that matters more: it's MIT-licensed, the source is [public on GitHub](https://github.com/InstaNode-dev/mcp), and the free tier is genuinely free — no credit card.

## The moment it clicks

Ask Claude Code:

> *"Set up a Postgres database for this project."*

Here's what I see in my terminal:

```
● instanode (instanode) create_database
  ⎿  {
       "ok": true,
       "token": "a1b2c3d4-...",
       "connection_url": "postgres://usr_a1b2:***@pg.instanode.dev:5432/db_a1b2?sslmode=require",
       "tier": "anonymous",
       "limits": { "storage_mb": 10, "connections": 2, "expires_in": "24h" },
       "note": "Works now. Keep it forever: https://instanode.dev/start?token=a1b2c3d4-..."
     }

● I've provisioned a Postgres database for you. I'll store the connection URL
  in .env as DATABASE_URL and add a placeholder to .env.example so your
  teammates know the variable exists.
```

Claude writes `.env` (gitignored), adds `.env.example`, then starts generating the app against a live database. No break. No sign-up. No `brew install`. The whole handoff took about 4 seconds of wall-clock time.

## Part 2: a real thing — RAG with pgvector

Single endpoints are boring. Let's build the use case most people actually want: **retrieval-augmented generation** over a small corpus, using pgvector.

Prompt I paste into Claude Code:

> *"Use the instanode MCP to set up a Postgres database. Enable pgvector, create a `docs` table with `id bigserial PRIMARY KEY, content text, embedding vector(1536)`. Then write a small Python script that takes a text file, chunks it by paragraph, generates OpenAI embeddings for each chunk, and inserts them. Then write a second script that takes a query string, embeds it, and returns the top-5 most similar chunks."*

What Claude does, step by step:

**1. Provisions the database.** Calls `create_database` → gets a DSN. Writes it to `.env`.

**2. Enables pgvector.** This is the part I always forget on self-hosted Postgres. Not here — pgvector is pre-installed on every instanode database. Claude just runs:

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE docs (
    id        bigserial PRIMARY KEY,
    content   text,
    embedding vector(1536)
);

CREATE INDEX docs_embedding_idx
    ON docs USING hnsw (embedding vector_cosine_ops);
```

**3. Writes the ingest script.**

```python
# ingest.py
import os, sys, psycopg
from openai import OpenAI

openai = OpenAI()
db = psycopg.connect(os.environ["DATABASE_URL"])

def chunk(text: str, size: int = 400) -> list[str]:
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    chunks, buf = [], ""
    for p in paragraphs:
        if len(buf) + len(p) < size:
            buf += "\n\n" + p if buf else p
        else:
            chunks.append(buf)
            buf = p
    if buf:
        chunks.append(buf)
    return chunks

with open(sys.argv[1]) as f:
    text = f.read()

for c in chunk(text):
    emb = openai.embeddings.create(
        model="text-embedding-3-small",
        input=c,
    ).data[0].embedding
    with db.cursor() as cur:
        cur.execute(
            "INSERT INTO docs (content, embedding) VALUES (%s, %s)",
            (c, emb),
        )
db.commit()
print(f"inserted {len(chunk(text))} chunks")
```

**4. Writes the retrieval script.**

```python
# retrieve.py
import os, sys, psycopg
from openai import OpenAI

openai = OpenAI()
db = psycopg.connect(os.environ["DATABASE_URL"])

query = " ".join(sys.argv[1:]) or "what is postgres?"
emb = openai.embeddings.create(
    model="text-embedding-3-small",
    input=query,
).data[0].embedding

with db.cursor() as cur:
    cur.execute("""
        SELECT content, 1 - (embedding <=> %s::vector) AS similarity
        FROM docs
        ORDER BY embedding <=> %s::vector
        LIMIT 5
    """, (emb, emb))
    for content, sim in cur.fetchall():
        print(f"[{sim:.3f}] {content[:120]}…")
```

**5. Runs it.** Claude runs `pip install psycopg openai`, then `python ingest.py notes.md`, then `python retrieve.py "how do I set up postgres"`.

From zero to a working semantic search over my own notes: about 90 seconds of real time, maybe 30 of which was Claude thinking. No Docker. No signup. No credit card.

## Why this works at all

If you're wondering what's actually happening under the hood — this is a small, auditable stack.

Claude Code speaks MCP (Model Context Protocol). MCP lets it call tools that live outside its process. The `@instanode/mcp` package is a tiny Node server (~500 lines) that exposes five tools. When Claude calls `create_database`, the server makes an HTTPS POST to `api.instanode.dev/db/new`, parses the JSON response, and hands the connection string back to Claude as a tool result.

The upstream service is a single Go binary running behind Caddy on a DigitalOcean droplet. The `pg.instanode.dev` hostname points to PgBouncer, which multiplexes connections to a managed Postgres pool. Each call to `/db/new` runs `CREATE DATABASE db_<token>; CREATE USER usr_<token>...` under a least-privileged `provisioner_admin` role. Anonymous databases are swept after 24 hours by a reaper cron.

That's the whole trick. No magic. One Go binary, one Postgres server, PgBouncer for connection multiplexing, a DNS record, a TLS cert. The novelty isn't the infrastructure — it's that the infrastructure is exposed to agents via MCP instead of a web dashboard.

## Keeping it permanent

The free tier is meant for prototypes. When you want a database to stick around past 24 hours, you either:

1. Click the claim URL from the `note` field — signs you in with GitHub, $12/mo or $120/yr, and the resource you just provisioned becomes permanent. No migration, no new connection string.
2. Sign up first, mint a token from the dashboard, export `INSTANODE_TOKEN=eyJ…`, and all future provisions are permanent and linked to your account.

There's a dashboard at `instanode.dev/dashboard` that lists your resources, storage usage, and lets you delete things. It's not fancy. It's a boring paid product for people who want their databases to keep existing.

## When NOT to use this

Honesty is a feature of technical writing. A few cases where this isn't the right tool:

- **Production workloads with specific compliance needs.** We don't have SOC2 or a DPA ready. If you're building a product that stores PII for customers, use a vendor with compliance paperwork — Neon, Supabase, RDS.
- **Huge databases.** The paid tier is 500 MB. If you need 50 GB, this isn't it.
- **When you need specific Postgres extensions beyond pgvector.** We ship a stock Postgres 17 + pgvector. If you need `pg_stat_statements`, `postgis`, or something exotic, you'll hit a wall.

For everything else — side projects, prototypes, coding demos, RAG experiments, agent memory, webhook testing — the friction of a full database provider signup is higher than the value of the provider's extra features.

## Try it

```sh
claude mcp add instanode -- npx -y @instanode/mcp@latest
```

Then in Claude Code:

> *"Provision a Postgres database for this project and write the connection URL to `.env`."*

You'll have a live `postgres://` connection string in about 4 seconds. Use it, break it, throw it away. No account needed.

- Source: [github.com/InstaNode-dev/mcp](https://github.com/InstaNode-dev/mcp)
- npm: [@instanode/mcp](https://www.npmjs.com/package/@instanode/mcp)
- Python SDK (if you'd rather call the HTTP API directly): [pypi.org/project/instanode](https://pypi.org/project/instanode/)
- LangChain adapter: [pypi.org/project/langchain-instanode](https://pypi.org/project/langchain-instanode/)
- LlamaIndex adapter: [pypi.org/project/llama-index-tools-instanode](https://pypi.org/project/llama-index-tools-instanode/)
- CrewAI adapter: [pypi.org/project/crewai-instanode-tools](https://pypi.org/project/crewai-instanode-tools/)
- Raw HTTP reference (for other agents / frameworks): [instanode.dev/llms.txt](https://instanode.dev/llms.txt)

If Claude Code asks you to run `brew install postgres` again, you know what to paste back.
