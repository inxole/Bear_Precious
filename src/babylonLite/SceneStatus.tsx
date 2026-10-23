import { Alert, Box, CircularProgress, Stack, Typography } from "@mui/material"

export function SceneStatus({ loading, error }: { loading: boolean, error: string | null }) {
    if (!loading && !error) return null

    return <Box sx={{
        position: "absolute", inset: 0, zIndex: 20, pointerEvents: "none",
        display: "flex", alignItems: "center", justifyContent: "center",
        bgcolor: "rgba(173, 216, 230, 0.8)",
        backdropFilter: "blur(16px) saturate(180%)",
        WebkitBackdropFilter: "blur(16px) saturate(180%)",
    }}>
        {loading && <Stack spacing={2} role="status" sx={{ alignItems: "center" }}>
            <CircularProgress size={48} sx={{ color: "primary.main" }} />
            <Typography sx={{ color: "text.primary", fontWeight: 500 }}>読み込み中…</Typography>
        </Stack>}
        {error && <Alert severity="error" sx={{ maxWidth: "calc(100% - 32px)" }}>{error}</Alert>}
    </Box>
}
