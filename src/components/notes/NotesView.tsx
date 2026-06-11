'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Plus, Search, Trash2, ChevronLeft, FileText, Loader2, Save } from 'lucide-react';
import { format } from 'date-fns';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { usePlannerStore } from '@/store/planner-store';

// Dynamically import BlockNoteEditor as it depends on window/document DOM APIs
const BlockNoteEditor = dynamic(() => import('./BlockNoteEditor'), { ssr: false });

interface Note {
  id: string;
  title: string;
  content: string; // JSON Stringified Blocks
  updatedAt: string;
}

type SavingState = 'saved' | 'saving' | 'error' | 'idle';

export default function NotesView() {
  const { showToast } = usePlannerStore();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [savingState, setSavingState] = useState<SavingState>('idle');
  
  // Deletion state
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // We use refs to keep track of the selected note and latest state for the save callback/unmount
  const activeNoteIdRef = useRef<string | null>(null);
  const notesRef = useRef<Note[]>([]);
  notesRef.current = notes;

  // Find currently selected note
  const activeNote = notes.find((n) => n.id === selectedNoteId);
  activeNoteIdRef.current = selectedNoteId;

  // Ref to hold the active note data for the unmount auto-saver
  const activeNoteDataRef = useRef<Note | undefined>(undefined);
  activeNoteDataRef.current = activeNote;

  // 1. Fetch notes on mount
  useEffect(() => {
    async function loadNotes() {
      try {
        const res = await fetch('/api/notes');
        if (res.ok) {
          const data = await res.json();
          setNotes(data);
        } else {
          showToast('Failed to load notes', 'delete');
        }
      } catch (err) {
        console.error(err);
        showToast('Error loading notes', 'delete');
      } finally {
        setLoading(false);
      }
    }
    loadNotes();
  }, [showToast]);

  // 2. Perform DB save
  const saveNoteToDb = async (id: string, title: string, content: string) => {
    try {
      setSavingState('saving');
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, title, content }),
      });
      if (res.ok) {
        setSavingState('saved');
        // Update local updatedAt time returned by DB
        const updated = await res.json();
        if (updated.note) {
          setNotes((prev) =>
            prev.map((n) =>
              n.id === id ? { ...n, updatedAt: updated.note.updatedAt } : n
            )
          );
        }
      } else {
        setSavingState('error');
      }
    } catch (e) {
      console.error(e);
      setSavingState('error');
    }
  };

  // 3. Trigger immediate save if timer exists (flush helper)
  const flushSave = async () => {
    if (timerRef.current && activeNoteDataRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      const { id, title, content } = activeNoteDataRef.current;
      await saveNoteToDb(id, title, content);
    }
  };

  // Auto save on unmount if any changes are pending
  useEffect(() => {
    return () => {
      if (timerRef.current && activeNoteDataRef.current) {
        clearTimeout(timerRef.current);
        const { id, title, content } = activeNoteDataRef.current;
        // Fire and forget sendBeacon or fetch to ensure data isn't lost
        fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, title, content }),
        });
      }
    };
  }, []);

  // 4. Handle edits from Title or BlockNoteEditor
  const handleNoteEdit = (fields: Partial<Pick<Note, 'title' | 'content'>>) => {
    if (!selectedNoteId) return;

    setSavingState('saving');
    
    // Update local state instantly
    setNotes((prev) =>
      prev.map((n) =>
        n.id === selectedNoteId
          ? { ...n, ...fields }
          : n
      )
    );

    // Debounce save request (800ms)
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(async () => {
      timerRef.current = null;
      const latestNotes = notesRef.current;
      const currentNote = latestNotes.find((n) => n.id === selectedNoteId);
      if (currentNote) {
        await saveNoteToDb(currentNote.id, currentNote.title, currentNote.content);
      }
    }, 800);
  };

  // 5. Handle note switching
  const handleSelectNote = async (id: string) => {
    await flushSave();
    setSelectedNoteId(id);
  };

  // 6. Create a new Note
  const handleCreateNote = async () => {
    await flushSave();

    const newId = `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNote: Note = {
      id: newId,
      title: 'Untitled Note',
      content: '', // Start empty
      updatedAt: new Date().toISOString(),
    };

    setLoading(true);
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNote),
      });

      if (res.ok) {
        const responseJson = await res.json();
        const savedNote = responseJson.note || newNote;
        setNotes((prev) => [savedNote, ...prev]);
        setSelectedNoteId(newId);
        showToast('Created new note');
      } else {
        showToast('Failed to create note', 'delete');
      }
    } catch (e) {
      console.error(e);
      showToast('Error creating note', 'delete');
    } finally {
      setLoading(false);
    }
  };

  // 7. Delete a Note
  const handleDeleteConfirm = async () => {
    if (!noteToDelete) return;

    const id = noteToDelete.id;
    // If the note being deleted is active, deselect it
    if (selectedNoteId === id) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setSelectedNoteId(null);
    }

    // Instantly remove locally
    setNotes((prev) => prev.filter((n) => n.id !== id));
    setNoteToDelete(null);

    try {
      const res = await fetch(`/api/notes?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showToast('Note deleted', 'delete');
      } else {
        showToast('Failed to delete note from DB', 'delete');
      }
    } catch (e) {
      console.error(e);
      showToast('Error deleting note', 'delete');
    }
  };

  // Filter notes by search query
  const filteredNotes = notes.filter((n) =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-2rem)] md:h-[calc(100vh-3rem)] overflow-hidden border border-neutral-200 rounded-2xl bg-white mt-4 text-black">
      {/* 1. SIDEBAR PANEL */}
      <div
        className={`${
          selectedNoteId ? 'hidden md:flex' : 'flex'
        } w-full md:w-80 border-r border-divider flex-col h-full bg-neutral-50/30 shrink-0`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-divider space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-lg tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-neutral-500" />
              <span>Notes</span>
            </h2>
            <button
              onClick={handleCreateNote}
              disabled={loading}
              className="p-1.5 hover:bg-neutral-100 rounded-md border border-neutral-200 text-black cursor-pointer hover:border-black transition-colors disabled:opacity-50"
              title="New Note"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 focus:border-black rounded-md pl-9 pr-4 py-1.5 text-xs text-black outline-none placeholder:text-neutral-400 font-semibold"
            />
          </div>
        </div>

        {/* Sidebar Notes List */}
        <div className="flex-1 overflow-y-auto divide-y divide-divider">
          {loading && notes.length === 0 ? (
            <div className="p-8 text-center text-xs font-bold text-neutral-400 flex flex-col items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-black" />
              <span>Loading notes...</span>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="p-8 text-center text-xs font-bold text-neutral-450">
              {searchQuery ? 'No matching notes found' : 'No notes yet. Create one!'}
            </div>
          ) : (
            filteredNotes.map((note) => {
              const isActive = note.id === selectedNoteId;
              const formattedDate = note.updatedAt
                ? format(new Date(note.updatedAt), 'MMM d, h:mm a')
                : '';

              return (
                <div
                  key={note.id}
                  onClick={() => handleSelectNote(note.id)}
                  className={`group relative p-4 pr-10 cursor-pointer transition-colors ${
                    isActive ? 'bg-neutral-100' : 'hover:bg-neutral-50'
                  }`}
                >
                  <div className="space-y-1 pr-2">
                    <h4 className="font-extrabold text-xs text-black truncate leading-tight group-hover:text-black">
                      {note.title || 'Untitled Note'}
                    </h4>
                    <p className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">
                      {formattedDate}
                    </p>
                  </div>
                  {/* Hover trash button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setNoteToDelete(note);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-neutral-400 hover:text-black hover:bg-neutral-200 rounded transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                    title="Delete Note"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. EDITOR WORKSPACE */}
      <div
        className={`${
          selectedNoteId ? 'flex' : 'hidden md:flex'
        } flex-1 flex-col h-full bg-white relative`}
      >
        {activeNote ? (
          <>
            {/* Workspace Header */}
            <div className="h-14 border-b border-divider px-4 md:px-8 flex items-center justify-between shrink-0 select-none bg-white">
              <div className="flex items-center gap-3">
                {/* Back button for mobile view */}
                <button
                  onClick={async () => {
                    await flushSave();
                    setSelectedNoteId(null);
                  }}
                  className="flex md:hidden items-center gap-1 text-xs font-extrabold text-neutral-500 hover:text-black cursor-pointer pr-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>List</span>
                </button>

                {/* Saving status indicator */}
                <div className="flex items-center gap-1.5">
                  {savingState === 'saving' && (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin text-neutral-400" />
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                        Saving...
                      </span>
                    </>
                  )}
                  {savingState === 'saved' && (
                    <>
                      <Save className="w-3 h-3 text-neutral-400" />
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                        Saved
                      </span>
                    </>
                  )}
                  {savingState === 'error' && (
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">
                      Failed to save
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Note Editor Area */}
            <div className="flex-1 overflow-y-auto py-6 md:py-8 px-4 md:px-12 space-y-4">
              {/* Large styled title input */}
              <input
                type="text"
                placeholder="Untitled Note"
                value={activeNote.title}
                onChange={(e) => handleNoteEdit({ title: e.target.value })}
                className="w-full text-3xl font-extrabold border-none outline-none focus:ring-0 text-black pl-[54px] placeholder:text-neutral-300"
              />

              {/* Block Note Dynamic Editor */}
              <div className="pb-16">
                <BlockNoteEditor
                  key={activeNote.id}
                  initialContent={activeNote.content}
                  onChange={(content) => handleNoteEdit({ content })}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-450 border border-neutral-200">
              <FileText className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-sm text-black">No note active</h3>
              <p className="text-xs font-semibold text-neutral-400 max-w-[280px]">
                Create a new note or select an existing one from the sidebar to begin.
              </p>
            </div>
            <button
              onClick={handleCreateNote}
              className="py-1.5 px-4 bg-black text-white text-xs font-black rounded-md hover:bg-neutral-900 transition-colors cursor-pointer"
            >
              New Note
            </button>
          </div>
        )}
      </div>

      {/* Confirmation modal for note deletion */}
      <ConfirmationModal
        isOpen={!!noteToDelete}
        title="Delete Note"
        message={`Are you sure you want to delete "${
          noteToDelete?.title || 'Untitled Note'
        }"? This cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setNoteToDelete(null)}
      />
    </div>
  );
}
