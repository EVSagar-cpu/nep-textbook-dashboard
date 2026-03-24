import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Menu, X, LogOut, Eye, Edit2, BookOpen, Plus, Download, RefreshCw,
  Mail, Check, AlertCircle, Copy, Users
} from 'lucide-react';

// ===== SUPABASE CLIENT =====
const supabaseUrl = 'https://syacvhjmcgpgxvczassp.supabase.co';
const supabaseKey = 'sb_publishable_tmoQwBjJYHyMnOSGAzts2w_v-aG0iYl';
const supabase = createClient(supabaseUrl, supabaseKey);

// ===== COLORS =====
const COLORS = {
  sidebarBg: '#f5f6f8',
  navActive: '#2563eb',
  navText: '#5a6978',
  navDisabled: '#cbd5e0',
  darkText: '#0f172a',
  lightText: '#6b7280',
  white: '#ffffff',
  lightBg: '#f9fafb',
  filterBg: '#f3f4f6',
  borderColor: '#e5e7eb',
  statusGenerated: '#10b981',
  statusGenerating: '#8b5cf6',
  statusPending: '#9ca3af',
  errorBg: '#fee2e2',
  errorBorder: '#fca5a5',
  errorText: '#dc2626',
  successBg: '#dcfce7',
  successBorder: '#86efac',
  successText: '#16a34a'
};

const FONT_FAMILY = '"Lexend", sans-serif';

export default function App() {
  // ===== AUTH & LAYOUT =====
  const [currentUser, setCurrentUser] = useState(null);
  const [authPage, setAuthPage] = useState('login'); // 'login', 'setup-password', 'invite-sent'
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);

  // ===== INVITE SYSTEM =====
  const [showInvitePanel, setShowInvitePanel] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');
  const [pendingInvites, setPendingInvites] = useState([]);

  // ===== PASSWORD SETUP =====
  const [setupPassword, setSetupPassword] = useState('');
  const [setupPasswordConfirm, setSetupPasswordConfirm] = useState('');
  const [setupToken, setSetupToken] = useState('');
  const [setupError, setSetupError] = useState('');
  const [setupLoading, setSetupLoading] = useState(false);

  // ===== LOGIN =====
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // ===== RECORDS & FILTERS =====
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [filterClass, setFilterClass] = useState('All Classes');
  const [filterSubject, setFilterSubject] = useState('All Subjects');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [filterTopic, setFilterTopic] = useState('');
  const [filterSubTopic, setFilterSubTopic] = useState('');
  const [loading, setLoading] = useState(false);

  // ===== FORM DATA =====
  const [formData, setFormData] = useState({
    class: '1',
    subject: 'English',
    topic: '',
    sub_topic: '',
    prompt: ''
  });

  // ===== VIEW MODAL =====
  const [viewMarkdown, setViewMarkdown] = useState(true);

  // ===== SUBJECTS =====
  const subjects = [
    'English', 'Mathematics', 'Science', 'Social Studies', 'Social Science',
    'मधुबन सरल-SL', 'तरंग-TL', 'Arts', 'Physical Education',
    'Environmental Studies', 'General Knowledge', 'Computers'
  ];

  // ===== LOAD FONT & LIBS =====
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Load html2pdf from CDN
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    document.head.appendChild(script);
  }, []);

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
      // Fetch user role
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

  // ===== LOGIN =====
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword
      });

      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      
      // Fetch user role
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
      setLoginError(err.message || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
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

    setSetupLoading(true);

    try {
      // Verify invite token in invites table
      const { data: inviteData, error: inviteError } = await supabase
        .from('invites')
        .select('*')
        .eq('token', setupToken)
        .eq('status', 'pending')
        .single();

      if (inviteError || !inviteData) {
        throw new Error('Invalid or expired invite link');
      }

      const invitedEmail = inviteData.email;

      // Create user with email
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: invitedEmail,
        password: setupPassword,
        options: { emailRedirectTo: window.location.origin }
      });

      if (signUpError) throw signUpError;

      const userId = signUpData.user.id;

      // Add role to user_roles table
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert([{ user_id: userId, role: 'content_developer' }]);

      if (roleError) throw roleError;

      // Mark invite as accepted
      await supabase
        .from('invites')
        .update({ status: 'accepted', accepted_at: new Date() })
        .eq('token', setupToken);

      // Auto login
      await supabase.auth.signInWithPassword({
        email: invitedEmail,
        password: setupPassword
      });

      const { data: { user } } = await supabase.auth.getUser();
      
      // Fetch user role
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
      setSetupError(err.message || 'Setup failed');
    } finally {
      setSetupLoading(false);
    }
  };

  // ===== SEND INVITE =====
  const handleSendInvite = async (e) => {
    e.preventDefault();
    setInviteMessage('');
    setInviteSending(true);

    try {
      // Generate token
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

      // Store invite in database
      const { error } = await supabase
        .from('invites')
        .insert([{
          email: inviteEmail,
          token: token,
          status: 'pending',
          invited_by: currentUser.id,
          created_at: new Date()
        }]);

      if (error) throw error;

      const inviteLink = `${window.location.origin}#invite_token=${token}`;

      // In real app, send email. For now, show link
      setInviteMessage(`✅ Invite created! Share this link:\n\n${inviteLink}`);
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
    try {
      const { data } = await supabase
        .from('invites')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      setPendingInvites(data || []);
    } catch (err) {
      console.error('Error fetching invites:', err);
    }
  };

  // ===== LOGOUT =====
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setAuthPage('login');
    setLoginEmail('');
    setLoginPassword('');
    setRecords([]);
    setFilteredRecords([]);
  };

  // ===== FETCH RECORDS =====
  const fetchRecords = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('textbook_content')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
      applyFilters(data || []);
    } catch (err) {
      console.error('Error fetching records:', err);
    } finally {
      setLoading(false);
    }
  };

  // ===== APPLY FILTERS =====
  const applyFilters = (data) => {
    let filtered = data;

    if (filterClass !== 'All Classes') {
      filtered = filtered.filter(r => r.class === filterClass);
    }

    if (filterSubject !== 'All Subjects') {
      filtered = filtered.filter(r => r.subject === filterSubject);
    }

    if (filterStatus !== 'All Status') {
      filtered = filtered.filter(r => r.status === filterStatus);
    }

    if (filterTopic) {
      filtered = filtered.filter(r => r.topic.toLowerCase().includes(filterTopic.toLowerCase()));
    }

    if (filterSubTopic) {
      filtered = filtered.filter(r => r.sub_topic.toLowerCase().includes(filterSubTopic.toLowerCase()));
    }

    setFilteredRecords(filtered);
  };

  useEffect(() => {
    applyFilters(records);
  }, [filterClass, filterSubject, filterStatus, filterTopic, filterSubTopic]);

  // ===== ADD/UPDATE RECORD =====
  const handleSaveRecord = async () => {
    if (!formData.topic.trim()) {
      alert('Topic is required');
      return;
    }

    try {
      if (editingRecord) {
        // Update
        const { error } = await supabase
          .from('textbook_content')
          .update({
            class: formData.class,
            subject: formData.subject,
            topic: formData.topic,
            sub_topic: formData.sub_topic,
            prompt: formData.prompt,
            status: formData.prompt ? 'generating' : 'pending',
            updated_at: new Date()
          })
          .eq('record_id', editingRecord.record_id);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('textbook_content')
          .insert([{
            class: formData.class,
            subject: formData.subject,
            topic: formData.topic,
            sub_topic: formData.sub_topic,
            prompt: formData.prompt,
            status: formData.prompt ? 'generating' : 'pending',
            ai_output: '',
            word_count: 0,
            updated_at: new Date()
          }]);

        if (error) throw error;
      }

      setFormData({ class: '1', subject: 'English', topic: '', sub_topic: '', prompt: '' });
      setShowAddForm(false);
      setEditingRecord(null);
      fetchRecords();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // ===== EXPORT PDF =====
  const handleExportPDF = () => {
    if (!viewingRecord || !viewingRecord.ai_output) return;

    try {
      const markdownContent = viewingRecord.ai_output;
      let contentHtml = markdownContent;

      if (viewMarkdown) {
        // Convert markdown to HTML
        contentHtml = markdownContent
          .replace(/^### (.*?)$/gm, '<h3 style="font-size:18px;margin:12px 0 8px 0;font-weight:600;">$1</h3>')
          .replace(/^## (.*?)$/gm, '<h2 style="font-size:22px;margin:16px 0 10px 0;font-weight:600;">$1</h2>')
          .replace(/^# (.*?)$/gm, '<h1 style="font-size:28px;margin:20px 0 12px 0;font-weight:700;">$1</h1>')
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/^- (.*?)$/gm, '<li style="margin-left:24px;">$1</li>')
          .replace(/(?:<li.*?<\/li>)/s, (match) => `<ul style="margin:8px 0;">${match}</ul>`)
          .replace(/^> (.*?)$/gm, '<blockquote style="border-left:4px solid #2563eb;padding-left:12px;margin:12px 0;background:#f0f9ff;padding:12px;">$1</blockquote>')
          .replace(/`(.*?)`/g, '<code style="background:#f3f4f6;padding:2px 6px;border-radius:3px;">$1</code>')
          .replace(/```(.*?)```/gs, '<pre style="background:#f3f4f6;padding:12px;border-radius:6px;overflow-x:auto;"><code>$1</code></pre>');
      }

      const element = document.createElement('div');
      element.innerHTML = `
        <div style="font-family: Lexend, sans-serif; padding: 20px; color: #0f172a;">
          <h1 style="font-size: 28px; margin-bottom: 8px;">${viewingRecord.topic}</h1>
          <p style="color: #6b7280; margin-bottom: 20px;">Class ${viewingRecord.class} | ${viewingRecord.subject}</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <div style="line-height: 1.8; font-size: 14px;">${contentHtml}</div>
        </div>
      `;

      if (window.html2pdf) {
        window.html2pdf().set({ margin: 10, filename: `${viewingRecord.topic}.pdf` }).save(element);
      } else {
        alert('PDF library not loaded. Please try again.');
      }
    } catch (err) {
      alert('PDF export failed: ' + err.message);
    }
  };

  // ===== EXPORT WORD =====
  const handleExportWord = () => {
    if (!viewingRecord || !viewingRecord.ai_output) return;

    try {
      let contentText = viewingRecord.ai_output;
      if (!viewMarkdown) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = viewingRecord.ai_output;
        contentText = tempDiv.textContent || '';
      }

      const docContent = `${viewingRecord.topic}\nClass ${viewingRecord.class} | ${viewingRecord.subject}\n\n${contentText}`;
      const blob = new Blob([docContent], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${viewingRecord.topic}.doc`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Word export failed: ' + err.message);
    }
  };

  // ===== HANDLE EDIT =====
  const handleEdit = (record) => {
    setEditingRecord(record);
    setFormData({
      class: record.class,
      subject: record.subject,
      topic: record.topic,
      sub_topic: record.sub_topic,
      prompt: record.prompt
    });
    setShowAddForm(true);
    setViewingRecord(null);
  };

  // ===== CLEAR FILTERS =====
  const handleClearFilters = () => {
    setFilterClass('All Classes');
    setFilterSubject('All Subjects');
    setFilterStatus('All Status');
    setFilterTopic('');
    setFilterSubTopic('');
  };

  // ===== HANDLE EXPORT =====
  const handleExport = async () => {
    try {
      const csv = [
        ['ID', 'CLASS', 'SUBJECT', 'TOPIC', 'SUB-TOPIC', 'STATUS', 'WORDS'],
        ...filteredRecords.map(r => [
          r.record_id,
          r.class,
          r.subject,
          r.topic,
          r.sub_topic,
          r.status,
          r.word_count || 0
        ])
      ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'textbooks.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Export failed: ' + err.message);
    }
  };

  // ===== LOGIN PAGE =====
  if (authPage === 'login') {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${COLORS.navActive} 0%, #764ba2 100%)`,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: FONT_FAMILY,
        padding: '20px'
      }}>
        <div style={{
          background: COLORS.white,
          borderRadius: '12px',
          padding: '40px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          maxWidth: '400px',
          width: '100%'
        }}>
          <h1 style={{ textAlign: 'center', fontSize: '28px', fontWeight: '700', marginBottom: '30px', color: COLORS.darkText }}>
            AI Content Studio
          </h1>

          {loginError && (
            <div style={{ background: COLORS.errorBg, border: `1px solid ${COLORS.errorBorder}`, padding: '12px', borderRadius: '6px', marginBottom: '20px', color: COLORS.errorText, fontSize: '14px' }}>
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: COLORS.darkText, marginBottom: '6px', textTransform: 'uppercase' }}>Email Address</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${COLORS.borderColor}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: FONT_FAMILY,
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: COLORS.darkText, marginBottom: '6px', textTransform: 'uppercase' }}>Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${COLORS.borderColor}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: FONT_FAMILY,
                  boxSizing: 'border-box'
                }}
              />
            </div>

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
                fontWeight: '500',
                fontSize: '14px',
                opacity: loginLoading ? 0.7 : 1,
                fontFamily: FONT_FAMILY
              }}
            >
              {loginLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p style={{ margin: '20px 0 10px 0', fontSize: '12px', fontWeight: '500', color: COLORS.darkText }}>📋 Demo Credentials:</p>
          <p style={{ margin: '0', fontSize: '12px', color: COLORS.lightText }}>Email: demo@example.com</p>
          <p style={{ margin: '0', fontSize: '12px', color: COLORS.lightText }}>Password: demo123456</p>
        </div>
      </div>
    );
  }

  // ===== PASSWORD SETUP PAGE =====
  if (authPage === 'setup-password') {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${COLORS.navActive} 0%, #764ba2 100%)`,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: FONT_FAMILY,
        padding: '20px'
      }}>
        <div style={{
          background: COLORS.white,
          borderRadius: '12px',
          padding: '40px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          maxWidth: '400px',
          width: '100%'
        }}>
          <h1 style={{ textAlign: 'center', fontSize: '28px', fontWeight: '700', marginBottom: '10px', color: COLORS.darkText }}>
            Setup Your Password
          </h1>
          <p style={{ textAlign: 'center', fontSize: '14px', color: COLORS.lightText, marginBottom: '30px' }}>
            Complete your account setup to get started
          </p>

          {setupError && (
            <div style={{ background: COLORS.errorBg, border: `1px solid ${COLORS.errorBorder}`, padding: '12px', borderRadius: '6px', marginBottom: '20px', color: COLORS.errorText, fontSize: '14px' }}>
              {setupError}
            </div>
          )}

          <form onSubmit={handleSetupPassword}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: COLORS.darkText, marginBottom: '6px', textTransform: 'uppercase' }}>Password</label>
              <input
                type="password"
                value={setupPassword}
                onChange={(e) => setSetupPassword(e.target.value)}
                required
                minLength="6"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${COLORS.borderColor}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: FONT_FAMILY,
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: COLORS.darkText, marginBottom: '6px', textTransform: 'uppercase' }}>Confirm Password</label>
              <input
                type="password"
                value={setupPasswordConfirm}
                onChange={(e) => setSetupPasswordConfirm(e.target.value)}
                required
                minLength="6"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${COLORS.borderColor}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: FONT_FAMILY,
                  boxSizing: 'border-box'
                }}
              />
            </div>

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
                fontWeight: '500',
                fontSize: '14px',
                opacity: setupLoading ? 0.7 : 1,
                fontFamily: FONT_FAMILY
              }}
            >
              {setupLoading ? 'Setting up...' : 'Complete Setup'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ===== MAIN DASHBOARD =====
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: COLORS.lightBg, fontFamily: FONT_FAMILY, color: COLORS.darkText }}>
      {/* SIDEBAR */}
      <div style={{
        width: sidebarOpen ? '280px' : '80px',
        background: COLORS.sidebarBg,
        padding: '20px',
        transition: 'width 0.3s',
        borderRight: `1px solid ${COLORS.borderColor}`,
        overflowY: 'auto'
      }}>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', marginBottom: '20px' }}>
          {sidebarOpen ? <X size={24} color={COLORS.navText} /> : <Menu size={24} color={COLORS.navText} />}
        </button>

        {sidebarOpen && <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: COLORS.darkText, whiteSpace: 'nowrap' }}>Academic Curator</h3>}

        <nav style={{ marginTop: '30px' }}>
          {[
            { icon: <BookOpen size={20} />, label: 'Textbooks', action: 'textbooks', disabled: false },
            { icon: <Users size={20} />, label: 'Manage Users', action: 'manage-users', disabled: true },
            { icon: <Mail size={20} />, label: 'Invites', action: 'invites', disabled: false }
          ].map((item, i) => (
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
                fontWeight: item.action === 'textbooks' ? '600' : '500',
                opacity: item.disabled ? 0.5 : 1
              }}
            >
              {item.icon}
              {sidebarOpen && <span style={{ fontSize: '14px', fontWeight: item.action === 'textbooks' ? '600' : '500', whiteSpace: 'nowrap' }}>{item.label}</span>}
            </button>
          ))}
        </nav>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* HEADER */}
        <div style={{
          background: COLORS.white,
          borderBottom: `1px solid ${COLORS.borderColor}`,
          padding: '20px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ flex: 1 }}></div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: COLORS.darkText }}>AI Content Studio</h1>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '16px', alignItems: 'center' }}>
            <div style={{ textAlign: 'right', marginRight: '16px' }}>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: COLORS.darkText }}>{currentUser?.email}</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '11px', fontWeight: '500', color: COLORS.lightText }}>Role: {currentUser?.user_metadata?.role || 'Loading...'}</p>
            </div>
            <button
              onClick={handleLogout}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500',
                color: COLORS.lightText,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
          {/* INVITE PANEL */}
          {showInvitePanel && (
            <div style={{ background: COLORS.white, borderRadius: '12px', padding: '24px', marginBottom: '30px', border: `1px solid ${COLORS.borderColor}` }}>
              <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '700', color: COLORS.darkText }}>Send Invite</h2>

              <form onSubmit={handleSendInvite} style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
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
                </div>
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

          {/* PAGE TITLE */}
          <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: '700', color: COLORS.darkText }}>Textbooks</h1>
          <p style={{ margin: '0 0 24px 0', color: COLORS.lightText, fontSize: '14px' }}>Manage and curate AI-generated curriculum materials.</p>

          {/* ACTION BUTTONS */}
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

          {/* FILTERS */}
          <div style={{ background: COLORS.white, borderRadius: '12px', padding: '20px', marginBottom: '24px', border: `1px solid ${COLORS.borderColor}` }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: COLORS.darkText, marginBottom: '6px', textTransform: 'uppercase' }}>CLASS</label>
                <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} style={{ width: '100%', padding: '10px', border: `1px solid ${COLORS.borderColor}`, borderRadius: '6px', fontSize: '14px', fontFamily: FONT_FAMILY, background: COLORS.white }}>
                  {['All Classes', '1', '2', '3', '4', '5'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: COLORS.darkText, marginBottom: '6px', textTransform: 'uppercase' }}>SUBJECT</label>
                <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} style={{ width: '100%', padding: '10px', border: `1px solid ${COLORS.borderColor}`, borderRadius: '6px', fontSize: '14px', fontFamily: FONT_FAMILY, background: COLORS.white }}>
                  {['All Subjects', ...subjects].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: COLORS.darkText, marginBottom: '6px', textTransform: 'uppercase' }}>STATUS</label>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ width: '100%', padding: '10px', border: `1px solid ${COLORS.borderColor}`, borderRadius: '6px', fontSize: '14px', fontFamily: FONT_FAMILY, background: COLORS.white }}>
                  {['All Status', 'pending', 'generating', 'generated'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: COLORS.darkText, marginBottom: '6px', textTransform: 'uppercase' }}>TOPIC</label>
                <input type="text" value={filterTopic} onChange={(e) => setFilterTopic(e.target.value)} placeholder="Search topic..." style={{ width: '100%', padding: '10px', border: `1px solid ${COLORS.borderColor}`, borderRadius: '6px', fontSize: '14px', fontFamily: FONT_FAMILY }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: COLORS.darkText, marginBottom: '6px', textTransform: 'uppercase' }}>SUB-TOPIC</label>
                <input type="text" value={filterSubTopic} onChange={(e) => setFilterSubTopic(e.target.value)} placeholder="Search sub-topic..." style={{ width: '100%', padding: '10px', border: `1px solid ${COLORS.borderColor}`, borderRadius: '6px', fontSize: '14px', fontFamily: FONT_FAMILY }} />
              </div>
            </div>
          </div>

          {/* ADD/EDIT FORM */}
          {showAddForm && (
            <div style={{ position: 'fixed', right: 0, top: 0, height: '100vh', width: '500px', background: COLORS.white, borderLeft: `1px solid ${COLORS.borderColor}`, padding: '30px', overflowY: 'auto', boxShadow: '-10px 0 30px rgba(0,0,0,0.1)', zIndex: 1000 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: COLORS.darkText }}>{editingRecord ? 'Edit Record' : 'Add Record'}</h2>
                <button onClick={() => { setShowAddForm(false); setEditingRecord(null); setFormData({ class: '1', subject: 'English', topic: '', sub_topic: '', prompt: '' }); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}>×</button>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: COLORS.darkText, marginBottom: '6px', textTransform: 'uppercase' }}>CLASS</label>
                <select value={formData.class} onChange={(e) => setFormData({ ...formData, class: e.target.value })} style={{ width: '100%', padding: '10px', border: `1px solid ${COLORS.borderColor}`, borderRadius: '6px', fontSize: '14px', fontFamily: FONT_FAMILY, background: COLORS.white }}>
                  {['1', '2', '3', '4', '5'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: COLORS.darkText, marginBottom: '6px', textTransform: 'uppercase' }}>SUBJECT</label>
                <select value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} style={{ width: '100%', padding: '10px', border: `1px solid ${COLORS.borderColor}`, borderRadius: '6px', fontSize: '14px', fontFamily: FONT_FAMILY, background: COLORS.white }}>
                  {subjects.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: COLORS.darkText, marginBottom: '6px', textTransform: 'uppercase' }}>TOPIC</label>
                <input type="text" value={formData.topic} onChange={(e) => setFormData({ ...formData, topic: e.target.value })} placeholder="Enter topic..." required style={{ width: '100%', padding: '10px', border: `1px solid ${COLORS.borderColor}`, borderRadius: '6px', fontSize: '14px', fontFamily: FONT_FAMILY, boxSizing: 'border-box' }} />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: COLORS.darkText, marginBottom: '6px', textTransform: 'uppercase' }}>SUB-TOPIC</label>
                <input type="text" value={formData.sub_topic} onChange={(e) => setFormData({ ...formData, sub_topic: e.target.value })} placeholder="Enter sub-topic..." style={{ width: '100%', padding: '10px', border: `1px solid ${COLORS.borderColor}`, borderRadius: '6px', fontSize: '14px', fontFamily: FONT_FAMILY, boxSizing: 'border-box' }} />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: COLORS.darkText, marginBottom: '8px', textTransform: 'uppercase' }}>AI PROMPT <span style={{ fontSize: '12px', color: COLORS.lightText, fontWeight: '400' }}>Max 20000 characters</span></label>
                <textarea value={formData.prompt} onChange={(e) => setFormData({ ...formData, prompt: e.target.value.slice(0, 20000) })} placeholder="Enter detailed prompt for Claude..." required rows="6" style={{ width: '100%', padding: '12px', border: `1px solid ${COLORS.borderColor}`, borderRadius: '6px', fontSize: '14px', background: COLORS.white, fontFamily: FONT_FAMILY, resize: 'vertical', minHeight: '140px', boxSizing: 'border-box' }} />
                <div style={{ fontSize: '12px', color: COLORS.lightText, marginTop: '6px' }}>{formData.prompt.length}/20000 characters</div>
              </div>

              <div style={{ background: '#f0f9ff', border: `1px solid #bfdbfe`, padding: '12px', borderRadius: '6px', marginBottom: '20px' }}>
                <p style={{ margin: '0', fontSize: '12px', color: '#1e40af', fontWeight: '500' }}>⚡ Claude AI Ready</p>
                <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#1e40af' }}>Your prompt will be sent to Claude when you save.</p>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => { setShowAddForm(false); setEditingRecord(null); setFormData({ class: '1', subject: 'English', topic: '', sub_topic: '', prompt: '' }); }} style={{ flex: 1, padding: '10px', border: `1px solid ${COLORS.borderColor}`, background: COLORS.white, borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '14px', fontFamily: FONT_FAMILY }}>Cancel</button>
                <button onClick={handleSaveRecord} style={{ flex: 1, padding: '10px', background: COLORS.navActive, color: COLORS.white, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '14px', fontFamily: FONT_FAMILY }}>⚡ Save & Generate</button>
              </div>
            </div>
          )}

          {/* RECORDS TABLE */}
          <div style={{ background: COLORS.white, borderRadius: '12px', border: `1px solid ${COLORS.borderColor}`, overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: COLORS.lightText }}>Loading...</div>
            ) : filteredRecords.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: COLORS.lightText }}>No records found. Create one to get started!</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: COLORS.filterBg, borderBottom: `1px solid ${COLORS.borderColor}` }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: COLORS.darkText, textTransform: 'uppercase' }}>ID</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: COLORS.darkText, textTransform: 'uppercase' }}>CLASS</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: COLORS.darkText, textTransform: 'uppercase' }}>SUBJECT</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: COLORS.darkText, textTransform: 'uppercase' }}>TOPIC</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: COLORS.darkText, textTransform: 'uppercase' }}>STATUS</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: COLORS.darkText, textTransform: 'uppercase' }}>WORDS</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: COLORS.darkText, textTransform: 'uppercase' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record, idx) => (
                    <tr key={idx} style={{ borderBottom: `1px solid ${COLORS.borderColor}` }}>
                      <td style={{ padding: '12px', fontSize: '13px', fontWeight: '500', color: COLORS.darkText }}>Class {record.class}</td>
                      <td style={{ padding: '12px', fontSize: '13px', color: COLORS.darkText }}>{record.subject}</td>
                      <td style={{ padding: '12px', fontSize: '13px', color: COLORS.darkText }}>{record.topic}</td>
                      <td style={{ padding: '12px', fontSize: '13px', color: COLORS.darkText }}>{record.sub_topic || '-'}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          background: record.status === 'generated' ? COLORS.statusGenerated : record.status === 'generating' ? COLORS.statusGenerating : COLORS.statusPending,
                          color: COLORS.white
                        }}>
                          {record.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px', color: COLORS.lightText }}>{record.word_count || 0}</td>
                      <td style={{ padding: '12px', fontSize: '13px' }}>
                        <button onClick={() => setViewingRecord(record)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.navActive, fontSize: '16px', marginRight: '12px' }}>👁</button>
                        <button onClick={() => handleEdit(record)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.navActive, fontSize: '16px' }}>✏</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* VIEW MODAL */}
      {viewingRecord && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '20px' }}>
          <div style={{ background: COLORS.white, borderRadius: '12px', maxWidth: '900px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '24px', borderBottom: `1px solid ${COLORS.borderColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: COLORS.darkText }}>{viewingRecord.topic}</h2>
              <button onClick={() => setViewingRecord(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px', color: COLORS.lightText }}>×</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              {viewingRecord.ai_output ? (
                <>
                  <div style={{ marginBottom: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <label style={{ fontSize: '12px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input type="radio" checked={viewMarkdown} onChange={() => setViewMarkdown(true)} />
                      Markdown
                    </label>
                    <label style={{ fontSize: '12px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input type="radio" checked={!viewMarkdown} onChange={() => setViewMarkdown(false)} />
                      HTML
                    </label>
                  </div>

                  {viewMarkdown ? (
                    <div style={{ fontSize: '14px', lineHeight: '1.8', color: COLORS.darkText, fontFamily: FONT_FAMILY, fontWeight: '400' }}>
                      {viewingRecord.ai_output.split('\n').map((line, i) => {
                        if (line.startsWith('###')) return <h3 key={i} style={{ fontSize: '18px', margin: '12px 0 8px 0', fontWeight: '600' }}>{line.replace('### ', '')}</h3>;
                        if (line.startsWith('##')) return <h2 key={i} style={{ fontSize: '22px', margin: '16px 0 10px 0', fontWeight: '600' }}>{line.replace('## ', '')}</h2>;
                        if (line.startsWith('#')) return <h1 key={i} style={{ fontSize: '28px', margin: '20px 0 12px 0', fontWeight: '700' }}>{line.replace('# ', '')}</h1>;
                        if (line.startsWith('-')) return <li key={i} style={{ marginLeft: '24px', marginBottom: '4px' }}>{line.replace('- ', '')}</li>;
                        if (line.startsWith('>')) return <blockquote key={i} style={{ borderLeft: `4px solid ${COLORS.navActive}`, paddingLeft: '12px', margin: '12px 0', background: '#f0f9ff', padding: '12px' }}>{line.replace('> ', '')}</blockquote>;
                        return line.trim() ? <p key={i} style={{ margin: '8px 0' }}>{line}</p> : <div key={i} style={{ height: '8px' }} />;
                      })}
                    </div>
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: viewingRecord.ai_output }} style={{ fontSize: '14px', lineHeight: '1.8', color: COLORS.darkText, fontFamily: FONT_FAMILY, fontWeight: '400' }} />
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', color: COLORS.lightText, padding: '40px' }}>No content generated yet.</div>
              )}
            </div>

            {viewingRecord.ai_output && (
              <div style={{ padding: '16px', borderTop: `1px solid ${COLORS.borderColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: COLORS.lightText }}>{viewingRecord.word_count || 0} words • Format: {viewMarkdown ? 'Markdown' : 'HTML'}</span>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={handleExportPDF} style={{ padding: '8px 16px', background: COLORS.navActive, color: COLORS.white, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '13px', fontFamily: FONT_FAMILY }}>📄 PDF</button>
                  <button onClick={handleExportWord} style={{ padding: '8px 16px', background: COLORS.navActive, color: COLORS.white, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '13px', fontFamily: FONT_FAMILY }}>📝 Word</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
