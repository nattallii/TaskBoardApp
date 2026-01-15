import { Box, Button, chakra, Flex, Heading, Input, Text, VStack, HStack } from '@chakra-ui/react'
import { useMemo, useState } from 'react'
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom'
import { authClient } from '../api/authClient'
import { useAuthStore } from '../store/auth'
import { AuthShowcase } from '../components/AuthShowcase'
import { InlineAlert } from '../components/InlineAlert'
import type { BannerKind } from '../store/notificationStore'
import { notifyError, notifySuccess } from '../lib/notifications'
import { getApiErrorState } from '../utils/errorState'

const RouterLinkStyled = chakra(RouterLink)

export function RegisterPage() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [errorKind, setErrorKind] = useState<BannerKind>('generic')
  const [isLoading, setIsLoading] = useState(false)
  const [touched, setTouched] = useState({ email: false, username: false, password: false, confirm: false })
  const navigate = useNavigate()
  const location = useLocation()
  const setTokens = useAuthStore((state) => state.setTokens)
  const setUserId = useAuthStore((state) => state.setUserId)
  const redirectTo = (location.state as { from?: Location })?.from?.pathname ?? '/boards'

  const getUsernameValidationState = (value: string, isTouched: boolean) => {
    if (!isTouched) {
      return { message: '2-20 латинських символів або цифр', isError: false }
    }
    const trimmed = value.trim()
    if (!trimmed) {
      return { message: 'Заповніть поле', isError: true }
    }
    if (!/^[a-zA-Z0-9._-]{2,20}$/.test(trimmed)) {
      return { message: 'Можна латиницю, цифри, . _ - (2-20 символів)', isError: true }
    }
    return { message: 'Добре виглядає 👌', isError: false }
  }

  const getEmailValidationState = (value: string, isTouched: boolean) => {
    if (!isTouched) {
      return { message: 'Формат: name@company.com', isError: false }
    }
    const trimmed = value.trim()
    if (!trimmed) {
      return { message: 'Заповніть поле', isError: true }
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return { message: 'Email має містити @ та домен', isError: true }
    }
    return { message: 'Все гаразд', isError: false }
  }

  const getPasswordValidationState = (value: string, isTouched: boolean) => {
    if (!isTouched) {
      return { message: 'Мінімум 6 символів, латиниця/цифри', isError: false }
    }
    if (!value) {
      return { message: 'Заповніть поле', isError: true }
    }
    if (value.length < 6) {
      return { message: 'Щонайменше 6 символів', isError: true }
    }
    if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) {
      return { message: 'Додайте літери та цифри', isError: true }
    }
    return { message: 'Надійний пароль', isError: false }
  }

  const getConfirmValidationState = (
    value: string,
    passwordValue: string,
    isTouched: boolean,
  ) => {
    if (!isTouched) {
      return { message: 'Повторіть пароль для підтвердження', isError: false }
    }
    if (!value) {
      return { message: 'Заповніть поле', isError: true }
    }
    if (value !== passwordValue) {
      return { message: 'Паролі не збігаються', isError: true }
    }
    return { message: 'Паролі збігаються', isError: false }
  }

  const usernameValidation = useMemo(
    () => getUsernameValidationState(username, touched.username),
    [username, touched.username],
  )
  const emailValidation = useMemo(() => getEmailValidationState(email, touched.email), [email, touched.email])
  const passwordValidation = useMemo(
    () => getPasswordValidationState(password, touched.password),
    [password, touched.password],
  )
  const confirmValidation = useMemo(
    () => getConfirmValidationState(confirmPassword, password, touched.confirm),
    [confirmPassword, password, touched.confirm],
  )

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setTouched({ email: true, username: true, password: true, confirm: true })
    const latestUsername = getUsernameValidationState(username, true)
    const latestEmail = getEmailValidationState(email, true)
    const latestPassword = getPasswordValidationState(password, true)
    const latestConfirm = getConfirmValidationState(confirmPassword, password, true)
    if (latestUsername.isError || latestEmail.isError || latestPassword.isError || latestConfirm.isError) {
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const response = await authClient.register({ email, password, username })
      setTokens({
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
      })
      setUserId(response.user_id)
      notifySuccess('Профіль створено', 'Ми підготували для вас дошку')
      navigate(redirectTo, { replace: true })
    } catch (err) {
      const nextError = getApiErrorState(err, {
        fallbackMessage: 'Не вдалося створити акаунт. Спробуйте ще раз трохи пізніше.',
      })
      setError(nextError.message)
      setErrorKind(nextError.kind)
      notifyError('Реєстрація не вдалася', nextError.message)
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
        direction={{ base: 'column', lg: 'row-reverse' }}
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
                <Heading size="lg">Створіть аккаунт</Heading>
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
                <Box>
                  <Text mb={1} fontWeight="medium">
                    Імʼя користувача
                  </Text>
                  <Input
                    placeholder="yourname"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onBlur={() => setTouched((prev) => ({ ...prev, username: true }))}
                    autoComplete="username"
                    required
                    size="lg"
                    borderRadius="lg"
                    borderColor={usernameValidation.isError ? 'red.400' : undefined}
                    aria-invalid={usernameValidation.isError}
                  />
                  <Text fontSize="xs" mt={1} color={usernameValidation.isError ? 'red.500' : 'text.subtle'}>
                    {usernameValidation.message}
                  </Text>
                </Box>
                <Box>
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
                <Box>
                  <Text mb={1} fontWeight="medium">
                    Пароль
                  </Text>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                    autoComplete="new-password"
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
                <Box>
                  <Text mb={1} fontWeight="medium">
                    Підтвердіть пароль
                  </Text>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onBlur={() => setTouched((prev) => ({ ...prev, confirm: true }))}
                    autoComplete="new-password"
                    required
                    size="lg"
                    borderRadius="lg"
                    borderColor={confirmValidation.isError ? 'red.400' : undefined}
                    aria-invalid={confirmValidation.isError}
                  />
                  <Text fontSize="xs" mt={1} color={confirmValidation.isError ? 'red.500' : 'text.subtle'}>
                    {confirmValidation.message}
                  </Text>
                </Box>
              </VStack>

              <VStack gap={4} align="stretch">
                <Button colorPalette="brand" type="submit" loading={isLoading}>
                  Створити обліковий запис
                </Button>
                <HStack justify="center" fontSize="sm" color="text.subtle">
                  <Text>Вже маєте акаунт?</Text>
                  <RouterLinkStyled to="/login" color="brand.500" fontWeight="semibold" textDecoration="underline">
                    Увійти
                  </RouterLinkStyled>
                </HStack>
              </VStack>

            </VStack>
          </chakra.form>
        </Box>
      </Flex>
    </Box>
  )
}
