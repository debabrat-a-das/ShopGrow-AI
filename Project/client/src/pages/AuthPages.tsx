import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Store, User, Lock, Eye, EyeOff, Sparkles, 
  ArrowRight, ArrowLeft, X, CheckCircle2, AlertCircle, HelpCircle, ShieldCheck,
  ChevronDown, ChevronUp, FlaskConical
} from 'lucide-react';
import { UserRole, Shop } from '../types';
import { api } from '../services/api';

interface AuthPagesProps {
  onLoginSuccess: (role: UserRole, shopId: string) => void;
  availableShops?: Shop[];
  onOpenHowItWorks?: () => void;
  initialMode?: 'admin' | 'owner' | 'staff';
  initialShopSlug?: string;
  initialInviteToken?: string;
}

export const AuthPages: React.FC<AuthPagesProps> = ({
  onLoginSuccess,
  availableShops = [],
  onOpenHowItWorks,
  initialMode = 'owner',
  initialShopSlug,
  initialInviteToken
}) => {
  // Check if accessing private admin route: /admin/login or ?admin=true
  const isAdminRoute = initialMode === 'admin' || 
    (typeof window !== 'undefined' && (window.location.pathname.includes('/admin') || window.location.search.includes('admin=true')));

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState<boolean>(false);
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [forgotToken, setForgotToken] = useState<string>('');
  const [forgotNewPassword, setForgotNewPassword] = useState<string>('');
  const [forgotStep, setForgotStep] = useState<'REQUEST' | 'RESET' | 'DONE'>('REQUEST');
  const [forgotLoading, setForgotLoading] = useState<boolean>(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  // QA Sandbox drawer state (strictly for internal testing/QA)
  const [showQASandbox, setShowQASandbox] = useState<boolean>(false);

  // Shop context if arriving via invitation link
  const invitedShop = initialShopSlug ? availableShops.find(s => s.slug === initialShopSlug) : null;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token') || params.get('resetToken');
      const urlEmail = params.get('email');
      if (urlToken) {
        setIsForgotPasswordOpen(true);
        setForgotToken(urlToken);
        if (urlEmail) setForgotEmail(urlEmail);
        setForgotStep('RESET');
      }
    }
  }, []);

  useEffect(() => {
    setErrorMessage(null);
    if (isAdminRoute) {
      setEmail('admin@shopgrow.ai');
      setPassword('');
    } else {
      setEmail('');
      setPassword('');
    }
  }, [isAdminRoute]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setLoading(true);

    try {
      if (isAdminRoute) {
        // 1. Private Super Admin Login: Strict server-side allowlist check
        const res = await api.post('/auth/admin-login', { email: email.trim(), password });
        if (res && res.success) {
          api.setToken(res.token);
          api.setUserRole('SUPER_ADMIN');
          onLoginSuccess('SUPER_ADMIN', res.availableShops?.[0]?.id || 'shop-saha-electronics-001');
        } else {
          setErrorMessage(res?.error || 'Access Denied: Not an authorized Super Administrator.');
        }
      } else {
        // 2. Production Standard Login: Server resolves role (SHOP_OWNER, MANAGER, STAFF) and single authorized shop
        const res = await api.post('/auth/login', { email: email.trim(), password });
        if (res && res.success && res.user && res.user.role) {
          api.setToken(res.token || '');
          api.setUserRole(res.user.role);
          const shopId = res.currentShop?.id || res.user.shop_id || res.availableShops?.[0]?.id || 'shop-saha-electronics-001';
          api.setShopId(shopId);
          onLoginSuccess(res.user.role, shopId);
        } else {
          setErrorMessage(res?.error || 'Invalid email or password.');
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Authentication failed. Please check your credentials.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQALogin = async (role: UserRole, targetEmail: string, pass: string) => {
    setEmail(targetEmail);
    setPassword(pass);
    setErrorMessage(null);
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email: targetEmail, password: pass });
      if (res && res.success && res.user && res.user.role) {
        api.setToken(res.token || '');
        api.setUserRole(res.user.role);
        const shopId = res.currentShop?.id || res.user.shop_id || res.availableShops?.[0]?.id || 'shop-saha-electronics-001';
        api.setShopId(shopId);
        onLoginSuccess(res.user.role, shopId);
      } else {
        setErrorMessage(res?.error || 'Login failed.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'QA Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = forgotEmail.trim();
    if (!targetEmail) {
      setForgotError('Please enter your administrator email address.');
      return;
    }
    setForgotLoading(true);
    setForgotError(null);
    try {
      const endpoint = isAdminRoute ? '/auth/admin/forgot-password' : '/auth/forgot-password';
      const res = await api.post(endpoint, { email: targetEmail });
      if (res && res.success && res.resetToken) {
        setForgotToken(res.resetToken);
        setForgotStep('RESET');
      } else if (res && res.success && !res.resetToken) {
        setForgotError(res.message || 'If an administrator account with that email exists, reset instructions have been generated.');
      } else {
        setForgotError(res?.error || 'Failed to generate reset request. Please ensure the backend server is reachable.');
      }
    } catch (err: any) {
      setForgotError(err.message || 'Error communicating with authentication server.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleCompletePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotToken.trim()) {
      setForgotError('Verification token is required.');
      return;
    }
    if (forgotNewPassword.length < 8) {
      setForgotError('New password must be at least 8 characters long.');
      return;
    }
    if (!/[A-Z]/.test(forgotNewPassword) || !/[a-z]/.test(forgotNewPassword) || !/[0-9]/.test(forgotNewPassword)) {
      setForgotError('Password must contain uppercase, lowercase, and numeric characters.');
      return;
    }

    setForgotLoading(true);
    setForgotError(null);
    try {
      const endpoint = isAdminRoute ? '/auth/admin/reset-password' : '/auth/reset-password';
      const res = await api.post(endpoint, {
        email: forgotEmail.trim(),
        token: forgotToken.trim(),
        newPassword: forgotNewPassword
      });
      if (res && res.success) {
        setForgotStep('DONE');
      } else {
        setForgotError(res?.error || 'Failed to reset password. Token may be invalid or expired.');
      }
    } catch (err: any) {
      setForgotError(err.message || 'Password reset failed.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white relative overflow-hidden">
      {/* Ambient background glows */}
      <div className={`absolute -top-40 -left-40 w-96 h-96 ${isAdminRoute ? 'bg-purple-600/10' : 'bg-emerald-500/10'} rounded-full blur-3xl pointer-events-none`} />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 px-6 py-4 flex items-center justify-between backdrop-blur-md bg-slate-950/60 relative z-10">
        <div className="flex items-center space-x-3">
          <div className={`h-9 w-9 rounded-xl ${isAdminRoute ? 'bg-gradient-to-tr from-purple-600 to-indigo-500 shadow-purple-600/20' : 'bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-emerald-500/20'} flex items-center justify-center shadow-lg`}>
            {isAdminRoute ? <ShieldAlert className="h-5 w-5 text-white" /> : <Sparkles className="h-5 w-5 text-slate-950 font-bold" />}
          </div>
          <div>
            <div className="text-base font-extrabold tracking-tight text-white flex items-center space-x-2">
              <span>SHOPGROW AI</span>
              <span className={`text-[10px] ${isAdminRoute ? 'bg-purple-500/10 text-purple-300 border-purple-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'} border px-2 py-0.5 rounded-full font-mono font-medium`}>
                {isAdminRoute ? 'Private Admin Portal' : 'v2.2 Production'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {isAdminRoute ? 'Strictly Restricted to Authorized Super Administrators' : 'Turn your existing customer database into repeat sales.'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {onOpenHowItWorks && !isAdminRoute && (
            <button
              onClick={onOpenHowItWorks}
              className="text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-900 transition flex items-center space-x-1.5"
            >
              <HelpCircle className="h-3.5 w-3.5 text-emerald-400" />
              <span>How ShopGrow Works</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Login Area */}
      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md space-y-6 animate-in fade-in zoom-in-95 duration-200">
          {/* Invite Welcome Banner if token present */}
          {initialInviteToken && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold text-emerald-300">
                  {invitedShop ? `Welcome to ${invitedShop.name}` : 'Official Shop Owner Invite'}
                </p>
                <p className="text-slate-300 mt-0.5">
                  You are logging in to your verified store workspace. Enter your credentials below.
                </p>
              </div>
            </div>
          )}

          {/* Login Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-7 shadow-2xl backdrop-blur-xl space-y-6">
            {/* Header: Clean & Role-Appropriate */}
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                {isAdminRoute ? (
                  <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                ) : (
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Store className="h-5 w-5" />
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {isAdminRoute ? 'Super Admin Portal' : 'Sign In to Your Workspace'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {isAdminRoute 
                      ? 'Restricted platform governance and tenant overview.' 
                      : 'Enter your account details to access your store.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-400 flex items-start space-x-2.5 animate-in fade-in">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Login Form: Pure Email + Password */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                  {isAdminRoute ? 'Authorized Admin Email' : 'Email Address'}
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={isAdminRoute ? 'admin@shopgrow.ai' : 'owner@yourstore.com'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                  />
                  <User className="h-4 w-4 text-slate-500 absolute right-3.5 top-3" />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                    Password
                  </label>
                  {!isAdminRoute && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPasswordOpen(true);
                        setForgotEmail(email);
                      }}
                      className="text-[11px] text-emerald-400 hover:underline"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 transition"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center space-x-2 text-xs text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-emerald-600 focus:ring-0 h-3.5 w-3.5 cursor-pointer"
                  />
                  <span>Remember this device</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 shadow-lg transition active:scale-[0.99] disabled:opacity-50 ${
                  isAdminRoute
                    ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                }`}
              >
                <span>{loading ? 'Authenticating...' : isAdminRoute ? 'Sign In to Super Admin' : 'Enter Shop Workspace'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            {/* QA Testing Sandbox Quick Access (Only in Public Mode, clearly labelled for testers) */}
            {!isAdminRoute && (
              <div className="pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setShowQASandbox(!showQASandbox)}
                  className="w-full flex items-center justify-between text-[11px] text-slate-500 hover:text-slate-300 py-1 transition"
                >
                  <span className="flex items-center space-x-1.5">
                    <FlaskConical className="h-3 w-3 text-amber-400" />
                    <span>QA / Developer Sandbox Accounts</span>
                  </span>
                  {showQASandbox ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>

                {showQASandbox && (
                  <div className="mt-2.5 p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2 animate-in fade-in duration-150 text-[11px]">
                    <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      Tenant Sandbox Quick Access
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleQuickQALogin('SHOP_OWNER', 'owner@sahaelectronics.com', 'ShopOwner@2026')}
                        className="p-2 text-left bg-slate-900 hover:bg-slate-850 rounded-xl border border-slate-800 text-slate-200 transition"
                      >
                        <div className="font-bold text-emerald-400">Subhasish Saha</div>
                        <div className="text-[10px] text-slate-400">Owner • Saha Electronics</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickQALogin('SHOP_OWNER', 'owner@royalteak.in', 'ShopOwner@2026')}
                        className="p-2 text-left bg-slate-900 hover:bg-slate-850 rounded-xl border border-slate-800 text-slate-200 transition"
                      >
                        <div className="font-bold text-amber-400">Debashis Roy</div>
                        <div className="text-[10px] text-slate-400">Owner • Royal Teak Furniture</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickQALogin('STAFF', 'priya@sahaelectronics.com', 'StaffPass@2026')}
                        className="p-2 text-left bg-slate-900 hover:bg-slate-850 rounded-xl border border-slate-800 text-slate-200 transition"
                      >
                        <div className="font-bold text-blue-400">Priya Das</div>
                        <div className="text-[10px] text-slate-400">Staff • Saha Electronics</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickQALogin('STAFF', 'staff@royalteak.in', 'StaffPass@2026')}
                        className="p-2 text-left bg-slate-900 hover:bg-slate-850 rounded-xl border border-slate-800 text-slate-200 transition"
                      >
                        <div className="font-bold text-purple-400">Kavita Sharma</div>
                        <div className="text-[10px] text-slate-400">Staff • Royal Teak Furniture</div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Forgot / Reset Password Modal */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                {forgotStep === 'RESET' && (
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep('REQUEST');
                      setForgotError(null);
                    }}
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition mr-1 flex items-center text-xs"
                    title="Back to Email Entry"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    <span>Back</span>
                  </button>
                )}
                <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
                <h3 className="font-bold text-white text-sm">
                  {isAdminRoute ? 'Super Admin Secure Password Reset' : 'Account Password Reset'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsForgotPasswordOpen(false);
                  setForgotStep('REQUEST');
                  setForgotError(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                title="Back to Sign In"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {forgotError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotStep === 'REQUEST' && (
              <form onSubmit={handleRequestPasswordReset} className="space-y-3">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enter your registered administrative email address to generate a cryptographically verified single-use reset token.
                </p>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Administrator Email</label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="admin@shopgrow.ai"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition disabled:opacity-50"
                >
                  {forgotLoading ? 'Verifying & Generating Token...' : 'Generate Reset Token'}
                </button>
              </form>
            )}

            {forgotStep === 'RESET' && (
              <form onSubmit={handleCompletePasswordReset} className="space-y-3">
                <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 space-y-1">
                  <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold text-xs">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>64-Character Reset Token Ready</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    A cryptographically secure reset token was generated. Enter your new password below to complete the reset.
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-medium text-slate-400">Security Reset Token (64 characters)</label>
                    {forgotToken && (
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof navigator !== 'undefined' && navigator.clipboard) {
                            navigator.clipboard.writeText(forgotToken);
                            alert('Reset token copied to clipboard!');
                          }
                        }}
                        className="text-[10px] text-emerald-400 hover:text-emerald-300 underline"
                      >
                        Copy Token
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    value={forgotToken}
                    onChange={(e) => setForgotToken(e.target.value)}
                    placeholder="Paste 64-character reset token"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs font-mono text-emerald-300 break-all"
                  />
                  {forgotToken && (
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Token length: {forgotToken.length}/64 characters (Valid for 60 mins)
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">New Password (min 8 chars, uppercase, lowercase, digit)</label>
                  <input
                    type="password"
                    required
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    placeholder="Enter secure new password"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition disabled:opacity-50 shadow-lg"
                >
                  {forgotLoading ? 'Updating Password...' : 'Save New Password & Complete Reset'}
                </button>

                <div className="flex items-center space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep('REQUEST');
                      setForgotError(null);
                    }}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition flex items-center justify-center space-x-1"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Back to Email Step</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPasswordOpen(false);
                      setForgotStep('REQUEST');
                      setForgotError(null);
                    }}
                    className="flex-1 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white text-xs rounded-xl transition"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            )}

            {forgotStep === 'DONE' && (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs">
                  Password has been successfully updated and hashed in the secure store. You may now sign in using your new credentials.
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPasswordOpen(false);
                    setForgotStep('REQUEST');
                    setPassword(forgotNewPassword);
                  }}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition"
                >
                  Return to Sign In
                </button>
              </div>
            )}

            {forgotStep === 'REQUEST' && (
              <button
                type="button"
                onClick={() => {
                  setIsForgotPasswordOpen(false);
                  setForgotStep('REQUEST');
                  setForgotError(null);
                }}
                className="w-full py-1.5 text-xs text-slate-400 hover:text-white transition flex items-center justify-center space-x-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Sign In</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 px-6 py-4 text-center text-xs text-slate-500 relative z-10">
        <p>© 2026 ShopGrow AI Platform. Enterprise Multi-Tenant Isolation & Row-Level Security.</p>
      </footer>
    </div>
  );
};
