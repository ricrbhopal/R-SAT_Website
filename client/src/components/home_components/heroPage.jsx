import React from 'react'
import Logo from '../../assets/HeroSectionImage.png'
import HackathonTimer from './HackathonTimer'

const RSATScholarship = () => {
  return (
    <section className="bg-white mt-6 md:mt-10 py-6 md:py-8 ">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-8 lg:gap-12">
          {/* Left column - text */}
          <div className="max-w-xl order-2 md:order-1">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#0b243a] leading-tight">
              R-SAT 2026
            </h1>

            {/* Countdown timer added to left column */}
            <div className="mt-4 sm:mt-6">
              <HackathonTimer toDate={'2026-03-15T00:00:00+05:30'} />
            </div>

            <p className="mt-4 sm:mt-6 text-gray-600 text-base sm:text-lg leading-relaxed">
              Secure up to 100% scholarship for your course by excelling in the RICR Scholarship Admission Test.
            </p>

            <p className="mt-4 sm:mt-6 font-semibold text-base sm:text-lg text-gray-800">
              Results are announced, Book your Demo
            </p>

            <div className="mt-6 sm:mt-8 space-y-3 sm:space-y-4">
              <p className="text-gray-600 text-sm sm:text-base">
                Results are Announced, Book your Demo
              </p>
              <p className="text-gray-600 text-sm sm:text-base">
                Last date to Book Demo: 1st Apr 2025, 11:59 PM
              </p>
            </div>

            <div className="mt-6 sm:mt-8">
              <a
                href="#results"
                className="inline-flex items-center justify-center gap-2 sm:gap-3 bg-[#125785] hover:bg-[#0f4668] text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg shadow-md text-base sm:text-lg font-medium transition-colors duration-200 w-full sm:w-auto"
              >
                <span>Check Your Result</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10.293 15.707a1 1 0 010-1.414L13.586 11H4a1 1 0 110-2h9.586l-3.293-3.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>

          {/* Right column - image */}
          <div className="order-1 md:order-2 flex justify-center md:justify-end">
            <img 
              src={Logo} 
              alt="R-SAT Logo" 
              className="w-full max-w-[280px] sm:max-w-[400px] md:max-w-[500px] lg:max-w-[600px] h-auto aspect-square object-contain" 
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export default RSATScholarship