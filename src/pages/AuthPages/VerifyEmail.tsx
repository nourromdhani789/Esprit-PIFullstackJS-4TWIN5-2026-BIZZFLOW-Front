import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { authService } from "../../services/auth.service";
import Button from "../../components/ui/button/Button";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    const token = searchParams.get("token");
    
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link. No token provided.");
      return;
    }

    const verifyEmail = async () => {
      try {
        const result = await authService.verifyEmail(token);
        setStatus("success");
        setMessage(result.message || "Email verified successfully!");
      } catch (error: any) {
        setStatus("error");
        setMessage(error.message || "Failed to verify email. The link may be expired or invalid.");
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          {status === "verifying" && (
            <>
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-500 mx-auto mb-6"></div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Verifying Email
              </h1>
              <p className="text-gray-500 dark:text-gray-400">{message}</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Email Verified!
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mb-6">{message}</p>
              <Button onClick={() => navigate("/signin")} className="w-full">
                Go to Sign In
              </Button>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Verification Failed
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mb-6">{message}</p>
              <div className="space-y-3">
                <Button onClick={() => navigate("/signin")} variant="outline" className="w-full">
                  Go to Sign In
                </Button>
                <Button onClick={() => navigate("/forgot-password")} className="w-full">
                  Resend Verification Email
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
