import { useEffect, useState, type ComponentType } from 'react'
import { AlertCircle, ChevronRight, Clock3, History as HistoryIcon, Instagram, LayoutDashboard, ListChecks, Menu, Moon, Settings as SettingsIcon, ShieldCheck, Sun, Upload, Users, X } from 'lucide-react'
import { Dashboard } from './Dashboard'
import { History } from './History'
import { ImportDialog } from './ImportDialog'
import { Profiles, type ProfileFilter } from './Profiles'
import { ReviewQueue } from './ReviewQueue'
import { Settings } from './Settings'
import { formatDate } from './domain'
import { actions, load, useApp } from './store'
import { ActionError, Toast, type Run } from './ui'

type Page = 'dashboard' | 'profiles' | 'queue' | 'protected' | 'history' | 'settings'
const pages: { id: Page; label: string; title: string; description: string; icon: ComponentType<{ size?: number }> }[] = [
  { id: 'dashboard', label: 'Visão geral', title: 'Visão geral', description: 'Acompanhe seus seguidores e organize sua revisão.', icon: LayoutDashboard },
  { id: 'profiles', label: 'Perfis', title: 'Perfis', description: 'Compare suas conexões a partir da última exportação.', icon: Users },
  { id: 'queue', label: 'Fila de revisão', title: 'Fila de revisão', description: 'Revise um perfil por vez e registre suas decisões.', icon: ListChecks },
  { id: 'protected', label: 'Perfis protegidos', title: 'Perfis protegidos', description: 'Organize os perfis que você quer manter fora da fila.', icon: ShieldCheck },
  { id: 'history', label: 'Histórico', title: 'Histórico', description: 'Consulte decisões e sessões e exporte seus relatórios.', icon: HistoryIcon },
  { id: 'settings', label: 'Configurações', title: 'Configurações', description: 'Ajuste suas preferências de revisão e aparência.', icon: SettingsIcon },
]
function currentPage(): Page {
  return pages.find(item => location.hash === '#' + item.id)?.id ?? 'dashboard'
}

export function App() {
  const { data, ready, error: storageError } = useApp()
  const [page, setPage] = useState(currentPage)
  const [openRegistration, setOpenRegistration] = useState(false)
  const [filter, setFilter] = useState<ProfileFilter>(() => currentPage() === 'protected' ? 'protected' : 'all')
  const [importing, setImporting] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [mobile, setMobile] = useState(false)
  const meta = pages.find(item => item.id === page)!
  const openImport = () => { setError(''); setImporting(true) }
  function go(next: Page, profileFilter?: ProfileFilter) {
    setPage(next)
    setOpenRegistration(false)
    const hash = '#' + next
    if (location.hash !== hash) window.history.pushState(null, '', hash)
    setFilter(profileFilter ?? (next === 'protected' ? 'protected' : 'all'))
    setError('')
    setMobile(false)
    window.scrollTo({ top: 0 })
  }

  useEffect(() => {
    function sync() {
      const next = currentPage()
      setPage(next)
      setOpenRegistration(false)
      setFilter(next === 'protected' ? 'protected' : 'all')
    }
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])
  useEffect(() => {
    document.documentElement.dataset.theme = data.theme
    document.querySelector('meta[name=theme-color]')?.setAttribute('content', data.theme === 'dark' ? '#12111a' : '#f6f5fa')
  }, [data.theme])
  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 3700)
    return () => window.clearTimeout(timer)
  }, [notice])

  const run: Run = async (action, success) => {
    setError('')
    try {
      await action()
      if (success) setNotice(success)
      return true
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível salvar a alteração.')
      return false
    }
  }

  return <ActionError.Provider value={{ error, clear: () => setError('') }}>
    <div className="app-shell">
      {mobile && <button className="mobile-backdrop" aria-label="Fechar menu" onClick={() => setMobile(false)}/>}
      <aside className={'sidebar ' + (mobile ? 'open' : '')}>
        <div className="sidebar-top">
          <a className="brand" href="#dashboard" onClick={event => { event.preventDefault(); go('dashboard') }}>
            <span className="brand-icon"><Instagram size={23}/></span><span><strong>Follow Manager</strong><small>Instagram</small></span>
          </a>
          <button className="icon-button mobile-close" onClick={() => setMobile(false)} aria-label="Fechar menu"><X size={21}/></button>
        </div>
        <nav aria-label="Navegação principal">
          {pages.map(({ id, label, icon: Icon }) => <a key={id} href={'#' + id} className={'nav-link ' + (page === id ? 'active' : '')} aria-current={page === id ? 'page' : undefined} onClick={event => { event.preventDefault(); go(id) }}>
            <Icon size={19}/><span>{label}</span>{id === 'queue' && data.queue.length > 0 && <span className="nav-count" aria-hidden="true">{data.queue.length}</span>}
            {page === id && (id !== 'queue' || data.queue.length === 0) && <ChevronRight size={15} className="nav-chevron"/>}
          </a>)}
        </nav>
        <div className="sidebar-bottom"><span className="local-dot"/><div><strong>Armazenamento local</strong><small>{ready ? 'Dados neste navegador' : storageError ? 'Armazenamento indisponível' : 'Conectando…'}</small></div></div>
      </aside>
      <main>
        <header className="topbar">
          <div className="top-left"><button className="icon-button mobile-menu" aria-label="Abrir menu" aria-expanded={mobile} onClick={() => setMobile(!mobile)}><Menu size={22}/></button>
            <span className="breadcrumb">{meta.label}</span></div>
          <div className="top-controls">
            {data.snapshot && <span className="last-import"><Clock3 size={15}/> <span>Importado em {formatDate(data.snapshot.at)}</span></span>}
            <button className="icon-button theme-button" disabled={!ready} aria-label={'Usar tema ' + (data.theme === 'dark' ? 'claro' : 'escuro')} onClick={() => void run(actions.theme)}>{data.theme === 'dark' ? <Sun size={19}/> : <Moon size={19}/>}</button>
            <button className="button primary header-import" disabled={!ready} onClick={openImport}><Upload size={16}/> <span>Importar dados</span></button>
          </div>
        </header>
        <div className="main-content">
          <div className="page-title"><h1>{meta.title}</h1><p>{meta.description}</p></div>
          {(storageError || error) && <div className="alert error" role="alert"><AlertCircle size={18}/><span>{storageError || error}</span>{storageError ? <button className="button secondary small" onClick={() => void load()}>Tentar novamente</button> : <button className="icon-button" onClick={() => setError('')} aria-label="Dispensar erro"><X size={16}/></button>}</div>}
          {!ready && !storageError && <div className="panel loading" role="status">Carregando dados locais…</div>}
          {ready && page === 'dashboard' && <Dashboard data={data} onImport={openImport} onQueue={() => go('queue')}/>}
          {ready && (page === 'profiles' || page === 'protected') && <Profiles key={page} data={data} run={run} filter={filter} onFilter={value => {
            if (page === 'protected' && value !== 'protected') go('profiles', value)
            else if (page === 'profiles' && value === 'protected') go('protected')
            else setFilter(value)
          }} onImport={openImport}/>}
          {ready && page === 'queue' && <ReviewQueue data={data} run={run} onProfiles={() => go('profiles', 'one-way')} onSettings={() => go('settings')} onRegister={() => { go('history'); setOpenRegistration(true) }}/>}
          {ready && page === 'history' && <History data={data} run={run} openRegistration={openRegistration}/>}
          {ready && page === 'settings' && <Settings data={data} run={run}/>}
        </div>
      </main>
      {importing && <ImportDialog close={() => setImporting(false)} run={run}/>}
      {!!notice && <Toast message={notice} dismiss={() => setNotice('')}/>}
    </div>
  </ActionError.Provider>
}
