import pandas as pd
import json

excel_path = "ליברו.xlsx"

def clean(val):
    if pd.isna(val) or val == 'nan' or str(val).strip() == '':
        return None
    return str(val).strip()

def parse_sheet(sheet_name, target_headers, row_mapper, find_headers_first=True):
    try:
        df = pd.read_excel(excel_path, sheet_name=sheet_name)
    except Exception as e:
        print(f"Skipping {sheet_name}: {e}")
        return []
    
    items = []
    
    if find_headers_first:
        # Find header row
        header_row_idx = -1
        header_map = {}
        for idx, row in df.iterrows():
            strings = sum(isinstance(x, str) for x in row.values)
            if strings >= len(target_headers) - 2:
                # check if target headers are in this row
                found = 0
                temp_map = {}
                for col in df.columns:
                    val = row[col]
                    if pd.notna(val) and isinstance(val, str):
                        for th in target_headers:
                            if th in val:
                                found += 1
                                temp_map[th] = col
                if found >= len(target_headers) - 2:
                    header_row_idx = idx
                    header_map = temp_map
                    break
        
        if header_row_idx == -1:
            print(f"Could not find headers for {sheet_name}")
            return []
            
        for r in range(header_row_idx + 1, len(df)):
            row_data = {th: clean(df.iloc[r, df.columns.get_loc(header_map[th])]) if th in header_map else None for th in target_headers}
            
            # if all are None, skip
            if all(v is None for v in row_data.values()):
                continue
            
            item = row_mapper(row_data)
            if item:
                items.append(item)
    else:
        # custom logic for 'בעלי תפקידים'
        # people in row 2
        people = []
        people_cols = []
        for col in df.columns:
            val = df.iloc[2, df.columns.get_loc(col)]
            if pd.notna(val) and isinstance(val, str):
                people.append(val)
                people_cols.append(col)
        
        for r in range(3, len(df)):
            for i, col in enumerate(people_cols):
                task = clean(df.iloc[r, df.columns.get_loc(col)])
                if task:
                    items.append({
                        "name": people[i],
                        "role": task
                    })
    return items

def parse_monthly_schedule():
    # custom logic for monthly schedule
    try:
        df = pd.read_excel(excel_path, sheet_name="לוז חודשי")
    except:
        return []
    items = []
    # find row 0 headers
    headers = []
    for col in df.columns:
        val = df.iloc[0, df.columns.get_loc(col)]
        if pd.notna(val):
            headers.append((col, str(val)))
            
    for r in range(1, len(df)):
        for col, hname in headers:
            task = clean(df.iloc[r, df.columns.get_loc(col)])
            if task:
                items.append({
                    "weekNumber": r,
                    "task": task
                })
    return items

def parse_credit_cards():
    """Custom parser for credit cards with business/personal sections"""
    try:
        df = pd.read_excel(excel_path, sheet_name="כרטיסי אשראי")
    except Exception as e:
        print(f"Skipping כרטיסי אשראי: {e}")
        return []
    
    cards = []
    card_type = None
    for idx, row in df.iterrows():
        vals = [str(v) if pd.notna(v) else None for v in row.values]
        # Check for card type marker
        if vals[2] == 'עסקי':
            card_type = 'עסקי'
            continue
        if vals[2] == 'פרטי':
            card_type = 'פרטי'
            continue
        # Check for header row
        if vals[2] == 'תאריך חיוב':
            continue
        # Check for summary row
        if vals[7] and 'סה״כ' in str(vals[7]):
            continue
        # Parse data row
        card_company = clean(row.iloc[8])
        card_number = clean(row.iloc[5])
        if card_company and card_number:
            cards.append({
                'cardCompany': card_company,
                'bank': clean(row.iloc[7]),
                'creditLimit': clean(row.iloc[6]),
                'cardNumber': card_number,
                'expiration': clean(row.iloc[4]),
                'cvv': clean(row.iloc[3]),
                'billingDate': clean(row.iloc[2]),
                'cardType': card_type or 'לא מוגדר'
            })
    return cards

def parse_bank_of_tasks():
    """Custom parser for bank of tasks sheet"""
    try:
        df = pd.read_excel(excel_path, sheet_name="בנק משימות")
    except Exception as e:
        print(f"Skipping בנק משימות: {e}")
        return []
    
    items = []
    for idx, row in df.iterrows():
        if idx < 3:  # Skip header rows
            continue
        task_name = clean(row.iloc[4])
        if task_name:
            items.append({
                'taskNumber': clean(row.iloc[6]),
                'date': clean(row.iloc[5]),
                'taskName': task_name,
                'status': clean(row.iloc[3]),
                'subtasks': clean(row.iloc[2]),
                'responsible': clean(row.iloc[1])
            })
    return items


all_data = {}

# 1. שיווק
all_data['influencers'] = parse_sheet(
    "שיווק",
    ['שם המותג', 'ממומן', 'כמות סרטונים', 'כמות פוסטים', 'פעילויות', 'משפיען', 'מוצרים שנתנו', 'סרטונים שהועלו', 'הערות'],
    lambda rd: {
        "brand": rd.get('שם המותג'),
        "isPaid": rd.get('ממומן'),
        "videoCount": rd.get('כמות סרטונים'),
        "postCount": rd.get('כמות פוסטים'),
        "activities": rd.get('פעילויות'),
        "influencerName": rd.get('משפיען'),
        "productsGiven": rd.get('מוצרים שנתנו'),
        "videosUploaded": rd.get('סרטונים שהועלו'),
        "notes": rd.get('הערות')
    }
)

# 2. תשלום משפיענים
all_data['influencerPayments'] = parse_sheet(
    "תשלום משפיענים",
    ['שם המשפיען', 'סכום', 'בוצע'],
    lambda rd: {
        "influencerName": rd.get('שם המשפיען'),
        "amount": rd.get('סכום'),
        "isDone": rd.get('בוצע'),
        "notes": None
    }
)

# 3. סיטונאות
all_data['wholesaleCustomers'] = parse_sheet(
    "סיטונאות",
    ['שם החנות', 'עיר', 'כתובת', 'שיחת טלפון', 'ביקור', 'יש פוטנציאל', 'יש עניין', 'הערות'],
    lambda rd: {
        "storeName": rd.get('שם החנות'),
        "city": rd.get('עיר'),
        "address": rd.get('כתובת'),
        "phoneCall": rd.get('שיחת טלפון'),
        "visit": rd.get('ביקור'),
        "potential": rd.get('יש פוטנציאל'),
        "interest": rd.get('יש עניין'),
        "notes": rd.get('הערות')
    }
)

# 4. ניהול ספקים חדשים וישנים
all_data['suppliers'] = parse_sheet(
    "ניהול ספקים חדשים וישנים",
    ['שם המותג', 'מלאי', 'תכנון', 'סטטוס', 'הערות'],
    lambda rd: {
        "brandName": rd.get('שם המותג'),
        "inventoryStatus": rd.get('מלאי'),
        "planningStatus": rd.get('תכנון'),
        "contactStatus": rd.get('סטטוס'),
        "notes": rd.get('הערות')
    }
)

# 5. תשלומים יבוא
all_data['importPayments'] = parse_sheet(
    "תשלומים יבוא",
    ['שם המותג', 'סכום הזמנה במטבע זר', 'סכום הזמנה בשח', 'מע״מ', 'עלות שילוח'],
    lambda rd: {
        "brand": rd.get('שם המותג'),
        "orderAmountForeign": rd.get('סכום הזמנה במטבע זר'),
        "orderAmountNis": rd.get('סכום הזמנה בשח'),
        "vat": rd.get('מע״מ'),
        "shippingCost": rd.get('עלות שילוח')
    }
)

# 6. כרטיסי אשראי (custom parser with business/personal types)
all_data['creditCards'] = parse_credit_cards()

# 7. בעלי תפקידים
all_data['roleHolders'] = parse_sheet("בעלי תפקידים", [], None, find_headers_first=False)

# 8. לוז חודשי
all_data['monthlySchedule'] = parse_monthly_schedule()

# 9. בנק משימות
all_data['bankOfTasks'] = parse_bank_of_tasks()

# 10. הזמנות מסין
def parse_china_orders():
    try:
        df = pd.read_excel(excel_path, sheet_name="הזמנות מסין")
    except Exception as e:
        print(f"Skipping הזמנות מסין: {e}")
        return []
    
    items = []
    # Find columns dynamically based on headers
    date_col = None
    product_col = None
    for idx, row in df.iterrows():
        # First try to find headers
        if date_col is None or product_col is None:
            for col in df.columns:
                val = str(row[col]).strip() if pd.notna(row[col]) else ""
                if val == "תאריך הגעה":
                    date_col = col
                elif val == "מוצרים":
                    product_col = col
            continue
            
        if date_col and product_col:
            arrival_date = clean(row[date_col])
            products = clean(row[product_col])
            
            # Stop if we hit a non-date related row like summary or empty rows
            if products and str(products) == 'סה״כ':
                break
                
            if arrival_date and products:
                items.append({
                    'arrivalDate': arrival_date,
                    'products': products
                })
    return items

all_data['chinaOrders'] = parse_china_orders()

with open('parsed_all_data.json', 'w', encoding='utf-8') as f:
    json.dump(all_data, f, ensure_ascii=False, indent=2)

for k, v in all_data.items():
    print(f"{k}: {len(v)} items")
