
with open("src/pages/Backtest.jsx", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace(
    "          </div>\n        </div>\n\n      <div className=\"h-8 border-t border-[#1B1C20] flex items-center justify-between px-3 shrink-0\">",
    "          </div>\n        )}\n        </div>\n\n      <div className=\"h-8 border-t border-[#1B1C20] flex items-center justify-between px-3 shrink-0\">"
)

with open("src/pages/Backtest.jsx", "w", encoding="utf-8") as f:
    f.write(c)

