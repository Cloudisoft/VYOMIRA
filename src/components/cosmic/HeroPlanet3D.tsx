"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

/**
 * Cinematic hero planet.
 *  - Gas-giant surface: turbulent fbm bands + a drifting storm, day/night terminator with a gold rim.
 *  - Separate cloud shell rotating faster than the surface (parallax gives a sense of depth).
 *  - Fresnel atmosphere (inner glow + outer halo).
 *  - Banded ring system with gaps, lit on the sun side, plus a disc of orbiting stardust.
 *  - Intro: the planet eases in from 82% scale; rotation speeds up briefly while the page scrolls.
 * Budget: ~6 draw calls, DPR ≤ 1.5, paused when off-screen / tab hidden.
 */

const NOISE = /* glsl */ `
float hash(vec3 p){ p = fract(p*0.3183099+.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float noise(vec3 x){ vec3 i=floor(x); vec3 f=fract(x); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(hash(i+vec3(0,0,0)),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z); }
float fbm(vec3 p){ float v=0.0; float a=0.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.02; a*=0.5; } return v; }
`;

const sphereVert = /* glsl */ `
varying vec3 vNormalW; varying vec3 vPos; varying vec3 vViewDir;
void main(){
  vPos = position;
  vec4 wp = modelMatrix * vec4(position,1.0);
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vViewDir = normalize(cameraPosition - wp.xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const planetFrag = /* glsl */ `
uniform float uTime; uniform vec3 uSun;
varying vec3 vNormalW; varying vec3 vPos; varying vec3 vViewDir;
${NOISE}
void main(){
  vec3 p = normalize(vPos);
  // turbulent latitude bands
  float warp = fbm(p*3.0 + vec3(0.0, uTime*0.015, 0.0));
  float lat = p.y + (warp-0.5)*0.22;
  float bands = 0.5 + 0.5*sin(lat*22.0 + fbm(p*6.0)*3.0);
  float fine = fbm(vec3(p.x*2.0, lat*18.0, p.z*2.0) + uTime*0.01);
  // a single great storm, slightly south of the equator
  vec3 stormC = normalize(vec3(0.72, -0.28, 0.63));
  float sd = distance(p, stormC);
  float storm = smoothstep(0.26, 0.0, sd);
  float swirl = fbm(p*14.0 + vec3(sd*20.0 - uTime*0.15));

  vec3 deep   = vec3(0.035,0.045,0.14);
  vec3 indigo = vec3(0.13,0.12,0.40);
  vec3 violet = vec3(0.30,0.22,0.66);
  vec3 lilac  = vec3(0.66,0.58,0.93);
  vec3 gold   = vec3(0.86,0.70,0.45);
  vec3 col = mix(deep, indigo, bands);
  col = mix(col, violet, smoothstep(0.45,0.85,fine)*0.8);
  col = mix(col, lilac, smoothstep(0.72,0.95,fine*bands)*0.5);
  col = mix(col, mix(gold, lilac, swirl), storm*0.75);

  vec3 N = normalize(vNormalW);
  float ndl = dot(N, uSun);
  float day = smoothstep(-0.15, 0.45, ndl);
  float terminator = smoothstep(0.25, 0.0, abs(ndl)) * 0.6;
  float rim = pow(1.0 - max(dot(N, vViewDir), 0.0), 3.0);
  vec3 lit = col * (0.06 + day*1.15);
  lit += gold * terminator * 0.18;                       // warm dusk line
  lit += vec3(0.62,0.52,1.0) * rim * (0.25 + day*0.55);  // atmospheric scattering at the limb
  lit += vec3(1.0,0.9,0.7) * pow(max(ndl,0.0), 24.0) * 0.12; // soft specular
  gl_FragColor = vec4(lit, 1.0);
}`;

const cloudFrag = /* glsl */ `
uniform float uTime; uniform vec3 uSun;
varying vec3 vNormalW; varying vec3 vPos; varying vec3 vViewDir;
${NOISE}
void main(){
  vec3 p = normalize(vPos);
  float c = fbm(vec3(p.x*3.0, p.y*9.0, p.z*3.0) + vec3(uTime*0.03, 0.0, 0.0));
  float a = smoothstep(0.58, 0.82, c) * 0.42;
  float day = smoothstep(-0.1, 0.5, dot(normalize(vNormalW), uSun));
  gl_FragColor = vec4(vec3(0.85,0.82,1.0) * (0.1 + day), a * (0.25 + day*0.75));
}`;

const atmoFrag = /* glsl */ `
uniform vec3 uSun; uniform float uPower; uniform float uStrength; uniform float uBack;
varying vec3 vNormalW; varying vec3 vPos; varying vec3 vViewDir;
void main(){
  vec3 N = normalize(vNormalW);
  float d = dot(N, vViewDir);
  // front shell: limb brightening over the planet; back shell: halo that fades to nothing at its edge
  float f = uBack > 0.5 ? pow(clamp(-d, 0.0, 1.0), uPower) : pow(1.0 - abs(d), uPower);
  float sun = 0.35 + 0.65*smoothstep(-0.4, 0.6, dot(N, uSun));
  // alpha carries the intensity so the transparent canvas stays clear where the glow is dim
  gl_FragColor = vec4(vec3(0.55,0.45,1.0), clamp(f * uStrength * sun, 0.0, 1.0));
}`;

const ringVert = /* glsl */ `
varying vec3 vLocal; varying vec3 vWorld;
void main(){ vLocal = position; vec4 wp = modelMatrix*vec4(position,1.0); vWorld = wp.xyz; gl_Position = projectionMatrix*viewMatrix*wp; }`;
const ringFrag = /* glsl */ `
uniform float uInner; uniform float uOuter; uniform vec3 uSun;
varying vec3 vLocal; varying vec3 vWorld;
${NOISE}
void main(){
  float r = (length(vLocal.xy) - uInner) / (uOuter - uInner); // radius across the ring → 0..1
  if (r < 0.0 || r > 1.0) discard;
  float bands = 0.55 + 0.45*sin(r*90.0 + noise(vec3(r*40.0))*4.0);
  float gaps = smoothstep(0.30,0.33,r)*(1.0-smoothstep(0.36,0.39,r)); // Cassini-like gap
  float edge = smoothstep(0.0,0.08,r) * (1.0 - smoothstep(0.86,1.0,r));
  float a = edge * bands * (1.0 - gaps*0.9) * 0.55;
  vec3 col = mix(vec3(0.86,0.70,0.45), vec3(0.66,0.56,0.95), smoothstep(0.2,0.9,r));
  float side = 0.55 + 0.45*max(dot(normalize(vWorld), uSun), 0.0);
  gl_FragColor = vec4(col * side, a);
}`;

const SUN = new THREE.Vector3(-0.65, 0.4, 0.65).normalize();

function Planet({ reduce }: { reduce: boolean }) {
  const root = useRef<THREE.Group>(null);
  const tilt = useRef<THREE.Group>(null);
  const surface = useRef<THREE.Mesh>(null);
  const clouds = useRef<THREE.Mesh>(null);
  const dust = useRef<THREE.Points>(null);
  const planetMat = useRef<THREE.ShaderMaterial>(null);
  const cloudMat = useRef<THREE.ShaderMaterial>(null);
  const spinBoost = useRef(0);
  const lastScroll = useRef(0);

  const u = useMemo(() => ({
    planet: { uTime: { value: 0 }, uSun: { value: SUN } },
    clouds: { uTime: { value: 0 }, uSun: { value: SUN } },
    glowIn: { uSun: { value: SUN }, uPower: { value: 2.6 }, uStrength: { value: 0.55 }, uBack: { value: 0 } },
    glowOut: { uSun: { value: SUN }, uPower: { value: 2.2 }, uStrength: { value: 0.95 }, uBack: { value: 1 } },
    ring: { uInner: { value: 2.0 }, uOuter: { value: 2.95 }, uSun: { value: SUN } },
  }), []);

  const dustGeo = useMemo(() => {
    const n = 900;
    const pos = new Float32Array(n * 3);
    let seed = 11;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2;
      const r = 2.05 + Math.pow(rnd(), 0.7) * 1.3;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = (rnd() - 0.5) * 0.06;
      pos[i * 3 + 2] = Math.sin(a) * r;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  useEffect(() => () => dustGeo.dispose(), [dustGeo]);

  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const t = state.clock.elapsedTime;
    // scroll-linked spin: velocity of the page adds a decaying boost
    const sy = window.scrollY;
    spinBoost.current = Math.min(2.5, spinBoost.current * 0.92 + Math.abs(sy - lastScroll.current) * 0.004);
    lastScroll.current = sy;
    const speed = reduce ? 0 : 0.11 + spinBoost.current * 0.6;
    if (surface.current) surface.current.rotation.y += dt * speed;
    if (clouds.current) clouds.current.rotation.y += dt * speed * 1.35;
    if (dust.current) dust.current.rotation.y += dt * (reduce ? 0 : 0.035 + spinBoost.current * 0.1);
    if (planetMat.current) planetMat.current.uniforms.uTime.value = t;
    if (cloudMat.current) cloudMat.current.uniforms.uTime.value = t;
    if (root.current) {
      // intro: ease from 82% to 100% over ~2.4 s
      const k = reduce ? 1 : 1 - Math.pow(1 - Math.min(1, t / 2.4), 3);
      root.current.scale.setScalar(0.82 + 0.18 * k);
      root.current.position.y = Math.sin(t * 0.35) * 0.05;
    }
    if (tilt.current) {
      tilt.current.rotation.x += (state.pointer.y * 0.1 - tilt.current.rotation.x) * 0.04;
      tilt.current.rotation.y += (state.pointer.x * 0.16 - tilt.current.rotation.y) * 0.04;
    }
  });

  return (
    <group ref={root}>
      <group ref={tilt}>
        <group rotation={[0.18, 0, -0.32]}>
          <mesh ref={surface}>
            <sphereGeometry args={[1.55, 96, 96]} />
            <shaderMaterial ref={planetMat} vertexShader={sphereVert} fragmentShader={planetFrag} uniforms={u.planet} />
          </mesh>
          <mesh ref={clouds} scale={1.012}>
            <sphereGeometry args={[1.55, 64, 64]} />
            <shaderMaterial ref={cloudMat} vertexShader={sphereVert} fragmentShader={cloudFrag} uniforms={u.clouds} transparent depthWrite={false} />
          </mesh>
          <mesh scale={1.03}>
            <sphereGeometry args={[1.55, 48, 48]} />
            <shaderMaterial vertexShader={sphereVert} fragmentShader={atmoFrag} uniforms={u.glowIn} blending={THREE.AdditiveBlending} transparent depthWrite={false} />
          </mesh>
          <mesh scale={1.22}>
            <sphereGeometry args={[1.55, 48, 48]} />
            <shaderMaterial vertexShader={sphereVert} fragmentShader={atmoFrag} uniforms={u.glowOut} blending={THREE.AdditiveBlending} side={THREE.BackSide} transparent depthWrite={false} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[2.0, 2.95, 160, 1]} />
            <shaderMaterial vertexShader={ringVert} fragmentShader={ringFrag} uniforms={u.ring} side={THREE.DoubleSide} transparent depthWrite={false} />
          </mesh>
          <points ref={dust} geometry={dustGeo}>
            <pointsMaterial size={0.018} color="#F1DCAE" transparent opacity={0.75} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
          </points>
        </group>
        <Moon orbit={2.95} r={0.12} color="#C9B8FF" speed={0.16} phase={0.6} incline={0.25} />
        <Moon orbit={3.1} r={0.085} color="#E8CF9C" speed={0.1} phase={3.2} incline={-0.18} />
      </group>
    </group>
  );
}

function Moon({ orbit, r, color, speed, phase, incline }: { orbit: number; r: number; color: string; speed: number; phase: number; incline: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    if (!ref.current) return;
    const a = phase + s.clock.elapsedTime * speed;
    ref.current.position.set(Math.cos(a) * orbit, Math.sin(a) * orbit * incline, Math.sin(a) * orbit * 0.55 - 0.6);
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[r, 32, 32]} />
      <meshStandardMaterial color={color} roughness={0.85} emissive={color} emissiveIntensity={0.35} />
    </mesh>
  );
}

export default function HeroPlanet3D({ onFail, allowSoftware = false }: { onFail?: () => void; allowSoftware?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [reduce] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  // Render frames only while the hero is on screen and the tab is visible.
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting && !document.hidden), { threshold: 0.01 });
    io.observe(el);
    const onVis = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => { io.disconnect(); document.removeEventListener("visibilitychange", onVis); };
  }, []);
  return (
    <div ref={host} className="h-full w-full animate-[planet-in_1.6s_var(--ease-cosmic)_both]">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0.3, 8.6], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: "default", failIfMajorPerformanceCaveat: !allowSoftware }}
        frameloop={visible ? "always" : "never"}
        onCreated={({ gl }) => {
          // If the GPU drops the context (driver reset, memory pressure), fall back to the CSS planet.
          gl.domElement.addEventListener("webglcontextlost", (e) => { e.preventDefault(); onFail?.(); }, { once: true });
        }}
      >
        <ambientLight intensity={0.2} />
        <directionalLight position={[-4, 2.5, 4]} intensity={1.3} color="#FFF1DA" />
        <Planet reduce={reduce} />
      </Canvas>
    </div>
  );
}
