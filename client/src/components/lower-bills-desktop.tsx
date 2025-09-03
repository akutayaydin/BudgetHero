import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Scissors, ArrowRight, CheckCircle, TrendingDown } from "lucide-react";

export function LowerBillsDesktop() {
  return (
    <Card className="hidden md:block mb-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white overflow-hidden relative">
      <div className="absolute top-0 right-0 w-40 h-40 opacity-20">
        <Scissors className="w-full h-full transform rotate-12" />
      </div>
      
      <CardContent className="p-6 relative z-10">
        <div className="grid md:grid-cols-2 gap-6 items-center">
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Badge variant="secondary" className="bg-white/20 text-white border-none">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  90% SUCCESS RATE
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white border-none">
                  <TrendingDown className="w-4 h-4 mr-1" />
                  AVERAGE $240/YEAR SAVED
                </Badge>
              </div>
              
              <h3 className="text-2xl font-bold mb-2">
                Lower your bills
              </h3>
              <p className="text-green-50 text-lg">
                We have a 90% success rate lowering bills. Our experts negotiate with providers to get you the best rates.
              </p>
            </div>

            <Button 
              size="lg"
              className="bg-white text-green-600 hover:bg-gray-100 font-semibold"
            >
              Get Started - Free Analysis
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          <div className="space-y-3">
            <h4 className="text-lg font-semibold mb-3">Recent Success Stories:</h4>
            
            <div className="flex items-center justify-between bg-white/10 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">X</span>
                </div>
                <div>
                  <span className="font-medium">Xfinity Mobile</span>
                  <p className="text-green-100 text-sm">Internet + Mobile Bundle</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <span className="text-sm">$45/mo saved</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
                <p className="text-green-100 text-xs">Lowered successfully</p>
              </div>
            </div>

            <div className="flex items-center justify-between bg-white/10 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">C</span>
                </div>
                <div>
                  <span className="font-medium">Comcast (Xfinity)</span>
                  <p className="text-green-100 text-sm">Internet Service</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <span className="text-sm">$32/mo saved</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
                <p className="text-green-100 text-xs">Lowered successfully</p>
              </div>
            </div>

            <div className="flex items-center justify-between bg-white/10 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">A</span>
                </div>
                <div>
                  <span className="font-medium">AT&T Wireless</span>
                  <p className="text-green-100 text-sm">Family Plan</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <span className="text-sm">$28/mo saved</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
                <p className="text-green-100 text-xs">Lowered successfully</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}