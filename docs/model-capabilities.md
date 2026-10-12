# 3D4ME character generator: capabilities, compatibility, and service status

## What the local generator does

The character editor constructs a real Three.js scene from editable parametric geometry. The Android viewer renders that scene with Expo GL. Binary glTF (`.glb`) export contains the mesh and PBR base-colour, roughness and metalness values. Front, side, rear and three-quarter angles are views of the same character. Local model generation and viewport-image capture do not call a hosted image-generation API and have no app credit counter or paywall.

Local generation is bounded by device processing speed, memory, file-system capacity and operating-system behavior. It is not accurate to promise infinite physical resources or identical performance across devices.

## Model limitations

The avatar is an original procedural mesh assembly, not a photo scan, purchased or third-party human asset, or neural 3D reconstruction. Shapes, hair strands, facial details, clothes and PBR finish respond to editor parameters. The initial output includes geometry and PBR material factors, not photoreal skin/fabric texture maps. It does not currently include a rigged skeleton, facial blendshapes, animation or motion capture.

Saved view PNGs are direct captures of the local 3D viewport, not generated photographs. No unlimited third-party image-generation service is included or promised; any separately integrated provider would have its own availability, prices and quotas.

## Identity and compatibility

The current display/product name is **3D4ME**. The lowercase Expo slug and npm package name are `3d4me`. Android application ID and iOS bundle ID intentionally remain `space.manus.figural.t087663238228075` to permit an in-place update. The existing `manus087663238228075://` deep link is retained and `threed4me://` is added as a branded alias; `3d4me://` is not a valid custom URI scheme because schemes must start with a letter.

Internal local-storage keys, the `figural-character-library` backup format, old GLB metadata key, and existing app-private `Figural/` directories are preserved for users upgrading from earlier builds. The displayed app name and new exports use 3D4ME.

## Cloud backend status — not verified for real use

Server routers, auth support, database functions and Drizzle schema in this source tree are **scaffolding only**. The local editor stores projects on-device and does not use them for account login or cloud sync. Authentication and authorization are incomplete; `tests/auth.logout.test.ts` deliberately skips its test.

The `drizzle/migrations/` directory contains only `.gitkeep`. `drizzle.config.ts` writes Drizzle output to `./drizzle`, where generated root-level SQL files are present. That does not by itself demonstrate a verified production migration workflow or tested cloud database. No real cloud accounts or project sync are promised or enabled. Before introducing either, establish proper migrations, real authentication and authorization, and passing integration tests for database access, sessions/logout and access control.

## Third-party runtime licensing

The implementation uses Three.js (MIT) and the Expo Three.js integration (MIT). Preserve the applicable package notices when redistributing. The app bundles no third-party human model or photograph. glTF/GLB are interoperable asset formats and do not grant rights to third-party assets a user may import.

Expo documents GLView as a WebGL/OpenGL ES render target; Three.js documents GLTFExporter as a glTF 2.0 exporter, including binary GLB output.

## References

- [Expo GLView documentation](https://docs.expo.dev/versions/latest/sdk/gl-view/)
- [expo-three source and MIT license](https://github.com/expo/expo-three)
- [Three.js source and MIT license](https://github.com/mrdoob/three.js)
- [Three.js GLTFExporter documentation](https://threejs.org/docs/pages/GLTFExporter.html)
