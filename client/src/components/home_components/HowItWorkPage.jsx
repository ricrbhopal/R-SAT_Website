import React from 'react'
import { FiUserPlus, FiCalendar, FiFileText, FiAward } from 'react-icons/fi'

const Step = ({ Icon, title, desc }) => (
  <div className="flex flex-col items-center text-center px-4 sm:px-6">
    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border border-[#125785] flex items-center justify-center text-[#125785]">
      <Icon className="w-6 h-6 sm:w-8 sm:h-8" />
    </div>
    <h4 className="mt-4 sm:mt-6 text-base sm:text-lg font-semibold text-[#0b243a]">{title}</h4>
    <p className="mt-2 sm:mt-3 text-gray-600 text-xs sm:text-sm">{desc}</p>
  </div>
)

const HowItWorks = () => {
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0b243a]">How It Works</h2>
          <p className="mt-3 sm:mt-4 text-gray-600 text-sm sm:text-base">Follow these simple steps to secure your chance for up to 100% scholarship at RICR.</p>
        </div>

        <div className="mt-8 sm:mt-10 lg:mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10 items-start">
          <Step
            Icon={FiUserPlus}
            title="Register for R-SAT"
            desc="Fill out the online registration form below"
          />

          <Step
            Icon={FiCalendar}
            title="Examination at RICR"
            desc="Appear for the offline test at RICR on 15th Mar 2026"
          />

          <Step
            Icon={FiFileText}
            title="Result Announcement"
            desc="Scores will be announced on our website, and top performers will be notified."
          />

          <Step
            Icon={FiAward}
            title="Scholarship to Top Performers"
            desc="Eligible candidates will receive scholarships based on their scores."
          />
        </div>

        <div className="mt-8 sm:mt-10 lg:mt-12 flex justify-center">
          <a
            href="#download"
            className="inline-flex items-center gap-2 bg-[#125785] hover:bg-[#0f4668] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-md text-sm sm:text-lg font-medium shadow-md transition-colors duration-200"
          >
            <FiFileText className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Download Syllabus And Sample Paper</span>
          </a>
        </div>
      </div>
    </section>
  )
}

export default HowItWorks