export const categories = ['Família', 'Amigos', 'Artistas', 'Parceiros profissionais', 'Clientes', 'Outros'] as const
export type Category = typeof categories[number]
export type Decision = 'confirmado' | 'pulado' | 'mantido' | 'protegido'
export const decisions: Record<Decision, string> = {
  confirmado: 'Unfollow confirmado manualmente', pulado: 'Pulado', mantido: 'Mantido', protegido: 'Protegido',
}

export interface Snapshot {
  at: number
  followers: string[]
  following: string[]
  files: number
}

export interface ProfileNotes {
  protectedAs?: Category
  lists: string[]
  lastDecision?: Decision
  confirmedAt?: number
}

export interface Session {
  id: string
  started: number
  ended?: number
  status: 'ativa' | 'pausada' | 'encerrada'
  goal: number
  breakMinutes: number
  nextBreak?: number
  remainingBreak?: number
}

export interface Review {
  id: string
  username: string
  at: number
  decision: Decision
  sessionId: string
}

export interface Data {
  snapshot?: Snapshot
  evolution: { at: number; count: number }[]
  notes: Record<string, ProfileNotes>
  lists: { id: string; name: string }[]
  queue: string[]
  history: Review[]
  sessions: Session[]
  theme: 'dark' | 'light'
  settings: { goal: number; breakMinutes: number }
}

export const initialData: Data = {
  evolution: [], notes: {}, lists: [], queue: [], history: [], sessions: [],
  theme: 'dark', settings: { goal: 15, breakMinutes: 10 },
}

export function notesFor(data: Data, username: string): ProfileNotes {
  return Object.hasOwn(data.notes, username) ? data.notes[username] : { lists: [] }
}

export function confirmedSinceImport(data: Data, notes: ProfileNotes) {
  return data.snapshot !== undefined && notes.confirmedAt !== undefined && notes.confirmedAt >= data.snapshot.at
}

export const instagramUrl = (username: string) => 'https://www.instagram.com/' + encodeURIComponent(username) + '/'
export const formatDate = (at: number) => new Date(at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
export const formatNumber = (n: number) => n.toLocaleString('pt-BR')

export function sessionStats(history: Review[], sessionId?: string) {
  const reviews = history.filter(review => review.sessionId === sessionId)
  return {
    reviewed: new Set(reviews.map(review => review.username)).size,
    confirmed: reviews.filter(review => review.decision === 'confirmado').length,
  }
}
