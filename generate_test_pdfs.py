from fpdf import FPDF

# PDF 1: Solar System (improved)
pdf1 = FPDF()
pdf1.add_page()
pdf1.set_font("Arial", "", 12)
pdf1.multi_cell(
    0,
    10,
    (
        "This is PDF 1. It contains information about the solar system.\n\n"
        "The Sun is the center of our solar system. The largest planet is Jupiter. The smallest planet is Mercury.\n\n"
        "The solar system is heliocentric, meaning the Sun is at the center and all planets revolve around it.\n\n"
        "The heliocentric model was first proposed by Copernicus."
    ),
)
pdf1.output("./data/solar_system.pdf")

# PDF 2: Artists (improved)
pdf2 = FPDF()
pdf2.add_page()
pdf2.set_font("Arial", "", 12)
pdf2.multi_cell(
    0,
    10,
    (
        "This is PDF 2. It contains information about famous artists.\n\n"
        "Leonardo da Vinci painted the Mona Lisa. Vincent van Gogh painted Starry Night. Pablo Picasso was a founder of Cubism.\n\n"
        "The Renaissance was a period of great artistic achievement in Europe, and Leonardo da Vinci was one of its most famous artists.\n\n"
        "The Renaissance influenced art, science, and culture across the continent."
    ),
)
pdf2.output("./data/artists.pdf")
