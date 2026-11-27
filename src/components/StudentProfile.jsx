import { Mail, MapPin, Phone, ShieldCheck, UserRound } from 'lucide-react'

const initials = name => name?.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase() || 'ST'

export default function StudentProfile({ user, profile, room }) {
  const values = [
    ['Student ID', profile?.studentNumber || profile?.student_number || 'Not provided', <UserRound size={15}/>],
    ['Room', profile?.room || room || 'Not assigned', <MapPin size={15}/>],
    ['Course and year', [profile?.course, profile?.year].filter(Boolean).join(' · ') || 'Not provided', <ShieldCheck size={15}/>],
    ['Phone', profile?.phone || 'Not provided', <Phone size={15}/>],
  ]

  return <section className="student-profile">
    <div className="profile-hero"><span className="avatar profile-large">{initials(profile?.fullName || profile?.full_name || user.name)}</span><div><span className="eyebrow">STUDENT PROFILE</span><h2>{profile?.fullName || profile?.full_name || user.name}</h2><p>Resident at Haven House</p></div><span className="profile-role">Student</span></div>
    <div className="profile-details">
      <div className="profile-detail"><span className="profile-detail-icon"><Mail size={15}/></span><div><small>Email address</small><strong>{profile?.email || user.email}</strong></div></div>
      {values.map(([label, value, icon]) => <div className="profile-detail" key={label}><span className="profile-detail-icon">{icon}</span><div><small>{label}</small><strong>{value}</strong></div></div>)}
    </div>
    <p className="profile-footnote"><ShieldCheck size={15}/> Your personal information is visible only to you and authorized hostel staff.</p>
  </section>
}
