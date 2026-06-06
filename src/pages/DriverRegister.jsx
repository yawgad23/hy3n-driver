import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { firebaseClient } from "@/api/firebaseClient";
import { getAuth, onAuthStateChanged, reload, sendEmailVerification } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Car, Mail, Lock, Loader2, Phone, User, FileText, Upload, CheckCircle, Clock, RefreshCw, Camera } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { toast } from "@/components/ui/use-toast";

export default function DriverRegister() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("+233");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [momoNumber, setMomoNumber] = useState("+233");
  const [ghanaCardFrontFile, setGhanaCardFrontFile] = useState(null);
  const [ghanaCardBackFile, setGhanaCardBackFile] = useState(null);
  const [licenseFrontFile, setLicenseFrontFile] = useState(null);
  const [licenseBackFile, setLicenseBackFile] = useState(null);
  const [vehiclePhotoFile, setVehiclePhotoFile] = useState(null);
  const [insurancePhotoFile, setInsurancePhotoFile] = useState(null);
  const [roadworthyPhotoFile, setRoadworthyPhotoFile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(false);
  const pollRef = useRef(null);

  const auth = getAuth();

  // If already logged in, skip account creation steps
  useEffect(() => {
    firebaseClient.auth.me().then(user => {
      if (user) {
        setEmail(user.email || "");
        // Pre-fill full name from Google profile if available
        const firebaseUser = auth.currentUser;
        if (firebaseUser?.displayName && !fullName) {
          setFullName(firebaseUser.displayName);
        }
        firebaseClient.entities.DriverProfile.filter({ user_id: user.id }).then(profiles => {
          if (profiles.length > 0) {
            window.location.href = "/driver-app";
          } else {
            // Google users have emailVerified = true, skip step 2
            if (firebaseUser && !firebaseUser.emailVerified) {
              setStep(2);
            } else {
              setStep(3);
            }
          }
        }).catch(() => setStep(3));
      }
    }).catch(() => {});

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Start polling for email verification when on step 2
  useEffect(() => {
    if (step === 2) {
      startVerificationPolling();
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [step]);

  const startVerificationPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    // Poll every 3 seconds to check if email has been verified
    pollRef.current = setInterval(async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        await reload(user); // Refresh user data from Firebase
        if (user.emailVerified) {
          clearInterval(pollRef.current);
          toast({ title: "Email verified!", description: "Proceeding to your profile setup." });
          setStep(3);
        }
      } catch (e) {
        // Ignore polling errors
      }
    }, 3000);
  };

  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    setLoading(true);
    try {
      await firebaseClient.auth.register({ email, password });
      // Send verification email
      const user = auth.currentUser;
      if (user && !user.emailVerified) {
        await sendEmailVerification(user);
      }
      setStep(2);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use' || err.message?.includes('email-already-in-use')) {
        try {
          await firebaseClient.auth.loginViaEmailPassword(email, password);
          const user = auth.currentUser;
          if (user && !user.emailVerified) {
            await sendEmailVerification(user);
            setStep(2);
          } else {
            setStep(3);
          }
          return;
        } catch (loginErr) {
          setError("Email already registered. Please use the correct password to continue, or go to Login.");
        }
      } else {
        setError(err.message || "Registration failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setError("");
    try {
      const user = auth.currentUser;
      if (user) {
        await sendEmailVerification(user);
        toast({ title: "Email sent!", description: "Check your inbox for the verification link." });
      }
    } catch (err) {
      if (err.code === 'auth/too-many-requests') {
        setError("Too many requests. Please wait a few minutes before trying again.");
      } else {
        setError(err.message || "Failed to resend verification email");
      }
    }
  };

  const handleCheckNow = async () => {
    setCheckingVerification(true);
    try {
      const user = auth.currentUser;
      if (!user) { setCheckingVerification(false); return; }
      await reload(user);
      if (user.emailVerified) {
        clearInterval(pollRef.current);
        toast({ title: "Email verified!", description: "Proceeding to your profile setup." });
        setStep(3);
      } else {
        toast({ title: "Not verified yet", description: "Please click the link in your email first.", variant: "destructive" });
      }
    } catch (e) {
      setError("Could not check verification status. Please try again.");
    } finally {
      setCheckingVerification(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      await firebaseClient.auth.loginWithProvider("google", "/driver-register");
    } catch (err) {
      if (err.code === 'auth/operation-not-allowed') {
        setError("Google Sign-In is not enabled. Please use email/password instead.");
      } else if (err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user') {
        // User closed the popup — not an error
      } else {
        setError(err.message || "Google sign-in failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file) => {
    if (!file) return null;
    try {
      const { file_url } = await firebaseClient.integrations.Core.UploadFile({ file });
      return file_url;
    } catch {
      return null;
    }
  };

  const handleApplicationSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const [ghanaCardFrontUrl, ghanaCardBackUrl, licenseFrontUrl, licenseBackUrl, vehiclePhotoUrl, insurancePhotoUrl, roadworthyPhotoUrl] = await Promise.all([
        uploadFile(ghanaCardFrontFile),
        uploadFile(ghanaCardBackFile),
        uploadFile(licenseFrontFile),
        uploadFile(licenseBackFile),
        uploadFile(vehiclePhotoFile),
        uploadFile(insurancePhotoFile),
        uploadFile(roadworthyPhotoFile),
      ]);

      const user = await firebaseClient.auth.me();

      const existingProfiles = await firebaseClient.entities.DriverProfile.filter({ user_id: user.id });

      const profileData = {
        user_id: user.id,
        full_name: fullName,
        phone,
        email: email || user?.email,
        momo_number: momoNumber,
        vehicle_make: vehicleMake,
        vehicle_model: vehicleModel,
        license_plate: vehiclePlate,
        ghana_card_front_url: ghanaCardFrontUrl,
        ghana_card_back_url: ghanaCardBackUrl,
        ghana_card_url: ghanaCardFrontUrl, // backward compat
        drivers_license_front_url: licenseFrontUrl,
        drivers_license_back_url: licenseBackUrl,
        drivers_license_url: licenseFrontUrl, // backward compat
        vehicle_registration_url: vehiclePhotoUrl,
        insurance_url: insurancePhotoUrl,
        roadworthy_url: roadworthyPhotoUrl,
        approval_status: "pending",
        is_online: false,
        total_earnings: 0,
        total_rides: 0,
        rating: 5,
      };

      if (existingProfiles.length > 0) {
        await firebaseClient.entities.DriverProfile.update(existingProfiles[0].id, profileData);
      } else {
        await firebaseClient.entities.DriverProfile.create(profileData);
      }

      setStep(5);
    } catch (err) {
      console.error('[DriverRegister] Submission error:', err);
      let msg = err?.message || "Failed to submit application";
      if (msg.includes('permission-denied') || msg.includes('PERMISSION_DENIED')) {
        msg = "Permission denied: Please check your Firestore security rules in Firebase Console and allow authenticated users to write to the DriverProfile collection.";
      } else if (msg.includes('storage') || msg.includes('quota') || msg.includes('billing')) {
        msg = "File upload failed: Firebase Storage requires the Blaze plan. Please upgrade your Firebase project or contact support.";
      } else if (msg.includes('network') || msg.includes('offline')) {
        msg = "Network error: Please check your internet connection and try again.";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const FileUploadField = ({ label, file, setFile, fieldId }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      {file ? (
        <div className="flex items-center justify-between w-full px-4 py-3 border border-primary/40 bg-primary/5 rounded-xl">
          <div className="flex items-center gap-2 text-sm text-primary">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span className="font-medium truncate max-w-[180px]">{file.name}</span>
          </div>
          <button
            type="button"
            onClick={() => setFile(null)}
            className="text-xs text-muted-foreground hover:text-destructive transition ml-2 shrink-0"
          >
            Remove
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {/* Upload from device */}
          <label
            htmlFor={fieldId + "-upload"}
            className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
          >
            <Upload className="w-5 h-5 text-muted-foreground mb-1" />
            <span className="text-xs text-muted-foreground text-center leading-tight">Upload<br/>from device</span>
            <input
              id={fieldId + "-upload"}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files[0] || null)}
            />
          </label>
          {/* Take photo with camera */}
          <label
            htmlFor={fieldId + "-camera"}
            className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
          >
            <Camera className="w-5 h-5 text-muted-foreground mb-1" />
            <span className="text-xs text-muted-foreground text-center leading-tight">Take<br/>photo</span>
            <input
              id={fieldId + "-camera"}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => setFile(e.target.files[0] || null)}
            />
          </label>
        </div>
      )}
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
            Your driver application has been submitted. Our admin team will review your details and activate your account once approved.
          </p>
          <p className="text-xs text-muted-foreground bg-muted rounded-lg p-3">
            You will be notified when your application is approved.
          </p>
          <Button className="w-full h-12" asChild>
            <Link to="/driver-app">Go to Driver App</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  // Step 4: Document Upload
  if (step === 4) {
    const canSubmit = ghanaCardFrontFile && ghanaCardBackFile && licenseFrontFile && licenseBackFile && vehiclePhotoFile && insurancePhotoFile && roadworthyPhotoFile;
    return (
      <AuthLayout icon={Upload} title="Upload Documents" subtitle="We need to verify your identity and vehicle">
        {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
        <form onSubmit={handleApplicationSubmit} className="space-y-4">
          {!canSubmit && (
            <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2 font-medium">
              Please upload all required documents
            </p>
          )}
          <FileUploadField label="Ghana Card / National ID — Front" file={ghanaCardFrontFile} setFile={setGhanaCardFrontFile} fieldId="ghana-card-front" />
          <FileUploadField label="Ghana Card / National ID — Back" file={ghanaCardBackFile} setFile={setGhanaCardBackFile} fieldId="ghana-card-back" />
          <FileUploadField label="Driver's License — Front" file={licenseFrontFile} setFile={setLicenseFrontFile} fieldId="license-front" />
          <FileUploadField label="Driver's License — Back" file={licenseBackFile} setFile={setLicenseBackFile} fieldId="license-back" />
          <FileUploadField label="Vehicle Photo" file={vehiclePhotoFile} setFile={setVehiclePhotoFile} fieldId="vehicle-photo" />
          <FileUploadField label="Vehicle Insurance Certificate" file={insurancePhotoFile} setFile={setInsurancePhotoFile} fieldId="insurance-photo" />
          <FileUploadField label="Road Worthy Certificate" file={roadworthyPhotoFile} setFile={setRoadworthyPhotoFile} fieldId="roadworthy-photo" />
          <Button type="submit" className="w-full h-12 font-medium" disabled={loading || !canSubmit}>
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</> : "Submit Application"}
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
            <div className="flex h-12">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm font-medium select-none">+233</span>
              <Input
                type="tel"
                placeholder="xx xxx xxxx"
                value={phone.replace(/^\+233/, '')}
                onChange={(e) => {
                  const digits = e.target.value.replace(/[^0-9]/g, '');
                  setPhone('+233' + digits);
                }}
                className="rounded-l-none h-12"
                maxLength={9}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>MoMo Number (for receiving payments)</Label>
            <div className="flex h-12">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm font-medium select-none">+233</span>
              <Input
                type="tel"
                placeholder="xx xxx xxxx"
                value={momoNumber.replace(/^\+233/, '')}
                onChange={(e) => {
                  const digits = e.target.value.replace(/[^0-9]/g, '');
                  setMomoNumber('+233' + digits);
                }}
                className="rounded-l-none h-12"
                maxLength={9}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Vehicle Make</Label>
            <div className="relative">
              <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="e.g. Toyota" value={vehicleMake} onChange={(e) => setVehicleMake(e.target.value)} className="pl-10 h-12" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Vehicle Model</Label>
            <div className="relative">
              <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="e.g. Camry 2022" value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} className="pl-10 h-12" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>License Plate</Label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="ABC-1234" value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value)} className="pl-10 h-12" required />
            </div>
          </div>
          <Button type="submit" className="w-full h-12 font-medium">Next: Upload Documents</Button>
        </form>
      </AuthLayout>
    );
  }

  // Step 2: Email Verification (Firebase link-based)
  if (step === 2) {
    return (
      <AuthLayout icon={Mail} title="Verify your email" subtitle={`We sent a verification link to ${email}`}>
        {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Mail className="w-10 h-10 text-primary" />
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              A verification link has been sent to:
            </p>
            <p className="font-semibold text-foreground">{email}</p>
            <p className="text-xs text-muted-foreground">
              Open your email app, find the message from Firebase, and click the verification link. This page will update automatically once verified.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Button
              className="w-full h-12 font-medium"
              onClick={handleCheckNow}
              disabled={checkingVerification}
            >
              {checkingVerification
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Checking...</>
                : <><RefreshCw className="w-4 h-4 mr-2" />I've verified my email</>
              }
            </Button>
            <Button
              variant="outline"
              className="w-full h-12"
              onClick={handleResendVerification}
            >
              Resend verification email
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Check your spam/junk folder if you don't see the email.
          </p>
        </div>
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
      <p className="text-xs text-center text-muted-foreground mt-4">
        By signing up, you agree to our{" "}
        <a href="#" className="underline">Terms of Service</a> and{" "}
        <a href="#" className="underline">Privacy Policy</a>.
      </p>
    </AuthLayout>
  );
}
