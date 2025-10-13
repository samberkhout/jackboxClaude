import { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Float, MeshDistortMaterial, Stars, Sparkles, RoundedBox } from '@react-three/drei';
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';
import { useSocket } from '../../context/SocketContext';
import gsap from 'gsap';
import * as THREE from 'three';

// Floating particles
function Particles() {
  const count = 150;
  const mesh = useRef();

  const particles = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i++) {
    particles[i] = (Math.random() - 0.5) * 25;
  }

  useFrame((state) => {
    mesh.current.rotation.y = state.clock.elapsedTime * 0.05;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        color="#00d9ff"
        transparent
        opacity={0.7}
        sizeAttenuation
      />
    </points>
  );
}

// Prompt Display with Animation
function PromptDisplay({ prompt, matchupIndex, totalMatchups }) {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = 3 + Math.sin(state.clock.elapsedTime) * 0.1;
    }
  });

  return (
    <group ref={meshRef} position={[0, 3, 0]}>
      {/* Badge */}
      <mesh position={[0, 0.8, 0]}>
        <capsuleGeometry args={[0.3, 1, 8, 16]} />
        <meshStandardMaterial color="#00d9ff" emissive="#00d9ff" emissiveIntensity={0.8} />
      </mesh>
      <Text
        position={[0, 0.8, 0.35]}
        fontSize={0.2}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {matchupIndex + 1}/{totalMatchups}
      </Text>

      {/* Prompt Card */}
      <RoundedBox args={[5, 1.5, 0.2]} radius={0.1} smoothness={4}>
        <MeshDistortMaterial
          color="#9b59b6"
          speed={2}
          distort={0.2}
          radius={1}
        />
      </RoundedBox>
      <Text
        position={[0, 0, 0.15]}
        fontSize={0.25}
        maxWidth={4.5}
        color="white"
        anchorX="center"
        anchorY="middle"
        textAlign="center"
      >
        {prompt}
      </Text>

      {/* Sparkles around prompt */}
      <Sparkles count={20} scale={6} size={2} speed={0.3} />
    </group>
  );
}

// Physics-based Vote Button
function VoteButton({ answer, position, color, label, onClick, emissiveColor }) {
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const rigidBodyRef = useRef();
  const textRef = useRef();

  useEffect(() => {
    if (rigidBodyRef.current) {
      gsap.from(rigidBodyRef.current.translation(), {
        y: position[1] + 5,
        duration: 1.2,
        ease: 'bounce.out',
        delay: label === 'A' ? 0 : 0.3
      });
    }
  }, []);

  const handleClick = () => {
    if (rigidBodyRef.current && !clicked) {
      setClicked(true);
      // Apply impulse for physics effect
      rigidBodyRef.current.applyImpulse({ x: 0, y: 5, z: 0 }, true);

      setTimeout(() => {
        onClick();
      }, 300);
    }
  };

  useFrame((state) => {
    if (textRef.current && !clicked) {
      textRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.05;
    }
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={position}
      type="dynamic"
      colliders={false}
      gravityScale={clicked ? 0.5 : 0}
    >
      <CuboidCollider args={[2, 0.8, 0.3]} />

      <Float speed={2} rotationIntensity={0.3} floatIntensity={0.3} enabled={!clicked}>
        <group>
          {/* Button Body */}
          <RoundedBox
            args={[4, 1.6, 0.6]}
            radius={0.2}
            smoothness={4}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
            onClick={handleClick}
            scale={hovered ? [1.05, 1.05, 1.05] : [1, 1, 1]}
          >
            <meshStandardMaterial
              color={color}
              emissive={emissiveColor}
              emissiveIntensity={hovered ? 1 : 0.4}
              roughness={0.3}
              metalness={0.8}
            />
          </RoundedBox>

          {/* Letter Badge */}
          <mesh position={[-1.5, 0, 0.35]}>
            <sphereGeometry args={[0.35, 32, 32]} />
            <meshStandardMaterial
              color={emissiveColor}
              emissive={emissiveColor}
              emissiveIntensity={1}
            />
          </mesh>
          <Text
            position={[-1.5, 0, 0.4]}
            fontSize={0.35}
            color="white"
            anchorX="center"
            anchorY="middle"
              >
            {label}
          </Text>

          {/* Answer Text */}
          <Text
            ref={textRef}
            position={[0.3, 0, 0.35]}
            fontSize={0.18}
            maxWidth={2.8}
            color="white"
            anchorX="center"
            anchorY="middle"
                textAlign="center"
          >
            {answer}
          </Text>

          {/* Hover effect */}
          {hovered && (
            <>
              <Sparkles count={15} scale={5} size={3} speed={0.5} />
              <Text
                position={[1.8, 0, 0.35]}
                fontSize={0.4}
                color="white"
                anchorX="center"
                anchorY="middle"
              >
                👈
              </Text>
            </>
          )}
        </group>
      </Float>
    </RigidBody>
  );
}

// VS Divider
function VSDivider() {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 2) * 0.1;
      meshRef.current.scale.x = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      <mesh ref={meshRef}>
        <torusGeometry args={[0.6, 0.15, 16, 32]} />
        <meshStandardMaterial color="#ff006e" emissive="#ff006e" emissiveIntensity={1} />
      </mesh>
      <Text
        fontSize={0.5}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        VS
      </Text>
      <Sparkles count={30} scale={3} size={2} speed={0.5} />
    </group>
  );
}

// Waiting/Participant Screen
function WaitingScreen({ isParticipant }) {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime;
      meshRef.current.scale.x = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
      meshRef.current.scale.y = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
    }
  });

  return (
    <>
      <mesh ref={meshRef}>
        <torusKnotGeometry args={[1.5, 0.4, 100, 16]} />
        <meshStandardMaterial
          color={isParticipant ? '#ffd60a' : '#00d9ff'}
          emissive={isParticipant ? '#ffd60a' : '#00d9ff'}
          emissiveIntensity={1}
        />
      </mesh>
      <Text
        position={[0, -2, 0]}
        fontSize={0.6}
        color="white"
        anchorX="center"
        anchorY="middle"
        textAlign="center"
      >
        {isParticipant ? '🎨 DIT IS JOUW VRAAG!' : '🗳️ GESTEMD!'}
      </Text>
      <Text
        position={[0, -3, 0]}
        fontSize={0.3}
        color="#aaaaaa"
        anchorX="center"
        anchorY="middle"
      >
        Wachten op anderen...
      </Text>
      <Sparkles count={50} scale={15} size={4} speed={0.8} />
    </>
  );
}

// Main Scene
function Scene({ currentMatchup, playerId, voted, isParticipant, onVote, matchupIndex, totalMatchups }) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#00d9ff" />
      <pointLight position={[-10, 10, -10]} intensity={1} color="#ff006e" />
      <spotLight position={[0, 15, 0]} angle={0.3} penumbra={1} intensity={2} color="#ffffff" />

      {/* Background */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <Particles />

      {(isParticipant || voted) ? (
        <WaitingScreen isParticipant={isParticipant} />
      ) : (
        <Physics gravity={[0, -9.8, 0]}>
          {/* Prompt */}
          <PromptDisplay
            prompt={currentMatchup.prompt}
            matchupIndex={matchupIndex}
            totalMatchups={totalMatchups}
          />

          {/* Vote Buttons */}
          <VoteButton
            answer={currentMatchup.optionA.answer}
            position={[0, 0.8, 0]}
            color="#ff6b35"
            emissiveColor="#ff4500"
            label="A"
            onClick={() => onVote('A')}
          />

          <VSDivider />

          <VoteButton
            answer={currentMatchup.optionB.answer}
            position={[0, -0.8, 0]}
            color="#a855f7"
            emissiveColor="#9333ea"
            label="B"
            onClick={() => onVote('B')}
          />

          {/* Invisible floor for physics */}
          <RigidBody type="fixed" position={[0, -10, 0]}>
            <CuboidCollider args={[20, 0.5, 20]} />
          </RigidBody>
        </Physics>
      )}
    </>
  );
}

export default function QuiplashVote3D({ matchups, playerId, currentMatchupIndex }) {
  const { submitVote } = useSocket();
  const [voted, setVoted] = useState(false);
  const [error, setError] = useState('');

  if (!matchups || matchups.length === 0 || currentMatchupIndex >= matchups.length) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900">
        <div className="text-center">
          <div className="text-8xl mb-6 animate-spin">⏳</div>
          <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
            LADEN...
          </h2>
        </div>
      </div>
    );
  }

  const currentMatchup = matchups[currentMatchupIndex];
  const isParticipant =
    currentMatchup.optionA.playerId === playerId ||
    currentMatchup.optionB.playerId === playerId;

  const handleVote = (choice) => {
    setError('');

    submitVote(currentMatchup.id, choice, (response) => {
      if (response.success) {
        setVoted(true);
        setTimeout(() => setVoted(false), 100);
      } else {
        setError(response.error || 'Failed to vote');
      }
    });
  };

  return (
    <div className="relative w-full h-screen">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 75 }}
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)' }}
      >
        <Scene
          currentMatchup={currentMatchup}
          playerId={playerId}
          voted={voted}
          isParticipant={isParticipant}
          onVote={handleVote}
          matchupIndex={currentMatchupIndex}
          totalMatchups={matchups.length}
        />
      </Canvas>

      {/* Instruction Text */}
      {!isParticipant && !voted && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="px-8 py-4 rounded-2xl bg-cyan-500/20 backdrop-blur-md border-2 border-cyan-400/50 text-white text-xl font-bold animate-pulse">
            💡 Klik op het beste antwoord!
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="px-6 py-3 rounded-2xl bg-red-500/90 backdrop-blur-md border-2 border-red-400 text-white text-lg font-bold animate-shake">
            ⚠️ {error}
          </div>
        </div>
      )}
    </div>
  );
}
