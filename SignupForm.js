// SignupForm.js - React Component for GuideSignal Signup Enhancements

import React, { useState } from "react";

export default function SignupForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState("");
  const [terms, setTerms] = useState(false);

  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  const formComplete = passwordsMatch && role && terms;

  return (
    <div className="signup-form">
      {/* Password */}
      <div className="input-group">
        <label>Password</label>
        <div className="password-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="eye-button"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>
      </div>

      {/* Confirm Password */}
      <div className="input-group">
        <label>Confirm Password</label>
        <div className="password-wrapper">
          <input
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <button
            type="button"
            className="eye-button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? "🙈" : "👁️"}
          </button>
        </div>
      </div>

      {/* Role Selection */}
      <div className="role-selection">
        <p>I am a...</p>
        <label>
          <input
            type="radio"
            name="role"
            value="student"
            checked={role === "student"}
            onChange={(e) => setRole(e.target.value)}
          />
          Student — Looking for internships and entry-level opportunities
        </label>
        <label>
          <input
            type="radio"
            name="role"
            value="jobseeker"
            checked={role === "jobseeker"}
            onChange={(e) => setRole(e.target.value)}
          />
          Job Seeker — Seeking new career opportunities
        </label>
        <label>
          <input
            type="radio"
            name="role"
            value="recruiter"
            checked={role === "recruiter"}
            onChange={(e) => setRole(e.target.value)}
          />
          Recruiter — Posting jobs and hiring talent
        </label>
      </div>

      {/* Terms Checkbox */}
      <div className="terms">
        <label>
          <input
            type="checkbox"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
          />
          I agree to the Terms of Service and Privacy Policy
        </label>
      </div>

      {/* Create Account Button */}
      <button
        type="submit"
        disabled={!formComplete}
        className={`create-account ${formComplete ? "active" : "disabled"}`}
      >
        Create Account
      </button>

      <style jsx>{`
        .create-account {
          margin-top: 20px;
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
        }
        .create-account.disabled {
          background: lightgray;
          color: gray;
          cursor: not-allowed;
        }
        .create-account.active {
          background: blue;
          color: white;
          cursor: pointer;
        }
        .password-wrapper {
          display: flex;
          align-items: center;
        }
        .eye-button {
          background: none;
          border: none;
          cursor: pointer;
          margin-left: 8px;
        }
      `}</style>
    </div>
  );
}
