'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, Key, AlertCircle, ExternalLink, Eye, EyeOff } from 'lucide-react';

const TOKEN_STORAGE_KEY = 'claude-oauth-token';

// Simple obfuscation for localStorage (not true encryption, but better than plaintext)
function obfuscate(text: string): string {
  return btoa(text.split('').reverse().join(''));
}

function deobfuscate(text: string): string {
  try {
    return atob(text).split('').reverse().join('');
  } catch {
    return '';
  }
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!stored) return null;
  return deobfuscate(stored);
}

export function setStoredToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_STORAGE_KEY, obfuscate(token));
}

export function clearStoredToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

interface TokenSettingsProps {
  onTokenChange?: (hasToken: boolean) => void;
}

export function TokenSettings({ onTokenChange }: TokenSettingsProps) {
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [hasStoredToken, setHasStoredToken] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = getStoredToken();
    if (stored) {
      setHasStoredToken(true);
      setToken(stored);
      onTokenChange?.(true);
    }
  }, [onTokenChange]);

  const handleSave = () => {
    if (!token.trim()) {
      setError('Please enter a token');
      return;
    }

    // Basic validation - Claude OAuth tokens start with sk-ant-oat
    if (!token.startsWith('sk-ant-')) {
      setError('Invalid token format. Token should start with sk-ant-');
      return;
    }

    setStoredToken(token);
    setHasStoredToken(true);
    setSaved(true);
    setError(null);
    onTokenChange?.(true);

    // Reset saved indicator after 2 seconds
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    clearStoredToken();
    setToken('');
    setHasStoredToken(false);
    setSaved(false);
    onTokenChange?.(false);
  };

  const maskedToken = token ? `${token.slice(0, 12)}...${token.slice(-4)}` : '';

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="claude-token" className="text-sm font-medium">
          Claude API Token
        </Label>
        <p className="text-sm text-muted-foreground">
          Connect your Claude account to use the AI trip assistant. Uses your Claude Pro/Max subscription.
        </p>
      </div>

      {hasStoredToken && !showToken ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700 dark:text-green-400 font-mono">
              {maskedToken}
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowToken(true)}
            >
              <Eye className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="text-red-600 hover:text-red-700"
            >
              Disconnect
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative">
            <Input
              id="claude-token"
              type={showToken ? 'text' : 'password'}
              placeholder="sk-ant-oat01-..."
              value={token}
              onChange={(e) => {
                setToken(e.target.value);
                setError(null);
                setSaved(false);
              }}
              className="pr-10 font-mono text-sm"
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showToken ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleSave} size="sm">
              <Key className="h-4 w-4 mr-1" />
              {saved ? 'Saved!' : 'Save Token'}
            </Button>
            {hasStoredToken && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowToken(false);
                  const stored = getStoredToken();
                  if (stored) setToken(stored);
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="pt-2 border-t">
        <p className="text-xs text-muted-foreground mb-2">
          To get your token:
        </p>
        <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
          <li>Install Claude Code: <code className="bg-muted px-1 rounded">npm install -g @anthropic-ai/claude-code</code></li>
          <li>Run: <code className="bg-muted px-1 rounded">claude setup-token</code></li>
          <li>Copy and paste the token above</li>
        </ol>
        <a
          href="https://claude.ai/settings"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
        >
          Manage Claude subscription
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
