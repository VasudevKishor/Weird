import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import './EmployeeDirectory.css';
import axios from 'axios';
import ModalWrapper from './ModalWrapper';

const API = process.env.REACT_APP_API_BASE_URL;

const OrganisationDirectory = () => {
  const [organisations, setOrganisations] = useState([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [editOid, setEditOid] = useState(null);
  const [currentOrganisation, setCurrentOrganisation] = useState({ name: '', oid: '' });

  useEffect(() => {
    fetchOrganisations();
  }, []);

  const fetchOrganisations = async () => {
    try {
      const res = await axios.get(`${API}/api/organisations`);
      setOrganisations(res.data);
    } catch (err) {
      console.error('Failed to fetch organisations', err);
    }
  };

  const openAddModal = () => {
    setFormMode('add');
    setCurrentOrganisation({ name: '', oid: '' });
    setEditOid(null);
    setIsModalOpen(true);
  };

  const openEditModal = (org) => {
    setFormMode('edit');
    setCurrentOrganisation({ name: org.name || '', oid: org.oid });
    setEditOid(org.oid);
    setIsModalOpen(true);
  };

  const handleDelete = async (oid) => {
    if (!window.confirm('Are you sure you want to delete this organisation?')) return;
    try {
      await axios.delete(`${API}/api/organisations/${oid}`);
      setOrganisations(prev => prev.filter(o => o.oid !== oid));
      alert('Organisation deleted successfully');
    } catch (err) {
      console.error('Delete error', err);
      alert('Error deleting organisation');
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    const { name, oid } = currentOrganisation;
    if (!name || !oid) {
      alert("All fields are required.");
      return;
    }

    try {
      if (formMode === 'add') {
        const res = await axios.post(`${API}/api/organisations`, currentOrganisation);
        setOrganisations(prev => [...prev, res.data]);
        alert("Organisation added successfully!");
      } else if (formMode === 'edit' && editOid) {
        const res = await axios.put(`${API}/api/organisations/${editOid}`, { name });
        setOrganisations(prev => prev.map(o => o.oid === editOid ? res.data : o));
        alert("Organisation updated successfully!");
      }

      setIsModalOpen(false);
      setCurrentOrganisation({ name: '', oid: '' });
      setEditOid(null);
      fetchOrganisations();
    } catch (err) {
      console.error("Modal submit error", err);
      alert(`Error ${formMode === 'add' ? 'adding' : 'updating'} organisation`);
    }
  };

  const filteredOrganisations = organisations.filter(org =>
    (org.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const convertToIST = (utcDateStr) => {
    if (!utcDateStr) return '—';
    const date = new Date(utcDateStr + "Z");
    const istOffset = 5 * 60 + 30;
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    const istTime = new Date(utc + istOffset * 60000);
    const year = istTime.getFullYear();
    const month = String(istTime.getMonth() + 1).padStart(2, '0');
    const day = String(istTime.getDate()).padStart(2, '0');
    const hours = String(istTime.getHours()).padStart(2, '0');
    const minutes = String(istTime.getMinutes()).padStart(2, '0');
    const seconds = String(istTime.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  return (
    <div className="employee-table-container">
      <div className="table-header">
        <h2>Organisation Details</h2>
        <div className="controls">
          <input
            type="text"
            className="search-bar"
            placeholder="Search organisation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="add-btn" onClick={openAddModal}>
            <FaPlus /> Add Organisation
          </button>
        </div>
      </div>

      <table className="employee-table">
        <thead>
          <tr>
            <th>Organisation ID</th>
            <th>Name</th>
            <th>Created At (IST)</th>
            <th>Updated At (IST)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredOrganisations.map(org => (
            <tr key={org.oid}>
              <td>{org.oid}</td>
              <td>{org.name}</td>
              <td>{convertToIST(org.createdAt)}</td>
              <td>{convertToIST(org.updatedAt)}</td>
              <td>
                <FaEdit className="icon edit-icon" onClick={() => openEditModal(org)} />
                <FaTrash className="icon delete-icon" onClick={() => handleDelete(org.oid)} />
              </td>
            </tr>
          ))}
          {filteredOrganisations.length === 0 && (
            <tr>
              <td colSpan="4" className="no-data">No matching organisations found.</td>
            </tr>
          )}
        </tbody>
      </table>

      {isModalOpen && (
        <ModalWrapper title={formMode === 'add' ? 'Add Organisation' : 'Edit Organisation'} onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleModalSubmit} className="modal-form">
            <input
              type="text"
              placeholder="Organisation ID"
              value={currentOrganisation.oid}
              onChange={(e) => setCurrentOrganisation({ ...currentOrganisation, oid: e.target.value })}
              disabled={formMode === 'edit'}
            />
            <input
              type="text"
              placeholder="Organisation Name"
              value={currentOrganisation.name}
              onChange={(e) => setCurrentOrganisation({ ...currentOrganisation, name: e.target.value })}
            />
            <button type="submit">{formMode === 'add' ? 'Add' : 'Update'}</button>
          </form>
        </ModalWrapper>
      )}
    </div>
  );
};

export default OrganisationDirectory;
