
with open("src/layouts/MainLayout.jsx", "r", encoding="utf-8") as f:
    c = f.read()

target = """                  <NavItem
                    to="/admin"
                    icon={ShieldCheck}
                    label="Command Center"
                    currentPath={location.pathname}
                    onClick={closeMenu}
                  />"""

replacement = """                  <NavItem
                    to="/admin"
                    icon={ShieldCheck}
                    label="Command Center"
                    currentPath={location.pathname}
                    onClick={closeMenu}
                  />
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

if target in c:
    c = c.replace(target, replacement)
    with open("src/layouts/MainLayout.jsx", "w", encoding="utf-8") as f:
        f.write(c)
    print("Replaced!")
else:
    print("Target not found.")

