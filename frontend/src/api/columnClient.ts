import { API_URLS } from '../config/env'
import type { Column } from './boardClient'
import { createApiClient } from './http'

const client = createApiClient(API_URLS.board)

export interface ColumnCreatePayload {
  board_id: number
  title: string
  position: number
}

export interface ColumnUpdatePayload {
  title?: string
  position?: number
}

export type ColumnOrderPayload = number[]

export const columnClient = {
  getColumnsByBoard: (boardId: number) => client.get<Column[]>(`/columns/board/${boardId}`),
  createColumn: (payload: ColumnCreatePayload) =>
    client.post<Omit<Column, 'tasks'>>('/columns', payload),
  updateColumn: (columnId: number, payload: ColumnUpdatePayload) =>
    client.put<Column>(`/columns/${columnId}`, payload),
  deleteColumn: (columnId: number) => client.delete<void>(`/columns/${columnId}`),
  reorderColumns: (boardId: number, order: ColumnOrderPayload) =>
    client.post(`/columns/board/${boardId}/reorder`, order),
}
