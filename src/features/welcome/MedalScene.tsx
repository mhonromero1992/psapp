import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, PerformanceMonitor } from "@react-three/drei";
import * as THREE from "three";

/*
 * The hero centrepiece: a service medal. Uniformed members wear ribbons and medals;
 * this one carries a navy enamel field and three enamel blades (green, blue, red)
 * drawn from the PSMBFI emblem's language, hung from a satin ribbon in brand stripes.
 * It assembles once, turns slowly, follows the pointer a little, and turns further
 * as the hero scrolls away.
 */

export interface HeroSceneHandle {
  /** 0 at the top of the page, 1 when the hero has scrolled away. */
  scroll: number;
  /** Pointer position in -1..1. */
  px: number;
  py: number;
}

const BLADE_COLORS = ["#009444", "#1054a4", "#ec1c24"];

function bladeShape() {
  // Same path as BladeMark (SVG units, y down), centred on the pivot (50, 52).
  const s = new THREE.Shape();
  const p = (x: number, y: number) => [(x - 50) / 50, -(y - 52) / 50] as const;
  s.moveTo(...p(48, 6));
  s.bezierCurveTo(...p(74, 12), ...p(92, 34), ...p(88, 60));
  s.bezierCurveTo(...p(86, 72), ...p(78, 80), ...p(70, 82));
  s.bezierCurveTo(...p(76, 70), ...p(75, 54), ...p(67, 42));
  s.bezierCurveTo(...p(61, 32), ...p(55, 20), ...p(48, 6));
  return s;
}

function ribbonTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 8;
  const g = c.getContext("2d")!;
  // Symmetric satin stripes: blue, white, green, red, green, white, blue.
  const stripes: [string, number][] = [["#0f4f9b", 0.2], ["#f4f6fa", 0.06], ["#00873e", 0.11], ["#d8161e", 0.26], ["#00873e", 0.11], ["#f4f6fa", 0.06], ["#0f4f9b", 0.2]];
  let x = 0;
  for (const [col, w] of stripes) {
    g.fillStyle = col;
    g.fillRect(Math.round(x * 512), 0, Math.ceil(w * 512), 8);
    x += w;
  }
  // Fine woven grain.
  for (let i = 0; i < 512; i += 2) {
    g.fillStyle = `rgba(255,255,255,${i % 4 === 0 ? 0.05 : 0.0})`;
    g.fillRect(i, 0, 1, 8);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function Medal({ handle, reduced, pose = -0.38 }: { handle: React.MutableRefObject<HeroSceneHandle>; reduced: boolean; pose?: number }) {
  const group = useRef<THREE.Group>(null);
  const medal = useRef<THREE.Group>(null);
  const ribbon = useRef<THREE.Mesh>(null);
  const born = useRef<number | null>(null);

  const geo = useMemo(() => {
    const circle = new THREE.Shape();
    circle.absarc(0, 0, 1, 0, Math.PI * 2, false);
    const disc = new THREE.ExtrudeGeometry(circle, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.06, bevelSegments: 10, curveSegments: 128 });
    disc.translate(0, 0, -0.05);
    const field = new THREE.CylinderGeometry(0.8, 0.8, 0.04, 128);
    field.rotateX(Math.PI / 2);
    const rimLine = new THREE.TorusGeometry(0.86, 0.022, 16, 160);
    const blade = new THREE.ExtrudeGeometry(bladeShape(), { depth: 0.05, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.018, bevelSegments: 6, curveSegments: 48 });
    const bladeRim = new THREE.ExtrudeGeometry(bladeShape(), { depth: 0.035, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.045, bevelSegments: 3, curveSegments: 48 });
    const loop = new THREE.TorusGeometry(0.14, 0.04, 20, 48);
    const hub = new THREE.SphereGeometry(0.075, 32, 16);
    const rib = new THREE.PlaneGeometry(0.82, 2.6, 18, 60);
    rib.translate(0, 1.3, 0); // pivot at the bottom (the loop)
    return { disc, field, rimLine, blade, bladeRim, loop, hub, rib, ribBase: (rib.attributes.position.array as Float32Array).slice() };
  }, []);

  const mats = useMemo(() => {
    const silver = new THREE.MeshPhysicalMaterial({ color: "#e6eaf1", metalness: 1, roughness: 0.14, clearcoat: 0.5, clearcoatRoughness: 0.15 });
    const darkSilver = new THREE.MeshPhysicalMaterial({ color: "#aeb6c4", metalness: 1, roughness: 0.28 });
    const navy = new THREE.MeshPhysicalMaterial({ color: "#0b2452", metalness: 0.1, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.06 });
    const enamel = BLADE_COLORS.map((c) => new THREE.MeshPhysicalMaterial({ color: c, metalness: 0.05, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.06, sheen: 0.2 }));
    const satin = new THREE.MeshPhysicalMaterial({ map: ribbonTexture(), roughness: 0.5, metalness: 0, sheen: 1, sheenRoughness: 0.32, sheenColor: new THREE.Color("#ffffff"), side: THREE.DoubleSide });
    return { silver, darkSilver, navy, enamel, satin };
  }, []);

  useEffect(
    () => () => {
      Object.values(geo).forEach((g) => (g as THREE.BufferGeometry).dispose?.());
      mats.silver.dispose();
      mats.darkSilver.dispose();
      mats.navy.dispose();
      mats.enamel.forEach((m) => m.dispose());
      mats.satin.map?.dispose();
      mats.satin.dispose();
    },
    [geo, mats],
  );

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (born.current === null) born.current = t;
    const age = t - born.current;
    // Assembly: ease-out over ~1.1s (instant when reduced motion).
    const k = reduced ? 1 : 1 - Math.pow(1 - Math.min(1, age / 1.1), 4);
    const h = handle.current;
    const g = group.current;
    const m = medal.current;
    if (!g || !m) return;

    const idle = reduced ? pose : Math.sin(t * 0.32) * 0.32;
    const targetY = idle + h.px * 0.38 + h.scroll * 2.2 - (1 - k) * 0.9;
    m.rotation.y = THREE.MathUtils.damp(m.rotation.y, targetY, 3, delta);
    m.rotation.x = THREE.MathUtils.damp(m.rotation.x, -h.py * 0.16 + (reduced ? 0 : Math.sin(t * 0.5) * 0.03), 3, delta);
    g.rotation.z = reduced ? 0 : Math.sin(t * 0.55) * 0.025;
    g.position.y = THREE.MathUtils.damp(g.position.y, -0.2 + (1 - k) * -0.4 + h.scroll * 0.9, 4, delta);
    const s = 0.9 + 0.1 * k;
    g.scale.setScalar(s);

    // Ribbon: gentle satin folds, stronger towards the free end, twisting with the medal.
    const rib = ribbon.current;
    if (rib) {
      const pos = rib.geometry.attributes.position as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;
      const base = geo.ribBase;
      const twist = m.rotation.y * 0.55;
      for (let i = 0; i < arr.length; i += 3) {
        const x = base[i];
        const y = base[i + 1];
        const fromBottom = 1 - Math.min(1, y / 2.6); // 1 at the loop, 0 at the top
        const fold = reduced ? 0 : Math.sin(y * 3.2 - t * 1.1) * 0.035 * (0.3 + fromBottom) + Math.sin(x * 6 + y * 2 + t * 0.7) * 0.01;
        const a = twist * Math.pow(fromBottom, 2.2);
        arr[i] = x * Math.cos(a);
        arr[i + 2] = x * Math.sin(a) + fold;
      }
      pos.needsUpdate = true;
      rib.geometry.computeVertexNormals();
    }
  });

  return (
    <group ref={group}>
      {/* Ribbon from above the frame down to the loop */}
      <mesh ref={ribbon} geometry={geo.rib} material={mats.satin} position={[0, 1.2, -0.02]} />
      <group ref={medal}>
        <mesh geometry={geo.loop} material={mats.silver} position={[0, 1.13, 0]} />
        <mesh geometry={geo.disc} material={mats.silver} castShadow />
        <mesh geometry={geo.rimLine} material={mats.darkSilver} position={[0, 0, 0.1]} />
        <mesh geometry={geo.field} material={mats.navy} position={[0, 0, 0.085]} />
        {BLADE_COLORS.map((c, i) => (
          <group key={c} rotation={[0, 0, (-i * 2 * Math.PI) / 3]} position={[0, 0, 0.1 + i * 0.028]} scale={[0.8, 0.8, 1]}>
            <mesh geometry={geo.bladeRim} material={mats.silver} />
            <mesh geometry={geo.blade} material={mats.enamel[i]} position={[0, 0, 0.014]} />
          </group>
        ))}
        <mesh geometry={geo.hub} material={mats.silver} position={[0, 0, 0.2]} />
      </group>
    </group>
  );
}

function Rig({ handle }: { handle: React.MutableRefObject<HeroSceneHandle> }) {
  const { camera } = useThree();
  useFrame((_, delta) => {
    const h = handle.current;
    camera.position.x = THREE.MathUtils.damp(camera.position.x, h.px * 0.18, 2.5, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, 0.15 + h.py * 0.1, 2.5, delta);
    camera.lookAt(0, -0.1, 0);
  });
  return null;
}

export default function HeroScene({ handle, reduced, onReady, active, pose }: { handle: React.MutableRefObject<HeroSceneHandle>; reduced: boolean; onReady?: () => void; active: boolean; pose?: number }) {
  const [dpr, setDpr] = useState(1.5);
  return (
    <Canvas
      dpr={[1, dpr]}
      frameloop={active ? "always" : "never"}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance", preserveDrawingBuffer: false }}
      camera={{ position: [0, 0.15, 7.6], fov: 30, near: 0.1, far: 50 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        requestAnimationFrame(() => onReady?.());
      }}
      style={{ background: "transparent" }}
      aria-hidden
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 5, 4]} intensity={1.6} />
      <directionalLight position={[-4, 1, 2]} intensity={0.5} color="#cfe0ff" />
      <Medal handle={handle} reduced={reduced} pose={pose} />
      <Environment resolution={256}>
        {/* Studio cyclorama: soft blue-grey so polished metal reads as silver, not black. */}
        <mesh scale={30}>
          <sphereGeometry args={[1, 32, 16]} />
          <meshBasicMaterial color="#6f7f99" side={THREE.BackSide} />
        </mesh>
        <mesh position={[0, -6, 0]} rotation-x={-Math.PI / 2} scale={40}>
          <planeGeometry />
          <meshBasicMaterial color="#2c3850" />
        </mesh>
        <Lightformer form="rect" intensity={3.4} position={[0, 4, 2]} scale={[6, 2, 1]} rotation-x={Math.PI / 2} />
        <Lightformer form="rect" intensity={2.4} color="#dce8ff" position={[-4, 0.5, 1]} scale={[1.4, 5, 1]} rotation-y={Math.PI / 2} />
        <Lightformer form="rect" intensity={2} color="#fff4e6" position={[4, 0.5, 1]} scale={[1.4, 5, 1]} rotation-y={-Math.PI / 2} />
        <Lightformer form="ring" intensity={0.9} position={[0, 0.4, 5]} scale={2.2} />
        <Lightformer form="rect" intensity={0.6} color="#1054a4" position={[0, -3, 1]} scale={[6, 1, 1]} rotation-x={-Math.PI / 2} />
      </Environment>
      <Rig handle={handle} />
    </Canvas>
  );
}
