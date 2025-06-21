import { Input } from "@/components/ui/input";

// Input or rename a file or folder in the drive view.
export function NameInput({
    placeholder,
    value,
    onChange,
    onKeyDown,
}: {
    placeholder: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) {
    return (
        <Input
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            onKeyDown={onKeyDown}
        />
    );
}