
import re
with open("src/layouts/MainLayout.jsx", "r", encoding="utf-8") as f:
    c = f.read()

target = r"(<NavItem\s+to=\"/admin\"\s+icon=\{ShieldCheck\}\s+label=\"Command Center\"\s+currentPath=\{location\.pathname\}\s+onClick=\{closeMenu\}\s+/>)"

replacement = r"""\1
                  <NavItem
                    to="/admin/setup"
                    icon={Settings}
                    label="Bot Setup"
                    currentPath={location.pathname}
                    onClick={closeMenu}
                  />
                  <NavItem
                    to="/admin/trading-bot"
                    icon={Activity}
                    label="Trading Bot"
                    currentPath={location.pathname}
                    onClick={closeMenu}
                  />"""

new_c = re.sub(target, replacement, c)

if new_c != c:
    with open("src/layouts/MainLayout.jsx", "w", encoding="utf-8") as f:
        f.write(new_c)
    print("Replaced successfully!")
else:
    print("Failed to replace using regex!")

