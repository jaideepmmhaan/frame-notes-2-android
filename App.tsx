import React, { useState, useEffect, useRef } from 'react';
import { Note, Theme } from './types';
import Home from './components/Home';
import Editor from './components/Editor';
import SplashScreen from './components/SplashScreen';
import { THEMES } from './constants';
import { RotateCcw } from 'lucide-react';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';

const FILENAME = 'frame_notes_db.json';

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [view, setView] = useState<'home' | 'edit'>('home');
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [theme, setTheme] = useState<Theme>('dark');
  
  // Refs for listeners to access current state
  const viewRef = useRef(view);
  useEffect(() => { viewRef.current = view; }, [view]);

  // Undo State
  const [deletedNote, setDeletedNote] = useState<Note | null>(null);
  const [undoTimer, setUndoTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  // 1. Initialize Android Specifics
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // Status Bar Styling - Critical for OLED look
      const configureStatusBar = async () => {
        try {
          await StatusBar.setOverlaysWebView({ overlay: true });
          await StatusBar.setStyle({ style: Style.Dark });
          // Force transparent background for Android to remove default gray shade
          await StatusBar.setBackgroundColor({ color: '#00000000' }); 
        } catch (e) {
          console.warn("StatusBar plugin error", e);
        }
      };
      configureStatusBar();

      // Hardware Back Button
      CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        if (viewRef.current === 'edit') {
          // If in editor, go back to home (save handled by auto-save in Editor component)
          setActiveNote(null);
          setView('home');
        } else {
          // If in home, exit app
          CapacitorApp.exitApp();
        }
      });
    }
  }, []);

  // 2. Storage: Load Strategy (Filesystem Priority -> LocalStorage Fallback)
  useEffect(() => {
    const loadData = async () => {
      let loaded = false;

      // Try Filesystem first (Source of Truth)
      if (Capacitor.isNativePlatform()) {
        try {
          const result = await Filesystem.readFile({
            path: FILENAME,
            directory: Directory.Data,
            encoding: Encoding.UTF8
          });
          if (result.data) {
            setNotes(JSON.parse(result.data as string));
            loaded = true;
          }
        } catch (e) {
          console.log("Filesystem: DB not found, checking backup.");
        }
      }

      // Fallback to LocalStorage if Filesystem failed or empty (or if Web)
      if (!loaded) {
        const savedNotes = localStorage.getItem('frame_notes_data');
        if (savedNotes) {
          try {
            setNotes(JSON.parse(savedNotes));
          } catch (e) { console.error("LS Error", e); }
        }
      }
      
      // Load Theme
      const savedTheme = localStorage.getItem('frame_notes_theme') as Theme;
      if (savedTheme && THEMES[savedTheme]) {
        setTheme(savedTheme);
      }
    };

    loadData();
  }, []);

  // 3. Storage: Save Strategy (Write to Both)
  useEffect(() => {
    // Immediate LocalStorage update
    localStorage.setItem('frame_notes_data', JSON.stringify(notes));

    // Persistent Filesystem update
    const persistData = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          await Filesystem.writeFile({
            path: FILENAME,
            data: JSON.stringify(notes),
            directory: Directory.Data,
            encoding: Encoding.UTF8
          });
        } catch (e) {
          console.error("Filesystem Write Error", e);
        }
      }
    };
    persistData();
  }, [notes]);

  // Save theme preference
  useEffect(() => {
    localStorage.setItem('frame_notes_theme', theme);
  }, [theme]);

  // --- Handlers ---

  const handleCreateNote = () => {
    setActiveNote(null);
    setView('edit');
  };

  const handleSelectNote = (note: Note) => {
    setActiveNote(note);
    setView('edit');
  };

  const handleSaveNote = (updatedNote: Note) => {
    setNotes(prev => {
      const exists = prev.find(n => n.id === updatedNote.id);
      if (exists) {
        return prev.map(n => n.id === updatedNote.id ? updatedNote : n);
      } else {
        return [updatedNote, ...prev];
      }
    });
    // Keep active note synced
    if (activeNote?.id === updatedNote.id) {
        setActiveNote(updatedNote); 
    }
  };
  
  const handleToggleHideNote = (note: Note) => {
      const updatedNote = { ...note, isHidden: !note.isHidden };
      handleSaveNote(updatedNote);
  };

  const handleTogglePinNote = (note: Note) => {
      const updatedNote = { ...note, isPinned: !note.isPinned };
      handleSaveNote(updatedNote);
  };

  const handleDeleteNote = (noteId: string) => {
    const noteToDelete = notes.find(n => n.id === noteId);
    if (!noteToDelete) return;

    setDeletedNote(noteToDelete);
    setNotes(prev => prev.filter(n => n.id !== noteId));
    
    if (activeNote?.id === noteId) {
        setActiveNote(null);
        setView('home');
    }

    if (undoTimer) clearTimeout(undoTimer);
    const timer = setTimeout(() => {
        setDeletedNote(null);
        setUndoTimer(null);
    }, 5000);
    setUndoTimer(timer);
  };

  const handleUndoDelete = () => {
      if (deletedNote) {
          setNotes(prev => [deletedNote, ...prev]);
          setDeletedNote(null);
          if (undoTimer) {
              clearTimeout(undoTimer);
              setUndoTimer(null);
          }
      }
  };

  const handleBackToHome = () => {
    setActiveNote(null);
    setView('home');
  };

  const themeColors = THEMES[theme];

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <div className="font-sans antialiased text-white h-full min-h-screen">
      {view === 'home' ? (
        <Home 
          notes={notes}
          onCreateNote={handleCreateNote}
          onSelectNote={handleSelectNote}
          currentTheme={theme}
          onSetTheme={setTheme}
          onToggleHideNote={handleToggleHideNote}
          onTogglePinNote={handleTogglePinNote}
          onDeleteNote={handleDeleteNote}
        />
      ) : (
        <Editor 
          note={activeNote}
          onSave={handleSaveNote}
          onBack={handleBackToHome}
          currentTheme={theme}
          onDeleteNote={handleDeleteNote}
        />
      )}

      {/* Global Undo Toast */}
      {deletedNote && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] animate-in slide-in-from-bottom-10 fade-in duration-300">
              <button 
                onClick={handleUndoDelete}
                className={`flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl backdrop-blur-md border ${themeColors.border} ${themeColors.surface} text-white hover:scale-105 active:scale-95 transition-transform`}
              >
                  <span className="text-sm font-medium">Deleted</span>
                  <div className="h-4 w-px bg-white/20"></div>
                  <div className="flex items-center gap-1.5 text-cyan-400">
                      <RotateCcw size={14} />
                      <span className="text-sm font-bold uppercase tracking-wider">Undo</span>
                  </div>
              </button>
          </div>
      )}
    </div>
  );
};

export default App;