"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, User, UserCheck, ChevronRight, Loader2, AlertCircle } from "lucide-react"
// Social login configuration
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
const MICROSOFT_CLIENT_ID = process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID || "";
import { useRouter } from "next/navigation"
import { authApi } from "@/lib/api"
import { toast } from "sonner"

// Types
type UserRole = 'officer' | 'family' | 'admin'

interface UserProfile {
  firstName: string
  lastName: string
  email: string
  role: UserRole
  serviceNumber?: string
  rank?: string
  unit?: string
  phoneNumber: string
  address: {
    street: string
    city: string
    state: string
    pincode: string
    country: string
  }
}

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onLogin: (role: string) => void
}

const AuthModal = ({ isOpen, onClose, onLogin }: AuthModalProps) => {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [role, setRole] = useState("officer")

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")

  const [phoneNumber, setPhoneNumber] = useState('')
  const [rank, setRank] = useState('')
  const [unit, setUnit] = useState('')
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India'
  })

  const handleAddressChange = (field: string, value: string) => {
    setAddress(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handle social login (Google/Microsoft)
  const handleSocialLogin = async (provider: 'google' | 'microsoft') => {
    try {
      setIsLoading(true);
      setError('');

      // Check if API URL is configured
      if (!process.env.NEXT_PUBLIC_API_URL) {
        throw new Error('Authentication service is not properly configured. Please contact support.');
      }

      // Redirect to backend OAuth endpoint
      const authUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/${provider}`;
      const popup = window.open(authUrl, `Sign in with ${provider}`, 'width=600,height=600');
      
      if (!popup) {
        throw new Error('Popup was blocked. Please allow popups for this site and try again.');
      }
      
      // Set a timeout for the popup to prevent hanging
      const popupTimeout = setTimeout(() => {
        if (!popup.closed) {
          popup.close();
          throw new Error('The authentication window took too long. Please try again.');
        }
      }, 300000); // 5 minutes
        // Listen for message from popup
      const messageHandler = async (event: MessageEvent) => {
        try {          // Verify the origin of the message for security
          const apiUrl = process.env.NEXT_PUBLIC_API_URL;
          if (apiUrl && event.origin !== new URL(apiUrl).origin) {
            console.warn('Message from untrusted origin:', event.origin);
            return;
          }
          
          if (event.data.type === 'oauth-callback') {
            if (event.data.error) {
              throw new Error(event.data.error_description || event.data.error || 'Authentication failed');
            }
            
            if (!event.data.token) {
              throw new Error('No authentication token received. Please try again.');
            }
            
            // Complete the login with the token
            const loginResponse = await authApi.socialLogin(provider, event.data.token);
            
            // Clear the timeout and event listener
            clearTimeout(popupTimeout);
            window.removeEventListener('message', messageHandler);
            
            // Close the popup
            if (!popup.closed) {
              popup.close();
            }
            
            // Update UI and notify user
            onLogin(loginResponse.data.user?.role || 'officer');
            onClose();
            toast.success(`Signed in with ${provider} successfully!`);
          }
        } catch (error: any) {
          console.error('Social login error:', error);
          
          // Clean up
          clearTimeout(popupTimeout);
          window.removeEventListener('message', messageHandler);
          if (!popup.closed) popup.close();
          
          // Handle different error types
          if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            const { status, data } = error.response;
            
            if (status === 401 || status === 403) {
              setError('Authentication failed. Please try again or use a different account.');
            } else if (status === 429) {
              setError('Too many attempts. Please try again later.');
            } else {
              setError(data?.message || `Failed to sign in with ${provider}. Please try again.`);
            }
          } else if (error.request) {
            // The request was made but no response was received
            setError('Unable to connect to the authentication server. Please check your internet connection.');
          } else {
            // Something happened in setting up the request that triggered an Error
            setError(error.message || `Failed to sign in with ${provider}. Please try again.`);
          }
          
          setIsLoading(false);
        }
      };
      
      window.addEventListener('message', messageHandler, false);
      
      // Check if popup was blocked after a short delay
      const checkPopup = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkPopup);
          clearTimeout(popupTimeout);
          window.removeEventListener('message', messageHandler);
          if (!isLoading) return;
          
          // If we get here and we're still loading, the popup was closed before completing
          if (isLoading) {
            setError('Authentication was cancelled. Please try again if you want to continue.');
            setIsLoading(false);
          }
        }
      }, 500);
      
      // Cleanup interval when component unmounts
      return () => {
        clearInterval(checkPopup);
        clearTimeout(popupTimeout);
        window.removeEventListener('message', messageHandler);
      };
      
    } catch (err: any) {
      console.error(`${provider} sign in error:`, err);
      
      // Handle specific error cases
      if (err.message.includes('popup')) {
        setError('The authentication window was blocked. Please allow popups for this site and try again.');
      } else if (err.message.includes('network')) {
        setError('Unable to connect to the authentication service. Please check your internet connection.');
      } else {
        setError(err.message || `Sign in with ${provider} failed. Please try again.`);
      }
      
      setIsLoading(false);
    }
  }

  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  const validatePassword = (password: string): { valid: boolean; message: string } => {
    if (password.length < 6) {
      return { valid: false, message: 'Password must be at least 6 characters long' }
    }
    return { valid: true, message: '' }
  }

  const validatePhoneNumber = (phone: string): boolean => {
    // Basic phone number validation - can be enhanced based on requirements
    return /^\+?[0-9\s-]{10,}$/.test(phone)
  }

  const validatePincode = (pincode: string): boolean => {
    // Validate pincode is exactly 6 digits
    return /^\d{6}$/.test(pincode)
  }

  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // Common validations for both login and register
      if (!email || !password) {
        throw new Error('Please fill in all required fields')
      }

      const trimmedEmail = email.trim()
      
      if (!validateEmail(trimmedEmail)) {
        throw new Error('Please enter a valid email address')
      }

      const passwordValidation = validatePassword(password)
      if (!passwordValidation.valid) {
        throw new Error(passwordValidation.message)
      }

      if (activeTab === "login") {
        try {
          // Handle login
          const response = await authApi.login({ 
            email: trimmedEmail, 
            password 
          });
          
          if (response.data?.user) {
            onLogin(response.data.user.role || 'officer');
            onClose();
            toast.success('Login successful!');
          } else {
            throw new Error('Invalid response from server');
          }
        } catch (error: any) {
          console.error('Login error:', error);
          throw new Error(error.response?.data?.message || 'Login failed. Please check your credentials and try again.');
        }
      } else {
        // Registration specific validations
        if (!firstName || !lastName || !confirmPassword || !phoneNumber) {
          throw new Error('Please fill in all required fields')
        }

        // Officer specific validations
        if (role === 'officer' && (!rank || !unit)) {
          throw new Error('Rank and unit are required for officers')
        }

        if (password !== confirmPassword) {
          throw new Error('Passwords do not match')
        }

        if (!validatePhoneNumber(phoneNumber)) {
          throw new Error('Please enter a valid phone number')
        }

        // Validate address fields
        if (!address.street || !address.city || !address.state || !address.pincode) {
          throw new Error('Please fill in all address fields')
        }

        // Validate pincode format
        if (!validatePincode(address.pincode)) {
          throw new Error('Please enter a valid 6-digit pincode')
        }

        // Prepare registration data
        const registrationData = {
          email: trimmedEmail,
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          role: role as UserRole,
          phoneNumber: phoneNumber.trim(),
          address: {
            street: address.street.trim(),
            city: address.city.trim(),
            state: address.state.trim(),
            pincode: address.pincode.trim(),
            country: address.country?.trim() || 'India'
          },
          // Add rank and unit if officer
          ...(role === 'officer' && {
            rank: rank.trim(),
            unit: unit.trim()
          })
        }

        try {
          const response = await authApi.register(registrationData);
          
          if (response.data?.user) {
            onLogin(response.data.user.role || 'officer');
            onClose();
            toast.success('Registration successful! You are now logged in.');
          } else {
            throw new Error('Invalid response from server');
          }
        } catch (error: any) {
          console.error('Registration error:', error);
          throw new Error(error.response?.data?.message || 'Registration failed. Please try again.');
        }
      }
    } catch (err: any) {
      console.error('Authentication error:', err)
      
      let errorMessage = 'Authentication failed. Please try again.'
      
      // Handle network errors
      if (err.message === 'Network Error') {
        errorMessage = 'Unable to connect to the server. Please check your internet connection.'
      } 
      // Handle backend validation errors
      else if (err.response?.data?.errors) {
        // Handle multiple validation errors from backend
        const errors = err.response.data.errors
        errorMessage = Object.values(errors)
          .map((error: any) => (Array.isArray(error) ? error[0] : error))
          .join('\n')
      }
      // Handle single error message from backend
      else if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      }
      // Handle validation errors from our checks
      else if (err.message) {
        errorMessage = err.message
      }

      // Handle common error cases
      if (errorMessage.toLowerCase().includes('email already in use')) {
        errorMessage = 'This email is already registered. Please use a different email or sign in.'
      } else if (errorMessage.toLowerCase().includes('invalid email') || !email.includes('@')) {
        errorMessage = 'Please enter a valid email address.'
      } else if (errorMessage.toLowerCase().includes('password') && errorMessage.toLowerCase().includes('weak')) {
        errorMessage = 'Password should be at least 6 characters long.'
      } else if (errorMessage.toLowerCase().includes('invalid credentials')) {
        errorMessage = 'Incorrect email or password. Please try again.'
      } else if (errorMessage.toLowerCase().includes('too many attempts')) {
        errorMessage = 'Too many failed attempts. Please try again later.'
      }

      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const roles = [
    { id: "officer", name: "Military Officer", description: "For serving military personnel" },
    { id: "family", name: "Family Member", description: "For dependents of military personnel" },
    { id: "admin", name: "Administrator", description: "For welfare management staff" },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="bg-gradient-to-r from-orange-500 to-green-600 p-6 text-white">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Shield className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Armed Forces Welfare Portal</h2>
                  <p className="text-sm opacity-90">सशस्त्र बल कल्याण पोर्टल</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-6">
                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-red-700">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <form onSubmit={handleEmailPasswordLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="role">Select Role</Label>
                      <div className="grid gap-3">
                        {roles.map((r) => (
                          <div
                            key={r.id}
                            className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                              role === r.id ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() => setRole(r.id)}
                          >
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                role === r.id
                                  ? "bg-gradient-to-r from-orange-500 to-green-600 text-white"
                                  : "bg-gray-100 text-gray-500"
                              }`}
                            >
                              {r.id === "officer" ? (
                                <Shield className="h-5 w-5" />
                              ) : r.id === "family" ? (
                                <User className="h-5 w-5" />
                              ) : (
                                <UserCheck className="h-5 w-5" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{r.name}</p>
                              <p className="text-xs text-gray-500">{r.description}</p>
                            </div>
                            {role === r.id && <ChevronRight className="h-5 w-5 text-orange-500" />}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        {activeTab === "login" && (
                          <button
                            type="button"
                            className="text-sm font-medium text-orange-600 hover:text-orange-500"
                            onClick={() => {
                              // TODO: Implement forgot password flow
                              toast.info('Password reset functionality coming soon');
                            }}
                          >
                            Forgot password?
                          </button>
                        )}
                      </div>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>

                    {activeTab === "register" && (
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="Confirm your password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required={activeTab === "register"}
                        />
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700 text-white"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {activeTab === "login" ? "Signing in..." : "Creating account..."}
                        </>
                      ) : activeTab === "login" ? (
                        "Sign in"
                      ) : (
                        "Create account"
                      )}
                    </Button>
                  </form>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">Or continue with</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="relative group">
                      <Button
                        variant="outline"
                        className="w-full flex items-center justify-center space-x-2 opacity-50 cursor-not-allowed"
                        disabled={true}
                        onClick={(e) => {
                          e.preventDefault();
                          toast.info('Social login is currently unavailable. Please use email and password to sign in.');
                        }}
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        <span>Continue with Google</span>
                      </Button>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-64 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        Social login is currently unavailable. Please use email and password.
                      </div>
                    </div>
                    <div className="relative group">
                      <Button
                        variant="outline"
                        className="w-full flex items-center justify-center space-x-2 opacity-50 cursor-not-allowed"
                        disabled={true}
                        onClick={(e) => {
                          e.preventDefault();
                          toast.info('Social login is currently unavailable. Please use email and password to sign in.');
                        }}
                      >
                        <svg className="h-4 w-4" viewBox="0 0 23 23" fill="currentColor">
                          <path d="M0 0v23h11.5v-11.5h-11.5z" fill="#f3f3f3" />
                          <path d="M11.5 0v11.5h11.5v-11.5z" fill="#f35325" />
                          <path d="M11.5 11.5v11.5h11.5v-11.5z" fill="#7fba00" />
                          <path d="M0 11.5v11.5h11.5v-11.5z" fill="#00a4ef" />
                        </svg>
                        <span>Continue with Microsoft</span>
                      </Button>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-64 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        Social login is currently unavailable. Please use email and password.
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="register" className="space-y-6">
                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-red-700">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <form onSubmit={handleEmailPasswordLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Select Role</Label>
                      <div className="grid gap-3">
                        {roles.map((r) => (
                          <div
                            key={r.id}
                            className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                              role === r.id ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() => setRole(r.id)}
                          >
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                role === r.id
                                  ? "bg-gradient-to-r from-orange-500 to-green-600 text-white"
                                  : "bg-gray-100 text-gray-500"
                              }`}
                            >
                              {r.id === "officer" ? (
                                <Shield className="h-5 w-5" />
                              ) : r.id === "family" ? (
                                <User className="h-5 w-5" />
                              ) : (
                                <UserCheck className="h-5 w-5" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{r.name}</p>
                              <p className="text-xs text-gray-500">{r.description}</p>
                            </div>
                            {role === r.id && <ChevronRight className="h-5 w-5 text-orange-500" />}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first-name">First Name</Label>
                        <Input 
                          id="first-name" 
                          placeholder="First name" 
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last-name">Last Name</Label>
                        <Input 
                          id="last-name" 
                          placeholder="Last name" 
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input 
                        id="password" 
                        type="password" 
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <Input 
                        id="confirm-password" 
                        type="password" 
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      <Input
                        id="phoneNumber"
                        type="tel"
                        placeholder="Enter your phone number"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        required
                      />
                    </div>

                    {role === 'officer' && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="rank">Rank</Label>
                          <Input
                            id="rank"
                            type="text"
                            placeholder="Enter your rank"
                            value={rank}
                            onChange={(e) => setRank(e.target.value)}
                            required={role === 'officer'}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="unit">Unit</Label>
                          <Input
                            id="unit"
                            type="text"
                            placeholder="Enter your unit"
                            value={unit}
                            onChange={(e) => setUnit(e.target.value)}
                            required={role === 'officer'}
                          />
                        </div>
                      </>
                    )}

                    <div className="space-y-2">
                      <Label>Address</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Input
                            placeholder="Street"
                            value={address.street}
                            onChange={(e) => handleAddressChange('street', e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Input
                            placeholder="City"
                            value={address.city}
                            onChange={(e) => handleAddressChange('city', e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Input
                            placeholder="State"
                            value={address.state}
                            onChange={(e) => handleAddressChange('state', e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Input
                            placeholder="Pincode"
                            value={address.pincode}
                            onChange={(e) => handleAddressChange('pincode', e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2 col-span-2">
                          <Input
                            placeholder="Country"
                            value={address.country}
                            onChange={(e) => handleAddressChange('country', e.target.value)}
                            required
                            disabled
                          />
                        </div>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700 text-white"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        'Create Account'
                      )}
                    </Button>
                  </form>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">Or continue with</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="relative group">
                      <Button
                        variant="outline"
                        className="w-full flex items-center justify-center space-x-2 opacity-50 cursor-not-allowed"
                        disabled={true}
                        onClick={(e) => {
                          e.preventDefault();
                          toast.info('Social login is currently unavailable. Please use email and password to sign in.');
                        }}
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        <span>Continue with Google</span>
                      </Button>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-64 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        Social login is currently unavailable. Please use email and password.
                      </div>
                    </div>
                    <div className="relative group">
                      <Button
                        variant="outline"
                        className="w-full flex items-center justify-center space-x-2 opacity-50 cursor-not-allowed"
                        disabled={true}
                        onClick={(e) => {
                          e.preventDefault();
                          toast.info('Social login is currently unavailable. Please use email and password to sign in.');
                        }}
                      >
                        <svg className="h-4 w-4" viewBox="0 0 23 23" fill="currentColor">
                          <path d="M0 0v23h11.5v-11.5h-11.5z" fill="#f3f3f3" />
                          <path d="M11.5 0v11.5h11.5v-11.5z" fill="#f35325" />
                          <path d="M11.5 11.5v11.5h11.5v-11.5z" fill="#7fba00" />
                          <path d="M0 11.5v11.5h11.5v-11.5z" fill="#00a4ef" />
                        </svg>
                        <span>Continue with Microsoft</span>
                      </Button>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-64 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        Social login is currently unavailable. Please use email and password.
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="mt-6 text-center text-sm text-gray-500">
                <p>
                  By continuing, you agree to the{" "}
                  <a href="#" className="text-orange-600 hover:underline">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-orange-600 hover:underline">
                    Privacy Policy
                  </a>
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AuthModal
