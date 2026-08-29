# Tracked snapshot contract

`record.sqlite` is intentionally absent until a maintainer produces it with
the installed public NiceEval CLI after a selector-free full refresh:

```bash
pnpm exec niceeval exp --rerun all
pnpm exec niceeval record snapshot --output snapshot/record.sqlite
```

It is the only generated database-like artifact this repository tracks. Despite
its filename, it is a sealed-only `RecordSnapshot`, not a normal SQLite copy;
do not fabricate, edit, or replace it with ordinary database files. Review it
through public `niceeval query`, `niceeval show`, and `niceeval view`, then
review `git status --short` before a human manually commits and pushes it.

`receipt.json` is an optional fixed-path provenance receipt that the parent
maintainer may generate only after that real run. It is deliberately absent now:
do not create handwritten JSON, and never treat a receipt as evidence in place
of the CLI-created snapshot.

The snapshot can contain Run content and attachments. Do not place credentials,
`.env` data, operational `.niceeval/` files, query scratch documents, or View
assets here.
