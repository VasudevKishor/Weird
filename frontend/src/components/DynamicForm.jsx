import React, { useState } from 'react';
import './styles/ModalWrapper.css';

const DynamicForm = ({ title = '', fields = [], onSubmit }) => {
  const initialState = fields.reduce((acc, field) => ({ ...acc, [field.name]: '' }), {});
  const [formData, setFormData] = useState(initialState);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form className="modal-form" onSubmit={handleSubmit}>
      {title && <h2>{title}</h2>}
      {fields.map((field, idx) => (
        <div className="modal-form-row" key={idx}>
          <input
            type={field.type || 'text'}
            name={field.name}
            placeholder={field.placeholder || field.label || field.name}
            value={formData[field.name]}
            onChange={handleChange}
          />
        </div>
      ))}
      <button type="submit">Add</button>
    </form>
  );
};

export default DynamicForm;
