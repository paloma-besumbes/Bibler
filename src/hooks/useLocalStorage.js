import { useEffect, useState } from "react";

export function useLocalStorage(key, initialValue) {
    const [state, setState] = useState(() => {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : (typeof initialValue === "function" ? initialValue() : initialValue);
        } catch {
            return typeof initialValue === "function" ? initialValue() : initialValue;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(state));
        } catch { }
    }, [key, state]);

    return [state, setState];
}
