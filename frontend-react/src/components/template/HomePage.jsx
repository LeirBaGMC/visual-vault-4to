import Hero from '../organism/Hero';
import FeatureShowcase from '../organism/FeatureShowcase';

const HomePage = () => {
    return (
        // Quitamos "overflow-hidden" para que el sticky del Hero funcione
        <div className="w-full bg-[#FAF7F4]">
            <Hero />
            <FeatureShowcase />
        </div>
    );
};

export default HomePage;