import React, { useState, useRef, useEffect } from 'react';
import { Note, Block, BlockType, Theme } from '../types';
import { BlockRender } from './BlockRender';
import { generateId } from '../utils';
import { ArrowLeft, Image as ImageIcon, Type, Share, Eye, EyeOff, Trash2, Pin, PinOff } from 'lucide-react';
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

  // Drag and Drop Refs
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const themeColors = THEMES[currentTheme];

  // Auto-save
  useEffect(() => {
    const timer = setTimeout(() => {
      // Don't save completely empty new notes
      if (blocks.length === 0 && !title && !note) return;
      
      const updatedNote: Note = {
        id: note?.id || generateId(),
        title: title || 'Untitled Frame',
        createdAt: note?.createdAt || Date.now(),
        updatedAt: Date.now(),
        blocks,
        isPinned,
        isHidden,
        theme: currentTheme,
      };
      
      onSave(updatedNote);
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

  // --- Drag and Drop Logic ---
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, position: number) => {
    dragItem.current = position;
    // Add visual effect or data if needed
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, position: number) => {
    e.preventDefault();
    if (dragItem.current === null) return;
    dragOverItem.current = position;

    const dragIndex = dragItem.current;
    const hoverIndex = position;

    if (dragIndex === hoverIndex) return;

    // Reorder
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

  // --- Mobile Fallback: Manual Move ---
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
        else alert("Browser does not support native share");
    } catch (e) { console.error(e); }
  };

  return (
    <div className={`min-h-screen flex flex-col ${themeColors.bg} transition-colors duration-700`}>
      {/* Header */}
      <header className={`sticky top-0 z-30 flex items-center justify-between px-6 py-4 pt-12 backdrop-blur-xl border-b ${themeColors.border} bg-opacity-80`}>
        <button onClick={onBack} className={`${themeColors.text} active:opacity-50 transition-opacity p-2 -ml-2`}>
          <ArrowLeft size={24} />
        </button>
        <div className="flex items-center gap-2">
           <button onClick={handleShare} className="p-2 text-white/70 hover:text-white active:scale-95 transition-all">
              <Share size={20} />
           </button>
           <button onClick={() => setIsPinned(!isPinned)} className="p-2 text-white/70 hover:text-white active:scale-95 transition-all">
             {isPinned ? <Pin size={20} className="text-cyan-400 fill-cyan-400/20" /> : <Pin size={20} />}
           </button>
           <button onClick={() => setIsHidden(!isHidden)} className="p-2 text-white/70 hover:text-white active:scale-95 transition-all">
             {isHidden ? <EyeOff size={20} className="text-red-400" /> : <Eye size={20} />}
           </button>
           {note && (
               <button onClick={() => onDeleteNote(note.id)} className="p-2 text-red-400/70 hover:text-red-500 active:scale-95 transition-all">
                  <Trash2 size={20} />
               </button>
           )}
        </div>
      </header>

      {/* Canvas */}
      <main className="flex-grow overflow-y-auto px-6 py-8 pb-40 max-w-3xl mx-auto w-full no-scrollbar">
        <input
          ref={titleInputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title..."
          className={`w-full bg-transparent text-4xl font-bold mb-8 outline-none placeholder-white/20 ${themeColors.text} bg-none`}
        />

        <div className="flex flex-col gap-6">
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
        
        {/* Helper Space at bottom */}
        <div className="h-20" onClick={() => addBlock('text')} />
      </main>

      {/* Undo Toast */}
      {deletedBlock && (
         <div className="fixed bottom-32 left-0 right-0 flex justify-center z-50 pointer-events-none">
             <button onClick={restoreBlock} className="pointer-events-auto bg-neutral-800 text-white text-xs px-4 py-2 rounded-full shadow-lg border border-neutral-700 animate-in fade-in slide-in-from-bottom-4">
                 Undo Delete
             </button>
         </div>
      )}

      {/* Toolbar */}
      <div className="fixed bottom-0 left-0 right-0 p-6 z-40 bg-gradient-to-t from-black via-black/90 to-transparent pb-10">
        <div className={`mx-auto max-w-xs flex items-center justify-between ${themeColors.surface} border ${themeColors.border} rounded-full px-8 py-4 shadow-2xl backdrop-blur-xl`}>
          <button onClick={() => addBlock('text')} className={`active:scale-90 transition-transform ${themeColors.text}`}>
            <Type size={28} strokeWidth={1.5} />
          </button>
          
          <div className="w-px h-8 bg-white/10" />
          
          <button onClick={() => fileInputRef.current?.click()} className={`active:scale-90 transition-transform ${themeColors.text}`}>
            <ImageIcon size={28} strokeWidth={1.5} />
          </button>
          
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileUpload} />
        </div>
      </div>
    </div>
  );
};

export default Editor;