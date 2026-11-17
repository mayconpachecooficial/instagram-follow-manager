import { lazy, Suspense } from 'react'
import { Activity, ArrowRight, BarChart3, Check, GitCompareArrows, ListChecks, ShieldCheck, Upload, UserMinus, UserRoundPlus, Users } from 'lucide-react'
import { formatNumber, sessionStats, type Data } from './domain'
import { Empty, Progress } from './ui'

const EvolutionChart = lazy(() => import('./EvolutionChart'))

export function Dashboard({ data, onImport, onQueue }: { data: Data; onImport: () => void; onQueue: () => void }) {
  const snapshot = data.snapshot
  const following = snapshot?.following.length
  const followersSet = new Set(snapshot?.followers)
  const mutual = snapshot?.following.filter(name => followersSet.has(name)).length
  const confirmed = new Set(data.history.filter(item => item.decision === 'confirmado').map(item => item.username)).size
  const session = data.sessions.find(item => item.status !== 'encerrada')
  const stats = sessionStats(data.history, session?.id)
  const cards = [
    { title: 'Seguidores', value: snapshot?.followers.length, icon: Users, color: 'purple', sub: 'Contas que seguem você' },
    { title: 'Seguindo', value: following, icon: UserRoundPlus, color: 'blue', sub: 'Contas que você segue' },
    { title: 'Não seguem de volta', value: following !== undefined && mutual !== undefined ? following - mutual : undefined, icon: UserMinus, color: 'orange', sub: 'Perfis para revisar' },
    { title: 'Seguimento mútuo', value: mutual, icon: GitCompareArrows, color: 'green', sub: 'Vocês se seguem' },
  ]
  return <>
    <section className="hero">
      <div className="hero-content">
        <div className="hero-label"><ShieldCheck size={15} /> Dados armazenados neste navegador</div>
        <h2>Organize quem você segue</h2>
        <p>{snapshot ? 'Compare sua exportação mais recente, revise os perfis e acompanhe suas decisões.' : 'Importe sua exportação do Instagram para ver quem segue você de volta e organizar sua revisão.'}</p>
        <button className="button primary" onClick={onImport}><Upload size={17} />{snapshot ? 'Atualizar exportação' : 'Importar dados'}</button>
      </div>
      <div className="hero-art" aria-hidden="true"><div className="orbit outer"/><div className="orbit middle"/><div className="orbit inner"/><span className="art-dot first"/><span className="art-dot second"/><span className="art-dot third"/><span className="art-icon"><Users size={48} strokeWidth={1.35}/></span></div>
    </section>
    <div className="stats-grid">
      {cards.map(({ title, value, icon: Icon, color, sub }) => <div className="stat panel" key={title}>
        <div className={'tile ' + color}><Icon size={20} /></div>
        <div className="stat-title">{title}</div>
        <div className="stat-value">{value === undefined ? '—' : formatNumber(value)}</div>
        <div className="stat-sub">{sub}</div>
      </div>)}
    </div>
    <div className="dashboard-grid">
      <section className="panel chart-panel">
        <div className="section-heading"><div><h2>Evolução de seguidos</h2><p>Total de contas seguidas por importação</p></div><div className="tile purple"><Activity size={19} /></div></div>
        {data.evolution.length ? <Suspense fallback={<div className="chart loading" role="status">Carregando gráfico…</div>}>
          <EvolutionChart points={data.evolution} />
        </Suspense> : <Empty icon={<BarChart3 size={23}/>} title="Aguardando a primeira importação">O gráfico usa os totais das suas exportações.</Empty>}
      </section>
      <section className="panel review-panel">
        <div className="section-heading"><div><h2>Resumo da revisão</h2><p>Fila e confirmações manuais</p></div><div className="tile green"><ListChecks size={19}/></div></div>
        <div className="summary-row"><span><ListChecks size={17}/> Na fila</span><strong>{formatNumber(data.queue.length)}</strong></div>
        <div className="summary-row"><span><Check size={17}/> Unfollows confirmados</span><strong>{formatNumber(confirmed)}</strong></div>
        {session && <div className="summary-progress"><div className="spread"><span>Meta da sessão</span><span>{stats.reviewed} / {session.goal}</span></div><Progress current={stats.reviewed} target={session.goal}/></div>}
        <button className="button secondary full" onClick={onQueue}>Ir para a fila <ArrowRight size={17}/></button>
      </section>
    </div>
  </>
}
