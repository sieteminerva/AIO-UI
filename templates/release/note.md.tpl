<!--
  Release note skeleton — copy to docs/releases/v<x.y.z>.md at the start of a release, fill the
  hand-written prose, then let `node scripts/release-doc.mjs --version x.y.z --apply` fill the two
  marker-bounded blocks from releases/v<x.y.z>/registry.json. Everything outside the markers is
  judgement and is never rewritten by the generator.
-->

# v<x.y.z> — <one-line theme>

<lead paragraph — what this release is, in one or two sentences>

## Breaking

- <what breaks, and the one-line migration for it>

## Migration

```diff
-<old import / call>
+<new import / call>
```

## Added

- <new package, script or contract>

## Live CDN paths

Base `https://cdn.jsdelivr.net/gh/<owner>/<repo>@v<x.y.z>/`. Generated from
`releases/v<x.y.z>/registry.json`: one row per package subpath. `npm run check:live` probes the
registry, the bundled-pair files and one tarball.

### Bundled pair (branch root)

Four files, not packages: they have no tarball and no `exports` entry, so they sit at the branch
root beside `registry.json`, and `registry.json` names them under `bundle.files`.

<!-- artefacts:begin -->
<!-- artefacts:end -->

Packaging the pair as a tarball is tracked separately; see
`docs/framework/TASK-release-automation.md` §2.1.

<!-- cdn-paths:begin -->
<!-- cdn-paths:end -->
