# Steer

A simple personal decision journal for iPhone: pause, remember your plan, choose, and explicitly save the moment.

## Use on iPhone

1. Open the published GitHub Pages URL in Safari.
2. Tap **Share → Add to Home Screen**. Turn on **Open as Web App** if offered, then tap **Add**.
3. Open the **Steer** icon. Use this installed app consistently for your journal.
4. Choose a situation, read your reminder, select your choice, then tap **Save to my journal**.
5. Wait for **Saved on this device**. Weekly and monthly trends include the saved choice.

Pause asks **Where do you want to steer?** and offers seven directions: Be Present, Eat Well, Rest Well, Be Kind to Myself, Start My Day, Use My Time Well, and Move Well. Each starts with its approved encouragement, plan reminder, and small next step. **Choose my plan** and **Continue as I was** both lead to the explicit local save step.

Settings lets you add directions with a picture, rename or hide buttons, edit each direction’s encouragement and next step, and keep extra encouragement phrases. **Another encouragement** cycles through the direction’s phrase and your extra phrases. Tap **Save my settings** to keep changes locally.

Older settings automatically show the new directions, retaining custom choices, recipe, general reminders, and hidden-button preferences. Old food records are grouped under Eat Well in reports. Original entry IDs, labels, times, choices, and notes remain stored unchanged; editing a historic entry uses that original record. New settings carry a migration marker so later personal edits are preserved. Older backups remain importable.

Settings includes installation help, offline status, editable reminders, and backup/restore. Offline use becomes available after the complete app shell downloads successfully. A new app version waits for all open Steer windows to close before taking over.

## Where your data lives

All entries, notes, edited reminders, and settings are stored in IndexedDB on the device. There is no account, backend, analytics, or cloud journal. GitHub Pages receives normal requests for static app files, but the app never uploads journal contents. Public source includes only the app, default wording, and illustrations.

Each browser/app installation and website origin may have a separate journal. Install the Home Screen app before logging. Data from the previous Sites-hosted app does not automatically move here; the old app and its saved records are not modified by this project.

Local browser storage is not a guaranteed permanent backup. Clearing site data or deleting the app can erase it. The app asks the browser for persistent storage after a save, but this is not guaranteed. Use **Settings → On this device → Back up or restore my journal → Export backup to Files**. Choose **On My iPhone** to keep your backup local, rather than a cloud Files location.

Backup export opens the system share sheet when supported, or starts a file download. The app cannot confirm whether the file was saved in Files. Backups contain private journal contents; do not commit them to this repository. Restore validates a versioned JSON format, merges missing entry IDs, and preserves existing entries. Replacing reminders requires selecting its separate checkbox.

## Development

Requires Node.js 22.13 or newer.

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

Use external Safari or Chrome for visual review. Do not use Codex's built-in browser for routine inspection on this system. Inspect the actual iPhone workflow, especially the save confirmation, Home Screen installation, offline reopening, and backup share sheet.

The tests cover date grouping, validation, local persistence, concurrent writes, retries, failed saves, backup imports, and absence of network use by the journal layer. `npm run build` also checks the packaged service worker using simulated cache/install/navigation events at a repository subpath.

## GitHub Pages

The workflow `.github/workflows/pages.yml` tests and builds the app on pushes to the default branch, `codex/iphone-local`, then deploys `dist/` through GitHub Pages. Repository Settings → Pages must use **GitHub Actions** as the source. Vite uses relative asset paths, so repository-based URLs work. The build generates a revisioned service worker and caches only public app assets, never journal data.

Installation reference: [Apple's Home Screen web app guide](https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios).
Storage reference: [WebKit storage policy](https://webkit.org/blog/14403/updates-to-storage-policy/).

## Moment flow
Choose a goal, read a brief encouragement, and tap an alternative action. Review and explicitly save the choice to the local journal. The confirmation shows today’s and this week’s logged choices and choices toward the plan; these are decisions, not verified completed actions.

Settings → My directions → Things I could do instead lets you edit, add, or remove alternatives for each goal (up to 30 per goal). The seven starter goals each include five options. Save my settings commits changes locally. Existing custom lists, including intentionally empty lists, are preserved. Selected action text is saved with each entry and included in local backups, even if the settings list changes later.

Encouragements cycle automatically with a brief anticipation, an offstage yank, and a settling entrance. Each stays readable for at least 6.5 seconds. There are no carousel controls on the action screen. Reduce Motion disables automatic cycling and animation.

App updates activate after the complete new shell has downloaded, even with other Steer windows open. Existing pages are never forcibly reloaded, preserving unsaved form state. Refresh after saving to load the new version. A failed download leaves the previous offline app available. Updates do not modify IndexedDB journal data.

Goals use colorful native emoji icons on pastel tiles. The character appears only on the splash screen. The compact action screen places five starter options directly below a smaller encouragement; longer custom lists or larger accessibility text can still scroll. Notes and reminders are available below the choices.
