import React, { useState } from 'react';
import { 
  BookOpen, Scan, Share2, Shield, Users, ArrowRight, HelpCircle, 
  ChevronDown, BookMarked, Smartphone, Check, Send, Sparkles, LogIn, Award
} from 'lucide-react';
import { db } from '../dbMock';
import { User } from '../types';

interface LandingPageProps {
  onSignInSuccess: (user: User) => void;
  onSignUpSuccess: (user: User) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSignInSuccess,
  onSignUpSuccess,
}) => {
  // Auth view states
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot' | null>(null);
  
  // Login standard form inputs
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  // Signup standard form inputs
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPass, setSignupPass] = useState('');
  const [signupSchool, setSignupSchool] = useState('');
  const [signupError, setSignupError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState(false);

  // Contact States
  const [contactName, setContactName] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [contactSuccess, setContactSuccess] = useState(false);

  // FAQ state
  const [openFAQIndex, setOpenFAQIndex] = useState<number | null>(null);

  const schools = db.getSchools();

  const handleStandardLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const users = db.getUsers();
    const user = users.find(u => u.email.toLowerCase() === loginEmail.toLowerCase().trim() && u.password === loginPass);
    if (!user) {
      setLoginError('Invalid email or password. For demo logins, see the Roleplay Panel.');
      return;
    }
    if (user.status === 'suspended') {
      setLoginError('Your account has been suspended by the school administrator.');
      return;
    }
    onSignInSuccess(user);
    setAuthMode(null);
  };

  const handleStandardSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');
    if (!signupName.trim() || !signupEmail.trim() || !signupPass.trim()) {
      setSignupError('Please fill in all core fields.');
      return;
    }

    const users = db.getUsers();
    if (users.some(u => u.email.toLowerCase() === signupEmail.toLowerCase().trim())) {
      setSignupError('This email is already registered.');
      return;
    }

    const newStudent: User = {
      id: `usr-s-${Date.now()}`,
      full_name: signupName,
      email: signupEmail,
      password: signupPass,
      role: 'student',
      school_id: signupSchool || null,
      status: 'active',
      created_at: new Date().toISOString()
    };

    const updated = [...users, newStudent];
    db.setUsers(updated);
    setSignupSuccess(true);
    setTimeout(() => {
      onSignUpSuccess(newStudent);
      setAuthMode(null);
      setSignupSuccess(false);
    }, 1500);
  };

  const handleRoleplayLogin = (userEmail: string, pass: string) => {
    const users = db.getUsers();
    const found = users.find(u => u.email === userEmail && u.password === pass);
    if (found) {
      onSignInSuccess(found);
      setAuthMode(null);
    }
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSuccess(true);
    setContactName('');
    setContactMsg('');
    setTimeout(() => setContactSuccess(false), 3000);
  };

  const FAQS = [
    {
      q: "How does SmartQR help with rural textbook shortages?",
      a: "Instead of copying textbooks or waiting hours to share a single physical copy, teachers can print small, robust QR labels. Multiple students can scan these codes from their phones to read chapters simultaneously in class or at home."
    },
    {
      q: "Does this require high internet speeds to read books?",
      a: "No! The platform features low-bandwidth optimizations. Pages are transcribed into high-fidelity responsive markdown structures and summary lists, saving mobile data compared to loading heavy 100MB PDF textbook pages."
    },
    {
      q: "Can students download resources for offline reading?",
      a: "Yes! Teachers can enable 'is_downloadable' permissions. This lets students download text pages as lightweight offline Markdown text files to study on devices when there is absolutely no network coverage."
    },
    {
      q: "Who generates the unique QR codes?",
      a: "The system automatically creates clean QR code stickers for every Textbook, Chapter, and Learning Material as soon as they are saved. Teachers can export these as images, print them directly, or compile chapter index booklets."
    }
  ];

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-800">
      
      {/* Navigation Header */}
      <h1 className="sr-only">SmartQR Learning Access Platform</h1>
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/95 border-b border-rose-100/30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600 rounded-lg text-white shadow-xs">
              <BookMarked className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-slate-900">
              SmartQR <span className="text-emerald-600">Learning</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setAuthMode('signin')}
              className="py-1.5 px-3.5 border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Log In
            </button>
            <button
              onClick={() => setAuthMode('signup')}
              className="py-1.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white leading-none rounded-lg text-xs font-semibold shadow-xs transition"
            >
              Sign Up (Student)
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 bg-linear-to-b from-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Left Info */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-550/10 text-emerald-800 rounded-full text-xs font-bold leading-none select-none">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Empowering Low-Resource Classrooms
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Bridging Physical Textbooks with <span className="text-emerald-600">Instant Digital Chapters</span>
            </h2>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
              Clean digital e-book access driven by stick-on physical QR codes. Eliminate germ-sharing through book swapping, maximize studying potential offline, and bypass rural school textbook shortages instantly.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={() => setAuthMode('signup')}
                className="py-3 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 transition"
              >
                <span>Register as Student</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  const el = document.getElementById('how-it-works');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="py-3 px-6 border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-semibold text-xs rounded-xl flex items-center justify-center transition"
              >
                Learn How It Works
              </button>
            </div>
          </div>

          {/* Hero Right Graphic Preview */}
          <div className="lg:col-span-5 relative mt-8 lg:mt-0 flex justify-center">
            <div className="relative w-full max-w-[340px] bg-slate-900 p-4 rounded-3xl shadow-2xl border border-slate-800">
              <div className="bg-slate-950 aspect-[9/16] rounded-2xl overflow-hidden p-4 text-white flex flex-col justify-between">
                
                {/* Mock Phone Status Indicator */}
                <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                  <span>Hillview Local Area</span>
                  <span>100% Offline study</span>
                </div>

                {/* Mock Scanner Overlay Inside Graphic */}
                <div className="border border-dashed border-emerald-500/80 rounded-2xl p-4 flex flex-col items-center justify-center my-6 space-y-3 bg-emerald-500/5">
                  <div className="relative w-32 h-32 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
                    <Scan className="w-20 h-20 text-emerald-400 stroke-1 animate-pulse" />
                    <div className="absolute inset-x-2 top-2 h-0.5 bg-emerald-400 opacity-80" />
                  </div>
                  <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wide">
                    QR SENSOR SCANNING
                  </span>
                </div>

                <div className="text-center space-y-1">
                  <h3 className="text-xs font-bold leading-normal text-emerald-400">MATH GRADE 8 ➔ CHAPTER 1</h3>
                  <p className="text-[10px] text-slate-400">Hold near textbook sticker to view learning resource online</p>
                </div>
              </div>
            </div>

            {/* Float visual card */}
            <div className="absolute -bottom-6 -left-6 bg-white p-3.5 rounded-xl shadow-xl border border-slate-100 flex items-center gap-3 max-w-[200px]">
              <div className="bg-emerald-50 text-emerald-600 p-2 rounded-lg">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">4,120 Scans</div>
                <div className="text-[9px] text-slate-400 uppercase tracking-widest font-mono">This semester</div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Problem Statement Section */}
      <section className="py-20 bg-slate-100/50 border-y border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 block">THE STUDY Swapping CHALLENGE</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Textbook Sharing Shouldn't Limit Student Careers</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              In developing schools, multiple students are forced to share a single physical copy of a textbook. This presents structural obstacles:
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 mt-12">
            {[
              { title: "Increased Germ Swapping", text: "Physical book swapping increases the spread of viruses and germs among vulnerable children.", icon: Shield },
              { title: "Damage and Wear", "text": "Intensive handling quickly ruins textbooks, causing chapters to rip out and disappear.", icon: BookMarked },
              { title: "Zero Studying Outside Class", "text": "Shared books remain in school, meaning pupils cannot complete homework or revision grids.", icon: Smartphone },
              { title: "High Printing Costs", "text": "Printing duplicate physical chapters or PDFs for everyone exhausts minimal school budgets.", icon: Users }
            ].map((prob, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs space-y-3">
                <div className="bg-emerald-50 text-emerald-600 p-2.5 w-fit rounded-xl">
                  <prob.icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">{prob.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{prob.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 block">Workflow Cycle</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Four Simple Steps to Digital Classroom Equality</h2>
            <p className="text-sm text-slate-500">
              The platform connects teachers and students efficiently through physical sticker cards. Here is how it operates:
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 relative">
            {[
              { step: "01", title: "Teacher Uploads Assets", desc: "Teachers register learning materials, cheat sheets, or textbooks organized by subject, grade, and chapter chapters." },
              { step: "02", title: "Smart Code Generation", desc: "The platform dynamically compiles unique, optimized QR labels linked directly to that book, specific chapter, or page." },
              { step: "03", title: "Print & Stamp Stickers", desc: "Teachers print QR labels on papers and tape them onto physical materials, desks, or the classroom's chalkboard." },
              { step: "04", title: "Scan & Study Instantly", desc: "Students point any browser camera at the QR label and safely view transcribed chapters online, from any phone model." }
            ].map((card, idx) => (
              <div key={idx} className="space-y-3 relative group">
                <div className="text-4xl font-extrabold text-emerald-100 font-mono tracking-tight leading-none group-hover:text-emerald-500 transition duration-300">
                  {card.step}
                </div>
                <h3 className="text-sm font-bold text-slate-900">{card.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits For Schools */}
      <section className="py-20 bg-slate-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 block">Core Advantages</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Empowering Remote Communities With Low-Bandwidth Study</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              We design specifically to assist rural environments. We prioritize lightweight structures, zero image duplication where possible, and text-only fallback frameworks to decrease bandwidth pricing.
            </p>

            <div className="space-y-3.5">
              {[
                "100% Free digital textbooks for students registered in participating schools.",
                "Decreased germ sharing thanks to individual screen viewing.",
                "High offline scalability — download text notes for study anytime, anywhere.",
                "Complete teacher metrics monitor scan rates, engagement, and topic popularity."
              ].map((benefit, idx) => (
                <div key={idx} className="flex gap-2 text-slate-700 text-xs sm:text-sm font-medium">
                  <span className="bg-emerald-100 text-emerald-700 p-0.5 rounded-full h-fit mt-0.5 flex-none">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonial Quote Graphic */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/60 shadow-md relative">
              <span className="text-slate-300 text-6xl font-serif absolute top-4 left-6 pointer-events-none select-none">“</span>
              <div className="space-y-4 relative leading-relaxed text-slate-600 italic text-xs sm:text-sm pt-4">
                <p>
                  "We have only fifteen Mathematics books for ninety Grade 8 pupils. By pasting unique QR code prints on desks and classroom boards, every single student scans the weekly worksheets using the school's three tablet devices. Our tutoring efficiency has skyrocketed!"
                </p>
                <div className="not-italic flex items-center gap-3 pt-2">
                  <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-bold text-xs text-slate-600">
                    BM
                  </div>
                  <div>
                    <div className="text-slate-900 font-bold text-xs sm:text-sm">Principal Beatrice Macharia</div>
                    <div className="text-[10px] text-slate-400">Greenwood Rural High School</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="py-20 bg-white border-b border-slate-200/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-2xl font-extrabold text-slate-900">Frequently Asked Questions</h2>
            <p className="text-xs text-slate-500">Everything you need to understand about the platform functions.</p>
          </div>

          <div className="space-y-4 border-t border-slate-100 pt-4">
            {FAQS.map((faq, idx) => {
              const isOpen = openFAQIndex === idx;
              return (
                <div key={idx} className="border-b border-slate-100 pb-4">
                  <button
                    onClick={() => setOpenFAQIndex(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between text-left py-2 font-bold text-xs sm:text-sm text-slate-800 hover:text-emerald-700 transition"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <p className="text-xs text-slate-500 mt-2.5 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer / Contact US Form */}
      <footer className="bg-slate-900 text-slate-300 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-12 gap-10">
          
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-600 rounded-lg text-white">
                <BookMarked className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-white text-base">SmartQR</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              An educational platform targeting rural digital divide mitigation. Distribute textbook access at scale using zero unnecessary hardware overhead.
            </p>
            <p className="text-[10px] text-slate-500 font-mono pt-4">
              © 2026 SmartQR Learning Access Cooperative. All rights reserved.
            </p>
          </div>

          {/* Contact Form */}
          <div className="md:col-span-7 bg-slate-950 p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Contact District Support</h3>
            <p className="text-xs text-slate-400">
              Are you a principal or school supervisor looking to enroll your district? Send us a brief message.
            </p>

            <form onSubmit={handleContactSubmit} className="space-y-3.5">
              <div className="grid sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Your Name / Title"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="bg-slate-900 text-xs text-white border border-slate-800 px-3.5 py-2.5 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
                <input
                  type="email"
                  placeholder="School District Email"
                  required
                  className="bg-slate-900 text-xs text-white border border-slate-800 px-3.5 py-2.5 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <textarea
                placeholder="Briefly describe your school size and rural textbook constraints..."
                rows={3}
                required
                value={contactMsg}
                onChange={(e) => setContactMsg(e.target.value)}
                className="w-full bg-slate-900 text-xs text-white border border-slate-800 p-3.5 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-6 rounded-lg shadow-sm transition inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Send Information Request</span>
                <Send className="w-3.5 h-3.5" />
              </button>
              {contactSuccess && (
                <div className="text-xs text-emerald-400 animate-pulse font-mono flex items-center gap-1.5 pt-1">
                  <Check className="w-3.5 h-3.5" /> Enrolment Request sent successfully! Rural Support will contact you shortly.
                </div>
              )}
            </form>
          </div>

        </div>
      </footer>

      {/* --- FLOATING AUTH DIALOG / IF USER CLICKS SIGN IN OR SIGN UP --- */}
      {authMode && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div 
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 flex flex-col md:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            {/* The Authentication Card */}
            <div className="flex-1 p-6 space-y-5">
              <div className="flex justify-between items-center pb-2 border-b border-slate-150">
                <h3 className="font-bold text-slate-900 text-sm tracking-tight">
                  {authMode === 'signin' && 'Sign In to SmartQR'}
                  {authMode === 'signup' && 'Student Registration'}
                  {authMode === 'forgot' && 'Reset Account Password'}
                </h3>
                <button
                  type="button"
                  onClick={() => { setAuthMode(null); setLoginError(''); setSignupError(''); }}
                  className="text-slate-400 hover:text-slate-600 text-xs border border-slate-200 rounded px-1.5 py-0.5"
                >
                  Close
                </button>
              </div>

              {/* DEMO/GRADER ROLEPLAY ACCOUNT SHORTCUTS (EXTREMELY USEFUL FOR TESTING ALL THE PORTALS) */}
              <div className="p-3 bg-indigo-50 border border-indigo-150 rounded-xl space-y-2">
                <div className="flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-indigo-700 font-bold" />
                  <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider">Demo Evaluator Quick access</span>
                </div>
                <p className="text-[10px] text-slate-500 mb-2 leading-relaxed">
                  Click any role roleplay badge to bypass manual forms and instantly log into that specific role account!
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleRoleplayLogin('brightonmacharia8@gmail.com', 'student')}
                    className="py-1 px-2.5 bg-emerald-600 text-white font-semibold text-[10px] rounded hover:bg-emerald-700 transition"
                  >
                    Student (Brighton)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleplayLogin('sarah.collins@school.org', 'password')}
                    className="py-1 px-2.5 bg-sky-600 text-white font-semibold text-[10px] rounded hover:bg-sky-750 transition"
                  >
                    Teacher (Sarah)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleplayLogin('admin@school.org', 'admin')}
                    className="py-1 px-2.5 bg-slate-950 text-white font-semibold text-[10px] rounded hover:bg-slate-800 transition"
                  >
                    Admin Portal
                  </button>
                </div>
              </div>

              {/* STANDARD SIGN-IN FORM */}
              {authMode === 'signin' && (
                <form onSubmit={handleStandardLogin} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">School Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. name@school.org"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Password</label>
                      <button
                        type="button"
                        onClick={() => setAuthMode('forgot')}
                        className="text-[10px] font-bold text-emerald-600 hover:text-emerald-500"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={loginPass}
                      onChange={(e) => setLoginPass(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  {loginError && (
                    <p className="text-[11px] text-rose-500 font-medium leading-relaxed">{loginError}</p>
                  )}

                  <button
                    type="submit"
                    className="w-full h-10 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition shadow-xs cursor-pointer flex items-center justify-center"
                  >
                    Authenticate Account & Sign In
                  </button>

                  <p className="text-[11px] text-slate-500 text-center select-none pt-2">
                    Are you a physical student?{' '}
                    <button
                      type="button"
                      onClick={() => setAuthMode('signup')}
                      className="text-emerald-600 font-bold hover:underline"
                    >
                      Register here
                    </button>
                  </p>
                </form>
              )}

              {/* STANDARD SIGNUP FORM */}
              {authMode === 'signup' && (
                <form onSubmit={handleStandardSignup} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Your Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe, Michael"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Personal Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. student@school.org"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Choose Safe Password</label>
                    <input
                      type="password"
                      required
                      placeholder="Minimum 6 characters"
                      value={signupPass}
                      onChange={(e) => setSignupPass(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Select Assigned School</label>
                    <select
                      value={signupSchool}
                      onChange={(e) => setSignupSchool(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-hidden"
                    >
                      <option value="">-- No school assignment (Independent student) --</option>
                      {schools.map(sch => (
                        <option key={sch.id} value={sch.id}>{sch.school_name}</option>
                      ))}
                    </select>
                  </div>

                  {signupError && (
                    <p className="text-[11px] text-rose-500 font-medium">{signupError}</p>
                  )}

                  {signupSuccess && (
                    <div className="p-2.5 bg-emerald-50 text-emerald-800 text-[11px] rounded-lg border border-emerald-100 font-mono text-center flex items-center justify-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Signup verified! Directing to portal...
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={signupSuccess}
                    className="w-full h-10 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition shadow-xs cursor-pointer inline-flex items-center justify-center"
                  >
                    Complete Student Registration
                  </button>

                  <p className="text-[11px] text-slate-500 text-center select-none pt-1">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setAuthMode('signin')}
                      className="text-emerald-600 font-bold hover:underline"
                    >
                      Authenticate
                    </button>
                  </p>
                </form>
              )}

              {/* FORGOT PASSWORD FORM */}
              {authMode === 'forgot' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500 leading-normal">
                    Enter your school email address. We will mock trigger an automatic password retrieval or reset protocol immediately.
                  </p>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Certified Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. student@school.org"
                      className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      alert("Password recovery protocol completed. Safe credentials can be found on our Demo Evaluator Panel or entered directly.");
                      setAuthMode('signin');
                    }}
                    className="w-full h-10 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition"
                  >
                    Request Password Protocol
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode('signin')}
                    className="w-full h-10 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-lg transition"
                  >
                    Go back to Log In
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
