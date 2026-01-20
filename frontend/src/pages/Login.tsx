import { Box, Button, chakra, Flex, Heading, Input, Text, VStack, HStack } from '@chakra-ui/react'
import { useMemo, useState } from 'react'
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom'
import { authClient } from '../api/authClient'
import { useAuthStore } from '../store/auth'
import { AuthShowcase } from '../components/AuthShowcase'
import { InlineAlert } from '../components/InlineAlert'
import type { BannerKind } from '../store/notificationStore'
import { notifyError, notifySuccess } from '../lib/notifications'
import { getApiErrorState } from '../utils/errorState'

const RouterLinkButton = chakra(RouterLink)

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorKind, setErrorKind] = useState<BannerKind>('generic')
  const [touched, setTouched] = useState({ email: false, password: false })
  const navigate = useNavigate()
  const location = useLocation()
  const setTokens = useAuthStore((state) => state.setTokens)
  const setUserId = useAuthStore((state) => state.setUserId)
  const from = (location.state as { from?: Location })?.from?.pathname ?? '/boards'

  const getEmailValidationState = (value: string, isTouched: boolean) => {
    const trimmed = value.trim()
    if (!isTouched) {
      return { message: 'Формат: name@company.com', isError: false }
    }
    if (!trimmed) {
      return { message: 'Заповніть поле', isError: true }
    }
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!pattern.test(trimmed)) {
      return { message: 'Email має містити @ та домен', isError: true }
    }
    return { message: 'Гарно виглядає 👌', isError: false }
  }

  const getPasswordValidationState = (value: string, isTouched: boolean) => {
    if (!isTouched) {
      return { message: 'Мінімум 6 символів, можна латиницю та цифри', isError: false }
    }
    if (!value) {
      return { message: 'Заповніть поле', isError: true }
    }
    if (value.length < 6) {
      return { message: 'Щонайменше 6 символів', isError: true }
    }
    return { message: 'Пароль підходить', isError: false }
  }

  const emailValidation = useMemo(() => getEmailValidationState(email, touched.email), [email, touched.email])
  const passwordValidation = useMemo(() => getPasswordValidationState(password, touched.password), [password, touched.password])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextTouched = { email: true, password: true }
    setTouched(nextTouched)
    const latestEmailValidation = getEmailValidationState(email, true)
    const latestPasswordValidation = getPasswordValidationState(password, true)
    if (latestEmailValidation.isError || latestPasswordValidation.isError) {
      setError(null)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const response = await authClient.login({ email, password })
      setTokens({
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
      })
      setUserId(response.user_id)
      notifySuccess('Ласкаво просимо назад', 'Перенаправляємо до ваших бордів')
      navigate(from, { replace: true })
    } catch (err) {
      const nextError = getApiErrorState(err, {
        fallbackMessage: 'Не вдалося увійти. Спробуйте ще раз за хвилину.',
        treatInvalidCredentials: true,
        invalidCredentialsMessage: 'Перевірте email та пароль і спробуйте ще раз.',
      })
      setError(nextError.message)
      setErrorKind(nextError.kind)
      notifyError('Не вдалося увійти', nextError.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box
      minH="100vh"
      bgGradient="linear(to-br, slate.50, surface.200)"
      px={{ base: 4, md: 10 }}
      py={{ base: 8, md: 12 }}
    >
      <Flex
        direction={{ base: 'column', lg: 'row' }}
        gap={{ base: 10, lg: 16 }}
        align="stretch"
        maxW="1200px"
        mx="auto"
      >
        <Box flex="1" display={{ base: 'none', md: 'block' }}>
          <AuthShowcase />
        </Box>
        <Box flex={{ base: 'unset', lg: '1' }} maxW="520px" mx="auto" w="full">
          <chakra.form
            onSubmit={handleSubmit}
            bg="white"
            borderRadius="2xl"
            p={{ base: 6, md: 8 }}
            border="1px solid"
            borderColor="border.subtle"
            boxShadow="0 20px 45px rgba(15, 23, 42, 0.08)"
            noValidate
          >
            <VStack align="stretch" gap={6}>
              <VStack align="flex-start" gap={1}>
                <Text fontSize="sm" textTransform="uppercase" letterSpacing="0.3em" color="text.subtle">
                  TaskBoard
                </Text>
                <Heading size="lg">Увійдіть до Workspace</Heading>
              </VStack>

              {error && (
                <InlineAlert
                  kind={errorKind}
                  message={error}
                  onClose={() => setError(null)}
                  compact
                />
              )}

              <VStack gap={4}>
                <Box w="full">
                  <Text mb={1} fontWeight="medium">
                    Email
                  </Text>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                    autoComplete="email"
                    required
                    size="lg"
                    borderRadius="lg"
                    borderColor={emailValidation.isError ? 'red.400' : undefined}
                    aria-invalid={emailValidation.isError}
                  />
                  <Text fontSize="xs" mt={1} color={emailValidation.isError ? 'red.500' : 'text.subtle'}>
                    {emailValidation.message}
                  </Text>
                </Box>
                <Box w="full">
                  <Text mb={1} fontWeight="medium">
                    Пароль
                  </Text>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                    autoComplete="current-password"
                    required
                    size="lg"
                    borderRadius="lg"
                    borderColor={passwordValidation.isError ? 'red.400' : undefined}
                    aria-invalid={passwordValidation.isError}
                  />
                  <Text fontSize="xs" mt={1} color={passwordValidation.isError ? 'red.500' : 'text.subtle'}>
                    {passwordValidation.message}
                  </Text>
                </Box>
              </VStack>

              <VStack gap={4} align="stretch">
                <Button colorPalette="brand" type="submit" loading={isLoading}>
                  Продовжити
                </Button>
                <HStack justify="center" fontSize="sm" color="text.subtle">
                  <Text>Не маєте акаунта?</Text>
                  <RouterLinkButton
                    to="/register"
                    color="brand.500"
                    fontWeight="semibold"
                    textDecoration="underline"
                  >
                    Створити
                  </RouterLinkButton>
                </HStack>
              </VStack>

            </VStack>
          </chakra.form>
        </Box>
      </Flex>
    </Box>
  )
}
