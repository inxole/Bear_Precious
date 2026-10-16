import { useEffect, useRef, useState } from "react"
import { Box } from "@mui/material"
import { useAtomValue, useSetAtom } from "jotai"
import { Button_Click, Model_in_Action } from "../atoms"
import { Controls } from "./Controls"
import { GlobalBackground } from "./GlobalBackground"
import { SceneStatus } from "./SceneStatus"
import { createBearScene } from "./scene"

export function App() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const runtimeRef = useRef<ReturnType<typeof createBearScene> | null>(null)
    const zoom = useAtomValue(Button_Click)
    const setPlaying = useSetAtom(Model_in_Action)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        setLoading(true)
        setError(null)
        let active = true
        const runtime = createBearScene(canvas, (playing) => {
            if (!active) return
            setPlaying(playing)
        })
        runtimeRef.current = runtime
        void runtime.ready.then(() => {
            if (active) setLoading(false)
        }).catch(() => {
            if (!active) return
            setLoading(false)
            setError("モデルを読み込めませんでした。ページを再読み込みしてください。")
        })
        return () => {
            active = false
            runtimeRef.current = null
            runtime.dispose()
            setPlaying(false)
        }
    }, [setPlaying])

    useEffect(() => {
        runtimeRef.current?.setZoom(zoom)
    }, [zoom])

    return <>
        <GlobalBackground />
        <Box component="main" sx={{ position: "relative", width: "100%", height: "100dvh", overflow: "hidden" }}>
            <Box component="canvas" ref={canvasRef}
                aria-label="ドラッグで回転、モデルをクリックするとアニメーションを再生・停止"
                sx={{ display: "block", width: "100%", height: "100%", touchAction: "none" }} />
            <Controls />
            <SceneStatus loading={loading} error={error} />
        </Box>
    </>
}
