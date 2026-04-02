import React, { useState } from 'react';
import { FiMail, FiLock, FiArrowRight, FiShield, FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services';
import toast from 'react-hot-toast';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import LoadingIndicator from '../../components/common/LoadingIndicator';
import logo from '../../assets/velpay-logo.png';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('login'); // 'login' or 'otp'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    otp: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Small artificial delay for premium feel
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      if (step === 'login') {
        const response = await authService.login(formData.email, formData.password);
        
        // Block non-admins from the dashboard
        if (response.success && response.data?.user && !['admin', 'superadmin'].includes(response.data.user.role)) {
          toast.error('Access Denied. You do not have administrator privileges.');
          setLoading(false);
          return;
        }

        if (response.success && response.requireOtp) {
          setStep('otp');
          toast.success('Security code sent to your email');
        } else if (response.success) {
          // Fallback if OTP is disabled for some reason
          login(response.data.user, response.data.accessToken);
          toast.success('Welcome back, Admin!');
          navigate('/');
        } else {
          toast.error(response.message || 'Login failed');
        }
      } else {
        // OTP Step
        const response = await authService.verifyAdminOtp(formData.email, formData.otp);
        
        if (response.success) {
          login(response.data.user, response.data.accessToken);
          toast.success('Identity verified. Access granted.');
          navigate('/');
        } else {
          toast.error(response.message || 'Invalid security code');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMsg = error.response?.data?.message || 'Connection error. Check backend.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('login');
    setFormData({ ...formData, otp: '' });
  };

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Loading Overlay */}
      <LoadingIndicator visible={loading} message={step === 'login' ? 'Authenticating...' : 'Verifying Identity...'} />

      {/* Left Side: Branding & Visuals (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-brand-blue items-center justify-center overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-white blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-brand-green blur-[120px]" />
        </div>
        
        <div className="relative z-10 text-center px-12 animate-fade-in">
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-12 border border-white/20 shadow-2xl">
            <img 
              src={logo} 
              alt="VPay Logo" 
              className="w-32 h-32 mx-auto mb-8 drop-shadow-2xl brightness-110"
            />
            <h2 className="text-4xl font-extrabold text-white mb-4 tracking-tight">
              VPay Admin <span className="text-brand-green">Portal</span>
            </h2>
            <p className="text-blue-100 text-lg max-w-md mx-auto leading-relaxed">
              Securely manage your payment infrastructure with multi-factor authentication and global controls.
            </p>
          </div>
          
          <div className="mt-12 flex items-center justify-center gap-8 opacity-60">
            <div className="h-[1px] w-12 bg-white" />
            <span className="text-white text-sm font-medium tracking-widest uppercase">Precision. Security. Speed.</span>
            <div className="h-[1px] w-12 bg-white" />
          </div>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <img src={logo} alt="VPay Logo" className="w-20 h-20 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-brand-dark">VPay Admin</h1>
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8 md:p-10">
            {step === 'login' ? (
              <div key="login-step" className="animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="mb-10">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Sign In</h3>
                  <p className="text-gray-500">Enter your credentials to access the console</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <Input
                    label="Corporate Email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="admin@vpay.com"
                    icon={<FiMail className="text-gray-400" />}
                    required
                    className="py-3 px-4 bg-gray-50 border-gray-200 focus:bg-white focus:ring-brand-blue"
                  />

                  <Input
                    label="Access Password"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    icon={<FiLock className="text-gray-400" />}
                    required
                    className="py-3 px-4 bg-gray-50 border-gray-200 focus:bg-white focus:ring-brand-blue"
                  />

                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center text-gray-600 cursor-pointer group">
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-brand-blue focus:ring-brand-blue transition-all" />
                      <span className="ml-2 group-hover:text-brand-blue transition-colors">Remember device</span>
                    </label>
                    <a href="#" className="font-semibold text-brand-blue hover:text-brand-dark transition-colors">
                      Recovery?
                    </a>
                  </div>

                  <Button
                    type="submit"
                    fullWidth
                    loading={loading}
                    className="py-4 bg-brand-blue hover:bg-brand-dark shadow-lg shadow-brand-blue/20 transition-all transform active:scale-[0.98]"
                    icon={<FiArrowRight className="ml-1" />}
                  >
                    Authenticate
                  </Button>
                </form>
              </div>
            ) : (
              <div key="otp-step" className="animate-in fade-in slide-in-from-right-4 duration-500">
                <button 
                  onClick={handleBack}
                  className="flex items-center text-sm font-semibold text-brand-blue hover:text-brand-dark mb-6 transition-colors"
                >
                  <FiArrowLeft className="mr-2" /> Change account
                </button>

                <div className="mb-10 text-center">
                  <div className="w-16 h-16 bg-blue-50 text-brand-blue rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
                    <FiShield size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Verification Required</h3>
                  <p className="text-gray-500">We've sent a 6-digit security code to your registered email address.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <Input
                    label="Security Code (OTP)"
                    type="text"
                    name="otp"
                    value={formData.otp}
                    onChange={handleChange}
                    placeholder="000 000"
                    maxLength={6}
                    icon={<FiShield className="text-gray-400" />}
                    required
                    className="py-4 px-4 bg-gray-50 border-gray-200 focus:bg-white focus:ring-brand-blue text-center text-2xl tracking-[0.5em] font-mono"
                  />

                  <Button
                    type="submit"
                    fullWidth
                    loading={loading}
                    className="py-4 bg-brand-green hover:bg-green-600 shadow-lg shadow-green-500/20 transition-all transform active:scale-[0.98]"
                    icon={<FiArrowRight className="ml-1" />}
                  >
                    Verify & Enter Dashboard
                  </Button>
                  
                  <p className="text-center text-sm text-gray-400">
                    Didn't receive the code? <button type="button" className="text-brand-blue font-bold">Resend</button>
                  </p>
                </form>
              </div>
            )}
          </div>

          <p className="mt-10 text-center text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} VPay Technologies. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
