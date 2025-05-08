export const createAuthSlice = (set, get) => ({
    userInfo: undefined,
    token: localStorage.getItem('auth_token') || null,
    setUserInfo: (userInfo) => set({ userInfo }),
    setToken: (token) => {
        if (token) {
            localStorage.setItem('auth_token', token);
        } else {
            localStorage.removeItem('auth_token');
        }
        set({ token });
    },
    logout: () => {
        localStorage.removeItem('auth_token');
        set({ userInfo: undefined, token: null });
    }
});
