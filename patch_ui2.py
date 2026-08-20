import re

with open('src/app/shipping-scanner/[orderId]/scanner-client.tsx', 'r') as f:
    content = f.read()

old_banner = """      {order.reward && (
        <div className="p-2 mb-6 flex flex-col sm:flex-row items-center gap-6 justify-between">
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-purple-500/30 shrink-0">
              <span className="text-4xl font-black">{order.reward.score}</span>
              <span className="text-xs font-medium opacity-80 uppercase tracking-widest">ציון לקוח</span>
            </div>
            
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-bold text-foreground">
                  הוראות למחסן
                </h3>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
                {order.reward.officialSample && (
                  <div className="flex items-center gap-2 bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/20">
                    <Package className="w-5 h-5 text-purple-600" />
                    <span className="font-semibold text-purple-700">לצרף דוגמית רשמית</span>
                  </div>
                )}
                
                {order.reward.gift && (
                  <div className="flex items-center gap-2 bg-pink-500/10 px-3 py-1.5 rounded-lg border border-pink-500/20">
                    <span className="text-xl">🎁</span>
                    <span className="font-bold text-pink-700">מתנה: {order.reward.gift}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}"""

new_banner = """      {order.reward && (
        <div className="p-2 mb-6 flex flex-col sm:flex-row items-center gap-6 justify-between w-full">
            <div className="flex flex-col gap-3 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-bold text-foreground">
                  הוראות למחסן
                </h3>
              </div>
              
              <div className="flex flex-wrap sm:flex-row gap-3 sm:gap-6">
                {order.reward.officialSample && (
                  <div className="flex items-center gap-2 bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/20">
                    <Package className="w-5 h-5 text-purple-600" />
                    <span className="font-semibold text-purple-700">לצרף דוגמית רשמית</span>
                  </div>
                )}
                
                {order.reward.gift && (
                  <div className="flex items-center gap-2 bg-pink-500/10 px-3 py-1.5 rounded-lg border border-pink-500/20">
                    <span className="text-xl">🎁</span>
                    <span className="font-bold text-pink-700">מתנה: {order.reward.gift}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-purple-500/30 shrink-0">
              <span className="text-4xl font-black">{order.reward.score}</span>
              <span className="text-xs font-medium opacity-80 uppercase tracking-widest">ציון לקוח</span>
            </div>
        </div>
      )}"""

content = content.replace(old_banner, new_banner)

with open('src/app/shipping-scanner/[orderId]/scanner-client.tsx', 'w') as f:
    f.write(content)
