export type GridSize = 'small' | 'medium' | 'large'

export interface Project {
  id: string
  title: string
  client: string
  year: number
  category: string
  slug: string
  cover: string | null
  media: string[]
  videoUrls: string[]
  gridSize: GridSize
  order: number
  published: boolean
  description: string
}
