import React, { useState } from "react";

const FeaturedQuestion = () => {
  const [activeAnswerIndex, setActiveAnswerIndex] = useState(null);

  const toggleAnswer = (index) => {
    setActiveAnswerIndex(activeAnswerIndex === index ? null : index);
  };

  const questions = [
    {
      question: "Who can apply for R-SAT?",
      answer:
        "Students pursuing graduation in technical and non-technical fiedls are eligible to apply",
    },
    {
      question: "How much is the registration fee for R-SAT?",
      answer: "There is no registration fee , It is free fo cost",
    },
    {
      question: "Scholarships are awarded based on R-SAT scores?",
      answer: [
        "10% for scores above 60%",
        "25% for scores above 75%",
        "50% for scores above 85%",
        "100% for scores above 95%",
      ],
    },
    {
      question: "How do I register for R-SAT?",
      answer:
        " You can register by filling out the online application form available on this website.",
    },
    {
      question: "When will the results be announced?",
      answer:
        "Results will be announced on the offcial RICR website , and top performers will be notified directly.",
    },
    {
      question: "Can I retake the R-SAT if don't score well?",
      answer: "Yes , YOu can.",
    },
    {
      question: "Who can I contact for more details ?",
      answer: ["For any queries you can contact us at:",
      "Email : contact@ricr.in",
      "Phone : +91 8889991736",
      ],
    },
  ];

  return (
    <section>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-26">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Find quick answers to common questions about our services, policies,
            and support.
          </p>
        </div>

        <div className="space-y-4">
          {questions.map((item, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 bg-white"
            >
              <button
                className="w-full flex justify-between items-center p-6 text-left   focus:ring-opacity-50 rounded-xl"
                aria-expanded={activeAnswerIndex === index}
                aria-controls={`answer-${index}`}
              >
                <h2 className="text-md font-semibold text-gray-900 pr-4">
                  {item.question}
                </h2>
                <div
                  onClick={() => toggleAnswer(index)}
                  className="flex-shrink-0 ml-4"
                >
                  <svg
                    className={`w-6 h-6 text-blacktransition-transform duration-300 ${
                      activeAnswerIndex === index ? "transform rotate-45" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
              </button>

              <div
                id={`answer-${index}`}
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  activeAnswerIndex === index
                    ? "max-h-96 opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                <div className="px-6 pb-6">
                  <div className="border-t border-gray-100 pt-4">
                          {Array.isArray(item.answer) ? (
                            <ul className="list-disc pl-6 space-y-1">
                              {item.answer.map((a, ai) => (
                                <li key={ai} className="text-gray-700 leading-relaxed">
                                  {a}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-gray-700 leading-relaxed">{item.answer}</p>
                          )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedQuestion;
