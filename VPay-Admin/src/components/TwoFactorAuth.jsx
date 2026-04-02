import React, { useState, useEffect } from 'react';
import { Copy, Download, Eye, EyeOff, Check, X } from 'lucide-react';
import {
  generateTOTPSecret,
  enableTwoFactorAuth,
  disableTwoFactorAuth,
  get2FAStatus,
  generateBackupCodes,
  verifyTOTPCode,
} from '../services/adminApi';

const TwoFactorAuth = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('status'); // status, setup, manage, verify
  const [totpData, setTotpData] = useState(null);
  const [token, setToken] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [showQR, setShowQR] = useState(true);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [password, setPassword] = useState('');
  const [disabling, setDisabling] = useState(false);

  // Fetch current 2FA status
  const loadStatus = async () => {
    try {
      setLoading(true);
      const data = await get2FAStatus();
      setStatus(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  // Generate new TOTP secret
  const handleGenerateSecret = async () => {
    try {
      setLoading(true);
      const data = await generateTOTPSecret();
      setTotpData(data);
      setToken('');
      setError('');
      setActiveTab('setup');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Enable 2FA with verification
  const handleEnableTwoFA = async (e) => {
    e.preventDefault();
    if (!token || token.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    try {
      setVerifying(true);
      const result = await enableTwoFactorAuth(token, totpData.secret, totpData.backupCodes);
      setError('');
      setTotpData(null);
      setToken('');
      setActiveTab('success');
      // Reload status
      setTimeout(() => {
        loadStatus();
        setActiveTab('manage');
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setVerifying(false);
    }
  };

  // Disable 2FA
  const handleDisable2FA = async (e) => {
    e.preventDefault();
    if (!password) {
      setError('Please enter your password to disable 2FA');
      return;
    }

    if (!window.confirm('Are you sure you want to disable 2FA? This will reduce your account security.')) {
      return;
    }

    try {
      setDisabling(true);
      await disableTwoFactorAuth(password);
      setPassword('');
      setError('');
      setActiveTab('disabled');
      // Reload status
      setTimeout(() => {
        loadStatus();
        setActiveTab('status');
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setDisabling(false);
    }
  };

  // Generate new backup codes
  const handleGenerateNewBackupCodes = async () => {
    if (!window.confirm('Generating new backup codes will invalidate all old codes. Continue?')) {
      return;
    }

    try {
      setLoading(true);
      const data = await generateBackupCodes();
      setTotpData(data);
      setShowBackupCodes(true);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Download backup codes
  const downloadBackupCodes = () => {
    if (!totpData?.backupCodes) return;

    const content = totpData.backupCodes.join('\n');
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', 'backup-codes.txt');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  if (loading && !status) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Two-Factor Authentication</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Status Overview */}
      {activeTab === 'status' && status && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">2FA Status</h3>
              <p className={`text-lg font-bold ${status.enabled ? 'text-green-600' : 'text-gray-600'}`}>
                {status.enabled ? '✓ Enabled' : '✗ Disabled'}
              </p>
              <p className="text-sm text-blue-700 mt-2">
                {status.enabled
                  ? 'Your account is protected with two-factor authentication'
                  : 'Enable 2FA to add an extra layer of security to your account'}
              </p>
            </div>

            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h3 className="font-semibold text-purple-900 mb-2">Backup Codes</h3>
              <p className="text-lg font-bold text-purple-600">{status.backupCodesCount || 0} Available</p>
              <p className="text-sm text-purple-700 mt-2">
                Use backup codes if you lose access to your authenticator app
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            {!status.enabled ? (
              <button
                onClick={handleGenerateSecret}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                Enable Two-Factor Authentication
              </button>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab('manage')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Manage 2FA
                </button>
                <button
                  onClick={() => setActiveTab('disable')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Disable 2FA
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Setup Tab */}
      {activeTab === 'setup' && totpData && (
        <div className="max-w-md space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-4">Step 1: Scan QR Code</h3>
            <p className="text-gray-600 mb-4 text-sm">
              Use an authenticator app (Google Authenticator, Authy, Microsoft Authenticator) to scan this QR code.
            </p>
            {showQR && (
              <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
                <img src={totpData.qrCode} alt="QR Code" className="w-48 h-48" />
              </div>
            )}
            <button
              onClick={() => setShowQR(!showQR)}
              className="text-sm text-gray-600 hover:text-gray-900 mt-2"
            >
              {showQR ? 'Hide' : 'Show'} QR Code
            </button>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4">Step 2: Manual Entry (if QR doesn't work)</h3>
            <div className="p-3 bg-gray-100 rounded-lg font-mono text-sm break-all flex items-center justify-between">
              <span>{totpData.secret}</span>
              <button
                onClick={() => copyToClipboard(totpData.secret)}
                className="ml-2 p-1 hover:bg-gray-200 rounded"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4 mt-6">Step 3: Enter Verification Code</h3>
            <form onSubmit={handleEnableTwoFA} className="space-y-4">
              <input
                type="text"
                placeholder="000000"
                maxLength="6"
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                className="w-full p-2 border border-gray-300 rounded-lg text-center text-2xl tracking-widest"
                disabled={verifying}
              />
              <button
                type="submit"
                disabled={verifying || token.length !== 6}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                {verifying ? 'Verifying...' : 'Verify and Enable'}
              </button>
            </form>
          </div>

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            <p className="font-semibold mb-2">⚠️ Save Your Backup Codes</p>
            <p>After enabling 2FA, you'll receive backup codes. Store them in a safe place!</p>
          </div>
        </div>
      )}

      {/* Success Tab */}
      {activeTab === 'success' && (
        <div className="text-center space-y-6 max-w-md mx-auto">
          <div className="flex justify-center">
            <Check className="w-16 h-16 text-green-600" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-green-600 mb-2">Success!</h3>
            <p className="text-gray-600">Two-factor authentication has been enabled on your account.</p>
          </div>
        </div>
      )}

      {/* Manage Tab */}
      {activeTab === 'manage' && status?.enabled && (
        <div className="max-w-md space-y-6">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-semibold">✓ 2FA is currently enabled</p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4">Backup Codes</h3>
            <p className="text-gray-600 text-sm mb-4">
              You have {status.backupCodesCount || 0} backup codes remaining. When used, they cannot be reused.
            </p>

            {status.backupCodesCount < 5 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 mb-4">
                ⚠️ You have fewer than 5 backup codes. Consider generating new ones.
              </div>
            )}

            <button
              onClick={handleGenerateNewBackupCodes}
              disabled={loading}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400"
            >
              Generate New Backup Codes
            </button>
          </div>

          {totpData && showBackupCodes && (
            <div>
              <h4 className="font-semibold mb-3">Your New Backup Codes</h4>
              <p className="text-sm text-gray-600 mb-3">
                Save these codes in a secure location. Each code can only be used once.
              </p>
              <div className="p-3 bg-gray-50 rounded-lg font-mono text-sm space-y-2 mb-3 max-h-40 overflow-y-auto">
                {totpData.backupCodes?.map((code, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span>{code}</span>
                    <button
                      onClick={() => copyToClipboard(code)}
                      className="ml-2 p-1 hover:bg-gray-200 rounded"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={downloadBackupCodes}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Codes
              </button>
            </div>
          )}

          <div>
            <button
              onClick={() => setActiveTab('disable')}
              className="w-full px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
            >
              Disable 2FA
            </button>
          </div>
        </div>
      )}

      {/* Disable Tab */}
      {activeTab === 'disable' && (
        <div className="max-w-md">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
            <p className="text-red-800 font-semibold">⚠️ Warning</p>
            <p className="text-red-700 text-sm mt-2">
              Disabling 2FA will reduce the security of your account. You will only need your password to log in.
            </p>
          </div>

          <form onSubmit={handleDisable2FA} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter your password to confirm
              </label>
              <input
                type="password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
                disabled={disabling}
              />
            </div>

            <button
              type="submit"
              disabled={disabling || !password}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
            >
              {disabling ? 'Disabling...' : 'Disable 2FA'}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('manage')}
              className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Disabled Tab */}
      {activeTab === 'disabled' && (
        <div className="text-center space-y-6 max-w-md mx-auto">
          <div className="flex justify-center">
            <Check className="w-16 h-16 text-orange-600" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-orange-600 mb-2">Disabled</h3>
            <p className="text-gray-600">Two-factor authentication has been disabled on your account.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TwoFactorAuth;
