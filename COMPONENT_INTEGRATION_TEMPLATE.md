/**
 * QUICK START: Component Integration Template
 * Copy & paste these patterns into your screen components
 */

// ============================================
// TEMPLATE 1: Home Screen
// ============================================

import { useAuth } from '../contexts/AuthContext';
import { matchesAPI } from '../services/api';
import { useState, useEffect } from 'react';

export function HomeScreen() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadMatches();
    }
  }, [isAuthenticated]);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const data = await matchesAPI.getAllMatches();
      setMatches(data.matches || []);
    } catch (error) {
      console.error('Failed to load matches:', error);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="home-container">
      {isAuthenticated ? (
        <>
          <h1>Welcome {user?.name}!</h1>
          <p>Trust Score: {user?.trustScore}</p>
          <h2>Recent Matches</h2>
          {loading ? (
            <div>Loading matches...</div>
          ) : (
            <div className="matches-grid">
              {matches.map(match => (
                <div key={match.id} className="match-card">
                  {/* Render match details */}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div>Please log in to continue</div>
      )}
    </div>
  );
}

// ============================================
// TEMPLATE 2: Report Lost Screen
// ============================================

import { useAuth } from '../contexts/AuthContext';
import { itemsAPI } from '../services/api';
import { uploadService } from '../services/firebase';
import { useState } from 'react';

export function ReportLostScreen() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    itemName: '',
    category: 'phone',
    description: '',
    location: '',
    lostDate: '',
    lostTime: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let imageUrl = undefined;
      
      // Upload image if provided
      if (imageFile) {
        imageUrl = await uploadService.uploadItemImage(
          imageFile,
          `user_${Date.now()}`
        );
      }

      // Report lost item
      const result = await itemsAPI.reportLost({
        ...formData,
        imageUrl
      });

      // Show success and redirect
      alert('Item reported successfully!');
      // window.location.href = '/my-items';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to report item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="report-form">
      <div className="form-group">
        <label>Item Name *</label>
        <input
          type="text"
          required
          value={formData.itemName}
          onChange={(e) => setFormData({...formData, itemName: e.target.value})}
        />
      </div>

      <div className="form-group">
        <label>Category *</label>
        <select
          required
          value={formData.category}
          onChange={(e) => setFormData({...formData, category: e.target.value})}
        >
          <option value="phone">Phone</option>
          <option value="wallet">Wallet</option>
          <option value="keys">Keys</option>
          <option value="bag">Bag</option>
          <option value="watch">Watch</option>
          <option value="glasses">Glasses</option>
          <option value="jewelry">Jewelry</option>
          <option value="document">Document</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="form-group">
        <label>Description *</label>
        <textarea
          required
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="Detailed description..."
        />
      </div>

      <div className="form-group">
        <label>Location *</label>
        <input
          type="text"
          required
          value={formData.location}
          onChange={(e) => setFormData({...formData, location: e.target.value})}
          placeholder="Where was it lost?"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Lost Date *</label>
          <input
            type="date"
            required
            value={formData.lostDate}
            onChange={(e) => setFormData({...formData, lostDate: e.target.value})}
          />
        </div>
        <div className="form-group">
          <label>Lost Time</label>
          <input
            type="time"
            value={formData.lostTime}
            onChange={(e) => setFormData({...formData, lostTime: e.target.value})}
          />
        </div>
      </div>

      <div className="form-group">
        <label>Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
        />
      </div>

      {error && <div className="error-message">{error}</div>}

      <button type="submit" disabled={loading}>
        {loading ? 'Reporting...' : 'Report Lost Item'}
      </button>
    </form>
  );
}

// ============================================
// TEMPLATE 3: Match Results Screen
// ============================================

import { useAuth } from '../contexts/AuthContext';
import { matchesAPI } from '../services/api';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export function MatchResultsScreen() {
  const { user } = useAuth();
  const { itemId } = useParams<{ itemId: string }>();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMatches();
  }, [itemId]);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const data = await matchesAPI.getItemMatches(itemId!);
      setMatches(data.matches || []);
    } catch (error) {
      console.error('Failed to load matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (foundItemId: string) => {
    if (!itemId) return;
    try {
      const result = await matchesAPI.requestClaim(itemId, foundItemId);
      alert('Claim request submitted!');
      // Redirect to verification screen
      // window.location.href = `/verify/${result.claimId}`;
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to request claim');
    }
  };

  if (loading) return <div>Loading matches...</div>;

  return (
    <div className="matches-container">
      <h1>Found Matches ({matches.length})</h1>
      {matches.length === 0 ? (
        <p>No matches found yet. Check back later!</p>
      ) : (
        <div className="matches-list">
          {matches.map((match: any) => (
            <div key={match.id} className="match-item">
              <h3>{match.itemName}</h3>
              <p>Match Score: {match.score}%</p>
              <p>Confidence: {match.confidenceLevel}</p>
              <p>{match.explanation}</p>
              <button onClick={() => handleClaim(match.id)}>
                Claim This Item
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// TEMPLATE 4: Verification Screen
// ============================================

import { handoversAPI } from '../services/api';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export function VerificationScreen() {
  const { claimId } = useParams<{ claimId: string }>();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Load verification questions from backend
    // Typically would fetch from a questions endpoint
    const mockQuestions = [
      { question: "What color is the item?", id: 0 },
      { question: "What brand is it?", id: 1 },
      { question: "Any distinctive marks?", id: 2 }
    ];
    setQuestions(mockQuestions);
    setAnswers(new Array(mockQuestions.length).fill(''));
    setLoading(false);
  }, [claimId]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const result = await handoversAPI.verifyOwner(claimId!, answers);
      
      if (result.verified) {
        alert(`Verification passed! Trust score +5`);
        // Move to handover screen
      } else {
        alert('Verification failed. Trust score -10');
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Verification error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Loading verification...</div>;

  return (
    <div className="verification-container">
      <h1>Verify Ownership</h1>
      <p>Answer these questions to prove ownership (2 of 3 correct required)</p>

      {questions.map((q: any, idx: number) => (
        <div key={q.id} className="question">
          <h3>{q.question}</h3>
          <input
            type="text"
            value={answers[idx] || ''}
            onChange={(e) => {
              const newAnswers = [...answers];
              newAnswers[idx] = e.target.value;
              setAnswers(newAnswers);
            }}
            placeholder="Your answer..."
          />
        </div>
      ))}

      <button onClick={handleSubmit} disabled={submitting}>
        {submitting ? 'Verifying...' : 'Submit Verification'}
      </button>
    </div>
  );
}

// ============================================
// TEMPLATE 5: Admin Dashboard
// ============================================

import { useAuth } from '../contexts/AuthContext';
import { adminAPI } from '../services/api';
import { useEffect, useState } from 'react';

export function AdminDashboard() {
  const { user, isAdmin } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      loadDashboard();
    }
  }, [isAdmin]);

  const loadDashboard = async () => {
    try {
      const data = await adminAPI.getDashboardData();
      setDashboard(data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) return <div>Access denied</div>;
  if (loading) return <div>Loading dashboard...</div>;
  if (!dashboard) return <div>No data</div>;

  const stats = (dashboard as any).stats;

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Items</h3>
          <p className="stat-value">{stats.totalItems}</p>
        </div>
        <div className="stat-card">
          <h3>Recovery Rate</h3>
          <p className="stat-value">{stats.recoveryRate}%</p>
        </div>
        <div className="stat-card">
          <h3>Active Claims</h3>
          <p className="stat-value">{stats.activeClaims}</p>
        </div>
        <div className="stat-card">
          <h3>Suspicious Users</h3>
          <p className="stat-value">{stats.suspiciousUsers}</p>
        </div>
      </div>

      <div className="trust-distribution">
        <h2>Trust Score Distribution</h2>
        <p>Excellent: {stats.trustDistribution.excellent}</p>
        <p>Good: {stats.trustDistribution.good}</p>
        <p>Fair: {stats.trustDistribution.fair}</p>
        <p>Poor: {stats.trustDistribution.poor}</p>
      </div>

      {/* Add claims management, user management, heatmap, etc. */}
    </div>
  );
}

// ============================================
// INTEGRATION CHECKLIST
// ============================================

/**
 * Copy these patterns into your screen components:
 * 
 * ✅ Import useAuth hook
 * ✅ Get user, isAuthenticated, isLoading
 * ✅ Import API service (itemsAPI, matchesAPI, etc.)
 * ✅ Use useState for component state
 * ✅ Use useEffect for data fetching
 * ✅ Handle loading and error states
 * ✅ Handle form submissions
 * ✅ Upload images with uploadService
 * ✅ Show success/error messages
 * ✅ Redirect on success
 * 
 * For all 8 screen components:
 * 1. home-screen.tsx
 * 2. report-lost-screen.tsx
 * 3. report-found-screen.tsx
 * 4. match-results-screen.tsx
 * 5. verification-screen.tsx
 * 6. handover-screen.tsx
 * 7. timeline-screen.tsx
 * 8. admin-dashboard.tsx
 */
