import { createContext, useContext, useState } from 'react';

const BottomNavContext = createContext();

export const BottomNavProvider = ({ children }) => {
    const [isBottomNavVisible, setIsBottomNavVisible] = useState(true);

    const hideBottomNav = () => setIsBottomNavVisible(false);
    const showBottomNav = () => setIsBottomNavVisible(true);

    return (
        <BottomNavContext.Provider value={{ isBottomNavVisible, hideBottomNav, showBottomNav }}>
            {children}
        </BottomNavContext.Provider>
    );
};

export const useBottomNav = () => {
    const context = useContext(BottomNavContext);
    if (!context) {
        return { isBottomNavVisible: true, hideBottomNav: () => { }, showBottomNav: () => { } };
    }
    return context;
};
