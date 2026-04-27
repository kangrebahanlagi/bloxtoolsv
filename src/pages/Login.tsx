import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import BackButton from '@/components/BackButton';

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<'login' | 'signup'>(
    location.pathname === '/signup' ? 'signup' : 'login',
  );
  const [username, setUsername] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [loginKey, setLoginKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [showKey, setShowKey] = useState<string | null>(null);

  useEffect(() => {
    setMode(location.pathname === '/signup' ? 'signup' : 'login');
  }, [location.pathname]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate('/dashboard', { replace: true });
    });
  }, [navigate]);

  const callFn = async (path: string, body: unknown) => {
    const res = await fetch(`${FN_URL}/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: ANON },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
    return data;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await callFn('signup-with-key', {
        username: username.trim().toLowerCase(),
        webhook_url: webhookUrl.trim(),
      });
      toast.success(`Account "${result.username}" created. Check your Discord webhook for the login key.`);
      setShowKey(result.username);
      setUsername('');
      setWebhookUrl('');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { token_hash } = await callFn('login-with-key', { login_key: loginKey });
      const { error } = await supabase.auth.verifyOtp({
        type: 'magiclink',
        token_hash,
      });
      if (error) throw error;
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      toast.error(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blox-gradient">
      <div className="container mx-auto px-4 py-8">
        <BackButton />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="blox-card p-8 max-w-md mx-auto mt-12"
        >
          <h1 className="text-3xl font-bold mb-2 text-center">
            {mode === 'signup' ? 'Create Account' : 'Sign In'}
          </h1>
          <p className="text-center text-gray-400 text-sm mb-6">
            {mode === 'signup'
              ? 'Pick a subdomain and the Discord webhook your login key will be delivered to.'
              : 'Enter your 10-character login key.'}
          </p>

          {showKey && mode === 'login' && (
            <div className="bg-blox-teal/10 border border-blox-teal/30 rounded-md p-3 mb-4 text-sm">
              Account <strong>{showKey}</strong> created. The login key was sent to your Discord webhook.
            </div>
          )}

          {mode === 'signup' ? (
            <form onSubmit={handleSignup} className="space-y-4">
              <input
                type="text"
                placeholder="Username (your subdomain)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-black/30 border border-white/10 rounded-md p-3 text-white focus:outline-none focus:border-blox-teal"
              />
              <input
                type="url"
                placeholder="https://discord.com/api/webhooks/..."
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                required
                className="w-full bg-black/30 border border-white/10 rounded-md p-3 text-white focus:outline-none focus:border-blox-teal"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blox-teal text-white py-3 rounded-md font-medium hover:bg-blox-teal/90 transition-all flex items-center justify-center"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create account'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="text"
                placeholder="ABCDE12345"
                value={loginKey}
                onChange={(e) => setLoginKey(e.target.value.toUpperCase())}
                required
                maxLength={10}
                className="w-full bg-black/30 border border-white/10 rounded-md p-3 text-white tracking-[0.3em] text-center font-mono text-lg focus:outline-none focus:border-blox-teal"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blox-teal text-white py-3 rounded-md font-medium hover:bg-blox-teal/90 transition-all flex items-center justify-center"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign in'}
              </button>
            </form>
          )}

          <button
            onClick={() => navigate(mode === 'login' ? '/signup' : '/login')}
            className="w-full mt-4 text-sm text-gray-400 hover:text-blox-teal transition-colors"
          >
            {mode === 'login' ? "Don't have an account? Create one" : 'Already have a key? Sign in'}
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
