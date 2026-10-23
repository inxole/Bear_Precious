import { GlobalStyles } from "@mui/material"

export function GlobalBackground() {
    return <GlobalStyles styles={{
        html: { width: "100%", height: "100%", backgroundColor: "rgba(255, 0, 0, 0.591)" },
        body: { width: "100%", height: "100%", overflow: "hidden", margin: 0, backgroundColor: "rgba(207, 60, 109, 0.542)" },
        "#root": { width: "100%", height: "100%" },
    }} />
}
