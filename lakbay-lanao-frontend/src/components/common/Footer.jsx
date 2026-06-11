import { useNavigate } from "react-router-dom";
import {
  FaFacebookF,
  FaInstagram,
  FaMapMarkerAlt,
  FaEnvelope,
} from "react-icons/fa";

// BALIDONG IMPORTS: Eksaktong relative path mula sa components/common/ patungo sa assets/
import barmmLogo from "../../assets/barmm.png";
import dictLogo from "../../assets/dict.png";
import dotLogo from "../../assets/dot.png";

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

  const agencyPartners = [
    {
      img: barmmLogo, 
      alt: "BARMM Official Website",
      url: "https://bangsamoro.gov.ph/",
    },
    {
      img: dictLogo,
      alt: "DICT Official Website",
      url: "https://dict.gov.ph/",
    },
    {
      img: dotLogo,
      alt: "DOT Official Website",
      url: "https://beta.tourism.gov.ph/",
    },
  ];

  const handleNavigate = (path) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative bg-[#030712] text-gray-300 w-full">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-3 lg:px-8">
        {/* BRAND & SOCIALS */}
        <div>
          <h2
            onClick={() => handleNavigate("/")}
            className="inline-block cursor-pointer text-2xl font-bold tracking-tight text-white transition hover:text-blue-300"
          >
            Lakbay Lanao
          </h2>

          <p className="mt-5 max-w-sm text-sm leading-7 text-gray-400">
            A digital tourism guide for exploring destinations, establishments,
            cultural heritage sites, and travel experiences in Lanao del Sur.
          </p>

          <div className="mt-7 flex items-center gap-3">
            <a
              href="https://www.facebook.com/arawnglanao"
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-300 transition hover:border-blue-400 hover:bg-blue-500 hover:text-white"
            >
              <FaFacebookF />
            </a>

            <a
              href="https://www.instagram.com/lanaodelsurtourism"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-300 transition hover:border-blue-400 hover:bg-blue-500 hover:text-white"
            >
              <FaInstagram />
            </a>
          </div>
        </div>

        {/* EXPLORE */}
        <div>
          <h3 className="text-lg font-semibold text-white">Explore</h3>

          <ul className="mt-5 space-y-3 text-sm text-gray-400">
            {footerLinks.map((link) => (
              <li key={link.path}>
                <button
                  type="button"
                  onClick={() => handleNavigate(link.path)}
                  className="text-left transition hover:translate-x-1 hover:text-white"
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* CONTACT & PARTNERS */}
        <div>
          <h3 className="text-lg font-semibold text-white">Contact</h3>

          <ul className="mt-5 space-y-4 text-sm text-gray-400">
            <li className="flex items-start gap-3">
              <FaMapMarkerAlt className="mt-1 shrink-0 text-gray-500" />
              <span>Provincial Tourism Office, Lanao del Sur</span>
            </li>

            <li className="flex items-start gap-3">
              <FaEnvelope className="mt-1 shrink-0 text-gray-500" />
              <a
                href="mailto:tourismlds@gmail.com"
                className="transition hover:text-white"
              >
                tourismlds@gmail.com
              </a>
            </li>
          </ul>

          <p className="mt-7 max-w-sm text-sm leading-6 text-gray-500">
            Department of Tourism · BARMM · DICT
          </p>

          {/* LOGOS UNDER CONTACT */}
          <div className="mt-6 border-t border-white/5 pt-5">
            {/* FIXED: Gumamit ng fragments at flex arrangement para sa pipe separator `|` */}
            <div className="flex items-center gap-4 w-fit">
              {agencyPartners.map((agency, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <a
                    href={agency.url}
                    target="_blank"
                    rel="noreferrer"
                    className="transition duration-300 hover:scale-105"
                  >
                    <img
                      src={agency.img}
                      alt={agency.alt}
                      className="h-10 w-auto object-contain brightness-110"
                    />
                  </a>
                  {/* Naglagay ng vertical divider element, maliban sa pinakahuling logo */}
                  {idx < agencyPartners.length - 1 && (
                    <span className="text-gray-700 font-light select-none">|</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-6 py-6 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Lakbay Lanao. All Rights Reserved.
      </div>
    </footer>
  );
}

export default Footer;