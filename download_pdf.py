import urllib.request
import os

pdf_url = "https://dse2025.mahacet.org.in/dse25/staticFiles/DSE_CAP1_CutOff_2025_26.pdf"
pdf_path = "DSE_CAP1_CutOff_2025_26.pdf"

print(f"Downloading PDF from {pdf_url}...")
try:
    req = urllib.request.Request(
        pdf_url, 
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
    )
    with urllib.request.urlopen(req) as response:
        with open(pdf_path, 'wb') as out_file:
            out_file.write(response.read())
    file_size = os.path.getsize(pdf_path)
    print(f"Download complete. File size: {file_size / (1024 * 1024):.2f} MB")
except Exception as e:
    print(f"Error downloading PDF: {e}")
