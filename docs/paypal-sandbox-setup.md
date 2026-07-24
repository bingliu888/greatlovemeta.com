# PayPal Sandbox launch checklist

The PayPal merchant email is an account login, not an API credential. Sign in to the PayPal Developer Dashboard with the business account that owns `sales@cybeye.com`, then create or select a **Sandbox REST app**. Never place its secret in GitHub or chat.

Create an independent GreatLove Meta.Guru service product and four USD fixed-price plans: standard monthly, standard annual, referral monthly, and referral annual. Each begins with one seven-day $0 trial billing cycle, then the regular recurring cycle. Referral plans apply the 15% first-paid-period offer. GreatLove Meta.Guru product, plans, webhook, subscriptions, and customer records must remain independent from every other site.

Add these as **Secrets** in the GreatLove Meta.Guru Sites settings:

- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_WEBHOOK_ID`
- `PAYPAL_MONTHLY_PLAN_ID`
- `PAYPAL_ANNUAL_PLAN_ID`
- `PAYPAL_MONTHLY_REFERRAL_PLAN_ID`
- `PAYPAL_ANNUAL_REFERRAL_PLAN_ID`

Add these as ordinary **Environment variables**:

- `PAYPAL_ENVIRONMENT=sandbox`
- `PUBLIC_MONTHLY_PRICE=<USD display price>`
- `PUBLIC_ANNUAL_PRICE=<USD display price>`
- `REFERRAL_REWARD_POINTS=0`

Configure `https://greatlovemeta.com/api/paypal/webhook` for subscription created, activated, updated, cancelled, suspended, expired, payment failed, sale completed, sale refunded, and sale reversed events. Test with a separate Sandbox personal buyer. Verify both cadences, payment method before trial, first charge, cancellation, failed payment, referral pricing, idempotent webhooks, and refund/reversal before enabling Live credentials.
