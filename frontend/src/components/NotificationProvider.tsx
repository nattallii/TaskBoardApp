import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Box, CloseButton, Text, VStack } from '@chakra-ui/react'
import { subscribeToNotifications } from '../lib/notificationBus'

interface NotificationProviderProps {
  children: ReactNode
}

interface ActiveNotification {
  id: string
  status: 'success' | 'error' | 'info' | 'warning'
  title: string
  description?: string
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<ActiveNotification[]>([])

  useEffect(() => {
    const unsubscribe = subscribeToNotifications((notification) => {
      const id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
      setNotifications((prev) => [...prev, { ...notification, id }])
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
      }, 5000)
    })
    return () => unsubscribe()
  }, [])

  const dismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const getColors = (status: ActiveNotification['status']) => {
    switch (status) {
      case 'success':
        return { bg: 'green.50', border: 'green.300', text: 'green.900' }
      case 'error':
        return { bg: 'red.50', border: 'red.300', text: 'red.900' }
      case 'warning':
        return { bg: 'yellow.50', border: 'yellow.300', text: 'yellow.900' }
      default:
        return { bg: 'blue.50', border: 'blue.300', text: 'blue.900' }
    }
  }

  return (
    <>
      {children}
      <Box position="fixed" top={4} right={4} zIndex="toast">
        <VStack align="stretch" gap={3}>
          {notifications.map((notification) => {
            const colors = getColors(notification.status)
            return (
              <Box
                key={notification.id}
                bg={colors.bg}
                border="1px solid"
                borderColor={colors.border}
                color={colors.text}
                borderRadius="md"
                p={3}
                boxShadow="md"
                minW="280px"
              >
                <CloseButton float="right" onClick={() => dismiss(notification.id)} />
                <Text fontWeight="semibold" pr={6}>
                  {notification.title}
                </Text>
                {notification.description && (
                  <Text fontSize="sm" mt={1}>
                    {notification.description}
                  </Text>
                )}
              </Box>
            )
          })}
        </VStack>
      </Box>
    </>
  )
}
