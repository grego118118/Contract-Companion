import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, ChevronDown, Menu, X } from "lucide-react";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const navItems = [
    { title: "Home", href: "/" },
    { title: "My Contracts", href: "/my-contracts" },
    { title: "Blog", href: "/blog" },
    { title: "About", href: "/about" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <nav className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <FileText className="text-primary text-2xl" />
          <Link href="/" className="text-xl font-merriweather font-bold">
            Contract<span className="text-secondary">Companion</span>
          </Link>
        </div>

        <div className="hidden md:flex items-center space-x-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`font-source font-semibold transition ${
                location === item.href
                  ? "text-primary"
                  : "text-foreground hover:text-primary"
              }`}
            >
              {item.title}
            </Link>
          ))}
        </div>

        <div className="flex items-center space-x-4">
          {isLoading ? (
            <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
          ) : isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <img
                    src={user?.profileImageUrl || "https://ui-avatars.com/api/?name=User"}
                    alt="User profile"
                    className="w-8 h-8 rounded-full object-cover border border-gray-200"
                  />
                  <span className="hidden md:block text-sm font-semibold">
                    {user?.firstName || "User"}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/my-contracts">My Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/my-contracts">My Contracts</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a href="/api/logout" className="text-secondary">
                    Sign Out
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-2">
              <a
                href="/api/login"
                className="text-primary font-semibold text-sm hover:underline hidden md:block"
              >
                Log In
              </a>
              <a
                href="/api/login"
                className="bg-primary text-white font-semibold text-sm px-4 py-2 rounded-md hover:bg-primary/90 transition"
              >
                Sign Up
              </a>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={toggleMobileMenu}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 py-3 px-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block py-2 font-semibold ${
                location === item.href
                  ? "text-primary"
                  : "text-foreground"
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.title}
            </Link>
          ))}
          {!isAuthenticated && (
            <a
              href="/api/login"
              className="block py-2 font-semibold text-primary"
            >
              Log In
            </a>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
