/* ==========================================================================
   FITLYTIX — shared auth helpers

   Supabase email links (invite, recovery, signup confirmation) land on the
   site with the session in the URL fragment, e.g.

     /welcome/#access_token=...&refresh_token=...&type=invite

   or, when the link has already been used or has aged out:

     /welcome/#error=access_denied&error_code=otp_expired&error_description=...

   This module parses that fragment, establishes the session, and exposes the
   handful of helpers the auth pages need. Requires config.js and the Supabase
   JS SDK to be loaded first.
   ========================================================================== */

window.FitlytixAuth = (function () {
  'use strict';

  var config = window.FITLYTIX;

  var client = window.supabase.createClient(config.supabase.url, config.supabase.anonKey, {
    auth: {
      detectSessionInUrl: true,
      flowType: 'implicit',
      persistSession: true,
    },
  });

  /**
   * Reads auth data from both the URL fragment and the query string.
   * Tokens and errors arrive in the fragment; `type=client` is a query param
   * we set ourselves via redirectTo when inviting a client rather than a
   * trainer, because Supabase uses the same `invite` type for both.
   */
  function readAuthParams() {
    var hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    var query = new URLSearchParams(window.location.search);

    return {
      accessToken: hash.get('access_token'),
      refreshToken: hash.get('refresh_token'),
      // `type` is the Supabase link type: invite | recovery | signup | magiclink
      type: hash.get('type'),
      error: hash.get('error') || query.get('error'),
      errorCode: hash.get('error_code') || query.get('error_code'),
      errorDescription: hash.get('error_description') || query.get('error_description'),
      // Our own flag, carried through redirectTo on client invitations
      isClient: query.get('type') === 'client',
    };
  }

  /**
   * Strips the tokens from the address bar once the session is established, so
   * they are not left in history or leaked through a shared or screenshotted
   * URL. Query params are preserved because they carry the client/trainer flag.
   */
  function clearFragment() {
    if (!window.location.hash) return;
    var clean = window.location.pathname + window.location.search;
    window.history.replaceState(null, '', clean);
  }

  /**
   * Turns tokens from the email link into an active session.
   * Resolves to { ok: true, user } or { ok: false, reason, message }.
   *
   * reason is one of:
   *   'expired'  — link used already or timed out; offer a fresh one
   *   'missing'  — no token in the URL at all; page opened directly
   *   'failed'   — token present but rejected
   */
  async function establishSession(params) {
    if (params.error || params.errorCode) {
      return {
        ok: false,
        reason: params.errorCode === 'otp_expired' || params.error === 'access_denied' ? 'expired' : 'failed',
        message: friendlyError(params.errorDescription || params.error),
      };
    }

    if (!params.accessToken) {
      // The SDK may have already consumed the fragment on an earlier render.
      var existing = await client.auth.getSession();
      if (existing.data && existing.data.session) {
        return { ok: true, user: existing.data.session.user };
      }
      return { ok: false, reason: 'missing', message: 'No sign-in link found in this URL.' };
    }

    var result = await client.auth.setSession({
      access_token: params.accessToken,
      refresh_token: params.refreshToken || '',
    });

    if (result.error || !result.data.session) {
      return {
        ok: false,
        reason: 'expired',
        message: friendlyError(result.error && result.error.message),
      };
    }

    clearFragment();
    return { ok: true, user: result.data.session.user };
  }

  /**
   * Looks up the gym a user belongs to, so the page can show which gym
   * invited them. Returns null when there is no gym on the account or the
   * row is not readable — the caller treats the badge as optional.
   */
  async function getGymName(user) {
    var gymId = user && user.user_metadata && user.user_metadata.gym_id;
    if (!gymId) return null;

    var result = await client.from('gyms').select('name').eq('id', gymId).single();
    if (result.error || !result.data) return null;

    return result.data.name || null;
  }

  /**
   * Marks a trainer invitation as accepted once the password is set.
   * Best-effort: a failure here must not block the trainer from continuing,
   * so errors are swallowed rather than surfaced.
   */
  async function markInviteAccepted(user) {
    if (!user || !user.email) return;
    try {
      await client.from('trainer_invites').update({ status: 'accepted' }).eq('email', user.email);
    } catch (err) {
      /* non-fatal — the account is already usable */
    }
  }

  /** Password rules, shared by the set-password and reset flows. */
  function checkPassword(password) {
    return {
      length: password.length >= config.minPasswordLength,
      letter: /[A-Za-z]/.test(password),
      number: /[0-9]/.test(password),
    };
  }

  function isPasswordValid(password) {
    var checks = checkPassword(password);
    return checks.length && checks.letter && checks.number;
  }

  /** Turns Supabase's raw error strings into something a person can act on. */
  function friendlyError(message) {
    if (!message) return 'Something went wrong. Please request a new link.';

    var text = String(message).replace(/\+/g, ' ');

    if (/expired|invalid/i.test(text)) {
      return 'This link has expired or has already been used.';
    }
    if (/should be at least/i.test(text)) {
      return 'Password must be at least ' + config.minPasswordLength + ' characters.';
    }
    if (/same.*password/i.test(text)) {
      return 'Choose a password different from your current one.';
    }
    if (/rate limit|too many/i.test(text)) {
      return 'Too many attempts. Please wait a minute and try again.';
    }
    return text;
  }

  return {
    client: client,
    readAuthParams: readAuthParams,
    establishSession: establishSession,
    clearFragment: clearFragment,
    getGymName: getGymName,
    markInviteAccepted: markInviteAccepted,
    checkPassword: checkPassword,
    isPasswordValid: isPasswordValid,
    friendlyError: friendlyError,
  };
})();
