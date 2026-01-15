import {
  Box,
  Button,
  Heading,
  HStack,
  Input,
  Spinner,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react'
import { useEffect, useMemo, useState } from 'react'
import { profileClient, type ProfileResponse } from '../api/profileClient'

type BannerState = { status: 'success' | 'error'; message: string } | null

export function ProfilePage() {
  const [profile, setProfile] = useState<ProfileResponse | null>(null)
  const [formValues, setFormValues] = useState({ username: '', bio: '' })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [banner, setBanner] = useState<BannerState>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const result = await profileClient.getProfile()
        setProfile(result)
        setFormValues({
          username: result.username ?? '',
          bio: result.bio ?? '',
        })
      } catch (err) {
        setBanner({
          status: 'error',
          message: err instanceof Error ? err.message : 'Failed to load profile',
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const initials = useMemo(() => {
    if (!formValues.username) {
      return 'U'
    }
    return formValues.username
      .split(' ')
      .map((part) => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('')
  }, [formValues.username])

  const isDirty =
    formValues.username !== (profile?.username ?? '') ||
    formValues.bio !== (profile?.bio ?? '')

  const handleChange = (field: 'username' | 'bio', value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }))
  }

  const handleReset = () => {
    if (!profile) return
    setFormValues({
      username: profile.username ?? '',
      bio: profile.bio ?? '',
    })
    setBanner(null)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)
    setBanner(null)
    try {
      const payload = {
        username: formValues.username.trim() || null,
        bio: formValues.bio.trim() || null,
      }
      const updated = await profileClient.updateProfile(payload)
      setProfile(updated)
      setFormValues({
        username: updated.username ?? '',
        bio: updated.bio ?? '',
      })
      setBanner({ status: 'success', message: 'Profile updated successfully' })
    } catch (err) {
      setBanner({
        status: 'error',
        message: err instanceof Error ? err.message : 'Failed to save profile',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <Box p={8} textAlign="center">
        <Spinner />
      </Box>
    )
  }

  return (
    <Box p={8}>
      <Heading mb={6}>Profile</Heading>
      <VStack align="stretch" gap={6} maxW="720px">
        {banner && (
          <Box
            bg={banner.status === 'success' ? 'green.50' : 'red.50'}
            color={banner.status === 'success' ? 'green.700' : 'red.700'}
            border="1px solid"
            borderColor={banner.status === 'success' ? 'green.200' : 'red.200'}
            p={3}
            rounded="md"
          >
            {banner.message}
          </Box>
        )}

        <Box bg="white" p={6} rounded="lg" shadow="sm">
          <HStack align="flex-start" gap={4} flexDir={{ base: 'column', md: 'row' }}>
            <Box
              w="80px"
              h="80px"
              rounded="full"
              bg="blue.500"
              color="white"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize="2xl"
              fontWeight="bold"
            >
              {initials}
            </Box>
            <Box flex="1">
              <Text fontSize="lg" fontWeight="semibold">
                {formValues.username || 'Unnamed user'}
              </Text>
              <Text color="gray.500" mb={2}>
                Account ID #{profile?.user_id ?? '—'}
              </Text>
              <Text color="gray.600">
                This information is visible to teammates across boards you share.
              </Text>
            </Box>
          </HStack>
        </Box>

        <form onSubmit={handleSubmit}>
          <Box bg="white" p={6} rounded="lg" shadow="sm">
            <Heading size="md" mb={4}>
              Edit profile
            </Heading>
            <VStack align="stretch" gap={4}>
              <Box>
                <Text mb={1} fontWeight="medium">
                  Username
                </Text>
                <Input
                  placeholder="Your display name"
                  value={formValues.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                />
              </Box>

              <Box>
                <Text mb={1} fontWeight="medium">
                  Bio
                </Text>
                <Textarea
                  placeholder="Tell the team a bit about yourself"
                  value={formValues.bio}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  rows={4}
                />
              </Box>

              <HStack justify="flex-end" gap={3}>
                <Button onClick={handleReset} variant="ghost" disabled={!isDirty || isSaving}>
                  Reset
                </Button>
                <Button
                  type="submit"
                  colorScheme="blue"
                  disabled={!isDirty || isSaving}
                  loading={isSaving}
                >
                  Save changes
                </Button>
              </HStack>
            </VStack>
          </Box>
        </form>
      </VStack>
    </Box>
  )
}
