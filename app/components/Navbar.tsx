"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="bg-white shadow sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-red-600">ARAYAT BFP</h1>

      
        <ul className="hidden md:flex space-x-6 text-gray-700 font-medium">
          <li><Link href="/">Home</Link></li>
          <li><Link href="#about">About</Link></li>
          <li><Link href="#contact">Contact</Link></li>
          <li>
            <Link
              href="/admin-login"
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition duration-300"
            >
              Admin
            </Link>
          </li>
        </ul>

        
        <button
          className="md:hidden text-gray-700"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

     
      {open && (
        <div className="md:hidden bg-white shadow px-4 pb-4">
          <ul className="space-y-4 text-gray-700 font-medium">
            <li><Link href="/">Home</Link></li>
            <li><Link href="#about">About</Link></li>
            
            <li>
              <Link
                href="/admin-login"
                className="block bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition duration-300 text-center"
              >
                Admin
              </Link>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
}
