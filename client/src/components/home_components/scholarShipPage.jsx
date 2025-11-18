import React from 'react'
import Image from '../../assets/ScholarShip.png'
import { FiCheck } from 'react-icons/fi'

const ScholarshipPage = () => {
	return (
        <>
		<section className="py-12 sm:py-16 lg:py-20 bg-white">
			<div className="container mx-auto px-4 sm:px-6 lg:px-8">
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 items-center">

					{/* Left - decorative image */}
					<div className="relative flex justify-center lg:justify-start order-2 lg:order-1">
						<div className="relative z-10">
							<img 
								src={Image} 
								alt="student" 
								className="w-48 sm:w-64 md:w-80 lg:w-[28rem] object-contain mx-auto lg:mx-0" 
							/>
						</div>
					</div>

					{/* Right - content */}
					<div className="order-1 lg:order-2">
						<h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-extrabold text-[#0b243a]">Scholarship Slabs</h2>
						<p className="mt-4 sm:mt-6 text-gray-600 text-base sm:text-lg">Based on your R-SAT score, you can unlock scholarships ranging from 25% to 100%</p>

						<ul className="mt-6 sm:mt-8 space-y-4 sm:space-y-6">
							<li className="flex items-start gap-3 sm:gap-4">
								<span className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 text-[#1e6f9e] rounded-full border border-[#9fd1ee]">
									<FiCheck className="w-4 h-4 sm:w-5 sm:h-5" />
								</span>
								<span className="text-base sm:text-lg text-[#0b243a] mt-0.5 sm:mt-0">100% scholarship for 95%+ scores</span>
							</li>

							<li className="flex items-start gap-3 sm:gap-4">
								<span className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 text-[#1e6f9e] rounded-full border border-[#9fd1ee]">
									<FiCheck className="w-4 h-4 sm:w-5 sm:h-5" />
								</span>
								<span className="text-base sm:text-lg text-[#0b243a] mt-0.5 sm:mt-0">50% scholarship for 85%+ scores</span>
							</li>

							<li className="flex items-start gap-3 sm:gap-4">
								<span className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 text-[#1e6f9e] rounded-full border border-[#9fd1ee]">
									<FiCheck className="w-4 h-4 sm:w-5 sm:h-5" />
								</span>
								<span className="text-base sm:text-lg text-[#0b243a] mt-0.5 sm:mt-0">25% scholarship for 75%+ scores</span>
							</li>

							<li className="flex items-start gap-3 sm:gap-4">
								<span className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 text-[#1e6f9e] rounded-full border border-[#9fd1ee]">
									<FiCheck className="w-4 h-4 sm:w-5 sm:h-5" />
								</span>
								<span className="text-base sm:text-lg text-[#0b243a] mt-0.5 sm:mt-0">10% scholarship for 60%+ scores</span>
							</li>
						</ul>

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
				</div>
			</div>

		{/* Floating callback button */}
			<button 	className="fixed right-4 sm:right-6 bottom-4 sm:bottom-6 bg-white py-2 px-4 sm:py-3 sm:px-5 rounded-full shadow-lg border border-gray-100 text-[#0b243a] font-semibold text-sm sm:text-base z-50">
				Request a Callback
			</button>
		</section>

		{/* Centered registration closed banner */}
		{/* <div className="flex justify-center px-4 sm:px-6">
			<div className="py-6 sm:py-8 lg:py-10 text-xl sm:text-2xl lg:text-3xl xl:text-[35px] font-bold bg-[#EAF8FF] px-4 sm:px-6 rounded-lg text-center w-full max-w-2xl lg:max-w-3xl mx-4">
				Registrations has been closed
			</div>
		</div> */}
        </>
	)
}

export default ScholarshipPage