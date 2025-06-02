"use client"

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, 
  Users, 
  Heart, 
  GraduationCap, 
  Home, 
  Shield, 
  Stethoscope,
  Calendar,
  FileText,
  ChevronRight,
  HomeIcon
} from 'lucide-react'

const WelfareSchemes = () => {
  const [selectedScheme, setSelectedScheme] = useState(null)

  const welfareSchemes = [
    {
      id: 1,
      title: "Army Group Insurance Scheme (AGIS)",
      category: "Insurance",
      icon: Shield,
      excerpt: "Comprehensive life insurance coverage for Army personnel and their families.",
      eligibility: "All Army personnel",
      benefits: ["Life insurance coverage up to ₹75 lakhs", "Family pension benefits", "Accidental death coverage"],
      applicationProcess: "Apply through unit administrative office or online portal",
      documents: ["Service certificate", "Medical fitness certificate", "Family details"],
      contactInfo: "Contact: Army Insurance Directorate, New Delhi",
      fullDescription: `The Army Group Insurance Scheme (AGIS) is a comprehensive life insurance scheme designed specifically for Army personnel. This scheme provides financial security to the families of Army personnel in case of their unfortunate demise during service. The scheme covers natural death, accidental death, and death due to war-like operations.

Key Features:
- Automatic coverage for all Army personnel
- Premium paid by the government
- No medical examination required
- Coverage continues even after retirement under certain conditions
- Additional benefits for disability due to military service

The scheme has been instrumental in providing financial security to thousands of Army families across the country.`
    },
    {
      id: 2,
      title: "Canteen Stores Department (CSD)",
      category: "Shopping Benefits",
      icon: Home,
      excerpt: "Subsidized goods and services for defense personnel and their families.",
      eligibility: "Defense personnel, veterans, and dependents",
      benefits: ["Subsidized consumer goods", "Quality products at reduced rates", "Wide range of items"],
      applicationProcess: "Obtain CSD card from unit or nearest CSD depot",
      documents: ["Identity card", "Service certificate", "Dependent certificate (if applicable)"],
      contactInfo: "Contact: Nearest CSD Depot",
      fullDescription: `The Canteen Stores Department (CSD) is a unique retail chain that provides quality consumer goods to defense personnel, ex-servicemen, and their dependents at highly subsidized rates. Established to ensure that defense families have access to essential items at affordable prices.

Services Include:
- Consumer durables and electronics
- Clothing and textiles
- Food items and groceries
- Automotive accessories
- Sports and recreation equipment

The CSD operates through a network of depot stores, unit run canteens, and mobile canteens to ensure accessibility even in remote postings.`
    },
    {
      id: 3,
      title: "Ex-Servicemen Contributory Health Scheme (ECHS)",
      category: "Healthcare",
      icon: Stethoscope,
      excerpt: "Comprehensive healthcare facilities for ex-servicemen and their dependents.",
      eligibility: "Ex-servicemen and their dependents",
      benefits: ["Free medical treatment", "Specialist consultations", "Emergency care"],
      applicationProcess: "Register at nearest ECHS polyclinic with required documents",
      documents: ["Discharge certificate", "PPO", "Identity card", "Medical records"],
      contactInfo: "Contact: ECHS Headquarters, New Delhi",
      fullDescription: `The Ex-Servicemen Contributory Health Scheme (ECHS) is a comprehensive healthcare scheme for ex-servicemen and their dependents. The scheme aims to provide quality healthcare to veterans who have served the nation with honor.

Coverage Includes:
- Outpatient treatment at ECHS polyclinics
- Inpatient treatment at empanelled hospitals
- Specialized treatments and surgeries
- Diagnostic services and pathology
- Medicines and medical equipment
- Emergency medical care

The scheme operates through a network of polyclinics and empanelled hospitals across the country, ensuring healthcare accessibility for veterans wherever they settle post-retirement.`
    },
    {
      id: 4,
      title: "Armed Forces Flag Day Fund (AFFDF)",
      category: "Welfare Fund",
      icon: Heart,
      excerpt: "Financial assistance for welfare of armed forces personnel and their families.",
      eligibility: "Serving and retired armed forces personnel in need",
      benefits: ["Emergency financial assistance", "Educational grants", "Medical aid"],
      applicationProcess: "Apply through respective service headquarters or welfare organizations",
      documents: ["Application form", "Income certificate", "Medical certificates (if applicable)"],
      contactInfo: "Contact: Respective Service Headquarters",
      fullDescription: `The Armed Forces Flag Day Fund (AFFDF) is a welfare fund created to provide financial assistance to armed forces personnel and their families in times of need. The fund is sustained through voluntary contributions from the public and various fundraising activities.

Areas of Assistance:
- Medical treatment for serious ailments
- Educational support for children
- Rehabilitation of disabled soldiers
- Support for widows and families of martyrs
- Livelihood support programs
- Emergency financial assistance

The fund has been instrumental in providing timely help to thousands of military families during their hour of need.`
    },
    {
      id: 5,
      title: "Army Wives Welfare Association (AWWA)",
      category: "Family Welfare",
      icon: Users,
      excerpt: "Welfare and empowerment programs for Army wives and families.",
      eligibility: "Wives of Army personnel",
      benefits: ["Skill development programs", "Educational support", "Social networking"],
      applicationProcess: "Join through local AWWA unit or station",
      documents: ["Spouse identity proof", "Unit posting details"],
      contactInfo: "Contact: Local AWWA Unit",
      fullDescription: `The Army Wives Welfare Association (AWWA) is a voluntary organization that works for the welfare and empowerment of Army wives and their families. The association provides a platform for Army wives to support each other and develop various skills.

Key Activities:
- Vocational training and skill development
- Educational support and scholarships
- Health awareness programs
- Cultural and social activities
- Income generation projects
- Support during emergencies and crises

AWWA operates at various levels from unit to national level, ensuring comprehensive support to Army families across all stations.`
    },
    {
      id: 6,
      title: "Armed Forces Preparatory School (AFPS)",
      category: "Education",
      icon: GraduationCap,
      excerpt: "Educational support for children of armed forces personnel.",
      eligibility: "Children of armed forces personnel",
      benefits: ["Quality education", "Boarding facilities", "Career guidance"],
      applicationProcess: "Apply through online application or school directly",
      documents: ["Birth certificate", "Parent's service record", "Academic transcripts"],
      contactInfo: "Contact: AFPS Admission Office",
      fullDescription: `The Armed Forces Preparatory School (AFPS) system provides quality education to children of armed forces personnel. These schools are designed to address the unique challenges faced by military families due to frequent transfers and postings.

Educational Features:
- CBSE curriculum with high academic standards
- Boarding facilities for children of serving personnel
- Extra-curricular activities and sports
- Career counseling and guidance
- Special coaching for competitive exams
- Scholarships for meritorious students

The schools maintain high standards of discipline and character building, preparing students for future challenges while providing them with excellent academic foundation.`
    }
  ]

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

  if (selectedScheme) {
    const scheme = welfareSchemes.find(s => s.id === selectedScheme)
    return (
      <div className="min-h-screen bg-gray-50">
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
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => setSelectedScheme(null)}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Schemes</span>
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <Badge variant="secondary">{scheme.category}</Badge>
            </div>
          </div>
        </div>

        {/* Scheme Detail */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Title Section */}
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-green-600 rounded-full flex items-center justify-center">
                  <scheme.icon className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-4xl font-bold text-gray-900">{scheme.title}</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">{scheme.excerpt}</p>
            </div>

            {/* Main Content */}
            <div className="grid md:grid-cols-3 gap-8">
              {/* Main Description */}
              <div className="md:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="w-5 h-5" />
                      <span>Scheme Overview</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none">
                      {scheme.fullDescription.split('\n\n').map((paragraph, index) => (
                        <p key={index} className="text-gray-700 leading-relaxed mb-4">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Key Benefits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {scheme.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <ChevronRight className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                          <span className="text-gray-700">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Eligibility</h4>
                      <p className="text-gray-600 text-sm">{scheme.eligibility}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Required Documents</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {scheme.documents.map((doc, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <div className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                            <span>{doc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Application Process</h4>
                      <p className="text-gray-600 text-sm">{scheme.applicationProcess}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Contact Information</h4>
                      <p className="text-gray-600 text-sm">{scheme.contactInfo}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-orange-500 to-green-600 text-white">
                  <CardContent className="p-6">
                    <h4 className="font-bold mb-2">Need Help?</h4>
                    <p className="text-sm opacity-90 mb-4">
                      Contact your unit welfare officer or nearest service center for assistance with applications.
                    </p>
                    <Button variant="secondary" size="sm" className="w-full">
                      Contact Support
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 via-white to-green-600 h-1"></div>

      {/* Back to Home Button */}
      <div className="fixed top-4 left-4 z-50">
        <Button
          onClick={() => (window.location.href = "/")}
          className="bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700 text-white shadow-lg rounded-full w-12 h-12 p-0"
        >
          <HomeIcon className="w-5 h-5" />
        </Button>
      </div>

      <div className="bg-gradient-to-r from-orange-600 to-green-600 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <h1 className="text-4xl md:text-5xl font-bold">Military Welfare Schemes</h1>
              <p className="text-xl opacity-90 max-w-3xl mx-auto">
                Comprehensive welfare schemes designed to support our brave military personnel and their families
              </p>
              <p className="text-lg opacity-80">सैन्य कल्याण योजनाएं</p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Schemes Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {welfareSchemes.map((scheme, index) => (
            <motion.div key={scheme.id} variants={fadeInUp}>
              <Card 
                className="h-full cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-0 shadow-md"
                onClick={() => setSelectedScheme(scheme.id)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-green-600 rounded-full flex items-center justify-center">
                      <scheme.icon className="w-6 h-6 text-white" />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {scheme.category}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900 line-clamp-2">
                    {scheme.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600 line-clamp-3">{scheme.excerpt}</p>
                  
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-semibold text-gray-900">Eligibility: </span>
                      <span className="text-gray-600">{scheme.eligibility}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button variant="outline" className="w-full group">
                      Learn More
                      <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-3xl font-bold">Need More Information?</h2>
            <p className="text-xl text-gray-300">
              Contact your unit welfare officer or visit the nearest military welfare center for personalized assistance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-orange-600 hover:bg-orange-700">
                Contact Welfare Officer
              </Button>
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-gray-900">
                Download Brochure
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default WelfareSchemes