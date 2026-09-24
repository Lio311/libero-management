import re
import glob

def update_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # 1. Replace main wrapper if it matches scanner-list-client
    if "flex-1 space-y-12 p-4 md:p-8 pt-6 h-[100dvh]" in content:
        content = content.replace(
            'className="flex-1 space-y-12 p-4 md:p-8 pt-6 h-[100dvh] overflow-y-auto w-full pb-32"',
            'className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 md:p-8 pt-6 h-[100dvh] overflow-y-auto w-full pb-32"'
        )

    # 2. Add glass-panel to logical groups. In scanner-list-client.tsx, it's a bit harder to just regex this.
    # Let's remove solid backgrounds first
    content = re.sub(r'\bbg-white\b', '', content)
    content = re.sub(r'\bbg-card\b', '', content)
    
    # Let's remove any text-muted-foreground ? No, text-muted-foreground is okay.
    # But text-foreground should be white. We can leave it or remove it.
    
    with open(filepath, 'w') as f:
        f.write(content)

for tsx_file in glob.glob("src/app/shipping-scanner/**/*.tsx", recursive=True):
    update_file(tsx_file)
