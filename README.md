# 3D4ME

3D4ME is an Android-first, offline-oriented editor for fictional adult character meshes. It builds one editable Three.js mesh assembly and previews that same character at front, side, rear and three-quarter angles. Editor settings change actual geometry and PBR material values; the views are not fabricated image responses.

## Local features

- Native GLView with drag-to-orbit and four camera presets.
- Editable adult age (21–80), body build/proportions, face shape/jaw/eyes/nose, skin/hair/eye palettes, hairstyle/length/volume, clothing, fabric and garment colour.
- PBR base colour, roughness and metalness; binary glTF (`.glb`) export of the real mesh assembly.
- Genuine viewport PNG captures, an app-local gallery, and explicit share-sheet exports.
- App-local project autosave, portable JSON backups and non-destructive merge/restore.
- Optional adult wardrobe controls, off by default, with 21+ session opt-in and fictional-adult safeguards.
- Optional local visual reference photo. It is displayed only as a guide and is not uploaded, analyzed, persisted in a project, or included in backups.

## Identity and existing-install compatibility

The app is displayed as **3D4ME**. `package.json` uses the lowercase npm name `3d4me`; Expo uses the lowercase slug `3d4me`.

The Android application ID and iOS bundle ID remain `space.manus.figural.t087663238228075` deliberately. Changing an installed app's package/bundle identifier creates a different app and prevents an in-place update. Android `versionCode` advances to 2 and the app version is 1.0.1.

The old `manus087663238228075://` deep link remains registered. The branded link alias is `threed4me://`; `3d4me://` is not used because a URI scheme must start with a letter. Existing local AsyncStorage keys, the `figural-character-library` backup format and the private `Figural/` document subfolders are retained so data and existing backups remain readable. New backup files use a 3D4ME filename.

## Capability limits

This is an actual editable procedural 3D mesh, **not a photoreal human scan or neural reconstruction**. The GLB contains mesh parts and PBR material factors but no generated skin/fabric texture maps, skeleton, facial blendshapes, animation or motion capture. A saved PNG is a true GL viewport capture, not an AI-generated photograph.

Editing, GLB generation and viewport capture make no hosted image-generation request and have no app credit counter or paywall. This does not mean infinite device compute or storage; performance, memory, file capacity and Android permissions depend on the device. No unlimited third-party image-generation service is included or promised.

## Cloud backend status: scaffold only, do not rely on it

The repository contains server routers, authentication support code, Drizzle schema and database functions. These are **unverified scaffolding, not a working or activated cloud-account/sync service**. The mobile editor saves locally and its screens do not call the account or project-sync routes. Cloud accounts and project sync must not be enabled on the basis of these files.

Authentication/authorization and end-to-end integration are incomplete; `tests/auth.logout.test.ts` is deliberately skipped. `drizzle/migrations/` contains only `.gitkeep`. The current `drizzle.config.ts` writes generated Drizzle migration files to the `drizzle/` root, where SQL files exist, but their presence does not establish a verified cloud migration or production database workflow. Before any real cloud use, implement and validate proper schema migrations, real authentication and authorization, and database/auth integration tests, including logout/session behavior.

`pnpm dev` starts the Metro app only. `pnpm dev:server` is a separate, explicit development command for the unverified server scaffold; it is not evidence of a production-ready service.

## Local development and checks

```sh
pnpm install
pnpm check
pnpm lint
pnpm test
pnpm exec expo export --platform android --output-dir /tmp/3d4me-android-bundle
pnpm exec expo prebuild --platform android
(cd android && ./gradlew :app:assembleRelease)
pnpm dev
```

The viewer uses `expo-gl`, `expo-three` and Three.js. Run native GL rendering on an Android physical device or suitable development build; remote JavaScript debugging is not suitable for Expo GL contexts. Automated checks cover editable geometry, camera views, GLB meshes/materials, and local project persistence and recovery.

The standalone test APK is signed with the existing workspace Android **debug** certificate, not a protected production key. The rebranded build preserves that local key and package ID so it can update the prior test APK on a device with the matching signature. Another checkout or clean build may create a different debug key and then Android will require uninstalling the prior test build before installing it. A production release needs a properly protected release keystore.

No Android emulator or physical handset is attached to this workspace. Startup, on-device GL performance, orbit/slider feel, file permissions, share sheets and backup restore still need device QA before product/store release.

## Licensing

The procedural character source is project-authored and no third-party human model or reference photo is bundled. The viewer uses [Three.js (MIT)](https://github.com/mrdoob/three.js/blob/dev/LICENSE) and [expo-three (MIT)](https://github.com/expo/expo-three/blob/master/LICENSE). Preserve package notices if redistributing. See [model capability and backend status](docs/model-capabilities.md).
