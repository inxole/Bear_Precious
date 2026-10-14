import { useEffect , useRef } from "react"
import {
    createEngine,
    createSceneContext,
    createDefaultCamera,
    createHemisphericLight,
    loadGltf,
    addToScene,
    attachControl,
    registerScene,
    startEngine,
    vec3
} from "@babylonjs/lite"

export function App(){
	const canvasRef = useRef<HTMLCanvasElement>(null)

	useEffect(()=>{
		async function init(){
		const canvas = canvasRef.current
		if(!canvas) return
		
		const engine = await createEngine(canvas)
		const scene = createSceneContext(engine)

		addToScene(scene, createHemisphericLight([0, 1, 0], 1.0))
		addToScene(scene, await loadGltf(engine, "/Bear_Pretty.glb"))

		const cam = createDefaultCamera(scene)
		Object.assign(cam, { alpha: -Math.PI / 0.75, beta: Math.PI / 3, radius: 1.5, target: vec3(0, 0.35, 0) })
		attachControl(cam, canvas, scene)

		await registerScene(scene)
		await startEngine(engine)
		}

		void init().catch(() => { return })
	},[])

	return(
		<canvas ref={canvasRef} style={{width:'100%',height:'100%'}}/>
	)
}
