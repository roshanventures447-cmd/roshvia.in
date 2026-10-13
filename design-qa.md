# Roshvia demo QA

final result: passed

This is an original Roshvia storefront inspired by Stoa Paris, not a pixel-for-pixel clone. The user's follow-up explicitly prioritized writing downloadable source quickly rather than further reference research or design-option selection. Buildless HTML/CSS/JS was selected to match their GitHub source requirement.

## Evidence

- Source visual: `qa/stoa-reference.png` captured from the supplied collection URL.
- Implementation desktop: `../roshvia-github-preview.png`, 1280×720 CSS-pixel browser capture.
- Mobile: `qa/mobile.png`, 390×844 CSS pixels.
- Both source and desktop screenshots were opened in the same image-comparison tool input. Same desktop viewport and top-of-page state. Source and implementation are different brand content by design.
- Focused header, hero copy and bedding areas are fully readable in those captures, so no additional crop was needed.

## Required surfaces

- Typography: serif display headings and restrained sans-serif navigation; intact wrapping and readable CTA. Local system fonts keep the download independent of a font CDN.
- Layout: full-width campaign photograph, cream header, warm dark announcement strip and three-column catalogue. Larger editorial hero and three products are intentional differences from the competitor collection page.
- Palette: cream/brown/gold follows the supplied Roshvia brand assets; product colours stay distinct.
- Assets: bundled gold logo lockup, text-free product imagery and actual licensed Lucide library icons. No missing images in the mobile browser DOM check.
- Copy: original Roshvia editorial copy. No imported competitor reviews, promotions or fulfillment promises. Demo labels accompany sample prices and checkout.

## Checks

- Browser: product details, King size selection changes price to ₹1,299, Add to bag, matching cart subtotal and checkout validation.
- Demo checkout: sample data produces explicit no-payment/no-order confirmation and clears fields. No network submission is used.
- Mobile: no horizontal overflow at 390px (`body.scrollWidth = innerWidth = 390`); navigation and shopping-bag controls remain visible.
- Console: no warnings/errors during the tested desktop checkout.
- JavaScript syntax and bundled-asset existence checks passed.
- Separate interaction smoke checks covered sorting/filter render, wishlist/cart restore, corrupt stored IDs, quantity limits and Buy Now preserving the cart.

## Fixes before final capture

- Added all required library icon files after correcting extraction of single-line icon definitions.
- Home navigation scrolls to the top instead of hiding the announcement bar.
- Mobile menu closes when its navigation links are selected.
- Checkout thumbnails and text use bounded sizes.

No actionable P0/P1/P2 findings remain in the tested states. Real inventory, server-side payments, orders, shipping and merchant policies are explicitly outside this demo and require a subsequent implementation.
