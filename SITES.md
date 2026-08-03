# GreatLoveMeta.com Site Family

## Project boundary

This repository is the independent codebase for the GreatLove Meta site family. Guandan.Guru is the canonical generic product and UI baseline: navigation, responsive breakpoints, passwordless accounts, user dashboard, account settings, referral URL and rewards, Ask Guru, Community, messages, live chat, notifications, editorial pages, and the public Project operations dashboard must remain feature- and interaction-equivalent unless a GreatLove Meta requirement explicitly replaces a behavior. GreatLove Meta branding, civic content, data, deployments, and release history remain independent.

## Domain roles

| Domain | Role | Primary experience |
| --- | --- | --- |
| `greatlovemeta.com` | Canonical main site | Brand authority, digital citizen identity, News, Events, Community, Projects, Ask Guru, messages, and live chat |
| `cz.cool` | Youth-facing acquisition site | Interactive citizen identity card, campaigns, social sharing, claims, short links, and conversion into the main site |
| `worldcitizen.digital` | Protected secondary domain | Permanent 301 redirect to `https://greatlovemeta.com` |

## Shared platform rules

- `greatlovemeta.com` is the canonical SEO origin.
- `cz.cool` always displays “Powered by GreatLoveMeta.com” or “A GreatLove Meta Community Project.”
- `cz.cool` remains public and has no sign-in surface. Any account action links to the GreatLoveMeta.com passwordless email flow.
- Account, profile, community, messages, live-chat threads, and credential ownership are resolved by the same stable user ID.
- Cross-domain authentication uses the identity provider’s supported multi-domain configuration; authentication tokens are never copied through query strings or browser storage.
- Wallet binding is optional and is attached to an authenticated user profile after an explicit signature challenge.
- D1 stores structured application state. R2 stores user-owned images, video, audio, and message attachments.

## Navigation

The primary header is News, Events, Community, Projects, and Sign in or the signed-in user icon. Ask Guru remains available as a contextual assistant and inside message composition.

## Work grouping

- Task family 1: `mahj.guru` + `guandan.guru`
- Task family 2: `greatlovemeta.com` + `cz.cool`

Changes must not cross task-family repositories unless a reusable pattern is intentionally ported and then maintained independently.

## Guandan parity contract

- Treat every stable Guandan generic feature as inherited by `greatlovemeta.com`; a route name alone does not satisfy parity.
- Preserve Guandan layout structure, typography scale, spacing, responsive header/menu behavior, language control, account-state handling, loading/error states, and mobile interaction patterns.
- Adapt only game-specific language, imagery, categories, assistant instructions, and data to the GreatLove Meta domain.
- Project must use the full calendar, delivery-day detail, build report, daily report, task detail, KPI, and history experience.
- Project content, task records, build numbers, daily reports, runtime keys, and deployment history must come only from GreatLoveMeta.com. Never copy or merge Guandan project data.
- Ask Guru text mode is public. Live audio requires a GreatLoveMeta.com account.
- Community, dashboard, account, refURL, messaging, live chat, attachments, group membership, and notifications remain account features.
- GreatLoveMeta.com accounts use the site-owned `glm_session` cookie created by the email verification-code flow. Do not reintroduce ChatGPT, Sites-access, Clerk, or another provider session into application authorization without an explicit migration decision.
- Validate desktop, resized-window, tablet, and phone behavior whenever shared baseline components change.

## Repository and deployment policy

- Use a dedicated GitHub repository for the GreatLove Meta site family; never place this source in the Mahj.Guru or Guandan.Guru repositories.
- Keep `GreatLoveMeta.com` and `cz.cool` separately identifiable in Sites even when they share identity and selected packages.
- Production data bindings are unique to this family.
- Domain-specific configuration is explicit; hostname detection never silently falls back to another brand.

## Current implementation baseline

The initial codebase includes bilingual navigation and pages, passwordless email identity, user profiles, a responsive community, direct and group messages, persistent live chat, notifications, file attachments, Ask Guru text and live voice surfaces, D1 persistence, and R2 object storage.

- Interactive text AI follows the portfolio provider policy: automatic mode prefers DeepSeek V4 Flash for Cloudflare country CN and GPT-5.6 Luna elsewhere; members can override this in Account. Keep DEEPSEEK_API_KEY server-only. Images, voice, moderation, embeddings, and other specialist routes remain on their compatible specialist models.
