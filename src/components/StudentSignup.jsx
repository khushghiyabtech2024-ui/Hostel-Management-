import { useEffect, useState } from 'react'
import { ArrowLeft, ChevronRight, Home, ShieldCheck } from 'lucide-react'
import { loadSignupRooms, registerStudent } from '../backend.js'

export default function StudentSignup({ onBack, onCreated }) {
  const [form, setForm] = useState({ fullName:'', email:'', password:'', confirmPassword:'', roomId:'', phone:'', course:'', year:'' })
  const [rooms, setRooms] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let active = true
    loadSignupRooms().then(rows => { if (active) { setRooms(rows); if (rows[0]) setForm(current => ({...current, roomId:rows[0].id})) } })
      .catch(problem => { if (active) setError(problem.message) })
    return () => { active = false }
  }, [])

  async function submit(event) {
    event.preventDefault()
    setError('')
    if (form.password.length < 8) { setError('Choose a password with at least 8 characters.'); return }
    if (form.password !== form.confirmPassword) { setError('The passwords do not match.'); return }
    if (!form.roomId) { setError('Ask the hostel administrator to add a room before registering.'); return }
    setBusy(true)
    try {
      const result = await registerStudent(form)
      if (result.user) onCreated(result.user)
      else setSuccess(`Your account was created. Check ${form.email} for the confirmation email, then return here to sign in.`)
    } catch (problem) {
      setError(problem.message || 'We could not create your account. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (success) return <div className="login-form signup-form">
    <span className="signup-success-icon"><ShieldCheck size={21}/></span>
    <span className="eyebrow">CHECK YOUR EMAIL</span>
    <h2>Almost there</h2>
    <p className="muted signup-success-copy">{success}</p>
    <button type="button" className="button secondary wide" onClick={onBack}><ArrowLeft size={15}/> Back to sign in</button>
  </div>

  return <form className="login-form signup-form" onSubmit={submit}>
    <button type="button" className="signup-back" onClick={onBack}><ArrowLeft size={14}/> Back to sign in</button>
    <span className="eyebrow">STUDENT REGISTRATION</span>
    <h2>Create your student account</h2>
    <p className="muted signup-intro">Use an email address you can verify. Your account will have Student access.</p>
    <label>Full name<input autoComplete="name" required minLength={2} value={form.fullName} onChange={e=>setForm({...form,fullName:e.target.value})} placeholder="Your name"/></label>
    <label>Email address<input type="email" autoComplete="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="you@example.com"/></label>
    <label>Hostel room<select required value={form.roomId} onChange={e=>setForm({...form,roomId:e.target.value})}><option value="">Select your room</option>{rooms.map(room=><option key={room.id} value={room.id}>{room.label}</option>)}</select>{rooms.length===0&&<span className="field-hint">No rooms are available yet. Ask the hostel administrator to add rooms.</span>}</label>
    <div className="form-row signup-extra"><label>Course <span className="optional">OPTIONAL</span><input value={form.course} onChange={e=>setForm({...form,course:e.target.value})} placeholder="e.g. BCA"/></label><label>Year <span className="optional">OPTIONAL</span><input value={form.year} onChange={e=>setForm({...form,year:e.target.value})} placeholder="e.g. 1st year"/></label></div>
    <label>Password<input type="password" autoComplete="new-password" required minLength={8} value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="At least 8 characters"/></label>
    <label>Confirm password<input type="password" autoComplete="new-password" required value={form.confirmPassword} onChange={e=>setForm({...form,confirmPassword:e.target.value})} placeholder="Enter it again"/></label>
    {error&&<div className="error-box">{error}</div>}
    <button className="button primary wide" disabled={busy||rooms.length===0}>{busy?'Creating account…':'Create student account'}<ChevronRight size={16}/></button>
    <p className="signup-security"><Home size={13}/> Admin and Technician accounts are created by the hostel administrator.</p>
  </form>
}
