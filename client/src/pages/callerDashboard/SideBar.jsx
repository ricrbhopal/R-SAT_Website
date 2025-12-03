// client/src/components/SideBar.jsx
import React from "react";
import { 
    Home, 
    Users, 
    BarChart3, 
    Settings,
    ChevronRight,
    LogOut,
    UserCircle
} from "lucide-react";

const SideBar = ({ onSelect, selected }) => {
    const menuItems = [
        { id: "dashboard", label: "Dashboard", icon: Home },
        { id: "reports", label: "Reports", icon: BarChart3 },
        { id: "settings", label: "Settings", icon: Settings }
    ];

    const handleLogout = () => {
        // Add logout logic here
        console.log("Logging out...");
    };

    // Replace "Caller Dashboard" with the logged-in user's name
    const userRaw = sessionStorage.getItem("user");
    let userName = "Caller Dashboard";
    if (userRaw) {
      try {
        const user = JSON.parse(userRaw);
        userName = user.fullName || user.username || "Caller Dashboard";
      } catch (e) {
        console.error("Failed to parse user data from sessionStorage.", e);
      }
    }

    return (
        <div className="w-64 min-h-screen  bg-gray-900/80 backdrop-blur-sm border-r border-gray-800 flex flex-col mt-18">


            {/* User Profile */}
            <div className="p-6 border-b border-gray-800">
                <div className="flex items-center gap-3">
                    <div className="bg-linear-to-r from-cyan-500/20 to-blue-500/10 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
                        <UserCircle className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-gray-100">{userName}</h3>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                </div>
            </div>

            {/* Navigation Menu */}
            <div className="flex-1 p-6">
                <nav className="space-y-1">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isSelected = selected === item.id;
                        
                        return (
                            <button
                                key={item.id}
                                onClick={() => onSelect(item.id)}
                                className={`w-full flex items-center gap-5 px-4 py-3 rounded-xl transition-all duration-300   ${
                                    isSelected 
                                        ? "bg-linear-to-r from-cyan-500/20 to-blue-500/10 text-cyan-400 border border-cyan-500/30" 
                                        : "text-gray-400 hover:text-gray-300 hover:bg-gray-800/50"
                                }`}
                            >
                                <Icon className={`w-5 h-5 ${isSelected ? "text-cyan-400" : ""}`} />
                                <span className="font-medium">{item.label}</span>
                                {isSelected && (
                                    <ChevronRight className="w-4 h-4 ml-auto text-cyan-400" />
                                )}
                            </button>

                            
                        );
                    })}
                </nav>
                            {/* Logout Button */}
            <div className="p-6 border-t border-gray-800">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 border border-gray-800 hover:border-rose-500/30 transition-all duration-300"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Logout</span>
                </button>
                
      
            </div>
            </div>


        </div>
    );
};

export default SideBar;