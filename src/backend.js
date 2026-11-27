import { createClient } from '@supabase/supabase-js'
import { initialRequests, initialFeedback, people } from './data.js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY
// Local storage is the default so the project can be demonstrated without a paid backend.
// Set VITE_USE_SUPABASE=true only when intentionally testing a connected Supabase project.
const useSupabase = import.meta.env.VITE_USE_SUPABASE === 'true'
export const supabase = useSupabase && url && key && !url.includes('your-project') ? createClient(url, key) : null
const read = (key, seed) => { try { return JSON.parse(localStorage.getItem(key)) ?? seed } catch { return seed } }
const save = (key, data) => localStorage.setItem(key, JSON.stringify(data))

export async function signIn(email, password) {
  if (supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    const { data: profile, error: profileError } = await supabase.from('app_user').select('*').eq('auth_subject', data.user.id).single()
    if (profileError) throw profileError
    return { id: profile.app_user_id, name: profile.display_name, email: profile.email, role: profile.role, active: profile.active, authSubject: data.user.id }
  }
  if (!password.trim()) throw new Error('Enter a password to continue.')
  const demo = people.find(person => person.email.toLowerCase() === email.toLowerCase())
  if (!demo) throw new Error('Account not found. Use one of the demo accounts shown below.')
  return { id: demo.id, name: demo.name, role: demo.role, title: demo.title, email: demo.email, studentNumber: demo.studentId }
}
export async function loadSignupRooms() {
  if (!supabase) throw new Error('Student self-registration is available after connecting Supabase.')
  const { data, error } = await supabase.rpc('list_signup_rooms')
  if (error) throw error
  return data.map(room => ({ id:room.room_id, label:room.room_label }))
}
export async function registerStudent(form) {
  if (!supabase) throw new Error('Student self-registration is available after connecting Supabase.')
  const { data, error } = await supabase.auth.signUp({
    email:form.email.trim(),
    password:form.password,
    options:{ emailRedirectTo:window.location.origin, data:{ signup_type:'student', full_name:form.fullName.trim(), room_id:form.roomId, phone:form.phone, course:form.course, year:form.year } },
  })
  if (error) throw error
  if (!data.session || !data.user) return { user:null }
  const { data:profile, error:profileError } = await supabase.from('app_user').select('*').eq('auth_subject',data.user.id).single()
  if (profileError) throw profileError
  return { user:{ id:profile.app_user_id, name:profile.display_name, email:profile.email, role:profile.role, active:profile.active, authSubject:data.user.id } }
}
export async function signOut() { if (supabase) await supabase.auth.signOut() }

export async function loadData(user) {
  if (supabase) {
    const [req, feedback, tech, student, history, assignments, hostels, rooms] = await Promise.all([
      supabase.from('maintenance_request').select('*,student:student_id(full_name,app_user_id),room:room_id(room_number), assignments:assignment(*,technician:technician_id(technician_id,app_user_id,full_name,specialization))').order('created_at', { ascending: false }),
      supabase.from('feedback').select('*, student:student_id(full_name),request:request_id(request_code)').order('submitted_at', { ascending: false }),
      supabase.from('technician').select('technician_id,app_user_id,full_name,specialization,active').eq('active', true),
      supabase.from('student').select('student_id,app_user_id,student_number,full_name,email,phone,course,year,room:room_id(room_number)').eq('app_user_id', user.id).maybeSingle(),
      supabase.from('status_history').select('*,request:request_id(request_code),actor:changed_by(display_name)').order('changed_at'),
      supabase.from('assignment').select('*,request:request_id(request_code,category,priority,student:student_id(full_name),room:room_id(room_number)),technician:technician_id(full_name,specialization)').order('assigned_at', { ascending: false }),
      supabase.from('hostel').select('hostel_id,hostel_name,hostel_type').order('hostel_name'),
      supabase.from('room').select('room_id,hostel_id,room_number,floor,capacity,hostel:hostel_id(hostel_name)').order('room_number'),
    ])
    if (req.error) throw req.error
    if (feedback.error) throw feedback.error
    if (tech.error) throw tech.error
    if (student.error) throw student.error
    if (history.error) throw history.error
    if (assignments.error) throw assignments.error
    if (hostels.error) throw hostels.error
    if (rooms.error) throw rooms.error
    const historyByRequest = history.data.reduce((groups,h)=>{(groups[h.request_id] ||= []).push(h);return groups},{})
    const requests = await Promise.all(req.data.map(async r => {
      const item={...mapRequest(r), history:(historyByRequest[r.request_id]||[]).map(h=>({status:h.new_status,at:h.changed_at,actor:h.actor?.display_name||'Hostel team',note:h.note}))}
      if(r.photo_url){const {data:signed}=await supabase.storage.from('request-photos').createSignedUrl(r.photo_url,3600);item.photoUrl=signed?.signedUrl}
      return item
    }))
    const assignmentRows = assignments.data.map(a=>({id:a.assignment_code,requestId:a.request?.request_code,category:a.request?.category,priority:a.request?.priority,room:a.request?.room?.room_number,studentName:a.request?.student?.full_name,technicianName:a.technician?.full_name,technicianRole:a.technician?.specialization,remarks:a.remarks,assignedAt:a.assigned_at,active:a.active_flag}))
    return { requests, feedback: feedback.data.map(x => ({ id:x.feedback_code, requestId:x.request?.request_code || x.request_id, studentName:x.student?.full_name, rating:x.rating, comments:x.comments, submittedAt:x.submitted_at })), technicians: tech.data.map(t => ({ id:t.app_user_id, name:t.full_name, title:t.specialization, technicianId:t.technician_id })), assignments:assignmentRows, hostels:hostels.data.map(h=>({id:h.hostel_id,name:h.hostel_name,type:h.hostel_type})), rooms:rooms.data.map(r=>({id:r.room_id,hostelId:r.hostel_id,roomNumber:r.room_number,hostelName:r.hostel?.hostel_name,floor:r.floor,capacity:r.capacity})), studentProfile:student.data?{studentNumber:student.data.student_number,fullName:student.data.full_name,email:student.data.email,phone:student.data.phone,course:student.data.course,year:student.data.year,room:student.data.room?.room_number}:null, myRoom: student.data?.room?.room_number || 'A · 204' }
  }
  const requests = read('haven_requests', initialRequests)
  const seededAssignments = requests.filter(r=>r.technicianId).map(r=>({id:`ASG-${r.id.slice(-6)}`,requestId:r.id,category:r.category,priority:r.priority,room:r.room,studentName:r.studentName,technicianName:r.technicianName,remarks:r.assignmentRemarks,assignedAt:r.history?.find(h=>h.status==='Assigned')?.at||r.createdAt,active:true}))
  return { requests, feedback: read('haven_feedback', initialFeedback), technicians: people.filter(person=>person.role==='Technician').map(person=>({id:person.id,name:person.name,title:person.title,technicianId:person.technicianId})), assignments:read('haven_assignments',seededAssignments), hostels:read('haven_hostels',[{id:'hostel-a',name:'Maple House',type:'Other'}]), rooms:read('haven_rooms',[{id:'room-a204',hostelId:'hostel-a',roomNumber:'A · 204',hostelName:'Maple House',floor:2,capacity:4},{id:'room-b310',hostelId:'hostel-a',roomNumber:'B · 310',hostelName:'Cedar House',floor:3,capacity:4},{id:'room-c112',hostelId:'hostel-a',roomNumber:'C · 112',hostelName:'Willow House',floor:1,capacity:4}]), studentProfile:user.role==='Student'?{studentNumber:user.studentNumber||'STU-2024-018',fullName:user.name,email:user.email,phone:'+91 98765 43210',course:'Computer Science',year:'3rd year',room:'A · 204'}:null, myRoom: 'A · 204' }
}
function mapRequest(r) {
  const active = (r.assignments || []).find(a => a.active_flag)
  return { databaseId:r.request_id, id:r.request_code, studentId:r.student?.app_user_id || r.student_id, studentName:r.student?.full_name || 'Resident', room:r.room?.room_number || r.room_id, category:r.category, description:r.description, priority:r.priority, status:r.status, createdAt:r.created_at, updatedAt:r.updated_at, technicianId:active?.technician?.app_user_id, technicianName:active?.technician?.full_name, assignmentRemarks:active?.remarks, rejectionReason:r.rejection_reason, completionNotes:r.work_notes, history:[] }
}
async function nextCode(prefix, records) { return `${prefix}-${String(records.length + 129).padStart(6,'0')}` }
export async function createRequest(user, form, existing) {
  const id = supabase ? null : await nextCode('REQ', existing)
  const item = { databaseId:supabase?crypto.randomUUID():undefined, id, studentId:user.id, studentName:user.name, room:form.room, category:form.category, description:form.description.trim(), priority:form.priority, status:'Pending', createdAt:new Date().toISOString(), updatedAt:new Date().toISOString(), history:[{status:'Pending',at:new Date().toISOString(),actor:user.name}] }
  if (supabase) {
    const { data: profile, error: pe } = await supabase.from('student').select('student_id,room_id,room:room_id(room_number)').eq('app_user_id', user.id).single()
    if (pe) throw pe
    if (form.room !== profile.room?.room_number) throw new Error('Choose the room assigned to your student account.')
    const { data: saved, error } = await supabase.from('maintenance_request').insert({request_id:item.databaseId,student_id:profile.student_id,room_id:profile.room_id,category:form.category,description:item.description,priority:form.priority}).select('request_code').single()
    if (error) throw error
    item.id = saved.request_code
    if(form.photo){const path=`${item.databaseId}/${form.photo.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`;const {error:uploadError}=await supabase.storage.from('request-photos').upload(path,form.photo,{contentType:form.photo.type,upsert:false});if(!uploadError){const {error:attachError}=await supabase.rpc('attach_request_photo',{p_request_id:item.databaseId,p_photo_url:path});if(!attachError)item.photoUrl=path}}
  } else {
    if(form.photo)item.photoUrl=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(form.photo)})
    save('haven_requests',[item,...existing])
  }
  return item
}
export async function updateRequest(user, request, changes, current) {
  if (supabase) {
    const row = { updated_at:new Date().toISOString() }
    if (changes.status && !changes.technicianId) row.status = changes.status
    if (changes.rejectionReason !== undefined && !changes.technicianId) row.rejection_reason = changes.rejectionReason
    if (changes.note && changes.status === 'Resolved') row.work_notes = changes.note
    if(!changes.technicianId && Object.keys(row).length>1){const { error } = await supabase.from('maintenance_request').update(row).eq('request_id',request.databaseId);if(error)throw error}
    if (changes.technicianId) {
      const t = current.technicians.find(x=>x.id===changes.technicianId)
      const { error: ae } = await supabase.from('assignment').insert({request_id:request.databaseId,technician_id:t.technicianId,remarks:changes.assignmentRemarks || null})
      if (ae) throw ae
    }
  } else {
    save('haven_requests',current.requests.map(r=>r.id===request.id?{...r,...changes,updatedAt:new Date().toISOString(),history:[...(r.history||[]),...(changes.status?[{status:changes.status,at:new Date().toISOString(),actor:user.name,note:changes.note}]:[])]}:r))
    if(changes.technicianId){const tech=current.technicians.find(x=>x.id===changes.technicianId);const rows=read('haven_assignments',current.assignments||[]).map(a=>a.requestId===request.id?{...a,active:false}:a);rows.unshift({id:`ASG-${Date.now()}`,requestId:request.id,category:request.category,priority:request.priority,room:request.room,studentName:request.studentName,technicianName:tech?.name,remarks:changes.assignmentRemarks,assignedAt:new Date().toISOString(),active:true});save('haven_assignments',rows)}
  }
}
export async function submitFeedback(user, request, form, current) {
  const item={id:`FB-${String(current.feedback.length+1).padStart(5,'0')}`,requestId:request.id,studentName:user.name,rating:Number(form.rating),comments:form.comments.trim(),submittedAt:new Date().toISOString()}
  if(supabase){const {data:s,error:se}=await supabase.from('student').select('student_id').eq('app_user_id',user.id).single();if(se)throw se;const {error}=await supabase.from('feedback').insert({request_id:request.databaseId,student_id:s.student_id,rating:item.rating,comments:item.comments});if(error)throw error}
  else save('haven_feedback',[item,...current.feedback])
  return item
}

export async function createRoom(form, current) {
  const item={id:supabase?undefined:`room-${Date.now()}`,hostelId:form.hostelId,roomNumber:form.roomNumber.trim(),hostelName:current.hostels.find(h=>h.id===form.hostelId)?.name,floor:Number(form.floor)||0,capacity:Number(form.capacity)||4}
  if(supabase){const {data,error}=await supabase.from('room').insert({hostel_id:item.hostelId,room_number:item.roomNumber,floor:item.floor,capacity:item.capacity}).select('room_id').single();if(error)throw error;item.id=data.room_id}
  else save('haven_rooms',[item,...(current.rooms||[])])
  return item
}
