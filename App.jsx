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
  const [editingId, setEditingId] = useState(null);

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

  // Fetch textbook_content records
  const fetchRecords = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('textbook_content')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      alert('Error fetching records: ' + error.message);
    }
    setLoading(false);
  };

  // Handle Login
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

  // Export to CSV
  const handleExport = () => {
    if (records.length === 0) {
      alert('No records to export');
      return;
    }

    const headers = ['ID', 'Class', 'Subject', 'Topic', 'Sub-topic', 'Status', 'Word Count', 'Created At'];
    const rows = records.map((r) => [
      r.record_id,
      r.class,
      r.subject,
      r.topic,
      r.sub_topic,
      r.status,
      r.word_count || 0,
      new Date(r.created_at).toLocaleDateString(),
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
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
          <h1 style={{ fontSize: '28px', marginBottom: '30px', textAlign: 'center', color: '#1a1a1a' }}>NEP Textbook Dashboard</h1>

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
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px', color: '#666' }}>
            Use your Supabase account to login
          </p>
        </div>
      </div>
    );
  }

  // DASHBOARD PAGE
  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa', fontFamily: 'Segoe UI, sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '24px' }}>📚 NEP Textbook Content</h1>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '14px' }}>{session?.user?.email}</span>
            <button
              onClick={handleLogout}
              style={{
                padding: '8px 16px',
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '1px solid white',
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
              background: '#667eea',
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

          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              fetchRecords();
            }}
            style={{
              padding: '10px 15px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              background: 'white',
            }}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="generating">Generating</option>
            <option value="generated">Generated</option>
          </select>

          <button
            onClick={handleExport}
            style={{
              padding: '10px 20px',
              background: '#764ba2',
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
              background: '#4facfe',
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
          <div style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
            <h2 style={{ margin: 0, fontSize: '18px', color: '#1a1a1a' }}>Records ({records.length})</h2>
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
  );
}
