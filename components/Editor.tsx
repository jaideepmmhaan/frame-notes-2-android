import React, { useState, useRef, useEffect } from 'react';
import { Note, Block, BlockType, Theme } from '../types';
import { BlockRender } from './BlockRender';
import { generateId } from '../utils';
import { ArrowLeft, Image as ImageIcon, Type, MoreVertical, Share, Eye, EyeOff, Trash2, Pin, PinOff, Check } from 'lucide-react';
import { THEMES } from '../constants';

interface EditorProps {
  note: Note | null;
  onSave: (note: Note) => void;
  onBack: () => void;
  onDeleteNote: (id: string) => void;
  currentTheme: Theme;
}

const Editor: React.FC<EditorProps> = ({ note, onSave, onBack, onDeleteNote, currentTheme }) => {
  const [blocks, setBlocks] = useState<Block[]>(note?.blocks || []);
  const [title, setTitle] = useState(note?.title || '');
  const [isHidden, setIsHidden] = useState(note?.isHidden || false);
  const [isPinned, setIsPinned] = useState(note?.isPinned || false);
  const [deletedBlock, setDeletedBlock] = useState<{ block: Block, index: number } | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  // Drag and Drop Refs
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const themeColors = THEMES[currentTheme];

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setShowMenu(false);
        }
    };
    if (showMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  // Auto-save logic
  useEffect(() => {
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      // Avoid saving empty new notes
      if (blocks.length === 0 && !title && !note) {
          setSaveStatus('saved');
          return;
      }
      
      const updatedNote: Note = {
        id: note?.id || generateId(),
        title: title || '',
        createdAt: note?.createdAt || Date.now(),
        updatedAt: Date.now(),
        blocks,
        isPinned,
        isHidden,
        theme: currentTheme,
      };
      
      onSave(updatedNote);
      setSaveStatus('saved');
    }, 800);
    return () => clearTimeout(timer);
  }, [blocks, title, isHidden, isPinned, currentTheme]);

  const addBlock = (type: BlockType, content: string = '') => {
    const newBlock: Block = { id: generateId(), type, content, drawings: [] };
    setBlocks(prev => [...prev, newBlock]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const type = file.type.startsWith('video') ? 'video' : 'image';
        addBlock(type, event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const updateBlock = (id: string, content: string) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, content } : b));
  };

  const updateBlockDrawings = (id: string, drawings: any[]) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, drawings } : b));
  };

  const deleteBlock = (id: string) => {
    const index = blocks.findIndex(b => b.id === id);
    if (index === -1) return;
    setDeletedBlock({ block: blocks[index], index });
    setBlocks(prev => prev.filter(b => b.id !== id));
    setTimeout(() => setDeletedBlock(curr => curr?.block.id === id ? null : curr), 4000);
  };

  const restoreBlock = () => {
      if (deletedBlock) {
          setBlocks(prev => {
              const newBlocks = [...prev];
              newBlocks.splice(deletedBlock.index, 0, deletedBlock.block);
              return newBlocks;
          });
          setDeletedBlock(null);
      }
  };

  // --- Mobile Drag/Reorder Logic ---
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, position: number) => {
    dragItem.current = position;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, position: number) => {
    e.preventDefault();
    if (dragItem.current === null) return;
    dragOverItem.current = position;

    const dragIndex = dragItem.current;
    const hoverIndex = position;

    if (dragIndex === hoverIndex) return;

    const newBlocks = [...blocks];
    const draggedBlock = newBlocks[dragIndex];
    newBlocks.splice(dragIndex, 1);
    newBlocks.splice(hoverIndex, 0, draggedBlock);
    
    setBlocks(newBlocks);
    dragItem.current = hoverIndex;
  };

  const handleDragEnd = () => {
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= blocks.length) return;
      const newBlocks = [...blocks];
      const temp = newBlocks[index];
      newBlocks[index] = newBlocks[newIndex];
      newBlocks[newIndex] = temp;
      setBlocks(newBlocks);
  };

  const handleShare = async () => {
    const textContent = blocks.filter(b => b.type === 'text').map(b => b.content).join('\n\n');
    const shareData = { title: title, text: `${title}\n\n${textContent}` };
    try {
        if (navigator.share) await navigator.share(shareData);
    } catch (e) { console.error(e); }
    setShowMenu(false);
  };

  return (
    <div className={`min-h-screen flex flex-col ${themeColors.bg} transition-colors duration-700 relative`}>
      {/* 
         HEADER: Minimal & Immersive 
         Uses pt-[calc(...)] to clear the Android Status Bar
      */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-6 pt-[calc(2rem+env(safe-area-inset-top))] pb-4 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-[2px]">
        <button 
            onClick={onBack} 
            className="text-white/80 hover:text-white active:opacity-50 transition-colors p-2 -ml-2 rounded-full active:bg-white/10"
        >
          <ArrowLeft size={24} />
        </button>
        
        <div className="flex items-center gap-4">
           {/* Save Indicator */}
           <div className={`text-[10px] uppercase tracking-widest font-semibold transition-opacity duration-500 ${saveStatus === 'saving' ? 'opacity-100 text-white/50' : 'opacity-0'}`}>
              Saving...
           </div>
           
           {/* Context Menu */}
           <div className="relative">
               <button 
                  onClick={() => setShowMenu(!showMenu)} 
                  className="text-white/80 hover:text-white active:opacity-50 p-2 rounded-full active:bg-white/10"
               >
                  <MoreVertical size={20} />
               </button>
               
               {showMenu && (
                 <div ref={menuRef} className="absolute right-0 top-full mt-2 w-48 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 origin-top-right">
                    <button onClick={handleShare} className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-neutral-300 hover:bg-white/5 hover:text-white transition-colors">
                        <Share size={16} /> Share Frame
                    </button>
                    <button onClick={() => { setIsPinned(!isPinned); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-neutral-300 hover:bg-white/5 hover:text-white transition-colors">
                        {isPinned ? <PinOff size={16} /> : <Pin size={16} />} {isPinned ? "Unpin" : "Pin"}
                    </button>
                    <button onClick={() => { setIsHidden(!isHidden); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-neutral-300 hover:bg-white/5 hover:text-white transition-colors">
                        {isHidden ? <EyeOff size={16} /> : <Eye size={16} />} {isHidden ? "Unhide" : "Hide"}
                    </button>
                    <div className="h-px bg-white/5 my-1" />
                    {note && (
                        <button onClick={() => onDeleteNote(note.id)} className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                            <Trash2 size={16} /> Delete
                        </button>
                    )}
                 </div>
               )}
           </div>
        </div>
      </header>

      {/* CANVAS */}
      <main className="flex-grow flex flex-col relative px-6 overflow-y-auto no-scrollbar pb-40">
        <input
          ref={titleInputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Frame Title"
          className="w-full bg-transparent text-[2.5rem] leading-[1.1] font-bold outline-none placeholder-neutral-800 text-white mb-8"
        />

        {/* Empty State: Centered Typography */}
        {blocks.length === 0 && !title && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-[10px] font-bold tracking-[0.3em] text-neutral-700 uppercase animate-pulse">
                    Start Curating
                </span>
            </div>
        )}

        {/* Blocks List */}
        <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto">
          {blocks.map((block, index) => (
            <BlockRender 
              key={block.id} 
              index={index}
              block={block} 
              isEditing={true}
              onUpdate={updateBlock}
              onUpdateDrawings={updateBlockDrawings}
              onDelete={deleteBlock}
              onDragStart={handleDragStart}
              onDragEnter={handleDragEnter}
              onDragEnd={handleDragEnd}
              onMove={moveBlock}
              themeAccent={themeColors.accent}
              isFirst={index === 0}
              isLast={index === blocks.length - 1}
            />
          ))}
        </div>
      </main>

      {/* Undo Toast */}
      {deletedBlock && (
         <div className="fixed bottom-32 left-0 right-0 flex justify-center z-50 pointer-events-none">
             <button onClick={restoreBlock} className="pointer-events-auto bg-[#1A1A1A] text-white text-xs px-5 py-2.5 rounded-full shadow-2xl border border-white/10 animate-in fade-in slide-in-from-bottom-4 flex items-center gap-2">
                 <span className="text-neutral-400">Block deleted</span>
                 <span className="text-cyan-400 font-bold">Undo</span>
             </button>
         </div>
      )}

      {/* 
          FLOATING PILL TOOLBAR 
          This is the signature UI element from your screenshot.
          Positioned bottom-8, pill shape, glass effect.
      */}
      <div className="fixed bottom-10 left-0 right-0 flex justify-center z-40 pb-[env(safe-area-inset-bottom)] pointer-events-none">
        <div className="pointer-events-auto bg-[#141414]/90 rounded-full px-8 py-3.5 flex items-center gap-8 shadow-[0_8px_32px_rgba(0,0,0,0.6)] border border-white/10 backdrop-blur-xl">
          <button 
             onClick={() => addBlock('text')} 
             className="flex flex-col items-center gap-1 group"
          >
            <Type size={24} strokeWidth={1.5} className="text-neutral-400 group-hover:text-white transition-colors" />
          </button>
          
          <div className="w-px h-6 bg-white/10" />
          
          <button 
             onClick={() => fileInputRef.current?.click()} 
             className="flex flex-col items-center gap-1 group"
          >
            <ImageIcon size={24} strokeWidth={1.5} className="text-neutral-400 group-hover:text-white transition-colors" />
          </button>
          
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileUpload} />
        </div>
      </div>
    </div>
  );
};

export default Editor;