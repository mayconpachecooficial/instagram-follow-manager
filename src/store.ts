import { openDB, type DBSchema } from 'idb'
import { create } from 'zustand'
import { confirmedSinceImport, initialData, normalizeUsername, notesFor, type Category, type Data, type Decision, type Snapshot } from './domain'

interface FollowDatabase extends DBSchema {
  app: { key: string; value: Data }
}

let connection: ReturnType<typeof openDB<FollowDatabase>> | undefined
function database() {
  connection ??= openDB<FollowDatabase>('instagram-follow-manager', 1, {
    upgrade(db) { db.createObjectStore('app') },
  }).catch(error => {
    connection = undefined
    throw error
  })
  return connection
}

export const useApp = create<{ data: Data; ready: boolean; error: string }>(() => ({
  data: initialData, ready: false, error: '',
}))

const channel = typeof BroadcastChannel === 'function' ? new BroadcastChannel('follow-manager-data') : undefined

export async function load() {
  try {
    const data = (await (await database()).get('app', 'data')) ?? initialData
    useApp.setState({ data, ready: true, error: '' })
  } catch {
    useApp.setState({ error: 'Não foi possível acessar o armazenamento local do navegador.' })
  }
}
channel?.addEventListener('message', () => { void load() })

async function update(change: (data: Data) => void) {
  const tx = (await database()).transaction('app', 'readwrite')
  const data = (await tx.store.get('data')) ?? structuredClone(initialData)
  try {
    change(data)
  } catch (error) {
    await tx.done
    throw error
  }
  await tx.store.put(data, 'data')
  await tx.done
  useApp.setState({ data })
  channel?.postMessage('updated')
}

function recordReview(data: Data, username: string, decision: Decision, at: number, sessionId?: string, category?: Category) {
  const notes = notesFor(data, username)
  Object.defineProperty(data.notes, username, {
    configurable: true, enumerable: true, writable: true,
    value: {
      ...notes, lastDecision: decision,
      confirmedAt: decision === 'confirmado' ? at : notes.confirmedAt,
      protectedAs: decision === 'protegido' ? category : notes.protectedAs,
    },
  })
  data.history.unshift({ id: crypto.randomUUID(), username, decision, at, sessionId })
}

export const actions = {
  saveImport: (snapshot: Snapshot) => update(data => {
    const following = new Set(snapshot.following)
    data.snapshot = snapshot
    data.evolution.push({ at: snapshot.at, count: following.size })
    data.evolution.sort((a, b) => a.at - b.at)
    data.queue = data.queue.filter(name => following.has(name) && !notesFor(data, name).protectedAs)
  }),
  theme: () => update(data => { data.theme = data.theme === 'dark' ? 'light' : 'dark' }),
  queue: (username: string) => update(data => {
    if (!data.snapshot?.following.includes(username)) throw new Error('Este perfil não está na lista seguindo.')
    const notes = notesFor(data, username)
    if (notes.protectedAs) throw new Error('Remova a proteção para incluir o perfil na fila.')
    if (confirmedSinceImport(data, notes)) throw new Error('O unfollow deste perfil já foi registrado para a exportação atual.')
    if (data.queue.includes(username)) return
    data.queue.push(username)
  }),
  dequeue: (username: string) => update(data => {
    data.queue = data.queue.filter(name => name !== username)
  }),
  protect: (username: string, category?: Category) => update(data => {
    data.notes[username] = { ...notesFor(data, username), protectedAs: category }
    if (category) data.queue = data.queue.filter(name => name !== username)
  }),
  createList: (value: string) => update(data => {
    const name = value.trim()
    if (!name || name.length > 60) throw new Error('Informe um nome de até 60 caracteres.')
    if (data.lists.some(list => list.name.toLowerCase() === name.toLowerCase())) throw new Error('Já existe uma lista com esse nome.')
    data.lists.push({ id: crypto.randomUUID(), name })
  }),
  membership: (username: string, listId: string) => update(data => {
    if (!data.lists.some(list => list.id === listId)) throw new Error('Esta lista não existe mais.')
    const notes = notesFor(data, username)
    const lists = notes.lists.includes(listId) ? notes.lists.filter(id => id !== listId) : [...notes.lists, listId]
    data.notes[username] = { ...notes, lists }
  }),
  settings: (goal: number, breakMinutes: number) => update(data => {
    if (!Number.isInteger(goal) || goal < 1 || goal > 10000 || !Number.isInteger(breakMinutes) || breakMinutes < 0 || breakMinutes > 1440) {
      throw new Error('Informe uma meta entre 1 e 10.000 perfis e um intervalo entre 0 e 1.440 minutos.')
    }
    data.settings = { goal, breakMinutes }
  }),
  start: () => update(data => {
    if (data.sessions.some(session => session.status !== 'encerrada')) throw new Error('Já existe uma sessão em andamento.')
    const { goal, breakMinutes } = data.settings
    const now = Date.now()
    data.sessions.unshift({
      id: crypto.randomUUID(), started: now, goal, breakMinutes, status: 'ativa',
      nextBreak: breakMinutes ? now + breakMinutes * 60_000 : undefined,
    })
  }),
  session: (id: string, event: 'pause' | 'resume' | 'end' | 'break') => update(data => {
    const session = data.sessions.find(item => item.id === id)
    if (!session || session.status === 'encerrada') throw new Error('Esta sessão já foi encerrada.')
    const now = Date.now()
    if (event === 'pause' && session.status === 'ativa') {
      session.status = 'pausada'
      session.remainingBreak = session.nextBreak === undefined ? undefined : Math.max(0, session.nextBreak - now)
      session.nextBreak = undefined
    }
    if (event === 'resume' && session.status === 'pausada') {
      session.status = 'ativa'
      session.nextBreak = session.remainingBreak === undefined ? undefined : now + session.remainingBreak
      session.remainingBreak = undefined
    }
    if (event === 'end') {
      session.status = 'encerrada'
      session.ended = now
      session.nextBreak = undefined
    }
    if (event === 'break' && session.status === 'ativa' && session.breakMinutes) {
      session.nextBreak = now + session.breakMinutes * 60_000
    }
  }),
  confirmRemoved: (input: string) => update(data => {
    const entries = input.trim().split(/[\s,;]+/).filter(Boolean)
    if (!entries.length) throw new Error('Informe pelo menos um nome de usuário.')
    const names = new Set(entries.map(entry => {
      const username = normalizeUsername(entry)
      if (!username) throw new Error('Nome de usuário inválido: ' + entry)
      return username
    }))
    const following = new Set(data.snapshot?.following)
    const unrecorded = [...names].filter(username => {
      const notes = notesFor(data, username)
      return notes.confirmedAt === undefined || (following.has(username) && !confirmedSinceImport(data, notes))
    })
    if (!unrecorded.length) throw new Error('Esses unfollows já estão registrados no histórico.')
    const now = Date.now()
    for (const username of unrecorded) recordReview(data, username, 'confirmado', now)
    data.queue = data.queue.filter(username => !names.has(username))
  }),
  review: (id: string, username: string, decision: Decision, category?: Category) => update(data => {
    const session = data.sessions.find(item => item.id === id)
    if (session?.status !== 'ativa') throw new Error('Inicie ou continue uma sessão para registrar decisões.')
    if (data.queue[0] !== username) throw new Error('A fila mudou. Confira o perfil atual.')
    if (decision === 'protegido' && !category) throw new Error('Escolha uma categoria de proteção.')
    recordReview(data, username, decision, Date.now(), id, category)
    data.queue.shift()
    if (decision === 'pulado') data.queue.push(username)
  }),
}
