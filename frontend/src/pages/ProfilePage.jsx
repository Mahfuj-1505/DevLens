import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchReports } from "../api";
import { User } from 'lucide-react';
import "./ProfilePage.css";

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [reportError, setReportError] = useState("");
  const [selectedReports, setSelectedReports] = useState([]);

  useEffect(() => {
    const storedUser = localStorage.getItem("current_user");
    if (!storedUser) {
      navigate("/login");
      return;
    }
    try {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      fetchReports()
        .then(setReports)
        .catch((err) => setReportError(err.message));
    } catch {
      navigate("/login");
    }
  }, [navigate]);

  const handleSelectReport = (reportId) => {
    setSelectedReports(prev => {
      if (prev.includes(reportId)) {
        return prev.filter(id => id !== reportId);
      } else if (prev.length < 2) {
        return [...prev, reportId];
      }
      return prev;
    });
  };

  const handleCompare = () => {
    if (selectedReports.length === 2) {
      navigate(`/compare?left=${selectedReports[0]}&right=${selectedReports[1]}`);
    }
  };

  if (!user) return <div className="loading-screen">Loading...</div>;

  return (
    <div className="profile-page">

      {/* Header */}
      <div className="profile-header">
        <h2>Profile</h2>
        <button onClick={() => navigate("/profile")} className="icon-btn">
          <User size={20} />
        </button>
      </div>

      {/* Back button */}
      <button onClick={() => navigate("/home")} className="btn btn-back">
        Back to Home
      </button>

      {/* User Info */}
      <div className="glass-card user-info-card">
        <p className="card-section-label">User Information</p>

        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Email</span>
            <span className="info-value">{user.email}</span>
          </div>

          <div className="info-item">
            <span className="info-label">Role</span>
            <span className="role-badge">{user.role}</span>
          </div>

          {user.batch && (
            <div className="info-item">
              <span className="info-label">Batch</span>
              <span className="info-value">{user.batch}</span>
            </div>
          )}

          {user.roll && (
            <div className="info-item">
              <span className="info-label">Roll</span>
              <span className="info-value">{user.roll}</span>
            </div>
          )}

          <div className="info-item">
            <span className="info-label">First Name</span>
            <span className="info-value">{user.firstName}</span>
          </div>

          <div className="info-item">
            <span className="info-label">Last Name</span>
            <span className="info-value">{user.lastName}</span>
          </div>
        </div>
      </div>

      {/* Reports */}
      <div className="glass-card reports-card">
        <div className="reports-header">
          <h3>{user.role === "teacher" ? "All Reports" : "Your Reports"}</h3>

          {user.role === "teacher" && selectedReports.length === 2 && (
            <button onClick={handleCompare} className="btn btn-primary">
              Compare Selected
            </button>
          )}
        </div>

        {reportError && <div className="error-msg">{reportError}</div>}

        {!reports.length && !reportError && (
          <div className="empty-msg">No reports available.</div>
        )}

        {!!reports.length && (
          <table className="reports-table">
            <thead>
              <tr>
                {user.role === "teacher" && <th>Select</th>}
                <th>User Email</th>
                <th>Repository</th>
                <th>Batch</th>
                <th>Roll</th>
                <th>SPL</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr
                  key={report.id}
                  onClick={() => navigate('/view-report', { state: { report } })}
                >
                  {user.role === "teacher" && (
                    <td onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedReports.includes(report.id)}
                        onChange={() => handleSelectReport(report.id)}
                        disabled={
                          selectedReports.length >= 2 &&
                          !selectedReports.includes(report.id)
                        }
                      />
                    </td>
                  )}

                  <td>{report.userEmail}</td>
                  <td>{report.repository}</td>
                  <td>{report.batch ?? <span className="na-text">N/A</span>}</td>
                  <td>{report.roll ?? <span className="na-text">N/A</span>}</td>
                  <td>{report.spl ?? <span className="na-text">N/A</span>}</td>
                  <td>{new Date(report.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}