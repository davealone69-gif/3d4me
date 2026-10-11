# Figural Character Studio — Current delivery status

## Implemented and verified in source

- [x] **Real procedural 3D character mesh** — Original editable Three.js meshes for body, face features, arms, hands, legs, hair strands and clothing; slider/select values feed the mesh and its named parts.
- [x] **Four actual camera presets** — Front, side, rear, and three-quarter are camera/model rotations over the same mesh, not separately generated placeholders.
- [x] **Character editing** — Adult age (21–80), build, height, shoulder/chest/waist/hip widths, limb lengths, face/jaw/eyes/nose, skin/hair/eye palettes, hairstyle/length/volume, garment type, fabric, and garment colour.
- [x] **PBR and GLB output** — Real binary glTF v2 export with geometry and physically based base-colour/roughness/metalness channels; output byte/header, mesh, and material data tested.
- [x] **On-device project persistence/recovery** — App-private local project autosave, user-generated portable JSON backup, non-destructive restore/merge, and a local PNG capture gallery.
- [x] **Private reference image** — Local image picker used only as a temporary in-app visual guide. No upload, analysis, project persistence, or backup inclusion.
- [x] **Optional adult settings** — Adult wardrobe choices remain off by default; session-enforced 21+ confirmation and responsible fictional-adult attestations gate activation.
- [x] **Transparent capability and licensing copy** — Three.js/expo-three MIT sources are disclosed. The current procedural model is explicitly not called a photoreal scan and has no generated texture maps, rig, blendshapes, animation, or motion capture.
- [x] **No user app paywall on the local workflow** — Model editing, GLB generation, and viewport captures do not call hosted image generation. Generation has no app credit quota; device performance/storage remain natural limits.
- [x] **Automated QA** — `pnpm check`, `pnpm lint`, `pnpm test`, and Expo Android bundle export pass. 32 automated tests across geometry, GLB structure/materials, local persistence, recovery, backups, and CORS passed; one auth logout test is intentionally skipped by the existing project test.

## Explicit remaining release-validation boundary

- [ ] **Physical Android device QA** — The sandbox had no connected handset or native Android runtime. Confirm live GL frame rendering, touch orbit/slider feel, PNG/GLB sharing and document-picker restore on a physical Android device before store release. The Android JavaScript bundle builds, but that is not a signed APK or a physical-device result.
- [ ] **Not included by design** — Photoreal human/skin texture generation, scan assets, skeleton/face rig, animation and motion capture are not implemented. Do not describe the current generator as a photorealistic scan or a fully rigged 3D asset. No third-party unlimited hosted image-generation service is supplied or promised.
