import { API_URLS } from '../config/env'
import { createApiClient } from './http'
import type { Task } from './boardClient'

const client = createApiClient(API_URLS.board)

export interface TaskCreatePayload {
  column_id: number
  title: string
  description?: string
  position: number
  assignee_id?: number | null
}

export interface TaskUpdatePayload {
  title?: string
  description?: string | null
  column_id?: number
  position?: number
  assignee_id?: number | null
}

export interface TaskAssignPayload {
  assignee_id?: number | null
}

export const taskClient = {
  listTasks: () => client.get<Task[]>('/tasks'),
  getTask: (taskId: number) => client.get<Task>(`/tasks/${taskId}`),
  moveTask: (taskId: number, payload: { column_id: number; task_position: number }) =>
    client.patch(`/tasks/${taskId}/move`, payload),
  createTask: (payload: TaskCreatePayload) => client.post<Task>('/tasks', payload),
  updateTask: (taskId: number, payload: TaskUpdatePayload) =>
    client.put<Task>(`/tasks/${taskId}`, payload),
  deleteTask: (taskId: number) => client.delete<void>(`/tasks/${taskId}`),
  assignTask: (taskId: number, payload: TaskAssignPayload) =>
    client.patch<Task>(`/tasks/${taskId}/assign`, payload),
}
