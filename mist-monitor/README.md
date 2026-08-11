# 🔍 MIST Back-in-Stock Monitor

מוניטור שעוקב אחרי הקולקציה "חזר למלאי" באתר mist.co.il ושולח מייל מיידי כשמוצר חדש עולה.

## ⚡ הגדרה מהירה (פעם אחת)

### שלב 1: יצירת App Password ב-Gmail

1. כנס ל: https://myaccount.google.com/apppasswords
2. אם Google שואל — היכנס לחשבון `lior31197@gmail.com`
3. בתחתית העמוד, בשדה "App name", כתוב: `MIST Monitor`
4. לחץ **Create**
5. Google ייצור לך סיסמה בת 16 תווים (כמו `abcd efgh ijkl mnop`)
6. **העתק אותה** — תראה אותה רק פעם אחת!

> ⚠️ **חשוב**: צריך שיהיה מופעל **Two-Factor Authentication** בחשבון ה-Gmail כדי שאפשר יהיה ליצור App Password.

### שלב 2: הפעלת המוניטור

```bash
cd ~/mist-monitor

GMAIL_ADDRESS=lior31197@gmail.com GMAIL_APP_PASSWORD="abcd efgh ijkl mnop" python3 monitor.py
```

(החלף את `abcd efgh ijkl mnop` בסיסמה שקיבלת מ-Google)

## 🏃 הפעלה ברקע (שימשיך לרוץ גם אם תסגור טרמינל)

```bash
cd ~/mist-monitor

GMAIL_ADDRESS=lior31197@gmail.com GMAIL_APP_PASSWORD="abcd efgh ijkl mnop" \
  nohup python3 monitor.py > monitor.log 2>&1 &

echo $! > monitor.pid
```

### לעצור:
```bash
kill $(cat ~/mist-monitor/monitor.pid)
```

### לראות לוג:
```bash
tail -f ~/mist-monitor/monitor.log
```

## 📧 מה תקבל במייל

כל מייל כולל:
- 🖼️ תמונת המוצר
- 📝 שם המוצר
- 💰 מחיר
- 🔗 לינק ישיר לעמוד המוצר

## ⚙️ הגדרות

ניתן לשנות בתחילת `monitor.py`:

| הגדרה | ברירת מחדל | תיאור |
|---|---|---|
| `POLL_INTERVAL_SECONDS` | `30` | כל כמה שניות לבדוק |
| `EMAIL_TO` | `lior31197@gmail.com` | לאן לשלוח |
