import { School, User, Subject, Textbook, Chapter, LearningResource, QRCode, ScanLog, StudentProgress, OfflineSyncAction } from './types';

// Let's key everything in localStorage
const KEYS = {
  USERS: 'smartqr_users',
  SCHOOLS: 'smartqr_schools',
  SUBJECTS: 'smartqr_subjects',
  TEXTBOOKS: 'smartqr_textbooks',
  CHAPTERS: 'smartqr_chapters',
  RESOURCES: 'smartqr_resources',
  QR_CODES: 'smartqr_qrcodes',
  SCAN_LOGS: 'smartqr_scanlogs',
  FAVORITES: 'smartqr_favorites',
  CURRENT_USER: 'smartqr_currentuser',
  THEME: 'smartqr_theme',
  OFFLINE_CACHE: 'smartqr_offline_cache',
  PENDING_SYNC: 'smartqr_pending_sync',
  STUDENT_PROGRESS: 'smartqr_student_progress',
  ONLINE_STATUS: 'smartqr_online_status',
};

// Seed Helper Data
const SEED_SCHOOLS: School[] = [
  { id: 'sch-1', school_name: 'Hillview Rural Senior School', location: 'Eastern District Valley', created_at: '2026-01-10T08:00:00Z' },
  { id: 'sch-2', school_name: 'Sunshine Valley Primary & Secondary', location: 'Northern Agricultural Plains', created_at: '2026-02-14T09:30:00Z' },
  { id: 'sch-3', school_name: 'Greenwood Community Academy', location: 'Central Highlands', created_at: '2026-03-01T10:15:00Z' },
];

const SEED_USERS: User[] = [
  { id: 'usr-admin', full_name: 'Super Administrator', email: 'admin@school.org', password: 'admin', role: 'admin', school_id: null, status: 'active', created_at: '2026-01-01T00:00:00Z' },
  { id: 'usr-teacher1', full_name: 'Sarah Collins (Mathematics)', email: 'sarah.collins@school.org', password: 'password', role: 'teacher', school_id: 'sch-1', status: 'active', created_at: '2026-01-15T12:00:00Z' },
  { id: 'usr-teacher2', full_name: 'Prof. Alan Turing (Science)', email: 'alan.turing@school.org', password: 'password', role: 'teacher', school_id: 'sch-2', status: 'active', created_at: '2026-01-20T14:30:00Z' },
  { id: 'usr-student1', full_name: 'Brighton Macharia', email: 'brightonmacharia8@gmail.com', password: 'student', role: 'student', school_id: 'sch-1', status: 'active', created_at: '2026-02-01T10:00:00Z' },
  { id: 'usr-student2', full_name: 'Grace Hopper', email: 'grace.hopper@school.org', password: 'password', role: 'student', school_id: 'sch-1', status: 'active', created_at: '2026-02-10T11:00:00Z' },
  { id: 'usr-student3', full_name: 'Nelson Mandela', email: 'nelson@school.org', password: 'password', role: 'student', school_id: 'sch-2', status: 'active', created_at: '2026-02-22T09:00:00Z' },
];

const SEED_SUBJECTS: Subject[] = [
  { id: 'sub-math-8', subject_name: 'Mathematics', grade_level: 'Grade 8' },
  { id: 'sub-math-9', subject_name: 'Mathematics', grade_level: 'Grade 9' },
  { id: 'sub-sci-7', subject_name: 'Integrated Science', grade_level: 'Grade 7' },
  { id: 'sub-sci-8', subject_name: 'Integrated Science', grade_level: 'Grade 8' },
  { id: 'sub-eng-9', subject_name: 'English Language Literacy', grade_level: 'Grade 9' },
  { id: 'sub-geo-8', subject_name: 'Social Studies & Geography', grade_level: 'Grade 8' },
];

const SEED_TEXTBOOKS: Textbook[] = [
  {
    id: 'book-math-8',
    title: 'Modern Algebra & Geometry',
    author: 'Dr. Evelyn Vance & Sarah Collins',
    description: 'A comprehensive study guide explaining linear formulas, geometric models, algebraic fractions, and practical graphing equations for Grade 8 students. Perfect for classrooms with limited single-book access.',
    subject_id: 'sub-math-8',
    cover_image: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400',
    uploaded_by: 'usr-teacher1',
    date_added: '2026-03-01T09:00:00Z',
    savesCount: 147
  },
  {
    id: 'book-sci-7',
    title: 'Exploring Our World: Science Essentials',
    author: 'Prof. Alan Turing',
    description: 'An interactive textbook covering multicellular organisms, kinetic thermodynamics, forces and gravity, and ecosystem sustainability rules tailored for Grade 7 learners.',
    subject_id: 'sub-sci-7',
    cover_image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=400',
    uploaded_by: 'usr-teacher2',
    date_added: '2026-03-05T10:00:00Z',
    savesCount: 92
  },
  {
    id: 'book-eng-9',
    title: 'Advanced Rhetoric & English Composition',
    author: 'Prof. Sarah Collins',
    description: 'A high-impact coursebook highlighting essay structuring, stylistic rhetoric, syntax analysis, and poetry review. Designed specifically for offline assignments and student study circles.',
    subject_id: 'sub-eng-9',
    cover_image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=400',
    uploaded_by: 'usr-teacher1',
    date_added: '2026-03-12T11:30:00Z',
    savesCount: 65
  },
  {
    id: 'book-geo-8',
    title: 'African Geography & Climate Zones',
    author: 'Elizabeth Thorne',
    description: 'An essential textbook reviewing regional demographics, rain forest protection, climate transition indexes, and topographical mapping across East and Sub-Saharan Africa.',
    subject_id: 'sub-geo-8',
    cover_image: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=400',
    uploaded_by: 'usr-teacher1',
    date_added: '2026-03-18T14:20:00Z',
    savesCount: 41
  }
];

const SEED_CHAPTERS: Chapter[] = [
  // Math Chapters
  { id: 'ch-math8-1', textbook_id: 'book-math-8', chapter_number: 1, chapter_name: 'Algebraic Expressions & Factorization', description: 'Simplifying polynomial variables and factoring quadratics.' },
  { id: 'ch-math8-2', textbook_id: 'book-math-8', chapter_number: 2, chapter_name: 'Linear Graphs & Coordinates', description: 'Understanding y = mx + c slope systems and graphical coordinates.' },
  { id: 'ch-math8-3', textbook_id: 'book-math-8', chapter_number: 3, chapter_name: 'Geometry: Congruency & Angles', description: 'Solving for triangles, transversal lines, and similarity layouts.' },
  { id: 'ch-math8-4', textbook_id: 'book-math-8', chapter_number: 4, chapter_name: 'Pythagoras Theorem & Trigonometry Base', description: 'Calculating hypotenuse dimensions, sine, and cosine relationships.' },
  { id: 'ch-math8-5', textbook_id: 'book-math-8', chapter_number: 5, chapter_name: 'Probability Foundations', description: 'Relative frequency, outcome charts, and independent event arrays.' },

  // Science Chapters
  { id: 'ch-sci7-1', textbook_id: 'book-sci-7', chapter_number: 1, chapter_name: 'Cell Structures and Organelles', description: 'Examining plant vs animal nuclei, chloroplasts, and cell wall structures.' },
  { id: 'ch-sci7-2', textbook_id: 'book-sci-7', chapter_number: 2, chapter_name: 'Forces, Magnetism & Mass', description: 'Investigating magnets, gravitational friction rates, and balanced momentum laws.' },
  { id: 'ch-sci7-3', textbook_id: 'book-sci-7', chapter_number: 3, chapter_name: 'Water Management & Bio-Life Systems', description: 'Human impact on regional catchments, filtration mechanisms, and water cycles.' },

  // English Chapters
  { id: 'ch-eng9-1', textbook_id: 'book-eng-9', chapter_number: 1, chapter_name: 'Persuading Through Essay Structure', description: 'Establishing thesis definitions and deploying solid logic transitions.' },
  { id: 'ch-eng9-2', textbook_id: 'book-eng-9', chapter_number: 2, chapter_name: 'Figurative Language in Context', description: 'Evaluating metonymy, active analogies, and narrative pacing filters.' },

  // Geography Chapters
  { id: 'ch-geo8-1', textbook_id: 'book-geo-8', chapter_number: 1, chapter_name: 'Great Rift Valley Formations', description: 'Tectonic plate shifts, hot spring clusters, and geographical faulting outlines.' },
  { id: 'ch-geo8-2', textbook_id: 'book-geo-8', chapter_number: 2, chapter_name: 'Rain Distribution across Sub-Saharan Zones', description: 'Intertropical convergence zone movements and seasonal farming planning.' },
];

const SEED_RESOURCES: LearningResource[] = [
  // Algebraic Expressions Content
  {
    id: 'res-math8-1-pdf',
    chapter_id: 'ch-math8-1',
    title: 'Algebraic Methods Study Guide (Print Version)',
    file_url: 'https://smartqr.school.org/downloads/math8_ch1_algebraic_expressions.pdf',
    resource_type: 'pdf',
    content_text: '# SECTION 1: POLYNOMIAL EXPANSION\n\nSimplifying terms by isolating similar variables is a core tool in algebraic equations. When expanding brackets, review the distributive law:\na(b + c) = ab + ac.\n\n## Example Problem:\nExpand: 3x(x - 5) + 2(2x^2 + 4x)\n- Term 1: 3x^2 - 15x\n- Term 2: 4x^2 + 8x\n- Combined representation: (3x^2 + 4x^2) + (-15x + 8x) = 7x^2 - 7x.\n\n## Practise Exercises:\n1. Expand 4y(3y + 2) - 5(y^2 - 4).\n2. Factorise the following quadratic completely: x^2 + 7x + 12.',
    is_downloadable: true
  },
  {
    id: 'res-math8-1-notes',
    chapter_id: 'ch-math8-1',
    title: 'Fast-Recall Summary Notes: Factorisation Rules',
    file_url: 'https://smartqr.school.org/materials/math8_factorisation_notes.txt',
    resource_type: 'notes',
    content_text: '# CLASS SUMMARY SHEET: FACTORISATION\n\nFactorisation is the reverse of expansion. It involves restoring mathematical expressions to grouped brackets.\n\n## Standard Formulas:\n1. Difference of Two Squares: a^2 - b^2 = (a - b)(a + b)\n2. Perfect Square Trinomial Positive: a^2 + 2ab + b^2 = (a + b)^2\n3. Perfect Square Trinomial Negative: a^2 - 2ab + b^2 = (a - b)^2\n\n## Quick Strategy Quiz:\nAlways scan for highest common factors (HCF) FIRST before running quadratic factoring formulas!',
    is_downloadable: false
  },

  // Probability Content
  {
    id: 'res-math8-5-pdf',
    chapter_id: 'ch-math8-5',
    title: 'Chapter 5 Probability & Event Spacing Handout',
    file_url: 'https://smartqr.school.org/downloads/math8_ch5_probability.pdf',
    resource_type: 'pdf',
    content_text: '# CHAPTER 5: INDEPENDENT PROBABILITIES\n\nProbability describes the numerical likelihood of a specific event occurring, scaling between 0 (completely impossible) and 1 (absolutely guaranteed).\n\n## Combined Event Formulas:\nFor two fully independent events A and B, the probability of both occurring is:\nP(A AND B) = P(A) x P(B).\n\nIf the events are mutually exclusive, the probability of either occurring is:\nP(A OR B) = P(A) + P(B).',
    is_downloadable: true
  },

  // Cell structures Content
  {
    id: 'res-sci7-1-img',
    chapter_id: 'ch-sci7-1',
    title: 'Microscopic Cell Comparison Structure Diagram',
    file_url: 'https://smartqr.school.org/diagrams/cell_structure_grade7.png',
    resource_type: 'image',
    content_text: '# BIOLOGICAL DIAGRAM SYNOPSIS: PLANTS vs ANIMALS\n\nThis high-definition blueprint details the physical divisions in cell architecture:\n\n1. CELL MEMBRANE: Semipermeable outer shielding, controls molecule transit. (Both plant and animal cells)\n2. CELL WALL: Ridged outer shield made of cellulose (Plant cells only, adds mechanical structure).\n3. VACUOLE: Large centralized fluid space storing cell sap (Plant cells have single permanent vacuole, animals have minor temporary bubbles).',
    is_downloadable: true
  },
  {
    id: 'res-sci7-1-notes',
    chapter_id: 'ch-sci7-1',
    title: 'Study Notes on Cell Walls & Photosynthesis Structures',
    file_url: 'https://smartqr.school.org/materials/cells_grade7.txt',
    resource_type: 'notes',
    content_text: '# GRADE 7 SYLLABUS: CELLS AND MITOCHONDRIA\n\n- CHLOROPLASTS: Organelles where energy is generated through sunlight absorption via chlorophyll pigments.\n- MITOCHONDRIA: Known universally as the cellular powerhouses, performing metabolic respiration to release ATP molecules.\n- RIBOSOMES: Small structures responsible for building amino acid protein strings inside cytoplasm.',
    is_downloadable: true
  }
];

const SEED_QR: QRCode[] = [
  // Books QR
  { id: 'qr-math-8', target_type: 'book', target_id: 'book-math-8', created_at: '2026-03-01T09:05:00Z', scan_count: 312 },
  { id: 'qr-sci-7', target_type: 'book', target_id: 'book-sci-7', created_at: '2026-03-05T10:05:00Z', scan_count: 185 },
  { id: 'qr-eng-9', target_type: 'book', target_id: 'book-eng-9', created_at: '2026-03-12T11:40:00Z', scan_count: 78 },
  { id: 'qr-geo-8', target_type: 'book', target_id: 'book-geo-8', created_at: '2026-03-18T14:25:00Z', scan_count: 42 },

  // Chapter QRs
  { id: 'qr-ch-m8-1', target_type: 'chapter', target_id: 'ch-math8-1', created_at: '2026-03-01T09:10:00Z', scan_count: 145 },
  { id: 'qr-ch-m8-5', target_type: 'chapter', target_id: 'ch-math8-5', created_at: '2026-03-01T09:20:00Z', scan_count: 89 },
  { id: 'qr-ch-s1', target_type: 'chapter', target_id: 'ch-sci7-1', created_at: '2026-03-05T10:10:00Z', scan_count: 104 },

  // Resource QRs
  { id: 'qr-res-m8-notes', target_type: 'resource', target_id: 'res-math8-1-notes', created_at: '2026-03-01T09:15:00Z', scan_count: 62 },
];

const SEED_SCAN_LOGS: ScanLog[] = [
  { id: 'log-1', student_id: 'usr-student1', target_type: 'book', target_id: 'book-math-8', target_name: 'Modern Algebra & Geometry', timestamp: '2026-05-30T10:15:00Z', school_id: 'sch-1' },
  { id: 'log-2', student_id: 'usr-student1', target_type: 'chapter', target_id: 'ch-math8-1', target_name: 'Algebraic Expressions & Factorization', timestamp: '2026-05-31T11:40:00Z', school_id: 'sch-1' },
  { id: 'log-3', student_id: 'usr-student2', target_type: 'book', target_id: 'book-math-8', target_name: 'Modern Algebra & Geometry', timestamp: '2026-06-01T09:25:00Z', school_id: 'sch-1' },
  { id: 'log-4', student_id: 'usr-student3', target_type: 'book', target_id: 'book-sci-7', target_name: 'Exploring Our World: Science Essentials', timestamp: '2026-06-02T13:10:00Z', school_id: 'sch-2' },
  { id: 'log-5', student_id: 'usr-student1', target_type: 'resource', target_id: 'res-math8-1-notes', target_name: 'Fast-Recall Summary Notes: Factorisation Rules', timestamp: '2026-06-03T08:50:00Z', school_id: 'sch-1' },
  { id: 'log-6', student_id: 'usr-student2', target_type: 'chapter', target_id: 'ch-math8-5', target_name: 'Probability Foundations', timestamp: '2026-06-04T10:05:00Z', school_id: 'sch-1' },
  { id: 'log-7', student_id: null, target_type: 'book', target_id: 'book-geo-8', target_name: 'African Geography & Climate Zones', timestamp: '2026-06-05T09:30:00Z', school_id: 'sch-1' },
];

// LocalStorage helpers with automatic seeding
function getStored<T>(key: string, seed: T[]): T[] {
  const content = localStorage.getItem(key);
  if (!content) {
    localStorage.setItem(key, JSON.stringify(seed));
    return seed;
  }
  return JSON.parse(content);
}

function setStored<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

export const db = {
  getUsers: () => getStored<User>(KEYS.USERS, SEED_USERS),
  setUsers: (users: User[]) => setStored<User>(KEYS.USERS, users),

  getSchools: () => getStored<School>(KEYS.SCHOOLS, SEED_SCHOOLS),
  setSchools: (schools: School[]) => setStored<School>(KEYS.SCHOOLS, schools),

  getSubjects: () => getStored<Subject>(KEYS.SUBJECTS, SEED_SUBJECTS),
  setSubjects: (subjects: Subject[]) => setStored<Subject>(KEYS.SUBJECTS, subjects),

  getTextbooks: () => getStored<Textbook>(KEYS.TEXTBOOKS, SEED_TEXTBOOKS),
  setTextbooks: (books: Textbook[]) => setStored<Textbook>(KEYS.TEXTBOOKS, books),

  getChapters: () => getStored<Chapter>(KEYS.CHAPTERS, SEED_CHAPTERS),
  setChapters: (chapters: Chapter[]) => setStored<Chapter>(KEYS.CHAPTERS, chapters),

  getResources: () => getStored<LearningResource>(KEYS.RESOURCES, SEED_RESOURCES),
  setResources: (res: LearningResource[]) => setStored<LearningResource>(KEYS.RESOURCES, res),

  getQRCodes: () => {
    const qrs = getStored<QRCode>(KEYS.QR_CODES, SEED_QR);
    // Auto-generate missing QR URLs dynamically if needed
    return qrs;
  },
  setQRCodes: (qrs: QRCode[]) => setStored<QRCode>(KEYS.QR_CODES, qrs),

  getScanLogs: () => getStored<ScanLog>(KEYS.SCAN_LOGS, SEED_SCAN_LOGS),
  setScanLogs: (logs: ScanLog[]) => setStored<ScanLog>(KEYS.SCAN_LOGS, logs),

  getFavorites: (userId: string): string[] => {
    const favs = localStorage.getItem(`${KEYS.FAVORITES}_${userId}`);
    return favs ? JSON.parse(favs) : [];
  },
  setFavorites: (userId: string, bookIds: string[]): void => {
    localStorage.setItem(`${KEYS.FAVORITES}_${userId}`, JSON.stringify(bookIds));
  },

  getCurrentUser: (): User | null => {
    const usr = localStorage.getItem(KEYS.CURRENT_USER);
    return usr ? JSON.parse(usr) : null;
  },
  setCurrentUser: (user: User | null): void => {
    if (user) {
      localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(KEYS.CURRENT_USER);
    }
  },

  getTheme: (): 'light' | 'dark' => {
    const theme = localStorage.getItem(KEYS.THEME);
    return theme === 'dark' ? 'dark' : 'light';
  },
  setTheme: (theme: 'light' | 'dark'): void => {
    localStorage.setItem(KEYS.THEME, theme);
  },

  // Helper inside DB mock to create a textbook & auto-generate QR code for it
  createTextbook: (book: Omit<Textbook, 'savesCount'>) => {
    const books = db.getTextbooks();
    const newBook: Textbook = { ...book, savesCount: 0 };
    books.push(newBook);
    db.setTextbooks(books);

    // Auto generate QR
    const qrs = db.getQRCodes();
    qrs.push({
      id: `qr-${book.id}`,
      target_type: 'book',
      target_id: book.id,
      created_at: new Date().toISOString(),
      scan_count: 0
    });
    db.setQRCodes(qrs);
    return newBook;
  },

  // Helper inside DB mock to create a chapter & auto-generate QR code
  createChapter: (chapter: Chapter) => {
    const chapters = db.getChapters();
    chapters.push(chapter);
    db.setChapters(chapters);

    const qrs = db.getQRCodes();
    qrs.push({
      id: `qr-ch-${chapter.id}`,
      target_type: 'chapter',
      target_id: chapter.id,
      created_at: new Date().toISOString(),
      scan_count: 0
    });
    db.setQRCodes(qrs);
    return chapter;
  },

  // Helper inside DB mock to create a resource & auto-generate QR
  createResource: (res: LearningResource) => {
    const resources = db.getResources();
    resources.push(res);
    db.setResources(resources);

    const qrs = db.getQRCodes();
    qrs.push({
      id: `qr-res-${res.id}`,
      target_type: 'resource',
      target_id: res.id,
      created_at: new Date().toISOString(),
      scan_count: 0
    });
    db.setQRCodes(qrs);
    return res;
  },

  // Log a QR Scan
  logScan: (studentId: string | null, targetType: 'book' | 'chapter' | 'resource', targetId: string) => {
    const logs = db.getScanLogs();
    const students = db.getUsers();
    const student = studentId ? students.find(s => s.id === studentId) : null;
    const schoolId = student ? student.school_id : null;

    let targetName = 'Unknown Resource';
    if (targetType === 'book') {
      const b = db.getTextbooks().find(book => book.id === targetId);
      if (b) targetName = b.title;
    } else if (targetType === 'chapter') {
      const c = db.getChapters().find(ch => ch.id === targetId);
      const b = c ? db.getTextbooks().find(book => book.id === c.textbook_id) : null;
      if (c && b) targetName = `${b.title} ➔ Chapter ${c.chapter_number}: ${c.chapter_name}`;
      else if (c) targetName = `Ch ${c.chapter_number}: ${c.chapter_name}`;
    } else if (targetType === 'resource') {
      const r = db.getResources().find(res => res.id === targetId);
      if (r) targetName = r.title;
    }

    const newLog: ScanLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      student_id: studentId,
      target_type: targetType,
      target_id: targetId,
      target_name: targetName,
      timestamp: new Date().toISOString(),
      school_id: schoolId
    };

    logs.push(newLog);
    db.setScanLogs(logs);

    // Increment QR Code count
    const qrs = db.getQRCodes();
    const qrIndex = qrs.findIndex(qr => qr.target_type === targetType && qr.target_id === targetId);
    if (qrIndex !== -1) {
      qrs[qrIndex].scan_count += 1;
    } else {
      qrs.push({
        id: `qr-auto-${Date.now()}`,
        target_type: targetType,
        target_id: targetId,
        created_at: new Date().toISOString(),
        scan_count: 1
      });
    }
    db.setQRCodes(qrs);

    return newLog;
  },

  // Online / Offline state helper (simulated)
  getOnlineStatus: (): boolean => {
    const status = localStorage.getItem(KEYS.ONLINE_STATUS);
    return status !== 'offline'; // default to online
  },
  setOnlineStatus: (isOnline: boolean): void => {
    localStorage.setItem(KEYS.ONLINE_STATUS, isOnline ? 'online' : 'offline');
  },

  // Offline Caching helper
  getOfflineCache: (userId: string): { bookIds: string[], chapterIds: string[], resourceIds: string[] } => {
    const key = `${KEYS.OFFLINE_CACHE}_${userId}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : { bookIds: [], chapterIds: [], resourceIds: [] };
  },
  setOfflineCache: (userId: string, cache: { bookIds: string[], chapterIds: string[], resourceIds: string[] }) => {
    const key = `${KEYS.OFFLINE_CACHE}_${userId}`;
    localStorage.setItem(key, JSON.stringify(cache));
  },

  // Student progress tracking
  getStudentProgress: (userId: string): StudentProgress[] => {
    const key = `${KEYS.STUDENT_PROGRESS}_${userId}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  },
  setStudentProgress: (userId: string, progress: StudentProgress[]): void => {
    const key = `${KEYS.STUDENT_PROGRESS}_${userId}`;
    localStorage.setItem(key, JSON.stringify(progress));
  },
  toggleStudentProgress: (userId: string, targetType: 'chapter' | 'resource', targetId: string): StudentProgress => {
    const list = db.getStudentProgress(userId);
    const existingIdx = list.findIndex(p => p.target_type === targetType && p.target_id === targetId);
    
    if (existingIdx !== -1) {
      const updated = { ...list[existingIdx], completed: !list[existingIdx].completed, timestamp: new Date().toISOString() };
      list[existingIdx] = updated;
      db.setStudentProgress(userId, list);
      return updated;
    } else {
      const newP: StudentProgress = {
        id: `prog-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        student_id: userId,
        target_type: targetType,
        target_id: targetId,
        completed: true,
        timestamp: new Date().toISOString()
      };
      list.push(newP);
      db.setStudentProgress(userId, list);
      return newP;
    }
  },

  // Offline Pending action queue
  getPendingSyncActions: (userId: string): OfflineSyncAction[] => {
    const key = `${KEYS.PENDING_SYNC}_${userId}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  },
  setPendingSyncActions: (userId: string, actions: OfflineSyncAction[]): void => {
    const key = `${KEYS.PENDING_SYNC}_${userId}`;
    localStorage.setItem(key, JSON.stringify(actions));
  },
  addPendingSyncAction: (userId: string, type: 'scan' | 'progress' | 'favorite', payload: any): void => {
    const actions = db.getPendingSyncActions(userId);
    actions.push({
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      action_type: type,
      payload,
      timestamp: new Date().toISOString()
    });
    db.setPendingSyncActions(userId, actions);
  },
  clearPendingSyncActions: (userId: string): void => {
    const key = `${KEYS.PENDING_SYNC}_${userId}`;
    localStorage.removeItem(key);
  }
};
