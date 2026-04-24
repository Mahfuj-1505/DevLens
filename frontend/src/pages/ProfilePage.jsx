import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchReports } from "../api";
import { User } from 'lucide-react';

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
      // Navigate to compare with selected ids
      navigate(`/compare?left=${selectedReports[0]}&right=${selectedReports[1]}`);
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2>Profile</h2>
        <button onClick={() => navigate("/profile")} style={{ background: "none", border: "none", cursor: "pointer" }}>
          <User size={24} />
        </button>
      </div>
      <button onClick={() => navigate("/home")} style={{ marginBottom: 12 }}>Back to Home</button>

      <div style={{ marginBottom: 24 }}>
        <h3>User Information</h3>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Role:</strong> {user.role}</p>
        {user.batch && <p><strong>Batch:</strong> {user.batch}</p>}
        {user.roll && <p><strong>Roll:</strong> {user.roll}</p>}
        <p><strong>First Name:</strong> {user.firstName}</p>
        <p><strong>Last Name:</strong> {user.lastName}</p>
      </div>

      <div>
        <h3>{user.role === "teacher" ? "All Reports" : "Your Reports"}</h3>
        {reportError && <p style={{ color: "crimson" }}>{reportError}</p>}
        {!reports.length && !reportError && <p>No reports available.</p>}
        {user.role === "teacher" && selectedReports.length === 2 && (
          <button onClick={handleCompare} style={{ marginBottom: 12 }}>Compare Selected Reports</button>
        )}
        {!!reports.length && (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f0f0f0" }}>
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
                  style={{ borderBottom: "1px solid #ddd", cursor: "pointer" }}
                  onClick={() => navigate('/view-report', { state: { report } })}
                >
                  {user.role === "teacher" && (
                    <td onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedReports.includes(report.id)}
                        onChange={() => handleSelectReport(report.id)}
                        disabled={selectedReports.length >= 2 && !selectedReports.includes(report.id)}
                      />
                    </td>
                  )}
                  <td>{report.userEmail}</td>
                  <td>{report.repository}</td>
                  <td>{report.batch ?? "N/A"}</td>
                  <td>{report.roll ?? "N/A"}</td>
                  <td>{report.spl ?? "N/A"}</td>
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