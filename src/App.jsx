import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Menu, X, LogOut, Eye, Edit2, BookOpen, Plus, Download, RefreshCw,
  Mail, Check, AlertCircle, Copy, Users
} from 'lucide-react';

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

// ===== PAPER SIZES =====
const PAPER_SIZES = {
  'A4': { width: 210, height: 297, label: 'A4 (210 × 297 mm)' },
  'A3': { width: 297, height: 420, label: 'A3 (297 × 420 mm)' },
  'Letter': { width: 216, height: 279, label: 'Letter (8.5 × 11 in)' },
  'Legal': { width: 216, height: 356, label: 'Legal (8.5 × 14 in)' },
};

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

  // ===== FORM DATA =====
  const [showAddForm, setShowAddForm] = useState(false);
  const [formClass, setFormClass] = useState('1');
  const [formSubject, setFormSubject] = useState('English');
  const [formTopic, setFormTopic] = useState('');
  const [formSubTopic, setFormSubTopic] = useState('');
  const [formPrompt, setFormPrompt] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // ===== VIEW MODAL =====
  const [viewingRecord, setViewingRecord] = useState(null);
  const [viewMarkdown, setViewMarkdown] = useState(true);

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
      paperSize: 'A4',
      orientation: 'portrait',
      customWidth: 210,
      customHeight: 297,
      margins: 10,
    };
  });

  // ===== LOAD FONT & LIBS =====
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    document.head.appendChild(script);
  }, []);

  // ===== SAVE PAGE SETTINGS =====
  useEffect(() => {
    localStorage.setItem('pdfPageSettings', JSON.stringify(pageSettings));
  }, [pageSettings]);

  // ===== CHECK INVITE TOKEN ON MOUNT =====
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('invite_token=')) {
      const token = new URLSearchParams(hash.substring(1)).get('invite_token');
      if (token) {
        setSetupToken(token);
        setAuthPage('setup-password');
      }
    }
    checkAuth();
  }, []);

  // ===== CHECK AUTH =====
  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      const userWithRole = {
        ...user,
        user_metadata: {
          ...user.user_metadata,
          role: roleData?.role || 'content_developer'
        }
      };
      setCurrentUser(userWithRole);
      setAuthPage('dashboard');
      fetchRecords();
    }
  };

  // ===== ADVANCED MARKDOWN PARSER =====
  const parseMarkdownToReact = (markdown) => {
    if (!markdown) return null;

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
          <ul key={`list-${result.length}`} style={{ marginLeft: '24px', marginBottom: '12px' }}>
            {listItems.map((item, idx) => (
              <li key={idx} style={{ marginBottom: '6px', lineHeight: '1.6' }}>
                {renderInlineMarkdown(item)}
              </li>
            ))}
          </ul>
        );
        listItems = [];
      }
    };

    const flushTable = () => {
      if (tableLines.length > 0) {
        const rows = tableLines.map(line => 
          line.split('|').map(cell => cell.trim()).filter(cell => cell)
        );
        
        if (rows.length > 0) {
          result.push(
            <table key={`table-${result.length}`} style={{
              width: '100%',
              borderCollapse: 'collapse',
              margin: '16px 0',
              fontSize: '12px',
              border: `1px solid ${COLORS.borderColor}`,
              pageBreakInside: 'avoid'
            }}>
              <thead>
                <tr style={{ background: '#64748b', color: 'white' }}>
                  {rows[0].map((cell, idx) => (
                    <th key={idx} style={{
                      padding: '12px',
                      textAlign: 'left',
                      fontWeight: '600',
                      borderBottom: `2px solid #475569`
                    }}>
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(1).map((row, rowIdx) => (
                  <tr key={rowIdx} style={{ 
                    background: rowIdx % 2 === 0 ? '#f9fafb' : '#ffffff',
                    borderBottom: `1px solid ${COLORS.borderColor}`
                  }}>
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} style={{
                        padding: '12px',
                        borderRight: cellIdx < row.length - 1 ? `1px solid ${COLORS.borderColor}` : 'none'
                      }}>
                        {renderInlineMarkdown(cell)}
                      </td>
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
          <pre key={`code-${result.length}`} style={{
            background: '#1f2937',
            color: '#e5e7eb',
            padding: '14px',
            borderRadius: '6px',
            overflowX: 'auto',
            margin: '12px 0',
            fontSize: '12px',
            lineHeight: '1.5',
            border: `1px solid #374151`,
            fontFamily: 'monospace',
            pageBreakInside: 'avoid'
          }}>
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
          return (
            <div key={idx} style={{
              background: '#f0f9ff',
              padding: '12px',
              margin: '8px 0',
              borderLeft: `4px solid #2563eb`,
              fontFamily: 'monospace',
              overflow: 'auto',
              fontSize: '12px'
            }}>
              {part.replace(/\$\$/g, '')}
            </div>
          );
        } else if (part.startsWith('$')) {
          return (
            <code key={idx} style={{
              background: '#f0f9ff',
              padding: '2px 6px',
              borderRadius: '3px',
              fontFamily: 'monospace',
              fontSize: '12px'
            }}>
              {part.replace(/\$/g, '')}
            </code>
          );
        }

        const formatted = part
          .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight:600">$1</strong>')
          .replace(/__(.*?)__/g, '<strong style="font-weight:600">$1</strong>')
          .replace(/\*(.*?)\*/g, '<em style="font-style:italic">$1</em>')
          .replace(/_(.*?)_/g, '<em style="font-style:italic">$1</em>')
          .replace(/`(.*?)`/g, '<code style="background:#f3f4f6;padding:2px 6px;border-radius:3px;font-family:monospace">$1</code>');

        if (formatted !== part) {
          return <span key={idx} dangerouslySetInnerHTML={{ __html: formatted }} />;
        }

        return part;
      });
    };

    while (i < lines.length) {
      const line = lines[i];

      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          flushCodeBlock();
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
        }
        i++;
        continue;
      }

      if (inCodeBlock) {
        codeBlock.push(line);
        i++;
        continue;
      }

      if (line.includes('|') && line.trim().length > 2) {
        tableLines.push(line);
        i++;
        continue;
      }

      if (tableLines.length > 0 && (!line.includes('|') || line.trim().length < 2)) {
        flushTable();
      }

      if (line.startsWith('###')) {
        flushList();
        result.push(
          <h3 key={i} style={{ fontSize: '15px', margin: '12px 0 8px 0', fontWeight: '600', color: COLORS.darkText, pageBreakAfter: 'avoid' }}>
            {renderInlineMarkdown(line.replace(/^#+\s*/, ''))}
          </h3>
        );
        i++;
        continue;
      }

      if (line.startsWith('##')) {
        flushList();
        result.push(
          <h2 key={i} style={{ fontSize: '17px', margin: '14px 0 10px 0', fontWeight: '600', color: COLORS.darkText, pageBreakAfter: 'avoid' }}>
            {renderInlineMarkdown(line.replace(/^#+\s*/, ''))}
          </h2>
        );
        i++;
        continue;
      }

      if (line.startsWith('#')) {
        flushList();
        result.push(
          <h1 key={i} style={{ fontSize: '20px', margin: '16px 0 12px 0', fontWeight: '700', color: COLORS.darkText, pageBreakAfter: 'avoid' }}>
            {renderInlineMarkdown(line.replace(/^#+\s*/, ''))}
          </h1>
        );
        i++;
        continue;
      }

      if (line.trim().startsWith('-') || line.trim().startsWith('*') || /^\d+\./.test(line.trim())) {
        const itemText = line.replace(/^[\s\-\*]+|\d+\.\s*/, '').trim();
        if (itemText) {
          listItems.push(itemText);
        }
        i++;
        continue;
      }

      if (line.startsWith('>')) {
        flushList();
        result.push(
          <blockquote key={i} style={{
            borderLeft: `4px solid #2563eb`,
            paddingLeft: '12px',
            margin: '12px 0',
            background: '#f0f9ff',
            padding: '10px 12px',
            fontSize: '13px',
            fontStyle: 'italic',
            color: '#475569',
            pageBreakInside: 'avoid'
          }}>
            {renderInlineMarkdown(line.replace(/^>\s*/, ''))}
          </blockquote>
        );
        i++;
        continue;
      }

      if (line.trim().length === 0) {
        flushList();
        result.push(<div key={i} style={{ height: '8px' }} />);
        i++;
        continue;
      }

      if (line.trim()) {
        flushList();
        result.push(
          <p key={i} style={{ margin: '8px 0', lineHeight: '1.6', color: COLORS.darkText, pageBreakInside: 'avoid' }}>
            {renderInlineMarkdown(line)}
          </p>
        );
      }

      i++;
    }

    flushList();
    flushTable();
    flushCodeBlock();

    return result;
  };

  // ===== GET PAPER DIMENSIONS =====
  const getPaperDimensions = () => {
    let width, height;
    
    if (pageSettings.paperSize === 'Custom') {
      width = pageSettings.customWidth;
      height = pageSettings.customHeight;
    } else {
      const size = PAPER_SIZES[pageSettings.paperSize];
      width = size.width;
      height = size.height;
    }
    
    if (pageSettings.orientation === 'landscape') {
      [width, height] = [height, width];
    }
    
    return { width, height };
  };

  // ===== SETUP PASSWORD (FROM INVITE) =====
  const handleSetupPassword = async (e) => {
    e.preventDefault();
    setSetupError('');

    if (setupPassword !== setupPasswordConfirm) {
      setSetupError('Passwords do not match');
      return;
    }

    if (setupPassword.length < 6) {
      setSetupError('Password must be at least 6 characters');
      return;
    }

    if (!setupToken) {
      setSetupError('No invite token found. Invalid link.');
      return;
    }

    setSetupLoading(true);

    try {
      const { data: inviteData, error: inviteError } = await supabase
        .from('invites')
        .select('*')
        .eq('token', setupToken)
        .single();

      if (inviteError) {
        throw new Error('Invite link is invalid or expired. Please contact your administrator.');
      }

      if (!inviteData) {
        throw new Error('Invite not found. Please contact your administrator.');
      }

      if (inviteData.status !== 'pending') {
        throw new Error('This invite has already been used or expired.');
      }

      const invitedEmail = inviteData.email;

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: invitedEmail,
        password: setupPassword,
        options: { 
          emailRedirectTo: window.location.origin,
          data: { auto_confirmed: true }
        }
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          // User exists, try sign in
        } else {
          throw signUpError;
        }
      }

      let userId = signUpData?.user?.id;

      if (!userId) {
        const { data: userData } = await supabase.auth.getUser();
        userId = userData?.user?.id;
      }

      if (userId) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert([{ user_id: userId, role: 'content_developer' }])
          .select();

        if (roleError && !roleError.message.includes('duplicate')) {
          console.error('Role insert error:', roleError);
        }
      }

      await supabase
        .from('invites')
        .update({ status: 'accepted', accepted_at: new Date().toISOString() })
        .eq('token', setupToken);

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: invitedEmail,
        password: setupPassword
      });

      if (signInError) throw signInError;

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Failed to get user session');
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      const userWithRole = {
        ...user,
        user_metadata: {
          ...user.user_metadata,
          role: roleData?.role || 'content_developer'
        }
      };

      setCurrentUser(userWithRole);
      setAuthPage('dashboard');
      fetchRecords();
    } catch (err) {
      setSetupError(err.message || 'Setup failed. Please try again.');
    } finally {
      setSetupLoading(false);
    }
  };

  // ===== LOGIN =====
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) throw error;

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .single();

      const userWithRole = {
        ...data.user,
        user_metadata: {
          ...data.user.user_metadata,
          role: roleData?.role || 'content_developer'
        }
      };

      setCurrentUser(userWithRole);
      setAuthPage('dashboard');
      fetchRecords();
    } catch (err) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  // ===== FETCH RECORDS =====
  const fetchRecords = async () => {
    const { data, error } = await supabase
      .from('textbook_content')
      .select('*')
      .order('updated_at', { ascending: false });

    if (!error && data) {
      setRecords(data);
    }
  };

  // ===== APPLY FILTERS =====
  const applyFilters = () => {
    return records.filter(r => {
      const classMatch = filterClass === 'All Classes' || r.class === filterClass;
      const subjectMatch = filterSubject === 'All Subjects' || r.subject === filterSubject;
      const statusMatch = filterStatus === 'All Status' || r.status === filterStatus;
      const topicMatch = !filterTopic || r.topic.toLowerCase().includes(filterTopic.toLowerCase());
      return classMatch && subjectMatch && statusMatch && topicMatch;
    });
  };

  // ===== SAVE RECORD =====
  const handleSaveRecord = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      if (editingId) {
        await supabase
          .from('textbook_content')
          .update({
            class: formClass,
            subject: formSubject,
            topic: formTopic,
            sub_topic: formSubTopic,
            prompt: formPrompt,
            status: 'generating',
            updated_at: new Date(),
          })
          .eq('record_id', editingId);
      } else {
        await supabase
          .from('textbook_content')
          .insert([{
            class: formClass,
            subject: formSubject,
            topic: formTopic,
            sub_topic: formSubTopic,
            prompt: formPrompt,
            status: 'generating',
          }]);
      }

      setFormClass('1');
      setFormSubject('English');
      setFormTopic('');
      setFormSubTopic('');
      setFormPrompt('');
      setShowAddForm(false);
      setEditingId(null);
      fetchRecords();
    } catch (err) {
      alert('Error saving record: ' + err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // ===== HANDLE SEND INVITE =====
  const handleSendInvite = async (e) => {
    e.preventDefault();
    setInviteSending(true);
    setInviteMessage('');

    try {
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await supabase
        .from('invites')
        .insert([{
          email: inviteEmail,
          token: token,
          status: 'pending',
          invited_by: currentUser.id,
          expires_at: expiresAt.toISOString(),
        }]);

      const inviteLink = `${window.location.origin}#invite_token=${token}`;
      setInviteMessage(`✅ Invite sent!\n\nShare this link:\n${inviteLink}\n\nExpires in 7 days`);
      setInviteEmail('');
      fetchPendingInvites();
    } catch (err) {
      setInviteMessage(`❌ Error: ${err.message}`);
    } finally {
      setInviteSending(false);
    }
  };

  // ===== FETCH PENDING INVITES =====
  const fetchPendingInvites = async () => {
    const { data } = await supabase
      .from('invites')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    setPendingInvites(data || []);
  };

  // ===== COPY CONTENT =====
  const handleCopyContent = async () => {
    if (!viewingRecord || !viewingRecord.ai_output) return;

    try {
      let contentToCopy = viewingRecord.ai_output;

      if (!viewMarkdown) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = contentToCopy;
        contentToCopy = tempDiv.textContent || '';
      }

      await navigator.clipboard.writeText(contentToCopy);
      alert('✓ Content copied to clipboard!');
    } catch (err) {
      alert('Failed to copy: ' + err.message);
    }
  };

  // ===== EXPORT PDF (WITH PAGE SETTINGS) =====
  const handleExportPDF = () => {
    if (!viewingRecord || !viewingRecord.ai_output) return;

    try {
      const markdownContent = viewingRecord.ai_output;
      let contentHtml = markdownContent;
      const dimensions = getPaperDimensions();

      if (viewMarkdown) {
        const lines = markdownContent.split('\n');
        let html = '';
        let i = 0;
        let inCodeBlock = false;
        let codeContent = [];

        while (i < lines.length) {
          const line = lines[i];

          if (line.trim().startsWith('```')) {
            if (inCodeBlock) {
              html += `<pre style="background:#1f2937;color:#e5e7eb;padding:12px;border-radius:6px;margin:12px 0;overflow-x:auto;font-size:11px;page-break-inside:avoid;"><code>${codeContent.join('\n')}</code></pre>`;
              codeContent = [];
              inCodeBlock = false;
            } else {
              inCodeBlock = true;
            }
            i++;
            continue;
          }

          if (inCodeBlock) {
            codeContent.push(line);
            i++;
            continue;
          }

          if (line.includes('|') && line.trim().length > 2) {
            let tableLines = [line];
            i++;
            while (i < lines.length && lines[i].includes('|')) {
              tableLines.push(lines[i]);
              i++;
            }
            
            const rows = tableLines.map(l => 
              l.split('|').map(c => c.trim()).filter(c => c)
            );

            if (rows.length > 0) {
              html += '<table style="width:100%;border-collapse:collapse;margin:12px 0;border:1px solid #e5e7eb;page-break-inside:avoid;"><thead><tr style="background:#64748b;color:white;">';
              rows[0].forEach(cell => {
                html += `<th style="padding:10px;text-align:left;font-weight:600;border-bottom:2px solid #475569;">${cell}</th>`;
              });
              html += '</tr></thead><tbody>';
              rows.slice(1).forEach((row, idx) => {
                html += `<tr style="background:${idx % 2 === 0 ? '#f9fafb' : '#ffffff'};border-bottom:1px solid #e5e7eb;">`;
                row.forEach((cell, cIdx) => {
                  html += `<td style="padding:10px;border-right:${cIdx < row.length - 1 ? '1px solid #e5e7eb' : 'none'};">${cell}</td>`;
                });
                html += '</tr>';
              });
              html += '</tbody></table>';
            }
            continue;
          }

          if (line.startsWith('###')) {
            html += `<h3 style="font-size:15px;margin:12px 0 8px 0;font-weight:600;page-break-after:avoid;">${line.replace(/^#+\s*/, '')}</h3>`;
            i++;
            continue;
          }
          if (line.startsWith('##')) {
            html += `<h2 style="font-size:17px;margin:14px 0 10px 0;font-weight:600;page-break-after:avoid;">${line.replace(/^#+\s*/, '')}</h2>`;
            i++;
            continue;
          }
          if (line.startsWith('#')) {
            html += `<h1 style="font-size:20px;margin:16px 0 12px 0;font-weight:700;page-break-after:avoid;">${line.replace(/^#+\s*/, '')}</h1>`;
            i++;
            continue;
          }

          if (line.trim().startsWith('-') || /^\d+\./.test(line.trim())) {
            let listItems = [];
            while (i < lines.length && (lines[i].trim().startsWith('-') || /^\d+\./.test(lines[i].trim()))) {
              const item = lines[i].replace(/^[\s\-\*]+|\d+\.\s*/, '').trim();
              if (item) listItems.push(item);
              i++;
            }
            if (listItems.length > 0) {
              html += '<ul style="margin-left:24px;margin-bottom:12px;page-break-inside:avoid;">';
              listItems.forEach(item => {
                html += `<li style="margin-bottom:6px;">${item}</li>`;
              });
              html += '</ul>';
            }
            continue;
          }

          if (line.startsWith('>')) {
            html += `<blockquote style="border-left:4px solid #2563eb;padding-left:12px;margin:12px 0;background:#f0f9ff;padding:10px 12px;font-style:italic;color:#475569;page-break-inside:avoid;">${line.replace(/^>\s*/, '')}</blockquote>`;
            i++;
            continue;
          }

          if (line.trim()) {
            let text = line
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/\*(.*?)\*/g, '<em>$1</em>')
              .replace(/`(.*?)`/g, '<code style="background:#f3f4f6;padding:2px 6px;border-radius:3px;">$1</code>');
            html += `<p style="margin:8px 0;line-height:1.6;page-break-inside:avoid;">${text}</p>`;
          }

          i++;
        }

        contentHtml = html;
      }

      const element = document.createElement('div');
      element.style.width = '100%';
      element.style.padding = `${pageSettings.margins}mm`;
      element.innerHTML = `
        <div style="font-family: Lexend, sans-serif; color: #0f172a; max-width: 100%; word-wrap: break-word;">
          <h1 style="font-size: 24px; margin-bottom: 8px; page-break-after:avoid;">${viewingRecord.topic}</h1>
          <p style="color: #6b7280; margin-bottom: 20px; font-size: 13px;">Class ${viewingRecord.class} | ${viewingRecord.subject}</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <div style="line-height: 1.6; font-size: 13px; color: #0f172a; overflow-wrap: break-word; word-break: break-word;">${contentHtml}</div>
        </div>
      `;

      if (typeof window !== 'undefined' && window.html2pdf) {
        const opt = {
          margin: pageSettings.margins,
          filename: `${viewingRecord.topic}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, allowTaint: true },
          jsPDF: { 
            orientation: pageSettings.orientation === 'landscape' ? 'l' : 'p',
            unit: 'mm', 
            format: pageSettings.paperSize === 'Custom' ? [dimensions.width, dimensions.height] : pageSettings.paperSize, 
            compress: true 
          }
        };
        window.html2pdf().set(opt).from(element).save();
      } else {
        alert('PDF library is loading. Please try again in a moment.');
      }
    } catch (err) {
      alert('PDF export failed: ' + err.message);
    }
  };

  // ===== EXPORT WORD =====
  const handleExportWord = () => {
    if (!viewingRecord || !viewingRecord.ai_output) return;

    try {
      const content = viewingRecord.ai_output;
      const element = document.createElement('a');
      const file = new Blob([content], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `${viewingRecord.topic}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (err) {
      alert('Export failed: ' + err.message);
    }
  };

  // ===== EXPORT CSV =====
  const handleExport = () => {
    const filtered = applyFilters();
    let csv = 'ID,Class,Subject,Topic,SubTopic,Status,Words\n';
    filtered.forEach(r => {
      csv += `${r.record_id},"${r.class}","${r.subject}","${r.topic}","${r.sub_topic}","${r.status}",${r.word_count}\n`;
    });

    const element = document.createElement('a');
    element.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    element.download = 'textbooks.csv';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // ===== HANDLE CLEAR FILTERS =====
  const handleClearFilters = () => {
    setFilterClass('All Classes');
    setFilterSubject('All Subjects');
    setFilterStatus('All Status');
    setFilterTopic('');
  };

  // ===== PAGE SETTINGS TOGGLE =====
  const [showPageSettings, setShowPageSettings] = useState(false);

  // ===== PAGE SETTINGS PANEL =====
  const renderPageSettingsPanel = () => {
    const dimensions = getPaperDimensions();
    
    return (
      <>
        {/* Floating Toggle Button */}
        <button
          onClick={() => setShowPageSettings(!showPageSettings)}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '60px',
            height: '60px',
            background: COLORS.navActive,
            color: COLORS.white,
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: 998,
            transition: 'transform 0.2s, box-shadow 0.2s',
            fontFamily: FONT_FAMILY
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.1)';
            e.target.style.boxShadow = '0 6px 16px rgba(0,0,0,0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
          }}
          title="PDF Page Settings"
        >
          📄
        </button>

        {/* Settings Modal */}
        {showPageSettings && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999
          }} onClick={() => setShowPageSettings(false)}>
            <div style={{
              background: COLORS.white,
              borderRadius: '12px',
              padding: '24px',
              width: '100%',
              maxWidth: '400px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              fontFamily: FONT_FAMILY,
              maxHeight: '90vh',
              overflowY: 'auto'
            }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: COLORS.darkText }}>
                  📄 PDF Settings
                </h2>
                <button 
                  onClick={() => setShowPageSettings(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', padding: '4px' }}
                >
                  ✕
                </button>
              </div>
              
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: COLORS.darkText, marginBottom: '4px', textTransform: 'uppercase' }}>
                  Paper Size
                </label>
                <select 
                  value={pageSettings.paperSize}
                  onChange={(e) => {
                    const size = e.target.value;
                    if (size !== 'Custom') {
                      const dims = PAPER_SIZES[size];
                      setPageSettings({
                        ...pageSettings,
                        paperSize: size,
                        customWidth: dims.width,
                        customHeight: dims.height
                      });
                    } else {
                      setPageSettings({ ...pageSettings, paperSize: 'Custom' });
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: `1px solid ${COLORS.borderColor}`,
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontFamily: FONT_FAMILY
                  }}
                >
                  {Object.keys(PAPER_SIZES).map(size => (
                    <option key={size} value={size}>{PAPER_SIZES[size].label}</option>
                  ))}
                  <option value="Custom">Custom Size</option>
                </select>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: COLORS.darkText, marginBottom: '4px', textTransform: 'uppercase' }}>
                  Orientation
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setPageSettings({ ...pageSettings, orientation: 'portrait' })}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: pageSettings.orientation === 'portrait' ? COLORS.navActive : COLORS.filterBg,
                      color: pageSettings.orientation === 'portrait' ? COLORS.white : COLORS.darkText,
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500',
                      fontFamily: FONT_FAMILY
                    }}
                  >
                    📗 Portrait
                  </button>
                  <button
                    onClick={() => setPageSettings({ ...pageSettings, orientation: 'landscape' })}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: pageSettings.orientation === 'landscape' ? COLORS.navActive : COLORS.filterBg,
                      color: pageSettings.orientation === 'landscape' ? COLORS.white : COLORS.darkText,
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500',
                      fontFamily: FONT_FAMILY
                    }}
                  >
                    📕 Landscape
                  </button>
                </div>
              </div>

              {pageSettings.paperSize === 'Custom' && (
                <div style={{ marginBottom: '12px', background: COLORS.filterBg, padding: '10px', borderRadius: '4px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: COLORS.darkText, marginBottom: '4px' }}>
                    Width (mm)
                  </label>
                  <input
                    type="number"
                    value={pageSettings.customWidth}
                    onChange={(e) => setPageSettings({ ...pageSettings, customWidth: parseInt(e.target.value) || 210 })}
                    style={{
                      width: '100%',
                      padding: '6px',
                      border: `1px solid ${COLORS.borderColor}`,
                      borderRadius: '4px',
                      fontSize: '12px',
                      marginBottom: '8px',
                      fontFamily: FONT_FAMILY
                    }}
                    min="50"
                    max="1000"
                  />
                  
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: COLORS.darkText, marginBottom: '4px' }}>
                    Height (mm)
                  </label>
                  <input
                    type="number"
                    value={pageSettings.customHeight}
                    onChange={(e) => setPageSettings({ ...pageSettings, customHeight: parseInt(e.target.value) || 297 })}
                    style={{
                      width: '100%',
                      padding: '6px',
                      border: `1px solid ${COLORS.borderColor}`,
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontFamily: FONT_FAMILY
                    }}
                    min="50"
                    max="1000"
                  />
                </div>
              )}

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: COLORS.darkText, marginBottom: '4px', textTransform: 'uppercase' }}>
                  Margins (mm)
                </label>
                <input
                  type="number"
                  value={pageSettings.margins}
                  onChange={(e) => setPageSettings({ ...pageSettings, margins: parseInt(e.target.value) || 10 })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: `1px solid ${COLORS.borderColor}`,
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontFamily: FONT_FAMILY
                  }}
                  min="0"
                  max="50"
                />
              </div>

              <div style={{ borderTop: `1px solid ${COLORS.borderColor}`, paddingTop: '16px', marginTop: '16px' }}>
                <div style={{
                  background: COLORS.lightBg,
                  padding: '12px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  color: COLORS.lightText,
                  fontFamily: FONT_FAMILY
                }}>
                  <strong>Current Settings:</strong><br/>
                  {dimensions.width} × {dimensions.height} mm<br/>
                  {pageSettings.orientation === 'portrait' ? '📗 Portrait' : '📕 Landscape'}<br/>
                  Margins: {pageSettings.margins}mm
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  // ===== RENDER FUNCTIONS =====
  if (authPage === 'login') {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f5f6f8',
        fontFamily: FONT_FAMILY
      }}>
        <div style={{ width: '100%', maxWidth: '400px', padding: '20px' }}>
          <h1 style={{ textAlign: 'center', marginBottom: '30px', color: COLORS.darkText }}>🎓 AI Content Studio</h1>
          <form onSubmit={handleLogin} style={{
            background: COLORS.white,
            padding: '24px',
            borderRadius: '8px',
            border: `1px solid ${COLORS.borderColor}`
          }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: COLORS.darkText }}>Email</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: `1px solid ${COLORS.borderColor}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: FONT_FAMILY
                }}
                required
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: COLORS.darkText }}>Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: `1px solid ${COLORS.borderColor}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: FONT_FAMILY
                }}
                required
              />
            </div>
            {loginError && (
              <div style={{
                background: COLORS.errorBg,
                border: `1px solid ${COLORS.errorBorder}`,
                color: COLORS.errorText,
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '16px',
                fontSize: '13px'
              }}>
                {loginError}
              </div>
            )}
            <button
              type="submit"
              disabled={loginLoading}
              style={{
                width: '100%',
                padding: '12px',
                background: COLORS.navActive,
                color: COLORS.white,
                border: 'none',
                borderRadius: '6px',
                cursor: loginLoading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                fontFamily: FONT_FAMILY
              }}
            >
              {loginLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (authPage === 'setup-password') {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f5f6f8',
        fontFamily: FONT_FAMILY
      }}>
        <div style={{ width: '100%', maxWidth: '400px', padding: '20px' }}>
          <h1 style={{ textAlign: 'center', marginBottom: '30px', color: COLORS.darkText }}>🎓 Setup Your Password</h1>
          <form onSubmit={handleSetupPassword} style={{
            background: COLORS.white,
            padding: '24px',
            borderRadius: '8px',
            border: `1px solid ${COLORS.borderColor}`
          }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: COLORS.darkText }}>Password</label>
              <input
                type="password"
                value={setupPassword}
                onChange={(e) => setSetupPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: `1px solid ${COLORS.borderColor}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: FONT_FAMILY
                }}
                required
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: COLORS.darkText }}>Confirm Password</label>
              <input
                type="password"
                value={setupPasswordConfirm}
                onChange={(e) => setSetupPasswordConfirm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: `1px solid ${COLORS.borderColor}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: FONT_FAMILY
                }}
                required
              />
            </div>
            {setupError && (
              <div style={{
                background: COLORS.errorBg,
                border: `1px solid ${COLORS.errorBorder}`,
                color: COLORS.errorText,
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '16px',
                fontSize: '13px'
              }}>
                {setupError}
              </div>
            )}
            <button
              type="submit"
              disabled={setupLoading}
              style={{
                width: '100%',
                padding: '12px',
                background: COLORS.navActive,
                color: COLORS.white,
                border: 'none',
                borderRadius: '6px',
                cursor: setupLoading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                fontFamily: FONT_FAMILY
              }}
            >
              {setupLoading ? 'Setting up...' : 'Submit'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ===== DASHBOARD =====
  const filteredRecords = applyFilters();

  return (
    <div style={{ display: 'flex', height: '100vh', background: COLORS.white, fontFamily: FONT_FAMILY }}>
      {/* SIDEBAR */}
      <div style={{
        width: sidebarOpen ? '280px' : '80px',
        background: COLORS.sidebarBg,
        borderRight: `1px solid ${COLORS.borderColor}`,
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex'
            }}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          {sidebarOpen && <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: COLORS.darkText, whiteSpace: 'nowrap' }}>Academic Curator</h3>}
        </div>

        <nav style={{ marginTop: '30px', flex: 1 }}>
          {[
            { icon: <BookOpen size={20} />, label: 'Textbooks', action: 'textbooks', disabled: false, rolesAllowed: ['central_admin', 'admin', 'content_developer'] },
            { icon: <Users size={20} />, label: 'Manage Users', action: 'manage-users', disabled: true, rolesAllowed: ['central_admin', 'admin'] },
            { icon: <Mail size={20} />, label: 'Invites', action: 'invites', disabled: false, rolesAllowed: ['central_admin', 'admin'] }
          ].filter(item => {
            const userRole = currentUser?.user_metadata?.role || 'content_developer';
            return item.rolesAllowed.includes(userRole);
          }).map((item, i) => (
            <button
              key={i}
              onClick={() => {
                if (item.action === 'invites') {
                  setShowInvitePanel(!showInvitePanel);
                  if (!showInvitePanel) fetchPendingInvites();
                }
              }}
              disabled={item.disabled}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: item.action === 'textbooks' ? COLORS.navActive : 'transparent',
                color: item.action === 'textbooks' ? COLORS.white : (item.disabled ? COLORS.navDisabled : COLORS.navText),
                border: 'none',
                borderRadius: '6px',
                cursor: item.disabled ? 'not-allowed' : 'pointer',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '14px',
                fontWeight: '500',
                fontFamily: FONT_FAMILY,
                whiteSpace: 'nowrap'
              }}
            >
              {item.icon}
              {sidebarOpen && item.label}
            </button>
          ))}
        </nav>

        <button
          onClick={async () => {
            await supabase.auth.signOut();
            setCurrentUser(null);
            setAuthPage('login');
          }}
          style={{
            width: '100%',
            padding: '12px 16px',
            background: COLORS.errorBg,
            color: COLORS.errorText,
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '14px',
            fontWeight: '500',
            fontFamily: FONT_FAMILY
          }}
        >
          <LogOut size={20} />
          {sidebarOpen && 'Logout'}
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* HEADER */}
        <div style={{
          background: COLORS.white,
          borderBottom: `1px solid ${COLORS.borderColor}`,
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: COLORS.darkText }}>AI Content Studio</h1>
          <span style={{ fontSize: '12px', color: COLORS.lightText }}>
            {currentUser?.email} • {currentUser?.user_metadata?.role}
          </span>
        </div>

        {/* CONTENT AREA */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {showInvitePanel && (currentUser?.user_metadata?.role === 'central_admin' || currentUser?.user_metadata?.role === 'admin') && (
            <div style={{
              background: COLORS.white,
              border: `1px solid ${COLORS.borderColor}`,
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: COLORS.darkText }}>📧 Send Invite</h2>

              <form onSubmit={handleSendInvite} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    border: `1px solid ${COLORS.borderColor}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: FONT_FAMILY
                  }}
                />
                <button
                  type="submit"
                  disabled={inviteSending}
                  style={{
                    padding: '10px 20px',
                    background: COLORS.navActive,
                    color: COLORS.white,
                    border: 'none',
                    borderRadius: '6px',
                    cursor: inviteSending ? 'not-allowed' : 'pointer',
                    fontWeight: '500',
                    fontSize: '14px',
                    fontFamily: FONT_FAMILY
                  }}
                >
                  {inviteSending ? 'Sending...' : 'Send Invite'}
                </button>
              </form>

              {inviteMessage && (
                <div style={{
                  background: inviteMessage.includes('✅') ? COLORS.successBg : COLORS.errorBg,
                  border: `1px solid ${inviteMessage.includes('✅') ? COLORS.successBorder : COLORS.errorBorder}`,
                  color: inviteMessage.includes('✅') ? COLORS.successText : COLORS.errorText,
                  padding: '12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  whiteSpace: 'pre-wrap',
                  marginBottom: '20px'
                }}>
                  {inviteMessage}
                </div>
              )}

              {pendingInvites.length > 0 && (
                <div>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: COLORS.darkText }}>Pending Invites</h3>
                  {pendingInvites.map(invite => (
                    <div key={invite.id} style={{ background: COLORS.filterBg, padding: '12px', borderRadius: '6px', marginBottom: '8px', fontSize: '13px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{invite.email}</span>
                        <span style={{ color: COLORS.statusGenerating }}>Pending</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: '700', color: COLORS.darkText }}>Textbooks</h1>
          <p style={{ margin: '0 0 24px 0', color: COLORS.lightText, fontSize: '14px' }}>Manage and curate AI-generated curriculum materials.</p>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <button onClick={() => setShowAddForm(!showAddForm)} style={{ padding: '10px 16px', background: COLORS.navActive, color: COLORS.white, border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: FONT_FAMILY }}>
              <Plus size={16} /> Add Record
            </button>
            <button onClick={handleExport} style={{ padding: '10px 16px', background: COLORS.filterBg, color: COLORS.darkText, border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: FONT_FAMILY }}>
              <Download size={16} /> Export
            </button>
            <button onClick={fetchRecords} style={{ padding: '10px 16px', background: COLORS.filterBg, color: COLORS.darkText, border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: FONT_FAMILY }}>
              <RefreshCw size={16} /> Refresh
            </button>
            <button onClick={handleClearFilters} style={{ padding: '10px 16px', background: COLORS.filterBg, color: COLORS.darkText, border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: FONT_FAMILY }}>
              <X size={16} /> Clear
            </button>
          </div>

          {showAddForm && (
            <div style={{ background: COLORS.white, borderRadius: '12px', padding: '20px', marginBottom: '24px', border: `1px solid ${COLORS.borderColor}` }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: COLORS.darkText }}>
                {editingId ? '✏️ Edit Record' : '➕ Add New Record'}
              </h3>
              <form onSubmit={handleSaveRecord}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: COLORS.darkText, marginBottom: '6px', textTransform: 'uppercase' }}>CLASS</label>
                    <select value={formClass} onChange={(e) => setFormClass(e.target.value)} style={{ width: '100%', padding: '10px', border: `1px solid ${COLORS.borderColor}`, borderRadius: '6px', fontSize: '14px', fontFamily: FONT_FAMILY }}>
                      {['1', '2', '3', '4', '5'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: COLORS.darkText, marginBottom: '6px', textTransform: 'uppercase' }}>SUBJECT</label>
                    <select value={formSubject} onChange={(e) => setFormSubject(e.target.value)} style={{ width: '100%', padding: '10px', border: `1px solid ${COLORS.borderColor}`, borderRadius: '6px', fontSize: '14px', fontFamily: FONT_FAMILY }}>
                      {subjects.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: COLORS.darkText, marginBottom: '6px', textTransform: 'uppercase' }}>TOPIC</label>
                  <input type="text" value={formTopic} onChange={(e) => setFormTopic(e.target.value)} required style={{ width: '100%', padding: '10px', border: `1px solid ${COLORS.borderColor}`, borderRadius: '6px', fontSize: '14px', fontFamily: FONT_FAMILY }} />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: COLORS.darkText, marginBottom: '6px', textTransform: 'uppercase' }}>SUB-TOPIC</label>
                  <input type="text" value={formSubTopic} onChange={(e) => setFormSubTopic(e.target.value)} style={{ width: '100%', padding: '10px', border: `1px solid ${COLORS.borderColor}`, borderRadius: '6px', fontSize: '14px', fontFamily: FONT_FAMILY }} />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '500', color: COLORS.darkText, marginBottom: '6px', textTransform: 'uppercase' }}>
                    AI PROMPT
                    <span style={{ fontSize: '11px', color: COLORS.lightText }}>{formPrompt.length} / 20000</span>
                  </label>
                  <textarea value={formPrompt} onChange={(e) => setFormPrompt(e.target.value.substring(0, 20000))} rows="6" style={{ width: '100%', padding: '10px', border: `1px solid ${COLORS.borderColor}`, borderRadius: '6px', fontSize: '13px', fontFamily: FONT_FAMILY, resize: 'none' }} />
                </div>

                <div style={{ background: '#f0f9ff', border: '1px solid #a7f3d0', borderRadius: '6px', padding: '12px', marginBottom: '16px', fontSize: '12px', color: '#065f46' }}>
                  ⚡ Claude AI Ready - Will generate content automatically
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={() => { setShowAddForm(false); setEditingId(null); }} style={{ flex: 1, padding: '10px', background: COLORS.filterBg, color: COLORS.darkText, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '14px', fontFamily: FONT_FAMILY }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={formLoading} style={{ flex: 1, padding: '10px', background: COLORS.navActive, color: COLORS.white, border: 'none', borderRadius: '6px', cursor: formLoading ? 'not-allowed' : 'pointer', fontWeight: '500', fontSize: '14px', fontFamily: FONT_FAMILY }}>
                    {formLoading ? '⏳ Saving...' : '⚡ Save & Generate'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div style={{ background: COLORS.white, borderRadius: '12px', padding: '20px', marginBottom: '24px', border: `1px solid ${COLORS.borderColor}` }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: COLORS.darkText, marginBottom: '6px', textTransform: 'uppercase' }}>CLASS</label>
                <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} style={{ width: '100%', padding: '10px', border: `1px solid ${COLORS.borderColor}`, borderRadius: '6px', fontSize: '14px', fontFamily: FONT_FAMILY }}>
                  {['All Classes', '1', '2', '3', '4', '5'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: COLORS.darkText, marginBottom: '6px', textTransform: 'uppercase' }}>SUBJECT</label>
                <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} style={{ width: '100%', padding: '10px', border: `1px solid ${COLORS.borderColor}`, borderRadius: '6px', fontSize: '14px', fontFamily: FONT_FAMILY }}>
                  {['All Subjects', ...subjects].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: COLORS.darkText, marginBottom: '6px', textTransform: 'uppercase' }}>STATUS</label>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ width: '100%', padding: '10px', border: `1px solid ${COLORS.borderColor}`, borderRadius: '6px', fontSize: '14px', fontFamily: FONT_FAMILY }}>
                  {['All Status', 'pending', 'generating', 'generated'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: COLORS.darkText, marginBottom: '6px', textTransform: 'uppercase' }}>TOPIC</label>
                <input type="text" value={filterTopic} onChange={(e) => setFilterTopic(e.target.value)} placeholder="Search topic..." style={{ width: '100%', padding: '10px', border: `1px solid ${COLORS.borderColor}`, borderRadius: '6px', fontSize: '14px', fontFamily: FONT_FAMILY }} />
              </div>
            </div>
          </div>

          <div style={{ background: COLORS.white, borderRadius: '12px', border: `1px solid ${COLORS.borderColor}`, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#64748b', color: COLORS.white }}>
                  {['ID', 'CLASS', 'SUBJECT', 'TOPIC', 'STATUS', 'WORDS', 'ACTION'].map(h => (
                    <th key={h} style={{ padding: '12px', textAlign: 'left', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((r, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${COLORS.borderColor}`, background: i % 2 === 0 ? COLORS.white : COLORS.lightBg }}>
                    <td style={{ padding: '12px', fontSize: '13px' }}>{r.record_id}</td>
                    <td style={{ padding: '12px', fontSize: '13px' }}>{r.class}</td>
                    <td style={{ padding: '12px', fontSize: '13px' }}>{r.subject}</td>
                    <td style={{ padding: '12px', fontSize: '13px' }}>{r.topic}</td>
                    <td style={{ padding: '12px', fontSize: '13px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: '3px',
                        fontSize: '11px',
                        fontWeight: '500',
                        background: r.status === 'generated' ? COLORS.successBg : r.status === 'generating' ? '#f3e8ff' : COLORS.filterBg,
                        color: r.status === 'generated' ? COLORS.successText : r.status === 'generating' ? '#7c3aed' : COLORS.lightText
                      }}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px' }}>{r.word_count || 0}</td>
                    <td style={{ padding: '12px', fontSize: '13px', display: 'flex', gap: '8px' }}>
                      <button onClick={() => setViewingRecord(r)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}>
                        <Eye size={18} color={COLORS.navActive} />
                      </button>
                      <button onClick={() => { setEditingId(r.record_id); setFormClass(r.class); setFormSubject(r.subject); setFormTopic(r.topic); setFormSubTopic(r.sub_topic); setFormPrompt(r.prompt); setShowAddForm(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}>
                        <Edit2 size={18} color={COLORS.navActive} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* VIEW MODAL - CENTERED LARGE DIALOG */}
      {viewingRecord && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }} onClick={() => setViewingRecord(null)}>
          <div style={{
            background: COLORS.white,
            width: '95%',
            maxWidth: '1000px',
            height: '90vh',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '12px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            overflow: 'hidden'
          }} onClick={e => e.stopPropagation()}>
            {/* HEADER */}
            <div style={{ 
              padding: '20px 24px', 
              borderBottom: `1px solid ${COLORS.borderColor}`, 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              background: 'linear-gradient(135deg, #f5f6f8 0%, #ffffff 100%)'
            }}>
              <div>
                <h2 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: '700', color: COLORS.darkText }}>
                  {viewingRecord.topic}
                </h2>
                <p style={{ margin: 0, fontSize: '13px', color: COLORS.lightText }}>
                  Class {viewingRecord.class} • {viewingRecord.subject} • {viewingRecord.sub_topic || 'N/A'}
                </p>
              </div>
              <button 
                onClick={() => setViewingRecord(null)} 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  padding: '8px',
                  fontSize: '24px',
                  color: COLORS.lightText
                }}
              >
                ✕
              </button>
            </div>

            {/* CONTROLS */}
            <div style={{ 
              padding: '12px 24px', 
              borderBottom: `1px solid ${COLORS.borderColor}`, 
              display: 'flex', 
              gap: '16px',
              alignItems: 'center',
              background: COLORS.lightBg
            }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}>
                  <input type="radio" checked={viewMarkdown} onChange={() => setViewMarkdown(true)} />
                  <span>Markdown</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}>
                  <input type="radio" checked={!viewMarkdown} onChange={() => setViewMarkdown(false)} />
                  <span>HTML</span>
                </label>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: COLORS.lightText, fontWeight: '500' }}>
                  {viewingRecord.word_count || 0} words
                </span>
              </div>
            </div>

            {/* CONTENT */}
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              padding: '28px 32px',
              background: COLORS.white
            }}>
              {viewingRecord.ai_output ? (
                <>
                  {viewMarkdown ? (
                    <div style={{ 
                      fontSize: '14px', 
                      lineHeight: '1.8', 
                      color: COLORS.darkText, 
                      fontFamily: FONT_FAMILY, 
                      fontWeight: '400',
                      maxWidth: '800px'
                    }}>
                      {parseMarkdownToReact(viewingRecord.ai_output)}
                    </div>
                  ) : (
                    <div 
                      dangerouslySetInnerHTML={{ __html: viewingRecord.ai_output }} 
                      style={{ 
                        fontSize: '14px', 
                        lineHeight: '1.8', 
                        color: COLORS.darkText, 
                        fontFamily: FONT_FAMILY, 
                        fontWeight: '400',
                        maxWidth: '800px'
                      }} 
                    />
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', color: COLORS.lightText, padding: '60px 20px', fontSize: '16px' }}>
                  ⏳ No content generated yet. Please wait for Claude AI to generate the content.
                </div>
              )}
            </div>

            {/* FOOTER WITH ACTIONS */}
            {viewingRecord.ai_output && (
              <div style={{ 
                padding: '16px 24px', 
                borderTop: `1px solid ${COLORS.borderColor}`, 
                display: 'flex', 
                justifyContent: 'flex-end',
                gap: '12px',
                background: COLORS.lightBg
              }}>
                <button 
                  onClick={handleCopyContent} 
                  style={{ 
                    padding: '10px 18px', 
                    background: '#6366f1', 
                    color: COLORS.white, 
                    border: 'none', 
                    borderRadius: '6px', 
                    cursor: 'pointer', 
                    fontWeight: '500', 
                    fontSize: '13px', 
                    fontFamily: FONT_FAMILY, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#4f46e5'}
                  onMouseLeave={(e) => e.target.style.background = '#6366f1'}
                  title="Copy all content"
                > 
                  <Copy size={16} /> Copy
                </button>
                <button 
                  onClick={handleExportPDF} 
                  style={{ 
                    padding: '10px 18px', 
                    background: COLORS.navActive, 
                    color: COLORS.white, 
                    border: 'none', 
                    borderRadius: '6px', 
                    cursor: 'pointer', 
                    fontWeight: '500', 
                    fontSize: '13px', 
                    fontFamily: FONT_FAMILY, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                  onMouseLeave={(e) => e.target.style.opacity = '1'}
                >
                  <Download size={16} /> PDF
                </button>
                <button 
                  onClick={handleExportWord} 
                  style={{ 
                    padding: '10px 18px', 
                    background: COLORS.navActive, 
                    color: COLORS.white, 
                    border: 'none', 
                    borderRadius: '6px', 
                    cursor: 'pointer', 
                    fontWeight: '500', 
                    fontSize: '13px', 
                    fontFamily: FONT_FAMILY, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                  onMouseLeave={(e) => e.target.style.opacity = '1'}
                >
                  <Download size={16} /> Word
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PAGE SETTINGS PANEL */}
      {authPage === 'dashboard' && renderPageSettingsPanel()}
    </div>
  );
}
