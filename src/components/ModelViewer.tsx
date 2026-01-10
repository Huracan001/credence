"use client";

import { Suspense, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useFBX } from "@react-three/drei";
import * as THREE from "three";

function Model({ url }: { url: string }) {
  const fbx = useFBX(url);
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  // Center and scale the model
  if (fbx) {
    const box = new THREE.Box3().setFromObject(fbx);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 2 / maxDim;
    
    fbx.scale.setScalar(scale);
    fbx.position.sub(center.multiplyScalar(scale));
  }

  return (
    <primitive
      ref={meshRef}
      object={fbx}
      position={[0, 0, 0]}
    />
  );
}

function LoadingFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-[#00d9ff] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-[#6b7280] uppercase tracking-wider">Loading Model...</p>
      </div>
    </div>
  );
}

export function ModelViewer() {
  const [error, setError] = useState(false);

  return (
    <div className="w-full h-full bg-[#0a0a0f] rounded-lg overflow-hidden border border-[#1a1f2e] relative">
      {error ? (
        <div className="w-full h-full flex items-center justify-center">
          <p className="text-sm text-[#6b7280] text-center px-4">
            Unable to load 3D model.<br />
            <span className="text-xs">Please check if the file exists.</span>
          </p>
        </div>
      ) : (
        <Canvas
          camera={{ position: [0, 0, 5], fov: 50 }}
          gl={{ antialias: true, alpha: true }}
          onError={() => setError(true)}
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 10, 5]} intensity={1.2} />
          <pointLight position={[-10, -10, -5]} intensity={0.8} color="#00d9ff" />
          <Suspense fallback={null}>
            <Model url="/akashi-bow.fbx" />
          </Suspense>
          <OrbitControls
            enableZoom={true}
            enablePan={false}
            enableRotate={true}
            minDistance={2}
            maxDistance={10}
            autoRotate={true}
            autoRotateSpeed={0.5}
          />
        </Canvas>
      )}
    </div>
  );
}
