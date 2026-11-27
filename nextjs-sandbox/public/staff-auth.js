/* ASMI staff sign-in for the counsellor tools (/counsellor, /engineering-counsellor).
 *
 * With Google sign-in ON (staff-config.json has a googleClientId): nothing in the page runs until a Google account on the sheet's "Staff" tab has
 * signed in. Student data is read and saved only through staffGetStudent / staffSaveShortlist, which the Apps Script checks on the server:
 * the Google ID token travels in a POST BODY (never a URL) and the script verifies it and the Staff tab itself. This file is a convenience, not the lock.
 * With sign-in OFF (no client id) the tools behave as before, EXCEPT on preview builds, which refuse to run so they can never touch a live script.
 * The script URLs come from /staff-config.json (written at build time); this file contains no script URL.
 */
(function () {
  'use strict';
  var cfg = null, current = null, initialized = false, waiter = null, overlay = null, base = null;

  function el(tag, css, text) { var e = document.createElement(tag); if (css) e.style.cssText = css; if (text) e.textContent = text; return e; }
  function claims(jwt) {
    try {
      var b64 = String(jwt).split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      var bin = atob(b64 + '='.repeat((4 - b64.length % 4) % 4)), bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return JSON.parse(new TextDecoder().decode(bytes));
    } catch (e) { return null; }
  }
  function show(title, text, opts) {
    opts = opts || {};
    if (!overlay) {
      overlay = el('div', 'position:fixed;inset:0;z-index:2147483647;background:#1a0040;display:flex;align-items:center;justify-content:center;padding:16px;font-family:Montserrat,Arial,sans-serif;');
      document.body.appendChild(overlay);
    }
    overlay.innerHTML = '';
    var card = el('div', 'background:#fff;color:#1a0040;border-radius:16px;max-width:440px;width:100%;padding:28px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.4);');
    var logo = el('img', 'height:44px;margin-bottom:16px;'); logo.src = '/asmi-logo.png'; logo.alt = 'ASMI';
    card.appendChild(logo);
    card.appendChild(el('h2', 'font-size:18px;font-weight:800;margin:0 0 8px;', title));
    card.appendChild(el('p', 'font-size:13px;line-height:1.5;color:#444;margin:0 0 18px;', text));
    var slot = el('div', 'display:flex;justify-content:center;min-height:44px;'); slot.id = 'staffGoogleBtn'; if (opts.button) card.appendChild(slot);
    if (opts.action) { var b = el('button', 'background:#1a0040;color:#fff;border:0;border-radius:10px;padding:10px 18px;font-weight:700;font-size:13px;cursor:pointer;margin-top:10px;', opts.action[0]); b.onclick = opts.action[1]; card.appendChild(b); }
    overlay.appendChild(card);
    if (opts.button && initialized) { slot.innerHTML = ''; window.google.accounts.id.renderButton(slot, { theme: 'outline', size: 'large', shape: 'pill', text: 'signin_with', width: 280 }); }
  }
  function hide() { if (overlay) { overlay.remove(); overlay = null; } }

  function loadGis() {
    return new Promise(function (resolve, reject) {
      if (window.google && window.google.accounts && window.google.accounts.id) { resolve(); return; }
      var s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true;
      s.onload = function () { resolve(); }; s.onerror = function () { reject(new Error('gis')); }; document.head.appendChild(s);
    });
  }
  function onCredential(resp) {
    var idToken = resp && resp.credential, c = idToken && claims(idToken);
    if (!c) return;
    current = { idToken: idToken, exp: (Number(c.exp) || 0) * 1000 };
    if (waiter) { var w = waiter; waiter = null; w(current); }
  }
  function waitForCredential() { return new Promise(function (resolve) { waiter = resolve; }); }
  function fresh() { return !!current && current.exp - Date.now() > 60000; }
  function post(url, body) {
    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) }).then(function (r) { return r.json(); });
  }
  // A usable ID token or null. force = ask Google for a new one even if this one looks fresh.
  function getIdToken(force) {
    if (!force && fresh()) return Promise.resolve(current.idToken);
    var got = waitForCredential(), timeout = new Promise(function (r) { setTimeout(function () { r(null); }, 6000); });
    try { window.google.accounts.id.prompt(); } catch (e) { /* the button still works */ }
    return Promise.race([got, timeout]).then(function (n) { waiter = null; return n ? n.idToken : null; });
  }

  var API = {
    mode: 'legacy',
    email: null,
    // await StaffAuth.start({ kind: 'medical' | 'engineering' }). Resolves only when the tool may run.
    start: function (opts) {
      return fetch('/staff-config.json', { cache: 'no-store' }).then(function (r) { return r.json(); }).catch(function () { return null; }).then(function (c) {
        cfg = c || {};
        if (!cfg.googleClientId) {
          if (!c) { show('Could not load the staff settings', 'Check your internet connection and reload.', { action: ['Reload', function () { location.reload(); }] }); return new Promise(function () {}); }
          if (cfg.preview || !cfg.medicalUrl) { show('Staff tools are not set up on this test site', 'This preview needs the Google sign-in settings and a copy of the sheet. It will not use the live sheet.'); return new Promise(function () {}); }
          API.mode = 'legacy'; base = cfg.medicalUrl; return { mode: 'legacy' };   // the old behaviour: both tools used the Medical script's URL
        }
        API.mode = 'google';
        base = opts.kind === 'engineering' ? cfg.engineeringUrl : cfg.medicalUrl;
        if (!base) { show('Staff tools are not connected', 'This site has no sheet connected for these tools. Ask the developer.'); return new Promise(function () {}); }
        return loadGis().then(function () {
          window.google.accounts.id.initialize({ client_id: cfg.googleClientId, callback: onCredential, auto_select: true, cancel_on_tap_outside: false, itp_support: true });
          initialized = true;
          return API._signInLoop();
        }, function () { show('Google sign-in could not load', 'Check your internet connection and try again.', { action: ['Try again', function () { location.reload(); }] }); return new Promise(function () {}); });
      });
    },
    _signInLoop: function () {
      function ask(first) {
        show('Staff sign-in', 'Sign in with your ASMI Google account to use this tool.', { button: true });
        if (first) { try { window.google.accounts.id.prompt(); } catch (e) { /* ignore */ } }
        return waitForCredential().then(check);
      }
      function check(tok) {
        show('Checking…', 'One moment.');
        return post(base, { action: 'staffCheck', idToken: tok.idToken }).then(function (res) {
          if (res && res.success) { var c = claims(tok.idToken); API.email = c && c.email ? String(c.email) : ''; hide(); return { mode: 'google' }; }
          if (res && res.error === 'not_staff') {
            return new Promise(function (resolve) {
              show('Not on the staff list', 'This Google account is not registered as ASMI staff. Use a different account, or ask the developer to add you.', { action: ['Use a different account', function () { current = null; try { window.google.accounts.id.disableAutoSelect(); } catch (e) { /* ignore */ } resolve(ask(false)); }] });
            });
          }
          if (res && (res.error === 'auth_invalid' || res.error === 'auth_required')) { current = null; return ask(false); }
          return new Promise(function (resolve) { show('Could not check your sign-in', 'Please try again in a minute.', { action: ['Try again', function () { resolve(check(tok)); }] }); });
        }, function () {
          return new Promise(function (resolve) { show('Could not reach the server', 'Check your internet connection.', { action: ['Try again', function () { resolve(check(tok)); }] }); });
        });
      }
      return ask(true);
    },
    // action: 'staffGetStudent' { token } | 'staffSaveShortlist' { token, colleges }. Returns the parsed answer (throws on a network failure).
    call: function (action, payload) {
      payload = payload || {};
      if (API.mode === 'legacy') {                       // the old token-only calls, kept only while sign-in is switched off
        var t = encodeURIComponent(payload.token || '');
        if (action === 'staffGetStudent') return fetch(base + '?action=getStudent&token=' + t).then(function (r) { return r.json(); });
        var legacy = { action: 'saveShortlist', token: payload.token, colleges: payload.legacyColleges !== undefined ? payload.legacyColleges : payload.colleges };
        if (payload.track) legacy.track = payload.track;
        return post(base, legacy);
      }
      var clean = Object.assign({}, payload); delete clean.legacyColleges; delete clean.track;   // legacy-only fields
      var send = function (tok) { return post(base, Object.assign({}, clean, { action: action, idToken: tok })); };
      return getIdToken(false).then(function (tok) {
        if (!tok) return API._reauth().then(function () { return API.call(action, payload); });
        return send(tok).then(function (res) {
          if (res && (res.error === 'auth_invalid' || res.error === 'auth_required')) {
            return getIdToken(true).then(function (t2) { return t2 ? send(t2) : API._reauth().then(function () { return API.call(action, payload); }); });
          }
          return res;
        });
      });
    },
    _reauth: function () { current = null; return API._signInLoop(); }
  };
  window.StaffAuth = API;
})();
