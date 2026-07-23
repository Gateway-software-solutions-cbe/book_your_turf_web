// src/components/3d/SportsBall.tsx
import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';
import { Sphere } from '@react-three/drei';

interface SportsBallProps {
  type?: 'football' | 'basketball' | 'tennis' | 'cricket';
  scale?: number;
  position?: [number, number, number];
  rotationSpeed?: number;
  color?: string;
}

export const SportsBall: React.FC<SportsBallProps> = ({
  type = 'football',
  scale = 1,
  position = [0, 0, 0],
  rotationSpeed = 0.005,
}) => {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += rotationSpeed * delta * 20;
      meshRef.current.rotation.y += rotationSpeed * delta * 30;
      meshRef.current.rotation.z += rotationSpeed * delta * 10;

      // Bobbing effect
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.15;
    }
  });

  const getBallConfig = () => {
    switch (type) {
      case 'football':
        return {
          color: '#ffffff',
          metalness: 0.1,
          roughness: 0.8,
          emissive: '#222222',
          emissiveIntensity: 0.05,
        };
      case 'basketball':
        return {
          color: '#ff6b00',
          metalness: 0.2,
          roughness: 0.7,
          emissive: '#cc5500',
          emissiveIntensity: 0.05,
        };
      case 'tennis':
        return {
          color: '#c8e600',
          metalness: 0.1,
          roughness: 0.6,
          emissive: '#8aa800',
          emissiveIntensity: 0.05,
        };
      case 'cricket':
        return {
          color: '#d4a373',
          metalness: 0.3,
          roughness: 0.5,
          emissive: '#b8895f',
          emissiveIntensity: 0.05,
        };
      default:
        return {
          color: '#ffffff',
          metalness: 0.1,
          roughness: 0.8,
          emissive: '#222222',
          emissiveIntensity: 0.05,
        };
    }
  };

  const config = getBallConfig();

  // Simplified football pattern
  const createFootballPattern = () => {
    if (type !== 'football') return null;
    return (
      <>
        <Sphere args={[0.51, 4, 4]} position={[0.51, 0, 0]}>
          <meshStandardMaterial color="#222" metalness={0.1} roughness={0.8} />
        </Sphere>
        <Sphere args={[0.51, 4, 4]} position={[-0.51, 0, 0]}>
          <meshStandardMaterial color="#222" metalness={0.1} roughness={0.8} />
        </Sphere>
        <Sphere args={[0.51, 4, 4]} position={[0, 0.51, 0]}>
          <meshStandardMaterial color="#222" metalness={0.1} roughness={0.8} />
        </Sphere>
        <Sphere args={[0.51, 4, 4]} position={[0, -0.51, 0]}>
          <meshStandardMaterial color="#222" metalness={0.1} roughness={0.8} />
        </Sphere>
        <Sphere args={[0.51, 4, 4]} position={[0, 0, 0.51]}>
          <meshStandardMaterial color="#222" metalness={0.1} roughness={0.8} />
        </Sphere>
        <Sphere args={[0.51, 4, 4]} position={[0, 0, -0.51]}>
          <meshStandardMaterial color="#222" metalness={0.1} roughness={0.8} />
        </Sphere>
      </>
    );
  };

  return (
    <group position={position} scale={scale}>
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color={config.color}
          metalness={config.metalness}
          roughness={config.roughness}
          emissive={config.emissive}
          emissiveIntensity={hovered ? config.emissiveIntensity * 2 : config.emissiveIntensity}
        />
      </mesh>
      {createFootballPattern()}
      {hovered && <pointLight color={config.color} intensity={0.5} distance={2} />}
    </group>
  );
};