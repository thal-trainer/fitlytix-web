# Email templates

Branded replacements for Supabase's default auth emails, sent through Resend SMTP.

These live here so they are versioned alongside the pages they link to. Supabase
has no API for templates — they are pasted into the dashboard by hand, so **this
folder is the source of truth and the dashboard is a copy.** If you edit one in
the dashboard, bring the change back here.

| File | Dashboard template |
|---|---|
| `invite.html` | Authentication → Emails → **Invite user** |
| `recovery.html` | Authentication → Emails → **Reset password** |
| `confirm-signup.html` | Authentication → Emails → **Confirm signup** |

## Deploying a change

Templates and site routes have to move together. `/welcome/` did not exist
before this redesign, so a template pointing at it must not go live before the
site does.

1. Deploy the site first, so `/welcome/` and `/forgot-password/` resolve.
2. Add the redirect URLs to the allow-list (below) — links silently fail without this.
3. Paste the templates into the dashboard.
4. Send yourself a real invite and a real reset, and click both.

## Supabase settings these depend on

**Authentication → URL Configuration**

- Site URL: `https://fitlytix.in`
- Redirect URLs (allow-list — a `redirectTo` not listed here is ignored, and the
  user lands on the Site URL with no token):
  ```
  https://fitlytix.in/welcome/
  https://fitlytix.in/welcome/?type=client
  https://fitlytix.in/link-expired/
  ```

**Authentication → Providers → Email**

- Minimum password length: `8` — must match `minPasswordLength` in
  `/assets/config.js`, or the page will accept a password the API then rejects.

## The app has to change too

`{{ .ConfirmationURL }}` resolves to whatever `redirectTo` was passed when the
invite was created. The templates alone do not move anyone to `/welcome/` — the
calls that create invites must pass it:

```js
// Trainer invite
await supabase.auth.admin.inviteUserByEmail(email, {
  redirectTo: 'https://fitlytix.in/welcome/',
});

// Client invite — the query param is what tells /welcome/ to show client
// wording instead of trainer wording
await supabase.auth.admin.inviteUserByEmail(email, {
  redirectTo: 'https://fitlytix.in/welcome/?type=client',
});

// Password reset
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: 'https://fitlytix.in/welcome/',
});
```

Until those are updated, links keep landing on `/` — which still works, because
`index.html` carries a shim that forwards any URL containing a token to
`/welcome/`. Remove that shim only once the app is updated *and* the oldest
outstanding invite has expired.

## Editing notes

- Inline styles and `<table>` layout only. Gmail strips `<style>` blocks, and
  Outlook ignores flexbox, grid and CSS variables.
- Keep the body width at 520px.
- Colours are hard-coded hex, matching the tokens in `/assets/styles.css`:
  background `#000000`, card `#141414`, border `#222222`, accent `#C4A8C8`,
  body text `#aaaaaa`.
- The raw `{{ .ConfirmationURL }}` is printed below every button on purpose —
  some corporate mail gateways rewrite or strip linked buttons.
- The hidden `<div>` at the top is the preheader text shown next to the subject
  line in the inbox. Keep it under about 90 characters.
- The logo is hotlinked from `https://fitlytix.in/assets/logo.png`. If that path
  ever changes, every template breaks — it is a transparent PNG, so it reads
  correctly on both dark and light client backgrounds.

## Suggested subject lines

| Template | Subject |
|---|---|
| Invite | `You've been invited to FITLYTIX` |
| Reset password | `Reset your FITLYTIX password` |
| Confirm signup | `Confirm your FITLYTIX email` |

## Deliverability

Resend needs SPF, DKIM and DMARC on the sending domain before invitations stop
landing in spam. Send from something like `noreply@fitlytix.in` with a
`Reply-To` of a real support address, not a `gmail.com` sender — a mismatch
between the From domain and the DKIM signature is the usual reason gym staff
report never receiving an invite.
