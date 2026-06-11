import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { firebaseClient } from "@/api/firebaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { LogIn, Mail, Lock, Loader2, Fingerprint, UserPlus } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load saved credentials if remember me was enabled
    const savedEmail = localStorage.getItem("driver_remember_email");
    const savedPassword = localStorage.getItem("driver_remember_password");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
      if (savedPassword) {
        setPassword(savedPassword);
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await firebaseClient.auth.loginViaEmailPassword(email, password);
      
      // Save credentials if remember me is enabled
      if (rememberMe) {
        localStorage.setItem("driver_remember_email", email);
        if (password) {
          localStorage.setItem("driver_remember_password", password);
        }
      } else {
        localStorage.removeItem("driver_remember_email");
        localStorage.removeItem("driver_remember_password");
      }
      
      window.location.href = "/driver-app";
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    const savedEmail = localStorage.getItem("driver_remember_email");
    const savedPassword = localStorage.getItem("driver_remember_password");
    
    if (!savedEmail || !savedPassword) {
      setError("No saved credentials found. Please login normally first.");
      return;
    }
    
    setLoading(true);
    try {
      await firebaseClient.auth.loginViaEmailPassword(savedEmail, savedPassword);
      window.location.href = "/driver-app";
    } catch (err) {
      setError("Biometric login failed. Please login normally.");
      localStorage.removeItem("driver_remember_email");
      localStorage.removeItem("driver_remember_password");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      await firebaseClient.auth.loginWithProvider("google", "/driver-app");
    } catch (err) {
      if (err.code === 'auth/operation-not-allowed') {
        setError("Google Sign-In is not enabled. Please contact support.");
      } else if (err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user') {
        // User closed the popup — not an error
      } else {
        setError(err.message || "Google sign-in failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={LogIn}
      title="Akwaaba"
      subtitle="Log in to your account"
      footer={
        <>
          Don't have an account?{" "}
          <div className="flex flex-col gap-1 mt-2">
            <Link to="/register" className="text-primary font-medium hover:underline">
              
            </Link>
            <Link to="/driver-register" className="text-accent font-medium hover:underline">
              Become a driver
            </Link>
          </div>
          <div className="mt-3">
            Forgot password?{" "}
            <Link to="/forgot-password" className="text-primary font-medium hover:underline">
              Reset it
            </Link>
          </div>
        </>
      }
    >
      <Button
        variant="outline"
        className="w-full h-12 text-sm font-medium mb-6"
        onClick={handleGoogle}
      >
        <GoogleIcon className="w-5 h-5 mr-2" />
        Continue with Google
      </Button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">or</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Biometric Login Button */}
      {(localStorage.getItem("driver_remember_email") || localStorage.getItem("driver_remember_password")) && (
        <Button
          variant="outline"
          className="w-full h-12 text-sm font-medium mb-4 gap-2"
          onClick={handleBiometricLogin}
          disabled={loading}
        >
          <Fingerprint className="w-5 h-5" />
          Quick Login with Biometric
        </Button>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        
        {/* Remember Me */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch
              id="remember-me"
              checked={rememberMe}
              onCheckedChange={setRememberMe}
            />
            <Label htmlFor="remember-me" className="text-sm cursor-pointer">
              Remember me
            </Label>
          </div>
          <p className="text-xs text-muted-foreground">
            Saves login for quick access
          </p>
        </div>
        
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Logging in...
            </>
          ) : (
            "Log in"
          )}
        </Button>
      </form>

      <div className="mt-6 pt-6 border-t border-border">
        <p className="text-center text-sm text-muted-foreground mb-3">New driver? Join the fleet</p>
        <Button variant="outline" className="w-full h-12 font-medium" asChild>
          <Link to="/driver-register">
            <UserPlus className="w-4 h-4 mr-2" />
            Register as a Driver
          </Link>
        </Button>
      </div>
    </AuthLayout>
  );
}