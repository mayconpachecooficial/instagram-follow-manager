import { useState } from 'react'
import { Bell, LockKeyhole, Moon, Sun } from 'lucide-react'
import type { Data } from './domain'
import { actions } from './store'
import type { Run } from './ui'

export function Settings({ data, run }: { data: Data; run: Run }) {
  const [goal, setGoal] = useState(String(data.settings.goal))
  const [minutes, setMinutes] = useState(String(data.settings.breakMinutes))
  const [saving, setSaving] = useState(false)
  return <div className="settings-grid">
    <section className="panel settings-panel">
      <div className="section-heading"><div><h2>Preferências de sessão</h2><p>As mudanças se aplicam às próximas sessões.</p></div><div className="tile purple"><Bell size={19}/></div></div>
      <form onSubmit={async event => {
        event.preventDefault()
        setSaving(true)
        await run(() => actions.settings(Number(goal), Number(minutes)), 'Preferências salvas.')
        setSaving(false)
      }}>
        <label className="field">Meta de perfis por sessão<input value={goal} onChange={event => setGoal(event.target.value)} type="number" min={1} max={10000} step={1} required /></label>
        <label className="field">Lembrete de descanso em minutos<input value={minutes} onChange={event => setMinutes(event.target.value)} type="number" min={0} max={1440} step={1} required />
          <small className="muted">Use 0 para desativar. O lembrete aparece na fila enquanto a sessão estiver ativa.</small>
        </label>
        <button className="button primary" disabled={saving}>Salvar preferências</button>
      </form>
    </section>
    <div className="settings-aside">
      <section className="panel settings-panel">
        <div className="section-heading"><div><h2>Aparência</h2><p>Tema {data.theme === 'dark' ? 'escuro' : 'claro'}</p></div><div className="tile blue">{data.theme === 'dark' ? <Moon size={19}/> : <Sun size={19}/>}</div></div>
        <button className="button secondary" onClick={() => void run(actions.theme)}>{data.theme === 'dark' ? <Sun size={17}/> : <Moon size={17}/>} Usar tema {data.theme === 'dark' ? 'claro' : 'escuro'}</button>
      </section>
      <section className="panel settings-panel">
        <div className="section-heading"><div><h2>Privacidade</h2></div><div className="tile green"><LockKeyhole size={19}/></div></div>
        <p className="muted">Suas importações e decisões ficam neste navegador. Exporte o histórico antes de limpar os dados do site ou trocar de dispositivo.</p>
      </section>
    </div>
  </div>
}
