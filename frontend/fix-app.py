
import sys
with open("src/App.jsx", "r", encoding="utf-8") as f:
    c = f.read()

target = """const AdminGuard = () => {
    const userId = localStorage.getItem("userId") || localStorage.getItem("userEmail");
    if (userId === "noballondesk@gmail.com" || userId === "akpatil51340@gmail.com") {
      return <Outlet />;
    }
    return <Navigate to="/dashboard" replace />;
  };"""

replacement = """const AdminGuard = () => {
    const userId = localStorage.getItem("userId") || "";
    const userEmail = (localStorage.getItem("userEmail") || "").toLowerCase().trim();
    if (
      userId === "noballondesk@gmail.com" || 
      userId === "akpatil51340@gmail.com" ||
      userEmail === "noballondesk@gmail.com" || 
      userEmail === "akpatil51340@gmail.com"
    ) {
      return <Outlet />;
    }
    return <Navigate to="/dashboard" replace />;
  };"""

if target in c:
    c = c.replace(target, replacement)
    with open("src/App.jsx", "w", encoding="utf-8") as f:
        f.write(c)
    print("Replaced!")
else:
    print("Not found")

