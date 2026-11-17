import { decisions, type Data } from './domain'

const csv = (value: string) => '"' + value.replaceAll('"', '""') + '"'

export function downloadReport(data: Data, format: 'csv' | 'json') {
  const reviews = data.history.map(review => ({
    perfil: review.username,
    data: new Date(review.at).toISOString(),
    decisao: decisions[review.decision],
    unfollow_confirmado_manualmente: review.decision === 'confirmado',
    sessao: review.sessionId,
  }))
  const rows = [
    'perfil,data,decisao,unfollow_confirmado_manualmente,sessao',
    ...reviews.map(row => Object.values(row).map(value => csv(String(value))).join(',')),
  ]
  const body = format === 'json' ? JSON.stringify({
    revisoes: reviews, sessoes: data.sessions, importacoes: data.evolution,
  }, null, 2) : '\uFEFF' + rows.join('\r\n')
  const uri = URL.createObjectURL(new Blob([body], { type: format === 'json' ? 'application/json' : 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = uri
  link.download = 'follow-manager-relatorio.' + format
  link.click()
  setTimeout(() => URL.revokeObjectURL(uri), 1000)
}
