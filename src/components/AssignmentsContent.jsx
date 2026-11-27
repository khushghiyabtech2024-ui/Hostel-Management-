import { Search } from 'lucide-react'

const initials = name => name?.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase() || 'HM'
const formatDate = date => new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(date))

export default function AssignmentsContent({ assignments, query, setQuery }) {
  const filtered = assignments.filter(assignment => !query ||
    `${assignment.id} ${assignment.requestId} ${assignment.studentName} ${assignment.technicianName} ${assignment.category}`.toLowerCase().includes(query.toLowerCase()))

  return <>
    <div className="panel-head">
      <div><h2>Assignment history</h2><p>{assignments.length} technician assignments, including handoffs</p></div>
    </div>
    <div className="list-tools">
      <div className="searchbox"><Search size={15}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search assignments, residents, technicians…"/></div>
    </div>
    <div className="table-scroll">
      <table>
        <thead><tr><th>ASSIGNMENT</th><th>REQUEST</th><th>RESIDENT</th><th>TECHNICIAN</th><th>NOTES</th><th>ASSIGNED</th><th>STATE</th></tr></thead>
        <tbody>{filtered.map(assignment => <tr key={assignment.id}>
          <td><span className="assignment-id">{assignment.id}</span></td>
          <td><span className="assignment-request"><strong>{assignment.requestId}</strong><small>{assignment.category} · {assignment.room}</small></span></td>
          <td>{assignment.studentName || '—'}</td>
          <td><div className="resident-cell"><span className="avatar avatar-green">{initials(assignment.technicianName)}</span><span>{assignment.technicianName}</span></div></td>
          <td><span className="assignment-note">{assignment.remarks || '—'}</span></td>
          <td><span className="date-cell">{assignment.assignedAt ? formatDate(assignment.assignedAt) : '—'}</span></td>
          <td><span className={`status ${assignment.active ? 'status-assigned' : 'status-resolved'}`}><i/>{assignment.active ? 'Active' : 'Handed off'}</span></td>
        </tr>)}</tbody>
      </table>
      {!filtered.length && <div className="empty-inline">No assignments match your search.</div>}
    </div>
  </>
}
