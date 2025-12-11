import React, { useState } from "react";
import SideBar from "./SideBar.jsx";
import RefferedPage from "./CallerReffered.jsx";
import Report from "./CallerReport.jsx";

const DashboardContent = ({ selected }) => {
    switch (selected) {
        case "dashboard":
            return <RefferedPage />;
        case "referred":
            return <RefferedPage />;
        case "reports":
            return <Report />;
        case "settings":
            return (
                <div className="p-8">
                    <h2 className="text-2xl font-bold mb-6 text-gray-100">Settings</h2>
                    <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
                        <p className="text-gray-400">Settings configuration will be available here.</p>
                    </div>
                </div>
            );
        default:
            return <RefferedPage />;
    }
};

const CallerDashboard = () => {
    const [selected, setSelected] = useState("dashboard");

    // Sidebar click handler
    const handleSidebarClick = (item) => {
        setSelected(item);
    };

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 ">
            <SideBar onSelect={handleSidebarClick} selected={selected} />
            <div className="flex-1 overflow-auto">
                {/* Main content area with subtle decorative elements */}
                <div className="relative">
                    {/* Background decorative elements */}
                    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl"></div>
                        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl"></div>
                        <div className="absolute -bottom-40 right-1/4 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl"></div>
                    </div>
                    
                    {/* Content wrapper */}
                    <div className="relative z-10">
                        {/* Dashboard Header (only shows on non-default pages) */}
                        {selected === "settings" && (
                            <div className="border-b border-gray-800/50 bg-gray-900/30 backdrop-blur-sm">
                                <div className="max-w-7xl mx-auto px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                                                {selected.charAt(0).toUpperCase() + selected.slice(1)}
                                            </h1>
                                            <p className="text-sm text-gray-400 mt-1">
                                                {selected === "dashboard" && "Overview of your performance and referrals"}
                                                {selected === "referred" && "Manage and track your referrals"}
                                                {selected === "reports" && "Detailed analytics and reports"}
                                                {selected === "settings" && "Configure your preferences and account"}
                                            </p>
                                        </div>
                                        
                                        {/* Quick stats bar for dashboard */}
                                        {selected === "dashboard" && (
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <div className="text-xs text-gray-400">Today's Activity</div>
                                                    <div className="text-lg font-semibold text-white">Active</div>
                                                </div>
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Main Content */}
                        <div className="min-h-[calc(100vh-4rem)] mt-18">
                            <DashboardContent selected={selected} />
                        </div>
                        
            
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CallerDashboard;