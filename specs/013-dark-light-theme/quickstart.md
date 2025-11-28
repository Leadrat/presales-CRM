# Quickstart – Spec 013 Dark/Light Theme

## Prerequisites

- On branch `013-dark-light-theme`.
- Dependencies installed (`npm install` or `yarn`).

## Running the App

```bash
# from project root
npm run dev
# or
yarn dev
```

Visit the main dashboard route (admin or protected) in your browser.

## Verifying Theme Behavior

1. **Toggle works**
   - Locate the theme toggle in the app header (sun/moon icon).
   - Click it and confirm the entire UI changes between light and dark (header, sidebar, cards, forms, tables).

2. **Persistence per browser**
   - Switch to dark mode.
   - Refresh the page and navigate between routes.
   - Confirm the app stays in dark mode.

3. **Persistence across sessions**
   - In dark mode, sign out, then sign back in on the same browser.
   - Confirm the app still loads in dark mode.

4. **Cross-device behavior**
   - On Device A, sign in and set the theme to dark.
   - On Device B (different browser or machine), sign in as the same user.
   - Confirm the app starts in dark mode based on backend preference.

5. **System preference when no choice exists**
   - Use a fresh browser profile with no saved theme.
   - Set OS appearance to dark or light.
   - Open the app and confirm it matches OS `prefers-color-scheme` until you explicitly choose a theme.

## Useful Commands

- `npm run lint` – confirm new code follows lint rules.
- `npm run test` – run automated tests, including any added theme tests.
