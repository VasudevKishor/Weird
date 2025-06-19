import React from 'react';
import './styles/ModalWrapper.css';

const API = process.env.REACT_APP_API_BASE_URL;

const ModalWrapper = ({ title, children, onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ModalWrapper;