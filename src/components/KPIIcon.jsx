import { Activity, Check, ClipboardList, Clock3, Users, X } from 'lucide-react'

const icons = [ClipboardList, Clock3, Users, Activity, Check, X]

export default function KPIIcon({ index }) {
  const Icon = icons[index % icons.length]
  return <Icon size={16} />
}
