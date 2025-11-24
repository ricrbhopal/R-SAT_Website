// File: components/Slider.jsx
import React from "react";
import { MdOutlineDashboard, MdMenu, MdClose } from "react-icons/md";

/**
 * Slider.jsx
 * Professional responsive left-side vertical navigation with smooth transitions and enhanced UX
 * Props:
 *  - items: Array of { id, title, icon?, subtitle?, node, actions? }
 *  - initialId: optional id to set as initial active
 *  - onChange: optional callback(activeId)
 *  - title: optional header title
 *  - description: optional header description
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
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  React.useEffect(() => {
    if (onChange && activeId) onChange(activeId);
  }, [activeId, onChange]);

  const handleItemClick = (id) => {
    if (id === activeId) return;
    
    setIsTransitioning(true);
    setActiveId(id);
    
    // Close mobile menu when item is selected on mobile
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
    
    // Reset transitioning state after animation
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const activeItem = items.find((it) => it.id === activeId) || items[0] || null;

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-6 min-h-[480px]">
      {/* Mobile Header */}
      <div className="md:hidden bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleMobileMenu}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              {isMobileMenuOpen ? (
                <MdClose className="text-gray-600 text-xl" />
              ) : (
                <MdMenu className="text-gray-600 text-xl" />
              )}
            </button>
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          </div>
          
          {/* Show active item title on mobile when menu is closed */}
          {!isMobileMenuOpen && activeItem && (
            <div className="text-sm font-medium text-gray-700 truncate max-w-[120px]">
              {activeItem.title}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Left column - vertical navigation */}
      <nav className={`
        bg-white rounded-xl border border-gray-200 p-4 shadow-sm
        ${isMobile ? `
          fixed top-0 left-0 h-full w-80 z-50 transform transition-transform duration-300
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        ` : `
          w-full md:w-72
        `}
      `}>
        {/* Mobile menu header */}
        {isMobile && (
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            <button
              onClick={toggleMobileMenu}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <MdClose className="text-gray-600 text-lg" />
            </button>
          </div>
        )}

        {/* Desktop header */}
        {!isMobile && (
          <div className="mb-6 px-2">
            <div className="flex items-center justify-center mb-2">
              <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            </div>
          </div>
        )}

        <ul className="space-y-2 max-h-[calc(100vh-200px)] md:max-h-none overflow-y-auto">
          {items.map((it) => {
            const active = it.id === activeId;
            return (
              <li key={it.id}>
                <button
                  onClick={() => handleItemClick(it.id)}
                  className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 group ${
                    active
                      ? "bg-blue-50 border border-blue-200 text-blue-700 shadow-sm"
                      : "hover:bg-gray-50 text-gray-700 hover:text-gray-900 border border-transparent"
                  }`}
                >
                  <span className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
                    active 
                      ? "bg-blue-100 text-blue-600" 
                      : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                  }`}>
                    {it.icon || <span className="w-5 h-5 rounded-full bg-current opacity-70" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{it.title}</div>
                    {it.subtitle && (
                      <div className={`text-xs truncate mt-0.5 ${
                        active ? "text-blue-600/80" : "text-gray-500"
                      }`}>
                        {it.subtitle}
                      </div>
                    )}
                  </div>
                  {active && (
                    <div className="w-2 h-2 rounded-full bg-blue-600 ml-2 flex-shrink-0" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
        
        {items.length === 0 && (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-gray-400 text-2xl">📝</span>
            </div>
            <p className="text-gray-500 text-sm">No menu items available</p>
          </div>
        )}
      </nav>

      {/* Right column - content area */}
      <section className="flex-1 min-w-0">
        <div className={`bg-white rounded-xl border border-gray-200 p-4 md:p-5 shadow-sm min-h-full transition-opacity duration-300 ${
          isTransitioning ? "opacity-70" : "opacity-100"
        }`}>
          {activeItem ? (
            <div className="animate-fade-in">
              <div className="mb-4 md:mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-lg md:text-xl font-bold text-gray-900 truncate">
                      {activeItem.title}
                    </h2>
                    {activeItem.badge && (
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full flex-shrink-0">
                        {activeItem.badge}
                      </span>
                    )}
                  </div>
                  {activeItem.subtitle && (
                    <p className="text-gray-600 text-sm md:text-base max-w-2xl">
                      {activeItem.subtitle}
                    </p>
                  )}
                </div>
                {activeItem.actions && (
                  <div className="flex gap-2 flex-wrap">{activeItem.actions}</div>
                )}
              </div>

              <div className="prose max-w-none">
                {activeItem.node ? (
                  <div className={`transition-all duration-300 ${
                    isTransitioning ? "opacity-0" : "opacity-100"
                  }`}>
                    {activeItem.node}
                  </div>
                ) : (
                  <div className="text-center py-8 md:py-12">
                    <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-gray-400 text-xl md:text-2xl">📄</span>
                    </div>
                    <h3 className="text-base md:text-lg font-semibold text-gray-700 mb-2">No Content</h3>
                    <p className="text-gray-500 text-sm max-w-sm mx-auto">
                      There's no content to display for this section yet.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 md:py-16">
              <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-3 md:mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-gray-400 text-2xl md:text-3xl">🔍</span>
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-gray-700 mb-2">No Item Selected</h3>
              <p className="text-gray-500 text-sm md:text-base max-w-md mx-auto">
                Please select an item from the menu to view its content.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}