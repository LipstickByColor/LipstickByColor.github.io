// Analytics and consent, shared by every page (loaded in <head>, before any other script).
// Google Analytics is only requested once analytics is allowed:
//   - visitors on a European time zone are asked first (banner below), and nothing loads until they accept
//   - browsers sending Global Privacy Control are treated as "no" without asking
//   - everyone else gets analytics by default and can switch it off on /privacy/
// The choice lives in localStorage under 'lipstick-consent' ('granted' | 'denied').
// gtag() is always defined, so `window.gtag?.('event', …)` calls elsewhere are safe either way.
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}

(function () {
  var GA_ID = 'G-3D5R6QNPX3', KEY = 'lipstick-consent';

  var stored = null;
  try { stored = localStorage.getItem(KEY); } catch (e) {}
  if (stored !== 'granted' && stored !== 'denied') stored = null;

  var tz = '';
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
  // Unknown time zone counts as "ask first"
  var askFirst = !tz || /^Europe\/|^Atlantic\/(Reykjavik|Canary|Madeira|Azores|Faroe)$|^Arctic\//.test(tz);
  var gpc = navigator.globalPrivacyControl === true;

  var loaded = false;
  function loadAnalytics() {
    if (loaded) return;
    loaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
  }

  // Best effort: GA's cookies are _ga and _ga_<stream id>
  function clearAnalyticsCookies() {
    document.cookie.split(';').forEach(function (c) {
      var name = c.split('=')[0].trim();
      if (!/^_ga/.test(name)) return;
      var gone = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
      document.cookie = gone;
      document.cookie = gone + '; domain=' + location.hostname;
      document.cookie = gone + '; domain=.' + location.hostname;
    });
  }

  function state() { return stored || (askFirst || gpc ? 'denied' : 'granted'); }

  function set(value) {
    stored = value === 'granted' ? 'granted' : 'denied';
    try { localStorage.setItem(KEY, stored); } catch (e) {}
    gtag('consent', 'update', { analytics_storage: stored });
    if (stored === 'granted') loadAnalytics(); else clearAnalyticsCookies();
    var banner = document.getElementById('consent-banner');
    if (banner) banner.remove();
    window.dispatchEvent(new Event('lipstick-consent'));
  }

  gtag('consent', 'default', {
    analytics_storage: state(),
    ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
  });
  gtag('js', new Date());
  gtag('config', GA_ID);
  if (state() === 'granted') loadAnalytics();

  // state() is 'granted' | 'denied'; chosen() is false until the visitor has picked one
  window.lipstickConsent = { state: state, set: set, chosen: function () { return !!stored; } };

  // Clicks between pages of the site, as nav_link_click { target, location } — the same event
  // the finder sends for its own header and footer links (so links inside #root are skipped).
  function pageName(path) {
    var p = path.replace(/index\.html$/, '').replace(/\.html$/, '').replace(/^\/+|\/+$/g, '');
    return p ? p.split('/').pop().replace(/-/g, '_') : 'finder';
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.host !== location.host || a.closest('#root')) return;
    if (a.pathname === location.pathname) return; // same-page anchors
    gtag('event', 'nav_link_click', { target: pageName(a.pathname), location: pageName(location.pathname) });
  });

  if (stored || gpc || !askFirst) return;

  function showBanner() {
    var el = document.createElement('div');
    el.id = 'consent-banner';
    el.setAttribute('role', 'region');
    el.setAttribute('aria-label', 'Analytics cookies');
    el.style.cssText = 'position:fixed;left:16px;right:16px;bottom:16px;z-index:2147483000;margin:0 auto;max-width:560px;' +
      'display:flex;flex-wrap:wrap;align-items:center;gap:12px 16px;padding:16px 18px;' +
      'background:#fff;color:#3D2820;border:1px solid #E0D0C4;border-radius:14px;box-shadow:0 8px 30px rgba(42,26,20,0.16);' +
      "font-family:'DM Sans',system-ui,sans-serif;font-size:13px;line-height:1.5;text-align:left";
    var btn = 'font:inherit;font-weight:500;font-size:12px;letter-spacing:0.06em;text-transform:uppercase;' +
      'padding:10px 16px;border-radius:40px;cursor:pointer;border:1px solid #2A1A14;';
    el.innerHTML =
      '<p style="flex:1 1 260px;margin:0">May we use Google Analytics cookies to see which parts of the site get used? ' +
      '<a href="/privacy/" style="color:#5C3D30">Privacy</a></p>' +
      '<div style="display:flex;gap:8px;flex:none">' +
      '<button type="button" data-consent="denied" style="' + btn + 'background:#fff;color:#2A1A14">No thanks</button>' +
      '<button type="button" data-consent="granted" style="' + btn + 'background:#2A1A14;color:#FAF6F1">Allow</button>' +
      '</div>';
    el.addEventListener('click', function (e) {
      var value = e.target.getAttribute && e.target.getAttribute('data-consent');
      if (value) set(value);
    });
    document.body.appendChild(el);
  }
  if (document.body) showBanner(); else document.addEventListener('DOMContentLoaded', showBanner);
})();
