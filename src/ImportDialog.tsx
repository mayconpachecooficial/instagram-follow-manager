import { useRef, useState } from 'react'
import { FileText, LockKeyhole, Upload, X } from 'lucide-react'
import { supportedFile } from './import-names'
import { actions } from './store'
import { Dialog, type Run } from './ui'

export function ImportDialog({ close, run }: { close: () => void; run: Run }) {
  const field = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [drag, setDrag] = useState(false)
  const [error, setError] = useState('')
  function select(candidate: File[]) {
    const supported = candidate.filter(file => supportedFile(file.name))
    if (candidate.length !== supported.length) setError('Selecione os arquivos followers e following em JSON ou HTML. Extraia o ZIP primeiro.')
    else setError('')
    setFiles(current => {
      const next = new Map(current.map(file => [file.name.toLowerCase(), file]))
      for (const file of supported) next.set(file.name.toLowerCase(), file)
      return [...next.values()]
    })
  }
  async function submit() {
    setBusy(true)
    setError('')
    try {
      const { parseExport } = await import('./importer')
      const snapshot = await parseExport(files)
      if (await run(() => actions.saveImport(snapshot), 'Exportação importada.')) close()
      else setError('Não foi possível salvar a importação no navegador.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível ler os arquivos.')
    } finally {
      setBusy(false)
    }
  }
  return <Dialog title="Importar dados do Instagram" close={close} locked={busy}>
    <p className="muted">Extraia a exportação oficial e selecione <strong>following</strong> e todos os arquivos <strong>followers</strong>, como <code>followers_1.json</code> e <code>followers_2.json</code>.</p>
    <input ref={field} type="file" multiple accept=".json,.html" hidden onChange={event => {
      select(Array.from(event.currentTarget.files ?? []))
      event.currentTarget.value = ''
    }} />
    <button type="button" disabled={busy} className={'dropzone ' + (drag ? 'dragging' : '')} onClick={() => field.current?.click()}
      onDragOver={event => { event.preventDefault(); if (!busy) setDrag(true) }} onDragLeave={() => setDrag(false)}
      onDrop={event => { event.preventDefault(); setDrag(false); if (!busy) select(Array.from(event.dataTransfer.files)) }}>
      <div className="tile purple"><Upload size={20}/></div><strong>Selecione ou arraste os arquivos</strong><small>Formatos JSON e HTML</small>
    </button>
    {files.length > 0 && <ul className="file-list">{files.map(file => <li key={file.name}><FileText size={16}/><span>{file.name}</span><button className="icon-button" type="button" disabled={busy} aria-label={'Remover ' + file.name} onClick={() => setFiles(current => current.filter(item => item !== file))}><X size={15}/></button></li>)}</ul>}
    {error && <div className="alert error" role="alert">{error}</div>}
    <div className="privacy-line"><LockKeyhole size={14}/> Os arquivos são processados neste dispositivo.</div>
    <div className="dialog-actions"><button className="button secondary" disabled={busy} onClick={close}>Cancelar</button><button className="button primary" disabled={busy || !files.length} onClick={() => void submit()}><Upload size={16}/>{busy ? 'Importando…' : 'Importar arquivos'}</button></div>
  </Dialog>
}
