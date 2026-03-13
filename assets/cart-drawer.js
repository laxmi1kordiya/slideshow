/* ===========================================================
    CART DRAWER JS — Force single full-screen overlay + reliable close
    Clean, well-structured and idempotent
    =========================================================== */

(function () {
    'use strict';

    function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
    function qsa(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel || '')); }
    function on(el, ev, fn) { if (!el) return; el.addEventListener(ev, fn); }

    // Mutable refs
    let drawer = qs('#CartDrawer');
    let overlay = qs('#CartDrawerOverlay');

    // Create or normalize a single overlay element we control
    function ensureOverlay() {
        // Remove duplicate overlay-like elements (keep the first)
        const candidates = qsa('#CartDrawerOverlay, .cart-drawer__overlay');
        if (candidates.length > 1) {
            for (let i = 1; i < candidates.length; i++) {
                try { candidates[i].parentNode.removeChild(candidates[i]); } catch (e) { /* ignore */ }
            }
        }

        overlay = qs('#CartDrawerOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'CartDrawerOverlay';
            overlay.className = 'cart-drawer__overlay';
            document.body.appendChild(overlay);
        }

        // Force full-screen, base hidden state (inline style to beat external CSS if necessary)
        Object.assign(overlay.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            width: '100%',
            height: '100%',
            zIndex: '9998',
            display: 'none',
            pointerEvents: 'none',
            opacity: '0',
            visibility: 'hidden',
            background: 'rgba(0,0,0,0.36)'
        });

        overlay.setAttribute('aria-hidden', 'true');

        // bind click once
        if (!overlay._cartOverlayClickBound) {
            overlay.addEventListener('click', function (e) {
                e.preventDefault();
                closeDrawer();
            });
            overlay._cartOverlayClickBound = true;
        }
    }

    // ensures drawer ref
    function ensureDrawer() {
        drawer = qs('#CartDrawer');
        if (!drawer) return;
        drawer.style.right = '0';
        drawer.style.left = 'auto';
    }

    function showOverlay() {
        if (!overlay) return;
        overlay.style.display = 'block';
        overlay.style.pointerEvents = 'auto';
        overlay.style.opacity = '1';
        overlay.style.visibility = 'visible';
        overlay.setAttribute('aria-hidden', 'false');
    }

    /* ---------- Update header cart count (keeps badge in sync) ---------- */
    /* ---------- Update header cart count (keeps badge in sync) ---------- */
function updateCartCount(providedCount) {
  // selectors to try — covers many theme/app naming conventions
  const selectors = [
    '[data-header-cart-count]',
    '[data-cart-count]',
    '[data-cart-bubble]',
    '[data-cart-quantity]',
    '.site-header-cart--count',
    '.site-header__cart-count',
    '.site-cart-count',
    '.cart-count-bubble',
    '.cart-count',
    '.cart-quantity',
    '.header-cart-count',
    '.site-header-cart-badge',
    '.cart-bubble',
    '.mini-cart__count',
    '.cart-badge'
  ];

  function applyCount(count) {
    const n = Number(count) || 0;
    // update any matching element's visible text + some common attributes
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        try {
          // if element contains only a number, replace it; otherwise update dataset/aria (safe)
          // set visible number (or empty string when zero)
          el.textContent = n > 0 ? String(n) : '';

          // also set common numeric attributes used by themes/apps
          try { if (el.dataset) el.dataset.cartCount = n > 0 ? String(n) : ''; } catch(e){}
          try { if (el.dataset) el.dataset.headerCartCount = n > 0 ? String(n) : ''; } catch(e){}
          try { if (el.hasAttribute && el.hasAttribute('data-header-cart-count')) el.setAttribute('data-header-cart-count', String(n)); } catch(e){}
          try { if (el.hasAttribute && el.hasAttribute('data-cart-count')) el.setAttribute('data-cart-count', String(n)); } catch(e){}

          // update title/aria-label if present so tooltips/readers are consistent
          try { if (n > 0) el.title = (el.title || '').replace(/\d+/, String(n)); } catch(e){}
          try { if (n > 0 && el.getAttribute('aria-label')) el.setAttribute('aria-label', el.getAttribute('aria-label').replace(/\d+/, String(n))); } catch(e){}

          // toggle visible class (your theme uses this)
          if (n > 0) el.classList.add('visible');
          else el.classList.remove('visible');
        } catch (e) { /* ignore per-element errors */ }
      });
    });

    // Additionally update any inline bubbles inside cart icons (e.g. .cart-icon .bubble)
    try {
      document.querySelectorAll('.cart-icon, .site-header__cart, .header-cart').forEach(icon => {
        const bubble = icon.querySelector('.cart-bubble, .bubble, .site-header-cart--count, .cart-count');
        if (bubble) {
          try { bubble.textContent = n > 0 ? String(n) : ''; } catch(e){}
          try { if (n > 0) bubble.classList.add('visible'); else bubble.classList.remove('visible'); } catch(e){}
        }
      });
    } catch(e){}

    return n;
  }

  if (typeof providedCount !== 'undefined') {
    return Promise.resolve(applyCount(providedCount));
  }

  return fetch('/cart.js', { credentials: 'same-origin' })
    .then(r => { if (!r.ok) throw new Error('Cart fetch failed'); return r.json(); })
    .then(data => applyCount((data && typeof data.item_count !== 'undefined') ? data.item_count : 0))
    .catch(err => {
      console.warn('updateCartCount error', err);
      return 0;
    });
}


    function hideOverlay() {
        if (!overlay) return;
        overlay.style.display = 'none';
        overlay.style.pointerEvents = 'none';
        overlay.style.opacity = '0';
        overlay.style.visibility = 'hidden';
        overlay.setAttribute('aria-hidden', 'true');
    }

    // drawer open/close
    function openDrawer() {
        ensureDrawer();
        if (!drawer) return;
        drawer.classList.add('cart-drawer--open');
        showOverlay();
        document.documentElement.style.overflow = 'hidden';
    }

    function closeDrawer() {
        ensureDrawer();
        if (!drawer) return;
        drawer.classList.remove('cart-drawer--open');
        hideOverlay();
        document.documentElement.style.overflow = '';
    }

    // safe bind helper (prevents duplicate handlers using data flag)
    function safeBind(el, ev, fn, flag) {
        if (!el) return;
        try {
            if (flag && el.dataset && el.dataset[flag]) return;
        } catch (e) {}
        el.addEventListener(ev, fn);
        try { if (flag && el.dataset) el.dataset[flag] = '1'; } catch (e) {}
    }

    // bind open triggers by data attribute or common selectors
    function bindOpenTriggers() {
        let triggers = qsa('[data-cart-open], [data-cart-toggle]');
        if (!triggers.length) {
            const selectors = [
                '.site-header__cart',
                '.site-header-cart--button',
                '.site-header-cart--button a',
                '.cart-toggle',
                '.cart-button',
                '.header__icon--cart',
                '.icon-cart',
                '[data-action="toggle-cart"]',
                'button[aria-label*="cart"]',
            ];
            selectors.forEach(sel => qsa(sel).forEach(el => triggers.push(el)));
        }

        triggers.forEach(btn => {
            safeBind(btn, 'click', function (e) {
                e.preventDefault();
                openDrawer();
            }, 'cartOpenBound');
        });
    }

    // bind close buttons & Escape
    function bindCloseButtons() {
        qsa('[data-cart-drawer-close]').forEach(btn => {
            safeBind(btn, 'click', function (e) {
                e.preventDefault();
                closeDrawer();
            }, 'cartCloseBound');
        });

        if (!document._cartEscapeBound) {
            document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDrawer(); });
            document._cartEscapeBound = true;
        }
    }

    // qty binds (keeps old behavior)
    function bindQty() {
        qsa('[data-qty-change]').forEach(btn => {
            safeBind(btn, 'click', function (e) {
                e.preventDefault();
                const line = btn.getAttribute('data-line');
                const change = btn.getAttribute('data-qty-change');
                const input = qs(`[data-line-input="${line}"]`);
                let qty = parseInt(input ? input.value : '0', 10) || 0;
                qty = change === 'increase' ? qty + 1 : qty - 1;
                if (qty < 0) qty = 0;
                changeLineQuantity(line, qty)
                  .then(() => refreshDrawer()) // preserve open state inside refreshDrawer
                  .catch(err => console.error('Quantity change failed', err));
            }, 'qtyBtnBound');
        });

        qsa('[data-line-input]').forEach(input => {
            safeBind(input, 'blur', function () {
                const line = input.getAttribute('data-line-input');
                let qty = parseInt(input.value, 10);
                if (isNaN(qty) || qty < 0) qty = 0;
                changeLineQuantity(line, qty)
                  .then(() => refreshDrawer())
                  .catch(err => console.error('Quantity input failed', err));
            }, 'qtyInputBound');

            safeBind(input, 'keydown', function (e) {
                if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
            }, 'qtyInputKeyBound');
        });
    }

    function changeLineQuantity(line, qty) {
        line = parseInt(line, 10);
        qty = parseInt(qty, 10);
        if (isNaN(line) || line < 1) return Promise.reject('invalid-line');

        const params = new URLSearchParams();
        params.append('line', String(line));
        params.append('quantity', String(qty));

        return fetch('/cart/change.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
            body: params.toString()
        }).then(r => { if (!r.ok) throw new Error('Network'); return r.json(); });
    }

    // AJAX add-to-cart interception (skips payment buttons)
    function bindAddToCart() {
        if (document._cartAddBound) return;
        document.addEventListener('submit', function (e) {
            const form = e.target;
            if (!form || !form.matches || !form.matches('form[action="/cart/add"]')) return;

            let submitter = e.submitter || document.activeElement;
            const skipSelectors = [
                '.shopify-payment-button',
                '.shop-pay-button',
                '.pay-with-shop',
                '.paypal-button',
                '[data-shopify-payment-button]',
                '[data-gateway="paypal"]',
                '[data-gateway="shop_pay"]',
                '[data-skip-ajax]'
            ];
            if (submitter) {
                for (const sel of skipSelectors) {
                    try { if (submitter.matches && submitter.matches(sel)) return; } catch (err) {}
                }
            }

            // perform AJAX add and refresh drawer
            e.preventDefault();
            const data = new FormData(form);
            fetch('/cart/add.js', { method: 'POST', body: data })
                .then(r => { if (!r.ok) throw new Error('Add failed'); return r.json(); })
                // Auto-open drawer after refresh completes, then update header count
                .then(() => refreshDrawer().then(() => {
                    openDrawer();
                    // update header badge too
                    updateCartCount().catch(()=>{});
                }))
                .catch(err => console.error('Add to cart failed', err));
        });
        document._cartAddBound = true;
    }

    // Cross-sell add handler (delegated) — separate from bindAddToCart
    function bindCrossSellAdd() {
        safeBind(document, 'click', function (e) {
            const btn = e.target.closest ? e.target.closest('[data-drawer-add]') : null;
            if (!btn) return;
            e.preventDefault();

            const variantId = btn.getAttribute('data-variant-id');
            if (!variantId) return;

            btn.disabled = true;
            const formData = new FormData();
            formData.append('id', variantId);
            formData.append('quantity', '1');

            fetch('/cart/add.js', { method: 'POST', body: formData })
                .then(res => { if (!res.ok) throw new Error('Add failed'); return res.json(); })
                .then(() => {
                    if (typeof refreshDrawer === 'function') {
                        refreshDrawer().then(function () {
                            try { if (typeof openDrawer === 'function') openDrawer(); } catch(e){}
                            // update header badge too
                            updateCartCount().catch(()=>{});
                        }).catch(()=>{ /* ignore */ });
                    } else {
                        // fallback: fetch drawer fragment and replace
                        fetch('/?section_id=cart-drawer')
                            .then(r => r.text())
                            .then(html => {
                                const parser = new DOMParser();
                                const doc = parser.parseFromString(html, 'text/html');
                                const newDrawer = doc.querySelector('#CartDrawer');
                                if (newDrawer) {
                                    const old = document.querySelector('#CartDrawer');
                                    if (old) old.replaceWith(newDrawer); else document.body.appendChild(newDrawer);
                                }
                                try { if (typeof openDrawer === 'function') openDrawer(); } catch(e){}
                                // update header badge too
                                updateCartCount().catch(()=>{});
                            }).catch(()=>{ /* ignore */ });
                    }
                })
                .catch(err => {
                    console.error('Cross-sell add failed', err);
                })
                .finally(() => { btn.disabled = false; });
        }, 'crossSellBound');
    }

    // Refresh drawer: replace only the drawer, not overlay — preserve open state
    function refreshDrawer() {
        // capture whether the drawer was open (so we can restore it)
        var wasOpen = drawer && drawer.classList && drawer.classList.contains('cart-drawer--open');

        return fetch('/?section_id=cart-drawer')
            .then(r => {
                if (!r.ok) throw new Error('Network response not ok');
                return r.text();
            })
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const newDrawer = doc.querySelector('#CartDrawer');

                if (newDrawer) {
                    // replace existing drawer with the new fragment
                    try {
                        if (drawer && drawer.parentNode) drawer.replaceWith(newDrawer);
                        else document.body.appendChild(newDrawer);
                    } catch (e) {
                        // fallback append/replace
                        const existing = document.querySelector('#CartDrawer');
                        if (existing && existing.parentNode) existing.parentNode.replaceChild(newDrawer, existing);
                        else document.body.appendChild(newDrawer);
                    }
                    // update our ref to the current drawer
                    drawer = qs('#CartDrawer');
                }

                // Make sure overlay exists and event bindings persisted
                ensureOverlay();

                // Restore open/closed state that was present before refresh
                if (wasOpen && drawer) {
                    try { drawer.classList.add('cart-drawer--open'); } catch(e){}
                    showOverlay();
                    document.documentElement.style.overflow = 'hidden';
                } else {
                    // If it wasn't open before, keep it closed — do not force-hide overlay unless it exists open
                    try { if (drawer) drawer.classList.remove('cart-drawer--open'); } catch(e){}
                    hideOverlay();
                    document.documentElement.style.overflow = '';
                }

                // Rebind handlers for new drawer markup
                bindOpenTriggers();
                bindCloseButtons();
                bindQty();

                // Update header badge after drawer refresh (keeps icon in sync)
                try { updateCartCount().catch(()=>{}); } catch(e) {}

                // return resolved promise so callers can chain .then(...)
                return Promise.resolve();
            })
            .catch(err => {
                console.error('Could not refresh drawer', err);
                return Promise.reject(err);
            });
    }

    // small compatibility for older naming in case used earlier code
    function bindOverlayClickIfNeeded() {
        if (!overlay) return;
        if (!overlay._bound) {
            overlay.addEventListener('click', function () { closeDrawer(); });
            overlay._bound = true;
        }
    }

    // INIT
    (function init() {
        ensureOverlay();
        ensureDrawer();
        hideOverlay();
        bindOverlayClickIfNeeded(); // legacy: keep if present
        bindOpenTriggers();
        bindCloseButtons();
        bindQty();

        bindAddToCart();
        bindCrossSellAdd();
        // ensure closed on load
        try { if (drawer && drawer.classList.contains('cart-drawer--open')) drawer.classList.remove('cart-drawer--open'); } catch(e){}
          // --- Dynamic padding for upsell so cart items never get hidden ---
    // --- Dynamic padding for upsell so cart items never get hidden ---
    function setupUpsellSpacing() {
      const upsell = document.querySelector('.upsellCarousel');
      const cartItems = document.querySelector('.cart-drawer__cart-items');
      if (!upsell || !cartItems) return;

      function updateUpsellPadding() {
        const h = Math.ceil(upsell.offsetHeight);
        cartItems.style.setProperty('--upsell-height', `${h}px`);
      }

      window.addEventListener('load', updateUpsellPadding);
      window.addEventListener('resize', updateUpsellPadding);

      const observer = new MutationObserver(updateUpsellPadding);
      observer.observe(upsell, { childList: true, subtree: true, attributes: true });

      updateUpsellPadding();
    }

        setupUpsellSpacing();

        // Sync badge on init (in case page load and cart differ)
        try { updateCartCount().catch(()=>{}); } catch(e) {}

    })();

})();