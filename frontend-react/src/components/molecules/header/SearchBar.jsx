import { Input } from "@heroui/react";
import { Search } from "lucide-react"; 
const SearchBar = () => {
    return (
        <div className="flex-1 max-w-2xl px-4 hidden md:block">
            <Input 
                type="search" 
                placeholder="Buscar ideas, tags, tableros..." 
                radius="full"
                size="md"
                className="bg-gray-100 hover:bg-gray-200 transition-colors rounded-full"
                startContent={<Search className="w-4 h-4 text-gray-400 mr-2" />}
            />
        </div>
    );
};

export default SearchBar;