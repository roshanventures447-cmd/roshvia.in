(function () {
  'use strict';

  const catalog = window.ROSHVIA_CATALOG || { products: [], sizes: [], demo: true };
  const products = Array.isArray(catalog.products) ? catalog.products : [];
  const sizes = Array.isArray(catalog.sizes) ? catalog.sizes : [];
  const byId = new Map(products.map((product) => [product.id, product]));
  const storageKey = 'roshvia-demo-v1';
  const state = {
    cart: [], wishlist: new Set(), colour: 'all', size: 'all', sort: 'featured',
    search: '', wishlistOnly: false, currentProduct: null, productSize: sizes.includes('Double') ? 'Double' : sizes[0],
    productQuantity: 1, checkoutLines: [], checkoutSource: 'cart', toastTimer: null
  };
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
  const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  const icon = (name) => `<img class="icon" src="assets/icons/${name}.svg" alt="" aria-hidden="true">`;
  const clampQuantity = (value) => Math.min(10, Math.max(1, Math.floor(Number(value) || 1)));
  const validSize = (product, size) => sizes.includes(size) && Number.isFinite(product?.prices?.[size]) && product.prices[size] > 0;
  const defaultSize = (product) => validSize(product, state.size) ? state.size : validSize(product, 'Double') ? 'Double' : sizes.find((size) => validSize(product, size));
  const lineKey = (line) => `${line.id}:${line.size}`;
  const linesTotal = (lines) => lines.reduce((sum, line) => sum + byId.get(line.id).prices[line.size] * line.quantity, 0);

  function restore() {
    try {
      const raw = JSON.parse(localStorage.getItem(storageKey) || '{}');
      const merged = new Map();
      (Array.isArray(raw.cart) ? raw.cart : []).slice(0, 100).forEach((line) => {
        const product = byId.get(line?.id);
        if (!product || !validSize(product, line.size)) return;
        const clean = { id: product.id, size: line.size, quantity: clampQuantity(line.quantity) };
        const key = lineKey(clean);
        if (merged.has(key)) clean.quantity = clampQuantity(clean.quantity + merged.get(key).quantity);
        merged.set(key, clean);
      });
      state.cart = [...merged.values()];
      state.wishlist = new Set((Array.isArray(raw.wishlist) ? raw.wishlist : []).filter((id) => byId.has(id)));
    } catch (_) {
      state.cart = [];
      state.wishlist = new Set();
    }
  }

  function persist() {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ cart: state.cart, wishlist: [...state.wishlist] }));
    } catch (_) { /* The demo still works when browser storage is unavailable. */ }
  }

  function toast(message) {
    const output = $('#toast');
    if (!output) return;
    window.clearTimeout(state.toastTimer);
    output.textContent = message;
    output.classList.add('is-visible');
    state.toastTimer = window.setTimeout(() => output.classList.remove('is-visible'), 3200);
  }

  function openDialog(id) {
    const dialog = document.getElementById(id);
    if (!dialog) return;
    $$('dialog[open]').forEach((other) => { if (other !== dialog) closeDialog(other); });
    if (!dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    }
  }

  function closeDialog(dialog) {
    if (!dialog) return;
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  }

  function updateBadges() {
    const count = state.cart.reduce((sum, line) => sum + line.quantity, 0);
    if ($('#cart-badge')) $('#cart-badge').textContent = count;
    if ($('#wishlist-badge')) $('#wishlist-badge').textContent = state.wishlist.size;
    if ($('#cart-count-label')) $('#cart-count-label').textContent = `${count} ${count === 1 ? 'item' : 'items'}`;
    $$('[data-action="toggle-wishlist"]').forEach((button) => {
      const saved = state.wishlist.has(button.dataset.id);
      const product = byId.get(button.dataset.id);
      button.classList.toggle('is-saved', saved);
      button.setAttribute('aria-pressed', String(saved));
      button.setAttribute('aria-label', `${saved ? 'Remove' : 'Save'} ${product?.colour || 'product'} ${saved ? 'from' : 'to'} wishlist`);
    });
  }

  function swatches(activeId) {
    return products.map((product) => `<a class="swatch${product.id === activeId ? ' is-active' : ''}" href="#product/${escape(product.id)}" style="--swatch:${escape(product.swatch)}" aria-label="View ${escape(product.colour)}" title="${escape(product.colour)}"${product.id === activeId ? ' aria-current="true"' : ''}></a>`).join('');
  }

  function productCard(product) {
    const size = defaultSize(product);
    return `<article class="product-card">
      <div class="card-image">
        <a href="#product/${escape(product.id)}" aria-label="View ${escape(product.name)}"><img class="card-photo" src="${escape(product.image)}" alt="${escape(product.colour)} satin bedding in a styled bedroom" loading="lazy" width="900" height="1100"></a>
        <span class="card-tag">${escape(product.tag)}</span>
        <button class="card-wish" data-action="toggle-wishlist" data-id="${escape(product.id)}" aria-label="Save ${escape(product.colour)} to wishlist" aria-pressed="${state.wishlist.has(product.id)}">${icon('heart')}</button>
        <button class="card-quick" data-action="add-cart" data-id="${escape(product.id)}" data-size="${escape(size)}">${icon('plus')} Quick add</button>
      </div>
      <div class="card-body">
        <div class="card-kicker">${escape(product.colour)} · Satin collection</div>
        <h3 class="card-heading"><a href="#product/${escape(product.id)}">${escape(product.name)}</a></h3>
        <div class="card-price">${money(product.prices[size])}<span> / ${escape(size)}</span></div>
        <div class="card-swatches">${swatches(product.id)}</div>
        <div class="card-actions"><a class="btn btn-outline btn-small" href="#product/${escape(product.id)}">Explore this colour ${icon('arrow-right')}</a></div>
      </div>
    </article>`;
  }

  function filteredProducts() {
    const needle = state.search.toLocaleLowerCase().trim();
    let list = products.filter((product) =>
      (state.colour === 'all' || product.id === state.colour) &&
      (state.size === 'all' || validSize(product, state.size)) &&
      (!state.wishlistOnly || state.wishlist.has(product.id)) &&
      (!needle || `${product.name} ${product.colour} ${product.description}`.toLocaleLowerCase().includes(needle))
    );
    if (state.sort === 'price-low') list = list.sort((a, b) => a.prices[defaultSize(a)] - b.prices[defaultSize(b)]);
    if (state.sort === 'price-high') list = list.sort((a, b) => b.prices[defaultSize(b)] - a.prices[defaultSize(a)]);
    if (state.sort === 'name') list = list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }

  function renderCollection() {
    const list = filteredProducts();
    const grid = $('#product-grid');
    if (grid) grid.innerHTML = list.length ? list.map(productCard).join('') : `<div class="empty-state"><h3>${state.wishlistOnly ? 'Your wishlist is waiting' : 'No matching colours'}</h3><p>${state.wishlistOnly ? 'Tap the heart on a product to save it here.' : 'Try another search or clear your filters.'}</p><button class="btn btn-dark" data-action="clear-filters">View all bedding</button></div>`;
    if ($('#result-count')) $('#result-count').textContent = `${list.length} ${list.length === 1 ? 'colour' : 'colours'}`;
    if ($('#colour-filter')) $('#colour-filter').value = state.colour;
    if ($('#size-filter')) $('#size-filter').value = state.size;
    if ($('#sort-select')) $('#sort-select').value = state.sort;
    if ($('#wish-mode-label')) {
      $('#wish-mode-label').hidden = !state.wishlistOnly;
      $('#wish-mode-label').textContent = 'Your saved colours';
    }
    const active = [];
    if (state.search) active.push(`Search: ${state.search}`);
    if (state.colour !== 'all') active.push(byId.get(state.colour)?.colour || state.colour);
    if (state.size !== 'all') active.push(state.size);
    if (state.wishlistOnly) active.push('Wishlist');
    if ($('#active-filters')) {
      $('#active-filters').textContent = active.join(' · ');
      $('#active-filters').hidden = !active.length;
    }
    if ($('#clear-filters')) $('#clear-filters').hidden = !active.length;
    $$('[data-colour]').forEach((button) => {
      const selected = button.dataset.colour === state.colour;
      button.classList.toggle('is-active', selected);
      if (button.tagName === 'BUTTON') button.setAttribute('aria-pressed', String(selected));
    });
    updateBadges();
  }

  function addToCart(id, size, quantity = 1, showFeedback = true) {
    const product = byId.get(id);
    if (!product) return;
    const selected = validSize(product, size) ? size : defaultSize(product);
    if (!selected) return;
    const existing = state.cart.find((line) => line.id === id && line.size === selected);
    if (existing) existing.quantity = clampQuantity(existing.quantity + quantity);
    else state.cart.push({ id, size: selected, quantity: clampQuantity(quantity) });
    persist();
    renderCart();
    updateBadges();
    if (showFeedback) toast(`${product.colour} · ${selected} added to your bag`);
  }

  function renderCart() {
    const target = $('#cart-items');
    if (!target) return;
    target.innerHTML = state.cart.length ? state.cart.map((line) => {
      const product = byId.get(line.id);
      return `<article class="cart-item">
        <a class="cart-photo" href="#product/${escape(line.id)}" data-action="cart-product"><img src="${escape(product.image)}" alt="${escape(product.colour)} bedsheet set" width="100" height="120"></a>
        <div class="cart-item-content"><a class="cart-item-title" href="#product/${escape(line.id)}" data-action="cart-product">${escape(product.name)}</a><p class="cart-item-meta">${escape(product.colour)} / ${escape(line.size)}</p>
          <div class="quantity"><button data-action="cart-minus" data-id="${escape(line.id)}" data-size="${escape(line.size)}" aria-label="Decrease ${escape(product.colour)} quantity"${line.quantity <= 1 ? ' disabled' : ''}>${icon('minus')}</button><span aria-label="Quantity">${line.quantity}</span><button data-action="cart-plus" data-id="${escape(line.id)}" data-size="${escape(line.size)}" aria-label="Increase ${escape(product.colour)} quantity"${line.quantity >= 10 ? ' disabled' : ''}>${icon('plus')}</button></div>
        </div><div class="cart-line-price">${money(product.prices[line.size] * line.quantity)}<button class="remove-line" data-action="remove-cart" data-id="${escape(line.id)}" data-size="${escape(line.size)}" aria-label="Remove ${escape(product.colour)} ${escape(line.size)}">${icon('trash-2')}</button></div>
      </article>`;
    }).join('') : `<div class="empty-state">${icon('shopping-bag')}<h3>A little comfort awaits</h3><p>Your bag is empty. Explore the colours and find your favourite.</p><button class="btn btn-dark" data-action="close-dialog">Continue exploring</button></div>`;
    const total = money(linesTotal(state.cart));
    if ($('#cart-total')) $('#cart-total').textContent = total;
    if ($('#cart-subtotal')) $('#cart-subtotal').textContent = total;
    $$('[data-action="checkout"]').forEach((button) => { button.disabled = !state.cart.length; });
    updateBadges();
  }

  function productView(id) {
    const product = byId.get(id);
    if (!product) {
      toast('That colour could not be found.');
      location.hash = '#collection';
      return;
    }
    state.currentProduct = id;
    state.productSize = defaultSize(product);
    state.productQuantity = 1;
    const home = $('#home-view');
    if (home) home.hidden = true;
    const view = $('#product-view');
    if (view) view.hidden = false;
    const content = $('#product-content');
    if (!content) return;
    const gallery = Array.isArray(product.gallery) && product.gallery.length ? product.gallery : [product.image];
    content.innerHTML = `<a class="product-back" href="#collection">${icon('chevron-left')} Back to the collection</a>
      <div class="product-layout">
        <div class="product-gallery"><img class="product-main-image" id="product-main-image" src="${escape(gallery[0])}" alt="${escape(product.name)} in a styled bedroom" width="1200" height="1500">
          ${gallery.length > 1 ? `<div class="product-thumbs">${gallery.map((image, index) => `<button class="${index === 0 ? 'is-active' : ''}" data-action="select-image" data-image-index="${index}" aria-label="View product photo ${index + 1}"><img src="${escape(image)}" alt="" width="90" height="100"></button>`).join('')}</div>` : ''}
        </div>
        <div class="product-info"><p class="eyebrow">Roshvia · The satin collection</p><h1>${escape(product.name)}</h1><p class="product-price" id="product-price">${money(product.prices[state.productSize])}</p><p class="product-description">${escape(product.description)}</p>
          <div class="variant-label">Colour: <strong>${escape(product.colour)}</strong></div><div class="card-swatches">${swatches(product.id)}</div>
          <div class="variant-label">Size: <strong id="selected-size">${escape(state.productSize)}</strong><button class="size-help" data-action="size-guide">Size information</button></div><div class="size-options" role="group" aria-label="Choose a bedsheet size">${sizes.filter((size) => validSize(product, size)).map((size) => `<button class="size-option${size === state.productSize ? ' is-active' : ''}" data-action="select-size" data-size="${escape(size)}" aria-pressed="${size === state.productSize}">${escape(size)}</button>`).join('')}</div>
          <div class="product-purchase"><div class="quantity"><button data-action="product-minus" aria-label="Decrease quantity" disabled>${icon('minus')}</button><span id="product-quantity" aria-live="polite">1</span><button data-action="product-plus" aria-label="Increase quantity">${icon('plus')}</button></div><button class="btn btn-dark" data-action="product-add">${icon('shopping-bag')} Add to bag</button><button class="btn btn-outline" data-action="toggle-wishlist" data-id="${escape(id)}" aria-pressed="${state.wishlist.has(id)}" aria-label="Save ${escape(product.colour)} to wishlist">${icon('heart')}</button></div>
          <button class="btn btn-dark product-buy" data-action="buy-now">Buy now</button><p class="product-note">Interactive demo · Illustrative prices and sizes. Checkout previews the experience; no payment or order is created.</p>
          <details class="detail-accordion" open><summary>The look & feel</summary><p>${escape(product.description)}</p></details>
          <details class="detail-accordion"><summary>Product & size information</summary><p>This demo shows sample Single, Double and King options. Exact dimensions, fabric composition, pack contents and care instructions will be added from your verified product details before launch.</p></details>
          <details class="detail-accordion"><summary>Delivery & returns</summary><p>Delivery rates, service areas and your return policy will appear here when the store launches. This preview does not accept orders.</p></details>
        </div>
      </div>`;
    document.title = `${product.colour} Satin Bedsheet Set · Roshvia`;
    updateBadges();
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function renderSelectedSize() {
    const product = byId.get(state.currentProduct);
    if (!product) return;
    if ($('#selected-size')) $('#selected-size').textContent = state.productSize;
    if ($('#product-price')) $('#product-price').textContent = money(product.prices[state.productSize]);
    $$('[data-action="select-size"]').forEach((button) => {
      const selected = button.dataset.size === state.productSize;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  }

  function renderProductQuantity() {
    if ($('#product-quantity')) $('#product-quantity').textContent = state.productQuantity;
    if ($('[data-action="product-minus"]')) $('[data-action="product-minus"]').disabled = state.productQuantity <= 1;
    if ($('[data-action="product-plus"]')) $('[data-action="product-plus"]').disabled = state.productQuantity >= 10;
  }

  function navigate() {
    let hash = location.hash || '#home';
    try { hash = decodeURIComponent(hash); } catch (_) { hash = '#home'; }
    const match = hash.match(/^#product\/([a-z0-9-]+)$/i);
    if (match) { productView(match[1]); return; }
    state.currentProduct = null;
    if ($('#home-view')) $('#home-view').hidden = false;
    if ($('#product-view')) $('#product-view').hidden = true;
    document.title = 'Roshvia · Premium Bed & Home Linen';
    if (hash === '#wishlist') {
      state.wishlistOnly = true;
      state.search = '';
      state.colour = 'all';
      state.size = 'all';
      renderCollection();
      $('#collection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (state.wishlistOnly) { state.wishlistOnly = false; renderCollection(); }
    if (hash === '#home') { window.scrollTo({ top: 0, behavior: 'auto' }); return; }
    const target = document.getElementById(hash.replace(/^#/, ''));
    if (target) requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    else if (hash === '#home') window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goToCollection() {
    closeDialog($('#search-dialog'));
    closeDialog($('#menu-dialog'));
    if (location.hash !== '#collection') location.hash = '#collection';
    else {
      if ($('#home-view')) $('#home-view').hidden = false;
      if ($('#product-view')) $('#product-view').hidden = true;
      $('#collection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function clearFilters() {
    state.colour = 'all'; state.size = 'all'; state.sort = 'featured'; state.search = ''; state.wishlistOnly = false;
    if ($('#search-input')) $('#search-input').value = '';
    renderCollection();
    if (location.hash === '#wishlist') location.hash = '#collection';
  }

  function startCheckout(lines, source) {
    if (!lines.length) return;
    state.checkoutLines = lines.map((line) => ({ ...line }));
    state.checkoutSource = source;
    const summary = $('#checkout-summary');
    if (summary) summary.innerHTML = `<div class="checkout-lines">${state.checkoutLines.map((line) => {
      const product = byId.get(line.id);
      return `<div class="checkout-line"><img src="${escape(product.image)}" alt="${escape(product.colour)} bedding" width="60" height="70"><div><strong>${escape(product.colour)}</strong><span>${escape(line.size)} · Qty ${line.quantity}</span></div><strong>${money(product.prices[line.size] * line.quantity)}</strong></div>`;
    }).join('')}</div><div class="checkout-total"><span>Demo subtotal</span><strong>${money(linesTotal(state.checkoutLines))}</strong></div><p class="product-note">Sample prices. Delivery charges and taxes are not calculated in this preview.</p>`;
    const form = $('#checkout-form');
    if (form) {
      form.reset();
      const submit = $('[type="submit"]', form);
      if (submit) submit.disabled = false;
    }
    const result = $('#checkout-result');
    if (result) { result.textContent = ''; result.hidden = true; }
    openDialog('checkout-dialog');
  }

  function showInfo(title, html) {
    if ($('#info-title')) $('#info-title').textContent = title;
    if ($('#info-content')) $('#info-content').innerHTML = html;
    openDialog('info-dialog');
  }

  function searchPreview() {
    const target = $('#search-results');
    const input = $('#search-input');
    if (!target || !input) return;
    const needle = input.value.trim().toLocaleLowerCase();
    const matches = products.filter((product) => !needle || `${product.name} ${product.description}`.toLocaleLowerCase().includes(needle));
    target.innerHTML = matches.length ? matches.map((product) => `<a class="search-result" href="#product/${escape(product.id)}" data-action="search-product"><img src="${escape(product.image)}" alt="" width="60" height="70"><span><strong>${escape(product.colour)}</strong><small>${escape(product.name)}</small></span>${icon('arrow-right')}</a>`).join('') : '<p class="search-empty">No colours found. Try champagne, ivory or mauve.</p>';
  }

  document.addEventListener('click', (event) => {
    const menuLink = event.target.closest('#menu-dialog a[href^="#"]');
    if (menuLink) closeDialog($('#menu-dialog'));
    const control = event.target.closest('[data-action], [data-colour], [data-size]');
    if (!control || control.disabled) return;
    const action = control.dataset.action;
    if (!action && control.dataset.colour) {
      state.colour = byId.has(control.dataset.colour) ? control.dataset.colour : 'all';
      state.wishlistOnly = false; state.search = '';
      renderCollection(); goToCollection(); return;
    }
    if (!action && control.dataset.size) {
      state.size = sizes.includes(control.dataset.size) ? control.dataset.size : 'all';
      state.wishlistOnly = false;
      renderCollection(); goToCollection(); return;
    }
    switch (action) {
      case 'open-cart': renderCart(); openDialog('cart-dialog'); break;
      case 'close-dialog': closeDialog(control.closest('dialog')); break;
      case 'open-menu': openDialog('menu-dialog'); break;
      case 'open-search': openDialog('search-dialog'); searchPreview(); setTimeout(() => $('#search-input')?.focus(), 0); break;
      case 'open-wishlist':
        state.wishlistOnly = true; state.search = ''; state.colour = 'all'; state.size = 'all'; renderCollection();
        if (location.hash === '#wishlist') $('#collection')?.scrollIntoView({ behavior: 'smooth' });
        else location.hash = '#wishlist';
        break;
      case 'clear-filters': clearFilters(); break;
      case 'toggle-wishlist': {
        const id = control.dataset.id;
        if (!byId.has(id)) break;
        const saved = state.wishlist.has(id);
        if (saved) state.wishlist.delete(id); else state.wishlist.add(id);
        persist(); updateBadges();
        if (state.wishlistOnly) renderCollection();
        toast(saved ? 'Removed from your wishlist' : 'Saved to your wishlist');
        break;
      }
      case 'add-cart': addToCart(control.dataset.id, control.dataset.size); break;
      case 'product-add': addToCart(state.currentProduct, state.productSize, state.productQuantity); renderCart(); openDialog('cart-dialog'); break;
      case 'select-size': {
        const product = byId.get(state.currentProduct);
        if (validSize(product, control.dataset.size)) { state.productSize = control.dataset.size; renderSelectedSize(); }
        break;
      }
      case 'product-minus': state.productQuantity = clampQuantity(state.productQuantity - 1); renderProductQuantity(); break;
      case 'product-plus': state.productQuantity = clampQuantity(state.productQuantity + 1); renderProductQuantity(); break;
      case 'cart-minus':
      case 'cart-plus': {
        const line = state.cart.find((entry) => entry.id === control.dataset.id && entry.size === control.dataset.size);
        if (line) { line.quantity = clampQuantity(line.quantity + (action === 'cart-plus' ? 1 : -1)); persist(); renderCart(); }
        break;
      }
      case 'remove-cart': state.cart = state.cart.filter((line) => !(line.id === control.dataset.id && line.size === control.dataset.size)); persist(); renderCart(); toast('Removed from your bag'); break;
      case 'cart-product': closeDialog($('#cart-dialog')); break;
      case 'search-product': closeDialog($('#search-dialog')); break;
      case 'checkout': startCheckout(state.cart, 'cart'); break;
      case 'buy-now': startCheckout([{ id: state.currentProduct, size: state.productSize, quantity: state.productQuantity }], 'buy-now'); break;
      case 'select-image': {
        const product = byId.get(state.currentProduct);
        const index = Number(control.dataset.imageIndex);
        const selected = product?.gallery?.[index];
        if (selected && $('#product-main-image')) {
          $('#product-main-image').src = selected;
          $$('[data-action="select-image"]').forEach((button) => button.classList.toggle('is-active', button === control));
        }
        break;
      }
      case 'size-guide': showInfo('Find your size', '<p>Single, Double and King are sample options for this interactive demo.</p><p>Measure your mattress width, length and depth. Verified product dimensions and pillow cover sizes will be added here before the store opens.</p>'); break;
      case 'shipping-info': showInfo('Delivery information', '<p>This is a store preview. Shipping charges, delivery timelines and service areas will be confirmed before orders are accepted.</p>'); break;
      case 'returns-info': showInfo('Returns & care', '<p>The store’s returns policy and verified washing instructions will be added before launch. No purchases are processed by this demo.</p>'); break;
      case 'privacy-info': showInfo('Your privacy', '<p>This demo saves only your product IDs, selected sizes, quantities and wishlist in this browser.</p><p>Checkout information is not sent to a server or saved in browser storage. Closing the checkout clears its form.</p>'); break;
      case 'demo-info': showInfo('About this preview', '<p>Explore the collection, save your favourite colours, add bedding to your bag and try the checkout flow.</p><p>Prices and sizes are illustrative. This version does not process payments, place orders or send customer details anywhere.</p>'); break;
      default: break;
    }
  });

  document.addEventListener('change', (event) => {
    if (event.target.id === 'colour-filter') state.colour = byId.has(event.target.value) ? event.target.value : 'all';
    else if (event.target.id === 'size-filter') state.size = sizes.includes(event.target.value) ? event.target.value : 'all';
    else if (event.target.id === 'sort-select') state.sort = ['featured', 'price-low', 'price-high', 'name'].includes(event.target.value) ? event.target.value : 'featured';
    else return;
    renderCollection();
  });

  $('#search-input')?.addEventListener('input', searchPreview);
  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (form.matches('[data-action="search-form"]')) {
      event.preventDefault();
      state.search = ($('#search-input')?.value || '').trim().slice(0, 120);
      state.wishlistOnly = false; state.colour = 'all'; state.size = 'all';
      renderCollection(); goToCollection();
    }
    if (form.id === 'checkout-form') {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const result = $('#checkout-result');
      if (result) {
        result.hidden = false;
        result.innerHTML = `<strong>${icon('check')} Checkout preview complete</strong><p>No payment was charged and no order was placed. Your entered details have been cleared.</p>`;
        result.setAttribute('tabindex', '-1');
        result.focus();
      }
      form.reset();
      toast('Demo complete — no payment or order created');
    }
    if (form.matches('[data-action="newsletter-form"]')) {
      event.preventDefault();
      if (!form.reportValidity()) return;
      form.reset();
      toast('Newsletter preview — no email was sent or saved');
    }
  });

  $$('dialog').forEach((dialog) => {
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeDialog(dialog);
    });
    dialog.addEventListener('close', () => {
      if (dialog.id === 'checkout-dialog') {
        $('#checkout-form')?.reset();
        state.checkoutLines = [];
        if ($('#checkout-result')) { $('#checkout-result').textContent = ''; $('#checkout-result').hidden = true; }
      }
    });
  });

  $('#menu-dialog')?.addEventListener('click', (event) => {
    if (event.target.closest('a[href^="#"]')) closeDialog($('#menu-dialog'));
  });
  window.addEventListener('hashchange', navigate);
  restore();
  renderCollection();
  renderCart();
  navigate();
})();
