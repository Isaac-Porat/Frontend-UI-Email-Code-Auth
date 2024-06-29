import React from 'react';
import { Link } from "react-router-dom";
import { RxComponentBoolean } from "react-icons/rx";
import { useAuth } from '../Auth/AuthContext';
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white dark:bg-gray-900 fixed w-full z-20 top-0 start-0 border-b border-gray-200 dark:border-gray-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center space-x-1 rtl:space-x-reverse">
              <RxComponentBoolean className="w-8 h-8 text-green-600"/>
              <span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">SaaS</span>
            </Link>
          </div>

          {/* Right side elements */}
          <div className="flex items-center space-x-4">
            {/* Navigation Links */}
            <Link to="/product" className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium">
              Product
            </Link>
            <Link to="/pricing" className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium">
              Pricing
            </Link>
            <Link to="/contact" className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium">
              Contact us
            </Link>

            {/* Account Button */}
            {user ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700 text-white">Account</Button>
                </PopoverTrigger>
                <PopoverContent className="w-56">
                  <div className="grid gap-4">
                    <Button onClick={logout} variant="outline">Log out</Button>
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              <Link to="/auth">
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  Sign up
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;