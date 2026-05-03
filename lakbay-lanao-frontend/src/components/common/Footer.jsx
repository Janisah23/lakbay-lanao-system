import { useNavigate } from "react-router-dom";
import {
  FaFacebookF,
  FaInstagram,
  FaMapMarkerAlt,
  FaEnvelope,
} from "react-icons/fa";

function Footer() {
  const navigate = useNavigate();

  const footerLinks = [
    { label: "Destinations", path: "/destinations" },
    { label: "Establishments", path: "/establishments" },
    { label: "Cultural Heritage Sites", path: "/cultural" },
    { label: "Interactive Map", path: "/map" },
    { label: "Multimedia Gallery", path: "/gallery" },
    { label: "Itinerary Builder", path: "/itinerary" },
  ];

  return (
    <footer className="bg-gray-950 text-gray-300">
      <div className="max-w-7xl mx-auto px-6 py-14 grid md:grid-cols-3 gap-10">
        {/* BRAND */}
        <div>
          <h2
            onClick={() => navigate("/")}
            className="text-xl font-semibold text-white cursor-pointer"
          >
            Lakbay Lanao
          </h2>

          <p className="text-sm text-gray-400 mt-4 leading-relaxed">
            A digital tourism guide for exploring destinations, establishments,
            cultural heritage sites, and travel experiences in Lanao del Sur.
          </p>

          <div className="flex gap-4 mt-6 text-lg">
            <a
              href="https://www.facebook.com/arawnglanao"
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
              className="hover:text-white transition cursor-pointer"
            >
              <FaFacebookF />
            </a>

            <a
              href="https://www.instagram.com/lanaodelsurtourism"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="hover:text-white transition cursor-pointer"
            >
              <FaInstagram />
            </a>
          </div>
        </div>

        {/* EXPLORE */}
        <div>
          <h3 className="text-white font-semibold mb-5">Explore</h3>

          <ul className="space-y-3 text-sm text-gray-400">
            {footerLinks.map((link) => (
              <li
                key={link.path}
                onClick={() => navigate(link.path)}
                className="hover:text-white transition cursor-pointer"
              >
                {link.label}
              </li>
            ))}
          </ul>
        </div>

        {/* CONTACT */}
        <div>
          <h3 className="text-white font-semibold mb-5">Contact</h3>

          <ul className="space-y-4 text-sm text-gray-400">
            <li className="flex items-center gap-3">
              <FaMapMarkerAlt />
              <span>Provincial Tourism Office, Lanao del Sur</span>
            </li>

            <li className="flex items-center gap-3">
              <FaEnvelope />
              <a
                href="mailto:tourismlds@gmail.com"
                className="hover:text-white transition"
              >
              tourismlds@gmail.com
              </a>
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