import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  BookOpen, Plus, Download, RefreshCw, X, Eye, Edit2, LogOut, Menu, ChevronDown,
  CheckCircle2, Clock, AlertCircle, FileText, Home, HelpCircle, LogIn
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const SUPABASE_URL = 'https://syacvhjmcgpgxvczassp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_tmoQwBjJYHyMnOSGAzts2w_v-aG0iYl';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Lexend font
const FONT_FAMILY = 'Lexend, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

// Color scheme matching design
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
};

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [contentType, setContentType] = useState('markdown');

  const [filterClass, setFilterClass] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTopic, setSearchTopic] = useState('');
  const [searchSubTopic, setSearchSubTopic] = useState('');
  const [topicInput, setTopicInput] = useState('');
  const [subTopicInput, setSubTopicInput] = useState('');

  const [formData, setFormData] = useState({
    class: '',
    subject: '',
    topic: '',
    sub_topic: '',
    prompt: '',
    ai_model: 'claude-sonnet-4-20250514',
  });

  // Load Lexend font
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Lexend:wght@400;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

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
      let query = supabase.from('textbook_content').select('*');

      if (filterClass !== 'all') query = query.eq('class', filterClass);
      if (filterSubject !== 'all') query = query.eq('subject', filterSubject);
      if (filterStatus !== 'all') query = query.eq('status', filterStatus);
      if (searchTopic) query = query.ilike('topic', `%${searchTopic}%`);
      if (searchSubTopic) query = query.ilike('sub_topic', `%${searchSubTopic}%`);

      const { data, error } = await query.order('record_id', { ascending: false });
      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      alert('Error fetching records: ' + error.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (session) fetchRecords();
  }, [filterClass, filterSubject, filterStatus, searchTopic, searchSubTopic]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingId) {
        const { error } = await supabase
          .from('textbook_content')
          .update({ ...formData, status: 'generating' })
          .eq('record_id', editingId);
        if (error) throw error;
        setEditingId(null);
      } else {
        const { error } = await supabase
          .from('textbook_content')
          .insert([{ ...formData, status: 'generating' }]);
        if (error) throw error;
      }

      setFormData({ class: '', subject: '', topic: '', sub_topic: '', prompt: '', ai_model: 'claude-sonnet-4-20250514' });
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
      ai_model: record.ai_model || 'claude-sonnet-4-20250514',
    });
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingId(null);
    setFormData({ class: '', subject: '', topic: '', sub_topic: '', prompt: '', ai_model: 'claude-sonnet-4-20250514' });
  };

  const handleView = (record) => {
    setViewingRecord(record);
  };

  const handleCloseView = () => {
    setViewingRecord(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  const handleClearFilters = () => {
    setFilterClass('all');
    setFilterSubject('all');
    setFilterStatus('all');
    setSearchTopic('');
    setSearchSubTopic('');
    setTopicInput('');
    setSubTopicInput('');
  };

  const handleExport = () => {
    const csv = [
      ['ID', 'Class', 'Subject', 'Topic', 'Sub-Topic', 'Status', 'Words'],
      ...records.map(r => [r.record_id, r.class, r.subject, r.topic, r.sub_topic, r.status, r.word_count || 0])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'textbooks_export.csv';
    a.click();
  };

  if (!session) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: COLORS.filterBg, fontFamily: FONT_FAMILY }}>
        <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })} style={{ padding: '12px 24px', background: COLORS.navActive, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LogIn size={20} /> Sign In with Google
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: FONT_FAMILY, background: COLORS.white }}>
      {/* Sidebar */}
      <div style={{ 
        width: sidebarOpen ? '280px' : '80px',
        background: COLORS.sidebarBg,
        borderRight: `1px solid ${COLORS.borderColor}`,
        transition: 'width 0.3s',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <BookOpen size={24} color={COLORS.navActive} style={{ minWidth: '24px' }} />
          {sidebarOpen && <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: COLORS.darkText, whiteSpace: 'nowrap' }}>Academic Curator</h3>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <Menu size={20} color={COLORS.navText} />
          </button>
        </div>

        <nav style={{ flex: 1 }}>
          {[
            { icon: <BookOpen size={20} />, label: 'Textbooks', active: true, disabled: false },
            { icon: <FileText size={20} />, label: 'Lesson Plan', active: false, disabled: true },
            { icon: <CheckCircle2 size={20} />, label: 'Practice Questions', active: false, disabled: true },
            { icon: <ClipboardList size={20} />, label: 'Test', active: false, disabled: true },
            { icon: <Lightbulb size={20} />, label: 'Projects', active: false, disabled: true },
          ].map((item, idx) => (
            <div key={idx} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              marginBottom: '8px',
              borderRadius: '8px',
              background: item.active ? `${COLORS.navActive}15` : 'transparent',
              cursor: item.disabled ? 'not-allowed' : 'pointer',
              color: item.active ? COLORS.navActive : item.disabled ? COLORS.navDisabled : COLORS.navText,
              opacity: item.disabled ? 0.5 : 1,
            }}>
              {React.cloneElement(item.icon, { size: 20, color: item.active ? COLORS.navActive : item.disabled ? COLORS.navDisabled : COLORS.navText })}
              {sidebarOpen && <span style={{ fontSize: '14px', fontWeight: item.active ? '600' : '500', whiteSpace: 'nowrap' }}>{item.label}</span>}
            </div>
          ))}
        </nav>

        <div style={{ borderTop: `1px solid ${COLORS.borderColor}`, paddingTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', marginBottom: '8px', borderRadius: '8px', cursor: 'pointer' }}>
            <HelpCircle size={20} color={COLORS.navText} />
            {sidebarOpen && <span style={{ fontSize: '14px', color: COLORS.navText }}>Help</span>}
          </div>
          <div onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '8px', cursor: 'pointer' }}>
            <LogOut size={20} color={COLORS.navText} />
            {sidebarOpen && <span style={{ fontSize: '14px', color: COLORS.navText }}>Logout</span>}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ background: COLORS.white, borderBottom: `1px solid ${COLORS.borderColor}`, padding: '16px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Home size={16} color={COLORS.lightText} />
            <span style={{ fontSize: '13px', color: COLORS.lightText }}>Textbooks</span>
          </div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: COLORS.darkText }}>AI Content Studio</h2>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <AlertCircle size={20} color={COLORS.navText} style={{ cursor: 'pointer' }} />
            <BookOpen size={20} color={COLORS.navText} style={{ cursor: 'pointer' }} />
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#f4d4b8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5a3c', fontWeight: '600', cursor: 'pointer' }}>
              {session.user.email[0].toUpperCase()}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, overflow: 'auto', padding: '30px' }}>
          {/* Page Title */}
          <div style={{ marginBottom: '30px' }}>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: '700', color: COLORS.darkText }}>Textbooks</h1>
            <p style={{ margin: 0, fontSize: '15px', color: COLORS.lightText }}>Manage and curate AI-generated curriculum materials.</p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <button onClick={() => setShowAddForm(!showAddForm)} style={{ padding: '10px 16px', background: COLORS.navActive, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={18} /> Add Record
            </button>
            <button onClick={handleExport} style={{ padding: '10px 16px', background: COLORS.filterBg, color: COLORS.darkText, border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Download size={18} /> Export
            </button>
            <button onClick={fetchRecords} style={{ padding: '10px 16px', background: COLORS.filterBg, color: COLORS.darkText, border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <RefreshCw size={18} /> Refresh
            </button>
            <button onClick={handleClearFilters} style={{ padding: '10px 16px', background: COLORS.filterBg, color: COLORS.darkText, border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <X size={18} /> Clear
            </button>
          </div>

          {/* Filters */}
          <div style={{ background: COLORS.filterBg, padding: '16px', borderRadius: '8px', marginBottom: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: COLORS.darkText, marginBottom: '6px', textTransform: 'uppercase' }}>CLASS</label>
              <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: `1px solid ${COLORS.borderColor}`, borderRadius: '6px', fontSize: '14px', background: COLORS.white, fontFamily: FONT_FAMILY }}>
                <option value="all">All Classes</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: COLORS.darkText, marginBottom: '6px', textTransform: 'uppercase' }}>SUBJECT</label>
              <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: `1px solid ${COLORS.borderColor}`, borderRadius: '6px', fontSize: '14px', background: COLORS.white, fontFamily: FONT_FAMILY }}>
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

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: COLORS.darkText, marginBottom: '6px', textTransform: 'uppercase' }}>STATUS</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: `1px solid ${COLORS.borderColor}`, borderRadius: '6px', fontSize: '14px', background: COLORS.white, fontFamily: FONT_FAMILY }}>
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="generating">Generating</option>
                <option value="generated">Generated</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: COLORS.darkText, marginBottom: '6px', textTransform: 'uppercase' }}>TOPIC</label>
              <input type="text" placeholder="Search topic..." value={topicInput} onChange={(e) => { setTopicInput(e.target.value); setSearchTopic(e.target.value); }} style={{ width: '100%', padding: '8px 12px', border: `1px solid ${COLORS.borderColor}`, borderRadius: '6px', fontSize: '14px', background: COLORS.white, fontFamily: FONT_FAMILY }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: COLORS.darkText, marginBottom: '6px', textTransform: 'uppercase' }}>SUB-TOPIC</label>
              <input type="text" placeholder="Search sub-topic..." value={subTopicInput} onChange={(e) => { setSubTopicInput(e.target.value); setSearchSubTopic(e.target.value); }} style={{ width: '100%', padding: '8px 12px', border: `1px solid ${COLORS.borderColor}`, borderRadius: '6px', fontSize: '14px', background: COLORS.white, fontFamily: FONT_FAMILY }} />
            </div>
          </div>

          {/* Records Table */}
          <div style={{ background: COLORS.white, borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            {loading && <div style={{ padding: '40px', textAlign: 'center', color: COLORS.lightText }}>Loading...</div>}

            {!loading && records.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: COLORS.lightText }}>No records found. Create one to get started!</div>
            )}

            {!loading && records.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: COLORS.lightBg, borderBottom: `2px solid ${COLORS.borderColor}` }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: COLORS.darkText, textTransform: 'uppercase' }}>ID</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: COLORS.darkText, textTransform: 'uppercase' }}>CLASS</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: COLORS.darkText, textTransform: 'uppercase' }}>SUBJECT</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: COLORS.darkText, textTransform: 'uppercase' }}>TOPIC</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: COLORS.darkText, textTransform: 'uppercase' }}>STATUS</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: COLORS.darkText, textTransform: 'uppercase' }}>WORDS</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: COLORS.darkText, textTransform: 'uppercase' }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record, idx) => (
                      <tr key={idx} style={{ borderBottom: `1px solid ${COLORS.borderColor}`, background: idx % 2 === 0 ? COLORS.white : COLORS.lightBg }}>
                        <td style={{ padding: '12px', fontSize: '13px', color: COLORS.lightText }}>#{record.record_id}</td>
                        <td style={{ padding: '12px', fontSize: '13px', fontWeight: '600', color: COLORS.darkText }}>Class {record.class}</td>
                        <td style={{ padding: '12px', fontSize: '13px', color: COLORS.darkText }}>{record.subject}</td>
                        <td style={{ padding: '12px', fontSize: '13px', color: COLORS.darkText }}>{record.topic}</td>
                        <td style={{ padding: '12px', fontSize: '13px' }}>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: record.status === 'generated' ? `${COLORS.statusGenerated}20` : record.status === 'generating' ? `${COLORS.statusGenerating}20` : `${COLORS.statusPending}20`,
                            color: record.status === 'generated' ? COLORS.statusGenerated : record.status === 'generating' ? COLORS.statusGenerating : COLORS.statusPending,
                            textTransform: 'uppercase'
                          }}>
                            {record.status === 'generated' && <CheckCircle2 size={14} />}
                            {record.status === 'generating' && <Clock size={14} />}
                            {record.status === 'pending' && <AlertCircle size={14} />}
                            {record.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px', fontSize: '13px', color: COLORS.darkText }}>{record.word_count || 0}</td>
                        <td style={{ padding: '12px', display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleView(record)} style={{ padding: '6px 10px', background: 'none', border: 'none', cursor: 'pointer', color: COLORS.navActive }}>
                            <Eye size={18} />
                          </button>
                          <button onClick={() => handleEdit(record)} style={{ padding: '6px 10px', background: 'none', border: 'none', cursor: 'pointer', color: COLORS.navActive }}>
                            <Edit2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '500px', background: COLORS.white, boxShadow: '-2px 0 8px rgba(0,0,0,0.15)', overflow: 'auto', zIndex: 100, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '24px', borderBottom: `1px solid ${COLORS.borderColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: COLORS.darkText }}>
              {editingId ? 'Edit Record' : 'Add New Record'}
            </h2>
            <button onClick={handleCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <X size={24} color={COLORS.darkText} />
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', overflow: 'auto' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: COLORS.darkText, marginBottom: '8px', textTransform: 'uppercase' }}>CLASS</label>
              <select value={formData.class} onChange={(e) => setFormData({ ...formData, class: e.target.value })} required style={{ width: '100%', padding: '10px 12px', border: `1px solid ${COLORS.borderColor}`, borderRadius: '6px', fontSize: '14px', background: COLORS.white, fontFamily: FONT_FAMILY }}>
                <option value="">Select Class</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: COLORS.darkText, marginBottom: '8px', textTransform: 'uppercase' }}>SUBJECT</label>
              <select value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} required style={{ width: '100%', padding: '10px 12px', border: `1px solid ${COLORS.borderColor}`, borderRadius: '6px', fontSize: '14px', background: COLORS.white, fontFamily: FONT_FAMILY }}>
                <option value="">Select Subject</option>
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

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: COLORS.darkText, marginBottom: '8px', textTransform: 'uppercase' }}>TOPIC</label>
              <input type="text" value={formData.topic} onChange={(e) => setFormData({ ...formData, topic: e.target.value })} placeholder="e.g., Quantum Mechanics" required style={{ width: '100%', padding: '10px 12px', border: `1px solid ${COLORS.borderColor}`, borderRadius: '6px', fontSize: '14px', background: COLORS.white, fontFamily: FONT_FAMILY }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: COLORS.darkText, marginBottom: '8px', textTransform: 'uppercase' }}>SUB-TOPIC</label>
              <input type="text" value={formData.sub_topic} onChange={(e) => setFormData({ ...formData, sub_topic: e.target.value })} placeholder="e.g., Wave-Particle Duality" required style={{ width: '100%', padding: '10px 12px', border: `1px solid ${COLORS.borderColor}`, borderRadius: '6px', fontSize: '14px', background: COLORS.white, fontFamily: FONT_FAMILY }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: COLORS.darkText, marginBottom: '8px', textTransform: 'uppercase' }}>AI PROMPT <span style={{ fontSize: '12px', color: COLORS.lightText, fontWeight: '400' }}>Max 2000 characters</span></label>
              <textarea value={formData.prompt} onChange={(e) => setFormData({ ...formData, prompt: e.target.value.slice(0, 2000) })} placeholder="Enter detailed prompt for Claude AI..." required rows="6" style={{ width: '100%', padding: '12px', border: `1px solid ${COLORS.borderColor}`, borderRadius: '6px', fontSize: '14px', background: COLORS.white, fontFamily: FONT_FAMILY, resize: 'vertical', minHeight: '140px' }} />
              <div style={{ fontSize: '12px', color: COLORS.lightText, marginTop: '6px' }}>{formData.prompt.length}/2000 characters</div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: COLORS.darkText, marginBottom: '8px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                🤖 Select AI Model
              </label>
              <select value={formData.ai_model} onChange={(e) => setFormData({ ...formData, ai_model: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${COLORS.borderColor}`, borderRadius: '6px', fontSize: '14px', background: COLORS.white, fontFamily: FONT_FAMILY }}>
                <optgroup label="Claude (Recommended)">
                  <option value="claude-opus-4-20250514">Claude Opus 4 (Most Capable - $0.03/run)</option>
                  <option value="claude-sonnet-4-20250514">Claude Sonnet 4 (Balanced - $0.003/run) ⭐</option>
                  <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (Fast & Cheap - $0.0008/run)</option>
                </optgroup>
                <optgroup label="OpenAI">
                  <option value="gpt-4o">GPT-4o (Most Advanced - $0.015/run)</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo (Faster - $0.01/run)</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 (Cheapest - $0.0005/run)</option>
                </optgroup>
                <optgroup label="Deepseek">
                  <option value="deepseek-v3.2">Deepseek V3.2 (Latest - $0.0014/run)</option>
                  <option value="deepseek-v2">Deepseek V2 (Budget - $0.001/run)</option>
                </optgroup>
              </select>
              <div style={{ fontSize: '12px', color: COLORS.lightText, marginTop: '6px', background: `${COLORS.navActive}10`, padding: '8px', borderRadius: '6px' }}>
                ℹ️ Different models have different speeds and costs. Claude Sonnet 4 is recommended for textbooks.
              </div>
            </div>

            <div style={{ background: `${COLORS.statusGenerating}15`, padding: '12px', borderRadius: '6px', borderLeft: `4px solid ${COLORS.statusGenerating}` }}>
              <p style={{ margin: 0, fontSize: '13px', color: COLORS.statusGenerating, fontWeight: '600' }}>AI Curator Ready</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: COLORS.darkText }}>Your prompt will be processed by the selected AI model to generate high-fidelity textbook content.</p>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
              <button type="button" onClick={handleCancel} style={{ flex: 1, padding: '12px', background: COLORS.filterBg, color: COLORS.darkText, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
                CANCEL
              </button>
              <button type="submit" disabled={loading} style={{ flex: 1, padding: '12px', background: COLORS.navActive, color: 'white', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '14px', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                ⚡ {loading ? 'GENERATING...' : 'SAVE & GENERATE'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* View Record Modal with Table of Contents */}
      {viewingRecord && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: COLORS.white, borderRadius: '8px', maxHeight: '90vh', width: '90%', maxWidth: '1200px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${COLORS.borderColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: COLORS.darkText }}>{viewingRecord.topic}</h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: COLORS.lightText }}>Class {viewingRecord.class} • {viewingRecord.subject}</p>
              </div>
              <button onClick={handleCloseView} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <X size={24} color={COLORS.darkText} />
              </button>
            </div>

            {/* Content Area with TOC */}
            <div style={{ flex: 1, overflow: 'auto', display: 'flex' }}>
              {/* Left: Table of Contents */}
              <div style={{ width: '280px', borderRight: `1px solid ${COLORS.borderColor}`, background: COLORS.lightBg, padding: '20px', overflow: 'auto' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '13px', fontWeight: '700', color: COLORS.darkText, textTransform: 'uppercase' }}>Table of Contents</h3>
                <div style={{ fontSize: '13px', color: COLORS.darkText }}>
                  <div style={{ padding: '8px', marginBottom: '8px', borderRadius: '4px', background: `${COLORS.navActive}20`, color: COLORS.navActive, fontWeight: '600' }}>
                    {viewingRecord.sub_topic}
                  </div>
                  <div style={{ fontSize: '12px', color: COLORS.lightText, padding: '8px', lineHeight: '1.6' }}>
                    <div>• Textbook Content</div>
                    <div>• Workbook Exercises</div>
                    <div>• Teacher Guide</div>
                  </div>
                </div>
              </div>

              {/* Right: Content Display */}
              <div style={{ flex: 1, padding: '24px', overflow: 'auto' }}>
                {/* Content Type Selector */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', borderBottom: `1px solid ${COLORS.borderColor}`, paddingBottom: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: contentType === 'markdown' ? COLORS.navActive : COLORS.lightText }}>
                    <input type="radio" checked={contentType === 'markdown'} onChange={() => setContentType('markdown')} style={{ cursor: 'pointer' }} />
                    Markdown
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: contentType === 'html' ? COLORS.navActive : COLORS.lightText }}>
                    <input type="radio" checked={contentType === 'html'} onChange={() => setContentType('html')} style={{ cursor: 'pointer' }} />
                    HTML
                  </label>
                </div>

                {/* Content */}
                {viewingRecord.ai_output ? (
                  <div id="view-modal-content">
                    {contentType === 'markdown' ? (
                      <ReactMarkdown style={{ fontSize: '14px', lineHeight: '1.8', color: COLORS.darkText }}>
                        {viewingRecord.ai_output}
                      </ReactMarkdown>
                    ) : (
                      <div dangerouslySetInnerHTML={{ __html: viewingRecord.ai_output }} style={{ fontSize: '14px', lineHeight: '1.8', color: COLORS.darkText }} />
                    )}
                  </div>
                ) : (
                  <div style={{ padding: '40px', textAlign: 'center', color: COLORS.lightText }}>
                    <Clock size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                    <p>Content is being generated...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer with Export */}
            {viewingRecord.ai_output && (
              <div style={{ borderTop: `1px solid ${COLORS.borderColor}`, padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '13px', color: COLORS.lightText }}>
                  {viewingRecord.word_count || 0} words
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={{ padding: '8px 16px', background: COLORS.navActive, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
                    <Download size={16} style={{ marginRight: '4px' }} /> PDF
                  </button>
                  <button style={{ padding: '8px 16px', background: COLORS.navActive, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
                    <Download size={16} style={{ marginRight: '4px' }} /> Word
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Icon for clipboard (not in lucide-react)
function ClipboardList({ size = 24, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="9" y1="9" x2="15" y2="9"></line>
      <line x1="9" y1="15" x2="15" y2="15"></line>
    </svg>
  );
}

function Lightbulb({ size = 24, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6M12 2a7 7 0 1 0 0 14 7 7 0 0 0 0-14M12 16v2"></path>
    </svg>
  );
}
