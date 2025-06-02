"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Shield,
  Plus,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Search,
  Calendar,
  User,
  MessageSquare,
  Phone,
  Eye,
  Download,
  Upload,
  Star,
  TrendingUp,
  HomeIcon,
} from "lucide-react"

const GrievanceSystem = ({ setCurrentPage }) => {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [showNewGrievance, setShowNewGrievance] = useState(false)
  const [selectedGrievance, setSelectedGrievance] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const grievanceStats = [
    { title: "Total Grievances", value: "1,247", change: "+12%", icon: FileText, color: "text-blue-600" },
    { title: "Pending Review", value: "89", change: "-5%", icon: Clock, color: "text-yellow-600" },
    { title: "Resolved", value: "1,098", change: "+18%", icon: CheckCircle, color: "text-green-600" },
    { title: "High Priority", value: "23", change: "+3%", icon: AlertTriangle, color: "text-red-600" },
  ]

  const grievances = [
    {
      id: "GRV-2024-001",
      title: "Medical Facility Access Issue",
      description: "Unable to access specialized medical treatment at base hospital",
      category: "Medical",
      priority: "High",
      status: "In Progress",
      submittedBy: "Maj. Rajesh Kumar",
      unit: "Rajputana Rifles",
      submittedDate: "2024-01-15",
      lastUpdate: "2024-01-18",
      assignedTo: "Dr. Priya Sharma",
      expectedResolution: "2024-01-25",
      attachments: 2,
    },
    {
      id: "GRV-2024-002",
      title: "Housing Allocation Delay",
      description: "Family accommodation not allocated despite being eligible for 6 months",
      category: "Housing",
      priority: "Medium",
      status: "Under Review",
      submittedBy: "Capt. Arun Singh",
      unit: "Corps of Engineers",
      submittedDate: "2024-01-12",
      lastUpdate: "2024-01-16",
      assignedTo: "Housing Committee",
      expectedResolution: "2024-01-30",
      attachments: 5,
    },
    {
      id: "GRV-2024-003",
      title: "Educational Allowance Processing",
      description: "Children's educational allowance not processed for current academic year",
      category: "Education",
      priority: "Medium",
      status: "Resolved",
      submittedBy: "Lt. Col. Meera Nair",
      unit: "Indian Navy",
      submittedDate: "2024-01-08",
      lastUpdate: "2024-01-14",
      assignedTo: "Finance Department",
      expectedResolution: "2024-01-20",
      attachments: 3,
      resolution: "Educational allowance processed and credited to account",
    },
    {
      id: "GRV-2024-004",
      title: "Canteen Service Quality",
      description: "Poor quality of food and service at unit canteen affecting personnel health",
      category: "Welfare",
      priority: "Low",
      status: "Pending",
      submittedBy: "Havildar Suresh Kumar",
      unit: "Garhwal Rifles",
      submittedDate: "2024-01-10",
      lastUpdate: "2024-01-10",
      assignedTo: "Welfare Officer",
      expectedResolution: "2024-01-28",
      attachments: 1,
    },
  ]

  const filteredGrievances = grievances.filter((grievance) => {
    const matchesSearch =
      grievance.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      grievance.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || grievance.status.toLowerCase().replace(" ", "-") === statusFilter
    return matchesSearch && matchesStatus
  })

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800"
      case "Medium":
        return "bg-yellow-100 text-yellow-800"
      case "Low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "Resolved":
        return "bg-green-100 text-green-800"
      case "In Progress":
        return "bg-blue-100 text-blue-800"
      case "Under Review":
        return "bg-yellow-100 text-yellow-800"
      case "Pending":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
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

      <header className="bg-white shadow-lg border-b-2 border-orange-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-green-600 rounded-full flex items-center justify-center">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Grievance Redressal System</h1>
                <p className="text-sm text-gray-600">शिकायत निवारण प्रणाली</p>
              </div>
            </div>

            <Dialog open={showNewGrievance} onOpenChange={setShowNewGrievance}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700">
                  <Plus className="w-5 h-5 mr-2" />
                  File Grievance
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>File a New Grievance</DialogTitle>
                </DialogHeader>
                <NewGrievanceForm onClose={() => setShowNewGrievance(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white border-2 border-gray-200">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              Dashboard
            </TabsTrigger>
            <TabsTrigger
              value="my-grievances"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
            >
              My Grievances
            </TabsTrigger>
            <TabsTrigger value="track" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              Track Status
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Cards */}
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {grievanceStats.map((stat, index) => (
                <motion.div key={index} variants={fadeInUp}>
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                          <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                          <p className={`text-sm ${stat.change.startsWith("+") ? "text-green-600" : "text-red-600"}`}>
                            {stat.change} from last month
                          </p>
                        </div>
                        <div className={`w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center`}>
                          <stat.icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            {/* Recent Grievances */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Recent Grievances</span>
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    View All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {grievances.slice(0, 3).map((grievance) => (
                    <div key={grievance.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-semibold text-gray-900">{grievance.title}</h4>
                          <Badge className={getPriorityColor(grievance.priority)}>{grievance.priority}</Badge>
                          <Badge className={getStatusColor(grievance.status)}>{grievance.status}</Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {grievance.submittedBy} • {grievance.submittedDate}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setSelectedGrievance(grievance)}>
                        View Details
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="my-grievances" className="space-y-6">
            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search grievances..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 border-2 border-gray-200 focus:border-orange-500"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 h-12 border-2 border-gray-200">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="under-review">Under Review</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Grievances List */}
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-4">
              <AnimatePresence>
                {filteredGrievances.map((grievance) => (
                  <motion.div
                    key={grievance.id}
                    variants={fadeInUp}
                    layout
                    whileHover={{ y: -2 }}
                    className="cursor-pointer"
                    onClick={() => setSelectedGrievance(grievance)}
                  >
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center space-x-3">
                              <h3 className="text-lg font-bold text-gray-900">{grievance.title}</h3>
                              <Badge className={getPriorityColor(grievance.priority)}>{grievance.priority}</Badge>
                              <Badge className={getStatusColor(grievance.status)}>{grievance.status}</Badge>
                            </div>

                            <p className="text-gray-600">{grievance.description}</p>

                            <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-500">
                              <div className="flex items-center">
                                <FileText className="w-4 h-4 mr-2" />
                                ID: {grievance.id}
                              </div>
                              <div className="flex items-center">
                                <User className="w-4 h-4 mr-2" />
                                {grievance.submittedBy}
                              </div>
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-2" />
                                {grievance.submittedDate}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end space-y-2">
                            <div className="text-sm text-gray-500">Expected: {grievance.expectedResolution}</div>
                            {grievance.attachments > 0 && (
                              <Badge variant="outline">{grievance.attachments} attachments</Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {filteredGrievances.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No grievances found</h3>
                <p className="text-gray-600">Try adjusting your search or filter criteria</p>
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="track" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Track Grievance Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <Input placeholder="Enter Grievance ID (e.g., GRV-2024-001)" className="flex-1" />
                    <Button className="bg-orange-500 hover:bg-orange-600">
                      <Search className="w-4 h-4 mr-2" />
                      Track
                    </Button>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Tracking Information</h4>
                    <p className="text-gray-600">
                      Enter a valid grievance ID to track its current status and progress.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Resolution Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Chart visualization would go here</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Star className="w-5 h-5 mr-2" />
                    Category Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Pie chart would go here</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Grievance Detail Modal */}
      <Dialog open={!!selectedGrievance} onOpenChange={() => setSelectedGrievance(null)}>
        <DialogContent className="max-w-4xl">
          {selectedGrievance && <GrievanceDetail grievance={selectedGrievance} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}

const NewGrievanceForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    priority: "",
    attachments: [],
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log("Grievance submitted:", formData)
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Grievance Title</label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Brief title of your grievance"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="medical">Medical</SelectItem>
              <SelectItem value="housing">Housing</SelectItem>
              <SelectItem value="education">Education</SelectItem>
              <SelectItem value="welfare">Welfare</SelectItem>
              <SelectItem value="finance">Finance</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Detailed Description</label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Provide detailed information about your grievance"
          rows={6}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Priority Level</label>
        <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low - General inquiry or suggestion</SelectItem>
            <SelectItem value="medium">Medium - Issue affecting daily operations</SelectItem>
            <SelectItem value="high">High - Urgent issue requiring immediate attention</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Supporting Documents</label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Click to upload or drag and drop files</p>
          <p className="text-xs text-gray-500">PDF, DOC, JPG, PNG up to 10MB each</p>
        </div>
      </div>

      <div className="flex space-x-4 pt-4">
        <Button type="submit" className="flex-1 bg-gradient-to-r from-orange-500 to-green-600">
          Submit Grievance
        </Button>
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  )
}

const GrievanceDetail = ({ grievance }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{grievance.title}</h2>
          <p className="text-gray-600 mt-1">ID: {grievance.id}</p>
        </div>
        <div className="flex space-x-2">
          <Badge className={getPriorityColor(grievance.priority)}>{grievance.priority}</Badge>
          <Badge className={getStatusColor(grievance.status)}>{grievance.status}</Badge>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-600">{grievance.description}</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Submitted By</h3>
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-gray-500" />
              <span>
                {grievance.submittedBy} • {grievance.unit}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Timeline</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                <span>Submitted: {grievance.submittedDate}</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2 text-gray-500" />
                <span>Last Update: {grievance.lastUpdate}</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-gray-500" />
                <span>Expected Resolution: {grievance.expectedResolution}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Assigned To</h3>
            <p className="text-gray-600">{grievance.assignedTo}</p>
          </div>
        </div>
      </div>

      {grievance.resolution && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-900 mb-2">Resolution</h3>
          <p className="text-green-800">{grievance.resolution}</p>
        </div>
      )}

      <div className="flex space-x-3 pt-4">
        <Button className="bg-orange-500 hover:bg-orange-600">
          <MessageSquare className="w-4 h-4 mr-2" />
          Add Comment
        </Button>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Download Report
        </Button>
        <Button variant="outline">
          <Phone className="w-4 h-4 mr-2" />
          Contact Officer
        </Button>
      </div>
    </div>
  )
}

const getPriorityColor = (priority) => {
  switch (priority) {
    case "High":
      return "bg-red-100 text-red-800"
    case "Medium":
      return "bg-yellow-100 text-yellow-800"
    case "Low":
      return "bg-green-100 text-green-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const getStatusColor = (status) => {
  switch (status) {
    case "Resolved":
      return "bg-green-100 text-green-800"
    case "In Progress":
      return "bg-blue-100 text-blue-800"
    case "Under Review":
      return "bg-yellow-100 text-yellow-800"
    case "Pending":
      return "bg-gray-100 text-gray-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export default GrievanceSystem
