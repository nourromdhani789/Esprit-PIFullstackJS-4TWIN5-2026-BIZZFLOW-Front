import { useState, FormEvent, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";
import { faceAuthService } from "../../services/face-auth.service";
import { FaceLogin } from "./FaceLogin";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Face ID state
  const [showFaceLogin, setShowFaceLogin] = useState(false);
  const [hasFaceId, setHasFaceId] = useState(false);
  const [isCheckingFaceId, setIsCheckingFaceId] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  // Check if email has Face ID enrolled
  useEffect(() => {
    const checkFaceId = async () => {
      if (email && email.includes('@')) {
        setIsCheckingFaceId(true);
        console.log('[SignInForm] Checking Face ID for:', email);
        try {
          const result = await faceAuthService.checkEnrollment(email);
          console.log('[SignInForm] Face ID check result:', result);
          setHasFaceId(result.hasFaceId);
        } catch (err) {
          console.error('[SignInForm] Face ID check error:', err);
          setHasFaceId(false);
        } finally {
          setIsCheckingFaceId(false);
        }
      } else {
        setHasFaceId(false);
      }
    };

    const debounceTimer = setTimeout(checkFaceId, 500);
    return () => clearTimeout(debounceTimer);
  }, [email]);

  const handleFaceLoginSuccess = useCallback(() => {
    setShowFaceLogin(false);
    navigate("/");
  }, [navigate]);

  const handleSwitchToPassword = useCallback(() => {
    setShowFaceLogin(false);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      console.log('Attempting login with email:', email);
      await login(email, password);
      console.log('Login successful, navigating to dashboard');
      navigate("/");
    } catch (err: any) {
      console.error('Login error caught in form:', err);
      console.error('Error message:', err.message);
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="w-full max-w-md pt-10 mx-auto">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon className="size-5" />
          Back to dashboard
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and password to sign in!
            </p>
          </div>
          
          {error && (
            <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-400" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <Label>
                  Email <span className="text-error-500">*</span>{" "}
                </Label>
                <Input 
                  type="email"
                  placeholder="info@gmail.com"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label>
                  Password <span className="text-error-500">*</span>{" "}
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  >
                    {showPassword ? (
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    )}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox checked={isChecked} onChange={setIsChecked} />
                  <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                    Keep me logged in
                  </span>
                </div>
                <Link
                  to="/forgot-password"
                  className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Forgot password?
                </Link>
              </div>
              <div>
                <Button type="submit" className="w-full" size="sm" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>
              </div>

              {/* Face ID Login Option */}
              {hasFaceId && !isCheckingFaceId && (
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-2 text-gray-500 dark:bg-gray-800 dark:text-gray-400">Or</span>
                  </div>
                </div>
              )}

              {hasFaceId && !isCheckingFaceId && (
                <button
                  type="button"
                  onClick={() => setShowFaceLogin(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Sign in with Face ID
                </button>
              )}
              
              {/* Debug: Test Face ID button - shows even if hasFaceId is false */}
              {!hasFaceId && !isCheckingFaceId && email.includes('@') && (
                <button
                  type="button"
                  onClick={() => setShowFaceLogin(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-400 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Test Face ID Login (Debug)
                </button>
              )}

              {isCheckingFaceId && email.includes('@') && (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Checking Face ID availability...
                </div>
              )}
            </div>
          </form>

          <div className="mt-5">
            <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
              Don&apos;t have an account? {""}
              <Link
                to="/signup"
                className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Face Login Modal */}
      {showFaceLogin && (
        <FaceLogin
          email={email}
          onLoginSuccess={handleFaceLoginSuccess}
          onCancel={() => setShowFaceLogin(false)}
          onSwitchToPassword={handleSwitchToPassword}
        />
      )}
    </div>
  );
}
