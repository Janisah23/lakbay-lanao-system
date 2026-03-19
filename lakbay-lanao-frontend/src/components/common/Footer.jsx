import {
  FaFacebookF,
  FaInstagram,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope
} from "react-icons/fa";

function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-300 mt-20">

      {/* MAIN FOOTER */}
      <div className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-4 gap-12">

        {/* BRAND */}
        <div>
          <h2 className="text-xl font-semibold text-white">
            Lakbay Lanao
          </h2>

          <p className="text-sm text-gray-400 mt-4 leading-relaxed">
            Discover the natural beauty, culture, and destinations of
            Lanao del Sur through Lakbay Lanao — your interactive tourism guide.
          </p>

          {/* SOCIAL MEDIA */}
          <div className="flex gap-4 mt-6 text-lg">

            <a className="hover:text-white transition">
              <FaFacebookF />
            </a>

            <a className="hover:text-white transition">
              <FaInstagram />
            </a>

          

          </div>
        </div>


        {/* EXPLORE */}
        <div>
          <h3 className="text-white font-semibold mb-5">
            Explore
          </h3>

          <ul className="space-y-3 text-sm text-gray-400">

            <li className="hover:text-white transition cursor-pointer">
              Destinations
            </li>

            <li className="hover:text-white transition cursor-pointer">
              Establishments
            </li>

            <li className="hover:text-white transition cursor-pointer">
              Cultural Heritage
            </li>

            <li className="hover:text-white transition cursor-pointer">
              Interactive Map
            </li>

            <li className="hover:text-white transition cursor-pointer">
              Gallery
            </li>

          </ul>
        </div>


        {/* SUPPORT */}
        <div>
          <h3 className="text-white font-semibold mb-5">
            Support
          </h3>

          <ul className="space-y-3 text-sm text-gray-400">

            <li className="hover:text-white transition cursor-pointer">
              FAQs
            </li>

            <li className="hover:text-white transition cursor-pointer">
              Contact Us
            </li>

            <li className="hover:text-white transition cursor-pointer">
              Privacy Policy
            </li>

            <li className="hover:text-white transition cursor-pointer">
              Terms of Service
            </li>

          </ul>
        </div>


        {/* CONTACT */}
        <div>
          <h3 className="text-white font-semibold mb-5">
            Contact
          </h3>

          <ul className="space-y-4 text-sm text-gray-400">

            <li className="flex items-center gap-3">
              <FaMapMarkerAlt />
              Marawi City, Lanao del Sur
            </li>

            <li className="flex items-center gap-3">
              <FaPhoneAlt />
              +63 912 345 6789
            </li>

            <li className="flex items-center gap-3">
              <FaEnvelope />
              lakbaylanao.tourism@gmail.com
            </li>

          </ul>
        </div>

      </div>


      {/* NEWSLETTER */}
      <div className="border-t border-gray-800 py-10">

        <div className="max-w-4xl mx-auto text-center px-6">

          <h3 className="text-white text-lg font-semibold">
            Stay Updated
          </h3>

          <p className="text-gray-400 text-sm mt-2">
            Subscribe to receive tourism updates and travel highlights in Lanao del Sur.
          </p>

          <div className="flex flex-col md:flex-row gap-4 justify-center mt-6">

            <input
              type="email"
              placeholder="Enter your email"
              className="px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 text-sm outline-none w-full md:w-72"
            />

            <button className="bg-blue-600 hover:bg-blue-700 transition px-6 py-3 rounded-lg text-white text-sm font-medium">
              Subscribe
            </button>

          </div>

        </div>

      </div>


   
      <div className="border-t border-gray-800 py-10">

        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-10 opacity-70">

          <span className="text-sm">Department of Tourism</span>
          <span className="text-sm">BARMM</span>
          <span className="text-sm">Province of Lanao del Sur</span>

        </div>

      </div>


  
      <div className="border-t border-gray-800 text-center py-6 text-sm text-gray-500">

        © {new Date().getFullYear()} Lakbay Lanao. All Rights Reserved.

      </div>

    </footer>
  );
}

export default Footer;