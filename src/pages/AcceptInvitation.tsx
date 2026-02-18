import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { invitationService } from '../services/invitation.service';
import PageMeta from '../components/common/PageMeta';
import Input from '../components/form/input/InputField';
import Label from '../components/form/Label';
import Button from '../components/ui/button/Button';

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [invitationData, setInvitationData] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token || !email) {
        setError('Invalid invitation link. Missing token or email.');
        setIsValidating(false);
        return;
      }

      try {
        const result = await invitationService.validateInvitationToken(token);
        if (result.valid) {
          setIsValid(true);
          setInvitationData(result.invitation);
        } else {
          setError('This invitation link is invalid or has expired.');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to validate invitation.');
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token, email]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token || !email) {
      setError('Invalid invitation.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await invitationService.acceptInvitation({
        token,
        email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        password: formData.password,
        phone: formData.phone || undefined,
      });

      setSuccess(response.message);
      
      // Redirect to login after successful acceptance
      setTimeout(() => {
        navigate('/signin');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to accept invitation.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
          <p className="mt-2 text-gray-500">Validating invitation...</p>
        </div>
      </div>
    );
  }

  if (!isValid) {
    return (
      <>
        <PageMeta title="Invalid Invitation | Dashboard" description="Invalid or expired invitation link" />
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
            <div className="mx-auto h-16 w-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Invalid Invitation</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <Button onClick={() => navigate('/signin')} className="w-full">
              Go to Sign In
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta title="Accept Invitation | Dashboard" description="Accept team invitation and create your account" />
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Accept Invitation</h2>
            <p className="text-gray-600 dark:text-gray-400">
              You've been invited to join as <strong>{invitationData?.roleId}</strong>
            </p>
            <p className="text-sm text-gray-500 mt-1">{email}</p>
          </div>

          {error && (
            <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-400">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-900/30 dark:text-green-400">
              {success}
              <p className="mt-2 text-sm">Redirecting to sign in...</p>
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>First Name <span className="text-red-500">*</span></Label>
                  <Input
                    type="text"
                    name="firstName"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label>Last Name <span className="text-red-500">*</span></Label>
                  <Input
                    type="text"
                    name="lastName"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email || ''}
                  disabled
                  className="bg-gray-100 dark:bg-gray-700"
                />
              </div>

              <div>
                <Label>Phone (Optional)</Label>
                <Input
                  type="tel"
                  name="phone"
                  placeholder="+1 234 567 890"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div>
                <Label>Password <span className="text-red-500">*</span></Label>
                <Input
                  type="password"
                  name="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              <div>
                <Label>Confirm Password <span className="text-red-500">*</span></Label>
                <Input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>

              <Button
                className="w-full"
                disabled={isLoading || !formData.firstName || !formData.lastName || !formData.password || formData.password.length < 6 || formData.password !== formData.confirmPassword}
              >
                {isLoading ? 'Creating Account...' : 'Accept Invitation & Create Account'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
