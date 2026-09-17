import fitz
doc = fitz.open("captured.pdf")
page = doc.load_page(0)
pix = page.get_pixmap()
pix.save("captured.png")
