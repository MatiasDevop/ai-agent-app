import { Button } from "./ui/button";
import { HamburgerMenuIcon } from "@radix-ui/react-icons";

function Header() {
  return (
    <header className="border-b border-gray-200/50 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon">
            <HamburgerMenuIcon className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}

export default Header;
