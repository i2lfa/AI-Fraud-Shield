import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Shield, 
  Clock, 
  Users, 
  Building2,
  ArrowRight,
  CheckCircle,
  Landmark,
  Car,
  GraduationCap,
  HeartPulse,
  Home,
  Briefcase,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";

export default function SmartGateLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950">
      <header className="border-b border-blue-800/30 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Landmark className="h-7 w-7 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-white">SmartGate</span>
              <p className="text-xs text-blue-400">Smart Services Portal</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#services" className="text-slate-300 hover:text-white transition-colors">Services</a>
            <a href="#about" className="text-slate-300 hover:text-white transition-colors">About</a>
            <a href="#contact" className="text-slate-300 hover:text-white transition-colors">Contact</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/demo/smartgate/login">
              <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700" data-testid="button-smartgate-login">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="container mx-auto px-4 py-20 text-center">
        <Badge className="mb-6 bg-blue-500/20 text-blue-400 border-blue-500/30">
          Unified Government Portal
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
          Your Government Services
          <span className="block bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            At Your Fingertips
          </span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
          Complete your government transactions easily and securely from one place. 
          Over 200 electronic services available 24/7.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/demo/smartgate/login">
            <Button size="lg" className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-lg px-8">
              Get Started
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 text-lg px-8">
            Browse Services
          </Button>
        </div>
        
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400">200+</div>
            <div className="text-slate-400 text-sm">Electronic Services</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400">5M+</div>
            <div className="text-slate-400 text-sm">Registered Users</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400">50M+</div>
            <div className="text-slate-400 text-sm">Completed Transactions</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400">24/7</div>
            <div className="text-slate-400 text-sm">Service Availability</div>
          </div>
        </div>
      </section>

      <section id="services" className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-4">Electronic Services</h2>
        <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
          All government services in one place
        </p>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-slate-800/50 border-slate-700/50 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer">
            <CardHeader>
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center mb-4">
                <FileText className="h-7 w-7 text-blue-400" />
              </div>
              <CardTitle className="text-white">Official Documents</CardTitle>
              <CardDescription className="text-slate-400">
                Issue and renew official documents and certificates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-slate-500 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-400" />
                  Birth Certificate
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-400" />
                  Good Conduct Certificate
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-400" />
                  Document Authentication
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700/50 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer">
            <CardHeader>
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center mb-4">
                <Car className="h-7 w-7 text-green-400" />
              </div>
              <CardTitle className="text-white">Vehicle Services</CardTitle>
              <CardDescription className="text-slate-400">
                Vehicle registration and ownership transfer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-slate-500 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  Registration Renewal
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  Ownership Transfer
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  Driver's License
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700/50 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer">
            <CardHeader>
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center mb-4">
                <GraduationCap className="h-7 w-7 text-purple-400" />
              </div>
              <CardTitle className="text-white">Educational Services</CardTitle>
              <CardDescription className="text-slate-400">
                Certificates, equivalencies and education services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-slate-500 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-400" />
                  Certificate Equivalency
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-400" />
                  Admission Confirmation
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-400" />
                  Academic Record
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700/50 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer">
            <CardHeader>
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-red-500/20 to-red-600/20 flex items-center justify-center mb-4">
                <HeartPulse className="h-7 w-7 text-red-400" />
              </div>
              <CardTitle className="text-white">Health Services</CardTitle>
              <CardDescription className="text-slate-400">
                Medical records and health insurance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-slate-500 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-red-400" />
                  Health Records
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-red-400" />
                  Hospital Appointments
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-red-400" />
                  Health Insurance
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700/50 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer">
            <CardHeader>
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/20 flex items-center justify-center mb-4">
                <Home className="h-7 w-7 text-orange-400" />
              </div>
              <CardTitle className="text-white">Housing Services</CardTitle>
              <CardDescription className="text-slate-400">
                Housing support requests and real estate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-slate-500 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-orange-400" />
                  Housing Support
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-orange-400" />
                  Property Transfer
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-orange-400" />
                  Building Permits
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700/50 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer">
            <CardHeader>
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-teal-500/20 to-teal-600/20 flex items-center justify-center mb-4">
                <Briefcase className="h-7 w-7 text-teal-400" />
              </div>
              <CardTitle className="text-white">Business Services</CardTitle>
              <CardDescription className="text-slate-400">
                Company licenses and commercial registration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-slate-500 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-teal-400" />
                  Commercial Registration
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-teal-400" />
                  Municipal Licenses
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-teal-400" />
                  Work Permits
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="about" className="bg-slate-800/30 py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-blue-500/20 text-blue-400 border-blue-500/30">
                Advanced Security
              </Badge>
              <h2 className="text-3xl font-bold text-white mb-6">
                Your Data Security is Our Priority
              </h2>
              <p className="text-slate-400 mb-8">
                We use the latest AI technologies to protect your accounts from hacking and unauthorized access. 
                An advanced system that monitors login attempts and detects any suspicious activity.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">Smart Fraud Detection</h4>
                    <p className="text-sm text-slate-400">Real-time behavioral analysis</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">24/7 Monitoring</h4>
                    <p className="text-sm text-slate-400">Continuous protection for your account</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">Multi-Factor Authentication</h4>
                    <p className="text-sm text-slate-400">Additional layers of protection</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-3xl blur-3xl"></div>
              <Card className="relative bg-slate-800/80 border-blue-500/30">
                <CardContent className="p-8 text-center">
                  <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-6">
                    <Shield className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">AI Fraud Shield</h3>
                  <p className="text-blue-400 mb-4">Our Security Partner</p>
                  <p className="text-slate-400 text-sm">
                    SmartGate relies on AI Fraud Shield platform 
                    to provide the highest levels of security for its users
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-12">Contact Us</h2>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <Card className="bg-slate-800/50 border-slate-700/50 text-center p-6">
            <Phone className="h-10 w-10 text-blue-400 mx-auto mb-4" />
            <h3 className="font-semibold text-white mb-2">Phone Support</h3>
            <p className="text-slate-400">1-800-SMART-GATE</p>
            <p className="text-xs text-slate-500 mt-2">Available 24/7</p>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700/50 text-center p-6">
            <Mail className="h-10 w-10 text-blue-400 mx-auto mb-4" />
            <h3 className="font-semibold text-white mb-2">Email</h3>
            <p className="text-slate-400">support@smartgate.demo</p>
            <p className="text-xs text-slate-500 mt-2">Response within 24 hours</p>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700/50 text-center p-6">
            <MapPin className="h-10 w-10 text-blue-400 mx-auto mb-4" />
            <h3 className="font-semibold text-white mb-2">Address</h3>
            <p className="text-slate-400">Digital City</p>
            <p className="text-xs text-slate-500 mt-2">E-Services Building</p>
          </Card>
        </div>
      </section>

      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Sign Up Now and Complete Your Transactions Easily
          </h2>
          <p className="text-blue-100 mb-8 max-w-xl mx-auto">
            Join millions of users and benefit from electronic services
          </p>
          <Link href="/demo/smartgate/login">
            <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8">
              Sign In Now
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="bg-slate-900 border-t border-slate-800 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Landmark className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">SmartGate</span>
            </div>
            <p className="text-slate-500 text-sm text-center">
              2024 SmartGate - Demo Website Only
              <span className="text-blue-400 ml-2">| Protected by AI Fraud Shield</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
