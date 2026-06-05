import Hero from '../organism/Hero';
import FeatureShowcase from '../organism/FeatureShowcase';
import Footer from '../organism/Footer';

const HomePage = () => {
    return (
        // Quitamos "overflow-hidden" para que el sticky del Hero funcione
        <div className="w-full bg-[#FAF7F4]">
            <Hero />
            <FeatureShowcase />
            <Footer />
        </div>
    );
};

export default HomePage;