import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Chip,
} from '@mui/material'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import * as MuiIcons from '@mui/icons-material'
import type { ShopItem } from '../../models/shop'

interface ShopItemCardProps {
  item: ShopItem
  mode: 'view' | 'manage'
  userPoints?: number
  onBuy?: (item: ShopItem) => void
  onEdit?: (item: ShopItem) => void
  onDelete?: (item: ShopItem) => void
}

export function ShopItemCard({
  item,
  mode,
  userPoints = 0,
  onBuy,
  onEdit,
  onDelete,
}: ShopItemCardProps) {
  const canAfford = userPoints >= item.price
  const isAvailable = item.quantity > 0

  const renderIcon = () => {
    if (item.iconType === 'emoji') {
      return (
        <Typography component="div" sx={{ fontSize: "4rem", textAlign: "center" }}>
          {item.iconValue}
        </Typography>
      )
    } else {
      const IconComponent = (MuiIcons as any)[item.iconValue]
      return IconComponent ? (
        <IconComponent sx={{ fontSize: '4rem', color: 'primary.main' }} />
      ) : null
    }
  }

  return (
    <Card
      elevation={3}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        opacity: mode === 'view' && !isAvailable ? 0.6 : 1,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: mode === 'view' && isAvailable ? 'translateY(-4px)' : 'none',
          boxShadow: mode === 'view' && isAvailable ? 6 : 3,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
          {renderIcon()}
        </Box>

        <Typography
          variant="h6"
          component="div"
          gutterBottom
          sx={{ fontFamily: '"Fredoka", sans-serif', fontWeight: 700 }}
        >
          {item.name}
        </Typography>

        {item.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {item.description}
          </Typography>
        )}

        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap', mb: 1 }}>
          <Chip
            label={`${item.price} pontos`}
            color="primary"
            size="small"
            sx={{
              fontFamily: '"Fredoka", sans-serif',
              fontWeight: 700,
            }}
          />

          <Chip
            label={`${item.quantity} disponível${item.quantity !== 1 ? 'is' : ''}`}
            color={item.quantity > 0 ? 'success' : 'error'}
            size="small"
            variant="outlined"
          />
        </Box>

        {mode === 'view' && !isAvailable && (
          <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
            Esgotado
          </Typography>
        )}

        {mode === 'view' && isAvailable && !canAfford && (
          <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 1 }}>
            Pontos insuficientes
          </Typography>
        )}
      </CardContent>

      <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
        {mode === 'view' ? (
          <Button
            variant="contained"
            startIcon={<ShoppingCartIcon />}
            disabled={!isAvailable || !canAfford}
            onClick={() => onBuy?.(item)}
            fullWidth
            sx={{ mx: 2 }}
          >
            Comprar
          </Button>
        ) : (
          <Box sx={{ display: 'flex', gap: 1, width: '100%', px: 2 }}>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => onEdit?.(item)}
              fullWidth
              size="small"
            >
              Editar
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => onDelete?.(item)}
              fullWidth
              size="small"
            >
              Deletar
            </Button>
          </Box>
        )}
      </CardActions>
    </Card>
  )
}
