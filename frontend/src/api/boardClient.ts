import { API_URLS } from '../config/env'
import { createApiClient } from './http'

const client = createApiClient(API_URLS.board)

export interface Task {
  id: number
  title: string
  description?: string | null
  position: number
  column_id: number
  assignee_id?: number | null
}

export interface Column {
  id: number
  title: string
  position: number
  board_id: number
  tasks: Task[]
}

export interface Board {
  id: number
  title: string
  description?: string | null
  owner_id: number
  columns: Column[]
}

export interface BoardCreatePayload {
  title: string
  description?: string | null
}

export interface BoardUpdatePayload {
  title?: string
  description?: string | null
}

export interface BoardListResponse {
  boards: Board[]
  total: number
}

export const boardClient = {
  getBoards: () => client.get<BoardListResponse>('/boards'),
  getBoard: (id: number) => client.get<Board>(`/boards/${id}`),
  createBoard: (payload: BoardCreatePayload) => client.post<Board>('/boards', payload),
  updateBoard: (id: number, payload: BoardUpdatePayload) =>
    client.put<Board>(`/boards/${id}`, payload),
  deleteBoard: (id: number) => client.delete<void>(`/boards/${id}`),
}
