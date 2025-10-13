import { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Float, MeshDistortMaterial, Stars, OrbitControls, Sparkles } from '@react-three/drei';
import { useSocket } from '../../context/SocketContext';
import gsap from 'gsap';
import * as THREE from 'three';

// Floating particles in background
function Particles() {
  const count = 100;
  const mesh = useRef();

  const particles = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i++) {
    particles[i] = (Math.random() - 0.5) * 20;
  }

  useFrame((state) => {
    mesh.current.rotation.x = state.clock.elapsedTime * 0.05;
    mesh.current.rotation.y = state.clock.elapsedTime * 0.075;
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
        size={0.1}
        color="#ff6b35"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

// 3D Prompt Card
function PromptCard({ prompt, position, index, onTextChange, value }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime + index) * 0.1;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + index) * 0.2;
    }
  });

  useEffect(() => {
    if (meshRef.current) {
      gsap.from(meshRef.current.position, {
        x: position[0] + 10,
        duration: 1.5,
        ease: 'elastic.out(1, 0.5)',
        delay: index * 0.3
      });
      gsap.from(meshRef.current.scale, {
        x: 0,
        y: 0,
        z: 0,
        duration: 1,
        ease: 'back.out(1.7)',
        delay: index * 0.3
      });
    }
  }, []);

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <group ref={meshRef} position={position}>
        {/* Card Background */}
        <mesh
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
          scale={hovered ? [4.2, 2.2, 0.12] : [4, 2, 0.1]}
        >
          <boxGeometry />
          <MeshDistortMaterial
            color={hovered ? '#ff6b35' : '#9b59b6'}
            speed={2}
            distort={0.3}
            radius={1}
          />
        </mesh>

        {/* Number Badge */}
        <mesh position={[-1.5, 0.7, 0.15]}>
          <sphereGeometry args={[0.3, 32, 32]} />
          <meshStandardMaterial color="#e74c3c" emissive="#e74c3c" emissiveIntensity={0.5} />
        </mesh>
        <Text
          position={[-1.5, 0.7, 0.2]}
          fontSize={0.3}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {index + 1}
        </Text>

        {/* Prompt Text */}
        <Text
          position={[0, 0.5, 0.15]}
          fontSize={0.15}
          maxWidth={3.5}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {prompt}
        </Text>

        {/* Answer Preview (simplified as 3D text) */}
        <Text
          position={[0, -0.3, 0.15]}
          fontSize={0.12}
          maxWidth={3.5}
          color={value ? '#ffffff' : '#888888'}
          anchorX="center"
          anchorY="middle"
        >
          {value || 'Type je antwoord...'}
        </Text>
      </group>
    </Float>
  );
}

// Submit Button 3D
function SubmitButton3D({ onClick, enabled }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current && enabled) {
      meshRef.current.rotation.y = state.clock.elapsedTime;
      meshRef.current.scale.x = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      meshRef.current.scale.y = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      meshRef.current.scale.z = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  return (
    <Float speed={3} rotationIntensity={1} floatIntensity={1}>
      <mesh
        ref={meshRef}
        position={[0, -3.5, 0]}
        onClick={enabled ? onClick : undefined}
        onPointerOver={() => enabled && setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={hovered ? [2.2, 0.7, 0.7] : [2, 0.6, 0.6]}
      >
        <boxGeometry />
        <meshStandardMaterial
          color={enabled ? (hovered ? '#ff6b35' : '#e74c3c') : '#555555'}
          emissive={enabled ? '#ff6b35' : '#000000'}
          emissiveIntensity={hovered ? 0.8 : 0.3}
        />
      </mesh>
      <Text
        position={[0, -3.5, 0.4]}
        fontSize={0.25}
        color="white"
        anchorX="center"
        anchorY="middle"
        font="/fonts/Inter-Bold.ttf"
      >
        🚀 VERSTUUR
      </Text>
      {enabled && <Sparkles position={[0, -3.5, 0]} count={30} scale={3} size={2} speed={0.5} />}
    </Float>
  );
}

// Success Animation
function SuccessAnimation() {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 2;
      meshRef.current.scale.x = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.2;
      meshRef.current.scale.y = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.2;
    }
  });

  return (
    <>
      <mesh ref={meshRef}>
        <torusGeometry args={[2, 0.5, 16, 100]} />
        <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={1} />
      </mesh>
      <Text fontSize={1} color="white" anchorX="center" anchorY="middle" font="/fonts/Inter-Bold.ttf">
        ✅ VERSTUURD!
      </Text>
      <Sparkles count={50} scale={10} size={4} speed={1} />
    </>
  );
}

// Main Scene
function Scene({ prompts, answers, setAnswers, submitted, onSubmit }) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#ff6b35" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#9b59b6" />
      <spotLight position={[0, 10, 0]} angle={0.3} penumbra={1} intensity={1} color="#ffffff" />

      {/* Background */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <Particles />

      {submitted ? (
        <SuccessAnimation />
      ) : (
        <>
          {/* Prompt Cards */}
          {prompts.map((prompt, idx) => (
            <PromptCard
              key={idx}
              prompt={prompt}
              position={[0, idx * 2.5 - 0.5, 0]}
              index={idx}
              value={answers[idx]}
            />
          ))}

          {/* Submit Button */}
          <SubmitButton3D
            onClick={onSubmit}
            enabled={answers.every(a => a.trim())}
          />

          {/* Title */}
          <Text
            position={[0, 3.5, 0]}
            fontSize={0.4}
            color="#ff6b35"
            anchorX="center"
            anchorY="middle"
            >
            QUIPLASH - BEANTWOORD DE VRAGEN!
          </Text>
        </>
      )}
    </>
  );
}

export default function QuiplashInput3D({ prompts, playerId }) {
  const { submitInput } = useSocket();
  const [answers, setAnswers] = useState(['', '']);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [showInput, setShowInput] = useState(0);

  const handleSubmit = () => {
    setError('');

    if (!answers[0].trim() || !answers[1].trim()) {
      setError('Vul beide vragen in!');
      return;
    }

    submitInput({ answers }, (response) => {
      if (response.success) {
        setSubmitted(true);
      } else {
        setError(response.error || 'Failed to submit');
      }
    });
  };

  return (
    <div className="relative w-full h-screen">
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0, 8], fov: 75 }}
        style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}
      >
        <Scene
          prompts={prompts}
          answers={answers}
          setAnswers={setAnswers}
          submitted={submitted}
          onSubmit={handleSubmit}
        />
      </Canvas>

      {/* 2D Input Overlay */}
      {!submitted && (
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center gap-8 p-4">
          {prompts.map((prompt, idx) => (
            <div
              key={idx}
              className="w-full max-w-2xl pointer-events-auto"
              style={{
                marginTop: idx === 0 ? '20vh' : '0',
                marginBottom: idx === prompts.length - 1 ? '20vh' : '0'
              }}
            >
              <textarea
                value={answers[idx]}
                onChange={(e) => {
                  const newAnswers = [...answers];
                  newAnswers[idx] = e.target.value;
                  setAnswers(newAnswers);
                }}
                placeholder="Type hier je hilarische antwoord..."
                className="w-full h-32 px-5 py-4 rounded-xl bg-gray-900/80 backdrop-blur-md border-2 border-purple-400/50 text-white placeholder-gray-500 text-lg font-medium focus:outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-400/30 transition-all resize-none"
                maxLength={100}
                required
              />
              <div className="flex justify-between items-center mt-2 px-2">
                <div className="text-sm text-gray-400 font-medium">
                  {answers[idx].length > 0 ? '💭 Goed bezig!' : '✍️ Begin met typen...'}
                </div>
                <div className={`text-sm font-bold ${answers[idx].length > 90 ? 'text-red-400' : 'text-purple-400'}`}>
                  {answers[idx].length}/100
                </div>
              </div>
            </div>
          ))}
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
