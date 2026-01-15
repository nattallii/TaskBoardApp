import {
  Avatar,
  AvatarGroup,
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  IconButton,
  Input,
  Skeleton,
  SkeletonText,
  Text,
  Textarea,
  VStack,
  useDisclosure,
} from '@chakra-ui/react'
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { boardClient, type Board, type Column, type Task } from '../api/boardClient'
import { taskClient } from '../api/taskClient'
import { columnClient } from '../api/columnClient'
import { notifyError, notifySuccess } from '../lib/notifications'
import { InlineAlert } from '../components/InlineAlert'
import type { BannerKind } from '../store/notificationStore'
import { getApiErrorState } from '../utils/errorState'
import { DEFAULT_COLUMNS, FALLBACK_COLUMN_COLORS } from '../constants/columns'

const withAlpha = (hex: string, alpha: number) => {
  const sanitized = hex.replace('#', '')
  if (sanitized.length !== 6) {
    return hex
  }
  const clamped = Math.max(0, Math.min(1, alpha))
  const channel = Math.round(clamped * 255)
    .toString(16)
    .padStart(2, '0')
  return `#${sanitized}${channel}`
}

const normalizeColumnTitle = (value: string) => value.trim().toLowerCase().replace(/\s+/g, '')

export function BoardDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [board, setBoard] = useState<Board | null>(null)
  const [columns, setColumns] = useState<Column[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [errorKind, setErrorKind] = useState<BannerKind>('generic')
  const [newColumnTitle, setNewColumnTitle] = useState('')
  const [isCreatingColumn, setIsCreatingColumn] = useState(false)
  const [taskDrafts, setTaskDrafts] = useState<Record<
    number,
    { title: string; description: string }
  >>({})
  const [taskLoading, setTaskLoading] = useState<Record<number, boolean>>({})
  const [editingColumnId, setEditingColumnId] = useState<number | null>(null)
  const [columnTitleDraft, setColumnTitleDraft] = useState('')
  const [savingColumnId, setSavingColumnId] = useState<number | null>(null)
  const [deletingColumnId, setDeletingColumnId] = useState<number | null>(null)
  const [isReorderingColumns, setIsReorderingColumns] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null)
  const [editingTaskColumnId, setEditingTaskColumnId] = useState<number | null>(null)
  const [taskEditDraft, setTaskEditDraft] = useState({ title: '', description: '' })
  const [savingTaskId, setSavingTaskId] = useState<number | null>(null)
  const [deletingTaskId, setDeletingTaskId] = useState<number | null>(null)
  const [taskAssignDrafts, setTaskAssignDrafts] = useState<Record<number, string>>({})
  const [assigningTaskId, setAssigningTaskId] = useState<number | null>(null)
  const [assignFormVisibility, setAssignFormVisibility] = useState<Record<number, boolean>>({})
  const [taskFormVisibility, setTaskFormVisibility] = useState<Record<number, boolean>>({})
  const [columnColors, setColumnColors] = useState<Record<number, string>>({})
  const [openColumnMenuId, setOpenColumnMenuId] = useState<number | null>(null)
  const [pendingDeletion, setPendingDeletion] = useState<
    | { type: 'column'; id: number; title: string }
    | { type: 'task'; id: number; title: string; columnId: number }
    | null
  >(null)
  const {
    open: isTaskDrawerOpen,
    onOpen: openTaskDrawer,
    onClose: closeTaskDrawer,
  } = useDisclosure()
  const fallbackColorIndexRef = useRef(0)
  const hasEnsuredDefaultsRef = useRef(false)
  const ensureInFlightRef = useRef(false)
  const ensuredBoardIdRef = useRef<number | null>(null)
  const totalTasks = useMemo(
    () => columns.reduce((count, column) => count + column.tasks.length, 0),
    [columns],
  )
  const collaboratorIds = useMemo(() => {
    const ids = new Set<number>()
    columns.forEach((column) => {
      column.tasks.forEach((task) => {
        if (task.assignee_id) {
          ids.add(task.assignee_id)
        }
      })
    })
    return Array.from(ids)
  }, [columns])
  const selectedTask = useMemo(() => {
    if (!editingTaskId || !editingTaskColumnId) {
      return null
    }
    const column = columns.find((col) => col.id === editingTaskColumnId)
    if (!column) {
      return null
    }
    const task = column.tasks.find((item) => item.id === editingTaskId)
    if (!task) {
      return null
    }
    return { column, task }
  }, [columns, editingTaskColumnId, editingTaskId])

  useEffect(() => {
    const closeMenu = () => setOpenColumnMenuId(null)
    document.addEventListener('click', closeMenu)
    return () => document.removeEventListener('click', closeMenu)
  }, [])

  const setPageError = useCallback((message: string, kind: BannerKind = 'generic') => {
    setError(message)
    setErrorKind(kind)
  }, [])

  const clearPageError = useCallback(() => {
    setError(null)
    setErrorKind('generic')
  }, [])

  const assignApiError = useCallback(
    (err: unknown, fallback: string) => {
      const next = getApiErrorState(err, { fallbackMessage: fallback })
      setPageError(next.message, next.kind)
      return next
    },
    [setPageError],
  )

  const errorAlert = error ? (
    <InlineAlert kind={errorKind} message={error} onClose={clearPageError} />
  ) : null
  const pageGradient = 'linear(to-br, #e0f2ff, #f5f0ff)'
  const surfaceBg = 'rgba(255,255,255,0.92)'
  const columnSurface = 'rgba(255,255,255,0.95)'
  const mutedText = '#4A5568'
  const dividerColor = 'rgba(226,232,240,0.9)'
  const taskBorderColor = 'rgba(226,232,240,0.9)'
  const addTaskSurface = '#F7FAFC'

  useEffect(() => {
    const fetchBoard = async () => {
      if (!id) {
        setPageError('Missing board id')
        setIsLoading(false)
        return
      }
      try {
        const data = await boardClient.getBoard(Number(id))
        setBoard(data)
        const normalizedColumns = [...data.columns]
          .sort((a, b) => a.position - b.position)
          .map((column) => ({
            ...column,
            tasks: [...column.tasks].sort((a, b) => a.position - b.position),
          }))
        setColumns(normalizedColumns)
        const hasAllDefaultPresets = DEFAULT_COLUMNS.every((preset) =>
          normalizedColumns.some(
            (column) => normalizeColumnTitle(column.title) === normalizeColumnTitle(preset.title),
          ),
        )
        hasEnsuredDefaultsRef.current =
          hasAllDefaultPresets && ensuredBoardIdRef.current === data.id && !ensureInFlightRef.current
        if (!hasAllDefaultPresets) {
          ensuredBoardIdRef.current = null
        }
        setTaskAssignDrafts(() => {
          const next: Record<number, string> = {}
          normalizedColumns.forEach((column) => {
            column.tasks.forEach((task) => {
              next[task.id] = task.assignee_id?.toString() ?? ''
            })
          })
          return next
        })
      } catch (err) {
        assignApiError(err, 'Failed to load board')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBoard()
  }, [id, assignApiError, setPageError])

  const columnTitleSignature = useMemo(
    () => columns.map((column) => normalizeColumnTitle(column.title)).sort().join('|'),
    [columns],
  )

  // Auto-create default Kanban columns when a board has fewer than required presets
  useEffect(() => {
    if (!board || !columns.length || hasEnsuredDefaultsRef.current || ensureInFlightRef.current) {
      return
    }

    const missingDefaults = DEFAULT_COLUMNS.filter(
      (preset) =>
        !columns.some(
          (column) => normalizeColumnTitle(column.title) === normalizeColumnTitle(preset.title),
        ),
    )

    if (!missingDefaults.length) {
      hasEnsuredDefaultsRef.current = true
      ensuredBoardIdRef.current = board.id
      return
    }

    hasEnsuredDefaultsRef.current = true
    ensureInFlightRef.current = true

    const ensureColumns = async () => {
      try {
        let nextPosition = columns.length + 1
        for (const preset of missingDefaults) {
          await columnClient.createColumn({
            board_id: board.id,
            title: preset.title,
            position: nextPosition,
          })
          nextPosition += 1
        }
        notifySuccess('Default columns added')
        const updatedBoard = await boardClient.getBoard(board.id)
        setBoard(updatedBoard)
        setColumns(
          [...updatedBoard.columns]
            .sort((a, b) => a.position - b.position)
            .map((column) => ({
              ...column,
              tasks: [...column.tasks].sort((a, b) => a.position - b.position),
            })),
        )
        ensuredBoardIdRef.current = board.id
      } catch (err) {
        notifyError('Failed to create default columns', err instanceof Error ? err.message : undefined)
        hasEnsuredDefaultsRef.current = false
      } finally {
        ensureInFlightRef.current = false
      }
    }

    ensureColumns()
  }, [board, columns, columnTitleSignature])

  const getDefaultColorForColumn = (column: Column) => {
    const matchedPreset = DEFAULT_COLUMNS.find(
      (preset) => normalizeColumnTitle(preset.title) === normalizeColumnTitle(column.title),
    )
    if (matchedPreset) {
      return matchedPreset.color
    }
    const color = FALLBACK_COLUMN_COLORS[fallbackColorIndexRef.current % FALLBACK_COLUMN_COLORS.length]
    fallbackColorIndexRef.current += 1
    return color
  }

  useEffect(() => {
    if (!columns.length) {
      return
    }
    setColumnColors((prev) => {
      const next = { ...prev }
      columns.forEach((column) => {
        if (!next[column.id]) {
          const stored = localStorage.getItem(`column-color-${column.id}`)
          if (stored) {
            next[column.id] = stored
          } else {
            const color = getDefaultColorForColumn(column)
            next[column.id] = color
            localStorage.setItem(`column-color-${column.id}`, color)
          }
        }
      })
      return next
    })
  }, [columns])

  const handleColumnColorChange = (columnId: number, color: string) => {
    setColumnColors((prev) => ({ ...prev, [columnId]: color }))
    localStorage.setItem(`column-color-${columnId}`, color)
  }

  const getColumnColor = (columnId: number) => columnColors[columnId] ?? '#CBD5F5'

  const getTaskStyleForColumn = (columnId: number) => {
    const color = getColumnColor(columnId)
    return {
      borderTop: `4px solid ${color}`,
      backgroundColor: '#FFFFFF',
      boxShadow: '0 15px 35px rgba(15, 23, 42, 0.08)',
    }
  }

  const colorPicker = (columnId: number, currentColor: string) => (
    <Box position="relative" w="32px" h="32px">
      <Box
        position="absolute"
        inset={0}
        borderRadius="full"
        border="1px solid rgba(0,0,0,0.1)"
        bg={currentColor}
      />
      <Input
        type="color"
        value={currentColor}
        onChange={(e) => handleColumnColorChange(columnId, e.target.value)}
        position="absolute"
        inset={0}
        opacity={0}
        cursor="pointer"
        p={0}
      />
    </Box>
  )

  const handleCreateColumn = async (event: FormEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (!board || !newColumnTitle.trim()) {
      setPageError('Please enter a column title')
      return
    }
    setIsCreatingColumn(true)
    clearPageError()
    try {
      const created = await columnClient.createColumn({
        board_id: board.id,
        title: newColumnTitle.trim(),
        position: columns.length + 1,
      })
      setColumns((prev) => [...prev, { ...created, tasks: [] }])
      setNewColumnTitle('')
    } catch (err) {
      assignApiError(err, 'Failed to create column')
    } finally {
      setIsCreatingColumn(false)
    }
  }

  const handleDraftChange = (
    columnId: number,
    field: 'title' | 'description',
    value: string,
  ) => {
    setTaskDrafts((prev) => ({
      ...prev,
      [columnId]: {
        title: prev[columnId]?.title ?? '',
        description: prev[columnId]?.description ?? '',
        [field]: value,
      },
    }))
  }

  const resetDraft = (columnId: number) => {
    setTaskDrafts((prev) => ({
      ...prev,
      [columnId]: { title: '', description: '' },
    }))
  }

  const setTaskFormOpen = (columnId: number, isOpen: boolean) => {
    setTaskFormVisibility((prev) => ({
      ...prev,
      [columnId]: isOpen,
    }))
  }

  const openAssignForm = (taskId: number) => {
    setAssignFormVisibility((prev) => ({
      ...prev,
      [taskId]: true,
    }))
  }

  const closeAssignForm = (taskId: number) => {
    setAssignFormVisibility((prev) => {
      const next = { ...prev }
      delete next[taskId]
      return next
    })
  }

  const handleCreateTask = async (event: FormEvent<HTMLDivElement>, columnId: number) => {
    event.preventDefault()
    const draft = taskDrafts[columnId] ?? { title: '', description: '' }
    if (!draft.title.trim()) {
      setPageError('Please enter a task title')
      return
    }
    setTaskLoading((prev) => ({ ...prev, [columnId]: true }))
    clearPageError()
    try {
      const created = await taskClient.createTask({
        column_id: columnId,
        title: draft.title.trim(),
        description: draft.description.trim() || undefined,
        position: (columns.find((column) => column.id === columnId)?.tasks.length ?? 0) + 1,
      })
      setColumns((prev) =>
        prev.map((column) =>
          column.id === columnId
            ? { ...column, tasks: [...column.tasks, created] }
            : column,
        ),
      )
      setTaskFormOpen(columnId, false)
      resetDraft(columnId)
      setTaskAssignDrafts((prev) => ({ ...prev, [created.id]: created.assignee_id?.toString() ?? '' }))
      notifySuccess('Task created', `"${created.title}" added to ${columns.find((col) => col.id === columnId)?.title ?? 'column'}`)
    } catch (err) {
      const next = assignApiError(err, 'Failed to create task')
      notifyError('Task creation failed', next.message)
    } finally {
      setTaskLoading((prev) => ({ ...prev, [columnId]: false }))
    }
  }

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result
    if (!destination || !board) {
      return
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    const sourceColumnId = Number(source.droppableId)
    const destinationColumnId = Number(destination.droppableId)

    setColumns((prevColumns) => {
      const updatedColumns = prevColumns.map((column) => ({ ...column, tasks: [...column.tasks] }))

      const sourceColumn = updatedColumns.find((column) => column.id === sourceColumnId)
      const destinationColumn = updatedColumns.find((column) => column.id === destinationColumnId)
      if (!sourceColumn || !destinationColumn) {
        return prevColumns
      }

      const taskIndex = sourceColumn.tasks.findIndex(
        (task) => `task-${task.id}` === draggableId,
      )
      if (taskIndex === -1) {
        return prevColumns
      }

      const [movedTask] = sourceColumn.tasks.splice(taskIndex, 1)
      destinationColumn.tasks.splice(destination.index, 0, movedTask)

      sourceColumn.tasks = sourceColumn.tasks.map((task, index) => ({
        ...task,
        position: index + 1,
      }))
      destinationColumn.tasks = destinationColumn.tasks.map((task, index) => ({
        ...task,
        column_id: destinationColumnId,
        position: index + 1,
      }))

      return updatedColumns
    })

    const taskId = Number(draggableId.replace('task-', ''))

    try {
      await taskClient.moveTask(taskId, {
        column_id: destinationColumnId,
        task_position: destination.index + 1,
      })
    } catch (err) {
      console.error('Failed to move task', err)
      // Reload board to sync state when request fails
      if (id) {
        const data = await boardClient.getBoard(Number(id))
        setBoard(data)
        const normalizedColumns = [...data.columns]
          .sort((a, b) => a.position - b.position)
          .map((column) => ({
            ...column,
            tasks: [...column.tasks].sort((a, b) => a.position - b.position),
          }))
        setColumns(normalizedColumns)
      }
    }
  }

  const handleStartEditColumn = (column: Column) => {
    setEditingColumnId(column.id)
    setColumnTitleDraft(column.title)
    setOpenColumnMenuId(null)
  }

  const handleCancelEditColumn = () => {
    setEditingColumnId(null)
    setColumnTitleDraft('')
  }

  const handleSaveColumn = async () => {
    if (!editingColumnId) {
      return
    }
    if (!columnTitleDraft.trim()) {
      setPageError('Column title is required')
      return
    }
    setSavingColumnId(editingColumnId)
    clearPageError()
    try {
      const updated = await columnClient.updateColumn(editingColumnId, {
        title: columnTitleDraft.trim(),
      })
      setColumns((prev) =>
        prev.map((column) =>
          column.id === updated.id ? { ...column, title: updated.title } : column,
        ),
      )
      handleCancelEditColumn()
    } catch (err) {
      assignApiError(err, 'Failed to update column')
    } finally {
      setSavingColumnId(null)
    }
  }

  const handleDeleteColumn = (columnId: number) => {
    const column = columns.find((col) => col.id === columnId)
    if (!column) {
      return
    }
    setOpenColumnMenuId(null)
    setPendingDeletion({ type: 'column', id: columnId, title: column.title })
  }

  const handleMoveColumn = async (columnId: number, direction: 'left' | 'right') => {
    if (!board) {
      return
    }
    const currentIndex = columns.findIndex((column) => column.id === columnId)
    if (currentIndex === -1) {
      return
    }
    const targetIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= columns.length) {
      return
    }

    const reordered = [...columns]
    const [moved] = reordered.splice(currentIndex, 1)
    reordered.splice(targetIndex, 0, moved)
    const orderPayload = reordered.map((column) => column.id)

    setIsReorderingColumns(true)
    clearPageError()
    try {
      await columnClient.reorderColumns(board.id, orderPayload)
      setColumns(reordered.map((column, index) => ({ ...column, position: index + 1 })))
      notifySuccess('Columns reordered')
    } catch (err) {
      const next = assignApiError(err, 'Failed to reorder columns')
      notifyError('Column reorder failed', next.message)
    } finally {
      setIsReorderingColumns(false)
    }
  }

  const handleStartEditTask = (columnId: number, task: Task) => {
    setEditingTaskId(task.id)
    setEditingTaskColumnId(columnId)
    setTaskEditDraft({ title: task.title, description: task.description ?? '' })
    openTaskDrawer()
  }

  const handleCancelEditTask = useCallback(() => {
    setEditingTaskId(null)
    setEditingTaskColumnId(null)
    setTaskEditDraft({ title: '', description: '' })
    closeTaskDrawer()
  }, [closeTaskDrawer])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenColumnMenuId(null)
        if (editingTaskId) {
          handleCancelEditTask()
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [editingTaskId, handleCancelEditTask])

  const handleSaveTask = async () => {
    if (!editingTaskId || !editingTaskColumnId) {
      return
    }
    if (!taskEditDraft.title.trim()) {
      setPageError('Task title is required')
      return
    }
    setSavingTaskId(editingTaskId)
    clearPageError()
    try {
      const updated = await taskClient.updateTask(editingTaskId, {
        title: taskEditDraft.title.trim(),
        description: taskEditDraft.description.trim() || undefined,
      })
      setColumns((prev) =>
        prev.map((column) =>
          column.id === editingTaskColumnId
            ? {
                ...column,
                tasks: column.tasks.map((task) =>
                  task.id === updated.id ? { ...task, ...updated } : task,
                ),
              }
            : column,
        ),
      )
      handleCancelEditTask()
      notifySuccess('Task updated', `"${updated.title}" saved`)
    } catch (err) {
      const next = assignApiError(err, 'Failed to update task')
      notifyError('Task update failed', next.message)
    } finally {
      setSavingTaskId(null)
    }
  }

  const handleDeleteTask = (columnId: number, task: Task) => {
    setPendingDeletion({ type: 'task', id: task.id, title: task.title, columnId })
  }

  const executePendingDeletion = async () => {
    if (!pendingDeletion) {
      return
    }
    clearPageError()
    if (pendingDeletion.type === 'column') {
      const columnId = pendingDeletion.id
      setDeletingColumnId(columnId)
      try {
        const removedTasks = columns.find((col) => col.id === columnId)?.tasks ?? []
        await columnClient.deleteColumn(columnId)
        setColumns((prev) =>
          prev
            .filter((col) => col.id !== columnId)
            .map((col, index) => ({ ...col, position: index + 1 })),
        )
        setTaskDrafts((prev) => {
          const next = { ...prev }
          delete next[columnId]
          return next
        })
        setTaskFormVisibility((prev) => {
          const next = { ...prev }
          delete next[columnId]
          return next
        })
        setTaskLoading((prev) => {
          const next = { ...prev }
          delete next[columnId]
          return next
        })
        if (removedTasks.length) {
          setTaskAssignDrafts((prev) => {
            const next = { ...prev }
            removedTasks.forEach((task) => {
              delete next[task.id]
            })
            return next
          })
          setAssignFormVisibility((prev) => {
            const next = { ...prev }
            removedTasks.forEach((task) => {
              delete next[task.id]
            })
            return next
          })
        }
        if (editingColumnId === columnId) {
          handleCancelEditColumn()
        }
      } catch (err) {
        assignApiError(err, 'Failed to delete column')
      } finally {
        setDeletingColumnId(null)
        setPendingDeletion(null)
      }
      return
    }

    const { columnId, id: taskId, title } = pendingDeletion
    setDeletingTaskId(taskId)
    try {
      await taskClient.deleteTask(taskId)
      setColumns((prev) =>
        prev.map((column) =>
          column.id === columnId
            ? {
                ...column,
                tasks: column.tasks
                  .filter((existing) => existing.id !== taskId)
                  .map((existing, index) => ({ ...existing, position: index + 1 })),
              }
            : column,
        ),
      )
      setTaskAssignDrafts((prev) => {
        const next = { ...prev }
        delete next[taskId]
        return next
      })
      setAssignFormVisibility((prev) => {
        const next = { ...prev }
        delete next[taskId]
        return next
      })
      notifySuccess('Task deleted', `"${title}" removed`)
      if (editingTaskId === taskId) {
        handleCancelEditTask()
      }
    } catch (err) {
      const next = assignApiError(err, 'Failed to delete task')
      notifyError('Task delete failed', next.message)
    } finally {
      setDeletingTaskId(null)
      setPendingDeletion(null)
    }
  }

  const handleAssignInputChange = (taskId: number, value: string) => {
    setTaskAssignDrafts((prev) => ({ ...prev, [taskId]: value }))
  }

  const handleAssignTask = async (columnId: number, task: Task) => {
    const rawValue = taskAssignDrafts[task.id] ?? ''
    if (rawValue.trim() && Number.isNaN(Number(rawValue))) {
      setPageError('Assignee must be a number')
      return
    }
    const assigneeId = rawValue.trim() ? Number(rawValue) : null
    setAssigningTaskId(task.id)
    clearPageError()
    try {
      const updated = await taskClient.assignTask(task.id, { assignee_id: assigneeId })
      setColumns((prev) =>
        prev.map((column) =>
          column.id === columnId
            ? {
                ...column,
                tasks: column.tasks.map((existing) =>
                  existing.id === task.id ? { ...existing, assignee_id: updated.assignee_id } : existing,
                ),
              }
            : column,
        ),
      )
      closeAssignForm(task.id)
      notifySuccess(
        assigneeId ? 'Task assigned' : 'Task unassigned',
        assigneeId
          ? `Assigned to user #${assigneeId}`
          : 'Task is now unassigned',
      )
    } catch (err) {
      const next = assignApiError(err, 'Failed to assign task')
      notifyError('Task assignment failed', next.message)
    } finally {
      setAssigningTaskId(null)
    }
  }

  const renderSkeletonColumns = () => (
    <HStack align="stretch" gap={5} overflowX="hidden">
      {Array.from({ length: 3 }).map((_, index) => (
        <VStack
          key={index}
          bg="rgba(255,255,255,0.9)"
          borderRadius="2xl"
          border="1px solid"
          borderColor={dividerColor}
          minW="320px"
          flex="0 0 320px"
          align="stretch"
          gap={4}
          p={5}
        >
          <Skeleton h="20px" w="70%" borderRadius="md" />
          <Skeleton h="14px" w="40%" borderRadius="full" />
          {Array.from({ length: 3 }).map((__, taskIndex) => (
            <Box key={taskIndex} border="1px solid" borderColor={dividerColor} rounded="xl" p={4}>
              <SkeletonText noOfLines={3} gap={3} />
            </Box>
          ))}
          <Skeleton h="120px" borderRadius="xl" />
        </VStack>
      ))}
    </HStack>
  )

  if (isLoading) {
    return (
      <Box
        minH="100vh"
        bgGradient={pageGradient}
        px={{ base: 4, md: 8 }}
        py={{ base: 8, md: 12 }}
      >
        <VStack gap={8} align="stretch" maxW="1400px" mx="auto">
          <Box
            bg={surfaceBg}
            borderRadius="3xl"
            border="1px solid"
            borderColor={dividerColor}
            shadow="xl"
            p={{ base: 6, md: 10 }}
          >
            <Skeleton h="32px" w="40%" borderRadius="lg" />
            <SkeletonText mt={4} noOfLines={3} gap={4} />
          </Box>
          <Box bg={surfaceBg} borderRadius="2xl" border="1px solid" borderColor={dividerColor} shadow="lg" p={6}>
            <Skeleton h="24px" w="60%" borderRadius="full" />
          </Box>
          {renderSkeletonColumns()}
        </VStack>
      </Box>
    )
  }

  if (!board) {
    return (
      <Box p={8}>
        {errorAlert ?? <InlineAlert kind="generic" message="Board not found" />}
      </Box>
    )
  }

  return (
    <Box
      minH="100vh"
      bgGradient={pageGradient}
      px={{ base: 4, md: 8 }}
      py={{ base: 8, md: 12 }}
      position="relative"
    >
      {pendingDeletion && (
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
          zIndex={40}
          maxW="420px"
          w="calc(100% - 32px)"
        >
          <VStack align="stretch" gap={4}>
            <Box>
              <Text fontWeight="semibold" fontSize="lg" color="white">
                {pendingDeletion.type === 'column' ? 'Видалити колонку?' : 'Видалити задачу?'}
              </Text>
              <Text fontSize="sm" color="gray.200" mt={1}>
                {pendingDeletion.type === 'column'
                  ? `Колонка «${pendingDeletion.title}» та всі її таски будуть видалені назавжди.`
                  : `Таска «${pendingDeletion.title}» буде видалена назавжди.`}
              </Text>
            </Box>
            <HStack justify="flex-end" gap={3}>
              <Button
                variant="outline"
                size="sm"
                color="white"
                borderColor="whiteAlpha.600"
                _hover={{ bg: 'whiteAlpha.200' }}
                onClick={() => setPendingDeletion(null)}
              >
                Скасувати
              </Button>
              <Button
                size="sm"
                colorScheme="red"
                loading={
                  pendingDeletion.type === 'column'
                    ? deletingColumnId === pendingDeletion.id
                    : deletingTaskId === pendingDeletion.id
                }
                onClick={executePendingDeletion}
              >
                Видалити
              </Button>
            </HStack>
          </VStack>
        </Box>
      )}
      <VStack gap={8} align="stretch" maxW="1400px" mx="auto">
        {errorAlert}
        <Box
          bg={surfaceBg}
          borderRadius="3xl"
          border="1px solid"
          borderColor={dividerColor}
          shadow="xl"
          p={{ base: 6, md: 10 }}
        >
          <Flex direction={{ base: 'column', lg: 'row' }} gap={8} align={{ base: 'flex-start', lg: 'center' }}>
            <Box flex="1">
              <Heading size="lg">{board.title}</Heading>
              <Text mt={3} color={mutedText} maxW="720px">
                {board.description ?? 'No description provided'}
              </Text>
              <HStack gap={3} mt={5} flexWrap="wrap">
                <Badge colorScheme="purple" variant="subtle" borderRadius="full">
                  {columns.length} column{columns.length === 1 ? '' : 's'}
                </Badge>
                <Badge colorScheme="blue" variant="subtle" borderRadius="full">
                  {totalTasks} task{totalTasks === 1 ? '' : 's'}
                </Badge>
                <Badge colorScheme="pink" variant="subtle" borderRadius="full">
                  Owner #{board.owner_id}
                </Badge>
              </HStack>
            </Box>
            <VStack gap={3} align="flex-end" minW={{ base: '100%', lg: '280px' }}>
              <AvatarGroup size="md" maxW={4}>
                <Avatar.Root size="md">
                  <Avatar.Fallback name={`Owner #${board.owner_id}`} />
                </Avatar.Root>
                {collaboratorIds.map((userId) => (
                  <Avatar.Root key={userId} size="md">
                    <Avatar.Fallback name={`User ${userId}`} />
                  </Avatar.Root>
                ))}
              </AvatarGroup>
              <Text fontSize="sm" color={mutedText} textAlign={{ base: 'left', lg: 'right' }}>
                {collaboratorIds.length
                  ? 'Active collaborators on assigned tasks'
                  : 'Invite teammates by assigning tasks'}
              </Text>
            </VStack>
          </Flex>
        </Box>

        <Box
          as="form"
          onSubmit={handleCreateColumn}
          bg={surfaceBg}
          borderRadius="2xl"
          border="1px solid"
          borderColor={dividerColor}
          shadow="lg"
          p={{ base: 5, md: 6 }}
        >
          <Flex
            direction={{ base: 'column', md: 'row' }}
            gap={4}
            align={{ base: 'stretch', md: 'flex-end' }}
          >
            <Box flex="1">
              <Text fontWeight="semibold" mb={2} color={mutedText}>
                Add a new swimlane
              </Text>
              <Input
                placeholder="Column title"
                value={newColumnTitle}
                onChange={(event) => setNewColumnTitle(event.target.value)}
                disabled={isCreatingColumn}
                required
                variant="outline"
                bg="white"
              />
            </Box>
            <Button
              type="submit"
              colorScheme="blue"
              px={8}
              borderRadius="full"
              loading={isCreatingColumn}
              disabled={!newColumnTitle.trim()}
            >
              Add column
            </Button>
          </Flex>
        </Box>

        <DragDropContext onDragEnd={handleDragEnd}>
          <HStack align="stretch" gap={5} overflowX="auto" pb={2} pt={2}>
            {columns.length === 0 && (
              <Box
                bg="white"
                border="1px dashed"
                borderColor={dividerColor}
                rounded="2xl"
                minW="320px"
                p={6}
                textAlign="center"
                color={mutedText}
              >
                <Text fontWeight="bold" fontSize="lg">
                  No columns yet
                </Text>
                <Text fontSize="sm" mt={2}>
                  Add your first swimlane to start organizing work.
                </Text>
              </Box>
            )}
            {columns.map((column, columnIndex) => {
              const columnAccent = getColumnColor(column.id)
              const columnGlow = withAlpha(columnAccent, 0.35)
              return (
                <Droppable droppableId={String(column.id)} key={column.id}>
                  {(provided, snapshot) => (
                    <VStack
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      bg={columnSurface}
                      borderRadius="2xl"
                      border="1px solid"
                      borderColor={dividerColor}
                      minW="320px"
                      flex="0 0 320px"
                      align="stretch"
                      gap={4}
                      p={5}
                      shadow="2xl"
                      style={{
                        boxShadow: snapshot.isDraggingOver
                          ? `0 30px 60px ${withAlpha(columnAccent, 0.6)}`
                          : `0 25px 60px ${columnGlow}`,
                        outline: snapshot.isDraggingOver ? `2px solid ${columnAccent}` : undefined,
                        outlineOffset: snapshot.isDraggingOver ? '0' : undefined,
                      }}
                    >
                      <Flex justify="space-between" align="center" gap={2}>
                        {editingColumnId === column.id ? (
                          <Input
                            size="sm"
                            value={columnTitleDraft}
                            onChange={(e) => setColumnTitleDraft(e.target.value)}
                          />
                        ) : (
                          <Text fontWeight="bold" fontSize="lg">
                            {column.title}
                          </Text>
                        )}
                        <HStack gap={1} position="relative">
                          {colorPicker(column.id, columnAccent)}
                          <IconButton
                            aria-label="Move column left"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMoveColumn(column.id, 'left')}
                            disabled={isReorderingColumns || columnIndex === 0}
                          >
                            <Text fontSize="lg">‹</Text>
                          </IconButton>
                          <IconButton
                            aria-label="Move column right"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMoveColumn(column.id, 'right')}
                            disabled={
                              isReorderingColumns || columnIndex === columns.length - 1
                            }
                          >
                            <Text fontSize="lg">›</Text>
                          </IconButton>
                          <Box position="relative">
                            <IconButton
                              aria-label="Column actions"
                              size="sm"
                              variant="ghost"
                              onClick={(event) => {
                                event.stopPropagation()
                                setOpenColumnMenuId((prev) =>
                                  prev === column.id ? null : column.id,
                                )
                              }}
                            >
                              <Text fontSize="xl" lineHeight="1">
                                ⋮
                              </Text>
                            </IconButton>
                            {openColumnMenuId === column.id && (
                              <Box
                                position="absolute"
                                top="36px"
                                right={0}
                                bg="white"
                                border="1px solid"
                                borderColor="gray.200"
                                rounded="lg"
                                shadow="xl"
                                zIndex={20}
                                minW="180px"
                                onClick={(event) => event.stopPropagation()}
                              >
                                <Button
                                  variant="ghost"
                                  justifyContent="flex-start"
                                  w="full"
                                  borderBottom="1px solid"
                                  borderColor="gray.100"
                                  borderRadius={0}
                                  onClick={() => handleStartEditColumn(column)}
                                >
                                  Rename
                                </Button>
                                <Button
                                  variant="ghost"
                                  justifyContent="flex-start"
                                  w="full"
                                  colorScheme="red"
                                  borderRadius={0}
                                  disabled={deletingColumnId === column.id}
                                  onClick={() => handleDeleteColumn(column.id)}
                                >
                                  Delete
                                </Button>
                              </Box>
                            )}
                          </Box>
                        </HStack>
                      </Flex>
                      <Badge colorScheme="gray" alignSelf="flex-start">
                        {column.tasks.length} task{column.tasks.length === 1 ? '' : 's'}
                      </Badge>

                      {editingColumnId === column.id && (
                        <HStack gap={2}>
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={handleCancelEditColumn}
                            disabled={savingColumnId === column.id}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="xs"
                            colorScheme="green"
                            onClick={handleSaveColumn}
                            loading={savingColumnId === column.id}
                          >
                            Save
                          </Button>
                        </HStack>
                      )}

                      <Box h="1px" bg={dividerColor} borderRadius="full" />

                      {column.tasks.length === 0 && (
                        <Box
                          border="1px dashed"
                          borderColor={dividerColor}
                          rounded="xl"
                          p={4}
                          textAlign="center"
                          color={mutedText}
                          bg="white"
                        >
                          Add your first task to this column.
                        </Box>
                      )}
                      {column.tasks.map((task, index) => {
                        const isEditingTask = editingTaskId === task.id
                        return (
                          <Draggable key={task.id} draggableId={`task-${task.id}`} index={index}>
                            {(draggableProvided, draggableSnapshot) => (
                              <Box
                                ref={draggableProvided.innerRef}
                                {...draggableProvided.draggableProps}
                                {...draggableProvided.dragHandleProps}
                                p={4}
                                rounded="xl"
                                border="1px solid"
                                borderColor={taskBorderColor}
                                style={{
                                  ...getTaskStyleForColumn(column.id),
                                  transform: draggableSnapshot.isDragging
                                    ? 'rotate(1deg) scale(1.03)'
                                    : undefined,
                                  transition: 'transform 0.15s ease, box-shadow 0.2s ease',
                                  boxShadow: draggableSnapshot.isDragging
                                    ? '0 25px 50px rgba(15,23,42,0.25)'
                                    : undefined,
                                }}
                              >
                                <VStack align="stretch" gap={2} mb={2} opacity={isEditingTask ? 0.9 : 1}>
                                  <HStack justify="space-between">
                                    <Text fontWeight="semibold">{task.title}</Text>
                                    <Badge colorScheme="purple" variant="subtle">
                                      #{task.id}
                                    </Badge>
                                  </HStack>
                                  {task.description && (
                                    <Text fontSize="sm" color={mutedText}>
                                      {task.description}
                                    </Text>
                                  )}
                                  <Badge
                                    size="sm"
                                    colorScheme={task.assignee_id ? 'blue' : 'gray'}
                                    variant="subtle"
                                    borderRadius="full"
                                    alignSelf="flex-start"
                                  >
                                    {task.assignee_id ? `Assigned #${task.assignee_id}` : 'Unassigned'}
                                  </Badge>
                                  {isEditingTask && (
                                    <Badge colorScheme="pink" variant="subtle" borderRadius="full" alignSelf="flex-start">
                                      Editing in drawer
                                    </Badge>
                                  )}
                                </VStack>
                                <HStack gap={2} mt={2} flexWrap="wrap">
                                  <Button
                                    size="xs"
                                    variant="ghost"
                                    onClick={() =>
                                      isEditingTask
                                        ? handleCancelEditTask()
                                        : handleStartEditTask(column.id, task)
                                    }
                                  >
                                    {isEditingTask ? 'Close drawer' : 'Open details'}
                                  </Button>
                                  <Button
                                    size="xs"
                                    colorScheme="red"
                                    variant="ghost"
                                    onClick={() => handleDeleteTask(column.id, task)}
                                    loading={deletingTaskId === task.id}
                                  >
                                    Delete
                                  </Button>
                                </HStack>
                                <Box mt={3}>
                                  {assignFormVisibility[task.id] ? (
                                    <VStack align="stretch" gap={2}>
                                      <Input
                                        size="xs"
                                        placeholder="Assignee ID"
                                        value={taskAssignDrafts[task.id] ?? ''}
                                        onChange={(e) => handleAssignInputChange(task.id, e.target.value)}
                                      />
                                      <HStack gap={2}>
                                        <Button
                                          size="xs"
                                          colorScheme="blue"
                                          onClick={() => handleAssignTask(column.id, task)}
                                          loading={assigningTaskId === task.id}
                                        >
                                          {taskAssignDrafts[task.id]?.trim() ? 'Assign' : 'Clear'}
                                        </Button>
                                        <Button
                                          size="xs"
                                          variant="ghost"
                                          onClick={() => {
                                            setTaskAssignDrafts((prev) => ({
                                              ...prev,
                                              [task.id]: task.assignee_id?.toString() ?? '',
                                            }))
                                            closeAssignForm(task.id)
                                          }}
                                          disabled={assigningTaskId === task.id}
                                        >
                                          Cancel
                                        </Button>
                                      </HStack>
                                    </VStack>
                                  ) : (
                                    <Button
                                      size="xs"
                                      variant="outline"
                                      borderRadius="full"
                                      onClick={() => {
                                        setTaskAssignDrafts((prev) => ({
                                          ...prev,
                                          [task.id]: task.assignee_id?.toString() ?? '',
                                        }))
                                        openAssignForm(task.id)
                                      }}
                                    >
                                      {task.assignee_id ? 'Change assignee' : 'Assign task'}
                                    </Button>
                                  )}
                                </Box>
                              </Box>
                            )}
                          </Draggable>
                        )
                      })}
                      {provided.placeholder}
                      {taskFormVisibility[column.id] ? (
                        <Box
                          as="form"
                          onSubmit={(event) => handleCreateTask(event, column.id)}
                          bg={addTaskSurface}
                          border="1px dashed"
                          borderColor={dividerColor}
                          rounded="xl"
                          p={4}
                        >
                          <VStack align="stretch" gap={3}>
                            <Input
                              placeholder="Task title"
                              value={taskDrafts[column.id]?.title ?? ''}
                              onChange={(e) => handleDraftChange(column.id, 'title', e.target.value)}
                              required
                              variant="subtle"
                            />
                            <Textarea
                              placeholder="Description (optional)"
                              value={taskDrafts[column.id]?.description ?? ''}
                              onChange={(e) =>
                                handleDraftChange(column.id, 'description', e.target.value)
                              }
                              resize="vertical"
                            />
                            <HStack justify="space-between" align="center">
                              <Button
                                type="submit"
                                size="sm"
                                colorScheme="blue"
                                borderRadius="full"
                                loading={taskLoading[column.id]}
                              >
                                Add task
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setTaskFormOpen(column.id, false)}
                              >
                                Cancel
                              </Button>
                            </HStack>
                          </VStack>
                        </Box>
                      ) : (
                        <Button
                          variant="outline"
                          borderStyle="dashed"
                          borderColor={dividerColor}
                          w="full"
                          borderRadius="full"
                          onClick={() => setTaskFormOpen(column.id, true)}
                        >
                          <HStack gap={2} justify="center">
                            <Box
                              as="span"
                              display="inline-flex"
                              alignItems="center"
                              justifyContent="center"
                              w="18px"
                              h="18px"
                              borderRadius="full"
                              bg="black"
                              color="white"
                              fontSize="xs"
                              fontWeight="bold"
                            >
                              +
                            </Box>
                            <Text>Add task</Text>
                          </HStack>
                        </Button>
                      )}
                    </VStack>
                  )}
                </Droppable>
              )
            })}
          </HStack>
        </DragDropContext>
        {selectedTask && isTaskDrawerOpen && (
          <Box position="fixed" inset={0} zIndex={50}>
            <Box
              position="absolute"
              inset={0}
              bg="rgba(15,23,42,0.55)"
              backdropFilter="blur(4px)"
              onClick={handleCancelEditTask}
            />
            <Box
              position="absolute"
              top={0}
              right={0}
              h="100%"
              w={{ base: '100%', md: '420px', lg: '520px' }}
              bg="white"
              borderLeftRadius="2xl"
              display="flex"
              flexDirection="column"
              boxShadow="-15px 0 40px rgba(15,23,42,0.3)"
              onClick={(event) => event.stopPropagation()}
            >
              <Flex align="center" justify="space-between" px={6} py={4} borderBottom="1px solid" borderColor={dividerColor}>
                <Box>
                  <Text fontSize="sm" color="gray.500">
                    Task detail
                  </Text>
                  <Text fontWeight="semibold">{selectedTask.task.title}</Text>
                </Box>
                <Button variant="ghost" size="sm" onClick={handleCancelEditTask}>
                  Close
                </Button>
              </Flex>
              <Box flex="1" overflowY="auto" px={6} py={4}>
                <VStack align="stretch" gap={4}>
                  <Box>
                    <Text fontSize="xs" color="gray.500">
                      Column
                    </Text>
                    <Text fontWeight="semibold">{selectedTask.column.title}</Text>
                  </Box>
                  <Input
                    value={taskEditDraft.title}
                    onChange={(e) => setTaskEditDraft((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Task title"
                  />
                  <Textarea
                    value={taskEditDraft.description}
                    onChange={(e) =>
                      setTaskEditDraft((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Describe the work..."
                    rows={6}
                  />
                  <Box h="1px" bg={dividerColor} borderRadius="full" />
                  <HStack gap={2} align="flex-start">
                    <Input
                      placeholder="Assignee ID"
                      value={taskAssignDrafts[selectedTask.task.id] ?? ''}
                      onChange={(e) => handleAssignInputChange(selectedTask.task.id, e.target.value)}
                    />
                    <Button
                      variant="outline"
                      onClick={() => handleAssignTask(selectedTask.column.id, selectedTask.task)}
                      loading={assigningTaskId === selectedTask.task.id}
                    >
                      {taskAssignDrafts[selectedTask.task.id]?.trim() ? 'Assign' : 'Clear'}
                    </Button>
                  </HStack>
                  <Text fontSize="sm" color="gray.500">
                    Task ID #{selectedTask.task.id}
                  </Text>
                </VStack>
              </Box>
              <Flex gap={3} px={6} py={4} borderTop="1px solid" borderColor={dividerColor}>
                <Button variant="ghost" onClick={handleCancelEditTask} disabled={savingTaskId === editingTaskId}>
                  Close
                </Button>
                <Button
                  colorScheme="blue"
                  onClick={handleSaveTask}
                  loading={savingTaskId === editingTaskId}
                  disabled={!taskEditDraft.title.trim()}
                >
                  Save changes
                </Button>
              </Flex>
            </Box>
          </Box>
        )}
      </VStack>
    </Box>
  )
}
