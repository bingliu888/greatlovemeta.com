# Production Hosting and Payments

Status: approved architecture decision, July 16, 2026.

## Decision

Use ChatGPT Sites for the public MVP, interface development, authentication
testing, and non-financial workflow testing. Before accepting real customer
payments, migrate GreatLove Meta.Guru to Cloudflare Workers with an independent D1
database.

Cloudflare is preferred over Vercel because this codebase already targets the
Vinext/Cloudflare Worker runtime, D1 is integrated with the current data layer,
and the expected starting infrastructure cost is lower.

## Production Architecture

| Responsibility | Managed service |
| --- | --- |
| Web application and API routes | Cloudflare Workers |
| Relational application data | Cloudflare D1 |
| Optional generated files and uploads | Cloudflare R2 |
| Passwordless authentication | Clerk production instance for GreatLove Meta.Guru |
| Monthly and annual subscriptions | PayPal Business, GreatLove Meta.Guru plans |
| Transactional email | Resend or another approved email provider |
| Source control and deployment | Independent GitHub repository and CI/CD |
| Domain and DNS | `greatlovemeta.com`, registered at GoDaddy |

The GreatLove Meta.Guru deployment, database, Clerk application, PayPal plans,
secrets, webhooks, referral records, and reward ledger must remain independent
from Mahj.Guru. Both applications may share one Cloudflare account without
sharing application data.

## Cost Baseline

Current public pricing indicates the Cloudflare Workers Paid plan starts at
USD 5 per month per account. Both Guru applications can normally share that
account during the MVP stage. D1 includes substantial monthly read, write, and
storage allowances on the paid plan, so the expected initial combined hosting
and database cost is approximately USD 5 per month.

This estimate excludes:

- GoDaddy domain renewals
- PayPal transaction and currency-conversion fees
- Clerk usage above its included allowance
- Email delivery above the provider's included allowance
- Any Cloudflare usage above the paid-plan allowances

Configure Cloudflare spending notifications and application limits before
launch. Recheck vendor pricing immediately before enabling live payments.

## Subscription Requirements

GreatLove Meta.Guru will offer separate monthly and annual USD subscription plans
with:

- payment information collected by PayPal before the trial starts
- a seven-day free trial
- automatic billing after the trial unless cancelled
- cancellation and subscription-status handling
- webhook-driven activation, renewal, suspension, and cancellation
- idempotent processing so repeated PayPal webhooks never duplicate benefits

The application must never store card or bank details. PayPal hosts and handles
payment collection.

## Referral and Reward Requirements

- Each eligible customer receives a unique referral code and share URL.
- A new eligible customer receives 15% off the defined first paid period.
- The introducer receives reward points only after the referred subscription
  reaches the approved qualifying payment state.
- Reward points are stored in an append-only ledger, not only as an editable
  balance.
- Every award and redemption references its source event and uses a unique
  idempotency key.
- Self-referrals, repeated claims, cancelled payments, refunds, chargebacks,
  and abuse require explicit handling.

## Launch Migration Checklist

1. Create the Cloudflare production account, Worker applications, and separate
   GreatLove Meta.Guru D1 database.
2. Create the independent GitHub repository and protected production branch.
3. Move application secrets into Cloudflare encrypted secrets; never commit
   secret values.
4. Deploy the application to a temporary Cloudflare hostname and run regression
   tests for both languages and responsive layouts.
5. Configure the Clerk production domain, redirect URLs, and webhook endpoint.
6. Build and test the full subscription, referral, and reward workflow using
   PayPal Sandbox.
7. Back up D1, document restore steps, and verify webhook replay safety.
8. Connect `greatlovemeta.com` to Cloudflare and verify HTTPS, redirects, email DNS,
   and Clerk DNS.
9. Add live PayPal credentials and plans only after the production review.
10. Complete controlled real-payment, cancellation, refund, referral, and
    reward-ledger tests before public launch.

## Operating Principle

Prefer managed services and automatic deployments. Routine publishing,
certificate renewal, database availability, authentication email delivery, and
subscription status synchronization should not require manual server work.
