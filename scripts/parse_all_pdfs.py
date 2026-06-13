import fitz
import re
import json
import os
import sys

# Define all the PDFs to process
pdf_files = [
    {
        "path": "DSE_CAP1_CutOff_2025_26.pdf",
        "year": "2025-26",
        "round": "1"
    },
    {
        "path": "dse_cap2_cut_off_2025_26.pdf",
        "year": "2025-26",
        "round": "2"
    },
    {
        "path": "dse_cap1_cut_off_2024_25.pdf",
        "year": "2024-25",
        "round": "1"
    },
    {
        "path": "dse_cap2_cut_off_2024_25.pdf",
        "year": "2024-25",
        "round": "2"
    },
    {
        "path": "dse_cap1_cut_off_2023_24.pdf",
        "year": "2023-24",
        "round": "1"
    },
    {
        "path": "dse_cap2_cut_off_2023_24.pdf",
        "year": "2023-24",
        "round": "2"
    },
    {
        "path": "dse_cap3_cut_off_2023_24.pdf",
        "year": "2023-24",
        "round": "3"
    }
]

output_path = "dse_cutoff_data.json"

def parse_all_pdfs():
    # Key: choice_code, Value: college structure
    college_data_map = {}
    
    # Grid column calculations
    START_X = 88.65
    COL_WIDTH = 51.023
    
    pct_pattern = re.compile(r"^\(\d+\.\d+%\)$")
    rank_pattern = re.compile(r"^\d+$")
    
    for pdf_info in pdf_files:
        pdf_path = pdf_info["path"]
        year = pdf_info["year"]
        round_num = pdf_info["round"]
        
        print(f"\n==========================================")
        print(f"Opening PDF: {pdf_path} (AY: {year}, CAP Round: {round_num})...")
        if not os.path.exists(pdf_path):
            print(f"Warning: {pdf_path} does not exist! Skipping...")
            continue
            
        doc = fitz.open(pdf_path)
        total_pages = len(doc)
        print(f"Total Pages to process: {total_pages}")
        
        pdf_choice_codes_parsed = 0
        
        for page_idx in range(total_pages):
            if (page_idx + 1) % 100 == 0 or page_idx == 0 or page_idx == total_pages - 1:
                print(f"Processing page {page_idx + 1}/{total_pages}...")
                
            page = doc[page_idx]
            blocks = page.get_text("blocks")
            words = page.get_text("words")
            
            # Sort blocks and words
            blocks.sort(key=lambda b: (b[1], b[0]))
            words.sort(key=lambda w: (w[5], w[6], w[7]))
            
            # Find all Choice Code blocks on this page
            choice_code_blocks = []
            for b_idx, b in enumerate(blocks):
                if "Choice Code" in b[4]:
                    choice_code_blocks.append((b_idx, b))
                    
            if not choice_code_blocks:
                continue
                
            for idx, (b_idx, cb) in enumerate(choice_code_blocks):
                y_start = cb[1]
                y_end = choice_code_blocks[idx+1][1][1] if idx + 1 < len(choice_code_blocks) else 560.0
                
                # Find Choice Code and Course Name
                cb_text = cb[4]
                choice_code_match = re.search(r"Choice Code\s*:\s*(\d+)", cb_text)
                course_name_match = re.search(r"Course Name\s*:\s*(.*)", cb_text)
                
                if not choice_code_match:
                    continue
                    
                choice_code = choice_code_match.group(1)
                course_name = course_name_match.group(1).strip() if course_name_match else ""
                college_code = choice_code[:4]
                
                # Find college name block (preceding choice code block)
                college_name = ""
                best_college_block = None
                min_dist = float('inf')
                for b in blocks:
                    if b[3] <= y_start and y_start - b[3] < 50.0 and b[4].strip().startswith(college_code):
                        dist = y_start - b[3]
                        if dist < min_dist:
                            min_dist = dist
                            best_college_block = b
                
                if best_college_block:
                    raw_name = best_college_block[4].strip()
                    college_name = re.sub(r"^\d+\s*", "", raw_name).replace('\n', ' ').strip()
                else:
                    # Fallback to scanning page blocks for the college code
                    for b in blocks:
                        if b[4].strip().startswith(college_code) and b[3] < y_start:
                            college_name = re.sub(r"^\d+\s*", "", b[4].strip()).replace('\n', ' ').strip()
                            break
                
                # Collect words within y-range of this choice code
                cc_words = [w for w in words if y_start - 5.0 <= w[1] <= y_end]
                
                # Find category headers block
                categories_block = None
                for b in blocks:
                    if y_start < b[1] < y_end:
                        lines = [line.strip() for line in b[4].split('\n') if line.strip()]
                        if any("GOPEN" in l or "LOPEN" in l or "GOBC" in l for l in lines):
                            categories_block = b
                            break
                            
                if not categories_block:
                    continue
                    
                categories = [c.strip() for c in categories_block[4].split('\n') if c.strip()]
                if not categories:
                    categories = categories_block[4].split()
                    
                categories = [c for c in categories if c]
                
                # Extract cutoff words (percentages, ranks, and stage labels)
                pct_words = []
                digit_words = []
                stage_words = []
                
                for w in cc_words:
                    w_text = w[4].strip()
                    if pct_pattern.match(w_text):
                        pct_words.append(w)
                    elif rank_pattern.match(w_text):
                        digit_words.append(w)
                    elif "Stage-I" in w_text or "Stage-II" in w_text or "Stage-III" in w_text:
                        stage_words.append(w)
                        
                cutoffs = {}
                for pw in pct_words:
                    px0, py0 = pw[0], pw[1]
                    pct_val = float(pw[4].strip("()%"))
                    
                    # Column mapping
                    col_idx = round((px0 - START_X) / COL_WIDTH)
                    if col_idx < 0 or col_idx >= len(categories):
                        continue
                    category = categories[col_idx]
                    
                    # Find corresponding rank
                    rank_val = None
                    for dw in digit_words:
                        rx0, ry0 = dw[0], dw[1]
                        if abs(rx0 - px0) < 10.0 and 5.0 <= py0 - ry0 <= 12.0:
                            rank_val = int(dw[4])
                            break
                            
                    # Find stage
                    stage_val = 1 # default Stage-I
                    min_stage_dist = float('inf')
                    for sw in stage_words:
                        sy0 = sw[1]
                        dist = abs(sy0 - py0)
                        if dist < min_stage_dist:
                            min_stage_dist = dist
                            if "Stage-II" in sw[4]:
                                stage_val = 2
                            elif "Stage-III" in sw[4]:
                                stage_val = 3
                                
                    # Save as compact array [rank, cutoff_percent, stage_val]
                    cutoffs[category] = [rank_val, pct_val, stage_val]
                
                if cutoffs:
                    pdf_choice_codes_parsed += 1
                    
                    # Store / update in main structure
                    if choice_code not in college_data_map:
                        college_data_map[choice_code] = {
                            "college_code": college_code,
                            "college_name": college_name,
                            "choice_code": choice_code,
                            "branch_name": course_name,
                            "cutoffs": {}
                        }
                    else:
                        # Optionally update name/branch to have the latest/fullest available values
                        if college_name and not college_data_map[choice_code]["college_name"]:
                            college_data_map[choice_code]["college_name"] = college_name
                        if course_name and not college_data_map[choice_code]["branch_name"]:
                            college_data_map[choice_code]["branch_name"] = course_name
                            
                    # Insert cutoffs under nested year & round
                    if year not in college_data_map[choice_code]["cutoffs"]:
                        college_data_map[choice_code]["cutoffs"][year] = {}
                        
                    college_data_map[choice_code]["cutoffs"][year][round_num] = cutoffs
                    
        print(f"Finished PDF: {pdf_path}. Total choice codes parsed: {pdf_choice_codes_parsed}")
        
    print(f"\n==========================================")
    print(f"Completed parsing all PDFs. Total unique choice codes: {len(college_data_map)}")
    
    # Save output to JSON
    print(f"Saving data to {output_path}...")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(list(college_data_map.values()), f, separators=(',', ':'))
        
    file_size_kb = os.path.getsize(output_path) / 1024
    print(f"Save complete. File size: {file_size_kb:.2f} KB")

if __name__ == "__main__":
    parse_all_pdfs()
