import { Box, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { SxProps, Theme } from '@mui/material/styles'

interface AppLogoProps {
  size?: 'small' | 'medium' | 'large'
  sx?: SxProps<Theme>
}

const sizeMap = {
  small: '1.4rem',
  medium: '2rem',
  large: '2.8rem',
}

export default function AppLogo({ size = 'medium', sx }: AppLogoProps) {
  const theme = useTheme()
  const fontSize = sizeMap[size]

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        userSelect: 'none',
        ...sx,
      }}
    >
      <Typography
        component="span"
        sx={{
          fontFamily: '"Fredoka", sans-serif',
          fontWeight: 700,
          fontSize,
          color: theme.palette.primary.main,
          letterSpacing: '-0.04em',
          lineHeight: 1,
        }}
      >
        App
      </Typography>
      <Typography
        component="span"
        sx={{
          fontFamily: '"Fredoka", sans-serif',
          fontWeight: 700,
          fontSize,
          color: theme.palette.secondary.main,
          letterSpacing: '-0.04em',
          marginLeft: '-0.18em',
          lineHeight: 1,
        }}
      >
        render
      </Typography>
    </Box>
  )
}
