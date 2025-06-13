import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ProjectAssignees.css';

const ProjectAssignees = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  // Check if project info was passed; if not, redirect back
  useEffect(() => {
    if (!state?.projectId) {
      navigate('/', { replace: true }); // or wherever your main page is
    }
  }, [state, navigate]);

  const { projectId, name, budget } = state || {};

  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [assignees, setAssignees] = useState([]);

  useEffect(() => {
    if (projectId) fetchAssignees();
  }, [projectId]);

  const fetchAssignees = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/projects/${projectId}/assignees`);
      setAssignees(res.data);
    } catch (err) {
      console.error('Failed to fetch assignees', err);
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
      const res = await axios.get(`http://localhost:5000/api/employees`, { params: { search: q } });
      setSearchResults(res.data);
    } catch (err) {
      console.error('Search error', err);
    }
  };

  const addAssignee = async emp => {
    try {
      await axios.post(`http://localhost:5000/api/projects/${projectId}/assignees`, { eid: emp.eid });
      setAssignees(prev => [...prev, emp]);
      setSearch('');
      setSearchResults([]);
    } catch (err) {
      console.error('Add error', err);
    }
  };

  const removeAssignee = async emp => {
    try {
      await axios.delete(`http://localhost:5000/api/projects/${projectId}/assignees/${emp.eid}`);
      setAssignees(prev => prev.filter(a => a.eid !== emp.eid));
    } catch (err) {
      console.error('Remove error', err);
    }
  };

  return (
    <div className="assignee-page">
      <h2>
        Project: {name} | Budget: {budget}
      </h2>

      <div className="search-container">
        <input
          type="text"
          className="search-bar"
          placeholder="Search employees..."
          value={search}
          onChange={handleSearch}
        />
        {searchResults.length > 0 && (
          <ul className="search-dropdown">
            {searchResults.map(emp => (
              <li key={emp._id} onClick={() => addAssignee(emp)}>
                {emp.fname} {emp.lname} ({emp.eid})
              </li>
            ))}
          </ul>
        )}
      </div>

      <h3>Assigned Members:</h3>
      {assignees.length ? (
        <table className="assignee-table">
          <thead>
            <tr>
              <th>EID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Remove</th>
            </tr>
          </thead>
          <tbody>
            {assignees.map(emp => (
              <tr key={emp._id}>
                <td>{emp.eid}</td>
                <td>{emp.fname} {emp.lname}</td>
                <td>{emp.email}</td>
                <td>
                  <button onClick={() => removeAssignee(emp)}>Remove</button>
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
