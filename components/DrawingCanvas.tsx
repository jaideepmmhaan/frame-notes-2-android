import React, { useRef, useState, useEffect } from 'react';
import { DrawingPath, Point } from '../types';
import { NEON_COLORS } from '../constants';
import { Eraser, Undo, X, Check, Palette } from 'lucide-react';

interface DrawingCanvasProps {
  initialPaths: DrawingPath[];
  onSave: (paths: DrawingPath[]) => void;
  onCancel: () => void;
  width: number;
  height: number;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ initialPaths, onSave, onCancel, width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [paths, setPaths] = useState<DrawingPath[]>(initialPaths);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [selectedColor, setSelectedColor] = useState(NEON_COLORS[0]);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [brushSize] = useState(3);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // High DPI Setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    
    // Set actual size in memory (scaled to account for extra pixel density)
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    
    // Normalize coordinate system to use css pixels
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);

    // Initial render of existing paths
    renderCanvas();
  }, [width, height, paths]); // Re-render when size or paths change

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear the canvas (use scaled dimensions to clear everything)
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    paths.forEach(path => {
      if (path.points.length < 2) return;
      
      if (path.color === 'eraser') {
          ctx.globalCompositeOperation = 'destination-out';
          ctx.lineWidth = path.width * 4;
      } else {
          ctx.globalCompositeOperation = 'source-over';
          ctx.strokeStyle = path.color;
          ctx.shadowBlur = 8;
          ctx.shadowColor = path.color;
          ctx.lineWidth = path.width;
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
  };

  // Render current stroke (live)
  useEffect(() => {
    if (!isDrawing || currentPoints.length < 2) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const lastPoint = currentPoints[currentPoints.length - 2];
    const newPoint = currentPoints[currentPoints.length - 1];

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    if (tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = brushSize * 4;
    } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = selectedColor;
        ctx.shadowBlur = 8;
        ctx.shadowColor = selectedColor;
        ctx.lineWidth = brushSize;
    }

    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(newPoint.x, newPoint.y);
    ctx.stroke();
    
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }, [currentPoints, isDrawing, selectedColor, tool, brushSize]);


  const getPoint = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if ((e.target as HTMLElement).tagName === 'BUTTON') return;
    e.preventDefault();
    setIsDrawing(true);
    const point = getPoint(e);
    setCurrentPoints([point]);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault(); 
    const point = getPoint(e);
    setCurrentPoints(prev => [...prev, point]);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    if (currentPoints.length > 1) {
      setPaths(prev => [...prev, {
        points: currentPoints,
        color: tool === 'eraser' ? 'eraser' : selectedColor,
        width: brushSize
      }]);
    }
    setCurrentPoints([]);
  };

  // Safe Save Wrapper
  const handleSave = () => {
    onSave(paths);
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-between animate-in fade-in duration-300 pointer-events-none">
      {/* 
         Canvas Layer 
      */}
      <canvas
        ref={canvasRef}
        // Style width/height controls the display size (CSS pixels)
        style={{ width: '100%', height: '100%', touchAction: 'none' }}
        className="absolute inset-0 cursor-crosshair pointer-events-auto"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      
      {/* Header Actions */}
      <div className="flex justify-between p-4 pointer-events-auto z-50">
         <button 
           onClick={(e) => { e.stopPropagation(); onCancel(); }} 
           className="group flex items-center justify-center w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/70 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 transition-all active:scale-95 shadow-lg"
         >
            <X size={20} />
         </button>
         <button 
           onClick={(e) => { e.stopPropagation(); handleSave(); }} 
           className="group flex items-center justify-center w-10 h-10 rounded-full bg-cyan-500 text-black shadow-[0_0_15px_rgba(34,211,238,0.4)] hover:scale-110 active:scale-95 transition-all"
         >
            <Check size={22} strokeWidth={3} />
         </button>
      </div>

      {/* Toolbar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-auto z-50 w-auto max-w-[90%]">
        <div className="flex flex-col items-center gap-3">
            
            {/* Color Tray (Expandable or Fixed) */}
            <div className={`flex items-center gap-2 bg-neutral-900/90 backdrop-blur-xl border border-white/10 rounded-full p-2 shadow-2xl transition-all duration-300 ${showColorPicker ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none absolute bottom-full mb-2'}`}>
                {NEON_COLORS.map(color => (
                    <button
                        key={color}
                        onClick={(e) => { e.stopPropagation(); setSelectedColor(color); setTool('pen'); }}
                        className={`w-6 h-6 rounded-full transition-all border border-white/10 ${selectedColor === color && tool === 'pen' ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'}`}
                        style={{ backgroundColor: color }}
                    />
                ))}
            </div>

            {/* Main Tools */}
            <div className="flex items-center gap-4 bg-neutral-900/80 backdrop-blur-2xl border border-white/10 rounded-full px-5 py-3 shadow-2xl">
               
               {/* Current Color Indicator / Toggle */}
               <button 
                  onClick={(e) => { e.stopPropagation(); setShowColorPicker(!showColorPicker); }}
                  className="w-8 h-8 rounded-full border-2 border-white/20 transition-transform active:scale-90 relative"
                  style={{ backgroundColor: tool === 'eraser' ? 'transparent' : selectedColor }}
               >
                   {tool === 'eraser' && <div className="absolute inset-0 flex items-center justify-center"><Eraser size={14} className="text-white"/></div>}
                   {tool === 'pen' && <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/30 rounded-full transition-opacity"><Palette size={14} className="text-white"/></div>}
               </button>
               
               <div className="w-px h-6 bg-white/10" />

               <button 
                 onClick={(e) => { e.stopPropagation(); setTool('pen'); }} 
                 className={`p-2 rounded-full transition-all active:scale-90 ${tool === 'pen' ? 'text-cyan-400 bg-white/10' : 'text-neutral-400 hover:text-white'}`}
               >
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle></svg>
               </button>

               <button 
                 onClick={(e) => { e.stopPropagation(); setTool('eraser'); }} 
                 className={`p-2 rounded-full transition-all active:scale-90 ${tool === 'eraser' ? 'text-white bg-white/10' : 'text-neutral-400 hover:text-white'}`}
               >
                 <Eraser size={20} />
               </button>

               <div className="w-px h-6 bg-white/10" />

               <button 
                 onClick={(e) => { e.stopPropagation(); setPaths(p => p.slice(0, -1)); }} 
                 className={`p-2 rounded-full transition-all active:scale-90 ${paths.length === 0 ? 'text-neutral-600' : 'text-neutral-400 hover:text-white'}`}
                 disabled={paths.length === 0}
               >
                 <Undo size={20} />
               </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DrawingCanvas;