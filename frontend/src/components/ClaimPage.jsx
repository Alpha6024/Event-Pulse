import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Award, Download, AlertCircle, Loader } from "lucide-react";

const API = import.meta.env.VITE_API_URL;

export default function ClaimPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // loading | success | error | login
  const [message, setMessage] = useState("");
  const [certUrl, setCertUrl] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setStatus("login");
      return;
    }
    const role = localStorage.getItem("role");
    if (role !== "student") {
      setStatus("error");
      setMessage("Only students can claim certificates.");
      return;
    }
    axios
      .post(`${API}/api/events/${eventId}/claim`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setCertUrl(`${API}${res.data.certUrl}`);
        setStatus("success");
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.response?.data?.message || "Failed to claim certificate.");
      });
  }, [eventId]);

  const download = async () => {
    const res = await fetch(certUrl);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Certificate_${eventId}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-indigo-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center">
        {status === "loading" && (
          <>
            <Loader className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Claiming your certificate...</p>
          </>
        )}
        {status === "success" && (
          <>
            <Award className="w-14 h-14 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Certificate Claimed!</h2>
            <p className="text-gray-500 text-sm mb-6">Your certificate is ready to download.</p>
            <button
              onClick={download}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 mb-3 transition-colors"
            >
              <Download size={18} /> Download Certificate
            </button>
            <button
              onClick={() => navigate("/student")}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition-colors"
            >
              Go to Dashboard
            </button>
          </>
        )}
        {status === "error" && (
          <>
            <AlertCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Claim Failed</h2>
            <p className="text-gray-500 text-sm mb-6">{message}</p>
            <button
              onClick={() => navigate("/student")}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition-colors"
            >
              Back to Dashboard
            </button>
          </>
        )}
        {status === "login" && (
          <>
            <AlertCircle className="w-14 h-14 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Login Required</h2>
            <p className="text-gray-500 text-sm mb-6">Please login as a student to claim your certificate.</p>
            <button
              onClick={() => navigate("/")}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition-colors"
            >
              Go to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
