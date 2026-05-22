import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Car, Mail, Lock, Loader2, Phone, User, FileText, Upload, CheckCircle, Clock } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { toast } from "@/components/ui/use-toast";

export default function DriverRegister() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [accessToken, setAccessToken] = useState(null);
  const [ghanaCardFile, setGhanaCardFile] = useState(null);
  const [licensePhotoFile, setLicensePhotoFile] = useState(null);
  const [vehiclePhotoFile, setVehiclePhotoFile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    setLoading(true);
    try {
      await base44.auth.register({ email, password });
      setStep(2);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) {
        setAccessToken(result.access_token);
        setStep(3);
      }
    } catch (err) {
      setError(err.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await base44.auth.resendOtp(email);
      toast({ title: "Code sent", description: "Check your email for the new code." });
    } catch (err) {
      setError(err.message || "Failed to resend code");
    }
  };

  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", "/driver-register");
  };

  const uploadFile = async (file) => {
    if (!file) return null;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    return file_url;
  };

  const handleApplicationSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!ghanaCardFile || !licensePhotoFile || !vehiclePhotoFile) {
      setError("Please upload all required documents");
      return;
    }
    setLoading(true);
    try {
      if (accessToken) base44.auth.setToken(accessToken);
      const [ghanaCardUrl, licensePhotoUrl, vehiclePhotoUrl] = await Promise.all([
        uploadFile(ghanaCardFile),
        uploadFile(licensePhotoFile),
        uploadFile(vehiclePhotoFile),
      ]);

      await base44.entities.DriverApplication.create({
        full_name: fullName,
        phone,
        email,
        vehicle_model: vehicleModel,
        vehicle_plate: vehiclePlate,
        license_number: licenseNumber,
        ghana_card_url: ghanaCardUrl,
        license_photo_url: licensePhotoUrl,
        vehicle_photo_url: vehiclePhotoUrl,
        status: "pending",
      });

      setStep(5);
    } catch (err) {
      setError(err.message || "Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  const FileUploadField = ({ label, file, setFile, fieldId }) => (
    <div className="space-y-2">
      <Label htmlFor={fieldId}>{label}</Label>
      <label
        htmlFor={fieldId}
        className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
      >
        {file ? (
          <div className="flex items-center gap-2 text-sm text-primary">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">{file.name}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Upload className="w-6 h-6" />
            <span className="text-xs">Tap to upload photo</span>
          </div>
        )}
        <input
          id={fieldId}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => setFile(e.target.files[0] || null)}
        />
      </label>
    </div>
  );

  // Step 5: Application Submitted
  if (step === 5) {
    return (
      <AuthLayout icon={Clock} title="Application Submitted!" subtitle="We'll review your details shortly">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <p className="text-sm text-muted-foreground">
            Your driver application has been submitted. Our admin team will review your documents and activate your account once approved.
          </p>
          <p className="text-xs text-muted-foreground bg-muted rounded-lg p-3">
            You will be notified when your application is approved.
          </p>
          <Button className="w-full h-12" asChild>
            <Link to="/login">Back to Login</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  // Step 4: Document Upload
  if (step === 4) {
    return (
      <AuthLayout icon={Upload} title="Upload Documents" subtitle="We need to verify your identity and vehicle">
        {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
        <form onSubmit={handleApplicationSubmit} className="space-y-4">
          <FileUploadField label="Ghana Card / National ID *" file={ghanaCardFile} setFile={setGhanaCardFile} fieldId="ghana-card" />
          <FileUploadField label="Driver's License Photo *" file={licensePhotoFile} setFile={setLicensePhotoFile} fieldId="license-photo" />
          <FileUploadField label="Vehicle Photo *" file={vehiclePhotoFile} setFile={setVehiclePhotoFile} fieldId="vehicle-photo" />
          <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading...</>
            ) : (
              "Submit Application"
            )}
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={() => setStep(3)}>Back</Button>
        </form>
      </AuthLayout>
    );
  }

  // Step 3: Personal and Vehicle Info
  if (step === 3) {
    return (
      <AuthLayout icon={Car} title="Your Details" subtitle="Tell us about yourself and your vehicle">
        {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
        <form onSubmit={(e) => { e.preventDefault(); setStep(4); }} className="space-y-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} className="pl-10 h-12" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type="tel" placeholder="+233 xx xxx xxxx" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10 h-12" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Vehicle Model</Label>
            <div className="relative">
              <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="e.g. Toyota Camry 2022" value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} className="pl-10 h-12" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>License Plate</Label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="ABC-1234" value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value)} className="pl-10 h-12" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{"Driver's License Number"}</Label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Your license number" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} className="pl-10 h-12" required />
            </div>
          </div>
          <Button type="submit" className="w-full h-12 font-medium">Next: Upload Documents</Button>
        </form>
      </AuthLayout>
    );
  }

  // Step 2: OTP Verification
  if (step === 2) {
    return (
      <AuthLayout icon={Mail} title="Verify your email" subtitle={`We sent a code to ${email}`}>
        {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
        <div className="flex justify-center mb-6">
          <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code">
            <InputOTPGroup>
              <InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} />
              <InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button className="w-full h-12 font-medium" onClick={handleVerify} disabled={loading || otpCode.length < 6}>
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying...</> : "Verify"}
        </Button>
        <p className="text-center text-sm text-muted-foreground mt-4">
          {"Didn't receive the code? "}
          <button onClick={handleResend} className="text-primary font-medium hover:underline">Resend</button>
        </p>
      </AuthLayout>
    );
  }

  // Step 1: Account Creation
  return (
    <AuthLayout
      icon={Car}
      title="Apply to Drive"
      subtitle="Sign up to start your application"
      footer={<>Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Log in</Link></>}
    >
      <Button variant="outline" className="w-full h-12 text-sm font-medium mb-6" onClick={handleGoogle}>
        <GoogleIcon className="w-5 h-5 mr-2" />Continue with Google
      </Button>
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
        <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-3 text-muted-foreground">or</span></div>
      </div>
      {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
      <form onSubmit={handleAccountSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input type="email" autoComplete="email" autoFocus placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12" required />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input type="password" autoComplete="new-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 h-12" required />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input type="password" autoComplete="new-password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-10 h-12" required />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating account...</> : "Continue"}
        </Button>
      </form>
      <p className="text-xs text-center text-muted-foreground mt-4">By signing up, you agree to our Terms of Service and Privacy Policy</p>
    </AuthLayout>
  );
}