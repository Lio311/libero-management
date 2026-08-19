with open("src/app/shipping-scanner/[orderId]/scanner-client.tsx", "r") as f:
    content = f.read()
content = content.replace("}, 100);", "}, 300);")
with open("src/app/shipping-scanner/[orderId]/scanner-client.tsx", "w") as f:
    f.write(content)
