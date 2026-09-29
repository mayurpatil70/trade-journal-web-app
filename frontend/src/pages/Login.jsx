// // frontend/src/pages/Login.jsx
// import { useState } from "react";
// import api from "../api/axios";
// import { ArrowRight, Activity } from "lucide-react";

// export default function Login() {
//   const [email, setEmail] = useState("");
//   const [status, setStatus] = useState("idle");
//   const [errorMessage, setErrorMessage] = useState("");

//   const handleLogin = async (e) => {
//     e.preventDefault();
//     if (!email) return;
//     setStatus("loading");
//     setErrorMessage("");

//     try {
//       await api.post("/api/auth/login", { email });
//       setStatus("success");
//     } catch (error) {
//       setStatus("error");
//       setErrorMessage(
//         error.response?.data?.error || "Failed to send login link.",
//       );
//     }
//   };

//   return (
//     <div
//       className="min-h-screen bg-[#020202] text-white flex items-center justify-center p-6"
//       style={{ fontFamily: "'Geist Sans', sans-serif" }}
//     >
//       {/* Centered Card Container */}
//       <div className="w-full max-w-md bg-[#121418]">
//         {/* border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl flex flex-col items-center justify-center text-cente */}
//         {/* Logo & Branding */}
//         <div className="flex flex-col items-center mb-8">
//           <div className="w-14 h-14 bg-[#6366f1] rounded-full flex items-center justify-center mb-5 shadow-[0_0_30px_rgba(99,102,241,0.3)]">
//             <Activity className="w-7 h-7 text-white" />
//           </div>
//           <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
//             Forex Notes
//           </h1>
//           <p className="text-[10px] font-bold tracking-[0.25em] text-gray-500 uppercase">
//             Discipline Today.
//             <br />
//             Freedom Tomorrow.
//           </p>
//         </div>

//         {status === "success" ? (
//           <div className="w-full bg-[#1a1d24] border border-white/5 rounded-2xl p-6 text-center animate-in fade-in">
//             <h3 className="text-lg font-semibold text-white mb-2">
//               Check your inbox
//             </h3>
//             <p className="text-gray-400 text-sm">
//               We sent a secure link to{" "}
//               <span className="text-white font-medium">{email}</span>
//             </p>
//           </div>
//         ) : (
//           <div className="w-full animate-in fade-in duration-300">
//             <h2 className="text-xl font-semibold text-white mb-2">
//               Sign in or register
//             </h2>
//             <p className="text-gray-400 text-sm mb-8 px-4">
//               Enter your email to receive a secure, passwordless verification
//               link. No password required.
//             </p>

//             <form
//               onSubmit={handleLogin}
//               className="space-y-5 w-full flex flex-col items-center"
//             >
//               <div className="w-full text-left">
//                 <label className="block text-xs font-medium text-gray-400 mb-2 ml-1">
//                   Email Address
//                 </label>
//                 <input
//                   type="email"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   className="w-full px-5 py-4 bg-[#1a1d24] border border-white/10 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:border-[#6366f1] transition-colors"
//                   placeholder="you@example.com"
//                   required
//                   disabled={status === "loading"}
//                 />
//               </div>

//               {status === "error" && (
//                 <p className="text-red-400 text-sm">{errorMessage}</p>
//               )}

//               <button
//                 type="submit"
//                 disabled={status === "loading"}
//                 className="w-full py-4 px-6 bg-[#6366f1] hover:bg-[#4f46e5] text-white font-semibold rounded-2xl transition-all flex justify-center items-center gap-2 disabled:opacity-50"
//               >
//                 {status === "loading" ? "Sending..." : "Send Verification Code"}
//                 <ArrowRight className="w-5 h-5" />
//               </button>
//             </form>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

import React, { useState } from "react";
import { Activity, ArrowRight } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();

    // Connect your backend here later
    console.log("Email:", email);
  };

  return (
    <div
      className="min-h-screen bg-[#020202] text-white flex items-center justify-center px-6"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <div className="w-full max-w-2xl">
        {/* Logo + Brand */}
        <div className="flex items-center gap-5 mb-14">
          <div
            className="
              w-16 h-16
              rounded-full
              bg-[#6366F1]
              flex items-center justify-center
              shadow-[0_0_30px_rgba(99,102,241,0.25)]
            "
          >
            <Activity className="w-8 h-8 text-white" strokeWidth={2} />
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-white">
            Forex Notes
          </h1>
        </div>

        {/* Login Content */}
        <div className="w-full">
          <h2 className="text-3xl font-semibold text-white mb-4">
            Sign in or register
          </h2>

          <p className="text-gray-400 text-base leading-relaxed mb-10">
            Enter your email to receive a secure, passwordless verification
            code.
          </p>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email */}
            <div className="w-full">
              <label
                htmlFor="email"
                className="
                  block
                  text-sm
                  font-medium
                  text-gray-400
                  mb-3
                "
              >
                Email Address
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="
                  w-full
                  px-6
                  py-5
                  bg-[#1a1b20]
                  border
                  border-white/10
                  rounded-2xl
                  text-white
                  text-base
                  placeholder:text-gray-600
                  outline-none
                  transition-all
                  duration-200
                  focus:border-[#6366F1]
                  focus:ring-1
                  focus:ring-[#6366F1]
                "
              />
            </div>

            {/* Button */}
            <button
              type="submit"
              className="
                w-full
                py-5
                px-6
                bg-[#6366F1]
                hover:bg-[#5558E8]
                active:bg-[#4F46E5]
                text-white
                font-semibold
                text-base
                rounded-2xl
                transition-all
                duration-200
                flex
                justify-center
                items-center
                gap-3
              "
            >
              Send Verification Code
              <ArrowRight className="w-6 h-6" strokeWidth={2} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
