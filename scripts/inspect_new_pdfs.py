import fitz

new_pdfs = [
    "dse_cap2_cut_off_2025_26.pdf",
    "dse_cap_round_ii_cutoff_2024_25.pdf",
    "maharashtra-dse-cap-round-1-cutoff-2024.pdf"
]

for pdf_name in new_pdfs:
    print(f"\n==========================================")
    print(f"Inspecting: {pdf_name}")
    try:
        doc = fitz.open(pdf_name)
        print(f"Total Pages: {len(doc)}")
        
        # Let's inspect Page 10 (index 9) or Page 1
        page = doc[min(9, len(doc)-1)]
        blocks = page.get_text("blocks")
        blocks.sort(key=lambda b: (b[1], b[0]))
        
        print(f"Number of blocks: {len(blocks)}")
        # Print the first 5 text blocks
        for i, b in enumerate(blocks[:8]):
            print(f"Block {i}: x0={b[0]:.1f}, y0={b[1]:.1f}")
            print(repr(b[4].strip()))
            print("-" * 20)
            
    except Exception as e:
        print(f"Error inspecting {pdf_name}: {e}")
