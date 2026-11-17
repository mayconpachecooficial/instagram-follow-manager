import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatDate, formatNumber, type Data } from './domain'

export default function EvolutionChart({ points }: { points: Data['evolution'] }) {
  return <div className="chart" aria-label="Gráfico de contas seguidas por importação">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 12, right: 16, left: 1, bottom: 2 }}>
              <defs><linearGradient id="following-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#9b7bf7" stopOpacity={.34}/><stop offset="100%" stopColor="#9b7bf7" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid stroke="var(--line)" vertical={false} strokeDasharray="4 4" />
              <XAxis dataKey="at" tickFormatter={value => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={20} />
              <YAxis allowDecimals={false} tickFormatter={formatNumber} tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} width={49} />
              <Tooltip labelFormatter={value => formatDate(Number(value))} formatter={value => [formatNumber(Number(value)), 'Seguindo']} contentStyle={{ background: 'var(--panel)', color: 'var(--text)', border: '1px solid var(--line)', borderRadius: 10 }} itemStyle={{ color: 'var(--text)' }} />
              <Area type="linear" dataKey="count" stroke="#a487fa" fill="url(#following-fill)" strokeWidth={2.5} dot={{ r: 4, fill: '#a487fa' }} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
}
