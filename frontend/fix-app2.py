
import re
with open("src/App.jsx", "r", encoding="utf-8") as f:
    c = f.read()

target = r"const AdminGuard = \(\) => \{\s+const userId = localStorage\.getItem\(\"userId\"\) \|\| localStorage\.getItem\(\"userEmail\"\);\s+if \(userId === \"noballondesk@gmail\.com\" \|\| userId === \"akpatil51340@gmail\.com\"\) \{\s+return <Outlet />;\s+\}\s+return <Navigate to=\"/dashboard\" replace />;\s+\};"

replacement = """const AdminGuard = () => {
    const id = localStorage.getItem("userId") || "";
    const email = (localStorage.getItem("userEmail") || "").toLowerCase().trim();
    if (
      id === "noballondesk@gmail.com" || 
      id === "akpatil51340@gmail.com" || 
      email === "noballondesk@gmail.com" || 
      email === "akpatil51340@gmail.com"
    ) {
      return <Outlet />;
    }
    return <Navigate to="/dashboard" replace />;
  };"""

new_c = re.sub(target, replacement, c)

if new_c != c:
    with open("src/App.jsx", "w", encoding="utf-8") as f:
        f.write(new_c)
    print("Replaced successfully!")
else:
    print("Failed to replace using regex!")

