import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Folder, ListPlus, Search, Settings2, Shield, Upload, UserRoundSearch } from 'lucide-react'
import { categories, confirmedSinceImport, decisions, formatNumber, notesFor, type Category, type Data } from './domain'
import { actions } from './store'
import { Dialog, Empty, ProfileLink, type Run } from './ui'

export type ProfileFilter = 'all' | 'one-way' | 'mutual' | 'protected' | 'listed' | 'reviewed' | 'pending' | 'confirmed'
const filters: { value: ProfileFilter; label: string }[] = [
  { value: 'all', label: 'Todos' }, { value: 'one-way', label: 'Não seguem de volta' }, { value: 'mutual', label: 'Mútuos' },
  { value: 'protected', label: 'Protegidos' }, { value: 'listed', label: 'Em listas' }, { value: 'reviewed', label: 'Analisados' },
  { value: 'pending', label: 'Na fila' }, { value: 'confirmed', label: 'Unfollow confirmado' },
]
const pageSize = 20

export function Profiles({ data, run, filter, onFilter, onImport }: {
  data: Data; run: Run; filter: ProfileFilter; onFilter: (value: ProfileFilter) => void; onImport: () => void
}) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [listId, setListId] = useState('')
  const [selected, setSelected] = useState('')
  const [newList, setNewList] = useState(false)
  const [listName, setListName] = useState('')
  const [savingList, setSavingList] = useState(false)
  const { following, followers, queued, matches } = useMemo(() => {
    const following = new Set(data.snapshot?.following)
    const followers = new Set(data.snapshot?.followers)
    const queued = new Set(data.queue)
    const names = new Set([...following, ...Object.keys(data.notes)])
    const normalized = query.trim().toLowerCase().replace(/^@/, '')
    const matches = [...names].filter(name => {
      if (!name.includes(normalized)) return false
      const notes = notesFor(data, name)
      switch (filter) {
        case 'one-way': return following.has(name) && !followers.has(name)
        case 'mutual': return following.has(name) && followers.has(name)
        case 'protected': return !!notes.protectedAs
        case 'listed': return listId ? notes.lists.includes(listId) : notes.lists.length > 0
        case 'reviewed': return !!notes.lastDecision
        case 'pending': return queued.has(name)
        case 'confirmed': return !!notes.confirmedAt
        default: return following.has(name)
      }
    }).sort((a, b) => a.localeCompare(b, 'pt-BR'))
    return { following, followers, queued, matches }
  }, [data, filter, query, listId])
  const currentPage = Math.min(page, Math.max(0, Math.ceil(matches.length / pageSize) - 1))
  const activeNotes = selected ? notesFor(data, selected) : undefined

  return <>
    <section className="panel profiles-panel">
      <div className="section-heading">
        <div><h2>Lista de perfis</h2><p>Pesquise e organize os perfis da sua conta.</p></div>
        <button className="button secondary" onClick={() => { setListName(''); setNewList(true) }}><Folder size={17}/> Nova lista</button>
      </div>
      <div className="filter-bar">
        <label className="search"><Search size={18}/><input placeholder="Buscar @usuário" value={query} onChange={event => { setQuery(event.target.value); setPage(0) }} aria-label="Buscar nome de usuário"/></label>
        <select value={filter} onChange={event => { onFilter(event.target.value as ProfileFilter); setPage(0) }} aria-label="Filtrar perfis">
          {filters.map(item => <option value={item.value} key={item.value}>{item.label}</option>)}
        </select>
        {filter === 'listed' && <select value={listId} onChange={event => { setListId(event.target.value); setPage(0) }} aria-label="Lista personalizada">
          <option value="">Todas as listas</option>
          {data.lists.map(list => <option value={list.id} key={list.id}>{list.name}</option>)}
        </select>}
      </div>
      {matches.length ? <>
        <div className="table-scroll">
          <table><thead><tr><th scope="col">Perfil</th><th scope="col">Relação na exportação</th><th scope="col">Revisão</th><th scope="col">Ações</th></tr></thead>
            <tbody>{matches.slice(currentPage * pageSize, (currentPage + 1) * pageSize).map(name => {
              const notes = notesFor(data, name)
              const isMutual = followers.has(name) && following.has(name)
              return <tr key={name}>
                <td><div className="profile-cell"><span className="avatar">{name.slice(0, 2).toUpperCase()}</span><div><ProfileLink username={name}/>{notes.protectedAs && <small className="muted profile-category"><Shield size={12}/>{notes.protectedAs}</small>}</div></div></td>
                <td><span className={'status ' + (isMutual ? 'green' : following.has(name) ? 'orange' : 'neutral')}>{isMutual ? 'Mútuo' : following.has(name) ? 'Não segue de volta' : 'Fora da lista seguindo'}</span></td>
                <td>{queued.has(name) ? 'Na fila' : notes.lastDecision ? decisions[notes.lastDecision] : 'A revisar'}</td>
                <td><div className="row-actions">
                  {queued.has(name) ? <button className="button secondary small" onClick={() => void run(() => actions.dequeue(name), 'Perfil retirado da fila.')}>Retirar da fila</button>
                    : following.has(name) && !notes.protectedAs && !confirmedSinceImport(data, notes) && <button className="button secondary small" onClick={() => void run(() => actions.queue(name), 'Perfil adicionado à fila.')}><ListPlus size={15}/> Adicionar à fila</button>}
                  <button className="icon-button" title="Editar perfil" aria-label={'Editar @' + name} onClick={() => setSelected(name)}><Settings2 size={18}/></button>
                </div></td>
              </tr>
            })}</tbody>
          </table>
        </div>
        <div className="pagination"><span>{formatNumber(currentPage * pageSize + 1)}–{formatNumber(Math.min((currentPage + 1) * pageSize, matches.length))} de {formatNumber(matches.length)} perfis</span><div className="row-actions">
          <button className="icon-button" disabled={currentPage === 0} aria-label="Página anterior" onClick={() => setPage(currentPage - 1)}><ChevronLeft size={19}/></button>
          <button className="icon-button" disabled={(currentPage + 1) * pageSize >= matches.length} aria-label="Próxima página" onClick={() => setPage(currentPage + 1)}><ChevronRight size={19}/></button>
        </div></div>
      </> : <Empty icon={<UserRoundSearch size={22}/>} title={data.snapshot ? 'Nenhum perfil encontrado' : 'Nenhuma exportação importada'}>
        {data.snapshot ? 'Tente outro filtro ou termo de busca.' : <button className="button secondary" onClick={onImport}><Upload size={17}/> Importar dados</button>}
      </Empty>}
    </section>
    {activeNotes && <Dialog title={'Editar @' + selected} close={() => setSelected('')}>
      <label className="field">Categoria de proteção<select value={activeNotes.protectedAs ?? ''} onChange={event => {
        const value = event.target.value as Category | ''
        void run(() => actions.protect(selected, value || undefined), value ? 'Perfil protegido e retirado da fila.' : 'Proteção removida.')
      }}><option value="">Sem proteção</option>{categories.map(category => <option key={category}>{category}</option>)}</select></label>
      <h3 className="dialog-subheading">Listas personalizadas</h3>
      {data.lists.length ? <div className="checklist">{data.lists.map(list => <label key={list.id}><input type="checkbox" checked={activeNotes.lists.includes(list.id)} onChange={() => void run(() => actions.membership(selected, list.id))}/>{list.name}</label>)}</div>
        : <p className="muted">Crie sua primeira lista para organizar este perfil.</p>}
      <div className="dialog-actions"><button className="button primary" onClick={() => setSelected('')}>Concluir</button></div>
    </Dialog>}
    {newList && <Dialog title="Criar lista personalizada" close={() => setNewList(false)} locked={savingList}>
      <form onSubmit={async event => {
        event.preventDefault()
        setSavingList(true)
        if (await run(() => actions.createList(listName), 'Lista criada.')) setNewList(false)
        setSavingList(false)
      }}>
        <label className="field">Nome da lista<input autoFocus maxLength={60} required value={listName} onChange={event => setListName(event.target.value)} placeholder="Ex. Inspirações"/></label>
        <div className="dialog-actions"><button type="button" className="button secondary" disabled={savingList} onClick={() => setNewList(false)}>Cancelar</button><button className="button primary" disabled={savingList || !listName.trim()}>Criar lista</button></div>
      </form>
    </Dialog>}
  </>
}
