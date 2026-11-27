import { ArrowUpRight, ClipboardList, Plus, Sparkles } from 'lucide-react'
import RequestTable from './RequestTable.jsx'

export default function StudentDashboard({ requests, user, room, onSelect, onNewRequest, onViewAll, feedbackEligible, onFeedback }) {
  const resolved = requests.filter(request => request.status === 'Resolved').length

  return <section className="panel requests-panel student-dashboard-panel">
    <div className="panel-head">
      <div><h2>Your recent requests</h2><p>{resolved} of your requests resolved · your room is {room || 'on file'}</p></div>
      <button className="text-link" onClick={onViewAll}>View all <ArrowUpRight size={13}/></button>
    </div>
    {requests.length
      ? <RequestTable requests={requests.slice(0, 5)} onSelect={onSelect} user={user} feedbackEligible={feedbackEligible} onFeedback={onFeedback} compact/>
      : <div className="student-empty"><span><ClipboardList size={20}/></span><strong>No requests yet</strong><p>Tell us what needs attention and we’ll take it from there.</p><button className="button primary" onClick={onNewRequest}><Plus size={14}/> New request</button></div>}
    <div className="student-note"><Sparkles size={14}/><span>Your hostel team will keep you updated as work moves forward.</span></div>
  </section>
}
