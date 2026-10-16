import { Canvas, ThreeEvent } from "@react-three/fiber"
import { Field } from "./Field"
import { Loader } from "@react-three/drei"
import Zoom_ON_OFF from "./Zoom_Button"
import { useCallback, useRef } from "react"
import { Model_in_Action } from "./Bear_atom"
import Double_Button from "./terms_of_service"
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import { useAtomValue } from "jotai"

const rippleStyle = {
  position: 'fixed',
  borderRadius: '50%',
  width: '130px',
  height: '130px',
  backgroundColor: 'rgba(148, 217, 255, 0.7)',
  transform: 'scale(0)',
  animation: 'ripple-effect 0.5s linear',
}
// 拡大 expansion
const ExpansionStyles = `
  @keyframes ripple-effect {
    from {
      transform: scale(0);
      opacity: 1;
    }
    to {
      transform: scale(10);
      opacity: 0;
    }
  }
`
// 縮小 reduction
const ReductionStyles = `
  @keyframes ripple-effect {
    from {
      transform: scale(10);
      opacity: 0;
    }
    to {
      transform: scale(0);
      opacity: 0.8;
    }
  }
`
class Ripple {
  element: HTMLDivElement
  constructor(x: number, y: number) {
    this.element = document.createElement('div')
    Object.assign(this.element.style, rippleStyle)
    this.element.style.left = `${x - 65}px`
    this.element.style.top = `${y - 65}px`
    this.element.addEventListener('animationend', () => {
      this.element.remove()
    })
  }
}

export function App() {
  const inaction = useAtomValue(Model_in_Action)
  const loaderStyle: React.CSSProperties = { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
  const canvasRef = useRef<HTMLDivElement>(null)

  const canvasClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    const container = canvasRef.current
    if (!container) return
    const x = e.clientX
    const y = e.clientY
    const ripple = new Ripple(x, y)
    container.appendChild(ripple.element)
  }, [])

  return (
    <div className="Bear_Precious" ref={canvasRef} style={{ position: 'relative' }} >
      <style >{inaction ? ExpansionStyles : ReductionStyles}</style>

      <span style={{ display: 'flex', justifyContent: 'center' }} >
        <Box component="span" sx={{ pt: 1 }}>
          <Grid container spacing={1}>
            <Grid size={{ xs: 6 }}>
              <Zoom_ON_OFF />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Double_Button />
            </Grid>
          </Grid>
        </Box>
      </span>

      <Canvas>
        <Field CallBack={canvasClick} />
      </Canvas>
      <Loader innerStyles={loaderStyle} />
    </div >
  )
}

export default App
