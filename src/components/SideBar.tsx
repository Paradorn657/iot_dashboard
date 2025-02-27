import { Divider, List, ListItem, ListItemButton, ListItemText, Paper,  Typography } from "@mui/material";
import { NavigateFunction, useLocation } from "react-router-dom";
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
    const location = useLocation()
    const currentOption = options.find(option => option.path === location.pathname);

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
                alignSelf: 'flex-start',
                transition: '300ms ease-in-out',
            }}
        >
            <List sx={{ display: 'flex', flexDirection: 'column', gap: '0.25em', padding: 0 }}>
                <ListItem disablePadding sx={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingX: open ? '1em' : 0
                }}>
                    {open &&
                        <ListItemText sx={{ display: 'block', width: '100%' }}>
                            <Typography variant="h6" sx={{
                                opacity: open ? 1 : 0,
                                transition: 'opacity 300ms ease-in-out'
                            }}>
                                {currentOption ? currentOption.name : 'DashBoard'}
                            </Typography>
                        </ListItemText>}
                    <ListItemButton onClick={() => setOpen((prev) => !prev)} sx={{ height: '2.5em', display: 'flex', justifyContent: 'space-between' }}>
                        <KeyboardDoubleArrowLeftIcon sx={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
                    </ListItemButton>
                </ListItem>
                <Divider variant="middle" />
                <ListItem disablePadding sx={{
                    'display': 'flex',
                    flexDirection: 'column',
                    width: '100%'
                }}>
                    {options.map((option) => (
                        <SideBarItem key={option.name} name={option.name} icon={option.icon}
                            navigate={navigate} path={option.path} />
                    ))}
                </ListItem>
            </List>
        </Paper >
    );
}

export default SideBar;