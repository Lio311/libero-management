with open("src/app/shipping-scanner/[orderId]/mini-perfume/ClientPrinter.tsx", "r") as f:
    content = f.read()

content = content.replace(
    '<div className="min-h-screen bg-gray-100 p-8 font-sans" dir="rtl">',
    '<div className="min-h-[100dvh] flex items-center justify-center p-8 font-sans" dir="rtl">'
)

content = content.replace(
    '<div className="max-w-xl mx-auto  rounded-2xl shadow-xl overflow-hidden border border-gray-200">',
    '<div className="max-w-xl mx-auto w-full glass-panel rounded-3xl p-6 shadow-xl flex flex-col gap-6">'
)

content = content.replace(
    '<div className="bg-black p-6 text-white text-center">',
    '<div className="text-white text-center">'
)

content = content.replace(
    '<div className="p-8 space-y-6">',
    '<div className="space-y-6">'
)

with open("src/app/shipping-scanner/[orderId]/mini-perfume/ClientPrinter.tsx", "w") as f:
    f.write(content)
