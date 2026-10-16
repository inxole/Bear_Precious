import {
    addTask, addTaskAtStart, addToScene, attachControl, createDefaultCamera, createDirectionalLight,
    createEffectRenderTask, createEffectWrapper, createEngine, createGpuPicker, createGround,
    createHemisphericLight, createPbrMaterial, createPcfDirectionalShadowGenerator, createRenderTask,
    createSceneContext, createSurfaceRenderTargetTexture,
    disposeEngine, disposePicker, disposeScene, enableSkeletonShadows, getFrameGraph,
    goToFrame, loadGltf, pickAsync, playAnimation,
    registerSceneWithShadowSupport, setCameraLimits, setEffectTexture, setEffectUniforms, setShadowOnly,
    setShadowTaskCasterMeshes, startEngine, stopAnimation, stopEngine, vec3,
} from "@babylonjs/lite"
import type { ArcRotateCamera, EngineContext, GpuPicker, SceneContext } from "@babylonjs/lite"

const RIPPLE_EXPAND_DURATION_MS = 600
const RIPPLE_COLLAPSE_DURATION_MS = RIPPLE_EXPAND_DURATION_MS / 2.0

export function createBearScene(
    canvas: HTMLCanvasElement,
    onToggle: (playing: boolean) => void,
) {
    let engine: EngineContext | undefined
    let scene: SceneContext | undefined
    let camera: ArcRotateCamera | undefined
    let picker: GpuPicker | undefined
    let disposed = false
    let initializing = true
    let picking = false
    let zoomEnabled = false
    const detach: Array<() => void> = []

    function cleanup() {
        detach.splice(0).forEach(fn => fn())
        if (engine) stopEngine(engine)
        if (picker) disposePicker(picker)
        if (scene) disposeScene(scene)
        if (engine) disposeEngine(engine)
        picker = undefined
        scene = undefined
        engine = undefined
    }

    async function init() {
        try {
            engine = await createEngine(canvas, { alphaMode: "premultiplied" })
            if (disposed) return
            scene = createSceneContext(engine, { defaultRenderTask: false })
            scene.clearColor = { r: 0, g: 0, b: 0, a: 0 }
            addToScene(scene, createHemisphericLight([0, 1, 0], 1))
            const model = await loadGltf(engine, "/Bear_Pretty.glb")
            if (disposed) return
            addToScene(scene, model)
            const bearMeshes = new Set(scene.meshes)
            const animations = model.animationGroups ?? []
            animations.forEach(stopAnimation)
            const motion = animations.find(group => group.name === "Standby_Motion")
            if (!motion) throw new Error("Standby_Motion animation is missing")
            motion.loopAnimation = true
            goToFrame(motion, 0, engine)

            camera = createDefaultCamera(scene)
            Object.assign(camera, { alpha: -Math.PI / 0.75, beta: Math.PI / 3, radius: 1.5, target: vec3(0, 0.35, 0) })
            detach.push(setCameraLimits(camera, { lowerRadiusLimit: 0.6, upperRadiusLimit: 5 }))

            // ズーム OFF はホイールとピンチの両方を止める。回転操作は維持する。
            const blockZoom = (event: WheelEvent | TouchEvent) => {
                if (zoomEnabled || ("touches" in event && event.touches.length < 2)) return
                event.preventDefault()
                event.stopImmediatePropagation()
            }
            canvas.addEventListener("wheel", blockZoom, { capture: true, passive: false })
            canvas.addEventListener("touchstart", blockZoom, { capture: true, passive: false })
            canvas.addEventListener("touchmove", blockZoom, { capture: true, passive: false })
            detach.push(() => {
                canvas.removeEventListener("wheel", blockZoom, true)
                canvas.removeEventListener("touchstart", blockZoom, true)
                canvas.removeEventListener("touchmove", blockZoom, true)
            })
            detach.push(attachControl(camera, canvas, scene, {
                pointerMappings: { secondaryButton: "rotate" },
            }))

            // ContactShadows に相当する赤い半透明の接地影。床そのものは表示しない。
            const light = createDirectionalLight([-0.3, -1, -0.2], 0.6)
            Object.assign(light.position, { x: 1.5, y: 5, z: 1 })
            const shadow = createPcfDirectionalShadowGenerator(engine, light, {
                mapSize: 1024, orthoMinZ: 0.01, orthoMaxZ: 10,
                forceRefreshEveryFrame: true,
            })
            enableSkeletonShadows(shadow)
            setShadowTaskCasterMeshes(shadow, [...bearMeshes])
            light.shadowGenerator = shadow
            addToScene(scene, light)
            const ground = createGround(engine, { width: 10, height: 10 })
            const material = createPbrMaterial()
            setShadowOnly(material, { color: [1, 0, 0], opacity: 0.5 })
            ground.material = material
            ground.receiveShadows = true
            addToScene(scene, ground)

            await registerSceneWithShadowSupport(scene)
            if (disposed) return

            // 影描画の後、シーンをオフスクリーンに描画し、波紋ポストプロセスで画面に合成する。
            const { rt: sceneTarget, texture: sceneTexture } = createSurfaceRenderTargetTexture(engine, {
                lbl: "bear-scene-source",
                format: engine.format,
                dFormat: "depth24plus-stencil8",
                samples: 1,
                size: engine,
            })
            const sceneTask = createRenderTask(
                { name: "bear-scene-source", rt: sceneTarget, cam: camera, clrColor: scene.clearColor, clr: true },
                engine, scene,
            )
            addTaskAtStart(scene, sceneTask)

            const rippleEffect = createEffectWrapper(engine, {
                name: "bearRippleEffect",
                fragmentWGSL: `
                    @group(0) @binding(0) var mySampler: sampler;
                    @group(0) @binding(1) var inputTexture: texture_2d<f32>;
                    @group(0) @binding(2) var<uniform> ripple: vec4<f32>;

                    @fragment
                    fn effectFragment(input: EffectVertexOutput) -> @location(0) vec4<f32> {
                        let sampleUv = vec2<f32>(input.uv.x, 1.0 - input.uv.y);
                        let center = ripple.xy;
                        let progress = ripple.z;
                        // 1 = 再生開始（中心から外へ広がる）、0 = 停止（外側から中心へ集まる）。
                        let expanding = ripple.w;

                        // クリックと同じ左上原点の座標で、描画先の縦横比を補正する。
                        let size = vec2<f32>(textureDimensions(inputTexture));
                        let aspect = vec2<f32>(size.x / size.y, 1.0);
                        let diff = (sampleUv - center) * aspect;
                        let dist = length(diff);

                        let ringRadius = select(0.8 * (1.0 - progress), 0.8 * progress, expanding > 0.5);
                        let ringWidth = 0.1;
                        let falloff = 1.0 - smoothstep(0.0, ringWidth, abs(dist - ringRadius));
                        let strength = falloff * (1.0 - progress) * 0.025;

                        let dir = select(vec2<f32>(0.0, 0.0), normalize(diff) / aspect, dist > 0.0001);
                        let distortedUv = sampleUv + dir * strength;

                        return textureSample(inputTexture, mySampler, distortedUv);
                    }
                `,
                bindings: [
                    { name: "mySampler", binding: 0, kind: "sampler", samplerType: "filtering", textureBinding: "inputTexture" },
                    { name: "inputTexture", binding: 1, kind: "texture", textureSampleType: "float" },
                    { name: "ripple", binding: 2, kind: "uniform", uniformByteLength: 16 },
                ],
            })
            setEffectTexture(rippleEffect, "inputTexture", sceneTexture)
            const rippleTask = createEffectRenderTask(
                { name: "bear-ripple-post", effect: rippleEffect, target: engine.scRT, clear: true },
                engine, scene,
            )
            addTask(scene, rippleTask)
            getFrameGraph(scene).build()

            let rippleStart: number | null = null
            let rippleCenter = { x: 0.5, y: 0.5 }
            let rippleExpanding = true
            let rippleFrame = 0
            const updateRippleUniforms = () => {
                let progress = 1
                if (rippleStart !== null) {
                    const elapsed = performance.now() - rippleStart
                    const duration = rippleExpanding ? RIPPLE_EXPAND_DURATION_MS : RIPPLE_COLLAPSE_DURATION_MS
                    progress = Math.min(elapsed / duration, 1)
                    if (progress >= 1) rippleStart = null
                }
                setEffectUniforms(rippleEffect, {
                    ripple: new Float32Array([rippleCenter.x, rippleCenter.y, progress, rippleExpanding ? 1 : 0]),
                })
                if (rippleStart !== null) rippleFrame = requestAnimationFrame(updateRippleUniforms)
            }
            const startRipple = (clientX: number, clientY: number, expanding: boolean) => {
                const rect = canvas.getBoundingClientRect()
                rippleCenter = {
                    x: (clientX - rect.left) / rect.width,
                    y: (clientY - rect.top) / rect.height,
                }
                rippleExpanding = expanding
                rippleStart = performance.now()
                cancelAnimationFrame(rippleFrame)
                updateRippleUniforms()
            }
            updateRippleUniforms()
            detach.push(() => cancelAnimationFrame(rippleFrame))

            if (disposed) return
            await startEngine(engine)
            if (disposed) return
            picker = createGpuPicker(scene)

            let press: { id: number, x: number, y: number, moved: boolean } | undefined
            const pointers = new Set<number>()
            const down = (event: PointerEvent) => {
                pointers.add(event.pointerId)
                if (pointers.size > 1) {
                    if (press) press.moved = true
                    return
                }
                if (event.button === 0) press = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false }
            }
            const move = (event: PointerEvent) => {
                if (press?.id === event.pointerId && Math.hypot(event.clientX - press.x, event.clientY - press.y) > 5) press.moved = true
            }
            const cancel = (event: PointerEvent) => {
                pointers.delete(event.pointerId)
                if (press?.id === event.pointerId) press = undefined
            }
            const up = (event: PointerEvent) => {
                pointers.delete(event.pointerId)
                const tap = press
                if (tap?.id !== event.pointerId) return
                press = undefined
                if (tap.moved || picking || disposed || !picker) return
                const rect = canvas.getBoundingClientRect()
                picking = true
                void pickAsync(picker, event.clientX - rect.left, event.clientY - rect.top, {
                    filter: mesh => bearMeshes.has(mesh),
                }).then(hit => {
                    if (disposed || !hit.hit) return
                    if (motion.isPlaying) {
                        stopAnimation(motion)
                        // Three.js の stop() と同じく先頭の姿勢へ戻す。
                        goToFrame(motion, 0, engine)
                    } else playAnimation(motion)
                    startRipple(event.clientX, event.clientY, motion.isPlaying)
                    onToggle(motion.isPlaying)
                }).catch(() => { return }).finally(() => {
                    picking = false
                    if (disposed) cleanup()
                })
            }
            canvas.addEventListener("pointerdown", down)
            canvas.addEventListener("pointermove", move)
            canvas.addEventListener("pointerup", up)
            canvas.addEventListener("pointercancel", cancel)
            detach.push(() => {
                canvas.removeEventListener("pointerdown", down)
                canvas.removeEventListener("pointermove", move)
                canvas.removeEventListener("pointerup", up)
                canvas.removeEventListener("pointercancel", cancel)
            })
        } catch (error) {
            disposed = true
            throw error
        } finally {
            initializing = false
            if (disposed) cleanup()
        }
    }

    return {
        ready: init(),
        setZoom(enabled: boolean) {
            zoomEnabled = enabled
            if (!enabled && camera) camera.inertialRadiusOffset = 0
        },
        dispose() {
            disposed = true
            if (!initializing && !picking) cleanup()
        },
    }
}
