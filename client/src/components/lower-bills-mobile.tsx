import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scissors, CheckCircle } from "lucide-react";

export function LowerBillsMobile() {
  return (
    <Card className="block md:hidden mb-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white overflow-hidden relative">
      <div className="absolute top-0 right-0 w-20 h-20 opacity-20">
        <Scissors className="w-full h-full transform rotate-12" />
      </div>
      
      <CardContent className="p-4 relative z-10">
        <div className="space-y-3">
          <div>
            <Badge variant="secondary" className="bg-white/20 text-white border-none text-xs mb-2">
              <CheckCircle className="w-3 h-3 mr-1" />
              90% SUCCESS RATE
            </Badge>
            
            <h3 className="text-lg font-bold mb-1">
              Lower your bills
            </h3>
            <p className="text-green-50 text-sm">
              We have a 90% success rate lowering bills.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between bg-white/10 rounded-lg p-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">X</span>
                </div>
                <span className="font-medium text-sm">Xfinity Mobile</span>
              </div>
              <span className="text-xs bg-white/20 px-2 py-1 rounded">Lower</span>
            </div>

            <div className="flex items-center justify-between bg-white/10 rounded-lg p-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">C</span>
                </div>
                <span className="font-medium text-sm">Comcast</span>
              </div>
              <span className="text-xs bg-white/20 px-2 py-1 rounded">Lower</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}