import React, { useState } from "react";
import axios from "axios";

const AddEmployee = () => {
  const [emp, setEmp] = useState({ eid: "", fname: "", lname: "", email: "", did: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post("http://localhost:5000/api/employees", emp)
      .then(() => alert("Employee added!"));
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Add Employee</h3>
      <input placeholder="Employee ID" onChange={e => setEmp({ ...emp, eid: e.target.value })} />
      <input placeholder="First Name" onChange={e => setEmp({ ...emp, fname: e.target.value })} />
      <input placeholder="Last Name" onChange={e => setEmp({ ...emp, lname: e.target.value })} />
      <input placeholder="Email" onChange={e => setEmp({ ...emp, email: e.target.value })} />
      <input placeholder="Dept ID" onChange={e => setEmp({ ...emp, did: e.target.value })} />
      <button type="submit">Add</button>
    </form>
  );
};

export default AddEmployee;
