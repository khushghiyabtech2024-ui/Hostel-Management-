import { Wrench } from 'lucide-react'

const initials = name => name?.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase() || 'HM'
const relative = date => {
  const hours = Math.max(1, Math.floor((Date.now() - new Date(date)) / 3600000))
  return hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`
}
const statusClass = status => `status status-${status.toLowerCase().replace(' ', '-')}`

export default function RequestTable({ requests, onSelect, user, feedbackEligible, onFeedback, compact = false }) {
  return <div className={`table-scroll ${compact ? 'compact-table' : ''}`}>
    <table>
      <thead><tr><th>REQUEST</th>{user?.role !== 'Student' && <th>RESIDENT</th>}<th>ISSUE</th><th>PRIORITY</th><th>STATUS</th>{!compact && <th>ASSIGNED TO</th>}<th>{compact ? 'UPDATED' : 'REPORTED'}</th></tr></thead>
      <tbody>{requests.map(request => <tr key={request.id} onClick={() => onSelect(request)}>
        <td><div className="request-id"><span className="request-symbol"><Wrench size={13}/></span><span><strong>{request.id}</strong><small>{request.room}</small></span></div></td>
        {user?.role !== 'Student' && <td><div className="resident-cell"><span className="avatar avatar-warm">{initials(request.studentName)}</span><span>{request.studentName}</span></div></td>}
        <td><div className="issue-cell"><strong>{request.category}</strong><small>{request.description}</small></div></td>
        <td><span className={`priority-label priority-${request.priority.toLowerCase()}`}><i/>{request.priority}</span></td>
        <td><span className={statusClass(request.status)}><i/>{request.status}</span></td>
        {!compact && <td>{request.technicianName ? <div className="resident-cell"><span className="avatar avatar-green">{initials(request.technicianName)}</span><span>{request.technicianName}</span></div> : <span className="unassigned">Unassigned</span>}</td>}
        <td><span className="date-cell">{relative(compact ? request.updatedAt : request.createdAt)}</span>{feedbackEligible?.(request) && <button className="feedback-action" onClick={event => { event.stopPropagation(); onFeedback(request) }}>Leave feedback</button>}</td>
      </tr>)}</tbody>
    </table>
    {!requests.length && <div className="empty-inline">Nothing to show here yet.</div>}
  </div>
}
