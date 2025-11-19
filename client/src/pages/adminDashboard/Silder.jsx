// File: components/Slider.jsx
import React from "react";
import { MdOutlineDashboard } from "react-icons/md";

/**
 * Slider.jsx
 * Professional left-side vertical navigation with smooth transitions and enhanced UX
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
  description = ""
}) {
  const firstId = initialId ?? (items[0] && items[0].id) ?? null;
  const [activeId, setActiveId] = React.useState(firstId);
  const [isTransitioning, setIsTransitioning] = React.useState(false);

  React.useEffect(() => {
    if (onChange && activeId) onChange(activeId);
  }, [activeId, onChange]);

  const handleItemClick = (id) => {
    if (id === activeId) return;
    
    setIsTransitioning(true);
    setActiveId(id);
    
    // Reset transitioning state after animation
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const activeItem = items.find((it) => it.id === activeId) || items[0] || null;

  return (
    <div className="flex gap-6 min-h-[480px]">
      {/* Left column - vertical navigation */}
      <nav className="w-72 bg-white rounded-xl border border-gray-200 p-4 shadow-sm text-center">
        <div className="mb-6 px-2">
          <div className="flex items-center justify-center mb-2">
            
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>

          </div>
        </div>

        <ul className="space-y-2">
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
                    <div className="w-2 h-2 rounded-full bg-blue-600 ml-2" />
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
      <section className="flex-1">
        <div className={`bg-white rounded-xl border border-gray-200 p-5 shadow-sm min-h-full transition-opacity duration-300 ${
          isTransitioning ? "opacity-70" : "opacity-100"
        }`}>
          {activeItem ? (
            <div className="animate-fade-in">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    {activeItem.badge && (
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {activeItem.badge}
                      </span>
                    )}
                  </div>
                  {activeItem.subtitle && (
                    <p className="text-gray-600 max-w-2xl">{activeItem.subtitle}</p>
                  )}
                </div>
                {activeItem.actions && (
                  <div className="flex gap-2">{activeItem.actions}</div>
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
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-gray-400 text-2xl">📄</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No Content</h3>
                    <p className="text-gray-500 max-w-sm mx-auto">
                      There's no content to display for this section yet.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-gray-400 text-3xl">🔍</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Item Selected</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Please select an item from the menu to view its content.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}