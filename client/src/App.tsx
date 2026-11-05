import { APITester } from "./APITester";
import "./index.css";

import logo from "./logo.svg";
import reactLogo from "./react.svg";

export function App() {
  return (
    <div className="app">
      <div className="logo-container">
        <img src={logo} alt="Bun Logo" className="logo bun-logo" />
        <img src={reactLogo} alt="React Logo" className="logo react-logo" />
      </div>

        <h1>My application is deployed on Fly.io!</h1>
        <p>
            This version is running in production.
        </p>
      <APITester />
    </div>
  );
}

export default App;
