import pypdf
import re

pdf_path = "DSE_CAP1_CutOff_2025_26.pdf"

try:
    reader = pypdf.PdfReader(pdf_path)
    found_count = 0
    
    for page_idx, page in enumerate(reader.pages):
        text = page.extract_text()
        if "Stage-II" in text:
            print(f"\n--- Stage-II found on page {page_idx + 1} ---")
            lines = text.split('\n')
            for i, line in enumerate(lines):
                if "Stage-II" in line:
                    # Print context: 5 lines before and 5 lines after
                    start = max(0, i - 4)
                    end = min(len(lines), i + 6)
                    for j in range(start, end):
                        marker = "-> " if j == i else "   "
                        print(f"{marker}L{j+1:02d}: {repr(lines[j])}")
            found_count += 1
            if found_count >= 3:
                break
except Exception as e:
    print(f"Error: {e}")
