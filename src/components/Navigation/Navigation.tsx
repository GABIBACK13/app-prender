import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material'
import HomeRoundedIcon from '@mui/icons-material/HomeRounded'
import SportsEsportsRoundedIcon from '@mui/icons-material/SportsEsportsRounded'
import CardGiftcardRoundedIcon from '@mui/icons-material/CardGiftcardRounded'
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded'
import { useNavigate, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  { label: 'Início', icon: <HomeRoundedIcon />, path: '/main' },
  { label: 'Jogar', icon: <SportsEsportsRoundedIcon />, path: '/main/jogar' },
  { label: 'Recompensas', icon: <CardGiftcardRoundedIcon />, path: '/main/loja' },
  { label: 'Perfil', icon: <AccountCircleRoundedIcon />, path: '/main/perfil' },
]

export default function Navigation() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        display: { xs: 'block', md: 'none' },
        zIndex: (theme) => theme.zIndex.appBar,
      }}
    >
      <BottomNavigation
        value={location.pathname}
        onChange={(_, newPath: string) => navigate(newPath)}
        showLabels
      >
        {NAV_ITEMS.map((item) => (
          <BottomNavigationAction
            key={item.path}
            label={item.label}
            icon={item.icon}
            value={item.path}
          />
        ))}
      </BottomNavigation>
    </Paper>
  )
}
