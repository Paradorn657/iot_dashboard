import { Route, Routes, useNavigate } from "react-router-dom"
import SideBar from "./components/SideBar"
import Index from "./pages/Index"
import NotFound from "./pages/NotFound"
import { Box,  Paper } from "@mui/material"
import Graph from "./pages/Graph"

function App() {
  const navigate = useNavigate()

  return (
    <>
      <Box sx={{ 'display': 'grid', 'gridTemplateColumns': 'auto 1fr', height: '100%', padding: '0', margin: '0' }}>
        <SideBar navigate={navigate} />
        <Box sx={{ padding: '2.25em' }}>
          <Paper elevation={1} sx={{
            padding: '1em'
          }}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/graph" element={<Graph />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Paper>
        </Box>
      </Box>
    </>
  )
}

export default App
