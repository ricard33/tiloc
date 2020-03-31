import React, { useState } from "react";

import { Link } from "react-router-dom";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = e => {
    e.preventDefault();
    console.error("Not implemented!!1");
  };

  return (
    <form onSubmit={onSubmit}>
      <fieldset>
        <legend>Login</legend>
        <p>
          <label htmlFor="username">Username</label>
          <input
            type="text" id="username"
            value={username}
            onChange={e => setUsername(e.target.value)}/>
        </p>
        <p>
          <label htmlFor="password">Password</label>
          <input
            type="password" id="password"
            value={password}
            onChange={e => setPassword(e.target.value)}/>
        </p>
        <p>
          <button type="submit">Login</button>
        </p>

        <p>
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </fieldset>
    </form>
  );
};

export default Login;
