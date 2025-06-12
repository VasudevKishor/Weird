import React, { useState } from "react";
import axios from "axios";

const AddDepartment = () => {
  const [dept, setDept] = useState({ name: "", did: "", oid: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post("http://localhost:5000/api/departments", dept)
      .then(() => alert("Department added!"));
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Add Department</h3>
      <input placeholder="Name" onChange={e => setDept({ ...dept, name: e.target.value })} />
      <input placeholder="Dept ID" onChange={e => setDept({ ...dept, did: e.target.value })} />
      <input placeholder="Org ID" onChange={e => setDept({ ...dept, oid: e.target.value })} />
      <button type="submit">Add</button>
    </form>
  );
};

export default AddDepartment;

