import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Menu, X, LogOut, Eye, Edit2, BookOpen, Plus, Download, RefreshCw,
  Mail, Check, AlertCircle, Copy, Users, Image, Sparkles, Palette,
  ChevronDown, ChevronUp, Loader2, ImagePlus, Layers, Trash2,
  Pencil, Save, XCircle, Link, Maximize2, ZoomIn, Clock
} from 'lucide-react';
import {
  detectErrorType, showDetailedError, logError, checkAPIHealth
} from './utils/errorHandling';

const supabase = createClient(
  'https://syacvhjmcgpgxvczassp.supabase.co',
  'sb_publishable_tmoQwBjJYHyMnOSGAzts2w_v-aG0iYl'
);

const COLORS = {
  navActive: '#2563eb', navText: '#5a6978', navDisabled: '#cbd5e0',
  darkText: '#0f172a', lightText: '#6b7280', white: '#ffffff',
  lightBg: '#f9fafb', filterBg: '#f3f4f6', borderColor: '#e5e7eb',
  sidebarBg: '#f5f6f8', statusGenerating: '#8b5cf6', statusGenerated: '#10b981',
  statusPending: '#9ca3af', successBg: '#ecfdf5', successBorder: '#a7f3d0',
  successText: '#065f46', errorBg: '#fef2f2', errorBorder: '#fecaca', errorText: '#991b1b',
};
const FONT_FAMILY = 'Inter, sans-serif';
const IMAGE_MODELS = [
  { id: 'openai', label: 'OpenAI DALL-E', color: '#10a37f' },
  { id: 'gemini', label: 'Google Gemini', color: '#4285f4' },
  { id: 'kling', label: 'Kling AI', color: '#ff6b35' },
  { id: 'midjourney', label: 'Midjourney', color: '#7c3aed' },
];
const GOOGLE_FONTS = [
  'Montserrat','Lexend','Poppins','Roboto','Open Sans','Lato','Nunito','Raleway',
  'Playfair Display','Merriweather','Source Sans 3','PT Serif','Libre Baskerville',
  'Crimson Text','Work Sans','DM Sans','Inter','Outfit','Quicksand','Josefin Sans',
  'Caveat','Pacifico','Dancing Script','Comfortaa','Bitter','Noto Sans','Ubuntu',
  'Mukta','Tiro Devanagari Hindi','Hind'
];
const FONT_SIZES = ['10','12','13','14','16','18','20','24','28','32','36','48'];
const PAPER_SIZES = {
  'A4': { width: 210, height: 297, label: 'A4 (210 × 297 mm)' },
  'A3': { width: 297, height: 420, label: 'A3 (297 × 420 mm)' },
  'Letter': { width: 216, height: 279, label: 'Letter (8.5 × 11 in)' },
  'Legal': { width: 216, height: 356, label: 'Legal (8.5 × 14 in)' },
};
const generateId = () => Math.random().toString(36).substring(2, 10) + Date.now().toString(36);

const MI = ({ name, size, color, style }) => (
  <span className="material-symbols-rounded" style={{
    fontSize: size || 18, color: color || 'inherit', verticalAlign: 'middle', lineHeight: 1,
    fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20", ...style
  }}>{name}</span>
);
const MIF = ({ name, size, color, style }) => (
  <span className="material-symbols-rounded" style={{
    fontSize: size || 18, color: color || 'inherit', verticalAlign: 'middle', lineHeight: 1,
    fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20", ...style
  }}>{name}</span>
);

// ============================================================
// PLAGIARISM CHECK MODAL
// ============================================================
function PlagiarismCheckModal({ record, onClose, supabaseUrl, supabaseAnonKey, initialResult, onResultSaved }) {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(initialResult || null);
  const [error, setError] = useState('');
  const [selectedMatch, setSelectedMatch] = useState(null);

  const runCheck = async () => {
    if (!record.ai_output || record.ai_output.trim().length < 50) {
      setError('No content to check. Please generate content first.');
      return;
    }
    setChecking(true); setError(''); setResult(null); setSelectedMatch(null);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('check-plagiarism', {
        body: { content: record.ai_output, record_id: record.record_id }
      });
      if (invokeError) throw invokeError;
      if (data.error && !data.overall_score && data.overall_score !== 0) { setError(data.error); }
      else {
        setResult(data);
        if (onResultSaved) onResultSaved(data);
      }
    } catch (e) { setError('Check failed: ' + e.message); }
    setChecking(false);
  };

  const getScoreColor = (score) => {
    if (score >= 70) return '#ef4444';
    if (score >= 40) return '#f59e0b';
    if (score >= 20) return '#3b82f6';
    return '#22c55e';
  };
  const getScoreLabel = (score) => {
    if (score >= 70) return 'High Similarity';
    if (score >= 40) return 'Moderate Similarity';
    if (score >= 20) return 'Low Similarity';
    return 'Unique Content';
  };
  const getMatchBadgeStyle = (type) => {
    if (type === 'exact') return { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' };
    if (type === 'paraphrase') return { background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' };
    return { background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' };
  };

  const renderHighlightedContent = () => {
    if (!result || !result.matches || result.matches.length === 0) {
      return <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'Montserrat, sans-serif', fontSize: 13, lineHeight: 1.8, color: '#374151' }}>{record.ai_output || 'No content available.'}</pre>;
    }
    const text = record.ai_output || '';
    const highlights = [];
    result.matches.forEach((match, mi) => {
      if (!match.fragment) return;
      const frag = match.fragment.trim().substring(0, 120);
      const idx = text.indexOf(frag);
      if (idx !== -1) highlights.push({ start: idx, end: idx + frag.length, matchIndex: mi, type: match.type });
    });
    highlights.sort((a, b) => a.start - b.start);
    const parts = [];
    let lastIdx = 0;
    const bgMap = { exact: '#fecaca', paraphrase: '#fde68a', similar: '#bfdbfe' };
    highlights.forEach((h) => {
      if (h.start >= lastIdx) {
        if (h.start > lastIdx) parts.push(<span key={'t' + lastIdx}>{text.substring(lastIdx, h.start)}</span>);
        parts.push(
          <span key={'h' + h.start} onClick={() => setSelectedMatch(h.matchIndex)}
            style={{ background: bgMap[h.type] || '#fde68a', cursor: 'pointer', borderBottom: '2px solid ' + getScoreColor(result.matches[h.matchIndex].similarity_score || 50), borderRadius: 2, padding: '0 2px' }}
            title={'Match ' + (h.matchIndex + 1) + ': ' + (result.matches[h.matchIndex].source_title || 'Source')}>
            {text.substring(h.start, h.end)}
          </span>
        );
        lastIdx = h.end;
      }
    });
    if (lastIdx < text.length) parts.push(<span key="tail">{text.substring(lastIdx)}</span>);
    return <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'Montserrat, sans-serif', fontSize: 13, lineHeight: 1.8, color: '#374151' }}>{parts}</div>;
  };

  const isCached = !!initialResult && !checking;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', flexDirection: 'column' }}>
      <style>{'@keyframes plagSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }'}</style>
      <div style={{ background: '#1e1b4b', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <MI name="policy" size={22} color="#a5b4fc" />
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, fontFamily: 'Lexend, sans-serif' }}>Plagiarism &amp; Copyright Check</div>
          <div style={{ color: '#a5b4fc', fontSize: 12 }}>
            Record #{record.record_id} — {record.subject} / {record.topic}
            {isCached && result && <span style={{ marginLeft: 8, background: '#312e81', color: '#c7d2fe', padding: '1px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>✓ Saved result</span>}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
          {!checking && !result && <button onClick={runCheck} style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Inter,sans-serif' }}><MI name="search" size={16} color="white" /> Run Check</button>}
          {result && <button onClick={runCheck} style={{ background: '#374151', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontWeight: 600, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Inter,sans-serif' }}><MI name="refresh" size={15} color="white" /> Re-Check</button>}
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', fontFamily: 'Inter,sans-serif' }}><MI name="close" size={18} color="white" /></button>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: '#f8fafc' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '2px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '10px 16px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <MI name="article" size={17} color="#6366f1" />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', fontFamily: 'Lexend, sans-serif' }}>Content</span>
            {result && (
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontWeight: 600 }}>■ Exact</span>
                <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', fontWeight: 600 }}>■ Paraphrase</span>
                <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', fontWeight: 600 }}>■ Similar</span>
              </div>
            )}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
            {checking ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16 }}>
                <div style={{ width: 48, height: 48, border: '4px solid #e2e8f0', borderTop: '4px solid #6366f1', borderRadius: '50%', animation: 'plagSpin 1s linear infinite' }} />
                <div style={{ color: '#6366f1', fontWeight: 700, fontSize: 15, fontFamily: 'Lexend, sans-serif' }}>Searching internet for matches...</div>
                <div style={{ color: '#94a3b8', fontSize: 13 }}>This may take 30–90 seconds</div>
              </div>
            ) : renderHighlightedContent()}
          </div>
        </div>
        <div style={{ width: 360, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fff' }}>
          {!result && !checking && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 }}>
              <MI name="plagiarism" size={56} color="#c7d2fe" />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#374151', fontFamily: 'Lexend, sans-serif', marginBottom: 8 }}>Ready to Check</div>
                <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>Analyze this content against internet sources to detect plagiarism and copyright issues.</div>
              </div>
              {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 13, textAlign: 'center', width: '100%' }}>{error}</div>}
              <button onClick={runCheck} style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Inter,sans-serif' }}>
                <MI name="search" size={18} color="white" /> Run Plagiarism Check
              </button>
            </div>
          )}
          {checking && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 }}>
              <div style={{ width: 56, height: 56, border: '5px solid #e0e7ff', borderTop: '5px solid #6366f1', borderRadius: '50%', animation: 'plagSpin 1s linear infinite' }} />
              <div style={{ fontSize: 14, fontWeight: 700, color: '#6366f1', fontFamily: 'Lexend, sans-serif' }}>Analyzing...</div>
              <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', lineHeight: 1.6 }}>Checking key phrases against online sources using Copyleaks.</div>
            </div>
          )}
          {result && !checking && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #e2e8f0', background: '#fafafa' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
                    <svg width="80" height="80" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="34" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                      <circle cx="40" cy="40" r="34" fill="none" stroke={getScoreColor(result.overall_score)} strokeWidth="8"
                        strokeDasharray={2 * Math.PI * 34}
                        strokeDashoffset={2 * Math.PI * 34 * (1 - result.overall_score / 100)}
                        strokeLinecap="round" transform="rotate(-90 40 40)" />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 20, fontWeight: 800, color: getScoreColor(result.overall_score), fontFamily: 'Lexend, sans-serif' }}>{result.overall_score}%</span>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: getScoreColor(result.overall_score), fontFamily: 'Lexend, sans-serif' }}>{getScoreLabel(result.overall_score)}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Similarity Score</div>
                    <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                      <div style={{ background: '#f0fdf4', borderRadius: 6, padding: '4px 10px', fontSize: 12, color: '#16a34a', fontWeight: 600 }}>{result.unique_percentage || (100 - result.overall_score)}% Unique</div>
                      <div style={{ background: '#fef9c3', borderRadius: 6, padding: '4px 10px', fontSize: 12, color: '#ca8a04', fontWeight: 600 }}>{result.matches ? result.matches.length : 0} Sources</div>
                    </div>
                  </div>
                </div>
                {result.summary && <div style={{ marginTop: 12, background: '#f8fafc', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#475569', lineHeight: 1.6, border: '1px solid #e2e8f0' }}>{result.summary}</div>}
              </div>
              <div style={{ overflowY: 'auto', flex: 1 }}>
                <div style={{ padding: '12px 16px 6px', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'Lexend, sans-serif' }}>Match Overview</div>
                {(!result.matches || result.matches.length === 0) && <div style={{ padding: '20px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No matching sources found online.</div>}
                {result.matches && result.matches.map((match, idx) => (
                  <div key={idx} onClick={() => setSelectedMatch(selectedMatch === idx ? null : idx)}
                    style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: selectedMatch === idx ? '#f0f4ff' : 'transparent' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: getScoreColor(match.similarity_score || 50) + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: getScoreColor(match.similarity_score || 50) }}>{idx + 1}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{match.source_title || 'Unknown Source'}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{match.source_url || ''}</div>
                      </div>
                      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: getScoreColor(match.similarity_score || 0) }}>{match.similarity_score || 0}%</span>
                        <span style={{ ...getMatchBadgeStyle(match.match_type), borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>{(match.match_type || 'similar').toUpperCase()}</span>
                      </div>
                    </div>
                    {selectedMatch === idx && match.fragment && (
                      <div style={{ marginTop: 8, padding: '8px 10px', background: '#fff', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 12, color: '#475569', lineHeight: 1.6, fontStyle: 'italic' }}>
                        "...{match.fragment.substring(0, 180)}{match.fragment.length > 180 ? '...' : ''}"
                        {match.source_url && (
                          <div style={{ marginTop: 6 }}>
                            <a href={match.source_url} target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1', fontSize: 11, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <MI name="open_in_new" size={13} color="#6366f1" /> View Source
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
// ============================================================
// END PLAGIARISM CHECK MODAL
// ============================================================
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authPage, setAuthPage] = useState('login');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showInvitePanel, setShowInvitePanel] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');
  const [pendingInvites, setPendingInvites] = useState([]);
  const [setupToken, setSetupToken] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupPasswordConfirm, setSetupPasswordConfirm] = useState('');
  const [setupError, setSetupError] = useState('');
  const [setupLoading, setSetupLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [filterClass, setFilterClass] = useState('All Classes');
  const [filterSubject, setFilterSubject] = useState('All Subjects');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [filterTopic, setFilterTopic] = useState('');
  const [filterRecordId, setFilterRecordId] = useState('');
  const [filterContentType, setFilterContentType] = useState('All Types');

  const CONTENT_TYPES = [
  'Textbook',
  'Textbook - Chapter Content',
  'Textbook - Chapter Activity',
  'Textbook - Chapter Assessment',
  'Textbook - Chapter Practice',
  'Textbook - Chapter Teacher Track',
  'Textbook - Project Content',
  'Lesson Plan',
  'Assignment',
  'Project Paper',
  'Practice Questions',
  'Flash Cards',
  'Mock Exam',
  'MCQ QP',
  'Descriptive QP',
  'Interactive Scroll',
  'Live Worksheet',
  'Video',
  'Audio',
  'Simulation'
];

  const [showAddForm, setShowAddForm] = useState(false);
  const [formClass, setFormClass] = useState('1');
  const [formSubject, setFormSubject] = useState('English');
  const [formTopic, setFormTopic] = useState('');
  const [formSubTopic, setFormSubTopic] = useState('');
  const [formContentType, setFormContentType] = useState('');
  const [formPrompt, setFormPrompt] = useState('');
  const [formTextModel, setFormTextModel] = useState('claude'); // NEW: multi-model selector
  const [formLoading, setFormLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [plagiarismRecord, setPlagiarismRecord] = useState(null); // NEW: plagiarism modal
const [userName, setUserName] = useState(() => sessionStorage.getItem('acs_user_name') || '');
const [showNameModal, setShowNameModal] = useState(false);
const [showAnalytics, setShowAnalytics] = useState(false);
  const [viewTab, setViewTab] = useState('content');
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [savingContent, setSavingContent] = useState(false);
  const contentEditorRef = useRef(null);
  const selectionRef = useRef({ start: 0, end: 0 });
  const [editorFont, setEditorFont] = useState('Montserrat');
  const [editorFontSize, setEditorFontSize] = useState('14');
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const undoStack = useRef([]);
  const redoStack = useRef([]);
  const [viewMode, setViewMode] = useState('markdown');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);
  const [generatingImageId, setGeneratingImageId] = useState(null);
  const [visualMessage, setVisualMessage] = useState('');
  const [lightboxImage, setLightboxImage] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [imgWidthMap, setImgWidthMap] = useState({});

  const subjects = [
    'English','Mathematics','Science','Social Studies','Social Science',
    'मधुबन सरल-SL','तरंग-TL','Arts','Physical Education',
    'Environmental Studies','General Knowledge','Computers'
  ];

  const [pageSettings, setPageSettings] = useState(() => {
    const saved = localStorage.getItem('pdfPageSettings');
    return saved ? JSON.parse(saved) : { paperSize: 'A4', orientation: 'portrait', customWidth: 210, customHeight: 297, margins: 10 };
  });

  const [layoutBlocks, setLayoutBlocks] = useState([]);
  const [draggedBlockIdx, setDraggedBlockIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [editingBlockId, setEditingBlockId] = useState(null);
  const [layoutSaved, setLayoutSaved] = useState(false);
  const [expandedHistoryIdx, setExpandedHistoryIdx] = useState(null);

  useEffect(() => {
    if (viewingRecord) {
      const saved = localStorage.getItem('layout_' + viewingRecord.record_id);
      try { setLayoutBlocks(saved ? JSON.parse(saved) : []); } catch(e) { setLayoutBlocks([]); }
      setEditingBlockId(null);
    }
  }, [viewingRecord ? viewingRecord.record_id : null]);

  useEffect(() => {
    const fontFamilies = GOOGLE_FONTS.map(f => 'family=' + f.replace(/ /g, '+') + ':wght@400;500;600;700').join('&');
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?' + fontFamilies + '&display=swap';
    link.rel = 'stylesheet'; document.head.appendChild(link);
    const iconLink = document.createElement('link');
    iconLink.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap';
    iconLink.rel = 'stylesheet'; document.head.appendChild(iconLink);
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    document.head.appendChild(script);
  }, []);

  useEffect(() => { localStorage.setItem('pdfPageSettings', JSON.stringify(pageSettings)); }, [pageSettings]);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('invite_token=')) {
      const token = new URLSearchParams(hash.substring(1)).get('invite_token');
      if (token) { setSetupToken(token); setAuthPage('setup-password'); }
    }
    checkAuth();
    checkAPIHealth().then(h => { if (!h.healthy) console.warn('Claude API may be experiencing issues'); });
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single();
      setCurrentUser({ ...user, user_metadata: { ...user.user_metadata, role: roleData?.role || 'content_developer' } });
      setAuthPage('dashboard'); fetchRecords(); if (!sessionStorage.getItem('acs_user_name')) setShowNameModal(true);
    }
  };

  // ===== MARKDOWN PARSER =====
  const parseMarkdownToReact = (markdown) => {
    if (!markdown) return null;
    const lines = markdown.split('\n');
    const result = [];
    let i = 0, listItems = [], tableLines = [], codeBlock = [], inCodeBlock = false;

    const flushList = () => {
      if (listItems.length > 0) {
        result.push(<ul key={'list-' + result.length} style={{ marginLeft: '24px', marginBottom: '16px' }}>
          {listItems.map((item, idx) => <li key={idx} style={{ marginBottom: '6px', lineHeight: '1.6' }}>{renderInline(item)}</li>)}
        </ul>);
        listItems = [];
      }
    };
    const flushTable = () => {
      if (tableLines.length > 0) {
        const filtered = tableLines.filter(l => !/^[\s|:-]+$/.test(l));
        const rows = filtered.map(l => l.split('|').map(c => c.trim()).filter(c => c));
        if (rows.length > 1) {
          const colCount = rows[0].length;
          result.push(
            <div key={'tw-' + result.length} style={{ overflowX: 'auto', margin: '16px 0', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', border: '1px solid ' + COLORS.borderColor }}>
                <thead><tr style={{ background: '#1e293b', color: 'white' }}>
                  {rows[0].map((cell, idx) => <th key={idx} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', borderBottom: '2px solid #475569', borderRight: idx < colCount - 1 ? '1px solid #334155' : 'none', minWidth: '80px' }}>{renderInline(cell)}</th>)}
                </tr></thead>
                <tbody>{rows.slice(1).map((row, ri) => (
                  <tr key={ri} style={{ background: ri % 2 === 0 ? '#fff' : '#f8fafc', borderBottom: '1px solid ' + COLORS.borderColor }}>
                    {Array.from({ length: colCount }, (_, ci) => <td key={ci} style={{ padding: '10px 14px', borderRight: ci < colCount - 1 ? '1px solid ' + COLORS.borderColor : 'none', wordBreak: 'break-word', verticalAlign: 'top', lineHeight: '1.5', fontSize: '12px' }}>{renderInline(row[ci] || '')}</td>)}
                  </tr>
                ))}</tbody>
              </table>
            </div>
          );
        }
        tableLines = [];
      }
    };
    const flushCode = () => {
      if (codeBlock.length > 0) {
        result.push(<pre key={'code-' + result.length} style={{ background: '#1f2937', color: '#e5e7eb', padding: '14px', borderRadius: '6px', overflowX: 'auto', margin: '12px 0', fontSize: '12px', lineHeight: '1.5', fontFamily: 'monospace', pageBreakInside: 'avoid', breakInside: 'avoid' }}><code>{codeBlock.join('\n')}</code></pre>);
        codeBlock = [];
      }
    };
    const renderInline = (text) => {
      if (!text) return null;
      const formatted = text
        .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight:600">$1</strong>')
        .replace(/__(.*?)__/g, '<strong style="font-weight:600">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em style="font-style:italic">$1</em>')
        .replace(/`(.*?)`/g, '<code style="background:#f3f4f6;padding:2px 6px;border-radius:3px;font-family:monospace">$1</code>');
      if (formatted !== text) return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
      return text;
    };

    while (i < lines.length) {
      const line = lines[i];
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) { flushCode(); inCodeBlock = false; } else { inCodeBlock = true; }
        i++; continue;
      }
      if (inCodeBlock) { codeBlock.push(line); i++; continue; }
      if (line.includes('|') && line.trim().length > 2) { tableLines.push(line); i++; continue; }
      if (tableLines.length > 0 && (!line.includes('|') || line.trim().length < 2)) flushTable();
      if (line.startsWith('###')) { flushList(); result.push(<h3 key={i} style={{ fontSize: '15px', margin: '12px 0 8px 0', fontWeight: '600', color: COLORS.darkText, pageBreakAfter: 'avoid' }}>{renderInline(line.replace(/^#+\s*/, ''))}</h3>); i++; continue; }
      if (line.startsWith('##')) { flushList(); result.push(<h2 key={i} style={{ fontSize: '17px', margin: '14px 0 10px 0', fontWeight: '600', color: COLORS.darkText, pageBreakAfter: 'avoid' }}>{renderInline(line.replace(/^#+\s*/, ''))}</h2>); i++; continue; }
      if (line.startsWith('#')) { flushList(); result.push(<h1 key={i} style={{ fontSize: '20px', margin: '16px 0 12px 0', fontWeight: '700', color: COLORS.darkText, pageBreakAfter: 'avoid' }}>{renderInline(line.replace(/^#+\s*/, ''))}</h1>); i++; continue; }
      if (line.trim().startsWith('-') || line.trim().startsWith('*') || /^\d+\./.test(line.trim())) {
        const t = line.replace(/^[\s\-\*]+|\d+\.\s*/, '').trim();
        if (t) listItems.push(t); i++; continue;
      }
      if (line.startsWith('>')) { flushList(); result.push(<blockquote key={i} style={{ borderLeft: '4px solid #2563eb', padding: '10px 12px', margin: '12px 0', background: '#f0f9ff', fontSize: '13px', fontStyle: 'italic', color: '#475569', pageBreakInside: 'avoid' }}>{renderInline(line.replace(/^>\s*/, ''))}</blockquote>); i++; continue; }
      if (line.trim().length === 0) { flushList(); result.push(<div key={i} style={{ height: '8px' }} />); i++; continue; }
      const imgMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
      if (imgMatch) {
        flushList();
        const imgUrl = imgMatch[2];
        const imgAlt = imgMatch[1];
        const currentWidth = imgWidthMap[imgUrl] || 100;
        result.push(
          <div key={i} style={{ margin: '16px 0', textAlign: 'center', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
            <div style={{ position: 'relative', display: 'inline-block', maxWidth: currentWidth + '%', width: currentWidth + '%' }}>
              <img src={imgUrl} alt={imgAlt} style={{ width: '100%', maxHeight: '500px', objectFit: 'contain', borderRadius: '8px', border: '1px solid ' + COLORS.borderColor, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer', display: 'block' }} onClick={() => setLightboxImage(imgUrl)} />
              <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginTop: '6px', flexWrap: 'wrap' }}>
                {[25, 50, 75, 100].map(pct => (
                  <button key={pct} onClick={(e) => { e.stopPropagation(); setImgWidthMap(prev => ({ ...prev, [imgUrl]: pct })); }}
                    style={{ padding: '2px 8px', fontSize: '10px', fontWeight: currentWidth === pct ? '700' : '400', background: currentWidth === pct ? COLORS.navActive : COLORS.filterBg, color: currentWidth === pct ? 'white' : COLORS.lightText, border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: FONT_FAMILY }}>
                    {pct}%
                  </button>
                ))}
              </div>
            </div>
            {imgAlt && <p style={{ fontSize: '11px', color: COLORS.lightText, marginTop: '6px', fontStyle: 'italic' }}>{imgAlt}</p>}
          </div>
        );
        i++; continue;
      }
      if (line.trim()) { flushList(); result.push(<p key={i} style={{ margin: '8px 0', lineHeight: '1.6', color: COLORS.darkText, pageBreakInside: 'avoid' }}>{renderInline(line)}</p>); }
      i++;
    }
    flushList(); flushTable(); flushCode();
    return result;
  };

  const getPaperDimensions = () => {
    let width, height;
    if (pageSettings.paperSize === 'Custom') { width = pageSettings.customWidth; height = pageSettings.customHeight; }
    else { const s = PAPER_SIZES[pageSettings.paperSize]; width = s.width; height = s.height; }
    if (pageSettings.orientation === 'landscape') [width, height] = [height, width];
    return { width, height };
  };

  const getVisualPrompts = (record) => {
    if (!record?.visual_prompts) return [];
    try { return Array.isArray(record.visual_prompts) ? record.visual_prompts : JSON.parse(record.visual_prompts); } catch { return []; }
  };
  const getCharacterPrompts = (record) => getVisualPrompts(record).filter(p => p.type === 'character');
  const getScenePrompts = (record) => getVisualPrompts(record).filter(p => p.type === 'scene');
  const getGeneratedImages = (record) => getVisualPrompts(record).filter(p => p.image_url);

  const saveVisualPrompts = async (recordId, prompts) => {
    const { error } = await supabase.from('textbook_content').update({ visual_prompts: prompts, updated_at: new Date() }).eq('record_id', recordId);
    if (error) throw error;
  };

  const handleAddVisualPrompt = async (type) => {
    if (!viewingRecord) return;
    const prompts = getVisualPrompts(viewingRecord);
    const newPrompt = { id: generateId(), type, prompt: '', image_url: null, model_used: null, reference_ids: [], status: 'pending', created_at: new Date().toISOString() };
    const updated = [...prompts, newPrompt];
    try {
      await saveVisualPrompts(viewingRecord.record_id, updated);
      setViewingRecord({ ...viewingRecord, visual_prompts: updated });
      setVisualMessage('New ' + type + ' prompt added'); fetchRecords();
    } catch (err) { setVisualMessage('Failed to add: ' + err.message); }
  };

  const handleUpdatePromptText = async (promptId, newText) => {
    if (!viewingRecord) return;
    const updated = getVisualPrompts(viewingRecord).map(p => p.id === promptId ? { ...p, prompt: newText } : p);
    try { await saveVisualPrompts(viewingRecord.record_id, updated); setViewingRecord({ ...viewingRecord, visual_prompts: updated }); }
    catch (err) { setVisualMessage('Failed to update: ' + err.message); }
  };

  const handleToggleReference = async (sceneId, characterId) => {
    if (!viewingRecord) return;
    const updated = getVisualPrompts(viewingRecord).map(p => {
      if (p.id !== sceneId) return p;
      const refs = p.reference_ids || [];
      return { ...p, reference_ids: refs.includes(characterId) ? refs.filter(r => r !== characterId) : [...refs, characterId] };
    });
    try { await saveVisualPrompts(viewingRecord.record_id, updated); setViewingRecord({ ...viewingRecord, visual_prompts: updated }); }
    catch (err) { setVisualMessage('Failed: ' + err.message); }
  };

  const handleDeleteVisualPrompt = async (promptId) => {
    if (!viewingRecord || !window.confirm('Delete this prompt and its image?')) return;
    const cleaned = getVisualPrompts(viewingRecord).filter(p => p.id !== promptId).map(p => ({ ...p, reference_ids: (p.reference_ids || []).filter(r => r !== promptId) }));
    try { await saveVisualPrompts(viewingRecord.record_id, cleaned); setViewingRecord({ ...viewingRecord, visual_prompts: cleaned }); setVisualMessage('Prompt deleted'); fetchRecords(); }
    catch (err) { setVisualMessage('Failed: ' + err.message); }
  };

  const handleGenerateImage = async (promptId, model) => {
    if (!viewingRecord) return;
    const prompts = getVisualPrompts(viewingRecord);
    const target = prompts.find(p => p.id === promptId);
    if (!target || !target.prompt.trim()) { setVisualMessage('Write a prompt description first'); return; }
    setGeneratingImageId(promptId); setVisualMessage('');
    try {
      let referenceImages = [];
      if (target.type === 'scene' && target.reference_ids?.length > 0) {
        referenceImages = prompts.filter(p => target.reference_ids.includes(p.id) && p.image_url).map(p => p.image_url);
      }
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { record_id: viewingRecord.record_id, prompt_id: promptId, type: target.type, prompt: target.prompt, model, reference_images: referenceImages }
      });
      if (error) throw error;
      if (data?.image_url) {
        const updated = prompts.map(p => p.id === promptId ? { ...p, image_url: data.image_url, model_used: model, status: 'generated' } : p);
        await saveVisualPrompts(viewingRecord.record_id, updated);
        setViewingRecord({ ...viewingRecord, visual_prompts: updated });
        setVisualMessage('Image generated!'); fetchRecords();
      } else throw new Error(data?.error || 'No image URL returned');
    } catch (err) { setVisualMessage('Generation failed: ' + err.message); }
    finally { setGeneratingImageId(null); }
  };

  // ===== CONTENT EDITING =====
  const handleStartEditing = () => { setEditContent(viewingRecord?.ai_output || ''); setIsEditing(true); setShowAssetPicker(false); };
  const handleCancelEditing = () => { setIsEditing(false); setEditContent(''); setShowAssetPicker(false); };
  const trackSelection = () => { const t = contentEditorRef.current; if (t) selectionRef.current = { start: t.selectionStart, end: t.selectionEnd }; };

  const applyFormat = (prefix, suffix) => {
    const textarea = contentEditorRef.current; if (!textarea) return;
    const { start, end } = selectionRef.current;
    const selected = editContent.substring(start, end);
    const before = editContent.substring(0, start), after = editContent.substring(end);
    if (selected) {
      setEditContent(before + prefix + selected + suffix + after);
      setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start + prefix.length, end + prefix.length); selectionRef.current = { start: start + prefix.length, end: end + prefix.length }; }, 50);
    } else {
      setEditContent(before + prefix + 'text' + suffix + after);
      setTimeout(() => { textarea.focus(); const s = start + prefix.length; textarea.setSelectionRange(s, s + 4); selectionRef.current = { start: s, end: s + 4 }; }, 50);
    }
  };

  const applyBold = () => applyFormat('**', '**');
  const applyItalic = () => applyFormat('*', '*');
  const applyUnderline = () => applyFormat('<u>', '</u>');
  const applyStrikethrough = () => applyFormat('~~', '~~');
  const applyCode = () => applyFormat('`', '`');
  const applySuperscript = () => applyFormat('<sup>', '</sup>');
  const applySubscript = () => applyFormat('<sub>', '</sub>');
  const applyHighlight = () => applyFormat('<mark>', '</mark>');

  const applyHeading = (level) => {
    const textarea = contentEditorRef.current; if (!textarea) return;
    const start = selectionRef.current.start;
    const lineStart = editContent.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = editContent.indexOf('\n', start);
    const end = lineEnd === -1 ? editContent.length : lineEnd;
    const cleanLine = editContent.substring(lineStart, end).replace(/^#{1,6}\s*/, '');
    setEditContent(editContent.substring(0, lineStart) + '#'.repeat(level) + ' ' + cleanLine + editContent.substring(end));
    setTimeout(() => textarea.focus(), 50);
  };

  const applyFontWrap = (fontFamily) => {
    setEditorFont(fontFamily);
    const textarea = contentEditorRef.current; if (!textarea) return;
    const { start, end } = selectionRef.current;
    const selected = editContent.substring(start, end);
    if (selected) { setEditContent(editContent.substring(0, start) + '<span style="font-family:' + fontFamily + '">' + selected + '</span>' + editContent.substring(end)); setTimeout(() => textarea.focus(), 50); }
  };
  const applyFontSizeWrap = (size) => {
    setEditorFontSize(size);
    const textarea = contentEditorRef.current; if (!textarea) return;
    const { start, end } = selectionRef.current;
    const selected = editContent.substring(start, end);
    if (selected) { setEditContent(editContent.substring(0, start) + '<span style="font-size:' + size + 'px">' + selected + '</span>' + editContent.substring(end)); setTimeout(() => textarea.focus(), 50); }
  };

  const insertHR = () => { const t = contentEditorRef.current; if (!t) return; const s = selectionRef.current.start; setEditContent(editContent.substring(0, s) + '\n\n---\n\n' + editContent.substring(s)); setTimeout(() => t.focus(), 50); };
  const insertBulletList = () => { const t = contentEditorRef.current; if (!t) return; const s = selectionRef.current.start; setEditContent(editContent.substring(0, s) + '\n- Item 1\n- Item 2\n- Item 3\n' + editContent.substring(s)); setTimeout(() => t.focus(), 50); };
  const insertNumberedList = () => { const t = contentEditorRef.current; if (!t) return; const s = selectionRef.current.start; setEditContent(editContent.substring(0, s) + '\n1. Item 1\n2. Item 2\n3. Item 3\n' + editContent.substring(s)); setTimeout(() => t.focus(), 50); };
  const insertBlockquote = () => applyFormat('\n> ', '\n');
  const insertLink = () => {
    const url = window.prompt('Enter URL:'); if (!url) return;
    const linkText = editContent.substring(selectionRef.current.start, selectionRef.current.end) || 'link text';
    const t = contentEditorRef.current; if (!t) return;
    pushUndo(editContent);
    setEditContent(editContent.substring(0, selectionRef.current.start) + '[' + linkText + '](' + url + ')' + editContent.substring(selectionRef.current.end));
    setTimeout(() => t.focus(), 50);
  };
  const insertTable = () => {
    const t = contentEditorRef.current; if (!t) return;
    const s = selectionRef.current.start; pushUndo(editContent);
    setEditContent(editContent.substring(0, s) + '\n\n| Header 1 | Header 2 | Header 3 |\n| --- | --- | --- |\n| Cell 1 | Cell 2 | Cell 3 |\n| Cell 4 | Cell 5 | Cell 6 |\n\n' + editContent.substring(s));
    setTimeout(() => t.focus(), 50);
  };
  const clearFormatting = () => {
    const t = contentEditorRef.current; if (!t) return;
    const { start, end } = selectionRef.current;
    const selected = editContent.substring(start, end); if (!selected) return;
    const cleaned = selected.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').replace(/~~(.*?)~~/g, '$1').replace(/<[^>]+>/g, '').replace(/`(.*?)`/g, '$1').replace(/^#{1,6}\s*/gm, '');
    pushUndo(editContent); setEditContent(editContent.substring(0, start) + cleaned + editContent.substring(end));
    setTimeout(() => t.focus(), 50);
  };
  const insertCodeBlock = () => { const t = contentEditorRef.current; if (!t) return; const s = selectionRef.current.start; pushUndo(editContent); setEditContent(editContent.substring(0, s) + '\n```\ncode here\n```\n' + editContent.substring(s)); setTimeout(() => t.focus(), 50); };

  const pushUndo = (content) => { undoStack.current.push(content); if (undoStack.current.length > 50) undoStack.current.shift(); };
  const handleUndo = () => { if (!undoStack.current.length) return; redoStack.current.push(editContent); setEditContent(undoStack.current.pop()); setTimeout(() => contentEditorRef.current?.focus(), 50); };
  const handleRedo = () => { if (!redoStack.current.length) return; undoStack.current.push(editContent); setEditContent(redoStack.current.pop()); setTimeout(() => contentEditorRef.current?.focus(), 50); };
  const handleEditorChange = (e) => { pushUndo(editContent); setEditContent(e.target.value); redoStack.current = []; };

  const handleLocalImageUpload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please select an image file'); return; }
    if (file.size > 10 * 1024 * 1024) { alert('Image too large. Max 10MB.'); return; }
    setUploadingImage(true);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const filename = (viewingRecord?.record_id || 'misc') + '/upload_' + Date.now() + '.' + ext;
      const { error } = await supabase.storage.from('generated-images').upload(filename, file, { contentType: file.type, upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('generated-images').getPublicUrl(filename);
      if (!urlData.publicUrl) throw new Error('Failed to get public URL');
      handleInsertImageAtCursor(urlData.publicUrl, file.name.replace(/\.[^.]+$/, ''));
      setVisualMessage('Image uploaded and inserted!');
    } catch (err) { alert('Upload failed: ' + err.message); }
    finally { setUploadingImage(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const handleInsertImageAtCursor = (imageUrl, altText) => {
    if (!isEditing) {
      setEditContent(viewingRecord?.ai_output || ''); setIsEditing(true);
      setTimeout(() => setEditContent(prev => prev + '\n\n![' + altText + '](' + imageUrl + ')\n\n'), 100);
      return;
    }
    const textarea = contentEditorRef.current;
    if (!textarea) { setEditContent(prev => prev + '\n\n![' + altText + '](' + imageUrl + ')\n\n'); return; }
    const start = textarea.selectionStart, end = textarea.selectionEnd;
    const imgMd = '\n\n![' + altText + '](' + imageUrl + ')\n\n';
    setEditContent(editContent.substring(0, start) + imgMd + editContent.substring(end));
    setTimeout(() => { textarea.focus(); const p = start + imgMd.length; textarea.setSelectionRange(p, p); }, 50);
  };

  const handleSaveContent = async () => {
    if (!viewingRecord) return;
    setSavingContent(true);
    try {
      const historyEntry = {
        action: 'content_edited', timestamp: new Date().toISOString(), user: (userName ? userName + ' (' + (currentUser?.email || '') + ')' : currentUser?.email || 'unknown'),
        word_count_before: (viewingRecord.ai_output || '').trim().split(/\s+/).length,
        word_count_after: editContent.trim().split(/\s+/).length,
        content_before: viewingRecord.ai_output || '', content_after: editContent,
      };
      let existingHistory = [];
      if (viewingRecord.edit_history && Array.isArray(viewingRecord.edit_history)) existingHistory = viewingRecord.edit_history;
      const updatedHistory = [historyEntry, ...existingHistory];
      const { error } = await supabase.from('textbook_content').update({ ai_output: editContent, edit_history: updatedHistory, updated_at: new Date() }).eq('record_id', viewingRecord.record_id);
      if (error) throw error;
      setViewingRecord({ ...viewingRecord, ai_output: editContent, edit_history: updatedHistory });
      setIsEditing(false); fetchRecords();
    } catch (err) { alert('Save failed: ' + err.message); }
    finally { setSavingContent(false); }
  };

  // ===== EXPORT / PRINT =====
  const IMG_EXPORT_CSS = `
    img { max-width: 100%; page-break-inside: avoid !important; break-inside: avoid !important; display: block; }
    .img-wrap { page-break-inside: avoid !important; break-inside: avoid !important; display: block; clear: both; }
    table { page-break-inside: avoid; break-inside: avoid; }
    h1,h2,h3 { page-break-after: avoid; }
  `;

  const mdToHtml = (markdown) => {
    const lines = markdown.split('\n');
    let html = '', i = 0, inCode = false, codeBuf = [], tableBuf = [];
    const flushTbl = () => {
      if (!tableBuf.length) return;
      const filtered = tableBuf.filter(l => !/^[\s|:-]+$/.test(l));
      const rows = filtered.map(l => l.split('|').map(c => c.trim()).filter(c => c));
      if (rows.length > 1) {
        const cols = rows[0].length;
        html += '<table style="width:100%;border-collapse:collapse;margin:14px 0;border:1px solid #d1d5db;page-break-inside:avoid;break-inside:avoid;">';
        html += '<thead><tr style="background:#1e293b;color:white;">';
        rows[0].forEach((cell, ci) => { html += '<th style="padding:8px 12px;text-align:left;font-weight:600;font-size:11px;border-bottom:2px solid #475569;border-right:' + (ci < cols - 1 ? '1px solid #334155' : 'none') + ';">' + cell + '</th>'; });
        html += '</tr></thead><tbody>';
        rows.slice(1).forEach((row, ri) => {
          html += '<tr style="background:' + (ri % 2 === 0 ? '#fff' : '#f8fafc') + ';border-bottom:1px solid #e5e7eb;">';
          for (let ci = 0; ci < cols; ci++) html += '<td style="padding:8px 12px;font-size:12px;vertical-align:top;border-right:' + (ci < cols - 1 ? '1px solid #e5e7eb' : 'none') + ';">' + (row[ci] || '') + '</td>';
          html += '</tr>';
        });
        html += '</tbody></table>';
      }
      tableBuf = [];
    };
    const inlineFmt = (t) => t.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/<u>(.*?)<\/u>/g, '<u>$1</u>').replace(/~~(.*?)~~/g, '<s>$1</s>').replace(/`(.*?)`/g, '<code style="background:#f3f4f6;padding:2px 5px;border-radius:3px;font-size:11px;font-family:monospace;">$1</code>');
    while (i < lines.length) {
      const line = lines[i];
      if (line.trim().startsWith('```')) {
        if (inCode) { html += '<pre style="background:#1f2937;color:#e5e7eb;padding:12px;border-radius:6px;margin:10px 0;font-size:11px;page-break-inside:avoid;break-inside:avoid;"><code>' + codeBuf.join('\n') + '</code></pre>'; codeBuf = []; inCode = false; }
        else { flushTbl(); inCode = true; }
        i++; continue;
      }
      if (inCode) { codeBuf.push(line); i++; continue; }
      if (line.includes('|') && line.trim().length > 2) { tableBuf.push(line); i++; continue; }
      if (tableBuf.length && (!line.includes('|') || line.trim().length < 2)) flushTbl();
      const imgM = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
      if (imgM) {
        flushTbl();
        html += '<div class="img-wrap" style="margin:20px 0;text-align:center;page-break-inside:avoid;break-inside:avoid;"><img src="' + imgM[2] + '" alt="' + imgM[1] + '" style="max-width:90%;max-height:480px;object-fit:contain;border-radius:6px;border:1px solid #e5e7eb;page-break-inside:avoid;break-inside:avoid;" />' + (imgM[1] ? '<p style="font-size:10px;color:#6b7280;margin-top:4px;font-style:italic;">' + imgM[1] + '</p>' : '') + '</div>';
        i++; continue;
      }
      if (line.startsWith('### ')) { flushTbl(); html += '<h3 style="font-size:15px;margin:14px 0 6px;font-weight:600;page-break-after:avoid;">' + inlineFmt(line.replace(/^#+\s*/, '')) + '</h3>'; i++; continue; }
      if (line.startsWith('## ')) { flushTbl(); html += '<h2 style="font-size:17px;margin:16px 0 8px;font-weight:600;page-break-after:avoid;">' + inlineFmt(line.replace(/^#+\s*/, '')) + '</h2>'; i++; continue; }
      if (line.startsWith('# ')) { flushTbl(); html += '<h1 style="font-size:20px;margin:18px 0 10px;font-weight:700;page-break-after:avoid;">' + inlineFmt(line.replace(/^#+\s*/, '')) + '</h1>'; i++; continue; }
      if (/^---+$/.test(line.trim())) { html += '<hr style="border:none;border-top:1px solid #e5e7eb;margin:14px 0;">'; i++; continue; }
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ') || /^\d+\.\s/.test(line.trim())) {
        const items = [];
        while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* ') || /^\d+\.\s/.test(lines[i].trim()))) {
          const it = lines[i].replace(/^[\s\-\*]+|\d+\.\s*/, '').trim();
          if (it) items.push(it); i++;
        }
        if (items.length) { html += '<ul style="margin-left:20px;margin-bottom:10px;">'; items.forEach(it => { html += '<li style="margin-bottom:4px;line-height:1.6;font-size:13px;">' + inlineFmt(it) + '</li>'; }); html += '</ul>'; }
        continue;
      }
      if (line.startsWith('>')) { html += '<blockquote style="border-left:3px solid #2563eb;padding:8px 12px;margin:10px 0;background:#f0f9ff;font-style:italic;color:#475569;font-size:12px;">' + inlineFmt(line.replace(/^>\s*/, '')) + '</blockquote>'; i++; continue; }
      if (!line.trim()) { html += '<div style="height:4px;"></div>'; i++; continue; }
      html += '<p style="margin:6px 0;line-height:1.7;font-size:13px;">' + inlineFmt(line) + '</p>';
      i++;
    }
    flushTbl();
    return html;
  };

  const handlePrintPreview = () => {
    if (!viewingRecord?.ai_output) return;
    const html = mdToHtml(viewingRecord.ai_output);
    const pw = window.open('', '_blank', 'width=900,height=700');
    if (!pw) { alert('Pop-up blocked.'); return; }
    pw.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + viewingRecord.topic + '</title>');
    pw.document.write('<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">');
    pw.document.write('<style>* { margin:0;padding:0;box-sizing:border-box; } body { font-family:Montserrat,Inter,sans-serif;color:#0f172a;padding:40px;max-width:800px;margin:0 auto; }');
    pw.document.write(IMG_EXPORT_CSS);
    pw.document.write('.print-bar{display:flex;gap:8px;margin-bottom:20px;padding:12px;background:#f3f4f6;border-radius:8px;align-items:center;} .print-bar button{padding:8px 20px;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;}');
    pw.document.write('.pb{background:#2563eb;color:white;} .cb{background:#e5e7eb;color:#374151;}');
    pw.document.write('@media print{.print-bar{display:none!important;} body{padding:20px;}}');
    pw.document.write('</style></head><body>');
    pw.document.write('<div class="print-bar"><button class="pb" onclick="window.print()">Print (Ctrl+P)</button><button class="cb" onclick="window.close()">Close</button><span style="margin-left:auto;font-size:11px;color:#6b7280;">Use browser print settings for paper size</span></div>');
    pw.document.write('<div style="margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #2563eb;"><h1 style="font-size:24px;font-weight:700;margin-bottom:4px;">' + viewingRecord.topic + '</h1><p style="font-size:13px;color:#6b7280;">Class ' + viewingRecord.class + ' | ' + viewingRecord.subject + (viewingRecord.sub_topic ? ' | ' + viewingRecord.sub_topic : '') + '</p></div>');
    pw.document.write(html);
    pw.document.write('</body></html>');
    pw.document.close();
  };

  const handleExportPDF = () => {
    if (!viewingRecord?.ai_output) return;
    try {
      const html = mdToHtml(viewingRecord.ai_output);
      const dimensions = getPaperDimensions();
      const element = document.createElement('div');
      element.style.width = '100%'; element.style.padding = pageSettings.margins + 'mm';
      element.innerHTML = '<style>' + IMG_EXPORT_CSS + '</style>'
        + '<div style="font-family:Inter,Montserrat,sans-serif;color:#0f172a;">'
        + '<h1 style="font-size:26px;margin-bottom:4px;font-weight:700;page-break-after:avoid;">' + viewingRecord.topic + '</h1>'
        + '<p style="color:#6b7280;margin-bottom:4px;font-size:13px;">Class ' + viewingRecord.class + ' | ' + viewingRecord.subject + (viewingRecord.sub_topic ? ' | ' + viewingRecord.sub_topic : '') + '</p>'
        + '<p style="color:#9ca3af;margin-bottom:16px;font-size:11px;">' + (viewingRecord.content_type || '') + '</p>'
        + '<hr style="border:none;border-top:2px solid #2563eb;margin:0 0 20px 0;width:60px;">'
        + html + '</div>';
      if (window.html2pdf) {
        window.html2pdf().set({
          margin: pageSettings.margins,
          filename: viewingRecord.topic + '.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, allowTaint: true, logging: false },
          jsPDF: { orientation: pageSettings.orientation === 'landscape' ? 'l' : 'p', unit: 'mm', format: pageSettings.paperSize === 'Custom' ? [dimensions.width, dimensions.height] : pageSettings.paperSize, compress: true },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'], avoid: ['.img-wrap', 'img', 'table'] }
        }).from(element).save();
      } else { alert('PDF library is loading. Please try again.'); }
    } catch (err) { alert('PDF export failed: ' + err.message); }
  };

  const handleExportWord = () => {
    if (!viewingRecord?.ai_output) return;
    try {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([viewingRecord.ai_output], { type: 'text/plain' }));
      a.download = viewingRecord.topic + '.txt';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    } catch (err) { alert('Export failed: ' + err.message); }
  };

  const handleCopyContent = async () => {
    if (!viewingRecord?.ai_output) return;
    try { await navigator.clipboard.writeText(viewingRecord.ai_output); alert('Content copied!'); }
    catch (err) { alert('Failed: ' + err.message); }
  };

  const handleExport = () => {
    const filtered = applyFilters();
    let csv = 'ID,Class,Subject,Topic,SubTopic,Status,Words\n';
    filtered.forEach(r => { csv += r.record_id + ',"' + r.class + '","' + r.subject + '","' + r.topic + '","' + (r.sub_topic||'') + '","' + r.status + '",' + (r.word_count||0) + '\n'; });
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = 'textbooks.csv'; document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  // ===== AUTH HANDLERS =====
  const handleSetupPassword = async (e) => {
    e.preventDefault(); setSetupError('');
    if (setupPassword !== setupPasswordConfirm) { setSetupError('Passwords do not match'); return; }
    if (setupPassword.length < 6) { setSetupError('Min 6 characters'); return; }
    if (!setupToken) { setSetupError('No invite token found.'); return; }
    setSetupLoading(true);
    try {
      const { data: inviteData, error: inviteError } = await supabase.from('invites').select('*').eq('token', setupToken).single();
      if (inviteError || !inviteData) throw new Error('Invite is invalid or expired.');
      if (inviteData.status !== 'pending') throw new Error('This invite has already been used.');
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email: inviteData.email, password: setupPassword, options: { emailRedirectTo: window.location.origin } });
      if (signUpError && !signUpError.message.includes('already registered')) throw signUpError;
      let userId = signUpData?.user?.id;
      if (!userId) { const { data: ud } = await supabase.auth.getUser(); userId = ud?.user?.id; }
      if (userId) {
        const { error: roleError } = await supabase.from('user_roles').insert([{ user_id: userId, role: 'content_developer' }]);
        if (roleError && !roleError.message.includes('duplicate')) console.error('Role insert:', roleError);
      }
      await supabase.from('invites').update({ status: 'accepted', accepted_at: new Date().toISOString() }).eq('token', setupToken);
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: inviteData.email, password: setupPassword });
      if (signInError) throw signInError;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Failed to get user session');
      const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single();
      setCurrentUser({ ...user, user_metadata: { ...user.user_metadata, role: roleData?.role || 'content_developer' } });
      setAuthPage('dashboard'); fetchRecords(); if (!sessionStorage.getItem('acs_user_name')) setShowNameModal(true);
    } catch (err) { setSetupError(err.message || 'Setup failed.'); }
    finally { setSetupLoading(false); }
  };

  const handleLogin = async (e) => {
    e.preventDefault(); setLoginError(''); setLoginLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
      if (error) throw error;
      const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', data.user.id).single();
      setCurrentUser({ ...data.user, user_metadata: { ...data.user.user_metadata, role: roleData?.role || 'content_developer' } });
      setAuthPage('dashboard'); fetchRecords(); if (!sessionStorage.getItem('acs_user_name')) setShowNameModal(true);
    } catch (err) { setLoginError(err.message || 'Login failed'); }
    finally { setLoginLoading(false); }
  };

  // ===== DATA =====
  const fetchRecords = async () => {
    const { data, error } = await supabase.from('textbook_content').select('*').order('updated_at', { ascending: false });
    if (!error && data) {
      setRecords(data);
      const params = new URLSearchParams(window.location.search);
      const sharedId = params.get('record');
      if (sharedId) {
        const found = data.find(r => String(r.record_id) === sharedId);
        if (found && !viewingRecord) { setViewingRecord(found); setViewTab('content'); }
      }
    }
  };

  const getComments = (record) => {
    if (!record?.comments) return [];
    try { return Array.isArray(record.comments) ? record.comments : JSON.parse(record.comments); } catch { return []; }
  };

  const handleAddComment = async () => {
    if (!viewingRecord || !commentText.trim()) return;
    const newComment = { id: generateId(), text: commentText.trim(), user: currentUser?.email || 'unknown', timestamp: new Date().toISOString() };
    const updated = [newComment, ...getComments(viewingRecord)];
    try {
      const { error } = await supabase.from('textbook_content').update({ comments: updated, updated_at: new Date() }).eq('record_id', viewingRecord.record_id);
      if (error) throw error;
      setViewingRecord({ ...viewingRecord, comments: updated }); setCommentText(''); fetchRecords();
    } catch (err) { alert('Failed: ' + err.message); }
  };

  const handleDeleteComment = async (commentId) => {
    if (!viewingRecord) return;
    const updated = getComments(viewingRecord).filter(c => c.id !== commentId);
    try {
      const { error } = await supabase.from('textbook_content').update({ comments: updated, updated_at: new Date() }).eq('record_id', viewingRecord.record_id);
      if (error) throw error;
      setViewingRecord({ ...viewingRecord, comments: updated }); fetchRecords();
    } catch (err) { alert('Failed: ' + err.message); }
  };

  const handleShareRecord = () => {
    if (!viewingRecord) return;
    const url = window.location.origin + window.location.pathname + '?record=' + viewingRecord.record_id;
    navigator.clipboard.writeText(url).then(() => { setShareMessage('Link copied!'); setTimeout(() => setShareMessage(''), 2000); }).catch(() => window.prompt('Copy this link:', url));
  };

  // ===== FILTERS =====
  const applyFilters = () => records.filter(r => {
    const classMatch = filterClass === 'All Classes' || r.class === filterClass;
    const subjectMatch = filterSubject === 'All Subjects' || r.subject === filterSubject;
    const statusMatch = filterStatus === 'All Status' || r.status === filterStatus;
    const typeMatch = filterContentType === 'All Types' || r.content_type === filterContentType;
    const topicMatch = !filterTopic || r.topic.toLowerCase().includes(filterTopic.toLowerCase());
    const idMatch = !filterRecordId || String(r.record_id).includes(filterRecordId.trim());
    return classMatch && subjectMatch && statusMatch && typeMatch && topicMatch && idMatch;
  });

  const handleClearFilters = () => { setFilterClass('All Classes'); setFilterSubject('All Subjects'); setFilterStatus('All Status'); setFilterTopic(''); setFilterContentType('All Types'); setFilterRecordId(''); };

  // ===== RECORD FORM =====
  const handleSaveRecord = async (e) => {
    e.preventDefault(); setFormLoading(true);
    try {
      if (!formClass || !formSubject || !formTopic || !formContentType || !formPrompt) { alert('Please fill all required fields'); setFormLoading(false); return; }
      let result;
      if (editingId) {
        // NEW: include text_model in update
        result = await supabase.from('textbook_content').update({ class: formClass, subject: formSubject, topic: formTopic, sub_topic: formSubTopic, content_type: formContentType, prompt: formPrompt, text_model: formTextModel, status: 'generating', updated_at: new Date() }).eq('record_id', editingId);
      } else {
        // NEW: include text_model in insert
        result = await supabase.from('textbook_content').insert([{ class: formClass, subject: formSubject, topic: formTopic, sub_topic: formSubTopic, content_type: formContentType, prompt: formPrompt, text_model: formTextModel, status: 'generating' }]);
      }
      if (result.error) { logError('handleSaveRecord', result.error, {}); showDetailedError(result.error); setFormLoading(false); return; }
      setFormClass('1'); setFormSubject('English'); setFormTopic(''); setFormSubTopic(''); setFormContentType(''); setFormPrompt(''); setFormTextModel('claude'); setShowAddForm(false); setEditingId(null);
      setTimeout(() => { fetchRecords(); alert('Record saved! Status: generating'); }, 500);
    } catch (err) { logError('handleSaveRecord', err, {}); showDetailedError(err); setFormLoading(false); }
    finally { setFormLoading(false); }
  };

  const handleSendInvite = async (e) => {
    e.preventDefault(); setInviteSending(true); setInviteMessage('');
    try {
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await supabase.from('invites').insert([{ email: inviteEmail, token, status: 'pending', invited_by: currentUser.id, expires_at: expiresAt.toISOString() }]);
      const inviteLink = window.location.origin + '#invite_token=' + token;
      setInviteMessage('Invite sent!\n\nShare this link:\n' + inviteLink + '\n\nExpires in 7 days');
      setInviteEmail(''); fetchPendingInvites();
    } catch (err) { setInviteMessage('Error: ' + err.message); }
    finally { setInviteSending(false); }
  };

  const fetchPendingInvites = async () => {
    const { data } = await supabase.from('invites').select('*').eq('status', 'pending').order('created_at', { ascending: false });
    setPendingInvites(data || []);
  };

  // NEW: reset formTextModel in all form open/close/edit handlers
  const handleOpenAddForm = () => {
    setEditingId(null); setFormClass('1'); setFormSubject('English'); setFormTopic(''); setFormSubTopic(''); setFormContentType(''); setFormPrompt(''); setFormTextModel('claude'); setShowAddForm(!showAddForm);
    setTimeout(() => { const f = document.querySelector('[data-form="edit-add"]'); if (f) { f.scrollIntoView({ behavior: 'smooth', block: 'start' }); const inp = f.querySelector('input,select,textarea'); if (inp) inp.focus(); } }, 100);
  };
  const handleCancelForm = () => { setShowAddForm(false); setEditingId(null); setFormClass('1'); setFormSubject('English'); setFormTopic(''); setFormSubTopic(''); setFormContentType(''); setFormPrompt(''); setFormTextModel('claude'); };
  const handleEditRecord = (record) => {
    setEditingId(record.record_id); setFormClass(record.class || '1'); setFormSubject(record.subject || 'English'); setFormTopic(record.topic || ''); setFormSubTopic(record.sub_topic || ''); setFormContentType(record.content_type || ''); setFormPrompt(record.prompt || ''); setFormTextModel(record.text_model || 'claude'); setShowAddForm(true);
    setTimeout(() => { const f = document.querySelector('[data-form="edit-add"]'); if (f) { f.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }, 100);
  };
const handleSavePlagiarismResult = async (result) => {
  if (!plagiarismRecord) return;
  try {
    await supabase.from('textbook_content')
      .update({ plagiarism_result: result, updated_at: new Date() })
      .eq('record_id', plagiarismRecord.record_id);
    const updated = { ...plagiarismRecord, plagiarism_result: result };
    setPlagiarismRecord(updated);
    if (viewingRecord && viewingRecord.record_id === plagiarismRecord.record_id) {
      setViewingRecord({ ...viewingRecord, plagiarism_result: result });
    }
    fetchRecords();
  } catch(err) { console.error('Failed to save plagiarism result:', err); }
};
  const [showPageSettings, setShowPageSettings] = useState(false);

  // ====================================================================
  // ===== VISUAL PROMPT CARD =====
  // ====================================================================
  const VisualPromptCard = ({ prompt, allPrompts }) => {
    const [localPrompt, setLocalPrompt] = useState(prompt.prompt);
    const [selectedModel, setSelectedModel] = useState(prompt.model_used || 'openai');
    const [isEditingPrompt, setIsEditingPrompt] = useState(false);
    const isGenerating = generatingImageId === prompt.id;
    const characterPrompts = allPrompts.filter(p => p.type === 'character' && p.image_url);
    const isScene = prompt.type === 'scene';
    return (
      <div style={{ background: COLORS.white, borderRadius: '10px', border: '1px solid ' + COLORS.borderColor, overflow: 'hidden', marginBottom: '12px' }}>
        <div style={{ padding: '12px 16px', background: isScene ? 'linear-gradient(135deg,#dbeafe,#eff6ff)' : 'linear-gradient(135deg,#ede9fe,#faf5ff)', borderBottom: '1px solid ' + COLORS.borderColor, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: isScene ? '#2563eb' : '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MI name={isScene ? 'landscape' : 'person'} size={14} color="white" />
            </div>
            <div>
              <span style={{ fontSize: '12px', fontWeight: '600', color: COLORS.darkText }}>{isScene ? 'Scene' : 'Character'}</span>
              {prompt.status === 'generated' && <span style={{ marginLeft: '8px', fontSize: '10px', padding: '2px 6px', borderRadius: '3px', background: COLORS.successBg, color: COLORS.successText, fontWeight: '500' }}>Generated</span>}
              {prompt.model_used && <span style={{ marginLeft: '4px', fontSize: '10px', padding: '2px 6px', borderRadius: '3px', background: '#f3f4f6', color: COLORS.lightText }}>{IMAGE_MODELS.find(m => m.id === prompt.model_used)?.label || prompt.model_used}</span>}
            </div>
          </div>
          <button onClick={() => handleDeleteVisualPrompt(prompt.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', opacity: 0.5, fontSize: '12px' }}>Delete</button>
        </div>
        <div style={{ padding: '14px 16px' }}>
          <label style={{ display: 'block', fontSize: '10px', fontWeight: '600', color: COLORS.lightText, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description Prompt</label>
          {isEditingPrompt ? (
            <div>
              <textarea value={localPrompt} onChange={e => setLocalPrompt(e.target.value)} rows={3} autoFocus style={{ width: '100%', padding: '10px', fontSize: '12px', lineHeight: '1.6', border: '1px solid ' + COLORS.navActive, borderRadius: '6px', fontFamily: 'Montserrat,sans-serif', resize: 'vertical', outline: 'none' }} />
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                <button onClick={() => { handleUpdatePromptText(prompt.id, localPrompt); setIsEditingPrompt(false); }} style={{ padding: '4px 10px', background: COLORS.navActive, color: 'white', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT_FAMILY }}>Save</button>
                <button onClick={() => { setLocalPrompt(prompt.prompt); setIsEditingPrompt(false); }} style={{ padding: '4px 10px', background: COLORS.filterBg, color: COLORS.darkText, border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontFamily: FONT_FAMILY }}>Cancel</button>
              </div>
            </div>
          ) : (
            <div onClick={() => setIsEditingPrompt(true)} style={{ padding: '10px', background: isScene ? '#eff6ff' : '#faf5ff', borderRadius: '6px', border: '1px solid ' + (isScene ? '#bfdbfe' : '#e9d5ff'), fontSize: '12px', lineHeight: '1.6', color: prompt.prompt ? COLORS.darkText : COLORS.lightText, fontFamily: 'Montserrat,sans-serif', minHeight: '40px', cursor: 'pointer', whiteSpace: 'pre-wrap' }}>
              {prompt.prompt || 'Click to write a description...'}
            </div>
          )}
          {isScene && characterPrompts.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: '600', color: COLORS.lightText, marginBottom: '6px', textTransform: 'uppercase' }}>Reference Characters</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {characterPrompts.map(cp => {
                  const isSel = (prompt.reference_ids || []).includes(cp.id);
                  return <div key={cp.id} onClick={() => handleToggleReference(prompt.id, cp.id)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', border: '2px solid ' + (isSel ? '#8b5cf6' : COLORS.borderColor), background: isSel ? '#ede9fe' : COLORS.white }}>
                    <img src={cp.image_url} alt="" style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'cover' }} />
                    <span style={{ fontSize: '10px', fontWeight: '500', color: isSel ? '#7c3aed' : COLORS.lightText }}>{isSel ? '✓' : 'Use'}</span>
                  </div>;
                })}
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', alignItems: 'center' }}>
            <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)} style={{ padding: '7px 10px', fontSize: '11px', border: '1px solid ' + COLORS.borderColor, borderRadius: '6px', fontFamily: FONT_FAMILY, background: COLORS.white, minWidth: '150px' }}>
              {IMAGE_MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
            <button onClick={() => handleGenerateImage(prompt.id, selectedModel)} disabled={isGenerating || !prompt.prompt?.trim()} style={{ padding: '7px 14px', background: isGenerating ? '#a78bfa' : (isScene ? '#2563eb' : '#8b5cf6'), color: 'white', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: isGenerating || !prompt.prompt?.trim() ? 'not-allowed' : 'pointer', fontFamily: FONT_FAMILY, opacity: !prompt.prompt?.trim() ? 0.5 : 1 }}>
              {isGenerating ? 'Generating...' : 'Generate'}
            </button>
          </div>
          {prompt.image_url && (
            <div style={{ marginTop: '12px' }}>
              <img src={prompt.image_url} alt={prompt.type} style={{ width: '100%', maxHeight: '240px', objectFit: 'contain', borderRadius: '8px', border: '1px solid ' + COLORS.borderColor, cursor: 'pointer' }} onClick={() => setLightboxImage(prompt.image_url)} />
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                <button onClick={() => setLightboxImage(prompt.image_url)} style={{ padding: '4px 10px', background: COLORS.filterBg, color: COLORS.darkText, border: 'none', borderRadius: '4px', fontSize: '10px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT_FAMILY }}>Full Size</button>
                <button onClick={() => handleInsertImageAtCursor(prompt.image_url, prompt.type + ' - ' + (prompt.prompt?.substring(0, 30) || ''))} style={{ padding: '4px 10px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', fontSize: '10px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT_FAMILY }}>Insert into Content</button>
                <button onClick={() => { navigator.clipboard.writeText(prompt.image_url); setVisualMessage('Image URL copied!'); }} style={{ padding: '4px 10px', background: COLORS.filterBg, color: COLORS.darkText, border: 'none', borderRadius: '4px', fontSize: '10px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT_FAMILY }}>Copy URL</button>
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
        {visualMessage && (
          <div style={{ padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '12px', fontWeight: '500', background: visualMessage.includes('Failed') ? COLORS.errorBg : COLORS.successBg, border: '1px solid ' + (visualMessage.includes('Failed') ? COLORS.errorBorder : COLORS.successBorder), color: visualMessage.includes('Failed') ? COLORS.errorText : COLORS.successText, display: 'flex', justifyContent: 'space-between' }}>
            <span>{visualMessage}</span>
            <button onClick={() => setVisualMessage('')} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5 }}>✕</button>
          </div>
        )}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: COLORS.darkText }}>Characters / Visuals <span style={{ fontSize: '11px', fontWeight: '400', color: COLORS.lightText }}>({characters.length})</span></h3>
            <button onClick={() => handleAddVisualPrompt('character')} style={{ padding: '6px 12px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT_FAMILY }}>+ Add Character</button>
          </div>
          {characters.length === 0 ? <div style={{ padding: '24px', textAlign: 'center', color: COLORS.lightText, fontSize: '13px', background: '#faf5ff', borderRadius: '8px', border: '1px dashed #d8b4fe' }}>No character prompts yet. Claude auto-generates these, or click "Add Character".</div> : characters.map(p => <VisualPromptCard key={p.id} prompt={p} allPrompts={prompts} />)}
        </div>
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: COLORS.darkText }}>Scene Images <span style={{ fontSize: '11px', fontWeight: '400', color: COLORS.lightText }}>({scenes.length})</span></h3>
            <button onClick={() => handleAddVisualPrompt('scene')} style={{ padding: '6px 12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT_FAMILY }}>+ Add Scene</button>
          </div>
          {scenes.length === 0 ? <div style={{ padding: '24px', textAlign: 'center', color: COLORS.lightText, fontSize: '13px', background: '#eff6ff', borderRadius: '8px', border: '1px dashed #93c5fd' }}>No scene prompts yet.</div> : scenes.map(p => <VisualPromptCard key={p.id} prompt={p} allPrompts={prompts} />)}
        </div>
        {getGeneratedImages(viewingRecord).length > 0 && (
          <div style={{ background: '#f0fdf4', border: '1px solid ' + COLORS.successBorder, borderRadius: '10px', padding: '16px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '600', color: COLORS.successText }}>All Generated Images ({getGeneratedImages(viewingRecord).length})</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(100px,1fr))', gap: '8px' }}>
              {getGeneratedImages(viewingRecord).map(p => (
                <div key={p.id} style={{ position: 'relative', borderRadius: '6px', overflow: 'hidden', border: '1px solid ' + COLORS.borderColor, cursor: 'pointer' }} onClick={() => setLightboxImage(p.image_url)}>
                  <img src={p.image_url} alt={p.type} style={{ width: '100%', height: '80px', objectFit: 'cover', display: 'block' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', padding: '3px 6px' }}><span style={{ fontSize: '9px', color: 'white', fontWeight: '600', textTransform: 'uppercase' }}>{p.type}</span></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ====================================================================
  // ===== HISTORY TAB =====
  // ====================================================================
  const renderHistoryTab = () => {
    if (!viewingRecord) return null;
    const fmt = (d) => { try { const dt = new Date(d); return dt.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) + ' ' + dt.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}); } catch { return d||'—'; } };
    let timeline = [];
    if (viewingRecord.created_at) timeline.push({ label:'Record Created', time:viewingRecord.created_at, detail:'Class '+viewingRecord.class+' • '+viewingRecord.subject+' • '+viewingRecord.topic, color:'#2563eb' });
    if (viewingRecord.prompt) timeline.push({ label:'Prompt Submitted', time:viewingRecord.created_at, detail:viewingRecord.prompt.substring(0,120)+(viewingRecord.prompt.length>120?'...':''), color:'#8b5cf6' });
    if (viewingRecord.status==='generated'&&viewingRecord.ai_output) timeline.push({ label:'AI Content Generated', time:viewingRecord.updated_at, detail:(viewingRecord.word_count||0)+' words generated' + (viewingRecord.text_model && viewingRecord.text_model !== 'claude' ? ' via ' + viewingRecord.text_model.toUpperCase() : ' via Claude'), color:'#10b981' });
    const vp = getVisualPrompts(viewingRecord);
    if (vp.length>0) timeline.push({ label:'Visual Prompts Generated', time:vp[0]?.created_at||viewingRecord.updated_at, detail:vp.filter(p=>p.type==='character').length+' characters, '+vp.filter(p=>p.type==='scene').length+' scenes ('+vp.filter(p=>p.image_url).length+' generated)', color:'#f59e0b' });
    vp.filter(p=>p.image_url).forEach(p => timeline.push({ label:(p.type==='character'?'Character':'Scene')+' Image Generated', time:p.created_at, detail:'Model: '+(p.model_used||'unknown')+' — '+(p.prompt||'').substring(0,80), color:p.type==='character'?'#8b5cf6':'#2563eb' }));
    const editHistory = viewingRecord.edit_history && Array.isArray(viewingRecord.edit_history) ? viewingRecord.edit_history : [];
    editHistory.forEach((entry, idx) => timeline.push({ label:'Content Edited', time:entry.timestamp, detail:'By '+(entry.user||'unknown')+' — Words: '+(entry.word_count_before||'?')+' → '+(entry.word_count_after||'?'), color:'#ef4444', hasChanges:!!(entry.content_before||entry.content_after), editIdx:idx, contentBefore:entry.content_before||'', contentAfter:entry.content_after||'' }));
    timeline.sort((a,b) => new Date(b.time||0) - new Date(a.time||0));
    return (
      <div style={{ padding: '24px 32px', maxWidth: '700px' }}>
        <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600', color: COLORS.darkText }}>Record Timeline</h3>
        <p style={{ margin: '0 0 20px 0', fontSize: '12px', color: COLORS.lightText }}>Record ID: #{viewingRecord.record_id} • Status: {viewingRecord.status} • Type: {viewingRecord.content_type||'N/A'}</p>
        <div style={{ position: 'relative', paddingLeft: '28px' }}>
          <div style={{ position: 'absolute', left: '10px', top: '4px', bottom: '4px', width: '2px', background: COLORS.borderColor }} />
          {timeline.map((item, idx) => {
            const isExp = expandedHistoryIdx === idx;
            return (
              <div key={idx} style={{ position: 'relative', marginBottom: '20px' }}>
                <div style={{ position: 'absolute', left: '-22px', top: '2px', width: '16px', height: '16px', borderRadius: '50%', background: item.color, border: '2px solid ' + COLORS.white, boxShadow: '0 0 0 2px ' + item.color + '33' }} />
                <div style={{ background: COLORS.white, border: '1px solid ' + COLORS.borderColor, borderRadius: '8px', padding: '12px 14px', borderLeft: '3px solid ' + item.color }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: COLORS.darkText }}>{item.label}</span>
                    <span style={{ fontSize: '10px', color: COLORS.lightText, marginLeft: '12px' }}>{fmt(item.time)}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '11px', color: COLORS.lightText, lineHeight: '1.4', wordBreak: 'break-word' }}>{item.detail}</p>
                  {item.hasChanges && (
                    <div style={{ marginTop: '8px' }}>
                      <button onClick={() => setExpandedHistoryIdx(isExp ? null : idx)} style={{ padding: '4px 10px', fontSize: '10px', fontWeight: '600', background: isExp ? '#fef2f2' : COLORS.filterBg, color: isExp ? '#ef4444' : COLORS.darkText, border: '1px solid ' + (isExp ? '#fecaca' : COLORS.borderColor), borderRadius: '4px', cursor: 'pointer', fontFamily: FONT_FAMILY }}>
                        {isExp ? 'Hide Changes' : 'View Changes'}
                      </button>
                      {isExp && (
                        <div style={{ marginTop: '10px', display: 'flex', gap: '10px', flexDirection: 'column' }}>
                          {[['Before','#fef2f2','#fecaca','#991b1b',item.contentBefore],['After','#ecfdf5','#a7f3d0','#065f46',item.contentAfter]].map(([label,bg,border,color,content]) => (
                            <div key={label} style={{ background: bg, border: '1px solid '+border, borderRadius: '6px', overflow: 'hidden' }}>
                              <div style={{ padding: '6px 10px', background: border, fontSize: '10px', fontWeight: '700', color, textTransform: 'uppercase' }}>{label}</div>
                              <div style={{ padding: '10px', fontSize: '11px', lineHeight: '1.6', fontFamily: 'Montserrat,monospace', color, maxHeight: '200px', overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                {content ? content.substring(0, 2000) + (content.length > 2000 ? '\n...(truncated)' : '') : '(empty)'}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {timeline.length === 0 && <div style={{ padding: '24px', textAlign: 'center', color: COLORS.lightText, fontSize: '13px' }}>No history available yet.</div>}
        </div>
      </div>
    );
  };

  // ====================================================================
  // ===== PAGE LAYOUT BUILDER TAB =====
  // ====================================================================
  const renderLayoutTab = () => {
    if (!viewingRecord) return null;
    const allImages = getGeneratedImages(viewingRecord);
    const selectedBlock = editingBlockId ? layoutBlocks.find(b => b.id === editingBlockId) : null;

    const saveLayout = (blocks) => {
      localStorage.setItem('layout_' + viewingRecord.record_id, JSON.stringify(blocks));
      setLayoutSaved(true); setTimeout(() => setLayoutSaved(false), 2000);
    };
    const createBlock = (type) => {
      const id = generateId();
      const map = {
        heading: { id, type:'heading', level:1, content:'New Heading', align:'left' },
        text: { id, type:'text', content:'Enter text here...', align:'left' },
        image: { id, type:'image', url:'', alt:'', caption:'', width:'full', align:'center' },
        divider: { id, type:'divider', color:'#2563eb' },
        table: { id, type:'table', headers:['Column 1','Column 2','Column 3'], rows:[['','',''],['','','']] },
        spacer: { id, type:'spacer', height:24 },
        pagebreak: { id, type:'pagebreak' },
      };
      return map[type] || { id, type:'text', content:'' };
    };
    const addBlock = (type) => { const b = createBlock(type); const upd = [...layoutBlocks, b]; setLayoutBlocks(upd); setEditingBlockId(b.id); saveLayout(upd); };
    const updateBlock = (id, changes) => { const upd = layoutBlocks.map(b => b.id === id ? { ...b, ...changes } : b); setLayoutBlocks(upd); saveLayout(upd); };
    const deleteBlock = (id) => { const upd = layoutBlocks.filter(b => b.id !== id); setLayoutBlocks(upd); if (editingBlockId === id) setEditingBlockId(null); saveLayout(upd); };
    const moveBlock = (idx, dir) => { const nb = layoutBlocks.slice(); const ti = idx + dir; if (ti < 0 || ti >= nb.length) return; [nb[idx], nb[ti]] = [nb[ti], nb[idx]]; setLayoutBlocks(nb); saveLayout(nb); };
    const duplicateBlock = (id) => { const b = layoutBlocks.find(b => b.id === id); if (!b) return; const nb = { ...b, id: generateId() }; const idx = layoutBlocks.findIndex(b => b.id === id); const upd = [...layoutBlocks.slice(0, idx + 1), nb, ...layoutBlocks.slice(idx + 1)]; setLayoutBlocks(upd); saveLayout(upd); };

    const handleDragStart = (e, idx) => { setDraggedBlockIdx(idx); e.dataTransfer.effectAllowed = 'move'; };
    const handleDragOver = (e, idx) => { e.preventDefault(); setDragOverIdx(idx); };
    const handleDrop = (e, idx) => {
      e.preventDefault();
      if (draggedBlockIdx === null || draggedBlockIdx === idx) { setDraggedBlockIdx(null); setDragOverIdx(null); return; }
      const nb = layoutBlocks.slice(); const moved = nb.splice(draggedBlockIdx, 1)[0]; nb.splice(idx, 0, moved);
      setLayoutBlocks(nb); saveLayout(nb); setDraggedBlockIdx(null); setDragOverIdx(null);
    };
    const handleDragEnd = () => { setDraggedBlockIdx(null); setDragOverIdx(null); };

    const parseContentToBlocks = (markdown) => {
      const lines = markdown.split('\n'); const blocks = []; let textBuf = [];
      const flushText = () => { if (textBuf.length > 0) { const j = textBuf.join('\n').trim(); if (j) blocks.push({ id:generateId(), type:'text', content:j, align:'left' }); textBuf = []; } };
      lines.forEach(line => {
        if (line.startsWith('### ')) { flushText(); blocks.push({ id:generateId(), type:'heading', level:3, content:line.replace(/^###\s*/,''), align:'left' }); }
        else if (line.startsWith('## ')) { flushText(); blocks.push({ id:generateId(), type:'heading', level:2, content:line.replace(/^##\s*/,''), align:'left' }); }
        else if (line.startsWith('# ')) { flushText(); blocks.push({ id:generateId(), type:'heading', level:1, content:line.replace(/^#\s*/,''), align:'left' }); }
        else if (/^---+$/.test(line.trim())) { flushText(); blocks.push({ id:generateId(), type:'divider', color:'#e5e7eb' }); }
        else textBuf.push(line);
      });
      flushText(); return blocks;
    };

    const applyTemplate = (key) => {
      if (layoutBlocks.length > 0 && !window.confirm('Replace current layout with this template?')) return;
      const mk = () => generateId();
      const templates = {
        fromContent: () => viewingRecord.ai_output ? parseContentToBlocks(viewingRecord.ai_output) : (alert('No AI content available.'), null),
        titlePage: () => [
          { id:mk(), type:'spacer', height:60 },
          { id:mk(), type:'heading', level:1, content:viewingRecord.topic, align:'center' },
          { id:mk(), type:'spacer', height:12 },
          { id:mk(), type:'text', content:'Class ' + viewingRecord.class + '  \u2022  ' + viewingRecord.subject + (viewingRecord.sub_topic ? '  \u2022  ' + viewingRecord.sub_topic : ''), align:'center' },
          { id:mk(), type:'divider', color:'#2563eb' },
          { id:mk(), type:'spacer', height:40 },
          { id:mk(), type:'text', content:viewingRecord.content_type || '', align:'center' },
        ],
        chapter: () => [
          { id:mk(), type:'heading', level:1, content:viewingRecord.topic, align:'left' },
          { id:mk(), type:'text', content:viewingRecord.subject + '  \u2022  Class ' + viewingRecord.class, align:'left' },
          { id:mk(), type:'divider', color:'#2563eb' },
          { id:mk(), type:'heading', level:2, content:'Learning Objectives', align:'left' },
          { id:mk(), type:'text', content:'\u2022 Students will be able to...\n\u2022 Students will understand...\n\u2022 Students will demonstrate...', align:'left' },
          { id:mk(), type:'heading', level:2, content:'Introduction', align:'left' },
          { id:mk(), type:'text', content:'Enter introduction text here...', align:'left' },
          { id:mk(), type:'heading', level:2, content:'Key Concepts', align:'left' },
          { id:mk(), type:'text', content:'Enter key concepts here...', align:'left' },
          { id:mk(), type:'heading', level:2, content:'Summary', align:'left' },
          { id:mk(), type:'text', content:'Enter summary here...', align:'left' },
        ],
        lessonPlan: () => [
          { id:mk(), type:'heading', level:1, content:'Lesson Plan: ' + viewingRecord.topic, align:'left' },
          { id:mk(), type:'table', headers:['Subject','Class','Duration','Date'], rows:[[viewingRecord.subject,'Class '+viewingRecord.class,'45 minutes','']] },
          { id:mk(), type:'heading', level:2, content:'Learning Objectives', align:'left' },
          { id:mk(), type:'text', content:'1. \n2. \n3. ', align:'left' },
          { id:mk(), type:'heading', level:2, content:'Materials Required', align:'left' },
          { id:mk(), type:'text', content:'\u2022 \n\u2022 \n\u2022 ', align:'left' },
          { id:mk(), type:'heading', level:2, content:'Lesson Flow', align:'left' },
          { id:mk(), type:'table', headers:['Phase','Activity','Duration'], rows:[['Introduction','','5 min'],['Instruction','','20 min'],['Practice','','15 min'],['Closure','','5 min']] },
          { id:mk(), type:'heading', level:2, content:'Assessment', align:'left' },
          { id:mk(), type:'text', content:'Enter assessment details...', align:'left' },
        ],
        blank: () => [],
      };
      const result = templates[key] ? templates[key]() : [];
      if (result === null) return;
      setLayoutBlocks(result); setEditingBlockId(null); saveLayout(result);
    };

    const handlePrintLayout = () => {
      let html = '';
      for (const block of layoutBlocks) {
        if (block.type === 'heading') {
          const sz = {1:'26px',2:'20px',3:'16px'}, fw = {1:'700',2:'600',3:'600'}, mg = {1:'20px 0 10px 0',2:'16px 0 8px 0',3:'12px 0 6px 0'};
          html += '<h'+block.level+' style="font-size:'+sz[block.level]+';margin:'+mg[block.level]+';font-weight:'+fw[block.level]+';text-align:'+(block.align||'left')+';page-break-after:avoid;">'+(block.content||'')+'</h'+block.level+'>';
        } else if (block.type === 'text') {
          const lines = (block.content||'').split('\n');
          html += '<div style="text-align:'+(block.align||'left')+';margin:8px 0;">';
          lines.forEach(l => { if (!l.trim()) { html += '<div style="height:6px;"></div>'; return; } html += '<p style="margin:4px 0;line-height:1.7;font-size:13px;">' + l.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\*(.*?)\*/g,'<em>$1</em>') + '</p>'; });
          html += '</div>';
        } else if (block.type === 'image' && block.url) {
          const wmap = {full:'100%',half:'50%',quarter:'25%'};
          html += '<div style="text-align:'+(block.align||'center')+';margin:20px 0;page-break-inside:avoid;break-inside:avoid;">';
          html += '<img src="'+block.url+'" alt="'+(block.alt||'')+'" style="width:'+(wmap[block.width]||'100%')+';max-height:460px;object-fit:contain;border-radius:6px;border:1px solid #e5e7eb;page-break-inside:avoid;break-inside:avoid;" />';
          if (block.caption) html += '<p style="font-size:10px;color:#6b7280;margin-top:4px;font-style:italic;">'+block.caption+'</p>';
          html += '</div>';
        } else if (block.type === 'divider') {
          html += '<hr style="border:none;border-top:2px solid '+(block.color||'#e5e7eb')+';margin:16px 0;">';
        } else if (block.type === 'spacer') {
          html += '<div style="height:'+(block.height||20)+'px;"></div>';
        } else if (block.type === 'pagebreak') {
          html += '<div style="page-break-after:always;"></div>';
        } else if (block.type === 'table' && block.headers) {
          const cols = block.headers.length;
          html += '<table style="width:100%;border-collapse:collapse;margin:14px 0;page-break-inside:avoid;border:1px solid #d1d5db;">';
          html += '<thead><tr style="background:#1e293b;color:white;">';
          block.headers.forEach((h,ci) => { html += '<th style="padding:8px 12px;text-align:left;font-weight:600;font-size:11px;border-right:'+(ci<cols-1?'1px solid #334155':'none')+';padding:8px 12px;">'+(h||'')+'</th>'; });
          html += '</tr></thead><tbody>';
          (block.rows||[]).forEach((row,ri) => {
            html += '<tr style="background:'+(ri%2===0?'#fff':'#f8fafc')+';border-bottom:1px solid #e5e7eb;">';
            block.headers.forEach((_,ci) => { html += '<td style="padding:8px 12px;font-size:12px;border-right:'+(ci<cols-1?'1px solid #e5e7eb':'none')+';'+'">'+(row[ci]||'')+'</td>'; });
            html += '</tr>';
          });
          html += '</tbody></table>';
        }
      }
      const pw = window.open('', '_blank', 'width=900,height=700');
      if (!pw) { alert('Pop-up blocked.'); return; }
      pw.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>'+viewingRecord.topic+' — Layout</title>');
      pw.document.write('<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">');
      pw.document.write('<style>*{margin:0;padding:0;box-sizing:border-box;} body{font-family:Montserrat,Inter,sans-serif;color:#0f172a;padding:40px;max-width:794px;margin:0 auto;} '+IMG_EXPORT_CSS+' .no-print{display:flex;gap:8px;margin-bottom:20px;padding:12px;background:#f3f4f6;border-radius:8px;align-items:center;} @media print{.no-print{display:none!important;}}</style>');
      pw.document.write('</head><body>');
      pw.document.write('<div class="no-print"><button style="padding:8px 20px;background:#2563eb;color:white;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;" onclick="window.print()">Print (Ctrl+P)</button><button style="padding:8px 20px;background:#e5e7eb;color:#374151;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;" onclick="window.close()">Close</button><span style="margin-left:auto;font-size:11px;color:#6b7280;">'+viewingRecord.topic+'</span></div>');
      pw.document.write(html); pw.document.write('</body></html>'); pw.document.close();
    };

    const renderBlockPreview = (block) => {
      const styles = { heading: { 1:{fontSize:'26px',fontWeight:'700'}, 2:{fontSize:'20px',fontWeight:'600'}, 3:{fontSize:'16px',fontWeight:'600'} } };
      if (block.type === 'heading') return <div style={{ ...styles.heading[block.level]||styles.heading[2], color:COLORS.darkText, textAlign:block.align||'left', fontFamily:'Montserrat,sans-serif', paddingRight:'130px', minHeight:'24px' }}>{block.content || <span style={{ color:COLORS.lightText, fontStyle:'italic', fontWeight:'400', fontSize:'14px' }}>Empty heading — click to edit</span>}</div>;
      if (block.type === 'text') return <div style={{ fontSize:'13px', lineHeight:'1.7', color:COLORS.darkText, textAlign:block.align||'left', fontFamily:'Montserrat,sans-serif', whiteSpace:'pre-wrap', paddingRight:'130px', minHeight:'20px' }}>{block.content || <span style={{ color:COLORS.lightText, fontStyle:'italic' }}>Empty text — click to edit</span>}</div>;
      if (block.type === 'image') {
        const wmap = { full:'100%', half:'50%', quarter:'25%' };
        return block.url
          ? <div style={{ textAlign:block.align||'center' }}><img src={block.url} alt={block.alt||''} style={{ maxWidth:wmap[block.width]||'100%', maxHeight:'280px', objectFit:'contain', borderRadius:'6px', border:'1px solid '+COLORS.borderColor, display:'inline-block' }} />{block.caption && <p style={{ fontSize:'11px', color:COLORS.lightText, marginTop:'4px', fontStyle:'italic' }}>{block.caption}</p>}</div>
          : <div style={{ height:'80px', background:'#f3f4f6', borderRadius:'6px', border:'2px dashed '+COLORS.borderColor, display:'flex', alignItems:'center', justifyContent:'center', color:COLORS.lightText, fontSize:'12px', gap:'6px' }}><MI name="add_photo_alternate" size={18} /> No image — click Properties to add</div>;
      }
      if (block.type === 'divider') return <hr style={{ border:'none', borderTop:'2px solid '+(block.color||'#e5e7eb'), margin:'4px 0' }} />;
      if (block.type === 'spacer') return <div style={{ height:(block.height||20)+'px', background:'repeating-linear-gradient(45deg,transparent,transparent 4px,rgba(0,0,0,0.04) 4px,rgba(0,0,0,0.04) 8px)', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'3px' }}><span style={{ fontSize:'9px', color:COLORS.lightText }}>{block.height||20}px spacer</span></div>;
      if (block.type === 'pagebreak') return <div style={{ padding:'4px 0', textAlign:'center', position:'relative' }}><div style={{ borderTop:'2px dashed #94a3b8' }} /><span style={{ position:'absolute', top:'-8px', left:'50%', transform:'translateX(-50%)', background:'#e2e8f0', padding:'0 8px', fontSize:'9px', color:'#64748b', fontWeight:'700', borderRadius:'4px' }}>PAGE BREAK</span></div>;
      if (block.type === 'table') return (
        <div style={{ overflowX:'auto' }}><table style={{ width:'100%', borderCollapse:'collapse', fontSize:'12px' }}><thead><tr style={{ background:'#1e293b', color:'white' }}>{(block.headers||[]).map((h,i) => <th key={i} style={{ padding:'7px 10px', textAlign:'left', fontWeight:'600', fontSize:'11px' }}>{h||'Col '+(i+1)}</th>)}</tr></thead><tbody>{(block.rows||[]).map((row,ri) => <tr key={ri} style={{ background:ri%2===0?'#fff':'#f8fafc', borderBottom:'1px solid '+COLORS.borderColor }}>{(block.headers||[]).map((_,ci) => <td key={ci} style={{ padding:'7px 10px', fontSize:'12px' }}>{(row&&row[ci])||''}</td>)}</tr>)}</tbody></table></div>
      );
      return null;
    };

    const upd = (changes) => { if (selectedBlock) updateBlock(selectedBlock.id, changes); };
    const labelSt = { display:'block', fontSize:'10px', fontWeight:'700', color:COLORS.lightText, marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.5px' };
    const inputSt = { width:'100%', padding:'7px 9px', fontSize:'12px', border:'1px solid '+COLORS.borderColor, borderRadius:'6px', fontFamily:FONT_FAMILY, outline:'none', boxSizing:'border-box' };
    const AlignBtns = ({ val, onChange }) => (
      <div style={{ display:'flex', gap:'4px' }}>
        {['left','center','right'].map(a => <button key={a} onClick={() => onChange(a)} style={{ flex:1, padding:'5px', background:val===a?COLORS.navActive:COLORS.filterBg, color:val===a?'white':COLORS.darkText, border:'none', borderRadius:'4px', cursor:'pointer' }}><MI name={'format_align_'+a} size={14} /></button>)}
      </div>
    );

    const renderPropsPanel = () => {
      if (!selectedBlock) return <div style={{ padding:'24px 16px', textAlign:'center', color:COLORS.lightText }}><MI name="touch_app" size={28} style={{ display:'block', margin:'0 auto 10px auto', color:COLORS.borderColor }} /><p style={{ fontSize:'12px', margin:0, lineHeight:'1.5' }}>Click a block on the canvas to edit its properties</p></div>;
      const sec = { marginBottom:'14px' };
      return (
        <div style={{ padding:'12px' }}>
          <div style={{ marginBottom:'12px', padding:'7px 10px', background:'#e0e7ff', borderRadius:'6px' }}>
            <span style={{ fontSize:'11px', fontWeight:'700', color:'#3730a3', textTransform:'uppercase', letterSpacing:'0.5px' }}>{selectedBlock.type.toUpperCase()} BLOCK</span>
          </div>
          {selectedBlock.type === 'heading' && <>
            <div style={sec}><label style={labelSt}>Heading Text</label><textarea value={selectedBlock.content||''} onChange={e => upd({content:e.target.value})} rows={2} style={{ ...inputSt, resize:'vertical', fontFamily:'Montserrat,sans-serif', lineHeight:'1.5' }} /></div>
            <div style={sec}><label style={labelSt}>Level</label><div style={{ display:'flex', gap:'4px' }}>{[1,2,3].map(l => <button key={l} onClick={() => upd({level:l})} style={{ flex:1, padding:'6px', background:selectedBlock.level===l?COLORS.navActive:COLORS.filterBg, color:selectedBlock.level===l?'white':COLORS.darkText, border:'none', borderRadius:'4px', cursor:'pointer', fontSize:'12px', fontWeight:'700', fontFamily:FONT_FAMILY }}>H{l}</button>)}</div></div>
            <div style={sec}><label style={labelSt}>Alignment</label><AlignBtns val={selectedBlock.align||'left'} onChange={v => upd({align:v})} /></div>
          </>}
          {selectedBlock.type === 'text' && <>
            <div style={sec}><label style={labelSt}>Text Content</label><textarea value={selectedBlock.content||''} onChange={e => upd({content:e.target.value})} rows={7} placeholder="Supports **bold** and *italic*." style={{ ...inputSt, resize:'vertical', fontFamily:'Montserrat,sans-serif', lineHeight:'1.6' }} /></div>
            <div style={sec}><label style={labelSt}>Alignment</label><AlignBtns val={selectedBlock.align||'left'} onChange={v => upd({align:v})} /></div>
          </>}
          {selectedBlock.type === 'image' && <>
            <div style={sec}><label style={labelSt}>Image URL</label><input value={selectedBlock.url||''} onChange={e => upd({url:e.target.value})} placeholder="Paste URL or select below" style={inputSt} /></div>
            {allImages.length > 0 && <div style={sec}><label style={labelSt}>Visual Assets</label><div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px' }}>{allImages.map(img => <img key={img.id} src={img.image_url} onClick={() => upd({url:img.image_url, alt:img.type})} style={{ width:'100%', height:'56px', objectFit:'cover', borderRadius:'4px', cursor:'pointer', border:selectedBlock.url===img.image_url?'2px solid '+COLORS.navActive:'1px solid '+COLORS.borderColor }} />)}</div></div>}
            <div style={sec}><label style={labelSt}>Width</label><div style={{ display:'flex', gap:'4px' }}>{[['full','100%'],['half','50%'],['quarter','25%']].map(([k,l]) => <button key={k} onClick={() => upd({width:k})} style={{ flex:1, padding:'5px', background:selectedBlock.width===k?COLORS.navActive:COLORS.filterBg, color:selectedBlock.width===k?'white':COLORS.darkText, border:'none', borderRadius:'4px', cursor:'pointer', fontSize:'10px', fontFamily:FONT_FAMILY }}>{l}</button>)}</div></div>
            <div style={sec}><label style={labelSt}>Caption</label><input value={selectedBlock.caption||''} onChange={e => upd({caption:e.target.value})} placeholder="Optional caption" style={inputSt} /></div>
            <div style={sec}><label style={labelSt}>Alignment</label><AlignBtns val={selectedBlock.align||'center'} onChange={v => upd({align:v})} /></div>
          </>}
          {selectedBlock.type === 'divider' && <div style={sec}><label style={labelSt}>Line Color</label><input type="color" value={selectedBlock.color||'#e5e7eb'} onChange={e => upd({color:e.target.value})} style={{ width:'100%', height:'36px', padding:'2px', border:'1px solid '+COLORS.borderColor, borderRadius:'6px', cursor:'pointer' }} /></div>}
          {selectedBlock.type === 'spacer' && <div style={sec}><label style={labelSt}>Height (px)</label><input type="number" value={selectedBlock.height||20} onChange={e => upd({height:parseInt(e.target.value)||20})} min="8" max="300" style={inputSt} /></div>}
          {selectedBlock.type === 'table' && <>
            <div style={sec}><label style={labelSt}>Column Headers</label>{(selectedBlock.headers||[]).map((h,ci) => <input key={ci} value={h} onChange={e => { const hdrs = selectedBlock.headers.slice(); hdrs[ci] = e.target.value; upd({headers:hdrs}); }} style={{ ...inputSt, marginBottom:'4px' }} placeholder={'Column '+(ci+1)} />)}</div>
            <div style={sec}><label style={labelSt}>Rows ({(selectedBlock.rows||[]).length})</label>
              {(selectedBlock.rows||[]).map((row,ri) => <div key={ri} style={{ display:'flex', gap:'3px', marginBottom:'4px', alignItems:'center' }}>
                {(selectedBlock.headers||[]).map((_,ci) => <input key={ci} value={(row&&row[ci])||''} onChange={e => { const rows = selectedBlock.rows.map((r,ridx) => ridx===ri ? r.map((c,cidx) => cidx===ci ? e.target.value : c) : r); upd({rows}); }} style={{ flex:1, padding:'4px 6px', fontSize:'10px', border:'1px solid '+COLORS.borderColor, borderRadius:'4px', fontFamily:FONT_FAMILY, outline:'none', minWidth:0 }} />)}
                <button onClick={() => upd({rows:selectedBlock.rows.filter((_,i) => i!==ri)})} style={{ padding:'4px 7px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'4px', cursor:'pointer', color:'#ef4444', flexShrink:0 }}>×</button>
              </div>)}
              <button onClick={() => upd({rows:[...(selectedBlock.rows||[]), new Array((selectedBlock.headers||[]).length).fill('')]})} style={{ width:'100%', padding:'6px', background:COLORS.filterBg, border:'1px dashed '+COLORS.borderColor, borderRadius:'4px', cursor:'pointer', fontSize:'11px', color:COLORS.navActive, fontFamily:FONT_FAMILY, fontWeight:'600', marginTop:'4px' }}>+ Add Row</button>
            </div>
          </>}
          <button onClick={() => deleteBlock(selectedBlock.id)} style={{ width:'100%', padding:'8px', background:'#fef2f2', color:'#ef4444', border:'1px solid #fecaca', borderRadius:'6px', cursor:'pointer', fontSize:'11px', fontWeight:'600', fontFamily:FONT_FAMILY, display:'flex', alignItems:'center', justifyContent:'center', gap:'4px', marginTop:'4px' }}>
            <MI name="delete" size={13} /> Delete Block
          </button>
        </div>
      );
    };

    const BLOCK_TYPES = [
      { type:'heading', icon:'title', label:'Heading', color:'#1e293b' },
      { type:'text', icon:'notes', label:'Text', color:'#374151' },
      { type:'image', icon:'image', label:'Image', color:'#2563eb' },
      { type:'divider', icon:'horizontal_rule', label:'Divider', color:'#6b7280' },
      { type:'table', icon:'table_chart', label:'Table', color:'#059669' },
      { type:'spacer', icon:'space_bar', label:'Spacer', color:'#9ca3af' },
      { type:'pagebreak', icon:'insert_page_break', label:'Page Break', color:'#ef4444' },
    ];
    const TEMPLATES = [
      { key:'fromContent', label:'Import AI Content', icon:'auto_fix_high', color:COLORS.navActive },
      { key:'titlePage', label:'Title Page', icon:'article', color:'#7c3aed' },
      { key:'chapter', label:'Chapter Layout', icon:'menu_book', color:'#059669' },
      { key:'lessonPlan', label:'Lesson Plan', icon:'assignment', color:'#f59e0b' },
      { key:'blank', label:'Blank Canvas', icon:'crop_square', color:'#9ca3af' },
    ];

    return (
      <div style={{ display:'flex', height:'100%', fontFamily:FONT_FAMILY }}>
        <div style={{ width:'196px', borderRight:'1px solid '+COLORS.borderColor, background:'#f8fafc', display:'flex', flexDirection:'column', flexShrink:0, overflowY:'auto' }}>
          <div style={{ padding:'11px 14px', borderBottom:'1px solid '+COLORS.borderColor, background:COLORS.white }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:'12px', fontWeight:'700', color:COLORS.darkText, display:'flex', alignItems:'center', gap:'5px' }}><MI name="dashboard_customize" size={15} color="#059669" /> Layout Builder</span>
              {layoutSaved && <span style={{ fontSize:'10px', color:COLORS.successText, fontWeight:'700' }}>✓ Saved</span>}
            </div>
            <p style={{ margin:'3px 0 0 0', fontSize:'10px', color:COLORS.lightText }}>{layoutBlocks.length} block{layoutBlocks.length!==1?'s':''} • auto-saved</p>
          </div>
          <div style={{ padding:'10px 12px', borderBottom:'1px solid '+COLORS.borderColor }}>
            <p style={{ margin:'0 0 7px 0', fontSize:'10px', fontWeight:'700', color:COLORS.lightText, textTransform:'uppercase', letterSpacing:'0.5px' }}>Add Block</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px' }}>
              {BLOCK_TYPES.map(bt => <button key={bt.type} onClick={() => addBlock(bt.type)} style={{ padding:'7px 4px', background:COLORS.white, border:'1px solid '+COLORS.borderColor, borderRadius:'6px', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', fontFamily:FONT_FAMILY }} onMouseEnter={e => { e.currentTarget.style.background='#f0f9ff'; e.currentTarget.style.borderColor='#2563eb'; }} onMouseLeave={e => { e.currentTarget.style.background=COLORS.white; e.currentTarget.style.borderColor=COLORS.borderColor; }} title={'Add '+bt.label}><MI name={bt.icon} size={16} color={bt.color} /><span style={{ fontSize:'9px', fontWeight:'600', color:COLORS.darkText }}>{bt.label}</span></button>)}
            </div>
          </div>
          <div style={{ padding:'10px 12px', flex:1 }}>
            <p style={{ margin:'0 0 7px 0', fontSize:'10px', fontWeight:'700', color:COLORS.lightText, textTransform:'uppercase', letterSpacing:'0.5px' }}>Templates</p>
            <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
              {TEMPLATES.map(t => <button key={t.key} onClick={() => applyTemplate(t.key)} style={{ padding:'7px 10px', background:COLORS.white, border:'1px solid '+COLORS.borderColor, borderRadius:'6px', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px', fontFamily:FONT_FAMILY, textAlign:'left', width:'100%' }} onMouseEnter={e => { e.currentTarget.style.background='#f0f9ff'; e.currentTarget.style.borderColor=t.color; }} onMouseLeave={e => { e.currentTarget.style.background=COLORS.white; e.currentTarget.style.borderColor=COLORS.borderColor; }}><MI name={t.icon} size={13} color={t.color} /><span style={{ fontSize:'10px', fontWeight:'600', color:COLORS.darkText }}>{t.label}</span></button>)}
            </div>
          </div>
          <div style={{ padding:'10px 12px', borderTop:'1px solid '+COLORS.borderColor }}>
            <button onClick={handlePrintLayout} disabled={!layoutBlocks.length} style={{ width:'100%', padding:'8px', background:layoutBlocks.length?'#059669':COLORS.filterBg, color:layoutBlocks.length?'white':COLORS.lightText, border:'none', borderRadius:'6px', cursor:layoutBlocks.length?'pointer':'not-allowed', fontSize:'11px', fontWeight:'600', fontFamily:FONT_FAMILY, display:'flex', alignItems:'center', justifyContent:'center', gap:'5px', marginBottom:'5px' }}>
              <MI name="print" size={13} color={layoutBlocks.length?'white':COLORS.lightText} /> Print / Export PDF
            </button>
            {layoutBlocks.length > 0 && <button onClick={() => { if (window.confirm('Clear all layout blocks?')) { setLayoutBlocks([]); setEditingBlockId(null); saveLayout([]); } }} style={{ width:'100%', padding:'6px', background:'#fef2f2', color:'#ef4444', border:'1px solid #fecaca', borderRadius:'6px', cursor:'pointer', fontSize:'10px', fontWeight:'600', fontFamily:FONT_FAMILY }}>Clear All</button>}
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto', background:'#cbd5e1', padding:'24px 20px', display:'flex', flexDirection:'column', alignItems:'center' }}>
          {layoutBlocks.length === 0 ? (
            <div style={{ width:'100%', maxWidth:'794px', minHeight:'400px', background:COLORS.white, borderRadius:'8px', border:'2px dashed '+COLORS.borderColor, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'48px 32px', boxShadow:'0 4px 20px rgba(0,0,0,0.08)', textAlign:'center' }}>
              <MI name="layers" size={44} color={COLORS.borderColor} />
              <h3 style={{ margin:'16px 0 8px 0', fontSize:'17px', fontWeight:'600', color:COLORS.darkText }}>Build Your Page Layout</h3>
              <p style={{ margin:'0 0 24px 0', fontSize:'13px', color:COLORS.lightText, maxWidth:'320px', lineHeight:'1.6' }}>Add blocks from the left, or start with a template. Layouts auto-save per record.</p>
              <div style={{ display:'flex', gap:'10px', flexWrap:'wrap', justifyContent:'center' }}>
                <button onClick={() => applyTemplate('fromContent')} style={{ padding:'9px 18px', background:COLORS.navActive, color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'12px', fontWeight:'600', fontFamily:FONT_FAMILY, display:'flex', alignItems:'center', gap:'5px' }}><MI name="auto_fix_high" size={15} color="white" /> Import AI Content</button>
                <button onClick={() => applyTemplate('chapter')} style={{ padding:'9px 18px', background:'#059669', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'12px', fontWeight:'600', fontFamily:FONT_FAMILY, display:'flex', alignItems:'center', gap:'5px' }}><MI name="menu_book" size={15} color="white" /> Chapter Template</button>
                <button onClick={() => applyTemplate('lessonPlan')} style={{ padding:'9px 18px', background:'#f59e0b', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'12px', fontWeight:'600', fontFamily:FONT_FAMILY, display:'flex', alignItems:'center', gap:'5px' }}><MI name="assignment" size={15} color="white" /> Lesson Plan</button>
              </div>
            </div>
          ) : (
            <div style={{ width:'794px', minHeight:'1123px', background:COLORS.white, borderRadius:'3px', boxShadow:'0 8px 32px rgba(0,0,0,0.18)', padding:'64px 72px', position:'relative' }}>
              <div style={{ position:'absolute', top:'10px', right:'16px', fontSize:'9px', color:'#94a3b8', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.5px' }}>A4 • {viewingRecord.topic}</div>
              <div style={{ position:'relative', paddingLeft:'20px' }}>
                {layoutBlocks.map((block, idx) => {
                  const isSel = editingBlockId === block.id;
                  const isDragOver = dragOverIdx === idx;
                  const isDragging = draggedBlockIdx === idx;
                  return (
                    <div key={block.id} draggable onDragStart={e => handleDragStart(e,idx)} onDragOver={e => handleDragOver(e,idx)} onDrop={e => handleDrop(e,idx)} onDragEnd={handleDragEnd}
                      onClick={() => setEditingBlockId(isSel ? null : block.id)}
                      style={{ position:'relative', padding:'8px 10px', marginBottom:'2px', borderRadius:'6px', border: isSel?'2px solid '+COLORS.navActive:isDragOver?'2px dashed '+COLORS.navActive:'2px solid transparent', background: isSel?'#f0f9ff':'transparent', cursor:'pointer', opacity:isDragging?0.4:1, transition:'border-color 0.15s,background 0.15s' }}>
                      <div style={{ position:'absolute', left:'-16px', top:'50%', transform:'translateY(-50%)', cursor:'grab', opacity:0.25, fontSize:'14px', userSelect:'none' }}>⠿</div>
                      {isSel && <div style={{ position:'absolute', right:'6px', top:'6px', display:'flex', gap:'3px', zIndex:10 }}>
                        <button onClick={e => { e.stopPropagation(); moveBlock(idx,-1); }} style={{ padding:'3px 6px', background:COLORS.filterBg, border:'1px solid '+COLORS.borderColor, borderRadius:'4px', cursor:'pointer', fontSize:'11px' }}>↑</button>
                        <button onClick={e => { e.stopPropagation(); moveBlock(idx,1); }} style={{ padding:'3px 6px', background:COLORS.filterBg, border:'1px solid '+COLORS.borderColor, borderRadius:'4px', cursor:'pointer', fontSize:'11px' }}>↓</button>
                        <button onClick={e => { e.stopPropagation(); duplicateBlock(block.id); }} style={{ padding:'3px 6px', background:COLORS.filterBg, border:'1px solid '+COLORS.borderColor, borderRadius:'4px', cursor:'pointer', fontSize:'11px' }}>⧉</button>
                        <button onClick={e => { e.stopPropagation(); deleteBlock(block.id); }} style={{ padding:'3px 6px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'4px', cursor:'pointer', fontSize:'11px', color:'#ef4444' }}>×</button>
                      </div>}
                      {renderBlockPreview(block)}
                    </div>
                  );
                })}
                <div onDragOver={e => { e.preventDefault(); setDragOverIdx(layoutBlocks.length); }} onDrop={e => handleDrop(e, layoutBlocks.length)} style={{ height:'40px', marginTop:'12px', border:'2px dashed '+(dragOverIdx===layoutBlocks.length?COLORS.navActive:'transparent'), borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {dragOverIdx === layoutBlocks.length && <span style={{ fontSize:'11px', color:COLORS.navActive, fontWeight:'600' }}>Drop here</span>}
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ width:'220px', borderLeft:'1px solid '+COLORS.borderColor, background:'#f8fafc', flexShrink:0, overflowY:'auto' }}>
          <div style={{ padding:'11px 14px', borderBottom:'1px solid '+COLORS.borderColor, background:COLORS.white }}>
            <span style={{ fontSize:'12px', fontWeight:'700', color:COLORS.darkText }}>Properties</span>
          </div>
          {renderPropsPanel()}
        </div>
      </div>
    );
  };

  // ====================================================================
  // ===== CONTENT TAB =====
  // ====================================================================
  const tbBtn = (active) => ({ padding:'5px 8px', background:active?'#e0e7ff':'transparent', color:COLORS.darkText, border:'none', borderRadius:'4px', cursor:'pointer', fontSize:'13px', fontWeight:active?'700':'500', fontFamily:FONT_FAMILY, display:'flex', alignItems:'center', justifyContent:'center', minWidth:'28px', height:'28px' });
  const noFocus = (e) => e.preventDefault();
  const tbSep = () => <div style={{ width:'1px', height:'20px', background:COLORS.borderColor, margin:'0 4px' }} />;

  const renderContentTab = () => {
    if (!viewingRecord) return null;
    const allPrompts = getVisualPrompts(viewingRecord);
    const allImages = allPrompts.filter(p => p.image_url);
    return (
      <div style={{ display:'flex', height:'100%' }}>
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <div style={{ padding:'10px 24px', borderBottom:'1px solid '+COLORS.borderColor, display:'flex', justifyContent:'space-between', alignItems:'center', background:'#fafafa' }}>
            <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
              {isEditing ? (<>
                <button onClick={handleSaveContent} disabled={savingContent} style={{ padding:'6px 14px', background:COLORS.navActive, color:'white', border:'none', borderRadius:'6px', fontSize:'12px', fontWeight:'600', cursor:savingContent?'not-allowed':'pointer', fontFamily:FONT_FAMILY, display:'flex', alignItems:'center', gap:'4px' }}><MI name={savingContent?'hourglass_empty':'save'} size={14} color="white" /> {savingContent?'Saving...':'Save'}</button>
                <button onClick={handleCancelEditing} style={{ padding:'6px 14px', background:COLORS.filterBg, color:COLORS.darkText, border:'none', borderRadius:'6px', fontSize:'12px', fontWeight:'500', cursor:'pointer', fontFamily:FONT_FAMILY, display:'flex', alignItems:'center', gap:'4px' }}><MI name="close" size={14} /> Cancel</button>
                {allPrompts.length > 0 && <button onClick={() => setShowAssetPicker(!showAssetPicker)} style={{ padding:'6px 14px', background:showAssetPicker?'#8b5cf6':COLORS.filterBg, color:showAssetPicker?'white':COLORS.darkText, border:'none', borderRadius:'6px', fontSize:'12px', fontWeight:'500', cursor:'pointer', fontFamily:FONT_FAMILY, display:'flex', alignItems:'center', gap:'4px' }}><MI name="add_photo_alternate" size={14} /> {showAssetPicker?'Hide':'Insert'} Images ({allImages.length}/{allPrompts.length})</button>}
              </>) : (
                <button onClick={handleStartEditing} style={{ padding:'6px 14px', background:COLORS.navActive, color:'white', border:'none', borderRadius:'6px', fontSize:'12px', fontWeight:'600', cursor:'pointer', fontFamily:FONT_FAMILY, display:'flex', alignItems:'center', gap:'4px' }}><MI name="edit" size={14} color="white" /> Edit Content</button>
              )}
            </div>
            <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
              <div style={{ display:'flex', background:COLORS.filterBg, borderRadius:'6px', padding:'2px' }}>
                {['markdown','normal'].map(m => <button key={m} onClick={() => setViewMode(m)} style={{ padding:'4px 10px', borderRadius:'4px', border:'none', fontSize:'11px', fontWeight:'500', cursor:'pointer', fontFamily:FONT_FAMILY, background:viewMode===m?COLORS.white:'transparent', color:viewMode===m?COLORS.navActive:COLORS.lightText, boxShadow:viewMode===m?'0 1px 3px rgba(0,0,0,0.1)':'none' }}>{m==='markdown'?'Markdown':'Normal Text'}</button>)}
              </div>
              <span style={{ fontSize:'11px', color:COLORS.lightText }}>{viewingRecord.word_count||0} words</span>
            </div>
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleLocalImageUpload} />

          {isEditing && (
            <div style={{ padding:'4px 12px', borderBottom:'1px solid '+COLORS.borderColor, display:'flex', flexWrap:'wrap', gap:'1px', alignItems:'center', background:'#fafbfc' }}>
              <button onMouseDown={noFocus} onClick={handleUndo} style={tbBtn(false)} title="Undo"><MI name="undo" size={16} /></button>
              <button onMouseDown={noFocus} onClick={handleRedo} style={tbBtn(false)} title="Redo"><MI name="redo" size={16} /></button>
              {tbSep()}
              <select value={editorFont} onChange={e => applyFontWrap(e.target.value)} style={{ padding:'3px 4px', fontSize:'11px', border:'1px solid '+COLORS.borderColor, borderRadius:'4px', fontFamily:FONT_FAMILY, maxWidth:'120px', height:'28px' }} title="Font Family">
                {GOOGLE_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <select value={editorFontSize} onChange={e => applyFontSizeWrap(e.target.value)} style={{ padding:'3px 2px', fontSize:'11px', border:'1px solid '+COLORS.borderColor, borderRadius:'4px', fontFamily:FONT_FAMILY, width:'48px', height:'28px' }} title="Font Size">
                {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {tbSep()}
              <button onMouseDown={noFocus} onClick={() => applyHeading(1)} style={{ ...tbBtn(false), fontSize:'12px', fontWeight:'700' }} title="H1">H1</button>
              <button onMouseDown={noFocus} onClick={() => applyHeading(2)} style={{ ...tbBtn(false), fontSize:'11px', fontWeight:'700' }} title="H2">H2</button>
              <button onMouseDown={noFocus} onClick={() => applyHeading(3)} style={{ ...tbBtn(false), fontSize:'10px', fontWeight:'700' }} title="H3">H3</button>
              {tbSep()}
              <button onMouseDown={noFocus} onClick={applyBold} style={tbBtn(false)} title="Bold"><MI name="format_bold" size={17} /></button>
              <button onMouseDown={noFocus} onClick={applyItalic} style={tbBtn(false)} title="Italic"><MI name="format_italic" size={17} /></button>
              <button onMouseDown={noFocus} onClick={applyUnderline} style={tbBtn(false)} title="Underline"><MI name="format_underlined" size={17} /></button>
              <button onMouseDown={noFocus} onClick={applyStrikethrough} style={tbBtn(false)} title="Strikethrough"><MI name="format_strikethrough" size={17} /></button>
              <button onMouseDown={noFocus} onClick={applyHighlight} style={tbBtn(false)} title="Highlight"><MI name="highlight" size={17} /></button>
              <button onMouseDown={noFocus} onClick={applySuperscript} style={tbBtn(false)} title="Superscript"><MI name="superscript" size={16} /></button>
              <button onMouseDown={noFocus} onClick={applySubscript} style={tbBtn(false)} title="Subscript"><MI name="subscript" size={16} /></button>
              {tbSep()}
              <button onMouseDown={noFocus} onClick={applyCode} style={tbBtn(false)} title="Code"><MI name="code" size={17} /></button>
              <button onMouseDown={noFocus} onClick={insertCodeBlock} style={tbBtn(false)} title="Code Block"><MI name="data_object" size={17} /></button>
              <button onMouseDown={noFocus} onClick={insertBulletList} style={tbBtn(false)} title="Bullet List"><MI name="format_list_bulleted" size={17} /></button>
              <button onMouseDown={noFocus} onClick={insertNumberedList} style={tbBtn(false)} title="Numbered List"><MI name="format_list_numbered" size={17} /></button>
              <button onMouseDown={noFocus} onClick={insertBlockquote} style={tbBtn(false)} title="Blockquote"><MI name="format_quote" size={17} /></button>
              <button onMouseDown={noFocus} onClick={insertHR} style={tbBtn(false)} title="Horizontal Rule"><MI name="horizontal_rule" size={17} /></button>
              {tbSep()}
              <button onMouseDown={noFocus} onClick={insertLink} style={tbBtn(false)} title="Link"><MI name="link" size={17} /></button>
              <button onMouseDown={noFocus} onClick={insertTable} style={tbBtn(false)} title="Table"><MI name="table_chart" size={17} /></button>
              <button onMouseDown={noFocus} onClick={clearFormatting} style={tbBtn(false)} title="Clear Format"><MI name="format_clear" size={17} /></button>
              {tbSep()}
              <button onMouseDown={noFocus} onClick={() => fileInputRef.current?.click()} style={{ ...tbBtn(false), color:uploadingImage?COLORS.navActive:COLORS.lightText }} title="Upload Image"><MI name={uploadingImage?'hourglass_empty':'upload_file'} size={17} /></button>
              {allPrompts.length > 0 && <button onMouseDown={noFocus} onClick={() => setShowAssetPicker(!showAssetPicker)} style={{ ...tbBtn(showAssetPicker), color:showAssetPicker?'#7c3aed':COLORS.lightText }} title="Insert from Assets"><MI name="add_photo_alternate" size={17} /></button>}
              {tbSep()}
              <button onMouseDown={noFocus} onClick={handlePrintPreview} style={tbBtn(false)} title="Print Preview"><MI name="print" size={17} /></button>
            </div>
          )}

          <div style={{ flex:1, overflowY:'auto', display:'flex' }}>
            <div style={{ flex:1, overflowY:'auto' }}>
              {viewingRecord.ai_output ? (
                isEditing ? (
                  <textarea ref={contentEditorRef} value={editContent} onChange={handleEditorChange} onSelect={trackSelection} onKeyUp={trackSelection} onClick={trackSelection}
                    style={{ width:'100%', height:'100%', minHeight:'500px', padding:'20px 24px', fontSize:editorFontSize+'px', lineHeight:'1.8', fontFamily:editorFont+',sans-serif', border:'none', borderRight:showAssetPicker?'1px solid '+COLORS.borderColor:'none', resize:'none', outline:'none', color:COLORS.darkText, background:COLORS.white }}
                    placeholder="Start typing..." />
                ) : viewMode === 'markdown' ? (
                  <div style={{ padding:'24px 32px', fontSize:'14px', lineHeight:'1.8', color:COLORS.darkText, fontFamily:'Montserrat,sans-serif', maxWidth:'850px' }}>
                    {parseMarkdownToReact(viewingRecord.ai_output)}
                  </div>
                ) : (
                  <div style={{ padding:'24px 32px', maxWidth:'850px' }}>
                    {viewingRecord.ai_output.split('\n').map((line, idx) => {
                      const imgM = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
                      if (imgM) return <div key={idx} style={{ margin:'12px 0', textAlign:'center' }}><img src={imgM[2]} alt={imgM[1]} style={{ maxWidth:'100%', maxHeight:'400px', borderRadius:'6px', border:'1px solid '+COLORS.borderColor, cursor:'pointer' }} onClick={() => setLightboxImage(imgM[2])} />{imgM[1] && <p style={{ fontSize:'11px', color:COLORS.lightText, marginTop:'4px', fontStyle:'italic' }}>{imgM[1]}</p>}</div>;
                      if (!line.trim()) return <div key={idx} style={{ height:'10px' }} />;
                      const clean = line.replace(/^#{1,6}\s*/,'').replace(/\*\*(.*?)\*\*/g,'$1').replace(/\*(.*?)\*/g,'$1').replace(/~~(.*?)~~/g,'$1').replace(/`(.*?)`/g,'$1').replace(/<[^>]+>/g,'').replace(/^[-*]\s+/,'• ').replace(/^>\s*/,'');
                      return <p key={idx} style={{ margin:'4px 0', lineHeight:'1.7', fontSize:'14px', color:COLORS.darkText, fontFamily:'Inter,sans-serif' }}>{clean}</p>;
                    })}
                  </div>
                )
              ) : (
                <div style={{ textAlign:'center', color:COLORS.lightText, padding:'60px 20px', fontSize:'16px' }}>No content generated yet. Waiting for Claude AI.</div>
              )}
            </div>
            {isEditing && showAssetPicker && allPrompts.length > 0 && (
              <div style={{ width:'220px', borderLeft:'1px solid '+COLORS.borderColor, background:'#fafafa', overflowY:'auto', flexShrink:0 }}>
                <div style={{ padding:'12px', borderBottom:'1px solid '+COLORS.borderColor }}>
                  <h4 style={{ margin:0, fontSize:'12px', fontWeight:'600', color:COLORS.darkText }}>Visual Assets</h4>
                  <p style={{ margin:'4px 0 0 0', fontSize:'10px', color:COLORS.lightText }}>Click images to insert at cursor</p>
                </div>
                <div style={{ padding:'8px' }}>
                  {allPrompts.map(p => (
                    <div key={p.id} onClick={() => p.image_url && handleInsertImageAtCursor(p.image_url, p.type+' - '+(p.prompt||'').substring(0,25))}
                      style={{ marginBottom:'8px', borderRadius:'8px', overflow:'hidden', border:'1px solid '+COLORS.borderColor, cursor:p.image_url?'pointer':'default', background:COLORS.white, opacity:p.image_url?1:0.6 }}
                      onMouseEnter={e => { if (p.image_url) { e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.12)'; e.currentTarget.style.transform='translateY(-1px)'; } }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow='none'; e.currentTarget.style.transform='none'; }}>
                      {p.image_url ? <img src={p.image_url} alt={p.type} style={{ width:'100%', height:'120px', objectFit:'cover', display:'block' }} /> : <div style={{ width:'100%', height:'80px', display:'flex', alignItems:'center', justifyContent:'center', background:p.type==='character'?'#faf5ff':'#eff6ff', color:COLORS.lightText, fontSize:'11px' }}>Not generated yet</div>}
                      <div style={{ padding:'6px 8px' }}>
                        <div style={{ fontSize:'9px', fontWeight:'600', textTransform:'uppercase', color:p.type==='character'?'#7c3aed':'#2563eb', marginBottom:'2px' }}>{p.type} {p.image_url?'✓':'○'}</div>
                        <div style={{ fontSize:'10px', color:COLORS.lightText, lineHeight:'1.3', overflow:'hidden', maxHeight:'26px' }}>{(p.prompt||'').substring(0,50)}</div>
                        {p.image_url && <div style={{ marginTop:'4px', fontSize:'9px', fontWeight:'600', color:'#2563eb' }}>Click to insert</div>}
                      </div>
                    </div>
                  ))}
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
        <button onClick={() => setShowPageSettings(!showPageSettings)} style={{ position:'fixed', bottom:'20px', right:'20px', width:'48px', height:'48px', background:COLORS.navActive, color:COLORS.white, border:'none', borderRadius:'50%', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(0,0,0,0.15)', zIndex:998 }} title="PDF Page Settings"><MI name="settings" size={20} color="white" /></button>
        {showPageSettings && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999 }} onClick={() => setShowPageSettings(false)}>
            <div style={{ background:COLORS.white, borderRadius:'12px', padding:'24px', width:'100%', maxWidth:'400px', boxShadow:'0 20px 40px rgba(0,0,0,0.2)', fontFamily:FONT_FAMILY, maxHeight:'90vh', overflowY:'auto' }} onClick={e => e.stopPropagation()}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
                <h2 style={{ margin:0, fontSize:'18px', fontWeight:'600' }}>PDF Settings</h2>
                <button onClick={() => setShowPageSettings(false)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'20px' }}>✕</button>
              </div>
              <div style={{ marginBottom:'16px' }}>
                <label style={{ display:'block', fontSize:'11px', fontWeight:'500', marginBottom:'4px', textTransform:'uppercase' }}>Paper Size</label>
                <select value={pageSettings.paperSize} onChange={e => { const s=e.target.value; if (s!=='Custom') { const d=PAPER_SIZES[s]; setPageSettings({...pageSettings,paperSize:s,customWidth:d.width,customHeight:d.height}); } else setPageSettings({...pageSettings,paperSize:'Custom'}); }} style={{ width:'100%', padding:'8px', border:'1px solid '+COLORS.borderColor, borderRadius:'4px', fontSize:'12px', fontFamily:FONT_FAMILY }}>
                  {Object.keys(PAPER_SIZES).map(s => <option key={s} value={s}>{PAPER_SIZES[s].label}</option>)}
                  <option value="Custom">Custom Size</option>
                </select>
              </div>
              <div style={{ marginBottom:'16px' }}>
                <label style={{ display:'block', fontSize:'11px', fontWeight:'500', marginBottom:'4px', textTransform:'uppercase' }}>Orientation</label>
                <div style={{ display:'flex', gap:'8px' }}>
                  {['portrait','landscape'].map(o => <button key={o} onClick={() => setPageSettings({...pageSettings,orientation:o})} style={{ flex:1, padding:'8px', background:pageSettings.orientation===o?COLORS.navActive:COLORS.filterBg, color:pageSettings.orientation===o?COLORS.white:COLORS.darkText, border:'none', borderRadius:'4px', cursor:'pointer', fontSize:'12px', fontWeight:'500', fontFamily:FONT_FAMILY }}>{o.charAt(0).toUpperCase()+o.slice(1)}</button>)}
                </div>
              </div>
              {pageSettings.paperSize === 'Custom' && (
                <div style={{ marginBottom:'16px', background:COLORS.filterBg, padding:'10px', borderRadius:'4px' }}>
                  {['Width','Height'].map(dim => <div key={dim}><label style={{ display:'block', fontSize:'11px', fontWeight:'500', marginBottom:'4px' }}>{dim} (mm)</label><input type="number" value={dim==='Width'?pageSettings.customWidth:pageSettings.customHeight} onChange={e => setPageSettings({...pageSettings,[dim==='Width'?'customWidth':'customHeight']:parseInt(e.target.value)||210})} style={{ width:'100%', padding:'6px', border:'1px solid '+COLORS.borderColor, borderRadius:'4px', fontSize:'12px', marginBottom:'8px', fontFamily:FONT_FAMILY }} min="50" max="1000" /></div>)}
                </div>
              )}
              <div style={{ marginBottom:'16px' }}>
                <label style={{ display:'block', fontSize:'11px', fontWeight:'500', marginBottom:'4px', textTransform:'uppercase' }}>Margins (mm)</label>
                <input type="number" value={pageSettings.margins} onChange={e => setPageSettings({...pageSettings,margins:parseInt(e.target.value)||10})} style={{ width:'100%', padding:'8px', border:'1px solid '+COLORS.borderColor, borderRadius:'4px', fontSize:'12px', fontFamily:FONT_FAMILY }} min="0" max="50" />
              </div>
              <div style={{ borderTop:'1px solid '+COLORS.borderColor, paddingTop:'16px' }}>
                <div style={{ background:COLORS.lightBg, padding:'12px', borderRadius:'4px', fontSize:'11px', color:COLORS.lightText }}>
                  <strong>Current:</strong> {dimensions.width} × {dimensions.height} mm • {pageSettings.orientation} • Margins: {pageSettings.margins}mm
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  // ===== AUTH PAGES =====
  if (authPage === 'login') return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh', background:'#f5f6f8', fontFamily:FONT_FAMILY }}>
      <div style={{ width:'100%', maxWidth:'400px', padding:'20px' }}>
        <h1 style={{ textAlign:'center', marginBottom:'30px', color:COLORS.darkText }}>AI Content Studio</h1>
        <form onSubmit={handleLogin} style={{ background:COLORS.white, padding:'24px', borderRadius:'8px', border:'1px solid '+COLORS.borderColor }}>
          <div style={{ marginBottom:'16px' }}><label style={{ display:'block', marginBottom:'8px', fontSize:'14px', fontWeight:'500' }}>Email</label><input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} style={{ width:'100%', padding:'10px', border:'1px solid '+COLORS.borderColor, borderRadius:'6px', fontSize:'14px', fontFamily:FONT_FAMILY }} required /></div>
          <div style={{ marginBottom:'16px' }}><label style={{ display:'block', marginBottom:'8px', fontSize:'14px', fontWeight:'500' }}>Password</label><input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} style={{ width:'100%', padding:'10px', border:'1px solid '+COLORS.borderColor, borderRadius:'6px', fontSize:'14px', fontFamily:FONT_FAMILY }} required /></div>
          {loginError && <div style={{ background:COLORS.errorBg, border:'1px solid '+COLORS.errorBorder, color:COLORS.errorText, padding:'12px', borderRadius:'6px', marginBottom:'16px', fontSize:'13px' }}>{loginError}</div>}
          <button type="submit" disabled={loginLoading} style={{ width:'100%', padding:'12px', background:COLORS.navActive, color:COLORS.white, border:'none', borderRadius:'6px', cursor:loginLoading?'not-allowed':'pointer', fontSize:'14px', fontWeight:'500', fontFamily:FONT_FAMILY }}>{loginLoading?'Logging in...':'Login'}</button>
        </form>
      </div>
    </div>
  );

  if (authPage === 'setup-password') return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh', background:'#f5f6f8', fontFamily:FONT_FAMILY }}>
      <div style={{ width:'100%', maxWidth:'400px', padding:'20px' }}>
        <h1 style={{ textAlign:'center', marginBottom:'30px', color:COLORS.darkText }}>Setup Your Password</h1>
        <form onSubmit={handleSetupPassword} style={{ background:COLORS.white, padding:'24px', borderRadius:'8px', border:'1px solid '+COLORS.borderColor }}>
          <div style={{ marginBottom:'16px' }}><label style={{ display:'block', marginBottom:'8px', fontSize:'14px', fontWeight:'500' }}>Password</label><input type="password" value={setupPassword} onChange={e => setSetupPassword(e.target.value)} style={{ width:'100%', padding:'10px', border:'1px solid '+COLORS.borderColor, borderRadius:'6px', fontSize:'14px', fontFamily:FONT_FAMILY }} required /></div>
          <div style={{ marginBottom:'16px' }}><label style={{ display:'block', marginBottom:'8px', fontSize:'14px', fontWeight:'500' }}>Confirm Password</label><input type="password" value={setupPasswordConfirm} onChange={e => setSetupPasswordConfirm(e.target.value)} style={{ width:'100%', padding:'10px', border:'1px solid '+COLORS.borderColor, borderRadius:'6px', fontSize:'14px', fontFamily:FONT_FAMILY }} required /></div>
          {setupError && <div style={{ background:COLORS.errorBg, border:'1px solid '+COLORS.errorBorder, color:COLORS.errorText, padding:'12px', borderRadius:'6px', marginBottom:'16px', fontSize:'13px' }}>{setupError}</div>}
          <button type="submit" disabled={setupLoading} style={{ width:'100%', padding:'12px', background:COLORS.navActive, color:COLORS.white, border:'none', borderRadius:'6px', cursor:setupLoading?'not-allowed':'pointer', fontSize:'14px', fontWeight:'500', fontFamily:FONT_FAMILY }}>{setupLoading?'Setting up...':'Submit'}</button>
        </form>
      </div>
    </div>
  );

  // ===== DASHBOARD =====
  const filteredRecords = applyFilters();
  const spinKeyframes = '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';

  return (
    <div style={{ display:'flex', height:'100vh', background:COLORS.white, fontFamily:FONT_FAMILY }}>
      <style>{spinKeyframes}</style>

      {/* SIDEBAR */}
      <div style={{ width:sidebarOpen?'280px':'80px', background:COLORS.sidebarBg, borderRight:'1px solid '+COLORS.borderColor, padding:'16px', display:'flex', flexDirection:'column', transition:'width 0.3s' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background:'none', border:'none', cursor:'pointer', padding:'8px', display:'flex' }}>{sidebarOpen ? <X size={18} /> : <Menu size={18} />}</button>
          {sidebarOpen && <h3 style={{ margin:0, fontSize:'14px', fontWeight:'700', color:COLORS.darkText, whiteSpace:'nowrap' }}>Academic Curator</h3>}
        </div>
        <nav style={{ marginTop:'30px', flex:1 }}>
          {[
            { icon:<BookOpen size={18} />, label:'Projects', action:'textbooks', disabled:false, rolesAllowed:['central_admin','admin','content_developer'] },
            { icon:<Users size={18} />, label:'Manage Users', action:'manage-users', disabled:true, rolesAllowed:['central_admin','admin'] },
            { icon:<Mail size={18} />, label:'Invites', action:'invites', disabled:false, rolesAllowed:['central_admin','admin'] },
{ icon:<MI name="bar_chart" size={18} />, label:'Analytics', action:'analytics', disabled:false, rolesAllowed:['central_admin','admin','content_developer'] }
          ].filter(item => item.rolesAllowed.includes(currentUser?.user_metadata?.role||'content_developer')).map((item, i) => (
            <button key={i} onClick={() => { if (item.action==='invites') { setShowInvitePanel(!showInvitePanel); if (!showInvitePanel) fetchPendingInvites(); } if (item.action==='analytics') setShowAnalytics(true); if (item.action==='analytics') setShowAnalytics(true); if (item.action==='analytics') setShowAnalytics(true); if (item.action==='analytics') setShowAnalytics(true);if (item.action==='analytics') setShowAnalytics(true); }} disabled={item.disabled}
              style={{ width:'100%', padding:'12px 16px', background:item.action==='textbooks'?COLORS.navActive:'transparent', color:item.action==='textbooks'?COLORS.white:(item.disabled?COLORS.navDisabled:COLORS.navText), border:'none', borderRadius:'6px', cursor:item.disabled?'not-allowed':'pointer', marginBottom:'8px', display:'flex', alignItems:'center', gap:'12px', fontSize:'14px', fontWeight:'500', fontFamily:FONT_FAMILY, whiteSpace:'nowrap' }}>
              {item.icon}{sidebarOpen && <span style={{ marginLeft:'10px' }}>{item.label}</span>}
            </button>
          ))}
        </nav>
        <button onClick={async () => { await supabase.auth.signOut(); setCurrentUser(null); setAuthPage('login'); }} style={{ width:'100%', padding:'12px 16px', background:COLORS.errorBg, color:COLORS.errorText, border:'none', borderRadius:'6px', cursor:'pointer', display:'flex', alignItems:'center', gap:'12px', fontSize:'14px', fontWeight:'500', fontFamily:FONT_FAMILY }}>
          {sidebarOpen ? 'Logout' : <LogOut size={18} />}
        </button>
      </div>

      {/* MAIN */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ background:COLORS.white, borderBottom:'1px solid '+COLORS.borderColor, padding:'16px 24px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h1 style={{ margin:0, fontSize:'20px', fontWeight:'700', color:COLORS.darkText }}>AI Content Studio</h1>
          <span style={{ fontSize:'12px', color:COLORS.lightText }}>{userName && <span style={{ fontSize:'13px', fontWeight:'600', color:COLORS.darkText, marginRight:'8px' }}>Hi, {userName}</span>}{currentUser?.email} • {currentUser?.user_metadata?.role} <button onClick={() => setShowNameModal(true)} style={{ marginLeft:'8px', background:'none', border:'1px solid '+COLORS.borderColor, borderRadius:'6px', padding:'3px 8px', cursor:'pointer', fontSize:'11px', color:COLORS.lightText, fontFamily:FONT_FAMILY }}><MI name="edit" size={12} /> Name</button></span>
        </div>

        <div style={{ flex:1, overflow:'auto', padding:'24px' }}>
          {showInvitePanel && (currentUser?.user_metadata?.role==='central_admin'||currentUser?.user_metadata?.role==='admin') && (
            <div style={{ background:COLORS.white, border:'1px solid '+COLORS.borderColor, borderRadius:'8px', padding:'20px', marginBottom:'24px' }}>
              <h2 style={{ margin:'0 0 16px 0', fontSize:'16px', fontWeight:'600' }}>Send Invite</h2>
              <form onSubmit={handleSendInvite} style={{ display:'flex', gap:'8px', marginBottom:'16px' }}>
                <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="user@example.com" required style={{ flex:1, padding:'10px 12px', border:'1px solid '+COLORS.borderColor, borderRadius:'6px', fontSize:'14px', fontFamily:FONT_FAMILY }} />
                <button type="submit" disabled={inviteSending} style={{ padding:'10px 20px', background:COLORS.navActive, color:COLORS.white, border:'none', borderRadius:'6px', cursor:inviteSending?'not-allowed':'pointer', fontWeight:'500', fontSize:'14px', fontFamily:FONT_FAMILY }}>{inviteSending?'Sending...':'Send Invite'}</button>
              </form>
              {inviteMessage && <div style={{ background:inviteMessage.includes('sent')?COLORS.successBg:COLORS.errorBg, border:'1px solid '+(inviteMessage.includes('sent')?COLORS.successBorder:COLORS.errorBorder), color:inviteMessage.includes('sent')?COLORS.successText:COLORS.errorText, padding:'12px', borderRadius:'6px', fontSize:'13px', whiteSpace:'pre-wrap', marginBottom:'20px' }}>{inviteMessage}</div>}
              {pendingInvites.length > 0 && <div><h3 style={{ margin:'0 0 12px 0', fontSize:'14px', fontWeight:'600' }}>Pending Invites</h3>{pendingInvites.map(inv => <div key={inv.id} style={{ background:COLORS.filterBg, padding:'12px', borderRadius:'6px', marginBottom:'8px', fontSize:'13px', display:'flex', justifyContent:'space-between' }}><span>{inv.email}</span><span style={{ color:COLORS.statusGenerating }}>Pending</span></div>)}</div>}
            </div>
          )}

          <h1 style={{ margin:'0 0 8px 0', fontSize:'32px', fontWeight:'700', color:COLORS.darkText }}>Projects</h1>
          <p style={{ margin:'0 0 24px 0', color:COLORS.lightText, fontSize:'14px' }}>Manage and curate AI-generated curriculum materials.</p>

          <div style={{ display:'flex', gap:'12px', marginBottom:'24px', flexWrap:'wrap' }}>
            {[
              { label:'Add Record', icon:'add', bg:COLORS.navActive, color:COLORS.white, action:handleOpenAddForm },
              { label:'Export', icon:'download', bg:COLORS.filterBg, color:COLORS.darkText, action:handleExport },
              { label:'Refresh', icon:'refresh', bg:COLORS.filterBg, color:COLORS.darkText, action:fetchRecords },
              { label:'Clear', icon:'filter_list_off', bg:COLORS.filterBg, color:COLORS.darkText, action:handleClearFilters },
            ].map((btn, i) => <button key={i} onClick={btn.action} style={{ padding:'8px 16px', background:btn.bg, color:btn.color, border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'500', fontSize:'13px', display:'flex', alignItems:'center', gap:'5px', fontFamily:FONT_FAMILY }}><MI name={btn.icon} size={16} /> {btn.label}</button>)}
          </div>

          {/* Add/Edit Form */}
          {showAddForm && (
            <div data-form="edit-add" style={{ background:editingId?'#fef3c7':COLORS.white, borderRadius:'12px', padding:'20px', marginBottom:'24px', border:editingId?'2px solid #f59e0b':'1px solid '+COLORS.borderColor }}>
              <h3 style={{ margin:'0 0 16px 0', fontSize:'16px', fontWeight:'600', color:editingId?'#d97706':COLORS.darkText }}>{editingId?'Edit Record':'Add New Record'}</h3>
              <form onSubmit={handleSaveRecord}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'16px' }}>
                  <div><label style={{ display:'block', fontSize:'12px', fontWeight:'500', marginBottom:'6px', textTransform:'uppercase' }}>CLASS</label><select value={formClass} onChange={e => setFormClass(e.target.value)} style={{ width:'100%', padding:'10px', border:'1px solid '+COLORS.borderColor, borderRadius:'6px', fontSize:'14px', fontFamily:FONT_FAMILY }}>{['Nursery','PP1','PP2','1','2','3','4','5','6','7','8','9','10','11','12'].map(c => <option key={c}>{c}</option>)}</select></div>
                  <div><label style={{ display:'block', fontSize:'12px', fontWeight:'500', marginBottom:'6px', textTransform:'uppercase' }}>SUBJECT</label><select value={formSubject} onChange={e => setFormSubject(e.target.value)} style={{ width:'100%', padding:'10px', border:'1px solid '+COLORS.borderColor, borderRadius:'6px', fontSize:'14px', fontFamily:FONT_FAMILY }}>{subjects.map(s => <option key={s}>{s}</option>)}</select></div>
                </div>
                <div style={{ marginBottom:'16px' }}><label style={{ display:'block', fontSize:'12px', fontWeight:'500', marginBottom:'6px', textTransform:'uppercase' }}>TOPIC</label><input type="text" value={formTopic} onChange={e => setFormTopic(e.target.value)} required style={{ width:'100%', padding:'10px', border:'1px solid '+COLORS.borderColor, borderRadius:'6px', fontSize:'14px', fontFamily:FONT_FAMILY }} /></div>
                <div style={{ marginBottom:'16px' }}><label style={{ display:'block', fontSize:'12px', fontWeight:'500', marginBottom:'6px', textTransform:'uppercase' }}>SUB-TOPIC</label><input type="text" value={formSubTopic} onChange={e => setFormSubTopic(e.target.value)} style={{ width:'100%', padding:'10px', border:'1px solid '+COLORS.borderColor, borderRadius:'6px', fontSize:'14px', fontFamily:FONT_FAMILY }} /></div>
                <div style={{ marginBottom:'16px' }}><label style={{ display:'block', fontSize:'12px', fontWeight:'500', marginBottom:'6px', textTransform:'uppercase' }}>CONTENT TYPE <span style={{ color:'#ef4444' }}>*</span></label><select value={formContentType} onChange={e => setFormContentType(e.target.value)} required style={{ width:'100%', padding:'10px', border:'1px solid '+COLORS.borderColor, borderRadius:'6px', fontSize:'14px', fontFamily:FONT_FAMILY, background:formContentType?COLORS.white:'#fef2f2' }}><option value="">-- Select Content Type --</option>{CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                <div style={{ marginBottom:'16px' }}>
                  <label style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', fontWeight:'500', marginBottom:'6px', textTransform:'uppercase' }}>AI PROMPT <span style={{ fontSize:'11px', color:COLORS.lightText }}>{formPrompt.length} / 20000</span></label>
                  <textarea value={formPrompt} onChange={e => setFormPrompt(e.target.value.substring(0,20000))} rows="12" style={{ width:'100%', padding:'12px', border:'1px solid '+COLORS.borderColor, borderRadius:'6px', fontSize:'13px', fontFamily:FONT_FAMILY, resize:'vertical', minHeight:'240px', lineHeight:'1.5' }} />
                </div>

                {/* ===== AI MODEL SELECTOR (NEW) ===== */}
                <div style={{ marginBottom:'16px' }}>
                  <label style={{ display:'block', fontSize:'12px', fontWeight:'500', marginBottom:'6px', textTransform:'uppercase' }}>AI Model for Text Generation</label>
                  <select value={formTextModel} onChange={e => setFormTextModel(e.target.value)} style={{ width:'100%', padding:'10px', border:'1px solid '+COLORS.borderColor, borderRadius:'6px', fontSize:'14px', fontFamily:FONT_FAMILY, background:COLORS.white }}>
                    <option value="claude">🤖 Claude Sonnet (Anthropic) — Default</option>
                    <option value="openai">⚡ GPT-4o (OpenAI)</option>
                    <option value="gemini">✨ Gemini 1.5 Pro (Google)</option>
                  </select>
                  <div style={{ fontSize:'11px', color:COLORS.lightText, marginTop:'4px' }}>
                    {formTextModel === 'claude' && 'Best for educational NEP content generation'}
                    {formTextModel === 'openai' && 'Requires OPENAI_API_KEY set in Edge Function secrets'}
                    {formTextModel === 'gemini' && 'Requires GEMINI_API_KEY set in Edge Function secrets'}
                  </div>
                </div>
                {/* ===== END AI MODEL SELECTOR ===== */}

                <div style={{ background:'#f0f9ff', border:'1px solid #a7f3d0', borderRadius:'6px', padding:'12px', marginBottom:'16px', fontSize:'12px', color:'#065f46' }}>
                  {formTextModel === 'claude' ? 'Claude AI' : formTextModel === 'openai' ? 'GPT-4o' : 'Gemini'} will generate: lesson content + character descriptions + scene descriptions
                </div>
                <div style={{ display:'flex', gap:'8px', justifyContent:'flex-end' }}>
                  <button type="button" onClick={handleCancelForm} style={{ padding:'8px 20px', background:COLORS.filterBg, color:COLORS.darkText, border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:'500', fontSize:'13px', fontFamily:FONT_FAMILY }}>Cancel</button>
                  <button type="submit" disabled={formLoading} style={{ padding:'8px 24px', background:COLORS.navActive, color:COLORS.white, border:'none', borderRadius:'6px', cursor:formLoading?'not-allowed':'pointer', fontWeight:'500', fontSize:'13px', fontFamily:FONT_FAMILY }}>{formLoading?'Saving...':'Save & Generate'}</button>
                </div>
              </form>
            </div>
          )}

          {/* Filters */}
          <div style={{ background:COLORS.white, borderRadius:'12px', padding:'20px', marginBottom:'24px', border:'1px solid '+COLORS.borderColor }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:'16px' }}>
              {[
                { label:'CLASS', value:filterClass, setter:setFilterClass, options:['All Classes','Nursery','PP1','PP2','1','2','3','4','5','6','7','8','9','10','11','12'] },
                { label:'SUBJECT', value:filterSubject, setter:setFilterSubject, options:['All Subjects',...subjects] },
                { label:'STATUS', value:filterStatus, setter:setFilterStatus, options:['All Status','pending','generating','generated'] },
                { label:'CONTENT TYPE', value:filterContentType, setter:setFilterContentType, options:['All Types',...CONTENT_TYPES] },
              ].map((f, i) => (
                <div key={i}>
                  <label style={{ display:'block', fontSize:'12px', fontWeight:'500', marginBottom:'6px', textTransform:'uppercase' }}>{f.label}</label>
                  <select value={f.value} onChange={e => f.setter(e.target.value)} style={{ width:'100%', padding:'10px', border:'1px solid '+COLORS.borderColor, borderRadius:'6px', fontSize:'14px', fontFamily:FONT_FAMILY }}>
                    {f.options.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div>
                <label style={{ display:'block', fontSize:'12px', fontWeight:'500', marginBottom:'6px', textTransform:'uppercase' }}>RECORD ID</label>
                <input type="text" value={filterRecordId} onChange={e => setFilterRecordId(e.target.value)} placeholder="Search by ID..." style={{ width:'100%', padding:'10px', border:'1px solid '+COLORS.borderColor, borderRadius:'6px', fontSize:'14px', fontFamily:FONT_FAMILY }} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:'12px', fontWeight:'500', marginBottom:'6px', textTransform:'uppercase' }}>TOPIC</label>
                <input type="text" value={filterTopic} onChange={e => setFilterTopic(e.target.value)} placeholder="Search topic..." style={{ width:'100%', padding:'10px', border:'1px solid '+COLORS.borderColor, borderRadius:'6px', fontSize:'14px', fontFamily:FONT_FAMILY }} />
              </div>
            </div>
          </div>

          {/* Records Table */}
          <div style={{ background:COLORS.white, borderRadius:'12px', border:'1px solid '+COLORS.borderColor, overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#64748b', color:COLORS.white }}>
                  {['S.NO','ID','CLASS','SUBJECT','TOPIC','TYPE','STATUS','WORDS','PLAGIARISM','IMAGES','NOTES','ACTION'].map(h => <th key={h} style={{ padding:'12px', textAlign:'left', fontSize:'11px', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.5px' }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((r, i) => {
                  const imgCount = getGeneratedImages(r).length;
                  const promptCount = getVisualPrompts(r).length;
                  const cc = getComments(r).length;
                  return (
                    <tr key={i} style={{ borderBottom:'1px solid '+COLORS.borderColor, background:i%2===0?COLORS.white:COLORS.lightBg }}>
                      <td style={{ padding:'12px', fontSize:'13px', fontWeight:'500', color:COLORS.navActive }}>{i+1}</td>
                      <td style={{ padding:'12px', fontSize:'13px' }}><span style={{ fontWeight:'600', color:'#3730a3', background:'#e0e7ff', padding:'2px 7px', borderRadius:'8px', fontSize:'11px' }}>#{r.record_id}</span></td>
                      <td style={{ padding:'12px', fontSize:'13px' }}>{r.class}</td>
                      <td style={{ padding:'12px', fontSize:'13px' }}>{r.subject}</td>
                      <td style={{ padding:'12px', fontSize:'13px' }}>{r.topic}</td>
                      <td style={{ padding:'12px', fontSize:'13px' }}><span style={{ display:'inline-block', padding:'4px 8px', borderRadius:'4px', fontSize:'11px', fontWeight:'500', background:'#e0e7ff', color:'#3730a3' }}>{r.content_type||'N/A'}</span></td>
                      <td style={{ padding:'12px', fontSize:'13px' }}>
                        <span style={{ display:'inline-block', padding:'4px 8px', borderRadius:'3px', fontSize:'11px', fontWeight:'500', background:r.status==='generated'?COLORS.successBg:r.status==='generating'?'#f3e8ff':COLORS.filterBg, color:r.status==='generated'?COLORS.successText:r.status==='generating'?'#7c3aed':COLORS.lightText }}>{r.status}</span>
                        {/* NEW: show model badge for non-Claude records */}
                        {r.text_model && r.text_model !== 'claude' && <span style={{ marginLeft:'4px', fontSize:'9px', fontWeight:'700', padding:'1px 5px', borderRadius:'8px', background:r.text_model==='openai'?'#ecfdf5':'#fef9c3', color:r.text_model==='openai'?'#059669':'#ca8a04', border:'1px solid '+(r.text_model==='openai'?'#a7f3d0':'#fde68a') }}>{r.text_model==='openai'?'GPT-4o':'Gemini'}</span>}
                      </td>
                      <td style={{ padding:'12px', fontSize:'13px' }}>{r.word_count||0}</td>
                      {/* PLAGIARISM SCORE */}
<td style={{ padding:'12px', fontSize:'13px' }}>
  {r.plagiarism_result ? (
    <button onClick={(e) => { e.stopPropagation(); setPlagiarismRecord(r); }}
      style={{ display:'inline-flex', alignItems:'center', gap:'4px', padding:'4px 9px', borderRadius:'6px', border:'none', cursor:'pointer', fontFamily:FONT_FAMILY, fontSize:'11px', fontWeight:'700',
        background: r.plagiarism_result.overall_score >= 70 ? '#fef2f2' : r.plagiarism_result.overall_score >= 40 ? '#fffbeb' : r.plagiarism_result.overall_score >= 20 ? '#eff6ff' : '#f0fdf4',
        color: r.plagiarism_result.overall_score >= 70 ? '#dc2626' : r.plagiarism_result.overall_score >= 40 ? '#d97706' : r.plagiarism_result.overall_score >= 20 ? '#2563eb' : '#16a34a'
      }}
      title="Click to view plagiarism report">
      <MI name="policy" size={13} /> {r.plagiarism_result.overall_score}%
    </button>
  ) : (
    <span style={{ color:COLORS.lightText, fontSize:'11px' }}>—</span>
  )}
</td>
{/* IMAGES */}
<td style={{ padding:'12px', fontSize:'13px' }}>{imgCount>0?<span style={{ display:'inline-flex', alignItems:'center', gap:'3px', padding:'4px 8px', borderRadius:'3px', fontSize:'11px', fontWeight:'500', background:'#dbeafe', color:'#1e40af' }}>{imgCount}/{promptCount}</span>:promptCount>0?<span style={{ fontSize:'11px', color:COLORS.lightText }}>{promptCount} prompts</span>:<span style={{ color:COLORS.lightText, fontSize:'11px' }}>—</span>}</td>
{/* NOTES */}
<td style={{ padding:'12px', fontSize:'13px' }}>{cc>0?<span style={{ display:'inline-flex', alignItems:'center', gap:'3px', padding:'4px 8px', borderRadius:'3px', fontSize:'11px', fontWeight:'500', background:'#fef3c7', color:'#92400e' }}><MI name="chat_bubble" size={12} /> {cc}</span>:<span style={{ color:COLORS.lightText, fontSize:'11px' }}>—</span>}</td>
{/* ACTION — icons only */}
<td style={{ padding:'12px', fontSize:'13px' }}>
  <div style={{ display:'flex', gap:'4px', alignItems:'center' }}>
    <button onClick={() => { setViewingRecord(r); setViewTab('content'); setIsEditing(false); setVisualMessage(''); setShowComments(false); setImgWidthMap({}); }}
      title="View record"
      style={{ background:'none', border:'1px solid transparent', borderRadius:'6px', cursor:'pointer', padding:'5px', color:COLORS.navActive, display:'flex', alignItems:'center' }}
      onMouseEnter={e => { e.currentTarget.style.background='#eff6ff'; e.currentTarget.style.borderColor='#bfdbfe'; }}
      onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.borderColor='transparent'; }}>
      <MI name="visibility" size={17} />
    </button>
    <button onClick={() => handleEditRecord(r)}
      title="Edit record"
      style={{ background:'none', border:'1px solid transparent', borderRadius:'6px', cursor:'pointer', padding:'5px', color:'#7c3aed', display:'flex', alignItems:'center' }}
      onMouseEnter={e => { e.currentTarget.style.background='#f5f3ff'; e.currentTarget.style.borderColor='#ddd6fe'; }}
      onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.borderColor='transparent'; }}>
      <MI name="edit" size={17} />
    </button>
    {r.ai_output && (
      <button onClick={() => setPlagiarismRecord(r)}
        title="Check plagiarism"
        style={{ background:'none', border:'1px solid transparent', borderRadius:'6px', cursor:'pointer', padding:'5px', color:'#6366f1', display:'flex', alignItems:'center' }}
        onMouseEnter={e => { e.currentTarget.style.background='#eef2ff'; e.currentTarget.style.borderColor='#c7d2fe'; }}
        onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.borderColor='transparent'; }}>
        <MI name="policy" size={17} />
      </button>
    )}
  </div>
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
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'20px' }} onClick={() => { setViewingRecord(null); setIsEditing(false); }}>
          <div style={{ background:COLORS.white, width:'98%', maxWidth:'1400px', height:'95vh', display:'flex', flexDirection:'column', borderRadius:'12px', boxShadow:'0 20px 60px rgba(0,0,0,0.3)', overflow:'hidden' }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ padding:'16px 24px', borderBottom:'1px solid '+COLORS.borderColor, display:'flex', justifyContent:'space-between', alignItems:'center', background:'linear-gradient(135deg,#f5f6f8,#ffffff)' }}>
              <div style={{ flex:1, minWidth:0 }}>
                <h2 style={{ margin:'0 0 4px 0', fontSize:'22px', fontWeight:'700', color:COLORS.darkText, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{viewingRecord.topic}</h2>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap', marginTop:'2px' }}>
                  <p style={{ margin:0, fontSize:'12px', color:COLORS.lightText }}>Class {viewingRecord.class} • {viewingRecord.subject} • {viewingRecord.sub_topic||'N/A'}</p>
                  <span style={{ fontSize:'11px', fontWeight:'700', padding:'2px 9px', borderRadius:'12px', background:'#e0e7ff', color:'#3730a3', flexShrink:0, letterSpacing:'0.3px' }}>ID #{viewingRecord.record_id}</span>
                </div>
              </div>
              <div style={{ display:'flex', gap:'6px', alignItems:'center', flexShrink:0, marginLeft:'16px' }}>
                <button onClick={handleShareRecord} style={{ padding:'6px 12px', background:COLORS.filterBg, color:COLORS.darkText, border:'none', borderRadius:'6px', fontSize:'12px', fontWeight:'500', cursor:'pointer', fontFamily:FONT_FAMILY, display:'flex', alignItems:'center', gap:'4px' }}><MI name="share" size={14} /> {shareMessage||'Share'}</button>
                <button onClick={() => setShowComments(!showComments)} style={{ padding:'6px 12px', background:showComments?'#f59e0b':COLORS.filterBg, color:showComments?'white':COLORS.darkText, border:'none', borderRadius:'6px', fontSize:'12px', fontWeight:'500', cursor:'pointer', fontFamily:FONT_FAMILY, display:'flex', alignItems:'center', gap:'4px', position:'relative' }}>
                  <MI name="chat_bubble" size={14} /> Comments
                  {getComments(viewingRecord).length>0 && <span style={{ background:'#ef4444', color:'white', fontSize:'9px', fontWeight:'700', padding:'1px 5px', borderRadius:'8px' }}>{getComments(viewingRecord).length}</span>}
                </button>
                {/* ===== PLAGIARISM CHECK BUTTON (NEW) ===== */}
                {viewingRecord.ai_output && (
                  <button onClick={() => setPlagiarismRecord(viewingRecord)} style={{ padding:'6px 12px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'white', border:'none', borderRadius:'6px', fontSize:'12px', fontWeight:'600', cursor:'pointer', fontFamily:FONT_FAMILY, display:'flex', alignItems:'center', gap:'4px' }}>
                    <MI name="policy" size={14} color="white" /> Plagiarism Check
                  </button>
                )}
                {/* ===== END PLAGIARISM BUTTON ===== */}
                <button onClick={() => { setViewingRecord(null); setIsEditing(false); setShowComments(false); }} style={{ background:'none', border:'none', cursor:'pointer', padding:'6px', color:COLORS.lightText, display:'flex' }}><MI name="close" size={22} /></button>
              </div>
            </div>

            {/* Tab Bar */}
            <div style={{ padding:'0 24px', borderBottom:'1px solid '+COLORS.borderColor, display:'flex', background:COLORS.lightBg }}>
              <button onClick={() => setViewTab('content')} style={{ padding:'12px 20px', background:'none', border:'none', borderBottom:viewTab==='content'?'2px solid '+COLORS.navActive:'2px solid transparent', color:viewTab==='content'?COLORS.navActive:COLORS.lightText, fontWeight:viewTab==='content'?'600':'500', fontSize:'13px', cursor:'pointer', fontFamily:FONT_FAMILY, display:'flex', alignItems:'center', gap:'5px' }}><MI name="article" size={16} /> Content</button>
              <button onClick={() => setViewTab('visuals')} style={{ padding:'12px 20px', background:'none', border:'none', borderBottom:viewTab==='visuals'?'2px solid #8b5cf6':'2px solid transparent', color:viewTab==='visuals'?'#8b5cf6':COLORS.lightText, fontWeight:viewTab==='visuals'?'600':'500', fontSize:'13px', cursor:'pointer', fontFamily:FONT_FAMILY, display:'flex', alignItems:'center', gap:'5px' }}>
                <MI name="image" size={16} /> Visual Assets
                {getVisualPrompts(viewingRecord).length>0 && <span style={{ background:'#8b5cf6', color:'white', fontSize:'10px', padding:'1px 6px', borderRadius:'10px', fontWeight:'600' }}>{getVisualPrompts(viewingRecord).length}</span>}
              </button>
              <button onClick={() => setViewTab('history')} style={{ padding:'12px 20px', background:'none', border:'none', borderBottom:viewTab==='history'?'2px solid #f59e0b':'2px solid transparent', color:viewTab==='history'?'#f59e0b':COLORS.lightText, fontWeight:viewTab==='history'?'600':'500', fontSize:'13px', cursor:'pointer', fontFamily:FONT_FAMILY, display:'flex', alignItems:'center', gap:'5px' }}><MI name="history" size={16} /> History</button>
              <button onClick={() => setViewTab('layout')} style={{ padding:'12px 20px', background:'none', border:'none', borderBottom:viewTab==='layout'?'2px solid #059669':'2px solid transparent', color:viewTab==='layout'?'#059669':COLORS.lightText, fontWeight:viewTab==='layout'?'600':'500', fontSize:'13px', cursor:'pointer', fontFamily:FONT_FAMILY, display:'flex', alignItems:'center', gap:'5px' }}><MI name="dashboard_customize" size={16} /> Layout</button>
            </div>

            {/* Content + Comments */}
            <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
              <div style={{ flex:1, overflowY:'auto', background:COLORS.white }}>
                {viewTab==='content' ? renderContentTab() : viewTab==='visuals' ? renderVisualAssetsTab() : viewTab==='history' ? renderHistoryTab() : renderLayoutTab()}
              </div>
              {showComments && (
                <div style={{ width:'300px', borderLeft:'1px solid '+COLORS.borderColor, display:'flex', flexDirection:'column', background:'#fafbfc', flexShrink:0 }}>
                  <div style={{ padding:'14px 16px', borderBottom:'1px solid '+COLORS.borderColor, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:'13px', fontWeight:'600', color:COLORS.darkText, display:'flex', alignItems:'center', gap:'4px' }}><MI name="chat_bubble" size={15} /> Comments ({getComments(viewingRecord).length})</span>
                    <button onClick={() => setShowComments(false)} style={{ background:'none', border:'none', cursor:'pointer', padding:'2px' }}><MI name="close" size={16} color={COLORS.lightText} /></button>
                  </div>
                  <div style={{ padding:'12px', borderBottom:'1px solid '+COLORS.borderColor }}>
                    <textarea value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Add a comment..." rows={3} style={{ width:'100%', padding:'10px', fontSize:'12px', lineHeight:'1.5', border:'1px solid '+COLORS.borderColor, borderRadius:'6px', fontFamily:FONT_FAMILY, resize:'none', outline:'none', background:COLORS.white }} />
                    <button onClick={handleAddComment} disabled={!commentText.trim()} style={{ marginTop:'6px', padding:'6px 14px', width:'100%', background:commentText.trim()?COLORS.navActive:COLORS.filterBg, color:commentText.trim()?'white':COLORS.lightText, border:'none', borderRadius:'6px', fontSize:'12px', fontWeight:'500', cursor:commentText.trim()?'pointer':'not-allowed', fontFamily:FONT_FAMILY, display:'flex', alignItems:'center', justifyContent:'center', gap:'4px' }}>
                      <MI name="send" size={13} /> Post
                    </button>
                  </div>
                  <div style={{ flex:1, overflowY:'auto', padding:'8px' }}>
                    {getComments(viewingRecord).length===0 ? <div style={{ padding:'20px', textAlign:'center', color:COLORS.lightText, fontSize:'12px' }}>No comments yet</div> :
                      getComments(viewingRecord).map(c => {
                        let commentDate = '';
                        try { const d = new Date(c.timestamp); commentDate = d.toLocaleDateString('en-IN',{day:'2-digit',month:'short'}) + ' ' + d.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}); } catch(e) {}
                        return (
                          <div key={c.id} style={{ padding:'10px 12px', marginBottom:'6px', background:COLORS.white, borderRadius:'8px', border:'1px solid '+COLORS.borderColor }}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'4px' }}>
                              <div><span style={{ fontSize:'11px', fontWeight:'600', color:COLORS.navActive }}>{c.user?c.user.split('@')[0]:'User'}</span><span style={{ fontSize:'10px', color:COLORS.lightText, marginLeft:'6px' }}>{commentDate}</span></div>
                              {c.user===(currentUser?.email||'') && <button onClick={() => handleDeleteComment(c.id)} style={{ background:'none', border:'none', cursor:'pointer', padding:'0', opacity:0.4 }}><MI name="delete" size={13} color={COLORS.errorText} /></button>}
                            </div>
                            <p style={{ margin:0, fontSize:'12px', lineHeight:'1.5', color:COLORS.darkText, wordBreak:'break-word' }}>{c.text}</p>
                          </div>
                        );
                      })
                    }
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {viewingRecord.ai_output && (
              <div style={{ padding:'12px 24px', borderTop:'1px solid '+COLORS.borderColor, display:'flex', justifyContent:'flex-end', gap:'8px', background:COLORS.lightBg }}>
                <button onClick={handleCopyContent} style={{ padding:'7px 14px', background:'#6366f1', color:COLORS.white, border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:'500', fontSize:'12px', fontFamily:FONT_FAMILY, display:'flex', alignItems:'center', gap:'4px' }}><MI name="content_copy" size={14} color="white" /> Copy</button>
                <button onClick={handleExportPDF} style={{ padding:'7px 14px', background:COLORS.navActive, color:COLORS.white, border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:'500', fontSize:'12px', fontFamily:FONT_FAMILY, display:'flex', alignItems:'center', gap:'4px' }}><MI name="picture_as_pdf" size={14} color="white" /> PDF</button>
                <button onClick={handleExportWord} style={{ padding:'7px 14px', background:COLORS.navActive, color:COLORS.white, border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:'500', fontSize:'12px', fontFamily:FONT_FAMILY, display:'flex', alignItems:'center', gap:'4px' }}><MI name="description" size={14} color="white" /> Word</button>
                <button onClick={handlePrintPreview} style={{ padding:'7px 14px', background:'#059669', color:COLORS.white, border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:'500', fontSize:'12px', fontFamily:FONT_FAMILY, display:'flex', alignItems:'center', gap:'4px' }}><MI name="print" size={14} color="white" /> Print</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* LIGHTBOX */}
      {lightboxImage && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, cursor:'pointer' }} onClick={() => setLightboxImage(null)}>
          <div style={{ position:'relative', maxWidth:'90vw', maxHeight:'90vh' }} onClick={e => e.stopPropagation()}>
            <img src={lightboxImage} alt="Full size" style={{ maxWidth:'90vw', maxHeight:'85vh', objectFit:'contain', borderRadius:'8px', boxShadow:'0 0 40px rgba(0,0,0,0.5)' }} />
            <div style={{ display:'flex', gap:'8px', justifyContent:'center', marginTop:'12px' }}>
              <button onClick={() => { navigator.clipboard.writeText(lightboxImage); setVisualMessage('URL copied!'); }} style={{ padding:'8px 16px', background:'rgba(255,255,255,0.15)', color:'white', border:'1px solid rgba(255,255,255,0.3)', borderRadius:'6px', fontSize:'12px', fontWeight:'600', cursor:'pointer', fontFamily:FONT_FAMILY }}>Copy URL</button>
              <button onClick={() => handleInsertImageAtCursor(lightboxImage, 'image')} style={{ padding:'8px 16px', background:'#2563eb', color:'white', border:'none', borderRadius:'6px', fontSize:'12px', fontWeight:'600', cursor:'pointer', fontFamily:FONT_FAMILY }}>Insert into Content</button>
              <button onClick={() => window.open(lightboxImage, '_blank')} style={{ padding:'8px 16px', background:'rgba(255,255,255,0.15)', color:'white', border:'1px solid rgba(255,255,255,0.3)', borderRadius:'6px', fontSize:'12px', fontWeight:'600', cursor:'pointer', fontFamily:FONT_FAMILY }}>Open Original</button>
              <button onClick={() => setLightboxImage(null)} style={{ padding:'8px 16px', background:'rgba(255,255,255,0.15)', color:'white', border:'1px solid rgba(255,255,255,0.3)', borderRadius:'6px', fontSize:'12px', fontWeight:'600', cursor:'pointer', fontFamily:FONT_FAMILY }}>✕ Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== PLAGIARISM MODAL (NEW) ===== */}
      {plagiarismRecord && (
        <PlagiarismCheckModal
  record={plagiarismRecord}
  onClose={() => setPlagiarismRecord(null)}
  supabaseUrl="https://syacvhjmcgpgxvczassp.supabase.co"
  supabaseAnonKey="sb_publishable_tmoQwBjJYHyMnOSGAzts2w_v-aG0iYl"
  initialResult={plagiarismRecord.plagiarism_result || null}
  onResultSaved={handleSavePlagiarismResult}
/>
      )}
      {/* ===== END PLAGIARISM MODAL ===== */}

      {showNameModal && (
  <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9998, fontFamily:FONT_FAMILY }}>
    <div style={{ background:COLORS.white, borderRadius:'16px', padding:'40px', width:'100%', maxWidth:'420px', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', textAlign:'center' }}>
      <div style={{ width:'64px', height:'64px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px auto' }}><MI name="person" size={32} color="white" /></div>
      <h2 style={{ margin:'0 0 8px 0', fontSize:'22px', fontWeight:'700', color:COLORS.darkText }}>Welcome!</h2>
      <p style={{ margin:'0 0 24px 0', fontSize:'14px', color:COLORS.lightText, lineHeight:'1.6' }}>Enter your name so your contributions are tracked in history.</p>
      <input type="text" placeholder="Your name (e.g. Ravi, Priya...)" autoFocus id="name-input-field" defaultValue={userName}
        onKeyDown={e => { if (e.key === 'Enter') { const v = e.target.value.trim(); if (v) { setUserName(v); sessionStorage.setItem('acs_user_name', v); } setShowNameModal(false); } }}
        style={{ width:'100%', padding:'12px 16px', border:'2px solid #e0e7ff', borderRadius:'8px', fontSize:'15px', fontFamily:FONT_FAMILY, outline:'none', textAlign:'center', marginBottom:'16px', boxSizing:'border-box' }}
        onFocus={e => e.target.style.borderColor='#6366f1'} onBlur={e => e.target.style.borderColor='#e0e7ff'} />
      <button onClick={() => { const inp = document.getElementById('name-input-field'); const v = inp ? inp.value.trim() : ''; if (v) { setUserName(v); sessionStorage.setItem('acs_user_name', v); } setShowNameModal(false); }}
        style={{ width:'100%', padding:'12px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'white', border:'none', borderRadius:'8px', fontSize:'15px', fontWeight:'700', cursor:'pointer', fontFamily:FONT_FAMILY }}>
        Continue →
      </button>
      <button onClick={() => setShowNameModal(false)} style={{ marginTop:'10px', background:'none', border:'none', fontSize:'12px', color:COLORS.lightText, cursor:'pointer', fontFamily:FONT_FAMILY }}>Skip for now</button>
    </div>
  </div>
)}

{showAnalytics && (
  <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'20px', fontFamily:FONT_FAMILY }}>
    <div style={{ background:'#f8fafc', width:'98%', maxWidth:'1100px', height:'90vh', borderRadius:'16px', overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
      <div style={{ background:'linear-gradient(135deg,#1e1b4b,#312e81)', padding:'20px 28px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <h2 style={{ margin:'0 0 4px 0', fontSize:'20px', fontWeight:'700', color:'white' }}>Analytics Dashboard</h2>
          <p style={{ margin:0, fontSize:'12px', color:'#a5b4fc' }}>Token usage & cost tracking across all AI models</p>
        </div>
        <button onClick={() => setShowAnalytics(false)} style={{ background:'rgba(255,255,255,0.1)', border:'none', borderRadius:'8px', padding:'8px 12px', cursor:'pointer', color:'white', display:'flex', alignItems:'center' }}><MI name="close" size={20} color="white" /></button>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'24px 28px' }}>
        {(() => {
          const generated = records.filter(r => r.status === 'generated');
          const totalCost = generated.reduce((s, r) => s + (r.generation_cost || 0), 0);
          const totalTokensIn = generated.reduce((s, r) => s + (r.tokens_input || 0), 0);
          const totalTokensOut = generated.reduce((s, r) => s + (r.tokens_output || 0), 0);
          const byModel = {};
          generated.forEach(r => { const m = r.text_model || 'claude'; if (!byModel[m]) byModel[m] = { count:0, cost:0, tokensIn:0, tokensOut:0 }; byModel[m].count++; byModel[m].cost += r.generation_cost||0; byModel[m].tokensIn += r.tokens_input||0; byModel[m].tokensOut += r.tokens_output||0; });
          const modelColors = { claude:'#f59e0b', openai:'#10b981', gemini:'#6366f1' };
          const modelLabels = { claude:'Claude Sonnet', openai:'GPT-4o', gemini:'Gemini 1.5 Pro' };
          const plagChecked = records.filter(r => r.plagiarism_result).length;
          const plagHigh = records.filter(r => r.plagiarism_result && r.plagiarism_result.overall_score >= 50).length;
          const cards = [
            { label:'Total Records', value:records.length, sub:generated.length+' generated', icon:'article', color:'#6366f1', bg:'#eef2ff' },
            { label:'Total AI Spend', value:'$'+(totalCost + generated.reduce((s,r)=>s+(r.image_generation_cost||0),0)).toFixed(4), sub:'Text + image generation', icon:'payments', color:'#10b981', bg:'#ecfdf5' },
            { label:'Total Tokens', value:((totalTokensIn+totalTokensOut)/1000).toFixed(1)+'K', sub:totalTokensIn.toLocaleString()+' in / '+totalTokensOut.toLocaleString()+' out', icon:'token', color:'#f59e0b', bg:'#fffbeb' },
            { label:'Plagiarism Scans', value:plagChecked, sub:plagHigh+' high similarity found', icon:'policy', color:'#ef4444', bg:'#fef2f2' },
{ label:'Image Spend', value:'$'+(generated.reduce((s,r)=>s+(r.image_generation_cost||0),0)).toFixed(4), sub:generated.reduce((s,r)=>s+(r.images_generated||0),0)+' images generated', icon:'image', color:'#8b5cf6', bg:'#f5f3ff' },
          ];
          return (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'16px', marginBottom:'28px' }}>
                {cards.map((c,i) => (
                  <div key={i} style={{ background:'white', borderRadius:'12px', padding:'20px', boxShadow:'0 1px 3px rgba(0,0,0,0.08)', border:'1px solid #e2e8f0' }}>
                    <div style={{ width:'40px', height:'40px', borderRadius:'10px', background:c.bg, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'12px' }}><MI name={c.icon} size={20} color={c.color} /></div>
                    <div style={{ fontSize:'26px', fontWeight:'800', color:'#0f172a', letterSpacing:'-1px' }}>{c.value}</div>
                    <div style={{ fontSize:'13px', fontWeight:'600', color:'#64748b', marginTop:'2px' }}>{c.label}</div>
                    <div style={{ fontSize:'11px', color:'#94a3b8', marginTop:'4px' }}>{c.sub}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'28px' }}>
                <div style={{ background:'white', borderRadius:'12px', padding:'20px', boxShadow:'0 1px 3px rgba(0,0,0,0.08)', border:'1px solid #e2e8f0' }}>
                  <h3 style={{ margin:'0 0 16px 0', fontSize:'15px', fontWeight:'700', color:'#0f172a' }}>Cost by Model</h3>
                  {Object.keys(byModel).length === 0 ? <div style={{ textAlign:'center', color:'#94a3b8', fontSize:'13px', padding:'20px 0' }}>No generated records yet</div> :
                    Object.entries(byModel).sort((a,b) => b[1].cost-a[1].cost).map(([model,data]) => {
                      const pct = totalCost > 0 ? Math.round((data.cost/totalCost)*100) : 0;
                      return (
                        <div key={model} style={{ marginBottom:'16px' }}>
                          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'5px' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}><div style={{ width:'10px', height:'10px', borderRadius:'50%', background:modelColors[model]||'#94a3b8' }} /><span style={{ fontSize:'13px', fontWeight:'600', color:'#374151' }}>{modelLabels[model]||model}</span></div>
                            <span style={{ fontSize:'13px', fontWeight:'700', color:'#0f172a' }}>${data.cost.toFixed(4)}</span>
                          </div>
                          <div style={{ height:'8px', background:'#f1f5f9', borderRadius:'4px', overflow:'hidden' }}><div style={{ height:'100%', width:pct+'%', background:modelColors[model]||'#94a3b8', borderRadius:'4px' }} /></div>
                          <div style={{ fontSize:'11px', color:'#94a3b8', marginTop:'3px' }}>{data.count} records • {((data.tokensIn+data.tokensOut)/1000).toFixed(1)}K tokens • {pct}% of spend</div>
                        </div>
                      );
                    })
                  }
                </div>
                <div style={{ background:'white', borderRadius:'12px', padding:'20px', boxShadow:'0 1px 3px rgba(0,0,0,0.08)', border:'1px solid #e2e8f0' }}>
                  <h3 style={{ margin:'0 0 16px 0', fontSize:'15px', fontWeight:'700', color:'#0f172a' }}>Token Usage</h3>
                  {[
                    { label:'Input Tokens', value:totalTokensIn, color:'#6366f1', bg:'#eef2ff', icon:'input' },
                    { label:'Output Tokens', value:totalTokensOut, color:'#10b981', bg:'#ecfdf5', icon:'output' },
                    { label:'Total Tokens', value:totalTokensIn+totalTokensOut, color:'#f59e0b', bg:'#fffbeb', icon:'token' },
                    { label:'Avg per Record', value:generated.length>0?Math.round((totalTokensIn+totalTokensOut)/generated.length):0, color:'#8b5cf6', bg:'#f5f3ff', icon:'analytics' },
                  ].map((item,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'10px 12px', borderRadius:'8px', background:item.bg, marginBottom:'8px' }}>
                      <MI name={item.icon} size={18} color={item.color} />
                      <div style={{ flex:1, fontSize:'12px', color:'#64748b', fontWeight:'500' }}>{item.label}</div>
                      <div style={{ fontSize:'16px', fontWeight:'800', color:item.color }}>{item.value.toLocaleString()}</div>
                    </div>
                  ))}
                  <div style={{ marginTop:'12px', padding:'12px', background:'#f8fafc', borderRadius:'8px', border:'1px solid #e2e8f0' }}>
                    <div style={{ fontSize:'11px', color:'#94a3b8', marginBottom:'6px', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.5px' }}>Pricing Reference (per 1M tokens)</div>
                    {[['Claude Sonnet','$3 in / $15 out'],['GPT-4o','$5 in / $15 out'],['Gemini 1.5 Pro','$1.25 in / $5 out']].map(([m,p]) => (
                      <div key={m} style={{ display:'flex', justifyContent:'space-between', fontSize:'11px', color:'#64748b', padding:'2px 0' }}><span>{m}</span><span style={{ fontWeight:'600' }}>{p}</span></div>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ background:'white', borderRadius:'12px', padding:'20px', boxShadow:'0 1px 3px rgba(0,0,0,0.08)', border:'1px solid #e2e8f0' }}>
                <h3 style={{ margin:'0 0 16px 0', fontSize:'15px', fontWeight:'700', color:'#0f172a' }}>Recent Generations</h3>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
                  <thead><tr style={{ borderBottom:'2px solid #f1f5f9' }}>
                    {['Record','Subject','Model','Tokens In','Tokens Out','Text Cost','Images','Img Cost','Plagiarism'].map(h => <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontSize:'11px', fontWeight:'700', color:'#64748b', textTransform:'uppercase', letterSpacing:'0.5px' }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {generated.slice(0,20).map((r,i) => (
                      <tr key={i} style={{ borderBottom:'1px solid #f8fafc' }}>
                        <td style={{ padding:'10px 12px', color:'#374151', fontWeight:'500' }}>#{r.record_id} {(r.topic||'').substring(0,25)}{(r.topic||'').length>25?'...':''}</td>
                        <td style={{ padding:'10px 12px', color:'#64748b' }}>{r.subject}</td>
                        <td style={{ padding:'10px 12px' }}><span style={{ padding:'2px 8px', borderRadius:'20px', fontSize:'11px', fontWeight:'600', background:r.text_model==='openai'?'#ecfdf5':r.text_model==='gemini'?'#eef2ff':'#fffbeb', color:r.text_model==='openai'?'#059669':r.text_model==='gemini'?'#6366f1':'#d97706' }}>{modelLabels[r.text_model||'claude']||r.text_model||'Claude'}</span></td>
                        <td style={{ padding:'10px 12px', color:'#374151', fontFamily:'monospace', fontSize:'12px' }}>{(r.tokens_input||0).toLocaleString()}</td>
                        <td style={{ padding:'10px 12px', color:'#374151', fontFamily:'monospace', fontSize:'12px' }}>{(r.tokens_output||0).toLocaleString()}</td>
                        <td style={{ padding:'10px 12px', fontWeight:'700', fontFamily:'monospace', fontSize:'12px', color:(r.generation_cost||0)>0.01?'#ef4444':(r.generation_cost||0)>0.005?'#f59e0b':'#10b981' }}>${(r.generation_cost||0).toFixed(5)}</td>
<td style={{ padding:'10px 12px', color:'#374151', fontFamily:'monospace', fontSize:'12px' }}>{r.images_generated||0}</td>
<td style={{ padding:'10px 12px', fontWeight:'700', fontFamily:'monospace', fontSize:'12px', color:'#8b5cf6' }}>${(r.image_generation_cost||0).toFixed(4)}</td>
                        <td style={{ padding:'10px 12px' }}>{r.plagiarism_result?<span style={{ padding:'2px 8px', borderRadius:'20px', fontSize:'11px', fontWeight:'700', background:r.plagiarism_result.overall_score>=50?'#fef2f2':r.plagiarism_result.overall_score>=20?'#fffbeb':'#f0fdf4', color:r.plagiarism_result.overall_score>=50?'#dc2626':r.plagiarism_result.overall_score>=20?'#d97706':'#16a34a' }}>{r.plagiarism_result.overall_score}%</span>:<span style={{ color:'#94a3b8', fontSize:'11px' }}>—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  </div>
)}

{authPage === 'dashboard' && renderPageSettingsPanel()}
    </div>
  );
}
