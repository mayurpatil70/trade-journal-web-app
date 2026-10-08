
with open("src/pages/Backtest.jsx", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace(
    "<input type=\"date\" title=\"Jump to date\" onChange={(e) => jumpToDate(e.target.value)} className=\"bg-[#0A0B0D] border border-[#222429] rounded px-1 py-0.5 text-[#D1D4DC]\" />\n            </div>",
    "<input type=\"date\" title=\"Jump to date\" onChange={(e) => jumpToDate(e.target.value)} className=\"bg-[#0A0B0D] border border-[#222429] rounded px-1 py-0.5 text-[#D1D4DC]\" />\n              {!isReadonlyReplay && !showRightPane && (\n                <button title=\"Toggle Panel\" className=\"text-[#787B86] hover:text-white ml-2 border-l border-[#222429] pl-3 md:hidden\" onClick={() => setShowRightPane(true)}>\n                  <Activity className=\"w-4 h-4\" />\n                </button>\n              )}\n            </div>"
)

with open("src/pages/Backtest.jsx", "w", encoding="utf-8") as f:
    f.write(c)

