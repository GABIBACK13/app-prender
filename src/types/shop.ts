export type IconType = 'emoji' | 'material'

export interface ShopItem {
  id: string
  userId: string
  name: string
  description: string
  iconType: IconType
  iconValue: string
  price: number
  quantity: number
  createdAt: Date
}

export interface Purchase {
  id: string
  userId: string
  itemId: string
  itemName: string
  iconType: IconType
  iconValue: string
  purchasedAt: Date
  pointsSpent: number
}

export interface ShopItemFormData {
  name: string
  description: string
  iconType: 'emoji' | 'material'
  iconValue: string
  price: number
  quantity: number
}
