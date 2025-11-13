import Hero from "../components/home_components/heroPage.jsx";
import HowITWork from "../components/home_components/HowItWorkPage.jsx";
import ScholarShip from "../components/home_components/scholarShipPage.jsx";
import FrequentlyAskQues from "../components/home_components/frequentlyAskedQuestions.jsx";
const Home = () => {
  return (
    <div>
<Hero />
<HowITWork />
<ScholarShip />
<FrequentlyAskQues />
      <div>
        <h1 className="z-50 fixed right-5 bottom-8 h-12 w-60 px-4 py-2 font-bold text-center text-[#125785] bg-white rounded-b-4xl rounded-tl-4xl shadow-[0_12px_30px_rgba(0,0,0,0.25)] ring-1 ring-black/5">
          Request a callback
        </h1>
      </div>
    </div>
  );
};

export default Home;
