import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import './EmployeeDirectory.css';
import axios from 'axios';
import ModalWrapper from './ModalWrapper';
import './ModalWrapper.css';
const API = process.env.REACT_APP_API_BASE_URL;

const OrganisationDirectory = () => {
  const [organisations, setOrganisations] = useState([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [editOid, setEditOid] = useState(null);
  const [currentOrganisation, setCurrentOrganisation] = useState({ name: '', oid: '' });
  const [formErrors, setFormErrors] = useState({});
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    fetchOrganisations();
  }, []);

  const fetchOrganisations = async () => {
    try {
      const res = await axios.get(`${API}/api/organisations`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setOrganisations(res.data);
    } catch (err) {
      console.error('Failed to fetch organisations', err);
    }
  };

  const openAddModal = () => {
    setFormMode('add');
    setCurrentOrganisation({ name: '', oid: '' });
    setEditOid(null);
    setFormErrors({});
    setGeneralError('');
    setIsModalOpen(true);
  };

  const openEditModal = (org) => {
    setFormMode('edit');
    setCurrentOrganisation({ name: org.name || '', oid: org.oid });
    setEditOid(org.oid);
    setFormErrors({});
    setGeneralError('');
    setIsModalOpen(true);
  };

  const handleDelete = async (oid) => {
    if (!window.confirm('Are you sure you want to delete this organisation?')) return;
    try {
      await axios.delete(`${API}/api/organisations/${oid}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setOrganisations(prev => prev.filter(o => o.oid !== oid));
      alert('Organisation deleted successfully');
    } catch (err) {
      console.error('Delete error', err);
      alert('Error deleting organisation');
    }
  };

  const validateField = (name, value) => {
    let errorMsg = '';

    if (name === 'oid') {
      if (!value.trim()) {
        errorMsg = 'Organisation ID is required.';
      } else if (!/^O\d{3}$/.test(value)) {
        errorMsg = 'Organisation ID must be in the format O001, O123, etc.';
      } else if (/\s/.test(value)) {
        errorMsg = 'Organisation ID cannot contain spaces.';
      }
    }

    if (name === 'name') {
      const trimmedValue = value.trim();
      if (!trimmedValue) {
        errorMsg = 'Organisation Name is required.';
      } else if (!/^[A-Za-z ]{3,50}$/.test(trimmedValue)) {
        errorMsg = 'Organisation name must be 3–50 alphabetic characters only, spaces allowed.';
      }
    }

    return errorMsg;
  };


  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentOrganisation(prev => ({ ...prev, [name]: value }));
    setFormErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    if (generalError) setGeneralError('');
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');
    setFormErrors({});

    const { name, oid } = currentOrganisation;
    const trimmedName = name.trim();
    const trimmedOid = oid.trim().toUpperCase();

    const errors = {
      name: validateField('name', trimmedName),
      oid: validateField('oid', trimmedOid)
    };

    if (formMode === 'add') {
      const exists = organisations.some(org => org.oid.toUpperCase() === trimmedOid);
      if (exists) errors.oid = 'Organisation ID already exists.';
    }

    const hasErrors = Object.values(errors).some(msg => msg);
    if (hasErrors) {
      setFormErrors(errors);
      setGeneralError('Please correct the errors in the form.');
      return;
    }

    try {
      if (formMode === 'add') {
        const res = await axios.post(`${API}/api/organisations`, { name: trimmedName, oid: trimmedOid }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setOrganisations(prev => [...prev, res.data]);
      } else if (formMode === 'edit' && editOid) {
        const res = await axios.put(`${API}/api/organisations/${editOid}`, { name: trimmedName }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setOrganisations(prev => prev.map(org => org.oid === editOid ? res.data : org));
      }
      setIsModalOpen(false);
      setCurrentOrganisation({ name: '', oid: '' });
      setEditOid(null);
      setFormMode('add');
      fetchOrganisations();
    } catch (err) {
      console.error("Submit error:", err);
      setGeneralError(`Error ${formMode === 'add' ? 'adding' : 'updating'} organisation`);
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
    return istTime.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour12: true,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    });
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
          <button
            className="add-btn"
            onClick={openAddModal}
            disabled={organisations.length >= 1}
            title={organisations.length >= 1 ? "Only one organisation allowed" : ""}
            style={{ opacity: organisations.length >= 1 ? 0.5 : 1, cursor: organisations.length >= 1 ? 'not-allowed' : 'pointer' }}
          >
            <FaPlus /> Add Organisation
          </button>
        </div>
      </div>

      <table className="employee-table">
        <thead>
          <tr>
            <th>Organisation ID</th>
            <th>Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredOrganisations.map(org => (
            <tr key={org.oid}>
              <td>{org.oid}</td>
              <td>{org.name}</td>
              <td>
                <FaEdit className="icon edit-icon" onClick={() => openEditModal(org)} />
                <FaTrash className="icon delete-icon" onClick={() => handleDelete(org.oid)} />
              </td>
            </tr>
          ))}
          {filteredOrganisations.length === 0 && (
            <tr>
              <td colSpan="5" className="no-data">No matching organisations found.</td>
            </tr>
          )}
        </tbody>
      </table>

      {isModalOpen && (
        <ModalWrapper title={formMode === 'add' ? 'Add Organisation' : 'Edit Organisation'} onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleModalSubmit} className="modal-form">
            {generalError && (
              <div
                className="form-error"
                style={{
                  backgroundColor: '#fee',
                  color: '#c33',
                  padding: '10px',
                  borderRadius: '4px',
                  marginBottom: '15px',
                  border: '1px solid #fcc',
                }}
              >
                {generalError}
              </div>
            )}

            <div className="floating-label">
              <input
                name="oid"
                type="text"
                value={currentOrganisation.oid}
                onChange={handleChange}
                disabled={formMode === 'edit'}
                placeholder=" "
                required
                style={formErrors.oid ? { borderColor: '#c33' } : {}}
              />
              <label>Organisation ID</label>
              {formErrors.oid && (
                <div className="field-error">{formErrors.oid}</div>
              )}
            </div>

            <div className="floating-label">
              <input
                name="name"
                type="text"
                value={currentOrganisation.name}
                onChange={handleChange}
                placeholder=" "
                required
                style={formErrors.name ? { borderColor: '#c33' } : {}}
              />
              <label>Organisation Name</label>
              {formErrors.name && (
                <div className="field-error">{formErrors.name}</div>
              )}
            </div>

            <button type="submit">{formMode === 'add' ? 'Add' : 'Update'}</button>
          </form>

        </ModalWrapper>
      )}
    </div>
  );
};

export default OrganisationDirectory;