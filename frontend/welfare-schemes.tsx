"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { LucideIcon } from "lucide-react"
import {
  Shield,
  Search,
  Filter,
  FileText,
  Clock,
  CheckCircle,
  Users,
  GraduationCap,
  Heart,
  Home,
  Banknote,
  Calendar,
  Download,
  Eye,
  HomeIcon,
  Star,
  Phone,
  MapPin,
  TrendingUp,
  Award,
  Building,
} from "lucide-react"

// Type definitions
interface WelfareSchemesProps {
  setCurrentPage: (page: string) => void
}

interface Category {
  id: string
  name: string
  icon: LucideIcon
  color: string
  count: number
}

interface WelfareScheme {
  id: number
  title: string
  shortDescription: string
  description: string
  category: string
  eligibility: string[]
  benefits: string[]
  applicationDeadline: string
  status: "Open" | "Closed" | "Coming Soon"
  documentsRequired: string[]
  processingTime: string
  contactOfficer: string
  contactPhone: string
  contactEmail: string
  applicationsReceived: number
  maxApplications: number
  successRate: number
  lastUpdated: string
  ministry: string
  implementingAgency: string
  schemeCode: string
  launchDate: string
  tags: string[]
}

const WelfareSchemes = ({ setCurrentPage }: WelfareSchemesProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [selectedScheme, setSelectedScheme] = useState<WelfareScheme | null>(null)
  const [activeTab, setActiveTab] = useState<string>("browse")

  const categories: Category[] = [
    { id: "all", name: "All Schemes", icon: Shield, color: "bg-blue-500", count: 25 },
    { id: "education", name: "Education & Training", icon: GraduationCap, color: "bg-green-500", count: 8 },
    { id: "medical", name: "Medical & Health", icon: Heart, color: "bg-red-500", count: 6 },
    { id: "housing", name: "Housing & Accommodation", icon: Home, color: "bg-purple-500", count: 4 },
    { id: "financial", name: "Financial Assistance", icon: Banknote, color: "bg-orange-500", count: 5 },
    { id: "family", name: "Family Welfare", icon: Users, color: "bg-pink-500", count: 2 },
  ]

  const schemes: WelfareScheme[] = [
    {
      id: 1,
      title: "Army Education Corps Scholarship",
      shortDescription: "Financial assistance for higher education of military children",
      description:
        "Comprehensive scholarship program providing financial support for children of serving and retired army personnel pursuing higher education in recognized institutions across India.",
      category: "education",
      eligibility: [
        "Children of serving/retired army personnel",
        "Merit-based selection with minimum 75% marks",
        "Age limit: 18-25 years",
        "Family income below ₹8 lakhs per annum",
        "Admission in recognized university/college",
      ],
      benefits: [
        "Up to ₹50,000 per year for tuition fees",
        "Additional ₹10,000 for books and stationery",
        "Hostel allowance of ₹15,000 per year",
        "One-time laptop allowance of ₹25,000",
        "Merit scholarships for toppers",
      ],
      applicationDeadline: "2024-03-31",
      status: "Open",
      documentsRequired: [
        "Service certificate of parent",
        "Academic transcripts (Class 10th & 12th)",
        "Income certificate",
        "Admission letter from institution",
        "Bank account details",
        "Passport size photographs",
      ],
      processingTime: "30-45 days",
      contactOfficer: "Lt. Col. Priya Sharma",
      contactPhone: "+91-11-2671-XXXX",
      contactEmail: "education.welfare@army.mil.in",
      applicationsReceived: 1250,
      maxApplications: 2000,
      successRate: 85,
      lastUpdated: "2024-01-15",
      ministry: "Ministry of Defence",
      implementingAgency: "Army Education Corps",
      schemeCode: "AEC-EDU-2024",
      launchDate: "2020-04-01",
      tags: ["Education", "Scholarship", "Higher Studies", "Merit Based"],
    },
    {
      id: 2,
      title: "Ex-Servicemen Contributory Health Scheme (ECHS)",
      shortDescription: "Comprehensive healthcare coverage for ex-servicemen and dependents",
      description:
        "A comprehensive healthcare scheme providing cashless medical treatment to ex-servicemen and their eligible dependents through a network of empanelled hospitals and polyclinics.",
      category: "medical",
      eligibility: [
        "Ex-servicemen with 15+ years of qualifying service",
        "Disabled ex-servicemen irrespective of length of service",
        "Widows of ex-servicemen",
        "Dependent parents and children",
        "Valid discharge certificate required",
      ],
      benefits: [
        "Cashless treatment at empanelled hospitals",
        "Coverage up to ₹5 lakhs per year",
        "Specialist consultations and diagnostics",
        "Emergency medical services",
        "Medicines and surgical procedures covered",
        "Annual health check-ups",
      ],
      applicationDeadline: "2024-04-15",
      status: "Open",
      documentsRequired: [
        "Discharge certificate",
        "Medical history and records",
        "Family details and photographs",
        "Identity proof (Aadhaar/PAN)",
        "Bank account details",
        "Dependent relationship certificates",
      ],
      processingTime: "15-20 days",
      contactOfficer: "Maj. Dr. Rajesh Kumar",
      contactPhone: "+91-11-2671-YYYY",
      contactEmail: "echs.welfare@army.mil.in",
      applicationsReceived: 850,
      maxApplications: 1500,
      successRate: 92,
      lastUpdated: "2024-01-18",
      ministry: "Ministry of Defence",
      implementingAgency: "Ex-Servicemen Contributory Health Scheme",
      schemeCode: "ECHS-MED-2024",
      launchDate: "2003-04-01",
      tags: ["Healthcare", "Medical", "Cashless", "Family Coverage"],
    },
    {
      id: 3,
      title: "Armed Forces Housing Scheme",
      shortDescription: "Subsidized housing loans for military personnel",
      description:
        "Special housing loan scheme offering interest subsidies and flexible repayment terms for serving and retired military personnel to purchase or construct residential properties.",
      category: "housing",
      eligibility: [
        "Serving/retired military personnel",
        "Minimum 10 years of qualifying service",
        "First-time home buyers get priority",
        "Property value within prescribed limits",
        "Stable income source for loan repayment",
      ],
      benefits: [
        "Interest subsidy up to 2% on home loans",
        "Loan amount up to ₹50 lakhs",
        "Flexible repayment tenure up to 30 years",
        "Reduced processing fees",
        "Priority allocation in military housing projects",
        "No prepayment penalties",
      ],
      applicationDeadline: "2024-05-30",
      status: "Open",
      documentsRequired: [
        "Service record and NOC",
        "Income proof and salary certificates",
        "Property documents and approvals",
        "Bank statements (6 months)",
        "Identity and address proof",
        "Property valuation report",
      ],
      processingTime: "45-60 days",
      contactOfficer: "Col. Arun Singh",
      contactPhone: "+91-11-2671-ZZZZ",
      contactEmail: "housing.welfare@army.mil.in",
      applicationsReceived: 650,
      maxApplications: 1000,
      successRate: 78,
      lastUpdated: "2024-01-20",
      ministry: "Ministry of Defence",
      implementingAgency: "Armed Forces Housing Board",
      schemeCode: "AFHB-HSG-2024",
      launchDate: "2018-07-01",
      tags: ["Housing", "Loan", "Subsidy", "Property"],
    },
    {
      id: 4,
      title: "War Widow Pension Enhancement Scheme",
      shortDescription: "Enhanced pension benefits for war widows and family pensioners",
      description:
        "Special pension enhancement scheme providing additional financial support to war widows and family pensioners to ensure dignified living standards and comprehensive welfare coverage.",
      category: "financial",
      eligibility: [
        "Widows of personnel killed in action",
        "Family pensioners of disabled veterans",
        "Valid pension payment order",
        "Indian citizenship required",
        "Age and income criteria as applicable",
      ],
      benefits: [
        "Enhanced monthly pension up to ₹25,000",
        "Medical allowances and healthcare coverage",
        "Educational support for children",
        "One-time settlement grants",
        "Priority in government schemes",
        "Annual cost of living adjustments",
      ],
      applicationDeadline: "2024-06-15",
      status: "Open",
      documentsRequired: [
        "Original pension payment order",
        "Death certificate of spouse",
        "Bank account details",
        "Identity proof and photographs",
        "Income certificate",
        "Children's educational certificates",
      ],
      processingTime: "20-30 days",
      contactOfficer: "Mrs. Meera Nair",
      contactPhone: "+91-11-2671-AAAA",
      contactEmail: "pension.welfare@army.mil.in",
      applicationsReceived: 420,
      maxApplications: 800,
      successRate: 95,
      lastUpdated: "2024-01-22",
      ministry: "Ministry of Defence",
      implementingAgency: "Pension Disbursing Office",
      schemeCode: "PDO-PEN-2024",
      launchDate: "2019-08-15",
      tags: ["Pension", "War Widow", "Financial Aid", "Family Support"],
    },
    {
      id: 5,
      title: "Sainik School Admission Support",
      shortDescription: "Financial assistance and coaching for Sainik School admissions",
      description:
        "Comprehensive support program providing financial assistance, coaching, and guidance for children of military personnel seeking admission to prestigious Sainik Schools across India.",
      category: "education",
      eligibility: [
        "Children of serving military personnel",
        "Age group: 10-12 years for Class VI admission",
        "Merit cum means basis selection",
        "Medical fitness certificate required",
        "Domicile certificate of respective state",
      ],
      benefits: [
        "Free coaching classes for entrance exam",
        "Admission fee waiver up to ₹50,000",
        "Hostel fee assistance for first year",
        "Books and uniform allowance",
        "Transportation support for exam centers",
        "Counseling and career guidance",
      ],
      applicationDeadline: "2024-02-28",
      status: "Closed",
      documentsRequired: [
        "Service certificate of parent",
        "Birth certificate of child",
        "Academic records (Class V onwards)",
        "Medical fitness certificate",
        "Domicile certificate",
        "Passport size photographs",
      ],
      processingTime: "25-35 days",
      contactOfficer: "Maj. Suresh Kumar",
      contactPhone: "+91-11-2671-BBBB",
      contactEmail: "sainik.welfare@army.mil.in",
      applicationsReceived: 300,
      maxApplications: 500,
      successRate: 88,
      lastUpdated: "2024-01-10",
      ministry: "Ministry of Defence",
      implementingAgency: "Sainik Schools Society",
      schemeCode: "SSS-ADM-2024",
      launchDate: "2015-01-01",
      tags: ["Education", "Sainik School", "Coaching", "Admission Support"],
    },
    {
      id: 6,
      title: "Military Family Childcare Support",
      shortDescription: "Childcare assistance for military families during deployments",
      description:
        "Special childcare support scheme providing assistance to military families during operational deployments, ensuring proper care and development of children in the absence of serving parent.",
      category: "family",
      eligibility: [
        "Families of deployed military personnel",
        "Children aged 6 months to 12 years",
        "Deployment duration minimum 3 months",
        "Spouse unable to provide full-time care",
        "Valid deployment orders required",
      ],
      benefits: [
        "Subsidized daycare services",
        "Home-based childcare allowance",
        "Educational support and tutoring",
        "Emergency childcare services",
        "Psychological counseling for children",
        "Recreational activity support",
      ],
      applicationDeadline: "2024-07-31",
      status: "Open",
      documentsRequired: [
        "Deployment orders",
        "Children's birth certificates",
        "Spouse employment/health certificate",
        "Childcare provider details",
        "Bank account information",
        "Emergency contact details",
      ],
      processingTime: "10-15 days",
      contactOfficer: "Capt. Anjali Verma",
      contactPhone: "+91-11-2671-CCCC",
      contactEmail: "family.welfare@army.mil.in",
      applicationsReceived: 180,
      maxApplications: 400,
      successRate: 90,
      lastUpdated: "2024-01-25",
      ministry: "Ministry of Defence",
      implementingAgency: "Army Welfare Education Society",
      schemeCode: "AWES-FAM-2024",
      launchDate: "2021-03-01",
      tags: ["Family", "Childcare", "Deployment", "Support Services"],
    },
  ]

  const filteredSchemes = schemes.filter((scheme) => {
    const matchesCategory = selectedCategory === "all" || scheme.category === selectedCategory
    const matchesSearch =
      scheme.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scheme.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scheme.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  const getStatusColor = (status: "Open" | "Closed" | "Coming Soon"): string => {
    switch (status) {
      case "Open":
        return "bg-green-100 text-green-800 border-green-200"
      case "Closed":
        return "bg-red-100 text-red-800 border-red-200"
      case "Coming Soon":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
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
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">Welfare Schemes Portal</h1>
                <p className="text-sm text-gray-600">कल्याण योजना पोर्टल</p>
                <p className="text-xs text-gray-500 mt-1">
                  Comprehensive welfare schemes for Armed Forces personnel and families
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Badge className="bg-green-100 text-green-800 border border-green-200 px-3 py-1 text-sm">
                <CheckCircle className="w-4 h-4 mr-2" />
                {schemes.filter((s) => s.status === "Open").length} Active Schemes
              </Badge>
              <Badge className="bg-blue-100 text-blue-800 border border-blue-200 px-3 py-1 text-sm">
                <TrendingUp className="w-4 h-4 mr-2" />
                {schemes.reduce((acc, s) => acc + s.applicationsReceived, 0).toLocaleString()} Applications
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Custom Tab Navigation */}
        <div className="flex w-full mb-8 rounded-lg overflow-hidden">
          <button
            onClick={() => setActiveTab("browse")}
            className={`flex-1 py-4 px-6 flex items-center justify-center gap-2 text-lg font-medium transition-colors ${
              activeTab === "browse"
                ? "bg-orange-500 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50 border-y border-r border-gray-200"
            }`}
          >
            <Search className="w-5 h-5" />
            Browse Schemes
          </button>
          <button
            onClick={() => setActiveTab("eligibility")}
            className={`flex-1 py-4 px-6 flex items-center justify-center gap-2 text-lg font-medium transition-colors ${
              activeTab === "eligibility"
                ? "bg-orange-500 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50 border-y border-r border-gray-200"
            }`}
          >
            <CheckCircle className="w-5 h-5" />
            Check Eligibility
          </button>
          <button
            onClick={() => setActiveTab("track")}
            className={`flex-1 py-4 px-6 flex items-center justify-center gap-2 text-lg font-medium transition-colors ${
              activeTab === "track"
                ? "bg-orange-500 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50 border-y border-l border-gray-200"
            }`}
          >
            <FileText className="w-5 h-5" />
            Track Application
          </button>
        </div>

        {activeTab === "browse" && (
          <div className="space-y-8">
            {/* Search and Filter Section */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
                  <Input
                    placeholder="Search schemes by name, category, or keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-14 border-2 border-gray-200 focus:border-orange-500 text-lg rounded-xl"
                  />
                </div>
                <Button variant="outline" className="h-14 px-8 border-2 border-gray-200 rounded-xl">
                  <Filter className="w-5 h-5 mr-2" />
                  Advanced Filter
                </Button>
              </div>

              {/* Category Tabs */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {categories.map((category) => (
                  <motion.button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex flex-col items-center space-y-3 p-6 rounded-2xl font-medium transition-all border-2 ${
                      selectedCategory === category.id
                        ? "bg-gradient-to-br from-orange-500 to-green-600 text-white shadow-lg border-transparent"
                        : "bg-white text-gray-700 hover:bg-gray-50 border-gray-200 hover:border-gray-300"
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        selectedCategory === category.id ? "bg-white/20" : category.color
                      }`}
                    >
                      <category.icon
                        className={`w-6 h-6 ${selectedCategory === category.id ? "text-white" : "text-white"}`}
                      />
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-sm">{category.name}</div>
                      <div className="text-xs opacity-75">{category.count} schemes</div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Schemes Grid */}
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              <AnimatePresence>
                {filteredSchemes.map((scheme) => (
                  <motion.div
                    key={scheme.id}
                    variants={fadeInUp}
                    layout
                    whileHover={{ y: -8 }}
                    className="group cursor-pointer"
                    onClick={() => setSelectedScheme(scheme)}
                  >
                    <Card className="h-full border-0 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden bg-white">
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between mb-4">
                          <Badge className={`${getStatusColor(scheme.status)} font-semibold px-3 py-1 border`}>
                            {scheme.status}
                          </Badge>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">Success Rate</div>
                            <div className="text-lg font-bold text-green-600">{scheme.successRate}%</div>
                          </div>
                        </div>

                        <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors leading-tight">
                          {scheme.title}
                        </CardTitle>
                        <p className="text-gray-600 text-sm mt-2 line-clamp-2">{scheme.shortDescription}</p>
                      </CardHeader>

                      <CardContent className="space-y-6">
                        {/* Application Progress */}
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 font-medium">Applications Received</span>
                            <span className="font-bold text-gray-900">
                              {scheme.applicationsReceived.toLocaleString()}/{scheme.maxApplications.toLocaleString()}
                            </span>
                          </div>
                          <Progress
                            value={(scheme.applicationsReceived / scheme.maxApplications) * 100}
                            className="h-3 bg-gray-100"
                          />
                        </div>

                        {/* Key Info */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                            <div>
                              <div className="text-gray-500">Deadline</div>
                              <div className="font-semibold text-gray-900">
                                {new Date(scheme.applicationDeadline).toLocaleDateString("en-IN")}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2 text-gray-500" />
                            <div>
                              <div className="text-gray-500">Processing</div>
                              <div className="font-semibold text-gray-900">{scheme.processingTime}</div>
                            </div>
                          </div>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2">
                          {scheme.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs border-orange-200 text-orange-700">
                              {tag}
                            </Badge>
                          ))}
                          {scheme.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs border-gray-200 text-gray-500">
                              +{scheme.tags.length - 3} more
                            </Badge>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-3 pt-4">
                          <Button
                            size="sm"
                            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold"
                            disabled={scheme.status === "Closed"}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            {scheme.status === "Closed" ? "Closed" : "Apply Now"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-orange-500 text-orange-600 hover:bg-orange-50"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {filteredSchemes.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
                <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-16 h-16 text-gray-400" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">No schemes found</h3>
                <p className="text-gray-600 text-lg">Try adjusting your search or category filter</p>
              </motion.div>
            )}
          </div>
        )}

        {activeTab === "eligibility" && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
                <CheckCircle className="w-8 h-8 mr-3 text-green-600" />
                Eligibility Checker
              </CardTitle>
              <p className="text-gray-600 text-lg">Find schemes you're eligible for based on your profile</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Service Status</label>
                    <select className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-orange-500">
                      <option>Select your service status</option>
                      <option>Serving Personnel</option>
                      <option>Ex-Servicemen</option>
                      <option>Family Member/Dependent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Service Branch</label>
                    <select className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-orange-500">
                      <option>Select your service branch</option>
                      <option>Indian Army</option>
                      <option>Indian Navy</option>
                      <option>Indian Air Force</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Years of Service</label>
                    <input
                      type="number"
                      placeholder="Enter years of service"
                      className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-orange-500"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Annual Income</label>
                    <select className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-orange-500">
                      <option>Select income range</option>
                      <option>Below ₹5 lakhs</option>
                      <option>₹5-10 lakhs</option>
                      <option>₹10-15 lakhs</option>
                      <option>Above ₹15 lakhs</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category of Interest</label>
                    <select className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-orange-500">
                      <option>Select category</option>
                      <option>Education & Training</option>
                      <option>Medical & Health</option>
                      <option>Housing & Accommodation</option>
                      <option>Financial Assistance</option>
                      <option>Family Welfare</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">State/UT</label>
                    <select className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-orange-500">
                      <option>Select your state</option>
                      <option>Delhi</option>
                      <option>Maharashtra</option>
                      <option>Karnataka</option>
                      <option>Tamil Nadu</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
              </div>
              <Button className="w-full bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700 text-white font-semibold py-4 text-lg">
                <Search className="w-5 h-5 mr-2" />
                Find Eligible Schemes
              </Button>
            </CardContent>
          </Card>
        )}

        {activeTab === "track" && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
                <FileText className="w-8 h-8 mr-3 text-blue-600" />
                Track Application Status
              </CardTitle>
              <p className="text-gray-600 text-lg">Monitor the progress of your scheme applications</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-4">
                <Input
                  placeholder="Enter Application ID (e.g., AEC-EDU-2024-001234)"
                  className="flex-1 h-12 border-2 border-gray-200 focus:border-orange-500"
                />
                <Button className="bg-orange-500 hover:bg-orange-600 text-white px-8 h-12">
                  <Search className="w-5 h-5 mr-2" />
                  Track
                </Button>
              </div>

              <div className="bg-gray-50 rounded-xl p-8 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h4 className="font-semibold text-gray-900 mb-2 text-lg">Enter Application ID to Track</h4>
                <p className="text-gray-600">
                  Enter your application ID to view current status, processing timeline, and next steps.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Scheme Detail Modal */}
      <Dialog open={!!selectedScheme} onOpenChange={() => setSelectedScheme(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          {selectedScheme && <SchemeDetail scheme={selectedScheme} getStatusColor={getStatusColor} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface SchemeDetailProps {
  scheme: WelfareScheme
  getStatusColor: (status: "Open" | "Closed" | "Coming Soon") => string
}

const SchemeDetail = ({ scheme, getStatusColor }: SchemeDetailProps) => {
  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-4">
            <Badge className={getStatusColor(scheme.status)}>{scheme.status}</Badge>
            <Badge variant="outline" className="border-blue-200 text-blue-700">
              {scheme.schemeCode}
            </Badge>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">{scheme.title}</h2>
          <p className="text-gray-600 text-lg leading-relaxed">{scheme.description}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <CheckCircle className="w-6 h-6 mr-2 text-green-600" />
              Eligibility Criteria
            </h3>
            <ul className="space-y-3">
              {scheme.eligibility.map((criteria, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{criteria}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Star className="w-6 h-6 mr-2 text-yellow-600" />
              Benefits & Coverage
            </h3>
            <ul className="space-y-3">
              {scheme.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start">
                  <Star className="w-5 h-5 text-yellow-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <FileText className="w-6 h-6 mr-2 text-blue-600" />
              Required Documents
            </h3>
            <ul className="space-y-3">
              {scheme.documentsRequired.map((doc, index) => (
                <li key={index} className="flex items-start">
                  <FileText className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{doc}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-orange-50 to-green-50 rounded-xl p-6 border border-orange-200">
            <h3 className="font-bold text-gray-900 mb-4 text-lg">Quick Information</h3>
            <div className="space-y-4 text-sm">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                <div>
                  <div className="text-gray-500">Application Deadline</div>
                  <div className="font-semibold text-gray-900">
                    {new Date(scheme.applicationDeadline).toLocaleDateString("en-IN")}
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2 text-gray-500" />
                <div>
                  <div className="text-gray-500">Processing Time</div>
                  <div className="font-semibold text-gray-900">{scheme.processingTime}</div>
                </div>
              </div>
              <div className="flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-gray-500" />
                <div>
                  <div className="text-gray-500">Success Rate</div>
                  <div className="font-semibold text-green-600">{scheme.successRate}%</div>
                </div>
              </div>
              <div className="flex items-center">
                <Award className="w-4 h-4 mr-2 text-gray-500" />
                <div>
                  <div className="text-gray-500">Launched</div>
                  <div className="font-semibold text-gray-900">
                    {new Date(scheme.launchDate).toLocaleDateString("en-IN")}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="font-bold text-gray-900 mb-4 text-lg">Contact Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2 text-gray-500" />
                <div>
                  <div className="text-gray-500">Contact Officer</div>
                  <div className="font-semibold text-gray-900">{scheme.contactOfficer}</div>
                </div>
              </div>
              <div className="flex items-center">
                <Phone className="w-4 h-4 mr-2 text-gray-500" />
                <div>
                  <div className="text-gray-500">Phone</div>
                  <div className="font-semibold text-gray-900">{scheme.contactPhone}</div>
                </div>
              </div>
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                <div>
                  <div className="text-gray-500">Email</div>
                  <div className="font-semibold text-gray-900">{scheme.contactEmail}</div>
                </div>
              </div>
              <div className="flex items-center">
                <Building className="w-4 h-4 mr-2 text-gray-500" />
                <div>
                  <div className="text-gray-500">Implementing Agency</div>
                  <div className="font-semibold text-gray-900">{scheme.implementingAgency}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">Tags</h4>
            <div className="flex flex-wrap gap-2">
              {scheme.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="border-orange-200 text-orange-700">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex space-x-4 pt-6 border-t">
        <Button
          className="flex-1 bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700 text-white font-semibold py-3"
          disabled={scheme.status === "Closed"}
        >
          <FileText className="w-5 h-5 mr-2" />
          {scheme.status === "Closed" ? "Application Closed" : "Apply for Scheme"}
        </Button>
        <Button variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-50 px-8">
          <Download className="w-5 h-5 mr-2" />
          Download Guidelines
        </Button>
        <Button variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50 px-8">
          <Phone className="w-5 h-5 mr-2" />
          Contact Officer
        </Button>
      </div>
    </div>
  )
}

export default WelfareSchemes
