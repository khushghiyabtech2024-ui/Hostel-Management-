export const statuses = ['Pending', 'Assigned', 'In Progress', 'Resolved', 'Rejected']
export const categories = ['Plumbing', 'Electrical', 'Carpentry', 'Cleaning', 'Internet', 'Furniture', 'Other']
export const priorities = ['Low', 'Medium', 'High', 'Emergency']

export const people = [
  { id: 'u-admin', name: 'Aarav Mehta', email: 'admin@haven.edu', role: 'Admin', title: 'Warden' },
  { id: 'u-student', name: 'Isha Sharma', email: 'student@haven.edu', role: 'Student', title: 'Resident · Block A, 204', studentId: 'STU-2024-018' },
  { id: 'u-tech', name: 'Rohan Das', email: 'tech@haven.edu', role: 'Technician', title: 'Electrical', technicianId: 'TECH-004' },
  { id: 'u-tech-2', name: 'Priya Nair', email: 'priya@haven.edu', role: 'Technician', title: 'Plumbing', technicianId: 'TECH-007' },
  { id: 'u-tech-3', name: 'Amit Das', email: 'amit.carpenter@haven.edu', role: 'Technician', title: 'Carpentry', technicianId: 'TECH-008' },
  { id: 'u-tech-4', name: 'Karan Shah', email: 'karan.general@haven.edu', role: 'Technician', title: 'General maintenance', technicianId: 'TECH-009' },
]

const ago = (n) => new Date(Date.now() - n * 3600000).toISOString()
export const initialRequests = [
  { id: 'REQ-000128', studentId: 'u-student', studentName: 'Isha Sharma', room: 'A · 204', category: 'Electrical', description: 'Ceiling light flickers throughout the evening and sometimes switches off completely.', priority: 'High', status: 'In Progress', createdAt: ago(5), updatedAt: ago(1), technicianId: 'u-tech', technicianName: 'Rohan Das', assignmentRemarks: 'Carry a replacement LED driver.', history: [{ status: 'Pending', at: ago(5), actor: 'Isha Sharma' }, { status: 'Assigned', at: ago(4), actor: 'Aarav Mehta' }, { status: 'In Progress', at: ago(1), actor: 'Rohan Das' }] },
  { id: 'REQ-000127', studentId: 'u-student', studentName: 'Isha Sharma', room: 'A · 204', category: 'Plumbing', description: 'Washbasin tap has a slow leak at the base.', priority: 'Medium', status: 'Resolved', createdAt: ago(52), updatedAt: ago(8), technicianId: 'u-tech-2', technicianName: 'Priya Nair', completionNotes: 'Replaced the worn washer and tested for leaks.', history: [{ status: 'Pending', at: ago(52), actor: 'Isha Sharma' }, { status: 'Assigned', at: ago(42), actor: 'Aarav Mehta' }, { status: 'In Progress', at: ago(20), actor: 'Priya Nair' }, { status: 'Resolved', at: ago(8), actor: 'Priya Nair' }] },
  { id: 'REQ-000126', studentId: 'u-student', studentName: 'Isha Sharma', room: 'A · 204', category: 'Furniture', description: 'Study desk drawer is stuck and the handle is loose.', priority: 'Low', status: 'Pending', createdAt: ago(19), updatedAt: ago(19), history: [{ status: 'Pending', at: ago(19), actor: 'Isha Sharma' }] },
  { id: 'REQ-000125', studentId: 'u-else', studentName: 'Kabir Verma', room: 'B · 310', category: 'Internet', description: 'Wi-Fi drops repeatedly near the window.', priority: 'Medium', status: 'Assigned', createdAt: ago(31), updatedAt: ago(16), technicianId: 'u-tech', technicianName: 'Rohan Das', assignmentRemarks: 'Check access point signal in corridor.', history: [{ status: 'Pending', at: ago(31), actor: 'Kabir Verma' }, { status: 'Assigned', at: ago(16), actor: 'Aarav Mehta' }] },
  { id: 'REQ-000124', studentId: 'u-else', studentName: 'Meera Iyer', room: 'C · 112', category: 'Cleaning', description: 'Water has collected near the common room entrance.', priority: 'Emergency', status: 'Pending', createdAt: ago(2), updatedAt: ago(2), history: [{ status: 'Pending', at: ago(2), actor: 'Meera Iyer' }] },
  { id: 'REQ-000123', studentId: 'u-else', studentName: 'Kabir Verma', room: 'B · 310', category: 'Carpentry', description: 'Wardrobe hinge has come loose.', priority: 'Low', status: 'Rejected', rejectionReason: 'Please submit the request again with a photo of the damaged hinge.', createdAt: ago(86), updatedAt: ago(70), history: [{ status: 'Pending', at: ago(86), actor: 'Kabir Verma' }, { status: 'Rejected', at: ago(70), actor: 'Aarav Mehta' }] },
]

export const initialFeedback = [{ id: 'FB-00001', requestId: 'REQ-000127', studentName: 'Isha Sharma', rating: 5, comments: 'Quick and tidy repair. Thank you!', submittedAt: ago(6) }]
