# Roshvia — GitHub source demo

A self-contained, responsive bedding-store demo using HTML, CSS and JavaScript. No npm installation, framework, build step, API key or server is required to view it. It works from `index.html`, a local server, and a static host under a repository subpath.

## Open it immediately

Unzip the folder and double-click `index.html`. Keep the `assets` folder next to it. The browser must allow JavaScript. If your browser restricts local files, serve the folder with `python3 -m http.server 5174` and open `http://127.0.0.1:5174`.

## Upload to GitHub

1. Create a new repository on your GitHub account.
2. Choose **Add file → Upload files**.
3. Open the extracted folder. Upload its CONTENTS: `index.html`, `styles.css`, `app.js`, `catalog.js`, `.nojekyll`, and the entire `assets` folder. The homepage `index.html` should be directly in the repository root.
4. Commit the upload. The source code is now on GitHub.

For an educational design preview only, GitHub Pages can serve static files: **Settings → Pages → Deploy from a branch → main → /(root) → Save**. GitHub may take a few minutes to publish. Use the URL GitHub shows; no URL is assumed here.

GitHub Pages does not permit using its free hosting to run an online business or facilitate commercial transactions. Keep this as a clearly labelled demo with no real orders/customer data collection. For the selling website, retain code on GitHub and deploy to a suitable host with a backend/database. Official policy: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits

## What works

- Responsive home, collection and product views.
- Three colour editions: Champagne, Ivory and Mauve.
- Colour and size filters; INR sample price sorting; product search.
- Product size and quantity selection, Add to bag and Buy now.
- Cart quantities/removal and wishlist, remembered on this device.
- Native dialog drawers, keyboard Escape and focus handling.
- Complete demo address-validation and order-confirmation flow.
- Buy now previews only the selected item and preserves your bag.
- Customer form details are never saved to browser storage or sent to a server.

## Edit your content

- `catalog.js`: product names, sample prices, colour names, image paths and size options.
- `index.html`: brand copy, navigation, story and FAQ.
- `styles.css`: layout, colours, fonts, spacing and responsive rules.
- `app.js`: shopping interactions and demo checkout.
- `assets/`: all bundled images and licensed UI icons. Relative paths support GitHub project pages.

The logo lockup is extracted from the Roshvia banner already created in this conversation. Replace `assets/roshvia-logo.jpg` with your original exported logo when available. Catalogue photos and the hero are generated from the supplied Roshvia product-image references; they are styling previews rather than independently verified inventory photography. Image generation prompts are bundled in `assets/image-prompts.txt`.

## Real selling later

This download intentionally has no real payment gateway, order database, account login, inventory or admin panel. Adding Razorpay keys to frontend JavaScript will NOT turn it into a secure live store. Never put a secret key in GitHub or browser code.

Before launch, confirm real product measurements, contents, availability and prices; provide actual contact, delivery, returns, privacy and business details; build server-side order creation, payment verification/webhooks and durable order storage; connect your activated merchant account; test successful, failed and cancelled payments. Demo success is never evidence of payment.

Razorpay server integration documentation: https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/

## Assets and license

Roshvia branding and supplied/generated product imagery are included for this user's project. UI icons are exported from the locally installed Lucide library; the required ISC/MIT notices are included in `assets/icons/LICENSE.txt`. No competitor photos, logo, product descriptions, customer reviews, sales discounts or stock claims are copied.
