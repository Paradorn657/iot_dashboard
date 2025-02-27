import { ListItemButton, ListItemIcon, ListItemText } from "@mui/material"
import { ReactElement } from "react"
import { NavigateFunction } from "react-router-dom"

interface ItemProp {
    name: string,
    icon: ReactElement,
    navigate: NavigateFunction,
    path: string,
    open: boolean,
}

function SideBarItem({ name, icon, navigate, path, open }: ItemProp) {
    return (
        <ListItemButton
            sx={{
                width: '100%'
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
