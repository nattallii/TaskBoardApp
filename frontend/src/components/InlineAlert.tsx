import { Box, CloseButton, Flex, Text, VStack } from '@chakra-ui/react'
import type { ReactNode } from 'react'
import type { BannerKind } from '../store/notificationStore'
import { getAlertTone } from '../constants/alerts'

interface InlineAlertProps {
  kind: BannerKind
  message: string
  title?: string
  onClose?: () => void
  actions?: ReactNode
  compact?: boolean
}

export function InlineAlert({ kind, message, title, onClose, actions, compact }: InlineAlertProps) {
  const tone = getAlertTone(kind)

  return (
    <Box
      border="1px solid"
      borderColor={tone.border}
      bg={tone.bg}
      color={tone.color}
      p={compact ? 3 : 4}
      rounded="lg"
    >
      <Flex justify="space-between" align="flex-start" gap={4} flexDir={compact ? 'column' : 'row'}>
        <VStack align="flex-start" gap={1} flex={1} minW={0}>
          <Text fontWeight="bold">{title ?? tone.title}</Text>
          <Text fontSize="sm" color={tone.color} whiteSpace="pre-wrap">
            {message}
          </Text>
          {actions}
        </VStack>
        {onClose && <CloseButton size="sm" onClick={onClose} aria-label="Dismiss alert" />}
      </Flex>
    </Box>
  )
}
