import { Divider, List, ListItem, ListItemButton, ListItemText, Paper, Stack } from "@mui/material";
import { NavigateFunction } from "react-router-dom";
import HomeIcon from '@mui/icons-material/Home';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import SideBarItem from "./SideBarItem";
import { ReactElement, useState } from "react";
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
interface BarProp {
    navigate: NavigateFunction
}

interface RequireItemProp {
    name: string,
    path: string,
    icon: ReactElement
}

const options: RequireItemProp[] = [
    { name: 'Index', path: '/', icon: <HomeIcon /> },
    { name: 'Graph', path: '/graph', icon: <EqualizerIcon /> }
]

function SideBar({ navigate }: BarProp) {
    const [open, setOpen] = useState(true)
    return (
        <Paper
            elevation={1}
            sx={{
                boxSizing: 'border-box',
                height: '100vh',
                width: open ? '18em' : '3.5em',
                overflowX: 'hidden',
                position: 'sticky',
                top: 0,
                alignSelf: 'flex-start'
            }}
        >
            <List sx={{ display: 'flex', flexDirection: 'column', gap: '1' }}>
                <ListItem disablePadding >
                    <ListItemButton onClick={() => setOpen((prev) => !prev)} sx={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
                        {open && <ListItemText>DashBoard </ListItemText>}
                        <KeyboardDoubleArrowLeftIcon />
                    </ListItemButton>
                </ListItem>
                <Divider />
                <ListItem disablePadding sx={{
                    'display': 'flex',
                    flexDirection: 'column',
                    width: '100%'
                }}>
                    {options.map((option) => (
                        <SideBarItem key={option.name} name={option.name} icon={option.icon}
                            navigate={navigate} path={option.path} open={open} />
                    ))}
                </ListItem>
            </List>
        </Paper >
    );
}

export default SideBar;