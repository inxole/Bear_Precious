import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Stack } from "@mui/material"
import { useAtom } from "jotai"
import { useEffect, useState } from "react"
import { Rnd } from "react-rnd"
import { Button_Click } from "../atoms"
import Double_Button from "../terms_of_service"

const PANEL_HEIGHT = 92

function getCenteredPosition() {
    const width = Math.min(288, window.innerWidth - 24)
    return { x: (window.innerWidth - width) / 2, y: 12, width, height: PANEL_HEIGHT }
}

export function Controls() {
    const [zoom, setZoom] = useAtom(Button_Click)
    const [showZoomHelp, setShowZoomHelp] = useState(false)
    const [hasShownZoomHelp, setHasShownZoomHelp] = useState(false)
    const [panel, setPanel] = useState(getCenteredPosition)

    useEffect(() => {
        const onResize = () => setPanel(getCenteredPosition())
        window.addEventListener("resize", onResize)
        return () => window.removeEventListener("resize", onResize)
    }, [])

    const toggleZoom = () => {
        setZoom(value => !value)
        if (!hasShownZoomHelp) {
            setHasShownZoomHelp(true)
            setShowZoomHelp(true)
        }
    }

    return <>
        <Rnd
            position={{ x: panel.x, y: panel.y }}
            size={{ width: panel.width, height: panel.height }}
            disableDragging
            enableResizing={false}
            style={{ zIndex: 10 }}
        >
            <Box component="section" aria-label="モデルの操作" sx={{
                display: "flex", width: "100%", height: "100%",
                p: 2, borderRadius: 3, boxSizing: "border-box",
                bgcolor: "rgba(173, 216, 230, 0.35)",
                backdropFilter: "blur(16px) saturate(180%)",
                WebkitBackdropFilter: "blur(16px) saturate(180%)",
                border: "1px solid rgba(255, 255, 255, 0.5)",
                boxShadow: "0 8px 32px rgba(31, 38, 135, 0.2)",
            }}>
                <Stack direction="row" spacing={2} sx={{
                    width: "100%", alignItems: "center", justifyContent: "center",
                    "& > span": { width: "auto", height: "auto" },
                }}>
                    <Button variant="contained" onClick={toggleZoom} aria-pressed={zoom} sx={{ width: 120, height: 60, whiteSpace: "nowrap" }}>
                        {zoom ? "Zoom ON" : "Zoom OFF"}
                    </Button>
                    <Double_Button />
                </Stack>
            </Box>
        </Rnd>
        <Dialog open={showZoomHelp} onClose={() => setShowZoomHelp(false)} aria-labelledby="bear-zoom-title">
            <DialogTitle id="bear-zoom-title">ZoomのON・OFFを切り替えます。</DialogTitle>
            <DialogContent>
                <DialogContentText>ONにするとホイールやピンチで拡大・縮小できます。滑らかに描画されないかもしれません。</DialogContentText>
            </DialogContent>
            <DialogActions><Button onClick={() => setShowZoomHelp(false)} autoFocus>閉じる</Button></DialogActions>
        </Dialog>
    </>
}
