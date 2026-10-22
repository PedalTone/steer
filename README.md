# Steer

A simple personal decision journal for iPhone: pause, remember your plan, choose, and explicitly save the moment.

## Use on iPhone

1. Open the published GitHub Pages URL in Safari.
2. Tap **Share → Add to Home Screen**. Turn on **Open as Web App** if offered, then tap **Add**.
3. Open the **Steer** icon. Use this installed app consistently for your journal.
4. Tap one of the eight goals, select one or more steps in its floating window, then tap **Save my choices**. Use **＋ Add** for a step of your own.
5. Wait for the goal’s saved message and darker tile border. Day and week trends include the saved moment.

My Day offers eight directions: Start My Day, Move Well, Eat Well, Be Present, Use My Time Well, Connect Well, Be Kind to Myself, and Rest Well. Each opens a floating window with its encouragement and editable steps. The darker border appears only after a good choice for that goal is saved today.

Settings lets you add directions with a picture, rename or hide buttons, edit each direction’s encouragement and steps, and keep extra encouragement phrases. Tap **Save my settings** to keep changes locally.

Older settings automatically show the new directions, retaining custom choices, recipe, general reminders, and hidden-button preferences. Old food records are grouped under Eat Well in reports. Original entry IDs, labels, times, choices, and notes remain stored unchanged; editing a historic entry uses that original record. New settings carry a migration marker so later personal edits are preserved. Older backups remain importable.

Settings includes installation help, offline status, editable reminders, and backup/restore. Offline use becomes available after the complete app shell downloads successfully. A new app version waits for all open Steer windows to close before taking over.

## Where your data lives

All entries, notes, edited reminders, and settings are stored in IndexedDB on the device. There is no account, backend, analytics, or cloud journal. GitHub Pages receives normal requests for static app files, but the app never uploads journal contents. Public source includes only the app, default wording, and illustrations.

Each browser/app installation and website origin may have a separate journal. Install the Home Screen app before logging. Data from the previous Sites-hosted app does not automatically move here; the old app and its saved records are not modified by this project.

Local browser storage is not a guaranteed permanent backup. Clearing site data or deleting the app can erase it. The app asks the browser for persistent storage after a save, but this is not guaranteed. After saving a choice, use **My Day → Save journal to Files**. Choose **On My iPhone** to keep your backup local, rather than a cloud Files location.

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
Choose a goal, read its brief encouragement, select one or more steps, and tap **Save my choices**. The selected steps become one local journal moment, so daily and weekly counts reflect moments rather than the number of selected steps. **Save journal to Files** appears on My Day after a committed choice.

Settings → My directions → Things I could do instead lets you edit, add, or remove alternatives for each goal (up to 30 per goal). The eight starter goals each include five options. Save my settings commits changes locally. Existing custom lists, including intentionally empty lists, are preserved. Selected action text is saved with each entry and included in local backups, even if the settings list changes later.

The quick window shows the direction’s opening encouragement. Extra phrases remain editable in Settings. Reduce Motion disables the window’s opening animation.

App updates activate after the complete new shell has downloaded, even with other Steer windows open. The home and goal-selection screens reload automatically when an update activates. Screens with forms or an active decision wait until you save and return to My day, preserving unsaved state. A failed download leaves the previous offline app available. Updates do not modify IndexedDB journal data.

Goals use colorful native emoji icons on pastel tiles. The splash screen shows the supplied tree landscape. Each floating window places five starter options below the encouragement; longer custom lists or larger accessibility text can still scroll.

The splash screen shows the package version and actual build timestamp in the device’s local time zone. These identify the loaded app, not the time the page was opened.

Version 1.2.0 adds 91 approved encouragements: 13 for each of the seven goals. Each goal cycles its own list after its opening encouragement, without duplicate phrases in a cycle. Settings → My directions → Encouragement phrases supports editing, adding, and removing phrases. Missing lists receive the catalog on migration; existing lists and deliberately empty lists are preserved. Empty lists use the general encouragement bank. Goal phrases stay local and are included in backups.

Version 1.2.1 introduces a muted plum encouragement accent (#79617f) for rotating phrases, welcome and saved-choice headings, progress encouragement, and life-goal reminders. Navigation and action buttons retain slate blue.

Version 1.3.0 adds Save journal to Files after every saved decision. It exports a timestamped JSON snapshot of all committed entries and settings. On iPhone choose Save to Files → On My iPhone. Saving requires a user tap and confirmation; Steer cannot confirm the final file destination or silently overwrite an existing file. Canceling leaves the IndexedDB journal intact and allows retry.

Version 1.4.0 simplifies live moments: choose a goal, pause, then tap an action to save directly. Confirmation appears only after the database commit; retries use the same entry ID. Good-choice counts for today and the Monday-based week appear immediately and on the home screen. Trends provides Day and Week views. File export is optional under a disclosure; earlier reflections retain review before saving. Counts represent logged decisions, not verified completed actions.

Version 1.4.1 places Save journal to Files directly below the confirmed action in Pause, without a disclosure. Settings contains Restore my journal only; file export is no longer duplicated there.

Version 1.4.2 replaces the splash character with the supplied tree landscapes. The bright image appears 06:00–17:59 and the moonlit image 18:00–05:59 in the device’s local time. It updates while open and when returning to the app. Both original images are included in the offline cache.

Version 1.5.0 makes My Day the fastest entry point. The time-based landscape becomes a compact banner, daily and weekly good-choice counts sit beside the prompt, and every active goal appears in a four-column icon grid. Tapping a goal opens its encouragement and next steps directly. Earlier-choice recording, the recipe, and build information remain available below More. The dashboard is sized for the iPhone 17 Pro Max viewport without scrolling at the default text size.

Version 1.10.0 gives all eight goals the same floating quick-choice window. Each uses its own saved options, meaningful colorful icons, multi-selection, and a custom Add step. After a committed save, My Day highlights the goal and offers a local journal backup without changing tabs.
