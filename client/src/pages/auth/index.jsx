import Background from "@/assets/login2.png";
import Victory from "@/assets/victory.svg";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { LOGIN_ROUTE, SIGNUP_ROUTE } from "@/utils/constants";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store";

const Auth = () => {
  const navigate = useNavigate();
  const { setUserInfo, setToken } = useAppStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const validateLogin = () => {
    if (!email.length) {
      toast.error("Email is required.");
      return false;
    }
    if (!password.length) {
      toast.error("Password is required.");
      return false;
    }
    return true;
  };

  const validateSignup = () => {
    if (!email.length) {
      toast.error("Email is required.");
      return false;
    }
    if (!password.length) {
      toast.error("Password is required.");
      return false;
    }
    if (password !== confirmPassword) {
      toast.error("Password and confirm password should be same.");
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (validateLogin()) {
      try {
        console.log("Attempting login...");
        const response = await apiClient.post(
          LOGIN_ROUTE,
          { email, password },
          {
            withCredentials: true,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        console.log("Login response:", response);

        if (response.data.user?.id) {
          if (response.data.token) {
            setToken(response.data.token);
          }

          setUserInfo(response.data.user);

          if (response.data.user.profileSetup) {
            navigate("/chat");
          } else {
            navigate("/profile");
          }
        }
      } catch (error) {
        console.error("Login error:", error);
        if (error.message && error.message.includes("Network Error")) {
          // Removed network error toast
        } else {
          // Removed invalid credentials toastso onec
        }
      }
    }
  };

  const handleSignup = async () => {
    if (validateSignup()) {
      const response = await apiClient.post(
        SIGNUP_ROUTE,
        { email, password },
        { withCredentials: true }
      );
      if (response.status === 201) {
        navigate("/profile");
      }
      // console.log({ response });
    }
  };

  return (
    <div className="h-[100vh] w-[100vw] flex items-center justify-center">
      <div className="h-[80vh] bg-white border-2 border-white text-opacity-90 shadow-2xl w-[80vw] md:w-[90vw] lg:w-[70vw] xl:w-[60vw] rounded-3xl grid xl:grid-cols-2">
        <div className="flex flex-col gap-10 items-center justify-center">
          <div className="flex items-center justify-center flex-col">
            <div className="flex items-center justify-center">
              <h1 className="text-5xl font-bold md:text-6xl">Welcome</h1>
              <img src={Victory} alt="Victory Emoji" className="h-[100px]" />
            </div>
            <p className="font-medium text-center">
              Fill in the details to get started with the chat app!
            </p>
          </div>
          <div className="flex items-center justify-center w-full">
            <Tabs className="w-3/4" defaultValue="login">
              <TabsList className="bg-transparent rounded-none w-full">
                <TabsTrigger
                  value="login"
                  className="data-[state=active]:bg-transparent text-black text-opacity-90 border-b-2 rounded-none w-full data-[state=active]:text-black data-[state=active]:font-semibold data-[state=active]:border-b-purple-500 p-3 transition-all duration-300"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="data-[state=active]:bg-transparent text-black text-opacity-90 border-b-2 rounded-none w-full data-[state=active]:text-black data-[state=active]:font-semibold data-[state=active]:border-b-purple-500 p-3 transition-all duration-300"
                >
                  Signup
                </TabsTrigger>
              </TabsList>
              <TabsContent className="flex flex-col gap-5 mt-10" value="login">
                <form
                  className="flex flex-col gap-5 items-center w-full"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleLogin();
                  }}
                >
                  <Input
                    placeholder="Email"
                    type="email"
                    className="rounded-full p-6 w-full"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Input
                    placeholder="Password"
                    type="password"
                    className="rounded-full p-6 w-full"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Button className="rounded-full p-6 w-full">Login</Button>
                </form>
              </TabsContent>
              <TabsContent className="flex flex-col gap-5" value="signup">
                <form
                  className="flex flex-col gap-5 items-center w-full"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSignup();
                  }}
                >
                  <Input
                    placeholder="Email"
                    type="email"
                    className="rounded-full p-6 w-full"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Input
                    placeholder="Password"
                    type="password"
                    className="rounded-full p-6 w-full"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Input
                    placeholder="Confirm Password"
                    type="password"
                    className="rounded-full p-6 w-full"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <Button className="rounded-full p-6 w-full">Signup</Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        <div className="hidden xl:flex justify-center items-center">
          <img src={Background} alt="Background login" className="h-[90%]" />
        </div>
      </div>
    </div>
  );
};

export default Auth;
