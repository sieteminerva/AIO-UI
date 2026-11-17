/**
 * THE `releases` WORKTREE — one checkout per repository, shared by both publishers.
 *
 * The orphan `releases` branch carries two things and no source:
 *
 *   v<version>/     the tarballs + registry/layout/checksums a consumer installs
 *   packages/**     the same bytes unpacked, so jsDelivr can serve an import map
 *
 * It is checked out at `<repo>/releases` and stays there between publishes, so a
 * generated tarball is a file you can open in the file manager instead of a hidden
 * directory inside `.draft/`. `main` ignores the folder (a worktree must never be
 * added to `main` twice) and carries no binaries. `.draft/` keeps only scratch:
 * the bundle probe, smoke sites, commit messages.
 *
 * Nothing here writes to `main`'s manifests: the worktree is a second checkout, and
 * only files inside it are staged.
 */
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const QUIET = { stdio: "pipe", encoding: "utf8" };

function git(cwd, command, options = QUIET) {
  return execSync(`git ${command}`, { cwd, ...options });
}

/** Is `refs/heads/<branch>` present in this repository? */
export function branchExists(root, branch) {
  try {
    git(root, `rev-parse --verify --quiet refs/heads/${branch}`);
    return true;
  } catch {
    return false;
  }
}

/** Is `<remote>/<branch>` present locally (after a fetch)? */
export function remoteBranchExists(root, remote, branch) {
  try {
    git(root, `rev-parse --verify --quiet refs/remotes/${remote}/${branch}`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns `<root>/releases`, creating the worktree on first use.
 *
 * Order of preference: an existing checkout → the local branch → the remote branch
 * → a brand-new orphan branch with no history from `main`. The orphan path is the
 * one that matters: it is what keeps `main` source-only, and it starts once and is
 * reused forever after.
 */
export function ensureWorktree({ root = process.cwd(), branch = "releases", remote = "origin" } = {}) {
  const path = join(root, branch);

  // Already a worktree of this repository: `.git` is a file, not a directory.
  if (existsSync(join(path, ".git"))) return path;

  if (branchExists(root, branch)) {
    git(root, `worktree add "${path}" ${branch}`);
    return path;
  }

  try {
    git(root, `fetch ${remote} ${branch}`);
  } catch {
    // Offline or the branch does not exist yet; the next check decides.
  }
  if (remoteBranchExists(root, remote, branch)) {
    git(root, `worktree add -B ${branch} "${path}" ${remote}/${branch}`);
    return path;
  }

  git(root, `worktree add --detach "${path}" HEAD`);
  git(path, `checkout --orphan ${branch}`);
  try {
    // An orphan checkout starts with the old index; empty it so the branch never
    // inherits `main`'s tree.
    git(path, "rm -rf . --quiet");
  } catch {
    // Nothing tracked yet — nothing to remove.
  }
  return path;
}

/** Stage everything in the worktree and commit; `--allow-empty` keeps re-publishes honest. */
export function commitWorktree(path, message) {
  git(path, "add -A");
  git(path, `-c user.name=releases -c user.email=releases@local commit --allow-empty -m "${message}"`);
}

/** Push the branch (and, when given, refresh a tag onto the same commit). */
export function pushBranch(path, { branch = "releases", remote = "origin", tag } = {}) {
  if (tag) git(path, `tag -f ${tag}`);
  git(path, `push ${remote} ${branch} --force`, { stdio: "inherit" });
  if (tag) git(path, `push ${remote} refs/tags/${tag} --force`, { stdio: "inherit" });
}
