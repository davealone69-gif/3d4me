# Figural Character Studio — Current delivery status

## Implemented and verified

- [x] **Real procedural 3D character mesh** — Editable Three.js geometry for body, face features, limbs, hands, hair and clothing. Editor values change the actual mesh and its named parts.
- [x] **Four actual views** — Front, side, rear and three-quarter are camera/model orientations over one shared character mesh.
- [x] **Character editor** — Adult age (21–80), body build and proportions, face/jaw/eyes/nose, skin/hair/eye palettes, hairstyle/length/volume, garment style, material and colour.
- [x] **PBR and GLB** — Binary glTF v2 export with geometry and physically based base-colour, roughness and metalness. A live preview export was parsed and verified: 90 meshes, 9 materials.
- [x] **Local gallery and recovery** — Private-device autosave, user-exportable JSON backups, non-destructive restore/merge, and locally saved viewport PNGs. Reference photos are local guides only and are not uploaded, analyzed, persisted or backed up.
- [x] **Optional adult settings** — Adult wardrobe choices are off by default; session-enforced 21+ confirmation and fictional-adult attestations gate activation.
- [x] **Honest service and model terms** — Local editing, GLB export and viewport captures have no hosted image calls or app credit/paywall meter. There is no promise of unlimited third-party image generation; performance and storage are bounded by the device.
- [x] **Automated QA** — TypeScript check, lint, tests, Expo Android bundle export, and Android debug/release assembly completed. 32 automated tests passed; one existing logout test is intentionally skipped.
- [x] **Native standalone Android APK** — The 67 MB release-variant APK includes the JavaScript bundle and Expo GL/React Native libraries for ARM64 and ARMv7; its package metadata and v2 signature were verified. The generated release uses Android's debug certificate, so this is for testing/sideloading, not production store signing.

## Requires a physical Android device before product/store release

- [ ] **On-device runtime QA** — No emulator or handset is connected to this sandbox. Verify startup, live GL frames, orbit and sliders, PNG/GLB sharing, and JSON backup/restore on real target devices.
- [ ] **Production signing and store preparation** — Configure a protected release keystore and complete store-specific packaging, privacy review, and device testing before distributing publicly.

## Deliberate current capability limits

The generator is a real editable procedural 3D mesh, but it is **not a photoreal human scan or neural reconstruction**. Photoreal skin/fabric texture generation, purchased scan assets, skeleton/face rig, blendshapes, animation and motion capture are not implemented. No third-party unlimited hosted image service is supplied or promised.
