# GreatLoveMeta Site Rules

- After completing and validating an in-scope change in this repository, Codex is authorized to publish the saved version to the existing public GreatLoveMeta Sites project without requesting per-deployment confirmation.
- Codex is authorized to commit and push in-scope changes directly to this repository's existing GitHub `origin` without requesting per-push confirmation.
- Keep the Sites source remote and GitHub `origin` synchronized to the same validated commit.
- These standing authorizations apply only to this repository and its existing remotes. They do not authorize destructive Git operations, changes to domains or access controls, secret changes, or publishing unrelated projects.

## Login-protected navigation

- Any link or button shown to an anonymous visitor that can enter a server-rendered login-protected page must use full-document navigation (`<a href>` or `window.location.assign`). Do not use `next/link`, `router.push`, or another soft RSC navigation for that transition because an authentication redirect can leave mobile Safari on a blank page.
- Keep every anonymous/public entry surface covered by `scripts/check-protected-navigation.mjs`. Add new protected route markers and public source files to that check whenever navigation or authentication changes.
- The daily workflow must run the protected-navigation check and the multi-user, two-game reward-log test. A scheduled failure must create or update a GitHub issue with the failed run.
- A Codex maintenance run responding to such a failure must diagnose and repair the cause, rerun tests and the production build, synchronize GitHub and Sites to the same commit, and publish the repaired version. Reporting the failure without attempting the in-scope repair is not completion.
