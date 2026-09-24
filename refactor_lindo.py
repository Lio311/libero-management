import re

with open("src/app/lindo-products/lindo-client.tsx", "r") as f:
    content = f.read()

# Replace imports
content = re.sub(r'import \{ Card, CardContent, CardHeader, CardTitle \} from "@/components/ui/card";\n', '', content)

# Replace the main container
content = content.replace(
    '<div className="p-4 md:p-8 space-y-6 bg-gray-50/50 min-h-screen" dir="rtl">',
    '<div className="p-4 md:p-8 min-h-screen" dir="rtl">\n      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">'
)

# Header
old_header = """      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">מוצרי לינדו (סיטונאי)</h2>
          <p className="text-muted-foreground mt-1 text-sm">המוצרים שנסרקו מהאתר הסיטונאי ונשלחו במייל</p>
        </div>
      </div>"""

new_header = """      {/* Header Bento */}
      <div className="lg:col-span-12 glass-panel rounded-3xl p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">מוצרי לינדו (סיטונאי)</h2>
            <p className="text-gray-200 mt-1 text-sm">המוצרים שנסרקו מהאתר הסיטונאי ונשלחו במייל</p>
          </div>
        </div>
      </div>"""

content = content.replace(old_header, new_header)

# Stats Cards
old_stats = """      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-white border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-gray-500">סה&quot;כ מוצרים שנסרקו</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
            <div className="text-xl md:text-2xl font-bold text-gray-900">{products.length}</div>
          </CardContent>
        </Card>
      </div>"""

new_stats = """      {/* Stats Bento */}
      <div className="lg:col-span-12 glass-panel rounded-3xl p-6">
        <div className="flex flex-row items-center justify-between pb-2">
          <h3 className="text-xs md:text-sm font-medium text-gray-200">סה&quot;כ מוצרים שנסרקו</h3>
          <Package className="h-4 w-4 text-white" />
        </div>
        <div className="text-xl md:text-2xl font-bold text-white">{products.length}</div>
      </div>"""

content = content.replace(old_stats, new_stats)

# Table Card (part 1)
old_table_1 = """      {/* Table Card */}
      <Card className="bg-white border-none shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="חיפוש מוצר או מותג..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-9 pl-3 py-2 border border-gray-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50/50"
                dir="rtl"
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">"""

new_table_1 = """      {/* Table Bento */}
      <div className="lg:col-span-12 glass-panel rounded-3xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <input
              type="text"
              placeholder="חיפוש מוצר או מותג..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-3 py-2 border border-white/20 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent bg-white/10 text-white placeholder:text-gray-300"
              dir="rtl"
            />
          </div>
        </div>
        
        <div>"""

content = content.replace(old_table_1, new_table_1)

# Table styles
content = content.replace('className="w-full text-sm text-right text-gray-600"', 'className="w-full text-sm text-right text-white"')
content = content.replace('className="text-xs text-gray-500 bg-gray-50/80 border-b border-gray-200 uppercase font-medium"', 'className="text-xs text-gray-200 bg-white/10 border-b border-white/20 uppercase font-medium"')
content = content.replace('className="divide-y divide-gray-100 bg-white"', 'className="divide-y divide-white/10 bg-transparent"')

# Table row
old_tr = """                  <tr
                    key={product.id}
                    className={`${isHot ? 'bg-red-50 hover:bg-red-100 border-r-red-400' : 'bg-white hover:bg-gray-50/80 border-r-gray-200'} border-r-4 transition-colors`}
                  >
                    <td className="py-3 px-4 text-right">
                      <span className={`text-sm font-medium ${isHot ? 'text-red-900' : 'text-gray-900'} block`}>
                        {isHot && <span className="ml-1">🔥</span>}
                        {product.productName}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-sm text-gray-600">{product.brand || "—"}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-sm text-gray-600">{product.price ? `₪${product.price}` : "—"}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-sm text-gray-600">{product.stock || "—"}</span>
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-gray-500">
                      <ClientDate date={product.scannedAt} />
                    </td>
                  </tr>"""

new_tr = """                  <tr
                    key={product.id}
                    className={`${isHot ? 'bg-red-900/20 hover:bg-red-900/30 border-r-red-400' : 'bg-transparent hover:bg-white/5 border-r-transparent'} border-r-4 transition-colors`}
                  >
                    <td className="py-3 px-4 text-right">
                      <span className={`text-sm font-medium ${isHot ? 'text-red-200' : 'text-white'} block`}>
                        {isHot && <span className="ml-1">🔥</span>}
                        {product.productName}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-sm text-gray-300">{product.brand || "—"}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-sm text-gray-300">{product.price ? `₪${product.price}` : "—"}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-sm text-gray-300">{product.stock || "—"}</span>
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-gray-400">
                      <ClientDate date={product.scannedAt} />
                    </td>
                  </tr>"""

content = content.replace(old_tr, new_tr)

# Empty state
old_empty = """                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      לא נמצאו מוצרים
                    </td>
                  </tr>
                )}"""
new_empty = """                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">
                      לא נמצאו מוצרים
                    </td>
                  </tr>
                )}"""
content = content.replace(old_empty, new_empty)

# Close tags
old_close = """          </div>
        </CardContent>
      </Card>
    </div>
  );
}"""

new_close = """          </div>
        </div>
      </div>
    </div>
    </div>
  );
}"""
content = content.replace(old_close, new_close)

with open("src/app/lindo-products/lindo-client.tsx", "w") as f:
    f.write(content)
