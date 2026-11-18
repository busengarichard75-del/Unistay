// src/components/library/StudyVibesModal.tsx
"use client";

import { useState } from "react";
import { X, Sparkles, RefreshCw, Coffee, ArrowRight, ArrowLeft, Search, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { LibraryEntry } from "@/types/library";
import { LibraryCard } from "./LibraryCard";

interface StudyVibesModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: LibraryEntry[];
}

type Urgency = "exam" | "quick" | "deep" | "browsing" | null;
type Format = "Any" | "past_papers" | "notes" | "summaries" | "guides";

export function StudyVibesModal({ isOpen, onClose, entries }: StudyVibesModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  
  // Step 1: Vibe
  const [urgency, setUrgency] = useState<Urgency>(null);
  
  // Step 2: Target
  const [course, setCourse] = useState("");
  const [topic, setTopic] = useState("");
  
  // Step 3: Timeline
  const [year, setYear] = useState<string>("Any");
  const [semester, setSemester] = useState<string>("Any");

  // Step 4: Format
  const [format, setFormat] = useState<Format>("Any");

  // Results State
  const [results, setResults] = useState<LibraryEntry[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const years = ["Any", "1st Year", "2nd Year", "3rd Year", "4th Year", "Postgrad"];
  const semesters = ["Any", "1", "2"];

  // Auto-suggest format based on urgency
  const handleSetUrgency = (vibe: Urgency) => {
    setUrgency(vibe);
    if (vibe === "exam") setFormat("past_papers");
    else if (vibe === "quick") setFormat("summaries");
    else if (vibe === "deep") setFormat("notes");
    else setFormat("Any");
    setStep(2);
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setStep(5); // Loading & Results step
    setFallbackMessage(null);

    // Simulate AI scan
    setTimeout(() => {
      let filtered = [...entries];

      // 1. Filter by Course Code or Title
      const qCourse = course.toLowerCase().trim();
      if (qCourse) {
        filtered = filtered.filter(e => 
          (e.courseCode && e.courseCode.toLowerCase().includes(qCourse)) || 
          e.title.toLowerCase().includes(qCourse)
        );
      }

      // 2. Filter by Specific Topic (if provided)
      const qTopic = topic.toLowerCase().trim();
      if (qTopic) {
        const topicMatches = filtered.filter(e => 
          e.title.toLowerCase().includes(qTopic) || 
          (e.description && e.description.toLowerCase().includes(qTopic))
        );
        
        if (topicMatches.length > 0) {
          filtered = topicMatches;
        } else {
          // SMART FALLBACK: They asked for a topic, but it doesn't exist. 
          // Keep the course matches and warn them.
          setFallbackMessage(`We couldn't find materials specifically for "${topic}", but here are the materials for your course.`);
        }
      }

      // 3. Filter by Year
      if (year !== "Any") {
        filtered = filtered.filter(e => e.year === year);
      }

      // 4. Filter by Semester
      if (semester !== "Any") {
        filtered = filtered.filter(e => e.semester === semester);
      }

      // 5. Filter by Format (if they selected a specific one)
      if (format !== "Any") {
        filtered = filtered.filter(e => e.category === format);
      }

      // Final safety check: If absolutely nothing is left, tell them
      if (filtered.length === 0) {
        setFallbackMessage("We couldn't find any exact matches with those strict filters. Try removing the Semester or Topic.");
        // Show them the whole library so it's not empty
        filtered = [...entries].sort(() => 0.5 - Math.random()).slice(0, 3);
      } else {
        // Shuffle and take up to 6
        filtered = filtered.sort(() => 0.5 - Math.random()).slice(0, 6);
      }

      setResults(filtered);
      setIsGenerating(false);
    }, 2000);
  };

  const reset = () => {
    setStep(1);
    setUrgency(null);
    setCourse("");
    setTopic("");
    setYear("Any");
    setSemester("Any");
    setFormat("Any");
    setResults([]);
    setFallbackMessage(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center p-0 sm:p-4" onClick={onClose}>
      <div 
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 px-6 py-6 text-center text-white shrink-0">
          <button onClick={onClose} className="absolute right-4 top-4 rounded-full bg-white/20 p-1.5 text-white hover:bg-white/40 transition-colors">
            <X size={18} />
          </button>
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <Sparkles size={20} className="text-yellow-200" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Study Vibes AI</h2>
          <p className="mt-1 text-xs text-white/90">Let's find the exact material you need right now.</p>
        </div>

        {/* Progress Bar */}
        <div className="flex h-1 w-full bg-gray-100 shrink-0">
          <div className={`h-full bg-purple-600 transition-all duration-500 ${
            step === 1 ? 'w-1/4' : step === 2 ? 'w-2/4' : step === 3 ? 'w-3/4' : 'w-full'
          }`} />
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 min-h-[350px]">
          
          {/* STEP 1: URGENCY */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <h3 className="text-center text-lg font-bold text-gray-900">What is your current situation?</h3>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handleSetUrgency("exam")} className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-gray-100 bg-gray-50 p-4 transition-all hover:border-red-400 hover:bg-red-50">
                  <span className="text-3xl">🚨</span>
                  <span className="font-semibold text-gray-800 text-sm text-center">Exam Tomorrow</span>
                </button>
                <button onClick={() => handleSetUrgency("quick")} className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-gray-100 bg-gray-50 p-4 transition-all hover:border-amber-400 hover:bg-amber-50">
                  <span className="text-3xl">⚡</span>
                  <span className="font-semibold text-gray-800 text-sm text-center">Quick Revision</span>
                </button>
                <button onClick={() => handleSetUrgency("deep")} className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-gray-100 bg-gray-50 p-4 transition-all hover:border-blue-400 hover:bg-blue-50">
                  <span className="text-3xl">🧠</span>
                  <span className="font-semibold text-gray-800 text-sm text-center">Deep Study</span>
                </button>
                <button onClick={() => handleSetUrgency("browsing")} className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-gray-100 bg-gray-50 p-4 transition-all hover:border-purple-400 hover:bg-purple-50">
                  <span className="text-3xl">☕</span>
                  <span className="font-semibold text-gray-800 text-sm text-center">Just Browsing</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: TARGET */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-900">What are you studying?</h3>
                <p className="text-xs text-gray-500">Be as specific as possible so we don't give you the wrong material.</p>
              </div>
              
              <div className="space-y-4 max-w-sm mx-auto">
                <div>
                  <label className="mb-1 block text-xs font-bold text-gray-700 uppercase tracking-wider">Course Code or Name</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="text" 
                      value={course} 
                      onChange={(e) => setCourse(e.target.value)} 
                      placeholder="e.g. CS101, Biology, Accounting..." 
                      className="w-full rounded-xl border-2 border-gray-200 pl-10 pr-3 py-3 text-sm font-medium focus:border-purple-500 focus:outline-none" 
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-gray-700 uppercase tracking-wider">Specific Topic (Optional)</label>
                  <input 
                    type="text" 
                    value={topic} 
                    onChange={(e) => setTopic(e.target.value)} 
                    placeholder="e.g. Calculus, Cell Division..." 
                    className="w-full rounded-xl border-2 border-gray-200 px-3 py-3 text-sm font-medium focus:border-purple-500 focus:outline-none" 
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-between items-center max-w-sm mx-auto pt-2">
                <button onClick={() => setStep(1)} className="flex items-center gap-1 text-sm font-bold text-gray-500 hover:text-gray-900">
                  <ArrowLeft size={16} /> Back
                </button>
                <button onClick={() => setStep(3)} className="flex items-center gap-2 rounded-full bg-gray-900 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-black transition-transform hover:scale-105 active:scale-95">
                  Next <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: TIMELINE */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-900">When are you taking this?</h3>
                <p className="text-xs text-gray-500">This ensures we don't show you a 3rd-year paper for a 1st-year class.</p>
              </div>
              
              <div className="space-y-4 max-w-sm mx-auto">
                <div>
                  <label className="mb-1 block text-xs font-bold text-gray-700 uppercase tracking-wider">Year of Study</label>
                  <select 
                    value={year} 
                    onChange={(e) => setYear(e.target.value)} 
                    className="w-full rounded-xl border-2 border-gray-200 px-3 py-3 text-sm font-medium focus:border-purple-500 focus:outline-none bg-white cursor-pointer"
                  >
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-gray-700 uppercase tracking-wider">Semester</label>
                  <select 
                    value={semester} 
                    onChange={(e) => setSemester(e.target.value)} 
                    className="w-full rounded-xl border-2 border-gray-200 px-3 py-3 text-sm font-medium focus:border-purple-500 focus:outline-none bg-white cursor-pointer"
                  >
                    <option value="Any">Any Semester</option>
                    <option value="1">Semester 1</option>
                    <option value="2">Semester 2</option>
                  </select>
                </div>
              </div>

              <div className="mt-8 flex justify-between items-center max-w-sm mx-auto pt-2">
                <button onClick={() => setStep(2)} className="flex items-center gap-1 text-sm font-bold text-gray-500 hover:text-gray-900">
                  <ArrowLeft size={16} /> Back
                </button>
                <button onClick={() => setStep(4)} className="flex items-center gap-2 rounded-full bg-gray-900 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-black transition-transform hover:scale-105 active:scale-95">
                  Next <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: FORMAT */}
          {step === 4 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-900">What format do you need?</h3>
                <p className="text-xs text-gray-500">We pre-selected this based on your urgency, but you can change it.</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                {[
                  { id: "past_papers", label: "Past Papers", icon: "📝" },
                  { id: "notes", label: "Full Notes", icon: "📖" },
                  { id: "summaries", label: "Summaries", icon: "📄" },
                  { id: "guides", label: "Study Guides", icon: "🧭" },
                  { id: "Any", label: "Any Format", icon: "✨" }
                ].map(f => (
                  <button 
                    key={f.id}
                    onClick={() => setFormat(f.id as Format)}
                    className={`flex items-center gap-3 rounded-xl border-2 p-3 transition-all ${
                      format === f.id ? "border-purple-600 bg-purple-50" : "border-gray-100 bg-white hover:border-gray-300"
                    }`}
                  >
                    <span className="text-2xl">{f.icon}</span>
                    <span className={`text-sm font-bold ${format === f.id ? "text-purple-700" : "text-gray-700"}`}>{f.label}</span>
                    {format === f.id && <CheckCircle2 size={16} className="ml-auto text-purple-600" />}
                  </button>
                ))}
              </div>

              <div className="mt-8 flex justify-between items-center max-w-md mx-auto pt-2">
                <button onClick={() => setStep(3)} className="flex items-center gap-1 text-sm font-bold text-gray-500 hover:text-gray-900">
                  <ArrowLeft size={16} /> Back
                </button>
                <button onClick={handleGenerate} className="flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 px-8 py-3 text-sm font-bold text-white shadow-lg hover:opacity-90 transition-transform hover:scale-105 active:scale-95">
                  <Sparkles size={16} /> Generate Plan
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: LOADING & RESULTS */}
          {step === 5 && (
            <div className="animate-in fade-in">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 animate-ping rounded-full bg-purple-400 opacity-20"></div>
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                      <RefreshCw size={28} className="animate-spin" />
                    </div>
                  </div>
                  <p className="font-bold text-lg text-gray-900">Scanning {entries.length} materials...</p>
                  <p className="text-sm text-gray-500 mt-1">Finding exact matches for {course || "your course"}...</p>
                </div>
              ) : (
                <div className="space-y-4 animate-in slide-in-from-bottom-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Sparkles className="text-purple-500" size={18} /> Your Custom Plan
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {course ? <span className="font-bold text-gray-800">{course}</span> : "All Courses"} 
                        {year !== "Any" && ` · ${year}`}
                        {semester !== "Any" && ` · Sem ${semester}`}
                      </p>
                    </div>
                    <button onClick={reset} className="text-xs font-bold text-purple-600 hover:underline bg-purple-50 px-3 py-1.5 rounded-full shrink-0">
                      Start Over
                    </button>
                  </div>
                  
                  {fallbackMessage && (
                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 flex items-start gap-2">
                      <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-500" />
                      <p>{fallbackMessage}</p>
                    </div>
                  )}

                  {results.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                      <Coffee size={32} className="mx-auto mb-2 opacity-50" />
                      <p>No materials found. Try removing the Semester or Topic.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
                      {results.map(entry => (
                        <LibraryCard key={entry.id} entry={entry} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}