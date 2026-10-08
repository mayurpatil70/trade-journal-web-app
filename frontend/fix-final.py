
with open("src/pages/Backtest.jsx", "r", encoding="utf-8") as f:
    c = f.read()

target = "          )}\n        </div>\n      </div>\n\n      <div className=\"h-8 border-t border-[#1B1C20] flex items-center justify-between px-3 shrink-0\">"
rep = "          )}\n        </div>\n        )}\n      </div>\n\n      <div className=\"h-8 border-t border-[#1B1C20] flex items-center justify-between px-3 shrink-0\">"

if target in c:
    c = c.replace(target, rep)
    with open("src/pages/Backtest.jsx", "w", encoding="utf-8") as f:
        f.write(c)
    print("Replaced!")
else:
    print("Not found")

