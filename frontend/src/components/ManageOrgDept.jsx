import React, { useState } from 'react';
import axios from 'axios';
import './styles/ManageOrgDept.css';

const ManageOrgDept = ({ goBack }) => {
  const [org, setOrg] = useState({ oid: '', name: '' });
  const [dept, setDept] = useState({ did: '', name: '', oid: '' });

  const handleOrgSubmit = async () => {
    await axios.post("http://localhost:5000/api/organisations", org);
    alert("Organisation added!");
  };

  const handleDeptSubmit = async () => {
    await axios.post("http://localhost:5000/api/departments", dept);
    alert("Department added!");
  };

  return (
    <div className="org-dept-container">
      <h2>Manage Organisation and Departments</h2>

      <div className="form-card">
        <h3>Add Organisation</h3>
        <input placeholder="Org ID" onChange={e => setOrg({ ...org, oid: e.target.value })} />
        <input placeholder="Name" onChange={e => setOrg({ ...org, name: e.target.value })} />
        <button onClick={handleOrgSubmit}>Add Organisation</button>
      </div>

      <div className="form-card">
        <h3>Add Department (under Org)</h3>
        <input placeholder="Dept ID" onChange={e => setDept({ ...dept, did: e.target.value })} />
        <input placeholder="Name" onChange={e => setDept({ ...dept, name: e.target.value })} />
        <input placeholder="Org ID" onChange={e => setDept({ ...dept, oid: e.target.value })} />
        <button onClick={handleDeptSubmit}>Add Department</button>
      </div>

      <button onClick={goBack}>Back to Dashboard</button>
    </div>
  );
};

export default ManageOrgDept;
