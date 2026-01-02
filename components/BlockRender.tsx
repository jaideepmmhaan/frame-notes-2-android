import React, { useRef, useEffect, useState } from 'react';
import { Block, DrawingPath } from '../types';
import { Pencil, Maximize2, Trash2, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import DrawingCanvas from './DrawingCanvas';

interface BlockRenderProps {
  block: Block;
  index: number;
  isEditing: boolean;
  onUpdate: (id: string, content: string) => void;
  onUpdateDrawings: (id: string, drawings: DrawingPath[]) => void;
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, position: number) => void;
  onDragEnter: (e: React.DragEvent<HTMLDivElement>, position: number) => void;
  onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  themeAccent: string;
  isFirst: boolean;
  isLast: boolean;
}

export const BlockRender: React.FC<BlockRenderProps> = ({ 
  block, 
  index,
  isEditing, 
  onUpdate, 
  onUpdateDrawings,
  onDelete, 
  onDragStart,
  onDragEnter,
  onDragEnd,
  onMove,
  themeAccent,
  isFirst,
  isLast
}) => {
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    if (block.type === 'text' && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [block.content, block.type]);

  // Video Autoplay when Visible (Intersection Observer)
  useEffect(() => {
    if (block.type === 'video' && videoRef.current) {
        const video = videoRef.current;
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        video.play().catch(() => {
                            // Silent catch for autoplay restrictions
                        });
                    } else {
                        video.pause();
                    }
                });
            },
            { threshold: 0.5 }
        );
        observer.observe(video);
        return () => observer.disconnect();
    }
  }, [block.type]);

  // Render Drawings on read-only canvas (High DPI supported)
  useEffect(() => {
    if ((block.type === 'image' || block.type === 'video') && canvasRef.current && block.drawings && !isDrawingMode) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Handle DPI scaling
      const dpr = window.devicePixelRatio || 1;
      const rect = containerRef.current?.getBoundingClientRect();
      const width = rect?.width || canvas.clientWidth;
      const height = rect?.height || canvas.clientHeight;
      
      // Set resolution matches physical pixels
      canvas.width = width * dpr;
      canvas.height = height * dpr;

      // Scale context
      ctx.scale(dpr, dpr);
      
      ctx.clearRect(0, 0, width, height);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      block.drawings.forEach(path => {
        if (path.points.length < 2) return;
        
        if (path.color === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.lineWidth = path.width * 2;
        } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = path.color;
            ctx.lineWidth = path.width;
            ctx.shadowBlur = 4;
            ctx.shadowColor = path.color;
        }

        ctx.beginPath();
        ctx.moveTo(path.points[0].x, path.points[0].y);
        for (let i = 1; i < path.points.length; i++) {
          ctx.lineTo(path.points[i].x, path.points[i].y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalCompositeOperation = 'source-over';
      });
    }
  }, [block.drawings, block.type, isDrawingMode]);

  const handleDragStartInternal = (e: React.DragEvent<HTMLDivElement>) => {
      setIsDragging(true);
      onDragStart(e, index);
  };

  const handleDragEndInternal = (e: React.DragEvent<HTMLDivElement>) => {
      setIsDragging(false);
      onDragEnd(e);
  };

  // Content Renderer
  const renderContent = () => {
    if (block.type === 'text') {
        return (
            <textarea
                ref={textareaRef}
                value={block.content}
                onChange={(e) => onUpdate(block.id, e.target.value)}
                placeholder="Start writing..."
                // Prevent drag start when selecting text
                onMouseDown={(e) => e.stopPropagation()} 
                onTouchStart={(e) => e.stopPropagation()}
                className={`w-full bg-transparent resize-none outline-none text-lg leading-relaxed font-light tracking-wide placeholder-white/20 transition-all duration-300 ${isEditing ? 'border-l-2 border-white/10 pl-4' : 'pl-0'}`}
                style={{ minHeight: '1.5em' }}
            />
        );
    }

    if (block.type === 'image' || block.type === 'video') {
        return (
          <div className="relative w-full rounded-sm overflow-hidden shadow-lg bg-neutral-900 aspect-square sm:aspect-video transition-transform duration-500 select-none" ref={containerRef}>
            {block.type === 'image' ? (
               <img src={block.content} alt="Note asset" className="w-full h-full object-cover" />
            ) : (
               <video 
                 ref={videoRef}
                 src={block.content} 
                 controls={false} 
                 muted 
                 playsInline 
                 loop 
                 className="w-full h-full object-cover" 
               />
            )}
  
            {/* Read-only overlay canvas for drawings (Hidden when drawing mode is active to avoid double render opacity) */}
            {!isDrawingMode && (
                <canvas 
                  ref={canvasRef}
                  className="absolute inset-0 pointer-events-none w-full h-full"
                  style={{ width: '100%', height: '100%' }}
                />
            )}
  
            {/* Hover Controls for Media (Only when NOT in drawing mode) */}
            {isEditing && !isDrawingMode && (
               <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100">
                  <button 
                    onClick={() => setIsDrawingMode(true)}
                    className={`p-3 rounded-full bg-black/50 backdrop-blur-md text-white hover:${themeAccent} transition-all transform hover:scale-110`}
                  >
                    <Pencil size={20} />
                  </button>
               </div>
            )}
            
            {/* Drawing Mode Overlay (Absolute position inside this relative container) */}
            {isDrawingMode && containerRef.current && (
               <DrawingCanvas
                  width={containerRef.current.offsetWidth}
                  height={containerRef.current.offsetHeight}
                  initialPaths={block.drawings || []}
                  onSave={(paths) => {
                      onUpdateDrawings(block.id, paths);
                      setIsDrawingMode(false);
                  }}
                  onCancel={() => setIsDrawingMode(false)}
               />
            )}
          </div>
        );
    }
    return null;
  };

  return (
    <div 
        className={`relative group transition-all duration-200 ${isDragging ? 'opacity-30 scale-[0.98]' : 'opacity-100'} pl-8 sm:pl-0`}
        draggable={isEditing}
        onDragStart={handleDragStartInternal}
        onDragEnter={(e) => onDragEnter(e, index)}
        onDragEnd={handleDragEndInternal}
        onDragOver={(e) => e.preventDefault()}
    >
        {/* Controls Sidebar (Grip + Move Up/Down + Delete) */}
        {isEditing && (
            <div className="absolute -left-3 sm:-left-12 top-0 bottom-0 w-8 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity z-10">
                
                {/* Drag Handle */}
                <div className="cursor-grab p-1 text-white/20 hover:text-white/80 active:cursor-grabbing">
                    <GripVertical size={16} />
                </div>

                {/* Move Up/Down (Mobile Fallback) */}
                <div className="flex flex-col gap-1">
                    {!isFirst && (
                        <button onClick={() => onMove(index, -1)} className="text-white/20 hover:text-white/80 p-0.5">
                            <ChevronUp size={14} />
                        </button>
                    )}
                    {!isLast && (
                        <button onClick={() => onMove(index, 1)} className="text-white/20 hover:text-white/80 p-0.5">
                            <ChevronDown size={14} />
                        </button>
                    )}
                </div>

                {/* Delete */}
                <button 
                    onClick={() => onDelete(block.id)}
                    className="p-1 mt-2 text-red-500/30 hover:text-red-500 transition-colors"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        )}

        {/* Inner Content */}
        {renderContent()}
    </div>
  );
};