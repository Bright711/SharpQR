import React, { useState, useEffect } from 'react';
import { 
  X, BookOpen, Star, Download, Printer, ZoomIn, ZoomOut, 
  Maximize2, ChevronRight, FileText, Image as ImageIcon, 
  ArrowLeft, Calendar, FileDown, Check, Scan, Eye, EyeOff,
  Globe, Trash2
} from 'lucide-react';
import { Textbook, Chapter, LearningResource, QRCode, StudentProgress } from '../types';
import { db } from '../dbMock';
import { QRCodeImage } from './QRCodeImage';

interface BookDetailModalProps {
  bookId: string;
  initialChapterId?: string;
  initialResourceId?: string;
  currentUserId: string | null;
  onClose: () => void;
  onFavoriteChange?: () => void;
}

export const BookDetailModal: React.FC<BookDetailModalProps> = ({
  bookId,
  initialChapterId,
  initialResourceId,
  currentUserId,
  onClose,
  onFavoriteChange,
}) => {
  // DB query states
  const [book, setBook] = useState<Textbook | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [qrs, setQrs] = useState<QRCode[]>([]);
  const [teacherName, setTeacherName] = useState<string>('Unknown Teacher');

  // Interactive View States
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [activeResource, setActiveResource] = useState<LearningResource | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  
  // Custom Zoom controls
  const [zoomScale, setZoomScale] = useState<number>(1); // e.g., 0.8, 1, 1.2, 1.5
  const [showQRCodes, setShowQRCodes] = useState<boolean>(true);

  // Local state for offline caching & progress sync
  const [offlineCache, setOfflineCacheState] = useState<{ bookIds: string[], chapterIds: string[], resourceIds: string[] }>({ bookIds: [], chapterIds: [], resourceIds: [] });
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([]);
  const [toastMessage, setToastMessage] = useState<string>('');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Load Book and relations
  useEffect(() => {
    const allBooks = db.getTextbooks();
    const foundBook = allBooks.find(b => b.id === bookId);
    if (foundBook) {
      setBook(foundBook);

      // Fetch teacher name
      const allUsers = db.getUsers();
      const teacher = allUsers.find(u => u.id === foundBook.uploaded_by);
      if (teacher) {
        setTeacherName(teacher.full_name);
      }

      // Fetch chapters for this book
      const allChapters = db.getChapters().filter(c => c.textbook_id === bookId);
      // Sort chapters by number
      allChapters.sort((a, b) => a.chapter_number - b.chapter_number);
      setChapters(allChapters);

      // Fetch all resources linked to those chapters
      const chapterIds = allChapters.map(c => c.id);
      const allResources = db.getResources().filter(r => chapterIds.includes(r.chapter_id));
      setResources(allResources);

      // Fetch QRs
      setQrs(db.getQRCodes());

      // Adjust to initial specific route redirects if supplied on direct scan
      if (initialChapterId) {
        const foundCh = allChapters.find(ch => ch.id === initialChapterId);
        if (foundCh) {
          setSelectedChapter(foundCh);
          // Auto select first resource inside that chapter if it exists
          const linkedRes = allResources.find(r => r.chapter_id === foundCh.id);
          if (linkedRes) {
            setActiveResource(linkedRes);
          }
        }
      } else if (initialResourceId) {
        const foundRes = allResources.find(r => r.id === initialResourceId);
        if (foundRes) {
          setActiveResource(foundRes);
          const foundCh = allChapters.find(ch => ch.id === foundRes.chapter_id);
          if (foundCh) {
            setSelectedChapter(foundCh);
          }
        }
      }

      // Check favorite
      if (currentUserId) {
        const favs = db.getFavorites(currentUserId);
        setIsSaved(favs.includes(bookId));
      }

      // Load offline & progress states
      setIsOnline(db.getOnlineStatus());
      if (currentUserId) {
        setOfflineCacheState(db.getOfflineCache(currentUserId));
        setStudentProgress(db.getStudentProgress(currentUserId));
      }
    }
  }, [bookId, initialChapterId, initialResourceId, currentUserId]);

  if (!book) return null;

  const handleToggleFavorite = () => {
    if (!currentUserId) return;
    const favs = db.getFavorites(currentUserId);
    let updated: string[];
    if (favs.includes(bookId)) {
      updated = favs.filter(id => id !== bookId);
      setIsSaved(false);
    } else {
      updated = [...favs, bookId];
      setIsSaved(true);
    }
    db.setFavorites(currentUserId, updated);
    if (onFavoriteChange) onFavoriteChange();
  };

  const handleDownloadResource = (res: LearningResource) => {
    if (!res.is_downloadable) return;
    // Simulate low-bandwidth offline resource downloader
    const textBlob = new Blob([res.content_text || ''], { type: 'text/markdown' });
    const url = URL.createObjectURL(textBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${res.title.toLowerCase().replace(/\s+/g, '-')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Offline Caching & Sync Handlers
  const handleDownloadEntireBook = () => {
    if (!currentUserId) return;
    const cache = db.getOfflineCache(currentUserId);
    if (!cache.bookIds.includes(bookId)) {
      cache.bookIds.push(bookId);
    }
    chapters.forEach(ch => {
      if (!cache.chapterIds.includes(ch.id)) {
        cache.chapterIds.push(ch.id);
      }
    });
    resources.forEach(r => {
      if (!cache.resourceIds.includes(r.id)) {
        cache.resourceIds.push(r.id);
      }
    });
    db.setOfflineCache(currentUserId, cache);
    setOfflineCacheState(cache);
    
    if (!isOnline) {
      db.addPendingSyncAction(currentUserId, 'favorite', { 
        target_type: 'book', 
        target_id: bookId, 
        is_favorite: true, 
        timestamp: new Date().toISOString() 
      });
    }
    triggerToast(`"${book.title}" added to local offline cached bookshelf.`);
  };

  const handleDownloadChapterOnly = (ch: Chapter) => {
    if (!currentUserId) return;
    const cache = db.getOfflineCache(currentUserId);
    if (!cache.chapterIds.includes(ch.id)) {
      cache.chapterIds.push(ch.id);
    }
    const chResources = resources.filter(r => r.chapter_id === ch.id);
    chResources.forEach(r => {
      if (!cache.resourceIds.includes(r.id)) {
        cache.resourceIds.push(r.id);
      }
    });
    if (!cache.bookIds.includes(bookId)) {
      cache.bookIds.push(bookId);
    }
    db.setOfflineCache(currentUserId, cache);
    setOfflineCacheState(cache);
    triggerToast(`Chapter ${ch.chapter_number} and attachments cached for offline study.`);
  };

  const handleRemoveBookFromCache = () => {
    if (!currentUserId) return;
    const cache = db.getOfflineCache(currentUserId);
    cache.bookIds = cache.bookIds.filter(id => id !== bookId);
    const chIds = chapters.map(c => c.id);
    cache.chapterIds = cache.chapterIds.filter(id => !chIds.includes(id));
    const rIds = resources.map(r => r.id);
    cache.resourceIds = cache.resourceIds.filter(id => !rIds.includes(id));
    
    db.setOfflineCache(currentUserId, cache);
    setOfflineCacheState(cache);
    triggerToast("Textbook package removed from local offline cache.");
  };

  const handleRemoveChapterFromCache = (ch: Chapter) => {
    if (!currentUserId) return;
    const cache = db.getOfflineCache(currentUserId);
    cache.chapterIds = cache.chapterIds.filter(id => id !== ch.id);
    const rIds = resources.filter(r => r.chapter_id === ch.id).map(r => r.id);
    cache.resourceIds = cache.resourceIds.filter(id => !rIds.includes(id));

    db.setOfflineCache(currentUserId, cache);
    setOfflineCacheState(cache);
    triggerToast(`Chapter ${ch.chapter_number} removed from local cache.`);
  };

  const handleToggleResourceCompletion = (res: LearningResource) => {
    if (!currentUserId) return;
    db.toggleStudentProgress(currentUserId, 'resource', res.id);
    setStudentProgress(db.getStudentProgress(currentUserId));
    
    const isCompleted = db.getStudentProgress(currentUserId)
      .some(p => p.target_type === 'resource' && p.target_id === res.id && p.completed);

    if (isOnline) {
      triggerToast(`Progress saved: Completed "${res.title}"`);
    } else {
      db.addPendingSyncAction(currentUserId, 'progress', {
        target_type: 'resource',
        target_id: res.id,
        completed: isCompleted,
        timestamp: new Date().toISOString()
      });
      triggerToast(`Completed offline: "${res.title}" marker queued for restore synchronization!`);
    }
  };

  const handleToggleChapterCompletion = (ch: Chapter) => {
    if (!currentUserId) return;
    db.toggleStudentProgress(currentUserId, 'chapter', ch.id);
    setStudentProgress(db.getStudentProgress(currentUserId));
    
    const isCompleted = db.getStudentProgress(currentUserId)
      .some(p => p.target_type === 'chapter' && p.target_id === ch.id && p.completed);

    if (isOnline) {
      triggerToast(`Progress saved: Completed Chapter ${ch.chapter_number}`);
    } else {
      db.addPendingSyncAction(currentUserId, 'progress', {
        target_type: 'chapter',
        target_id: ch.id,
        completed: isCompleted,
        timestamp: new Date().toISOString()
      });
      triggerToast(`Completed offline: Chapter ${ch.chapter_number} marker queued for restore sync.`);
    }
  };

  // Zoom helpers
  const handleZoomIn = () => setZoomScale(prev => Math.min(prev + 0.15, 1.8));
  const handleZoomOut = () => setZoomScale(prev => Math.max(prev - 0.15, 0.7));
  const handleZoomReset = () => setZoomScale(1);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 md:p-10">
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toast Popup inside Reader modal */}
        {toastMessage && (
          <div className="absolute top-16 right-5 z-50 bg-slate-900 border border-slate-800 text-white rounded-xl shadow-2xl p-3 flex items-center gap-2 max-w-xs animate-slide">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <p className="text-[11px] font-bold">{toastMessage}</p>
          </div>
        )}

        {/* Header Bar */}
        <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none select-none">
              SmartQR E-Reader Suite
            </span>
            {!isOnline && (
              <span className="bg-amber-100 text-amber-800 dark:bg-amber-955/40 dark:text-amber-400 text-[9px] font-bold py-0.5 px-1.5 rounded uppercase font-mono tracking-wider flex items-center gap-1">
                <Globe className="w-3 h-3 animate-pulse" /> Offline Mode
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowQRCodes(prev => !prev)}
              className="flex items-center gap-1.5 py-1 px-2 text-[11px] font-semibold text-slate-600 border border-slate-200 bg-white rounded-md hover:bg-slate-50 transition"
            >
              {showQRCodes ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showQRCodes ? "Hide QR Codes" : "Show QR Codes"}</span>
            </button>

            {currentUserId && (
              <div className="flex items-center gap-1.5">
                {offlineCache.bookIds.includes(bookId) ? (
                  <button
                    onClick={handleRemoveBookFromCache}
                    className="flex items-center gap-1 px-2 py-1.5 border border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900 dark:text-rose-400 rounded-md text-[11px] font-bold hover:bg-rose-100 transition"
                    title="Remove textbook database and file structures from local storage cache"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Cached Offline</span>
                  </button>
                ) : (
                  <button
                    onClick={handleDownloadEntireBook}
                    className="flex items-center gap-1 px-2 py-1.5 border border-slate-200 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-[11px] font-bold transition"
                    title="Download textbook chapters and lesson materials for offline study"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Book</span>
                  </button>
                )}

                <button
                  onClick={handleToggleFavorite}
                  className={`flex items-center gap-1 px-2 py-1.5 border rounded-md text-[11px] font-semibold transition ${
                    isSaved 
                      ? 'bg-amber-50 border-amber-200 text-amber-700' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${isSaved ? 'fill-amber-500 text-amber-500' : ''}`} />
                  <span>{isSaved ? 'Saved' : 'Favorite'}</span>
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-1 px-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 rounded-md text-slate-600 transition"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Splitting Grid (with Block template if completely offline and textbook not downloaded) */}
        {!isOnline && !offlineCache.bookIds.includes(bookId) ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-slate-900 text-slate-300 space-y-4">
            <div className="p-4 bg-rose-500/10 rounded-full text-rose-400 border border-rose-500/20">
              <Globe className="w-12 h-12 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold text-white uppercase tracking-wider">Device is Offline</h3>
            <p className="text-sm text-slate-300 max-w-md leading-relaxed">
              "<strong>{book.title}</strong>" is not loaded in your offline device storage. Point access qr codes to school wifi networks to download textbooks beforehand.
            </p>
            <div className="pt-2">
              <button
                onClick={handleDownloadEntireBook}
                className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition"
              >
                Force Download Mock Cache Now
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            
            {/* LEFT COLUMN: Outline or Explorer Panel */}
            <div className="w-full md:w-[350px] border-r border-slate-100 dark:border-slate-800 overflow-y-auto p-4 sm:p-5 bg-slate-50/30 dark:bg-slate-950/20 space-y-5">
              
              {/* Textbook Identity */}
              <div className="flex gap-4">
                <img 
                  src={book.cover_image} 
                  alt={book.title} 
                  className="w-20 h-28 object-cover rounded-lg shadow-md border border-slate-100 dark:border-slate-850" 
                  referrerPolicy="no-referrer"
                />
                <div className="space-y-1 overflow-hidden">
                  <span className="inline-block bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider">
                    {book.id.includes('math') ? 'Mathematics' : 'Science'}
                  </span>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-snug break-words">{book.title}</h2>
                  <p className="text-xs text-slate-500">By {book.author}</p>
                  <p className="text-[10px] text-slate-400">Owner: {teacherName}</p>
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3 italic">
                {book.description}
              </p>

              {/* Book Level QR sticker box (if showQRCodes is toggled) */}
              {showQRCodes && (
                <div className="border border-dashed border-emerald-200 bg-emerald-50/10 p-3.5 rounded-xl flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-bold text-emerald-800 tracking-wider uppercase mb-1 flex items-center gap-1">
                    <Scan className="w-3.5 h-3.5" /> Book Access QR Code
                  </span>
                  <p className="text-[10px] text-slate-400 mb-2 leading-tight">
                    Point camera here to open this book directly
                  </p>
                  <QRCodeImage
                    value={book.id}
                    title={book.title}
                    subtitle="Primary QR Scan"
                    size={140}
                    showActions={true}
                  />
                </div>
              )}

              {/* CHAPTERS INDEX SECTION */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-250 uppercase tracking-wider">Chapters List</span>
                  <span className="text-xs text-slate-500 font-mono font-medium">{chapters.length} total</span>
                </div>

                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {chapters.map((ch) => {
                    const isSelected = selectedChapter?.id === ch.id;
                    const isCompleted = studentProgress.some(p => p.target_type === 'chapter' && p.target_id === ch.id && p.completed);
                    const isCached = offlineCache.chapterIds.includes(ch.id);

                    return (
                      <div
                        key={ch.id}
                        onClick={() => {
                          setSelectedChapter(ch);
                          // Find the first resource connected to this chapter and select it
                          const linked = resources.filter(r => r.chapter_id === ch.id);
                          if (linked.length > 0) {
                            setActiveResource(linked[0]);
                          } else {
                            setActiveResource(null);
                          }
                        }}
                        className={`w-full p-2.5 rounded-lg text-left text-xs transition border flex items-center justify-between gap-1.5 cursor-pointer ${
                          isSelected 
                            ? 'border-emerald-500 bg-emerald-50/40 text-slate-905 font-semibold dark:bg-slate-900' 
                            : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 hover:border-slate-200'
                        }`}
                      >
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[10px] text-emerald-700 dark:text-emerald-400">Ch {ch.chapter_number}</span>
                            {isCompleted && (
                              <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 font-extrabold text-[8px] px-1 rounded uppercase">Done</span>
                            )}
                            {!isOnline && !isCached && (
                              <span className="text-rose-500 text-[9px] italic">(Offline)</span>
                            )}
                          </div>
                          <div className="truncate text-slate-850 dark:text-slate-200 font-medium">{ch.chapter_name}</div>
                          {ch.description && (
                            <p className="text-[10px] text-slate-400 truncate">{ch.description}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          {/* Download Chapter Status */}
                          {isCached ? (
                            <button
                              onClick={() => handleRemoveChapterFromCache(ch)}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-900 rounded text-emerald-600 shrink-0"
                              title="Offline cached. Click to clear ch data."
                            >
                              <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDownloadChapterOnly(ch)}
                              className="p-1 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-900 rounded text-slate-400 shrink-0"
                              title="Cache chapter offline"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Completion Checker */}
                          <button
                            onClick={() => handleToggleChapterCompletion(ch)}
                            className={`p-1 rounded border text-center shrink-0 ${
                              isCompleted
                                ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-slate-800 dark:text-emerald-400'
                                : 'border-slate-200 text-slate-400 dark:border-slate-800 hover:bg-slate-100'
                            }`}
                            title="Mark chapter as Studied"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Interactive Educational Viewer */}
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-900">
              {selectedChapter ? (
                !isOnline && !offlineCache.chapterIds.includes(selectedChapter.id) ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950 text-slate-300 space-y-4">
                    <div className="p-3 bg-amber-500/10 rounded-full text-amber-500 border border-amber-505/20">
                      <Download className="w-10 h-10 animate-pulse" />
                    </div>
                    <h3 className="text-base font-bold text-white uppercase tracking-wider">Chapter Offline Restricted</h3>
                    <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                      Chapter {selectedChapter.chapter_number} was not cached on this device while connected to school network resources.
                    </p>
                    <button
                      onClick={() => handleDownloadChapterOnly(selectedChapter)}
                      className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded transition"
                    >
                      Quick Cache Chapter Offline
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    
                    {/* Chapter & Resource Selection row */}
                    <div className="bg-slate-800 text-white p-3.5 px-5 flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-700 gap-3">
                      <div>
                        <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                          Active: Chapter {selectedChapter.chapter_number}
                        </h3>
                        <h2 className="text-sm font-semibold truncate max-w-[360px]">
                          {selectedChapter.chapter_name}
                        </h2>
                      </div>

                      {/* Resource Switch Pill Buttons */}
                      <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 p-1 rounded-lg">
                        {resources.filter(r => r.chapter_id === selectedChapter.id).length === 0 ? (
                          <span className="text-[10px] text-slate-500 px-3 py-1">No uploads</span>
                        ) : (
                          resources.filter(r => r.chapter_id === selectedChapter.id).map(r => {
                            const isActive = activeResource?.id === r.id;
                            const isCachedResource = offlineCache.resourceIds.includes(r.id);
                            return (
                              <button
                                key={r.id}
                                onClick={() => setActiveResource(r)}
                                className={`flex items-center gap-1.5 py-1 px-3 text-[10px] uppercase font-bold tracking-wider rounded-md transition ${
                                  isActive 
                                    ? 'bg-emerald-600 text-white' 
                                    : 'text-slate-400 hover:text-slate-100'
                                }`}
                              >
                                {r.resource_type === 'pdf' && <FileText className="w-3.5 h-3.5" />}
                                {r.resource_type === 'notes' && <FileText className="w-3.5 h-3.5" />}
                                {r.resource_type === 'image' && <ImageIcon className="w-3.5 h-3.5" />}
                                <span>{r.resource_type}</span>
                                {!isOnline && !isCachedResource && (
                                  <span className="text-[8px] text-rose-400 ml-0.5">Locked</span>
                                )}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Sub-Resource Reading Desk */}
                    {activeResource ? (
                      !isOnline && !offlineCache.resourceIds.includes(activeResource.id) ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950 text-slate-300 space-y-4">
                          <div className="p-3 bg-rose-500/10 rounded-full text-rose-500">
                            <X className="w-8 h-8" />
                          </div>
                          <h3 className="text-xs font-bold uppercase tracking-widest text-white">Attachment Offline Locked</h3>
                          <p className="text-[11px] text-slate-450 max-w-[280px]">
                            The file element "<strong>{activeResource.title}</strong>" is not cached on this terminal.
                          </p>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col overflow-hidden">
                          
                          {/* Document control toolbar */}
                          <div className="bg-slate-800 border-b border-slate-700 px-5 py-2 flex items-center justify-between text-xs text-slate-300">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-semibold text-slate-100 text-[11px] truncate max-w-[200px]">
                                {activeResource.title}
                              </span>
                              {/* Completion toggle pill */}
                              <button
                                onClick={() => handleToggleResourceCompletion(activeResource)}
                                className={`py-0.5 px-2 rounded-full border text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 shrink-0 ${
                                  studentProgress.some(p => p.target_type === 'resource' && p.target_id === activeResource.id && p.completed)
                                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 font-extrabold'
                                    : 'border-slate-600 text-slate-400 hover:border-slate-500 hover:text-white'
                                }`}
                                title="Mark lesson page completed"
                              >
                                <Check className="w-3 h-3" />
                                <span>{studentProgress.some(p => p.target_type === 'resource' && p.target_id === activeResource.id && p.completed) ? 'Completed' : 'Mark Done'}</span>
                              </button>
                            </div>

                            {/* Zoom and Printing Widgets */}
                            <div className="flex items-center gap-2">
                              {/* Zoom Widget */}
                              <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-700">
                                <button 
                                  onClick={handleZoomOut} 
                                  className="p-1 hover:text-white hover:bg-slate-800 rounded transition"
                                  title="Zoom Out"
                                >
                                  <ZoomOut className="w-3.5 h-3.5" />
                                </button>
                                <span className="text-[9px] font-mono px-1 font-bold">
                                  {Math.round(zoomScale * 100)}%
                                </span>
                                <button 
                                  onClick={handleZoomIn} 
                                  className="p-1 hover:text-white hover:bg-slate-800 rounded transition"
                                  title="Zoom In"
                                >
                                  <ZoomIn className="w-3.5 h-3.5" />
                                </button>
                                {zoomScale !== 1 && (
                                  <button 
                                    onClick={handleZoomReset} 
                                    className="text-[9px] bg-slate-800 px-1 py-0.5 rounded text-slate-400 hover:text-white"
                                  >
                                    Reset
                                  </button>
                                )}
                              </div>

                              {/* Download if allowed */}
                              {activeResource.is_downloadable && (
                                <button
                                  onClick={() => handleDownloadResource(activeResource)}
                                  className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] uppercase tracking-wider py-1.5 px-3 rounded-lg transition"
                                >
                                  <FileDown className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Offline MD</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* TWO-COLUMN PANEL IF QR ACTIVE */}
                          <div className="flex-1 flex overflow-hidden">
                            
                            {/* Interactive Ebook Paper canvas */}
                            <div className="flex-1 overflow-auto p-4 sm:p-8 bg-slate-950 flex justify-center">
                              <div 
                                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 p-6 sm:p-10 rounded-sm shadow-2xl h-fit min-h-[500px] w-full max-w-[620px] transition-transform origin-top text-zinc-800 dark:text-zinc-200"
                                style={{ transform: `scale(${zoomScale})` }}
                              >
                                {/* Low-bandwidth optimized structural metadata */}
                                <div className="border-b border-zinc-200 pb-4 mb-6 flex justify-between text-[10px] text-zinc-400 font-mono tracking-widest uppercase">
                                  <span>ONLINE DIGITAL ACCESS COOPERATIVE</span>
                                  <span>PAGE INDEX {selectedChapter.chapter_number}.01</span>
                                </div>

                                {/* Raw document text simulating real textbooks pages */}
                                <div className="prose prose-zinc max-w-none text-zinc-900 space-y-4">
                                  {activeResource.content_text ? (
                                    <div className="whitespace-pre-wrap font-sans text-xs sm:text-sm leading-relaxed text-slate-800">
                                      {activeResource.content_text}
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-center justify-center py-20 text-center text-zinc-400 space-y-2">
                                      <BookOpen className="w-10 h-10 stroke-1 text-slate-500" />
                                      <p className="text-xs font-semibold">No digital page uploaded</p>
                                      <p className="text-[10px] text-slate-500">Contact teacher to upload chapter pages or PDF transcription files.</p>
                                    </div>
                                  )}
                                </div>

                                <div className="border-t border-zinc-200 pt-5 mt-10 flex justify-between text-[9px] text-zinc-400 font-mono">
                                  <span>CHAPTER: {selectedChapter.chapter_number} / TOPIC: {selectedChapter.chapter_name}</span>
                                  <span>SMARTQR COOPERATIVE v1.3</span>
                                </div>
                              </div>
                            </div>

                            {/* Direct Sticker Creator Inside Reader Panel */}
                            {showQRCodes && (
                              <div className="hidden lg:flex w-[200px] bg-slate-800 border-l border-slate-700/80 p-4 flex-col items-center justify-start text-center text-white overflow-y-auto space-y-4">
                                <span className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase flex items-center gap-1 select-none">
                                  <Scan className="w-3.5 h-3.5" /> Stick-on QR Sticker
                                </span>
                                <p className="text-[10px] text-slate-400 leading-normal font-medium">
                                  Print this and tape it to the physical textbook's <strong>Chapter {selectedChapter.chapter_number}</strong> page so students can jump straight here!
                                </p>
                                
                                <QRCodeImage 
                                  value={selectedChapter.id}
                                  title={`${book.title} - Ch ${selectedChapter.chapter_number}`}
                                  subtitle={`QR Scan Code: ${selectedChapter.id}`}
                                  size={140}
                                />

                                <div className="pt-2 border-t border-slate-700 w-full text-left space-y-1">
                                  <span className="text-[9px] text-slate-500 font-bold uppercase block">Resource Details</span>
                                  <div className="text-[10px] text-slate-300 font-bold truncate">{activeResource.title}</div>
                                  <div className="text-[9px] text-slate-400 capitalize">{activeResource.resource_type} Format</div>
                                </div>
                              </div>
                            )}

                          </div>

                        </div>
                      )
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3">
                        <FileText className="w-12 h-12 stroke-1 text-emerald-500/80 animate-bounce" />
                        <p className="text-sm font-semibold text-slate-200">Select an Upper Tag resource</p>
                        <p className="text-xs text-slate-500 max-w-sm">
                          This chapter has multiple lesson summaries, quizzes, and attachments. Select from the top right pill bar to start studying!
                        </p>
                      </div>
                    )}

                  </div>
                )
              ) : (
                // DEFAULT CHOOSE VIEW GREETING
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-4 bg-slate-950">
                  <BookOpen className="w-16 h-16 stroke-1 text-emerald-500/80" />
                  <h3 className="text-base font-bold text-slate-100 uppercase tracking-widest">Digital E-Reader Ready</h3>
                  <p className="text-xs text-slate-500 max-w-md leading-relaxed font-semibold">
                    Select any chapter from the left index menu to open interactive digital summary worksheets.
                  </p>
                  <div className="p-4 rounded-xl border border-dashed border-slate-800 bg-slate-900/40 text-[11px] text-slate-400 max-w-sm">
                    💡 Students sharing physical textbooks can scan chapter-level QR printouts to open specific topics directly without traversing standard indexes.
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* Footer engagement stats */}
        <div className="bg-slate-50/80 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 py-3 px-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-400">
            <Calendar className="w-3.5 h-3.5" /> Book Added: {new Date(book.date_added).toLocaleDateString()}
          </span>
          <span className="font-semibold text-slate-600 dark:text-slate-400">
            SmartQR Low-Bandwidth Cooperative Platform for Rural Communities
          </span>
        </div>
      </div>
    </div>
  );
};
