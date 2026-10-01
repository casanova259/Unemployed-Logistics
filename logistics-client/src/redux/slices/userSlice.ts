import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UserProfile } from "@/types";

interface UserState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
}

const initialState: UserState = {
  user: null,
  isAuthenticated: false,
  isHydrated: false,
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserProfile>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isHydrated = true;
    },
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isHydrated = true;
    },
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      if (state.user) {
        state.user.isOnline = action.payload;
      }
    },
    setHydrated: (state, action: PayloadAction<boolean>) => {
      state.isHydrated = action.payload;
    },
  },
});

export const { setUser, clearUser, setOnlineStatus, setHydrated } = userSlice.actions;
export default userSlice.reducer;
