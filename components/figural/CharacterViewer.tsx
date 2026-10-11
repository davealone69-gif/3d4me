import { GLView, type ExpoWebGLRenderingContext } from "expo-gl";
import Renderer from "expo-three/build/Renderer";
import * as React from "react";
import { PanResponder, Platform, StyleSheet, Text, View } from "react-native";
import * as THREE from "three";

import type { CharacterSettings } from "@/shared/character";
import { createAvatarModel, viewRotations, type AvatarView } from "@/shared/avatar3d";

const threeGlobal = globalThis as typeof globalThis & { THREE?: typeof THREE };
threeGlobal.THREE = threeGlobal.THREE ?? THREE;

export interface CharacterViewerHandle {
  capture: () => Promise<{ image: string | Blob; width: number; height: number }>;
}

type SceneState = {
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  model: THREE.Group;
  camera: THREE.PerspectiveCamera;
  gl: ExpoWebGLRenderingContext;
};

export const CharacterViewer = React.forwardRef<CharacterViewerHandle, {
  settings: CharacterSettings;
  view: AvatarView;
}>(function CharacterViewer({ settings, view }, forwardedRef) {
  const [canUseWebGL, setCanUseWebGL] = React.useState(Platform.OS !== "web");
  const glViewRef = React.useRef<GLView>(null);
  const latestSettings = React.useRef(settings);
  const latestView = React.useRef(view);
  const sceneState = React.useRef<SceneState | null>(null);
  const dragStart = React.useRef(0);

  React.useEffect(() => {
    if (Platform.OS !== "web") return;
    let supported = false;
    try {
      const canvas = document.createElement("canvas");
      supported = Boolean(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
    } catch {
      supported = false;
    }
    setCanUseWebGL(supported);
  }, []);

  const renderFrame = React.useCallback(() => {
    const current = sceneState.current;
    if (!current) return;
    current.renderer.render(current.scene, current.camera);
    current.gl.endFrameEXP();
  }, []);

  React.useImperativeHandle(forwardedRef, () => ({
    capture: async () => {
      const state = sceneState.current;
      if (!state || !glViewRef.current) throw new Error("The 3D view is not ready yet.");
      renderFrame();
      const snapshot = await glViewRef.current.takeSnapshotAsync({ format: "png", compress: 1 });
      if (!snapshot.uri) throw new Error("Expo could not save a snapshot from this device's 3D buffer.");
      return { image: snapshot.uri, width: snapshot.width, height: snapshot.height };
    },
  }), [renderFrame]);

  const rebuildModel = React.useCallback((currentSettings: CharacterSettings, angle: number) => {
    const current = sceneState.current;
    if (!current) return;
    current.scene.remove(current.model);
    current.model.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((surface) => surface.dispose());
      }
    });
    const model = createAvatarModel(currentSettings);
    model.rotation.y = angle;
    current.scene.add(model);
    current.model = model;
    renderFrame();
  }, [renderFrame]);

  const onContextCreate = React.useCallback((gl: ExpoWebGLRenderingContext) => {
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#120F21");
    scene.add(new THREE.HemisphereLight(0xefeaff, 0x39324e, 2.0));

    const key = new THREE.DirectionalLight(0xffedd9, 3.4);
    key.position.set(-3.4, 4.1, 4.5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xb5c8ff, 1.2);
    fill.position.set(3.2, 2.6, 2.1);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0x85e6c4, 1.8);
    rim.position.set(0.1, 2.5, -4);
    scene.add(rim);

    const camera = new THREE.PerspectiveCamera(30, gl.drawingBufferWidth / Math.max(gl.drawingBufferHeight, 1), 0.1, 50);
    camera.position.set(0, 1.03, 4.55);
    camera.lookAt(0, 1.05, 0);
    const renderer = new Renderer({ gl, alpha: false, antialias: true });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
    renderer.setClearColor("#120F21", 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    const model = createAvatarModel(latestSettings.current);
    model.rotation.y = viewRotations[latestView.current];
    scene.add(model);
    sceneState.current = { scene, renderer, model, camera, gl };
    renderFrame();
  }, [renderFrame]);

  React.useEffect(() => {
    latestView.current = view;
    const state = sceneState.current;
    if (!state) return;
    state.model.rotation.y = viewRotations[view];
    renderFrame();
  }, [renderFrame, view]);

  React.useEffect(() => {
    latestSettings.current = settings;
    if (sceneState.current) rebuildModel(settings, viewRotations[latestView.current]);
  }, [rebuildModel, settings]);

  React.useEffect(() => () => {
    const current = sceneState.current;
    if (!current) return;
    current.model.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((surface) => surface.dispose());
      }
    });
    current.renderer.dispose();
    sceneState.current = null;
  }, []);

  const panResponder = React.useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) + Math.abs(gesture.dy) > 3,
    onPanResponderGrant: () => {
      dragStart.current = sceneState.current?.model.rotation.y ?? viewRotations[latestView.current];
    },
    onPanResponderMove: (_, gesture) => {
      const state = sceneState.current;
      if (state) {
        state.model.rotation.y = dragStart.current + gesture.dx * 0.012;
        renderFrame();
      }
    },
  }), [renderFrame]);

  return (
    <View style={styles.frame} {...panResponder.panHandlers}>
      {canUseWebGL ? (
        <GLView ref={glViewRef} style={styles.gl} onContextCreate={onContextCreate} />
      ) : (
        <View style={styles.fallback}>
          <Text style={styles.fallbackText}>This browser does not offer a WebGL canvas, so no preview can be rendered here. Open the Android app for its native 3D viewer.</Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  frame: { height: 420, borderRadius: 20, overflow: "hidden", backgroundColor: "#120F21", borderColor: "#302B4B", borderWidth: 1 },
  gl: { flex: 1, pointerEvents: "none" },
  fallback: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28 },
  fallbackText: { color: "#B7AECF", textAlign: "center", fontSize: 14, lineHeight: 21 },
});
