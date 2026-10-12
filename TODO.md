# 3D4ME — Current delivery status

## Implemented and verified

- [x] **3D4ME identity** — Expo display name, slug, npm package name, native launcher/adaptive/monochrome/splash/web icons, editor masthead and GLB root name use the new brand.
- [x] **Existing-install compatibility** — Android application ID and iOS bundle ID are unchanged. Android versionCode and iOS build number advance; existing local storage keys, Figural backup format, old deep-link scheme and private folders are preserved. A valid `threed4me://` alias is added.
- [x] **Real procedural 3D mesh** — Editable Three.js geometry for body, face features, limbs, hands, hair and clothing. Editor values change the actual mesh and named parts.
- [x] **Four actual views** — Front, side, rear and three-quarter orientations over one shared character mesh.
- [x] **Character editor** — Adult age (21–80), body build/proportions, face/jaw/eyes/nose, skin/hair/eye palettes, hairstyles, garments, fabrics, PBR values and colours.
- [x] **PBR and GLB** — Binary glTF v2 exports real geometry and physically based base-colour, roughness and metalness. A live preview export was parsed and verified previously: 90 meshes and 9 materials.
- [x] **Local gallery and recovery** — Private-device autosave, JSON backup and non-destructive restore/merge, viewport PNGs. Reference images are local guides only.
- [x] **Automated QA and Android build** — TypeScript and lint pass; all 35 active tests pass, with the single unfinished logout test still intentionally skipped. Android debug and standalone release APKs assemble; the release APK manifest, old/new URI filters, embedded JS bundle, Expo GL libraries and APK v2 signature were verified. The prior test APK and rebuilt artifact have the same Android application ID and signer; the new `versionCode` is higher, preserving in-place update compatibility on a matching device.

## Cloud backend is unverified scaffolding

- [ ] **No production cloud claims** — Server routers, authentication code, database functions and Drizzle schema are not a verified account or project-sync service. The editor remains local-first and does not call account/project cloud routes.
- [ ] **Migrations** — `drizzle/migrations/` is only `.gitkeep`; `drizzle.config.ts` writes generated migration SQL into the `drizzle/` root. Establish and verify a proper migration lifecycle before activating a database-backed service.
- [ ] **Authentication and authorization** — Complete real account/session authentication and authorization; the `auth.logout` test is intentionally skipped until authentication is implemented.
- [ ] **Integration testing** — Add and pass end-to-end database, session/logout, access-control and project persistence integration tests before allowing real cloud accounts or sync.

## Still requires a physical device / release credentials

- [ ] **On-device QA** — No emulator or handset is attached. Verify startup, live GL rendering, touch orbit/sliders, PNG/GLB sharing, and JSON backup/restore on real target Android devices.
- [ ] **Production signing/store preparation** — Configure a protected release keystore and complete store-specific packaging, privacy review and device testing before public distribution.

## Deliberate current capability limits

The generator is a real editable procedural 3D mesh, but it is **not photorealistic**. Photoreal skin/fabric texture generation, scans, rigging, facial blendshapes, animation and motion capture are not implemented. No third-party unlimited hosted image service is supplied or promised.
