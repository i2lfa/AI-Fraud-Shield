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
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950" dir="rtl">
      <header className="border-b border-blue-800/30 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Landmark className="h-7 w-7 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-white">بوابة الخدمات الذكية</span>
              <p className="text-xs text-blue-400">SmartGate</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#services" className="text-slate-300 hover:text-white transition-colors">الخدمات</a>
            <a href="#about" className="text-slate-300 hover:text-white transition-colors">عن البوابة</a>
            <a href="#contact" className="text-slate-300 hover:text-white transition-colors">تواصل معنا</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/demo/smartgate/login">
              <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700" data-testid="button-smartgate-login">
                تسجيل الدخول
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="container mx-auto px-4 py-20 text-center">
        <Badge className="mb-6 bg-blue-500/20 text-blue-400 border-blue-500/30">
          البوابة الإلكترونية الموحدة
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
          خدماتك الحكومية
          <span className="block bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            بين يديك
          </span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
          أنجز معاملاتك الحكومية بسهولة وأمان من مكان واحد. 
          أكثر من 200 خدمة إلكترونية متاحة على مدار الساعة.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/demo/smartgate/login">
            <Button size="lg" className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-lg px-8">
              <ArrowRight className="h-5 w-5 ml-2" />
              ابدأ الآن
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 text-lg px-8">
            استعراض الخدمات
          </Button>
        </div>
        
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400">200+</div>
            <div className="text-slate-400 text-sm">خدمة إلكترونية</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400">5M+</div>
            <div className="text-slate-400 text-sm">مستخدم مسجل</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400">50M+</div>
            <div className="text-slate-400 text-sm">معاملة منجزة</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400">24/7</div>
            <div className="text-slate-400 text-sm">خدمة متواصلة</div>
          </div>
        </div>
      </section>

      <section id="services" className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-4">الخدمات الإلكترونية</h2>
        <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
          جميع الخدمات الحكومية في مكان واحد
        </p>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-slate-800/50 border-slate-700/50 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer">
            <CardHeader>
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center mb-4">
                <FileText className="h-7 w-7 text-blue-400" />
              </div>
              <CardTitle className="text-white">الوثائق الرسمية</CardTitle>
              <CardDescription className="text-slate-400">
                إصدار وتجديد الوثائق والشهادات الرسمية
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-slate-500 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-400" />
                  شهادة الميلاد
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-400" />
                  شهادة حسن السيرة
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-400" />
                  تصديق الوثائق
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700/50 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer">
            <CardHeader>
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center mb-4">
                <Car className="h-7 w-7 text-green-400" />
              </div>
              <CardTitle className="text-white">خدمات المركبات</CardTitle>
              <CardDescription className="text-slate-400">
                تسجيل ونقل ملكية المركبات والرخص
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-slate-500 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  تجديد الاستمارة
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  نقل الملكية
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  رخصة القيادة
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700/50 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer">
            <CardHeader>
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center mb-4">
                <GraduationCap className="h-7 w-7 text-purple-400" />
              </div>
              <CardTitle className="text-white">الخدمات التعليمية</CardTitle>
              <CardDescription className="text-slate-400">
                شهادات ومعادلات وخدمات التعليم
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-slate-500 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-400" />
                  معادلة الشهادات
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-400" />
                  إثبات القبول
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-400" />
                  السجل الأكاديمي
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700/50 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer">
            <CardHeader>
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-red-500/20 to-red-600/20 flex items-center justify-center mb-4">
                <HeartPulse className="h-7 w-7 text-red-400" />
              </div>
              <CardTitle className="text-white">الخدمات الصحية</CardTitle>
              <CardDescription className="text-slate-400">
                السجلات الطبية والتأمين الصحي
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-slate-500 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-red-400" />
                  الملف الصحي
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-red-400" />
                  مواعيد المستشفيات
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-red-400" />
                  التأمين الصحي
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700/50 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer">
            <CardHeader>
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/20 flex items-center justify-center mb-4">
                <Home className="h-7 w-7 text-orange-400" />
              </div>
              <CardTitle className="text-white">خدمات الإسكان</CardTitle>
              <CardDescription className="text-slate-400">
                طلبات الدعم السكني والعقارات
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-slate-500 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-orange-400" />
                  طلب دعم سكني
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-orange-400" />
                  نقل ملكية عقار
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-orange-400" />
                  رخص البناء
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700/50 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer">
            <CardHeader>
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-teal-500/20 to-teal-600/20 flex items-center justify-center mb-4">
                <Briefcase className="h-7 w-7 text-teal-400" />
              </div>
              <CardTitle className="text-white">خدمات الأعمال</CardTitle>
              <CardDescription className="text-slate-400">
                تراخيص الشركات والسجل التجاري
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-slate-500 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-teal-400" />
                  السجل التجاري
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-teal-400" />
                  تراخيص البلدية
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-teal-400" />
                  تصاريح العمل
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
                أمان متقدم
              </Badge>
              <h2 className="text-3xl font-bold text-white mb-6">
                حماية بياناتك أولويتنا
              </h2>
              <p className="text-slate-400 mb-8">
                نستخدم أحدث تقنيات الذكاء الاصطناعي لحماية حساباتك من الاختراق والوصول غير المصرح. 
                نظام متطور يراقب محاولات الدخول ويكتشف أي نشاط مشبوه.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">كشف الاحتيال الذكي</h4>
                    <p className="text-sm text-slate-400">تحليل سلوكي في الوقت الفعلي</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">مراقبة على مدار الساعة</h4>
                    <p className="text-sm text-slate-400">حماية مستمرة لحسابك</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">التحقق متعدد العوامل</h4>
                    <p className="text-sm text-slate-400">طبقات حماية إضافية</p>
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
                  <p className="text-blue-400 mb-4">شريكنا في الحماية</p>
                  <p className="text-slate-400 text-sm">
                    تعتمد بوابة الخدمات الذكية على منصة AI Fraud Shield 
                    لتوفير أعلى مستويات الأمان لمستخدميها
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-12">تواصل معنا</h2>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <Card className="bg-slate-800/50 border-slate-700/50 text-center p-6">
            <Phone className="h-10 w-10 text-blue-400 mx-auto mb-4" />
            <h3 className="font-semibold text-white mb-2">الدعم الهاتفي</h3>
            <p className="text-slate-400">920-XXX-XXXX</p>
            <p className="text-xs text-slate-500 mt-2">متاح 24/7</p>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700/50 text-center p-6">
            <Mail className="h-10 w-10 text-blue-400 mx-auto mb-4" />
            <h3 className="font-semibold text-white mb-2">البريد الإلكتروني</h3>
            <p className="text-slate-400">support@smartgate.demo</p>
            <p className="text-xs text-slate-500 mt-2">رد خلال 24 ساعة</p>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700/50 text-center p-6">
            <MapPin className="h-10 w-10 text-blue-400 mx-auto mb-4" />
            <h3 className="font-semibold text-white mb-2">العنوان</h3>
            <p className="text-slate-400">المدينة الرقمية</p>
            <p className="text-xs text-slate-500 mt-2">مبنى الخدمات الإلكترونية</p>
          </Card>
        </div>
      </section>

      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            سجّل الآن وأنجز معاملاتك بسهولة
          </h2>
          <p className="text-blue-100 mb-8 max-w-xl mx-auto">
            انضم لملايين المستخدمين واستفد من الخدمات الإلكترونية
          </p>
          <Link href="/demo/smartgate/login">
            <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8">
              <ArrowRight className="h-5 w-5 ml-2" />
              سجّل الدخول الآن
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
              <span className="text-lg font-bold text-white">بوابة الخدمات الذكية</span>
            </div>
            <p className="text-slate-500 text-sm text-center">
              © 2024 SmartGate - موقع تجريبي للعرض فقط
              <span className="text-blue-400 mr-2">| محمي بواسطة AI Fraud Shield</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
