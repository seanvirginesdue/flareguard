export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-10">
      <div className="max-w-7xl mx-auto px-4 grid gap-8 text-center md:text-left md:grid-cols-3">
        
        <div>
          <h3 className="text-xl font-bold text-red-500 mb-2">
            Fire Department
          </h3>
          <p className="text-sm text-gray-400">
            Protecting lives, property, and our community with courage and
            commitment.
          </p>
        </div>

       
        <div>
          <h4 className="text-lg font-semibold mb-2">Quick Links</h4>
          <ul className="space-y-1 text-sm text-gray-300">
            <li>
              <a href="/" className="hover:text-red-400 transition">
                Home
              </a>
            </li>
            <li>
              <a href="#about" className="hover:text-red-400 transition">
                About
              </a>
            </li>
            <li>
              <a href="/admin-login" className="hover:text-red-400 transition">
                Admin Login
              </a>
            </li>
          </ul>
        </div>

        
        <div>
          <h4 className="text-lg font-semibold mb-2">Contact Us</h4>
          <p className="text-sm text-gray-400">
            arayatfirestn@yahoo.com
            <br />
            BFP Arayat Fire Station, Municipal Hall Compound, Brgy. Plazang
            Luma, Arayat, Philippines
            <br />
            Phone: (0998) 215 0990
          </p>
        </div>
      </div>

      <div className="mt-10 border-t border-gray-700 pt-6 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} FlareGuard. All rights reserved.
      </div>
    </footer>
  );
}
