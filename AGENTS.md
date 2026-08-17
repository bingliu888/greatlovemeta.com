# GreatLoveMeta Site Rules

- The shared policy in `/Users/bingliu/Documents/Codex/Sites/AGENTS.md` is authoritative. This file adds GreatLoveMeta-specific requirements only and must not weaken or replace the shared policy.
- GreatLoveMeta uses GitHub as source of truth and Cloudflare as production host. Do not restore the retired Sites source remote or a `.openai/hosting.json` deployment path.

## Login-protected navigation

- Any link or button shown to an anonymous visitor that can enter a server-rendered login-protected page must use full-document navigation (`<a href>` or `window.location.assign`). Do not use `next/link`, `router.push`, or another soft RSC navigation for that transition because an authentication redirect can leave mobile Safari on a blank page.
- Keep every anonymous/public entry surface covered by `scripts/check-protected-navigation.mjs`. Add new protected route markers and public source files to that check whenever navigation or authentication changes.
- The daily workflow must run the protected-navigation check and the multi-user, two-game reward-log test. A scheduled failure must create or update a GitHub issue with the failed run.
- A Codex maintenance run responding to such a failure must diagnose and repair the cause, rerun tests and the production build, synchronize the validated GitHub commit to Cloudflare under the shared delivery policy, and verify production. Reporting the failure without attempting the in-scope repair is not completion.
