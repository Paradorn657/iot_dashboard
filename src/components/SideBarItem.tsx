import { ListItemButton, ListItemIcon, ListItemText } from "@mui/material"
import { ReactElement } from "react"
import { NavigateFunction } from "react-router-dom"

interface ItemProp {
    name: string,
    icon: ReactElement,
    navigate: NavigateFunction,
    path: string,
}

function SideBarItem({ name, icon, navigate, path }: ItemProp) {
    return (
        <ListItemButton
            sx={{
                width: '100%',
                height: '2.5em'
            }}
            onClick={() => { navigate(path) }}
        >
            <ListItemIcon >
                {icon}
            </ListItemIcon>
            <ListItemText primary={name} />
        </ListItemButton>
    )
}
export default SideBarItem
