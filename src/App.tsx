import { useState, useEffect } from 'react';
import { db } from './dbMock';
import { User } from './types';
import { LandingPage } from './components/LandingPage';
import { StudentDashboard } from './components/StudentDashboard';
import { TeacherDashboard } from './components/TeacherDashboard';
import { AdminDashboard } from './components/AdminDashboard';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize Auth state from stored LocalStorage session on load
  useEffect(() => {
    try {
      const activeUser = db.getCurrentUser();
      if (activeUser) {
        // Double check status in case account was suspended while active
        const allUsers = db.getUsers();
        const freshUser = allUsers.find(u => u.id === activeUser.id);
        if (freshUser && freshUser.status === 'active') {
          setCurrentUser(freshUser);
        } else {
          // Account suspended or deleted
          db.setCurrentUser(null);
          setCurrentUser(null);
        }
      }
    } catch (e) {
      console.error("Failed to read user session, resetting.", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSignInSuccess = (user: User) => {
    db.setCurrentUser(user);
    setCurrentUser(user);
  };

  const handleSignUpSuccess = (studentUser: User) => {
    db.setCurrentUser(studentUser);
    setCurrentUser(studentUser);
  };

  const handleLogout = () => {
    db.setCurrentUser(null);
    setCurrentUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-4 font-sans select-none">
        <div className="w-12 h-12 border-4 border-solid border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <div className="text-center space-y-1">
          <h3 className="text-sm font-bold tracking-wider uppercase font-mono text-emerald-400">SmartQR Digital Core</h3>
          <p className="text-xs text-slate-400">Loading educational workspaces...</p>
        </div>
      </div>
    );
  }

  // CORE ROUTING SELECTOR BY AUTH ROLE
  if (!currentUser) {
    return (
      <LandingPage 
        onSignInSuccess={handleSignInSuccess}
        onSignUpSuccess={handleSignUpSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen">
      {currentUser.role === 'student' && (
        <StudentDashboard 
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      )}

      {currentUser.role === 'teacher' && (
        <TeacherDashboard 
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      )}

      {currentUser.role === 'admin' && (
        <AdminDashboard 
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}
