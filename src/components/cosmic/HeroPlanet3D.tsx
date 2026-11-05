"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * Cinematic hero planet: procedural surface shader (fbm noise bands), fresnel atmosphere,
 * gold orbital arcs and two distant moons. One draw-call-light scene, DPR capped at 1.75.
 */
const planetVert = /* glsl */ `
varying vec3 vNormal; varying vec3 vPos; varying vec2 vUv;
void main(){ vUv = uv; vNormal = normalize(normalMatrix * normal); vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const planetFrag = /* glsl */ `
uniform float uTime; varying vec3 vNormal; varying vec3 vPos; varying vec2 vUv;
float hash(vec3 p){ p = fract(p*0.3183099+.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float noise(vec3 x){ vec3 i=floor(x); vec3 f=fract(x); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(hash(i+vec3(0,0,0)),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z); }
float fbm(vec3 p){ float v=0.0; float a=0.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.03; a*=0.5; } return v; }
void main(){
  vec3 p = vPos*2.2;
  float bands = sin(vPos.y*9.0 + fbm(p + vec3(uTime*0.02,0.0,0.0))*4.0);
  float n = fbm(p*1.6 + bands*0.35);
  vec3 deep = vec3(0.04,0.05,0.16);
  vec3 violet = vec3(0.22,0.17,0.55);
  vec3 lilac = vec3(0.55,0.47,0.85);
  vec3 col = mix(deep, violet, smoothstep(0.25,0.75,n));
  col = mix(col, lilac, smoothstep(0.62,0.9,n)*0.55);
  vec3 L = normalize(vec3(-0.6,0.45,0.7));
  float diff = clamp(dot(vNormal,L),0.0,1.0);
  float rim = pow(1.0 - max(dot(vNormal, vec3(0,0,1)),0.0), 2.5);
  vec3 lit = col*(0.12 + diff*1.1) + vec3(0.6,0.5,0.95)*rim*0.3;
  lit += vec3(0.85,0.7,0.45)*pow(diff,18.0)*0.25;
  gl_FragColor = vec4(lit,1.0);
}`;
const atmoFrag = /* glsl */ `
varying vec3 vNormal;
void main(){ float i = pow(max(0.0, 0.66 - dot(vNormal, vec3(0,0,1.0))), 3.4); gl_FragColor = vec4(0.5,0.4,0.95,1.0)*i*0.75; }`;
const atmoVert = /* glsl */ `varying vec3 vNormal; void main(){ vNormal = normalize(normalMatrix*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`;

function Planet() {
  const mesh = useRef<THREE.Mesh>(null);
  const group = useRef<THREE.Group>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  useFrame((state, dt) => {
    if (material.current) material.current.uniforms.uTime.value += dt;
    if (mesh.current) mesh.current.rotation.y += dt * 0.05;
    if (group.current) {
      group.current.rotation.x += (state.pointer.y * 0.12 - group.current.rotation.x) * 0.03;
      group.current.rotation.y += (state.pointer.x * 0.18 - group.current.rotation.y) * 0.03;
    }
  });
  const arcs = useMemo(() => {
    return [2.2, 2.75].map((r, i) => {
      const pts = new THREE.EllipseCurve(0, 0, r, r, 0, 2 * Math.PI, false, 0).getPoints(240);
      const g = new THREE.BufferGeometry().setFromPoints(pts.map((p) => new THREE.Vector3(p.x, p.y, 0)));
      return { g, opacity: i ? 0.28 : 0.6 };
    });
  }, []);
  return (
    <group ref={group}>
      <mesh ref={mesh}>
        <sphereGeometry args={[1.55, 96, 96]} />
        <shaderMaterial ref={material} vertexShader={planetVert} fragmentShader={planetFrag} uniforms={uniforms} />
      </mesh>
      <mesh scale={1.17}>
        <sphereGeometry args={[1.55, 64, 64]} />
        <shaderMaterial vertexShader={atmoVert} fragmentShader={atmoFrag} blending={THREE.AdditiveBlending} side={THREE.BackSide} transparent depthWrite={false} />
      </mesh>
      {arcs.map((a, i) => (
        <group key={i} rotation={[Math.PI / 2 - 0.22, 0.05, -0.28 + i * 0.06]}>
          {/* @ts-expect-error — three line primitive */}
          <line geometry={a.g}>
            <lineBasicMaterial color="#D8B477" transparent opacity={a.opacity} />
          </line>
        </group>
      ))}
      <Moon position={[-2.9, 1.5, -1]} r={0.13} color="#C9B8FF" speed={0.12} />
      <Moon position={[3.4, -1.1, -3]} r={0.1} color="#E8CF9C" speed={0.2} />
    </group>
  );
}

function Moon({ position, r, color, speed }: { position: [number, number, number]; r: number; color: string; speed: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    if (!ref.current) return;
    ref.current.position.y = position[1] + Math.sin(s.clock.elapsedTime * speed) * 0.15;
  });
  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[r, 32, 32]} />
      <meshStandardMaterial color={color} roughness={0.9} emissive={color} emissiveIntensity={0.55} />
    </mesh>
  );
}

export default function HeroPlanet3D() {
  return (
    <Canvas dpr={[1, 1.75]} camera={{ position: [0, 0, 6.2], fov: 42 }} gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }} frameloop="always">
      <ambientLight intensity={0.25} />
      <directionalLight position={[-4, 3, 5]} intensity={1.4} color="#FFF1DA" />
      <Planet />
    </Canvas>
  );
}
