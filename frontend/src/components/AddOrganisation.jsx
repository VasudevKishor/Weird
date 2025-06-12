import React, { useState } from "react";
import axios from "axios";

const AddOrganisation = () => {
  const [org, setOrg] = useState({ name: "", oid: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post("http://localhost:5000/api/organisations", org)
      .then(() => alert("Organisation added!"));
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Add Organisation</h3>
      <input placeholder="Name" onChange={e => setOrg({ ...org, name: e.target.value })} />
      <input placeholder="Org ID" onChange={e => setOrg({ ...org, oid: e.target.value })} />
      <button type="submit">Add</button>
    </form>
  );
};

export default AddOrganisation;
