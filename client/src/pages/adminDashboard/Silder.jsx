// File: components/Slider.jsx
import React from "react";
import { FiLogOut } from "react-icons/fi";
import { AuthAPI } from "../../config/api";
import { MdOutlineDashboard, MdMenu, MdClose } from "react-icons/md";

/**
 * Slider.jsx
 * Professional responsive left-side vertical navigation with beautiful color combinations
 * Enhanced with gradient themes and modern design
 */
export default function Slider({
  items = [],
  initialId = null,
  onChange,
  title = "Admin Dashboard",
}) {
  const firstId = initialId ?? (items[0] && items[0].id) ?? null;
  const [activeId, setActiveId] = React.useState(firstId);
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);

  // Color themes for different sections
  const colorThemes = {
    home: {
      active:
        "bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 text-blue-800 ",
      icon: "bg-gradient-to-br from-blue-500 to-cyan-500 text-white",
      dot: "bg-blue-500",
    },
    users: {
      active:
        "bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200 text-emerald-800",
      icon: "bg-gradient-to-br from-emerald-500 to-green-500 text-white",
      dot: "bg-emerald-500",
    },
    referrals: {
      active:
        "bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200 text-purple-800",
      icon: "bg-gradient-to-br from-purple-500 to-violet-500 text-white",
      dot: "bg-purple-500",
    },
    "demo-classes": {
      active:
        "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 text-amber-800",
      icon: "bg-gradient-to-br from-amber-500 to-orange-500 text-white",
      dot: "bg-amber-500",
    },
    "support-manager": {
      active:
        "bg-gradient-to-r from-rose-50 to-pink-50 border-rose-200 text-rose-800",
      icon: "bg-gradient-to-br from-rose-500 to-pink-500 text-white",
      dot: "bg-rose-500",
    },
    "admit-card": {
      active:
        "bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200 text-indigo-800",
      icon: "bg-gradient-to-br from-indigo-500 to-blue-500 text-white",
      dot: "bg-indigo-500",
    },
    results: {
      active:
        "bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200 text-teal-800",
      icon: "bg-gradient-to-br from-teal-500 to-cyan-500 text-white",
      dot: "bg-teal-500",
    },
    default: {
      active:
        "bg-gradient-to-r from-gray-50 to-blue-50 border-gray-200 text-gray-800",
      icon: "bg-gradient-to-br from-gray-500 to-blue-400 text-white",
      dot: "bg-gray-500",
    },
  };

  // Check screen size on mount and resize
  React.useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMobileMenuOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  React.useEffect(() => {
    if (onChange && activeId) onChange(activeId);
  }, [activeId, onChange]);

  const handleItemClick = (id) => {
    if (id === activeId) return;

    setIsTransitioning(true);
    setActiveId(id);

    if (isMobile) {
      setIsMobileMenuOpen(false);
    }

    setTimeout(() => setIsTransitioning(false), 300);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const getTheme = (itemId) => {
    return colorThemes[itemId] || colorThemes.default;
  };

  const activeItem = items.find((it) => it.id === activeId) || items[0] || null;
  const activeTheme = activeItem
    ? getTheme(activeItem.id)
    : colorThemes.default;

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-6 min-h-[480px] w-full">
      {/* Mobile Header */}
      <div className="md:hidden bg-gradient-to-r from-white to-gray-50 rounded-2xl border border-gray-200/60 shadow-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleMobileMenu}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 transition-all duration-200 shadow-sm"
            >
              {isMobileMenuOpen ? (
                <MdClose className="text-gray-700 text-xl" />
              ) : (
                <MdMenu className="text-gray-700 text-xl" />
              )}
            </button>
            <div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                {title}
              </h3>
            </div>
          </div>

          {!isMobileMenuOpen && activeItem && (
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${activeTheme.dot} animate-pulse`}
              ></div>
              <div className="text-sm font-semibold text-gray-700 truncate max-w-[120px]">
                {activeItem.title}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Left column - vertical navigation */}
      <nav
        className={`
        bg-gradient-to-b from-gray-200 to-gray-50/80 rounded-2xl border border-gray-200/60 p-4 md:p-5 shadow-xl backdrop-blur-sm
        ${
          isMobile
            ? `
          fixed top-0 left-0 h-full w-[280px] max-w-[85vw] z-50 transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
        `
            : `
          w-full md:w-64 lg:w-72 xl:w-80 flex-shrink-0
        `
        }
      `}
      >
        {/* Mobile menu header */}
        {isMobile && (
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200/60">
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {title}
              </h3>
              <p className="text-sm text-gray-500 font-medium">
                Navigation Menu
              </p>
            </div>
            <button
              onClick={toggleMobileMenu}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 transition-all duration-200"
            >
              <MdClose className="text-gray-700 text-lg" />
            </button>
          </div>
        )}

        {/* Desktop header */}
        {!isMobile && (
          <div className="mb-6 px-2">
            <div className="text-center mb-2">
              <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {title}
              </h3>
            </div>
            <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
          </div>
        )}

        <ul className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
          {items.map((it) => {
            const active = it.id === activeId;
            const theme = getTheme(it.id);

            return (
              <li key={it.id}>
                <button
                  onClick={() => handleItemClick(it.id)}
                  className={`w-full text-left flex items-center gap-3 px-3 md:px-4 py-3 rounded-xl cursor-pointer transition-all duration-300 group border ${
                    active
                      ? `${theme.active} shadow-md transform scale-105`
                      : "hover:bg-white text-gray-600 hover:text-gray-900 border-transparent hover:border-gray-200 hover:shadow-sm"
                  }`}
                >
                  <span
                    className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-xl transition-all duration-300 shadow-sm flex-shrink-0 ${
                      active
                        ? `${theme.icon} shadow-lg transform scale-110`
                        : "bg-gradient-to-br from-gray-100 to-gray-200 text-gray-500 group-hover:from-gray-200 group-hover:to-gray-300 group-hover:shadow-md"
                    }`}
                  >
                    {it.icon || (
                      <span className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-current opacity-70" />
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div
                      className={`font-semibold text-sm truncate ${
                        active ? "font-bold" : "group-hover:font-semibold"
                      }`}
                    >
                      {it.title}
                    </div>
                    {it.subtitle && (
                      <div
                        className={`text-xs truncate mt-0.5 ${
                          active ? "text-current opacity-90" : "text-gray-500"
                        }`}
                      >
                        {it.subtitle}
                      </div>
                    )}
                  </div>
                  {active && (
                    <div
                      className={`w-2 h-2 rounded-full ${theme.dot} ml-2 flex-shrink-0 animate-pulse`}
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {/* Logout Button */}
        <button
          className="w-full flex items-center gap-3 px-3 md:px-4 py-3 mt-6 rounded-xl cursor-pointer transition-all duration-300 border border-red-100 bg-gradient-to-r from-red-50 to-white text-red-600 font-semibold hover:bg-red-100 hover:text-red-700 shadow-sm"
          onClick={async () => {
            try {
              await AuthAPI.logout();
              sessionStorage.removeItem("token");
              window.location.href = "/";
            } catch (err) {
              alert("Logout failed. Please try again.");
            }
          }}
        >
          <FiLogOut className="text-lg md:text-xl" />
          <span className="text-sm md:text-base">Logout</span>
        </button>

        {items.length === 0 && (
          <div className="text-center py-6 md:py-8">
            <div className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-gray-400 text-lg md:text-2xl">📝</span>
            </div>
            <p className="text-gray-500 text-xs md:text-sm font-medium">
              No menu items available
            </p>
          </div>
        )}
      </nav>

      {/* Right column - content area */}
      <section className="flex-1 min-w-0 w-full">
        <div
          className={`bg-gradient-to-br from-white to-gray-50/50 rounded-2xl border border-gray-200/60 p-4 md:p-6 lg:p-8 shadow-xl min-h-[400px] transition-all duration-300 backdrop-blur-sm w-full ${
            isTransitioning ? "opacity-70 scale-95" : "opacity-100 scale-100"
          }`}
        >
          {activeItem ? (
            <div className="animate-fade-in w-full">
              <div className="mb-4 md:mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 w-full">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    {activeItem.badge && (
                      <span
                        className={`px-2 md:px-3 py-1 text-xs font-bold ${activeTheme.icon} rounded-full text-white shadow-lg`}
                      >
                        {activeItem.badge}
                      </span>
                    )}
                    <h1 className="text-xl md:text-2xl font-bold text-gray-800 truncate">
                      {activeItem.title}
                    </h1>
                  </div>
                  {activeItem.subtitle && (
                    <p className="text-gray-600 text-sm md:text-base max-w-2xl font-medium">
                      {activeItem.subtitle}
                    </p>
                  )}
                </div>
                {activeItem.actions && (
                  <div className="flex gap-2 flex-wrap justify-start sm:justify-end">
                    {activeItem.actions}
                  </div>
                )}
              </div>

              <div className="prose max-w-none w-full">
                {activeItem.node ? (
                  <div
                    className={`transition-all duration-300 w-full ${
                      isTransitioning ? "opacity-0" : "opacity-100"
                    }`}
                  >
                    {activeItem.node}
                  </div>
                ) : (
                  <div className="text-center py-8 md:py-12 w-full">
                    <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center shadow-lg">
                      <span className="text-gray-400 text-xl md:text-2xl">
                        📄
                      </span>
                    </div>
                    <h3 className="text-base md:text-lg font-semibold text-gray-700 mb-2">
                      No Content Available
                    </h3>
                    <p className="text-gray-500 text-sm max-w-sm mx-auto font-medium">
                      Content for this section will be available soon.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 md:py-16 w-full">
              <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-3 md:mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-gray-400 text-2xl md:text-3xl">🔍</span>
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-gray-700 mb-2">
                No Item Selected
              </h3>
              <p className="text-gray-500 text-sm md:text-base max-w-md mx-auto font-medium">
                Select an item from the navigation menu to view its content.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}