import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useRive } from "@rive-app/react-canvas";

const API = import.meta.env.VITE_API_URL;

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [selectedRole, setSelectedRole] = useState("student");

  const navigate = useNavigate();

  const login = async () => {
    try {
      if (selectedRole === "admin") {
        if (username !== "" && password !== "") {
          const res = await axios.post(`${API}/api/login`, { username, password });
          localStorage.setItem("token", res.data.token);
          localStorage.setItem("role", "admin");
          navigate("/admin");
          return;
        } else {
          alert("Invalid admin credentials");
          return;
        }
      }

      const res = await axios.post(`${API}/api/login`, { username, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);

      if (res.data.role === "student") navigate("/student");
      if (res.data.role === "organizer") navigate("/organizer");
    } catch {
      alert("Invalid credentials");
    }
  };

  const register = async () => {
    try {
      await axios.post(`${API}/api/register`, { username, password });
      alert("Student account created. Please login.");
      setIsSignup(false);
      setUsername("");
      setPassword("");
    } catch {
      alert("User already exists");
    }
  };

  const { RiveComponent } = useRive({
    src: "anim.riv",
    autoplay: true,
    stateMachines: "Animation 1",
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-indigo-600 px-4 py-8">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:grid md:grid-cols-2">

        {/* LEFT PANEL — animation, hidden on small mobile, shown from sm up */}
        <div className="hidden sm:flex bg-white border-b-4 md:border-b-0 md:border-r-4 border-indigo-600 items-center justify-center p-6 md:p-10 h-56 sm:h-72 md:h-auto">
          <div className="w-full h-full">
            <RiveComponent className="w-full h-full" />
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="p-6 sm:p-8 md:p-10 flex flex-col justify-start md:border-l-4 border-indigo-600">

          {/* ROLE SELECTOR */}
          <div className="flex flex-wrap gap-3 sm:gap-6 mb-6">
            {["student", "organizer", "admin"].map((role) => (
              <label
                key={role}
                className={`flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-lg border-2 transition-all duration-150 ${
                  selectedRole === role
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                    : "border-gray-200 text-gray-600 hover:border-indigo-300"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={role}
                  checked={selectedRole === role}
                  onChange={() => {
                    setSelectedRole(role);
                    setIsSignup(false);
                    setUsername("");
                    setPassword("");
                  }}
                  className="accent-indigo-600"
                />
                <span className="capitalize text-sm sm:text-base font-medium">{role}</span>
              </label>
            ))}
          </div>

          <h3 className="text-xl sm:text-2xl font-bold mb-5 text-gray-800 capitalize">
            {selectedRole} Login
          </h3>

          <input
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 mb-4 text-sm sm:text-base focus:border-indigo-500 focus:outline-none bg-gray-50 focus:bg-white transition-colors"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="password"
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 mb-5 text-sm sm:text-base focus:border-indigo-500 focus:outline-none bg-gray-50 focus:bg-white transition-colors"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={login}
            className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white py-2.5 rounded-xl font-semibold text-sm sm:text-base transition-all duration-150 shadow-md hover:shadow-lg"
          >
            Login
          </button>

          {selectedRole === "student" && isSignup && (
            <button
              onClick={register}
              className="w-full bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white py-2.5 rounded-xl font-semibold text-sm sm:text-base mt-3 transition-all duration-150 shadow-md hover:shadow-lg"
            >
              Create Student Account
            </button>
          )}

          {selectedRole === "student" && (
            <div className="text-center mt-5">
              {!isSignup ? (
                <button
                  onClick={() => setIsSignup(true)}
                  className="text-indigo-600 hover:text-indigo-800 font-medium text-sm sm:text-base transition-colors"
                >
                  New student? Create account
                </button>
              ) : (
                <button
                  onClick={() => setIsSignup(false)}
                  className="text-indigo-600 hover:text-indigo-800 font-medium text-sm sm:text-base transition-colors"
                >
                  Back to login
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}