import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ProjectAssignees.css';

const API = process.env.REACT_APP_API_BASE_URL;
const token = localStorage.getItem("token");

const authHeader = {
  headers: {
    Authorization: `Bearer ${token}`,
  },
};

const ProjectAssignees = ({ projectId, name, budget, onClose }) => {
  const [search, setSearch] = useState('');
  const [projects, setProjects] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [assignees, setAssignees] = useState([]);
  const [pending, setPending] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [percentage, setPercentage] = useState('');
  const [billingRate, setBillingRate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [availableRoles, setAvailableRoles] = useState([]);

  useEffect(() => {
    if (projectId) fetchAssignees();
    fetchRoles();
    fetchProjects();
  }, [projectId]);

  const fetchAssignees = async () => {
    try {
      const res = await axios.get(`${API}/api/projects/${projectId}/assignees`, authHeader);
      setAssignees(res.data);
    } catch (err) {
      console.error('Failed to fetch assignees', err);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await axios.get(`${API}/api/projects`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setProjects(res.data);
    } catch (err) {
      console.error('Failed to fetch projects', err);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await axios.get(`${API}/api/roles`, authHeader);
      setAvailableRoles(res.data);
      setSelectedRole(res.data[0]); // default role
    } catch (err) {
      console.error("Failed to fetch roles", err);
    }
  };

  const handleSearch = async e => {
    const q = e.target.value;
    setSearch(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await axios.get(`${API}/api/search/users`, {
        params: { q },
        ...authHeader
      });
      setSearchResults(res.data.filter(emp => emp && emp.eid && emp.fname && emp.lname));
    } catch (err) {
      console.error('Search error', err);
    }
  };

  const startAdd = emp => {
    setPending(emp);
    setPercentage('');
    setBillingRate('');
    const hasPM = assignees.some(a => a.role === 'Project Manager');
    const fallback = availableRoles.length > 0 ? availableRoles[0] : '';
    setSelectedRole(hasPM && fallback === 'Project Manager' ? '' : fallback);
  };

  const cancelAdd = () => {
    setPending(null);
    setPercentage('');
    setBillingRate('');
    setStartDate('');
    setEndDate('');
  };

  const confirmAdd = async () => {
    if (!pending || !selectedRole) return;

    const pct = parseFloat(percentage);
    const rate = parseFloat(billingRate);
    if (isNaN(pct) || isNaN(rate) || !startDate || !endDate) {
      alert('Please enter valid allocation percentage and billing rate.');
      return;
    }

    try {
      await axios.post(
        `${API}/api/projects/${projectId}/assignees`,
        { eid: pending.eid, role: selectedRole },
        authHeader
      );

      await axios.post(
        `${API}/api/assign-task`,
        {
          project_id: parseInt(projectId),
          assignments: [
            {
              user_id: pending.id,
              percentage: pct,
              billing_rate: rate,
              start_date: startDate,
              end_date: endDate
            }
          ]
        },
        authHeader
      );

      alert('✅ User assigned with role and task!');
      fetchAssignees();
      fetchProjects();
      setAssignees(a => [...a, { ...pending, role: selectedRole }]);
      cancelAdd();
      setSearch('');
      setSearchResults([]);
    } catch (err) {
      console.error('Assignment error:', err.response?.data || err);
      alert(`❌ Failed: ${err.response?.data?.error || 'Unknown error'}`);
    }
  };

  const removeAssignee = async emp => {
    try {
      await axios.delete(
        `${API}/api/projects/${projectId}/assignees/${emp.eid}`,
        authHeader
      );
      setAssignees(a => a.filter(x => x.eid !== emp.eid));
    } catch (err) {
      console.error('Remove error', err);
    }
  };

  const hasPM = assignees.some(a => a.role === 'Project Manager');

  return (
    <div className="assignee-page">
      <div className="search-container">
        <input
          type="text"
          placeholder="Search employees…"
          value={search}
          onChange={handleSearch}
          className="search-bar-assign"
        />

        {!pending && searchResults.length > 0 && (
          <ul className="search-dropdown">
            {searchResults.map(emp => (
              <li key={emp.eid} onClick={() => startAdd(emp)}>
                {emp.fname} {emp.lname} ({emp.eid})
              </li>
            ))}
          </ul>
        )}

        {pending && (
          <div className="assign-panel">
            <span>
              Assign <strong>{pending.fname} {pending.lname}</strong> as:
            </span>
            <select
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value)}
            >
              {availableRoles.map(r => (
                <option
                  key={r}
                  value={r}
                  disabled={r === 'Project Manager' && hasPM}
                >
                  {r}
                </option>
              ))}
            </select>

            <div className="assign-inputs-row">
              <div className="floating-field">
                <input
                  type="number"
                  value={percentage}
                  onChange={(e) => setPercentage(e.target.value)}
                  placeholder=" "
                  required
                />
                <label>Allocation %</label>
              </div>

              <div className="floating-field">
                <input
                  type="number"
                  value={billingRate}
                  onChange={(e) => setBillingRate(e.target.value)}
                  placeholder=" "
                  required
                />
                <label>Billing Rate</label>
              </div>
              <div className="floating-field">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
                <label>Start Date</label>
              </div>

              <div className="floating-field">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
                <label>End Date</label>
              </div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
              <button className="confirm-btn" onClick={confirmAdd}>Confirm</button>
              <button className="cancel-btn" onClick={cancelAdd}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      <h3>Assigned Members:</h3>
      {assignees.length > 0 ? (
        <table className="assignee-table">
          <thead>
            <tr>
              <th>EID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Cost ($)</th>
              <th>Remove</th>
            </tr>
          </thead>
          <tbody>
            {assignees.map(emp => (
              <tr key={emp.eid}>
                <td>{emp.eid}</td>
                <td>{emp.fname} {emp.lname}</td>
                <td>{emp.email}</td>
                <td>{emp.role}</td>
                <td>{emp.cost ?? '—'}</td>
                <td>
                  <button className="remove-btn" onClick={() => removeAssignee(emp)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No members assigned yet.</p>
      )}
    </div>
  );
};

export default ProjectAssignees;
