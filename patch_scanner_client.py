import re

with open('src/app/shipping-scanner/[orderId]/scanner-client.tsx', 'r') as f:
    content = f.read()

# The injection string
reward_banner = """      {order.reward && (
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 p-4 rounded-xl mb-6 shadow-sm flex flex-col sm:flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-full">
              <Package className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-600/80 mb-1">הוראות למחסן (דירוג לקוח: {order.reward.customerClass} - ציון {order.reward.score})</p>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-6">
                <div className="text-lg font-bold">
                  <span className="text-muted-foreground ml-2">ערכת דוגמיות:</span>
                  {order.reward.sampleKit}
                  {order.reward.officialSample && <span className="text-purple-500 mr-2 text-sm bg-purple-500/10 px-2 py-0.5 rounded-full">כולל דוגמית רשמית</span>}
                </div>
                {order.reward.gift && (
                  <div className="text-lg font-bold">
                    <span className="text-muted-foreground ml-2">מתנה:</span>
                    <span className="text-pink-600">{order.reward.gift}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
"""

old_code = """      </div>

      <div className="bg-card p-4 rounded-xl shadow-sm border border-border/50 flex flex-col gap-4">"""

new_code = "      </div>\n\n" + reward_banner + "\n      <div className=\"bg-card p-4 rounded-xl shadow-sm border border-border/50 flex flex-col gap-4\">"

content = content.replace(old_code, new_code)

with open('src/app/shipping-scanner/[orderId]/scanner-client.tsx', 'w') as f:
    f.write(content)
