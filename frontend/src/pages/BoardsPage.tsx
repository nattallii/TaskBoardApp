import {
  Box,
  Button,
  Heading,
  HStack,
  IconButton,
  Input,
  SimpleGrid,
  Skeleton,
  SkeletonText,
  Text,
  Textarea,
  VStack,
  chakra,
} from '@chakra-ui/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { boardClient, type BoardListResponse } from '../api/boardClient'
import { InlineAlert } from '../components/InlineAlert'
import type { BannerKind } from '../store/notificationStore'
import { getApiErrorState } from '../utils/errorState'

type SortMode = 'recent' | 'alphabetical'

const SelectControl = chakra('select')

export function BoardsPage() {
  const [boards, setBoards] = useState<BoardListResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [errorKind, setErrorKind] = useState<BannerKind>('generic')
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [editingBoardId, setEditingBoardId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [isSavingBoard, setIsSavingBoard] = useState(false)
  const [deletingBoardId, setDeletingBoardId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>('recent')
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<{ id: number; title: string } | null>(null)
  const navigate = useNavigate()
  const createSectionRef = useRef<HTMLDivElement | null>(null)
  const titleInputRef = useRef<HTMLInputElement | null>(null)

  const setPageError = (message: string, kind: BannerKind = 'generic') => {
    setError(message)
    setErrorKind(kind)
  }

  const clearPageError = () => {
    setError(null)
    setErrorKind('generic')
  }

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const data = await boardClient.getBoards()
        setBoards(data)
      } catch (err) {
        const next = getApiErrorState(err, { fallbackMessage: 'Failed to load boards' })
        setPageError(next.message, next.kind)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBoards()
  }, [])

  const handleCreateBoard = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!newTitle.trim()) {
      setPageError('Please enter a board name')
      return
    }
    setIsCreating(true)
    clearPageError()
    try {
      const board = await boardClient.createBoard({
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
      })
      setBoards((prev) =>
        prev
          ? { boards: [board, ...prev.boards], total: prev.total + 1 }
          : { boards: [board], total: 1 },
      )
      setNewTitle('')
      setNewDescription('')
    } catch (err) {
      const next = getApiErrorState(err, { fallbackMessage: 'Failed to create board' })
      setPageError(next.message, next.kind)
    } finally {
      setIsCreating(false)
    }
  }

  const handleStartEdit = (boardId: number, title: string, description?: string | null) => {
    setEditingBoardId(boardId)
    setEditTitle(title)
    setEditDescription(description ?? '')
    clearPageError()
  }

  const handleCancelEdit = () => {
    setEditingBoardId(null)
    setEditTitle('')
    setEditDescription('')
  }

  const handleSaveEdit = async () => {
    if (!editingBoardId) {
      return
    }
    if (!editTitle.trim()) {
      setPageError('Board title is required')
      return
    }
    setIsSavingBoard(true)
    clearPageError()
    try {
      const updated = await boardClient.updateBoard(editingBoardId, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
      })
      setBoards((prev) => {
        if (!prev) return prev
        return {
          total: prev.total,
          boards: prev.boards.map((board) => (board.id === updated.id ? updated : board)),
        }
      })
      handleCancelEdit()
    } catch (err) {
      const next = getApiErrorState(err, { fallbackMessage: 'Failed to update board' })
      setPageError(next.message, next.kind)
    } finally {
      setIsSavingBoard(false)
    }
  }

  const handleDeleteBoard = async (boardId: number) => {
    const boardToDelete = boards?.boards.find((b) => b.id === boardId)
    if (!boardToDelete) {
      return
    }
    setDeletingBoardId(boardId)
    clearPageError()
    try {
      await boardClient.deleteBoard(boardId)
      setBoards((prev) => {
        if (!prev) return prev
        return {
          total: prev.total - 1,
          boards: prev.boards.filter((board) => board.id !== boardId),
        }
      })
      if (editingBoardId === boardId) {
        handleCancelEdit()
      }
    } catch (err) {
      const next = getApiErrorState(err, { fallbackMessage: 'Failed to delete board' })
      setPageError(next.message, next.kind)
    } finally {
      setDeletingBoardId(null)
      setPendingDelete((current) => (current?.id === boardId ? null : current))
    }
  }

  const promptDeleteBoard = (boardId: number) => {
    const boardToDelete = boards?.boards.find((b) => b.id === boardId)
    if (!boardToDelete) {
      return
    }
    setPendingDelete({ id: boardId, title: boardToDelete.title })
  }

  const filteredBoards = useMemo(() => {
    if (!boards?.boards) {
      return []
    }
    const term = searchTerm.trim().toLowerCase()
    let nextBoards = [...boards.boards]
    if (term) {
      nextBoards = nextBoards.filter((board) => {
        const title = board.title.toLowerCase()
        const description = board.description?.toLowerCase() ?? ''
        return title.includes(term) || description.includes(term)
      })
    }
    if (sortMode === 'alphabetical') {
      nextBoards.sort((a, b) => a.title.localeCompare(b.title))
    } else {
      nextBoards.sort((a, b) => b.id - a.id)
    }
    return nextBoards
  }, [boards, searchTerm, sortMode])

  const totalBoards = boards?.boards.length ?? 0
  const hasBoards = filteredBoards.length > 0

  const handleToggleCreateSection = () => {
    setIsCreateOpen((prev) => !prev)
  }

  useEffect(() => {
    if (isCreateOpen) {
      createSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      requestAnimationFrame(() => {
        titleInputRef.current?.focus()
      })
    }
  }, [isCreateOpen])

  const handleSortChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value
    if (value === 'recent' || value === 'alphabetical') {
      setSortMode(value)
    }
  }

  useEffect(() => {
    const closeMenu = () => setOpenMenuId(null)
    document.addEventListener('click', closeMenu)
    return () => document.removeEventListener('click', closeMenu)
  }, [])

  return (
    <Box p={8} bg="gray.50" minH="100vh">
      {pendingDelete && (
        <Box
          position="fixed"
          top={{ base: '16px', md: '24px' }}
          left="50%"
          transform="translateX(-50%)"
          bg="gray.900"
          color="white"
          px={{ base: 4, md: 6 }}
          py={{ base: 4, md: 5 }}
          borderRadius="xl"
          boxShadow="0 20px 40px rgba(15, 23, 42, 0.35)"
          zIndex={20}
          maxW="420px"
          w="calc(100% - 32px)"
        >
          <VStack align="stretch" gap={4}>
            <Box>
              <Text fontWeight="semibold" fontSize="lg" color="white">
                Видалити дошку «{pendingDelete.title}»?
              </Text>
              <Text fontSize="sm" color="gray.200" mt={1}>
                Цю дію не можна скасувати. Усі задачі та колонки будуть стерті назавжди.
              </Text>
            </Box>
            <HStack justify="flex-end" gap={3}>
              <Button
                variant="outline"
                size="sm"
                color="white"
                borderColor="whiteAlpha.600"
                _hover={{ bg: 'whiteAlpha.200' }}
                onClick={() => setPendingDelete(null)}
              >
                Скасувати
              </Button>
              <Button
                size="sm"
                colorScheme="red"
                loading={deletingBoardId === pendingDelete.id}
                onClick={() => handleDeleteBoard(pendingDelete.id)}
              >
                Видалити
              </Button>
            </HStack>
          </VStack>
        </Box>
      )}
      <VStack align="stretch" gap={6}>
        <HStack justify="space-between" align="center">
          <HStack align="center" gap={3}>
            <Heading>My Boards</Heading>
            <IconButton
              aria-label={isCreateOpen ? 'Hide create board form' : 'Show create board form'}
              variant="solid"
              colorScheme="blue"
              size="sm"
              borderRadius="full"
              onClick={handleToggleCreateSection}
            >
              <Box as="span" fontSize="lg" fontWeight="bold">
                {isCreateOpen ? '−' : '+'}
              </Box>
            </IconButton>
          </HStack>
        </HStack>
        {isCreateOpen && (
          <Box ref={createSectionRef} bg="white" p={6} rounded="lg" shadow="sm">
            <form onSubmit={handleCreateBoard}>
              <VStack align="stretch" gap={4}>
                <HStack justify="space-between">
                  <Heading size="md">Create new board</Heading>
                  <Button type="submit" colorScheme="blue" loading={isCreating}>
                    Create
                  </Button>
                </HStack>
                <Input
                  ref={titleInputRef}
                  placeholder="Board name"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
                <Textarea
                  placeholder="Short description (optional)"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  resize="vertical"
                  minH="80px"
                />
              </VStack>
            </form>
          </Box>
        )}
        <HStack gap={4} flexWrap="wrap">
          <Input
            placeholder="Search boards"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            maxW={{ base: 'full', md: '320px' }}
          />
          <SelectControl
            value={sortMode}
            onChange={handleSortChange}
            maxW={{ base: 'full', md: '220px' }}
            border="1px solid"
            borderColor="gray.200"
            rounded="md"
            px={3}
            py={2}
            bg="white"
            fontWeight="500"
          >
            <option value="recent">Newest first</option>
            <option value="alphabetical">Alphabetical</option>
          </SelectControl>
        </HStack>
        {isLoading && (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
            {Array.from({ length: 3 }).map((_, index) => (
              <Box key={index} bg="white" p={6} rounded="lg" shadow="sm">
                <Skeleton h="20px" w="60%" mb={4} />
                <SkeletonText noOfLines={3} gap={3} />
                <HStack gap={3} mt={4}>
                  <Skeleton h="32px" w="80px" borderRadius="md" />
                  <Skeleton h="32px" w="80px" borderRadius="md" />
                </HStack>
              </Box>
            ))}
          </SimpleGrid>
        )}
        {error && (
          <InlineAlert kind={errorKind} message={error} onClose={clearPageError} />
        )}
        {!isLoading && !error && hasBoards ? (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
            {filteredBoards.map((board) => {
              const isEditing = editingBoardId === board.id
              return (
                <Box key={board.id} bg="white" p={6} rounded="lg" shadow="sm">
                  {isEditing ? (
                    <VStack align="stretch" gap={3} mb={4}>
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Board title"
                      />
                      <Textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Description"
                        resize="vertical"
                      />
                    </VStack>
                  ) : (
                    <>
                      <Heading size="md">{board.title}</Heading>
                      <Text color="gray.500" fontSize="sm" mb={4}>
                        {board.description ?? 'No description provided'}
                      </Text>
                    </>
                  )}
                  <HStack gap={3} flexWrap="wrap">
                    <Button
                      colorScheme="blue"
                      size="sm"
                      onClick={() => navigate(`/boards/${board.id}`)}
                    >
                      Open
                    </Button>
                    {isEditing ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                          disabled={isSavingBoard}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          colorScheme="green"
                          onClick={handleSaveEdit}
                          loading={isSavingBoard}
                        >
                          Save
                        </Button>
                      </>
                    ) : (
                      <Box position="relative">
                        <IconButton
                          size="sm"
                          variant="ghost"
                          aria-label="Board actions"
                          onClick={(event) => {
                            event.stopPropagation()
                            setOpenMenuId((prev) => (prev === board.id ? null : board.id))
                          }}
                        >
                          <Box as="span" fontSize="xl" lineHeight="1">
                            ⋮
                          </Box>
                        </IconButton>
                        {openMenuId === board.id && (
                          <Box
                            position="absolute"
                            top="40px"
                            right={0}
                            bg="white"
                            border="1px solid"
                            borderColor="gray.200"
                            rounded="md"
                            shadow="lg"
                            minW="180px"
                            zIndex={10}
                            onClick={(event) => event.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              justifyContent="flex-start"
                              w="full"
                              borderBottom="1px solid"
                              borderColor="gray.100"
                              borderRadius={0}
                              onClick={() => {
                                handleStartEdit(board.id, board.title, board.description)
                                setOpenMenuId(null)
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              justifyContent="flex-start"
                              w="full"
                              colorScheme="red"
                              borderRadius={0}
                              disabled={deletingBoardId === board.id}
                              onClick={() => {
                                setOpenMenuId(null)
                                promptDeleteBoard(board.id)
                              }}
                            >
                              Delete
                            </Button>
                          </Box>
                        )}
                      </Box>
                    )}
                  </HStack>
                </Box>
              )
            })}
          </SimpleGrid>
        ) : null}
        {!isLoading && !error && totalBoards > 0 && !hasBoards && (
          <Box
            bg="white"
            border="1px dashed"
            borderColor="gray.200"
            rounded="lg"
            p={8}
            textAlign="center"
            color="gray.600"
          >
            No boards match your filters.
          </Box>
        )}
        {!isLoading && !error && totalBoards === 0 && (
          <Box
            bg="white"
            border="1px dashed"
            borderColor="gray.200"
            rounded="lg"
            p={8}
            textAlign="center"
            color="gray.600"
          >
            <Text fontWeight="bold" fontSize="lg" mb={2}>
              Create your first board
            </Text>
            <Text fontSize="sm">Use the form above to add your first project board.</Text>
          </Box>
        )}
      </VStack>
    </Box>
  )
}
