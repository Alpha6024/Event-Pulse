import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useRive } from "@rive-app/react-canvas";
import toast, { Toaster } from 'react-hot-toast';
import { User, Lock, UserCheck, Shield, Users } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [selectedRole, setSelectedRole] = useState("student");

  const navigate = useNavigate();

  /* ---------------- LOGIN ---------------- */
  const login = async () => {
    try {
      if (selectedRole === "admin") {
        if (username !== "" && password !== "") {
          const res = await axios.post("http://localhost:5000/api/login", {
            username,
            password,
          });

          localStorage.setItem("token", res.data.token);
          localStorage.setItem("role", "admin");
          navigate("/admin");
          return;
        } else {
          toast.error("Please enter admin credentials");
          return;
        }
      }

      const res = await axios.post("http://localhost:5000/api/login", {
        username,
        password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);

      toast.success(`Welcome back, ${selectedRole}!`);
      if (res.data.role === "student") navigate("/student");
      if (res.data.role === "organizer") navigate("/organizer");
    } catch {
      toast.error("Invalid credentials. Please try again.");
    }
  };

  /* ---------------- STUDENT REGISTER ---------------- */
  const register = async () => {
    try {
      await axios.post("http://localhost:5000/api/register", {
        username,
        password,
      });

      toast.success("Student account created successfully! Please login.");
      setIsSignup(false);
      setUsername("");
      setPassword("");
    } catch {
      toast.error("User already exists or registration failed");
    }
  };

  /* ---------------- RIVE SETUP ---------------- */
  const { RiveComponent } = useRive({
    src: "anim.riv",
    autoplay: true,
    stateMachines: "Animation 1",
  });

  const getRoleIcon = (role) => {
    switch (role) {
      case 'student': return <Users className="w-5 h-5" />;
      case 'organizer': return <UserCheck className="w-5 h-5" />;
      case 'admin': return <Shield className="w-5 h-5" />;
      default: return <User className="w-5 h-5" />;
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 p-2 overflow-hidden">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
      <div className="bg-white/95 backdrop-blur-sm w-full max-w-5xl rounded-3xl shadow-2xl border border-white/20 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">

        {/* LEFT PANEL - ANIMATION */}
        <div className="bg-linear-to-br from-indigo-600 via-purple-600 to-blue-600 text-white flex flex-col p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          
          {/* Animation Container */}
          <div className="flex-1 flex items-center justify-center relative z-10">
            <div className="w-full h-full min-h-100 lg:min-h-125">
              <RiveComponent className="w-full h-full rounded-lg" />
            </div>
          </div>
          
          {/* Title Section */}
          <div className="text-center relative z-10 mt-6">
            <h1 className="text-3xl lg:text-4xl font-bold mb-2 text-white/90">EventPulse</h1>
            <p className="text-white/70 text-base lg:text-lg">Streamline your event management</p>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="p-8 lg:p-10 flex flex-col justify-center bg-white">
          {/* ROLE SELECTION */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Choose Your Role</h2>
            <div className="grid grid-cols-3 gap-3">
              {["student", "organizer", "admin"].map((role) => (
                <label key={role} className={`relative cursor-pointer group`}>
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
                    className="sr-only"
                  />
                  <div className={`p-4 rounded-xl border-2 transition-all duration-200 text-center ${
                    selectedRole === role 
                      ? 'border-indigo-500 bg-indigo-50 shadow-md' 
                      : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                  }`}>
                    <div className={`flex justify-center mb-2 ${
                      selectedRole === role ? 'text-indigo-600' : 'text-gray-500'
                    }`}>
                      {getRoleIcon(role)}
                    </div>
                    <span className={`capitalize text-sm font-medium ${
                      selectedRole === role ? 'text-indigo-700' : 'text-gray-700'
                    }`}>{role}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* LOGIN FORM */}
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                {isSignup ? 'Create Account' : 'Welcome Back'}
              </h3>
              <p className="text-gray-600">Sign {isSignup ? 'up' : 'in'} as {selectedRole}</p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  className="w-full border-2 border-gray-200 rounded-xl px-12 py-3 focus:border-indigo-500 focus:outline-none transition-colors duration-200 bg-gray-50 focus:bg-white"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  className="w-full border-2 border-gray-200 rounded-xl px-12 py-3 focus:border-indigo-500 focus:outline-none transition-colors duration-200 bg-gray-50 focus:bg-white"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="space-y-3">
              {!isSignup ? (
                <button
                  onClick={login}
                  className="w-full bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                >
                  Sign In
                </button>
              ) : (
                <button
                  onClick={register}
                  className="w-full bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                >
                  Create Account
                </button>
              )}
            </div>

            {/* TOGGLE SIGNUP */}
            {selectedRole === "student" && (
              <div className="text-center pt-4 border-t border-gray-200">
                {!isSignup ? (
                  <p className="text-gray-600">
                    New to EventPulse?{' '}
                    <button
                      onClick={() => setIsSignup(true)}
                      className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors duration-200"
                    >
                      Create account
                    </button>
                  </p>
                ) : (
                  <p className="text-gray-600">
                    Already have an account?{' '}
                    <button
                      onClick={() => setIsSignup(false)}
                      className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors duration-200"
                    >
                      Sign in
                    </button>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
