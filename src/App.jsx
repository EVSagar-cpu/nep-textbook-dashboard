import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Menu, X, LogOut, Eye, Edit2, BookOpen, Plus, Download, RefreshCw,
  Mail, Check, AlertCircle, Copy, Users, Image, Sparkles, Palette,
  ChevronDown, ChevronUp, Loader2, ImagePlus, Layers, Trash2,
  Pencil, Save, XCircle, Link, Maximize2, ZoomIn
} from 'lucide-react';
import {
  detectErrorType,
  showDetailedError,
  logError,
  checkAPIHealth
} from './utils/errorHandling';

// ===== SUPABASE CLIENT =====
const supabase = createClient(
  'https://syacvhjmcgpgxvczassp.supabase.co',
  'sb_publishable_tmoQwBjJYHyMnOSGAzts2w_v-aG0iYl'
);

// ===== COLORS =====
const COLORS = {
  navActive: '#2563eb',
  navText: '#5a6978',
  navDisabled: '#cbd5e0',
  darkText: '#0f172a',
  lightText: '#6b7280',
  white: '#ffffff',
  lightBg: '#f9fafb',
  filterBg: '#f3f4f6',
  borderColor: '#e5e7eb',
  sidebarBg: '#f5f6f8',
  statusGenerating: '#8b5cf6',
  statusGenerated: '#10b981',
  statusPending: '#9ca3af',
  successBg: '#ecfdf5',
  successBorder: '#a7f3d0',
  successText: '#065f46',
  errorBg: '#fef2f2',
  errorBorder: '#fecaca',
  errorText: '#991b1b',
};

const FONT_FAMILY = 'Lexend, sans-serif';

// ===== IMAGE GENERATION MODELS =====
const IMAGE_MODELS = [
  { id: 'openai', label: 'OpenAI DALL-E', color: '#10a37f' },
  { id: 'gemini', label: 'Google Gemini', color: '#4285f4' },
  { id: 'kling', label: 'Kling AI', color: '#ff6b35' },
  { id: 'midjourney', label: 'Midjourney', color: '#7c3aed' },
];

// ===== GOOGLE FONTS =====
const GOOGLE_FONTS = [
  'Montserrat', 'Lexend', 'Poppins', 'Roboto', 'Open Sans', 'Lato',
  'Nunito', 'Raleway', 'Playfair Display', 'Merriweather', 'Source Sans 3',
  'PT Serif', 'Libre Baskerville', 'Crimson Text', 'Work Sans', 'DM Sans',
  'Inter', 'Outfit', 'Quicksand', 'Josefin Sans', 'Caveat', 'Pacifico',
  'Dancing Script', 'Comfortaa', 'Bitter', 'Noto Sans', 'Ubuntu',
  'Mukta', 'Tiro Devanagari Hindi', 'Hind'
];

const FONT_SIZES = ['10', '12', '13', '14', '16', '18', '20', '24', '28', '32', '36', '48'];

// ===== PAPER SIZES =====
const PAPER_SIZES = {
  'A4': { width: 210, height: 297, label: 'A4 (210 × 297 mm)' },
  'A3': { width: 297, height: 420, label: 'A3 (297 × 420 mm)' },
  'Letter': { width: 216, height: 279, label: 'Letter (8.5 × 11 in)' },
  'Legal': { width: 216, height: 356, label: 'Legal (8.5 × 14 in)' },
};

// ===== GENERATE UNIQUE ID =====
const generateId = () => Math.random().toString(36).substring(2, 10) + Date.now().toString(36);

export default function App() {
  // ===== AUTH & LAYOUT =====
  const [currentUser, setCurrentUser] = useState(null);
  const [authPage, setAuthPage] = useState('login');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // ===== INVITE SYSTEM =====
  const [showInvitePanel, setShowInvitePanel] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');
  const [pendingInvites, setPendingInvites] = useState([]);

  // ===== PASSWORD SETUP =====
  const [setupToken, setSetupToken] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupPasswordConfirm, setSetupPasswordConfirm] = useState('');
  const [setupError, setSetupError] = useState('');
  const [setupLoading, setSetupLoading] = useState(false);

  // ===== LOGIN =====
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // ===== RECORDS & FILTERS =====
  const [records, setRecords] = useState([]);
  const [filterClass, setFilterClass] = useState('All Classes');
  const [filterSubject, setFilterSubject] = useState('All Subjects');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [filterTopic, setFilterTopic] = useState('');
  const [filterContentType, setFilterContentType] = useState('All Types');

  // ===== CONTENT TYPE OPTIONS =====
  const CONTENT_TYPES = [
    'Textbook', 'Lesson Plan', 'Assignment', 'Project Paper',
    'Practice Questions', 'Flash Cards', 'Mock Exam', 'MCQ QP',
    'Descriptive QP', 'Interactive Scroll', 'Live Worksheet'
  ];

  // ===== FORM DATA =====
  const [showAddForm, setShowAddForm] = useState(false);
  const [formClass, setFormClass] = useState('1');
  const [formSubject, setFormSubject] = useState('English');
  const [formTopic, setFormTopic] = useState('');
  const [formSubTopic, setFormSubTopic] = useState('');
  const [formContentType, setFormContentType] = useState('');
  const [formPrompt, setFormPrompt] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // ===== VIEW MODAL =====
  const [viewingRecord, setViewingRecord] = useState(null);
  const [viewTab, setViewTab] = useState('content');

  // ===== CONTENT EDITOR =====
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [savingContent, setSavingContent] = useState(false);
  const contentEditorRef = useRef(null);
  const selectionRef = useRef({ start: 0, end: 0 });
  const [editorFont, setEditorFont] = useState('Montserrat');
  const [editorFontSize, setEditorFontSize] = useState('13');
  const [showAssetPicker, setShowAssetPicker] = useState(false);

  // ===== VISUAL PROMPTS STATE =====
  const [generatingImageId, setGeneratingImageId] = useState(null);
  const [visualMessage, setVisualMessage] = useState('');

  // ===== LIGHTBOX =====
  const [lightboxImage, setLightboxImage] = useState(null);

  // ===== SUBJECTS =====
  const subjects = [
    'English', 'Mathematics', 'Science', 'Social Studies', 'Social Science',
    'मधुबन सरल-SL', 'तरंग-TL', 'Arts', 'Physical Education',
    'Environmental Studies', 'General Knowledge', 'Computers'
  ];

  // ===== PAGE SETTINGS =====
  const [pageSettings, setPageSettings] = useState(() => {
    const saved = localStorage.getItem('pdfPageSettings');
    return saved ? JSON.parse(saved) : {
      paperSize: 'A4', orientation: 'portrait',
      customWidth: 210, customHeight: 297, margins: 10,
    };
  });

  // ===== LOAD FONTS & LIBS =====
  useEffect(() => {
    const fontFamilies = GOOGLE_FONTS.map(f => 'family=' + f.replace(/ /g, '+') + ':wght@400;500;600;700').join('&');
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?' + fontFamilies + '&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    localStorage.setItem('pdfPageSettings', JSON.stringify(pageSettings));
  }, [pageSettings]);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('invite_token=')) {
      const token = new URLSearchParams(hash.substring(1)).get('invite_token');
      if (token) { setSetupToken(token); setAuthPage('setup-password'); }
    }
    checkAuth();
    checkAPIHealth().then(health => {
      if (!health.healthy) console.warn('⚠️ Claude API may be experiencing issues');
    });
  }, []);

  // ===== CHECK AUTH =====
  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: roleData } = await supabase
        .from('user_roles').select('role').eq('user_id', user.id).single();
      const userWithRole = {
        ...user,
        user_metadata: { ...user.user_metadata, role: roleData?.role || 'content_developer' }
      };
      setCurrentUser(userWithRole);
      setAuthPage('dashboard');
      fetchRecords();
    }
  };

  // ===== ADVANCED MARKDOWN PARSER =====
  const parseMarkdownToReact = (markdown) => {
    if (!markdown) return null;
    const SPACING = { paragraph: '16px', heading: '18px', list: '16px', table: '18px', code: '16px', blockquote: '16px' };

    const lines = markdown.split('\n');
    const result = [];
    let i = 0;
    let listItems = [];
    let tableLines = [];
    let codeBlock = [];
    let inCodeBlock = false;

    const flushList = () => {
      if (listItems.length > 0) {
        result.push(
          <ul key={`list-${result.length}`} style={{ marginLeft: '24px', marginBottom: SPACING.list }}>
            {listItems.map((item, idx) => (
              <li key={idx} style={{ marginBottom: '6px', lineHeight: '1.6' }}>{renderInlineMarkdown(item)}</li>
            ))}
          </ul>
        );
        listItems = [];
      }
    };

    const flushTable = () => {
      if (tableLines.length > 0) {
        const rows = tableLines.map(line => line.split('|').map(cell => cell.trim()).filter(cell => cell));
        if (rows.length > 0) {
          result.push(
            <table key={`table-${result.length}`} style={{ width: '100%', borderCollapse: 'collapse', margin: '16px 0', fontSize: '12px', border: `1px solid ${COLORS.borderColor}`, pageBreakInside: 'avoid', tableLayout: 'auto' }}>
              <thead>
                <tr style={{ background: '#64748b', color: 'white' }}>
                  {rows[0].map((cell, idx) => (
                    <th key={idx} style={{ padding: '12px', textAlign: 'left', fontWeight: '600', borderBottom: '2px solid #475569', whiteSpace: 'normal', wordBreak: 'break-word' }}>{cell}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(1).map((row, rowIdx) => (
                  <tr key={rowIdx} style={{ background: rowIdx % 2 === 0 ? '#f9fafb' : '#ffffff', borderBottom: `1px solid ${COLORS.borderColor}` }}>
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} style={{ padding: '12px', borderRight: cellIdx < row.length - 1 ? `1px solid ${COLORS.borderColor}` : 'none', whiteSpace: 'normal', wordBreak: 'break-word', verticalAlign: 'top' }}>{renderInlineMarkdown(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          );
        }
        tableLines = [];
      }
    };

    const flushCodeBlock = () => {
      if (codeBlock.length > 0) {
        result.push(
          <pre key={`code-${result.length}`} style={{ background: '#1f2937', color: '#e5e7eb', padding: '14px', borderRadius: '6px', overflowX: 'auto', margin: '12px 0', fontSize: '12px', lineHeight: '1.5', border: '1px solid #374151', fontFamily: 'monospace', pageBreakInside: 'avoid' }}>
            <code>{codeBlock.join('\n')}</code>
          </pre>
        );
        codeBlock = [];
      }
    };

    const renderInlineMarkdown = (text) => {
      if (!text) return null;
      const latexRegex = /(\$\$[^\$]+\$\$|\$[^\$]+\$)/g;
      const mathParts = text.split(latexRegex);
      return mathParts.map((part, idx) => {
        if (part.startsWith('$$')) {
          return <div key={idx} style={{ background: '#f0f9ff', padding: '12px', margin: '8px 0', borderLeft: '4px solid #2563eb', fontFamily: 'monospace', overflow: 'auto', fontSize: '12px' }}>{part.replace(/\$\$/g, '')}</div>;
        } else if (part.startsWith('$')) {
          return <code key={idx} style={{ background: '#f0f9ff', padding: '2px 6px', borderRadius: '3px', fontFamily: 'monospace', fontSize: '12px' }}>{part.replace(/\$/g, '')}</code>;
        }
        const formatted = part
          .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight:600">$1</strong>')
          .replace(/__(.*?)__/g, '<strong style="font-weight:600">$1</strong>')
          .replace(/\*(.*?)\*/g, '<em style="font-style:italic">$1</em>')
          .replace(/_(.*?)_/g, '<em style="font-style:italic">$1</em>')
          .replace(/`(.*?)`/g, '<code style="background:#f3f4f6;padding:2px 6px;border-radius:3px;font-family:monospace">$1</code>');
        if (formatted !== part) return <span key={idx} dangerouslySetInnerHTML={{ __html: formatted }} />;
        return part;
      });
    };

    while (i < lines.length) {
      const line = lines[i];
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) { flushCodeBlock(); inCodeBlock = false; } else { inCodeBlock = true; }
        i++; continue;
      }
      if (inCodeBlock) { codeBlock.push(line); i++; continue; }
      if (line.includes('|') && line.trim().length > 2) { tableLines.push(line); i++; continue; }
      if (tableLines.length > 0 && (!line.includes('|') || line.trim().length < 2)) { flushTable(); }

      if (line.startsWith('###')) { flushList(); result.push(<h3 key={i} style={{ fontSize: '15px', margin: '12px 0 8px 0', fontWeight: '600', color: COLORS.darkText, pageBreakAfter: 'avoid' }}>{renderInlineMarkdown(line.replace(/^#+\s*/, ''))}</h3>); i++; continue; }
      if (line.startsWith('##')) { flushList(); result.push(<h2 key={i} style={{ fontSize: '17px', margin: '14px 0 10px 0', fontWeight: '600', color: COLORS.darkText, pageBreakAfter: 'avoid' }}>{renderInlineMarkdown(line.replace(/^#+\s*/, ''))}</h2>); i++; continue; }
      if (line.startsWith('#')) { flushList(); result.push(<h1 key={i} style={{ fontSize: '20px', margin: '16px 0 12px 0', fontWeight: '700', color: COLORS.darkText, pageBreakAfter: 'avoid' }}>{renderInlineMarkdown(line.replace(/^#+\s*/, ''))}</h1>); i++; continue; }

      if (line.trim().startsWith('-') || line.trim().startsWith('*') || /^\d+\./.test(line.trim())) {
        const itemText = line.replace(/^[\s\-\*]+|\d+\.\s*/, '').trim();
        if (itemText) listItems.push(itemText);
        i++; continue;
      }
      if (line.startsWith('>')) { flushList(); result.push(<blockquote key={i} style={{ borderLeft: '4px solid #2563eb', paddingLeft: '12px', margin: '12px 0', background: '#f0f9ff', padding: '10px 12px', fontSize: '13px', fontStyle: 'italic', color: '#475569', pageBreakInside: 'avoid' }}>{renderInlineMarkdown(line.replace(/^>\s*/, ''))}</blockquote>); i++; continue; }
      if (line.trim().length === 0) { flushList(); result.push(<div key={i} style={{ height: '8px' }} />); i++; continue; }

      // Inline image rendering
      const imgMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
      if (imgMatch) {
        flushList();
        result.push(
          <div key={i} style={{ margin: '16px 0', textAlign: 'center', pageBreakInside: 'avoid' }}>
            <img src={imgMatch[2]} alt={imgMatch[1]} style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px', border: `1px solid ${COLORS.borderColor}`, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer' }} onClick={() => setLightboxImage(imgMatch[2])} />
            {imgMatch[1] && <p style={{ fontSize: '11px', color: COLORS.lightText, marginTop: '6px', fontStyle: 'italic' }}>{imgMatch[1]}</p>}
          </div>
        );
        i++; continue;
      }

      if (line.trim()) { flushList(); result.push(<p key={i} style={{ margin: '8px 0', lineHeight: '1.6', color: COLORS.darkText, pageBreakInside: 'avoid' }}>{renderInlineMarkdown(line)}</p>); }
      i++;
    }
    flushList(); flushTable(); flushCodeBlock();
    return result;
  };

  // ===== GET PAPER DIMENSIONS =====
  const getPaperDimensions = () => {
    let width, height;
    if (pageSettings.paperSize === 'Custom') { width = pageSettings.customWidth; height = pageSettings.customHeight; }
    else { const size = PAPER_SIZES[pageSettings.paperSize]; width = size.width; height = size.height; }
    if (pageSettings.orientation === 'landscape') [width, height] = [height, width];
    return { width, height };
  };

  // ===== VISUAL PROMPTS HELPERS =====
  const getVisualPrompts = (record) => {
    if (!record?.visual_prompts) return [];
    try { return Array.isArray(record.visual_prompts) ? record.visual_prompts : JSON.parse(record.visual_prompts); }
    catch { return []; }
  };

  const getCharacterPrompts = (record) => getVisualPrompts(record).filter(p => p.type === 'character');
  const getScenePrompts = (record) => getVisualPrompts(record).filter(p => p.type === 'scene');
  const getGeneratedImages = (record) => getVisualPrompts(record).filter(p => p.image_url);

  // ===== UPDATE VISUAL PROMPTS IN DB =====
  const saveVisualPrompts = async (recordId, prompts) => {
    const { error } = await supabase
      .from('textbook_content')
      .update({ visual_prompts: prompts, updated_at: new Date() })
      .eq('record_id', recordId);
    if (error) throw error;
  };

  // ===== ADD NEW VISUAL PROMPT =====
  const handleAddVisualPrompt = async (type) => {
    if (!viewingRecord) return;
    const prompts = getVisualPrompts(viewingRecord);
    const newPrompt = {
      id: generateId(),
      type,
      prompt: '',
      image_url: null,
      model_used: null,
      reference_ids: [],
      status: 'pending',
      created_at: new Date().toISOString()
    };
    const updated = [...prompts, newPrompt];
    try {
      await saveVisualPrompts(viewingRecord.record_id, updated);
      setViewingRecord({ ...viewingRecord, visual_prompts: updated });
      setVisualMessage(`✅ New ${type} prompt added`);
      fetchRecords();
    } catch (err) {
      setVisualMessage(`❌ Failed to add prompt: ${err.message}`);
    }
  };

  // ===== UPDATE PROMPT TEXT =====
  const handleUpdatePromptText = async (promptId, newText) => {
    if (!viewingRecord) return;
    const prompts = getVisualPrompts(viewingRecord);
    const updated = prompts.map(p => p.id === promptId ? { ...p, prompt: newText } : p);
    try {
      await saveVisualPrompts(viewingRecord.record_id, updated);
      setViewingRecord({ ...viewingRecord, visual_prompts: updated });
    } catch (err) {
      setVisualMessage(`❌ Failed to update prompt: ${err.message}`);
    }
  };

  // ===== UPDATE REFERENCE IDS FOR SCENE =====
  const handleToggleReference = async (sceneId, characterId) => {
    if (!viewingRecord) return;
    const prompts = getVisualPrompts(viewingRecord);
    const updated = prompts.map(p => {
      if (p.id !== sceneId) return p;
      const refs = p.reference_ids || [];
      const newRefs = refs.includes(characterId)
        ? refs.filter(r => r !== characterId)
        : [...refs, characterId];
      return { ...p, reference_ids: newRefs };
    });
    try {
      await saveVisualPrompts(viewingRecord.record_id, updated);
      setViewingRecord({ ...viewingRecord, visual_prompts: updated });
    } catch (err) {
      setVisualMessage(`❌ Failed to update references: ${err.message}`);
    }
  };

  // ===== DELETE VISUAL PROMPT =====
  const handleDeleteVisualPrompt = async (promptId) => {
    if (!viewingRecord) return;
    if (!window.confirm('Delete this prompt and its image?')) return;
    const prompts = getVisualPrompts(viewingRecord);
    const updated = prompts.filter(p => p.id !== promptId);
    // Also remove from reference_ids of scene prompts
    const cleaned = updated.map(p => ({
      ...p,
      reference_ids: (p.reference_ids || []).filter(r => r !== promptId)
    }));
    try {
      await saveVisualPrompts(viewingRecord.record_id, cleaned);
      setViewingRecord({ ...viewingRecord, visual_prompts: cleaned });
      setVisualMessage('✅ Prompt deleted');
      fetchRecords();
    } catch (err) {
      setVisualMessage(`❌ Failed to delete: ${err.message}`);
    }
  };

  // ===== GENERATE IMAGE FOR A PROMPT =====
  const handleGenerateImage = async (promptId, model) => {
    if (!viewingRecord) return;
    const prompts = getVisualPrompts(viewingRecord);
    const target = prompts.find(p => p.id === promptId);
    if (!target || !target.prompt.trim()) {
      setVisualMessage('⚠️ Write a prompt description first');
      return;
    }

    setGeneratingImageId(promptId);
    setVisualMessage('');

    try {
      // Gather reference images for scene type
      let referenceImages = [];
      if (target.type === 'scene' && target.reference_ids?.length > 0) {
        referenceImages = prompts
          .filter(p => target.reference_ids.includes(p.id) && p.image_url)
          .map(p => p.image_url);
      }

      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: {
          record_id: viewingRecord.record_id,
          prompt_id: promptId,
          type: target.type,
          prompt: target.prompt,
          model: model,
          reference_images: referenceImages,
        }
      });

      if (error) throw error;

      if (data?.image_url) {
        const updated = prompts.map(p =>
          p.id === promptId ? { ...p, image_url: data.image_url, model_used: model, status: 'generated' } : p
        );
        await saveVisualPrompts(viewingRecord.record_id, updated);
        setViewingRecord({ ...viewingRecord, visual_prompts: updated });
        setVisualMessage(`✅ Image generated with ${IMAGE_MODELS.find(m => m.id === model)?.label || model}!`);
        fetchRecords();
      } else {
        throw new Error('No image URL returned');
      }
    } catch (err) {
      console.error('Image generation error:', err);
      setVisualMessage(`❌ Generation failed: ${err.message}. Make sure the generate-image Edge Function is deployed.`);
    } finally {
      setGeneratingImageId(null);
    }
  };

  // ===== CONTENT EDITING =====
  const handleStartEditing = () => {
    setEditContent(viewingRecord?.ai_output || '');
    setIsEditing(true);
    setShowAssetPicker(false);
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    setEditContent('');
    setShowAssetPicker(false);
  };

  // ===== TOOLBAR FORMATTING HELPERS =====
  // Track selection continuously so it persists when toolbar buttons are clicked
  const trackSelection = () => {
    const textarea = contentEditorRef.current;
    if (textarea) {
      selectionRef.current = { start: textarea.selectionStart, end: textarea.selectionEnd };
    }
  };

  const applyFormat = (prefix, suffix) => {
    const textarea = contentEditorRef.current;
    if (!textarea) return;
    const start = selectionRef.current.start;
    const end = selectionRef.current.end;
    const selected = editContent.substring(start, end);
    const before = editContent.substring(0, start);
    const after = editContent.substring(end);

    if (selected) {
      const newContent = before + prefix + selected + suffix + after;
      setEditContent(newContent);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, end + prefix.length);
        selectionRef.current = { start: start + prefix.length, end: end + prefix.length };
      }, 50);
    } else {
      const placeholder = 'text';
      const newContent = before + prefix + placeholder + suffix + after;
      setEditContent(newContent);
      setTimeout(() => {
        textarea.focus();
        const s = start + prefix.length;
        const e = s + placeholder.length;
        textarea.setSelectionRange(s, e);
        selectionRef.current = { start: s, end: e };
      }, 50);
    }
  };

  const applyBold = () => applyFormat('**', '**');
  const applyItalic = () => applyFormat('*', '*');
  const applyUnderline = () => applyFormat('<u>', '</u>');
  const applyStrikethrough = () => applyFormat('~~', '~~');
  const applyCode = () => applyFormat('`', '`');

  const applyHeading = (level) => {
    const textarea = contentEditorRef.current;
    if (!textarea) return;
    const start = selectionRef.current.start;
    const lineStart = editContent.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = editContent.indexOf('\n', start);
    const end = lineEnd === -1 ? editContent.length : lineEnd;
    const line = editContent.substring(lineStart, end);
    const cleanLine = line.replace(/^#{1,6}\s*/, '');
    const prefix = '#'.repeat(level) + ' ';
    const newContent = editContent.substring(0, lineStart) + prefix + cleanLine + editContent.substring(end);
    setEditContent(newContent);
    setTimeout(() => { textarea.focus(); }, 50);
  };

  const applyFontWrap = (fontFamily) => {
    setEditorFont(fontFamily);
    const textarea = contentEditorRef.current;
    if (!textarea) return;
    const start = selectionRef.current.start;
    const end = selectionRef.current.end;
    const selected = editContent.substring(start, end);
    if (selected) {
      const wrapped = '<span style="font-family:' + fontFamily + '">' + selected + '</span>';
      const newContent = editContent.substring(0, start) + wrapped + editContent.substring(end);
      setEditContent(newContent);
      setTimeout(() => { textarea.focus(); }, 50);
    }
  };

  const applyFontSizeWrap = (size) => {
    setEditorFontSize(size);
    const textarea = contentEditorRef.current;
    if (!textarea) return;
    const start = selectionRef.current.start;
    const end = selectionRef.current.end;
    const selected = editContent.substring(start, end);
    if (selected) {
      const wrapped = '<span style="font-size:' + size + 'px">' + selected + '</span>';
      const newContent = editContent.substring(0, start) + wrapped + editContent.substring(end);
      setEditContent(newContent);
      setTimeout(() => { textarea.focus(); }, 50);
    }
  };

  const insertHR = () => {
    const textarea = contentEditorRef.current;
    if (!textarea) return;
    const start = selectionRef.current.start;
    const newContent = editContent.substring(0, start) + '\n\n---\n\n' + editContent.substring(start);
    setEditContent(newContent);
    setTimeout(() => { textarea.focus(); }, 50);
  };

  const insertBulletList = () => {
    const textarea = contentEditorRef.current;
    if (!textarea) return;
    const start = selectionRef.current.start;
    const newContent = editContent.substring(0, start) + '\n- Item 1\n- Item 2\n- Item 3\n' + editContent.substring(start);
    setEditContent(newContent);
    setTimeout(() => { textarea.focus(); }, 50);
  };

  const insertNumberedList = () => {
    const textarea = contentEditorRef.current;
    if (!textarea) return;
    const start = selectionRef.current.start;
    const newContent = editContent.substring(0, start) + '\n1. Item 1\n2. Item 2\n3. Item 3\n' + editContent.substring(start);
    setEditContent(newContent);
    setTimeout(() => { textarea.focus(); }, 50);
  };

  const insertBlockquote = () => applyFormat('\n> ', '\n');

  const handleSaveContent = async () => {
    if (!viewingRecord) return;
    setSavingContent(true);
    try {
      const { error } = await supabase
        .from('textbook_content')
        .update({ ai_output: editContent, updated_at: new Date() })
        .eq('record_id', viewingRecord.record_id);
      if (error) throw error;
      setViewingRecord({ ...viewingRecord, ai_output: editContent });
      setIsEditing(false);
      fetchRecords();
    } catch (err) {
      alert('Save failed: ' + err.message);
    } finally {
      setSavingContent(false);
    }
  };

  // ===== INSERT IMAGE AT CURSOR =====
  const handleInsertImageAtCursor = (imageUrl, altText) => {
    if (!isEditing) {
      // Auto-switch to edit mode
      setEditContent(viewingRecord?.ai_output || '');
      setIsEditing(true);
      // Insert at end after state update
      setTimeout(() => {
        setEditContent(prev => prev + `\n\n![${altText}](${imageUrl})\n\n`);
      }, 100);
      return;
    }

    const textarea = contentEditorRef.current;
    if (!textarea) {
      setEditContent(prev => prev + `\n\n![${altText}](${imageUrl})\n\n`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const imgMarkdown = `\n\n![${altText}](${imageUrl})\n\n`;
    const newContent = editContent.substring(0, start) + imgMarkdown + editContent.substring(end);
    setEditContent(newContent);

    // Restore cursor position after image
    setTimeout(() => {
      textarea.focus();
      const newPos = start + imgMarkdown.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 50);
  };

  // ===== SETUP PASSWORD =====
  const handleSetupPassword = async (e) => {
    e.preventDefault();
    setSetupError('');
    if (setupPassword !== setupPasswordConfirm) { setSetupError('Passwords do not match'); return; }
    if (setupPassword.length < 6) { setSetupError('Password must be at least 6 characters'); return; }
    if (!setupToken) { setSetupError('No invite token found. Invalid link.'); return; }
    setSetupLoading(true);
    try {
      const { data: inviteData, error: inviteError } = await supabase.from('invites').select('*').eq('token', setupToken).single();
      if (inviteError) throw new Error('Invite link is invalid or expired.');
      if (!inviteData) throw new Error('Invite not found.');
      if (inviteData.status !== 'pending') throw new Error('This invite has already been used or expired.');
      const invitedEmail = inviteData.email;
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email: invitedEmail, password: setupPassword, options: { emailRedirectTo: window.location.origin, data: { auto_confirmed: true } } });
      if (signUpError && !signUpError.message.includes('already registered')) throw signUpError;
      let userId = signUpData?.user?.id;
      if (!userId) { const { data: userData } = await supabase.auth.getUser(); userId = userData?.user?.id; }
      if (userId) {
        const { error: roleError } = await supabase.from('user_roles').insert([{ user_id: userId, role: 'content_developer' }]).select();
        if (roleError && !roleError.message.includes('duplicate')) console.error('Role insert error:', roleError);
      }
      await supabase.from('invites').update({ status: 'accepted', accepted_at: new Date().toISOString() }).eq('token', setupToken);
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: invitedEmail, password: setupPassword });
      if (signInError) throw signInError;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Failed to get user session');
      const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single();
      setCurrentUser({ ...user, user_metadata: { ...user.user_metadata, role: roleData?.role || 'content_developer' } });
      setAuthPage('dashboard');
      fetchRecords();
    } catch (err) {
      setSetupError(err.message || 'Setup failed.');
    } finally { setSetupLoading(false); }
  };

  // ===== LOGIN =====
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
      if (error) throw error;
      const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', data.user.id).single();
      setCurrentUser({ ...data.user, user_metadata: { ...data.user.user_metadata, role: roleData?.role || 'content_developer' } });
      setAuthPage('dashboard');
      fetchRecords();
    } catch (err) {
      setLoginError(err.message || 'Login failed');
    } finally { setLoginLoading(false); }
  };

  // ===== FETCH RECORDS =====
  const fetchRecords = async () => {
    const { data, error } = await supabase.from('textbook_content').select('*').order('updated_at', { ascending: false });
    if (!error && data) setRecords(data);
  };

  // ===== APPLY FILTERS =====
  const applyFilters = () => {
    return records.filter(r => {
      const classMatch = filterClass === 'All Classes' || r.class === filterClass;
      const subjectMatch = filterSubject === 'All Subjects' || r.subject === filterSubject;
      const statusMatch = filterStatus === 'All Status' || r.status === filterStatus;
      const contentTypeMatch = filterContentType === 'All Types' || r.content_type === filterContentType;
      const topicMatch = !filterTopic || r.topic.toLowerCase().includes(filterTopic.toLowerCase());
      return classMatch && subjectMatch && statusMatch && contentTypeMatch && topicMatch;
    });
  };

  // ===== SAVE RECORD =====
  const handleSaveRecord = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (!formClass || !formSubject || !formTopic || !formContentType || !formPrompt) {
        alert('Please fill all required fields'); setFormLoading(false); return;
      }
      let result;
      if (editingId) {
        result = await supabase.from('textbook_content').update({ class: formClass, subject: formSubject, topic: formTopic, sub_topic: formSubTopic, content_type: formContentType, prompt: formPrompt, status: 'generating', updated_at: new Date() }).eq('record_id', editingId);
        if (result.error) { logError('handleSaveRecord-UPDATE', result.error, { recordId: editingId }); showDetailedError(result.error); setFormLoading(false); return; }
      } else {
        result = await supabase.from('textbook_content').insert([{ class: formClass, subject: formSubject, topic: formTopic, sub_topic: formSubTopic, content_type: formContentType, prompt: formPrompt, status: 'generating' }]);
        if (result.error) { logError('handleSaveRecord-INSERT', result.error, { action: 'CREATE' }); showDetailedError(result.error); setFormLoading(false); return; }
      }
      setFormClass('1'); setFormSubject('English'); setFormTopic(''); setFormSubTopic(''); setFormContentType(''); setFormPrompt(''); setShowAddForm(false); setEditingId(null);
      setTimeout(() => { fetchRecords(); alert('Record saved successfully! (status: generating)'); }, 500);
    } catch (err) {
      logError('handleSaveRecord-EXCEPTION', err, { context: 'try-catch' }); showDetailedError(err); setFormLoading(false);
    } finally { setFormLoading(false); }
  };

  // ===== HANDLE SEND INVITE =====
  const handleSendInvite = async (e) => {
    e.preventDefault(); setInviteSending(true); setInviteMessage('');
    try {
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await supabase.from('invites').insert([{ email: inviteEmail, token, status: 'pending', invited_by: currentUser.id, expires_at: expiresAt.toISOString() }]);
      const inviteLink = `${window.location.origin}#invite_token=${token}`;
      setInviteMessage(`✅ Invite sent!\n\nShare this link:\n${inviteLink}\n\nExpires in 7 days`);
      setInviteEmail(''); fetchPendingInvites();
    } catch (err) { setInviteMessage(`❌ Error: ${err.message}`); }
    finally { setInviteSending(false); }
  };

  const fetchPendingInvites = async () => {
    const { data } = await supabase.from('invites').select('*').eq('status', 'pending').order('created_at', { ascending: false });
    setPendingInvites(data || []);
  };

  // ===== COPY / EXPORT =====
  const handleCopyContent = async () => {
    if (!viewingRecord?.ai_output) return;
    try { await navigator.clipboard.writeText(viewingRecord.ai_output); alert('✓ Content copied to clipboard!'); }
    catch (err) { alert('Failed to copy: ' + err.message); }
  };

  const handleExportPDF = () => {
    if (!viewingRecord?.ai_output) return;
    try {
      const markdownContent = viewingRecord.ai_output;
      const dimensions = getPaperDimensions();
      // Simple HTML conversion for PDF
      let html = markdownContent
        .replace(/^### (.*$)/gim, '<h3 style="font-size:15px;margin:12px 0 8px 0;font-weight:600;">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 style="font-size:17px;margin:14px 0 10px 0;font-weight:600;">$1</h2>')
        .replace(/^# (.*$)/gim, '<h1 style="font-size:20px;margin:16px 0 12px 0;font-weight:700;">$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<div style="margin:16px 0;text-align:center;"><img src="$2" alt="$1" style="max-width:100%;max-height:400px;border-radius:8px;" /><p style="font-size:11px;color:#6b7280;margin-top:6px;">$1</p></div>')
        .replace(/^[-*] (.*$)/gim, '<li style="margin-bottom:6px;">$1</li>')
        .replace(/\n\n/g, '</p><p style="margin:8px 0;line-height:1.6;">');
      html = '<p style="margin:8px 0;line-height:1.6;">' + html + '</p>';

      const element = document.createElement('div');
      element.style.width = '100%';
      element.style.padding = `${pageSettings.margins}mm`;
      element.innerHTML = `<div style="font-family:Lexend,sans-serif;color:#0f172a;max-width:100%;word-wrap:break-word;"><h1 style="font-size:24px;margin-bottom:8px;">${viewingRecord.topic}</h1><p style="color:#6b7280;margin-bottom:20px;font-size:13px;">Class ${viewingRecord.class} | ${viewingRecord.subject}</p><hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;"><div style="line-height:1.6;font-size:13px;">${html}</div></div>`;

      if (window.html2pdf) {
        window.html2pdf().set({
          margin: pageSettings.margins,
          filename: `${viewingRecord.topic}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, allowTaint: true },
          jsPDF: { orientation: pageSettings.orientation === 'landscape' ? 'l' : 'p', unit: 'mm', format: pageSettings.paperSize === 'Custom' ? [dimensions.width, dimensions.height] : pageSettings.paperSize, compress: true }
        }).from(element).save();
      } else { alert('PDF library is loading. Please try again.'); }
    } catch (err) { alert('PDF export failed: ' + err.message); }
  };

  const handleExportWord = () => {
    if (!viewingRecord?.ai_output) return;
    try {
      const element = document.createElement('a');
      const file = new Blob([viewingRecord.ai_output], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `${viewingRecord.topic}.txt`;
      document.body.appendChild(element); element.click(); document.body.removeChild(element);
    } catch (err) { alert('Export failed: ' + err.message); }
  };

  const handleExport = () => {
    const filtered = applyFilters();
    let csv = 'ID,Class,Subject,Topic,SubTopic,Status,Words\n';
    filtered.forEach(r => { csv += `${r.record_id},"${r.class}","${r.subject}","${r.topic}","${r.sub_topic}","${r.status}",${r.word_count}\n`; });
    const element = document.createElement('a');
    element.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    element.download = 'textbooks.csv';
    document.body.appendChild(element); element.click(); document.body.removeChild(element);
  };

  const handleClearFilters = () => { setFilterClass('All Classes'); setFilterSubject('All Subjects'); setFilterStatus('All Status'); setFilterTopic(''); setFilterContentType('All Types'); };

  const handleOpenAddForm = () => {
    setEditingId(null); setFormClass('1'); setFormSubject('English'); setFormTopic(''); setFormSubTopic(''); setFormContentType(''); setFormPrompt(''); setShowAddForm(!showAddForm);
    setTimeout(() => { const f = document.querySelector('[data-form="edit-add"]'); if (f) { f.scrollIntoView({ behavior: 'smooth', block: 'start' }); const inp = f.querySelector('input, select, textarea'); if (inp) inp.focus(); } }, 100);
  };

  const handleCancelForm = () => { setShowAddForm(false); setEditingId(null); setFormClass('1'); setFormSubject('English'); setFormTopic(''); setFormSubTopic(''); setFormContentType(''); setFormPrompt(''); };

  const handleEditRecord = (record) => {
    setEditingId(record.record_id); setFormClass(record.class || '1'); setFormSubject(record.subject || 'English'); setFormTopic(record.topic || ''); setFormSubTopic(record.sub_topic || ''); setFormContentType(record.content_type || ''); setFormPrompt(record.prompt || ''); setShowAddForm(true);
    setTimeout(() => { const f = document.querySelector('[data-form="edit-add"]'); if (f) { f.scrollIntoView({ behavior: 'smooth', block: 'start' }); const inp = f.querySelector('input, select, textarea'); if (inp) inp.focus(); } }, 100);
  };

  const [showPageSettings, setShowPageSettings] = useState(false);

  // ====================================================================
  // ===== VISUAL PROMPT CARD COMPONENT =====
  // ====================================================================
  const VisualPromptCard = ({ prompt, allPrompts }) => {
    const [localPrompt, setLocalPrompt] = useState(prompt.prompt);
    const [selectedModel, setSelectedModel] = useState(prompt.model_used || 'openai');
    const [isEditingPrompt, setIsEditingPrompt] = useState(false);
    const isGenerating = generatingImageId === prompt.id;
    const characterPrompts = allPrompts.filter(p => p.type === 'character' && p.image_url);
    const isScene = prompt.type === 'scene';

    const handleSavePromptEdit = () => {
      handleUpdatePromptText(prompt.id, localPrompt);
      setIsEditingPrompt(false);
    };

    return (
      <div style={{
        background: COLORS.white,
        borderRadius: '10px',
        border: `1px solid ${COLORS.borderColor}`,
        overflow: 'hidden',
        transition: 'all 0.2s',
        marginBottom: '12px'
      }}>
        {/* Card Header */}
        <div style={{
          padding: '12px 16px',
          background: isScene
            ? 'linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%)'
            : 'linear-gradient(135deg, #ede9fe 0%, #faf5ff 100%)',
          borderBottom: `1px solid ${COLORS.borderColor}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '6px',
              background: isScene ? '#2563eb' : '#8b5cf6',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {isScene ? <Layers size={14} color="white" /> : <Palette size={14} color="white" />}
            </div>
            <div>
              <span style={{ fontSize: '12px', fontWeight: '600', color: COLORS.darkText }}>
                {isScene ? 'Scene' : 'Character'}
              </span>
              {prompt.status === 'generated' && (
                <span style={{ marginLeft: '8px', fontSize: '10px', padding: '2px 6px', borderRadius: '3px', background: COLORS.successBg, color: COLORS.successText, fontWeight: '500' }}>
                  Generated
                </span>
              )}
              {prompt.model_used && (
                <span style={{ marginLeft: '4px', fontSize: '10px', padding: '2px 6px', borderRadius: '3px', background: '#f3f4f6', color: COLORS.lightText, fontWeight: '500' }}>
                  {IMAGE_MODELS.find(m => m.id === prompt.model_used)?.label || prompt.model_used}
                </span>
              )}
            </div>
          </div>
          <button onClick={() => handleDeleteVisualPrompt(prompt.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', opacity: 0.5 }} title="Delete prompt">
            <Trash2 size={14} color={COLORS.errorText} />
          </button>
        </div>

        {/* Prompt Body */}
        <div style={{ padding: '14px 16px' }}>
          {/* Editable Prompt */}
          <label style={{ display: 'block', fontSize: '10px', fontWeight: '600', color: COLORS.lightText, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Description Prompt
          </label>
          {isEditingPrompt ? (
            <div>
              <textarea
                value={localPrompt}
                onChange={(e) => setLocalPrompt(e.target.value)}
                rows={3}
                style={{
                  width: '100%', padding: '10px', fontSize: '12px', lineHeight: '1.6',
                  border: `1px solid ${COLORS.navActive}`, borderRadius: '6px',
                  fontFamily: 'Montserrat, sans-serif', resize: 'vertical',
                  outline: 'none', background: '#fafafa'
                }}
                autoFocus
              />
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                <button onClick={handleSavePromptEdit} style={{ padding: '4px 10px', background: COLORS.navActive, color: 'white', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT_FAMILY, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Save size={10} /> Save
                </button>
                <button onClick={() => { setLocalPrompt(prompt.prompt); setIsEditingPrompt(false); }} style={{ padding: '4px 10px', background: COLORS.filterBg, color: COLORS.darkText, border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontFamily: FONT_FAMILY }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => setIsEditingPrompt(true)}
              style={{
                padding: '10px',
                background: isScene ? '#eff6ff' : '#faf5ff',
                borderRadius: '6px',
                border: `1px solid ${isScene ? '#bfdbfe' : '#e9d5ff'}`,
                fontSize: '12px', lineHeight: '1.6',
                color: prompt.prompt ? COLORS.darkText : COLORS.lightText,
                fontFamily: 'Montserrat, sans-serif',
                minHeight: '40px', cursor: 'pointer',
                whiteSpace: 'pre-wrap',
                transition: 'border-color 0.2s'
              }}
              title="Click to edit"
            >
              {prompt.prompt || 'Click to write a description...'}
              <Pencil size={10} style={{ marginLeft: '6px', opacity: 0.4, verticalAlign: 'middle' }} />
            </div>
          )}

          {/* Scene: Reference Character Selector */}
          {isScene && characterPrompts.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: '600', color: COLORS.lightText, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Reference Characters (for consistency)
              </label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {characterPrompts.map(cp => {
                  const isSelected = (prompt.reference_ids || []).includes(cp.id);
                  return (
                    <div
                      key={cp.id}
                      onClick={() => handleToggleReference(prompt.id, cp.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        padding: '4px 8px', borderRadius: '6px', cursor: 'pointer',
                        border: `2px solid ${isSelected ? '#8b5cf6' : COLORS.borderColor}`,
                        background: isSelected ? '#ede9fe' : COLORS.white,
                        transition: 'all 0.2s'
                      }}
                    >
                      <img src={cp.image_url} alt="" style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'cover' }} />
                      <span style={{ fontSize: '10px', fontWeight: '500', color: isSelected ? '#7c3aed' : COLORS.lightText }}>
                        {isSelected ? '✓' : 'Use'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Model Selector + Generate */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', alignItems: 'center' }}>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              style={{
                padding: '7px 10px', fontSize: '11px', fontWeight: '500',
                border: `1px solid ${COLORS.borderColor}`, borderRadius: '6px',
                fontFamily: FONT_FAMILY, background: COLORS.white,
                color: COLORS.darkText, cursor: 'pointer', minWidth: '150px'
              }}
            >
              {IMAGE_MODELS.map(m => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
            <button
              onClick={() => handleGenerateImage(prompt.id, selectedModel)}
              disabled={isGenerating || !prompt.prompt?.trim()}
              style={{
                padding: '7px 14px',
                background: isGenerating ? '#a78bfa' : (isScene ? '#2563eb' : '#8b5cf6'),
                color: 'white', border: 'none', borderRadius: '6px',
                fontSize: '11px', fontWeight: '600', cursor: isGenerating || !prompt.prompt?.trim() ? 'not-allowed' : 'pointer',
                fontFamily: FONT_FAMILY, display: 'flex', alignItems: 'center', gap: '4px',
                opacity: !prompt.prompt?.trim() ? 0.5 : 1, transition: 'all 0.2s', whiteSpace: 'nowrap'
              }}
            >
              {isGenerating ? (
                <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Generating...</>
              ) : (
                <><Sparkles size={12} /> Generate</>
              )}
            </button>
          </div>

          {/* Generated Image Preview */}
          {prompt.image_url && (
            <div style={{ marginTop: '12px', position: 'relative' }}>
              <img
                src={prompt.image_url}
                alt={`${prompt.type} image`}
                style={{
                  width: '100%', maxHeight: '240px', objectFit: 'contain',
                  borderRadius: '8px', border: `1px solid ${COLORS.borderColor}`,
                  background: '#fafafa', cursor: 'pointer'
                }}
                onClick={() => setLightboxImage(prompt.image_url)}
              />
              {/* Image action bar */}
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                <button
                  onClick={() => setLightboxImage(prompt.image_url)}
                  style={{ padding: '4px 10px', background: COLORS.filterBg, color: COLORS.darkText, border: 'none', borderRadius: '4px', fontSize: '10px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT_FAMILY, display: 'flex', alignItems: 'center', gap: '3px' }}
                >
                  <ZoomIn size={10} /> Full Size
                </button>
                <button
                  onClick={() => handleInsertImageAtCursor(prompt.image_url, `${prompt.type} - ${prompt.prompt?.substring(0, 30) || 'image'}`)}
                  style={{ padding: '4px 10px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', fontSize: '10px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT_FAMILY, display: 'flex', alignItems: 'center', gap: '3px' }}
                >
                  <ImagePlus size={10} /> Insert into Content
                </button>
                <button
                  onClick={() => { navigator.clipboard.writeText(prompt.image_url); setVisualMessage('✅ Image URL copied!'); }}
                  style={{ padding: '4px 10px', background: COLORS.filterBg, color: COLORS.darkText, border: 'none', borderRadius: '4px', fontSize: '10px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT_FAMILY, display: 'flex', alignItems: 'center', gap: '3px' }}
                >
                  <Link size={10} /> Copy URL
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ====================================================================
  // ===== VISUAL ASSETS TAB =====
  // ====================================================================
  const renderVisualAssetsTab = () => {
    if (!viewingRecord) return null;
    const prompts = getVisualPrompts(viewingRecord);
    const characters = prompts.filter(p => p.type === 'character');
    const scenes = prompts.filter(p => p.type === 'scene');

    return (
      <div style={{ padding: '24px 32px', maxWidth: '900px' }}>
        {/* Status message */}
        {visualMessage && (
          <div style={{
            padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '12px', fontWeight: '500',
            background: visualMessage.includes('✅') ? COLORS.successBg : visualMessage.includes('⚠️') ? '#fffbeb' : COLORS.errorBg,
            border: `1px solid ${visualMessage.includes('✅') ? COLORS.successBorder : visualMessage.includes('⚠️') ? '#fde68a' : COLORS.errorBorder}`,
            color: visualMessage.includes('✅') ? COLORS.successText : visualMessage.includes('⚠️') ? '#92400e' : COLORS.errorText,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span>{visualMessage}</span>
            <button onClick={() => setVisualMessage('')} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5, fontSize: '14px' }}>✕</button>
          </div>
        )}

        {/* ===== CHARACTERS SECTION ===== */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: COLORS.darkText, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Palette size={18} color="#8b5cf6" /> Characters / Visuals
              <span style={{ fontSize: '11px', fontWeight: '400', color: COLORS.lightText }}>({characters.length})</span>
            </h3>
            <button
              onClick={() => handleAddVisualPrompt('character')}
              style={{
                padding: '6px 12px', background: '#8b5cf6', color: 'white',
                border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '600',
                cursor: 'pointer', fontFamily: FONT_FAMILY, display: 'flex', alignItems: 'center', gap: '4px'
              }}
            >
              <Plus size={12} /> Add Character
            </button>
          </div>

          {characters.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: COLORS.lightText, fontSize: '13px', background: '#faf5ff', borderRadius: '8px', border: '1px dashed #d8b4fe' }}>
              No character prompts yet. Claude will auto-generate these, or click "Add Character" to create manually.
            </div>
          ) : (
            characters.map(p => <VisualPromptCard key={p.id} prompt={p} allPrompts={prompts} />)
          )}
        </div>

        {/* ===== SCENES SECTION ===== */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: COLORS.darkText, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="#2563eb" /> Scene Images
              <span style={{ fontSize: '11px', fontWeight: '400', color: COLORS.lightText }}>({scenes.length})</span>
            </h3>
            <button
              onClick={() => handleAddVisualPrompt('scene')}
              style={{
                padding: '6px 12px', background: '#2563eb', color: 'white',
                border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '600',
                cursor: 'pointer', fontFamily: FONT_FAMILY, display: 'flex', alignItems: 'center', gap: '4px'
              }}
            >
              <Plus size={12} /> Add Scene
            </button>
          </div>

          {scenes.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: COLORS.lightText, fontSize: '13px', background: '#eff6ff', borderRadius: '8px', border: '1px dashed #93c5fd' }}>
              No scene prompts yet. Claude will auto-generate these, or click "Add Scene" to create manually.
            </div>
          ) : (
            scenes.map(p => <VisualPromptCard key={p.id} prompt={p} allPrompts={prompts} />)
          )}
        </div>

        {/* ===== ALL GENERATED IMAGES GALLERY ===== */}
        {getGeneratedImages(viewingRecord).length > 0 && (
          <div style={{ background: '#f0fdf4', border: `1px solid ${COLORS.successBorder}`, borderRadius: '10px', padding: '16px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '600', color: COLORS.successText, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Image size={14} /> All Generated Images ({getGeneratedImages(viewingRecord).length})
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px' }}>
              {getGeneratedImages(viewingRecord).map((p, idx) => (
                <div key={p.id} style={{ position: 'relative', borderRadius: '6px', overflow: 'hidden', border: `1px solid ${COLORS.borderColor}`, cursor: 'pointer' }} onClick={() => setLightboxImage(p.image_url)}>
                  <img src={p.image_url} alt={p.type} style={{ width: '100%', height: '80px', objectFit: 'cover', display: 'block' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', padding: '3px 6px' }}>
                    <span style={{ fontSize: '9px', color: 'white', fontWeight: '600', textTransform: 'uppercase' }}>{p.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ===== TOOLBAR BUTTON STYLE =====
  const tbBtn = (active) => ({
    padding: '5px 8px',
    background: active ? '#e0e7ff' : 'transparent',
    color: COLORS.darkText,
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: active ? '700' : '500',
    fontFamily: FONT_FAMILY,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '28px',
    height: '28px',
    transition: 'all 0.15s',
  });

  // Prevents toolbar clicks from stealing focus from textarea
  const noFocus = (e) => { e.preventDefault(); };

  const tbSep = () => (
    <div style={{ width: '1px', height: '20px', background: COLORS.borderColor, margin: '0 4px' }} />
  );

  // ====================================================================
  // ===== CONTENT TAB WITH RICH TOOLBAR + IMAGE PICKER =====
  // ====================================================================
  const renderContentTab = () => {
    if (!viewingRecord) return null;
    const allPrompts = getVisualPrompts(viewingRecord);
    const allImages = allPrompts.filter(p => p.image_url);

    return (
      <div style={{ display: 'flex', height: '100%' }}>
        {/* ===== MAIN EDITOR AREA ===== */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Action Bar */}
          <div style={{
            padding: '10px 24px',
            borderBottom: '1px solid ' + COLORS.borderColor,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: '#fafafa'
          }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {isEditing ? (
                <>
                  <button onClick={handleSaveContent} disabled={savingContent} style={{ padding: '6px 14px', background: COLORS.navActive, color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: savingContent ? 'not-allowed' : 'pointer', fontFamily: FONT_FAMILY, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {savingContent ? <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : <><Save size={12} /> Save</>}
                  </button>
                  <button onClick={handleCancelEditing} style={{ padding: '6px 14px', background: COLORS.filterBg, color: COLORS.darkText, border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', fontFamily: FONT_FAMILY }}>
                    Cancel
                  </button>
                  {allPrompts.length > 0 && (
                    <button onClick={() => setShowAssetPicker(!showAssetPicker)} style={{ padding: '6px 14px', background: showAssetPicker ? '#8b5cf6' : COLORS.filterBg, color: showAssetPicker ? 'white' : COLORS.darkText, border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', fontFamily: FONT_FAMILY, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Image size={12} /> {showAssetPicker ? 'Hide' : 'Insert'} Images ({allImages.length}/{allPrompts.length})
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button onClick={handleStartEditing} style={{ padding: '6px 14px', background: COLORS.navActive, color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT_FAMILY, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Pencil size={12} /> Edit Content
                  </button>
                </>
              )}
            </div>
            <span style={{ fontSize: '11px', color: COLORS.lightText }}>{viewingRecord.word_count || 0} words</span>
          </div>

          {/* ===== FORMATTING TOOLBAR (only in edit mode) ===== */}
          {isEditing && (
            <div style={{
              padding: '6px 16px',
              borderBottom: '1px solid ' + COLORS.borderColor,
              display: 'flex', flexWrap: 'wrap', gap: '2px', alignItems: 'center',
              background: COLORS.white
            }}>
              {/* Font Family */}
              <select
                value={editorFont}
                onChange={(e) => applyFontWrap(e.target.value)}
                style={{
                  padding: '4px 6px', fontSize: '11px', border: '1px solid ' + COLORS.borderColor,
                  borderRadius: '4px', fontFamily: FONT_FAMILY, cursor: 'pointer',
                  maxWidth: '140px', background: COLORS.white
                }}
                title="Font Family (select text first)"
              >
                {GOOGLE_FONTS.map(f => (
                  <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                ))}
              </select>

              {/* Font Size */}
              <select
                value={editorFontSize}
                onChange={(e) => applyFontSizeWrap(e.target.value)}
                style={{
                  padding: '4px 4px', fontSize: '11px', border: '1px solid ' + COLORS.borderColor,
                  borderRadius: '4px', fontFamily: FONT_FAMILY, cursor: 'pointer',
                  width: '52px', background: COLORS.white
                }}
                title="Font Size (select text first)"
              >
                {FONT_SIZES.map(s => (
                  <option key={s} value={s}>{s}px</option>
                ))}
              </select>

              {tbSep()}

              {/* Headings */}
              <button onMouseDown={noFocus} onClick={() => applyHeading(1)} style={tbBtn(false)} title="Heading 1">H1</button>
              <button onMouseDown={noFocus} onClick={() => applyHeading(2)} style={tbBtn(false)} title="Heading 2">H2</button>
              <button onMouseDown={noFocus} onClick={() => applyHeading(3)} style={tbBtn(false)} title="Heading 3">H3</button>

              {tbSep()}

              {/* Bold, Italic, Underline, Strikethrough */}
              <button onMouseDown={noFocus} onClick={applyBold} style={{ ...tbBtn(false), fontWeight: '800' }} title="Bold (**text**)">B</button>
              <button onMouseDown={noFocus} onClick={applyItalic} style={{ ...tbBtn(false), fontStyle: 'italic' }} title="Italic (*text*)">I</button>
              <button onMouseDown={noFocus} onClick={applyUnderline} style={{ ...tbBtn(false), textDecoration: 'underline' }} title="Underline">U</button>
              <button onMouseDown={noFocus} onClick={applyStrikethrough} style={{ ...tbBtn(false), textDecoration: 'line-through' }} title="Strikethrough">S</button>

              {tbSep()}

              {/* Code */}
              <button onMouseDown={noFocus} onClick={applyCode} style={{ ...tbBtn(false), fontFamily: 'monospace', fontSize: '12px' }} title="Inline Code">&lt;/&gt;</button>

              {/* Lists */}
              <button onMouseDown={noFocus} onClick={insertBulletList} style={tbBtn(false)} title="Bullet List">• ≡</button>
              <button onMouseDown={noFocus} onClick={insertNumberedList} style={tbBtn(false)} title="Numbered List">1. ≡</button>

              {/* Blockquote */}
              <button onMouseDown={noFocus} onClick={insertBlockquote} style={tbBtn(false)} title="Blockquote">❝</button>

              {/* Horizontal Rule */}
              <button onMouseDown={noFocus} onClick={insertHR} style={tbBtn(false)} title="Horizontal Line">—</button>

              {tbSep()}

              {/* Quick Image Insert — show when ANY visual prompts exist */}
              {allPrompts.length > 0 && (
                <button
                  onMouseDown={noFocus}
                  onClick={() => setShowAssetPicker(!showAssetPicker)}
                  style={{ ...tbBtn(showAssetPicker), color: showAssetPicker ? '#7c3aed' : COLORS.lightText }}
                  title="Insert Image from Visual Assets"
                >
                  <ImagePlus size={14} />
                </button>
              )}
            </div>
          )}

          {/* ===== EDITOR / PREVIEW ===== */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex' }}>
            {/* Text Area / Preview */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {viewingRecord.ai_output ? (
                isEditing ? (
                  <textarea
                    ref={contentEditorRef}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onSelect={trackSelection}
                    onKeyUp={trackSelection}
                    onClick={trackSelection}
                    style={{
                      width: '100%',
                      height: '100%',
                      minHeight: '500px',
                      padding: '20px 24px',
                      fontSize: editorFontSize + 'px',
                      lineHeight: '1.8',
                      fontFamily: editorFont + ', monospace',
                      border: 'none',
                      borderRight: showAssetPicker ? '1px solid ' + COLORS.borderColor : 'none',
                      resize: 'none',
                      outline: 'none',
                      color: COLORS.darkText,
                      background: COLORS.white
                    }}
                    placeholder="Start typing or paste content here..."
                  />
                ) : (
                  <div style={{ padding: '24px 32px', fontSize: '14px', lineHeight: '1.8', color: COLORS.darkText, fontFamily: 'Montserrat, sans-serif', fontWeight: '400', maxWidth: '850px' }}>
                    {parseMarkdownToReact(viewingRecord.ai_output)}
                  </div>
                )
              ) : (
                <div style={{ textAlign: 'center', color: COLORS.lightText, padding: '60px 20px', fontSize: '16px' }}>
                  ⏳ No content generated yet. Please wait for Claude AI to generate the content.
                </div>
              )}
            </div>

            {/* ===== IMAGE ASSET PICKER SIDEBAR ===== */}
            {isEditing && showAssetPicker && allPrompts.length > 0 && (
              <div style={{
                width: '220px',
                borderLeft: '1px solid ' + COLORS.borderColor,
                background: '#fafafa',
                overflowY: 'auto',
                flexShrink: 0
              }}>
                <div style={{ padding: '12px', borderBottom: '1px solid ' + COLORS.borderColor }}>
                  <h4 style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: COLORS.darkText, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Image size={12} /> Visual Assets
                  </h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '10px', color: COLORS.lightText }}>Click generated images to insert at cursor</p>
                </div>
                <div style={{ padding: '8px' }}>
                  {allPrompts.map(function(p, idx) {
                    const hasImage = !!p.image_url;
                    return (
                      <div
                        key={p.id}
                        onClick={function() {
                          if (hasImage) {
                            handleInsertImageAtCursor(p.image_url, p.type + ' - ' + (p.prompt || '').substring(0, 25));
                          }
                        }}
                        style={{
                          marginBottom: '8px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: '1px solid ' + COLORS.borderColor,
                          cursor: hasImage ? 'pointer' : 'default',
                          transition: 'all 0.2s',
                          background: COLORS.white,
                          opacity: hasImage ? 1 : 0.6
                        }}
                        onMouseEnter={function(e) { if (hasImage) { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                        onMouseLeave={function(e) { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
                      >
                        {hasImage ? (
                          <img
                            src={p.image_url}
                            alt={p.type}
                            style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }}
                            onError={function(e) { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div style={{
                            width: '100%', height: '80px', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            background: p.type === 'character' ? '#faf5ff' : '#eff6ff',
                            color: COLORS.lightText, fontSize: '11px'
                          }}>
                            <Sparkles size={14} style={{ marginRight: '4px' }} /> Not generated yet
                          </div>
                        )}
                        <div style={{ padding: '6px 8px' }}>
                          <div style={{
                            fontSize: '9px',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            color: p.type === 'character' ? '#7c3aed' : '#2563eb',
                            marginBottom: '2px'
                          }}>
                            {p.type} {hasImage ? '✓' : '○'}
                          </div>
                          <div style={{ fontSize: '10px', color: COLORS.lightText, lineHeight: '1.3', overflow: 'hidden', maxHeight: '26px' }}>
                            {(p.prompt || '').substring(0, 50)}
                          </div>
                          {hasImage && (
                            <div style={{
                              marginTop: '4px',
                              fontSize: '9px',
                              fontWeight: '600',
                              color: '#2563eb',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px'
                            }}>
                              <ImagePlus size={9} /> Click to insert
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ===== PAGE SETTINGS PANEL =====
  const renderPageSettingsPanel = () => {
    const dimensions = getPaperDimensions();
    return (
      <>
        <button onClick={() => setShowPageSettings(!showPageSettings)} style={{ position: 'fixed', bottom: '20px', right: '20px', width: '60px', height: '60px', background: COLORS.navActive, color: COLORS.white, border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', zIndex: 998, transition: 'transform 0.2s', fontFamily: FONT_FAMILY }} title="PDF Page Settings">📄</button>
        {showPageSettings && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }} onClick={() => setShowPageSettings(false)}>
            <div style={{ background: COLORS.white, borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', fontFamily: FONT_FAMILY, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>📄 PDF Settings</h2>
                <button onClick={() => setShowPageSettings(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}>✕</button>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', marginBottom: '4px', textTransform: 'uppercase' }}>Paper Size</label>
                <select value={pageSettings.paperSize} onChange={(e) => { const s = e.target.value; if (s !== 'Custom') { const d = PAPER_SIZES[s]; setPageSettings({ ...pageSettings, paperSize: s, customWidth: d.width, customHeight: d.height }); } else { setPageSettings({ ...pageSettings, paperSize: 'Custom' }); } }} style={{ width: '100%', padding: '8px', border: `1px solid ${COLORS.borderColor}`, borderRadius: '4px', fontSize: '12px', fontFamily: FONT_FAMILY }}>
                  {Object.keys(PAPER_SIZES).map(s => <option key={s} value={s}>{PAPER_SIZES[s].label}</option>)}
                  <option value="Custom">Custom Size</option>
                </select>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', marginBottom: '4px', textTransform: 'uppercase' }}>Orientation</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['portrait', 'landscape'].map(o => (
                    <button key={o} onClick={() => setPageSettings({ ...pageSettings, orientation: o })} style={{ flex: 1, padding: '8px', background: pageSettings.orientation === o ? COLORS.navActive : COLORS.filterBg, color: pageSettings.orientation === o ? COLORS.white : COLORS.darkText, border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '500', fontFamily: FONT_FAMILY }}>
                      {o === 'portrait' ? '📗 Portrait' : '📕 Landscape'}
                    </button>
                  ))}
                </div>
              </div>
              {pageSettings.paperSize === 'Custom' && (
                <div style={{ marginBottom: '16px', background: COLORS.filterBg, padding: '10px', borderRadius: '4px' }}>
                  {['Width', 'Height'].map(dim => (
                    <div key={dim}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', marginBottom: '4px' }}>{dim} (mm)</label>
                      <input type="number" value={dim === 'Width' ? pageSettings.customWidth : pageSettings.customHeight} onChange={(e) => setPageSettings({ ...pageSettings, [dim === 'Width' ? 'customWidth' : 'customHeight']: parseInt(e.target.value) || 210 })} style={{ width: '100%', padding: '6px', border: `1px solid ${COLORS.borderColor}`, borderRadius: '4px', fontSize: '12px', marginBottom: '8px', fontFamily: FONT_FAMILY }} min="50" max="1000" />
                    </div>
                  ))}
                </div>
              )}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', marginBottom: '4px', textTransform: 'uppercase' }}>Margins (mm)</label>
                <input type="number" value={pageSettings.margins} onChange={(e) => setPageSettings({ ...pageSettings, margins: parseInt(e.target.value) || 10 })} style={{ width: '100%', padding: '8px', border: `1px solid ${COLORS.borderColor}`, borderRadius: '4px', fontSize: '12px', fontFamily: FONT_FAMILY }} min="0" max="50" />
              </div>
              <div style={{ borderTop: `1px solid ${COLORS.borderColor}`, paddingTop: '16px' }}>
                <div style={{ background: COLORS.lightBg, padding: '12px', borderRadius: '4px', fontSize: '11px', color: COLORS.lightText }}>
                  <strong>Current:</strong> {dimensions.width} × {dimensions.height} mm • {pageSettings.orientation === 'portrait' ? '📗 Portrait' : '📕 Landscape'} • Margins: {pageSettings.margins}mm
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  // ===== AUTH PAGES =====
  if (authPage === 'login') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f5f6f8', fontFamily: FONT_FAMILY }}>
        <div style={{ width: '100%', maxWidth: '400px', padding: '20px' }}>
          <h1 style={{ textAlign: 'center', marginBottom: '30px', color: COLORS.darkText }}>🎓 AI Content Studio</h1>
          <form onSubmit={handleLogin} style={{ background: COLORS.white, padding: '24px', borderRadius: '8px', border: `1px solid ${COLORS.borderColor}` }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Email</label>
              <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} style={{ width: '100%', padding: '10px', border: `1px solid ${COLORS.borderColor}`, borderRadius: '6px', fontSize: '14px', fontFamily: FONT_FAMILY }} required />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Password</label>
              <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} style={{ width: '100%', padding: '10px', border: `1px solid ${COLORS.borderColor}`, borderRadius: '6px', fontSize: '14px', fontFamily: FONT_FAMILY }} required />
            </div>
            {loginError && <div style={{ background: COLORS.errorBg, border: `1px solid ${COLORS.errorBorder}`, color: COLORS.errorText, padding: '12px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>{loginError}</div>}
            <button type="submit" disabled={loginLoading} style={{ width: '100%', padding: '12px', background: COLORS.navActive, color: COLORS.white, border: 'none', borderRadius: '6px', cursor: loginLoading ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '500', fontFamily: FONT_FAMILY }}>{loginLoading ? 'Logging in...' : 'Login'}</button>
          </form>
        </div>
      </div>
    );
  }

  if (authPage === 'setup-password') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f5f6f8', fontFamily: FONT_FAMILY }}>
        <div style={{ width: '100%', maxWidth: '400px', padding: '20px' }}>
          <h1 style={{ textAlign: 'center', marginBottom: '30px', color: COLORS.darkText }}>🎓 Setup Your Password</h1>
          <form onSubmit={handleSetupPassword} style={{ background: COLORS.white, padding: '24px', borderRadius: '8px', border: `1px solid ${COLORS.borderColor}` }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Password</label>
              <input type="password" value={setupPassword} onChange={(e) => setSetupPassword(e.target.value)} style={{ width: '100%', padding: '10px', border: `1px solid ${COLORS.borderColor}`, borderRadius: '6px', fontSize: '14px', fontFamily: FONT_FAMILY }} required />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Confirm Password</label>
              <input type="password" value={setupPasswordConfirm} onChange={(e) => setSetupPasswordConfirm(e.target.value)} style={{ width: '100%', padding: '10px', border: `1px solid ${COLORS.borderColor}`, borderRadius: '6px', fontSize: '14px', fontFamily: FONT_FAMILY }} required />
            </div>
            {setupError && <div style={{ background: COLORS.errorBg, border: `1px solid ${COLORS.errorBorder}`, color: COLORS.errorText, padding: '12px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>{setupError}</div>}
            <button type="submit" disabled={setupLoading} style={{ width: '100%', padding: '12px', background: COLORS.navActive, color: COLORS.white, border: 'none', borderRadius: '6px', cursor: setupLoading ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '500', fontFamily: FONT_FAMILY }}>{setupLoading ? 'Setting up...' : 'Submit'}</button>
          </form>
        </div>
      </div>
    );
  }

  // ===== DASHBOARD =====
  const filteredRecords = applyFilters();
  const spinKeyframes = `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;

  return (
    <div style={{ display: 'flex', height: '100vh', background: COLORS.white, fontFamily: FONT_FAMILY }}>
      <style>{spinKeyframes}</style>

      {/* SIDEBAR */}
      <div style={{ width: sidebarOpen ? '280px' : '80px', background: COLORS.sidebarBg, borderRight: `1px solid ${COLORS.borderColor}`, padding: '16px', display: 'flex', flexDirection: 'column', transition: 'width 0.3s' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', display: 'flex' }}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          {sidebarOpen && <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: COLORS.darkText, whiteSpace: 'nowrap' }}>Academic Curator</h3>}
        </div>
        <nav style={{ marginTop: '30px', flex: 1 }}>
          {[
            { icon: <BookOpen size={20} />, label: 'Projects', action: 'textbooks', disabled: false, rolesAllowed: ['central_admin', 'admin', 'content_developer'] },
            { icon: <Users size={20} />, label: 'Manage Users', action: 'manage-users', disabled: true, rolesAllowed: ['central_admin', 'admin'] },
            { icon: <Mail size={20} />, label: 'Invites', action: 'invites', disabled: false, rolesAllowed: ['central_admin', 'admin'] }
          ].filter(item => (item.rolesAllowed.includes(currentUser?.user_metadata?.role || 'content_developer'))).map((item, i) => (
            <button key={i} onClick={() => { if (item.action === 'invites') { setShowInvitePanel(!showInvitePanel); if (!showInvitePanel) fetchPendingInvites(); } }} disabled={item.disabled} style={{ width: '100%', padding: '12px 16px', background: item.action === 'textbooks' ? COLORS.navActive : 'transparent', color: item.action === 'textbooks' ? COLORS.white : (item.disabled ? COLORS.navDisabled : COLORS.navText), border: 'none', borderRadius: '6px', cursor: item.disabled ? 'not-allowed' : 'pointer', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: '500', fontFamily: FONT_FAMILY, whiteSpace: 'nowrap' }}>
              {item.icon}{sidebarOpen && item.label}
            </button>
          ))}
        </nav>
        <button onClick={async () => { await supabase.auth.signOut(); setCurrentUser(null); setAuthPage('login'); }} style={{ width: '100%', padding: '12px 16px', background: COLORS.errorBg, color: COLORS.errorText, border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: '500', fontFamily: FONT_FAMILY }}>
          <LogOut size={20} />{sidebarOpen && 'Logout'}
        </button>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ background: COLORS.white, borderBottom: `1px solid ${COLORS.borderColor}`, padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: COLORS.darkText }}>AI Content Studio</h1>
          <span style={{ fontSize: '12px', color: COLORS.lightText }}>{currentUser?.email} • {currentUser?.user_metadata?.role}</span>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {/* Invite Panel */}
          {showInvitePanel && (currentUser?.user_metadata?.role === 'central_admin' || currentUser?.user_metadata?.role === 'admin') && (
            <div style={{ background: COLORS.white, border: `1px solid ${COLORS.borderColor}`, borderRadius: '8px', padding: '20px', marginBottom: '24px' }}>
              <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>📧 Send Invite</h2>
              <form onSubmit={handleSendInvite} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="user@example.com" required style={{ flex: 1, padding: '10px 12px', border: `1px solid ${COLORS.borderColor}`, borderRadius: '6px', fontSize: '14px', fontFamily: FONT_FAMILY }} />
                <button type="submit" disabled={inviteSending} style={{ padding: '10px 20px', background: COLORS.navActive, color: COLORS.white, border: 'none', borderRadius: '6px', cursor: inviteSending ? 'not-allowed' : 'pointer', fontWeight: '500', fontSize: '14px', fontFamily: FONT_FAMILY }}>{inviteSending ? 'Sending...' : 'Send Invite'}</button>
              </form>
              {inviteMessage && <div style={{ background: inviteMessage.includes('✅') ? COLORS.successBg : COLORS.errorBg, border: `1px solid ${inviteMessage.includes('✅') ? COLORS.successBorder : COLORS.errorBorder}`, color: inviteMessage.includes('✅') ? COLORS.successText : COLORS.errorText, padding: '12px', borderRadius: '6px', fontSize: '13px', whiteSpace: 'pre-wrap', marginBottom: '20px' }}>{inviteMessage}</div>}
              {pendingInvites.length > 0 && (
                <div>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>Pending Invites</h3>
                  {pendingInvites.map(inv => (
                    <div key={inv.id} style={{ background: COLORS.filterBg, padding: '12px', borderRadius: '6px', marginBottom: '8px', fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{inv.email}</span><span style={{ color: COLORS.statusGenerating }}>Pending</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: '700', color: COLORS.darkText }}>Projects</h1>
          <p style={{ margin: '0 0 24px 0', color: COLORS.lightText, fontSize: '14px' }}>Manage and curate AI-generated curriculum materials.</p>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {[
              { label: 'Add Record', icon: <Plus size={16} />, bg: COLORS.navActive, color: COLORS.white, action: handleOpenAddForm },
              { label: 'Export', icon: <Download size={16} />, bg: COLORS.filterBg, color: COLORS.darkText, action: handleExport },
              { label: 'Refresh', icon: <RefreshCw size={16} />, bg: COLORS.filterBg, color: COLORS.darkText, action: fetchRecords },
              { label: 'Clear', icon: <X size={16} />, bg: COLORS.filterBg, color: COLORS.darkText, action: handleClearFilters },
            ].map((btn, i) => (
              <button key={i} onClick={btn.action} style={{ padding: '10px 16px', background: btn.bg, color: btn.color, border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '400', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: FONT_FAMILY }}>
                {btn.icon} {btn.label}
              </button>
            ))}
          </div>

          {/* Add/Edit Form */}
          {showAddForm && (
            <div data-form="edit-add" style={{ background: editingId ? '#fef3c7' : COLORS.white, borderRadius: '12px', padding: '20px', marginBottom: '24px', border: editingId ? '2px solid #f59e0b' : `1px solid ${COLORS.borderColor}`, transition: 'all 0.3s ease' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: editingId ? '#d97706' : COLORS.darkText }}>{editingId ? '✏️ Edit Record' : '➕ Add New Record'}</h3>
              <form onSubmit={handleSaveRecord}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '6px', textTransform: 'uppercase' }}>CLASS</label>
                    <select value={formClass} onChange={(e) => setFormClass(e.target.value)} style={{ width: '100%', padding: '10px', border: `1px solid ${COLORS.borderColor}`, borderRadius: '6px', fontSize: '14px', fontFamily: FONT_FAMILY }}>
                      {['1','2','3','4','5'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '6px', textTransform: 'uppercase' }}>SUBJECT</label>
                    <select value={formSubject} onChange={(e) => setFormSubject(e.target.value)} style={{ width: '100%', padding: '10px', border: `1px solid ${COLORS.borderColor}`, borderRadius: '6px', fontSize: '14px', fontFamily: FONT_FAMILY }}>
                      {subjects.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '6px', textTransform: 'uppercase' }}>TOPIC</label>
                  <input type="text" value={formTopic} onChange={(e) => setFormTopic(e.target.value)} required style={{ width: '100%', padding: '10px', border: `1px solid ${COLORS.borderColor}`, borderRadius: '6px', fontSize: '14px', fontFamily: FONT_FAMILY }} />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '6px', textTransform: 'uppercase' }}>SUB-TOPIC</label>
                  <input type="text" value={formSubTopic} onChange={(e) => setFormSubTopic(e.target.value)} style={{ width: '100%', padding: '10px', border: `1px solid ${COLORS.borderColor}`, borderRadius: '6px', fontSize: '14px', fontFamily: FONT_FAMILY }} />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '6px', textTransform: 'uppercase' }}>CONTENT TYPE <span style={{ color: '#ef4444' }}>*</span></label>
                  <select value={formContentType} onChange={(e) => setFormContentType(e.target.value)} required style={{ width: '100%', padding: '10px', border: `1px solid ${COLORS.borderColor}`, borderRadius: '6px', fontSize: '14px', fontFamily: FONT_FAMILY, background: formContentType ? COLORS.white : '#fef2f2' }}>
                    <option value="">-- Select Content Type --</option>
                    {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '500', marginBottom: '6px', textTransform: 'uppercase' }}>AI PROMPT <span style={{ fontSize: '11px', color: COLORS.lightText }}>{formPrompt.length} / 20000</span></label>
                  <textarea value={formPrompt} onChange={(e) => setFormPrompt(e.target.value.substring(0, 20000))} rows="12" style={{ width: '100%', padding: '12px', border: `1px solid ${COLORS.borderColor}`, borderRadius: '6px', fontSize: '13px', fontFamily: FONT_FAMILY, resize: 'vertical', minHeight: '240px', lineHeight: '1.5' }} />
                </div>
                <div style={{ background: '#f0f9ff', border: '1px solid #a7f3d0', borderRadius: '6px', padding: '12px', marginBottom: '16px', fontSize: '12px', color: '#065f46' }}>
                  ⚡ Claude AI will generate: lesson content + character descriptions + scene descriptions automatically
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={handleCancelForm} style={{ flex: 1, padding: '10px', background: COLORS.filterBg, color: COLORS.darkText, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '14px', fontFamily: FONT_FAMILY }}>Cancel</button>
                  <button type="submit" disabled={formLoading} style={{ flex: 1, padding: '10px', background: COLORS.navActive, color: COLORS.white, border: 'none', borderRadius: '6px', cursor: formLoading ? 'not-allowed' : 'pointer', fontWeight: '500', fontSize: '14px', fontFamily: FONT_FAMILY }}>{formLoading ? '⏳ Saving...' : '⚡ Save & Generate'}</button>
                </div>
              </form>
            </div>
          )}

          {/* Filters */}
          <div style={{ background: COLORS.white, borderRadius: '12px', padding: '20px', marginBottom: '24px', border: `1px solid ${COLORS.borderColor}` }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
              {[
                { label: 'CLASS', value: filterClass, setter: setFilterClass, options: ['All Classes','1','2','3','4','5'] },
                { label: 'SUBJECT', value: filterSubject, setter: setFilterSubject, options: ['All Subjects', ...subjects] },
                { label: 'STATUS', value: filterStatus, setter: setFilterStatus, options: ['All Status','pending','generating','generated'] },
                { label: 'CONTENT TYPE', value: filterContentType, setter: setFilterContentType, options: ['All Types', ...CONTENT_TYPES] },
              ].map((f, i) => (
                <div key={i}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '6px', textTransform: 'uppercase' }}>{f.label}</label>
                  <select value={f.value} onChange={(e) => f.setter(e.target.value)} style={{ width: '100%', padding: '10px', border: `1px solid ${COLORS.borderColor}`, borderRadius: '6px', fontSize: '14px', fontFamily: FONT_FAMILY }}>
                    {f.options.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '6px', textTransform: 'uppercase' }}>TOPIC</label>
                <input type="text" value={filterTopic} onChange={(e) => setFilterTopic(e.target.value)} placeholder="Search topic..." style={{ width: '100%', padding: '10px', border: `1px solid ${COLORS.borderColor}`, borderRadius: '6px', fontSize: '14px', fontFamily: FONT_FAMILY }} />
              </div>
            </div>
          </div>

          {/* Records Table */}
          <div style={{ background: COLORS.white, borderRadius: '12px', border: `1px solid ${COLORS.borderColor}`, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#64748b', color: COLORS.white }}>
                  {['S.NO','ID','CLASS','SUBJECT','TOPIC','TYPE','STATUS','WORDS','IMAGES','ACTION'].map(h => (
                    <th key={h} style={{ padding: '12px', textAlign: 'left', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((r, i) => {
                  const imgCount = getGeneratedImages(r).length;
                  const promptCount = getVisualPrompts(r).length;
                  return (
                    <tr key={i} style={{ borderBottom: `1px solid ${COLORS.borderColor}`, background: i % 2 === 0 ? COLORS.white : COLORS.lightBg }}>
                      <td style={{ padding: '12px', fontSize: '13px', fontWeight: '500', color: COLORS.navActive }}>{i + 1}</td>
                      <td style={{ padding: '12px', fontSize: '13px' }}>{r.record_id}</td>
                      <td style={{ padding: '12px', fontSize: '13px' }}>{r.class}</td>
                      <td style={{ padding: '12px', fontSize: '13px' }}>{r.subject}</td>
                      <td style={{ padding: '12px', fontSize: '13px' }}>{r.topic}</td>
                      <td style={{ padding: '12px', fontSize: '13px' }}><span style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '500', background: '#e0e7ff', color: '#3730a3' }}>{r.content_type || 'N/A'}</span></td>
                      <td style={{ padding: '12px', fontSize: '13px' }}><span style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '3px', fontSize: '11px', fontWeight: '500', background: r.status === 'generated' ? COLORS.successBg : r.status === 'generating' ? '#f3e8ff' : COLORS.filterBg, color: r.status === 'generated' ? COLORS.successText : r.status === 'generating' ? '#7c3aed' : COLORS.lightText }}>{r.status}</span></td>
                      <td style={{ padding: '12px', fontSize: '13px' }}>{r.word_count || 0}</td>
                      <td style={{ padding: '12px', fontSize: '13px' }}>
                        {imgCount > 0 ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '4px 8px', borderRadius: '3px', fontSize: '11px', fontWeight: '500', background: '#dbeafe', color: '#1e40af' }}><Image size={11} /> {imgCount}/{promptCount}</span>
                        ) : promptCount > 0 ? (
                          <span style={{ fontSize: '11px', color: COLORS.lightText }}>{promptCount} prompts</span>
                        ) : (
                          <span style={{ color: COLORS.lightText, fontSize: '11px' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px', display: 'flex', gap: '8px' }}>
                        <button onClick={() => { setViewingRecord(r); setViewTab('content'); setIsEditing(false); setVisualMessage(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}><Eye size={18} color={COLORS.navActive} /></button>
                        <button onClick={() => handleEditRecord(r)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}><Edit2 size={18} color={COLORS.navActive} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ===== VIEW MODAL ===== */}
      {viewingRecord && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => { setViewingRecord(null); setIsEditing(false); }}>
          <div style={{ background: COLORS.white, width: '98%', maxWidth: '1400px', height: '95vh', display: 'flex', flexDirection: 'column', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${COLORS.borderColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #f5f6f8 0%, #ffffff 100%)' }}>
              <div>
                <h2 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: '700', color: COLORS.darkText }}>{viewingRecord.topic}</h2>
                <p style={{ margin: 0, fontSize: '13px', color: COLORS.lightText }}>Class {viewingRecord.class} • {viewingRecord.subject} • {viewingRecord.sub_topic || 'N/A'}</p>
              </div>
              <button onClick={() => { setViewingRecord(null); setIsEditing(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', fontSize: '24px', color: COLORS.lightText }}>✕</button>
            </div>

            {/* Tab Bar */}
            <div style={{ padding: '0 24px', borderBottom: `1px solid ${COLORS.borderColor}`, display: 'flex', background: COLORS.lightBg }}>
              <button onClick={() => setViewTab('content')} style={{ padding: '12px 20px', background: 'none', border: 'none', borderBottom: viewTab === 'content' ? `2px solid ${COLORS.navActive}` : '2px solid transparent', color: viewTab === 'content' ? COLORS.navActive : COLORS.lightText, fontWeight: viewTab === 'content' ? '600' : '500', fontSize: '13px', cursor: 'pointer', fontFamily: FONT_FAMILY, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BookOpen size={14} /> Content
              </button>
              <button onClick={() => setViewTab('visuals')} style={{ padding: '12px 20px', background: 'none', border: 'none', borderBottom: viewTab === 'visuals' ? '2px solid #8b5cf6' : '2px solid transparent', color: viewTab === 'visuals' ? '#8b5cf6' : COLORS.lightText, fontWeight: viewTab === 'visuals' ? '600' : '500', fontSize: '13px', cursor: 'pointer', fontFamily: FONT_FAMILY, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Image size={14} /> Visual Assets
                {getVisualPrompts(viewingRecord).length > 0 && (
                  <span style={{ background: '#8b5cf6', color: 'white', fontSize: '10px', padding: '1px 6px', borderRadius: '10px', fontWeight: '600' }}>{getVisualPrompts(viewingRecord).length}</span>
                )}
              </button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', background: COLORS.white }}>
              {viewTab === 'content' ? renderContentTab() : renderVisualAssetsTab()}
            </div>

            {/* Footer */}
            {viewingRecord.ai_output && (
              <div style={{ padding: '14px 24px', borderTop: `1px solid ${COLORS.borderColor}`, display: 'flex', justifyContent: 'flex-end', gap: '10px', background: COLORS.lightBg }}>
                <button onClick={handleCopyContent} style={{ padding: '9px 16px', background: '#6366f1', color: COLORS.white, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '12px', fontFamily: FONT_FAMILY, display: 'flex', alignItems: 'center', gap: '6px' }}><Copy size={14} /> Copy</button>
                <button onClick={handleExportPDF} style={{ padding: '9px 16px', background: COLORS.navActive, color: COLORS.white, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '12px', fontFamily: FONT_FAMILY, display: 'flex', alignItems: 'center', gap: '6px' }}><Download size={14} /> PDF</button>
                <button onClick={handleExportWord} style={{ padding: '9px 16px', background: COLORS.navActive, color: COLORS.white, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '12px', fontFamily: FONT_FAMILY, display: 'flex', alignItems: 'center', gap: '6px' }}><Download size={14} /> Word</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== LIGHTBOX ===== */}
      {lightboxImage && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, cursor: 'pointer' }} onClick={() => setLightboxImage(null)}>
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
            <img src={lightboxImage} alt="Full size" style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 0 40px rgba(0,0,0,0.5)' }} />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '12px' }}>
              <button onClick={() => { navigator.clipboard.writeText(lightboxImage); setVisualMessage('✅ URL copied!'); }} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT_FAMILY, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Copy size={12} /> Copy URL
              </button>
              <button onClick={() => handleInsertImageAtCursor(lightboxImage, 'image')} style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT_FAMILY, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ImagePlus size={12} /> Insert into Content
              </button>
              <button onClick={() => window.open(lightboxImage, '_blank')} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT_FAMILY, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Maximize2 size={12} /> Open Original
              </button>
              <button onClick={() => setLightboxImage(null)} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT_FAMILY }}>
                ✕ Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAGE SETTINGS */}
      {authPage === 'dashboard' && renderPageSettingsPanel()}
    </div>
  );
}
