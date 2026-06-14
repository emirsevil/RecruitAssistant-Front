"use client"

import { useRef, useEffect, useMemo, useState, Suspense } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { useGLTF, Environment, ContactShadows } from "@react-three/drei"
import * as THREE from "three"

// ─── Constants ────────────────────────────────────────────────────

const AVATAR_URL = "/avatar.glb"
const AVATAR_APPEARANCE: {
  hiddenMeshes: readonly string[]
  hairMeshNames: readonly string[]
  headTextureMeshNames: readonly string[]
  hairColor: string
} = {
  hiddenMeshes: ["Wolf3D_Facewear", "Wolf3D_Glasses"],
  hairMeshNames: ["Wolf3D_Hair"],
  headTextureMeshNames: ["Wolf3D_Head"],
  hairColor: "#111111",
}

// RPM viseme morph targets (Ready Player Me standard)
const VISEME_TARGETS = {
  aa: "viseme_aa",
  E: "viseme_E",
  I: "viseme_I",
  O: "viseme_O",
  U: "viseme_U",
  jawOpen: "jawOpen",
} as const

// Morph targets for expressions
const EXPRESSION_TARGETS = {
  blinkLeft: "eyeBlinkLeft",
  blinkRight: "eyeBlinkRight",
  mouthSmileLeft: "mouthSmileLeft",
  mouthSmileRight: "mouthSmileRight",
} as const

// ─── Helper: lerp a morph target by name ─────────────────────────

function lerpMorphTarget(
  meshes: THREE.Mesh[],
  name: string,
  target: number,
  speed: number
) {
  for (const mesh of meshes) {
    if (!mesh.morphTargetDictionary || !mesh.morphTargetInfluences) continue
    const index = mesh.morphTargetDictionary[name]
    if (index === undefined) continue
    mesh.morphTargetInfluences[index] = THREE.MathUtils.lerp(
      mesh.morphTargetInfluences[index],
      target,
      speed
    )
  }
}

// ─── Inner: AvatarModel (runs inside Canvas) ─────────────────────

interface AvatarModelProps {
  analyserNode: AnalyserNode | null
  isSpeaking: boolean
}

function hasTextureMap(
  material: THREE.Material
): material is THREE.Material & { map: THREE.Texture } {
  return "map" in material && material.map instanceof THREE.Texture
}

function cloneAndTintMaterial(
  material: THREE.Material,
  hairColor: string
): THREE.Material {
  const clonedMaterial = material.clone()

  if ("color" in clonedMaterial && clonedMaterial.color instanceof THREE.Color) {
    clonedMaterial.color.set(hairColor)
  }

  clonedMaterial.needsUpdate = true
  clonedMaterial.userData = {
    ...clonedMaterial.userData,
    avatarAppearancePatched: true,
  }

  return clonedMaterial
}

function createRecoloredHeadTexture(
  texture: THREE.Texture,
  hairColor: string
): THREE.Texture | null {
  if (typeof document === "undefined") {
    return null
  }

  const image = (
    texture.source?.data ?? texture.image
  ) as (CanvasImageSource & { width: number; height: number }) | undefined

  if (!image || typeof image.width !== "number" || typeof image.height !== "number") {
    return null
  }

  const canvas = document.createElement("canvas")
  canvas.width = image.width
  canvas.height = image.height

  const context = canvas.getContext("2d", { willReadFrequently: true })
  if (!context) {
    return null
  }

  context.drawImage(image, 0, 0, image.width, image.height)

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
  const pixels = imageData.data
  const replacement = new THREE.Color(hairColor)
  const replacementRgb = {
    r: Math.round(replacement.r * 255),
    g: Math.round(replacement.g * 255),
    b: Math.round(replacement.b * 255),
  }
  const scalpCutoffY = canvas.height * 0.35
  const leftBrowRegion = {
    minX: canvas.width * 0.37,
    maxX: canvas.width * 0.49,
    minY: canvas.height * 0.25,
    maxY: canvas.height * 0.31,
  }
  const rightBrowRegion = {
    minX: canvas.width * 0.53,
    maxX: canvas.width * 0.66,
    minY: canvas.height * 0.25,
    maxY: canvas.height * 0.31,
  }

  for (let i = 0; i < pixels.length; i += 4) {
    const pixelIndex = i / 4
    const x = pixelIndex % canvas.width
    const y = Math.floor(pixelIndex / canvas.width)
    const r = pixels[i]
    const g = pixels[i + 1]
    const b = pixels[i + 2]
    const a = pixels[i + 3]

    const isHotPink =
      a > 0 &&
      r > 170 &&
      g < 120 &&
      b > 90 &&
      r - g > 70 &&
      r - b > 20

    const isInBrowRegion =
      ((x >= leftBrowRegion.minX &&
        x <= leftBrowRegion.maxX &&
        y >= leftBrowRegion.minY &&
        y <= leftBrowRegion.maxY) ||
        (x >= rightBrowRegion.minX &&
          x <= rightBrowRegion.maxX &&
          y >= rightBrowRegion.minY &&
          y <= rightBrowRegion.maxY))

    const isBrowTone =
      a > 0 &&
      r > 165 &&
      g < 100 &&
      b > 85 &&
      b < 120 &&
      r - g > 55

    const shouldRecolor =
      (isHotPink && y < scalpCutoffY) ||
      (isInBrowRegion && isBrowTone)

    if (!shouldRecolor) {
      continue
    }

    const brightness = (r + g + b) / (255 * 3)
    const shade = THREE.MathUtils.clamp(0.75 + brightness * 0.5, 0.75, 1.1)

    pixels[i] = Math.round(replacementRgb.r * shade)
    pixels[i + 1] = Math.round(replacementRgb.g * shade)
    pixels[i + 2] = Math.round(replacementRgb.b * shade)
  }

  context.putImageData(imageData, 0, 0)

  const recoloredTexture = new THREE.CanvasTexture(canvas)
  recoloredTexture.name = `${texture.name || "head"}-avatar-appearance`
  recoloredTexture.colorSpace = texture.colorSpace
  recoloredTexture.flipY = texture.flipY
  recoloredTexture.wrapS = texture.wrapS
  recoloredTexture.wrapT = texture.wrapT
  recoloredTexture.magFilter = texture.magFilter
  recoloredTexture.minFilter = texture.minFilter
  recoloredTexture.anisotropy = texture.anisotropy
  recoloredTexture.generateMipmaps = texture.generateMipmaps
  recoloredTexture.rotation = texture.rotation
  recoloredTexture.center.copy(texture.center)
  recoloredTexture.offset.copy(texture.offset)
  recoloredTexture.repeat.copy(texture.repeat)
  recoloredTexture.needsUpdate = true
  recoloredTexture.userData = {
    ...texture.userData,
    avatarAppearancePatched: true,
  }

  return recoloredTexture
}

function cloneAndRetextureHeadMaterial(
  material: THREE.Material,
  hairColor: string
): THREE.Material {
  const clonedMaterial = material.clone()

  if (!hasTextureMap(clonedMaterial)) {
    return clonedMaterial
  }

  const recoloredTexture = createRecoloredHeadTexture(clonedMaterial.map, hairColor)
  if (recoloredTexture) {
    clonedMaterial.map = recoloredTexture
  }

  clonedMaterial.needsUpdate = true
  clonedMaterial.userData = {
    ...clonedMaterial.userData,
    avatarAppearancePatched: true,
  }

  return clonedMaterial
}

function AvatarModel({ analyserNode, isSpeaking }: AvatarModelProps) {
  const { scene } = useGLTF(AVATAR_URL)
  const groupRef = useRef<THREE.Group>(null)

  useEffect(() => {
    scene.traverse((child) => {
      if (!(child instanceof THREE.Mesh || child instanceof THREE.SkinnedMesh)) {
        return
      }

      if (AVATAR_APPEARANCE.hiddenMeshes.includes(child.name)) {
        child.visible = false
      }

      if (
        !AVATAR_APPEARANCE.hairMeshNames.includes(child.name) ||
        child.userData.avatarAppearancePatched
      ) {
        if (
          !AVATAR_APPEARANCE.headTextureMeshNames.includes(child.name) ||
          child.userData.avatarAppearancePatched
        ) {
          return
        }

        if (Array.isArray(child.material)) {
          child.material = child.material.map((material) =>
            cloneAndRetextureHeadMaterial(material, AVATAR_APPEARANCE.hairColor)
          )
        } else if (child.material) {
          child.material = cloneAndRetextureHeadMaterial(
            child.material,
            AVATAR_APPEARANCE.hairColor
          )
        }

        child.userData.avatarAppearancePatched = true
        return
      }

      if (Array.isArray(child.material)) {
        child.material = child.material.map((material) =>
          cloneAndTintMaterial(material, AVATAR_APPEARANCE.hairColor)
        )
      } else if (child.material) {
        child.material = cloneAndTintMaterial(
          child.material,
          AVATAR_APPEARANCE.hairColor
        )
      }

      child.userData.avatarAppearancePatched = true
    })
  }, [scene])

  // Find ALL meshes with morph targets (RPM splits head, teeth, etc.)
  const morphMeshes = useMemo(() => {
    const meshes: THREE.Mesh[] = []
    scene.traverse((child) => {
      if (
        (child instanceof THREE.Mesh || child instanceof THREE.SkinnedMesh) &&
        child.morphTargetDictionary &&
        Object.keys(child.morphTargetDictionary).length > 0
      ) {
        meshes.push(child as THREE.Mesh)
      }
    })
    return meshes
  }, [scene])

  // Log available morph targets on first mount (dev aid)
  useEffect(() => {
    if (morphMeshes.length > 0) {
      const allTargets = new Set<string>()
      morphMeshes.forEach((mesh) => {
        if (mesh.morphTargetDictionary) {
          Object.keys(mesh.morphTargetDictionary).forEach((k) => allTargets.add(k))
        }
      })
      console.log(`[Avatar3D] Found ${morphMeshes.length} morph meshes with targets:`, [...allTargets].sort())
    }
  }, [morphMeshes])

  // Frequency data buffer (reused each frame)
  const dataArray = useMemo(() => {
    if (!analyserNode) return new Uint8Array(128)
    return new Uint8Array(analyserNode.frequencyBinCount)
  }, [analyserNode])

  // Blink state
  const blinkRef = useRef({
    timer: 0,
    nextBlink: 3 + Math.random() * 2,
    blinking: false,
    blinkPhase: 0,
  })

  // Base Y position for breathing
  const baseYRef = useRef<number | null>(null)

  // Smoothed amplitude for temporal lip-sync smoothing
  const smoothedAmplitudeRef = useRef(0)

  useEffect(() => {
    if (groupRef.current && baseYRef.current === null) {
      baseYRef.current = groupRef.current.position.y
    }
  }, [])

  useFrame((_, delta) => {
    if (morphMeshes.length === 0) return

    // ── Idle animation: Blink ──
    const blink = blinkRef.current
    blink.timer += delta

    if (!blink.blinking && blink.timer > blink.nextBlink) {
      blink.blinking = true
      blink.blinkPhase = 0
    }

    if (blink.blinking) {
      blink.blinkPhase += delta * 8
      const blinkValue =
        blink.blinkPhase < 0.5
          ? blink.blinkPhase * 2
          : 2 - blink.blinkPhase * 2

      lerpMorphTarget(morphMeshes, EXPRESSION_TARGETS.blinkLeft, Math.max(0, blinkValue), 0.5)
      lerpMorphTarget(morphMeshes, EXPRESSION_TARGETS.blinkRight, Math.max(0, blinkValue), 0.5)

      if (blink.blinkPhase >= 1) {
        blink.blinking = false
        blink.timer = 0
        blink.nextBlink = 3 + Math.random() * 3
        lerpMorphTarget(morphMeshes, EXPRESSION_TARGETS.blinkLeft, 0, 0.4)
        lerpMorphTarget(morphMeshes, EXPRESSION_TARGETS.blinkRight, 0, 0.4)
      }
    }

    // ── Idle animation: Subtle breathing ──
    if (groupRef.current) {
      const baseY = baseYRef.current ?? groupRef.current.position.y
      groupRef.current.position.y = baseY + Math.sin(Date.now() * 0.0015) * 0.002
    }

    // ── Subtle head/body sway ──
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(Date.now() * 0.0004) * 0.015
    }

    // ── Lip-sync ──
    if (!analyserNode || !isSpeaking) {
      // Smoothly close mouth when not speaking
      lerpMorphTarget(morphMeshes, VISEME_TARGETS.aa, 0, 0.08)
      lerpMorphTarget(morphMeshes, VISEME_TARGETS.E, 0, 0.08)
      lerpMorphTarget(morphMeshes, VISEME_TARGETS.I, 0, 0.08)
      lerpMorphTarget(morphMeshes, VISEME_TARGETS.O, 0, 0.08)
      lerpMorphTarget(morphMeshes, VISEME_TARGETS.U, 0, 0.08)
      lerpMorphTarget(morphMeshes, VISEME_TARGETS.jawOpen, 0, 0.08)
      lerpMorphTarget(morphMeshes, EXPRESSION_TARGETS.mouthSmileLeft, 0, 0.05)
      lerpMorphTarget(morphMeshes, EXPRESSION_TARGETS.mouthSmileRight, 0, 0.05)
      smoothedAmplitudeRef.current = 0
      return
    }

    // Read frequency data
    analyserNode.getByteFrequencyData(dataArray)

    // Focus on speech-frequency bins (roughly 200-2000 Hz range)
    // Skip the lowest 2 bins (sub-bass rumble) and sample mid-range
    let sum = 0
    const startBin = 2
    const endBin = Math.min(12, dataArray.length)
    for (let i = startBin; i < endBin; i++) {
      sum += dataArray[i]
    }
    const rawAmplitude = sum / (endBin - startBin) / 255

    // Noise gate: ignore very low amplitude (background noise / silence)
    const gatedAmplitude = rawAmplitude < 0.05 ? 0 : rawAmplitude

    // Compress dynamic range: use power > 1 to tame loud peaks
    // Then scale down so max mouth opening is ~45%, not 100%
    const shaped = Math.min(Math.pow(gatedAmplitude, 1.2) * 0.9, 0.5)

    // Temporal smoothing: blend with previous frame to prevent jerky jumps
    const smoothed = THREE.MathUtils.lerp(smoothedAmplitudeRef.current, shaped, 0.25)
    smoothedAmplitudeRef.current = smoothed

    // Use time-varying offsets so different visemes activate at slightly
    // different moments, creating natural vowel variation
    const t = Date.now() * 0.006
    const variation1 = 0.5 + 0.5 * Math.sin(t)         // 0-1 cycle
    const variation2 = 0.5 + 0.5 * Math.sin(t * 1.3)    // offset cycle
    const variation3 = 0.5 + 0.5 * Math.sin(t * 0.7)    // slower cycle

    // Drive visemes — keep all multipliers low for conversational speech
    lerpMorphTarget(morphMeshes, VISEME_TARGETS.aa, smoothed * 0.40 * variation1, 0.12)
    lerpMorphTarget(morphMeshes, VISEME_TARGETS.O, smoothed * 0.30 * variation2, 0.10)
    lerpMorphTarget(morphMeshes, VISEME_TARGETS.E, smoothed * 0.25 * variation3, 0.10)
    lerpMorphTarget(morphMeshes, VISEME_TARGETS.I, smoothed * 0.15 * variation1, 0.08)
    lerpMorphTarget(morphMeshes, VISEME_TARGETS.U, smoothed * 0.20 * variation2, 0.08)
    lerpMorphTarget(morphMeshes, VISEME_TARGETS.jawOpen, smoothed * 0.30, 0.12)
    // Subtle smile during speech for warmth
    lerpMorphTarget(morphMeshes, EXPRESSION_TARGETS.mouthSmileLeft, smoothed * 0.08, 0.06)
    lerpMorphTarget(morphMeshes, EXPRESSION_TARGETS.mouthSmileRight, smoothed * 0.08, 0.06)
  })

  return (
    <group ref={groupRef} position={[0, -2.25, 0]} scale={1.5}>
      <primitive object={scene} />
    </group>
  )
}

// ─── Loading Fallback (shown inside Canvas) ──────────────────────

function LoadingFallback() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 2
    }
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.3, 16, 16]} />
      <meshStandardMaterial color="#6366f1" wireframe />
    </mesh>
  )
}

// ─── Outer: Avatar3D (public component) ──────────────────────────

interface Avatar3DProps {
  analyserNode: AnalyserNode | null
  isSpeaking: boolean
}

export default function Avatar3D({ analyserNode, isSpeaking }: Avatar3DProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl">
        <div className="text-sm text-slate-400 animate-pulse">Loading avatar...</div>
      </div>
    )
  }

  return (
    <Canvas
      camera={{ position: [0, 0.55, 1.4], fov: 28 }}
      style={{ width: "100%", height: "100%" }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
    >
      {/* Lighting — three-point studio setup */}
      <ambientLight intensity={0.7} />
      <directionalLight
        position={[2, 3, 4]}
        intensity={1.2}
        castShadow={false}
        color="#ffffff"
      />
      <directionalLight
        position={[-2, 2, -1]}
        intensity={0.4}
        color="#c4d4ff"
      />
      {/* Rim / back light */}
      <pointLight position={[0, 2, -3]} intensity={0.5} color="#8899ff" />

      {/* Environment for realistic reflections on skin/hair */}
      <Environment preset="apartment" />

      {/* Subtle contact shadow beneath the avatar */}
      <ContactShadows
        position={[0, -0.6, 0]}
        opacity={0.3}
        scale={3}
        blur={2.5}
        far={1}
      />

      {/* The avatar with loading fallback */}
      <Suspense fallback={<LoadingFallback />}>
        <AvatarModel analyserNode={analyserNode} isSpeaking={isSpeaking} />
      </Suspense>
    </Canvas>
  )
}

// Pre-load the GLB so it's cached when needed
useGLTF.preload(AVATAR_URL)
