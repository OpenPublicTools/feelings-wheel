# Feeling Wheel

An interactive version of Gloria Willcox's Feeling Wheel. Scroll or drag to rotate, select a feeling to read its definition, and switch between light and dark themes.

The wheel starts unselected. The first arrow or WASD key selects Peaceful. Subsequent presses navigate the selection: Up/W and Down/S choose the previous or next feeling on the same ring and rotate it into view. Left/A moves inward to its parent; Right/D moves outward to a related feeling, remembering the branch you last used. The definition follows the selection, and highlighting includes only that feeling and its inner ancestors. Tab moves between the page controls, skipping the feelings. Escape clears the selection; the next direction key starts again at Peaceful.

Plain HTML, CSS, JavaScript, and JSON. No dependencies, package installation, build step, or backend. The repository root is the complete site.

## Preview locally

Serve this directory with any static HTTP server. For example, with Python 3 installed:

```sh
python3 -m http.server 5173 --bind 127.0.0.1
```

Open [localhost:5173](http://127.0.0.1:5173/). Refresh the browser after editing files; stop the server with Ctrl+C. Use HTTP rather than opening `index.html` directly, because the app loads JavaScript modules and JSON.

## Host on GitHub Pages

1. Push these files, including `.nojekyll`, to a GitHub repository.
2. Open **Settings → Pages** and select **Deploy from a branch**.
3. Select the branch containing the site and **/(root)**, then **Save**.

GitHub shows the published URL in Pages settings. Future pushes to that branch update the site. The empty `.nojekyll` file disables Jekyll processing; no custom workflow is needed. Relative links work at both a domain root and a project path such as `/feeling-wheel/`.

See GitHub's [publishing-source instructions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) and [static-site setup](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site).

## Files

- `index.html` and `about.html` — wheel page and background/citation.
- `styles.css` and `theme.js` — responsive layout, colors, and saved theme preference.
- `app.js` — loads the data and connects selection to the definition panel.
- `model.js` and `wheel.js` — feeling hierarchy, SVG rendering, and interaction.
- `data/willcox.json` — wheel labels, colors, and contemporary descriptions.

The original paper is cited on the [About page](about.html).
