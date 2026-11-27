import { statuses } from '../data.js'

export default function StatusChart({ counts }) {
  const max = Math.max(1, ...statuses.map(status => counts[status] || 0))

  return (
    <div className="chart-wrap">
      <div className="mini-chart" role="img" aria-label="Requests by current status">
        {statuses.map(status => {
          const value = counts[status] || 0
          const height = Math.max(value ? 9 : 3, value / max * 100)

          return (
            <div className="mini-bar" key={status} title={`${status}: ${value}`}>
              <span className="mini-bar-value">{value}</span>
              <div className="mini-bar-track"><i style={{ height: `${height}%` }} /></div>
              <small>{status === 'In Progress' ? 'In progress' : status}</small>
            </div>
          )
        })}
      </div>
    </div>
  )
}
