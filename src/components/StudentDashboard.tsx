import React, { useState, useEffect } from 'react';
import { 
  Search, SlidersHorizontal, BookOpen, Star, Camera, LogOut, 
  History, Bookmark, Globe, ArrowRight, User as UserIcon, HelpCircle, 
  Scan, FilterX, Clock, Moon, Sun, Download, Trash2
} from 'lucide-react';
import { User, Textbook, School, QRCode, ScanLog, Subject } from '../types';
import { db } from '../dbMock';
import { BookDetailModal } from './BookDetailModal';
import { QRCameraScanner } from './QRCameraScanner';
import { QRCodeImage } from './QRCodeImage';

interface StudentDashboardProps {
  currentUser: User;
  onLogout: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  currentUser,
  onLogout,
}) => {
  // DB States
  const [schools, setSchools] = useState<School[]>([]);
  const [books, setBooks] = useState<Textbook[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [scanLogs, setScanLogs] = useState<ScanLog[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  
  // UI filter inputs
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  
  // Interactive UI configurations
  const [showQRCodesGlobally, setShowQRCodesGlobally] = useState<boolean>(true);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  
  // Modal / Overlay States
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [activeBookId, setActiveBookId] = useState<string | null>(null);
  const [activeChId, setActiveChId] = useState<string | undefined>(undefined);
  const [activeResId, setActiveResId] = useState<string | undefined>(undefined);
  
  // Simulated connection states & offline cached entities
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [offlineCache, setOfflineCacheState] = useState<{ bookIds: string[], chapterIds: string[], resourceIds: string[] }>({ bookIds: [], chapterIds: [], resourceIds: [] });
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  // Notification banner
  const [toastMessage, setToastMessage] = useState<string>('');

  // Fetch student state
  useEffect(() => {
    setSchools(db.getSchools());
    setBooks(db.getTextbooks());
    setSubjects(db.getSubjects());
    setFavorites(db.getFavorites(currentUser.id));
    setScanLogs(db.getScanLogs().filter(log => log.student_id === currentUser.id));
    setIsDarkMode(db.getTheme() === 'dark');

    // Populate offline trackers
    setIsOnline(db.getOnlineStatus());
    setOfflineCacheState(db.getOfflineCache(currentUser.id));
    setPendingSyncCount(db.getPendingSyncActions(currentUser.id).length);
  }, [currentUser]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleToggleOnlineStatus = () => {
    const nextStatus = !isOnline;
    setIsOnline(nextStatus);
    db.setOnlineStatus(nextStatus);
    
    if (nextStatus) {
      // Synchronize offline progress data automatically block
      const pending = db.getPendingSyncActions(currentUser.id);
      if (pending.length > 0) {
        let favoriteSyncedCount = 0;
        let progressSyncedCount = 0;
        
        pending.forEach(action => {
          if (action.action_type === 'favorite') {
            const data = action.payload as { target_id: string, is_favorite: boolean };
            let favs = db.getFavorites(currentUser.id);
            if (data.is_favorite) {
              if (!favs.includes(data.target_id)) favs.push(data.target_id);
            } else {
              favs = favs.filter(id => id !== data.target_id);
            }
            db.setFavorites(currentUser.id, favs);
            favoriteSyncedCount++;
          } else if (action.action_type === 'progress') {
            const data = action.payload as { target_type: 'chapter' | 'resource', target_id: string, completed: boolean };
            const progress = db.getStudentProgress(currentUser.id);
            const found = progress.find(p => p.target_type === data.target_type && p.target_id === data.target_id);
            if (found) {
              found.completed = data.completed;
              found.timestamp = new Date().toISOString();
            } else {
              progress.push({
                id: `prog-sync-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                student_id: currentUser.id,
                target_type: data.target_type,
                target_id: data.target_id,
                completed: data.completed,
                timestamp: new Date().toISOString()
              });
            }
            db.setStudentProgress(currentUser.id, progress);
            progressSyncedCount++;
          }
        });
        
        db.clearPendingSyncActions(currentUser.id);
        setPendingSyncCount(0);
        setFavorites(db.getFavorites(currentUser.id));
        setBooks(db.getTextbooks());
        triggerToast(`Network restored! Uploaded ${pending.length} pending operations (${favoriteSyncedCount} book bookmarks, ${progressSyncedCount} ch progress checkpoints) to workspace servers.`);
      } else {
        triggerToast("Device reconnected online. Synchronization verified cleanly!");
      }
    } else {
      triggerToast("Simulated offline disconnect. You can toggle studied topics offline.");
    }
  };

  const handleToggleTheme = () => {
    const nextTheme = isDarkMode ? 'light' : 'dark';
    setIsDarkMode(!isDarkMode);
    db.setTheme(nextTheme);
  };

  // Toggle favorite
  const handleToggleFavorite = (bookId: string) => {
    let updated: string[];
    const isFaved = favorites.includes(bookId);

    if (isFaved) {
      updated = favorites.filter(id => id !== bookId);
      triggerToast("Textbook removed from your personal saves.");
    } else {
      updated = [...favorites, bookId];
      triggerToast("Textbook bookmarked to Favorites bookshelf!");
    }

    if (isOnline) {
      db.setFavorites(currentUser.id, updated);
      setFavorites(updated);
    } else {
      // Queue action offline
      db.addPendingSyncAction(currentUser.id, 'favorite', {
        target_type: 'book',
        target_id: bookId,
        is_favorite: !isFaved,
        timestamp: new Date().toISOString()
      });
      setPendingSyncCount(db.getPendingSyncActions(currentUser.id).length);
      // Still allow UI state updating for nice feel
      setFavorites(updated);
      triggerToast(`Saved book marker queued to sync when internet resumes!`);
    }
  };

  // Triggered on active scan
  const handleQRScanValue = (scannedValue: string) => {
    setIsScannerOpen(false);
    triggerToast(`Scanned Code: "${scannedValue}". Processing resource...`);

    const textbooks = db.getTextbooks();
    const chapters = db.getChapters();
    const resources = db.getResources();

    // Check if the scanned value directly matches a book ID
    const foundBook = textbooks.find(b => b.id === scannedValue);
    if (foundBook) {
      db.logScan(currentUser.id, 'book', foundBook.id);
      setScanLogs(db.getScanLogs().filter(log => log.student_id === currentUser.id));
      setActiveBookId(foundBook.id);
      setActiveChId(undefined);
      setActiveResId(undefined);
      return;
    }

    // Check if it matches a chapter ID
    const foundChapter = chapters.find(c => c.id === scannedValue);
    if (foundChapter) {
      db.logScan(currentUser.id, 'chapter', foundChapter.id);
      setScanLogs(db.getScanLogs().filter(log => log.student_id === currentUser.id));
      setActiveBookId(foundChapter.textbook_id);
      setActiveChId(foundChapter.id);
      setActiveResId(undefined);
      return;
    }

    // Check if it matches a resource ID
    const foundRes = resources.find(r => r.id === scannedValue);
    if (foundRes) {
      // Find parent chapter
      const parentCh = chapters.find(c => c.id === foundRes.chapter_id);
      if (parentCh) {
        db.logScan(currentUser.id, 'resource', foundRes.id);
        setScanLogs(db.getScanLogs().filter(log => log.student_id === currentUser.id));
        setActiveBookId(parentCh.textbook_id);
        setActiveChId(undefined);
        setActiveResId(foundRes.id);
        return;
      }
    }

    // Fallback if not matching any ID structure
    triggerToast(`Invalid SmartQR format! Scanned resource "${scannedValue}" not found in database.`);
  };

  // Filter Logic
  const teachers = db.getUsers().filter(u => u.role === 'teacher');
  const userSchool = schools.find(s => s.id === currentUser.school_id);

  const filteredBooks = books.filter(book => {
    // Search query matching: cover cover parameters, chapters or description
    const q = searchQuery.toLowerCase().trim();
    const matchSearch = !q || 
      book.title.toLowerCase().includes(q) ||
      book.author.toLowerCase().includes(q) ||
      book.description.toLowerCase().includes(q) ||
      subjects.find(s => s.id === book.subject_id)?.subject_name.toLowerCase().includes(q) ||
      subjects.find(s => s.id === book.subject_id)?.grade_level.toLowerCase().includes(q);

    const matchSubject = !selectedSubjectId || book.subject_id === selectedSubjectId;
    const matchGrade = !selectedGrade || subjects.find(s => s.id === book.subject_id)?.grade_level === selectedGrade;
    const matchTeacher = !selectedTeacherId || book.uploaded_by === selectedTeacherId;

    return matchSearch && matchSubject && matchGrade && matchTeacher;
  });

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedSubjectId('');
    setSelectedGrade('');
    setSelectedTeacherId('');
  };

  const handleDownloadOfflineBook = (book: Textbook) => {
    // Generate simulated offline markdown book package
    const chs = db.getChapters().filter(c => c.textbook_id === book.id);
    const content = `# OFFLINE STUDY PACKAGE: ${book.title.toUpperCase()}\nBy ${book.author}\n\n${book.description}\n\n## Table of Chapters:\n${chs.map(c => `- Ch ${c.chapter_number}: ${c.chapter_name}`).join('\n')}\n\nDownloaded via SmartQR platform on ${new Date().toLocaleDateString()}`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${book.title.toLowerCase().replace(/\s+/g, '-')}-offline-compiled.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    triggerToast(`Started download for offline textbook pack: ${book.title}`);
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* Toast Notification popup */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-slate-800 text-white rounded-xl shadow-2xl p-4 max-w-sm flex items-center gap-3 animate-bounce">
          <Clock className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs font-semibold">{toastMessage}</p>
        </div>
      )}

      {/* Header bar */}
      <h2 className="sr-only">Student Workspace Dashboard</h2>
      <header className={`sticky top-0 z-40 border-b transition-colors ${
        isDarkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-rose-100/30'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600 rounded-lg text-white">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white leading-none">
                SmartQR <span className="text-emerald-600">Learning</span>
              </span>
              <span className="block text-[9px] uppercase font-bold text-slate-400 font-mono tracking-widest mt-0.5">
                Student Workspace
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Connectivity status toggle */}
            <button
              onClick={handleToggleOnlineStatus}
              className={`py-1.5 px-3 rounded-lg border text-[11px] font-bold tracking-tight transition flex items-center gap-1.5 ${
                isOnline
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/25 dark:text-emerald-400'
                  : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-400'
              }`}
              title={isOnline ? "Switch to Offline Mode" : "Restore server connection"}
            >
              <Globe className={`w-3.5 h-3.5 ${isOnline ? 'animate-pulse text-emerald-600 dark:text-emerald-400' : 'text-amber-605'}`} />
              <span className="hidden sm:inline">{isOnline ? "Online Status" : "Offline Simulation"}</span>
              <span className="sm:hidden">{isOnline ? "Online" : "Offline"}</span>
              {pendingSyncCount > 0 && (
                <span className="bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full" title="Pending sync operations">
                  {pendingSyncCount}
                </span>
              )}
            </button>

            {/* Dark mode button */}
            <button
              onClick={handleToggleTheme}
              className={`p-2 rounded-lg border transition ${
                isDarkMode 
                  ? 'border-slate-800 hover:bg-slate-800 text-amber-400' 
                  : 'border-slate-200 hover:bg-slate-100 text-slate-500'
              }`}
              title="Toggle screen contrast"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Float Scanner Trigger */}
            <button
              onClick={() => setIsScannerOpen(true)}
              className="py-1.5 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Scan Book QR</span>
            </button>

            {/* User Badge */}
            <div className="hidden md:flex items-center gap-2.5 border-l border-slate-200 pl-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                {currentUser.full_name.charAt(0)}
              </div>
              <div className="text-left leading-none">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-100">{currentUser.full_name}</div>
                <span className="text-[9px] text-slate-400 truncate max-w-[120px] block">{currentUser.email}</span>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="p-2 hover:bg-rose-50 text-rose-600 rounded-lg transition"
              title="Log out of study portal"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Welcome Section Banner */}
        <div className={`p-6 rounded-2xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-linear-to-r from-emerald-500/10 to-emerald-455/5 border-emerald-100'
        }`}>
          <div className="space-y-1">
            <h3 className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white leading-snug">
              Welcome back, {currentUser.full_name}! 👋
            </h3>
            <p className="text-xs text-slate-500 max-w-2xl">
              Connect to your class material. School Association:{' '}
              <strong className="text-emerald-700 dark:text-emerald-400">
                {userSchool ? userSchool.school_name : 'Independent Study Group'}
              </strong>
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setIsScannerOpen(true)}
              className="py-2 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-md"
            >
              <Scan className="w-4 h-4 animate-ping" />
              <span>Launch Camera Scanner</span>
            </button>
          </div>
        </div>

        {/* Dashboard splitting layout */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* SEARCH & TEXTBOOKS CATALOG PANEL (LEFT 8 COLUMNS) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* SEARCH CONTROLS CONTAINER */}
            <div className={`p-4 rounded-2xl border space-y-4 ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/60 shadow-xs'
            }`}>
              {/* Main text query */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Query books instantly by title, author, grade, subject or lesson keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full text-xs pl-10 pr-4 py-3 rounded-xl border focus:outline-hidden focus:ring-1 focus:ring-emerald-500 ${
                    isDarkMode 
                      ? 'bg-slate-950 border-slate-800 placeholder-slate-500 text-slate-100' 
                      : 'bg-slate-50 border-slate-200 placeholder-slate-400'
                  }`}
                />
              </div>

              {/* Advanced multi dropdown selectors filters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1.5">
                {/* Subject filter */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Subject</label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className={`w-full text-xs p-2 rounded-lg border outline-hidden ${
                      isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-350' : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <option value="">All Subjects</option>
                    <option value="sub-math-8">Mathematics Grade 8</option>
                    <option value="sub-math-9">Mathematics Grade 9</option>
                    <option value="sub-sci-7">Science Grade 7</option>
                    <option value="sub-sci-8">Science Grade 8</option>
                    <option value="sub-eng-9">English Grade 9</option>
                    <option value="sub-geo-8">Geography Grade 8</option>
                  </select>
                </div>

                {/* Grade filter */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Grade Level</label>
                  <select
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    className={`w-full text-xs p-2 rounded-lg border outline-hidden ${
                      isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-350' : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <option value="">All Grades</option>
                    <option value="Grade 7">Grade 7</option>
                    <option value="Grade 8">Grade 8</option>
                    <option value="Grade 9">Grade 9</option>
                  </select>
                </div>

                {/* Teacher filter */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Instructor</label>
                  <select
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    className={`w-full text-xs p-2 rounded-lg border outline-hidden ${
                      isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-350' : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <option value="">All Instructors</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.full_name}</option>
                    ))}
                  </select>
                </div>

                {/* Bulk QR code toggle button inside toolbar */}
                <div className="flex flex-col justify-end">
                  <button
                    onClick={() => setShowQRCodesGlobally(prev => !prev)}
                    className={`w-full text-left py-2 px-3 border rounded-lg text-xs font-semibold select-none transition ${
                      showQRCodesGlobally
                        ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="block text-[10px] opacity-60 leading-none">Global Stamp QR</span>
                    <span>{showQRCodesGlobally ? 'Stickers Revealed' : 'Stickers Hidden'}</span>
                  </button>
                </div>
              </div>

              {/* Reset bar */}
              {(searchQuery || selectedSubjectId || selectedGrade || selectedTeacherId) && (
                <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-100 border-dashed">
                  <span className="text-slate-450 italic">Filtering active (showing {filteredBooks.length} results)</span>
                  <button
                    onClick={clearAllFilters}
                    className="flex items-center gap-1 font-bold text-rose-500 hover:text-rose-600 pt-0.5"
                  >
                    <FilterX className="w-3.5 h-3.5" />
                    <span>Clear Search Filters</span>
                  </button>
                </div>
              )}
            </div>

            {/* CATALOG TEXTBOOKS GRID */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Resource Study Shelf</h3>

              {filteredBooks.length === 0 ? (
                <div className={`p-12 text-center rounded-2xl border ${
                  isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/60 shadow-xs'
                }`}>
                  <FilterX className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">No textbook matching your options</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                    Check your text keywords or reset your dropdown parameters to view Hillview school primary books.
                  </p>
                  <button
                    onClick={clearAllFilters}
                    className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Reset Shelf Filters
                  </button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-5">
                  {filteredBooks.map((book) => {
                    const isFaved = favorites.includes(book.id);
                    const isCachedBook = offlineCache.bookIds.includes(book.id);
                    const subject = subjects.find(s => s.id === book.subject_id);
                    const isMath = book.id.includes('math');
                    const uploadTeacher = teachers.find(u => u.id === book.uploaded_by);

                    return (
                      <div 
                        key={book.id}
                        className={`rounded-2xl border overflow-hidden flex flex-col justify-between transition group hover:shadow-md ${
                          isDarkMode 
                            ? 'bg-slate-900 border-slate-800 hover:border-slate-700' 
                            : 'bg-white border-slate-200/60 hover:border-slate-300'
                        }`}
                      >
                        {/* Upper Segment: QR code + Cover display */}
                        <div className="p-4 flex gap-4 overflow-hidden items-start border-b border-slate-100/50 dark:border-slate-850">
                          
                          {/* Book Image */}
                          <div className="relative flex-none">
                            <img 
                              src={book.cover_image} 
                              alt={book.title} 
                              className="w-20 h-28 object-cover rounded-lg shadow-sm border border-slate-150"
                              referrerPolicy="no-referrer"
                            />
                            <button
                              onClick={() => handleToggleFavorite(book.id)}
                              className="absolute -top-1.5 -left-1.5 p-1.5 bg-white/90 dark:bg-slate-950/90 rounded-full border border-slate-200/50 shadow-xs hover:scale-105"
                            >
                              <Star className={`w-3.5 h-3.5 ${isFaved ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
                            </button>
                          </div>

                          {/* Quick details */}
                          <div className="space-y-1 w-full min-w-0">
                            <div className="flex flex-wrap gap-1 items-center">
                              <span className="inline-block bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wide">
                                {subject ? `${subject.subject_name} • ${subject.grade_level}` : 'General Study'}
                              </span>
                              {isCachedBook && (
                                <span className="inline-block bg-emerald-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                                  ✓ Cached
                                </span>
                              )}
                              {!isOnline && !isCachedBook && (
                                <span className="inline-block bg-rose-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                                  🔒 Locked
                                </span>
                              )}
                            </div>
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug truncate group-hover:text-emerald-600 transition">
                              {book.title}
                            </h4>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">By {book.author}</p>
                            <p className="text-[10px] text-slate-400 leading-normal line-clamp-2 pt-1">
                              {book.description}
                            </p>
                          </div>
                        </div>

                        {/* Middle Segment: Toggleable QR Display inside card */}
                        {showQRCodesGlobally && (
                          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 dark:bg-slate-950/40 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="text-center sm:text-left space-y-0.5">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none select-none">Access QR code</span>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">Pasted on physical books</p>
                            </div>
                            <div className="flex-none shadow-xs">
                              <QRCodeImage
                                value={book.id}
                                title={book.title}
                                subtitle="Scan Code"
                                size={120}
                                showActions={true}
                              />
                            </div>
                          </div>
                        )}

                        {/* Action details footer */}
                        <div className="p-3 bg-slate-50/50 dark:bg-slate-900 flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-100/30 gap-1.5">
                          <div className="truncate text-slate-550 mr-2">
                            Owner: <span className="font-medium text-slate-700 dark:text-slate-350">{uploadTeacher ? uploadTeacher.full_name : 'School Admin'}</span>
                          </div>
                          
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleDownloadOfflineBook(book)}
                              className="p-1 px-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 font-semibold rounded-md flex items-center gap-1 transition-all"
                              title="Download full offline Markdown lesson package"
                            >
                              <Download className="w-3 h-3" />
                              <span className="hidden sm:inline">Offline Pack</span>
                            </button>
                            <button
                              onClick={() => {
                                if (!isOnline && !isCachedBook) {
                                  triggerToast("This textbook is currently locked offline. Cache it or toggle Online Status to view chapters.");
                                  return;
                                }
                                db.logScan(currentUser.id, 'book', book.id);
                                setScanLogs(db.getScanLogs().filter(log => log.student_id === currentUser.id));
                                setActiveBookId(book.id);
                                setActiveChId(undefined);
                                setActiveResId(undefined);
                              }}
                              className={`py-1 px-2.5 font-bold rounded-md flex items-center gap-1 transition-all ${
                                !isOnline && !isCachedBook
                                  ? 'bg-slate-200 dark:bg-slate-850 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                              }`}
                            >
                              <span>{!isOnline && !isCachedBook ? "Offline Locked" : "Read Textbook"}</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* SIDEBAR DASHBOARD CONTENT: BOOKMARKS & RECENT SCAN LOGS (RIGHT 4 COLUMNS) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* BOOKMARKS BOX */}
            <div className={`p-4 rounded-2xl border space-y-3.5 ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/60 shadow-xs'
            }`}>
              <div className="flex items-center gap-1.5 text-slate-900 dark:text-white">
                <Bookmark className="w-4 h-4 text-emerald-500" />
                <h3 className="font-bold text-xs uppercase tracking-widest text-slate-400">My Favorites Bookcase</h3>
              </div>

              {favorites.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 bg-slate-50/50 dark:bg-slate-950/30 rounded-xl leading-normal">
                  No textbooks bookmarked yet. Press the Star icon on any textbook card to pin it here for rapid study access!
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[190px] overflow-y-auto pr-1">
                  {favorites.map(bookId => {
                    const bookObj = books.find(b => b.id === bookId);
                    if (!bookObj) return null;
                    return (
                      <div 
                        key={bookId} 
                        className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-850 bg-slate-50/30 hover:border-emerald-300 transition flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <img src={bookObj.cover_image} alt={bookObj.title} className="w-8 h-10 object-cover rounded-sm border" referrerPolicy="no-referrer" />
                          <div className="min-w-0 text-left">
                            <span className="text-[9px] text-emerald-600 font-bold block">SAVED BOOK</span>
                            <div className="text-xs font-bold text-slate-900 dark:text-slate-150 truncate max-w-[140px]">{bookObj.title}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              db.logScan(currentUser.id, 'book', bookObj.id);
                              setScanLogs(db.getScanLogs().filter(log => log.student_id === currentUser.id));
                              setActiveBookId(bookObj.id);
                              setActiveChId(undefined);
                              setActiveResId(undefined);
                            }}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            title="Open in E-reader"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SCAN LOGS REGISTER */}
            <div className={`p-4 rounded-2xl border space-y-3.5 ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/60 shadow-xs'
            }`}>
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-900 dark:text-white">
                  <History className="w-4 h-4 text-slate-500" />
                  <h3 className="font-bold text-xs uppercase tracking-widest text-slate-400">Scan Activity History</h3>
                </div>
                {scanLogs.length > 0 && (
                  <button
                    onClick={() => {
                      db.setScanLogs(db.getScanLogs().filter(log => log.student_id !== currentUser.id));
                      setScanLogs([]);
                      triggerToast("Study history log cleared successfully.");
                    }}
                    className="text-[9px] hover:underline font-bold text-rose-500 flex items-center gap-0.5 leading-none"
                  >
                    <Trash2 className="w-3 h-3" strokeWidth={2.5} /> Clear
                  </button>
                )}
              </div>

              {scanLogs.length === 0 ? (
                <div className="p-5 text-center text-xs text-slate-400 leading-normal bg-slate-50/50 dark:bg-slate-950/30 rounded-xl">
                  🚀 Scan logs are currently empty. Click "Scan Book QR" on top to record your study events.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                  {scanLogs.slice().reverse().map((log) => (
                    <div 
                      key={log.id} 
                      className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/40 text-left border border-slate-100/50 dark:border-slate-850 space-y-1 text-xs"
                    >
                      <div className="flex justify-between items-center text-[9px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                        <span className="text-emerald-600">{log.target_type} CODE DETECTED</span>
                        <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="text-slate-800 dark:text-slate-200 font-bold truncate">
                        {log.target_name}
                      </div>

                      {/* Direct jumpback button */}
                      <div className="flex justify-between items-center pt-1.5 text-[10px] text-slate-400">
                        <span>Code: {log.target_id}</span>
                        <button
                          onClick={() => {
                            // Find parent textbook id
                            if (log.target_type === 'book') {
                              setActiveBookId(log.target_id);
                              setActiveChId(undefined);
                              setActiveResId(undefined);
                            } else if (log.target_type === 'chapter') {
                              const chObj = db.getChapters().find(ch => ch.id === log.target_id);
                              if (chObj) {
                                setActiveBookId(chObj.textbook_id);
                                setActiveChId(chObj.id);
                                setActiveResId(undefined);
                              }
                            } else if (log.target_type === 'resource') {
                              const resObj = db.getResources().find(r => r.id === log.target_id);
                              const chObj = resObj ? db.getChapters().find(ch => ch.id === resObj.chapter_id) : null;
                              if (resObj && chObj) {
                                setActiveBookId(chObj.textbook_id);
                                setActiveChId(undefined);
                                setActiveResId(resObj.id);
                              }
                            }
                          }}
                          className="font-bold text-emerald-600 hover:text-emerald-500 hover:underline inline-flex items-center gap-0.5 leading-none"
                        >
                          Fast Re-open ➔
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200/50 dark:border-slate-800/80 mt-16 py-8 text-center text-xs text-slate-400 font-medium">
        <p>SmartQR Learning Access • Designed for rural districts lacking textbook volumes.</p>
        <p className="text-[10px] text-slate-500 font-mono mt-1">Cooperative Workspace Client • 100% Client Managed State System</p>
      </footer>

      {/* Interactive Camera Overlay Modal */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md">
            <QRCameraScanner 
              onScanSuccess={handleQRScanValue}
              onClose={() => setIsScannerOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Detailed E-Reader Booklet View Model */}
      {activeBookId && (
        <BookDetailModal
          bookId={activeBookId}
          initialChapterId={activeChId}
          initialResourceId={activeResId}
          currentUserId={currentUser.id}
          onClose={() => {
            setActiveBookId(null);
            setActiveChId(undefined);
            setActiveResId(undefined);
            // Dynamic refresh of local device cache & favorite books list:
            setOfflineCacheState(db.getOfflineCache(currentUser.id));
            setFavorites(db.getFavorites(currentUser.id));
            setPendingSyncCount(db.getPendingSyncActions(currentUser.id).length);
          }}
          onFavoriteChange={() => {
            setFavorites(db.getFavorites(currentUser.id));
          }}
        />
      )}

    </div>
  );
};
