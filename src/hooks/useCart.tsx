import { createContext, ReactNode, useContext, useState } from 'react'
import { toast } from 'react-toastify'
import { api } from '../services/api'
import { Product, Stock } from '../types'

interface CartProviderProps {
  children: ReactNode
}

interface UpdateProductAmount {
  productId: number
  amount: number
}

interface CartContextData {
  cart: Product[]
  addProduct: (productId: number) => Promise<void>
  removeProduct: (productId: number) => void
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void
}

const CartContext = createContext<CartContextData>({} as CartContextData)

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart)
    } else {
      return []
    }
  })

  const addProduct = async (productId: number) => {
    try {
      const cartItems = [...cart]
      const currentProduct = cartItems.find(product => product.id === productId)
      const stock = await api.get(`/stock/${productId}`)

      const stockQuantity = stock.data.amount
      const currentQuantity = currentProduct ? currentProduct.amount : 0
      const quantity = currentQuantity + 1

      if (quantity > stockQuantity) {
        toast.error('Quantidade solicitada fora de estoque')
        return
      }

      if (currentProduct) {
        currentProduct.amount = quantity
      } else {
        const product = await api.get(`/products/${productId}`)

        const newProduct = {
          ...product.data,
          amount: 1
        }

        cartItems.push(newProduct)
      }

      setCart(cartItems)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartItems))
    } catch {
      toast.error('Erro na adição do produto')
    }
  }

  const removeProduct = (productId: number) => {
    try {
      const currentProducts = [...cart]
      const product = currentProducts.findIndex(
        product => product.id === productId
      )

      if (product >= 0) {
        currentProducts.splice(product, 1)
        setCart(currentProducts)

        const newCartList = currentProducts.filter(
          product => product.id !== productId
        )

        setCart(newCartList)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCartList))
      } else {
        throw Error()
      }
    } catch {
      toast.error('Erro na remoção do produto')
    }
  }

  const updateProductAmount = async ({
    productId,
    amount
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) return

      const stock = await api.get(`/stock/${productId}`)
      const stockAmount = stock.data.amount

      if (amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque')
        return
      }

      const cartItems = [...cart]

      const product = cartItems.find(item => item.id === productId)

      if (product) {
        product.amount = amount
        setCart(cartItems)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartItems))
      } else {
        throw Error()
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto')
    }
  }

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextData {
  const context = useContext(CartContext)

  return context
}
