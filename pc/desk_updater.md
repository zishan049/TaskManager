# Desktop Update Strategy Plan

## Goal
Implement a robust, automated update system for TaskManager using Tauri's built-in updater and GitHub Actions.

## Tasks
- [ ] **Task 1: Install Updater Dependencies**
  - Run `npm install @tauri-apps/plugin-updater`
  - Add `tauri-plugin-updater` to `src-tauri/Cargo.toml`
  - Verify: Dependencies are listed in config files.

- [ ] **Task 2: Configure Tauri Security**
  - Generate Tauri signing keys using `tauri signer generate`
  - Add the public key to `src-tauri/tauri.conf.json`
  - Verify: Public key is visible in config.

- [ ] **Task 3: Setup GitHub Actions CI/CD**
  - Create `.github/workflows/release.yml`
  - Configure automated builds for Windows (.msi/.exe)
  - Verify: Pushing a tag triggers a build in GitHub Actions.

- [ ] **Task 4: Implement Update UI in App**
  - Add a "Check for Updates" button in `SettingsPage.jsx`
  - Implement a notification popup when a new version is found
  - Verify: Clicking button triggers update check (even if none found).

- [ ] **Task 5: Configure Update Endpoint**
  - Set the `updater > endpoints` in `tauri.conf.json` to point to GitHub Releases
  - Verify: `tauri.conf.json` contains the correct release URL.

## Done When
- [ ] Code is built automatically via GitHub Actions.
- [ ] App can successfully check for new versions on launch.
- [ ] Digital signatures are working for secure updates.

## Notes
- **Security**: Private keys MUST be stored as GitHub Secrets, never committed to the repo.
- **Beta Channel**: We can use "Draft" or "Pre-release" tags on GitHub to separate Beta from Production.
