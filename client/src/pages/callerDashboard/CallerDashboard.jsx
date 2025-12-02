import React, { useState } from "react";
import SideBar from "./SideBar.jsx";
import RefferedPage from "./CallerReffered.jsx";

const DashboardContent = ({ selected }) => {
    switch (selected) {
        case "dashboard":
            return <div className="p-8"><h1 className="text-2xl font-bold mb-4">Caller Dashboard</h1><p>Welcome to your dashboard!</p></div>;
        case "referred":
            return <RefferedPage />;
        case "reports":
            return <div className="p-8"><h2 className="text-xl font-bold mb-4">Reports</h2><p>Reports will be shown here.</p></div>;
        case "settings":
            return <div className="p-8"><h2 className="text-xl font-bold mb-4">Settings</h2><p>Settings will be shown here.</p></div>;
        default:
            return <div className="p-8"><h1 className="text-2xl font-bold mb-4">Caller Dashboard</h1><p>Welcome to your dashboard!</p></div>;
    }
};

const CallerDashboard = () => {
    const [selected, setSelected] = useState("dashboard");

    // Sidebar click handler
    const handleSidebarClick = (item) => {
        setSelected(item);
    };

    return (
        <div className="flex min-h-screen bg-gray-100">
            <SideBar onSelect={handleSidebarClick} selected={selected} />
            <div className="flex-1 mt-18">
                <DashboardContent selected={selected} />
            </div>
        </div>
    );
};

export default CallerDashboard;
