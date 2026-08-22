import { useCallback, useEffect, useMemo, useState } from "react";
import API from "../../api/axiosConfig";
import { AuthContext } from "./authStore";

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(Boolean(localStorage.getItem("cps_token")));

    const logout = useCallback(() => {
        localStorage.removeItem("cps_token");
        setUser(null);
    }, []);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const { data } = await API.get("/auth/me");
                setUser(data.user);
            } catch {
                logout();
            } finally {
                setLoading(false);
            }
        };
        if (localStorage.getItem("cps_token")) loadUser();
        const handleUnauthorized = () => logout();
        window.addEventListener("cps:unauthorized", handleUnauthorized);
        return () => window.removeEventListener("cps:unauthorized", handleUnauthorized);
    }, [logout]);

    const authenticate = async (path, values) => {
        const { data } = await API.post(path, values);
        localStorage.setItem("cps_token", data.token);
        setUser(data.user);
        return data;
    };

    const value = useMemo(() => ({
        user, loading, login: (values) => authenticate("/auth/login", values),
        register: (values) => authenticate("/auth/register", values), logout,
        refreshUser: async () => {
            const { data } = await API.get("/auth/me");
            setUser(data.user);
        }
    }), [user, loading, logout]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
