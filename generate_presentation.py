import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

def create_deck():
    prs = Presentation()
    # 16:9 Widescreen dimensions
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Theme Colors
    C_FOREST = RGBColor(6, 78, 59)      # Deep Emerald (#064E3B)
    C_EMERALD = RGBColor(6, 95, 70)     # Primary Emerald (#065F46)
    C_MINT = RGBColor(16, 185, 129)     # Vibrant Mint (#10B981)
    C_TEAL = RGBColor(13, 148, 136)     # Teal (#0D9488)
    C_DARK = RGBColor(15, 23, 42)       # Slate 900 (#0F172A)
    C_BODY = RGBColor(51, 65, 85)       # Slate 700 (#334155)
    C_MUTED = RGBColor(100, 116, 139)   # Slate 500 (#64748B)
    C_LIGHT_BG = RGBColor(248, 250, 252)# Slate 50 (#F8FAFC)
    C_CARD_BG = RGBColor(240, 253, 244) # Emerald 50 (#F0FDF4)
    C_WHITE = RGBColor(255, 255, 255)
    C_BORDER = RGBColor(203, 213, 225)  # Slate 300 (#CBD5E1)

    def add_header(slide, title, category="FARMWISE AI • TASK 1: MULTI-MODEL AGENTIC SYSTEM"):
        # Top Category pill / tracker
        cat_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.7), Inches(0.35))
        tf_c = cat_box.text_frame
        tf_c.word_wrap = True
        tf_c.margin_left = tf_c.margin_top = tf_c.margin_right = tf_c.margin_bottom = 0
        p_c = tf_c.paragraphs[0]
        p_c.text = category.upper()
        p_c.font.size = Pt(9.5)
        p_c.font.bold = True
        p_c.font.color.rgb = C_MINT

        # Main Slide Title
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.7), Inches(11.7), Inches(0.65))
        tf_t = title_box.text_frame
        tf_t.word_wrap = True
        tf_t.margin_left = tf_t.margin_top = tf_t.margin_right = tf_t.margin_bottom = 0
        p_t = tf_t.paragraphs[0]
        p_t.text = title
        p_t.font.size = Pt(22)
        p_t.font.bold = True
        p_t.font.color.rgb = C_FOREST

        # Accent Line
        line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.38), Inches(11.733), Inches(0.02))
        line.fill.solid()
        line.fill.fore_color.rgb = C_BORDER
        line.line.fill.background()

        # Footer
        footer_box = slide.shapes.add_textbox(Inches(0.8), Inches(7.05), Inches(11.7), Inches(0.3))
        tf_f = footer_box.text_frame
        tf_f.margin_left = tf_f.margin_top = tf_f.margin_right = tf_f.margin_bottom = 0
        p_f = tf_f.paragraphs[0]
        p_f.text = "FarmwiseAI Campus Product Challenge | Team ID: FAI-TCE-Team06 | Confidential & Proprietary"
        p_f.font.size = Pt(8.5)
        p_f.font.color.rgb = C_MUTED

    def add_card(slide, left, top, width, height, bg_color=C_CARD_BG, border_color=C_BORDER):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
        card.fill.solid()
        card.fill.fore_color.rgb = bg_color
        card.line.color.rgb = border_color
        card.line.width = Pt(1)
        return card

    # =========================================================================
    # SLIDE 1: TITLE SLIDE (Hero Dark Background)
    # =========================================================================
    s1 = prs.slides.add_slide(blank_layout)
    bg1 = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
    bg1.fill.solid()
    bg1.fill.fore_color.rgb = C_FOREST
    bg1.line.fill.background()

    # Inner decorative container
    inner = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.8), Inches(11.733), Inches(5.9))
    inner.fill.solid()
    inner.fill.fore_color.rgb = RGBColor(4, 58, 44)
    inner.line.color.rgb = C_MINT
    inner.line.width = Pt(1.5)

    tbox1 = s1.shapes.add_textbox(Inches(1.2), Inches(1.3), Inches(11), Inches(4.5))
    tf1 = tbox1.text_frame
    tf1.word_wrap = True

    p = tf1.paragraphs[0]
    p.text = "FARMWISE AI CAMPUS PRODUCT CHALLENGE • TASK 1"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = C_MINT
    p.space_after = Pt(14)

    p = tf1.add_paragraph()
    p.text = "FarmwiseAI Agentic Agriculture\nIntelligence Platform"
    p.font.size = Pt(36)
    p.font.bold = True
    p.font.color.rgb = C_WHITE
    p.space_after = Pt(16)

    p = tf1.add_paragraph()
    p.text = "Multi-Model, Multimodal and Agentic AI Architecture for Verified Parcel-Level Crop Advisory"
    p.font.size = Pt(15)
    p.font.color.rgb = RGBColor(167, 243, 208) # Mint 200
    p.space_after = Pt(28)

    p = tf1.add_paragraph()
    p.text = "TEAM ID: FAI-TCE-Team06   |   AWS REGION: ap-south-1 (Mumbai)   |   TARGET: Farmers & Agri-Officers"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = C_WHITE

    # =========================================================================
    # SLIDE 2: INTRODUCTION & PROBLEM CONTEXT
    # =========================================================================
    s2 = prs.slides.add_slide(blank_layout)
    add_header(s2, "1. Introduction & Agricultural Dilemma in India")

    # 3 Column Cards
    col_w = 3.65
    gap = 0.38
    y_pos = 1.65
    c_h = 5.0

    cards_data_s2 = [
        ("The Smallholder Reality", 
         "• Over 82% of Indian farmers are smallholders operating <2 hectare plots.\n"
         "• High diversity in soil, crop stages, and micro-climates across adjacent parcels.\n"
         "• Heavy dependence on high-risk inputs (fertilizers, pesticides) without localized guidance.\n"
         "• Literacy & linguistic barriers: rural farmers prefer voice & Tamil over text in English."),
        ("The Failure of Traditional Advisory", 
         "• Broad-Brush Advisories: Existing systems deliver generic district-level advice (e.g., 'Apply Urea in Tenkasi').\n"
         "• No Spatial Resolution: Cannot identify parcel boundaries or specific Survey Numbers.\n"
         "• Zero Verification: Unchecked AI models hallucinate fertilizer dosages, causing chemical toxicity & financial ruin.\n"
         "• Fragmented Systems: Land records, weather, and market rates live in disconnected silos."),
        ("The FarmwiseAI Breakthrough", 
         "• Hyper-Local Parcel Intelligence: Resolves exact Patta/FMB cadastral boundaries for 14,643 survey numbers.\n"
         "• Multimodal Vision: Computer vision identifies exact crop phenology & health from field photos.\n"
         "• Bilingual & Voice-First: Farmers talk in colloquial Tamil; system speaks and transcribes in real-time.\n"
         "• Hallucination Firewall: Adversarial Verifier Critic agent audits every recommendation before display.")
    ]

    for i, (title, content) in enumerate(cards_data_s2):
        x = 0.8 + i * (col_w + gap)
        add_card(s2, x, y_pos, col_w, c_h)
        tb = s2.shapes.add_textbox(Inches(x + 0.2), Inches(y_pos + 0.2), Inches(col_w - 0.4), Inches(c_h - 0.4))
        tf = tb.text_frame
        tf.word_wrap = True
        
        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(15)
        p.font.bold = True
        p.font.color.rgb = C_FOREST
        p.space_after = Pt(14)

        for line in content.split('\n'):
            if line.strip():
                p_l = tf.add_paragraph()
                p_l.text = line
                p_l.font.size = Pt(10.5)
                p_l.font.color.rgb = C_BODY
                p_l.space_after = Pt(6)

    # =========================================================================
    # SLIDE 3: OBJECTIVES
    # =========================================================================
    s3 = prs.slides.add_slide(blank_layout)
    add_header(s3, "2. Project Mission & Core Technical Objectives")

    obj_items = [
        ("1. Multi-Agent Orchestration", "Design an autonomous, cyclic state-machine pipeline (LangGraph) that coordinates specialized agents (Geo, Vision, Weather, Knowledge, Verifier) without central bottlenecks."),
        ("2. Multimodal Computer Vision", "Integrate Gemini 3.8 Flash Vision to phenotype crop species, growth stage (tillering, flowering), canopy vigor, and stress directly from field photographs with calibrated confidence."),
        ("3. Parcel-Level Cadastral Grounding", "Map exact Survey Numbers to official revenue village cadastral boundaries (GeoJSON) and FMB polygons across 14,643 ground-truth surveyed locations in Tamil Nadu."),
        ("4. Hallucination-Safe Verification", "Implement a dual-model adversarial Verifier Critic agent (Claude 3.5 Sonnet) that rigorously cross-checks recommendations against land records, growth stage, and micro-climate."),
        ("5. Native Tamil Voice-First Access", "Enable low-literacy rural farmers to interact seamlessly using Groq Whisper speech-to-text (~320ms latency) and automated Tamil agricultural term normalization."),
        ("6. Enterprise Government Reporting", "Generate structured, tamper-verifiable PDF audit reports compliant with PM-FASAL BIMA Yojna crop insurance guidelines featuring cryptographic verification QR codes.")
    ]

    for i, (title, desc) in enumerate(obj_items):
        row = i // 2
        col = i % 2
        x = 0.8 + col * (5.7 + 0.33)
        y = 1.65 + row * (1.6 + 0.15)
        
        add_card(s3, x, y, 5.7, 1.6)
        tb = s3.shapes.add_textbox(Inches(x + 0.25), Inches(y + 0.15), Inches(5.2), Inches(1.3))
        tf = tb.text_frame
        tf.word_wrap = True
        
        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = C_FOREST
        p.space_after = Pt(4)

        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.size = Pt(10)
        p2.font.color.rgb = C_BODY

    # =========================================================================
    # SLIDE 4: TRADITIONAL VS PARCEL-LEVEL ADVISORY (Comparison Table)
    # =========================================================================
    s4 = prs.slides.add_slide(blank_layout)
    add_header(s4, "3. Paradigm Shift: Traditional Advisory vs. FarmWise AI Parcel Intelligence")

    # Table on Slide 4
    rows = 7
    cols = 3
    table_shape = s4.shapes.add_table(rows, cols, Inches(0.8), Inches(1.7), Inches(11.733), Inches(4.8))
    table = table_shape.table

    col_widths = [Inches(2.5), Inches(4.5), Inches(4.733)]
    for i, w in enumerate(col_widths):
        table.columns[i].width = w

    headers_s4 = ["Evaluation Dimension", "Traditional Agricultural Advisory", "FarmWise AI Parcel Intelligence"]
    for j, h in enumerate(headers_s4):
        cell = table.cell(0, j)
        cell.text = h
        cell.fill.solid()
        cell.fill.fore_color.rgb = C_FOREST
        for p in cell.text_frame.paragraphs:
            p.alignment = PP_ALIGN.LEFT
            for r in p.runs:
                r.font.bold = True
                r.font.size = Pt(11)
                r.font.color.rgb = C_WHITE

    data_s4 = [
        ("Geographic Granularity", "Broad district or state level (covers 1,000+ sq km). Misses local micro-climates.", "Exact Survey Parcel level (sub-acre accuracy). Resolves Patta / FMB boundaries."),
        ("Input Modalities", "Manual text input or pre-selected drop-down menus only.", "Multimodal: Voice (Tamil/English), Field Photos, Survey No, and Documents."),
        ("Crop Phenology Detection", "Farmer guesses and selects crop stage manually from a drop-down.", "Gemini 3.8 Flash Computer Vision autonomously detects stage (e.g. tillering) from photo."),
        ("Weather & Spray Window", "Static 24-hour regional temperature and rain percentage.", "Hyper-local Open-Meteo micro-climate computing exact safe spraying windows in km/h."),
        ("AI Safety & Verification", "Single prompt LLM prone to dangerous dosage hallucinations.", "Adversarial Verifier Critic (Claude 3.5 Sonnet) audits advice before display."),
        ("Auditability & Traceability", "Black-box chatbot response with zero decision evidence.", "Transparent Decision Trace Modal exposing agent execution steps & verification score.")
    ]

    for i, row in enumerate(data_s4):
        bg = C_CARD_BG if i % 2 == 1 else C_WHITE
        for j, val in enumerate(row):
            cell = table.cell(i + 1, j)
            cell.text = val
            cell.fill.solid()
            cell.fill.fore_color.rgb = bg
            for p in cell.text_frame.paragraphs:
                p.alignment = PP_ALIGN.LEFT
                for r in p.runs:
                    r.font.size = Pt(9.5)
                    r.font.color.rgb = C_DARK if j == 0 else C_BODY
                    if j == 0:
                        r.font.bold = True

    # =========================================================================
    # SLIDE 5: 8-STEP END-TO-END WORKFLOW
    # =========================================================================
    s5 = prs.slides.add_slide(blank_layout)
    add_header(s5, "4. Autonomous 8-Step Multi-Agent Execution Flow")

    flow_steps = [
        ("Step 1: Ingestion", "Farmer enters Survey # (e.g. 1342), takes field photo, or speaks query."),
        ("Step 2: Voice LPU", "Groq Whisper transcribes Tamil speech in ~320ms; normalizes numerals."),
        ("Step 3: Geo Agent", "Resolves Patta record across 14,643 rows; loads Cadastral GeoJSON polygon."),
        ("Step 4: Vision Agent", "Gemini 3.8 Flash analyzes canopy, growth stage, and health with confidence."),
        ("Step 5: Weather Agent", "Queries Open-Meteo for parcel lat/lon; computes safe spray window."),
        ("Step 6: Knowledge Agent", "Retrieves TNAU/ICAR agronomic schedules & live APMC Mandi commodity rates."),
        ("Step 7: Verifier Critic", "Claude 3.5 Sonnet cross-checks land records, crop stage, and weather consistency."),
        ("Step 8: Synthesis", "Produces executive advisory, translates to colloquial Tamil, and prints PDF.")
    ]

    for i, (title, desc) in enumerate(flow_steps):
        row = i // 4
        col = i % 4
        x = 0.8 + col * (2.75 + 0.24)
        y = 1.7 + row * (2.45 + 0.2)

        add_card(s5, x, y, 2.75, 2.45)
        tb = s5.shapes.add_textbox(Inches(x + 0.15), Inches(y + 0.15), Inches(2.45), Inches(2.15))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(12)
        p.font.bold = True
        p.font.color.rgb = C_FOREST
        p.space_after = Pt(8)

        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.size = Pt(9.5)
        p2.font.color.rgb = C_BODY

    # =========================================================================
    # SLIDE 6: TECHNOLOGIES USED & ARCHITECTURE
    # =========================================================================
    s6 = prs.slides.add_slide(blank_layout)
    add_header(s6, "5. System Architecture & Technology Stack")

    tech_cards = [
        ("Frontend Application", "• React 19 + Vite 6: Instant HMR, tiny 380KB bundle.\n• Tailwind CSS v4: High-contrast mobile-friendly UI.\n• React-Leaflet + OSM: Vector polygon boundary rendering.\n• Lucide React: Intuitive agricultural icons.\n• Custom Tamil Engine: Curated agricultural dictionary."),
        ("Backend Services", "• FastAPI + Uvicorn: High-performance async REST API.\n• Python 3.12: Native modern language runtime.\n• Pydantic v2: Strict data schema contract validation.\n• Turf.js / GeoJSON: In-memory spatial point-in-polygon.\n• AWS SDK (Boto3): S3 private archival in ap-south-1."),
        ("Agentic AI Core", "• LangGraph: Cyclic state graph orchestration.\n• Model Router: Intelligent cost/latency model dispatch.\n• Verifier Critic: Claude 3.5 Sonnet adversarial audit.\n• Multimodal Vision: Google Gemini 3.8 Flash.\n• Groq Whisper: Ultra-fast speech recognition LPU.")
    ]

    for i, (cat, details) in enumerate(tech_cards):
        x = 0.8 + i * (3.65 + 0.38)
        add_card(s6, x, 1.65, 3.65, 5.0)
        tb = s6.shapes.add_textbox(Inches(x + 0.2), Inches(1.85), Inches(3.25), Inches(4.5))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = cat
        p.font.size = Pt(15)
        p.font.bold = True
        p.font.color.rgb = C_FOREST
        p.space_after = Pt(14)

        for line in details.split('\n'):
            if line.strip():
                p_l = tf.add_paragraph()
                p_l.text = line
                p_l.font.size = Pt(10.5)
                p_l.font.color.rgb = C_BODY
                p_l.space_after = Pt(8)

    # =========================================================================
    # SLIDE 7: SATISFYING TASK 1 REQUIREMENTS
    # =========================================================================
    s7 = prs.slides.add_slide(blank_layout)
    add_header(s7, "6. Task 1 Compliance Matrix: Farmwise AI Challenge Rubric")

    t1_headers = ["Challenge Requirement", "Rubric Evaluation Criteria", "FarmWise AI Technical Implementation", "Status"]
    t1_rows = [
        ["1. Planning", "Autonomous decomposition of queries into logical sub-tasks", "LangGraph Planner Agent generates structured DAG execution plans.", "✓ Verified"],
        ["2. Multimodal Input", "Handles field images, survey nos, text, and voice queries", "Gemini 3.8 Flash Vision + Groq Whisper + Cadastral GeoJSON input.", "✓ Verified"],
        ["3. Multi-Agent Orchestration", "Independent agents with specialized domain roles", "Coordinated Geo, Image, Weather, Knowledge, and Verifier Agents.", "✓ Verified"],
        ["4. Model Routing", "Justified proprietary vs open-weight model usage", "Groq Whisper (fast edge) + Gemini (vision) + Claude (deep critique).", "✓ Verified"],
        ["5. Tool Calling", "Integration with real APIs and external calculators", "Open-Meteo API, Turf.js spatial calculation, AWS S3 image upload.", "✓ Verified"],
        ["6. Shared State", "Threaded contextual state passing across steps", "Unified FarmwiseState schema tracking execution artifacts across graph.", "✓ Verified"],
        ["7. Verification & Critic", "Adversarial auditing to intercept hallucinations", "Claude 3.5 Sonnet Verifier checks consistency; outputs audit score.", "✓ Verified"],
        ["8. Fallback Resilience", "Graceful handling of API rate limits or network drop", "Web Speech API fallback for voice; Bedrock Titan image fallback.", "✓ Verified"]
    ]

    table_shape_s7 = s7.shapes.add_table(len(t1_rows) + 1, 4, Inches(0.8), Inches(1.65), Inches(11.733), Inches(4.9))
    t_s7 = table_shape_s7.table
    t_s7.columns[0].width = Inches(2.2)
    t_s7.columns[1].width = Inches(3.4)
    t_s7.columns[2].width = Inches(4.8)
    t_s7.columns[3].width = Inches(1.333)

    for j, h in enumerate(t1_headers):
        cell = t_s7.cell(0, j)
        cell.text = h
        cell.fill.solid()
        cell.fill.fore_color.rgb = C_FOREST
        for p in cell.text_frame.paragraphs:
            p.alignment = PP_ALIGN.LEFT
            for r in p.runs:
                r.font.bold = True
                r.font.size = Pt(10)
                r.font.color.rgb = C_WHITE

    for i, row in enumerate(t1_rows):
        bg = C_CARD_BG if i % 2 == 1 else C_WHITE
        for j, val in enumerate(row):
            cell = t_s7.cell(i + 1, j)
            cell.text = val
            cell.fill.solid()
            cell.fill.fore_color.rgb = bg
            for p in cell.text_frame.paragraphs:
                p.alignment = PP_ALIGN.LEFT
                for r in p.runs:
                    r.font.size = Pt(9)
                    r.font.color.rgb = C_FOREST if j == 3 else (C_DARK if j == 0 else C_BODY)
                    if j in [0, 3]:
                        r.font.bold = True

    # =========================================================================
    # SLIDE 8: AWS UTILIZATION & CREDENTIALS
    # =========================================================================
    s8 = prs.slides.add_slide(blank_layout)
    add_header(s8, "7. AWS Integration & Event Account Compliance")

    aws_cards = [
        ("Strict Regional Lock: ap-south-1 (Mumbai)", 
         "• All cloud infrastructure is strictly confined to AWS Mumbai (ap-south-1) as mandated by contest rules.\n"
         "• Zero cross-region calls or unapproved service invocations.\n"
         "• Ensures low latency compliance for Indian data governance."),
        ("Allowed Services Enforcement", 
         "• S3: Dedicated bucket 'fai-tce-team06-crop-intel' for secure private field photo backup.\n"
         "• Bedrock: Titan Multimodal Embeddings & Ministral-8B models utilized for offline vector similarity.\n"
         "• IAM Compliance: Utilized pre-existing 'FAI-TCE-LambdaExecutionRole' with zero unauthorized role creations."),
        ("Budget Conservation & Safety", 
         "• Strictly operated within the $100 team budget allocation.\n"
         "• In-memory caching of cadastral polygons avoids expensive database compute hours.\n"
         "• Zero usage of expensive unapproved services (OpenSearch, RDS, EC2, Rekognition).")
    ]

    for i, (title, desc) in enumerate(aws_cards):
        y = 1.65 + i * (1.6 + 0.15)
        add_card(s8, 0.8, y, 11.733, 1.6)
        tb = s8.shapes.add_textbox(Inches(1.1), Inches(y + 0.15), Inches(11.1), Inches(1.3))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = C_FOREST
        p.space_after = Pt(4)

        for line in desc.split('\n'):
            if line.strip():
                p_l = tf.add_paragraph()
                p_l.text = line
                p_l.font.size = Pt(9.5)
                p_l.font.color.rgb = C_BODY
                p_l.space_after = Pt(2)

    # =========================================================================
    # SLIDE 9: COST ESTIMATION & MODEL ECONOMICS
    # =========================================================================
    s9 = prs.slides.add_slide(blank_layout)
    add_header(s9, "8. Cost Estimation, Model Economics & Budget Sustainability")

    cost_headers = ["Pipeline Component", "Engine / Model Used", "Tokens / Unit per Query", "Unit Rate ($)", "Cost per Advisory Run"]
    cost_rows = [
        ["Multimodal Crop Vision", "Gemini 3.8 Flash Vision", "258 image tokens + 450 prompt", "$0.075 / 1M tokens", "$0.00005"],
        ["Adversarial Verifier Critic", "Claude 3.5 Sonnet", "850 input + 320 output tokens", "$3.00/1M in, $15.00/1M out", "$0.00280"],
        ["Tamil Voice Transcription", "Groq Whisper Large v3", "4.2 seconds audio blob", "$0.040 / audio hour", "$0.00004"],
        ["Tamil Advisory Translation", "Gemini 3.1 Flash Lite", "380 input + 240 output tokens", "$0.0375 / 1M tokens", "$0.00003"],
        ["Micro-Climate & Spray Window", "Open-Meteo API", "1 WMO Agro-Met query", "Free Public API", "$0.00000"],
        ["Field Photograph Archival", "AWS S3 ap-south-1", "1 PUT request (~1.2 MB JPG)", "$0.005 / 1,000 PUTs", "$0.00001"],
        ["TOTAL ESTIMATED COST", "Full End-to-End Run", "Complete 8-Step Multi-Agent Execution", "Sub-Penny Economics", "$0.00293 (~0.24 INR)"]
    ]

    t_s9_shape = s9.shapes.add_table(len(cost_rows) + 1, 5, Inches(0.8), Inches(1.65), Inches(11.733), Inches(4.3))
    t_s9 = t_s9_shape.table
    t_s9.columns[0].width = Inches(2.5)
    t_s9.columns[1].width = Inches(2.5)
    t_s9.columns[2].width = Inches(2.7)
    t_s9.columns[3].width = Inches(2.2)
    t_s9.columns[4].width = Inches(1.833)

    for j, h in enumerate(cost_headers):
        cell = t_s9.cell(0, j)
        cell.text = h
        cell.fill.solid()
        cell.fill.fore_color.rgb = C_FOREST
        for p in cell.text_frame.paragraphs:
            p.alignment = PP_ALIGN.LEFT
            for r in p.runs:
                r.font.bold = True
                r.font.size = Pt(9.5)
                r.font.color.rgb = C_WHITE

    for i, row in enumerate(cost_rows):
        is_total = (i == len(cost_rows) - 1)
        bg = RGBColor(220, 252, 231) if is_total else (C_CARD_BG if i % 2 == 1 else C_WHITE)
        for j, val in enumerate(row):
            cell = t_s9.cell(i + 1, j)
            cell.text = val
            cell.fill.solid()
            cell.fill.fore_color.rgb = bg
            for p in cell.text_frame.paragraphs:
                p.alignment = PP_ALIGN.LEFT
                for r in p.runs:
                    r.font.size = Pt(9.5 if is_total else 9)
                    r.font.color.rgb = C_FOREST if is_total else C_DARK
                    if is_total or j == 0:
                        r.font.bold = True

    # Callout bottom
    add_card(s9, 0.8, 6.15, 11.733, 0.75, bg_color=C_CARD_BG, border_color=C_MINT)
    tb_bot = s9.shapes.add_textbox(Inches(1.0), Inches(6.2), Inches(11.3), Inches(0.65))
    tf_b = tb_bot.text_frame
    p_b = tf_b.paragraphs[0]
    p_b.text = "★ BUDGET VIABILITY: At ~0.24 INR per advisory, the $100 (approx. ₹8,300) event budget supports over 34,000 comprehensive farmer advisory runs!"
    p_b.font.size = Pt(10)
    p_b.font.bold = True
    p_b.font.color.rgb = C_FOREST

    # =========================================================================
    # SLIDE 10: CORE WEBSITE FEATURES
    # =========================================================================
    s10 = prs.slides.add_slide(blank_layout)
    add_header(s10, "9. Key Application Features Built for Farmers & Officers")

    feats = [
        ("Interactive Cadastral Map", "Vector polygon boundary overlay for 14,643 survey numbers, sub-division delineation, dynamic zoom controls, and centroid pins."),
        ("Multimodal Crop Phenotype Card", "Computer vision diagnosis displaying detected crop, growth stage, canopy observations, confidence score, and high-res photo modal."),
        ("Micro-Climate Weather Card", "Hyper-local temperature, humidity, wind velocity, and calculated agronomic safe spray windows to prevent pesticide drift."),
        ("Advisory & Verification Badge", "Personalized chemical/organic fertilizer dosages, market selling recommendations, and a 96% AI Verified tamper badge."),
        ("AI Decision Trace Modal", "Full chronological execution log exposing every agent's thought process, tools called, and verifier critique for total transparency."),
        ("Government-Format PDF Print", "Clean, single-click printable audit document with Tamil Nadu Land Record breadcrumbs and PM-FASAL BIMA Yojna formatting.")
    ]

    for i, (title, desc) in enumerate(feats):
        row = i // 2
        col = i % 2
        x = 0.8 + col * (5.7 + 0.33)
        y = 1.65 + row * (1.6 + 0.15)

        add_card(s10, x, y, 5.7, 1.6)
        tb = s10.shapes.add_textbox(Inches(x + 0.25), Inches(y + 0.15), Inches(5.2), Inches(1.3))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = C_FOREST
        p.space_after = Pt(4)

        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.size = Pt(10)
        p2.font.color.rgb = C_BODY

    # =========================================================================
    # SLIDE 11: PROTOTYPE SCREENSHOTS (PARCEL MAP & DASHBOARD)
    # =========================================================================
    s11 = prs.slides.add_slide(blank_layout)
    add_header(s11, "10. Prototype Walkthrough: Parcel Intelligence & Spatial Map")

    # 2 Big screenshot placeholders
    box_w = 5.65
    box_h = 4.8
    y_s = 1.7

    # Box 1
    add_card(s11, 0.8, y_s, box_w, box_h, bg_color=C_LIGHT_BG, border_color=C_MUTED)
    tb11_1 = s11.shapes.add_textbox(Inches(1.0), Inches(y_s + 0.3), Inches(box_w - 0.4), Inches(box_h - 0.6))
    tf11_1 = tb11_1.text_frame
    tf11_1.word_wrap = True
    p = tf11_1.paragraphs[0]
    p.text = "PROTOTYPE SCREENSHOT 1\n[ CADASTRAL PARCEL MAP & SEARCH ]"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = C_FOREST
    p.space_after = Pt(8)
    p2 = tf11_1.add_paragraph()
    p2.text = "• Leaflet interactive map with authentic Sivagiri cadastral polygon.\n• Survey search with Tamil/English auto-completion.\n• Centroid pin: Lat 9.2463° N, Lon 77.3798° E.\n• Real-time map zoom & recenter controls."
    p2.font.size = Pt(9.5)
    p2.font.color.rgb = C_BODY
    p3 = tf11_1.add_paragraph()
    p3.text = "\n[ INSERT SCREENSHOT OF HOMEPAGE & PARCEL MAP HERE ]"
    p3.font.size = Pt(11)
    p3.font.bold = True
    p3.font.color.rgb = C_MUTED
    p3.alignment = PP_ALIGN.CENTER

    # Box 2
    add_card(s11, 6.88, y_s, box_w, box_h, bg_color=C_LIGHT_BG, border_color=C_MUTED)
    tb11_2 = s11.shapes.add_textbox(Inches(7.08), Inches(y_s + 0.3), Inches(box_w - 0.4), Inches(box_h - 0.6))
    tf11_2 = tb11_2.text_frame
    tf11_2.word_wrap = True
    p = tf11_2.paragraphs[0]
    p.text = "PROTOTYPE SCREENSHOT 2\n[ ADVISORY & MICRO-CLIMATE DASHBOARD ]"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = C_FOREST
    p.space_after = Pt(8)
    p2 = tf11_2.add_paragraph()
    p2.text = "• AI Verified badge (96% confidence).\n• Hyper-local weather metrics with safe spray window.\n• Prioritized agricultural task checklist.\n• Tamil Nadu Land Records breadcrumb navigation."
    p2.font.size = Pt(9.5)
    p2.font.color.rgb = C_BODY
    p3 = tf11_2.add_paragraph()
    p3.text = "\n[ INSERT SCREENSHOT OF DASHBOARD & ADVISORY CARDS HERE ]"
    p3.font.size = Pt(11)
    p3.font.bold = True
    p3.font.color.rgb = C_MUTED
    p3.alignment = PP_ALIGN.CENTER

    # =========================================================================
    # SLIDE 12: PROTOTYPE SCREENSHOTS (VISION & DECISION TRACE)
    # =========================================================================
    s12 = prs.slides.add_slide(blank_layout)
    add_header(s12, "11. Prototype Walkthrough: Multimodal Vision & Decision Trace")

    # Box 1
    add_card(s12, 0.8, y_s, box_w, box_h, bg_color=C_LIGHT_BG, border_color=C_MUTED)
    tb12_1 = s12.shapes.add_textbox(Inches(1.0), Inches(y_s + 0.3), Inches(box_w - 0.4), Inches(box_h - 0.6))
    tf12_1 = tb12_1.text_frame
    tf12_1.word_wrap = True
    p = tf12_1.paragraphs[0]
    p.text = "PROTOTYPE SCREENSHOT 3\n[ CROP PHENOTYPING & FIELD PHOTO MODAL ]"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = C_FOREST
    p.space_after = Pt(8)
    p2 = tf12_1.add_paragraph()
    p2.text = "• Gemini 3.8 Flash multimodal computer vision analysis.\n• Detected crop: Paddy (Oryza sativa) at tillering stage.\n• Visual canopy canopy observations & chlorophyll reflectance.\n• Click-to-enlarge modal with survey geotag reference."
    p2.font.size = Pt(9.5)
    p2.font.color.rgb = C_BODY
    p3 = tf12_1.add_paragraph()
    p3.text = "\n[ INSERT SCREENSHOT OF CROP CARD & PHOTO MODAL HERE ]"
    p3.font.size = Pt(11)
    p3.font.bold = True
    p3.font.color.rgb = C_MUTED
    p3.alignment = PP_ALIGN.CENTER

    # Box 2
    add_card(s12, 6.88, y_s, box_w, box_h, bg_color=C_LIGHT_BG, border_color=C_MUTED)
    tb12_2 = s12.shapes.add_textbox(Inches(7.08), Inches(y_s + 0.3), Inches(box_w - 0.4), Inches(box_h - 0.6))
    tf12_2 = tb12_2.text_frame
    tf12_2.word_wrap = True
    p = tf12_2.paragraphs[0]
    p.text = "PROTOTYPE SCREENSHOT 4\n[ AI DECISION TRACE & VERIFIER AUDIT ]"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = C_FOREST
    p.space_after = Pt(8)
    p2 = tf12_2.add_paragraph()
    p2.text = "• Complete chronological agent execution log.\n• Tool execution inputs & raw outputs.\n• Claude 3.5 Sonnet Verifier Critic critique remarks.\n• Printable Government Audit PDF export ready."
    p2.font.size = Pt(9.5)
    p2.font.color.rgb = C_BODY
    p3 = tf12_2.add_paragraph()
    p3.text = "\n[ INSERT SCREENSHOT OF DECISION TRACE MODAL / PRINT VIEW HERE ]"
    p3.font.size = Pt(11)
    p3.font.bold = True
    p3.font.color.rgb = C_MUTED
    p3.alignment = PP_ALIGN.CENTER

    # =========================================================================
    # SLIDE 13: LIMITATIONS
    # =========================================================================
    s13 = prs.slides.add_slide(blank_layout)
    add_header(s13, "12. Current System Limitations & Boundary Constraints")

    limits = [
        ("1. Image Quality & Lighting Variability", 
         "Poorly lit or blurry smartphone photos taken at dawn/dusk can reduce Gemini Vision's phenological stage detection accuracy below 70%."),
        ("2. Cloud Cover on Optical Satellite Tiles", 
         "During intense monsoon periods in Tamil Nadu, underlying OpenStreetMap satellite raster tiles may experience intermittent cloud obscuration."),
        ("3. Sub-Division Revenue Lag", 
         "Informal partition of survey parcels among family heirs without updated sub-division revenue survey records may cause boundary discrepancies."),
        ("4. GPS Drift on Low-End Smartphones", 
         "Budget Android devices in rural areas can exhibit 15–30 meter GPS inaccuracy, occasionally requiring manual survey number confirmation.")
    ]

    for i, (title, desc) in enumerate(limits):
        row = i // 2
        col = i % 2
        x = 0.8 + col * (5.7 + 0.33)
        y = 1.8 + row * (2.2 + 0.3)

        add_card(s13, x, y, 5.7, 2.2)
        tb = s13.shapes.add_textbox(Inches(x + 0.25), Inches(y + 0.2), Inches(5.2), Inches(1.8))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = C_FOREST
        p.space_after = Pt(6)

        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.size = Pt(10.5)
        p2.font.color.rgb = C_BODY

    # =========================================================================
    # SLIDE 14: FUTURE IMPROVEMENTS & WORK
    # =========================================================================
    s14 = prs.slides.add_slide(blank_layout)
    add_header(s14, "13. Future Roadmap: Scaling to 38 Districts & Production")

    future_items = [
        ("1. Automated Sentinel-2 Satellite NDVI Tracking", "Integrate ESA Copernicus Sentinel-2 10-meter multispectral satellite imagery to compute weekly Normalized Difference Vegetation Index (NDVI) time-series without requiring farmer photos."),
        ("2. WhatsApp & Telegram Voice Note Bot", "Deploy a conversational WhatsApp Business webhook where a farmer sends a voice note and receives an automated audio advisory in colloquial Tamil within 5 seconds."),
        ("3. On-Device Edge AI (WebAssembly PWA)", "Compile quantized vision & language models (MobileNetV4 + Gemma-2B ONNX) to execute 100% offline inside the browser with zero internet connectivity."),
        ("4. IoT LoRaWAN Soil Moisture Integration", "Connect low-cost capacitive soil moisture probes and field rain gauges to trigger automated precision irrigation alerts.")
    ]

    for i, (title, desc) in enumerate(future_items):
        row = i // 2
        col = i % 2
        x = 0.8 + col * (5.7 + 0.33)
        y = 1.8 + row * (2.2 + 0.3)

        add_card(s14, x, y, 5.7, 2.2)
        tb = s14.shapes.add_textbox(Inches(x + 0.25), Inches(y + 0.2), Inches(5.2), Inches(1.8))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = C_FOREST
        p.space_after = Pt(6)

        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.size = Pt(10.5)
        p2.font.color.rgb = C_BODY

    # =========================================================================
    # SLIDE 15: CONCLUSION & IMPACT
    # =========================================================================
    s15 = prs.slides.add_slide(blank_layout)
    add_header(s15, "14. Conclusion: Transforming Agriculture with Trust & Intelligence")

    concl_points = [
        ("Hyper-Local & Verified", "FarmWise AI eliminates the peril of generic and hallucinated agricultural advice by grounding every turn in official cadastral revenue boundaries and TNAU agronomic guidelines."),
        ("Engineered for Farmers", "Voice-first Tamil interaction (Groq Whisper in 320ms), high-contrast touch design, and zero required app downloads ensure immediate adoption among smallholders."),
        ("Frugal & Cost-Sustainable", "At under $0.003 (~0.24 INR) per full pipeline run, the architecture is commercially viable for government rollouts, FPOs, and crop insurance providers across all 38 districts of Tamil Nadu.")
    ]

    for i, (head, body) in enumerate(concl_points):
        y = 1.7 + i * (1.6 + 0.15)
        add_card(s15, 0.8, y, 11.733, 1.6)
        tb = s15.shapes.add_textbox(Inches(1.1), Inches(y + 0.2), Inches(11.1), Inches(1.2))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = f"★ {head}"
        p.font.size = Pt(14)
        p.font.bold = True
        p.font.color.rgb = C_FOREST
        p.space_after = Pt(4)

        p2 = tf.add_paragraph()
        p2.text = body
        p2.font.size = Pt(10.5)
        p2.font.color.rgb = C_BODY

    # =========================================================================
    # SLIDE 16: THANK YOU & Q&A
    # =========================================================================
    s16 = prs.slides.add_slide(blank_layout)
    bg16 = s16.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
    bg16.fill.solid()
    bg16.fill.fore_color.rgb = C_FOREST
    bg16.line.fill.background()

    inner16 = s16.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.8), Inches(11.733), Inches(5.9))
    inner16.fill.solid()
    inner16.fill.fore_color.rgb = RGBColor(4, 58, 44)
    inner16.line.color.rgb = C_MINT
    inner16.line.width = Pt(1.5)

    tb16 = s16.shapes.add_textbox(Inches(1.2), Inches(1.8), Inches(11), Inches(4.0))
    tf16 = tb16.text_frame
    tf16.word_wrap = True

    p = tf16.paragraphs[0]
    p.text = "நன்றி  •  THANK YOU"
    p.font.size = Pt(40)
    p.font.bold = True
    p.font.color.rgb = C_WHITE
    p.space_after = Pt(14)

    p = tf16.add_paragraph()
    p.text = "FarmwiseAI Agentic Agriculture Intelligence Platform"
    p.font.size = Pt(20)
    p.font.bold = True
    p.font.color.rgb = C_MINT
    p.space_after = Pt(20)

    p = tf16.add_paragraph()
    p.text = "Team ID: FAI-TCE-Team06   |   Task 1: Multi-Model, Multimodal & Agentic AI System\nOpen for Questions, Live Architecture Inspection & Evaluator Defense"
    p.font.size = Pt(13)
    p.font.color.rgb = RGBColor(209, 250, 229) # Mint 100

    # Save presentation
    filename = "FarmWise_AI_Hackathon_Review_Presentation.pptx"
    prs.save(filename)
    print(f"Presentation successfully created: {filename}")

if __name__ == "__main__":
    create_deck()
