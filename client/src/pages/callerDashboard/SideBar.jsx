// create side bar and import caller dashboard 
import React from "react";
import { Link } from "react-router-dom";

const SideBar = ({ onSelect, selected }) => {
    const items = [
        { key: "dashboard", label: "Dashboard" },
        { key: "referred", label: "Referred Registration" },
        { key: "reports", label: "Reports" },
        { key: "settings", label: "Settings" },
    ];
    return (
        <div className="w-64 h-[890px] bg-gray-800 text-white mt-18">
            <div className="p-6">
                <h2 className="text-2xl font-semibold mb-6">Caller Dashboard</h2>
                <nav>
                    <ul>
                        {items.map((item) => (
                            <li key={item.key} className={`mb-4 cursor-pointer ${selected === item.key ? "bg-gray-700 rounded px-2" : ""}`}
                                    onClick={() => onSelect(item.key)}>
                                {item.label}
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>
        </div>
    );
};

export default SideBar;