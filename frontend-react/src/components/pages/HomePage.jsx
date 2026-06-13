import Hero from '../organisms/Hero';
import FeatureShowcase from '../organisms/FeatureShowcase';
import Footer from '../organisms/Footer';

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