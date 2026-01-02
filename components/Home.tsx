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
      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 z-20 bg-gradient-to-b from-black/90 to-transparent backdrop-blur-sm">
        <div className="flex flex-col">
          <div className="flex flex-col items-start gap-3 mb-2">
             <span className={`text-[10px] font-bold uppercase tracking-[0.25em] opacity-60 ${themeColors.text}`}>
               {AUTHOR_HANDLE}
             </span>
             {/* Theme Switcher Dots */}
             <div className="flex gap-3">
                {[
                  { id: 'dark', color: 'bg-neutral-800', border: 'border-neutral-600' },
                  { id: 'pink', color: 'bg-[#e11d48]', border: 'border-pink-900' },
                  { id: 'royal', color: 'bg-[#1e40af]', border: 'border-blue-900' }
                ].map((t) => (
                  <button 
                    key={t.id}
                    onClick={() => onSetTheme(t.id as Theme)} 
                    className={`w-4 h-4 rounded-full ${t.color} border ${t.border} transition-transform duration-300 ${currentTheme === t.id ? 'scale-125 ring-1 ring-white' : 'scale-100 opacity-60'}`} 
                  />
                ))}
             </div>
          </div>
          <div className="flex items-center gap-3">
            <h1 className={`text-3xl font-black tracking-tighter ${themeColors.text}`}>
              {showHidden ? 'HIDDEN' : 'FRAMES'}
            </h1>
            <button 
                onClick={() => setShowHidden(!showHidden)}
                className={`p-2 rounded-full active:bg-white/10 opacity-40 hover:opacity-100 transition-all ${themeColors.text}`}
            >
                {showHidden ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        
        {!showHidden && (
            <button 
              onClick={onCreateNote}
              className={`w-14 h-14 rounded-full border ${themeColors.border} ${themeColors.surface} flex items-center justify-center active:scale-90 transition-transform shadow-[0_0_20px_rgba(0,0,0,0.5)] z-30`}
            >
              <Plus size={28} className={themeColors.text} />
            </button>
        )}
      </header>

      {/* Search */}
      <div className="px-6 mb-8">
        <div className={`relative w-full overflow-hidden rounded-2xl bg-white/5 border border-white/5 flex items-center px-4 py-3.5 focus-within:bg-white/10 transition-colors`}>
           <Search size={18} className="text-white/30 mr-3" />
           <input 
             type="text" 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             placeholder="Search memory..." 
             className="bg-transparent outline-none w-full text-base text-white/90 placeholder-white/30 font-light"
           />
        </div>
      </div>

      {/* Masonry Grid */}
      <div className="px-4 grid grid-cols-2 gap-4 auto-rows-max">
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

        {sortedNotes.length === 0 && (
           <div className="col-span-full flex flex-col items-center justify-center py-32 opacity-20 pointer-events-none">
             <div className="w-16 h-24 border-2 border-dashed border-white/50 rounded-lg mb-4"></div>
             <p className="text-xs tracking-[0.2em] uppercase font-bold">Empty Vault</p>
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
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [isPressing, setIsPressing] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };

        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [showMenu]);

    // Haptic Press Logic
    const startPress = useCallback(() => {
        // Only start long press if menu is not open
        if (showMenu) return;
        setIsPressing(true);
        timerRef.current = setTimeout(() => {
            setIsPressing(false);
            if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
            onTogglePin(note); // Long press to Pin
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
          className="group relative flex flex-col touch-manipulation z-0"
          onTouchStart={(e) => { 
            // Don't trigger long press if hitting the menu button
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
          <div className={`relative w-full aspect-[4/5] rounded-xl overflow-hidden ${themeColors.surface} shadow-2xl border ${themeColors.border} transition-all duration-300 ${isPressing ? 'scale-95 opacity-80' : 'active:scale-95'}`}>
            
            {/* Visual */}
            {coverImage ? (
              <div className="absolute inset-0">
                {coverImage.startsWith('data:video') ? (
                   <video src={coverImage} className="w-full h-full object-cover" muted playsInline loop />
                ) : (
                   <img src={coverImage} alt="Cover" className="w-full h-full object-cover" loading="lazy" />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/90" />
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-white/5 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 to-transparent">
                <span className="text-white/10 text-5xl font-serif italic">Aa</span>
              </div>
            )}
            
            {/* Context Menu Button */}
            <div className="absolute top-2 right-2 z-20">
                 <button 
                    onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                    className="card-menu-btn p-2 rounded-full bg-black/10 backdrop-blur-md text-white/50 hover:bg-black/50 hover:text-white transition-all"
                 >
                    <MoreVertical size={16} />
                 </button>

                 {showMenu && (
                     <div 
                        ref={menuRef}
                        className="absolute top-full right-0 mt-2 w-32 bg-neutral-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 origin-top-right flex flex-col p-1 z-50"
                     >
                         <button 
                            onClick={(e) => { e.stopPropagation(); onTogglePin(note); setShowMenu(false); }}
                            className="card-menu-btn flex items-center gap-2 px-3 py-2 text-xs font-medium text-white hover:bg-white/10 rounded-lg transition-colors text-left"
                         >
                            {note.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                            {note.isPinned ? 'Unpin' : 'Pin'}
                         </button>
                         <div className="h-px bg-white/5 my-1" />
                         <button 
                            onClick={(e) => { e.stopPropagation(); onDelete(note.id); setShowMenu(false); }}
                            className="card-menu-btn flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-left"
                         >
                            <Trash2 size={14} />
                            Delete
                         </button>
                     </div>
                 )}
            </div>

            {/* Pin Badge (Now Top Left) */}
            {note.isPinned && (
                <div className={`absolute top-3 left-3 p-1.5 rounded-full backdrop-blur-md bg-white/10 border border-white/20 shadow-lg ${themeColors.accent} z-10`}>
                    <Pin size={10} fill="currentColor" />
                </div>
            )}
            
            {/* Text Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 pt-8 pointer-events-none">
              <h3 className={`text-white font-semibold text-sm leading-tight line-clamp-2 mb-1 drop-shadow-md`}>
                {note.title}
              </h3>
              <p className="text-[11px] text-white/70 line-clamp-1 font-medium opacity-80">
                {previewText}
              </p>
              <div className="flex items-center justify-between mt-3">
                 <span className="text-[9px] text-white/40 uppercase tracking-wider font-bold">
                    {formatDate(note.updatedAt)}
                 </span>
                 {note.isHidden && <EyeOff size={10} className="text-white/50" />}
              </div>
            </div>
          </div>
        </div>
    );
};

export default Home;