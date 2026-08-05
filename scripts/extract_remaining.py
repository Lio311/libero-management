import pandas as pd
import json
import math

excel_path = 'ליברו.xlsx'

def clean(val):
    if pd.isna(val) or val == 'nan' or str(val).strip() == '':
        return None
    return str(val).strip()

all_data = {}

# Bank of tasks
try:
    df = pd.read_excel(excel_path, sheet_name='בנק משימות')
    items = []
    for idx, row in df.iterrows():
        if idx < 2:
            continue
        task_name = clean(row.iloc[4])
        if task_name:
            items.append({
                'itemIndex': clean(row.iloc[6]),
                'dueDate': clean(row.iloc[5]),
                'taskName': task_name,
                'status': clean(row.iloc[3]),
                'assignee': clean(row.iloc[1])
            })
    all_data['bankOfTasks'] = items
except Exception as e:
    print(f"Error Bank of Tasks: {e}")

# Import payments
try:
    df2 = pd.read_excel(excel_path, sheet_name='תשלומים יבוא')
    payments = []
    for idx, row in df2.iterrows():
        if idx < 4:
            continue
        brand = clean(row.iloc[5])
        if brand and brand != 'שם המותג':
            payments.append({
                'brand': brand,
                'orderAmountForeign': clean(row.iloc[4]),
                'orderAmountNis': clean(row.iloc[3]),
                'vat': clean(row.iloc[2]),
                'shippingCost': clean(row.iloc[1])
            })
    all_data['importPayments'] = payments
except Exception as e:
    print(f"Error Import Payments: {e}")

# Suppliers
try:
    df3 = pd.read_excel(excel_path, sheet_name='ניהול ספקים חדשים וישנים')
    suppliers = []
    # According to previous output:
    # Row 1 (index 1): ['NaN', 'NaN', 'הערות', 'סטטוס', 'שם המותג', 'NaN', 'NaN', 'תכנון', 'מלאי', 'שם המותג', '#']
    for idx, row in df3.iterrows():
        if idx < 2:
            continue
        # Old suppliers
        old_brand = clean(row.iloc[9])
        if old_brand and old_brand != 'שם המותג':
            suppliers.append({
                'brandName': old_brand,
                'inventoryStatus': clean(row.iloc[8]),
                'planningStatus': clean(row.iloc[7]),
            })
        
        # New suppliers
        new_brand = clean(row.iloc[4])
        if new_brand and new_brand != 'שם המותג':
            suppliers.append({
                'brandName': new_brand,
                'contactStatus': clean(row.iloc[3]),
                'notes': clean(row.iloc[2]),
            })
    all_data['suppliers'] = suppliers
except Exception as e:
    print(f"Error Suppliers: {e}")

with open('remaining_data.json', 'w') as f:
    json.dump(all_data, f, ensure_ascii=False, indent=2)

print("Data written to remaining_data.json")
