"use client"

import { useState, useEffect } from "react"
import { emergencyApi } from "@/lib/api"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Shield,
  Phone,
  MapPin,
  Clock,
  Heart,
  AlertTriangle,
  Users,
  Zap,
  Navigation,
  UserPlus,
  MessageCircle,
  Share2,
  Bell,
  CheckCircle,
  Search,
  Star,
  Calendar,
  Activity,
  HomeIcon,
} from "lucide-react"

const EmergencyNetwork = ({ setCurrentPage }) => {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [sosActive, setSosActive] = useState(false)
  const [location, setLocation] = useState(null)
  const [emergencyContacts, setEmergencyContacts] = useState([])
  const [showAddContact, setShowAddContact] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Simulate getting user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: "Delhi Cantonment, New Delhi", // Simulated address
          })
        },
        (error) => {
          console.log("Location access denied")
          setLocation({
            lat: 28.6139,
            lng: 77.209,
            address: "Delhi Cantonment, New Delhi", // Default location
          })
        },
      )
    }
  }, [])

  const emergencyServices = [
    {
      id: 1,
      name: "Base Medical Emergency",
      number: "100",
      type: "Medical",
      icon: Heart,
      color: "bg-red-500",
      available: true,
      responseTime: "3-5 mins",
      description: "24/7 medical emergency services at base hospital",
    },
    {
      id: 2,
      name: "Military Police",
      number: "101",
      type: "Security",
      icon: Shield,
      color: "bg-blue-500",
      available: true,
      responseTime: "2-4 mins",
      description: "Military police for security emergencies",
    },
    {
      id: 3,
      name: "Fire & Rescue",
      number: "102",
      type: "Fire",
      icon: AlertTriangle,
      color: "bg-orange-500",
      available: true,
      responseTime: "4-6 mins",
      description: "Fire and rescue services for cantonment area",
    },
    {
      id: 4,
      name: "Family Support Helpline",
      number: "1800-XXX-XXXX",
      type: "Support",
      icon: Users,
      color: "bg-green-500",
      available: true,
      responseTime: "Immediate",
      description: "24/7 family support and counseling services",
    },
  ]

  const familyNetwork = [
    {
      id: 1,
      name: "Mrs. Priya Kumar",
      relation: "Spouse",
      phone: "+91-98765-43210",
      location: "Delhi Cantonment",
      status: "online",
      lastSeen: "2 mins ago",
      avatar: "/placeholder.svg?height=40&width=40",
      emergencyContact: true,
    },
    {
      id: 2,
      name: "Col. Rajesh Kumar",
      relation: "Father",
      phone: "+91-98765-43211",
      location: "Pune Cantonment",
      status: "offline",
      lastSeen: "1 hour ago",
      avatar: "/placeholder.svg?height=40&width=40",
      emergencyContact: true,
    },
    {
      id: 3,
      name: "Dr. Meera Sharma",
      relation: "Family Doctor",
      phone: "+91-98765-43212",
      location: "Base Hospital",
      status: "online",
      lastSeen: "Active now",
      avatar: "/placeholder.svg?height=40&width=40",
      emergencyContact: false,
    },
    {
      id: 4,
      name: "Maj. Arun Singh",
      relation: "Unit Buddy",
      phone: "+91-98765-43213",
      location: "Same Unit",
      status: "online",
      lastSeen: "5 mins ago",
      avatar: "/placeholder.svg?height=40&width=40",
      emergencyContact: true,
    },
  ]

  const recentAlerts = [
    {
      id: 1,
      type: "Medical",
      message: "Medical emergency alert sent to 5 contacts",
      timestamp: "2024-01-18 14:30",
      status: "resolved",
      location: "Delhi Cantonment",
    },
    {
      id: 2,
      type: "Safety",
      message: "Safety check-in reminder sent",
      timestamp: "2024-01-18 12:00",
      status: "completed",
      location: "Delhi Cantonment",
    },
    {
      id: 3,
      type: "Family",
      message: "Family support request forwarded",
      timestamp: "2024-01-17 18:45",
      status: "in-progress",
      location: "Mumbai Naval Base",
    },
  ]

  const handleSOS = () => {
    setSosActive(true)
    // Simulate SOS activation
    setTimeout(() => {
      setSosActive(false)
    }, 5000)
  }

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" },
  }

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const pulseAnimation = {
    animate: {
      scale: [1, 1.05, 1],
      opacity: [1, 0.8, 1],
    },
    transition: {
      duration: 2,
      repeat: Number.POSITIVE_INFINITY,
      ease: "easeInOut",
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      {/* Back to Home Button */}
      <div className="fixed top-6 left-6 z-50">
        <Button
          onClick={() => setCurrentPage("home")}
          className="bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700 text-white shadow-lg rounded-full w-14 h-14 p-0 flex items-center justify-center"
          aria-label="Back to Home"
        >
          <HomeIcon className="w-6 h-6" />
        </Button>
      </div>
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 via-white to-green-600 h-1"></div>

      <header className="bg-white shadow-lg border-b-2 border-orange-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-green-600 rounded-full flex items-center justify-center">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Emergency Contact Network</h1>
                <p className="text-sm text-gray-600">आपातकालीन संपर्क नेटवर्क</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {location && (
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-1" />
                  {location.address}
                </div>
              )}
              <Badge className="bg-green-100 text-green-800">
                <Activity className="w-3 h-3 mr-1" />
                Network Active
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* SOS Button - Always Visible */}
        <motion.div className="fixed bottom-8 right-8 z-50" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <motion.button
            onClick={handleSOS}
            className={`w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-2xl ${
              sosActive ? "bg-red-600" : "bg-red-500 hover:bg-red-600"
            }`}
            animate={sosActive ? pulseAnimation : {}}
          >
            {sosActive ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              >
                <Zap className="w-8 h-8" />
              </motion.div>
            ) : (
              "SOS"
            )}
          </motion.button>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white border-2 border-gray-200">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="emergency" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              Emergency Services
            </TabsTrigger>
            <TabsTrigger value="network" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              Family Network
            </TabsTrigger>
            <TabsTrigger value="alerts" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              Recent Alerts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Quick Stats */}
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              <motion.div variants={fadeInUp}>
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Emergency Contacts</p>
                        <p className="text-3xl font-bold text-gray-900">12</p>
                        <p className="text-sm text-green-600">All Active</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={fadeInUp}>
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Response Time</p>
                        <p className="text-3xl font-bold text-gray-900">2.5</p>
                        <p className="text-sm text-green-600">Minutes Avg</p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <Clock className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={fadeInUp}>
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Network Status</p>
                        <p className="text-3xl font-bold text-gray-900">98%</p>
                        <p className="text-sm text-green-600">Uptime</p>
                      </div>
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <Activity className="w-6 h-6 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={fadeInUp}>
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Last Check-in</p>
                        <p className="text-3xl font-bold text-gray-900">2h</p>
                        <p className="text-sm text-blue-600">Ago</p>
                      </div>
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            {/* Quick Actions */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Quick Emergency Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button className="h-20 bg-red-500 hover:bg-red-600 flex flex-col items-center justify-center">
                    <Heart className="w-6 h-6 mb-2" />
                    Medical Emergency
                  </Button>
                  <Button className="h-20 bg-blue-500 hover:bg-blue-600 flex flex-col items-center justify-center">
                    <Shield className="w-6 h-6 mb-2" />
                    Security Alert
                  </Button>
                  <Button className="h-20 bg-orange-500 hover:bg-orange-600 flex flex-col items-center justify-center">
                    <AlertTriangle className="w-6 h-6 mb-2" />
                    Fire Emergency
                  </Button>
                  <Button className="h-20 bg-green-500 hover:bg-green-600 flex flex-col items-center justify-center">
                    <Users className="w-6 h-6 mb-2" />
                    Family Support
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Location & Status */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="w-5 h-5 mr-2" />
                    Current Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {location ? (
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="font-medium text-gray-900">{location.address}</p>
                        <p className="text-sm text-gray-600">
                          Coordinates: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                        </p>
                      </div>
                      <div className="flex space-x-3">
                        <Button size="sm" variant="outline">
                          <Share2 className="w-4 h-4 mr-2" />
                          Share Location
                        </Button>
                        <Button size="sm" variant="outline">
                          <Navigation className="w-4 h-4 mr-2" />
                          Update Location
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Location access required for emergency services</p>
                      <Button className="mt-4" size="sm">
                        Enable Location
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="w-5 h-5 mr-2" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentAlerts.slice(0, 3).map((alert) => (
                      <div key={alert.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div
                          className={`w-2 h-2 rounded-full mt-2 ${
                            alert.status === "resolved"
                              ? "bg-green-500"
                              : alert.status === "completed"
                                ? "bg-blue-500"
                                : "bg-yellow-500"
                          }`}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                          <p className="text-xs text-gray-500">{alert.timestamp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="emergency" className="space-y-6">
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="grid md:grid-cols-2 gap-6"
            >
              {emergencyServices.map((service) => (
                <motion.div key={service.id} variants={fadeInUp}>
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div
                            className={`w-16 h-16 ${service.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}
                          >
                            <service.icon className="w-8 h-8 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{service.name}</h3>
                            <p className="text-gray-600">{service.type}</p>
                          </div>
                        </div>
                        <Badge
                          className={service.available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                        >
                          {service.available ? "Available" : "Unavailable"}
                        </Badge>
                      </div>

                      <p className="text-gray-600 mb-4">{service.description}</p>

                      <div className="flex items-center justify-between mb-4">
                        <div className="text-sm text-gray-500">
                          Response Time: <span className="font-medium">{service.responseTime}</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{service.number}</div>
                      </div>

                      <div className="flex space-x-3">
                        <Button className="flex-1 bg-red-500 hover:bg-red-600" disabled={!service.available}>
                          <Phone className="w-4 h-4 mr-2" />
                          Call Now
                        </Button>
                        <Button variant="outline" className="border-red-500 text-red-600">
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>

          <TabsContent value="network" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 border-2 border-gray-200 focus:border-orange-500"
                />
              </div>
              <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
                <DialogTrigger asChild>
                  <Button className="ml-4 bg-gradient-to-r from-orange-500 to-green-600">
                    <UserPlus className="w-5 h-5 mr-2" />
                    Add Contact
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Emergency Contact</DialogTitle>
                  </DialogHeader>
                  <AddContactForm onClose={() => setShowAddContact(false)} refreshContacts={() => {}} />
                </DialogContent>
              </Dialog>
            </div>

            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="grid md:grid-cols-2 gap-4"
            >
              {familyNetwork.map((contact) => (
                <motion.div key={contact.id} variants={fadeInUp}>
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <img
                              src={contact.avatar || "/placeholder.svg"}
                              alt={contact.name}
                              className="w-12 h-12 rounded-full border-2 border-gray-200"
                            />
                            <div
                              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                                contact.status === "online" ? "bg-green-500" : "bg-gray-400"
                              }`}
                            />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900">{contact.name}</h3>
                            <p className="text-sm text-gray-600">{contact.relation}</p>
                            <p className="text-xs text-gray-500">{contact.lastSeen}</p>
                          </div>
                        </div>
                        {contact.emergencyContact && (
                          <Badge className="bg-red-100 text-red-800">
                            <Star className="w-3 h-3 mr-1" />
                            Emergency
                          </Badge>
                        )}
                      </div>

                      <div className="mt-4 space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="w-4 h-4 mr-2" />
                          {contact.phone}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-2" />
                          {contact.location}
                        </div>
                      </div>

                      <div className="flex space-x-2 mt-4">
                        <Button size="sm" className="flex-1 bg-green-500 hover:bg-green-600">
                          <Phone className="w-4 h-4 mr-2" />
                          Call
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Message
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Recent Emergency Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div
                        className={`w-3 h-3 rounded-full mt-2 ${
                          alert.status === "resolved"
                            ? "bg-green-500"
                            : alert.status === "completed"
                              ? "bg-blue-500"
                              : "bg-yellow-500"
                        }`}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">{alert.message}</h4>
                          <Badge
                            className={
                              alert.status === "resolved"
                                ? "bg-green-100 text-green-800"
                                : alert.status === "completed"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-yellow-100 text-yellow-800"
                            }
                          >
                            {alert.status}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {alert.timestamp}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {alert.location}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* SOS Active Modal */}
      <AnimatePresence>
        {sosActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-red-600 bg-opacity-95 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="text-center text-white"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                className="w-32 h-32 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-8"
              >
                <Zap className="w-16 h-16" />
              </motion.div>
              <h2 className="text-4xl font-bold mb-4">SOS ACTIVATED</h2>
              <p className="text-xl mb-8">Emergency contacts have been notified</p>
              <div className="space-y-2">
                <p>• Location shared with emergency services</p>
                <p>• Family members alerted</p>
                <p>• Medical team dispatched</p>
              </div>
              <Button
                onClick={() => setSosActive(false)}
                className="mt-8 bg-white text-red-600 hover:bg-gray-100"
                size="lg"
              >
                Cancel SOS
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const AddContactForm = ({ onClose, refreshContacts }) => {
  const [contactData, setContactData] = useState({
    name: '',
    relation: '',
    phone: '',
    location: '',
    emergencyContact: false
  });
  const [submitting, setSubmitting] = useState(false);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setContactData({
      ...contactData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // Check if user is logged in before submitting
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error("You must be logged in to add contacts");
        setSubmitting(false);
        return;
      }
      
      console.log("Contact added: ", contactData);
      
      // Use the API function with error handling
      const response = await emergencyApi.addContact({
        name: contactData.name,
        relationship: contactData.relation,
        phoneNumber: contactData.phone,
        isPrimary: contactData.emergencyContact
      });
      
      console.log('Contact added successfully:', response.data);
      
      // Reset form
      setContactData({
        name: '',
        relation: '',
        phone: '',
        location: '',
        emergencyContact: false
      });
      
      // Close form and show success message
      setSubmitting(false);
      onClose();
      toast.success("Contact added successfully!");
      
      // Refresh contacts list
      if (refreshContacts) refreshContacts();
    } catch (error) {
      console.error('Error adding contact:', error);
      const errorMessage = error.response?.data?.message || 'Error adding contact. Please try again.';
      toast.error(errorMessage);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
          <Input
            name="name"
            value={contactData.name}
            onChange={handleChange}
            placeholder="Contact name"
            required
            disabled={submitting}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Relation</label>
          <Input
            name="relation"
            value={contactData.relation}
            onChange={handleChange}
            placeholder="Spouse, Parent, Friend, etc."
            required
            disabled={submitting}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
          <Input
            name="phone"
            value={contactData.phone}
            onChange={handleChange}
            placeholder="+91-XXXXX-XXXXX"
            required
            disabled={submitting}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
          <Input
            name="location"
            value={contactData.location}
            onChange={handleChange}
            placeholder="City, Cantonment"
            required
            disabled={submitting}
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="emergencyContact"
          name="emergencyContact"
          checked={contactData.emergencyContact}
          onChange={handleChange}
          className="rounded border-gray-300"
          disabled={submitting}
        />
        <label htmlFor="emergencyContact" className="text-sm text-gray-700">
          Mark as primary emergency contact
        </label>
      </div>

      <div className="flex space-x-4 pt-4">
        <Button 
          type="submit" 
          className="flex-1 bg-gradient-to-r from-orange-500 to-green-600"
          disabled={submitting}
        >
          {submitting ? "Adding..." : "Add Contact"}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onClose} 
          className="flex-1"
          disabled={submitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}

export default EmergencyNetwork
