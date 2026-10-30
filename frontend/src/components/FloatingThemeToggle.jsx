import ThemeToggle from "./ThemeToggle";

export default function FloatingThemeToggle() {
  return (
    <div className="fixed top-4 right-4 sm:top-5 sm:right-6 z-[9000]">
      <ThemeToggle />
    </div>
  );
}
