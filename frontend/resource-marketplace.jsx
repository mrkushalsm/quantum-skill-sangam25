"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Shield,
  Search,
  Filter,
  Plus,
  BookOpen,
  Wrench,
  Home,
  MessageCircle,
  MapPin,
  User,
  Star,
  Heart,
  Share2,
  Phone,
  Mail,
  Clock,
  CheckCircle,
} from "lucide-react"

import { HomeIcon } from "lucide-react"

const ResourceMarketplace = () => {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedResource, setSelectedResource] = useState(null)

  const categories = [
    { id: "all", name: "All Resources", icon: Shield, color: "bg-blue-500" },
    { id: "books", name: "Books & Education", icon: BookOpen, color: "bg-green-500" },
    { id: "equipment", name: "Equipment & Gear", icon: Wrench, color: "bg-orange-500" },
    { id: "housing", name: "Housing & Accommodation", icon: Home, color: "bg-purple-500" },
  ]

  const resources = [
    {
      id: 1,
      title: "Military History Collection",
      description: "Complete set of Indian military history books including Kargil War documentation",
      category: "books",
      type: "Share",
      location: "Delhi Cantonment",
      postedBy: "Col. Rajesh Kumar",
      unit: "Rajputana Rifles",
      rating: 4.8,
      image: "/placeholder.svg?height=200&width=300",
      price: "Free",
      condition: "Excellent",
      postedDate: "2 days ago",
      status: "available",
    },
    {
      id: 2,
      title: "Family Accommodation - 3BHK",
      description: "Well-maintained 3BHK apartment in Army Officers Colony, available for exchange",
      category: "housing",
      type: "Exchange",
      location: "Pune Cantonment",
      postedBy: "Maj. Priya Sharma",
      unit: "Corps of Engineers",
      rating: 4.9,
      image: "/placeholder.svg?height=200&width=300",
      price: "Exchange",
      condition: "Good",
      postedDate: "1 week ago",
      status: "available",
    },
    {
      id: 3,
      title: "Combat Training Equipment",
      description: "Professional grade training equipment including tactical gear and accessories",
      category: "equipment",
      type: "Sell",
      location: "Bangalore Cantonment",
      postedBy: "Capt. Arun Singh",
      unit: "Parachute Regiment",
      rating: 4.7,
      image: "/placeholder.svg?height=200&width=300",
      price: "₹15,000",
      condition: "Very Good",
      postedDate: "3 days ago",
      status: "available",
    },
    {
      id: 4,
      title: "Children's Educational Books",
      description: "CBSE curriculum books for classes 6-10, excellent condition",
      category: "books",
      type: "Share",
      location: "Mumbai Naval Base",
      postedBy: "Lt. Cdr. Meera Nair",
      unit: "Indian Navy",
      rating: 4.6,
      image: "/placeholder.svg?height=200&width=300",
      price: "Free",
      condition: "Good",
      postedDate: "5 days ago",
      status: "reserved",
    },
  ]

  const filteredResources = resources.filter((resource) => {
    const matchesCategory = selectedCategory === "all" || resource.category === selectedCategory
    const matchesSearch =
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
      {/* Back to Home Button */}
      <div className="fixed top-4 left-4 z-50">
        <Button
          onClick={() => (window.location.href = "/")}
          className="bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700 text-white shadow-lg rounded-full w-12 h-12 p-0"
        >
          <HomeIcon className="w-5 h-5" />
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
                <h1 className="text-2xl font-bold text-gray-900">Resource Sharing Marketplace</h1>
                <p className="text-sm text-gray-600">संसाधन साझाकरण बाज़ार</p>
              </div>
            </div>

            <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700">
                  <Plus className="w-5 h-5 mr-2" />
                  Add Resource
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Share a New Resource</DialogTitle>
                </DialogHeader>
                <AddResourceForm onClose={() => setShowAddForm(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search resources, books, equipment..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 border-2 border-gray-200 focus:border-orange-500"
              />
            </div>
            <Button variant="outline" className="h-12 px-6 border-2 border-gray-200">
              <Filter className="w-5 h-5 mr-2" />
              Advanced Filter
            </Button>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <motion.button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-full font-medium transition-all ${
                  selectedCategory === category.id
                    ? "bg-gradient-to-r from-orange-500 to-green-600 text-white shadow-lg"
                    : "bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <category.icon className="w-5 h-5" />
                <span>{category.name}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Resources Grid */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence>
            {filteredResources.map((resource) => (
              <motion.div
                key={resource.id}
                variants={fadeInUp}
                layout
                whileHover={{ y: -5 }}
                className="group cursor-pointer"
                onClick={() => setSelectedResource(resource)}
              >
                <Card className="h-full border-0 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
                  <div className="relative">
                    <img
                      src={resource.image || "/placeholder.svg"}
                      alt={resource.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge
                        className={`${
                          resource.type === "Share"
                            ? "bg-green-500"
                            : resource.type === "Exchange"
                              ? "bg-blue-500"
                              : "bg-orange-500"
                        } text-white`}
                      >
                        {resource.type}
                      </Badge>
                    </div>
                    <div className="absolute top-4 right-4">
                      <Badge
                        className={`${
                          resource.status === "available"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {resource.status === "available" ? "Available" : "Reserved"}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                          {resource.title}
                        </h3>
                        <p className="text-gray-600 text-sm mt-2 line-clamp-2">{resource.description}</p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-orange-600">{resource.price}</div>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-medium">{resource.rating}</span>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2" />
                          {resource.location}
                        </div>
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2" />
                          {resource.postedBy} • {resource.unit}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          {resource.postedDate}
                        </div>
                      </div>

                      <div className="flex space-x-2 pt-4">
                        <Button size="sm" className="flex-1 bg-orange-500 hover:bg-orange-600">
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Contact
                        </Button>
                        <Button size="sm" variant="outline" className="border-orange-500 text-orange-600">
                          <Heart className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="border-orange-500 text-orange-600">
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredResources.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No resources found</h3>
            <p className="text-gray-600">Try adjusting your search or category filter</p>
          </motion.div>
        )}
      </div>

      {/* Resource Detail Modal */}
      <Dialog open={!!selectedResource} onOpenChange={() => setSelectedResource(null)}>
        <DialogContent className="max-w-4xl">
          {selectedResource && <ResourceDetail resource={selectedResource} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}

const AddResourceForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    type: "",
    price: "",
    condition: "",
    location: "",
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    // Handle form submission
    console.log("Form submitted:", formData)
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Resource Title</label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter resource title"
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
              <SelectItem value="books">Books & Education</SelectItem>
              <SelectItem value="equipment">Equipment & Gear</SelectItem>
              <SelectItem value="housing">Housing & Accommodation</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe your resource in detail"
          rows={4}
          required
        />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
          <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="share">Share (Free)</SelectItem>
              <SelectItem value="exchange">Exchange</SelectItem>
              <SelectItem value="sell">Sell</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Price/Value</label>
          <Input
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="Free, ₹5000, Exchange"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
          <Select value={formData.condition} onValueChange={(value) => setFormData({ ...formData, condition: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="excellent">Excellent</SelectItem>
              <SelectItem value="very-good">Very Good</SelectItem>
              <SelectItem value="good">Good</SelectItem>
              <SelectItem value="fair">Fair</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
        <Input
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          placeholder="Your cantonment/base location"
          required
        />
      </div>

      <div className="flex space-x-4 pt-4">
        <Button type="submit" className="flex-1 bg-gradient-to-r from-orange-500 to-green-600">
          Post Resource
        </Button>
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  )
}

const ResourceDetail = ({ resource }) => {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <img
            src={resource.image || "/placeholder.svg"}
            alt={resource.title}
            className="w-full h-64 object-cover rounded-lg"
          />
        </div>
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{resource.title}</h2>
            <p className="text-gray-600 mt-2">{resource.description}</p>
          </div>

          <div className="flex items-center space-x-4">
            <Badge
              className={`${
                resource.type === "Share"
                  ? "bg-green-500"
                  : resource.type === "Exchange"
                    ? "bg-blue-500"
                    : "bg-orange-500"
              } text-white`}
            >
              {resource.type}
            </Badge>
            <div className="text-2xl font-bold text-orange-600">{resource.price}</div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-gray-500" />
              <span>{resource.location}</span>
            </div>
            <div className="flex items-center">
              <User className="w-4 h-4 mr-2 text-gray-500" />
              <span>
                {resource.postedBy} • {resource.unit}
              </span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-gray-500" />
              <span>Condition: {resource.condition}</span>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button className="flex-1 bg-orange-500 hover:bg-orange-600">
              <Phone className="w-4 h-4 mr-2" />
              Call Now
            </Button>
            <Button className="flex-1 bg-green-500 hover:bg-green-600">
              <Mail className="w-4 h-4 mr-2" />
              Send Message
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResourceMarketplace
