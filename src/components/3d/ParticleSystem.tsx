// src/components/3d/ParticleSystem.tsx
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Points } from '@react-three/drei';
import * as THREE from 'three';

interface ParticleSystemProps {
  count?: number;
  color?: string;
  size?: number;
  spread?: number;
  speed?: number;
}

export const ParticleSystem: React.FC<ParticleSystemProps> = ({
  count = 100,
  color = '#1fa463',
  size = 0.02,
  spread = 3,
  speed = 0.5,
}) => {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i++) {
      pos[i] = (Math.random() - 0.5) * spread;
      vel[i] = (Math.random() - 0.5) * speed;
    }

    return { positions: pos, velocities: vel };
  }, [count, spread, speed]);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
      const time = state.clock.elapsedTime;

      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += Math.sin(time + positions[i + 1] * 2) * 0.002;
        positions[i + 1] += Math.cos(time + positions[i] * 2) * 0.002;
        positions[i + 2] += Math.sin(time * 0.5 + positions[i + 1] * 1.5) * 0.002;

        for (let j = 0; j < 3; j++) {
          if (Math.abs(positions[i + j]) > spread / 2) {
            positions[i + j] *= -0.9;
          }
        }
      }

      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  // Create buffer geometry
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [positions]);

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        color={color}
        size={size}
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};