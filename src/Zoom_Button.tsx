import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material"
import { Button_Click } from "./Bear_atom"
import { useState } from "react"
import { useAtom } from "jotai"

const Zoom_ON_OFF = () => {
    const [count, setCount] = useState(0)
    const [a_u_pushed, setA_U_pushed] = useAtom(Button_Click)

    const A_U_Click = () => {
        setA_U_pushed((x) => { return x })
        if (count % 2 == 0) {
            setA_U_pushed(true)
        } else { setA_U_pushed(false) }
    }

    const [open, setOpen] = useState(false)
    const handleClickOpen = () => {
        setCount((x) => { return x })
        if (count == 0) {
            setOpen(true)
        } else {
            setOpen(false)
        }
    }
    const handleClose = () => { setOpen(false) }

    return (
        <span>
            <Button variant="contained" color="primary" style={{ height: '60px', width: '100px' }} onClick={() => { A_U_Click(), setCount(count + 1), handleClickOpen() }}
            >{a_u_pushed ? 'Zoom ON' : 'Zoom OFF'}</Button>

            <Dialog
                open={open}
                onClose={handleClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
                slotProps={{ paper: {
                    style: {
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        margin: 0,
                        maxHeight: '100%',
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        height: '200px',
                        overflow: 'hidden'
                    },
                } }}
            >
                <DialogTitle id="alert-dialog-title" sx={{ textAlign: 'center' }}>
                    ZoomのON・OFFを切り替えます。
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description" sx={{ textAlign: 'center', fontSize: '18px' }}>
                        滑らかに描画されないかもしれません。
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', height: "48px" }}>
                    <Button onClick={handleClose} autoFocus>
                        閉じる
                    </Button>
                </DialogActions>
            </Dialog>
        </span >
    )
}

export default Zoom_ON_OFF
