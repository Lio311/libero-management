import urllib.request
import re

url = "http://www.columbia.edu/~em36/pdftoprinter.html"
try:
    with urllib.request.urlopen(url) as response:
        html = response.read().decode('utf-8')
        # Find all mentions of command line arguments
        matches = re.findall(r'/[a-zA-Z]+', html)
        print("Possible flags:", set(matches))
except Exception as e:
    print(e)
