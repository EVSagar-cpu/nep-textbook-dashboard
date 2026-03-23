import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://syacvhjmcgpgxvczassp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_tmoQwBjJYHyMnOSGAzts2w_v-aG0iYl';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
  const [editingId, setEditingId] = useState(null);
  const [viewingRecord, setViewingRecord] = useState(null);

  const [formData, setFormData] = useState({
    class: '',
    subject: '',
    topic: '',
    sub_topic: '',
    prompt: '',
  });

  // Check if user is logged in
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

  // Fetch and filter textbook_content records
  const fetchRecords = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('textbook_content')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Apply client-side filtering
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
        filtered = filtered.filter(
          (r) =>
            r.topic?.toLowerCase().includes(searchLower) ||
            r.sub_topic?.toLowerCase().includes(searchLower)
        );
      }

      setRecords(filtered);
    } catch (error) {
      alert('Error fetching records: ' + error.message);
    }
    setLoading(false);
  };

  // Refetch when filters change
  useEffect(() => {
    if (session) {
      fetchRecords();
    }
  }, [filterStatus, filterClass, filterSubject, searchTopic]);

  // Handle Email/Password Login
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

  // Handle GitHub OAuth Login
  const handleGitHubLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (error) {
      alert('GitHub login error: ' + error.message);
    }
    setLoading(false);
  };

  // Handle Google OAuth Login
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (error) {
      alert('Google login error: ' + error.message);
    }
    setLoading(false);
  };

  // Handle Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  // Handle Add/Edit Record
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingId) {
        // Update existing
        const { error } = await supabase
          .from('textbook_content')
          .update({
            ...formData,
            status: 'pending',
          })
          .eq('record_id', editingId);

        if (error) throw error;
        setEditingId(null);
      } else {
        // Add new
        const { error } = await supabase
          .from('textbook_content')
          .insert([
            {
              ...formData,
              status: 'pending',
            },
          ]);

        if (error) throw error;
      }

      setFormData({
        class: '',
        subject: '',
        topic: '',
        sub_topic: '',
        prompt: '',
      });
      setShowAddForm(false);
      fetchRecords();
    } catch (error) {
      alert('Error saving record: ' + error.message);
    }
    setLoading(false);
  };

  // Handle Edit
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

  // Handle Cancel
  const handleCancel = () => {
    setShowAddForm(false);
    setEditingId(null);
    setFormData({
      class: '',
      subject: '',
      topic: '',
      sub_topic: '',
      prompt: '',
    });
  };

  // Handle View AI Output
  const handleView = (record) => {
    setViewingRecord(record);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilterStatus('all');
    setFilterClass('all');
    setFilterSubject('all');
    setSearchTopic('');
  };

  // Export to CSV
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

  // LOGIN PAGE
  if (!session) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Segoe UI, sans-serif' }}>
        <div style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', maxWidth: '400px', width: '100%' }}>
          <h1 style={{ fontSize: '28px', marginBottom: '30px', textAlign: 'center', color: '#1a1a1a' }}>📚 NEP Textbook Dashboard</h1>

          {/* OAuth Login Options */}
          <div style={{ marginBottom: '30px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                background: '#fff',
                color: '#333',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                opacity: loading ? 0.7 : 1,
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => e.target.style.background = '#f5f5f5'}
              onMouseLeave={(e) => e.target.style.background = '#fff'}
            >
              <span style={{ fontSize: '18px' }}>🔍</span>
              {loading ? 'Logging in...' : 'Login with Google'}
            </button>

            <button
              onClick={handleGitHubLogin}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                background: '#fff',
                color: '#333',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                opacity: loading ? 0.7 : 1,
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => e.target.style.background = '#f5f5f5'}
              onMouseLeave={(e) => e.target.style.background = '#fff'}
            >
              <span style={{ fontSize: '18px' }}>🐙</span>
              {loading ? 'Logging in...' : 'Login with GitHub'}
            </button>
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '25px 0', gap: '10px' }}>
            <div style={{ flex: 1, height: '1px', background: '#ddd' }}></div>
            <span style={{ fontSize: '13px', color: '#999', fontWeight: '600' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: '#ddd' }}></div>
          </div>

          {/* Email/Password Login */}
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#333' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#333' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Logging in...' : 'Login with Email'}
            </button>
          </form>

          <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px', color: '#999' }}>
            Use any method to sign in securely
          </p>
        </div>
      </div>
    );
  }

  // DASHBOARD PAGE
  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa', fontFamily: 'Segoe UI, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#0f3d3e', color: 'white', padding: '25px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: '700', letterSpacing: '-0.5px' }}>📚 NEP Textbook Dashboard</h1>
            <p style={{ margin: '8px 0 0 0', fontSize: '13px', opacity: 0.9 }}>Content Management & Generation System</p>
          </div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', opacity: 0.9 }}>{session?.user?.email}</span>
            <button
              onClick={handleLogout}
              style={{
                padding: '10px 20px',
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px' }}>
        {/* Controls */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              padding: '10px 20px',
              background: '#1a9b8e',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
            }}
          >
            {showAddForm ? '✕ Cancel' : '+ Add Record'}
          </button>

          {/* Search by Topic */}
          <input
            type="text"
            placeholder="Search Topic / Sub-topic..."
            value={searchTopic}
            onChange={(e) => setSearchTopic(e.target.value)}
            style={{
              padding: '10px 15px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px',
              minWidth: '200px',
              fontFamily: 'inherit',
            }}
          />

          {/* Filter by Class */}
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            style={{
              padding: '10px 15px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              background: 'white',
              fontFamily: 'inherit',
            }}
          >
            <option value="all">All Classes</option>
            <option value="1">Class 1</option>
            <option value="2">Class 2</option>
            <option value="3">Class 3</option>
            <option value="4">Class 4</option>
            <option value="5">Class 5</option>
          </select>

          {/* Filter by Subject */}
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            style={{
              padding: '10px 15px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              background: 'white',
              fontFamily: 'inherit',
            }}
          >
            <option value="all">All Subjects</option>
            <option value="English">English</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Science">Science</option>
            <option value="Social Studies">Social Studies</option>
            <option value="Hindi">Hindi</option>
            <option value="Arts">Arts</option>
            <option value="Physical Education">Physical Education</option>
            <option value="Environmental Studies">Environmental Studies</option>
          </select>

          {/* Filter by Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '10px 15px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              background: 'white',
              fontFamily: 'inherit',
            }}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="generating">Generating</option>
            <option value="generated">Generated</option>
          </select>

          {/* Action Buttons */}
          <button
            onClick={handleExport}
            style={{
              padding: '10px 20px',
              background: '#805ad5',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
            }}
          >
            📥 Export CSV
          </button>

          <button
            onClick={fetchRecords}
            style={{
              padding: '10px 20px',
              background: '#4299e1',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
            }}
          >
            🔄 Refresh
          </button>

          <button
            onClick={handleClearFilters}
            style={{
              padding: '10px 20px',
              background: '#cbd5e0',
              color: '#2d3748',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
            }}
          >
            ✕ Clear Filters
          </button>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div style={{ background: 'white', padding: '25px', borderRadius: '12px', marginBottom: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2 style={{ marginTop: 0, fontSize: '18px', color: '#1a1a1a' }}>{editingId ? 'Edit Record' : 'Add New Record'}</h2>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#333' }}>Class</label>
                  <select
                    value={formData.class}
                    onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                  >
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
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                  >
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
                  <input
                    type="text"
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    placeholder="e.g., Numbers"
                    required
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#333' }}>Sub-topic</label>
                  <input
                    type="text"
                    value={formData.sub_topic}
                    onChange={(e) => setFormData({ ...formData, sub_topic: e.target.value })}
                    placeholder="e.g., Place Value"
                    required
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '15px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#333' }}>Prompt</label>
                <textarea
                  value={formData.prompt}
                  onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                  placeholder="Enter the prompt for Claude AI..."
                  required
                  rows="5"
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '10px 20px',
                    background: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? 'Saving...' : 'Save Record'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  style={{
                    padding: '10px 20px',
                    background: '#ccc',
                    color: '#333',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Records Table */}
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '18px', color: '#1a1a1a', fontWeight: '700' }}>
              📋 Records 
              <span style={{ fontSize: '14px', color: '#7a8d9f', fontWeight: '500', marginLeft: '8px' }}>
                ({records.length} {records.length === 1 ? 'record' : 'records'})
              </span>
            </h2>
            {(filterStatus !== 'all' || filterClass !== 'all' || filterSubject !== 'all' || searchTopic) && (
              <span style={{ fontSize: '12px', color: '#1a9b8e', fontWeight: '600' }}>
                ⚙️ {filterStatus !== 'all' ? `Status: ${filterStatus}` : ''} 
                {filterClass !== 'all' ? ` • Class: ${filterClass}` : ''} 
                {filterSubject !== 'all' ? ` • Subject: ${filterSubject}` : ''} 
                {searchTopic ? ` • Search: "${searchTopic}"` : ''}
              </span>
            )}
          </div>

          {loading && <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Loading...</div>}

          {!loading && records.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>No records found. Create one to get started!</div>
          )}

          {!loading && records.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f5f7fa', borderBottom: '2px solid #ddd' }}>
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
                    <tr key={idx} style={{ borderBottom: '1px solid #eee', background: idx % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                      <td style={{ padding: '15px', fontSize: '13px', color: '#666' }}>{record.record_id}</td>
                      <td style={{ padding: '15px', fontSize: '13px', color: '#666' }}>{record.class}</td>
                      <td style={{ padding: '15px', fontSize: '13px', color: '#666' }}>{record.subject}</td>
                      <td style={{ padding: '15px', fontSize: '13px', color: '#666' }}>{record.topic}</td>
                      <td style={{ padding: '15px', fontSize: '13px' }}>
                        <span
                          style={{
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600',
                            background: record.status === 'generated' ? '#d4edda' : record.status === 'generating' ? '#fff3cd' : '#e2e3e5',
                            color: record.status === 'generated' ? '#155724' : record.status === 'generating' ? '#856404' : '#383d41',
                          }}
                        >
                          {record.status}
                        </span>
                      </td>
                      <td style={{ padding: '15px', fontSize: '13px', color: '#666' }}>{record.word_count || '-'}</td>
                      <td style={{ padding: '15px', fontSize: '13px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleView(record)}
                            style={{
                              padding: '6px 12px',
                              background: '#4facfe',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '600',
                            }}
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleEdit(record)}
                            style={{
                              padding: '6px 12px',
                              background: '#764ba2',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '600',
                            }}
                          >
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

      {/* View AI Output Modal */}
      {viewingRecord && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            maxWidth: '900px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #eee',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', color: '#1a1a1a' }}>
                  📖 AI-Generated Content
                </h2>
                <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#666' }}>
                  Class {viewingRecord.class} • {viewingRecord.subject} • {viewingRecord.topic}
                </p>
              </div>
              <button
                onClick={handleCloseView}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#999',
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div style={{
              flex: 1,
              overflow: 'auto',
              padding: '30px',
              fontFamily: 'Georgia, serif',
              lineHeight: '1.8',
              color: '#333',
            }}>
              {viewingRecord.ai_output ? (
                <div style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                  {viewingRecord.ai_output}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
                  <p style={{ fontSize: '16px' }}>⏳ Content is being generated...</p>
                  <p style={{ fontSize: '13px' }}>Status: {viewingRecord.status}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '20px',
              borderTop: '1px solid #eee',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div style={{ fontSize: '13px', color: '#666' }}>
                <strong>📊 Stats:</strong> {viewingRecord.word_count || 0} words • Status: <span style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600',
                  background: viewingRecord.status === 'generated' ? '#d4edda' : viewingRecord.status === 'generating' ? '#fff3cd' : '#e2e3e5',
                  color: viewingRecord.status === 'generated' ? '#155724' : viewingRecord.status === 'generating' ? '#856404' : '#383d41',
                }}>{viewingRecord.status}</span>
              </div>
              <button
                onClick={handleCloseView}
                style={{
                  padding: '10px 20px',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
