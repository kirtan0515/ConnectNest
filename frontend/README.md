# ConnectNest frontend

React 18 single-page app built with [Vite](https://vite.dev).

```bash
npm install
npm run dev      # local dev server on http://localhost:3000
npm run build    # production build into build/ (deployed by ConnectNest-Hosting)
npm run preview  # serve the production build locally
```

Configuration comes from `REACT_APP_*` variables in `frontend/.env` (see
`src/config.js`). They are inlined at build time and contain only public
identifiers (Cognito pool and client IDs, API and WebSocket URLs).
