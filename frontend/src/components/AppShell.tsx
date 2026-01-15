import {
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Text,
  useBreakpointValue,
  useDisclosure,
  VStack,
} from '@chakra-ui/react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { notifySuccess } from '../lib/notifications'
import { useLayoutStore } from '../store/layout'
import { useNotificationStore } from '../store/notificationStore'
import { InlineAlert } from './InlineAlert'

const links = [
  { label: 'Boards', path: '/boards' },
  { label: 'Profile', path: '/profile' },
]

const BurgerIcon = () => (
  <Box as="span" display="inline-flex" flexDirection="column" gap="3px">
    {[0, 1, 2].map((line) => (
      <Box key={line} w="18px" h="2px" bg="currentColor" borderRadius="full" />
    ))}
  </Box>
)

function DesktopNav({
  locationPath,
  onNavigate,
  onLogout,
}: {
  locationPath: string
  onNavigate: (path: string) => void
  onLogout: () => void
}) {
  return (
    <HStack gap={3} align="center">
      {links.map((link) => {
        const isActive = locationPath.startsWith(link.path)
        return (
          <Button
            key={link.path}
            variant={isActive ? 'solid' : 'ghost'}
            colorPalette="brand"
            size="sm"
            onClick={() => onNavigate(link.path)}
          >
            {link.label}
          </Button>
        )
      })}
      <Box w="1px" h="24px" bg="colors.border.subtle" />
      <Button size="sm" variant="outline" colorPalette="ocean" onClick={onLogout}>
        Logout
      </Button>
    </HStack>
  )
}

function MobileNav({
  isOpen,
  onClose,
  locationPath,
  onNavigate,
  onLogout,
}: {
  isOpen: boolean
  onClose: () => void
  locationPath: string
  onNavigate: (path: string) => void
  onLogout: () => void
}) {
  if (!isOpen) {
    return null
  }

  return (
    <Box position="fixed" inset={0} zIndex={25}>
      <Box position="absolute" inset={0} bg="rgba(15,23,42,0.45)" onClick={onClose} />
      <Box
        position="absolute"
        top={0}
        right={0}
        h="100%"
        w="80vw"
        maxW="320px"
        bg="colors.surface.100"
        borderBottomLeftRadius="2xl"
        p={6}
        display="flex"
        flexDirection="column"
        gap={5}
      >
        <HStack justify="space-between" align="center">
          <Text fontWeight="700">Menu</Text>
          <IconButton
            aria-label="Close menu"
            variant="ghost"
            colorPalette="brand"
            onClick={onClose}
          >
            ✕
          </IconButton>
        </HStack>
        <VStack align="stretch" gap={4} fontWeight="600">
          {links.map((link) => {
            const isActive = locationPath.startsWith(link.path)
            return (
              <Button
                key={link.path}
                variant={isActive ? 'solid' : 'ghost'}
                colorPalette="brand"
                justifyContent="flex-start"
                onClick={() => {
                  onNavigate(link.path)
                  onClose()
                }}
              >
                {link.label}
              </Button>
            )
          })}
        </VStack>
        <Box mt="auto">
          <Button variant="outline" colorPalette="ocean" w="full" onClick={onLogout}>
            Logout
          </Button>
        </Box>
      </Box>
    </Box>
  )
}

export function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const clearAuth = useAuthStore((state) => state.clear)
  const boardTitle = useLayoutStore((state) => state.boardTitle)
  const { open, onOpen, onClose } = useDisclosure()
  const isDesktop = useBreakpointValue({ base: false, md: true })
  const banner = useNotificationStore((state) => state.banner)
  const clearBanner = useNotificationStore((state) => state.clearBanner)

  const handleLogout = () => {
    clearAuth()
    notifySuccess('Signed out')
    navigate('/login', { replace: true })
  }

  const handleNavigate = (path: string) => {
    navigate(path)
  }

  return (
    <Box minH="100vh" bg="colors.surface.50">
      <Flex
        as="header"
        position="sticky"
        top={0}
        zIndex={20}
        bg="rgba(255,255,255,0.9)"
        backdropFilter="blur(12px)"
        borderBottom="1px solid"
        borderColor="colors.border.subtle"
        px={{ base: 4, md: 8 }}
        py={3}
        align="center"
        gap={4}
      >
        <HStack gap={3} cursor="pointer" onClick={() => handleNavigate('/boards')}>
          <Box
            w="40px"
            h="40px"
            borderRadius="xl"
            bgGradient="linear(to-br, colors.brand.400, colors.ocean.400)"
            display="flex"
            alignItems="center"
            justifyContent="center"
            color="white"
            fontWeight="700"
          >
            TB
          </Box>
          <Box lineHeight="1.1">
            <Text fontSize="lg" fontWeight="700">
              TaskBoard
            </Text>
            <Text fontSize="xs" color="colors.text.subtle">
              Personal kanban workspace
            </Text>
          </Box>
        </HStack>
        {boardTitle && (
          <Box flex={1} display={{ base: 'none', md: 'block' }} overflow="hidden">
            <Text fontWeight="600" color="colors.text.base" whiteSpace="nowrap" textOverflow="ellipsis">
              {boardTitle}
            </Text>
            <Text fontSize="xs" color="colors.text.subtle">
              Active board
            </Text>
          </Box>
        )}
        {isDesktop ? (
          <Box ml="auto">
            <DesktopNav
              locationPath={location.pathname}
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            />
          </Box>
        ) : (
          <IconButton
            ml="auto"
            aria-label="Open navigation menu"
            variant="ghost"
            colorPalette="brand"
            onClick={onOpen}
          >
            <BurgerIcon />
          </IconButton>
        )}
      </Flex>
      {!isDesktop && (
        <MobileNav
          isOpen={!!open}
          onClose={onClose}
          locationPath={location.pathname}
          onNavigate={handleNavigate}
          onLogout={() => {
            handleLogout()
            onClose()
          }}
        />
      )}
      <Box as="main" px={{ base: 4, md: 8 }} py={{ base: 6, md: 10 }}>
        {banner && (
          <Box mb={4}>
            <InlineAlert kind={banner.kind} message={banner.message} onClose={clearBanner} />
          </Box>
        )}
        <Outlet />
      </Box>
    </Box>
  )
}
