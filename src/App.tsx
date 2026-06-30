import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  Settings, 
  ChevronRight, 
  Volume2, 
  VolumeX, 
  Square, 
  Bookmark, 
  BookmarkCheck, 
  Languages, 
  X, 
  Plus, 
  Trash2, 
  Globe, 
  Cpu, 
  Trophy, 
  Dna, 
  HeartPulse, 
  Sparkles, 
  HelpCircle, 
  User, 
  ExternalLink,
  RotateCcw,
  Radio
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { NewsArticle, InterestTopic, FeedResponse } from "./types";

export default function App() {
  // Navigation & Category states
  const [activeTab, setActiveTab] = useState<string>("home");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showSearchInput, setShowSearchInput] = useState<boolean>(false);
  
  // Feed & Loading states
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [personalizedBriefing, setPersonalizedBriefing] = useState<string>("");
  const [groundingSources, setGroundingSources] = useState<Array<{ title: string; uri: string }>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Saved Bookmarks & Custom Interest Topics
  const [bookmarks, setBookmarks] = useState<NewsArticle[]>(() => {
    const saved = localStorage.getItem("news_bookmarks");
    return saved ? JSON.parse(saved) : [];
  });
  
  const [interests, setInterests] = useState<InterestTopic[]>(() => {
    const saved = localStorage.getItem("news_interests");
    return saved ? JSON.parse(saved) : [
      { id: "1", name: "Artificial Intelligence", addedAt: new Date().toISOString() },
      { id: "2", name: "World Cup 2026", addedAt: new Date().toISOString() },
      { id: "3", name: "Space Exploration", addedAt: new Date().toISOString() }
    ];
  });
  const [newInterestInput, setNewInterestInput] = useState<string>("");

  // Active Reading Article state
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [readerLanguage, setReaderLanguage] = useState<string>("Original");
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [translatedTitle, setTranslatedTitle] = useState<string>("");
  const [translatedContent, setTranslatedContent] = useState<string>("");

  // Audio / Speech states
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [isAudioLoading, setIsAudioLoading] = useState<boolean>(false);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // User Profile Simulated state
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("Narataniwan");

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem("news_bookmarks", JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    localStorage.setItem("news_interests", JSON.stringify(interests));
    if (activeTab === "following") {
      fetchFeed("following");
    }
  }, [interests]);

  // Fetch feed of news
  const fetchFeed = async (category: string, search: string = "") => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await fetch("/api/news/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          searchQuery: search,
          interests: interests.map(i => i.name)
        })
      });

      if (!response.ok) {
        throw new Error("Failed to load stories from news server");
      }

      const data: FeedResponse & { error?: string } = await response.json();
      setArticles(data.articles);
      if (data.personalizedBriefing) {
        setPersonalizedBriefing(data.personalizedBriefing);
      } else {
        setPersonalizedBriefing("");
      }
      if (data.groundingSources) {
        setGroundingSources(data.groundingSources);
      } else {
        setGroundingSources([]);
      }
      
      if (data.error) {
        setErrorMessage(data.error);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Could not connect to live server. Displaying cached local news.");
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger feed load when active tab changes
  useEffect(() => {
    if (activeTab !== "search") {
      setSearchQuery("");
      fetchFeed(activeTab);
    }
  }, [activeTab]);

  // Handle Search Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setActiveTab("search");
      fetchFeed("search", searchQuery);
    }
  };

  // Save/Unsave Bookmark
  const toggleBookmark = (article: NewsArticle, e: React.MouseEvent) => {
    e.stopPropagation();
    const exists = bookmarks.some(b => b.id === article.id);
    if (exists) {
      setBookmarks(bookmarks.filter(b => b.id !== article.id));
    } else {
      setBookmarks([...bookmarks, article]);
    }
  };

  // Add a custom interest keyword
  const handleAddInterest = (e: React.FormEvent) => {
    e.preventDefault();
    if (newInterestInput.trim()) {
      const exists = interests.some(i => i.name.toLowerCase() === newInterestInput.trim().toLowerCase());
      if (!exists) {
        setInterests([
          ...interests,
          {
            id: Date.now().toString(),
            name: newInterestInput.trim(),
            addedAt: new Date().toISOString()
          }
        ]);
      }
      setNewInterestInput("");
    }
  };

  // Delete interest
  const handleDeleteInterest = (id: string) => {
    setInterests(interests.filter(i => i.id !== id));
  };

  // Read article detail & setup reader state
  const handleOpenArticle = (article: NewsArticle) => {
    setSelectedArticle(article);
    setReaderLanguage("Original");
    setTranslatedTitle("");
    setTranslatedContent("");
    setIsTranslating(false);
    stopSpeaking();
  };

  // Close reader & reset states
  const handleCloseArticle = () => {
    setSelectedArticle(null);
    stopSpeaking();
  };

  // Translate Article
  const handleTranslate = async (lang: string) => {
    if (!selectedArticle) return;
    setReaderLanguage(lang);
    if (lang === "Original") {
      setTranslatedTitle("");
      setTranslatedContent("");
      return;
    }

    setIsTranslating(true);
    try {
      const res = await fetch("/api/news/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: selectedArticle.title,
          content: selectedArticle.content,
          targetLanguage: lang
        })
      });

      if (!res.ok) {
        throw new Error("Translation failed");
      }

      const data = await res.json();
      setTranslatedTitle(data.translatedTitle);
      setTranslatedContent(data.translatedContent);
    } catch (err) {
      console.error(err);
      alert("Translation failed. Please try again.");
      setReaderLanguage("Original");
    } finally {
      setIsTranslating(false);
    }
  };

  // speak article summary (takeaways) using AI Gemini TTS with HTML5 SpeechSynthesis Fallback
  const handleSpeakSummary = async () => {
    if (!selectedArticle) return;
    if (isPlayingAudio) {
      stopSpeaking();
      return;
    }

    const textToSpeak = selectedArticle.bullets 
      ? selectedArticle.bullets.join(". ")
      : selectedArticle.summary;

    setIsAudioLoading(true);

    try {
      const response = await fetch("/api/news/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToSpeak })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.audio) {
          const binaryString = window.atob(data.audio);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
          const buffer = audioContextRef.current.createBuffer(1, bytes.length / 2, 24000);
          const channelData = buffer.getChannelData(0);
          const view = new DataView(bytes.buffer);
          for (let i = 0; i < channelData.length; i++) {
            channelData[i] = view.getInt16(i * 2, true) / 32768.0;
          }

          audioSourceRef.current = audioContextRef.current.createBufferSource();
          audioSourceRef.current.buffer = buffer;
          audioSourceRef.current.connect(audioContextRef.current.destination);
          
          audioSourceRef.current.onended = () => {
            setIsPlayingAudio(false);
          };

          setIsAudioLoading(false);
          setIsPlayingAudio(true);
          audioSourceRef.current.start(0);
          return;
        }
      }
    } catch (err) {
      console.warn("Server TTS failed or not configured, falling back to local SpeechSynthesis:", err);
    }

    // Fallback
    setIsAudioLoading(false);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.onend = () => {
        setIsPlayingAudio(false);
      };
      utterance.onerror = () => {
        setIsPlayingAudio(false);
      };
      speechUtteranceRef.current = utterance;
      setIsPlayingAudio(true);
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Your browser does not support text-to-speech rendering.");
    }
  };

  const stopSpeaking = () => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch (e) {}
      audioSourceRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
  };

  const getFormattedDate = () => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
    return new Date().toLocaleDateString('en-US', options);
  };

  return (
    <div className="min-h-screen bg-[#F5F2ED] text-[#1A1A1A] font-serif selection:bg-[#1A1A1A]/10 selection:text-[#1A1A1A]">
      
      {/* TOP EDITORIAL METADATA STRIP */}
      <div className="border-b border-[#1A1A1A]/10 px-6 py-2.5 text-center text-[9px] tracking-[0.25em] uppercase font-sans font-bold text-stone-500 flex justify-between items-center max-w-5xl mx-auto">
        <span>Vol. CVII — No. 182</span>
        <span className="hidden sm:inline">Grounding: Live Google Search Wire Verified</span>
        <span>Summer Edition 2026</span>
      </div>

      {/* HEADER SECTION */}
      <header className="sticky top-0 bg-[#F5F2ED] z-40 border-b border-[#1A1A1A]/10">
        <div className="flex items-center justify-between px-6 h-20 max-w-5xl mx-auto">
          
          {/* Brand/Logo in Gorgeous Playfair Serif Italic */}
          <div 
            onClick={() => setActiveTab("home")}
            className="flex flex-col cursor-pointer select-none group" 
            data-purpose="logo-container"
          >
            <div className="flex items-center gap-2">
              <img 
                alt="Google News Logo" 
                className="h-6 w-6 object-contain filter grayscale" 
                src="https://lh3.googleusercontent.com/aida/AP1WRLveO-olj8qG7LGyLI-HGzgcilb8tLu7ZL9Iy1OgERiE5TJuwBWSg2GfBmCLgBDXSbQ3lCr_fzrEBG1jVfhM7tCzBZG2DTU89kjCe7VDrq-DyKvhHUAE1KQKfU87OpGN0ymHQXoavEYOY11jGyBLRUoGp3FYBNU_4NdTq-40YSB1xiKbZQDzB-lqHeg4nlsndFzlNLVESdG1wLhAc5IeKjaA8teOKeA8nets2BsoYCW3sPjCqv6yjS8eRJQ"
              />
              <span className="text-3xl font-editorial-serif tracking-tight italic font-light group-hover:opacity-80 transition-opacity">
                Modernist <span className="font-sans text-xs tracking-[0.15em] uppercase font-bold not-italic text-stone-500">Chronicle</span>
              </span>
            </div>
            <span className="text-[9px] font-sans tracking-[0.1em] uppercase font-medium text-stone-400 mt-0.5">
              Intellectual news aggregator powered by Gemini AI
            </span>
          </div>

          {/* Search bar & premium controls */}
          <div className="flex items-center space-x-3 text-[#1A1A1A] flex-1 justify-end">
            <form 
              onSubmit={handleSearchSubmit} 
              className={`flex items-center transition-all duration-300 ${
                showSearchInput ? "w-full max-w-xs bg-[#EAE7E1] border border-[#1A1A1A]/10 px-3 py-1.5" : "w-auto"
              }`}
            >
              <button 
                type="button"
                onClick={() => setShowSearchInput(!showSearchInput)} 
                className="p-1 hover:bg-[#EAE7E1] transition-colors flex items-center justify-center text-[#1A1A1A]"
                aria-label="Toggle Search"
              >
                <Search className="w-5 h-5 stroke-[1.5]" />
              </button>
              
              <input 
                type="text"
                placeholder="Inquire keywords or publications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`outline-none bg-transparent text-xs tracking-wider uppercase font-sans text-[#1A1A1A] placeholder-stone-400 transition-all ${
                  showSearchInput ? "w-full ml-2 block" : "hidden"
                }`}
              />
              
              {showSearchInput && searchQuery && (
                <button 
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-stone-400 hover:text-stone-700 p-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </form>

            {/* Saved Library Trigger */}
            <button 
              onClick={() => setActiveTab("bookmarks")}
              className={`p-2 hover:bg-[#EAE7E1] transition-colors relative ${activeTab === "bookmarks" ? "text-stone-900 font-bold" : "text-stone-500"}`}
              title="Saved Dispatch"
            >
              <Bookmark className="w-5 h-5 stroke-[1.5]" />
              {bookmarks.length > 0 && (
                <span className="absolute top-1 right-1 bg-[#1A1A1A] text-[#F5F2ED] text-[8px] w-4 h-4 flex items-center justify-center font-sans font-bold">
                  {bookmarks.length}
                </span>
              )}
            </button>

            {/* Profile trigger */}
            <button 
              onClick={() => setShowProfileModal(true)}
              className="p-0.5 border border-[#1A1A1A]/20 hover:border-[#1A1A1A] transition-colors flex items-center justify-center"
              title="Personalization settings"
            >
              <div className="w-7 h-7 bg-[#E5E2DD] text-[#1A1A1A] font-sans font-semibold text-xs flex items-center justify-center uppercase">
                {username.charAt(0)}
              </div>
            </button>
          </div>
        </div>

        {/* ELEGANT NAVIGATION TABS (STRETCHED AND SPACED) */}
        <div className="border-t border-[#1A1A1A]/10 bg-[#F5F2ED]">
          <nav className="max-w-5xl mx-auto px-6 flex items-center overflow-x-auto whitespace-nowrap scrollbar-hide">
            <div className="flex space-x-8 text-xs tracking-[0.2em] uppercase font-sans font-medium py-1 select-none text-stone-600">
              {[
                { id: "home", label: "Briefing" },
                { id: "foryou", label: "For You", badge: "AI" },
                { id: "following", label: "Radar" },
                { id: "world", label: "World" },
                { id: "tech", label: "Technology" },
                { id: "sports", label: "Sports" },
                { id: "science", label: "Science" },
                { id: "health", label: "Health" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative py-3 transition-all ${
                    activeTab === tab.id 
                      ? "text-[#1A1A1A] active-editorial-tab font-bold" 
                      : "hover:text-[#1A1A1A]"
                  } flex items-center gap-1`}
                >
                  {tab.label}
                  {tab.badge && (
                    <span className="border border-[#1A1A1A]/30 text-[#1A1A1A] text-[7px] font-sans font-bold px-1 py-0.5 scale-90">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="ml-auto pl-4 border-l border-[#1A1A1A]/10 flex items-center shrink-0">
              <span className="text-[10px] tracking-[0.1em] font-sans uppercase text-stone-400 font-bold animate-pulse">
                Wire: Active
              </span>
            </div>
          </nav>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-3xl mx-auto px-6 py-12">
        
        {/* EDITORIAL SECTION TITLES */}
        <section className="mb-14 pb-8 border-b border-[#1A1A1A]/10" data-purpose="briefing-title">
          {activeTab === "home" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <span className="text-xs tracking-[0.25em] uppercase font-sans text-stone-500 block mb-2 italic">The Day's Dispatch</span>
              <h1 className="text-6xl md:text-7xl font-light font-editorial-serif tracking-tight text-[#1A1A1A] leading-none">
                Your <span className="italic">briefing</span>
              </h1>
              <p className="font-sans text-xs tracking-wider uppercase text-stone-400 mt-4 font-bold">{getFormattedDate()}</p>
            </motion.div>
          )}

          {activeTab === "foryou" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <span className="text-xs tracking-[0.25em] uppercase font-sans text-stone-500 block mb-2 italic font-medium">Curated Digest</span>
              <h1 className="text-6xl md:text-7xl font-light font-editorial-serif tracking-tight text-[#1A1A1A] leading-none">
                Curated <span className="italic">for you</span>
              </h1>
              <p className="text-stone-500 mt-3 text-sm italic font-editorial-serif max-w-md">
                Custom, AI-synthesized news coverage matching your aesthetic reading footprint.
              </p>
            </motion.div>
          )}

          {activeTab === "following" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <span className="text-xs tracking-[0.25em] uppercase font-sans text-stone-500 block mb-2 italic">Topic Hub</span>
              <h1 className="text-6xl md:text-7xl font-light font-editorial-serif tracking-tight text-[#1A1A1A] leading-none">
                The <span className="italic">Radar</span>
              </h1>
              <p className="text-stone-500 mt-3 text-sm italic max-w-md">
                Your personalized interest catalog and focused intelligence feeds.
              </p>
            </motion.div>
          )}

          {activeTab === "search" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <span className="text-xs tracking-[0.25em] uppercase font-sans text-stone-500 block mb-2 italic">Inquiry Records</span>
              <h1 className="text-5xl md:text-6xl font-light font-editorial-serif tracking-tight text-[#1A1A1A] leading-none">
                Search <span className="italic">"{searchQuery}"</span>
              </h1>
              <p className="text-stone-500 mt-3 text-xs tracking-widest uppercase font-sans font-bold">
                Powered by live web search and Gemini compilation.
              </p>
            </motion.div>
          )}

          {activeTab === "bookmarks" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <span className="text-xs tracking-[0.25em] uppercase font-sans text-stone-500 block mb-2 italic font-medium">Personal Collection</span>
              <h1 className="text-6xl md:text-7xl font-light font-editorial-serif tracking-tight text-[#1A1A1A] leading-none">
                Saved <span className="italic">Stories</span>
              </h1>
              <p className="text-stone-500 mt-3 text-sm italic max-w-md">
                Read, translate, and synthesize your bookmarked reference logs offline.
              </p>
            </motion.div>
          )}

          {["world", "tech", "sports", "science", "health"].includes(activeTab) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <span className="text-xs tracking-[0.25em] uppercase font-sans text-stone-500 block mb-2 italic capitalize">{activeTab} section</span>
              <h1 className="text-6xl md:text-7xl font-light font-editorial-serif tracking-tight text-[#1A1A1A] leading-none">
                The <span className="italic">{activeTab}</span> reports
              </h1>
              <p className="text-stone-500 mt-3 text-sm italic">The latest headlines, deep dives, and analysis updated hourly.</p>
            </motion.div>
          )}
        </section>

        {/* ERROR / WIRE DISPATCH MESSAGE */}
        {errorMessage && (
          <div className="mb-10 p-4 border-l-2 border-stone-800 bg-[#EAE7E1] text-stone-700 text-xs uppercase tracking-wider font-sans font-bold flex items-center gap-2">
            <Radio className="w-4 h-4 text-stone-800 animate-pulse shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* DYNAMIC FOR YOU INSIGHTS - DESIGNED LIKE EDITORIAL LEAD NARRATIVE */}
        {activeTab === "foryou" && personalizedBriefing && !isLoading && (
          <motion.section 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-16 p-8 border border-[#1A1A1A]/10 bg-[#FAF8F5] relative"
          >
            <div className="absolute top-0 right-10 transform -translate-y-1/2 bg-[#1A1A1A] text-[#F5F2ED] text-[8px] tracking-[0.2em] uppercase px-3 py-1 font-sans font-bold">
              AI Daily Synthesis
            </div>
            
            <span className="text-[10px] tracking-widest uppercase font-sans text-stone-400 block mb-4">Volume Review</span>
            <h2 className="text-3xl font-editorial-serif font-light mb-4 leading-tight italic">
              Welcome back, {username}. Here is today's digest:
            </h2>
            
            <p className="text-stone-700 leading-relaxed font-serif text-base italic border-l-2 border-stone-300 pl-6 whitespace-pre-line">
              {personalizedBriefing}
            </p>

            <div className="mt-8 flex gap-4 pt-6 border-t border-[#1A1A1A]/10">
              <button 
                onClick={() => {
                  if (articles.length > 0) {
                    handleOpenArticle(articles[0]);
                  }
                }}
                className="px-6 py-2.5 border border-[#1A1A1A] bg-[#1A1A1A] text-[#F5F2ED] text-[9px] tracking-widest uppercase font-sans hover:bg-transparent hover:text-[#1A1A1A] transition-colors"
              >
                Lead Story Deep Dive
              </button>
              <button 
                onClick={() => {
                  setActiveTab("following");
                }}
                className="px-5 py-2.5 border border-[#1A1A1A]/20 text-[#1A1A1A] text-[9px] tracking-widest uppercase font-sans hover:border-[#1A1A1A] transition-colors"
              >
                Refine Radar Topics
              </button>
            </div>
          </motion.section>
        )}

        {/* RADAR KEYWORDS EDITOR (MINIMALIST ESSAY COMPOSER STYLE) */}
        {activeTab === "following" && (
          <section className="mb-12 p-8 bg-[#EAE7E1]/50 border border-[#1A1A1A]/10">
            <h2 className="font-editorial-serif font-light text-2xl text-gray-900 mb-2 italic">Refining Your Inquiry Scope</h2>
            <p className="text-stone-500 text-xs tracking-wider uppercase font-sans font-bold mb-6">Enter key concepts to adjust search arrays</p>
            
            <form onSubmit={handleAddInterest} className="flex gap-2 mb-6">
              <input 
                type="text" 
                placeholder="Add concept (e.g. AI logic, Climate, Football...)"
                value={newInterestInput}
                onChange={(e) => setNewInterestInput(e.target.value)}
                className="bg-white border border-[#1A1A1A]/10 text-xs tracking-widest uppercase font-sans px-4 py-3 outline-none flex-1 focus:border-[#1A1A1A]"
              />
              <button 
                type="submit" 
                className="bg-[#1A1A1A] text-[#F5F2ED] text-[10px] uppercase tracking-widest font-sans font-bold px-6 py-3 hover:bg-stone-800 transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Append
              </button>
            </form>

            <div className="flex flex-wrap gap-2">
              {interests.map(topic => (
                <span 
                  key={topic.id} 
                  className="bg-white border border-[#1A1A1A]/10 text-stone-700 text-[10px] tracking-widest uppercase font-sans font-medium px-3 py-1.5 flex items-center gap-2 shadow-2xs hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-colors group cursor-pointer"
                  onClick={() => handleDeleteInterest(topic.id)}
                  title="Click to remove"
                >
                  <span>{topic.name}</span>
                  <X className="w-3 h-3 text-stone-400 group-hover:text-red-600 transition-colors" />
                </span>
              ))}
              {interests.length === 0 && (
                <p className="text-stone-400 text-xs italic">Your radar catalog is empty. Append concepts to tailor the wire feed.</p>
              )}
            </div>
          </section>
        )}

        {/* NEWS FEED SECTION */}
        <section>
          {/* Section Heading like "Top Stories" with minimalist chevron */}
          <div className="flex items-center gap-2 mb-8 group cursor-pointer w-fit" data-purpose="section-header">
            <h2 className="text-[#1A1A1A] text-xs tracking-[0.25em] uppercase font-sans font-bold border-b border-stone-300 pb-1">
              {activeTab === "bookmarks" ? "Saved Despatches" : "Lead Narratives"}
            </h2>
            <ChevronRight className="w-4 h-4 text-stone-600 group-hover:translate-x-0.5 transition-transform" />
          </div>

          {/* Loading Animation */}
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-4">
              <div className="w-8 h-8 border-t-2 border-[#1A1A1A] rounded-full animate-spin"></div>
              <p className="text-[10px] tracking-widest uppercase font-sans text-stone-500 animate-pulse font-bold">Inquiring global telegraph lines...</p>
            </div>
          ) : (
            <div className="space-y-16" data-purpose="news-feed">
              
              {/* Empty state handlers */}
              {articles.length === 0 && activeTab !== "bookmarks" && (
                <div className="py-16 text-center border border-[#1A1A1A]/10 bg-[#EAE7E1]/20">
                  <Globe className="w-8 h-8 text-stone-400 mx-auto mb-3 stroke-[1]" />
                  <p className="text-[#1A1A1A] font-editorial-serif italic text-lg">No active dispatch found.</p>
                  <p className="text-stone-400 text-xs uppercase tracking-widest font-sans mt-2">Adjust search terms or radar settings.</p>
                </div>
              )}

              {activeTab === "bookmarks" && bookmarks.length === 0 && (
                <div className="py-16 text-center border border-[#1A1A1A]/10 bg-[#EAE7E1]/20">
                  <Bookmark className="w-8 h-8 text-stone-400 mx-auto mb-3 stroke-[1]" />
                  <p className="text-[#1A1A1A] font-editorial-serif italic text-lg">Your dispatch library is currently empty.</p>
                  <p className="text-stone-400 text-xs uppercase tracking-widest font-sans mt-2">Click the bookmark seal on articles to store them here.</p>
                </div>
              )}

              {/* Mapping Editorial Articles */}
              {(activeTab === "bookmarks" ? bookmarks : articles).map((article, index) => {
                
                // FEATURED COVER STORY (Large format image, matching Brazil mockup)
                if (article.featured) {
                  return (
                    <motion.article 
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      key={article.id}
                      onClick={() => handleOpenArticle(article)}
                      className="relative group cursor-pointer border-b border-[#1A1A1A]/10 pb-14 last:border-0 last:pb-0"
                      data-purpose="article-card-featured"
                    >
                      {/* Source/Meta Stamp */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-[#1A1A1A]/10 flex items-center justify-center overflow-hidden">
                            {article.sourceIconUrl ? (
                              <img src={article.sourceIconUrl} className="w-full h-full object-cover filter grayscale" alt={article.source} />
                            ) : (
                              <div className="w-2.5 h-2.5 bg-[#1A1A1A] rounded-full"></div>
                            )}
                          </div>
                          <span className="text-[10px] tracking-widest uppercase font-sans font-bold text-stone-500">{article.source}</span>
                          <span className="text-stone-300">•</span>
                          <span className="text-[9px] tracking-widest uppercase font-sans text-stone-400">{article.time}</span>
                        </div>

                        <button 
                          onClick={(e) => toggleBookmark(article, e)}
                          className="p-1.5 hover:bg-[#EAE7E1] transition-colors text-stone-400 hover:text-stone-800"
                        >
                          {bookmarks.some(b => b.id === article.id) ? (
                            <BookmarkCheck className="w-4.5 h-4.5 text-stone-900 fill-stone-900" />
                          ) : (
                            <Bookmark className="w-4.5 h-4.5 stroke-[1.5]" />
                          )}
                        </button>
                      </div>

                      {/* Header headline link */}
                      <div className="mb-6">
                        <h3 className="text-3xl md:text-5xl leading-[1.1] tracking-tight text-[#1A1A1A] font-editorial-serif font-light hover:italic transition-all duration-300">
                          {article.title} <span className="inline-block text-stone-400 font-sans font-light tracking-wide text-2xl">→</span>
                        </h3>
                      </div>

                      {/* Cover Story Hero Image */}
                      {article.imageUrl && (
                        <div className="overflow-hidden mb-6 aspect-[16/9] bg-stone-100 border border-[#1A1A1A]/10 relative">
                          <img 
                            alt={article.title} 
                            className="w-full h-full object-cover grayscale contrast-[1.05] group-hover:scale-105 group-hover:grayscale-0 transition-all duration-700" 
                            src={article.imageUrl}
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-3 left-3 bg-[#1A1A1A] text-[#F5F2ED] text-[7px] tracking-[0.2em] uppercase px-2 py-0.5 font-sans font-bold">
                            Cover Narrative
                          </div>
                        </div>
                      )}

                      {/* Summary intro */}
                      <p className="text-[#1A1A1A]/80 font-editorial-serif italic text-lg leading-relaxed max-w-2xl border-l-2 border-stone-300 pl-6 mb-4">
                        {article.summary}
                      </p>

                      <span className="text-[9px] tracking-[0.2em] uppercase font-sans font-bold text-stone-400">
                        Section: {article.category}
                      </span>
                    </motion.article>
                  );
                }

                // REGULAR EDITORIAL BLOCK CARD (E.g. ASEAN style text focused)
                return (
                  <motion.article 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    key={article.id}
                    onClick={() => handleOpenArticle(article)}
                    className="relative group cursor-pointer border-b border-[#1A1A1A]/10 pb-10 last:border-0 last:pb-0"
                    data-purpose="article-card"
                  >
                    <div className="flex gap-6 items-start">
                      <div className="flex-1">
                        
                        {/* Source metadata header */}
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-4.5 h-4.5 bg-[#1A1A1A]/10 flex items-center justify-center overflow-hidden">
                            {article.sourceIconUrl ? (
                              <img src={article.sourceIconUrl} className="w-full h-full object-cover filter grayscale" alt={article.source} />
                            ) : (
                              <div className="text-[7px] font-sans font-bold uppercase">{article.source.charAt(0)}</div>
                            )}
                          </div>
                          <span className="text-[10px] tracking-widest uppercase font-sans font-bold text-stone-500">{article.source}</span>
                          <span className="text-stone-300">•</span>
                          <span className="text-[9px] tracking-widest uppercase font-sans text-stone-400 font-medium">{article.time}</span>
                        </div>

                        {/* Title text */}
                        <h3 className="text-2xl md:text-3xl font-editorial-serif text-gray-900 leading-snug font-medium mb-3 group-hover:italic transition-all duration-200">
                          {article.title}
                        </h3>
                        
                        {/* Summary description */}
                        <p className="text-stone-600 text-sm leading-relaxed font-serif max-w-xl mb-4 italic">
                          {article.summary}
                        </p>
                      </div>

                      {/* Thumbnail frame (no-rounded, minimal border) */}
                      {article.imageUrl && (
                        <div className="w-24 h-24 md:w-32 md:h-32 overflow-hidden shrink-0 bg-stone-100 border border-[#1A1A1A]/10 hidden sm:block">
                          <img 
                            src={article.imageUrl} 
                            alt={article.title} 
                            className="w-full h-full object-cover filter grayscale contrast-110 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500" 
                            referrerPolicy="no-referrer" 
                          />
                        </div>
                      )}
                    </div>

                    {/* Footer bar inside card */}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[8px] tracking-[0.2em] uppercase font-sans font-extrabold text-stone-400">
                        {article.category}
                      </span>

                      <button 
                        onClick={(e) => toggleBookmark(article, e)}
                        className="p-1 hover:bg-[#EAE7E1] transition-colors text-stone-400 hover:text-stone-800 animate-fade"
                      >
                        {bookmarks.some(b => b.id === article.id) ? (
                          <BookmarkCheck className="w-4 h-4 text-stone-900 fill-stone-900" />
                        ) : (
                          <Bookmark className="w-4 h-4 stroke-[1.5]" />
                        )}
                      </button>
                    </div>
                  </motion.article>
                );
              })}

            </div>
          )}
        </section>

        {/* BOTTOM VINTAGE FOOTER */}
        {!isLoading && (
          <div className="mt-20 pt-10 border-t border-[#1A1A1A]/10 text-center text-stone-400">
            <div className="flex items-center justify-center gap-2 mb-3">
              <img 
                alt="Google News Logo" 
                className="h-4 w-4 grayscale opacity-40 filter" 
                src="https://lh3.googleusercontent.com/aida/AP1WRLveO-olj8qG7LGyLI-HGzgcilb8tLu7ZL9Iy1OgERiE5TJuwBWSg2GfBmCLgBDXSbQ3lCr_fzrEBG1jVfhM7tCzBZG2DTU89kjCe7VDrq-DyKvhHUAE1KQKfU87OpGN0ymHQXoavEYOY11jGyBLRUoGp3FYBNU_4NdTq-40YSB1xiKbZQDzB-lqHeg4nlsndFzlNLVESdG1wLhAc5IeKjaA8teOKeA8nets2BsoYCW3sPjCqv6yjS8eRJQ"
              />
              <span className="font-editorial-serif italic text-stone-500 text-sm">Google News - Modernist Journal edition</span>
            </div>
            <p className="text-[10px] tracking-[0.15em] uppercase font-sans font-bold">©2026 Modernist Journal Corp. All Rights Reserved.</p>
          </div>
        )}
      </main>

      {/* ARTICLE READER DRAWER (MODAL - SLIDING COVER STYLE) */}
      <AnimatePresence>
        {selectedArticle && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-xs flex justify-end">
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="w-full max-w-2xl bg-[#F5F2ED] border-l border-[#1A1A1A]/15 min-h-screen shadow-2xl flex flex-col relative"
            >
              {/* Sticky reader header */}
              <div className="sticky top-0 z-10 bg-[#F5F2ED] border-b border-[#1A1A1A]/10 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleCloseArticle}
                    className="p-1 hover:bg-[#EAE7E1] transition-colors text-stone-700"
                    title="Close"
                  >
                    <X className="w-5 h-5 stroke-[1.5]" />
                  </button>
                  <span className="text-[9px] tracking-[0.2em] uppercase font-sans font-bold text-stone-500">Dispatch Reader</span>
                </div>

                <div className="flex items-center space-x-3">
                  {/* Languages translation drop */}
                  <div className="flex items-center bg-[#EAE7E1] border border-[#1A1A1A]/10 px-2.5 py-1.5 transition-colors relative">
                    <Languages className="w-4 h-4 text-stone-600 mr-2" />
                    <select 
                      value={readerLanguage}
                      onChange={(e) => handleTranslate(e.target.value)}
                      className="text-[10px] tracking-wider uppercase font-sans text-stone-700 bg-transparent outline-none cursor-pointer pr-1"
                    >
                      <option value="Original">English (Original)</option>
                      <option value="Spanish">Spanish</option>
                      <option value="Japanese">Japanese</option>
                      <option value="French">French</option>
                      <option value="German">German</option>
                    </select>
                  </div>

                  <button 
                    onClick={(e) => toggleBookmark(selectedArticle, e)}
                    className="p-2 hover:bg-[#EAE7E1] transition-colors text-stone-600 hover:text-[#1A1A1A]"
                    title="Bookmark dispatch"
                  >
                    {bookmarks.some(b => b.id === selectedArticle.id) ? (
                      <BookmarkCheck className="w-5 h-5 text-stone-900 fill-stone-900" />
                    ) : (
                      <Bookmark className="w-5 h-5 stroke-[1.5]" />
                    )}
                  </button>
                </div>
              </div>

              {/* Reader Body content */}
              <div className="flex-1 overflow-y-auto px-8 py-8">
                {isTranslating ? (
                  <div className="py-32 text-center">
                    <div className="w-8 h-8 border-t-2 border-[#1A1A1A] rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-[10px] tracking-widest uppercase font-sans text-stone-500 animate-pulse font-bold">Translating dispatch via Gemini wire...</p>
                  </div>
                ) : (
                  <>
                    {/* Publisher Meta */}
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-7 h-7 bg-[#EAE7E1] flex items-center justify-center overflow-hidden font-bold text-xs">
                        {selectedArticle.sourceIconUrl ? (
                          <img src={selectedArticle.sourceIconUrl} className="w-full h-full object-cover filter grayscale" alt={selectedArticle.source} />
                        ) : (
                          selectedArticle.source.charAt(0)
                        )}
                      </div>
                      <div>
                        <p className="text-xs tracking-widest uppercase font-sans font-bold text-stone-800 leading-none">{selectedArticle.source}</p>
                        <p className="text-[10px] text-stone-400 mt-1 font-sans">{selectedArticle.time}</p>
                      </div>
                    </div>

                    {/* Headline in beautiful large editorial font */}
                    <h1 className="font-editorial-serif text-3xl md:text-5xl font-bold text-[#1A1A1A] leading-[1.1] mb-6 tracking-tight">
                      {translatedTitle || selectedArticle.title}
                    </h1>

                    {/* Cover Photo */}
                    {selectedArticle.imageUrl && (
                      <div className="overflow-hidden mb-8 aspect-video bg-stone-100 border border-[#1A1A1A]/10">
                        <img 
                          src={selectedArticle.imageUrl} 
                          alt={selectedArticle.title} 
                          className="w-full h-full object-cover grayscale contrast-110" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}

                    {/* DYNAMIC AUDIO NARRATOR ENGINE PANEL (MINIMALIST PRESS BOARD STYLE) */}
                    <div className="mb-8 p-5 bg-[#EAE7E1]/50 border border-[#1A1A1A]/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-none ${isPlayingAudio ? 'bg-[#1A1A1A] text-[#F5F2ED] animate-pulse' : 'bg-stone-200 text-[#1A1A1A]'}`}>
                            {isPlayingAudio ? <Radio className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="text-xs font-sans tracking-widest uppercase font-bold text-[#1A1A1A]">Narrate takeouts</p>
                            <p className="text-[10px] text-stone-500 font-sans mt-0.5">
                              {isPlayingAudio ? "Gemini audio synthesis broadcasting..." : "Speak dynamic summaries using Gemini TTS"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isPlayingAudio && (
                            <div className="flex items-end gap-0.5 h-4 mr-2">
                              <span className="w-0.5 bg-[#1A1A1A] h-2.5 animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                              <span className="w-0.5 bg-[#1A1A1A] h-4 animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                              <span className="w-0.5 bg-[#1A1A1A] h-1.5 animate-bounce" style={{ animationDelay: '0.5s' }}></span>
                              <span className="w-0.5 bg-[#1A1A1A] h-3 animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                            </div>
                          )}

                          <button 
                            onClick={handleSpeakSummary}
                            disabled={isAudioLoading}
                            className={`text-[9px] tracking-widest uppercase font-sans font-extrabold px-4 py-2 transition-all ${
                              isPlayingAudio 
                                ? "bg-red-700 hover:bg-red-800 text-white" 
                                : "bg-[#1A1A1A] hover:bg-stone-800 text-[#F5F2ED] disabled:bg-stone-300"
                            }`}
                          >
                            {isAudioLoading ? "Compiling..." : isPlayingAudio ? "Mute Broadcast" : "Listen Story"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* KEY TAKEAWAYS ESSAY BLOCK */}
                    <div className="mb-8 p-6 bg-[#FAF8F5] border border-[#1A1A1A]/10">
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-4 h-4 text-stone-600" />
                        <span className="text-[10px] tracking-[0.2em] uppercase font-sans font-bold text-stone-600">The Abstract Summary</span>
                      </div>
                      <ul className="space-y-3 text-sm text-[#1A1A1A]/90 font-serif leading-relaxed italic border-l-2 border-stone-300 pl-6">
                        {selectedArticle.bullets ? (
                          selectedArticle.bullets.map((bullet, i) => (
                            <li key={i} className="list-none mb-2">"{bullet}"</li>
                          ))
                        ) : (
                          <li className="list-none">"{selectedArticle.summary}"</li>
                        )}
                      </ul>
                    </div>

                    {/* Full Journal Article Body */}
                    <div className="prose max-w-none text-stone-800 leading-relaxed font-serif text-base space-y-6">
                      {(translatedContent || selectedArticle.content).split("\n\n").map((para, idx) => (
                        <p key={idx} className="leading-relaxed text-stone-800 whitespace-pre-wrap font-serif first-letter:text-3xl first-letter:font-light first-letter:mr-1 first-letter:float-left">{para}</p>
                      ))}
                    </div>

                    {/* Verification registry mapping */}
                    {(selectedArticle.url || groundingSources.length > 0) && (
                      <div className="mt-12 pt-8 border-t border-[#1A1A1A]/10">
                        <div className="flex items-center gap-2 mb-4 text-stone-500">
                          <Globe className="w-4.5 h-4.5 text-stone-600" />
                          <span className="text-[10px] tracking-[0.2em] uppercase font-sans font-bold text-stone-800">Telegraph Validation Registry</span>
                        </div>
                        
                        <p className="text-xs text-stone-500 mb-4 italic leading-relaxed">
                          Under verified transparency protocols, here are the original wire references used to compile and check this dossier:
                        </p>

                        <div className="space-y-2">
                          {selectedArticle.url && (
                            <a 
                              href={selectedArticle.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="inline-flex items-center gap-2 bg-[#EAE7E1] border border-[#1A1A1A]/10 text-[9px] tracking-widest uppercase font-sans text-stone-800 font-bold px-4 py-2 hover:bg-stone-200 transition-colors w-full sm:w-auto"
                            >
                              <span>Original URL Link</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {groundingSources.map((source, i) => (
                            <div key={i} className="p-3 bg-white border border-[#1A1A1A]/10 flex items-center justify-between gap-4">
                              <div className="text-[10px] tracking-wider uppercase font-sans text-stone-700 font-bold">
                                {source.title}
                              </div>
                              <a 
                                href={source.uri} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-stone-900 underline text-xs flex items-center font-bold"
                              >
                                View Wire <ExternalLink className="w-3 h-3 ml-1" />
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* USER PERSONALIZATION SETTINGS BOARD */}
      <AnimatePresence>
        {showProfileModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full max-w-md bg-[#F5F2ED] border border-[#1A1A1A]/15 overflow-hidden p-8 relative"
            >
              <button 
                onClick={() => setShowProfileModal(false)}
                className="absolute top-4 right-4 p-1 hover:bg-[#EAE7E1] text-stone-600 transition-colors"
              >
                <X className="w-5 h-5 stroke-[1.5]" />
              </button>

              <div className="flex flex-col items-center mb-6">
                <div className="w-14 h-14 bg-[#1A1A1A] text-[#F5F2ED] text-xl font-bold flex items-center justify-center uppercase mb-3">
                  {username.charAt(0)}
                </div>
                <h2 className="font-editorial-serif font-light text-2xl text-stone-900 italic">Personalize Registry</h2>
                <p className="text-stone-400 text-[9px] tracking-widest uppercase font-sans font-bold mt-1">narataniwan@gmail.com</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[9px] tracking-widest uppercase font-sans font-bold text-stone-600 mb-2">Display Nom de Plume</label>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white border border-[#1A1A1A]/15 text-xs tracking-widest uppercase font-sans px-4 py-3 outline-none focus:border-[#1A1A1A]"
                  />
                </div>

                <div className="p-4 bg-[#EAE7E1] border border-[#1A1A1A]/10 text-stone-700 text-xs italic leading-relaxed">
                  <div className="flex gap-2 items-start">
                    <Sparkles className="w-4 h-4 text-stone-800 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold font-sans not-italic uppercase tracking-widest text-[9px] block mb-1">Premium Journal Access</span>
                      All dynamic search grounding runs with state-of-the-art server-side Gemini 3.5 capabilities to preserve cryptographic key signatures.
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#1A1A1A]/10 flex justify-end">
                  <button 
                    onClick={() => setShowProfileModal(false)}
                    className="px-6 py-2.5 bg-[#1A1A1A] text-[#F5F2ED] text-[9px] tracking-widest uppercase font-sans font-bold hover:bg-stone-800 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
