import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react'
import { Check, ExternalLink, X } from 'lucide-react'
import { instagramUrl } from './domain'

export const ActionError = createContext({ error: '', clear: () => {} })

export type Run = (action: () => Promise<void>, success?: string) => Promise<boolean>

export function Empty({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return <div className="empty"><div className="empty-icon">{icon}</div><strong>{title}</strong><div className="muted">{children}</div></div>
}

export function ProfileLink({ username, button = false }: { username: string; button?: boolean }) {
  return <a className={button ? 'button secondary' : 'profile-link'} href={instagramUrl(username)} target="_blank" rel="noopener noreferrer">
    {button ? 'Abrir no Instagram' : '@' + username}<ExternalLink size={14} />
  </a>
}

export function Dialog({ title, children, close, locked = false }: { title: string; children: ReactNode; close: () => void; locked?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null)
  const { error, clear } = useContext(ActionError)
  const closeDialog = () => { clear(); close() }
  useEffect(() => {
    const modal = ref.current
    modal?.showModal()
    return () => modal?.close()
  }, [])
  return <dialog ref={ref} className="dialog" aria-label={title} onCancel={event => { event.preventDefault(); if (!locked) closeDialog() }}>
    <div className="dialog-top"><h2>{title}</h2><button type="button" className="icon-button" aria-label="Fechar" onClick={closeDialog} disabled={locked}><X size={20} /></button></div>
    {error && <div className="alert error" role="alert">{error}</div>}
    {children}
  </dialog>
}

export function Progress({ current, target }: { current: number; target: number }) {
  const percent = target ? Math.min(100, Math.round(current / target * 100)) : 0
  return <div className="progress-track" role="progressbar" aria-label="Meta de revisão" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
    <div style={{ width: percent + '%' }} />
  </div>
}

export function Toast({ message, dismiss }: { message: string; dismiss: () => void }) {
  return <div className="toast" role="status"><Check size={18} />{message}<button type="button" className="icon-button" onClick={dismiss} aria-label="Dispensar"><X size={17} /></button></div>
}
