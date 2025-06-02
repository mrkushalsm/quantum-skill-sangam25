"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, User, UserCheck, ChevronRight, Loader2 } from "lucide-react"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onLogin: (role: string) => void
}

const AuthModal = ({ isOpen, onClose, onLogin }: AuthModalProps) => {
  const [activeTab, setActiveTab] = useState("login")
  const [role, setRole] = useState("officer")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = () => {
    setIsLoading(true)
    // Simulate login process
    setTimeout(() => {
      setIsLoading(false)
      onLogin(role)
    }, 1000)
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
                  <div className="space-y-4">
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
                      <Label htmlFor="email">Service ID / Email</Label>
                      <Input id="email" placeholder="Enter your ID or email" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <a href="#" className="text-xs text-orange-600 hover:underline">
                          Forgot password?
                        </a>
                      </div>
                      <Input id="password" type="password" placeholder="••••••••" />
                    </div>
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700"
                    onClick={handleLogin}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      "Login"
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="register" className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reg-role">Select Role</Label>
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
                        <Input id="first-name" placeholder="First name" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last-name">Last Name</Label>
                        <Input id="last-name" placeholder="Last name" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="service-id">Service ID / Email</Label>
                      <Input id="service-id" placeholder="Enter your ID or email" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reg-password">Password</Label>
                      <Input id="reg-password" type="password" placeholder="••••••••" />
                    </div>
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700"
                    onClick={handleLogin}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
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
