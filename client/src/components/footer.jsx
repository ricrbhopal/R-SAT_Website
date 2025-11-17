import React from "react";
import {
    FaFacebook,
    FaInstagram,
    FaYoutube,
    FaLinkedin,
} from "react-icons/fa";
import { IoLocationOutline } from "react-icons/io5";
import { CiMail } from "react-icons/ci";
import { MdOutlineMessage } from "react-icons/md";
import RicrLogo from '../assets/footerLogo.png'

const Footer = () => {
    return (
        <div className=" bg-[#125785] text-white w-full">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
                    <div className="lg:col-span-1 pe-5">
                        <div className="flex flex-col gap-6">
                            <img
                                src={RicrLogo}
                                alt="RICR Logo"
                                className="w-36 h-auto "
                            />
                            <p className="text-gray-300/80 leading-relaxed text-base">
                                RICR is a subsidiary of Raj Digital Private Limited. It is a premier
                                coding and robotics institute, empowering students with cutting-edge
                                education and real-world skills for a tech-driven future.
                            </p>
                        </div>
                    </div>
                    <div className="lg:col-span-1">
                        <h3 className="font-bold text-xl mb-6 text-white">Quick Links</h3>
                        <ul className="space-y-2">
                            {[
                                "Courses",
                                "Host a Workshop",
                                "Community Ambassador",
                                "Work With Us",
                                "Contact Us"
                            ].map((link, index) => (
                                <li key={index}>
                                    <a
                                        href="#"
                                        className="text-gray-300/80  hover:text-white transition-colors duration-200 text-base block py-1"
                                    >
                                        {link}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="lg:col-span-1">
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-bold text-xl mb-4 text-white">Other Links</h3>
                                <ul className="space-y-4">
                                    <li>
                                        <a
                                            href="#"
                                            className="text-gray-300/80  hover:text-white transition-colors duration-200 text-base block py-1"
                                        >
                                            Edunest Facility
                                        </a>
                                    </li>
                                </ul>
                                <div className="w-32 h-px bg-gray-300/30 mt-4 mb-2"></div>
                            </div>
                            <div>
                                <h3 className="font-bold text-xl mb-4 text-white">Policies</h3>
                                <ul className="space-y-2">
                                    {[
                                        "Terms of Service",
                                        "Privacy Policy"
                                    ].map((policy, index) => (
                                        <li key={index}>
                                            <a
                                                href="#"
                                                className="text-gray-300/80  hover:text-white transition-colors duration-200 text-base block py-1"
                                            >
                                                {policy}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-1">
                        <h3 className="font-bold text-xl mb-6 text-white">Information</h3>
                        <div className="space-y-2">
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 mt-1">
                                    <IoLocationOutline className="text-2xl text-blue-300" />
                                </div>
                                <div>
                                    <p className="text-gray-300/80  leading-relaxed text-base">
                                        Minal Mall, 4th Floor, Minal Residency,<br />
                                        JK Road, Bhopal<br />
                                        Pincode: 462023
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-center">
                                <CiMail className="text-2xl text-blue-300 flex-shrink-0" />
                                <a
                                    href="mailto:contact@ricr.in"
                                    className="text-gray-300/80  hover:text-white transition-colors duration-200 text-base"
                                >
                                    contact@ricr.in
                                </a>
                            </div>

                            <div className="flex gap-4 items-center">
                                <MdOutlineMessage className="text-2xl text-blue-300 flex-shrink-0" />
                                <a
                                    href="tel:+918889991736"
                                    className="text-gray-300/80  hover:text-white transition-colors duration-200 text-base"
                                >
                                    +91 8889991736
                                </a>   
                            </div>

                            <div className="pt-4">
                                <div className="flex gap-5 text-2xl">
                                    <a
                                        href="https://www.facebook.com/ricredu"
                                        className="text-blue-300 hover:text-white transition-colors duration-200 p-2 rounded-full hover:bg-white/10"
                                    >
                                        <FaFacebook />
                                    </a>
                                    <a
                                        href="https://www.instagram.com/ricredu/"
                                        className="text-blue-300 hover:text-white transition-colors duration-200 p-2 rounded-full hover:bg-white/10"
                                    >
                                        <FaInstagram />
                                    </a>
                                    <a
                                        href="https://www.youtube.com/@ricredu"
                                        className="text-blue-300 hover:text-white transition-colors duration-200 p-2 rounded-full hover:bg-white/10"
                                    >
                                        <FaYoutube />
                                    </a>
                                    <a
                                        href="https://www.linkedin.com/company/ricredu/"
                                        className="text-blue-300 hover:text-white transition-colors duration-200 p-2 rounded-full hover:bg-white/10"
                                    >
                                        <FaLinkedin />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="border-t border-white/20  pt-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-gray-300 text-sm text-center md:text-left">
                            © 2024 - Raj Digital Private Limited | All Rights Reserved
                        </p>
                        <div className="flex items-center gap-6">
                            <a
                                href="#"
                                className="text-gray-300 hover:text-white transition-colors duration-200 text-sm">
                                Sitemap
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Footer;