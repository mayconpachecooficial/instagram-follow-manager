import { CalendarClock, Check, Download, History as HistoryIcon } from 'lucide-react'
import { useState } from 'react'
import { decisions, formatDate, sessionStats, type Data } from './domain'
import { downloadReport } from './report'
import { actions } from './store'
import { Dialog, Empty, ProfileLink, type Run } from './ui'

export function History({ data, run, openRegistration = false }: { data: Data; run: Run; openRegistration?: boolean }) {
  const [registering, setRegistering] = useState(openRegistration)
  const [usernames, setUsernames] = useState('')
  const [saving, setSaving] = useState(false)
  const [sessionId, setSessionId] = useState('')
  const [limit, setLimit] = useState(25)
  const reviews = sessionId ? data.history.filter(item => item.sessionId === sessionId) : data.history
  const sessions = new Map(data.sessions.map(item => [item.id, item]))
  function closeRegistration() {
    setRegistering(false)
    setUsernames('')
  }

  return <>
    <section className="panel history-panel">
      <div className="section-heading"><div><h2>Decisões registradas</h2><p>Histórico local de todas as revisões.</p></div>
        <div className="row-actions history-actions">
          <button className="button primary" onClick={() => setRegistering(true)}><Check size={16}/> Registrar unfollow</button>
          <button className="button secondary" disabled={!data.history.length} onClick={() => downloadReport(data, 'csv')}><Download size={16}/> CSV</button>
          <button className="button secondary" disabled={!data.history.length && !data.sessions.length && !data.evolution.length} onClick={() => downloadReport(data, 'json')}><Download size={16}/> JSON</button>
        </div>
      </div>
      {!!data.sessions.length && <div className="filter-bar"><select value={sessionId} aria-label="Filtrar por sessão" onChange={event => { setSessionId(event.target.value); setLimit(25) }}>
        <option value="">Todas as sessões</option>{data.sessions.map(item => <option key={item.id} value={item.id}>{formatDate(item.started)}</option>)}
      </select></div>}
      {reviews.length ? <>
        <div className="table-scroll"><table><thead><tr><th scope="col">Perfil</th><th scope="col">Registrado em</th><th scope="col">Decisão</th><th scope="col">Sessão</th></tr></thead>
          <tbody>{reviews.slice(0, limit).map(item => <tr key={item.id}><td><ProfileLink username={item.username}/></td><td>{formatDate(item.at)}</td>
            <td><span className={'status ' + (item.decision === 'confirmado' ? 'green' : 'neutral')}>{decisions[item.decision]}</span></td>
            <td>{item.sessionId ? formatDate(sessions.get(item.sessionId)?.started ?? item.at) : 'Sem sessão'}</td></tr>)}</tbody></table></div>
        {limit < reviews.length && <button className="button secondary more" onClick={() => setLimit(limit + 25)}>Mostrar mais</button>}
      </> : <Empty icon={<HistoryIcon size={23}/>} title="Nenhuma decisão registrada">Registre perfis que você já deixou de seguir ou revise sua fila.</Empty>}
    </section>
    <section className="panel history-panel">
      <div className="section-heading"><div><h2>Histórico de sessões</h2><p>Metas e resultados das suas sessões de revisão.</p></div><div className="tile blue"><CalendarClock size={20}/></div></div>
      {data.sessions.length ? <div className="table-scroll"><table>
        <thead><tr><th scope="col">Início</th><th scope="col">Término</th><th scope="col">Status</th><th scope="col">Revisados / Meta</th><th scope="col">Confirmados</th></tr></thead>
        <tbody>{data.sessions.map(item => {
          const stats = sessionStats(data.history, item.id)
          return <tr key={item.id}><td>{formatDate(item.started)}</td><td>{item.ended ? formatDate(item.ended) : '—'}</td><td><span className={'status ' + (item.status === 'ativa' ? 'green' : 'neutral')}>{item.status}</span></td><td>{stats.reviewed} / {item.goal}</td><td>{stats.confirmed}</td></tr>
        })}</tbody>
      </table></div> : <Empty icon={<CalendarClock size={23}/>} title="Nenhuma sessão registrada">Inicie uma sessão na fila de revisão.</Empty>}
    </section>
    {registering && <Dialog title="Registrar unfollow" locked={saving} close={closeRegistration}>
      <form onSubmit={async event => {
        event.preventDefault()
        setSaving(true)
        const saved = await run(() => actions.confirmRemoved(usernames), 'Unfollows registrados no histórico.')
        setSaving(false)
        if (saved) {
          setSessionId('')
          setLimit(25)
          closeRegistration()
        }
      }}>
        <label className="field">Nomes de usuário
          <textarea value={usernames} onChange={event => setUsernames(event.target.value)} rows={5} maxLength={5000} required disabled={saving} autoFocus placeholder={'@perfil1\n@perfil2'}/>
          <small className="muted">Informe um @ por linha ou separe por vírgulas. Inclua apenas perfis que você já deixou de seguir no Instagram.</small>
        </label>
        <div className="dialog-actions">
          <button type="button" className="button secondary" disabled={saving} onClick={closeRegistration}>Cancelar</button>
          <button className="button primary" disabled={saving || !usernames.trim()}>Salvar no histórico</button>
        </div>
      </form>
    </Dialog>}
  </>
}
