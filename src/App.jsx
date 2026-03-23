import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  BookOpen, Plus, Download, RefreshCw, X, Eye, Edit2, LogOut, 
  Search, Filter, CheckCircle2, Clock, AlertCircle, LogIn, FileText
} from 'lucide-react';

const SUPABASE_URL = 'https://syacvhjmcgpgxvczassp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_tmoQwBjJYHyMnOSGAzts2w_v-aG0iYl';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const FONT_FAMILY = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export default function NEPDashboard() {
  const [session, setSession] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterClass, setFilterClass] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [searchTopic, setSearchTopic] = useState('');
  const [searchSubTopic, setSearchSubTopic] = useState('');
  const [topicInput, setTopicInput] = useState('');
  const [subTopicInput, setSubTopicInput] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [viewingRecord, setViewingRecord] = useState(null);

  const [formData, setFormData] = useState({
    class: '',
    subject: '',
    topic: '',
    sub_topic: '',
    prompt: '',
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchRecords();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (session) fetchRecords();
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('textbook_content')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      let filtered = data || [];

      if (filterStatus !== 'all') {
        filtered = filtered.filter((r) => r.status === filterStatus);
      }

      if (filterClass !== 'all') {
        filtered = filtered.filter((r) => r.class === filterClass);
      }

      if (filterSubject !== 'all') {
        filtered = filtered.filter((r) => r.subject === filterSubject);
      }

      if (searchTopic.trim()) {
        const searchLower = searchTopic.toLowerCase();
        filtered = filtered.filter((r) => r.topic?.toLowerCase().includes(searchLower));
      }

      if (searchSubTopic.trim()) {
        const searchLower = searchSubTopic.toLowerCase();
        filtered = filtered.filter((r) => r.sub_topic?.toLowerCase().includes(searchLower));
      }

      setRecords(filtered);
    } catch (error) {
      alert('Error fetching records: ' + error.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (session) {
      fetchRecords();
    }
  }, [filterStatus, filterClass, filterSubject, searchTopic, searchSubTopic]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      setEmail('');
      setPassword('');
    } catch (error) {
      alert('Login error: ' + error.message);
    }
    setLoading(false);
  };

  const handleGitHubLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    } catch (error) {
      alert('GitHub login error: ' + error.message);
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    } catch (error) {
      alert('Google login error: ' + error.message);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingId) {
        const { error } = await supabase
          .from('textbook_content')
          .update({ ...formData, status: 'pending' })
          .eq('record_id', editingId);

        if (error) throw error;
        setEditingId(null);
      } else {
        const { error } = await supabase
          .from('textbook_content')
          .insert([{ ...formData, status: 'pending' }]);

        if (error) throw error;
      }

      setFormData({ class: '', subject: '', topic: '', sub_topic: '', prompt: '' });
      setShowAddForm(false);
      fetchRecords();
    } catch (error) {
      alert('Error saving record: ' + error.message);
    }
    setLoading(false);
  };

  const handleEdit = (record) => {
    setEditingId(record.record_id);
    setFormData({
      class: record.class || '',
      subject: record.subject || '',
      topic: record.topic || '',
      sub_topic: record.sub_topic || '',
      prompt: record.prompt || '',
    });
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingId(null);
    setFormData({ class: '', subject: '', topic: '', sub_topic: '', prompt: '' });
  };

  const handleView = (record) => {
    console.log('View clicked for record:', record);
    setViewingRecord(record);
  };

  const handleCloseView = () => {
    setViewingRecord(null);
  };

  const handleClearFilters = () => {
    setFilterStatus('all');
    setFilterClass('all');
    setFilterSubject('all');
    setSearchTopic('');
    setSearchSubTopic('');
    setTopicInput('');
    setSubTopicInput('');
  };

  const handleExport = () => {
    if (records.length === 0) {
      alert('No records to export');
      return;
    }

    const headers = ['ID', 'Class', 'Subject', 'Topic', 'Sub-topic', 'Status', 'Word Count', 'Created At', 'AI Output'];
    const rows = records.map((r) => [
      r.record_id,
      r.class,
      r.subject,
      r.topic,
      r.sub_topic,
      r.status,
      r.word_count || 0,
      new Date(r.created_at).toLocaleDateString(),
      r.ai_output ? `"${r.ai_output.replace(/"/g, '""')}"` : '',
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `textbook_content_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (!session) {
    return (
      <div style={{ minHeight: '100vh', background: '#f0f4f8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT_FAMILY }}>
        <div style={{ background: 'white', padding: '50px', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', maxWidth: '420px', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'center' }}>
              <BookOpen size={48} color="#1a9b8e" strokeWidth={1.5} />
            </div>
            <h1 style={{ fontSize: '28px', margin: 0, color: '#0f3d3e', fontWeight: '700', letterSpacing: '-0.5px' }}>NEP Textbook</h1>
            <p style={{ fontSize: '14px', color: '#7a8d9f', margin: '8px 0 0 0' }}>Content Management System</p>
          </div>

          <div style={{ marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button onClick={handleGoogleLogin} disabled={loading} style={{ width: '100%', padding: '12px', background: '#fff', color: '#2d3748', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', opacity: loading ? 0.6 : 1, transition: 'all 0.2s ease' }} onMouseEnter={(e) => e.target.style.background = '#f7fafc'} onMouseLeave={(e) => e.target.style.background = '#fff'}>
              <LogIn size={16} />
              {loading ? 'Logging in...' : 'Login with Google'}
            </button>

            <button onClick={handleGitHubLogin} disabled={loading} style={{ width: '100%', padding: '12px', background: '#fff', color: '#2d3748', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', opacity: loading ? 0.6 : 1, transition: 'all 0.2s ease' }} onMouseEnter={(e) => e.target.style.background = '#f7fafc'} onMouseLeave={(e) => e.target.style.background = '#fff'}>
              <LogIn size={16} />
              {loading ? 'Logging in...' : 'Login with GitHub'}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', margin: '32px 0', gap: '12px' }}>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
            <span style={{ fontSize: '12px', color: '#a0aec0', fontWeight: '600', textTransform: 'uppercase' }}>Or</span>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#2d3748', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required style={{ width: '100%', padding: '11px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', fontFamily: FONT_FAMILY, transition: 'all 0.2s ease' }} onFocus={(e) => e.target.style.borderColor = '#1a9b8e'} onBlur={(e) => e.target.style.borderColor = '#e2e8f0'} />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#2d3748', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required style={{ width: '100%', padding: '11px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', fontFamily: FONT_FAMILY, transition: 'all 0.2s ease' }} onFocus={(e) => e.target.style.borderColor = '#1a9b8e'} onBlur={(e) => e.target.style.borderColor = '#e2e8f0'} />
            </div>

            <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: '#1a9b8e', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.8 : 1, transition: 'all 0.2s ease' }} onMouseEnter={(e) => !loading && (e.target.style.background = '#158d7f')} onMouseLeave={(e) => !loading && (e.target.style.background = '#1a9b8e')}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '12px', color: '#718096' }}>
            Secure authentication powered by Supabase
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', fontFamily: FONT_FAMILY }}>
      <div style={{ background: '#0f3d3e', color: 'white', padding: '25px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <BookOpen size={32} strokeWidth={1.5} />
            <div>
              <h1 style={{ margin: 0, fontSize: '26px', fontWeight: '700', letterSpacing: '-0.5px' }}>NEP Textbook Dashboard</h1>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', opacity: 0.85 }}>Content Management & Generation System</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', opacity: 0.9 }}>{session?.user?.email}</span>
            <button onClick={handleLogout} style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '30px 20px' }}>
        {/* Compact Filter Banner */}
        <div style={{ background: '#1a9b8e', borderRadius: '8px', padding: '12px 20px', marginBottom: '25px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          {/* Row 1: Add Record + Search */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setShowAddForm(!showAddForm)} style={{ padding: '10px 20px', background: 'white', color: '#1a9b8e', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
              {showAddForm ? <X size={16} /> : <Plus size={16} />}
              {showAddForm ? 'Cancel' : 'Add Record'}
            </button>

            <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#fff', pointerEvents: 'none', opacity: 0.7 }} />
              <input 
                type="text" 
                placeholder="Search..." 
                style={{ 
                  width: '100%', 
                  padding: '9px 12px 9px 35px', 
                  border: 'none', 
                  borderRadius: '6px', 
                  fontSize: '13px', 
                  fontFamily: FONT_FAMILY, 
                  boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.95)'
                }} 
              />
            </div>

            <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} style={{ padding: '9px 12px', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', background: 'white', fontFamily: FONT_FAMILY, minWidth: '110px' }}>
              <option value="all">All Classes</option>
              <option value="1">Class 1</option>
              <option value="2">Class 2</option>
              <option value="3">Class 3</option>
              <option value="4">Class 4</option>
              <option value="5">Class 5</option>
            </select>

            <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} style={{ padding: '9px 12px', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', background: 'white', fontFamily: FONT_FAMILY, minWidth: '120px' }}>
              <option value="all">All Subjects</option>
              <option value="English">English</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Science">Science</option>
              <option value="Social Studies">Social Studies</option>
              <option value="Hindi">Hindi</option>
              <option value="Arts">Arts</option>
              <option value="Physical Education">PE</option>
              <option value="Environmental Studies">EVS</option>
            </select>
          </div>

          {/* Row 2: Topic + Sub-topic + Status + Buttons */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input 
              type="text" 
              placeholder="Topic..." 
              value={topicInput} 
              onChange={(e) => { setTopicInput(e.target.value); setSearchTopic(e.target.value); }} 
              style={{ 
                padding: '9px 12px', 
                border: 'none', 
                borderRadius: '6px', 
                fontSize: '13px', 
                fontFamily: FONT_FAMILY, 
                minWidth: '130px',
                background: 'white'
              }} 
            />

            <input 
              type="text" 
              placeholder="Sub-topic..." 
              value={subTopicInput} 
              onChange={(e) => { setSubTopicInput(e.target.value); setSearchSubTopic(e.target.value); }} 
              style={{ 
                padding: '9px 12px', 
                border: 'none', 
                borderRadius: '6px', 
                fontSize: '13px', 
                fontFamily: FONT_FAMILY, 
                minWidth: '130px',
                background: 'white'
              }} 
            />

            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: '9px 12px', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', background: 'white', fontFamily: FONT_FAMILY, minWidth: '110px' }}>
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="generating">Generating</option>
              <option value="generated">Generated</option>
            </select>

            <button onClick={handleExport} style={{ padding: '9px 14px', background: 'white', color: '#1a9b8e', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
              <Download size={14} />
              Export
            </button>

            <button onClick={fetchRecords} style={{ padding: '9px 14px', background: 'white', color: '#1a9b8e', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
              <RefreshCw size={14} />
              Refresh
            </button>

            <button onClick={handleClearFilters} style={{ padding: '9px 14px', background: 'white', color: '#1a9b8e', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
              <X size={14} />
              Clear
            </button>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div style={{ background: 'white', padding: '25px', borderRadius: '12px', marginBottom: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2 style={{ marginTop: 0, fontSize: '18px', color: '#1a1a1a' }}>{editingId ? 'Edit Record' : 'Add New Record'}</h2>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#333' }}>Class</label>
                  <select value={formData.class} onChange={(e) => setFormData({ ...formData, class: e.target.value })} required style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', fontFamily: FONT_FAMILY }}>
                    <option value="">Select Class</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#333' }}>Subject</label>
                  <select value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} required style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', fontFamily: FONT_FAMILY }}>
                    <option value="">Select Subject</option>
                    <option value="English">English</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Science">Science</option>
                    <option value="Social Studies">Social Studies</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Arts">Arts</option>
                    <option value="Physical Education">Physical Education</option>
                    <option value="Environmental Studies">Environmental Studies</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#333' }}>Topic</label>
                  <input type="text" value={formData.topic} onChange={(e) => setFormData({ ...formData, topic: e.target.value })} placeholder="e.g., Numbers" required style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', fontFamily: FONT_FAMILY }} />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#333' }}>Sub-topic</label>
                  <input type="text" value={formData.sub_topic} onChange={(e) => setFormData({ ...formData, sub_topic: e.target.value })} placeholder="e.g., Place Value" required style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', fontFamily: FONT_FAMILY }} />
                </div>
              </div>

              <div style={{ marginTop: '15px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#333' }}>Prompt</label>
                <textarea value={formData.prompt} onChange={(e) => setFormData({ ...formData, prompt: e.target.value })} placeholder="Enter the prompt for Claude AI..." required rows="5" style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', fontFamily: FONT_FAMILY }} />
              </div>

              <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                <button type="submit" disabled={loading} style={{ padding: '10px 20px', background: '#1a9b8e', color: 'white', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '14px', opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Saving...' : 'Save Record'}
                </button>
                <button type="button" onClick={handleCancel} style={{ padding: '10px 20px', background: '#cbd5e0', color: '#2d3748', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Records Table */}
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '18px', color: '#1a1a1a', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileText size={20} color="#1a9b8e" />
              Records 
              <span style={{ fontSize: '14px', color: '#7a8d9f', fontWeight: '500' }}>
                ({records.length})
              </span>
            </h2>
          </div>

          {loading && <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Loading...</div>}

          {!loading && records.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>No records found. Create one to get started!</div>
          )}

          {!loading && records.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f5f7fa', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '15px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#333' }}>ID</th>
                    <th style={{ padding: '15px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#333' }}>Class</th>
                    <th style={{ padding: '15px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#333' }}>Subject</th>
                    <th style={{ padding: '15px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#333' }}>Topic</th>
                    <th style={{ padding: '15px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#333' }}>Status</th>
                    <th style={{ padding: '15px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#333' }}>Words</th>
                    <th style={{ padding: '15px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#333' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                      <td style={{ padding: '15px', fontSize: '13px', color: '#666' }}>{record.record_id}</td>
                      <td style={{ padding: '15px', fontSize: '13px', color: '#666' }}>{record.class}</td>
                      <td style={{ padding: '15px', fontSize: '13px', color: '#666' }}>{record.subject}</td>
                      <td style={{ padding: '15px', fontSize: '13px', color: '#666' }}>{record.topic}</td>
                      <td style={{ padding: '15px', fontSize: '13px' }}>
                        <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px', background: record.status === 'generated' ? '#d4edda' : record.status === 'generating' ? '#fff3cd' : '#e2e3e5', color: record.status === 'generated' ? '#155724' : record.status === 'generating' ? '#856404' : '#383d41' }}>
                          {record.status === 'generated' && <CheckCircle2 size={14} />}
                          {record.status === 'generating' && <Clock size={14} />}
                          {record.status === 'pending' && <AlertCircle size={14} />}
                          {record.status}
                        </span>
                      </td>
                      <td style={{ padding: '15px', fontSize: '13px', color: '#666' }}>{record.word_count || '-'}</td>
                      <td style={{ padding: '15px', fontSize: '13px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleView(record);
                            }} 
                            style={{ padding: '6px 12px', background: '#4299e1', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s ease' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#3182ce'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#4299e1'}
                          >
                            <Eye size={14} />
                            View
                          </button>
                          <button onClick={() => handleEdit(record)} style={{ padding: '6px 12px', background: '#1a9b8e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Edit2 size={14} />
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {viewingRecord && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px', overflowY: 'auto' }}>
          <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', maxWidth: '900px', width: '100%', maxHeight: '85vh', minHeight: '400px', display: 'flex', flexDirection: 'column', margin: 'auto' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <FileText size={24} color="#1a9b8e" />
                <div>
                  <h2 style={{ margin: 0, fontSize: '20px', color: '#1a1a1a' }}>AI-Generated Content</h2>
                  <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#7a8d9f' }}>
                    Class {viewingRecord.class} • {viewingRecord.subject} • {viewingRecord.topic}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={handleCloseView} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', padding: '8px', transition: 'color 0.2s ease' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#333'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#999'}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: '30px', fontFamily: 'Georgia, serif', lineHeight: '1.8', color: '#333', fontSize: '15px' }}>
              {viewingRecord.ai_output ? (
                <div style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                  {viewingRecord.ai_output}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
                  <Clock size={32} style={{ margin: '0 auto 15px', opacity: 0.5 }} />
                  <p style={{ fontSize: '16px', margin: '0 0 8px 0' }}>Content is being generated...</p>
                  <p style={{ fontSize: '13px', margin: 0 }}>Status: {viewingRecord.status}</p>
                </div>
              )}
            </div>

            <div style={{ padding: '20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ fontSize: '13px', color: '#666', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span>
                  <strong>{viewingRecord.word_count || 0} words</strong>
                </span>
                <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px', background: viewingRecord.status === 'generated' ? '#d4edda' : viewingRecord.status === 'generating' ? '#fff3cd' : '#e2e3e5', color: viewingRecord.status === 'generated' ? '#155724' : viewingRecord.status === 'generating' ? '#856404' : '#383d41' }}>
                  {viewingRecord.status === 'generated' && <CheckCircle2 size={12} />}
                  {viewingRecord.status === 'generating' && <Clock size={12} />}
                  {viewingRecord.status === 'pending' && <AlertCircle size={12} />}
                  {viewingRecord.status}
                </span>
              </div>
              <button 
                type="button"
                onClick={handleCloseView} 
                style={{ padding: '10px 20px', background: '#1a9b8e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s ease' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#158d7f'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#1a9b8e'}
              >
                <X size={16} />
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
