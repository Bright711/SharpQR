import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Plus, FileText, Image as ImageIcon, BarChart3, Scan, 
  Trash2, Edit, Save, LogOut, Settings, Users, ArrowUpRight, 
  Calendar, Check, AlertCircle, FileSpreadsheet, Printer, Download, Eye
} from 'lucide-react';
import { User, Textbook, Chapter, LearningResource, QRCode, ScanLog, Subject, School } from '../types';
import { db } from '../dbMock';
import { QRCodeImage } from './QRCodeImage';
import { BookDetailModal } from './BookDetailModal';

interface TeacherDashboardProps {
  currentUser: User;
  onLogout: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  currentUser,
  onLogout,
}) => {
  // DB query States
  const [schools, setSchools] = useState<School[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [myBooks, setMyBooks] = useState<Textbook[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [qrs, setQrs] = useState<QRCode[]>([]);
  const [myScanLogs, setMyScanLogs] = useState<ScanLog[]>([]);

  // Selection states (for hierarchical navigation)
  const [selectedBook, setSelectedBook] = useState<Textbook | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);

  // Form states - NEW BOOK
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookDesc, setBookDesc] = useState('');
  const [bookSubjectId, setBookSubjectId] = useState('');
  const [bookCover, setBookCover] = useState('');
  const [bookError, setBookError] = useState('');

  // Form states - NEW CHAPTER
  const [isAddingChapter, setIsAddingChapter] = useState(false);
  const [chapterNum, setChapterNum] = useState<number>(1);
  const [chapterName, setChapterName] = useState('');
  const [chapterDesc, setChapterDesc] = useState('');
  const [chapterError, setChapterError] = useState('');

  // Form states - NEW RESOURCE
  const [isAddingResource, setIsAddingResource] = useState(false);
  const [resTitle, setResTitle] = useState('');
  const [resType, setResType] = useState<'pdf' | 'notes' | 'image' | 'link'>('pdf');
  const [resText, setResText] = useState('');
  const [resDownloadable, setResDownloadable] = useState(true);
  const [resError, setResError] = useState('');

  // Edit states (Generic inline editing)
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingDesc, setEditingDesc] = useState('');

  // Reader testing state
  const [testingBookId, setTestingBookId] = useState<string | null>(null);

  // Toast Notification State
  const [toast, setToast] = useState('');

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  useEffect(() => {
    loadDatabase();
  }, [currentUser]);

  const loadDatabase = () => {
    const allSchools = db.getSchools();
    const allSubjects = db.getSubjects();
    const allBooks = db.getTextbooks();
    const allChapters = db.getChapters();
    const allResources = db.getResources();
    const allQrs = db.getQRCodes();
    const allLogs = db.getScanLogs();

    setSchools(allSchools);
    setSubjects(allSubjects);
    setQrs(allQrs);

    // Filter books belonging to THIS teacher only
    const teacherBooks = allBooks.filter(b => b.uploaded_by === currentUser.id);
    setMyBooks(teacherBooks);

    // Filter chapters and learning resources connected to this teacher's books
    const bookIds = teacherBooks.map(b => b.id);
    const teacherChapters = allChapters.filter(c => bookIds.includes(c.textbook_id));
    setChapters(teacherChapters);

    const chapterIds = teacherChapters.map(c => c.id);
    setResources(allResources.filter(r => chapterIds.includes(r.chapter_id)));

    // Scan activity filtering
    const teacherLogs = allLogs.filter(log => {
      if (log.target_type === 'book') {
        return bookIds.includes(log.target_id);
      } else if (log.target_type === 'chapter') {
        const ch = allChapters.find(c => c.id === log.target_id);
        return ch && bookIds.includes(ch.textbook_id);
      } else if (log.target_type === 'resource') {
        const res = allResources.find(r => r.id === log.target_id);
        const ch = res ? allChapters.find(c => c.id === res.chapter_id) : null;
        return ch && bookIds.includes(ch.textbook_id);
      }
      return false;
    });
    setMyScanLogs(teacherLogs);

    // Maintain stable UI selection if deleted
    if (selectedBook) {
      const stillExists = teacherBooks.find(b => b.id === selectedBook.id);
      setSelectedBook(stillExists || null);
    }
    if (selectedChapter) {
      const stillExists = teacherChapters.find(c => c.id === selectedChapter.id);
      setSelectedChapter(stillExists || null);
    }
  };

  // COVER RANDOM IMAGE POPULATOR
  const fillRandomCover = () => {
    const urls = [
      "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&q=80&w=400"
    ];
    setBookCover(urls[Math.floor(Math.random() * urls.length)]);
  };

  // CREATE ACTIONS
  const handleCreateBook = (e: React.FormEvent) => {
    e.preventDefault();
    setBookError('');

    if (!bookTitle.trim() || !bookAuthor.trim() || !bookSubjectId) {
      setBookError('Please supply textbook title, author list, and subject topic.');
      return;
    }

    const newBookId = `book-t-${Date.now()}`;
    const newBookObj = {
      id: newBookId,
      title: bookTitle,
      author: bookAuthor,
      description: bookDesc || 'Custom class curriculum designed by district instructor.',
      subject_id: bookSubjectId,
      cover_image: bookCover || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400",
      uploaded_by: currentUser.id,
      date_added: new Date().toISOString()
    };

    db.createTextbook(newBookObj);
    triggerToast(`Textbook "${bookTitle}" successfully created. Unique QR generated.`);
    
    // reset form
    setBookTitle('');
    setBookAuthor('');
    setBookDesc('');
    setBookCover('');
    setBookSubjectId('');
    setIsAddingBook(false);
    loadDatabase();
  };

  const handleCreateChapter = (e: React.FormEvent) => {
    e.preventDefault();
    setChapterError('');

    if (!selectedBook) return;
    if (!chapterName.trim()) {
      setChapterError('Please choose a valid Chapter title.');
      return;
    }

    const newChId = `ch-t-${Date.now()}`;
    const newChObj = {
      id: newChId,
      textbook_id: selectedBook.id,
      chapter_number: Number(chapterNum),
      chapter_name: chapterName,
      description: chapterDesc
    };

    db.createChapter(newChObj);
    triggerToast(`Chapter ${chapterNum} successfully appended. Dynamic QR created.`);

    setChapterName('');
    setChapterDesc('');
    setChapterNum(prev => prev + 1);
    setIsAddingChapter(false);
    loadDatabase();
  };

  const handleCreateResource = (e: React.FormEvent) => {
    e.preventDefault();
    setResError('');

    if (!selectedChapter) return;
    if (!resTitle.trim() || !resText.trim()) {
      setResError('Please supply lesson title and transcribe core page notes.');
      return;
    }

    const newResId = `res-t-${Date.now()}`;
    const newResObj = {
      id: newResId,
      chapter_id: selectedChapter.id,
      title: resTitle,
      file_url: `https://smartqr.school.org/materials/generated_${newResId}.md`,
      resource_type: resType,
      content_text: resText,
      is_downloadable: resDownloadable
    };

    db.createResource(newResObj);
    triggerToast(`Lesson material successfully bound. QR Code is online.`);

    setResTitle('');
    setResText('');
    setResDownloadable(true);
    setIsAddingResource(false);
    loadDatabase();
  };

  // EDIT ACTIONS
  const handleStartEditingBook = (b: Textbook) => {
    setEditingBookId(b.id);
    setEditingTitle(b.title);
    setEditingDesc(b.description);
  };

  const handleSaveBookEdit = (bookId: string) => {
    const all = db.getTextbooks();
    const idx = all.findIndex(b => b.id === bookId);
    if (idx !== -1) {
      all[idx].title = editingTitle;
      all[idx].description = editingDesc;
      db.setTextbooks(all);
      triggerToast("Textbook overview revised successfully.");
      setEditingBookId(null);
      loadDatabase();
    }
  };

  // DELETE ACTIONS
  const handleDeleteBook = (bookId: string) => {
    if (!confirm("Are you sure you want to delete this textbook? This will permanently delete all related chapters, digital resources, and auto-generated QR codes.")) return;
    
    const allBooks = db.getTextbooks().filter(b => b.id !== bookId);
    db.setTextbooks(allBooks);

    // cascades
    const connectedChs = db.getChapters().filter(c => c.textbook_id === bookId);
    const chIds = connectedChs.map(c => c.id);
    
    db.setChapters(db.getChapters().filter(c => c.textbook_id !== bookId));
    db.setResources(db.getResources().filter(r => !chIds.includes(r.chapter_id)));
    db.setQRCodes(db.getQRCodes().filter(q => q.target_id !== bookId && !chIds.includes(q.target_id)));

    triggerToast("Textbook deleted successfully from physical registers.");
    loadDatabase();
  };

  const handleDeleteChapter = (chId: string) => {
    if (!confirm("Are you sure you want to delete this chapter? Connecting resources will undergo cascade removal.")) return;
    
    db.setChapters(db.getChapters().filter(c => c.id !== chId));
    db.setResources(db.getResources().filter(r => r.chapter_id !== chId));
    db.setQRCodes(db.getQRCodes().filter(q => q.target_id !== chId));

    triggerToast("Selected chapter scrubbed.");
    if (selectedChapter?.id === chId) {
      setSelectedChapter(null);
    }
    loadDatabase();
  };

  const handleDeleteResource = (resId: string) => {
    if (!confirm("Remove this lesson file from the digital index?")) return;
    db.setResources(db.getResources().filter(r => r.id !== resId));
    db.setQRCodes(db.getQRCodes().filter(q => q.target_id !== resId));
    triggerToast("Lesson asset scrubbed.");
    loadDatabase();
  };

  // CALCULATE ANALYTICS COMPILATIONS FOR STATS
  const totalScans = myScanLogs.length;
  const topBookId = myBooks.reduce((max, current) => {
    const maxCount = myScanLogs.filter(l => l.target_id === max).length;
    const currentCount = myScanLogs.filter(l => l.target_id === current.id).length;
    return currentCount > maxCount ? current.id : max;
  }, myBooks[0]?.id || null);
  const topBookName = myBooks.find(b => b.id === topBookId)?.title || "No Scans Recorded";

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-800">
      
      {/* Toast Alert Banner */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-slate-800 text-white rounded-xl shadow-xl p-4 max-w-sm flex items-center gap-3 animate-bounce">
          <Check className="w-5 h-5 text-emerald-400 shrink-0 select-none" />
          <p className="text-xs font-semibold">{toast}</p>
        </div>
      )}

      {/* Header bar */}
      <h2 className="sr-only">Teacher Workspace</h2>
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-850 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 rounded-lg text-white">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-white text-sm sm:text-base leading-none">
                SmartQR <span className="text-emerald-400">Classroom</span>
              </span>
              <span className="block text-[9px] uppercase font-bold text-slate-400 font-mono tracking-widest mt-0.5">
                Instructor Console
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 border-r border-slate-800 pr-3">
              <div className="w-8 h-8 rounded-full bg-slate-800 text-emerald-400 flex items-center justify-center font-bold text-xs">
                T
              </div>
              <div className="text-left leading-none">
                <div className="text-xs font-bold text-slate-100">{currentUser.full_name}</div>
                <div className="text-[9px] text-slate-400">Instructor Account</div>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 hover:text-rose-400 text-slate-350 font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* UPPER KPI CARDS PANEL */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200/65 shadow-xs flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg flex-none select-none">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">My Textbooks</div>
              <h3 className="font-extrabold text-lg text-slate-900 leading-none mt-1">{myBooks.length} Books</h3>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-slate-200/65 shadow-xs flex items-center gap-3">
            <div className="p-2.5 bg-sky-50 text-sky-600 rounded-lg flex-none select-none">
              <Plus className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">My Chapters</div>
              <h3 className="font-extrabold text-lg text-slate-900 leading-none mt-1">{chapters.length} Units</h3>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/65 shadow-xs flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg flex-none select-none">
              <Scan className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">CUMULATIVE SCANS</div>
              <h3 className="font-extrabold text-lg text-slate-900 leading-none mt-1">{totalScans} Hits</h3>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/65 shadow-xs flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg flex-none select-none">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider select-none">MOST POPULAR</div>
              <h3 className="font-bold text-xs text-slate-700 leading-snug truncate mt-1 max-w-[150px]">{topBookName}</h3>
            </div>
          </div>
        </div>

        {/* WORKSPACE OPERATIONS GRID split panels */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* COLUMN 1: NEW BOOK BUILDER & BOOK INVENTORY (8 COLUMNS) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Header + Add Button */}
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-sm">Class Textbook Curriculum</h3>
                <p className="text-xs text-slate-500">Create digital books and chapters instantly mapped to physical bar codes.</p>
              </div>
              <button
                onClick={() => setIsAddingBook(prev => !prev)}
                className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Publish Book</span>
              </button>
            </div>

            {/* ADD BOOK EXPANSION FORM */}
            {isAddingBook && (
              <form onSubmit={handleCreateBook} className="bg-white p-6 rounded-2xl border border-emerald-200 space-y-4 shadow-sm animate-fadeIn">
                <div className="border-b border-slate-100 pb-2">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Aesthetic Textbook Designer</h4>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Textbook Title</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Practical Physics Essentials"
                      value={bookTitle}
                      onChange={(e) => setBookTitle(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-hidden focus:bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Co-Authors / Publisher</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Dr. Vance, Prof. Alan"
                      value={bookAuthor}
                      onChange={(e) => setBookAuthor(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-hidden focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Subject Node Mapping</label>
                    <select
                      value={bookSubjectId}
                      onChange={(e) => setBookSubjectId(e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-hidden"
                    >
                      <option value="">-- Choose Subject Map --</option>
                      {subjects.map(sub => (
                        <option key={sub.id} value={sub.id}>{sub.subject_name} ({sub.grade_level})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Cover Image Link</label>
                      <button 
                        type="button" 
                        onClick={fillRandomCover}
                        className="text-[10px] font-bold text-emerald-600 hover:text-emerald-500 hover:underline leading-none"
                      >
                        🎲 Pop Random Image
                      </button>
                    </div>
                    <input 
                      type="url" 
                      placeholder="https://..."
                      value={bookCover}
                      onChange={(e) => setBookCover(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-hidden focus:bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Textbook Description (Introduction for students)</label>
                  <textarea 
                    rows={2.5}
                    placeholder="Provide overview guidelines and instruction advice for studying this book material..."
                    value={bookDesc}
                    onChange={(e) => setBookDesc(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-hidden focus:bg-white"
                  />
                </div>

                {bookCover && (
                  <div className="flex gap-2.5 items-center p-3.5 bg-slate-550/10 rounded-xl border border-slate-150">
                    <img src={bookCover} className="w-10 h-14 object-cover rounded-md shadow-xs border" referrerPolicy="no-referrer" />
                    <div>
                      <span className="text-[10px] text-emerald-700 font-bold uppercase block">Cover Preview Selected</span>
                      <span className="text-[9px] text-slate-400 font-mono text-xs block truncate max-w-[420px]">{bookCover}</span>
                    </div>
                  </div>
                )}

                {bookError && (
                  <p className="text-xs text-rose-500 font-medium">{bookError}</p>
                )}

                <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setIsAddingBook(false)}
                    className="py-1.5 px-3 border border-slate-250 text-slate-500 text-xs font-semibold rounded-lg hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="py-1.5 px-4 bg-emerald-600 text-white hover:bg-emerald-550 text-xs font-bold rounded-lg transition"
                  >
                    Generate Book & Autocheck Code
                  </button>
                </div>
              </form>
            )}

            {/* MY BOOK LIST (EXPANDABLE DETAILS DIRECT INDEX HIERARCHY) */}
            <div className="space-y-4">
              {myBooks.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-white border border-slate-200/60 shadow-xs space-y-3.5">
                  <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="font-semibold text-slate-700 text-sm">No textbooks published yet</p>
                  <p className="text-xs text-slate-405 max-w-sm mx-auto leading-relaxed">
                    Click the "Publish Book" button above to build class textbook outlines and generate unique stickers.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myBooks.map((book) => {
                    const isSelected = selectedBook?.id === book.id;
                    const bookChs = chapters.filter(c => c.textbook_id === book.id);
                    const bookSubject = subjects.find(s => s.id === book.subject_id);

                    return (
                      <div 
                        key={book.id}
                        className={`rounded-2xl border transition ${
                          isSelected 
                            ? 'border-emerald-500 bg-emerald-50/10' 
                            : 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'
                        }`}
                      >
                        {/* Summary Header of Book card */}
                        <div className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100/60">
                          
                          <div className="flex gap-4">
                            <img src={book.cover_image} className="w-12 h-16 object-cover rounded shadow-md" referrerPolicy="no-referrer" />
                            <div className="text-left space-y-0.5">
                              <span className="inline-block bg-slate-100 dark:bg-slate-800 text-[9px] font-bold px-2 py-0.5 rounded text-slate-650">
                                {bookSubject ? `${bookSubject.subject_name} • ${bookSubject.grade_level}` : 'General Target'}
                              </span>
                              
                              {editingBookId === book.id ? (
                                <div className="space-y-1.5 mt-1">
                                  <input 
                                    className="text-xs font-bold p-1 border rounded w-full border-slate-300 focus:bg-white bg-slate-50"
                                    value={editingTitle}
                                    onChange={(e) => setEditingTitle(e.target.value)}
                                  />
                                  <input 
                                    className="text-[11px] p-1 border rounded w-full border-slate-300 focus:bg-white bg-slate-50"
                                    value={editingDesc}
                                    onChange={(e) => setEditingDesc(e.target.value)}
                                  />
                                </div>
                              ) : (
                                <>
                                  <h4 className="font-bold text-slate-900 text-sm">{book.title}</h4>
                                  <p className="text-xs text-slate-500 leading-normal line-clamp-1">{book.description}</p>
                                  <p className="text-[10px] text-slate-400">Published: {new Date(book.date_added).toLocaleDateString()}</p>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Quick controls on card head */}
                          <div className="flex gap-1.5 self-end sm:self-auto flex-wrap">
                            {editingBookId === book.id ? (
                              <button
                                onClick={() => handleSaveBookEdit(book.id)}
                                className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg text-[11px] font-semibold transition"
                              >
                                <Save className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStartEditingBook(book)}
                                className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg text-xs"
                                title="Edit Textbook Details"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setSelectedBook(book);
                                // Set first chapter automatically as well if exists
                                const list = chapters.filter(c => c.textbook_id === book.id);
                                if (list.length > 0) {
                                  setSelectedChapter(list[0]);
                                } else {
                                  setSelectedChapter(null);
                                }
                              }}
                              className={`py-1.5 px-3 rounded-lg text-xs font-semibold select-none flex items-center gap-1 transition ${
                                isSelected 
                                  ? 'bg-emerald-600 text-white shadow-sm' 
                                  : 'bg-slate-100 border border-slate-200 hover:bg-slate-205 text-slate-705'
                              }`}
                            >
                              <span>Chapters Index</span>
                              <span className="bg-slate-200 text-slate-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full select-none leading-none">
                                {bookChs.length}
                              </span>
                            </button>

                            <button
                              onClick={() => setTestingBookId(book.id)}
                              className="py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold flex items-center gap-1"
                              title="Test drive as student"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Preview Book</span>
                            </button>

                            <button
                              onClick={() => handleDeleteBook(book.id)}
                              className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition"
                              title="Scrub Textbook permanently"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Expandable chapter sub-dashboard if active */}
                        {isSelected && (
                          <div className="p-4 sm:p-5 bg-slate-50/50 space-y-5">
                            
                            {/* Inner Header Row */}
                            <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Chapters mapped to {book.title}</span>
                              <button
                                onClick={() => setIsAddingChapter(prev => !prev)}
                                className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-505 text-white text-[10px] font-bold rounded-md flex items-center gap-0.5"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add Chapter Node</span>
                              </button>
                            </div>

                            {/* ADD NEW CHAPTER BLOCK FORM */}
                            {isAddingChapter && (
                              <form onSubmit={handleCreateChapter} className="bg-white p-4 rounded-xl border border-emerald-200 space-y-3 shadow-xs">
                                <span className="text-[10px] font-bold text-slate-650 uppercase block">Chapter Node Config</span>
                                <div className="grid sm:grid-cols-12 gap-3">
                                  <div className="sm:col-span-3 space-y-1">
                                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Chapter Number</label>
                                    <input 
                                      type="number" 
                                      required
                                      value={chapterNum}
                                      onChange={(e) => setChapterNum(Number(e.target.value))}
                                      className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border rounded-lg focus:bg-white"
                                    />
                                  </div>
                                  <div className="sm:col-span-9 space-y-1">
                                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Chapter Topic Name</label>
                                    <input 
                                      type="text" 
                                      required
                                      placeholder="e.g. Molecular Mechanics and Cellular Chemistry"
                                      value={chapterName}
                                      onChange={(e) => setChapterName(e.target.value)}
                                      className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border rounded-lg focus:bg-white"
                                    />
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Brief details</label>
                                  <input 
                                    type="text" 
                                    placeholder="e.g. Overview of water transport networks, active diffusion mechanisms..."
                                    value={chapterDesc}
                                    onChange={(e) => setChapterDesc(e.target.value)}
                                    className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border rounded-lg focus:bg-white"
                                  />
                                </div>

                                {chapterError && (
                                  <p className="text-xs text-rose-500 font-medium">{chapterError}</p>
                                )}

                                <div className="flex justify-end gap-2 pt-2 border-t text-xs">
                                  <button 
                                    type="button" 
                                    onClick={() => setIsAddingChapter(false)}
                                    className="px-2.5 py-1 border rounded text-slate-500 hover:bg-slate-50 font-semibold"
                                  >
                                    Cancel
                                  </button>
                                  <button 
                                    type="submit" 
                                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded"
                                  >
                                    Build Unit Index
                                  </button>
                                </div>
                              </form>
                            )}

                            {/* CHAPTERS VERTICAL INDEX */}
                            {bookChs.length === 0 ? (
                              <div className="p-8 text-center text-xs text-slate-400 bg-white border border-dashed rounded-xl leading-normal">
                                This textbook has no units mapped. Tap "Add Chapter Node" to establish your class syllabus layout.
                              </div>
                            ) : (
                              <div className="space-y-3.5">
                                {bookChs.map(ch => {
                                  const isChSelected = selectedChapter?.id === ch.id;
                                  const chResources = resources.filter(r => r.chapter_id === ch.id);

                                  return (
                                    <div 
                                      key={ch.id}
                                      className={`p-3.5 rounded-xl border transition ${
                                        isChSelected 
                                          ? 'bg-white border-emerald-450 shadow-sm' 
                                          : 'bg-white border-slate-150 hover:border-slate-205'
                                      }`}
                                    >
                                      {/* Chapter meta toolbar */}
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                                        
                                        <div className="text-left space-y-0.5">
                                          <div className="flex items-center gap-1.5">
                                            <span className="font-bold text-[10px] text-emerald-700 bg-emerald-50 px-1.5 rounded-sm">
                                              UNIT {ch.chapter_number}
                                            </span>
                                            {isChSelected && <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse select-none" />}
                                          </div>
                                          <h5 className="font-bold text-slate-800 text-xs">{ch.chapter_name}</h5>
                                          {ch.description && <p className="text-[10px] text-slate-400 font-medium">{ch.description}</p>}
                                        </div>

                                        {/* Chapter Buttons */}
                                        <div className="flex gap-1.5 self-end sm:self-auto items-center">
                                          <button
                                            onClick={() => {
                                              setSelectedChapter(ch);
                                              setIsAddingResource(true);
                                            }}
                                            className="px-2 py-1 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-md text-[10px] font-bold"
                                          >
                                            + Lesson Material
                                          </button>
                                          
                                          <button
                                            onClick={() => setSelectedChapter(isChSelected ? null : ch)}
                                            className={`px-2 py-1 rounded-md text-[10px] font-bold transition select-none ${
                                              isChSelected 
                                                ? 'bg-slate-900 text-white' 
                                                : 'bg-slate-50 border border-slate-150 text-slate-600 hover:bg-slate-100'
                                            }`}
                                          >
                                            {isChSelected ? 'Hide QR Code Labels' : 'Reveal QR & Materials'}
                                          </button>

                                          <button
                                            onClick={() => handleDeleteChapter(ch.id)}
                                            className="p-1 hover:bg-rose-50 text-rose-500 rounded"
                                            title="Delete Chapter"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>

                                      {/* Expanded lesson materials and specific QR STICKERS */}
                                      {isChSelected && (
                                        <div className="grid md:grid-cols-12 gap-5 pt-3.5 items-start">
                                          
                                          {/* QR STICKER BOX FOR THIS CHAPTER (CHAPTER LEVEL TARGET) */}
                                          <div className="md:col-span-4 rounded-xl border border-dashed border-emerald-250 bg-emerald-50/5 p-3 flex flex-col items-center justify-center text-center">
                                            <span className="text-[9px] font-bold text-emerald-800 tracking-wider uppercase flex items-center gap-1 select-none">
                                              <Scan className="w-3 h-3" /> Unit sticker QR
                                            </span>
                                            <p className="text-[8px] text-slate-400 mb-2 max-w-[130px] leading-tight select-none">
                                              Pasting this sticker takes logged-in students directly here.
                                            </p>
                                            <QRCodeImage
                                              value={ch.id}
                                              title={`${book.title} - Ch ${ch.chapter_number}`}
                                              subtitle="Chapter Sticky code"
                                              size={120}
                                              showActions={true}
                                            />
                                          </div>

                                          {/* LESSON RESOURCES CRUD */}
                                          <div className="md:col-span-8 space-y-3">
                                            
                                            {/* ADD MATERIAL SECTION SUB-FORM */}
                                            {isAddingResource && (
                                              <form onSubmit={handleCreateResource} className="bg-slate-50 p-3.5 rounded-xl border space-y-3 text-xs">
                                                <div className="flex justify-between items-center">
                                                  <span className="font-bold text-[10px] text-slate-700">AQUIRE DIGITAL RESOURCE</span>
                                                  <button type="button" onClick={() => setIsAddingResource(false)} className="text-[10px] text-rose-500 hover:underline">Cancel</button>
                                                </div>

                                                <div className="grid sm:grid-cols-2 gap-3">
                                                  <div className="space-y-1">
                                                    <label className="text-[9px] font-bold text-slate-500 uppercase block">Material Title</label>
                                                    <input 
                                                      type="text" 
                                                      required
                                                      placeholder="e.g. Formula Sheet / Reading Text..."
                                                      value={resTitle}
                                                      onChange={(e) => setResTitle(e.target.value)}
                                                      className="w-full text-xs p-1.5 bg-white border rounded"
                                                    />
                                                  </div>
                                                  <div className="space-y-1">
                                                    <label className="text-[9px] font-bold text-slate-500 uppercase block">Media Type</label>
                                                    <select
                                                      value={resType}
                                                      onChange={(e) => setResType(e.target.value as any)}
                                                      className="w-full text-xs p-1.5 bg-white border rounded"
                                                    >
                                                      <option value="pdf">PDF File Transcript</option>
                                                      <option value="notes">Class Written Notes</option>
                                                      <option value="image">Diagram Illustration</option>
                                                    </select>
                                                  </div>
                                                </div>

                                                <div className="space-y-1">
                                                  <label className="text-[9px] font-bold text-slate-500 uppercase block leading-none">Resource Text Body (Markdown compatible)</label>
                                                  <textarea 
                                                    rows={3} 
                                                    required
                                                    placeholder="Transcribe core educational curriculum notes or formulas directly here so students scan and read instantly offline without heavy PDF wait-loading..."
                                                    value={resText}
                                                    onChange={(e) => setResText(e.target.value)}
                                                    className="w-full text-xs p-1.5 bg-white border rounded"
                                                  />
                                                </div>

                                                <div className="flex items-center gap-1.5">
                                                  <input 
                                                    type="checkbox" 
                                                    id="download_allow"
                                                    checked={resDownloadable}
                                                    onChange={(e) => setResDownloadable(e.target.checked)}
                                                    className="rounded border border-slate-300"
                                                  />
                                                  <label htmlFor="download_allow" className="text-[10px] font-semibold text-slate-650">Allow students to save/download file offline</label>
                                                </div>

                                                {resError && (
                                                  <p className="text-[10px] text-rose-500">{resError}</p>
                                                )}

                                                <button 
                                                  type="submit"
                                                  className="w-full py-1.5 bg-slate-900 border border-slate-800 text-white font-bold rounded hover:bg-slate-800 transition text-[10px]"
                                                >
                                                  Commit Lesson Material
                                                </button>
                                              </form>
                                            )}

                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block select-none">Assigned Lesson Materials</span>
                                            
                                            {chResources.length === 0 ? (
                                              <p className="text-[10px] text-slate-450 italic py-2">
                                                No digital documents mapped to this chapter page index.
                                              </p>
                                            ) : (
                                              <div className="space-y-2">
                                                {chResources.map(res => (
                                                  <div 
                                                    key={res.id}
                                                    className="p-2.5 rounded-lg border border-slate-100 bg-linear-to-r from-slate-50 to-white flex items-center justify-between gap-3 text-[11px]"
                                                  >
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                      <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                                                      <div className="min-w-0">
                                                        <div className="font-bold text-slate-800 truncate">{res.title}</div>
                                                        <div className="text-[9px] text-slate-450 capitalize flex items-center gap-1.5">
                                                          <span>Type: {res.resource_type}</span>
                                                          <span>•</span>
                                                          <span>Download: {res.is_downloadable ? 'Enabled' : 'Disabled'}</span>
                                                        </div>
                                                      </div>
                                                    </div>

                                                    <div className="flex items-center gap-1 shrink-0">
                                                      {/* Mini QR trigger for specifically this resource */}
                                                      <button
                                                        onClick={() => {
                                                          const content = `Target Resource QR Code: ${res.id}\nPoint student cameras here to access directly.`;
                                                          const printWindow = window.open('', '_blank');
                                                          if (printWindow) {
                                                            printWindow.document.write(`
                                                              <html>
                                                                <head><title>Lesson QR Sticker</title></head>
                                                                <body style="font-family:sans-serif; text-align:center; padding:100px;">
                                                                  <h2>SmartQR Stick-on Lesson Label</h2>
                                                                  <p>${res.title} (Chapter ${ch.chapter_number})</p>
                                                                  <div style="margin:20px auto; width:120px;" id="qr-target"></div>
                                                                  <div style="font-size:11px; color:#aaa; font-family:monospace;">STATIONARY STICKER INDEX: ${res.id}</div>
                                                                  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js"></script>
                                                                  <script>
                                                                    var qr = qrcode(0, 'M');
                                                                    qr.addData('${res.id}');
                                                                    qr.make();
                                                                    document.getElementById('qr-target').innerHTML = qr.createImgTag(5);
                                                                    window.onload = function() { window.print(); }
                                                                  </script>
                                                                </body>
                                                              </html>
                                                            `);
                                                            printWindow.document.close();
                                                          }
                                                        }}
                                                        className="p-1 hover:bg-slate-200 text-slate-500 rounded"
                                                        title="Print Single QR Label"
                                                      >
                                                        <Printer className="w-3.5 h-3.5" />
                                                      </button>

                                                      <button
                                                        onClick={() => handleDeleteResource(res.id)}
                                                        className="p-1 hover:bg-rose-50 text-rose-500 rounded transition"
                                                        title="Delete lesson resource"
                                                      >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                      </button>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            )}

                                          </div>

                                        </div>
                                      )}

                                    </div>
                                  );
                                })}
                              </div>
                            )}

                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* COLUMN 2: STUDENT SCANS LOGGER & MONITORS (RIGHT 4 COLUMNS) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* INSTRUCTOR KPIS / INSTRUCTIONS */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block pb-1 border-b">Sticker pasting guidelines</span>
              <p className="text-xs text-slate-500 leading-relaxed">
                🚀 To deploy this system: export generated QR codes either as PNG or PDF/Print. Tape them to physical classroom book covers or inside index lesson spreadsheets so students can scan and read online easily.
              </p>
              <div className="p-3.5 rounded-xl bg-slate-50 text-[11px] text-slate-500 space-y-1">
                <span className="font-bold text-slate-700 block select-none">💡 Engagement Trick</span>
                <span>Pasting small QR codes directly beside homework tasks lets children scan with mobile phones and review sample formulas at home instantly.</span>
              </div>
            </div>

            {/* LIVE SCAN LOG MONITOR */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
              <div className="pb-1.5 border-b flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-800">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-xs uppercase tracking-widest text-slate-400">Class Usage Monitor</h3>
                </div>
                <span className="text-[10px] text-slate-400 font-mono font-bold leading-none select-none uppercase">Real-time stats</span>
              </div>

              {myScanLogs.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl">
                  Waiting for classroom triggers. When students scan your assigned stickers, activity audits will display here.
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {/* Progress bar metrics for published teacher books */}
                  <div className="space-y-2 p-2.5 bg-slate-50 rounded-xl">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest select-none">Popularity index scans</span>
                    {myBooks.map(b => {
                      const count = myScanLogs.filter(log => log.target_id === b.id || chapters.filter(ch => ch.textbook_id === b.id).map(ch => ch.id).includes(log.target_id)).length;
                      const percentage = totalScans > 0 ? (count / totalScans) * 100 : 0;
                      return (
                        <div key={b.id} className="text-xs space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-slate-700 truncate max-w-[150px]">{b.title}</span>
                            <span className="font-mono text-[10px] text-emerald-700 font-bold">{count} scans ({Math.round(percentage)}%)</span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden select-none">
                            <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Activity List Logs */}
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block pt-2 select-none">Live Access Feed Logs</span>
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {myScanLogs.slice().reverse().map((log) => {
                      const studentName = db.getUsers().find(u => u.id === log.student_id)?.full_name || 'Anonymous Student';
                      const school = schools.find(s => s.id === log.school_id)?.school_name || 'Hillview school';
                      
                      return (
                        <div key={log.id} className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs text-left leading-normal space-y-1">
                          <div className="flex justify-between text-[8px] font-mono text-slate-400">
                            <span className="text-indigo-650 font-bold uppercase">{log.target_type} CODE SCANNED</span>
                            <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div className="font-bold text-slate-800 truncate">
                            {log.target_name}
                          </div>
                          <div className="text-[10px] text-slate-500 leading-tight">
                            Accessed by <strong>{studentName}</strong> ({school})
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              )}
            </div>

          </div>

        </div>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 mt-16 py-8 text-center text-xs text-slate-400 font-medium">
        <p>SmartQR Classroom Console • Connected to Greenwood & Hillview School Districts.</p>
      </footer>

      {/* Reader simulation pop for preview testing */}
      {testingBookId && (
        <BookDetailModal
          bookId={testingBookId}
          currentUserId={currentUser.id}
          onClose={() => setTestingBookId(null)}
        />
      )}

    </div>
  );
};
