import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Typography,
  Box,
} from '@mui/material'
import { IconPicker } from '../IconPicker/IconPicker'
import type { ShopItem } from '../../models/shop'
import type { ShopItemFormData } from '../../types/shop'

export type { ShopItemFormData }

interface ShopItemFormProps {
  open: boolean
  mode: 'create' | 'edit'
  item?: ShopItem
  onSubmit: (data: ShopItemFormData) => void
  onCancel: () => void
}

export function ShopItemForm({ open, mode, item, onSubmit, onCancel }: ShopItemFormProps) {
  const [formData, setFormData] = useState<ShopItemFormData>({
    name: '',
    description: '',
    iconType: 'emoji',
    iconValue: '🎁',
    price: 10,
    quantity: 1,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Preenche o formulário quando estiver no modo edição
  useEffect(() => {
    if (mode === 'edit' && item) {
      setFormData({
        name: item.name,
        description: item.description,
        iconType: item.iconType,
        iconValue: item.iconValue,
        price: item.price,
        quantity: item.quantity,
      })
    } else {
      // Reset ao modo criar
      setFormData({
        name: '',
        description: '',
        iconType: 'emoji',
        iconValue: '🎁',
        price: 10,
        quantity: 1,
      })
    }
    setErrors({})
  }, [mode, item, open])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório.'
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Nome deve ter pelo menos 3 caracteres.'
    }

    if (!formData.iconValue) {
      newErrors.icon = 'Selecione um ícone.'
    }

    if (formData.price < 1) {
      newErrors.price = 'Preço deve ser pelo menos 1 ponto.'
    }

    if (formData.quantity < 0) {
      newErrors.quantity = 'Quantidade não pode ser negativa.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validate()) {
      onSubmit(formData)
    }
  }

  const handleChange = (field: keyof ShopItemFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Limpa o erro do campo ao editar
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>
        {mode === 'create' ? 'Adicionar Recompensa' : 'Editar Recompensa'}
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Nome da Recompensa"
            fullWidth
            required
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            error={!!errors.name}
            helperText={errors.name}
            placeholder="Ex: Sorvete, 30 min de videogame..."
          />

          <TextField
            label="Descrição (opcional)"
            fullWidth
            multiline
            rows={2}
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Descreva a recompensa..."
          />

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Ícone *
            </Typography>
            {errors.icon && (
              <Alert severity="error" sx={{ mb: 1 }}>
                {errors.icon}
              </Alert>
            )}
            <IconPicker
              selectedIcon={{ type: formData.iconType, value: formData.iconValue }}
              onSelect={(type, value) => {
                handleChange('iconType', type)
                handleChange('iconValue', value)
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Preço (pontos)"
              type="number"
              fullWidth
              required
              value={formData.price}
              onChange={(e) => handleChange('price', parseInt(e.target.value) || 0)}
              error={!!errors.price}
              helperText={errors.price}
              inputProps={{ min: 1 }}
            />

            <TextField
              label="Quantidade"
              type="number"
              fullWidth
              required
              value={formData.quantity}
              onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 0)}
              error={!!errors.quantity}
              helperText={errors.quantity || 'Estoque disponível'}
              inputProps={{ min: 0 }}
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onCancel}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained">
          {mode === 'create' ? 'Adicionar' : 'Salvar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
