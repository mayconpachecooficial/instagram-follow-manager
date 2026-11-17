import { useEffect, useState } from 'react'
import { AlertTriangle, ArrowRight, Bell, Check, Clock3, Forward, ListChecks, Pause, Play, Shield, Square, Target, UserRound } from 'lucide-react'
import { categories, formatNumber, sessionStats, type Category, type Data, type Decision } from './domain'
import { actions } from './store'
import { Dialog, Empty, ProfileLink, Progress, type Run } from './ui'

export function ReviewQueue({ data, run, onProfiles, onSettings, onRegister }: {
  data: Data; run: Run; onProfiles: () => void; onSettings: () => void; onRegister: () => void
}) {
  const session = data.sessions.find(item => item.status !== 'encerrada')
  const running = session?.status === 'ativa'
  const { reviewed, confirmed } = sessionStats(data.history, session?.id)
  const [now, setNow] = useState(Date.now)
  const [dialog, setDialog] = useState<{ username: string; decision: 'confirmado' | 'protegido' }>()
  const [category, setCategory] = useState<Category>('Outros')
  const [saving, setSaving] = useState(false)
  const username = data.queue[0]
  useEffect(() => {
    if (!running) return
    const update = () => setNow(Date.now())
    const timer = window.setInterval(update, 1000)
    window.addEventListener('focus', update)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', update)
    }
  }, [running])
  const breakDue = running && session.nextBreak !== undefined && now >= session.nextBreak

  async function record(name: string, decision: Decision, protection?: Category) {
    if (!session) return
    setSaving(true)
    const done = await run(() => actions.review(session.id, name, decision, protection), 'Decisão registrada.')
    if (done) setDialog(undefined)
    setSaving(false)
  }

  return <>
    <div className="dashboard-grid queue-grid">
      <section className="panel queue-panel">
        <div className="section-heading"><div><h2>Perfil da vez</h2><p>{formatNumber(data.queue.length)} {data.queue.length === 1 ? 'perfil na fila' : 'perfis na fila'}</p></div><div className="tile purple"><ListChecks size={20}/></div></div>
        {username ? <>
          <div className="queue-profile"><div className="avatar large">{username.slice(0, 2).toUpperCase()}</div><h3>@{username}</h3><ProfileLink username={username} button/></div>
          <p className="muted queue-copy">{running ? 'Deixe de seguir no Instagram e confirme aqui para registrar sua decisão manualmente.' : 'Inicie ou continue uma sessão para registrar suas decisões.'}</p>
          <div className="queue-actions">
            <button className="button primary" disabled={!running || saving} onClick={() => setDialog({ username, decision: 'confirmado' })}><Check size={18}/> Marcar como removido</button>
            <button className="button secondary" disabled={!running || saving} onClick={() => void record(username, 'pulado')}><Forward size={17}/> Pular</button>
            <button className="button secondary" disabled={!running || saving} onClick={() => void record(username, 'mantido')}><UserRound size={17}/> Manter seguindo</button>
            <button className="button secondary" disabled={!running || saving} onClick={() => setDialog({ username, decision: 'protegido' })}><Shield size={17}/> Adicionar à lista protegida</button>
          </div>
        </> : <Empty icon={<ListChecks size={24}/>} title="Sua fila está vazia"><button className="button secondary" onClick={onProfiles}>Escolher perfis <ArrowRight size={17}/></button> <button className="button secondary" onClick={onRegister}><Check size={17}/> Já deixei de seguir</button></Empty>}
      </section>
      <section className="panel session-panel">
        <div className="section-heading"><div><h2>Sessão de revisão</h2><p>{session ? (running ? 'Em andamento' : 'Pausada') : 'Nenhuma sessão em andamento'}</p></div><div className="tile blue"><Target size={19}/></div></div>
        <div className="summary-row"><span>Perfis revisados</span><strong>{reviewed} / {session?.goal ?? data.settings.goal}</strong></div>
        <Progress current={reviewed} target={session?.goal ?? data.settings.goal}/>
        <div className="summary-row"><span>Unfollows confirmados</span><strong>{confirmed}</strong></div>
        <div className="session-controls">
          {session ? <>
            <button className="button secondary" onClick={() => void run(() => actions.session(session.id, running ? 'pause' : 'resume'))}>{running ? <Pause size={16}/> : <Play size={16}/>} {running ? 'Pausar' : 'Continuar'}</button>
            <button className="button secondary" onClick={() => void run(() => actions.session(session.id, 'end'), 'Sessão encerrada.')}><Square size={15}/> Encerrar</button>
          </> : <button className="button primary full" onClick={() => void run(actions.start, 'Sessão iniciada.')}><Play size={17}/> Iniciar sessão</button>}
        </div>
        <button className="text-button" onClick={onSettings}><Clock3 size={15}/> Configurar meta e lembretes</button>
      </section>
    </div>
    {breakDue && <div className="alert reminder" role="status"><Bell size={19}/><div><strong>Hora de fazer uma pausa</strong><div>Você pode pausar a sessão e continuar quando quiser.</div></div><button className="button secondary small" onClick={() => void run(() => actions.session(session.id, 'break'))}>Dispensar lembrete</button></div>}
    <div className="alert advisory"><AlertTriangle size={19}/><p>Se o Instagram exibir um aviso, uma restrição ou um desafio de segurança, interrompa as ações e siga as orientações oficiais da plataforma.</p></div>
    {dialog && <Dialog title={dialog.decision === 'confirmado' ? 'Registrar unfollow manual' : 'Proteger perfil'} close={() => setDialog(undefined)} locked={saving}>
      {dialog.decision === 'confirmado' ? <p className="muted">Confirme se você já deixou de seguir <strong>@{dialog.username}</strong> no Instagram. Este registro é manual e não consulta a plataforma.</p>
        : <label className="field">Categoria de proteção<select value={category} onChange={event => setCategory(event.target.value as Category)}>{categories.map(item => <option key={item}>{item}</option>)}</select></label>}
      <div className="dialog-actions"><button className="button secondary" disabled={saving} onClick={() => setDialog(undefined)}>Cancelar</button><button className="button primary" disabled={saving} onClick={() => void record(dialog.username, dialog.decision, category)}>{dialog.decision === 'confirmado' ? 'Confirmar unfollow' : 'Proteger perfil'}</button></div>
    </Dialog>}
  </>
}
