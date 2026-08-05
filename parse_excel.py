import pandas as pd
import json
import math

excel_path = "ליברו.xlsx"

def clean_value(val):
    if pd.isna(val) or val == 'nan':
        return None
    return val

def extract_inventory(sheet_name):
    df = pd.read_excel(excel_path, sheet_name=sheet_name)
    items = []
    
    # We will look for rows that contain 'שם הדגם'
    # The row containing 'שם הדגם' is the header row for a table
    for idx, row in df.iterrows():
        # Find all columns that contain 'שם הדגם'
        for col in df.columns:
            if row[col] == 'שם הדגם':
                # We found a header. Let's map the columns for this table.
                # Assuming the headers are contiguous in this row
                header_map = {}
                brand_name = "Unknown"
                # The brand name is usually a few rows above the header
                for offset in range(1, 5):
                    if idx - offset >= 0:
                        potential_brand = df.iloc[idx - offset, df.columns.get_loc(col)]
                        if pd.notna(potential_brand) and isinstance(potential_brand, str) and 'מקדם' in potential_brand:
                            brand_name = potential_brand.split('-')[0].strip()
                            break
                        
                for c in df.columns:
                    val = row[c]
                    if pd.notna(val) and isinstance(val, str):
                        header_map[val] = c
                
                # Now read the rows below until we hit NaN in 'שם הדגם'
                r = idx + 1
                while r < len(df):
                    model_name = df.iloc[r, df.columns.get_loc(header_map['שם הדגם'])]
                    if pd.isna(model_name) or str(model_name).strip() == '':
                        break
                    
                    item = {
                        "brand": brand_name,
                        "modelName": str(model_name),
                        "itemIndex": clean_value(df.iloc[r, df.columns.get_loc(header_map.get('#', df.columns[0]))]) if '#' in header_map else None,
                        "costPrice": clean_value(df.iloc[r, df.columns.get_loc(header_map.get('מחיר עלות', df.columns[0]))]) if 'מחיר עלות' in header_map else None,
                        "targetStockLevel": clean_value(df.iloc[r, df.columns.get_loc(header_map.get('רמת מלאי', df.columns[0]))]) if 'רמת מלאי' in header_map else None,
                        "orderedQuantity": clean_value(df.iloc[r, df.columns.get_loc(header_map.get('הוזמן', df.columns[0]))]) if 'הוזמן' in header_map else None,
                        "lastOrderQuantity": clean_value(df.iloc[r, df.columns.get_loc(header_map.get('הזמנה אחרונה', df.columns[0]))]) if 'הזמנה אחרונה' in header_map else None,
                        "currentStock": clean_value(df.iloc[r, df.columns.get_loc(header_map.get('מלאי נוכחי', df.columns[0]))]) if 'מלאי נוכחי' in header_map else None,
                    }
                    items.append(item)
                    r += 1

    return items

inventory_items = extract_inventory('הזמנות ליברו')
# Try to extract from others as well like "הזמנות עידן", "הפסקנו לעבוד", "לה בורה ספירת מלאי", "הזמנות מסין"
for s in ["הזמנות עידן", "הפסקנו לעבוד", "לה בורה ספירת מלאי", "הזמנות מסין"]:
    try:
        inventory_items.extend(extract_inventory(s))
    except Exception as e:
        pass

with open('parsed_inventory.json', 'w', encoding='utf-8') as f:
    json.dump(inventory_items, f, ensure_ascii=False, indent=2)

print(f"Extracted {len(inventory_items)} inventory items")
