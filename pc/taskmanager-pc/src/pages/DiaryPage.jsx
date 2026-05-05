import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Book, PenTool, Calendar, Search, Image as ImageIcon, 
  ChevronRight, ChevronDown, Save, Trash2, Clock, FolderOpen,
  AlertCircle, Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Quote,
  Undo, Redo, Shield, Lock, FolderPlus
} from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { format } from 'date-fns';
import { 
  initDiaryStorage, saveDiaryEntry, loadDiaryEntry, getAllEntries, 
  saveMedia, getDiaryRoot, deleteDiaryEntry, selectCustomStorage, deleteMedia
} from '../lib/diaryStorage';
import { open, ask } from '@tauri-apps/plugin-dialog';
import { exists, readFile } from '@tauri-apps/plugin-fs';
import { join } from '@tauri-apps/api/path';
import { convertFileSrc } from '@tauri-apps/api/core';
import ConfirmModal from '../components/ui/ConfirmModal';

import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';

const DiaryPage = () => {
  const [entries, setEntries] = useState([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'saving', 'error'
  const [expandedGroups, setExpandedGroups] = useState({});
  const [mediaRoot, setMediaRoot] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isMediaDeleteModalOpen, setIsMediaDeleteModalOpen] = useState(false);
  const [mediaToDeleteIndex, setMediaToDeleteIndex] = useState(null);
  const [storageError, setStorageError] = useState(null);
  const [currentRoot, setCurrentRoot] = useState('');
  const [currentMedia, setCurrentMedia] = useState([]);
  const [mediaUrls, setMediaUrls] = useState({});

  const createdUrls = useRef(new Set());
  const currentMediaRef = useRef([]);

  // Sync ref with state
  useEffect(() => {
    currentMediaRef.current = currentMedia;
  }, [currentMedia]);

  // Convert files to Blob URLs for reliable rendering
  useEffect(() => {
    let active = true;
    const convertToUrls = async () => {
      const addedUrls = {};
      let hasNew = false;

      console.log('DiaryPage: Checking media for conversion...', currentMedia.length);

      for (const item of currentMedia) {
        if (!item.fileName || !item.fullPath) continue;
        
        const key = item.fileName;
        console.log('DiaryPage: Processing item:', key);
        
        // Only convert if we don't already have a valid Blob URL in state
        if (!mediaUrls[key]) {
          try {
            const fileExists = await exists(item.fullPath);
            if (!fileExists) {
              console.warn('File does not exist at path:', item.fullPath);
              continue;
            }

            console.log('DiaryPage: Generating Blob URL for:', key);
            const data = await readFile(item.fullPath);
            const blob = new Blob([data]);
            const url = URL.createObjectURL(blob);
            
            if (active) {
              addedUrls[key] = url;
              createdUrls.current.add(url);
              hasNew = true;
              console.log('DiaryPage: Successfully created Blob URL for:', key);
            }
          } catch (err) {
            console.error('DiaryPage: Failed to create Blob URL for:', key, err);
          }
        }
      }

      if (hasNew && active) {
        setMediaUrls(prev => ({ ...prev, ...addedUrls }));
      }
    };

    if (currentMedia && currentMedia.length > 0) {
      convertToUrls();
    }

    return () => {
      active = false;
    };
  }, [currentMedia]);

  useEffect(() => {
    console.log('DiaryPage: mediaUrls updated. Count:', Object.keys(mediaUrls).length);
  }, [mediaUrls]);

  // Cleanup all URLs when the component unmounts
  useEffect(() => {
    return () => {
      createdUrls.current.forEach(url => URL.revokeObjectURL(url));
      createdUrls.current.clear();
    };
  }, []);
  const autosaveTimer = useRef(null);

  // Debounced Autosave Trigger
  const triggerAutosave = useCallback((content) => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    
    setSaveStatus('unsaved');
    
    autosaveTimer.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        await saveDiaryEntry(selectedDate, { 
          content,
          media: currentMediaRef.current 
        });
        setSaveStatus('saved');
        loadEntries();
      } catch (err) {
        console.error('Autosave failed:', err);
        setSaveStatus('error');
      }
    }, 2000);
  }, [selectedDate]);

  // Immediate Save helper
  const immediateSave = async (content, media) => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    setSaveStatus('saving');
    try {
      await saveDiaryEntry(selectedDate, { 
        content,
        media: media || currentMediaRef.current 
      });
      setSaveStatus('saved');
      loadEntries();
    } catch (err) {
      console.error('Immediate save failed:', err);
      setSaveStatus('error');
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Placeholder.configure({
        placeholder: 'Write your thoughts for today...',
      }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      triggerAutosave(editor.getHTML());
    },
  });

  useEffect(() => {
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, []);

  const loadEntries = async () => {
    try {
      const root = await getDiaryRoot();
      if (!root) return;
      
      const all = await getAllEntries();
      setEntries(all);
      
      // Auto-expand current month
      const currentMonth = format(new Date(), 'yyyy-MM');
      setExpandedGroups(prev => ({ ...prev, [currentMonth]: true }));
    } catch (err) {
      console.error('Failed to load entries:', err);
    }
  };

  const loadCurrentEntry = useCallback(async (date) => {
    const root = await getDiaryRoot();
    if (!root) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await loadDiaryEntry(date);
      console.log('DiaryPage: Loaded entry data:', data);
      
      if (data && editor) {
        editor.commands.setContent(data.content || '');
        const loadedMedia = data.media || [];
        console.log('DiaryPage: Setting current media:', loadedMedia);
        setCurrentMedia(loadedMedia);
      } else if (editor) {
        editor.commands.setContent('');
        setCurrentMedia([]);
      }
    } catch (err) {
      console.error('Failed to load entry:', err);
    } finally {
      setLoading(false);
    }
  }, [editor]);

  useEffect(() => {
    const init = async () => {
      try {
        const root = await initDiaryStorage();
        if (!root) {
          setStorageError('No storage path selected. Click the folder icon to get started.');
          setLoading(false);
          return;
        }
        setCurrentRoot(root);
        const media = await join(root, 'media');
        setMediaRoot(media);
        await loadEntries();
      } catch (err) {
        console.error('Initialization failed:', err);
        setStorageError(err.message || 'Select a folder');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleChangeStorage = async () => {
    try {
      const selected = await selectCustomStorage();
      if (selected) {
        setStorageError(null);
        setCurrentRoot(selected);
        setMediaRoot(await join(selected, 'media'));
        await loadEntries();
      }
    } catch (err) {
      setStorageError('Permission denied or invalid path.');
    }
  };

  useEffect(() => {
    loadCurrentEntry(selectedDate);
  }, [selectedDate, loadCurrentEntry]);

  const handleManualSave = async () => {
    if (!editor) return;
    
    // Clear any pending autosave to prevent clashing
    if (autosaveTimer.current) {
      clearTimeout(autosaveTimer.current);
    }
    
    setIsSaving(true);
    setSaveStatus('saving');
    
    try {
      const content = editor.getHTML();
      console.log('Manual save initiated for date:', selectedDate);
      
      await saveDiaryEntry(selectedDate, { 
        content,
        media: currentMediaRef.current
      });
      
      setSaveStatus('saved');
      console.log('Manual save successful.');
      
      // Refresh the sidebar list
      await loadEntries();
    } catch (err) {
      console.error('Manual save failed:', err);
      setSaveStatus('error');
      alert(`Save Error: ${err.message || err}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddImage = async () => {
    const selected = await open({
      multiple: false,
      filters: [{ name: 'Image', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'] }]
    });

    if (selected && editor) {
      try {
        const { fileName, fullPath } = await saveMedia(selected);
        const newMedia = [...currentMedia, { fileName, fullPath }];
        setCurrentMedia(newMedia);
        // Sync ref immediately for the immediateSave call
        currentMediaRef.current = newMedia;
        await immediateSave(editor.getHTML(), newMedia);
      } catch (err) {
        console.error('Failed to add image:', err);
        alert(`Failed to save image: ${err.message || err}`);
      }
    }
  };

  const handleDeleteMedia = (index) => {
    setMediaToDeleteIndex(index);
    setIsMediaDeleteModalOpen(true);
  };

  const confirmMediaDelete = async () => {
    if (mediaToDeleteIndex === null) return;
    
    const item = currentMedia[mediaToDeleteIndex];
    setIsMediaDeleteModalOpen(false);

    try {
      // Physically delete from folder
      await deleteMedia(item.fullPath);
      
      // Remove from state
      const newMedia = currentMedia.filter((_, i) => i !== mediaToDeleteIndex);
      setCurrentMedia(newMedia);
      currentMediaRef.current = newMedia;
      
      // Trigger immediate save to update the JSON entry
      if (editor) await immediateSave(editor.getHTML(), newMedia);
      
      setMediaToDeleteIndex(null);
    } catch (err) {
      console.error('Failed to delete media:', err);
      alert('Error deleting file.');
    }
  };

  const handleDelete = async () => {
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    setIsDeleteModalOpen(false);
    setLoading(true);
    try {
      const deleted = await deleteDiaryEntry(selectedDate);
      if (deleted) {
        await loadEntries();
        if (editor) editor.commands.setContent('');
        setCurrentMedia([]);
      }
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete entry.');
    } finally {
      setLoading(false);
    }
  };

  const groupEntries = () => {
    const filtered = entries.filter(e => 
      e.date.includes(searchQuery) || 
      (e.month && e.month.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.year && e.year.toString().includes(searchQuery))
    );

    const groups = {};
    filtered.forEach(entry => {
      const monthKey = `${entry.year}-${entry.month}`;
      if (!groups[monthKey]) groups[monthKey] = [];
      groups[monthKey].push(entry);
    });
    return groups;
  };

  const toggleGroup = (key) => {
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const groups = groupEntries();

  return (
    <div className="diary-container">
      <aside className="diary-sidebar">
        <div className="sidebar-header">
          <div className="header-top">
            <div className="header-title">
              <Book size={20} className="accent" />
              <span>My Journal</span>
            </div>
            <button className="storage-settings-btn" onClick={handleChangeStorage} title="Change Storage Location">
              <FolderOpen size={16} />
            </button>
          </div>
          <div className="search-box">
            <Search size={14} />
            <input type="text" placeholder="Search dates..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>

        <div className="entries-list">
          <div 
            className={`entry-item today ${selectedDate === format(new Date(), 'yyyy-MM-dd') ? 'active' : ''}`}
            onClick={() => {
              if (selectedDate !== format(new Date(), 'yyyy-MM-dd')) {
                setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
              }
            }}
          >
            <div className="today-badge">LIVE</div>
            <PenTool size={16} />
            <div className="entry-info">
              <span className="date">Today</span>
              <span className="preview">Editing...</span>
            </div>
          </div>

          {Object.keys(groups).sort().reverse().map(monthKey => (
            <div key={monthKey} className="month-group">
              <div className="group-header" onClick={() => toggleGroup(monthKey)}>
                {expandedGroups[monthKey] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <span>{format(new Date(monthKey + '-01'), 'MMMM yyyy')}</span>
              </div>
              {expandedGroups[monthKey] && (
                <div className="group-items">
                  {groups[monthKey].map(entry => (
                    <div key={entry.date} className={`entry-item ${selectedDate === entry.date ? 'active' : ''}`} onClick={() => setSelectedDate(entry.date)}>
                      <Calendar size={14} />
                      <div className="entry-info"><span className="date">{format(new Date(entry.date), 'do EEE')}</span></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>

        <main className="diary-editor-container">
          {!currentRoot ? (
            <div className="onboarding-placeholder">
              <div className="placeholder-content">
                <div className="icon-stack">
                  <FolderOpen size={48} className="base-icon" />
                  <Lock size={20} className="overlay-icon" />
                </div>
                <h2>Your Journal, Your Privacy</h2>
                <p>Select a local folder to start your private diary. Every word and image stays 100% on your machine.</p>
                <button className="setup-btn" onClick={handleChangeStorage}>
                  <FolderPlus size={18} />
                  <span>Choose Workspace Folder</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="editor-inner-card">
              <div className="editor-header">
                <div className="date-section">
                  <div className="date-main">
                    <span className="day-name">{format(new Date(selectedDate.replace(/-/g, '/')), 'EEEE')}</span>
                    <h1>{format(new Date(selectedDate.replace(/-/g, '/')), 'MMMM do, yyyy')}</h1>
                  </div>
                  <div className="editor-meta">
                    <div className="meta-item">
                      <Clock size={12} />
                      <span>{format(new Date(), 'hh:mm a')}</span>
                    </div>
                    <div className={`status-pill ${saveStatus}`} title={saveStatus === 'error' ? 'Failed to save. Check storage settings.' : ''}>
                      <div className="status-dot" />
                      <span>
                        {saveStatus === 'saving' ? 'Syncing...' : 
                         saveStatus === 'unsaved' ? 'Changes pending...' :
                         saveStatus === 'error' ? 'Save Error' :
                         'Encrypted & Saved'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="editor-controls">
                  <div className="control-group">
                    <button className="icon-btn add-btn" onClick={handleAddImage} title="Attach Image">
                      <ImageIcon size={18} />
                    </button>
                    <button className="icon-btn delete-btn" onClick={handleDelete} title="Delete Entry">
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <button className="action-btn save-btn" onClick={handleManualSave} disabled={isSaving}>
                    <Save size={16} />
                    <span>{isSaving ? 'Saving...' : 'Save Now'}</span>
                  </button>
                </div>
              </div>

              <div className="editor-toolbar-wrapper">
                <div className="toolbar-floating">
                  <div className="toolbar-section">
                    <button 
                      className={`tool-btn ${editor?.isActive('bold') ? 'active' : ''}`}
                      onClick={() => editor?.chain().focus().toggleBold().run()}
                    >
                      <Bold size={16} />
                    </button>
                    <button 
                      className={`tool-btn ${editor?.isActive('italic') ? 'active' : ''}`}
                      onClick={() => editor?.chain().focus().toggleItalic().run()}
                    >
                      <Italic size={16} />
                    </button>
                    <button 
                      className={`tool-btn ${editor?.isActive('underline') ? 'active' : ''}`}
                      onClick={() => editor?.chain().focus().toggleUnderline().run()}
                    >
                      <UnderlineIcon size={16} />
                    </button>
                  </div>
                  <div className="tool-divider" />
                  <div className="toolbar-section">
                    <button 
                      className={`tool-btn ${editor?.isActive('bulletList') ? 'active' : ''}`}
                      onClick={() => editor?.chain().focus().toggleBulletList().run()}
                    >
                      <List size={16} />
                    </button>
                    <button 
                      className={`tool-btn ${editor?.isActive('orderedList') ? 'active' : ''}`}
                      onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                    >
                      <ListOrdered size={16} />
                    </button>
                  </div>
                  <div className="tool-divider" />
                  <div className="toolbar-section">
                    <button className="tool-btn" onClick={() => editor?.chain().focus().undo().run()}>
                      <Undo size={16} />
                    </button>
                    <button className="tool-btn" onClick={() => editor?.chain().focus().redo().run()}>
                      <Redo size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="editor-viewport">
                <EditorContent editor={editor} className="tiptap-view" />
              </div>
            </div>
          )}
        </main>

        <aside className="diary-media-panel">
          <div className="panel-header">
            <ImageIcon size={18} />
            <span>Media Gallery</span>
            <span className="count">{currentMedia.length}</span>
          </div>
          
          <div className="media-grid">
            {currentMedia.length > 0 ? (
              currentMedia.map((item, index) => (
                <div key={`${item.fileName}-${index}`} className="media-item">
                  <img 
                    src={mediaUrls[item.fileName] || (item.fullPath ? convertFileSrc(item.fullPath.replace(/\\/g, '/')) : '')} 
                    alt="Diary attachment" 
                    loading="lazy"
                    title={item.fullPath}
                    data-filename={item.fileName}
                    onError={(e) => {
                      console.error("Image load failed for:", item.fileName, "Path:", item.fullPath);
                    }}
                  />
                  <div style={{ fontSize: '10px', opacity: 0.5, marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {mediaUrls[item.fileName] ? 'Blob URL' : 'Asset Protocol'}
                  </div>
                  <div className="item-overlay">
                    <button className="delete-media-btn" onClick={() => handleDeleteMedia(index)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-media">
                <div className="empty-icon-circle">
                  <ImageIcon size={24} />
                </div>
                <p>Gallery is empty</p>
                <span>Attach photos to this entry</span>
              </div>
            )}
          </div>
        </aside>

        <ConfirmModal 
          isOpen={isDeleteModalOpen}
          onCancel={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDelete}
          title="Vanish Entry?"
          message="This will permanently delete this day's entry and all its associated media. This action cannot be undone."
          confirmText="Delete Permanently"
          type="danger"
        />

        <ConfirmModal 
          isOpen={isMediaDeleteModalOpen}
          onCancel={() => {
            setIsMediaDeleteModalOpen(false);
            setMediaToDeleteIndex(null);
          }}
          onConfirm={confirmMediaDelete}
          title="Delete Image?"
          message="Are you sure you want to permanently delete this image from your PC? This cannot be undone."
          confirmText="Delete Permanently"
          type="danger"
        />
    </div>
  );
};

export default DiaryPage;
