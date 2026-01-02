import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Note, Theme } from '../types';
import { AUTHOR_HANDLE, THEMES } from '../constants';
import { getFirstImage, getPreviewText, formatDate } from '../utils';
import { Plus, Search, Eye, EyeOff, Trash2, Pin, MoreVertical, PinOff } from 'lucide-react';

interface HomeProps {
  notes: Note[];
  onCreateNote: () => void;
  onSelectNote: (note: Note) => void;
  currentTheme: Theme;
  onSetTheme: (theme: Theme) => void;
  onToggleHideNote: (note: Note) => void;
  onTogglePinNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
}

const Home: React.FC<HomeProps> = ({ 
    notes, 
    onCreateNote, 
    onSelectNote, 
    currentTheme, 
    onSetTheme, 
    onToggleHideNote,
    onTogglePinNote,
    onDeleteNote
}) => {
  const themeColors = THEMES[currentTheme];
  const [showHidden, setShowHidden] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredNotes = notes.filter(n => {
      const matchesVisibility = showHidden ? n.isHidden : !n.isHidden;
      let matchesSearch = true;
      if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          matchesSearch = n.title.toLowerCase().includes(query) || 
                          n.blocks.some(b => b.type === 'text' && b.content.toLowerCase().includes(query));
      }
      return matchesVisibility && matchesSearch;
  });

  const sortedNotes = [...filteredNotes].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return b.updatedAt - a.updatedAt;
  });

  return (
    <div className={`min-h-screen ${themeColors.bg} transition-colors duration-700 pb-20`}>
      {/* Header - Android Safe Area Aware */}
      <header className="px-6 pt-[calc(3rem+env(safe-area-inset-top))] pb-4 flex flex-col gap-4 sticky top-0 z-20 bg-gradient-to-b from-black via-black/95 to-transparent backdrop-blur-sm">
        
        <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-1">
                {AUTHOR_HANDLE}
              </span>
              <h1 className="text-[2.5rem] font-bold tracking-tighter text-white leading-none">
                  {showHidden ? 'HIDDEN' : 'FRAMES'}
              </h1>
            </div>

            {/* Top Right Controls */}
            <div className="flex items-center gap-4">
                 <button 
                    onClick={() => setShowHidden(!showHidden)}
                    className="p-2 text-neutral-500 hover:text-white transition-colors"
                >
                    {showHidden ? <EyeOff size={22} /> : <Eye size={22} />}
                </button>
            </div>
        </div>
        
        {/* Search Bar & Actions Row */}
        <div className="flex items-center gap-3">
            <div className="relative flex-grow overflow-hidden rounded-xl bg-[#141414] border border-white/5 flex items-center px-3 py-3 focus-within:bg-[#1A1A1A] transition-colors group">
               <Search size={16} className="text-neutral-600 group-focus-within:text-white transition-colors mr-3" />
               <input 
                 type="text" 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 placeholder="Search memory..." 
                 className="bg-transparent outline-none w-full text-sm text-white placeholder-neutral-700 font-medium"
               />
            </div>
            
            {/* Theme Toggles */}
            <div className="flex gap-2 px-2">
                {[
                  { id: 'dark', color: 'bg-[#141414]', border: 'border-neutral-700' },
                  { id: 'pink', color: 'bg-[#e11d48]', border: 'border-pink-900' },
                  { id: 'royal', color: 'bg-[#1e40af]', border: 'border-blue-900' }
                ].map((t) => (
                  <button 
                    key={t.id}
                    onClick={() => onSetTheme(t.id as Theme)} 
                    className={`w-4 h-4 rounded-full ${t.color} border ${t.border} transition-transform duration-300 ${currentTheme === t.id ? 'scale-125 ring-2 ring-white border-transparent' : 'scale-100 opacity-50'}`} 
                  />
                ))}
            </div>
        </div>
      </header>

      {/* Grid Layout */}
      <div className="px-4 pt-4 grid grid-cols-2 gap-3 auto-rows-max">
        {/* Create Card (Always first) */}
        {!showHidden && (
            <button 
              onClick={onCreateNote}
              className="group relative w-full aspect-[3/4] rounded-lg border border-white/10 bg-[#0A0A0A] flex flex-col items-center justify-center gap-3 hover:bg-[#111] active:scale-95 transition-all overflow-hidden"
            >
               <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center group-hover:border-cyan-400/50 transition-colors">
                  <Plus size={24} className="text-white group-hover:text-cyan-400 transition-colors" />
               </div>
               <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold group-hover:text-white transition-colors">New Frame</span>
               
               {/* Subtle gradient effect on hover */}
               <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
        )}

        {sortedNotes.map(note => (
            <NoteCard 
                key={note.id} 
                note={note} 
                onSelect={onSelectNote} 
                onToggleHide={onToggleHideNote}
                onTogglePin={onTogglePinNote}
                onDelete={onDeleteNote}
                themeColors={themeColors}
            />
        ))}

        {sortedNotes.length === 0 && !showHidden && (
           <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-30 pointer-events-none">
             <p className="text-[10px] tracking-[0.2em] uppercase font-bold text-neutral-600">Your vault is empty</p>
           </div>
        )}
      </div>
    </div>
  );
};

interface NoteCardProps {
    note: Note;
    onSelect: (note: Note) => void;
    onToggleHide: (note: Note) => void;
    onTogglePin: (note: Note) => void;
    onDelete: (id: string) => void;
    themeColors: any;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onSelect, onToggleHide, onTogglePin, onDelete, themeColors }) => {
    const coverImage = getFirstImage(note.blocks);
    const previewText = getPreviewText(note.blocks);
    const [isPressing, setIsPressing] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };
        if (showMenu) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showMenu]);

    const startPress = useCallback(() => {
        if (showMenu) return;
        setIsPressing(true);
        timerRef.current = setTimeout(() => {
            setIsPressing(false);
            if (navigator.vibrate) navigator.vibrate(50);
            onTogglePin(note);
        }, 500); 
    }, [note, onTogglePin, showMenu]);

    const endPress = useCallback(() => {
        setIsPressing(false);
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    return (
        <div 
          className="group relative flex flex-col touch-manipulation"
          onTouchStart={(e) => { 
            if ((e.target as HTMLElement).closest('.card-menu-btn')) return;
            startPress(); 
          }}
          onTouchEnd={endPress}
          onMouseDown={(e) => {
            if ((e.target as HTMLElement).closest('.card-menu-btn')) return;
            startPress();
          }}
          onMouseUp={endPress}
          onMouseLeave={endPress}
          onClick={(e) => {
             if ((e.target as HTMLElement).closest('.card-menu-btn')) return;
             if (!isPressing && !timerRef.current && !showMenu) {
                 onSelect(note);
             }
          }}
        >
          <div className={`relative w-full aspect-[3/4] rounded-lg overflow-hidden bg-[#141414] shadow-md border border-white/5 transition-all duration-300 ${isPressing ? 'scale-95 opacity-80' : 'active:scale-95'}`}>
            
            {coverImage ? (
              <div className="absolute inset-0">
                {coverImage.startsWith('data:video') ? (
                   <video src={coverImage} className="w-full h-full object-cover" muted playsInline loop />
                ) : (
                   <img src={coverImage} alt="Cover" className="w-full h-full object-cover" loading="lazy" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/10" />
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-[#141414]">
                 <p className="text-neutral-700 text-3xl font-serif italic opacity-30">Aa</p>
              </div>
            )}
            
            {/* Menu Button */}
            <div className="absolute top-2 right-2 z-20">
                 <button 
                    onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                    className="card-menu-btn p-1.5 rounded-full bg-black/20 backdrop-blur-md text-white/50 hover:bg-black/60 hover:text-white transition-all"
                 >
                    <MoreVertical size={14} />
                 </button>

                 {showMenu && (
                     <div 
                        ref={menuRef}
                        className="absolute top-full right-0 mt-2 w-28 bg-[#1A1A1A] border border-white/10 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 origin-top-right flex flex-col p-1 z-50"
                     >
                         <button 
                            onClick={(e) => { e.stopPropagation(); onTogglePin(note); setShowMenu(false); }}
                            className="card-menu-btn flex items-center gap-2 px-2 py-2 text-[10px] uppercase tracking-wider font-bold text-neutral-300 hover:bg-white/10 rounded transition-colors"
                         >
                            {note.isPinned ? <PinOff size={12} /> : <Pin size={12} />}
                            {note.isPinned ? 'Unpin' : 'Pin'}
                         </button>
                         <div className="h-px bg-white/5 my-0.5" />
                         <button 
                            onClick={(e) => { e.stopPropagation(); onDelete(note.id); setShowMenu(false); }}
                            className="card-menu-btn flex items-center gap-2 px-2 py-2 text-[10px] uppercase tracking-wider font-bold text-red-400 hover:bg-red-500/10 rounded transition-colors"
                         >
                            <Trash2 size={12} />
                            Delete
                         </button>
                     </div>
                 )}
            </div>

            {/* Pin Indicator */}
            {note.isPinned && (
                <div className="absolute top-3 left-3">
                    <Pin size={12} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" fill="currentColor" />
                </div>
            )}
            
            {/* Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-3 pt-6 pointer-events-none">
              <h3 className="text-white font-bold text-sm leading-tight line-clamp-2 mb-1 drop-shadow-lg">
                {note.title || 'Untitled'}
              </h3>
              <p className="text-[10px] text-neutral-400 line-clamp-1 font-medium">
                {previewText}
              </p>
            </div>
          </div>
        </div>
    );
};

export default Home;