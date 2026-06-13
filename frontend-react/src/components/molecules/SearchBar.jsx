import { Input } from "@heroui/react";
import { Search } from "lucide-react"; 
const SearchBar = () => {
    return (
        <div className="flex-1 max-w-2xl px-2 sm:px-4 w-full">
            <Input
                type="search"
                placeholder="Buscar ideas, tags, tableros..."
                radius="full"
                size="md"
                classNames={{
                    // Píldora completa, igual que los botones del header
                    inputWrapper:
                        "rounded-full bg-gray-100 hover:bg-gray-200 data-[focus=true]:bg-gray-100 transition-colors h-11 px-5 shadow-sm border border-transparent data-[focus=true]:border-gray-300",
                    input: "text-sm",
                }}
                startContent={<Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />}
            />
        </div>
    );
};

export default SearchBar;