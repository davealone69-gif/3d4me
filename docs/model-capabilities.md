# Figural 3D generator: capabilities, licensing, and service limits

## What the local generator does

The character editor constructs an actual Three.js scene from editable parametric geometry. The Android viewer renders that scene with Expo GL. The app can export the mesh and its PBR base-color, roughness, and metalness material properties to a binary glTF (`.glb`) file. Front, side, rear, and three-quarter angles are views of the same underlying character model. Local GLB generation and viewport-image capture do not call the hosted image-generation API and do not have an app credit counter or paywall.

Local generation is bounded by the device's processing speed, memory, file-system capacity, and operating-system behavior. It is not accurate to promise infinite physical resources or identical performance across devices.

## Model limitations

The avatar is an original procedural mesh assembly, not a photo scan, a purchased or third-party human asset, or a neural 3D reconstruction. Its shapes, hair strands, facial details, clothes, and PBR finish respond to editor parameters. The initial output contains geometry and PBR material factors, not photorealistic skin/fabric texture maps. It does not currently include a rigged skeleton, facial blendshapes, animation, or motion capture. Those capabilities must not be implied by “3D” or a GLB export.

Saved view PNGs are direct captures of the local 3D viewport. They are not generated photographs. Separate hosted image-generation calls, where available, remain subject to the platform's own availability, quotas, and terms. Figural cannot promise an unlimited third-party image service or override its platform limits. The local 3D editor and exports work without those hosted calls.

## Third-party runtime licensing

The implementation uses the Three.js JavaScript 3D library, which is distributed under the MIT License, and the Expo Three.js integration, also distributed under the MIT License. The project source should carry the applicable notices from installed packages when redistributed. The app's own parametric mesh source is authored for Figural. The glTF / GLB formats are interoperable asset formats and do not confer rights to any third-party assets that a user later imports.

The built-in Expo GL view supports Android, iOS, and Web; Expo documents GLView as a WebGL/OpenGL ES render target. Three.js documents GLTFExporter as a glTF 2.0 exporter, including binary GLB output.

## References

- [Expo GLView documentation](https://docs.expo.dev/versions/latest/sdk/gl-view/)
- [expo-three source and MIT license](https://github.com/expo/expo-three)
- [Three.js source and MIT license](https://github.com/mrdoob/three.js)
- [Three.js GLTFExporter documentation](https://threejs.org/docs/pages/GLTFExporter.html)
