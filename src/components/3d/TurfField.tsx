// src/components/3d/TurfField.tsx
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Plane, Box, Cylinder } from '@react-three/drei';
import { Mesh } from 'three';

interface TurfFieldProps {
  scale?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

export const TurfField: React.FC<TurfFieldProps> = ({
  scale = 1,
  position = [0, 0, 0],
  rotation = [-Math.PI / 2, 0, 0],
}) => {
  const fieldRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (fieldRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 0.5) * 0.02 + 0.02;
      // @ts-ignore
      fieldRef.current.material.emissiveIntensity = pulse;
    }
  });

  const GoalPost = ({ position }: { position: [number, number, number] }) => (
    <group position={position}>
      <Box args={[0.08, 0.6, 0.08]} position={[0, 0.3, 0]}>
        <meshStandardMaterial color="#ffffff" metalness={0.8} roughness={0.2} />
      </Box>
      <Box args={[0.5, 0.08, 0.08]} position={[0, 0.6, 0]}>
        <meshStandardMaterial color="#ffffff" metalness={0.8} roughness={0.2} />
      </Box>
    </group>
  );

  const PitchMarkings = () => (
    <group>
      <Cylinder args={[0.3, 0.3, 0.01, 32]} position={[0, 0.005, 0]}>
        <meshStandardMaterial color="#ffffff" transparent opacity={0.3} wireframe />
      </Cylinder>
      <Box args={[1.2, 0.01, 0.02]} position={[0, 0.005, 0]}>
        <meshStandardMaterial color="#ffffff" transparent opacity={0.3} />
      </Box>
    </group>
  );

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <Plane
        ref={fieldRef}
        args={[3, 2]}
        position={[0, 0, 0]}
      >
        <meshStandardMaterial
          color="#2d8a4e"
          roughness={0.8}
          metalness={0.1}
          emissive="#1a6b36"
          emissiveIntensity={0.02}
        />
      </Plane>

      {[-1.2, -0.6, 0, 0.6, 1.2].map((x, i) => (
        <Plane
          key={i}
          args={[0.08, 2.1]}
          position={[x, 0.001, 0]}
        >
          <meshStandardMaterial
            color="#3a9e5e"
            transparent
            opacity={0.3}
          />
        </Plane>
      ))}

      <PitchMarkings />
      <GoalPost position={[-1.5, 0.2, 0]} />
      <GoalPost position={[1.5, 0.2, 0]} />

      {[
        [-1.5, -1],
        [-1.5, 1],
        [1.5, -1],
        [1.5, 1],
      ].map((pos, i) => (
        <Cylinder
          key={i}
          args={[0.015, 0.015, 0.15]}
          position={[pos[0], 0.075, pos[1]]}
        >
          <meshStandardMaterial color="#ff0000" />
        </Cylinder>
      ))}
    </group>
  );
};