const fs = require('fs');
const file = 'src/app/actions/scanner-actions.ts';
let code = fs.readFileSync(file, 'utf8');

const target = `    const data = await response.json();
    const labelUrl = data.label || data.pdf_link || data.label_url || "";
    const barcode = data.barcode || "";
    const region = data.destination_region_str || "";
    
    return { success: true, labelUrl, barcode, region };
  } catch (error: any) {`;

const replacement = `    const data = await response.json();
    const labelUrl = data.label || data.pdf_link || data.label_url || "";
    const barcode = data.barcode || data.tracking_number || "";
    const region = data.destination_region_str || "";
    
    if (labelUrl || barcode) {
      try {
        await db.insert(generatedShippingLabels).values({
          orderId: orderId.toString(),
          customerId: order.customerId?.toString() || "",
          customerName: customerName,
          labelUrl: labelUrl,
          trackingUrl: data.tracking_link || data.tracking_url || "",
          barcode: barcode,
        });
      } catch (dbError) {
        console.error("Failed to save generated label to db:", dbError);
      }
    }
    
    return { success: true, labelUrl, barcode, region };
  } catch (error: any) {`;

code = code.replace(target, replacement);

fs.writeFileSync(file, code);
