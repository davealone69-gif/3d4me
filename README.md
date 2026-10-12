# 3d4me

## Figural Character Studio

Figural is an Android-first, offline-oriented editor for fictional adult character meshes. Its main editor builds one actual Three.js mesh assembly and previews that same character at the front, side, rear, and three-quarter angles. Adjusting editor settings changes exported model geometry and PBR material values; the four angles are not four fabricated image responses.

## Current local features

- Interactive native GLView with drag-to-orbit and four named camera presets.
- Editable adult age (21–80), body build/proportions, face shape/width/jaw, eyes, nose, skin tone, hair style/colour/length/volume, clothes, fabric type and colour.
- PBR base-colour, roughness and metalness parameters; export of the underlying mesh assembly as binary glTF (`.glb`).
- Locally saved `.png` screenshots of the viewport, with persistent app-local gallery, and share-sheet export.
- Private app-local project autosave, explicit JSON backups and non-destructive merge/restore.
- Optional adult-mode clothing controls, off by default, with a separately enforced 21+ session opt-in and adult-content attestations.
- Optional local visual reference photo. It is displayed as a personal guide only; it is not analyzed, transmitted, put in a project, or included in backups.

## Important capability limits

This is a real procedural 3D model, **not a photoreal human scan or neural 3D reconstruction**. The model has original named mesh parts and PBR material factors, but the current GLB has no generated skin/fabric texture maps, skeleton, facial blendshapes, animation, or motion capture. A saved PNG is a genuine GL viewport capture, not an AI-generated photograph.

The local editor does not make any hosted image-generation call, use a user credit meter, or depend on a paid model API. The absence of an app quota is not infinite physical storage or compute: Android performance, memory, file capacity, and permissions remain device limits. A separate hosted image service, if integrated later, must disclose its own availability, prices and quotas. Figural cannot promise an unlimited third-party image-generation service.

## Local storage and recovery

- Editable project settings are autosaved in app-private AsyncStorage on this device.
- PNG and GLB exports are written under the app's private `Figural/` documents folder. Android share sheets let the user copy files to a chosen destination.
- JSON backups include local character project specifications but never include imported reference photographs. Backups must be copied outside the app before uninstalling or changing devices; app-private files are subject to Android data-clearing/uninstall behavior.
- The Gallery tab contains local PNG captures. It has an explicit per-image remove action. Removing an item is local-only.

## Android development and checks

```sh
pnpm install
pnpm check
pnpm lint
pnpm test
pnpm exec expo export --platform android --output-dir /tmp/figural-android-bundle
pnpm exec expo prebuild --platform android
(cd android && ./gradlew :app:assembleRelease)
pnpm dev
```

The editor uses `expo-gl` + `expo-three` + Three.js. In Expo GL's native runtime, run the app on an Android physical device or suitable development build; Expo's documentation warns against remote JS debugging for GL contexts. The repository's automated tests validate actual editable geometry, the four camera angles, a GLB v2 binary header, meshes, PBR material data, project autosave/recovery, and backup validation.

The native Android debug and release variants both assembled successfully. The standalone release APK embeds the JavaScript bundle and native GL libraries; its APK signature and package metadata were verified. Expo's generated release variant uses the debug keystore here: this APK is for sideload testing, **not Play Store or production distribution**. Create and configure your own protected release keystore before publishing.

No emulator or physical handset was attached, so startup, GL performance, file permissions, share sheets, and restore flows still require device QA.

## Licensing and sources

The character geometry is project-authored; no third-party human model or reference photograph is bundled. The viewer uses [Three.js (MIT)](https://github.com/mrdoob/three.js/blob/dev/LICENSE) and [expo-three (MIT)](https://github.com/expo/expo-three/blob/master/LICENSE). Preserve the package notices if redistributing. `docs/model-capabilities.md` records the exact current model limitations and source references.
