import { ContactShadows, Environment, OrbitControls, PerspectiveCamera } from "@react-three/drei"
import { Suspense, useEffect } from "react"
import { Vector3 } from "three"
import { ThreeEvent, useThree } from "@react-three/fiber"
import Bear_Precious from "./Model/Bear_Precious"
import { Button_Click } from "./Bear_atom"
import { useAtomValue } from "jotai"

interface CanvasClickProps {
    CallBack: (e: ThreeEvent<MouseEvent>) => void
}

export function Field(props: CanvasClickProps) {
    const a_u_pushed = useAtomValue(Button_Click)
    const { camera } = useThree()
    const viewinfo = window.document
    useEffect(() => {
        camera.lookAt(new Vector3(0, 1, 0))
    }, [camera])

    return (
        <Suspense fallback={null}>
            <OrbitControls
                minDistance={0.6}
                maxDistance={5}
                target={new Vector3(0, 0.3, 0)}
                enablePan={false}
                enableZoom={a_u_pushed ? true : false}
                domElement={viewinfo.documentElement}
            />
            <PerspectiveCamera makeDefault position={[1, 1, 1]} />

            <Bear_Precious position={[0, 0, 0]} CallBack={props.CallBack} />

            <ContactShadows
                opacity={0.5}
                blur={0.1}
                far={10}
                resolution={1024}
                color="red"
                position={[0, 0, 0]} />
            <Environment preset='forest' />
        </Suspense>
    )
}
