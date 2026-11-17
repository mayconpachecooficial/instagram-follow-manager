import { parse, type DefaultTreeAdapterMap } from 'parse5'
import { normalizeUsername, type Snapshot } from './domain'
import { namePattern } from './import-names'

type Group = 'followers' | 'following'
type JsonRecord = Record<string, unknown>

function record(value: unknown): JsonRecord {
  return value && typeof value === 'object' ? value as JsonRecord : {}
}

function fromUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return
  try {
    const url = new URL(value)
    if (!['https:', 'http:'].includes(url.protocol) || !['instagram.com', 'www.instagram.com'].includes(url.hostname)) return
    const match = /^\/(?:_u\/)?([^/]+)\/?$/.exec(url.pathname)
    if (match) return normalizeUsername(decodeURIComponent(match[1]))
  } catch {
    return undefined
  }
}

function readJson(source: string, group: Group): string[] {
  const doc: unknown = JSON.parse(source)
  const rows = Array.isArray(doc) ? doc : record(doc)['relationships_' + group]
  if (!Array.isArray(rows)) throw new Error('estrutura JSON de ' + (group === 'followers' ? 'seguidores' : 'seguindo') + ' não reconhecida')
  return rows.flatMap((row, index) => {
    const { string_list_data: entries, title } = record(row)
    const names = Array.isArray(entries) ? entries.flatMap(entry => {
      const { value, href } = record(entry)
      return normalizeUsername(value) ?? fromUrl(href) ?? []
    }) : []
    const nameFromTitle = normalizeUsername(title)
    if (!names.length && nameFromTitle) return [nameFromTitle]
    if (!names.length) throw new Error('nome de usuário ausente no registro ' + (index + 1))
    return names
  })
}

type Node = DefaultTreeAdapterMap['node']

function readHtml(source: string, group: Group): string[] {
  // O parser mantém o HTML como árvore de dados, sem carregar recursos ou executar scripts.
  const root = parse(source)
  const names: string[] = []
  const headers: string[] = []
  const stack: Node[] = [root]
  while (stack.length) {
    const node = stack.pop()!
    if ('tagName' in node && node.tagName === 'a') {
      const name = fromUrl(node.attrs.find(attr => attr.name === 'href')?.value)
      if (name) names.push(name)
    }
    if ('tagName' in node && /^(title|h1|h2)$/.test(node.tagName)) {
      headers.push(node.childNodes.map(child => 'value' in child ? child.value : '').join(''))
    }
    if ('childNodes' in node) {
      for (const child of node.childNodes) stack.push(child)
    }
  }
  const label = group === 'followers' ? /followers|seguidores/i : /following|seguindo/i
  if (!names.length && !headers.some(header => label.test(header))) {
    throw new Error('estrutura HTML do Instagram não reconhecida')
  }
  return names
}

const order = new Intl.Collator('pt-BR')

export async function parseExport(files: File[]): Promise<Snapshot> {
  const groups = { followers: new Set<string>(), following: new Set<string>() }
  const pages = { followers: new Set<number>(), following: new Set<number>() }
  const sources = files.flatMap(file => {
    const match = namePattern.exec(file.name)
    if (!match) return []
    const group = match[1].toLowerCase() as Group
    const page = Number(match[2] ?? 1)
    if (page < 1 || !Number.isSafeInteger(page)) throw new Error(file.name + ' tem uma numeração inválida.')
    pages[group].add(page)
    return [{ file, group, format: match[3].toLowerCase() }]
  })
  for (const group of ['followers', 'following'] as const) {
    const label = group === 'followers' ? 'seguidores (followers)' : 'seguindo (following)'
    if (!pages[group].size) throw new Error('Selecione também os arquivos de ' + label + '.')
    const numbers = [...pages[group]].sort((a, b) => a - b)
    if (numbers.some((page, index) => page !== index + 1)) throw new Error('Faltam páginas da lista de ' + label + '.')
  }
  for (const { file, group, format } of sources) {
    try {
      const source = (await file.text()).replace(/^\uFEFF/, '')
      const names = format === 'json' ? readJson(source, group) : readHtml(source, group)
      for (const name of names) groups[group].add(name)
    } catch (error) {
      throw new Error(file.name + ' — ' + (error instanceof Error ? error.message : 'arquivo ilegível') + '.')
    }
  }
  return {
    at: Date.now(), files: sources.length,
    followers: [...groups.followers].sort(order.compare),
    following: [...groups.following].sort(order.compare),
  }
}
