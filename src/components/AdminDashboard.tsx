import React, { useState, useEffect } from 'react';
import { 
  BarChart3, School as SchoolIcon, Users, FileLock, Layers, BookOpen, 
  Trash2, UserPlus, ToggleLeft, ToggleRight, Key, Settings, LogOut, 
  ShieldAlert, RefreshCcw, Plus, Check, Edit2, CheckCircle2, XCircle, 
  BookMarked, Scan, Mail
} from 'lucide-react';
import { User, School, Textbook, QRCode, ScanLog, Subject, LearningResource, Chapter } from '../types';
import { db } from '../dbMock';

interface AdminDashboardProps {
  currentUser: User;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  onLogout,
}) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'kpis' | 'schools' | 'users' | 'content'>('kpis');

  // DB States
  const [schools, setSchools] = useState<School[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [books, setBooks] = useState<Textbook[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [scanLogs, setScanLogs] = useState<ScanLog[]>([]);
  const [qrs, setQrs] = useState<QRCode[]>([]);

  // ---- CREATIVE FORM STATES ----
  // New School
  const [schoolName, setSchoolName] = useState('');
  const [schoolLoc, setSchoolLoc] = useState('');
  
  // New User
  const [userFullName, setUserFullName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPass, setUserPass] = useState('');
  const [userRole, setUserRole] = useState<'student' | 'teacher'>('student');
  const [userSchoolId, setUserSchoolId] = useState('');

  // Editing User state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserFullName, setEditUserFullName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserSchoolId, setEditUserSchoolId] = useState('');

  // Toast banner
  const [toastAlert, setToastAlert] = useState('');

  const triggerToast = (msg: string) => {
    setToastAlert(msg);
    setTimeout(() => setToastAlert(''), 3500);
  };

  useEffect(() => {
    loadDatabase();
  }, []);

  const loadDatabase = () => {
    setSchools(db.getSchools());
    setUsers(db.getUsers());
    setBooks(db.getTextbooks());
    setSubjects(db.getSubjects());
    setResources(db.getResources());
    setScanLogs(db.getScanLogs());
    setQrs(db.getQRCodes());
  };

  // SCHOOL ACTIONS
  const handleCreateSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolName.trim() || !schoolLoc.trim()) {
      alert("Please supply name and topographical location.");
      return;
    }

    const currentSchools = db.getSchools();
    const newSchool: School = {
      id: `sch-${Date.now()}`,
      school_name: schoolName,
      location: schoolLoc,
      created_at: new Date().toISOString()
    };

    db.setSchools([...currentSchools, newSchool]);
    setSchoolName('');
    setSchoolLoc('');
    triggerToast(`School "${newSchool.school_name}" provisioned successfully.`);
    loadDatabase();
  };

  const handleDeleteSchool = (id: string) => {
    if (id === 'sch-1' || id === 'sch-2') {
      alert("Caution: Cannot delete baseline seed schools, as multiple active textbook assets are connected.");
      return;
    }
    if (!confirm("Are you sure you want to delete this school? Students and teachers mapped to it will lose association.")) return;
    
    // clear school id on users
    const allUsers = db.getUsers().map(u => {
      if (u.school_id === id) {
        return { ...u, school_id: null };
      }
      return u;
    });
    db.setUsers(allUsers);

    const allSchs = db.getSchools().filter(s => s.id !== id);
    db.setSchools(allSchs);
    triggerToast("School successfully de-provisioned.");
    loadDatabase();
  };

  // USER CRUD ACTIONS
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFullName.trim() || !userEmail.trim() || !userPass.trim()) {
      alert("Please complete the user configuration form.");
      return;
    }

    const currentUsers = db.getUsers();
    if (currentUsers.some(u => u.email.toLowerCase() === userEmail.toLowerCase().trim())) {
      alert("User email is already registered in our central database.");
      return;
    }

    const newUser: User = {
      id: `usr-a-${Date.now()}`,
      full_name: userFullName,
      email: userEmail,
      password: userPass,
      role: userRole,
      school_id: userSchoolId || null,
      status: 'active',
      created_at: new Date().toISOString()
    };

    db.setUsers([...currentUsers, newUser]);
    
    // reset form
    setUserFullName('');
    setUserEmail('');
    setUserPass('');
    setUserSchoolId('');
    
    triggerToast(`New account for ${userRole.toUpperCase()} "${newUser.full_name}" registered.`);
    loadDatabase();
  };

  const handleStartEditing = (u: User) => {
    setEditingUserId(u.id);
    setEditUserFullName(u.full_name);
    setEditUserEmail(u.email);
    setEditUserSchoolId(u.school_id || '');
  };

  const handleSaveUserEdit = (userId: string) => {
    const all = db.getUsers();
    const idx = all.findIndex(u => u.id === userId);
    if (idx !== -1) {
      all[idx].full_name = editUserFullName;
      all[idx].email = editUserEmail;
      all[idx].school_id = editUserSchoolId || null;
      db.setUsers(all);
      triggerToast("User credentials revised successfully.");
      setEditingUserId(null);
      loadDatabase();
    }
  };

  const handleToggleSuspend = (userId: string) => {
    if (userId === 'usr-admin') {
      alert("Error: Root Super Admin account status is permanently locked active.");
      return;
    }
    const current = db.getUsers();
    const index = current.findIndex(u => u.id === userId);
    if (index !== -1) {
      const currentRole = current[index].role;
      const currentStatus = current[index].status;
      const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
      current[index].status = nextStatus;
      db.setUsers(current);
      triggerToast(`${currentRole.toUpperCase()} account status toggled to: ${nextStatus}.`);
      loadDatabase();
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === 'usr-admin' || userId === 'usr-teacher1') {
      alert("Admin Safeguard: Cannot erase seed core accounts needed for demo operation.");
      return;
    }
    if (!confirm("Are you sure you want to permanently erase this account?")) return;

    db.setUsers(db.getUsers().filter(u => u.id !== userId));
    triggerToast("User account successfully scrubbed.");
    loadDatabase();
  };

  const handleResetPassword = (userId: string) => {
    const nextPass = prompt("Type a new secure password for this user:", "password123");
    if (!nextPass) return;
    const current = db.getUsers();
    const index = current.findIndex(u => u.id === userId);
    if (index !== -1) {
      current[index].password = nextPass;
      db.setUsers(current);
      triggerToast(`Password reset successfully to: "${nextPass}"`);
      loadDatabase();
    }
  };

  // CONTENT ACTIONS
  const handleDeleteTextbookAdmin = (bookId: string) => {
    if (!confirm("Admin Overwrite: Remove this entire textbook and wipe related chapters and QR sticker lists?")) return;
    db.setTextbooks(db.getTextbooks().filter(b => b.id !== bookId));
    db.setChapters(db.getChapters().filter(c => c.textbook_id !== bookId));
    triggerToast("Inappropriate textbook cascade removed.");
    loadDatabase();
  };

  const handleDeleteResourceAdmin = (resId: string) => {
    if (!confirm("Admin Override: De-index and purge this reading lesson sheet?")) return;
    db.setResources(db.getResources().filter(r => r.id !== resId));
    db.setQRCodes(db.getQRCodes().filter(q => q.target_id !== resId));
    triggerToast("Lesson content purged successfully.");
    loadDatabase();
  };

  // KPI COMPILER FORMULAS
  const numStudents = users.filter(u => u.role === 'student').length;
  const numTeachers = users.filter(u => u.role === 'teacher').length;
  const numSchools = schools.length;
  const numBooks = books.length;
  const numScans = scanLogs.length;

  // Active Users count (Simulated: unique users logging activity)
  const activeSaves = users.filter(u => u.status === 'active').length;

  return (
    <div className="bg-slate-150 min-h-screen text-slate-800 font-sans flex flex-col md:flex-row">
      
      {/* Toast popup alerts */}
      {toastAlert && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-slate-800 text-white rounded-xl shadow-2xl p-4 max-w-xs flex items-center gap-3 animate-pulse text-xs font-semibold">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastAlert}</span>
        </div>
      )}

      {/* ADMISSION PANEL SIDEBAR MENU */}
      <aside className="w-full md:w-[260px] bg-slate-900 shrink-0 text-white flex flex-col justify-between">
        
        {/* Upper Menu options */}
        <div>
          {/* Headline */}
          <div className="p-5 border-b border-slate-850 flex items-center gap-3.5">
            <div className="p-1.5 bg-emerald-600 rounded-md">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-slate-100 text-sm block">Super Admin Board</span>
              <span className="text-[10px] font-mono tracking-widest text-emerald-400 font-bold uppercase block mt-0.5">District Console</span>
            </div>
          </div>

          <nav className="p-4 space-y-1">
            <button
              onClick={() => setActiveTab('kpis')}
              className={`w-full text-left py-2.5 px-3.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2.5 select-none ${
                activeTab === 'kpis' ? 'bg-emerald-600 font-bold text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Operational Analytics</span>
            </button>
            <button
              onClick={() => setActiveTab('schools')}
              className={`w-full text-left py-2.5 px-3.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2.5 select-none ${
                activeTab === 'schools' ? 'bg-emerald-600 font-bold text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <SchoolIcon className="w-4 h-4" />
              <span>School Registers</span>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`w-full text-left py-2.5 px-3.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2.5 select-none ${
                activeTab === 'users' ? 'bg-emerald-600 font-bold text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>User Credentials CRUD</span>
            </button>
            <button
              onClick={() => setActiveTab('content')}
              className={`w-full text-left py-2.5 px-3.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2.5 select-none ${
                activeTab === 'content' ? 'bg-emerald-600 font-bold text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Content Moderation</span>
            </button>
          </nav>
        </div>

        {/* Footer info lock */}
        <div className="p-4 border-t border-slate-850 bg-slate-950/40 text-left space-y-3">
          <div className="flex items-center gap-2.5 text-xs text-slate-400">
            <div className="w-7 h-7 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center font-bold">
              SA
            </div>
            <div className="leading-none overflow-hidden text-slate-350">
              <span className="font-semibold block truncate">Super-Admin</span>
              <span className="text-[9px] text-slate-500">Root Override</span>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full py-1.5 px-3 border border-slate-850 hover:border-slate-800 bg-slate-900 hover:bg-slate-850 text-xs font-bold rounded-lg text-rose-400 hover:text-rose-350 transition flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Admin</span>
          </button>
        </div>
      </aside>

      {/* DYNAMIC CONTENT FIELD */}
      <div className="flex-1 min-w-0 p-5 sm:p-8 space-y-8 overflow-y-auto">
        
        {/* KPI MODULE / TAB 1: CENTRAL METRIC OVERVIEW */}
        {activeTab === 'kpis' && (
          <div className="space-y-6">
            
            {/* Top row analytics greeting */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm border border-slate-800">
              <h3 className="font-extrabold text-lg sm:text-xl">SmartQR District Analytics Command Dashboard</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
                Supervising educational material access, barcode registrations, student engagement logging, and school registrations across central highland territories. Review compiled numbers below.
              </p>
            </div>

            {/* SIX-GRID STATUS TILES */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
              {[
                { label: "District Schools", val: numSchools, desc: "Provisioned Boards", bg: "bg-teal-50 text-teal-700" },
                { label: "Active Faculty", val: numTeachers, desc: "Instructor Accounts", bg: "bg-sky-50 text-sky-700" },
                { label: "Enrolled Pupils", val: numStudents, desc: "Registered Students", bg: "bg-emerald-50 text-emerald-700" },
                { label: "E-Textbooks Online", val: numBooks, desc: "Curriculum Books", bg: "bg-indigo-50 text-indigo-700" },
                { label: "Total QR Scans", val: numScans, desc: "Cumulative Scans", bg: "bg-amber-50 text-amber-700" },
                { label: "Active Accounts", val: activeSaves, desc: "Non-Suspended Users", bg: "bg-purple-50 text-purple-700" }
              ].map((kpi, idx) => (
                <div key={idx} className="bg-white p-4 rounded-xl border border-slate-205 shadow-xs text-left">
                  <div className={`p-1.5 rounded-md text-[9px] font-bold uppercase tracking-wider w-fit select-none ${kpi.bg}`}>
                    {kpi.label}
                  </div>
                  <h4 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none mt-2">{kpi.val}</h4>
                  <p className="text-[10px] text-slate-400 mt-1">{kpi.desc}</p>
                </div>
              ))}
            </div>

            {/* ENGAGEMENT GRAPHS SIMULATION AND RECENT SCAN REGISTERS */}
            <div className="grid lg:grid-cols-12 gap-6 items-start">
              
              {/* Popularity bar chart */}
              <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Top Textbook Engagement Index</span>
                  <span className="text-[10px] text-slate-400 font-semibold font-mono uppercase">Scan percentage shares</span>
                </div>

                <div className="space-y-4 pt-1">
                  {books.length === 0 ? (
                    <p className="text-xs text-slate-500 italic text-center py-6">No textbooks stored.</p>
                  ) : (
                    books.slice(0, 5).map(b => {
                      const count = scanLogs.filter(log => log.target_id === b.id || db.getChapters().filter(ch => ch.textbook_id === b.id).map(ch => ch.id).includes(log.target_id)).length;
                      const ratio = numScans > 0 ? (count / numScans) * 100 : 0;
                      return (
                        <div key={b.id} className="text-xs space-y-1">
                          <div className="flex justify-between items-center font-semibold text-slate-700">
                            <span>{b.title}</span>
                            <span className="font-mono text-[11px] text-emerald-700 font-bold">{count} Scans ({Math.round(ratio)}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${ratio}%` }} />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Quick statistics tracker */}
              <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block pb-2 border-b">Instructional Health Indicators</span>
                <div className="space-y-3.5 pt-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Auto-generated QR sticker keys:</span>
                    <span className="font-bold text-slate-800 font-mono">{qrs.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Aggregated Chapters created:</span>
                    <span className="font-bold text-slate-800 font-mono">{db.getChapters().length} Units</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Digital Ebook Material pages:</span>
                    <span className="font-bold text-slate-800 font-mono">{resources.length} Sheets</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* SCHOOL REGISTER MODULE / TAB 2: SCHOOLS AND DISTRICT CRUDS */}
        {activeTab === 'schools' && (
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            
            {/* Create school builder */}
            <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block pb-1 border-b">Enroll New School Board</span>
              
              <form onSubmit={handleCreateSchool} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">School Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hillview Rural Senior High"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border rounded-lg focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Geographical District Area</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Eastern Highlands District, Zone 4"
                    value={schoolLoc}
                    onChange={(e) => setSchoolLoc(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border rounded-lg focus:bg-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-550 text-white font-bold rounded-lg text-xs leading-none shadow-sm transition-all"
                >
                  Confirm Institution Enrollment
                </button>
              </form>
            </div>

            {/* School database list table */}
            <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block pb-2 border-b">Registered District Institutions</span>
              
              <div className="space-y-3">
                {schools.map(sch => {
                  const sTeachers = users.filter(u => u.role === 'teacher' && u.school_id === sch.id).length;
                  const sStudents = users.filter(u => u.role === 'student' && u.school_id === sch.id).length;

                  return (
                    <div 
                      key={sch.id} 
                      className="p-3.5 rounded-xl border bg-slate-50 flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-xs font-medium"
                    >
                      <div className="text-left space-y-0.5">
                        <h4 className="font-extrabold text-slate-900 text-sm">{sch.school_name}</h4>
                        <p className="text-slate-500 font-sans">Location: {sch.location}</p>
                        <p className="text-[10px] text-slate-400 font-mono">ID Code: {sch.id} • Created: {new Date(sch.created_at).toLocaleDateString()}</p>
                      </div>

                      <div className="flex gap-4 items-center self-end sm:self-auto shrink-0 font-sans">
                        <div className="text-right leading-none">
                          <span className="font-bold text-slate-750 block">{sTeachers} Teachers</span>
                          <span className="text-[10px] text-slate-400">{sStudents} Students</span>
                        </div>
                        <button
                          onClick={() => handleDeleteSchool(sch.id)}
                          className="p-2 hover:bg-rose-50 text-rose-500 border border-slate-200 hover:border-rose-100 rounded-lg transition"
                          title="Purge institution"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* USER CRUD MODULE / TAB 3: USER MANAGEMENTS */}
        {activeTab === 'users' && (
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            
            {/* Create account form */}
            <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block pb-1 border-b">Authorise New Account</span>
              
              <form onSubmit={handleCreateUser} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">User Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Michael Thorne, Elizabeth"
                    value={userFullName}
                    onChange={(e) => setUserFullName(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border rounded-lg focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">School Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. name@school.org"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border rounded-lg focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Set Safe Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={userPass}
                    onChange={(e) => setUserPass(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border rounded-lg focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Assigned Role</label>
                    <select
                      value={userRole}
                      onChange={(e) => setUserRole(e.target.value as any)}
                      className="w-full text-xs p-1.5 bg-slate-50 border rounded-lg"
                    >
                      <option value="student">Student Account</option>
                      <option value="teacher">Teacher Account</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">School Branch</label>
                    <select
                      value={userSchoolId}
                      onChange={(e) => setUserSchoolId(e.target.value)}
                      className="w-full text-xs p-1.5 bg-slate-50 border rounded-lg"
                    >
                      <option value="">None (Independent)</option>
                      {schools.map(sch => (
                        <option key={sch.id} value={sch.id}>{sch.school_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-550 text-white font-bold rounded-lg text-xs leading-none transition-all shadow-sm"
                >
                  Register Authorized Member
                </button>
              </form>
            </div>

            {/* Central users inventory manager */}
            <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block pb-2 border-b">Active System Credentials List</span>
              
              <div className="space-y-3.5 max-h-[550px] overflow-y-auto pr-1">
                {users.map(u => {
                  const mappedSchool = schools.find(s => s.id === u.school_id);
                  const isSuspended = u.status === 'suspended';
                  const isEditing = editingUserId === u.id;

                  return (
                    <div 
                      key={u.id}
                      className={`p-3.5 rounded-xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition ${
                        isSuspended ? 'bg-rose-50/40 border-rose-100' : 'bg-slate-50'
                      }`}
                    >
                      {/* Left: Info */}
                      <div className="text-left space-y-0.5 leading-normal min-w-0 w-full">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-sm uppercase tracking-wider ${
                            u.role === 'admin' 
                              ? 'bg-slate-900 text-white' 
                              : u.role === 'teacher' 
                                ? 'bg-sky-100 text-sky-800' 
                                : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {u.role}
                          </span>
                          
                          {isSuspended && (
                            <span className="bg-rose-100 text-rose-800 text-[8px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wide">
                              Suspended
                            </span>
                          )}

                          <span className="text-[10px] text-slate-450 font-mono">Date: {new Date(u.created_at).toLocaleDateString()}</span>
                        </div>

                        {isEditing ? (
                          <div className="space-y-2 mt-2 max-w-md">
                            <input 
                              placeholder="Full Name"
                              className="text-xs p-1 bg-white border rounded w-full border-slate-350"
                              value={editUserFullName}
                              onChange={(e) => setEditUserFullName(e.target.value)}
                            />
                            <input 
                              placeholder="Email Address"
                              className="text-xs p-1 bg-white border rounded w-full border-slate-350"
                              value={editUserEmail}
                              onChange={(e) => setEditUserEmail(e.target.value)}
                            />
                            <select
                              className="text-xs p-1 bg-white border border-slate-350 rounded w-full"
                              value={editUserSchoolId}
                              onChange={(e) => setEditUserSchoolId(e.target.value)}
                            >
                              <option value="">No School Assignment</option>
                              {schools.map(sc => (
                                <option key={sc.id} value={sc.id}>{sc.school_name}</option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <>
                            <h4 className="font-extrabold text-slate-950 text-sm">{u.full_name}</h4>
                            <p className="text-slate-500 text-xs flex items-center gap-1">
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {u.email}
                            </p>
                            <p className="text-[10px] text-slate-400 font-sans">
                              Branch: <span className="font-semibold text-slate-700">{mappedSchool ? mappedSchool.school_name : 'No assigned branch'}</span>
                            </p>
                          </>
                        )}
                      </div>

                      {/* Right Override control parameters */}
                      <div className="flex gap-1 flex-wrap shrink-0 items-center justify-end self-end md:self-auto">
                        
                        {isEditing ? (
                          <button
                            onClick={() => handleSaveUserEdit(u.id)}
                            className="p-1.5 bg-emerald-600 hover:bg-emerald-550 text-white rounded-lg text-xs"
                          >
                            Save
                          </button>
                        ) : (
                          u.role !== 'admin' && (
                            <button
                              onClick={() => handleStartEditing(u)}
                              className="p-1.5 hover:bg-white text-slate-500 rounded border hover:border-slate-300"
                              title="Edit User Data"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )
                        )}

                        {/* Suspend Account toggle button */}
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleToggleSuspend(u.id)}
                            className={`p-1.5 border rounded-lg transition text-xs shrink-0 font-bold ${
                              isSuspended 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                            }`}
                            title={isSuspended ? "Re-activate Account" : "Suspend Account"}
                          >
                            {isSuspended ? 'Lift Suspension' : 'Suspend'}
                          </button>
                        )}

                        {/* Reset password trigger */}
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleResetPassword(u.id)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold border rounded-lg text-xs flex gap-0.5 items-center shrink-0"
                            title="Reset Password Code"
                          >
                            <Key className="w-3 h-3 text-slate-500" />
                            <span>Reset Keys</span>
                          </button>
                        )}

                        {/* Wipe entirely */}
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-1.5 hover:bg-rose-50 text-rose-500 border border-slate-200 hover:border-rose-100 rounded-lg transition shrink-0"
                            title="Purge completely from systems"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* CONTENT MANAGEMENT MODULE / TAB 4: MODERATIONS */}
        {activeTab === 'content' && (
          <div className="space-y-6">
            
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block pb-2 border-b">Consolidated Textbook Moderation Registers</span>
              
              <div className="grid sm:grid-cols-2 gap-4">
                {books.map(b => {
                  const chsCount = db.getChapters().filter(c => c.textbook_id === b.id).length;
                  const uTeacher = users.find(u => u.id === b.uploaded_by);
                  const sSub = subjects.find(s => s.id === b.subject_id);

                  return (
                    <div key={b.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex justify-between gap-4 text-xs font-medium">
                      <div className="space-y-1 text-left">
                        <span className="inline-block bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                          {sSub ? `${sSub.subject_name} (${sSub.grade_level})` : 'General Node'}
                        </span>
                        <h4 className="font-extrabold text-slate-900 text-sm">{b.title}</h4>
                        <p className="text-slate-550 leading-relaxed max-w-sm line-clamp-1">{b.description}</p>
                        <p className="text-[10px] text-slate-400">Chapters: {chsCount} total  • Published By: {uTeacher ? uTeacher.full_name : 'School Admin'}</p>
                      </div>

                      <button
                        onClick={() => handleDeleteTextbookAdmin(b.id)}
                        className="p-2 border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-500 rounded-lg shrink-0 self-start"
                        title="Delete Textbook (Violation Purge)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Micro details resources list */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block pb-2 border-b font-mono">Purge individual Lesson materials sheets (Super-Admin Override)</span>
              
              <div className="space-y-2.5">
                {resources.map(res => {
                  const chObj = db.getChapters().find(c => c.id === res.chapter_id);
                  const bookObj = chObj ? db.getTextbooks().find(b => b.id === chObj.textbook_id) : null;

                  return (
                    <div key={res.id} className="p-3 bg-slate-50 rounded-xl border flex justify-between items-center text-xs">
                      <div className="text-left space-y-0.5 min-w-0">
                        <div className="font-bold text-slate-900 truncate max-w-[420px]">{res.title}</div>
                        <p className="text-[10px] text-slate-500">
                          Resource type: <strong className="capitalize">{res.resource_type}</strong> • Mapped inside: {bookObj ? bookObj.title : 'General'} (Chapter {chObj ? chObj.chapter_number : ''})
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeleteResourceAdmin(res.id)}
                        className="p-1.5 hover:bg-rose-50 border border-slate-250 text-rose-500 rounded transition"
                        title="Purge inappropriate single lesson sheets"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
