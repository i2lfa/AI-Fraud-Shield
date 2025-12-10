import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Landmark, 
  Shield, 
  FileText,
  Car,
  GraduationCap,
  HeartPulse,
  Home,
  Briefcase,
  Bell,
  User,
  LogOut,
  CheckCircle,
  Clock,
  ArrowLeft,
  CreditCard,
  Receipt,
  Settings,
} from "lucide-react";

export default function SmartGateDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950" dir="rtl">
      <header className="border-b border-blue-800/30 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Landmark className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-white">بوابة الخدمات الذكية</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button size="icon" variant="ghost" className="text-slate-400 hover:text-white">
              <Bell className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-2">
              <User className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-white">مستخدم تجريبي</span>
            </div>
            <Link href="/demo/smartgate">
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                <LogOut className="h-4 w-4 ml-2" />
                خروج
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">مرحباً بك في لوحة التحكم</h1>
          <p className="text-slate-400">أنجز معاملاتك الحكومية بسهولة وأمان</p>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-300">المعاملات النشطة</p>
                  <p className="text-2xl font-bold text-white">3</p>
                </div>
                <Clock className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-300">المعاملات المكتملة</p>
                  <p className="text-2xl font-bold text-white">12</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-purple-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-300">الفواتير المستحقة</p>
                  <p className="text-2xl font-bold text-white">2</p>
                </div>
                <Receipt className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 border-orange-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-300">التنبيهات</p>
                  <p className="text-2xl font-bold text-white">1</p>
                </div>
                <Bell className="h-8 w-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2">
            <h2 className="text-lg font-semibold text-white mb-4">الخدمات السريعة</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card className="bg-slate-800/50 border-slate-700/50 hover:border-blue-500/50 transition-all cursor-pointer group">
                <CardContent className="p-4 text-center">
                  <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-500/30 transition-colors">
                    <FileText className="h-6 w-6 text-blue-400" />
                  </div>
                  <p className="text-sm font-medium text-white">الوثائق</p>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800/50 border-slate-700/50 hover:border-green-500/50 transition-all cursor-pointer group">
                <CardContent className="p-4 text-center">
                  <div className="h-12 w-12 rounded-xl bg-green-500/20 flex items-center justify-center mx-auto mb-3 group-hover:bg-green-500/30 transition-colors">
                    <Car className="h-6 w-6 text-green-400" />
                  </div>
                  <p className="text-sm font-medium text-white">المركبات</p>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800/50 border-slate-700/50 hover:border-purple-500/50 transition-all cursor-pointer group">
                <CardContent className="p-4 text-center">
                  <div className="h-12 w-12 rounded-xl bg-purple-500/20 flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-500/30 transition-colors">
                    <GraduationCap className="h-6 w-6 text-purple-400" />
                  </div>
                  <p className="text-sm font-medium text-white">التعليم</p>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800/50 border-slate-700/50 hover:border-red-500/50 transition-all cursor-pointer group">
                <CardContent className="p-4 text-center">
                  <div className="h-12 w-12 rounded-xl bg-red-500/20 flex items-center justify-center mx-auto mb-3 group-hover:bg-red-500/30 transition-colors">
                    <HeartPulse className="h-6 w-6 text-red-400" />
                  </div>
                  <p className="text-sm font-medium text-white">الصحة</p>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800/50 border-slate-700/50 hover:border-orange-500/50 transition-all cursor-pointer group">
                <CardContent className="p-4 text-center">
                  <div className="h-12 w-12 rounded-xl bg-orange-500/20 flex items-center justify-center mx-auto mb-3 group-hover:bg-orange-500/30 transition-colors">
                    <Home className="h-6 w-6 text-orange-400" />
                  </div>
                  <p className="text-sm font-medium text-white">الإسكان</p>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800/50 border-slate-700/50 hover:border-teal-500/50 transition-all cursor-pointer group">
                <CardContent className="p-4 text-center">
                  <div className="h-12 w-12 rounded-xl bg-teal-500/20 flex items-center justify-center mx-auto mb-3 group-hover:bg-teal-500/30 transition-colors">
                    <Briefcase className="h-6 w-6 text-teal-400" />
                  </div>
                  <p className="text-sm font-medium text-white">الأعمال</p>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">المعاملات الأخيرة</h2>
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">تجديد الاستمارة</p>
                    <p className="text-xs text-slate-400">مكتمل - قبل 3 أيام</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">شهادة حسن سيرة</p>
                    <p className="text-xs text-slate-400">قيد المعالجة</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">تحديث العنوان</p>
                    <p className="text-xs text-slate-400">مكتمل - قبل أسبوع</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="bg-slate-800/30 border-blue-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white">حسابك محمي بـ AI Fraud Shield</h3>
                <p className="text-sm text-slate-400">
                  يتم مراقبة جميع عمليات الدخول والمعاملات لحماية حسابك من الاحتيال
                </p>
              </div>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <CheckCircle className="h-3 w-3 ml-1" />
                نشط
              </Badge>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Link href="/demo/smartgate">
            <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
              <ArrowLeft className="h-4 w-4 ml-2" />
              العودة للصفحة الرئيسية
            </Button>
          </Link>
        </div>
      </main>

      <footer className="border-t border-slate-800 py-6 mt-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-slate-500">
            © 2024 بوابة الخدمات الذكية - موقع تجريبي
            <span className="text-blue-400 mr-2">| محمي بواسطة AI Fraud Shield</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
