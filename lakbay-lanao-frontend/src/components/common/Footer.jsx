import {
  FaFacebookF,
  FaInstagram,
  FaMapMarkerAlt,
  FaEnvelope,
} from "react-icons/fa";

function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-300">
      <div className="max-w-7xl mx-auto px-6 py-14 grid md:grid-cols-3 gap-10">
        {/* BRAND */}
        <div>
          <h2 className="text-xl font-semibold text-white">
            Lakbay Lanao
          </h2>

          <p className="text-sm text-gray-400 mt-4 leading-relaxed">
            A digital tourism guide for exploring destinations, establishments,
            cultural heritage sites, and travel experiences in Lanao del Sur.
          </p>

          <div className="flex gap-4 mt-6 text-lg">
            <a className="hover:text-white transition cursor-pointer">
              <FaFacebookF />
            </a>

            <a className="hover:text-white transition cursor-pointer">
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
              Cultural Heritage Sites
            </li>

            <li className="hover:text-white transition cursor-pointer">
              Interactive Map
            </li>

            <li className="hover:text-white transition cursor-pointer">
              Multimedia Gallery
            </li>

            <li className="hover:text-white transition cursor-pointer">
              Itinerary Builder
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
              Provincial Tourism Office, Lanao del Sur
            </li>

            <li className="flex items-center gap-3">
              <FaEnvelope />
              tourism.office@example.com
            </li>
          </ul>

          <div className="mt-6 text-sm text-gray-500">
            Department of Tourism · BARMM · Province of Lanao del Sur
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800 text-center py-6 text-sm text-gray-500">
        © {new Date().getFullYear()} Lakbay Lanao. All Rights Reserved.
      </div>
    </footer>
  );
}

export default Footer;